/**
 * Phân quyền. Đây là nơi DUY NHẤT quyết định ai được đụng vào gì.
 *
 * Trước đây luật này nằm trong Row Level Security, viết bằng SQL trong
 * `supabase/migrations/0001_init.sql`. Các hàm dưới đây là bản dịch NGUYÊN VĂN
 * của `can_read_student` và `can_write_student` sang TypeScript - cùng một luật,
 * chỉ khác chỗ đứng:
 *
 *   - chủ hồ sơ            : đọc VÀ ghi
 *   - giáo viên dạy em đó  : chỉ ĐỌC. Thầy cô xem được tiến độ nhưng không sửa
 *                            được vàng, kinh nghiệm hay mức thạo của học sinh.
 *   - chính đứa trẻ đó     : đọc VÀ ghi hồ sơ của mình, không đụng được ai khác.
 *
 * Giữ đúng nguyên văn là có chủ ý: RLS vẫn nằm nguyên trong database làm lớp thứ
 * hai, và hai lớp mà nói hai luật khác nhau thì sớm muộn sẽ có một lỗi mà không
 * ai giải thích nổi.
 */
import 'server-only'

import { check, db } from './db'
import { forbidden, notFound, unauthorized } from './http'
import { readSession, type Session } from './session'

export type AdultRole = 'parent' | 'teacher' | 'admin'

export interface Adult {
  userId: string
  role: AdultRole
  displayName: string
}

/** Vai hợp lệ; mọi thứ khác rơi về `parent`. */
export function cleanRole(value: unknown): AdultRole {
  return value === 'teacher' || value === 'admin' ? value : 'parent'
}

export async function requireSession(): Promise<Session> {
  const session = await readSession()
  if (!session) throw unauthorized()
  return session
}

/**
 * Người gọi phải là người lớn đang đăng nhập.
 *
 * Vai được tra lại từ `profiles` ở mỗi lần gọi - xem ghi chú trong `session.ts`
 * về việc vì sao nó không nằm sẵn trong token.
 */
export async function requireAdult(): Promise<Adult> {
  const session = await requireSession()
  if (session.kind !== 'adult') throw forbidden('Việc này chỉ dành cho người lớn.')

  const { data, error } = await db()
    .from('profiles')
    .select('role, display_name')
    .eq('id', session.userId)
    .maybeSingle()
  check(error, 'Không đọc được hồ sơ người dùng')

  // Hồ sơ biến mất trong khi cookie vẫn còn: tài khoản đã bị xoá. Coi như chưa
  // đăng nhập, để trình duyệt dọn cookie và hiện lại màn hình đăng nhập.
  if (!data) throw unauthorized('Tài khoản này không còn tồn tại.')

  return {
    userId: session.userId,
    role: cleanRole(data.role),
    displayName: (data.display_name as string) ?? '',
  }
}

/** Quản trị viên HOẶC giáo viên - hai vai cùng tạo được tài khoản phụ huynh. */
export async function requireStaff(): Promise<Adult> {
  const adult = await requireAdult()
  if (adult.role === 'parent') {
    throw forbidden('Chỉ quản trị viên hoặc giáo viên mới làm được việc này.')
  }
  return adult
}

export async function requireAdmin(): Promise<Adult> {
  const adult = await requireAdult()
  if (adult.role !== 'admin') throw forbidden('Chỉ quản trị viên mới làm được việc này.')
  return adult
}

// --- Quyền trên một hồ sơ học sinh ---------------------------------------------

async function isOwner(userId: string, studentId: string): Promise<boolean> {
  const { data, error } = await db()
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('owner_id', userId)
    .maybeSingle()
  check(error, 'Không kiểm tra được chủ hồ sơ')
  return data !== null
}

async function teachesStudent(userId: string, studentId: string): Promise<boolean> {
  const { data, error } = await db()
    .from('class_members')
    .select('class_id, classes!inner(teacher_id)')
    .eq('student_id', studentId)
    .eq('classes.teacher_id', userId)
    .limit(1)
  check(error, 'Không kiểm tra được lớp của giáo viên')
  return (data?.length ?? 0) > 0
}

/**
 * Đọc dữ liệu của học sinh này: chủ hồ sơ, giáo viên dạy em đó, hoặc chính em đó.
 * Trả về phiên để nơi gọi biết mình đang phục vụ ai.
 */
export async function requireReadStudent(studentId: string): Promise<Session> {
  const session = await requireSession()

  if (session.kind === 'child') {
    if (session.studentId !== studentId) throw forbidden('Đây không phải hồ sơ của con.')
    return session
  }

  if (await isOwner(session.userId, studentId)) return session
  if (await teachesStudent(session.userId, studentId)) return session
  // 404 chứ không 403: người lạ không cần biết hồ sơ này có tồn tại hay không.
  throw notFound('Không tìm thấy hồ sơ học sinh này.')
}

/**
 * Ghi dữ liệu học tập của học sinh này: chỉ chủ hồ sơ và chính em đó.
 * Giáo viên CỐ Ý bị loại - giống hệt `can_write_student` trong RLS.
 */
export async function requireWriteStudent(studentId: string): Promise<Session> {
  const session = await requireSession()

  if (session.kind === 'child') {
    if (session.studentId !== studentId) throw forbidden('Đây không phải hồ sơ của con.')
    return session
  }

  if (await isOwner(session.userId, studentId)) return session
  if (await teachesStudent(session.userId, studentId)) {
    throw forbidden('Giáo viên xem được tiến độ nhưng không sửa được dữ liệu học tập của học sinh.')
  }
  throw notFound('Không tìm thấy hồ sơ học sinh này.')
}

/** Lớp học này có phải của giáo viên đang gọi không? */
export async function requireOwnClass(adult: Adult, classId: string): Promise<void> {
  const { data, error } = await db()
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', adult.userId)
    .maybeSingle()
  check(error, 'Không kiểm tra được lớp học')
  if (!data) throw notFound('Không tìm thấy lớp này.')
}
