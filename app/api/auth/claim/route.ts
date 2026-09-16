/**
 * Trẻ vào hồ sơ của mình bằng mã PIN.
 *
 * Không cần đăng nhập trước: em vừa chọn ảnh đại diện ở bước `/api/auth/roster`,
 * và mã PIN chính là thứ chứng minh đó đúng là em. Đổi lại, route này là nơi duy
 * nhất người lạ cầm mã lớp có thể đoán mò, nên nó phải kín tiếng.
 *
 * Thay cho hàm `claim_student` của Postgres và một phiên ẩn danh của Supabase:
 * giờ chỉ là so một chuỗi bcrypt rồi phát cookie. Bảng `student_sessions` không
 * còn ai ghi vào nữa.
 */

import { verifyStudentPin } from '@/server/classes'
import { badRequest, readJson, requireText, route } from '@/server/http'
import { startSession } from '@/server/session'
import { getStudent } from '@/server/students'

export const POST = route(async (req) => {
  const body = await readJson<{ studentId?: string; pin?: string }>(req)
  const studentId = requireText(body.studentId, 'Hồ sơ')
  const pin = requireText(body.pin, 'Mã PIN')

  /*
    MỘT câu trả lời cho mọi kiểu sai.

    Hồ sơ không tồn tại, hồ sơ chưa đặt mã, mã sai - ba trường hợp, một lời nhắn.
    Tách ra thì lời báo lỗi trở thành công cụ dò: người lạ cầm mã lớp sẽ biết em
    nào chưa đặt mã PIN để nhắm vào.
  */
  const wrong = badRequest('Mã PIN chưa đúng. Con thử lại nhé.')

  if (!(await verifyStudentPin(studentId, pin))) throw wrong

  const student = await getStudent(studentId)
  if (!student) throw wrong

  await startSession({ kind: 'child', studentId })
  return { mode: 'child', studentId }
})
