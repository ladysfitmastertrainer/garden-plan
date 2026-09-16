/**
 * Đặt mã PIN cho một học sinh - bắt buộc trước khi em đó dùng máy chung ở lớp.
 *
 * Chỉ người lớn có quyền ghi hồ sơ mới đặt được. Trẻ KHÔNG tự đổi mã của mình:
 * đổi được nghĩa là một em mượn được máy lúc bạn quên đăng xuất sẽ khoá luôn bạn
 * ra ngoài.
 */

import { setStudentPin } from '@/server/classes'
import { requireWriteStudent } from '@/server/guard'
import { forbidden, readJson, requireText, route } from '@/server/http'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const session = await requireWriteStudent(id)
  if (session.kind === 'child') throw forbidden('Con không tự đổi được mã PIN.')

  const body = await readJson<{ pin?: string }>(req)
  await setStudentPin(id, requireText(body.pin, 'Mã PIN'))
  return { ok: true }
})
