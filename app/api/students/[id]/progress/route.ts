/** Tiến độ học tập: mức thạo, kho đồ, phẩm chất, số chặng đã qua. */

import { requireReadStudent, requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { getProgress, saveProgress } from '@/server/students'
import type { StudentProgress } from '@/data/types'

type Ctx = { params: Promise<{ id: string }> }

export const GET = route<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params
  await requireReadStudent(id)
  return { progress: await getProgress(id) }
})

export const PUT = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  // Giáo viên bị chặn ở đây: xem được tiến độ, không sửa được.
  await requireWriteStudent(id)

  const body = await readJson<{ progress?: StudentProgress }>(req)
  if (!body.progress) throw badRequest('Thiếu tiến độ cần lưu.')

  await saveProgress(id, body.progress)
  return { ok: true }
})
