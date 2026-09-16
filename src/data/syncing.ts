/**
 * Repository đồng bộ: ghi xuống máy trước, đẩy lên server sau.
 *
 * Quy tắc vàng: THAO TÁC CỦA TRẺ KHÔNG BAO GIỜ CHỜ MẠNG. Mọi lần lưu đều ghi
 * ngay vào IndexedDB rồi trả về; việc gửi lên Supabase xếp vào hàng đợi và chạy
 * nền. Mất mạng giữa buổi học thì trẻ không hề biết.
 *
 * Đọc thì luôn đọc từ máy - dữ liệu server được kéo về và hợp nhất vào máy ở
 * `pull()`, gọi lúc đăng nhập và lúc có mạng trở lại.
 */

import type { Grade } from '../content/types'
import { localRepository } from './local'
import { mergeProgress, mergeStudent } from './merge'
import { enqueue, readOutbox, removeSent, type OutboxOp } from './outbox'
import type { Repository, StoredAttempt, StudentProfile, StudentProgress } from './types'

export interface SyncStatus {
  /** Đang có thao tác chờ gửi lên server. */
  pending: number
  lastSyncedAt: number | null
  lastError: string | null
  syncing: boolean
}

export interface SyncingRepository extends Repository {
  /** Kéo dữ liệu từ server về và hợp nhất vào máy. */
  pull(): Promise<void>
  /** Đẩy hàng đợi lên server. An toàn khi gọi nhiều lần. */
  push(): Promise<void>
  /** Kéo về rồi đẩy lên. Gọi lúc đăng nhập và khi mạng trở lại. */
  sync(): Promise<void>
  getStatus(): SyncStatus
  subscribe(listener: (status: SyncStatus) => void): () => void
}

export function createSyncingRepository(
  remote: Repository,
  local: Repository = localRepository,
): SyncingRepository {
  let status: SyncStatus = { pending: 0, lastSyncedAt: null, lastError: null, syncing: false }
  const listeners = new Set<(status: SyncStatus) => void>()

  function update(patch: Partial<SyncStatus>): void {
    status = { ...status, ...patch }
    for (const listener of listeners) listener(status)
  }

  async function refreshPending(): Promise<void> {
    update({ pending: (await readOutbox()).length })
  }

  /** Xếp việc vào hàng đợi rồi thử đẩy ngay - không chờ kết quả. */
  async function queue(op: OutboxOp): Promise<void> {
    await enqueue(op)
    await refreshPending()
    void push().catch(() => {
      // Lỗi đã được ghi vào status; không làm hỏng lượt chơi của trẻ.
    })
  }

  // Gộp các lời gọi push() chồng nhau. Nếu có thao tác mới phát sinh trong lúc
  // đang gửi, `pushAgain` bảo vòng lặp chạy thêm một lượt - nếu không, những
  // thao tác đó sẽ nằm lại hàng đợi cho tới lần có mạng kế tiếp.
  let inFlight: Promise<void> | null = null
  let pushAgain = false

  function push(): Promise<void> {
    if (inFlight) {
      pushAgain = true
      return inFlight
    }
    inFlight = (async () => {
      do {
        pushAgain = false
        await pushOnce()
      } while (pushAgain)
    })().finally(() => {
      inFlight = null
    })
    return inFlight
  }

  async function pushOnce(): Promise<void> {
    update({ syncing: true })

    // Khai báo ngoài try để nhánh lỗi cũng ghi nhận được phần đã gửi xong.
    const sent: string[] = []
    try {
      const entries = await readOutbox()
      if (entries.length === 0) return

      for (const entry of entries) {
        const { op } = entry
        switch (op.kind) {
          case 'saveStudent':
            await remote.saveStudent(op.student)
            break
          case 'saveProgress':
            await remote.saveProgress(op.studentId, op.progress)
            break
          case 'attempts':
            await remote.recordAttempts(op.attempts)
            break
          case 'deleteStudent':
            await remote.deleteStudent(op.studentId)
            break
        }
        sent.push(entry.id)
      }

      update({ lastSyncedAt: Date.now(), lastError: null })
    } catch (cause) {
      update({ lastError: cause instanceof Error ? cause.message : String(cause) })
    } finally {
      // Chỉ xoá ĐÚNG những mục đã gửi xong, kể cả khi hỏng giữa chừng. Mục nào
      // trẻ vừa tạo thêm trong lúc đang gửi thì có id khác nên được giữ lại cho
      // lượt sau. Phần chưa gửi vẫn nguyên - thà gửi trùng còn hơn mất dữ liệu,
      // server đã có ràng buộc khử trùng.
      if (sent.length > 0) await removeSent(sent)
      update({ syncing: false })
      await refreshPending()
    }
  }

  async function pull(): Promise<void> {
    update({ syncing: true })
    try {
      const [remoteStudents, localStudents] = await Promise.all([
        remote.listStudents(),
        local.listStudents(),
      ])
      const localById = new Map(localStudents.map((s) => [s.id, s]))

      for (const remoteStudent of remoteStudents) {
        const localStudent = localById.get(remoteStudent.id)
        const merged = localStudent ? mergeStudent(localStudent, remoteStudent) : remoteStudent
        await local.saveStudent(merged)

        const [remoteProgress, localProgress] = await Promise.all([
          remote.getProgress(remoteStudent.id),
          local.getProgress(remoteStudent.id),
        ])
        await local.saveProgress(remoteStudent.id, mergeProgress(localProgress, remoteProgress))
      }

      update({ lastSyncedAt: Date.now(), lastError: null })
    } catch (cause) {
      update({ lastError: cause instanceof Error ? cause.message : String(cause) })
    } finally {
      update({ syncing: false })
    }
  }

  async function sync(): Promise<void> {
    // Kéo trước rồi đẩy: dữ liệu máy đã hợp nhất xong mới gửi lên, tránh ghi đè
    // mất phần trẻ vừa làm ở thiết bị khác.
    await pull()
    await push()
  }

  return {
    // --- Đọc: luôn từ máy, không bao giờ chờ mạng ---
    listStudents: () => local.listStudents(),
    getProgress: (studentId) => local.getProgress(studentId),
    listAttempts: (studentId, limit) => local.listAttempts(studentId, limit),

    // --- Ghi: xuống máy ngay, lên server sau ---
    async createStudent(input: { name: string; avatar: string; grade: Grade }) {
      // Hồ sơ mới phải tạo trên server trước để lấy id thật (khoá ngoại của mọi
      // bảng khác). Mất mạng lúc này thì rơi về tạo cục bộ.
      let student: StudentProfile
      try {
        student = await remote.createStudent(input)
        update({ lastError: null })
      } catch (cause) {
        update({ lastError: cause instanceof Error ? cause.message : String(cause) })
        student = await local.createStudent(input)
        await queue({ kind: 'saveStudent', student })
        return student
      }
      await local.saveStudent(student)
      await local.saveProgress(student.id, await local.getProgress(student.id))
      return student
    },

    async saveStudent(student: StudentProfile): Promise<void> {
      await local.saveStudent(student)
      await queue({ kind: 'saveStudent', student })
    },

    async deleteStudent(studentId: string): Promise<void> {
      await local.deleteStudent(studentId)
      await queue({ kind: 'deleteStudent', studentId })
    },

    async saveProgress(studentId: string, progress: StudentProgress): Promise<void> {
      await local.saveProgress(studentId, progress)
      await queue({ kind: 'saveProgress', studentId, progress })
    },

    async recordAttempts(attempts: StoredAttempt[]): Promise<void> {
      await local.recordAttempts(attempts)
      await queue({ kind: 'attempts', attempts })
    },

    // --- Điều khiển đồng bộ ---
    pull,
    push,
    sync,
    getStatus: () => status,
    subscribe(listener) {
      listeners.add(listener)
      listener(status)
      return () => listeners.delete(listener)
    },
  }
}

/** Tự đồng bộ khi máy có mạng trở lại và khi trẻ quay lại tab. */
export function watchConnectivity(repository: SyncingRepository): () => void {
  const trigger = () => {
    if (navigator.onLine) void repository.sync()
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') trigger()
  }

  window.addEventListener('online', trigger)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    window.removeEventListener('online', trigger)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
