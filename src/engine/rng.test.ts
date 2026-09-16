import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('cùng seed cho ra cùng dãy số', () => {
    const a = createRng('hat-giong')
    const b = createRng('hat-giong')
    const seqA = Array.from({ length: 20 }, () => a.next())
    const seqB = Array.from({ length: 20 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('seed khác nhau cho ra dãy khác nhau', () => {
    const a = createRng(1)
    const b = createRng(2)
    expect(a.next()).not.toBe(b.next())
  })

  it('next() luôn nằm trong [0, 1)', () => {
    const rng = createRng(42)
    for (let i = 0; i < 500; i++) {
      const value = rng.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('int() bao gồm cả hai đầu mút', () => {
    const rng = createRng('bien')
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(rng.int(1, 3))
    expect([...seen].sort()).toEqual([1, 2, 3])
  })

  it('int() xử lý được min bằng max', () => {
    expect(createRng(7).int(5, 5)).toBe(5)
  })

  it('shuffle() không làm thay đổi mảng gốc và giữ nguyên phần tử', () => {
    const rng = createRng('xao')
    const original = [1, 2, 3, 4, 5]
    const shuffled = rng.shuffle(original)
    expect(original).toEqual([1, 2, 3, 4, 5])
    expect([...shuffled].sort()).toEqual(original)
  })

  it('sample() trả về đúng số lượng, không lặp', () => {
    const rng = createRng('mau')
    const picked = rng.sample(['a', 'b', 'c', 'd'], 3)
    expect(picked).toHaveLength(3)
    expect(new Set(picked).size).toBe(3)
  })

  it('sample() không vượt quá kích thước mảng', () => {
    expect(createRng(1).sample(['a', 'b'], 5)).toHaveLength(2)
  })

  it('weighted() tôn trọng trọng số', () => {
    const rng = createRng('trong-so')
    let hitsA = 0
    for (let i = 0; i < 2000; i++) {
      if (rng.weighted([['a', 90] as const, ['b', 10] as const]) === 'a') hitsA++
    }
    expect(hitsA / 2000).toBeGreaterThan(0.85)
    expect(hitsA / 2000).toBeLessThan(0.95)
  })

  it('weighted() bỏ qua lựa chọn có trọng số 0', () => {
    const rng = createRng('khong')
    for (let i = 0; i < 100; i++) {
      expect(rng.weighted([['a', 0] as const, ['b', 5] as const])).toBe('b')
    }
  })

  it('pick() trên mảng rỗng thì ném lỗi thay vì trả undefined', () => {
    expect(() => createRng(1).pick([])).toThrow()
  })
})
