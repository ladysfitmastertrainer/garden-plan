/**
 * Người lớn tự đổi mật khẩu của chính mình.
 *
 * Phải nhập lại mật khẩu CŨ. Cookie phiên sống 30 ngày, nên một máy tính bỏ quên
 * ở phòng giáo viên vẫn đang đăng nhập; không hỏi mật khẩu cũ thì ai đi ngang
 * cũng đổi được và khoá luôn chủ tài khoản ra ngoài.
 *
 * Quên mật khẩu thì KHÔNG có luồng tự phục hồi qua email - quản trị viên đặt lại
 * hộ ở trang quản trị. Xem ghi chú trong supabase/README.md về lý do.
 */

import { authClient, db } from '@/server/db'
import { requireAdult } from '@/server/guard'
import { badRequest, readJson, requireText, route } from '@/server/http'

export const POST = route(async (req) => {
  const adult = await requireAdult()
  const body = await readJson<{ currentPassword?: string; newPassword?: string }>(req)
  const currentPassword = requireText(body.currentPassword, 'Mật khẩu hiện tại')
  const newPassword = requireText(body.newPassword, 'Mật khẩu mới')

  if (newPassword.length < 6) throw badRequest('Mật khẩu mới phải dài ít nhất 6 ký tự.')
  if (newPassword === currentPassword) throw badRequest('Mật khẩu mới phải khác mật khẩu cũ.')

  const { data: user } = await db().auth.admin.getUserById(adult.userId)
  const email = user.user?.email
  if (!email) throw badRequest('Tài khoản này không có email nên không đổi được mật khẩu.')

  const { error } = await authClient().auth.signInWithPassword({ email, password: currentPassword })
  if (error) throw badRequest('Mật khẩu hiện tại chưa đúng.')

  const updated = await db().auth.admin.updateUserById(adult.userId, { password: newPassword })
  if (updated.error) throw badRequest(updated.error.message)

  return { ok: true }
})
