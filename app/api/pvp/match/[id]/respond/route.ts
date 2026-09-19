/** Nhận lời thách đấu, hoặc từ chối. */

import { requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { respond } from '@/server/pvp'
import { getPet } from '@/content/pets'

type Ctx = { params: Promise<{ id: string }> }

interface Body {
  studentId?: string
  accept?: boolean
  maxHp?: number
  power?: number
  pet?: unknown
}

export const POST = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const body = await readJson<Body>(req)
  if (!body.studentId) throw badRequest('Thiếu hồ sơ học sinh.')
  await requireWriteStudent(body.studentId)

  if (!body.accept) return { match: await respond(body.studentId, id, false) }

  const maxHp = Math.round(body.maxHp ?? 0)
  if (!Number.isFinite(maxHp) || maxHp <= 0) throw badRequest('Máu đội thú không hợp lệ.')
  // Chặn hai đầu y như lúc thách đấu - xem ghi chú ở `api/pvp/challenge`.
  const power = Math.min(5, Math.max(0.1, Number(body.power ?? 1)))

  /*
    Id con thú được kiểm bằng chính bộ thú của game.

    Cùng lẽ với mã câu nói: một chuỗi lạ lọt vào đây rồi sẽ được tra ra sprite
    ở máy bên kia, và tra hụt thì con thú biến mất khỏi sân đấu. Kiểm ngay tại
    cửa thì phần còn lại của hệ thống không phải phòng thủ thêm lần nào nữa.
  */
  const pet = typeof body.pet === 'string' && getPet(body.pet) ? body.pet : null

  return { match: await respond(body.studentId, id, true, { maxHp, power, pet }) }
})
