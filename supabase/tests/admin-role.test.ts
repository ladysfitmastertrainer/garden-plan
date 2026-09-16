/**
 * Vai trò quản trị, và cái lỗ hổng nó suýt mở ra.
 *
 * `0004_admin_role.sql` biến 'admin' thành quyền THẬT - tạo tài khoản, đặt lại
 * mật khẩu người khác. Ngay lúc đó, một câu policy vô hại từ `0001_init.sql`
 * (mỗi người toàn quyền trên hồ sơ của chính mình) trở thành nút bấm "tự phong
 * quản trị" cho bất kỳ ai đăng nhập được.
 *
 * Lỗ hổng đã xảy ra thật trên dự án Supabase thật trước khi bị bắt. Những test ở
 * đây canh để nó không quay lại.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHarness, expectDenied, type Harness } from './harness'

let h: Harness
let coHa = '' // giáo viên
let boAnh = '' // phụ huynh
let sep = '' // quản trị

beforeAll(async () => {
  h = await createHarness()
  coHa = await h.createAdult('coha@truong.edu.vn', 'teacher', 'Cô Hà')
  boAnh = await h.createAdult('boanh@example.com', 'parent', 'Bố Anh')
  sep = await h.createAdult('sep@truong.edu.vn', 'teacher', 'Hiệu trưởng')

  // Phong quản trị bằng quyền chủ cơ sở dữ liệu - đúng như chạy ở SQL Editor.
  await h.asAdmin()
  await h.db.query("update public.profiles set role = 'admin' where id = $1", [sep])
}, 120_000)

afterAll(async () => {
  await h?.close()
})

describe('không ai tự phong mình làm quản trị', () => {
  it('giáo viên KHÔNG tự đổi vai của mình thành admin', async () => {
    await h.as(coHa)
    const error = await expectDenied(() =>
      h.db.query("update public.profiles set role = 'admin' where id = $1", [coHa]),
    )
    expect(error).toMatch(/permission denied|column/i)

    await h.asAdmin()
    const after = await h.db.query<{ role: string }>('select role from public.profiles where id = $1', [coHa])
    expect(after.rows[0]!.role).toBe('teacher')
  })

  it('phụ huynh cũng không tự lên giáo viên được', async () => {
    // Nhẹ hơn nhưng vẫn là leo thang: giáo viên tạo được tài khoản phụ huynh.
    await h.as(boAnh)
    await expectDenied(() =>
      h.db.query("update public.profiles set role = 'teacher' where id = $1", [boAnh]),
    )

    await h.asAdmin()
    const after = await h.db.query<{ role: string }>('select role from public.profiles where id = $1', [boAnh])
    expect(after.rows[0]!.role).toBe('parent')
  })

  it('không xoá hồ sơ của mình để chèn lại cái khác', async () => {
    // Đường vòng đạt đúng kết quả mà lệnh thu hồi cột vừa chặn.
    await h.as(coHa)
    const error = await expectDenied(() =>
      h.db.query('delete from public.profiles where id = $1', [coHa]),
    )
    expect(error).toMatch(/permission denied/i)

    await h.asAdmin()
    const still = await h.db.query('select 1 from public.profiles where id = $1', [coHa])
    expect(still.rows).toHaveLength(1)
  })

  it('KHÔNG đổi được vai của người khác', async () => {
    await h.as(coHa)
    await expectDenied(() =>
      h.db.query("update public.profiles set role = 'parent' where id = $1", [sep]),
    )
  })
})

describe('những gì vẫn phải làm được', () => {
  it('vẫn tự đổi được tên hiển thị của mình', async () => {
    // Thu hồi quyền phải đúng CỘT, không phải khoá cả hàng.
    await h.as(coHa)
    await h.db.query("update public.profiles set display_name = 'Cô Hà B' where id = $1", [coHa])

    const after = await h.db.query<{ display_name: string }>(
      'select display_name from public.profiles where id = $1',
      [coHa],
    )
    expect(after.rows[0]!.display_name).toBe('Cô Hà B')
  })

  it('vẫn đọc được hồ sơ của chính mình', async () => {
    await h.as(boAnh)
    const rows = await h.db.query('select role from public.profiles where id = $1', [boAnh])
    expect(rows.rows).toHaveLength(1)
  })

  it('phụ huynh KHÔNG đọc được hồ sơ người lớn khác', async () => {
    await h.as(boAnh)
    const rows = await h.db.query('select role from public.profiles where id = $1', [coHa])
    expect(rows.rows).toHaveLength(0)
  })

  it('quản trị ĐỌC ĐƯỢC danh sách hồ sơ người lớn', async () => {
    // Đây là thứ tab "Tài khoản" cần để có cái mà hiện ra.
    await h.as(sep)
    const rows = await h.db.query('select id from public.profiles')
    expect(rows.rows.length).toBeGreaterThanOrEqual(3)
  })

  it('quyền chủ cơ sở dữ liệu vẫn phong được vai - đó là đường của SQL Editor', async () => {
    await h.asAdmin()
    await h.db.query("update public.profiles set role = 'admin' where id = $1", [boAnh])
    const after = await h.db.query<{ role: string }>('select role from public.profiles where id = $1', [boAnh])
    expect(after.rows[0]!.role).toBe('admin')

    await h.db.query("update public.profiles set role = 'parent' where id = $1", [boAnh])
  })
})

describe('is_admin()', () => {
  it('đúng với quản trị, sai với mọi người khác', async () => {
    await h.as(sep)
    const yes = await h.db.query<{ ok: boolean }>('select public.is_admin() as ok')
    expect(yes.rows[0]!.ok).toBe(true)

    await h.as(coHa)
    const no = await h.db.query<{ ok: boolean }>('select public.is_admin() as ok')
    expect(no.rows[0]!.ok).toBe(false)
  })
})
