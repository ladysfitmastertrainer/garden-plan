/** Học sinh trong một lớp: xem danh sách, thêm em mới. */

import { addClassStudent, listClassStudents } from '@/server/classes'
import { requireOwnClass, requireStaff } from '@/server/guard'
import { badRequest, readJson, requireText, route } from '@/server/http'
import type { Grade } from '@/content/types'

type Ctx = { params: Promise<{ id: string }> }

function requireGrade(value: unknown): Grade {
  const grade = Number(value)
  if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
    throw badRequest('Lớp phải là một số từ 1 đến 5.')
  }
  return grade as Grade
}

export const GET = route<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params
  const adult = await requireStaff()
  await requireOwnClass(adult, id)
  return { students: await listClassStudents(id) }
})

export const POST = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const adult = await requireStaff()
  await requireOwnClass(adult, id)

  const body = await readJson<{ name?: string; avatar?: string; grade?: unknown }>(req)
  return {
    student: await addClassStudent(adult.userId, id, {
      name: requireText(body.name, 'Tên'),
      avatar: requireText(body.avatar, 'Ảnh đại diện'),
      grade: requireGrade(body.grade),
    }),
  }
})
