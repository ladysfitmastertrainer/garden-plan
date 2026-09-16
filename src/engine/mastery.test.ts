import { describe, expect, it } from 'vitest'
import {
  MASTERED_THRESHOLD,
  applyAttempt,
  createMastery,
  dueSkills,
  isDue,
  masteryLevel,
  type SkillMastery,
} from './mastery'

const NOW = 1_700_000_000_000
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

const attempt = (correct: boolean, overrides: Partial<Parameters<typeof applyAttempt>[1]> = {}) => ({
  correct,
  difficulty: 2 as const,
  durationMs: 6_000,
  ...overrides,
})

describe('createMastery', () => {
  it('kỹ năng mới bắt đầu ở mức 0, hộp 1 và đến hạn ngay', () => {
    const m = createMastery('math.g1.cong-tru-10', NOW)
    expect(m.mastery).toBe(0)
    expect(m.box).toBe(1)
    expect(m.attempts).toBe(0)
    expect(masteryLevel(m)).toBe('new')
  })

  it('kỹ năng chưa làm lần nào thì không tính là đến hạn ôn', () => {
    expect(isDue(createMastery('x', NOW), NOW)).toBe(false)
  })
})

describe('applyAttempt', () => {
  it('trả lời đúng thì tăng mức thạo', () => {
    const before = createMastery('x', NOW)
    const after = applyAttempt(before, attempt(true), NOW)
    expect(after.mastery).toBeGreaterThan(before.mastery)
    expect(after.correct).toBe(1)
    expect(after.attempts).toBe(1)
    expect(after.streak).toBe(1)
  })

  it('mức tăng nhỏ dần khi càng gần 100', () => {
    let m = createMastery('x', NOW)
    const gains: number[] = []
    for (let i = 0; i < 6; i++) {
      const next = applyAttempt(m, attempt(true), NOW)
      gains.push(next.mastery - m.mastery)
      m = next
    }
    expect(gains[0]!).toBeGreaterThan(gains[gains.length - 1]!)
  })

  it('không bao giờ vượt quá 100', () => {
    let m = createMastery('x', NOW)
    for (let i = 0; i < 60; i++) m = applyAttempt(m, attempt(true), NOW)
    expect(m.mastery).toBeLessThanOrEqual(100)
  })

  it('trả lời sai thì giảm điểm nhưng không xuống dưới 0', () => {
    let m = createMastery('x', NOW)
    for (let i = 0; i < 5; i++) m = applyAttempt(m, attempt(false), NOW)
    expect(m.mastery).toBe(0)
    expect(m.correct).toBe(0)
    expect(m.attempts).toBe(5)
  })

  it('một câu sai không xoá sạch công sức nhiều câu đúng', () => {
    let m = createMastery('x', NOW)
    for (let i = 0; i < 4; i++) m = applyAttempt(m, attempt(true), NOW)
    const beforeMiss = m.mastery
    m = applyAttempt(m, attempt(false), NOW)
    expect(m.mastery).toBeGreaterThan(beforeMiss / 2)
  })

  it('câu khó đúng được cộng nhiều hơn câu dễ đúng', () => {
    const base = createMastery('x', NOW)
    const easy = applyAttempt(base, attempt(true, { difficulty: 1 }), NOW)
    const hard = applyAttempt(base, attempt(true, { difficulty: 3 }), NOW)
    expect(hard.mastery).toBeGreaterThan(easy.mastery)
  })

  it('dùng gợi ý thì được cộng ít hơn', () => {
    const base = createMastery('x', NOW)
    const noHint = applyAttempt(base, attempt(true), NOW)
    const withHint = applyAttempt(base, attempt(true, { usedHint: true }), NOW)
    expect(withHint.mastery).toBeLessThan(noHint.mastery)
  })

  it('lên hộp sau hai câu đúng liên tiếp, không phải một', () => {
    let m = createMastery('x', NOW)
    m = applyAttempt(m, attempt(true), NOW)
    expect(m.box).toBe(1)
    m = applyAttempt(m, attempt(true), NOW)
    expect(m.box).toBe(2)
  })

  it('trả lời sai chỉ lùi một hộp, không về hộp 1', () => {
    let m = createMastery('x', NOW)
    for (let i = 0; i < 8; i++) m = applyAttempt(m, attempt(true), NOW)
    expect(m.box).toBe(5)
    m = applyAttempt(m, attempt(false), NOW)
    expect(m.box).toBe(4)
  })

  it('hộp cao thì lịch ôn giãn ra xa hơn', () => {
    let m = createMastery('x', NOW)
    const firstDue = applyAttempt(m, attempt(true), NOW).dueAt
    for (let i = 0; i < 8; i++) m = applyAttempt(m, attempt(true), NOW)
    expect(m.dueAt - NOW).toBeGreaterThan(firstDue - NOW)
    expect(m.dueAt - NOW).toBe(21 * DAY)
  })

  it('chuỗi đúng bị reset khi trả lời sai', () => {
    let m = createMastery('x', NOW)
    m = applyAttempt(m, attempt(true), NOW)
    m = applyAttempt(m, attempt(true), NOW)
    expect(m.streak).toBe(2)
    m = applyAttempt(m, attempt(false), NOW)
    expect(m.streak).toBe(0)
  })
})

describe('masteryLevel', () => {
  it('đạt mức "đã thạo" khi vượt ngưỡng', () => {
    let m = createMastery('x', NOW)
    while (m.mastery < MASTERED_THRESHOLD) m = applyAttempt(m, attempt(true), NOW)
    expect(masteryLevel(m)).toBe('mastered')
  })
})

describe('dueSkills', () => {
  it('trả về kỹ năng quá hạn lâu nhất trước', () => {
    const map: Record<string, SkillMastery> = {
      a: { ...createMastery('a', NOW), attempts: 1, dueAt: NOW - 2 * DAY },
      b: { ...createMastery('b', NOW), attempts: 1, dueAt: NOW - 5 * DAY },
      c: { ...createMastery('c', NOW), attempts: 1, dueAt: NOW + DAY },
    }
    expect(dueSkills(map, NOW).map((m) => m.skillId)).toEqual(['b', 'a'])
  })
})
