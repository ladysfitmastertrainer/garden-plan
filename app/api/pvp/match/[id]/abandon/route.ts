/** Bỏ dở giữa chừng. Bên kia thắng, và được biết vì sao mình thắng. */

import { requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { abandon } from '@/server/pvp'

type Ctx = { params: Promise<{ id: string }> }

export const POST = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const body = await readJson<{ studentId?: string }>(req)
  if (!body.studentId) throw badRequest('Thiếu hồ sơ học sinh.')
  await requireWriteStudent(body.studentId)

  return { match: await abandon(body.studentId, id) }
})
