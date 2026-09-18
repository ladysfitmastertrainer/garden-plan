/**
 * Đấu trường lớp học, phía trình duyệt.
 *
 * Store này KHÔNG chứa luật chơi - không tính sát thương, không quyết ai thắng
 * lượt bấm, không biết ai thắng trận. Toàn bộ những việc ấy nằm ở máy chủ (xem
 * `src/server/pvp.ts`), vì chúng phải được xử bởi MỘT đồng hồ duy nhất cho cả
 * hai bên. Ở đây chỉ có: hỏi lại đều đặn, giữ bản sao mới nhất, và nhớ xem mình
 * đã bấm cho vòng này chưa.
 *
 * `answered` là trường duy nhất thực sự thuộc về máy này. Nó giữ cho nút trả
 * lời khoá lại ngay lúc trẻ bấm, không đợi máy chủ trả lời - nửa giây chờ ở đó
 * là nửa giây trẻ tưởng nút hỏng và bấm thêm lần nữa.
 */

import { create } from 'zustand'
import type { Grade, Subject } from '../content/types'
import type { LobbyEntry, PvpMatch } from '../data/pvp-types'
import {
  abandonMatch,
  clearPresence,
  fetchMatch,
  respondToMatch,
  sendBuzz,
  sendChallenge,
  sendPresence,
  toPvpQuestions,
  type PvpMatchQuestion,
} from '../data/pvp'

/** Chỉ số đội thú mang vào trận, gói lại cho gọn - hai chỗ cùng cần. */
export interface PvpSideStats {
  maxHp: number
  power: number
}

interface PvpState {
  lobby: LobbyEntry[]
  match: PvpMatch | null
  /** Đã bấm trả lời cho vòng hiện tại chưa. Thuộc về máy này, không về máy chủ. */
  answered: boolean
  /**
   * Trận trẻ đã bấm "Về bản đồ" để đóng lại.
   *
   * Cần nhớ vì máy chủ còn trả trận vừa xong về thêm một phút nữa - để lời từ
   * chối và tin thắng thua tới được cả bên đang chờ. Không có cái id này thì
   * đóng màn tổng kết xong, sáu giây sau nhịp tim kế tiếp dựng nó dậy lần nữa.
   */
  dismissedId: string | null
  /** Vòng mà `answered` đang nói tới - để tự mở khoá khi sang vòng mới. */
  answeredRound: number
  busy: boolean
  error: string | null

  heartbeat: (
    studentId: string,
    where: { subject: Subject; grade: Grade } | null,
    /** Ô đang đứng - để bạn cùng lớp vẽ được em ấy ra trên bản đồ vùng. */
    at?: { x: number; y: number } | null,
  ) => Promise<void>
  poll: (studentId: string) => Promise<void>
  challenge: (input: {
    studentId: string
    opponentId: string
    subject: Subject
    grade: Grade
    questions: PvpMatchQuestion[]
    stats: PvpSideStats
  }) => Promise<void>
  respond: (studentId: string, accept: boolean, stats?: PvpSideStats) => Promise<void>
  buzz: (studentId: string, correct: boolean) => Promise<void>
  leave: (studentId: string) => Promise<void>
  goOffline: (studentId: string) => Promise<void>
  /** Đóng màn tổng kết. Chỉ xoá bản sao trên máy này, không đụng tới máy chủ. */
  dismiss: () => void
  clearError: () => void
}

const message = (cause: unknown): string =>
  cause instanceof Error ? cause.message : 'Có gì đó không ổn. Thử lại nhé.'

/**
 * Nhận một bản trận mới về.
 *
 * Mở khoá nút trả lời KHI VÀ CHỈ KHI vòng đã sang số khác. Đặt thẳng
 * `answered: false` mỗi lần hỏi lại thì nút mở lại ngay ở nhịp kế tiếp, và trẻ
 * bấm được lần thứ hai cho cùng một câu - máy chủ có chặn, nhưng lúc đó trẻ đã
 * thấy nút sáng lên rồi tắt đi, tức là màn hình vừa nói dối một lần.
 */
function receive(state: PvpState, match: PvpMatch | null): Partial<PvpState> {
  // Trận này trẻ đã đóng rồi - đừng dựng nó dậy. Xem `dismissedId`.
  if (match && match.id === state.dismissedId) {
    return { match: null, answered: false, answeredRound: -1 }
  }
  if (!match) return { match: null, answered: false, answeredRound: -1 }
  const sameRound = state.answeredRound === match.round && state.match?.id === match.id
  return { match, answered: sameRound ? state.answered : false, answeredRound: match.round }
}

export const usePvp = create<PvpState>((set, get) => ({
  lobby: [],
  match: null,
  answered: false,
  answeredRound: -1,
  dismissedId: null,
  busy: false,
  error: null,

  async heartbeat(studentId, where, at) {
    try {
      const { lobby, match } = await sendPresence(studentId, where, at)
      set({ lobby, ...receive(get(), match ?? get().match) })
    } catch {
      /*
        Nuốt lỗi, và chỉ ở ĐÂY.

        Nhịp tim chạy vài giây một lần ở nền trong lúc trẻ đang đi cảnh. Một lần
        rớt mạng mà hiện lên một dải báo lỗi đỏ giữa màn hình bản đồ thì cứ mỗi
        lần sóng chập chờn là trẻ lại bị doạ, trong khi việc em ấy đang làm -
        đánh quái, học bài - chẳng liên quan gì tới đấu trường cả.

        Mọi hành động do trẻ CHỦ ĐỘNG bấm ở dưới đều báo lỗi ra màn hình.
      */
    }
  },

  async poll(studentId) {
    const { match } = get()
    if (!match) return
    try {
      set(receive(get(), await fetchMatch(match.id, studentId)))
    } catch {
      // Như trên: đây là nhịp chạy nền, không phải một cú bấm của trẻ.
    }
  },

  async challenge({ studentId, opponentId, subject, grade, questions, stats }) {
    set({ busy: true, error: null })
    try {
      const match = await sendChallenge({
        studentId,
        opponentId,
        subject,
        grade,
        questions: toPvpQuestions(questions) as unknown as PvpMatchQuestion[],
        maxHp: stats.maxHp,
        power: stats.power,
      })
      set({ ...receive(get(), match), busy: false })
    } catch (cause) {
      set({ busy: false, error: message(cause) })
    }
  },

  async respond(studentId, accept, stats) {
    const { match } = get()
    if (!match) return
    set({ busy: true, error: null })
    try {
      const next = await respondToMatch(match.id, studentId, accept, stats)
      // Người TỪ CHỐI thì bỏ luôn khỏi màn hình - với em ấy không còn gì để xem.
      // (Người thách thì vẫn nhận được tin, xem `api/pvp/presence`.)
      set(
        accept
          ? { ...receive(get(), next), busy: false }
          : { dismissedId: match.id, match: null, answered: false, answeredRound: -1, busy: false },
      )
    } catch (cause) {
      set({ busy: false, error: message(cause) })
    }
  },

  async buzz(studentId, correct) {
    const { match, answered } = get()
    if (!match || answered) return

    // Khoá nút NGAY, trước khi gửi. Lượt gửi này mất một quãng mạng, và trong
    // quãng ấy nút vẫn bấm được thì trẻ sẽ bấm tiếp.
    set({ answered: true, answeredRound: match.round })
    try {
      const result = await sendBuzz(match.id, studentId, match.round, correct)
      set(receive(get(), result.match))
    } catch (cause) {
      set({ error: message(cause) })
    }
  },

  async leave(studentId) {
    const { match } = get()
    if (!match) return
    try {
      await abandonMatch(match.id, studentId)
    } catch {
      // Bỏ dở mà không báo được cho máy chủ thì trận sẽ tự hết hạn ở đó. Không
      // có gì để trẻ làm với thông tin này, nên không hiện lên.
    }
    set({ dismissedId: match.id, match: null, answered: false, answeredRound: -1 })
  },

  async goOffline(studentId) {
    try {
      await clearPresence(studentId)
    } catch {
      // Dấu vết vị trí tự hết hạn sau 45 giây - xem `PRESENCE_TTL_MS`.
    }
    set({ lobby: [], match: null, answered: false, answeredRound: -1 })
  },

  dismiss() {
    set({
      dismissedId: get().match?.id ?? null,
      match: null,
      answered: false,
      answeredRound: -1,
    })
  },

  clearError() {
    set({ error: null })
  },
}))
