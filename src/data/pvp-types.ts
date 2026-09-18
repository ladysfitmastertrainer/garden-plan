/**
 * Hình dạng dữ liệu của đấu trường lớp học, dùng chung cho CẢ HAI phía.
 *
 * Nằm ở `data/` chứ không ở `server/` vì một lý do rất cụ thể: `src/server/*`
 * mở đầu bằng `import 'server-only'`, và nhập bất cứ thứ gì từ đó vào mã chạy
 * trong trình duyệt là build của Next hỏng ngay tại chỗ - cái chốt cửa ấy có
 * mặt chính là để khoá `service_role` không bao giờ lọt xuống máy trẻ.
 *
 * Về lý thuyết `import type` bị xoá sạch lúc biên dịch nên không chạm vào chốt.
 * Nhưng "về lý thuyết" là một chỗ dựa mỏng cho một thứ mà khi hỏng thì hỏng cả
 * bản dựng, nên kiểu dữ liệu ở đây, và cả hai phía cùng nhập vào.
 */

import type { Grade, Question, Subject } from '../content/types'

export type PvpStatus = 'pending' | 'active' | 'finished' | 'declined' | 'abandoned'

/**
 * Một câu hỏi trong trận PVP.
 *
 * Máy chủ chỉ đọc `id` và `difficulty`; phần còn lại đi thẳng về máy bên kia
 * nguyên vẹn. Giao diện thì đọc nó như một `Question` đầy đủ - xem `asQuestion`.
 */
export interface PvpQuestion {
  id: string
  difficulty: number
  [key: string]: unknown
}

/** Đọc một câu hỏi PVP như câu hỏi bình thường của game. */
export function asQuestion(question: PvpQuestion): Question {
  return question as unknown as Question
}

export interface PvpSide {
  studentId: string
  name: string
  avatar: string
  hp: number
  maxHp: number
  power: number
}

/** Một vòng đã ngã ngũ. Hai máy đọc cùng danh sách này nên kể cùng một chuyện. */
export interface PvpEvent {
  round: number
  /** Ai giành được quyền tấn công. null nghĩa là cả hai cùng trượt. */
  attackerId: string | null
  damage: number
  /** Ai bấm trước ở vòng này, dù đúng hay sai. */
  firstId: string | null
  firstCorrect: boolean
}

export interface PvpMatch {
  id: string
  status: PvpStatus
  subject: Subject
  grade: Grade
  round: number
  questions: PvpQuestion[]
  challenger: PvpSide
  opponent: PvpSide
  /** Ai đã bấm ở vòng NÀY - bên kia thấy "bạn ấy trả lời rồi", không thấy đúng sai. */
  buzzed: string[]
  events: PvpEvent[]
  winnerId: string | null
  /** Mốc bắt đầu vòng hiện tại theo đồng hồ MÁY CHỦ, epoch ms. */
  roundStartedAt: number
}

export interface LobbyEntry {
  studentId: string
  name: string
  avatar: string
  /** Đảo bạn ấy đang đứng. null nghĩa là đang ở bản đồ thế giới. */
  subject: Subject | null
  grade: Grade | null
  /**
   * Ô bạn ấy đang đứng trong vùng đất đó. null khi đang ở bản đồ thế giới.
   *
   * Toạ độ Ô, không phải điểm ảnh: bản đồ được sinh lại từ hạt giống trên từng
   * máy nên hai máy có cùng lưới ô, còn cỡ điểm ảnh thì mỗi máy một khác tuỳ
   * màn hình. Nhờ vậy 'ô số 7 hàng 12' nghĩa như nhau ở cả hai bên.
   */
  x: number | null
  y: number | null
  /** Đang bận một trận khác - thách nữa cũng không nhận được. */
  busy: boolean
}

/** Hai bên của một trận, đã xếp theo "tôi" và "bạn ấy". */
export function sidesOf(
  match: PvpMatch,
  studentId: string,
): { me: PvpSide; foe: PvpSide } | null {
  if (match.challenger.studentId === studentId) {
    return { me: match.challenger, foe: match.opponent }
  }
  if (match.opponent.studentId === studentId) {
    return { me: match.opponent, foe: match.challenger }
  }
  return null
}

/**
 * Giờ cho mỗi câu trong trận PVP, mili giây.
 *
 * Ngắn hơn hẳn mọi trận đánh quái, và đó là cả điểm của chế độ này: ở đây không
 * có chỗ cho việc ngồi nhẩm: hai bên cùng nhìn một câu hỏi, ai chắc bài hơn thì
 * tay nhanh hơn. Lớp 1-2 được nới ra vì các em còn đánh vần cả đề bài.
 */
export function pvpTimeLimitMs(grade: Grade): number {
  return grade <= 2 ? 18_000 : 12_000
}
