/**
 * Quản trị viên đặt lại mật khẩu hộ người khác.
 *
 * Nặng tay hơn tạo tài khoản mới: nó cắt đường vào của một tài khoản đang dùng.
 * Nên giáo viên KHÔNG làm được, dù giáo viên tạo được tài khoản.
 */

import { resetAccountPassword } from '@/server/accounts'
import { requireAdmin } from '@/server/guard'
import { route } from '@/server/http'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params
  await requireAdmin()

  // Mật khẩu hiện ra ĐÚNG MỘT LẦN trên màn hình người gọi.
  return { password: await resetAccountPassword(id) }
})
