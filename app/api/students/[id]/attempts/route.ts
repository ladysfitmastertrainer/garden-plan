/** Nhật ký từng câu trả lời - nguồn dữ liệu cho màn hình phụ huynh và giáo viên. */

import { requireReadStudent, requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { listAttempts, recordAttempts } from '@/server/students'
import type { StoredAttempt } from '@/data/types'

type Ctx = { params: Promise<{ id: string }> }

/** Trần số dòng trả về một lần. Màn hình phụ huynh không vẽ nổi nhiều hơn thế. */
const MAX_LIMIT = 2000

export const GET = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  await requireReadStudent(id)

  const asked = Number(new URL(req.url).searchParams.get('limit') ?? 500)
  const limit = Number.isFinite(asked) ? Math.min(Math.max(1, asked), MAX_LIMIT) : 500

  return { attempts: await listAttempts(id, limit) }
})

export const POST = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  await requireWriteStudent(id)

  const body = await readJson<{ attempts?: StoredAttempt[] }>(req)
  if (!Array.isArray(body.attempts)) throw badRequest('Thiếu danh sách câu trả lời.')

  await recordAttempts(id, body.attempts)
  return { ok: true }
})
