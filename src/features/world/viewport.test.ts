/**
 * Khung nhìn của màn đi cảnh phải LẤP ĐẦY màn hình.
 *
 * Chỗ này đã hỏng hai lần liền, và cả hai lần đều chỉ lộ ra khi cầm điện thoại
 * lên xem - typecheck và test cũ đều xanh. Nên các con số dưới đây lấy từ chính
 * ảnh chụp màn hình của máy thật, và cái được kiểm là thứ mắt người nhìn ra
 * ngay: khung game có rộng bằng màn hình không.
 */

import { describe, expect, it } from 'vitest'
import { pickFillViewport, pickViewport } from './Overworld'

const TILE = 16

/*
  Kích thước THẬT, đo từ ảnh chụp một máy Android phổ thông (Samsung, 2316×1080
  điểm ảnh vật lý, tỉ lệ điểm ảnh 2,625).

  `spare` đã trừ lề dưới trang: chiều cao khung nhìn trình duyệt trừ đi thanh địa
  chỉ và `VIEW_MARGIN`.
*/
const PHONE_LANDSCAPE = { width: 686, spare: 302 }
const PHONE_PORTRAIT = { width: 390, spare: 692 }
/** Bản đồ hẹp nhất và rộng nhất trong `biome.ts`. */
const NARROW_MAP = 13
const WIDE_MAP = 15

/** Bề ngang khung game tính ra điểm ảnh CSS. */
const frameWidth = (v: { cols: number; scale: number }) => v.cols * TILE * v.scale
const frameHeight = (v: { rows: number; scale: number }) => v.rows * TILE * v.scale

describe('khung đi cảnh lấp đầy màn hình', () => {
  it('XOAY NGANG: khung rộng gần bằng cả màn hình - đây là lỗi đã sửa', () => {
    /*
      Bản trước cố định 11 cột. Chiều cao chặn bội số ở mức 2, nên khung rộng
      11×16×2 = 352px giữa một màn hình 686px - đúng một nửa. Người ta xoay máy
      ra để nhìn cho rộng, và được một nửa màn hình bỏ trắng.
    */
    const view = pickViewport(PHONE_LANDSCAPE.width, PHONE_LANDSCAPE.spare, WIDE_MAP, true)
    expect(frameWidth(view)).toBeGreaterThan(PHONE_LANDSCAPE.width * 0.9)
    expect(frameWidth(view)).toBeLessThanOrEqual(PHONE_LANDSCAPE.width)
  })

  it('XOAY NGANG: và cao gần hết màn hình luôn', () => {
    const view = pickViewport(PHONE_LANDSCAPE.width, PHONE_LANDSCAPE.spare, WIDE_MAP, true)
    expect(frameHeight(view)).toBeGreaterThan(PHONE_LANDSCAPE.spare * 0.85)
    expect(frameHeight(view)).toBeLessThanOrEqual(PHONE_LANDSCAPE.spare)
  })

  it('XOAY NGANG đổi SỐ ô lấy CỠ ô - và đây là đánh đổi có chủ ý', () => {
    /*
      Một ghi chú trong bản đầu khẳng định xoay ngang thấy NHIỀU ô hơn. Test này
      đã bác bỏ điều đó: 14×6 = 84 ô, ít hơn 12×9 = 108 ô lúc dựng đứng.

      Cái thật sự đổi được là CỠ: mỗi ô to gấp rưỡi, và khung game rộng gần bằng
      cả màn hình thay vì đúng một nửa. Test giữ nguyên chiều của phép đánh đổi
      ấy, để lần sau ai chỉnh lại con số cũng phải quyết định một cách có ý thức.
    */
    const landscape = pickViewport(PHONE_LANDSCAPE.width, PHONE_LANDSCAPE.spare, WIDE_MAP, true)
    const portrait = pickViewport(PHONE_PORTRAIT.width, PHONE_PORTRAIT.spare, WIDE_MAP, false)

    expect(landscape.scale).toBeGreaterThan(portrait.scale)
    expect(frameWidth(landscape)).toBeGreaterThan(frameWidth(portrait))
  })


  it('DỰNG ĐỨNG: khung cũng rộng gần bằng màn hình', () => {
    const view = pickViewport(PHONE_PORTRAIT.width, PHONE_PORTRAIT.spare, WIDE_MAP, false)
    expect(frameWidth(view)).toBeGreaterThan(PHONE_PORTRAIT.width * 0.9)
    expect(frameWidth(view)).toBeLessThanOrEqual(PHONE_PORTRAIT.width)
  })

  it('không bao giờ tràn ra ngoài màn hình, ở mọi cỡ máy', () => {
    // Tràn còn tệ hơn hụt: nửa bản đồ nằm ngoài mép và trẻ không biết là mình
    // đang không nhìn thấy nó.
    for (let width = 280; width <= 1400; width += 20) {
      for (let spare = 200; spare <= 900; spare += 20) {
        for (const short of [true, false]) {
          const view = pickViewport(width, spare, WIDE_MAP, short)
          expect(frameWidth(view), `${width}×${spare}`).toBeLessThanOrEqual(width)
          expect(frameHeight(view), `${width}×${spare}`).toBeLessThanOrEqual(spare)
        }
      }
    }
  })

  it('không hiện nhiều cột hơn bản đồ có', () => {
    // Quá mép bản đồ chỉ còn nền trống, và một dải nền trống bên phải nhìn như
    // khung game bị hỏng.
    const wide = pickViewport(1400, 800, NARROW_MAP, false)
    expect(wide.cols).toBeLessThanOrEqual(NARROW_MAP)
  })

  it('màn hình tí hon vẫn ra một khung dùng được', () => {
    const view = pickViewport(280, 200, NARROW_MAP, true)
    expect(view.scale).toBeGreaterThanOrEqual(2)
    expect(view.cols).toBeGreaterThan(0)
    expect(view.rows).toBeGreaterThan(0)
  })
})

/*
  Chế độ TOÀN MÀN HÌNH trên điện thoại, và đây là một mức đòi hỏi khác hẳn.

  `pickViewport` chỉ hứa "gần bằng màn hình" vì khung game của nó còn đứng
  trong một trang, dưới phần đầu trang. Ở chế độ này khung game LÀ màn hình, nên
  mọi điểm ảnh bỏ trắng là một điểm ảnh lấy mất của trò chơi - và hai con số đo
  được từ ảnh chụp thật trước khi sửa là 556px bỏ trắng lúc dựng đứng, 124px bỏ
  trắng hai bên lúc xoay ngang.

  Kích thước ở đây là kích thước MÀN HÌNH đầy đủ, không trừ lề nào.
*/
const PHONE = { portrait: { width: 390, height: 844 }, landscape: { width: 844, height: 390 } }
const MAP_ROWS = 44

/** Bề ngang và chiều cao khung game SAU bước kéo giãn. */
const fillWidth = (v: { cols: number; scale: number; fit: number }) => v.cols * TILE * v.scale * v.fit
const fillHeight = (v: { rows: number; scale: number; fit: number }) => v.rows * TILE * v.scale * v.fit

describe('khung đi cảnh toàn màn hình', () => {
  it('DỰNG ĐỨNG: lấp kín cả bề ngang lẫn chiều cao', () => {
    const { width, height } = PHONE.portrait
    const view = pickFillViewport(width, height, WIDE_MAP, MAP_ROWS, false)
    expect(fillWidth(view)).toBeGreaterThan(width * 0.97)
    expect(fillHeight(view)).toBeGreaterThan(height * 0.97)
  })

  it('XOAY NGANG: lấp kín luôn, kể cả hai mép trái phải', () => {
    /*
      Đây là lỗi người dùng chỉ ra: mười lăm cột là hết bề rộng bản đồ, mà mười
      lăm cột ở bội số 3 chỉ rộng 720px trên một màn 844px - hai dải trắng đứng
      hai bên. Bội số không cứu được, vì bội số 4 thì chiều cao hụt.
    */
    const { width, height } = PHONE.landscape
    const view = pickFillViewport(width, height, WIDE_MAP, MAP_ROWS, true)
    expect(fillWidth(view)).toBeGreaterThan(width * 0.97)
    expect(fillHeight(view)).toBeGreaterThan(height * 0.97)
  })

  it('không bao giờ tràn ra ngoài màn hình, ở mọi cỡ máy', () => {
    for (let width = 280; width <= 1000; width += 20) {
      for (let height = 280; height <= 1000; height += 20) {
        for (const short of [true, false]) {
          const view = pickFillViewport(width, height, WIDE_MAP, MAP_ROWS, short)
          const label = `${width}×${height}`
          // Một điểm ảnh dôi ra là do làm tròn số thực, không phải do tính sai.
          expect(fillWidth(view), label).toBeLessThanOrEqual(width + 0.01)
          expect(fillHeight(view), label).toBeLessThanOrEqual(height + 0.01)
          expect(view.cols, label).toBeLessThanOrEqual(WIDE_MAP)
          expect(view.rows, label).toBeLessThanOrEqual(MAP_ROWS)
          expect(view.rows, label).toBeGreaterThan(0)
        }
      }
    }
  })

  it('bội số VẼ vẫn là số nguyên - phần lẻ do bước kéo giãn lo', () => {
    // Pixel art vẽ ở bội số lẻ là gợn ngay: có điểm ảnh rộng 2, có điểm ảnh
    // rộng 3. Cả cái khung kéo giãn một lần thì gợn ấy đều nhau khắp khung.
    const view = pickFillViewport(844, 390, WIDE_MAP, MAP_ROWS, true)
    expect(Number.isInteger(view.scale)).toBe(true)
    expect(view.scale).toBeGreaterThanOrEqual(2)
  })
})
