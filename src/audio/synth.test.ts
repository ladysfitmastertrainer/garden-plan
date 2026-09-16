import { describe, expect, it } from 'vitest'
import { audioDurationMs, noteToFrequency } from './synth'

describe('noteToFrequency', () => {
  it('A4 là 440 Hz - mốc chuẩn quốc tế', () => {
    expect(noteToFrequency('A4')).toBeCloseTo(440, 5)
  })

  it('C4 (nốt Đô giữa) xấp xỉ 261,63 Hz', () => {
    expect(noteToFrequency('C4')).toBeCloseTo(261.63, 1)
  })

  it('lên một quãng tám thì tần số gấp đôi', () => {
    expect(noteToFrequency('C5')).toBeCloseTo(noteToFrequency('C4') * 2, 5)
    expect(noteToFrequency('A3')).toBeCloseTo(noteToFrequency('A4') / 2, 5)
  })

  it('dấu thăng nâng nửa cung, dấu giáng hạ nửa cung', () => {
    expect(noteToFrequency('C#4')).toBeGreaterThan(noteToFrequency('C4'))
    expect(noteToFrequency('Db4')).toBeCloseTo(noteToFrequency('C#4'), 5)
  })

  it('các nốt trong gam Đô trưởng có cao độ tăng dần', () => {
    const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
    const frequencies = scale.map(noteToFrequency)
    for (let i = 1; i < frequencies.length; i++) {
      expect(frequencies[i]!).toBeGreaterThan(frequencies[i - 1]!)
    }
  })

  it('tên nốt sai thì ném lỗi thay vì phát ra tiếng lạ', () => {
    expect(() => noteToFrequency('H4')).toThrow()
    expect(() => noteToFrequency('C')).toThrow()
    expect(() => noteToFrequency('')).toThrow()
  })
})

describe('audioDurationMs', () => {
  it('tiết tấu ở tempo 60 thì mỗi phách đúng 1000ms', () => {
    expect(audioDurationMs({ kind: 'rhythm', pattern: [1, 1, 2], tempo: 60 })).toBe(4000)
  })

  it('giai điệu tuần tự cộng dồn trường độ từng nốt', () => {
    const ms = audioDurationMs({
      kind: 'tone',
      notes: ['C4', 'D4', 'E4'],
      beats: [1, 1, 2],
      tempo: 60,
    })
    expect(ms).toBe(4000)
  })

  it('mặc định mỗi nốt một phách khi không khai báo trường độ', () => {
    expect(audioDurationMs({ kind: 'tone', notes: ['C4', 'D4'], tempo: 60 })).toBe(2000)
  })

  it('hợp âm phát đồng thời nên chỉ dài bằng nốt dài nhất', () => {
    const ms = audioDurationMs({
      kind: 'tone',
      notes: ['C4', 'E4', 'G4'],
      beats: [2, 2, 2],
      tempo: 60,
      chord: true,
    })
    expect(ms).toBe(2000)
  })

  it('tempo nhanh hơn thì đoạn nhạc ngắn hơn', () => {
    const slow = audioDurationMs({ kind: 'tone', notes: ['C4', 'D4'], tempo: 60 })
    const fast = audioDurationMs({ kind: 'tone', notes: ['C4', 'D4'], tempo: 120 })
    expect(fast).toBeLessThan(slow)
  })
})
