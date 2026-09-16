/**
 * Người lớn tự đăng ký.
 *
 * KHÔNG GỬI THƯ. Tài khoản tạo ra mang `email_confirm: true`, nên đăng ký xong
 * là vào được ngay, không phải đi tìm thư xác nhận trong hộp thư rác. Máy chủ
 * thư chỉ còn cần cho luồng quên mật khẩu (`/api/auth/forgot`).
 *
 * VAI do người đăng ký tự chọn, phụ huynh hoặc giáo viên - mỗi người một tài
 * khoản riêng, và chính họ biết mình là ai. Nhưng chỉ hai vai đó: `admin` KHÔNG
 * bao giờ ra được từ biểu mẫu công khai, vì đó là vai xoá được tài khoản người
 * khác. Quản trị viên chỉ phong được bởi một quản trị viên khác, hoặc bằng tay ở
 * SQL Editor cho người đầu tiên - xem supabase/README.md mục 4.1.
 */

import { db } from '@/server/db'
import { badRequest, readJson, requireEmail, requireText, route } from '@/server/http'
import { startSession } from '@/server/session'

/** Chỉ hai vai này ra được từ biểu mẫu công khai; mọi giá trị khác thành 'parent'. */
function publicRole(value: unknown): 'parent' | 'teacher' {
  return value === 'teacher' ? 'teacher' : 'parent'
}

export const POST = route(async (req) => {
  const body = await readJson<{
    email?: string
    password?: string
    displayName?: string
    role?: string
  }>(req)
  const email = requireEmail(body.email)
  const displayName = requireText(body.displayName, 'Tên của bạn')
  const password = requireText(body.password, 'Mật khẩu')
  const role = publicRole(body.role)

  if (password.length < 6) throw badRequest('Mật khẩu phải dài ít nhất 6 ký tự.')

  const { data, error } = await db().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role },
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
    .upsert({ id: data.user.id, role, display_name: displayName }, { onConflict: 'id' })

  await startSession({ kind: 'adult', userId: data.user.id })
  return { mode: 'adult', displayName, role }
})
