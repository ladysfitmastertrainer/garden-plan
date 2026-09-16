import { deleteClass } from '@/server/classes'
import { requireOwnClass, requireStaff } from '@/server/guard'
import { route } from '@/server/http'

type Ctx = { params: Promise<{ id: string }> }

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params
  const adult = await requireStaff()
  await requireOwnClass(adult, id)

  // Xoá lớp KHÔNG xoá hồ sơ học sinh - `class_members` nối tầng, `students` thì
  // không. Dữ liệu học tập của các em vẫn còn nguyên.
  await deleteClass(id)
  return { ok: true }
})
