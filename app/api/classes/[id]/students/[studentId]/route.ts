import { removeClassStudent } from '@/server/classes'
import { requireOwnClass, requireStaff } from '@/server/guard'
import { route } from '@/server/http'

type Ctx = { params: Promise<{ id: string; studentId: string }> }

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { id, studentId } = await ctx.params
  const adult = await requireStaff()
  await requireOwnClass(adult, id)

  await removeClassStudent(id, studentId)
  return { ok: true }
})
