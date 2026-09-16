/** Lưu và xoá một hồ sơ học sinh. */

import { requireSession, requireWriteStudent } from '@/server/guard'
import { badRequest, forbidden, notFound, readJson, route } from '@/server/http'
import { deleteStudent, getStudent, saveStudent } from '@/server/students'
import type { StudentProfile } from '@/data/types'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  await requireWriteStudent(id)

  const body = await readJson<{ student?: StudentProfile }>(req)
  const student = body.student
  if (!student) throw badRequest('Thiếu hồ sơ cần lưu.')

  // Id lấy từ ĐƯỜNG DẪN - cái vừa được kiểm quyền. Nếu tin id trong thân yêu cầu
  // thì một người có quyền ghi hồ sơ A sẽ ghi đè được lên hồ sơ B.
  await saveStudent({ ...student, id })
  return { ok: true }
})

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params
  const session = await requireSession()
  // Chỉ chủ hồ sơ xoá được - trẻ không tự xoá hồ sơ của mình, giống hệt policy
  // `students_delete` trong RLS.
  if (session.kind === 'child') throw forbidden('Con không xoá được hồ sơ của mình.')

  const student = await getStudent(id)
  if (!student) throw notFound('Không tìm thấy hồ sơ học sinh này.')
  await requireWriteStudent(id)

  await deleteStudent(id)
  return { ok: true }
})
