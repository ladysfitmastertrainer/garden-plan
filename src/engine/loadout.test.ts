import { describe, expect, it } from 'vitest'
import { SPELLS } from '../content/pets'
import {
  MAX_SLOTS,
  MIN_KNOWN,
  filterByLoadout,
  knownSpells,
  learnOrder,
  nextSlotLevel,
  nextSpellLevel,
  resolveLoadout,
  slotsForLevel,
  spellsKnownAt,
  usableSlots,
} from './loadout'
import type { Spell } from './pets'

const spell = (id: string): Spell => {
  const found = SPELLS[id]
  if (!found) throw new Error(`Không có phép ${id}`)
  return found
}

const MATH = ['tia-so', 'mua-con-so', 'bua-phep-tinh']

/** Một đội ba con, mỗi con một hệ - đúng hình dạng đội thật trong trận. */
const TEAM = [
  { spellIds: ['tia-so', 'mua-con-so', 'bua-phep-tinh'] },
  { spellIds: ['gio-chu', 'bao-chu', 'but-than'] },
  { spellIds: ['tia-sang', 'vong-sang', 'binh-minh'] },
]

describe('số chiêu đã học theo cấp', () => {
  it('mới vào đúng HAI chiêu, không hơn', () => {
    // Đây là điều kiện sống còn của màn chơi đầu: chín nút thì trẻ lớp 1 bấm
    // bừa cái gần nhất chứ không chọn.
    expect(spellsKnownAt(1)).toBe(2)
    expect(spellsKnownAt(2)).toBe(2)
  })

  it('cấp 3 học chiêu thứ ba, cấp 5 chiêu thứ tư', () => {
    expect(spellsKnownAt(3)).toBe(3)
    expect(spellsKnownAt(4)).toBe(3)
    expect(spellsKnownAt(5)).toBe(4)
  })

  it('lớn dần chứ không bao giờ tụt', () => {
    let last = 0
    for (let level = 1; level <= 50; level++) {
      const now = spellsKnownAt(level)
      expect(now).toBeGreaterThanOrEqual(last)
      last = now
    }
  })

  it('cấp 0 hay cấp âm vẫn còn hai chiêu chứ không về không', () => {
    expect(spellsKnownAt(0)).toBe(MIN_KNOWN)
    expect(spellsKnownAt(-5)).toBe(MIN_KNOWN)
  })

  it('báo đúng cấp kế tiếp được học thêm', () => {
    expect(nextSpellLevel(1)).toBe(3)
    expect(nextSpellLevel(3)).toBe(5)
    expect(nextSpellLevel(50)).toBeNull()
  })
})

describe('số ô mang ra trận theo cấp', () => {
  it('mới vào chỉ có 2 ô', () => {
    expect(slotsForLevel(1)).toBe(2)
    expect(slotsForLevel(4)).toBe(2)
  })

  it('cấp 5 mở ô thứ ba, cấp 10 mở ô thứ tư', () => {
    expect(slotsForLevel(5)).toBe(3)
    expect(slotsForLevel(9)).toBe(3)
    expect(slotsForLevel(10)).toBe(4)
  })

  it('không bao giờ vượt quá 4 ô, kể cả cấp rất cao', () => {
    expect(slotsForLevel(99)).toBe(MAX_SLOTS)
  })

  it('cấp 0 hay cấp âm vẫn còn 2 ô chứ không về 0', () => {
    expect(slotsForLevel(0)).toBe(2)
    expect(slotsForLevel(-3)).toBe(2)
  })

  it('chỉ đúng mốc kế tiếp mới được báo, hết mốc thì báo null', () => {
    expect(nextSlotLevel(1)).toBe(5)
    expect(nextSlotLevel(5)).toBe(10)
    expect(nextSlotLevel(10)).toBeNull()
  })

  it('số ô không bao giờ vượt số chiêu đã học', () => {
    // Bày ra một ô trống vĩnh viễn chỉ tổ làm trẻ tưởng mình đang thiếu gì đó.
    expect(usableSlots(10, 3)).toBe(3)
    expect(usableSlots(10, 9)).toBe(4)
    expect(usableSlots(1, 9)).toBe(2)
  })

  it('luôn còn ít nhất một ô, kể cả khi đội chưa biết chiêu nào', () => {
    expect(usableSlots(1, 0)).toBe(1)
  })
})

describe('thứ tự học chiêu', () => {
  it('vòng qua từng con một chiêu, rồi mới quay lại chiêu thứ hai', () => {
    expect(learnOrder(TEAM).map((s) => s.id)).toEqual([
      'tia-so', 'gio-chu', 'tia-sang',
      'mua-con-so', 'bao-chu', 'vong-sang',
      'bua-phep-tinh', 'but-than', 'binh-minh',
    ])
  })

  it('HAI chiêu đầu tiên thuộc HAI hệ khác nhau', () => {
    // Nếu hai chiêu đầu cùng hệ thì trận nào cũng chỉ có một nước đi đúng, và
    // câu hỏi "đánh bằng chiêu nào" thành ra không có câu trả lời.
    const first = knownSpells(TEAM, 1)
    expect(first).toHaveLength(2)
    expect(first[0]!.element).not.toBe(first[1]!.element)
  })

  it('bỏ trùng, giữ thứ tự gặp đầu tiên', () => {
    const order = learnOrder([{ spellIds: ['tia-so', 'mua-con-so'] }, { spellIds: ['tia-so', 'gio-chu'] }])
    expect(order.map((s) => s.id)).toEqual(['tia-so', 'gio-chu', 'mua-con-so'])
  })

  it('bỏ qua mã phép không tồn tại thay vì trả về lỗ hổng', () => {
    expect(learnOrder([{ spellIds: ['tia-so', 'phep-khong-co-that'] }]).map((s) => s.id)).toEqual(['tia-so'])
  })

  it('đội rỗng thì không có chiêu nào', () => {
    expect(learnOrder([])).toEqual([])
    expect(knownSpells([], 9)).toEqual([])
  })

  it('cấp cao mới lấy hết chín chiêu của đội', () => {
    expect(knownSpells(TEAM, 1)).toHaveLength(2)
    expect(knownSpells(TEAM, 5)).toHaveLength(4)
    expect(knownSpells(TEAM, 50)).toHaveLength(9)
  })

  it('đội biết ít chiêu hơn mức của cấp thì chỉ trả về đúng số đang có', () => {
    expect(knownSpells([{ spellIds: ['tia-so'] }], 50)).toHaveLength(1)
  })
})

describe('chốt bộ chiêu ra trận', () => {
  const known = MATH.map(spell)

  it('giữ đúng những gì trẻ đã sắp, theo đúng thứ tự', () => {
    expect(resolveLoadout(['mua-con-so', 'tia-so'], known, 2)).toEqual(['mua-con-so', 'tia-so'])
  })

  it('cắt phần thừa khi bộ đã lưu dài hơn số ô hiện có', () => {
    // Bộ cũ KHÔNG bị xoá - chỉ cắt lúc ra trận, để tụt cấp/đổi máy vẫn còn.
    expect(resolveLoadout(MATH, known, 2)).toEqual(['tia-so', 'mua-con-so'])
  })

  it('lấp đầy ô trống khi trẻ mới sắp có một chiêu', () => {
    expect(resolveLoadout(['bua-phep-tinh'], known, 2)).toEqual(['bua-phep-tinh', 'tia-so'])
  })

  it('bỏ chiêu con CHƯA HỌC rồi lấp lại bằng chiêu đã học', () => {
    // Bộ đã lưu từ lúc cấp cao vẫn còn nguyên, nhưng ra trận thì chỉ dùng được
    // những gì cấp hiện tại cho phép.
    expect(resolveLoadout(['bua-phep-tinh', 'mua-con-so'], knownSpells(TEAM, 1), 2)).toEqual([
      'tia-so',
      'gio-chu',
    ])
  })

  it('KHÔNG BAO GIỜ rỗng khi đội còn biết chiêu', () => {
    for (const saved of [undefined, [], ['phep-ma'], ['gio-chu']]) {
      expect(resolveLoadout(saved, known, 2).length).toBeGreaterThan(0)
    }
  })

  it('không nhân bản một chiêu để lấp cho đủ ô', () => {
    const result = resolveLoadout(['tia-so'], known, 3)
    expect(new Set(result).size).toBe(result.length)
  })
})

describe('lọc lựa chọn trong trận', () => {
  const options = MATH.map((id) => ({ spell: spell(id) }))

  it('chỉ giữ những chiêu nằm trong bộ đã sắp', () => {
    const kept = filterByLoadout(options, ['tia-so', 'bua-phep-tinh'], 2)
    expect(kept.map((o) => o.spell.id)).toEqual(['tia-so', 'bua-phep-tinh'])
  })

  it('MỖI CHIÊU ĐÚNG MỘT NÚT dù hai con trong đội cùng biết chiêu đó', () => {
    // Đây là chỗ sinh ra cái nút thứ năm trong khi chỉ có bốn ô.
    const doubled = [
      { spell: spell('tia-so'), pet: 'soc' },
      { spell: spell('mua-con-so'), pet: 'soc' },
      { spell: spell('tia-so'), pet: 'rong' },
    ]
    const kept = filterByLoadout(doubled, ['tia-so', 'mua-con-so'], 2)
    expect(kept.map((o) => o.spell.id)).toEqual(['tia-so', 'mua-con-so'])
    expect(kept[0]!.pet).toBe('soc')
  })

  it('không bao giờ hiện nhiều nút hơn số ô', () => {
    expect(filterByLoadout(options, MATH, 2)).toHaveLength(2)
  })

  it('con giữ cả bộ chiêu ngã xuống thì vẫn chỉ hiện đúng số ô', () => {
    // Trước đây trường hợp này đổ HẾT phép của những con còn sống ra - hai nút
    // thành bốn, đúng lúc trẻ đang cuống nhất.
    const kept = filterByLoadout(options, ['gio-chu', 'bao-chu'], 2)
    expect(kept).toHaveLength(2)
    expect(kept.map((o) => o.spell.id)).toEqual(['tia-so', 'mua-con-so'])
  })

  it('bộ chiêu rỗng cũng không đổ hết bảng ra', () => {
    expect(filterByLoadout(options, [], 2)).toHaveLength(2)
  })

  it('luôn còn ít nhất một nút để bấm', () => {
    expect(filterByLoadout(options, [], 0).length).toBeGreaterThan(0)
  })
})
