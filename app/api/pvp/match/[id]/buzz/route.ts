/**
 * "Em trả lời xong rồi."
 *
 * Máy gửi lên ĐÚNG hay SAI cùng id chiêu đã chọn. Thời gian thì KHÔNG - máy chủ
 * tự đo, vì đó là thứ duy nhất khiến cuộc đua công bằng. Xem đầu
 * `src/server/pvp.ts`.
 *
 * Id chiêu KHÔNG kiểm ở đây, và đó là cố ý: chỗ kiểm nó phải là chỗ biết bên này
 * đã khai mang theo chiêu gì và chiêu cuối còn hồi mấy vòng - tức `spellFor`
 * trong `server/pvp.ts`. Kiểm hai nơi thì có ngày hai nơi kiểm khác nhau.
 */

import { requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { buzz } from '@/server/pvp'

type Ctx = { params: Promise<{ id: string }> }

interface Body {
  studentId?: string
  round?: number
  correct?: boolean
  spellId?: unknown
}

export const POST = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const body = await readJson<Body>(req)
  if (!body.studentId) throw badRequest('Thiếu hồ sơ học sinh.')
  if (typeof body.round !== 'number') throw badRequest('Thiếu số vòng.')
  await requireWriteStudent(body.studentId)

  const spellId = typeof body.spellId === 'string' ? body.spellId : null
  return buzz(body.studentId, id, body.round, body.correct === true, spellId)
})
