/**
 * Mỗi bộ sinh câu Âm nhạc phải sinh ra đủ nhiều câu KHÁC NHAU ở mọi bậc.
 *
 * Bản cũ có hơn năm mươi nhánh (kỹ năng x bậc) viết cứng đúng một câu - "Nhịp
 * 2/4 có mấy phách?", tiết tấu vỗ tay luôn là [1, 1, 2] - nên trẻ đánh một chặng
 * Âm nhạc là gặp lại y nguyên câu ấy mỗi lượt. Test này giữ cho không nhánh nào
 * quay về như thế.
 *
 * Ngưỡng thấp hơn Toán (sáu thay vì chín) có lý do: vài nhánh là kiến thức có
 * số mục thật sự hữu hạn - nhịp 3/4 chỉ có ba phách, khuông nhạc chỉ có bảy vị
 * trí nốt cơ bản - và bịa thêm mục chỉ để qua test thì sai kiến thức.
 */

import { describe, expect, it } from 'vitest'
import { skillsFor } from './curriculum'
import { contentSource } from './registry'
import { GRADES, type Difficulty } from './types'
import { createRng } from '../engine/rng'
import { randomRhythm } from './music'

const MIN_DISTINCT = 6

describe('độ đa dạng của bộ sinh câu Âm nhạc', () => {
  for (const grade of GRADES) {
    it(`lớp ${grade}: mọi kỹ năng, mọi bậc sinh được ít nhất ${MIN_DISTINCT} câu khác nhau`, () => {
      for (const skill of skillsFor('music', grade)) {
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

describe('tiết tấu ngẫu nhiên', () => {
  it('luôn đủ đúng số phách, đủ số tiếng, và móc đơn luôn đi thành cặp', () => {
    for (let i = 0; i < 500; i++) {
      const rng = createRng(`tiet-tau-${i}`)
      const beats = rng.int(3, 8)
      const pattern = randomRhythm(rng, beats, [0.5, 1, 2], 3)
      expect(pattern.reduce((a, b) => a + b, 0)).toBe(beats)
      expect(pattern.length).toBeGreaterThanOrEqual(3)
      // Móc đơn lẻ loi không có trong tiết tấu tiểu học: đếm số móc đơn phải chẵn.
      expect(pattern.filter((p) => p === 0.5).length % 2).toBe(0)
    }
  })

  it('lớp 1 chỉ dùng nốt một phách và hai phách', () => {
    for (let i = 0; i < 200; i++) {
      const pattern = randomRhythm(createRng(`lop-1-${i}`), 5, [1, 1, 2], 3)
      for (const p of pattern) expect([1, 2]).toContain(p)
    }
  })
})
