import { describe, expect, it } from 'vitest'
import { requireSkill, skillsFor } from '../content/curriculum'
import type { Question } from '../content/types'
import { applyAttempt, createMastery, type MasteryMap } from './mastery'
import { createRng } from './rng'
import {
  availableSkills,
  bucketOf,
  difficultyFor,
  isUnlocked,
  selectQuestion,
  selectQuestions,
  selectSkill,
  type QuestionSource,
  type SelectionContext,
} from './selector'

const NOW = 1_700_000_000_000
const DAY = 86_400_000

/** Nguồn giả: luôn trả về một câu hỏi cho bất kỳ kỹ năng nào. */
const alwaysSource: QuestionSource = {
  getQuestion: ({ skillId, difficulty, exclude }) => {
    const id = `${skillId}#${difficulty}`
    if (exclude.has(id)) return null
    return {
      id,
      subject: skillId.split('.')[0] as Question['subject'],
      grade: 1,
      skillId,
      difficulty,
      type: 'numeric-input',
      prompt: 'x',
      explanation: 'y',
      answer: { kind: 'numeric', value: 1 },
    } as Question
  },
}

/** Nguồn giả chỉ có câu cho một vài kỹ năng - mô phỏng ngân hàng còn thiếu. */
const partialSource = (availableSkillIds: string[]): QuestionSource => ({
  getQuestion: (req) =>
    availableSkillIds.includes(req.skillId) ? alwaysSource.getQuestion(req) : null,
})

const ctx = (overrides: Partial<SelectionContext> = {}): SelectionContext => ({
  subject: 'math',
  grade: 1,
  mastery: {},
  now: NOW,
  rng: createRng('test'),
  source: alwaysSource,
  ...overrides,
})

/** Nâng mức thạo của một kỹ năng lên xấp xỉ `target`. */
function masteredAt(skillId: string, target: number): MasteryMap {
  let m = createMastery(skillId, NOW)
  let guard = 0
  while (m.mastery < target && guard++ < 100) {
    m = applyAttempt(m, { correct: true, difficulty: 2, durationMs: 6_000 }, NOW)
  }
  return { [skillId]: m }
}

describe('isUnlocked', () => {
  it('kỹ năng không có tiên quyết luôn mở', () => {
    const skill = requireSkill('math.g1.dem-100')
    expect(isUnlocked(skill, {}, 1)).toBe(true)
  })

  it('kỹ năng có tiên quyết cùng lớp bị khoá cho tới khi đủ nền', () => {
    const skill = requireSkill('math.g1.cong-tru-20') // cần cong-tru-10
    expect(isUnlocked(skill, {}, 1)).toBe(false)
    expect(isUnlocked(skill, masteredAt('math.g1.cong-tru-10', 70), 1)).toBe(true)
  })

  it('kỹ năng tiên quyết ở lớp dưới được coi là đã học ở trường', () => {
    // Học sinh lớp 3 mới vào game không bị chặn nội dung lớp 3 vì chưa chơi lớp 2.
    const skill = requireSkill('math.g3.tinh-1000') // cần math.g2.cong-tru-100
    expect(isUnlocked(skill, {}, 3)).toBe(true)
    expect(isUnlocked(skill, {}, 2)).toBe(false)
  })
})

describe('availableSkills', () => {
  // Tiếng Việt lớp 1 là trường hợp khắc nghiệt nhất: chỉ 1 kỹ năng không có
  // tiên quyết, 4 kỹ năng còn lại xếp thành chuỗi phụ thuộc nhau.
  it('luôn cho trẻ mới ít nhất 3 kỹ năng, kể cả khi cổng khoá chặn gần hết', () => {
    const skills = availableSkills(ctx({ subject: 'vietnamese', grade: 1 }))
    expect(skills.length).toBeGreaterThanOrEqual(3)
  })

  it('kỹ năng mở thêm được lấy theo đúng thứ tự chương trình, không lấy tuỳ tiện', () => {
    const skills = availableSkills(ctx({ subject: 'vietnamese', grade: 1 }))
    const expectedOrder = skillsFor('vietnamese', 1).slice(0, skills.length).map((s) => s.id)
    expect(skills.map((s) => s.id)).toEqual(expectedOrder)
  })

  it('khi đã mở khoá đủ nhiều thì không mở thêm kỹ năng bị khoá nữa', () => {
    const skills = availableSkills(ctx({ subject: 'math', grade: 1 }))
    // Lớp 1 Toán có 5 kỹ năng không tiên quyết, chỉ cong-tru-20 bị khoá.
    expect(skills.map((s) => s.id)).not.toContain('math.g1.cong-tru-20')
    expect(skills.length).toBe(5)
  })
})

describe('bucketOf', () => {
  it('kỹ năng mới nằm ở nhóm đang học', () => {
    expect(bucketOf(requireSkill('math.g1.dem-100'), {}, NOW)).toBe('learning')
  })

  it('kỹ năng đã thạo nằm ở nhóm thử thách', () => {
    const map = masteredAt('math.g1.dem-100', 85)
    // Đẩy lịch ôn ra xa để không rơi vào nhóm ôn tập.
    map['math.g1.dem-100']!.dueAt = NOW + 10 * DAY
    expect(bucketOf(requireSkill('math.g1.dem-100'), map, NOW)).toBe('challenge')
  })

  it('kỹ năng đến hạn ôn được ưu tiên vào nhóm ôn tập', () => {
    const map = masteredAt('math.g1.dem-100', 85)
    map['math.g1.dem-100']!.dueAt = NOW - DAY
    expect(bucketOf(requireSkill('math.g1.dem-100'), map, NOW)).toBe('review')
  })
})

describe('difficultyFor', () => {
  it('mức thạo thấp thì ra câu dễ', () => {
    expect(difficultyFor(0, 'learning')).toBe(1)
    expect(difficultyFor(39, 'learning')).toBe(1)
  })

  it('mức thạo trung bình thì ra câu vừa', () => {
    expect(difficultyFor(50, 'learning')).toBe(2)
  })

  it('mức thạo cao thì ra câu khó', () => {
    expect(difficultyFor(90, 'learning')).toBe(3)
  })

  it('nhóm thử thách nâng thêm một bậc nhưng không vượt quá 3', () => {
    expect(difficultyFor(0, 'challenge')).toBe(2)
    expect(difficultyFor(90, 'challenge')).toBe(3)
  })
})

describe('selectSkill', () => {
  it('chỉ chọn kỹ năng thuộc môn đang chơi', () => {
    for (let i = 0; i < 50; i++) {
      const picked = selectSkill(ctx({ rng: createRng(i) }))
      expect(picked!.skill.subject).toBe('math')
    }
  })

  it('không bao giờ ra kỹ năng của lớp trên', () => {
    for (let i = 0; i < 50; i++) {
      const picked = selectSkill(ctx({ grade: 2, rng: createRng(i) }))
      expect(picked!.skill.grade).toBeLessThanOrEqual(2)
    }
  })

  it('học sinh lớp trên vẫn được ôn lại kỹ năng lớp dưới', () => {
    const grades = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const picked = selectSkill(ctx({ grade: 3, rng: createRng(i) }))
      grades.add(picked!.skill.grade)
    }
    expect(grades.has(1)).toBe(true)
    expect(grades.has(3)).toBe(true)
  })

  it('ưu tiên kỹ năng còn yếu hơn kỹ năng đã khá', () => {
    const weak = 'math.g1.dem-100'
    const strong = 'math.g1.hinh-phang'
    const mastery: MasteryMap = { ...masteredAt(strong, 70) }
    mastery[weak] = createMastery(weak, NOW)
    mastery[weak]!.attempts = 1
    mastery[weak]!.dueAt = NOW + 10 * DAY

    let weakHits = 0
    let strongHits = 0
    for (let i = 0; i < 400; i++) {
      const picked = selectSkill(ctx({ mastery, rng: createRng(i) }))
      if (picked!.skill.id === weak) weakHits++
      if (picked!.skill.id === strong) strongHits++
    }
    expect(weakHits).toBeGreaterThan(strongHits)
  })

  it('bỏ qua kỹ năng nằm trong danh sách loại trừ', () => {
    const all = skillsFor('math', 1).map((s) => s.id)
    const exclude = new Set(all.slice(0, all.length - 1))
    const picked = selectSkill(ctx(), exclude)
    expect(picked!.skill.id).toBe(all[all.length - 1])
  })

  it('trả về null khi mọi kỹ năng đều bị loại trừ', () => {
    const exclude = new Set(skillsFor('math', 1).map((s) => s.id))
    expect(selectSkill(ctx(), exclude)).toBeNull()
  })
})

describe('selectQuestion', () => {
  it('trả về đủ kỹ năng, độ khó, nhóm và câu hỏi', () => {
    const selection = selectQuestion(ctx())
    expect(selection).not.toBeNull()
    expect(selection!.question.skillId).toBe(selection!.skill.id)
    expect([1, 2, 3]).toContain(selection!.difficulty)
  })

  it('thử kỹ năng khác khi ngân hàng chưa có câu cho kỹ năng bốc trúng', () => {
    const only = 'math.g1.xem-gio-dung'
    const selection = selectQuestion(ctx({ source: partialSource([only]) }))
    expect(selection!.skill.id).toBe(only)
  })

  it('trả về null khi ngân hàng hoàn toàn trống', () => {
    expect(selectQuestion(ctx({ source: partialSource([]) }))).toBeNull()
  })
})

describe('selectQuestions', () => {
  it('không lặp lại câu hỏi trong cùng một trận', () => {
    const selections = selectQuestions(ctx(), 8)
    const ids = selections.map((s) => s.question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('dừng sớm thay vì lặp khi nguồn cạn câu', () => {
    const selections = selectQuestions(ctx({ source: partialSource(['math.g1.dem-100']) }), 10)
    // Nguồn giả chỉ sinh 3 câu khác nhau cho một kỹ năng (mỗi độ khó một câu).
    expect(selections.length).toBeLessThanOrEqual(3)
    expect(new Set(selections.map((s) => s.question.id)).size).toBe(selections.length)
  })

  it('kết quả tất định với cùng seed', () => {
    const a = selectQuestions(ctx({ rng: createRng('seed-a') }), 6).map((s) => s.question.id)
    const b = selectQuestions(ctx({ rng: createRng('seed-a') }), 6).map((s) => s.question.id)
    expect(a).toEqual(b)
  })

  it('tỉ lệ trộn nghiêng về nhóm đang học', () => {
    const mastery: MasteryMap = {}
    for (const skill of skillsFor('math', 1)) {
      const m = createMastery(skill.id, NOW)
      m.attempts = 1
      m.dueAt = NOW + 10 * DAY // không kỹ năng nào đến hạn ôn
      mastery[skill.id] = m
    }
    // Một kỹ năng đã thạo -> nhóm thử thách
    Object.assign(mastery, masteredAt('math.g1.dem-100', 85))
    mastery['math.g1.dem-100']!.dueAt = NOW + 10 * DAY

    const counts: Record<string, number> = { learning: 0, review: 0, challenge: 0 }
    for (let i = 0; i < 500; i++) {
      const picked = selectSkill(ctx({ mastery, rng: createRng(i) }))
      counts[picked!.bucket] = (counts[picked!.bucket] ?? 0) + 1
    }
    expect(counts.learning!).toBeGreaterThan(counts.challenge!)
  })

  it('kỹ năng quá hạn lâu được ôn trước', () => {
    const mastery: MasteryMap = {}
    for (const skill of skillsFor('math', 1)) {
      const m = createMastery(skill.id, NOW)
      m.attempts = 1
      m.mastery = 50
      m.dueAt = NOW + 10 * DAY
      mastery[skill.id] = m
    }
    mastery['math.g1.xem-gio-dung']!.dueAt = NOW - 30 * DAY

    let overdueHits = 0
    for (let i = 0; i < 300; i++) {
      const picked = selectSkill(ctx({ mastery, rng: createRng(i) }))
      if (picked!.bucket === 'review') {
        expect(picked!.skill.id).toBe('math.g1.xem-gio-dung')
        overdueHits++
      }
    }
    expect(overdueHits).toBeGreaterThan(0)
  })
})

describe('difficultyBoost - đề trận trùm', () => {
  it('nâng thẳng bậc khó, không phụ thuộc trẻ đã thạo hay chưa', () => {
    // Trẻ mới toanh: không có kỹ năng nào vào nhóm "thử thách", nên dồn trọng số
    // sang nhóm đó là vô nghĩa. Chỉ difficultyBoost mới ăn thua.
    const plain = selectQuestions(ctx(), 12)
    const boosted = selectQuestions(ctx({ difficultyBoost: 1 }), 12)

    expect(plain.length).toBeGreaterThan(0)
    expect(boosted.length).toBeGreaterThan(0)

    const mean = (xs: { difficulty: number }[]) =>
      xs.reduce((a, s) => a + s.difficulty, 0) / xs.length
    expect(mean(boosted)).toBeGreaterThan(mean(plain))
  })

  it('không bao giờ vượt bậc 3', () => {
    for (const s of selectQuestions(ctx({ difficultyBoost: 5 }), 12)) {
      expect(s.difficulty).toBeLessThanOrEqual(3)
    }
  })
})
