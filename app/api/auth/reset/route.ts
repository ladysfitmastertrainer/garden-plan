/**
 * Đặt mật khẩu mới bằng token trong liên kết của thư.
 *
 * Luồng đầy đủ:
 *
 *   1. `/api/auth/forgot` bảo Supabase gửi thư.
 *   2. Người dùng bấm liên kết → Supabase xác minh → trả họ về
 *      `/dat-lai-mat-khau#access_token=...&type=recovery`.
 *   3. Trang đó đọc phần sau dấu `#` rồi POST token về đây.
 *   4. Ở đây: hỏi Supabase "token này là của ai", rồi đổi mật khẩu bằng khoá
 *      quản trị, rồi mở phiên của app cho họ.
 *
 * Token chỉ đi qua đúng hai chặng - từ Supabase về trình duyệt, từ trình duyệt
 * về máy chủ này - và KHÔNG được lưu lại ở đâu. Phần sau dấu `#` không bao giờ
 * được gửi kèm trong yêu cầu HTTP, nên nó cũng không nằm trong log máy chủ.
 *
 * Đổi xong thì đăng nhập luôn, không bắt gõ lại mật khẩu vừa đặt: người vừa mở
 * được hộp thư và vừa tự chọn mật khẩu thì đã chứng minh xong mình là ai, bắt
 * làm lại một lần nữa chỉ là một cái cửa thừa.
 */

import { db } from '@/server/db'
import { badRequest, readJson, requireText, route } from '@/server/http'
import { cleanRole } from '@/server/guard'
import { startSession } from '@/server/session'

export const POST = route(async (req) => {
  const body = await readJson<{ accessToken?: string; password?: string }>(req)
  const accessToken = requireText(body.accessToken, 'Liên kết đặt lại mật khẩu')
  const password = requireText(body.password, 'Mật khẩu mới')

  if (password.length < 6) throw badRequest('Mật khẩu phải dài ít nhất 6 ký tự.')

  const { data, error } = await db().auth.getUser(accessToken)
  if (error || !data.user) {
    // Token hết hạn, đã dùng rồi, hoặc bị sửa. Ba trường hợp, một lối ra duy nhất.
    throw badRequest(
      'Liên kết trong thư đã hết hạn hoặc đã được dùng rồi. Bấm "Quên mật khẩu?" để xin liên kết mới nhé.',
    )
  }

  const updated = await db().auth.admin.updateUserById(data.user.id, {
    password,
    // Xác nhận luôn email. Tài khoản đăng ký từ trước có thể chưa bao giờ bấm
    // liên kết xác nhận; người vừa mở được hộp thư này thì đã chứng minh xong.
    email_confirm: true,
  })
  if (updated.error) {
    throw badRequest(
      /same as the old|should be different/i.test(updated.error.message)
        ? 'Mật khẩu mới phải khác mật khẩu cũ.'
        : updated.error.message,
    )
  }

  await startSession({ kind: 'adult', userId: data.user.id })

  const { data: profile } = await db()
    .from('profiles')
    .select('display_name, role')
    .eq('id', data.user.id)
    .maybeSingle()

  return {
    mode: 'adult',
    displayName: (profile?.display_name as string | undefined) ?? data.user.email ?? '',
    role: cleanRole(profile?.role),
  }
})
