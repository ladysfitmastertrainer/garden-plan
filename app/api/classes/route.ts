/** Lớp học của giáo viên đang đăng nhập. */

import { createClass, listClasses } from '@/server/classes'
import { requireStaff } from '@/server/guard'
import { readJson, requireText, route } from '@/server/http'

export const GET = route(async () => {
  const adult = await requireStaff()
  return { classes: await listClasses(adult.userId) }
})

export const POST = route(async (req) => {
  const adult = await requireStaff()
  const body = await readJson<{ name?: string }>(req)
  return { class: await createClass(adult.userId, requireText(body.name, 'Tên lớp')) }
})
