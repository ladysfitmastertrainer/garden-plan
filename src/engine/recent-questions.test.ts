/**
 * Câu hỏi không lặp lại giữa những con quái liên tiếp.
 *
 * Chạy trên NGÂN HÀNG CÂU HỎI THẬT chứ không trên nguồn giả: lỗi lặp câu chỉ lộ
 * ra khi kho câu nhỏ như thật - kỹ năng soạn tay chỉ có vài câu mỗi bậc - và một
 * nguồn giả sinh câu vô hạn thì không bao giờ lặp, dù bộ chọn có nhớ hay không.
 */

import { describe, expect, it } from 'vitest'
import { contentSource } from '../content/registry'
import type { Grade, Question, Subject } from '../content/types'
import { createRng } from './rng'
import { selectQuestions, type QuestionSource, type SelectionContext } from './selector'

const NOW = 1_700_000_000_000

/**
 * Một em đánh liên tiếp `battles` con quái, mỗi trận `perBattle` câu. Trả về
 * số câu đã gặp ở một trận TRƯỚC ĐÓ - tức là số lần lặp mà trẻ nhận ra được.
 */
function playStreak(subject: Subject, grade: Grade, remember: boolean, battles = 8, perBattle = 8): number {
  const recent: string[] = []
  const seen = new Set<string>()
  let repeats = 0
  for (let b = 0; b < battles; b++) {
    const ctx: SelectionContext = {
      subject,
      grade,
      mastery: {},
      now: NOW,
      rng: createRng(`${subject}-${grade}-${b}`),
      source: contentSource,
      ...(remember ? { recent: new Set(recent) } : {}),
    }
    for (const { question } of selectQuestions(ctx, perBattle)) {
      if (seen.has(question.id)) repeats++
      seen.add(question.id)
      recent.push(question.id)
    }
  }
  return repeats
}

describe('không lặp câu giữa các con quái', () => {
  it('nhớ câu đã gặp thì lặp ít hẳn, ở mọi môn', () => {
    for (const subject of ['math', 'vietnamese', 'ethics', 'music'] as const) {
      const forgetful = playStreak(subject, 2, false)
      const mindful = playStreak(subject, 2, true)
      expect(mindful, `${subject}: ${mindful} lần lặp khi nhớ, ${forgetful} khi không nhớ`).toBeLessThan(
        Math.max(1, forgetful),
      )
    }
  })

  it('kho câu cạn thì vẫn hỏi lại câu cũ - trận không bao giờ thiếu câu', () => {
    // Một kỹ năng chỉ có đúng ba câu, và cả ba đều vừa gặp ở trận trước.
    const tiny: QuestionSource = {
      getQuestion: ({ skillId, difficulty, rng, exclude }) => {
        const pool = [1, 2, 3]
          .map((n) => ({ id: `${skillId}#${n}`, skillId, difficulty }) as unknown as Question)
          .filter((q) => !exclude.has(q.id))
        return pool.length > 0 ? rng.pick(pool) : null
      },
    }
    const ctx = (recent: Set<string>): SelectionContext => ({
      subject: 'math',
      grade: 1,
      mastery: {},
      now: NOW,
      rng: createRng('can'),
      source: tiny,
      recent,
    })
    const first = selectQuestions(ctx(new Set()), 5)
    const again = selectQuestions(ctx(new Set(first.map((s) => s.question.id))), 5)
    expect(again).toHaveLength(first.length)
  })

  it('không nhớ gì thì bốc y như trước - hạt giống cũ ra đúng câu cũ', () => {
    const base: SelectionContext = {
      subject: 'vietnamese',
      grade: 1,
      mastery: {},
      now: NOW,
      rng: createRng('giong'),
      source: contentSource,
    }
    const plain = selectQuestions(base, 6).map((s) => s.question.id)
    const empty = selectQuestions({ ...base, rng: createRng('giong'), recent: new Set() }, 6).map(
      (s) => s.question.id,
    )
    expect(empty).toEqual(plain)
  })
})
