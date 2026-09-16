/**
 * Luật hợp nhất hai kho nội dung.
 *
 * Mỗi test ở đây tương ứng một cách LÀM MẤT CÔNG NGƯỜI DÙNG mà ta phải chặn.
 * Cô giáo soạn mười câu buổi tối rồi sáng hôm sau sửa trên máy khác - sai một
 * luật ở đây là mất trắng một buổi làm việc, mà lại không ai được báo.
 */

import { describe, expect, it } from 'vitest'
import { mergeContent, type CustomContent, type QuestionRow } from './custom'
import type { BankEntry } from './bank'

const entry = (prompt: string): BankEntry => ({
  kind: 'text',
  difficulty: 1,
  prompt,
  explanation: '',
  accepted: [prompt],
})

const q = (
  id: string,
  prompt: string,
  updatedAt: number,
  deletedAt: number | null = null,
): QuestionRow => ({
  id,
  skillId: 'math.g1.cong-tru-10',
  value: entry(prompt),
  updatedAt,
  deletedAt,
  ownerId: null,
})

const pack = (questions: QuestionRow[]): CustomContent => ({
  questions,
  hidden: [],
  skillNames: [],
  continents: [],
})

const prompts = (content: CustomContent) =>
  content.questions
    .filter((row) => row.deletedAt === null)
    .map((row) => row.value.prompt)
    .sort()

describe('hợp nhất hai kho', () => {
  it('hai máy soạn hai câu khác nhau thì GIỮ CẢ HAI', () => {
    // Đây là lý do cả hệ thống này chia thành dòng thay vì một khối JSON.
    const laptop = pack([q('a', 'Câu soạn tối qua', 100)])
    const tablet = pack([q('b', 'Câu soạn sáng nay', 200)])

    expect(prompts(mergeContent(laptop, tablet))).toEqual([
      'Câu soạn sáng nay',
      'Câu soạn tối qua',
    ])
  })

  it('cùng một câu sửa ở hai nơi thì bản MỚI HƠN thắng', () => {
    const older = pack([q('a', 'Bản cũ', 100)])
    const newer = pack([q('a', 'Bản mới', 200)])

    expect(prompts(mergeContent(older, newer))).toEqual(['Bản mới'])
    // Đổi chiều cũng phải ra đúng kết quả đó - hợp nhất không được phụ thuộc
    // vào máy nào gọi trước.
    expect(prompts(mergeContent(newer, older))).toEqual(['Bản mới'])
  })

  it('xoá ở máy này thì máy kia KHÔNG đẩy câu đó quay về', () => {
    const deleted = pack([q('a', 'Câu đã xoá', 200, 200)])
    const stale = pack([q('a', 'Câu đã xoá', 100)])

    expect(prompts(mergeContent(stale, deleted))).toEqual([])
    expect(prompts(mergeContent(deleted, stale))).toEqual([])
  })

  it('sửa SAU khi xoá thì câu sống lại', () => {
    // Người dùng xoá nhầm rồi soạn lại y hệt trên máy khác - phải nghe theo
    // hành động sau cùng.
    const deleted = pack([q('a', 'Câu', 100, 100)])
    const revived = pack([q('a', 'Câu soạn lại', 200)])

    expect(prompts(mergeContent(deleted, revived))).toEqual(['Câu soạn lại'])
  })

  it('bằng điểm thì XOÁ thắng', () => {
    // Cực hiếm, nhưng phải chọn một phía cố định. Giữ lại một câu người dùng đã
    // xoá thì khó chịu hơn là mất một lần sửa vặt.
    const kept = pack([q('a', 'Còn', 100)])
    const gone = pack([q('a', 'Mất', 100, 100)])

    expect(prompts(mergeContent(kept, gone))).toEqual([])
    expect(prompts(mergeContent(gone, kept))).toEqual([])
  })

  it('hợp nhất với kho rỗng thì không mất gì', () => {
    const mine = pack([q('a', 'Câu của tôi', 100)])
    expect(prompts(mergeContent(mine, pack([])))).toEqual(['Câu của tôi'])
    expect(prompts(mergeContent(pack([]), mine))).toEqual(['Câu của tôi'])
  })

  it('giữ nguyên chủ sở hữu của bản thắng', () => {
    const mine: CustomContent = pack([{ ...q('a', 'Bản cũ', 100), ownerId: null }])
    const theirs: CustomContent = pack([{ ...q('a', 'Bản mới', 200), ownerId: 'co-giao' }])

    expect(mergeContent(mine, theirs).questions[0]!.ownerId).toBe('co-giao')
  })

  it('hợp nhất ba máy liên tiếp vẫn ra đúng một kết quả', () => {
    const a = pack([q('1', 'Của A', 100)])
    const b = pack([q('2', 'Của B', 110)])
    const c = pack([q('3', 'Của C', 120)])

    const trai = mergeContent(mergeContent(a, b), c)
    const phai = mergeContent(a, mergeContent(b, c))
    expect(prompts(trai)).toEqual(prompts(phai))
    expect(prompts(trai)).toEqual(['Của A', 'Của B', 'Của C'])
  })

  it('hợp nhất chính mình không đổi gì', () => {
    const mine = pack([q('a', 'Câu', 100), q('b', 'Câu khác', 200)])
    expect(prompts(mergeContent(mine, mine))).toEqual(prompts(mine))
    expect(mergeContent(mine, mine).questions).toHaveLength(2)
  })
})

describe('ẩn câu và đổi tên cũng hợp nhất được', () => {
  const hidden = (id: string, prompt: string, updatedAt: number, deletedAt: number | null) => ({
    id,
    skillId: 'vietnamese.g1.van-don-gian',
    value: prompt,
    updatedAt,
    deletedAt,
    ownerId: null,
  })

  it('ẩn ở máy này, hiện lại ở máy kia - lần sau cùng thắng', () => {
    const an: CustomContent = { questions: [], hidden: [hidden('h', 'Đề bài', 100, null)], skillNames: [], continents: [] }
    const hien: CustomContent = { questions: [], hidden: [hidden('h', 'Đề bài', 200, 200)], skillNames: [], continents: [] }

    const merged = mergeContent(an, hien)
    expect(merged.hidden[0]!.deletedAt).toBe(200)
  })

  it('tên kỹ năng: bản mới hơn thắng', () => {
    const name = (value: string, updatedAt: number) => ({
      id: 'name:math.g1.cong-tru-10',
      skillId: 'math.g1.cong-tru-10',
      value,
      updatedAt,
      deletedAt: null,
      ownerId: null,
    })
    const cu: CustomContent = { questions: [], hidden: [], skillNames: [name('Tên cũ', 100)], continents: [] }
    const moi: CustomContent = { questions: [], hidden: [], skillNames: [name('Tên mới', 200)], continents: [] }

    expect(mergeContent(cu, moi).skillNames[0]!.value).toBe('Tên mới')
  })
})
