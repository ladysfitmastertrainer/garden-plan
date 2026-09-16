import { describe, expect, it } from 'vitest'

import { generatePin, isWeakPin } from './pin'

/** Nguồn ngẫu nhiên giả: phát ra đúng dãy chữ số đã cho, rồi lặp lại. */
function digitsFrom(source: string): () => number {
  let i = 0
  return () => Number(source[i++ % source.length])
}

describe('isWeakPin', () => {
  it('bắt mã bốn chữ số giống nhau', () => {
    for (const pin of ['0000', '1111', '5555', '9999']) {
      expect(isWeakPin(pin)).toBe(true)
    }
  })

  it('bắt dãy tăng và giảm liên tiếp', () => {
    for (const pin of ['0123', '1234', '6789', '3210', '4321', '9876']) {
      expect(isWeakPin(pin)).toBe(true)
    }
  })

  it('bắt những mã hay bị mò đầu tiên', () => {
    for (const pin of ['1379', '2580', '1212', '1010']) {
      expect(isWeakPin(pin)).toBe(true)
    }
  })

  it('cho qua mã bình thường', () => {
    for (const pin of ['4071', '8362', '9053', '2947']) {
      expect(isWeakPin(pin)).toBe(false)
    }
  })
})

describe('generatePin', () => {
  it('luôn ra đúng bốn chữ số', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(generatePin()).toMatch(/^\d{4}$/)
    }
  })

  it('không bao giờ trả về mã yếu', () => {
    for (let i = 0; i < 2000; i += 1) {
      expect(isWeakPin(generatePin())).toBe(false)
    }
  })

  it('bốc lại khi lần đầu ra mã yếu', () => {
    // '1234' yếu nên phải bỏ, '4071' thì nhận.
    expect(generatePin(digitsFrom('12344071'))).toBe('4071')
  })

  it('ném lỗi khi nguồn ngẫu nhiên chỉ phát ra mã yếu', () => {
    // Kẹt ở '0000' vĩnh viễn - đúng cái tình huống thà báo lỗi còn hơn phát ra
    // một mã mà cả lớp đoán được.
    expect(() => generatePin(() => 0)).toThrow(/Không sinh được mã PIN/)
  })

  it('không phát ra cùng một mã mãi', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 100; i += 1) seen.add(generatePin())
    expect(seen.size).toBeGreaterThan(50)
  })
})
