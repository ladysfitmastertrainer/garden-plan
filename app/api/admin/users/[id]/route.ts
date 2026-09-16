import { deleteAccount, updateAccount } from '@/server/accounts'
import { requireAdmin } from '@/server/guard'
import { readJson, requireEmail, requireText, route } from '@/server/http'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const caller = await requireAdmin()
  const body = await readJson<{ displayName?: string; email?: string; role?: string }>(req)

  await updateAccount(caller, id, {
    displayName: requireText(body.displayName, 'Tên hiển thị'),
    // Email không bắt buộc: bỏ trống nghĩa là giữ nguyên địa chỉ cũ.
    email: body.email ? requireEmail(body.email) : '',
    role: body.role,
  })
  return { ok: true }
})

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { id } = await ctx.params
  const caller = await requireAdmin()

  // Kéo theo lớp, học sinh và toàn bộ tiến độ học của từng em - khoá ngoại nối
  // tầng. Giao diện PHẢI hỏi lại kèm con số cụ thể trước khi gọi tới đây.
  await deleteAccount(caller, id)
  return { ok: true }
})
