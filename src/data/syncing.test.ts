/**
 * Hàng đợi offline và tầng đồng bộ.
 *
 * Câu hỏi mà các test này trả lời: "trẻ chơi lúc mất mạng thì có mất bài không?"
 * Câu trả lời phải là KHÔNG, trong mọi kịch bản dưới đây.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// idb-keyval không chạy được trong Node - thay bằng Map trong bộ nhớ.
const store = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: async (key: string) => store.get(key),
  set: async (key: string, value: unknown) => {
    store.set(key, value)
  },
  del: async (key: string) => {
    store.delete(key)
  },
}))

const { compactOutbox, readOutbox } = await import('./outbox')
type OutboxOp = import('./outbox').OutboxOp

let entryCounter = 0
/** Bọc một thao tác thành mục hàng đợi có id, giống `enqueue()` làm. */
const entry = (op: OutboxOp) => ({ id: `e${++entryCounter}`, op })
const { createSyncingRepository } = await import('./syncing')
const { createMemoryRepository } = await import('./memory')
const { emptyProgress } = await import('./types')
type StoredAttempt = import('./types').StoredAttempt
type StudentProfile = import('./types').StudentProfile
type Repository = import('./types').Repository

const T0 = 1_700_000_000_000

const student = (patch: Partial<StudentProfile> = {}): StudentProfile => ({
  id: 's1',
  name: 'Bé An',
  avatar: '🦊',
  grade: 1,
  totalXp: 0,
  gold: 0,
  equippedItemIds: [],
  createdAt: T0,
  lastPlayedAt: T0,
  ...patch,
})

const attempt = (patch: Partial<StoredAttempt> = {}): StoredAttempt => ({
  studentId: 's1',
  questionId: 'q1',
  skillId: 'math.g1.cong-tru-10',
  subject: 'math',
  difficulty: 1,
  correct: true,
  durationMs: 3000,
  usedHint: false,
  answeredAt: T0,
  ...patch,
})

beforeEach(() => {
  store.clear()
})

describe('compactOutbox', () => {
  it('mỗi học sinh chỉ giữ lần lưu hồ sơ cuối cùng', () => {
    const entries = compactOutbox([
      entry({ kind: 'saveStudent', student: student({ gold: 10 }) }),
      entry({ kind: 'saveStudent', student: student({ gold: 20 }) }),
      entry({ kind: 'saveStudent', student: student({ gold: 30 }) }),
    ])
    expect(entries).toHaveLength(1)
    expect(entries[0]!.op).toMatchObject({ kind: 'saveStudent', student: { gold: 30 } })
  })

  it('hồ sơ của hai học sinh khác nhau không đè lên nhau', () => {
    const entries = compactOutbox([
      entry({ kind: 'saveStudent', student: student({ id: 'a' }) }),
      entry({ kind: 'saveStudent', student: student({ id: 'b' }) }),
    ])
    expect(entries).toHaveLength(2)
  })

  it('NHẬT KÝ TRẢ LỜI ĐƯỢC GIỮ ĐỦ, không bị rút gọn như tiến độ', () => {
    const entries = compactOutbox([
      entry({ kind: 'attempts', attempts: [attempt({ questionId: 'q1' })] }),
      entry({ kind: 'attempts', attempts: [attempt({ questionId: 'q2', answeredAt: T0 + 1 })] }),
      entry({ kind: 'attempts', attempts: [attempt({ questionId: 'q3', answeredAt: T0 + 2 })] }),
    ])
    const found = entries.find((e) => e.op.kind === 'attempts')?.op
    expect(found?.kind === 'attempts' && found.attempts).toHaveLength(3)
  })

  it('khử trùng lặp nhật ký khi hàng đợi bị gửi lại', () => {
    const same = attempt()
    const entries = compactOutbox([
      entry({ kind: 'attempts', attempts: [same] }),
      entry({ kind: 'attempts', attempts: [same, attempt({ questionId: 'q2', answeredAt: T0 + 1 })] }),
    ])
    const found = entries.find((e) => e.op.kind === 'attempts')?.op
    expect(found?.kind === 'attempts' && found.attempts).toHaveLength(2)
  })

  it('học sinh đã xoá thì bỏ hết thao tác liên quan, chỉ giữ lệnh xoá', () => {
    const entries = compactOutbox([
      entry({ kind: 'saveStudent', student: student() }),
      entry({ kind: 'attempts', attempts: [attempt()] }),
      entry({ kind: 'saveProgress', studentId: 's1', progress: emptyProgress() }),
      entry({ kind: 'deleteStudent', studentId: 's1' }),
    ])
    expect(entries.map((e) => e.op)).toEqual([{ kind: 'deleteStudent', studentId: 's1' }])
  })

  it('hàng đợi rỗng vẫn rỗng', () => {
    expect(compactOutbox([])).toEqual([])
  })
})

/** Repository giả lập mất mạng: mọi thao tác ghi đều ném lỗi. */
function offlineRemote(): Repository {
  const fail = async (): Promise<never> => {
    throw new Error('Mất mạng')
  }
  return {
    listStudents: fail,
    createStudent: fail,
    saveStudent: fail,
    deleteStudent: fail,
    getProgress: fail,
    saveProgress: fail,
    recordAttempts: fail,
    listAttempts: fail,
  }
}

describe('SyncingRepository khi MẤT MẠNG', () => {
  it('lưu tiến độ vẫn thành công và đọc lại được ngay', async () => {
    const local = createMemoryRepository()
    const repository = createSyncingRepository(offlineRemote(), local)

    const progress = { ...emptyProgress(), battlesPlayed: 3 }
    await repository.saveProgress('s1', progress)

    expect((await repository.getProgress('s1')).battlesPlayed).toBe(3)
  })

  it('thao tác được xếp vào hàng đợi chứ không biến mất', async () => {
    const local = createMemoryRepository()
    const repository = createSyncingRepository(offlineRemote(), local)

    await repository.saveStudent(student())
    await repository.recordAttempts([attempt()])

    const queued = await readOutbox()
    expect(queued.length).toBeGreaterThan(0)
    expect(repository.getStatus().pending).toBeGreaterThan(0)
  })

  it('báo lỗi vào trạng thái nhưng KHÔNG ném ra ngoài - lượt chơi không bị gián đoạn', async () => {
    const local = createMemoryRepository()
    const repository = createSyncingRepository(offlineRemote(), local)

    await expect(repository.recordAttempts([attempt()])).resolves.toBeUndefined()
    await repository.push()
    expect(repository.getStatus().lastError).toContain('Mất mạng')
  })

  it('hàng đợi KHÔNG bị xoá khi gửi thất bại', async () => {
    const local = createMemoryRepository()
    const repository = createSyncingRepository(offlineRemote(), local)

    await repository.saveStudent(student())
    await repository.push()

    expect((await readOutbox()).length).toBeGreaterThan(0)
  })
})

describe('SyncingRepository khi CÓ MẠNG TRỞ LẠI', () => {
  it('đẩy hết hàng đợi lên rồi mới xoá hàng đợi', async () => {
    const local = createMemoryRepository()
    const remote = createMemoryRepository()
    let online = false

    // Bọc remote để mô phỏng mạng chập chờn.
    const flaky: Repository = {
      ...remote,
      saveStudent: async (s) => {
        if (!online) throw new Error('Mất mạng')
        await remote.saveStudent(s)
      },
      recordAttempts: async (a) => {
        if (!online) throw new Error('Mất mạng')
        await remote.recordAttempts(a)
      },
    }

    const repository = createSyncingRepository(flaky, local)
    await repository.saveStudent(student({ gold: 99 }))
    await repository.recordAttempts([attempt()])
    expect((await readOutbox()).length).toBeGreaterThan(0)

    online = true
    await repository.push()

    expect(await readOutbox()).toEqual([])
    expect((await remote.listStudents())[0]?.gold).toBe(99)
    expect(await remote.listAttempts('s1')).toHaveLength(1)
    expect(repository.getStatus().pending).toBe(0)
    expect(repository.getStatus().lastError).toBeNull()
  })

  it('pull() mang dữ liệu server về máy và hợp nhất, không đè mất phần chơi offline', async () => {
    const local = createMemoryRepository()
    const remote = createMemoryRepository()

    // Trên máy: chơi offline được 200 vàng.
    await local.saveStudent(student({ gold: 200, lastPlayedAt: T0 }))
    await local.saveProgress('s1', {
      ...emptyProgress(),
      clearedNodes: { math: 4, vietnamese: 0, ethics: 0, music: 0 },
    })

    // Trên server: thiết bị khác đã đi được xa hơn ở môn Tiếng Việt.
    await remote.saveStudent(student({ gold: 50, totalXp: 900, lastPlayedAt: T0 + 1000 }))
    await remote.saveProgress('s1', {
      ...emptyProgress(),
      clearedNodes: { math: 1, vietnamese: 6, ethics: 0, music: 0 },
    })

    const repository = createSyncingRepository(remote, local)
    await repository.pull()

    const merged = await repository.getProgress('s1')
    expect(merged.clearedNodes.math).toBe(4)
    expect(merged.clearedNodes.vietnamese).toBe(6)

    const mergedStudent = (await repository.listStudents())[0]!
    expect(mergedStudent.gold).toBe(200)
    expect(mergedStudent.totalXp).toBe(900)
  })

  it('sync() kéo về trước rồi mới đẩy lên', async () => {
    const local = createMemoryRepository()
    const remote = createMemoryRepository()
    const order: string[] = []
    let online = false

    const traced: Repository = {
      ...remote,
      listStudents: async () => {
        order.push('pull')
        return remote.listStudents()
      },
      saveStudent: async (s) => {
        // Mất mạng lúc đầu để hàng đợi còn nguyên tới lúc gọi sync().
        if (!online) throw new Error('Mất mạng')
        order.push('push')
        await remote.saveStudent(s)
      },
    }

    const repository = createSyncingRepository(traced, local)
    await repository.saveStudent(student())
    expect((await readOutbox()).length).toBeGreaterThan(0)

    online = true
    order.length = 0
    await repository.sync()

    expect(order[0]).toBe('pull')
    expect(order).toContain('push')
  })

  it('câu trả lời phát sinh TRONG LÚC đang gửi vẫn lên tới server', async () => {
    const local = createMemoryRepository()
    const remote = createMemoryRepository()
    let injected = false

    const repository = createSyncingRepository(
      {
        ...remote,
        saveStudent: async (s) => {
          // Trẻ trả lời thêm một câu đúng lúc lô trước đang được gửi đi.
          if (!injected) {
            injected = true
            await repository.recordAttempts([attempt({ questionId: 'q-moi', answeredAt: T0 + 99 })])
          }
          await remote.saveStudent(s)
        },
      },
      local,
    )

    await repository.saveStudent(student())
    await repository.push()

    // Yêu cầu thật không phải là "nằm lại hàng đợi" mà là "không bị mất":
    // vòng lặp push phải chạy thêm một lượt để gửi nốt.
    const uploaded = (await remote.listAttempts('s1')).map((a) => a.questionId)
    expect(uploaded).toContain('q-moi')
    expect(await readOutbox()).toEqual([])
  })

  it('gửi hỏng giữa chừng thì mục đã gửi xong được xoá, mục chưa gửi giữ lại', async () => {
    const local = createMemoryRepository()
    const remote = createMemoryRepository()
    const repository = createSyncingRepository(
      {
        ...remote,
        saveStudent: (s) => remote.saveStudent(s),
        recordAttempts: async () => {
          throw new Error('Mất mạng giữa chừng')
        },
      },
      local,
    )

    await repository.saveStudent(student())
    await repository.recordAttempts([attempt()])
    await repository.push()

    const remaining = await readOutbox()
    expect(remaining.some((entry) => entry.op.kind === 'saveStudent')).toBe(false)
    expect(remaining.some((entry) => entry.op.kind === 'attempts')).toBe(true)
  })

  it('đọc luôn lấy từ máy nên không bao giờ phải chờ mạng', async () => {
    const local = createMemoryRepository()
    const repository = createSyncingRepository(offlineRemote(), local)

    await repository.saveStudent(student({ name: 'Bé Bo' }))
    // remote luôn ném lỗi, nhưng đọc vẫn chạy được.
    expect((await repository.listStudents())[0]?.name).toBe('Bé Bo')
  })

  it('theo dõi được trạng thái đồng bộ qua subscribe', async () => {
    const local = createMemoryRepository()
    const remote = createMemoryRepository()
    const repository = createSyncingRepository(remote, local)

    const seen: number[] = []
    const unsubscribe = repository.subscribe((s) => seen.push(s.pending))
    await repository.saveStudent(student())
    unsubscribe()

    expect(seen.length).toBeGreaterThan(1)
  })
})
