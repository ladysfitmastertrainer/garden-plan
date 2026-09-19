/**
 * Tính cách sinh ra từ cách đứa trẻ học.
 *
 * Phần lớn test ở đây kiểm một điều duy nhất mà hỏng thì hỏng âm thầm: KHÔNG
 * NẾT NÀO LÀ NẾT DỞ. Nếu "nhanh" mạnh hơn "chậm", trò chơi vừa dạy trẻ rằng
 * đoán bừa cho nhanh thì hơn nghĩ kỹ - và nó dạy hiệu quả hơn mọi lời cô dặn.
 */

import { describe, expect, it } from 'vitest'

import { getPet } from '../content/pets'
import {
  EMPTY_COUNTS,
  FAST_MS,
  NATURE_AFTER,
  NATURE_INFO,
  addAnswers,
  applyNature,
  hintPenaltyScale,
  natureOf,
  natureScale,
  tallyOf,
  type NatureCounts,
} from './nature'

const answer = (durationMs: number, usedHint = false) => ({ durationMs, usedHint })

/** Bảng đếm đã đủ số câu, nghiêng hẳn về một nết. */
const counts = (over: Partial<NatureCounts>): NatureCounts => ({ ...EMPTY_COUNTS, ...over })

describe('một câu rơi vào nết nào', () => {
  it('bấm liền, không gợi ý - nhanh', () => {
    expect(tallyOf(answer(FAST_MS - 1))).toBe('fast')
  })

  it('nghĩ lâu, không gợi ý - chắc', () => {
    expect(tallyOf(answer(FAST_MS + 1))).toBe('careful')
  })

  it('mở gợi ý thì luôn là HAM HỌC, dù bấm nhanh cỡ nào', () => {
    // Gợi ý nói lên nhiều hơn tốc độ: nó nói em ấy biết mình chưa chắc.
    expect(tallyOf(answer(100, true))).toBe('hinted')
  })
})

describe('tích nết qua các trận', () => {
  it('cộng dồn vào bảng cũ, không ghi đè', () => {
    const first = addAnswers(undefined, [answer(1_000), answer(1_000)])
    const second = addAnswers(first, [answer(20_000)])
    expect(second).toEqual({ fast: 2, careful: 1, hinted: 0 })
  })

  it('bảng rỗng vào thì vẫn ra bảng hợp lệ', () => {
    expect(addAnswers(undefined, [])).toEqual(EMPTY_COUNTS)
  })

  it('KHÔNG đụng vào bảng đã truyền vào', () => {
    const before: NatureCounts = { fast: 1, careful: 0, hinted: 0 }
    addAnswers(before, [answer(500)])
    expect(before.fast).toBe(1)
  })
})

describe('chốt tính cách', () => {
  it('chưa đủ câu thì CHƯA RÕ - không đoán bừa', () => {
    expect(natureOf(counts({ fast: NATURE_AFTER - 1 }))).toBeNull()
    expect(natureOf(undefined)).toBeNull()
  })

  it('đủ câu và nghiêng hẳn thì ra đúng nết ấy', () => {
    expect(natureOf(counts({ fast: 12 }))).toBe('gan-li')
    expect(natureOf(counts({ careful: 12 }))).toBe('diem-tinh')
    expect(natureOf(counts({ hinted: 12 }))).toBe('ham-hoc')
  })

  it('hoà thì nghiêng về ĐIỀM TĨNH', () => {
    // Phải chọn một bên, và nếu phải chọn thì chọn cái nết trò chơi muốn trẻ
    // mang ra khỏi đây: nghĩ kỹ rồi hãy trả lời.
    expect(natureOf(counts({ fast: 6, careful: 6 }))).toBe('diem-tinh')
    expect(natureOf(counts({ fast: 4, careful: 4, hinted: 4 }))).toBe('diem-tinh')
  })

  it('đã chốt rồi thì vài câu lẻ không lật ngược ngay', () => {
    const many = counts({ fast: 30, careful: 2, hinted: 2 })
    expect(natureOf(addAnswers(many, [answer(20_000), answer(20_000)]))).toBe('gan-li')
  })
})

describe('không nết nào là nết dở', () => {
  it('mỗi nết có đúng một lợi ích, và nói được thành câu cho trẻ đọc', () => {
    for (const info of Object.values(NATURE_INFO)) {
      expect(info.label.length).toBeGreaterThan(0)
      expect(info.perk.length).toBeGreaterThan(0)
      expect(info.blurb.length).toBeGreaterThan(0)
    }
  })

  it('GAN LÌ đánh đau hơn nhưng KHÔNG dày máu hơn', () => {
    const scale = natureScale('gan-li')
    expect(scale.power).toBeGreaterThan(1)
    expect(scale.hp).toBe(1)
  })

  it('ĐIỀM TĨNH dày máu hơn nhưng KHÔNG đánh đau hơn', () => {
    const scale = natureScale('diem-tinh')
    expect(scale.hp).toBeGreaterThan(1)
    expect(scale.power).toBe(1)
  })

  it('hai nết ấy được lợi BẰNG NHAU - không nết nào trội hơn', () => {
    expect(natureScale('gan-li').power).toBe(natureScale('diem-tinh').hp)
  })

  it('HAM HỌC không cộng chỉ số, mà GỠ cái giá của gợi ý', () => {
    /*
      Đây là nết quan trọng nhất và cũng dễ làm sai nhất. Bình thường mở gợi ý
      thì cú đánh chỉ còn 60% - một cái giá hợp lý. Nhưng với đứa trẻ đã dùng
      gợi ý nhiều tới mức nó thành nết, cái giá ấy đang thu của đúng em cần nó
      nhất, và em sẽ thôi dùng gợi ý kể cả lúc không hiểu bài.
    */
    expect(natureScale('ham-hoc')).toEqual({ hp: 1, power: 1 })
    expect(hintPenaltyScale('ham-hoc')).toBe(1)
    expect(hintPenaltyScale('gan-li')).toBeLessThan(1)
    expect(hintPenaltyScale(null)).toBeLessThan(1)
  })
})

describe('con thú mang tính cách ra trận', () => {
  const cu = getPet('cu-chu')!

  it('chưa rõ tính cách thì giữ nguyên con thú, không sứt một chỉ số nào', () => {
    expect(applyNature(cu, null)).toEqual(cu)
  })

  it('GAN LÌ chỉ đổi sức đánh', () => {
    const out = applyNature(cu, 'gan-li')
    expect(out.power).toBeGreaterThan(cu.power)
    expect(out.maxHp).toBe(cu.maxHp)
  })

  it('ĐIỀM TĨNH chỉ đổi máu', () => {
    const out = applyNature(cu, 'diem-tinh')
    expect(out.maxHp).toBeGreaterThan(cu.maxHp)
    expect(out.power).toBe(cu.power)
  })

  it('không đụng tới bộ chiêu, tên hay hệ - tính cách không biến nó thành con khác', () => {
    const out = applyNature(cu, 'gan-li')
    expect(out.id).toBe(cu.id)
    expect(out.name).toBe(cu.name)
    expect(out.element).toBe(cu.element)
    expect(out.spellIds).toEqual(cu.spellIds)
  })
})
