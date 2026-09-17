/**
 * Bội số phóng của hai nhân vật trong khung trận.
 *
 * Đây là một hàm bé xíu, nhưng nó là chỗ đã từng hỏng: hai nhân vật dùng bội số
 * gõ cứng (8 và 6), nên trên điện thoại chúng chiếm gần trọn sân đấu, và xoay
 * ngang xong thì còn chật hơn lúc dựng đứng. Test này giữ đúng ba điều mà mắt
 * người nhìn ra ngay nhưng máy thì không: sprite phải VỪA khung, khung to hơn
 * thì sprite to hơn, và xoay ngang phải được nhiều hơn chứ không ít hơn.
 */

import { describe, expect, it } from 'vitest'
import { arenaScales } from './PixelBattle'

/** Một ô sprite là 16×16 điểm ảnh; phóng bội số n thì ra n×16. */
const px = (scale: number) => scale * 16

/*
  Ba khung trận thật, đo trên ba máy hay gặp nhất.

  Con số lấy từ chính bố cục: bề ngang màn hình trừ lề trang và viền khung; chiều
  cao là phần còn lại sau khung hỏi và dải đội thú. Xem `.battle-layout` trong
  `app/globals.css`.
*/
const PHONE_PORTRAIT = { width: 358, height: 468 }
const PHONE_LANDSCAPE = { width: 402, height: 332 }
const DESKTOP = { width: 700, height: 460 }

describe('sprite co giãn theo khung trận', () => {
  it('luôn là SỐ NGUYÊN - pixel art phóng theo số lẻ là méo hết điểm ảnh', () => {
    for (const box of [PHONE_PORTRAIT, PHONE_LANDSCAPE, DESKTOP]) {
      const { hero, enemy } = arenaScales(box.width, box.height)
      expect(Number.isInteger(hero)).toBe(true)
      expect(Number.isInteger(enemy)).toBe(true)
    }
  })

  it('hai nhân vật luôn VỪA trong khung, ở mọi cỡ máy', () => {
    /*
      Quét cả một dải cỡ khung thay vì kiểm ba điểm: chỗ hỏng của một hàm kiểu
      này nằm ở hai đầu mút, mà hai đầu mút thì không ai nghĩ ra để gõ vào test.

      Nhân vật đứng cách đáy 12% và thanh máu treo trên đầu nó, nên chiều cao
      nhân vật phải nhỏ hơn hẳn chiều cao khung - lấy 70% làm trần.
    */
    for (let width = 260; width <= 900; width += 20) {
      for (let height = 220; height <= 620; height += 20) {
        const { hero, enemy } = arenaScales(width, height)
        expect(px(hero), `${width}×${height}: nhân vật cao quá khung`).toBeLessThan(height * 0.7)
        expect(px(enemy), `${width}×${height}: quái cao quá khung`).toBeLessThan(height * 0.7)
        // Hai bên đứng hai mép, nên cộng lại phải còn chừa khoảng trống ở giữa.
        expect(px(hero) + px(enemy), `${width}×${height}: hai bên chạm nhau`).toBeLessThan(width)
      }
    }
  })

  it('khung to hơn thì sprite không bao giờ bé đi', () => {
    let previous = arenaScales(260, 220)
    for (let step = 1; step <= 30; step++) {
      const next = arenaScales(260 + step * 20, 220 + step * 14)
      expect(next.hero).toBeGreaterThanOrEqual(previous.hero)
      expect(next.enemy).toBeGreaterThanOrEqual(previous.enemy)
      previous = next
    }
  })

  it('XOAY NGANG ĐƯỢC NHIỀU HƠN, không ít hơn - đây là cái đã từng sai', () => {
    // Người ta xoay máy ra là để nhìn rõ hơn. Bản trước làm ngược lại: D-pad và
    // cột câu hỏi ăn hết bề ngang, khung trận còn hẹp hơn cả lúc dựng đứng.
    const portrait = arenaScales(PHONE_PORTRAIT.width, PHONE_PORTRAIT.height)
    const landscape = arenaScales(PHONE_LANDSCAPE.width, PHONE_LANDSCAPE.height)

    expect(landscape.hero).toBeGreaterThan(portrait.hero)
    expect(landscape.enemy).toBeGreaterThan(portrait.enemy)
  })

  it('điện thoại vẫn nhỏ hơn máy tính, và cả hai đều trong khoảng cho phép', () => {
    const phone = arenaScales(PHONE_PORTRAIT.width, PHONE_PORTRAIT.height)
    const desktop = arenaScales(DESKTOP.width, DESKTOP.height)

    expect(desktop.hero).toBeGreaterThan(phone.hero)
    // Sàn 4/3: dưới mức đó thì con quái nhỏ hơn cả thanh máu của chính nó.
    expect(phone.hero).toBeGreaterThanOrEqual(4)
    expect(phone.enemy).toBeGreaterThanOrEqual(3)
  })

  it('khung bé tí hoặc chưa đo được cũng không ra số vô lý', () => {
    // `getBoundingClientRect` trả về 0 ở khung hình đầu tiên. Nơi gọi có chặn,
    // nhưng hàm này cũng không được phép trả về 0 hay số âm.
    for (const box of [{ width: 1, height: 1 }, { width: 120, height: 90 }]) {
      const { hero, enemy } = arenaScales(box.width, box.height)
      expect(hero).toBeGreaterThanOrEqual(4)
      expect(enemy).toBeGreaterThanOrEqual(3)
    }
  })
})
