/**
 * Hàng đợi gửi lên server (outbox).
 *
 * Trẻ chơi offline thì mọi thay đổi vẫn ghi xuống máy ngay, đồng thời xếp vào
 * hàng đợi này. Khi có mạng trở lại thì đẩy lên Supabase theo đúng thứ tự.
 *
 * Việc rút gọn hàng đợi (`compactOutbox`) rất quan trọng: một buổi chơi 20 phút
 * offline có thể sinh ra hàng trăm lần lưu tiến độ, nhưng chỉ lần cuối mới có ý
 * nghĩa. Nhật ký trả lời thì ngược lại - phải giữ đủ, vì đó là dữ liệu gốc.
 *
 * Mỗi mục mang một `id` riêng để `push()` xoá được ĐÚNG những mục đã gửi xong.
 * Nếu xoá cả hàng đợi thì những mục được xếp vào trong lúc đang gửi sẽ biến mất
 * mà chưa bao giờ lên tới server.
 */

import { get, set } from 'idb-keyval'
import type { StoredAttempt, StudentProfile, StudentProgress } from './types'

export type OutboxOp =
  | { kind: 'saveStudent'; student: StudentProfile }
  | { kind: 'saveProgress'; studentId: string; progress: StudentProgress }
  | { kind: 'attempts'; attempts: StoredAttempt[] }
  | { kind: 'deleteStudent'; studentId: string }

export interface OutboxEntry {
  id: string
  op: OutboxOp
}

const OUTBOX_KEY = 'hvtt:outbox'

let counter = 0

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `op_${Date.now()}_${counter++}`
}

/**
 * Rút gọn hàng đợi mà không mất dữ liệu:
 *  - mỗi học sinh chỉ giữ LẦN LƯU CUỐI của hồ sơ và của tiến độ;
 *  - toàn bộ nhật ký trả lời được gộp lại thành một lô, khử trùng lặp;
 *  - học sinh đã bị xoá thì bỏ hết thao tác liên quan, chỉ giữ lệnh xoá.
 */
export function compactOutbox(entries: OutboxEntry[]): OutboxEntry[] {
  const deleted = new Map<string, string>() // studentId -> id của lệnh xoá
  for (const entry of entries) {
    if (entry.op.kind === 'deleteStudent') deleted.set(entry.op.studentId, entry.id)
  }

  const lastStudent = new Map<string, OutboxEntry>()
  const lastProgress = new Map<string, OutboxEntry>()
  const attempts: StoredAttempt[] = []
  let attemptsId: string | null = null

  for (const entry of entries) {
    const { op } = entry
    switch (op.kind) {
      case 'saveStudent':
        if (!deleted.has(op.student.id)) lastStudent.set(op.student.id, entry)
        break
      case 'saveProgress':
        if (!deleted.has(op.studentId)) lastProgress.set(op.studentId, entry)
        break
      case 'attempts':
        for (const attempt of op.attempts) {
          if (!deleted.has(attempt.studentId)) attempts.push(attempt)
        }
        // Lô gộp mang id của mục cuối cùng góp vào, để push() nhận diện được.
        attemptsId = entry.id
        break
      case 'deleteStudent':
        break
    }
  }

  const seen = new Set<string>()
  const uniqueAttempts = attempts.filter((a) => {
    // Cùng học sinh + cùng câu + cùng thời điểm trả lời thì là một lần duy nhất.
    const key = `${a.studentId}|${a.questionId}|${a.answeredAt}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return [
    ...lastStudent.values(),
    ...lastProgress.values(),
    ...(uniqueAttempts.length > 0 && attemptsId
      ? [{ id: attemptsId, op: { kind: 'attempts' as const, attempts: uniqueAttempts } }]
      : []),
    ...[...deleted].map(([studentId, id]) => ({
      id,
      op: { kind: 'deleteStudent' as const, studentId },
    })),
  ]
}

export async function readOutbox(): Promise<OutboxEntry[]> {
  return (await get<OutboxEntry[]>(OUTBOX_KEY)) ?? []
}

export async function writeOutbox(entries: OutboxEntry[]): Promise<void> {
  await set(OUTBOX_KEY, entries)
}

export async function enqueue(op: OutboxOp): Promise<void> {
  const entries = await readOutbox()
  await writeOutbox(compactOutbox([...entries, { id: newId(), op }]))
}

/**
 * Xoá khỏi hàng đợi đúng những mục đã gửi thành công.
 * Mục xếp vào trong lúc đang gửi có id khác nên được giữ lại cho lượt sau.
 */
export async function removeSent(sentIds: Iterable<string>): Promise<void> {
  const sent = new Set(sentIds)
  const remaining = (await readOutbox()).filter((entry) => !sent.has(entry.id))
  await writeOutbox(remaining)
}

export async function clearOutbox(): Promise<void> {
  await writeOutbox([])
}
