/**
 * Kiểm chứng Row Level Security trên Postgres thật.
 *
 * Mỗi test ở đây tương ứng một cách rò rỉ dữ liệu trẻ em mà ta phải chặn được.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHarness, expectDenied, type Harness } from './harness'

let h: Harness

// Hai gia đình, một giáo viên, một lớp.
let parentA = ''
let parentB = ''
let teacher = ''
let anhId = '' // con của phụ huynh A, có trong lớp của giáo viên
let binhId = '' // con của phụ huynh B, KHÔNG có trong lớp nào
let classId = ''
let classCode = ''

beforeAll(async () => {
  h = await createHarness()

  parentA = await h.createAdult('a@example.com', 'parent', 'Phụ huynh A')
  parentB = await h.createAdult('b@example.com', 'parent', 'Phụ huynh B')
  teacher = await h.createAdult('co@example.com', 'teacher', 'Cô giáo')

  // Phụ huynh A tạo hồ sơ con mình.
  await h.as(parentA)
  const anh = await h.db.query<{ id: string }>(
    `insert into students (owner_id, name, avatar, grade, pin_hash)
     values ($1, 'Bé Anh', '🦊', 1, crypt('1234', gen_salt('bf'))) returning id`,
    [parentA],
  )
  anhId = anh.rows[0]!.id

  await h.as(parentB)
  const binh = await h.db.query<{ id: string }>(
    `insert into students (owner_id, name, avatar, grade, pin_hash)
     values ($1, 'Bé Bình', '🐼', 2, crypt('5678', gen_salt('bf'))) returning id`,
    [parentB],
  )
  binhId = binh.rows[0]!.id

  // Giáo viên lập lớp và nhận Bé Anh vào lớp.
  await h.as(teacher)
  const klass = await h.db.query<{ id: string; join_code: string }>(
    `insert into classes (teacher_id, name) values ($1, 'Lớp 1A') returning id, join_code`,
    [teacher],
  )
  classId = klass.rows[0]!.id
  classCode = klass.rows[0]!.join_code
  await h.db.query('insert into class_members (class_id, student_id) values ($1, $2)', [
    classId,
    anhId,
  ])
}, 120_000)

afterAll(async () => {
  await h?.close()
})

describe('trigger tạo hồ sơ người lớn', () => {
  it('đăng ký xong là có hồ sơ ngay, đúng vai trò', async () => {
    await h.asAdmin()
    const result = await h.db.query<{ role: string; display_name: string }>(
      'select role, display_name from profiles where id = $1',
      [teacher],
    )
    expect(result.rows[0]).toEqual({ role: 'teacher', display_name: 'Cô giáo' })
  })

  it('người dùng ẩn danh KHÔNG được tạo hồ sơ người lớn', async () => {
    const anon = await h.createAnonUser()
    await h.asAdmin()
    const result = await h.db.query('select 1 from profiles where id = $1', [anon])
    expect(result.rows).toHaveLength(0)
  })
})

describe('phụ huynh', () => {
  it('thấy con mình', async () => {
    await h.as(parentA)
    const result = await h.db.query<{ name: string }>('select name from students')
    expect(result.rows.map((r) => r.name)).toEqual(['Bé Anh'])
  })

  it('KHÔNG thấy con nhà khác', async () => {
    await h.as(parentB)
    const result = await h.db.query<{ id: string }>('select id from students where id = $1', [anhId])
    expect(result.rows).toHaveLength(0)
  })

  it('KHÔNG đọc trộm được kết quả học tập của con nhà khác', async () => {
    await h.asAdmin()
    await h.db.query(
      `insert into skill_mastery (student_id, skill_id, mastery) values ($1, 'math.g1.dem-100', 80)`,
      [anhId],
    )
    await h.as(parentB)
    const result = await h.db.query('select * from skill_mastery where student_id = $1', [anhId])
    expect(result.rows).toHaveLength(0)
  })

  it('KHÔNG sửa được hồ sơ con nhà khác', async () => {
    await h.as(parentB)
    const result = await h.db.query('update students set gold = 99999 where id = $1', [anhId])
    // RLS làm hàng đó "vô hình" nên update không khớp hàng nào.
    expect(result.affectedRows).toBe(0)
  })

  it('KHÔNG tạo được hồ sơ đứng tên người khác', async () => {
    await h.as(parentB)
    const error = await expectDenied(() =>
      h.db.query(
        `insert into students (owner_id, name, avatar, grade, pin_hash)
         values ($1, 'Giả mạo', '🐍', 1, 'x')`,
        [parentA],
      ),
    )
    expect(error).toMatch(/row-level security|policy/i)
  })

  it('sửa được vàng và kinh nghiệm của con mình', async () => {
    await h.as(parentA)
    await h.db.query('update students set gold = 120 where id = $1', [anhId])
    const result = await h.db.query<{ gold: number }>('select gold from students where id = $1', [anhId])
    expect(result.rows[0]!.gold).toBe(120)
  })

  it('xoá được hồ sơ con mình', async () => {
    await h.as(parentA)
    const temp = await h.db.query<{ id: string }>(
      `insert into students (owner_id, name, avatar, grade, pin_hash)
       values ($1, 'Tạm', '🐸', 1, 'x') returning id`,
      [parentA],
    )
    const result = await h.db.query('delete from students where id = $1', [temp.rows[0]!.id])
    expect(result.affectedRows).toBe(1)
  })
})

describe('giáo viên', () => {
  it('thấy học sinh trong lớp mình', async () => {
    await h.as(teacher)
    const result = await h.db.query<{ name: string }>('select name from students where id = $1', [anhId])
    expect(result.rows[0]!.name).toBe('Bé Anh')
  })

  it('KHÔNG thấy học sinh ngoài lớp mình', async () => {
    await h.as(teacher)
    const result = await h.db.query('select id from students where id = $1', [binhId])
    expect(result.rows).toHaveLength(0)
  })

  it('đọc được tiến độ học tập của học sinh trong lớp', async () => {
    await h.as(teacher)
    const result = await h.db.query('select * from skill_mastery where student_id = $1', [anhId])
    expect(result.rows.length).toBeGreaterThan(0)
  })

  it('KHÔNG sửa được mức thạo của học sinh - thầy cô chỉ xem, không chấm hộ', async () => {
    await h.as(teacher)
    const result = await h.db.query(
      'update skill_mastery set mastery = 100 where student_id = $1',
      [anhId],
    )
    expect(result.affectedRows).toBe(0)
  })

  it('KHÔNG sửa được vàng của học sinh', async () => {
    await h.as(teacher)
    const result = await h.db.query('update students set gold = 99999 where id = $1', [anhId])
    expect(result.affectedRows).toBe(0)
  })

  it('KHÔNG xoá được hồ sơ học sinh', async () => {
    await h.as(teacher)
    const result = await h.db.query('delete from students where id = $1', [anhId])
    expect(result.affectedRows).toBe(0)
  })

  it('KHÔNG nhận được học sinh vào lớp của giáo viên khác', async () => {
    const otherTeacher = await h.createAdult('co2@example.com', 'teacher', 'Cô giáo 2')
    await h.as(otherTeacher)
    const error = await expectDenied(() =>
      h.db.query('insert into class_members (class_id, student_id) values ($1, $2)', [
        classId,
        binhId,
      ]),
    )
    expect(error).toMatch(/row-level security|policy/i)
  })
})

describe('trẻ trên máy dùng chung', () => {
  let anonUser = ''

  it('nhập sai mã PIN thì không vào được', async () => {
    anonUser = await h.createAnonUser()
    await h.as(anonUser)
    const error = await expectDenied(() =>
      h.db.query('select claim_student($1, $2)', [anhId, '0000']),
    )
    expect(error).toContain('Mã PIN không đúng')
  })

  it('thông báo lỗi KHÔNG tiết lộ hồ sơ có tồn tại hay không', async () => {
    await h.as(anonUser)
    const wrongPin = await expectDenied(() =>
      h.db.query('select claim_student($1, $2)', [anhId, '0000']),
    )
    const noSuchStudent = await expectDenied(() =>
      h.db.query('select claim_student($1, $2)', [
        '00000000-0000-0000-0000-000000000000',
        '1234',
      ]),
    )
    expect(wrongPin).toContain('Mã PIN không đúng')
    expect(noSuchStudent).toContain('Mã PIN không đúng')
  })

  it('nhập đúng mã PIN thì nhận được hồ sơ', async () => {
    await h.as(anonUser)
    const result = await h.db.query<{ claim_student: string }>(
      'select claim_student($1, $2)',
      [anhId, '1234'],
    )
    expect(result.rows[0]!.claim_student).toBe(anhId)
  })

  it('sau khi nhận hồ sơ thì đọc và ghi được dữ liệu của chính mình', async () => {
    await h.as(anonUser)
    const read = await h.db.query<{ name: string }>('select name from students where id = $1', [anhId])
    expect(read.rows[0]!.name).toBe('Bé Anh')

    await h.db.query(
      `insert into skill_mastery (student_id, skill_id, mastery) values ($1, 'math.g1.cong-tru-10', 40)`,
      [anhId],
    )
    const written = await h.db.query('select 1 from skill_mastery where student_id = $1 and skill_id = $2', [
      anhId,
      'math.g1.cong-tru-10',
    ])
    expect(written.rows).toHaveLength(1)
  })

  it('KHÔNG thấy hồ sơ của bạn khác', async () => {
    await h.as(anonUser)
    const result = await h.db.query('select id from students where id = $1', [binhId])
    expect(result.rows).toHaveLength(0)
  })

  it('KHÔNG tự gán mình vào hồ sơ khác bằng cách ghi thẳng vào bảng phiên', async () => {
    await h.as(anonUser)
    const error = await expectDenied(() =>
      h.db.query('insert into student_sessions (user_id, student_id) values ($1, $2)', [
        anonUser,
        binhId,
      ]),
    )
    expect(error).toMatch(/row-level security|policy|permission/i)
  })

  it('KHÔNG xoá được hồ sơ của chính mình', async () => {
    await h.as(anonUser)
    const result = await h.db.query('delete from students where id = $1', [anhId])
    expect(result.affectedRows).toBe(0)
  })

  it('chưa nhận hồ sơ thì không thấy gì cả', async () => {
    const fresh = await h.createAnonUser()
    await h.as(fresh)
    const result = await h.db.query('select id from students')
    expect(result.rows).toHaveLength(0)
  })
})

describe('danh sách lớp cho trẻ chọn', () => {
  it('đúng mã lớp thì trả về tên và ảnh đại diện', async () => {
    const anon = await h.createAnonUser()
    await h.as(anon)
    const result = await h.db.query<{ name: string; avatar: string }>(
      'select * from list_class_roster($1)',
      [classCode],
    )
    expect(result.rows.map((r) => r.name)).toEqual(['Bé Anh'])
  })

  it('CHỈ trả về tên, ảnh đại diện và lớp - không kèm kết quả học tập', async () => {
    const anon = await h.createAnonUser()
    await h.as(anon)
    const result = await h.db.query('select * from list_class_roster($1)', [classCode])
    expect(Object.keys(result.rows[0] as object).sort()).toEqual([
      'avatar',
      'grade',
      'name',
      'student_id',
    ])
  })

  it('sai mã lớp thì không trả về gì', async () => {
    const anon = await h.createAnonUser()
    await h.as(anon)
    const result = await h.db.query('select * from list_class_roster($1)', ['ZZZZZZ'])
    expect(result.rows).toHaveLength(0)
  })

  it('mã lớp không phân biệt hoa thường', async () => {
    const anon = await h.createAnonUser()
    await h.as(anon)
    const result = await h.db.query('select * from list_class_roster($1)', [
      classCode.toLowerCase(),
    ])
    expect(result.rows).toHaveLength(1)
  })
})

describe('nhật ký trả lời là bằng chứng học tập', () => {
  it('thêm được', async () => {
    await h.as(parentA)
    const result = await h.db.query(
      `insert into attempts (student_id, question_id, skill_id, subject, difficulty, correct, duration_ms, answered_at)
       values ($1, 'q1', 'math.g1.dem-100', 'math', 1, true, 3000, now())`,
      [anhId],
    )
    expect(result.affectedRows).toBe(1)
  })

  it('KHÔNG sửa được - không ai chữa điểm ngược lại được', async () => {
    await h.as(parentA)
    const error = await expectDenied(() =>
      h.db.query('update attempts set correct = false where student_id = $1', [anhId]),
    )
    expect(error).toMatch(/row-level security|policy|permission/i)
  })

  it('KHÔNG xoá được', async () => {
    await h.as(parentA)
    const error = await expectDenied(() =>
      h.db.query('delete from attempts where student_id = $1', [anhId]),
    )
    expect(error).toMatch(/row-level security|policy|permission/i)
  })

  it('ghi trùng lô sau khi mất mạng không tạo bản ghi thừa', async () => {
    await h.as(parentA)
    const stamp = new Date().toISOString()
    const insert = () =>
      h.db.query(
        `insert into attempts (student_id, question_id, skill_id, subject, difficulty, correct, duration_ms, answered_at)
         values ($1, 'q-lap', 'math.g1.dem-100', 'math', 1, true, 3000, $2)
         on conflict (student_id, question_id, answered_at) do nothing`,
        [anhId, stamp],
      )
    await insert()
    await insert()

    const result = await h.db.query('select count(*)::int as n from attempts where question_id = $1', [
      'q-lap',
    ])
    expect((result.rows[0] as { n: number }).n).toBe(1)
  })

  it('phụ huynh khác KHÔNG đọc được nhật ký', async () => {
    await h.as(parentB)
    const result = await h.db.query('select * from attempts where student_id = $1', [anhId])
    expect(result.rows).toHaveLength(0)
  })
})

describe('đặt mã PIN', () => {
  it('phụ huynh đặt được mã PIN cho con mình', async () => {
    await h.as(parentA)
    await h.db.query('select set_student_pin($1, $2)', [anhId, '4321'])

    const anon = await h.createAnonUser()
    await h.as(anon)
    const result = await h.db.query('select claim_student($1, $2)', [anhId, '4321'])
    expect(result.rows).toHaveLength(1)
  })

  it('từ chối mã PIN không phải 4 chữ số', async () => {
    await h.as(parentA)
    const error = await expectDenied(() => h.db.query('select set_student_pin($1, $2)', [anhId, 'abc']))
    expect(error).toContain('4 chữ số')
  })

  it('người lạ KHÔNG đặt được mã PIN cho con nhà khác', async () => {
    await h.as(parentB)
    const error = await expectDenied(() =>
      h.db.query('select set_student_pin($1, $2)', [anhId, '1111']),
    )
    expect(error).toContain('Không có quyền')
  })

  it('hồ sơ mới KHÔNG có mã PIN mặc định - chưa đặt thì chưa vào được', async () => {
    await h.as(parentA)
    const fresh = await h.db.query<{ id: string }>(
      `insert into students (owner_id, name, avatar, grade)
       values ($1, 'Bé Chưa Có Mã', '🐧', 1) returning id`,
      [parentA],
    )
    const freshId = fresh.rows[0]!.id

    const anon = await h.createAnonUser()
    await h.as(anon)
    const error = await expectDenied(() => h.db.query('select claim_student($1, $2)', [freshId, '0000']))
    expect(error).toContain('chưa được đặt mã PIN')
  })

  it('tạo hồ sơ bằng INSERT ... RETURNING vẫn chạy - đúng cách client gọi', async () => {
    // Đây từng là lỗi thật: policy SELECT gọi hàm `stable` nên không nhìn thấy
    // hàng vừa chèn, làm cả bước tạo hồ sơ hỏng.
    await h.as(parentA)
    const result = await h.db.query<{ id: string; name: string }>(
      `insert into students (owner_id, name, avatar, grade)
       values ($1, 'Bé Trả Về', '🐢', 3) returning id, name`,
      [parentA],
    )
    expect(result.rows[0]!.name).toBe('Bé Trả Về')
  })
})

describe('mã lớp', () => {
  it('sinh tự động, dài 6 ký tự, bỏ các chữ dễ đọc nhầm', async () => {
    await h.as(teacher)
    const result = await h.db.query<{ join_code: string }>(
      `insert into classes (teacher_id, name) values ($1, 'Lớp 2B') returning join_code`,
      [teacher],
    )
    const code = result.rows[0]!.join_code
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
  })

  it('mã PIN được băm, không bao giờ lưu dạng thô', async () => {
    await h.asAdmin()
    const result = await h.db.query<{ pin_hash: string }>(
      'select pin_hash from students where id = $1',
      [binhId],
    )
    expect(result.rows[0]!.pin_hash).not.toBe('5678')
    expect(result.rows[0]!.pin_hash).toMatch(/^\$2[aby]\$/)
  })
})
