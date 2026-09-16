/**
 * Bộ kiểm chứng RLS.
 *
 * Chạy `supabase/migrations/*.sql` trên một Postgres thật (PGlite, bản WASM)
 * rồi đóng vai từng loại người dùng để kiểm tra chính sách phân quyền.
 *
 * Vì sao phải làm thế này: RLS là lớp bảo vệ DUY NHẤT ngăn phụ huynh này xem
 * dữ liệu con nhà khác. Đọc SQL bằng mắt không đủ để tin - phải chạy thử.
 *
 * Phần `auth` của Supabase được dựng lại tối giản ở đây: một bảng `auth.users`
 * và hàm `auth.uid()` đọc từ biến phiên, đủ để chính sách hoạt động như thật.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Dựng lại phần tối giản của Supabase Auth mà migration phụ thuộc vào. */
const AUTH_STUB = `
  create schema if not exists auth;

  create table if not exists auth.users (
    id                  uuid primary key default gen_random_uuid(),
    email               text,
    raw_user_meta_data  jsonb not null default '{}'::jsonb
  );

  -- Supabase lấy uid từ JWT; ở đây lấy từ biến phiên để test đổi vai được.
  create or replace function auth.uid() returns uuid
  language sql stable as $fn$
    select nullif(current_setting('test.uid', true), '')::uuid
  $fn$;

  -- Hai vai trò Supabase cấp cho client.
  do $do$
  begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
  end $do$;

  grant usage on schema public, auth to anon, authenticated;
`

/**
 * Supabase cấu hình sẵn quyền mặc định để MỌI bảng tạo sau đó tự động được cấp
 * quyền cho anon/authenticated. Phải dựng lại điều này TRƯỚC khi chạy migration,
 * nếu không lệnh `revoke` trong migration sẽ không có tác dụng gì.
 */
const DEFAULT_PRIVILEGES = `
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`

export interface Harness {
  db: PGlite
  /** Đóng vai một người dùng đã đăng nhập (vai trò `authenticated`). */
  as(userId: string): Promise<void>
  /** Trở lại quyền quản trị (bỏ qua RLS) để dựng dữ liệu mẫu. */
  asAdmin(): Promise<void>
  /** Tạo một người dùng người lớn kèm hồ sơ. Trả về id. */
  createAdult(email: string, role: 'parent' | 'teacher', name: string): Promise<string>
  /** Tạo một người dùng ẩn danh (trẻ trên máy dùng chung). Trả về id. */
  createAnonUser(): Promise<string>
  close(): Promise<void>
}

export async function createHarness(): Promise<Harness> {
  const db = await PGlite.create({ extensions: { pgcrypto } })

  /*
    Cài pgcrypto vào schema `extensions`, ĐÚNG NHƯ Supabase thật.

    Bản đầu cài vào `public` - tức dựng lại một môi trường DỄ HƠN thật - và bỏ
    lọt nguyên một lỗi chết người: hai hàm mã PIN khai `search_path = public`
    nên trên dự án thật chúng không thấy `crypt()` và `gen_salt()`. Bốn mươi
    test RLS xanh trong khi không đứa trẻ nào vào được máy dùng chung.

    Môi trường kiểm chứng phải khó BẰNG thật, không thì nó chỉ chứng minh những
    thứ ta đã tin sẵn.
  */
  await db.exec('create schema if not exists extensions;')
  await db.exec('create extension if not exists pgcrypto with schema extensions;')
  await db.exec(AUTH_STUB)
  await db.exec(DEFAULT_PRIVILEGES)

  // Chạy TẤT CẢ migration theo đúng thứ tự, y như khi triển khai thật. Chỉ chạy
  // 0001 thì bảng thêm ở các bản sau không có ai canh chừng.
  for (const file of ['0001_init.sql', '0002_custom_content.sql', '0003_pgcrypto_search_path.sql', '0004_admin_role.sql', '0005_lock_profile_role.sql']) {
    // Extension đã bật ở trên; dòng trong migration là no-op nhưng vẫn chạy được.
    await db.exec(readFileSync(resolve(HERE, '..', 'migrations', file), 'utf8'))
  }

  await db.exec('grant select on auth.users to authenticated;')
  await db.exec('grant usage on schema extensions to anon, authenticated;')
  // Những test dựng hồ sơ mẫu gọi thẳng crypt() ngoài hàm, nên phiên nào cũng
  // phải nhìn thấy schema chứa nó.
  await db.exec('alter database postgres set search_path = public, extensions;')
  await db.exec('set search_path = public, extensions;')

  const asAdmin = async () => {
    await db.exec('reset role;')
  }

  const as = async (userId: string) => {
    await asAdmin()
    await db.query('select set_config($1, $2, false)', ['test.uid', userId])
    await db.exec('set role authenticated;')
  }

  return {
    db,
    as,
    asAdmin,

    async createAdult(email, role, name) {
      await asAdmin()
      const result = await db.query<{ id: string }>(
        `insert into auth.users (email, raw_user_meta_data)
         values ($1, jsonb_build_object('role', $2::text, 'display_name', $3::text))
         returning id`,
        [email, role, name],
      )
      return result.rows[0]!.id
    },

    async createAnonUser() {
      await asAdmin()
      const result = await db.query<{ id: string }>(
        'insert into auth.users (email) values (null) returning id',
      )
      return result.rows[0]!.id
    },

    async close() {
      await db.close()
    },
  }
}

/** Chạy một truy vấn và kỳ vọng nó BỊ TỪ CHỐI. Trả về thông điệp lỗi. */
export async function expectDenied(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn()
  } catch (cause) {
    return cause instanceof Error ? cause.message : String(cause)
  }
  throw new Error('Thao tác này lẽ ra phải bị từ chối nhưng lại thành công')
}
