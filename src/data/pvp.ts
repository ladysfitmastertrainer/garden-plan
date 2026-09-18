/**
 * Cửa gọi `/api/pvp`. Mỏng có chủ ý: luật chơi nằm ở máy chủ, không ở đây.
 *
 * Kiểu dữ liệu lấy từ `data/pvp-types.ts` - CÙNG bản khai mà máy chủ dùng, nên
 * đổi hình dạng một trường ở một phía là TypeScript báo ngay ở phía kia, thay vì
 * để một trường trống lặng lẽ chạy tới tận màn hình. Xem đầu file ấy để biết vì
 * sao bản khai không nằm trong `src/server/`.
 */

import type { Grade, Question, Subject } from '../content/types'
import type { LobbyEntry, PvpMatch, PvpQuestion } from './pvp-types'
import { request } from './request'

/** Câu hỏi trong trận PVP - đúng kiểu câu hỏi của game, đi vòng qua máy chủ. */
export type PvpMatchQuestion = Question

/** Bộ câu hỏi của một trận, đọc như câu hỏi bình thường của game. */
export function questionsOf(match: PvpMatch): PvpMatchQuestion[] {
  return match.questions as unknown as PvpMatchQuestion[]
}

/** Gói một bộ câu hỏi của game để gửi lên máy chủ. */
export function toPvpQuestions(questions: PvpMatchQuestion[]): PvpQuestion[] {
  return questions as unknown as PvpQuestion[]
}

/** Một nhịp tim: báo chỗ đang đứng, nhận lại bạn bè và trận đang chờ. */
export async function sendPresence(
  studentId: string,
  where: { subject: Subject; grade: Grade } | null,
  /** Ô đang đứng trong vùng đất. Bỏ trống khi đang ở bản đồ thế giới. */
  at?: { x: number; y: number } | null,
): Promise<{ lobby: LobbyEntry[]; match: PvpMatch | null }> {
  return request('/api/pvp/presence', {
    method: 'POST',
    body: {
      studentId,
      subject: where?.subject ?? null,
      grade: where?.grade ?? null,
      x: at?.x ?? null,
      y: at?.y ?? null,
    },
  })
}

export async function clearPresence(studentId: string): Promise<void> {
  await request('/api/pvp/presence', { method: 'DELETE', body: { studentId } })
}

export async function sendChallenge(input: {
  studentId: string
  opponentId: string
  subject: Subject
  grade: Grade
  questions: PvpMatchQuestion[]
  maxHp: number
  power: number
}): Promise<PvpMatch> {
  const { match } = await request<{ match: PvpMatch }>('/api/pvp/challenge', {
    method: 'POST',
    body: input,
  })
  return match
}

export async function fetchMatch(matchId: string, studentId: string): Promise<PvpMatch | null> {
  const { match } = await request<{ match: PvpMatch | null }>(`/api/pvp/match/${matchId}`, {
    query: { studentId },
  })
  return match
}

export async function respondToMatch(
  matchId: string,
  studentId: string,
  accept: boolean,
  side?: { maxHp: number; power: number },
): Promise<PvpMatch> {
  const { match } = await request<{ match: PvpMatch }>(`/api/pvp/match/${matchId}/respond`, {
    method: 'POST',
    body: { studentId, accept, ...side },
  })
  return match
}

export async function sendBuzz(
  matchId: string,
  studentId: string,
  round: number,
  correct: boolean,
): Promise<{ match: PvpMatch; won: boolean | null }> {
  return request(`/api/pvp/match/${matchId}/buzz`, {
    method: 'POST',
    body: { studentId, round, correct },
  })
}

export async function abandonMatch(matchId: string, studentId: string): Promise<PvpMatch> {
  const { match } = await request<{ match: PvpMatch }>(`/api/pvp/match/${matchId}/abandon`, {
    method: 'POST',
    body: { studentId },
  })
  return match
}
