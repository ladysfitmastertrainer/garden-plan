/**
 * Lớp học, danh sách lớp, và mã PIN của trẻ.
 *
 * Giáo viên TỰ TẠO hồ sơ học sinh của lớp mình (nên là chủ hồ sơ), rồi thêm vào
 * lớp. Không có luồng "thêm học sinh của người khác vào lớp tôi" - về mặt bảo vệ
 * dữ liệu trẻ em thì không nên có, và trước đây RLS cũng chặn đúng như vậy.
 *
 * Mã PIN giờ băm bằng `bcryptjs` trong Node, không còn gọi hàm `set_student_pin`
 * của Postgres nữa. Cùng một thuật toán (bcrypt) và cùng một định dạng chuỗi
 * `$2a$...`, nên MÃ PIN ĐÃ ĐẶT TỪ TRƯỚC vẫn đăng nhập được bình thường - không
 * phải bắt cả trường đặt lại mã.
 */
import 'server-only'

import bcrypt from 'bcryptjs'
import type { Grade } from '@/content/types'
import { check, db } from './db'
import { badRequest, notFound } from './http'

export interface ClassRow {
  id: string
  name: string
  joinCode: string
  studentCount: number
}

export interface ClassStudent {
  id: string
  name: string
  avatar: string
  grade: Grade
  /** Chưa đặt mã PIN thì em đó chưa dùng được máy chung ở lớp. */
  hasPin: boolean
}

/** Một dòng trong danh sách lớp mà trẻ thấy sau khi nhập mã lớp. */
export interface RosterEntry {
  studentId: string
  name: string
  avatar: string
  grade: number
}

export async function listClasses(teacherId: string): Promise<ClassRow[]> {
  const { data, error } = await db()
    .from('classes')
    .select('id, name, join_code, class_members(count)')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true })
  check(error, 'Không tải được danh sách lớp')

  return (
    (data as unknown as Array<{
      id: string
      name: string
      join_code: string
      class_members: Array<{ count: number }>
    }> | null) ?? []
  ).map((row) => ({
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    studentCount: row.class_members?.[0]?.count ?? 0,
  }))
}

export async function createClass(teacherId: string, name: string): Promise<ClassRow> {
  const { data, error } = await db()
    .from('classes')
    // `join_code` do Postgres sinh (hàm `generate_join_code`) - không tự đặt ở đây.
    .insert({ teacher_id: teacherId, name })
    .select('id, name, join_code')
    .single()
  check(error, 'Không tạo được lớp')

  const row = data as unknown as { id: string; name: string; join_code: string }
  return { id: row.id, name: row.name, joinCode: row.join_code, studentCount: 0 }
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await db().from('classes').delete().eq('id', classId)
  check(error, 'Không xoá được lớp')
}

export async function listClassStudents(classId: string): Promise<ClassStudent[]> {
  const { data, error } = await db()
    .from('class_members')
    .select('students(id, name, avatar, grade, pin_hash)')
    .eq('class_id', classId)
  check(error, 'Không tải được danh sách học sinh')

  return (
    (data as unknown as Array<{
      students: { id: string; name: string; avatar: string; grade: number; pin_hash: string | null } | null
    }> | null) ?? []
  )
    .flatMap((row) => (row.students ? [row.students] : []))
    .map((s) => ({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      grade: s.grade as Grade,
      // Chỉ trả về CÓ hay KHÔNG, không bao giờ trả chuỗi băm ra ngoài.
      hasPin: s.pin_hash !== null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export async function addClassStudent(
  teacherId: string,
  classId: string,
  input: { name: string; avatar: string; grade: Grade },
): Promise<ClassStudent> {
  const { data, error } = await db()
    .from('students')
    .insert({ owner_id: teacherId, name: input.name, avatar: input.avatar, grade: input.grade })
    .select('id, name, avatar, grade')
    .single()
  check(error, 'Không tạo được hồ sơ học sinh')

  const student = data as unknown as { id: string; name: string; avatar: string; grade: number }
  const link = await db().from('class_members').insert({ class_id: classId, student_id: student.id })
  check(link.error, 'Không thêm được học sinh vào lớp')

  await db().from('student_progress').insert({ student_id: student.id })

  return {
    id: student.id,
    name: student.name,
    avatar: student.avatar,
    grade: student.grade as Grade,
    hasPin: false,
  }
}

export async function removeClassStudent(classId: string, studentId: string): Promise<void> {
  // Chỉ gỡ khỏi lớp, KHÔNG xoá hồ sơ - dữ liệu học tập của trẻ vẫn còn.
  const { error } = await db()
    .from('class_members')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)
  check(error, 'Không gỡ được học sinh khỏi lớp')
}

// --- Mã PIN ------------------------------------------------------------------------

/** Bốn tới tám chữ số. Trẻ lớp 1 gõ được, và không ai đặt được mã rỗng. */
const PIN = /^\d{4,8}$/

export async function setStudentPin(studentId: string, pin: string): Promise<void> {
  if (!PIN.test(pin)) throw badRequest('Mã PIN phải gồm 4 đến 8 chữ số.')

  const { error } = await db()
    .from('students')
    .update({ pin_hash: await bcrypt.hash(pin, 10) })
    .eq('id', studentId)
  check(error, 'Không đặt được mã PIN')
}

/**
 * Danh sách lớp cho trẻ chọn ảnh đại diện của mình.
 *
 * KHÔNG cần đăng nhập - đây là bước đầu tiên của trẻ trên máy dùng chung, lúc đó
 * em chưa có phiên nào cả. Mã lớp vì thế là thông tin nhạy cảm: ai có mã sẽ xem
 * được tên và ảnh đại diện của lớp. Nhưng chỉ có thế - không kết quả học tập,
 * và vẫn phải có mã PIN mới vào được hồ sơ.
 */
export async function loadRoster(joinCode: string): Promise<RosterEntry[]> {
  const { data: klass, error } = await db()
    .from('classes')
    .select('id')
    .eq('join_code', joinCode.trim().toUpperCase())
    .maybeSingle()
  check(error, 'Không tìm được lớp')
  if (!klass) throw notFound('Không tìm thấy lớp nào có mã này.')

  const { data, error: membersError } = await db()
    .from('class_members')
    .select('students(id, name, avatar, grade)')
    .eq('class_id', klass.id)
  check(membersError, 'Không tải được danh sách lớp')

  return (
    (data as unknown as Array<{
      students: { id: string; name: string; avatar: string; grade: number } | null
    }> | null) ?? []
  )
    .flatMap((row) => (row.students ? [row.students] : []))
    .map((s) => ({ studentId: s.id, name: s.name, avatar: s.avatar, grade: s.grade }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

/**
 * Kiểm mã PIN của một hồ sơ.
 *
 * Trả về `true`/`false` chứ không ném lỗi phân biệt "chưa đặt mã" với "sai mã":
 * nơi gọi phải nói đúng một câu cho cả hai, nếu không thì người lạ cầm mã lớp sẽ
 * dò được em nào đã đặt mã và em nào chưa.
 */
export async function verifyStudentPin(studentId: string, pin: string): Promise<boolean> {
  const { data, error } = await db()
    .from('students')
    .select('pin_hash')
    .eq('id', studentId)
    .maybeSingle()
  check(error, 'Không kiểm được mã PIN')

  const hash = (data?.pin_hash as string | null) ?? null
  if (!hash) {
    /*
      Chưa đặt mã. Vẫn chạy một lần so sánh giả trước khi trả lời.

      Không có nó thì hồ sơ chưa đặt mã trả lời tức thì, còn hồ sơ đã đặt mã phải
      chờ bcrypt - chênh nhau cả trăm mili giây, đủ để đo bằng đồng hồ bấm tay.
      Kẻ dò sẽ biết chính xác em nào chưa có mã để nhắm vào.
    */
    await bcrypt.compare(pin, '$2a$10$abcdefghijklmnopqrstuv0123456789ABCDEFGHIJKLMNOPQRSTU')
    return false
  }

  return bcrypt.compare(pin, hash)
}
