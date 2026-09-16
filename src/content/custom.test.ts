import { beforeEach, describe, expect, it } from 'vitest'
import {
  addQuestion,
  getCustomContent,
  customCounts,
  customQuestions,
  customRows,
  exportContent,
  importContent,
  isHidden,
  removeQuestion,
  resetContent,
  sanitiseEntry,
  setHidden,
  setSkillName,
  skillNameOverride,
  updateQuestion,
} from './custom'
import { getSkill, originalSkillName } from './curriculum'
import { contentCount, contentSource, sampleQuestion } from './registry'
import { createRng } from '../engine/rng'

/** Một kỹ năng Toán có sẵn bộ sinh, và một kỹ năng Tiếng Việt có ngân hàng tay. */
const MATH_SKILL = 'math.g1.cong-tru-10'
const BANK_SKILL = 'vietnamese.g1.van-don-gian'

const GOOD_CHOICE = {
  kind: 'choice',
  difficulty: 1,
  prompt: 'Cô Lan có 3 quả cam, cho đi 1 quả. Còn mấy quả?',
  correct: '2 quả',
  distractors: ['3 quả', '4 quả'],
  explanation: '3 - 1 = 2.',
}

beforeEach(() => {
  resetContent()
})

describe('nhặt câu hợp lệ', () => {
  it('nhận câu trắc nghiệm đủ đề bài, đáp án đúng và đáp án sai', () => {
    const entry = sanitiseEntry(GOOD_CHOICE)
    expect(entry?.kind).toBe('choice')
    expect(entry?.prompt).toBe(GOOD_CHOICE.prompt)
  })

  it('từ chối câu không có đề bài', () => {
    expect(sanitiseEntry({ ...GOOD_CHOICE, prompt: '   ' })).toBeNull()
  })

  it('từ chối câu trắc nghiệm không có đáp án sai nào', () => {
    // Lọt được vào ngân hàng là trẻ gặp câu chỉ có một nút để bấm.
    expect(sanitiseEntry({ ...GOOD_CHOICE, distractors: [] })).toBeNull()
    expect(sanitiseEntry({ ...GOOD_CHOICE, distractors: ['2 quả'] })).toBeNull()
  })

  it('từ chối câu gõ đáp án mà không nhận cách viết nào', () => {
    expect(sanitiseEntry({ kind: 'text', prompt: 'Viết số mười hai', accepted: [] })).toBeNull()
  })

  it('từ chối thể loại nối cặp - chưa soạn được từ trình duyệt', () => {
    expect(sanitiseEntry({ kind: 'pairs', prompt: 'Nối', pairs: [['a', 'b']] })).toBeNull()
  })

  it('mức khó lạ thì về mức 1 chứ không vứt cả câu', () => {
    expect(sanitiseEntry({ ...GOOD_CHOICE, difficulty: 9 })?.difficulty).toBe(1)
  })

  it('tình huống cần ít nhất hai lựa chọn', () => {
    const one = { kind: 'scenario', prompt: 'Bạn làm rơi bút', options: [{ label: 'Nhặt giúp' }] }
    expect(sanitiseEntry(one)).toBeNull()
    expect(sanitiseEntry({ ...one, options: [{ label: 'Nhặt giúp' }, { label: 'Bỏ đi' }] })).not.toBeNull()
  })
})

describe('thêm, sửa, xoá câu', () => {
  it('thêm được và đếm được', () => {
    expect(addQuestion(MATH_SKILL, GOOD_CHOICE)).toBe(true)
    expect(customQuestions(MATH_SKILL)).toHaveLength(1)
    expect(customCounts().questions).toBe(1)
  })

  it('không thêm câu hỏng', () => {
    expect(addQuestion(MATH_SKILL, { kind: 'choice', prompt: '' })).toBe(false)
    expect(customQuestions(MATH_SKILL)).toHaveLength(0)
  })

  it('sửa được câu đã thêm', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    const id = customRows(MATH_SKILL)[0]!.id
    expect(updateQuestion(id, { ...GOOD_CHOICE, prompt: 'Đề mới' })).toBe(true)
    expect(customQuestions(MATH_SKILL)[0]!.prompt).toBe('Đề mới')
  })

  it('sửa bằng câu hỏng thì KHÔNG ghi đè câu đang có', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    const id = customRows(MATH_SKILL)[0]!.id
    expect(updateQuestion(id, { kind: 'choice', prompt: '' })).toBe(false)
    expect(customQuestions(MATH_SKILL)[0]!.prompt).toBe(GOOD_CHOICE.prompt)
  })

  it('xoá xong thì không còn hiện ra nữa', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    removeQuestion(customRows(MATH_SKILL)[0]!.id)
    expect(customQuestions(MATH_SKILL)).toHaveLength(0)
    expect(customCounts().questions).toBe(0)
  })

  it('xoá để lại BIA MỘ, không xoá hẳn', () => {
    // Xoá hẳn thì lần đồng bộ sau máy kia lại đẩy câu đó quay về, và người dùng
    // xoá đi xoá lại mãi không được.
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    const id = customRows(MATH_SKILL)[0]!.id
    removeQuestion(id)

    const all = getCustomContent().questions
    expect(all).toHaveLength(1)
    expect(all[0]!.id).toBe(id)
    expect(all[0]!.deletedAt).not.toBeNull()
  })

  it('mỗi câu có id riêng', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    addQuestion(MATH_SKILL, { ...GOOD_CHOICE, prompt: 'Câu khác' })
    const ids = customRows(MATH_SKILL).map((row) => row.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('câu tự soạn đi thẳng vào trận', () => {
  it('câu của mình được hỏi TRƯỚC, kể cả ở kỹ năng có bộ sinh', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    const question = contentSource.getQuestion({
      skillId: MATH_SKILL,
      difficulty: 1,
      rng: createRng('test'),
      exclude: new Set(),
    })
    expect(question?.prompt).toBe(GOOD_CHOICE.prompt)
  })

  it('hỏi hết câu của mình rồi thì rơi xuống bộ sinh, không tắc', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    const mine = contentSource.getQuestion({
      skillId: MATH_SKILL,
      difficulty: 1,
      rng: createRng('test'),
      exclude: new Set(),
    })!
    const next = contentSource.getQuestion({
      skillId: MATH_SKILL,
      difficulty: 1,
      rng: createRng('test-2'),
      exclude: new Set([mine.id]),
    })
    expect(next).not.toBeNull()
    expect(next!.id).not.toBe(mine.id)
  })

  it('câu ở mức khó khác không chen vào mức đang hỏi', () => {
    addQuestion(BANK_SKILL, { ...GOOD_CHOICE, difficulty: 3 })
    const question = contentSource.getQuestion({
      skillId: BANK_SKILL,
      difficulty: 1,
      rng: createRng('test'),
      exclude: new Set(),
    })
    expect(question?.prompt).not.toBe(GOOD_CHOICE.prompt)
  })

  it('xem trước ở trang quản trị thấy đúng câu của mình', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    expect(sampleQuestion(MATH_SKILL, 1, createRng('x'))?.prompt).toBe(GOOD_CHOICE.prompt)
  })
})

describe('ẩn câu gốc', () => {
  it('ẩn rồi thì số câu của kỹ năng giảm đi', () => {
    const before = contentCount(BANK_SKILL)
    const first = sampleQuestion(BANK_SKILL, 1, createRng('seed'))!
    setHidden(BANK_SKILL, first.prompt, true)
    expect(isHidden(BANK_SKILL, first.prompt)).toBe(true)
    expect(contentCount(BANK_SKILL)).toBe(before - 1)
  })

  it('câu đã ẩn không bao giờ được bốc ra nữa', () => {
    const target = sampleQuestion(BANK_SKILL, 1, createRng('seed'))!
    setHidden(BANK_SKILL, target.prompt, true)

    for (let i = 0; i < 40; i++) {
      const q = contentSource.getQuestion({
        skillId: BANK_SKILL,
        difficulty: 1,
        rng: createRng(`lan-${i}`),
        exclude: new Set(),
      })
      if (q) expect(q.prompt).not.toBe(target.prompt)
    }
  })

  it('hiện lại được', () => {
    const target = sampleQuestion(BANK_SKILL, 1, createRng('seed'))!
    setHidden(BANK_SKILL, target.prompt, true)
    setHidden(BANK_SKILL, target.prompt, false)
    expect(isHidden(BANK_SKILL, target.prompt)).toBe(false)
    expect(customCounts().hidden).toBe(0)
  })
})

describe('đổi tên kỹ năng', () => {
  it('tên mới hiện ra ở mọi nơi đọc kỹ năng', () => {
    setSkillName(MATH_SKILL, 'Cộng trừ trong phạm vi 10 (bài của cô Hà)')
    expect(getSkill(MATH_SKILL)?.name).toBe('Cộng trừ trong phạm vi 10 (bài của cô Hà)')
  })

  it('tên gốc trong mã không bị đụng tới', () => {
    const before = originalSkillName(MATH_SKILL)
    setSkillName(MATH_SKILL, 'Tên khác hẳn')
    expect(originalSkillName(MATH_SKILL)).toBe(before)
  })

  it('đặt tên rỗng là về tên gốc', () => {
    setSkillName(MATH_SKILL, 'Tên khác hẳn')
    setSkillName(MATH_SKILL, '   ')
    expect(skillNameOverride(MATH_SKILL)).toBeNull()
    expect(getSkill(MATH_SKILL)?.name).toBe(originalSkillName(MATH_SKILL))
  })
})

describe('mang đi, mang về, dọn sạch', () => {
  it('xuất rồi nạp lại ra đúng những gì đang có', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    setSkillName(MATH_SKILL, 'Tên của lớp')
    const saved = exportContent()

    resetContent()
    expect(customQuestions(MATH_SKILL)).toHaveLength(0)

    expect(importContent(saved)).toBe(1)
    expect(customQuestions(MATH_SKILL)).toHaveLength(1)
    expect(skillNameOverride(MATH_SKILL)).toBe('Tên của lớp')
  })

  it('tệp rác thì báo hỏng chứ không làm mất phần đang có', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    expect(importContent('{{{ không phải json')).toBeNull()
    expect(customQuestions(MATH_SKILL)).toHaveLength(1)
  })

  it('nạp tệp là HỢP NHẤT, không thay thế', () => {
    // Nạp tệp của đồng nghiệp thì phần mình đang có phải còn nguyên.
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    const other = JSON.stringify({
      questions: [
        {
          id: 'cua-nguoi-khac',
          skillId: MATH_SKILL,
          value: { ...GOOD_CHOICE, prompt: 'Câu của cô Hà' },
          updatedAt: Date.now(),
          deletedAt: null,
        },
      ],
    })
    expect(importContent(other)).toBe(1)
    expect(customQuestions(MATH_SKILL)).toHaveLength(2)
  })

  it('nạp được cả tệp xuất ra từ bản cũ', () => {
    const legacy = JSON.stringify({ questions: { [MATH_SKILL]: [GOOD_CHOICE] } })
    expect(importContent(legacy)).toBe(1)
    expect(customQuestions(MATH_SKILL)).toHaveLength(1)
  })

  it('tệp đúng dạng nhưng có câu hỏng thì chỉ bỏ câu hỏng', () => {
    const now = Date.now()
    const mixed = JSON.stringify({
      questions: [
        { id: 'a', skillId: MATH_SKILL, value: GOOD_CHOICE, updatedAt: now, deletedAt: null },
        { id: 'b', skillId: MATH_SKILL, value: { kind: 'choice', prompt: '' }, updatedAt: now, deletedAt: null },
      ],
    })
    expect(importContent(mixed)).toBe(1)
    expect(customQuestions(MATH_SKILL)).toHaveLength(1)
  })

  it('xoá hết là app về đúng nội dung gốc', () => {
    addQuestion(MATH_SKILL, GOOD_CHOICE)
    setSkillName(MATH_SKILL, 'Tên của lớp')
    const target = sampleQuestion(BANK_SKILL, 1, createRng('seed'))!
    setHidden(BANK_SKILL, target.prompt, true)

    resetContent()

    expect(customCounts()).toEqual({ questions: 0, hidden: 0, renamed: 0 })
    expect(getSkill(MATH_SKILL)?.name).toBe(originalSkillName(MATH_SKILL))
    expect(isHidden(BANK_SKILL, target.prompt)).toBe(false)
  })
})
