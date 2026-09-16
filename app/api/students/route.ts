/**
 * Danh sách hồ sơ học sinh, và tạo hồ sơ mới.
 *
 * Trẻ trên máy dùng chung CHỈ thấy hồ sơ của chính mình. Trước đây RLS lo việc
 * này; giờ là hai nhánh `if` ở ngay đây, đọc được bằng mắt thường.
 */

import { requireAdult } from '@/server/guard'
import { badRequest, forbidden, readJson, requireText, route } from '@/server/http'
import { readSession } from '@/server/session'
import { createStudent, getStudent, listStudentsFor } from '@/server/students'
import { unauthorized } from '@/server/http'
import type { Grade } from '@/content/types'

function requireGrade(value: unknown): Grade {
  const grade = Number(value)
  if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
    throw badRequest('Lớp phải là một số từ 1 đến 5.')
  }
  return grade as Grade
}

export const GET = route(async () => {
  const session = await readSession()
  if (!session) throw unauthorized()

  if (session.kind === 'child') {
    const student = await getStudent(session.studentId)
    return { students: student ? [student] : [] }
  }

  return { students: await listStudentsFor(session.userId) }
})

export const POST = route(async (req) => {
  const session = await readSession()
  if (!session) throw unauthorized()
  // Trẻ không tự tạo thêm hồ sơ cho mình được.
  if (session.kind === 'child') throw forbidden('Việc này chỉ người lớn làm được.')

  const adult = await requireAdult()
  const body = await readJson<{ name?: string; avatar?: string; grade?: unknown }>(req)

  return {
    student: await createStudent(adult.userId, {
      name: requireText(body.name, 'Tên'),
      avatar: requireText(body.avatar, 'Ảnh đại diện'),
      grade: requireGrade(body.grade),
    }),
  }
})
