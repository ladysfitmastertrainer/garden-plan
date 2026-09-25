/**
 * Kho tình huống Đạo đức đủ dày để không lặp câu giữa các con quái.
 *
 * Hai điều có thể lặng lẽ hỏng mà không ai thấy: một file ngân hàng khai trùng
 * kỹ năng rồi ĐÈ MẤT câu của file khác (phép trải object làm đúng như thế), và
 * một kỹ năng bị bớt câu tới mức em mới chơi gặp lại ngay câu vừa làm.
 */

import { describe, expect, it } from 'vitest'
import { skillsFor } from './curriculum'
import { BANKS, mergeBanks } from './registry'
import { GRADES } from './types'

describe('kho tình huống Đạo đức', () => {
  it('gộp ngân hàng NỐI câu của cùng kỹ năng, không đè', () => {
    const a = { 'x.g1.k': [{ kind: 'text', difficulty: 1, prompt: 'A', explanation: '', accepted: ['a'] }] } as const
    const b = { 'x.g1.k': [{ kind: 'text', difficulty: 1, prompt: 'B', explanation: '', accepted: ['b'] }] } as const
    const merged = mergeBanks(a as never, b as never)
    expect(merged['x.g1.k']!.map((e) => e.prompt)).toEqual(['A', 'B'])
  })

  it('mỗi kỹ năng có ít nhất sáu tình huống, và ít nhất ba câu bậc dễ', () => {
    for (const grade of GRADES) {
      for (const skill of skillsFor('ethics', grade)) {
        const entries = BANKS[skill.id] ?? []
        expect(entries.length, skill.id).toBeGreaterThanOrEqual(6)
        // Em mới chơi chủ yếu nhận câu bậc 1 - đó là chỗ phải dày nhất.
        expect(entries.filter((e) => e.difficulty === 1).length, skill.id).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('không có hai tình huống trùng đề bài', () => {
    const prompts = Object.entries(BANKS)
      .filter(([id]) => id.startsWith('ethics.'))
      .flatMap(([, entries]) => entries.map((e) => e.prompt))
    expect(new Set(prompts).size).toBe(prompts.length)
  })
})
