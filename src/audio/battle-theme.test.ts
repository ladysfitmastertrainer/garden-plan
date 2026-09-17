/**
 * Nhạc trận đấu là DỮ LIỆU, nên kiểm được như dữ liệu.
 *
 * Nghe thì máy không nghe được. Nhưng ba thứ hỏng thường gặp nhất của một bản
 * nhạc viết tay đều đọc ra được từ mảng: ba bè lệch độ dài (vòng lặp trôi dần,
 * mỗi vòng một nhịp khác), một tên nốt gõ sai (cả bè im tiếng hoặc nổ lỗi giữa
 * trận), và một ô nhịp cộng lại không đủ bốn phách (giai điệu lệch khỏi bè trầm
 * từ ô ấy trở đi).
 */

import { describe, expect, it } from 'vitest'

import { LOOP_BEATS, TRACKS, loopSeconds } from './battle-theme'
import { noteToFrequency } from './synth'

const beatsOf = (steps: Array<{ beats: number }>) =>
  steps.reduce((sum, step) => sum + step.beats, 0)

describe('bản nhạc khớp nhau', () => {
  it('ba bè dài bằng nhau, đúng một vòng 32 phách', () => {
    /*
      Đây là điều dễ hỏng nhất và khó nghe ra nhất: lệch nửa phách thì vòng đầu
      nghe vẫn bình thường, tới vòng thứ tư giai điệu mới trôi hẳn khỏi bè trầm.
    */
    expect(TRACKS).toHaveLength(3)
    for (const track of TRACKS) {
      expect(beatsOf(track.steps)).toBe(LOOP_BEATS)
    }
  })

  it('một vòng dài khoảng 14-15 giây', () => {
    // Đủ dài để không thành tiếng chuông báo, đủ ngắn để còn ra hình một bản nhạc.
    expect(loopSeconds()).toBeGreaterThan(13)
    expect(loopSeconds()).toBeLessThan(16)
  })

  it('mọi tên nốt đều đọc ra được tần số', () => {
    // `noteToFrequency` NÉM khi gặp tên sai, nên một chữ gõ nhầm ở đây là một
    // trận đấu nổ lỗi giữa chừng chứ không phải một nốt lạc.
    for (const track of TRACKS) {
      for (const step of track.steps) {
        if (!step.note) continue
        expect(() => noteToFrequency(step.note!)).not.toThrow()
      }
    }
  })

  it('mọi nốt nằm trong tầm nghe dễ chịu', () => {
    // Dưới 60Hz loa điện thoại không kêu ra tiếng gì; trên 2000Hz thì chói.
    for (const track of TRACKS) {
      for (const step of track.steps) {
        if (!step.note) continue
        const hz = noteToFrequency(step.note)
        expect(hz, step.note).toBeGreaterThan(60)
        expect(hz, step.note).toBeLessThan(2000)
      }
    }
  })

  it('giai điệu có chỗ NGHỈ, không chạy liên tục', () => {
    /*
      Trẻ nghe bản này vài chục lần mỗi buổi. Một giai điệu không có quãng nghỉ
      nào thì tới vòng thứ ba là thành tiếng ồn - nên chỗ nghỉ ở đây là một yêu
      cầu, không phải chuyện tình cờ.
    */
    const lead = TRACKS[1]!
    expect(lead.steps.some((step) => step.note === null)).toBe(true)
  })

  it('nhạc nhỏ hơn hiệu ứng, để không nuốt mất tiếng trận đấu', () => {
    // Hiệu ứng trong `synth.ts` chạy ở mức 0.3-0.6. Ba bè cộng lại còn phải đi
    // qua một nút âm lượng chung 0.14 nữa, nên mức ở đây là mức TƯƠNG ĐỐI.
    for (const track of TRACKS) {
      expect(track.gain).toBeGreaterThan(0)
      expect(track.gain).toBeLessThanOrEqual(0.6)
    }
  })
})
