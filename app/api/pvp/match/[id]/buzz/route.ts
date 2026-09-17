/**
 * "Em trả lời xong rồi."
 *
 * Máy chỉ gửi lên ĐÚNG hay SAI. Thời gian thì KHÔNG - máy chủ tự đo, vì đó là
 * thứ duy nhất khiến cuộc đua công bằng. Xem đầu `src/server/pvp.ts`.
 */

import { requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { buzz } from '@/server/pvp'

type Ctx = { params: Promise<{ id: string }> }

interface Body {
  studentId?: string
  round?: number
  correct?: boolean
}

export const POST = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const body = await readJson<Body>(req)
  if (!body.studentId) throw badRequest('Thiếu hồ sơ học sinh.')
  if (typeof body.round !== 'number') throw badRequest('Thiếu số vòng.')
  await requireWriteStudent(body.studentId)

  return buzz(body.studentId, id, body.round, body.correct === true)
})
