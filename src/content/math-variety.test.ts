/**
 * Mỗi bộ sinh câu Toán phải sinh ra đủ nhiều câu KHÁC NHAU ở mọi bậc.
 *
 * "Sinh tự động" nghe như vô hạn, nhưng một nhánh viết cứng một câu thì nhánh ấy
 * chỉ có đúng một câu - vài chặng lớp 2 từng như vậy ("Quả bóng có dạng khối
 * gì?", "Đơn vị nào dùng để đo cân nặng?"), và trẻ luyện đúng chặng đó thì gặp
 * lại y nguyên câu ấy mỗi lượt. Không lỗi nào nổ ra; chỉ trẻ nhận thấy.
 */

import { describe, expect, it } from 'vitest'
import { skillsFor } from './curriculum'
import { contentSource } from './registry'
import { GRADES, type Difficulty } from './types'
import { createRng } from '../engine/rng'

/** Ngưỡng tối thiểu: đủ cho một chặng hỏi liền nhiều trận mà không lặp ngay. */
const MIN_DISTINCT = 9

describe('độ đa dạng của bộ sinh câu Toán', () => {
  for (const grade of GRADES) {
    it(`lớp ${grade}: mọi kỹ năng, mọi bậc sinh được ít nhất ${MIN_DISTINCT} câu khác nhau`, () => {
      for (const skill of skillsFor('math', grade)) {
        for (const d of [1, 2, 3] as Difficulty[]) {
          const ids = new Set<string>()
          for (let i = 0; i < 300; i++) {
            const q = contentSource.getQuestion({
              skillId: skill.id,
              difficulty: d,
              rng: createRng(`${skill.id}-${d}-${i}`),
              exclude: new Set(),
            })
            if (q) ids.add(q.id)
          }
          expect(ids.size, `${skill.id} bậc ${d}`).toBeGreaterThanOrEqual(MIN_DISTINCT)
        }
      }
    })
  }
})
