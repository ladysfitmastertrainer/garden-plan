/**
 * RLS cho nội dung tự soạn, chạy trên Postgres thật.
 *
 * Bảng nội dung khác mọi bảng khác ở một điểm quan trọng: nó thuộc về NGƯỜI LỚN,
 * và phải chảy ngược xuống TRẺ EM - học sinh đọc được câu cô giáo soạn. Mỗi lần
 * mở một đường đọc mới là một lần có thể mở nhầm, nên chỗ này phải chạy thử chứ
 * không đọc SQL bằng mắt.
 *
 * Mỗi test tương ứng một đường rò rỉ hoặc một đường đọc bắt buộc phải thông.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHarness, expectDenied, type Harness } from './harness'

let h: Harness

let coHa = '' // giáo viên, dạy lớp có Bé Anh
let boAnh = '' // phụ huynh của Bé Anh
let boBinh = '' // phụ huynh của Bé Bình, không liên quan tới lớp cô Hà
let anhId = ''
let binhId = ''
let anhUser = '' // phiên ẩn danh của Bé Anh trên máy dùng chung
let binhUser = ''

const SKILL = 'math.g1.cong-tru-10'
const ENTRY = JSON.stringify({ kind: 'choice', prompt: 'Câu của cô Hà', correct: '7', distractors: ['5'] })

beforeAll(async () => {
  h = await createHarness()

  coHa = await h.createAdult('coha@example.com', 'teacher', 'Cô Hà')
  boAnh = await h.createAdult('boanh@example.com', 'parent', 'Bố Anh')
  boBinh = await h.createAdult('bobinh@example.com', 'parent', 'Bố Bình')

  await h.as(boAnh)
  anhId = (
    await h.db.query<{ id: string }>(
      `insert into students (owner_id, name, avatar, grade, pin_hash)
       values ($1, 'Bé Anh', '🦊', 1, crypt('1234', gen_salt('bf'))) returning id`,
      [boAnh],
    )
  ).rows[0]!.id

  await h.as(boBinh)
  binhId = (
    await h.db.query<{ id: string }>(
      `insert into students (owner_id, name, avatar, grade, pin_hash)
       values ($1, 'Bé Bình', '🐼', 1, crypt('5678', gen_salt('bf'))) returning id`,
      [boBinh],
    )
  ).rows[0]!.id

  // Cô Hà lập lớp và nhận Bé Anh. Bé Bình KHÔNG vào lớp nào.
  await h.as(coHa)
  const klass = await h.db.query<{ id: string }>(
    `insert into classes (teacher_id, name) values ($1, 'Lớp 1A') returning id`,
    [coHa],
  )
  await h.db.query('insert into class_members (class_id, student_id) values ($1, $2)', [
    klass.rows[0]!.id,
    anhId,
  ])

  // Hai máy dùng chung, mỗi em một phiên ẩn danh.
  anhUser = await h.createAnonUser()
  binhUser = await h.createAnonUser()
  await h.asAdmin()
  await h.db.query('insert into student_sessions (user_id, student_id) values ($1, $2)', [anhUser, anhId])
  await h.db.query('insert into student_sessions (user_id, student_id) values ($1, $2)', [binhUser, binhId])

  // Cô Hà soạn một câu.
  await h.as(coHa)
  await h.db.query(
    `insert into custom_questions (id, owner_id, skill_id, entry)
     values (gen_random_uuid(), $1, $2, $3::jsonb)`,
    [coHa, SKILL, ENTRY],
  )
}, 120_000)

afterAll(async () => {
  await h?.close()
})

describe('nội dung cô giáo soạn chảy xuống học sinh', () => {
  it('học sinh trong lớp ĐỌC ĐƯỢC câu cô soạn', async () => {
    // Đây là toàn bộ lý do tồn tại của tính năng này. Đứt đường này thì cô soạn
    // bài cho lớp mà không em nào nhận được.
    await h.as(anhUser)
    const rows = await h.db.query('select entry from custom_questions where owner_id = $1', [coHa])
    expect(rows.rows).toHaveLength(1)
  })

  it('học sinh KHÔNG trong lớp thì không đọc được', async () => {
    await h.as(binhUser)
    const rows = await h.db.query('select entry from custom_questions where owner_id = $1', [coHa])
    expect(rows.rows).toHaveLength(0)
  })

  it('con đọc được nội dung do chính bố mẹ mình soạn', async () => {
    await h.as(boAnh)
    await h.db.query(
      `insert into custom_questions (id, owner_id, skill_id, entry)
       values (gen_random_uuid(), $1, $2, $3::jsonb)`,
      [boAnh, SKILL, JSON.stringify({ kind: 'text', prompt: 'Câu của bố', accepted: ['1'] })],
    )

    await h.as(anhUser)
    const rows = await h.db.query('select entry from custom_questions where owner_id = $1', [boAnh])
    expect(rows.rows).toHaveLength(1)
  })

  it('con nhà khác KHÔNG đọc được nội dung bố mẹ này soạn', async () => {
    await h.as(binhUser)
    const rows = await h.db.query('select entry from custom_questions where owner_id = $1', [boAnh])
    expect(rows.rows).toHaveLength(0)
  })
})

describe('người lớn không xem được nội dung của người lớn khác', () => {
  it('phụ huynh KHÔNG đọc được câu cô giáo soạn, dù cô dạy con mình', async () => {
    // Nội dung soạn cho lớp là để HỌC SINH dùng, không phải để phụ huynh chép về.
    await h.as(boAnh)
    const rows = await h.db.query('select entry from custom_questions where owner_id = $1', [coHa])
    expect(rows.rows).toHaveLength(0)
  })

  it('giáo viên KHÔNG đọc được câu phụ huynh soạn', async () => {
    await h.as(coHa)
    const rows = await h.db.query('select entry from custom_questions where owner_id = $1', [boAnh])
    expect(rows.rows).toHaveLength(0)
  })

  it('phụ huynh này KHÔNG đọc được nội dung của phụ huynh kia', async () => {
    await h.as(boBinh)
    const rows = await h.db.query('select entry from custom_questions where owner_id = $1', [boAnh])
    expect(rows.rows).toHaveLength(0)
  })
})

describe('chỉ chính người soạn mới ghi được', () => {
  it('không ai chèn được nội dung dưới tên người khác', async () => {
    await h.as(boBinh)
    const error = await expectDenied(() =>
      h.db.query(
        `insert into custom_questions (id, owner_id, skill_id, entry)
         values (gen_random_uuid(), $1, $2, $3::jsonb)`,
        [coHa, SKILL, ENTRY],
      ),
    )
    expect(error).toMatch(/row-level security|policy/i)
  })

  it('người khác KHÔNG sửa được câu của cô Hà', async () => {
    await h.as(boAnh)
    const result = await h.db.query(
      `update custom_questions set entry = '{"kind":"text","prompt":"đã bị sửa"}'::jsonb
        where owner_id = $1`,
      [coHa],
    )
    // Không đọc được hàng thì cũng không sửa được hàng nào - RLS lọc trước.
    expect(result.affectedRows ?? 0).toBe(0)

    await h.asAdmin()
    const still = await h.db.query<{ prompt: string }>(
      `select entry ->> 'prompt' as prompt from custom_questions where owner_id = $1`,
      [coHa],
    )
    expect(still.rows[0]!.prompt).toBe('Câu của cô Hà')
  })

  it('học sinh KHÔNG xoá được câu cô giáo soạn', async () => {
    await h.as(anhUser)
    const result = await h.db.query('delete from custom_questions where owner_id = $1', [coHa])
    expect(result.affectedRows ?? 0).toBe(0)
  })

  it('học sinh KHÔNG tự soạn được nội dung', async () => {
    // Trẻ không có hồ sơ trong `profiles` nên khoá ngoại chặn từ đầu - nhưng
    // phải kiểm tra thật, vì đây là đường mà một máy tính bảng ở lớp có thể đi.
    await h.as(anhUser)
    const error = await expectDenied(() =>
      h.db.query(
        `insert into custom_questions (id, owner_id, skill_id, entry)
         values (gen_random_uuid(), $1, $2, $3::jsonb)`,
        [anhUser, SKILL, ENTRY],
      ),
    )
    expect(error.length).toBeGreaterThan(0)
  })

  it('chính cô Hà thì sửa được câu của mình', async () => {
    await h.as(coHa)
    await h.db.query(
      `update custom_questions
          set entry = jsonb_set(entry, '{prompt}', '"Câu đã sửa"'), updated_at = now()
        where owner_id = $1`,
      [coHa],
    )
    const rows = await h.db.query<{ prompt: string }>(
      `select entry ->> 'prompt' as prompt from custom_questions where owner_id = $1`,
      [coHa],
    )
    expect(rows.rows[0]!.prompt).toBe('Câu đã sửa')
  })
})

describe('ẩn câu và đổi tên cũng theo đúng luật ấy', () => {
  it('học sinh trong lớp nhận được lệnh ẩn và tên mới của cô', async () => {
    await h.as(coHa)
    await h.db.query(
      `insert into custom_hidden (owner_id, skill_id, prompt) values ($1, $2, 'Câu gốc không hợp')`,
      [coHa, SKILL],
    )
    await h.db.query(
      `insert into custom_skill_names (owner_id, skill_id, name) values ($1, $2, 'Cộng trừ 10 - lớp 1A')`,
      [coHa, SKILL],
    )

    await h.as(anhUser)
    expect((await h.db.query('select 1 from custom_hidden where owner_id = $1', [coHa])).rows).toHaveLength(1)
    expect((await h.db.query('select 1 from custom_skill_names where owner_id = $1', [coHa])).rows).toHaveLength(1)
  })

  it('học sinh ngoài lớp thì không', async () => {
    await h.as(binhUser)
    expect((await h.db.query('select 1 from custom_hidden where owner_id = $1', [coHa])).rows).toHaveLength(0)
    expect((await h.db.query('select 1 from custom_skill_names where owner_id = $1', [coHa])).rows).toHaveLength(0)
  })
})

describe('ràng buộc dữ liệu', () => {
  it('không nhận câu không có đề bài', async () => {
    await h.as(coHa)
    const error = await expectDenied(() =>
      h.db.query(
        `insert into custom_questions (id, owner_id, skill_id, entry)
         values (gen_random_uuid(), $1, $2, '{"kind":"text","prompt":""}'::jsonb)`,
        [coHa, SKILL],
      ),
    )
    expect(error).toMatch(/custom_questions_entry_shape|constraint/i)
  })

  it('không nhận câu thiếu hẳn thể loại', async () => {
    await h.as(coHa)
    const error = await expectDenied(() =>
      h.db.query(
        `insert into custom_questions (id, owner_id, skill_id, entry)
         values (gen_random_uuid(), $1, $2, '{"prompt":"Thiếu kind"}'::jsonb)`,
        [coHa, SKILL],
      ),
    )
    expect(error).toMatch(/custom_questions_entry_shape|constraint/i)
  })

  it('xoá hồ sơ người lớn là nội dung của họ đi theo', async () => {
    // Không để lại nội dung mồ côi mà không ai sửa hay xoá được nữa.
    await h.asAdmin()
    const before = await h.db.query('select 1 from custom_questions where owner_id = $1', [boBinh])
    await h.db.query(
      `insert into custom_questions (id, owner_id, skill_id, entry)
       values (gen_random_uuid(), $1, $2, $3::jsonb)`,
      [boBinh, SKILL, ENTRY],
    )
    expect(
      (await h.db.query('select 1 from custom_questions where owner_id = $1', [boBinh])).rows.length,
    ).toBe(before.rows.length + 1)

    await h.db.query('delete from auth.users where id = $1', [boBinh])
    const after = await h.db.query('select 1 from custom_questions where owner_id = $1', [boBinh])
    expect(after.rows).toHaveLength(0)
  })
})
