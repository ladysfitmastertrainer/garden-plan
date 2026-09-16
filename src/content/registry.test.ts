/**
 * Test tích hợp: engine chạy với NỘI DUNG THẬT, không phải nguồn giả.
 * Đây là lưới an toàn bắt lỗi khi selector và registry lệch nhau.
 */

import { describe, expect, it } from 'vitest'
import { ALL_SKILLS, requireSkill, skillsFor } from './curriculum'
import { contentKind, contentSource, sampleQuestion } from './registry'
import { GRADES, SUBJECTS, type Difficulty, type Grade, type Subject } from './types'
import { createRng } from '../engine/rng'
import { judge } from '../engine/judge'
import { selectQuestions, type SelectionContext } from '../engine/selector'

const NOW = 1_700_000_000_000
const DIFFICULTIES: Difficulty[] = [1, 2, 3]

const ctx = (subject: Subject, grade: Grade, seed: string): SelectionContext => ({
  subject,
  grade,
  mastery: {},
  now: NOW,
  rng: createRng(seed),
  source: contentSource,
})

describe('độ phủ nội dung', () => {
  it('mọi kỹ năng trong chương trình đều có nội dung', () => {
    const missing = ALL_SKILLS.filter((s) => contentKind(s.id) === 'none').map((s) => s.id)
    expect(missing).toEqual([])
  })

  it('mỗi kỹ năng đều sinh được câu ở cả ba mức độ khó', () => {
    const gaps: string[] = []
    for (const skill of ALL_SKILLS) {
      for (const d of DIFFICULTIES) {
        const rng = createRng(`${skill.id}-${d}`)
        if (!sampleQuestion(skill.id, d, rng)) gaps.push(`${skill.id}@${d}`)
      }
    }
    expect(gaps).toEqual([])
  })
})

describe('contentSource', () => {
  it('trả về null cho kỹ năng không tồn tại thay vì ném lỗi', () => {
    const question = contentSource.getQuestion({
      skillId: 'khong.co.that',
      difficulty: 1,
      rng: createRng(1),
      exclude: new Set(),
    })
    expect(question).toBeNull()
  })

  it('tôn trọng danh sách loại trừ', () => {
    const rng = createRng('loai-tru')
    const first = contentSource.getQuestion({
      skillId: 'vietnamese.g1.am-chu-cai',
      difficulty: 1,
      rng,
      exclude: new Set(),
    })!
    const second = contentSource.getQuestion({
      skillId: 'vietnamese.g1.am-chu-cai',
      difficulty: 1,
      rng,
      exclude: new Set([first.id]),
    })
    expect(second?.id).not.toBe(first.id)
  })

  it('câu sinh ra luôn khớp kỹ năng, môn, lớp và độ khó đã yêu cầu', () => {
    for (const skill of ALL_SKILLS) {
      for (const d of DIFFICULTIES) {
        const q = sampleQuestion(skill.id, d, createRng(`${skill.id}-${d}-check`))!
        expect(q.skillId).toBe(skill.id)
        expect(q.subject).toBe(skill.subject)
        expect(q.grade).toBe(skill.grade)
        expect(q.difficulty).toBe(d)
      }
    }
  })
})

describe('chọn câu cho một trận đấu thật', () => {
  it('mọi cặp (môn, lớp) đều đủ câu cho một trận 10 câu', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const selections = selectQuestions(ctx(subject, grade, `${subject}-${grade}`), 10)
        expect(
          selections.length,
          `${subject} lớp ${grade} chỉ chọn được ${selections.length}/10 câu`,
        ).toBe(10)
      }
    }
  })

  it('không lặp câu trong một trận, với mọi môn và lớp', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        const ids = selectQuestions(ctx(subject, grade, `seed-${subject}${grade}`), 10).map(
          (s) => s.question.id,
        )
        expect(new Set(ids).size).toBe(ids.length)
      }
    }
  })

  it('câu chọn ra không bao giờ thuộc lớp cao hơn lớp của trẻ', () => {
    for (const subject of SUBJECTS) {
      for (const grade of GRADES) {
        for (const s of selectQuestions(ctx(subject, grade, `grade-${subject}${grade}`), 10)) {
          expect(s.question.grade).toBeLessThanOrEqual(grade)
        }
      }
    }
  })
})

describe('quy tắc riêng của từng môn', () => {
  it('MỌI câu môn Đạo đức đều là tình huống, không câu nào chấm đúng/sai', () => {
    for (const skill of ALL_SKILLS.filter((s) => s.subject === 'ethics')) {
      for (const d of DIFFICULTIES) {
        const q = sampleQuestion(skill.id, d, createRng(`${skill.id}-${d}-ethics`))!
        expect(q.type, `${q.id} phải là thể loại scenario`).toBe('scenario')
      }
    }
  })

  it('mọi tình huống Đạo đức đều có ít nhất một lựa chọn tốt', () => {
    for (const skill of ALL_SKILLS.filter((s) => s.subject === 'ethics')) {
      for (const d of DIFFICULTIES) {
        const q = sampleQuestion(skill.id, d, createRng(`${skill.id}-${d}-good`))!
        if (q.type !== 'scenario') continue
        expect(q.options.some((o) => o.quality === 'good')).toBe(true)
      }
    }
  })

  it('lựa chọn chưa tốt trong Đạo đức trả về lời giải thích riêng, không phải explanation chung', () => {
    const q = sampleQuestion('ethics.g2.nhan-loi-sua-loi', 1, createRng('poor'))!
    if (q.type !== 'scenario') throw new Error('câu mẫu phải là tình huống')
    const poor = q.options.find((o) => o.quality === 'poor')!
    const result = judge(q, { kind: 'choice', choiceId: poor.id })
    expect(result.correct).toBe(false)
    expect(result.message).toBe(poor.feedback)
  })

  it('môn Âm nhạc có cả câu nghe lẫn câu lý thuyết', () => {
    const types = new Set<string>()
    for (const skill of ALL_SKILLS.filter((s) => s.subject === 'music')) {
      for (const d of DIFFICULTIES) {
        types.add(sampleQuestion(skill.id, d, createRng(`${skill.id}-${d}-music`))!.type)
      }
    }
    expect(types.has('audio-choice')).toBe(true)
    expect(types.has('rhythm-tap')).toBe(true)
    expect(types.has('multiple-choice')).toBe(true)
  })

  it('câu Toán chủ yếu là nhập số hoặc trắc nghiệm - phù hợp với trẻ nhỏ', () => {
    for (const skill of skillsFor('math', 1)) {
      for (const d of DIFFICULTIES) {
        const q = sampleQuestion(skill.id, d, createRng(`${skill.id}-${d}-math`))!
        expect(['numeric-input', 'multiple-choice']).toContain(q.type)
      }
    }
  })
})

describe('generator sinh câu đa dạng', () => {
  it('cùng một kỹ năng Toán sinh ra nhiều câu khác nhau', () => {
    const rng = createRng('da-dang')
    const ids = new Set<string>()
    const skill = requireSkill('math.g1.cong-tru-10')
    for (let i = 0; i < 50; i++) {
      ids.add(sampleQuestion(skill.id, 1, rng)!.id)
    }
    expect(ids.size).toBeGreaterThan(10)
  })

  it('cùng seed thì sinh ra cùng câu hỏi - tái lập được khi cần tra lỗi', () => {
    const a = sampleQuestion('math.g3.chu-vi', 2, createRng('cung-seed'))!
    const b = sampleQuestion('math.g3.chu-vi', 2, createRng('cung-seed'))!
    expect(a.id).toBe(b.id)
    expect(a.prompt).toBe(b.prompt)
  })
})
