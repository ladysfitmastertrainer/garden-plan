/**
 * Lớp đồng bộ nội dung, chạy với một client Supabase giả.
 *
 * Client giả dựng lại đúng phần bề mặt mà `content-sync.ts` dùng: `from().select()`,
 * `from().upsert()`, `auth.getUser()`. Nhờ vậy kiểm được LUẬT - cái gì được đẩy,
 * cái gì không - mà không cần một dự án Supabase thật.
 *
 * Phần RLS (ai đọc được của ai) thì client giả không thay thế được, và cũng
 * không nên: nó nằm ở `supabase/tests/content-rls.test.ts`, chạy trên Postgres
 * thật.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
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

interface Tables {
  custom_questions: Array<Record<string, unknown>>
  custom_hidden: Array<Record<string, unknown>>
  custom_skill_names: Array<Record<string, unknown>>
  profiles: Array<Record<string, unknown>>
}

/** Ghi lại mọi lần đẩy, để kiểm chính xác cái gì được gửi đi. */
interface FakeServer {
  client: SupabaseClient
  tables: Tables
  pushes: Array<{ table: keyof Tables; rows: Array<Record<string, unknown>> }>
}

function fakeSupabase(tables: Partial<Tables> = {}, userId: string | null = ME): FakeServer {
  const data: Tables = {
    custom_questions: [],
    custom_hidden: [],
    custom_skill_names: [],
    profiles: [{ id: ME }],
    ...tables,
  }
  const pushes: FakeServer['pushes'] = []

  const client = {
    auth: {
      getUser: async () => ({ data: { user: userId ? { id: userId } : null }, error: null }),
    },
    from(table: keyof Tables) {
      return {
        select() {
          const rows = data[table]
          const result = { data: rows, error: null }
          return Object.assign(Promise.resolve(result), {
            eq(_column: string, value: unknown) {
              const filtered = rows.filter((row) => row.id === value)
              return {
                maybeSingle: async () => ({ data: filtered[0] ?? null, error: null }),
              }
            },
          })
        },
        async upsert(rows: Array<Record<string, unknown>>) {
          pushes.push({ table, rows })
          data[table] = [...data[table], ...rows]
          return { error: null }
        },
      }
    },
  } as unknown as SupabaseClient

  return { client, tables: data, pushes }
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

describe('kéo về', () => {
  it('nhận câu của người khác và dùng được ngay', async () => {
    const server = fakeSupabase({
      custom_questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)],
    })

    const result = await syncCustomContent(server.client)
    expect(result.pulled).toBe(1)
    expect(customRows(SKILL).map((row) => row.value.prompt)).toEqual(['Câu của cô Hà'])
  })

  it('câu của người khác được đánh dấu chủ, không nhận nhầm là của mình', async () => {
    const server = fakeSupabase({
      custom_questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)],
    })
    await syncCustomContent(server.client)
    expect(customRows(SKILL)[0]!.ownerId).toBe(CO_GIAO)
  })

  it('câu hỏng trên máy chủ thì bỏ qua, không làm hỏng cả lần đồng bộ', async () => {
    const server = fakeSupabase({
      custom_questions: [
        remoteQuestion('r1', CO_GIAO, 'Câu tử tế', 1000),
        { ...remoteQuestion('r2', CO_GIAO, '', 1000), entry: { kind: 'choice' } },
      ],
    })
    await syncCustomContent(server.client)
    expect(customRows(SKILL)).toHaveLength(1)
  })
})

describe('đẩy lên', () => {
  it('gửi câu mình vừa soạn', async () => {
    addQuestion(SKILL, GOOD)
    const server = fakeSupabase()

    const result = await syncCustomContent(server.client)
    expect(result.pushed).toBe(1)
    expect(server.pushes[0]!.table).toBe('custom_questions')
    expect(server.pushes[0]!.rows[0]!.owner_id).toBe(ME)
  })

  it('KHÔNG đẩy lại câu của người khác dưới tên mình', async () => {
    // Đây là chỗ vừa chép trộm bài người khác vừa làm hỏng cả lần đồng bộ:
    // máy chủ sẽ từ chối vì hàng đó đã có chủ.
    const server = fakeSupabase({
      custom_questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)],
    })
    const result = await syncCustomContent(server.client)
    expect(result.pushed).toBe(0)
    expect(server.pushes).toHaveLength(0)
  })

  it('chỉ gửi phần CHÊNH LỆCH, không gửi lại thứ máy chủ đã có', async () => {
    addQuestion(SKILL, GOOD)
    const mine = customRows(SKILL)[0]!
    const server = fakeSupabase({
      custom_questions: [
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

    const result = await syncCustomContent(server.client)
    expect(result.pushed).toBe(0)
  })

  it('gửi cả lệnh ẩn và tên kỹ năng', async () => {
    setHidden(SKILL, 'Một câu gốc nào đó', true)
    setSkillName(SKILL, 'Cộng trừ 10 - lớp 1A')
    const server = fakeSupabase()

    const result = await syncCustomContent(server.client)
    expect(result.pushed).toBe(2)
    expect(server.pushes.map((p) => p.table).sort()).toEqual(['custom_hidden', 'custom_skill_names'])
  })

  it('đẩy xong thì đóng dấu chủ, lần sau không gửi lại', async () => {
    addQuestion(SKILL, GOOD)
    const first = fakeSupabase()
    await syncCustomContent(first.client)
    expect(customRows(SKILL)[0]!.ownerId).toBe(ME)

    // Máy chủ giờ đã có hàng đó - lần đồng bộ sau không còn gì để gửi.
    const mine = customRows(SKILL)[0]!
    const second = fakeSupabase({
      custom_questions: [
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
    expect((await syncCustomContent(second.client)).pushed).toBe(0)
  })

  it('lệnh xoá cũng được gửi đi, kèm mốc thời gian', async () => {
    addQuestion(SKILL, GOOD)
    const id = customRows(SKILL)[0]!.id
    const { removeQuestion } = await import('../content/custom')
    removeQuestion(id)

    const server = fakeSupabase()
    await syncCustomContent(server.client)
    const sent = server.pushes[0]!.rows[0]!
    expect(sent.id).toBe(id)
    expect(sent.deleted_at).not.toBeNull()
  })
})

describe('trẻ trên máy dùng chung', () => {
  it('kéo về được nhưng KHÔNG đẩy lên', async () => {
    // Trẻ không có hồ sơ trong `profiles`. Cứ để đẩy thì máy chủ từ chối, và màn
    // hình lại báo lỗi cho một việc vốn không phải lỗi.
    addQuestion(SKILL, GOOD)
    const server = fakeSupabase(
      { profiles: [], custom_questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)] },
      'be-anh',
    )

    const result = await syncCustomContent(server.client)
    expect(result.pushed).toBe(0)
    expect(server.pushes).toHaveLength(0)
    expect(customRows(SKILL).map((row) => row.value.prompt)).toContain('Câu của cô Hà')
  })
})

describe('hỏng thì hỏng cho rõ', () => {
  it('chưa đăng nhập thì báo lỗi chứ không lặng lẽ không làm gì', async () => {
    const server = fakeSupabase({}, null)
    await expect(syncCustomContent(server.client)).rejects.toThrow('Chưa đăng nhập')
  })

  it('đồng bộ không làm mất phần đang có trên máy', async () => {
    addQuestion(SKILL, GOOD)
    const before = getCustomContent().questions.length
    const server = fakeSupabase({
      custom_questions: [remoteQuestion('r1', CO_GIAO, 'Câu của cô Hà', 1000)],
    })

    await syncCustomContent(server.client)
    expect(getCustomContent().questions.length).toBe(before + 1)
  })
})
