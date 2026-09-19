/** Thách đấu một bạn cùng lớp đang đứng cùng đảo. */

import { requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { challenge, type PvpQuestion } from '@/server/pvp'
import { SUBJECTS, type Grade, type Subject } from '@/content/types'
import { getPet } from '@/content/pets'

interface Body {
  studentId?: string
  opponentId?: string
  subject?: Subject
  grade?: number
  questions?: PvpQuestion[]
  maxHp?: number
  power?: number
  pet?: unknown
}

/**
 * Số câu tối đa của một trận PVP.
 *
 * Có trần vì bộ câu hỏi do MÁY CỦA NGƯỜI THÁCH soạn rồi gửi lên. Nội dung thì
 * không có gì phải giấu - cả ngân hàng câu hỏi vốn nằm sẵn trong gói tải về của
 * mọi máy - nhưng kích thước thì phải chặn, nếu không một yêu cầu hỏng (hoặc
 * nghịch ngợm) nhét được một mảng khổng lồ vào cơ sở dữ liệu.
 */
const MAX_QUESTIONS = 20

export const POST = route(async (req) => {
  const body = await readJson<Body>(req)
  const { studentId, opponentId, subject, grade } = body

  if (!studentId || !opponentId) throw badRequest('Thiếu hồ sơ học sinh.')
  if (!subject || !SUBJECTS.includes(subject)) throw badRequest('Môn học không hợp lệ.')
  if (typeof grade !== 'number' || grade < 1 || grade > 5) throw badRequest('Lớp không hợp lệ.')

  const questions = body.questions ?? []
  if (questions.length === 0) throw badRequest('Trận đấu phải có ít nhất một câu hỏi.')
  if (questions.length > MAX_QUESTIONS) throw badRequest('Trận đấu dài quá.')

  const maxHp = Math.round(body.maxHp ?? 0)
  if (!Number.isFinite(maxHp) || maxHp <= 0) throw badRequest('Máu đội thú không hợp lệ.')

  // Chặn cả hai đầu: sức đánh do máy khai, nên một con số vô lý ở đây là một
  // đòn một phát chết người ở bên kia.
  const power = Math.min(5, Math.max(0.1, Number(body.power ?? 1)))

  /*
    Id con thú được kiểm bằng chính bộ thú của game.

    Cùng lẽ với mã câu nói: một chuỗi lạ lọt vào đây rồi sẽ được tra ra sprite
    ở máy bên kia, và tra hụt thì con thú biến mất khỏi sân đấu. Kiểm ngay tại
    cửa thì phần còn lại của hệ thống không phải phòng thủ thêm lần nào nữa.
  */
  const pet = typeof body.pet === 'string' && getPet(body.pet) ? body.pet : null

  await requireWriteStudent(studentId)

  return {
    match: await challenge(studentId, {
      opponentId,
      subject,
      grade: grade as Grade,
      questions,
      maxHp,
      power,
      pet,
    }),
  }
})
