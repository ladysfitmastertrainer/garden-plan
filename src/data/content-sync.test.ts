/**
 * Lớp đồng bộ nội dung, chạy với một máy chủ `/api/content` giả.
 *
 * Bản trước giả lập cả một client Supabase - `from().select()`, `from().upsert()`,
 * `auth.getUser()`. Giờ chỉ cần giả `fetch`: trình duyệt nói đúng hai câu với máy
 * chủ, `GET /api/content` và `POST /api/content`. Cùng những luật ấy được kiểm,
 * bằng một phần ba số dòng dựng cảnh.
 *
 * Phần quyền (ai đọc được của ai) thì máy chủ giả không thay thế được, và cũng
 * không nên: nó nằm ở `src/server/content.ts` và ở bộ kiểm chứng RLS chạy trên
 * Postgres thật trong `supabase/tests/content-rls.test.ts`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addQuestion,
  customRows,
  getCustomContent,
  resetContent,
  setHidden,
  setSkillName,
} from '../content/custom'
import { syncCustomContent } from './content-sync'

const SKILL = 'math.g1.cong-tru-10'
const GOOD = {
  kind: 'choice',
  difficulty: 1,
  prompt: 'Cô Lan có 3 quả cam, cho đi 1 quả. Còn mấy quả?',
  correct: '2 quả',
  distractors: ['3 quả'],
  explanation: '',
}

const ME = 'toi'
const CO_GIAO = 'co-giao'

interface Remote {
  ownerId: string | null
  questions: Array<Record<string, unknown>>
  hidden: Array<Record<string, unknown>>
  skillNames: Array<Record<string, unknown>>
}

/** Ghi lại mọi lần đẩy, để kiểm chính xác cái gì được gửi đi. */
interface FakeServer {
  remote: Remote
  pushes: Array<{ questions: unknown[]; hidden: unknown[]; skillNames: unknown[] }>
}

function fakeServer(remote: Partial<Remote> = {}, status = 200): FakeServer {
  const state: Remote = {
    ownerId: ME,
    questions: [],
    hidden: [],
    skillNames: [],
    ...remote,
  }
  const pushes: FakeServer['pushes'] = []

  vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
    if (status !== 200) {
      return new Response(JSON.stringify({ error: 'Bạn cần đăng nhập trước.' }), { status })
    }

    if (!init?.method || init.method === 'GET') {
      return new Response(JSON.stringify(state), { status: 200 })
    }

    const body = JSON.parse(String(init.body)) as FakeServer['pushes'][number]
    pushes.push(body)
    return new Response(
      JSON.stringify({
        pushed: body.questions.length + body.hidden.length + body.skillNames.length,
      }),
      { status: 200 },
    )
  })

  return { remote: state, pushes }
}

const remoteQuestion = (id: string, owner: string, prompt: string, at: number) => ({
  id,
  owner_id: owner,
  skill_id: SKILL,
  entry: { ...GOOD, prompt },
  updated_at: new Date(at).toISOString(),
  deleted_at: null,
})

beforeEach(() => {
  resetContent()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('kéo về', () => {
  it('nhận câu của người khác và dùng được ngay', async () => {
    fakeServer({ questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)] })

    const result = await syncCustomContent()
    expect(result.pulled).toBe(1)
    expect(customRows(SKILL).map((row) => row.value.prompt)).toEqual(['Câu của cô Hà'])
  })

  it('câu của người khác được đánh dấu chủ, không nhận nhầm là của mình', async () => {
    fakeServer({ questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)] })
    await syncCustomContent()
    expect(customRows(SKILL)[0]!.ownerId).toBe(CO_GIAO)
  })

  it('câu hỏng trên máy chủ thì bỏ qua, không làm hỏng cả lần đồng bộ', async () => {
    fakeServer({
      questions: [
        remoteQuestion('r1', CO_GIAO, 'Câu tử tế', 1000),
        { ...remoteQuestion('r2', CO_GIAO, '', 1000), entry: { kind: 'choice' } },
      ],
    })
    await syncCustomContent()
    expect(customRows(SKILL)).toHaveLength(1)
  })
})

describe('đẩy lên', () => {
  it('gửi câu mình vừa soạn', async () => {
    addQuestion(SKILL, GOOD)
    const server = fakeServer()

    const result = await syncCustomContent()
    expect(result.pushed).toBe(1)
    expect(server.pushes[0]!.questions).toHaveLength(1)
  })

  it('KHÔNG gửi kèm owner_id - máy chủ tự đóng dấu', async () => {
    // Tin `owner_id` do trình duyệt gửi lên nghĩa là một cô giáo đẩy được bài
    // dưới tên đồng nghiệp. Máy chủ ghi đè, và ở đây thì không gửi ngay từ đầu.
    addQuestion(SKILL, GOOD)
    const server = fakeServer()
    await syncCustomContent()
    expect(server.pushes[0]!.questions[0]).not.toHaveProperty('owner_id')
  })

  it('KHÔNG đẩy lại câu của người khác dưới tên mình', async () => {
    const server = fakeServer({ questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)] })
    const result = await syncCustomContent()
    expect(result.pushed).toBe(0)
    expect(server.pushes).toHaveLength(0)
  })

  it('chỉ gửi phần CHÊNH LỆCH, không gửi lại thứ máy chủ đã có', async () => {
    addQuestion(SKILL, GOOD)
    const mine = customRows(SKILL)[0]!
    fakeServer({
      questions: [
        {
          id: mine.id,
          owner_id: ME,
          skill_id: SKILL,
          entry: mine.value,
          updated_at: new Date(mine.updatedAt).toISOString(),
          deleted_at: null,
        },
      ],
    })

    const result = await syncCustomContent()
    expect(result.pushed).toBe(0)
  })

  it('gửi cả lệnh ẩn và tên kỹ năng', async () => {
    setHidden(SKILL, 'Một câu gốc nào đó', true)
    setSkillName(SKILL, 'Cộng trừ 10 - lớp 1A')
    const server = fakeServer()

    const result = await syncCustomContent()
    expect(result.pushed).toBe(2)
    expect(server.pushes[0]!.hidden).toHaveLength(1)
    expect(server.pushes[0]!.skillNames).toHaveLength(1)
  })

  it('đẩy xong thì đóng dấu chủ, lần sau không gửi lại', async () => {
    addQuestion(SKILL, GOOD)
    fakeServer()
    await syncCustomContent()
    expect(customRows(SKILL)[0]!.ownerId).toBe(ME)

    // Máy chủ giờ đã có hàng đó - lần đồng bộ sau không còn gì để gửi.
    const mine = customRows(SKILL)[0]!
    vi.unstubAllGlobals()
    fakeServer({
      questions: [
        {
          id: mine.id,
          owner_id: ME,
          skill_id: SKILL,
          entry: mine.value,
          updated_at: new Date(mine.updatedAt).toISOString(),
          deleted_at: null,
        },
      ],
    })
    expect((await syncCustomContent()).pushed).toBe(0)
  })

  it('lệnh xoá cũng được gửi đi, kèm mốc thời gian', async () => {
    addQuestion(SKILL, GOOD)
    const id = customRows(SKILL)[0]!.id
    const { removeQuestion } = await import('../content/custom')
    removeQuestion(id)

    const server = fakeServer()
    await syncCustomContent()
    const sent = server.pushes[0]!.questions[0] as Record<string, unknown>
    expect(sent.id).toBe(id)
    expect(sent.deleted_at).not.toBeNull()
  })
})

describe('trẻ trên máy dùng chung', () => {
  it('kéo về được nhưng KHÔNG đẩy lên', async () => {
    // Máy chủ trả `ownerId: null` cho phiên của trẻ. Cứ để đẩy thì máy chủ từ
    // chối, và màn hình lại báo lỗi cho một việc vốn không phải lỗi.
    addQuestion(SKILL, GOOD)
    const server = fakeServer({
      ownerId: null,
      questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)],
    })

    const result = await syncCustomContent()
    expect(result.pushed).toBe(0)
    expect(server.pushes).toHaveLength(0)
    expect(customRows(SKILL).map((row) => row.value.prompt)).toContain('Câu của cô Hà')
  })
})

describe('hỏng thì hỏng cho rõ', () => {
  it('chưa đăng nhập thì báo lỗi chứ không lặng lẽ không làm gì', async () => {
    fakeServer({}, 401)
    await expect(syncCustomContent()).rejects.toThrow('Bạn cần đăng nhập trước.')
  })

  it('đồng bộ không làm mất phần đang có trên máy', async () => {
    addQuestion(SKILL, GOOD)
    const before = getCustomContent().questions.length
    fakeServer({ questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)] })

    await syncCustomContent()
    expect(getCustomContent().questions.length).toBe(before + 1)
  })
})
