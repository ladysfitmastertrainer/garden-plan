/**
 * Đăng nhập của người lớn.
 *
 * Supabase Auth vẫn là nơi giữ mật khẩu - không đụng tới, nên KHÔNG ai phải đặt
 * lại mật khẩu vì lần chuyển này. Khác là ở chỗ token nó trả về không bao giờ
 * rời khỏi tiến trình Node: máy chủ kiểm mật khẩu xong thì vứt token đi và tự
 * phát một cookie `httpOnly` của riêng mình (xem `src/server/session.ts`).
 */

import { authClient } from '@/server/db'
import { badRequest, readJson, requireEmail, requireText, route, unauthorized } from '@/server/http'
import { startSession } from '@/server/session'
import { requireAdult } from '@/server/guard'

/**
 * Lỗi của Supabase trả về bằng tiếng Anh, mà người đọc màn hình này là phụ huynh
 * và thầy cô Việt Nam. Chỉ dịch những câu HAY GẶP - còn lại giữ nguyên còn hơn
 * đoán sai thành một câu tiếng Việt vô nghĩa.
 */
function translate(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return 'Email hoặc mật khẩu chưa đúng.'
  if (/email not confirmed/i.test(raw)) {
    return 'Tài khoản chưa được xác nhận. Nhờ quản trị viên đặt lại mật khẩu hộ - cách đó xác nhận luôn tài khoản.'
  }
  if (/too many requests|rate limit/i.test(raw)) {
    return 'Thử quá nhiều lần rồi. Đợi một lát rồi đăng nhập lại nhé.'
  }
  return raw
}

export const POST = route(async (req) => {
  const body = await readJson<{ email?: string; password?: string }>(req)
  const email = requireEmail(body.email)
  const password = requireText(body.password, 'Mật khẩu')

  const { data, error } = await authClient().auth.signInWithPassword({ email, password })
  if (error) throw badRequest(translate(error.message))
  if (!data.user) throw unauthorized('Email hoặc mật khẩu chưa đúng.')

  await startSession({ kind: 'adult', userId: data.user.id })

  // Trả về luôn danh tính, để trình duyệt không phải gọi thêm một vòng
  // `/api/auth/session` ngay sau khi đăng nhập xong.
  const adult = await requireAdult()
  return { mode: 'adult', displayName: adult.displayName, role: adult.role }
})
