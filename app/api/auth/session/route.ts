/**
 * "Tôi là ai?" - câu hỏi đầu tiên trình duyệt hỏi mỗi lần mở app.
 *
 * Không bao giờ trả lỗi 401. Chưa đăng nhập là một câu trả lời hợp lệ, không
 * phải một lỗi: màn hình đăng nhập cần biết điều đó để hiện ra.
 */

import { requireAdult } from '@/server/guard'
import { route } from '@/server/http'
import { readSession } from '@/server/session'

export const GET = route(async () => {
  const session = await readSession()
  if (!session) return { mode: 'signed-out' }

  if (session.kind === 'child') return { mode: 'child', studentId: session.studentId }

  const adult = await requireAdult()
  return { mode: 'adult', displayName: adult.displayName, role: adult.role }
})
