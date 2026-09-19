/**
 * Luật của hộp cảnh.
 *
 * Phần lớn test ở đây giữ đúng một điều: KHU VƯỜN KHÔNG BAO GIỜ NUỐT VÀNG CỦA
 * TRẺ. Đặt rồi dỡ ra phải lấy lại đủ, nếu không thì một em bảy tuổi thử vài lần
 * là sạch túi mà không hiểu vì sao.
 */

import { describe, expect, it } from 'vitest'

import { ISO_MEDIUM } from '../features/pixel/iso'
import { validateSprite } from '../features/pixel/sprite'
import {
  GARDEN_CELLS,
  GARDEN_COLS,
  GARDEN_PARTS,
  GARDEN_ROWS,
  PART_SCALE,
  cellKey,
  cleanGarden,
  gardenSlots,
  gardenWorth,
  getGardenPart,
  nextSlotLevel,
  parseCell,
} from './garden'

describe('bộ đồ trang trí', () => {
  it('mỗi món một id, không trùng', () => {
    expect(new Set(GARDEN_PARTS.map((p) => p.id)).size).toBe(GARDEN_PARTS.length)
  })

  it('món nào cũng có hình vẽ đúng chuẩn', () => {
    for (const part of GARDEN_PARTS) {
      expect(validateSprite(part.sprite), part.id).toEqual([])
    }
  })

  it('giá tăng dần - bảng đọc từ trên xuống là từ rẻ tới đắt', () => {
    const costs = GARDEN_PARTS.map((p) => p.cost)
    expect([...costs].sort((a, b) => a - b)).toEqual(costs)
  })

  it('món rẻ nhất mua được sau một trận, món đắt nhất là mục tiêu dài', () => {
    // Một trận thường cho chừng 20-30 vàng. Món đầu phải với tới ngay, nếu
    // không thì trẻ mở màn này ra và không làm được gì cả.
    expect(GARDEN_PARTS[0]!.cost).toBeLessThanOrEqual(20)
    expect(GARDEN_PARTS[GARDEN_PARTS.length - 1]!.cost).toBeGreaterThanOrEqual(150)
  })

  it('tra theo id ra đúng món, id lạ thì trả null', () => {
    expect(getGardenPart('bui-co')?.name).toBe('Bụi cỏ')
    expect(getGardenPart('khong-co-that')).toBeNull()
  })
})

describe('số ô được đặt', () => {
  it('mới vào đã có mấy ô - không bắt trẻ chờ mới được bày', () => {
    expect(gardenSlots(1)).toBeGreaterThanOrEqual(4)
  })

  it('càng lên cấp càng nhiều ô, không bao giờ tụt', () => {
    let previous = 0
    for (let level = 1; level <= 40; level++) {
      const slots = gardenSlots(level)
      expect(slots).toBeGreaterThanOrEqual(previous)
      previous = slots
    }
  })

  it('không bao giờ vượt quá số ô đất có thật', () => {
    expect(gardenSlots(999)).toBe(GARDEN_CELLS)
  })

  it('nói trước cấp nào mở thêm ô, và im khi đã mở hết', () => {
    const soon = nextSlotLevel(1)
    expect(soon).not.toBeNull()
    expect(gardenSlots(soon!)).toBeGreaterThan(gardenSlots(1))
    expect(nextSlotLevel(999)).toBeNull()
  })
})

describe('khoá ô', () => {
  it('ghi rồi đọc lại ra đúng toạ độ cũ', () => {
    expect(parseCell(cellKey(3, 2))).toEqual({ col: 3, row: 2 })
  })

  it('từ chối ô nằm ngoài mặt đất', () => {
    expect(parseCell(cellKey(GARDEN_COLS, 0))).toBeNull()
    expect(parseCell(cellKey(0, GARDEN_ROWS))).toBeNull()
    expect(parseCell(cellKey(-1, 0))).toBeNull()
  })

  it('từ chối khoá hỏng mà không ném lỗi', () => {
    expect(parseCell('rác')).toBeNull()
    expect(parseCell('')).toBeNull()
    expect(parseCell('1')).toBeNull()
  })
})

describe('dọn bảng đã lưu', () => {
  it('giữ nguyên ô hợp lệ', () => {
    const good = { [cellKey(0, 0)]: 'bui-co', [cellKey(5, 3)]: 'lau-dai' }
    expect(cleanGarden(good)).toEqual(good)
  })

  it('bỏ ô ngoài mặt đất và món không còn tồn tại', () => {
    const messy = {
      [cellKey(0, 0)]: 'bui-co',
      '99,99': 'hon-da',
      [cellKey(1, 1)]: 'mon-da-go-bo',
      rác: 'bui-co',
    }
    expect(cleanGarden(messy)).toEqual({ [cellKey(0, 0)]: 'bui-co' })
  })

  it('hồ sơ chưa có vườn thì ra bảng rỗng, không vỡ', () => {
    expect(cleanGarden(undefined)).toEqual({})
  })
})

describe('vàng nằm trong vườn', () => {
  it('cộng đúng giá mọi món đã đặt', () => {
    const parts = { [cellKey(0, 0)]: 'bui-co', [cellKey(1, 0)]: 'lau-dai' }
    expect(gardenWorth(parts)).toBe(
      getGardenPart('bui-co')!.cost + getGardenPart('lau-dai')!.cost,
    )
  })

  it('KHÔNG tính những ô hỏng - trẻ không được "nợ" vì một khoá sai', () => {
    expect(gardenWorth({ '99,99': 'lau-dai' })).toBe(0)
  })

  it('vườn trống thì bằng 0', () => {
    expect(gardenWorth(undefined)).toBe(0)
    expect(gardenWorth({})).toBe(0)
  })
})

describe('to nhỏ theo vai', () => {
  it('món nào cũng khai một bậc, và bậc nào cũng có bội số', () => {
    for (const part of GARDEN_PARTS) {
      expect(PART_SCALE[part.size], part.id).toBeGreaterThan(0)
    }
  })

  it('ba bậc TO DẦN, không bậc nào bằng bậc nào', () => {
    expect(PART_SCALE.nho).toBeLessThan(PART_SCALE.vua)
    expect(PART_SCALE.vua).toBeLessThan(PART_SCALE.lon)
  })

  it('CÔNG TRÌNH to hơn cả viên gạch nó đứng', () => {
    /*
      Đây là cái vừa sửa. Mọi món trong `iso.ts` đều vẽ ở 16x16 vì chúng sinh ra
      để đứng một mình giữa một hòn đảo - đem nguyên cỡ ấy vào vườn thì ngọn hải
      đăng to đúng bằng bụi cỏ, và cùng bé bằng một phần ba viên gạch.
    */
    const lighthouse = getGardenPart('hai-dang')!
    const width = (lighthouse.sprite.rows[0]?.length ?? 0) * PART_SCALE[lighthouse.size]
    expect(width).toBeGreaterThan(ISO_MEDIUM.width)
  })

  it('thứ mọc sát đất thì NHỎ HƠN viên gạch - cỏ không được cao bằng tháp', () => {
    const bush = getGardenPart('bui-co')!
    const width = (bush.sprite.rows[0]?.length ?? 0) * PART_SCALE[bush.size]
    expect(width).toBeLessThan(ISO_MEDIUM.width)
  })

  it('càng đắt càng to, không có món rẻ nào to hơn món đắt', () => {
    // Giá đã xếp tăng dần (test ở trên), nên bậc cũng phải không bao giờ tụt.
    const order = { nho: 0, vua: 1, lon: 2 }
    let previous = -1
    for (const part of GARDEN_PARTS) {
      expect(order[part.size], part.id).toBeGreaterThanOrEqual(previous)
      previous = order[part.size]
    }
  })
})
