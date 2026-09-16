/**
 * Người lớn tự đăng ký.
 *
 * Hai thay đổi so với bản Supabase, cả hai đều do có máy chủ mới làm được:
 *
 * 1. KHÔNG GỬI THƯ. Tài khoản tạo ra mang `email_confirm: true`, nên cả luồng
 *    không phụ thuộc vào SMTP - thứ vẫn hỏng thường xuyên nhất ở dự án này. Đăng
 *    ký xong là vào được ngay, không phải đi tìm thư trong hộp thư rác.
 *
 * 2. VAI LUÔN LÀ 'parent'. Bản cũ cho người đăng ký tự chọn "Phụ huynh" hay
 *    "Giáo viên" ngay trên biểu mẫu công khai - tức là ai cũng tự phong mình làm
 *    giáo viên, và giáo viên thì tạo được tài khoản cho người khác. Giáo viên
 *    thật nhận tài khoản từ quản trị viên của trường, đúng như
 *    `src/server/accounts.ts` mô tả.
 */

import { db } from '@/server/db'
import { badRequest, readJson, requireEmail, requireText, route } from '@/server/http'
import { startSession } from '@/server/session'

export const POST = route(async (req) => {
  const body = await readJson<{ email?: string; password?: string; displayName?: string }>(req)
  const email = requireEmail(body.email)
  const displayName = requireText(body.displayName, 'Tên của bạn')
  const password = requireText(body.password, 'Mật khẩu')

  if (password.length < 6) throw badRequest('Mật khẩu phải dài ít nhất 6 ký tự.')

  const { data, error } = await db().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: 'parent' },
  })

  if (error) {
    throw badRequest(
      /already/i.test(error.message)
        ? 'Email này đã có tài khoản rồi. Bấm "Đã có tài khoản? Đăng nhập" nhé.'
        : error.message,
    )
  }

  // Trigger `handle_new_user` dựng hồ sơ từ metadata; đặt lại cho chắc, phòng
  // khi trigger bỏ qua người dùng tạo bằng khoá quản trị.
  await db()
    .from('profiles')
    .upsert({ id: data.user.id, role: 'parent', display_name: displayName }, { onConflict: 'id' })

  await startSession({ kind: 'adult', userId: data.user.id })
  return { mode: 'adult', displayName, role: 'parent' }
})
