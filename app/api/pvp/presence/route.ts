/**
 * "Em đang ở đây" - nhịp tim của màn bản đồ.
 *
 * Trả về LUÔN cả danh sách bạn đang chơi lẫn trận đấu đang chờ, trong cùng một
 * lượt. Tách ra thành ba đường riêng thì mỗi nhịp là ba vòng mạng cho mỗi máy
 * tính bảng - ba mươi máy trong một lớp thành chín mươi, và chúng đập vào máy
 * chủ cùng lúc vì cả lớp bật máy cùng một lúc.
 */

import { requireWriteStudent } from '@/server/guard'
import { badRequest, readJson, route } from '@/server/http'
import { clearPresence, currentMatch, heartbeat, lastFinishedMatch } from '@/server/pvp'
import { SUBJECTS, type Grade, type Subject } from '@/content/types'
import { isChatLine } from '@/content/chat'

interface Body {
  studentId?: string
  /** Đảo đang đứng. null nghĩa là đang ở bản đồ thế giới. */
  subject?: Subject | null
  grade?: number | null
  /** Ô đang đứng trong vùng đất đó. */
  x?: number | null
  y?: number | null
  /** Mã câu vừa nói. Chỉ MÃ, không bao giờ là chữ do trẻ gõ. */
  emote?: unknown
}

export const POST = route(async (req) => {
  const body = await readJson<Body>(req)
  const studentId = body.studentId
  if (!studentId) throw badRequest('Thiếu hồ sơ học sinh.')

  // Cùng một cửa phân quyền với mọi dữ liệu học tập khác: chính em đó, hoặc
  // người lớn sở hữu hồ sơ. Giáo viên cố ý bị loại - thầy cô xem được tiến độ
  // nhưng không đứng thay chỗ học sinh trong một trận đấu.
  await requireWriteStudent(studentId)

  const subject = body.subject && SUBJECTS.includes(body.subject) ? body.subject : null
  const grade =
    typeof body.grade === 'number' && body.grade >= 1 && body.grade <= 5
      ? (body.grade as Grade)
      : null

  // Đứng ở bản đồ thế giới thì môn và lớp cùng rỗng - không có "đứng ở đảo Toán
  // nhưng không biết lớp mấy".
  // Toạ độ ô chỉ nhận số nguyên không âm. Không phải để chặn kẻ gian - một ô
  // sai chỉ vẽ bạn mình đứng lệch chỗ - mà để một giá trị rác không rơi vào cột
  // kiểu số nguyên và làm hỏng cả lượt ghi, kéo theo mất luôn vị trí của em ấy.
  const tile = (value: unknown): number | null =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 1000 ? value : null

  /*
    MÃ CÂU ĐƯỢC KIỂM Ở ĐÂY, và đây là chỗ DUY NHẤT nó được kiểm.

    Máy trẻ gửi lên một chuỗi, nhưng chỉ chuỗi nào có trong bảng câu đóng
    (`content/chat.ts`) mới đi tiếp; mọi thứ khác thành rỗng. Nhờ vậy dù ai
    đó sửa mã trong trình duyệt để gửi một câu tự nghĩ ra, thứ tới được màn
    hình đứa trẻ khác vẫn chỉ là một trong tám câu đã duyệt - hoặc không gì
    cả. Đó là cả lý do tính năng này không cần ai ngồi kiểm duyệt.
  */
  const emote = isChatLine(body.emote) ? body.emote : null

  const where =
    subject !== null && grade !== null
      ? { subject, grade, x: tile(body.x), y: tile(body.y), emote }
      : { subject: null, grade: null, x: null, y: null, emote }

  /*
    Trả về cả trận VỪA XONG, không chỉ trận đang chạy.

    Nếu không thì lời từ chối không bao giờ tới nơi: bạn kia bấm "để lúc khác",
    trận chuyển sang 'declined' và rơi khỏi `currentMatch`, còn máy của người
    thách thì vẫn hiện khung "Đang chờ..." cho tới khi có ai đó tắt app đi.
  */
  const lobby = await heartbeat(studentId, where)
  const match = (await currentMatch(studentId)) ?? (await lastFinishedMatch(studentId))
  return { lobby, match }
})

export const DELETE = route(async (req) => {
  const body = await readJson<Body>(req)
  if (!body.studentId) throw badRequest('Thiếu hồ sơ học sinh.')
  await requireWriteStudent(body.studentId)

  await clearPresence(body.studentId)
  return { ok: true }
})
