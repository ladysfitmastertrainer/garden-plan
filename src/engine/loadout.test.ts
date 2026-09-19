/**
 * Bốn chiêu mở dần theo tiến hoá, và hai ô mang ra trận.
 *
 * Tệp này viết lại hoàn toàn khi bộ chiêu chuyển từ "gom cả đội, mở theo cấp
 * của TRẺ" sang "riêng từng con thú, mở theo NẤC TIẾN HOÁ của nó". Những gì
 * kiểm ở đây là luật mới, và luật cũ không còn chỗ nào trong game nữa.
 */

import { describe, expect, it } from 'vitest'

import { PETS, SPELLS, getPet } from '../content/pets'
import {
  EQUIPPED_SLOTS,
  allSpellsOf,
  equippedSpells,
  hasAllSpells,
  nextUnlockLevel,
  resolvePetLoadout,
  spellLockOf,
  unlockedSpells,
} from './loadout'
import { xpForLevel } from './pets'

/** Kinh nghiệm vừa đủ chạm một cấp. Xem `xpForLevel`. */
const at = (level: number) => xpForLevel(level)

const cu = getPet('cu-chu')!

describe('bốn chiêu của một con thú', () => {
  it('con nào cũng khai đúng bốn chiêu, và cả bốn đều có thật', () => {
    for (const pet of PETS) {
      expect(pet.spellIds).toHaveLength(4)
      for (const id of pet.spellIds) expect(SPELLS[id], `${pet.id} → ${id}`).toBeDefined()
    }
  })

  it('xếp đúng thứ tự bậc: hai chiêu nền, chiêu mượn hệ, rồi chiêu cuối', () => {
    for (const pet of PETS) {
      const tiers = allSpellsOf(pet).map((spell) => spell.tier)
      expect(tiers[2], pet.id).toBe(3)
      expect(tiers[3], pet.id).toBe(4)
      expect(tiers[0], pet.id).toBeLessThan(3)
      expect(tiers[1], pet.id).toBeLessThan(3)
    }
  })

  it('hai chiêu nền và chiêu cuối cùng hệ với con thú', () => {
    for (const pet of PETS) {
      const spells = allSpellsOf(pet)
      expect(spells[0]!.element, pet.id).toBe(pet.element)
      expect(spells[1]!.element, pet.id).toBe(pet.element)
      expect(spells[3]!.element, pet.id).toBe(pet.element)
    }
  })

  it('chiêu thứ ba MƯỢN hệ khác - đó là đường ra khi gặp quái khắc mình', () => {
    for (const pet of PETS) {
      expect(allSpellsOf(pet)[2]!.element, pet.id).not.toBe(pet.element)
    }
  })

  it('chỉ chiêu cuối mới mang hiệu ứng', () => {
    for (const pet of PETS) {
      for (const spell of allSpellsOf(pet)) {
        if (spell.tier === 4) expect(spell.effect, spell.id).toBeDefined()
        else expect(spell.effect, spell.id).toBeUndefined()
      }
    }
  })

  it('mỗi con một bộ chiêu nền RIÊNG - ba con cùng hệ không đánh giống nhau', () => {
    const pairs = PETS.map((pet) => pet.spellIds.slice(0, 2).join('+'))
    expect(new Set(pairs).size).toBe(PETS.length)
  })
})

describe('chiêu mở theo nấc tiến hoá của chính con thú', () => {
  it('mới bắt được thì có hai chiêu', () => {
    expect(unlockedSpells(cu, 0)).toHaveLength(2)
  })

  it('nấc tiến hoá thứ nhất mở chiêu mượn hệ', () => {
    const open = unlockedSpells(cu, at(5))
    expect(open).toHaveLength(3)
    expect(open[2]!.tier).toBe(3)
  })

  it('nấc thứ hai mở chiêu cuối', () => {
    const open = unlockedSpells(cu, at(10))
    expect(open).toHaveLength(4)
    expect(open[3]!.tier).toBe(4)
  })

  it('nấc thứ ba KHÔNG thêm chiêu nào - nó đổi hình và cộng chỉ số', () => {
    expect(unlockedSpells(cu, at(20))).toHaveLength(4)
    expect(hasAllSpells(cu, at(20))).toBe(true)
  })

  it('nói trước nấc nào mở chiêu tiếp theo, và im khi đã đủ bốn', () => {
    expect(nextUnlockLevel(cu, 0)).toBe(5)
    expect(nextUnlockLevel(cu, at(5))).toBe(10)
    expect(nextUnlockLevel(cu, at(10))).toBeNull()
    expect(nextUnlockLevel(cu, at(20))).toBeNull()
  })

  it('chiêu chưa mở thì khoá, và nói rõ phải lên tới cấp nào', () => {
    const ultimate = cu.spellIds[3]!
    expect(spellLockOf(cu, 0, ultimate)).toEqual({ locked: true, atLevel: 10 })
    expect(spellLockOf(cu, at(10), ultimate)).toEqual({ locked: false, atLevel: 10 })
  })

  it('hai chiêu nền không bao giờ khoá', () => {
    expect(spellLockOf(cu, 0, cu.spellIds[0]!).locked).toBe(false)
    expect(spellLockOf(cu, 0, cu.spellIds[1]!).locked).toBe(false)
  })
})

describe('hai ô mang ra trận', () => {
  const open = () => unlockedSpells(cu, at(10))

  it('luôn đúng hai chiêu, dù đã mở bốn', () => {
    expect(resolvePetLoadout(undefined, open())).toHaveLength(EQUIPPED_SLOTS)
  })

  it('chưa sắp bao giờ thì phát hai chiêu nền - luôn dùng được', () => {
    expect(resolvePetLoadout(undefined, open())).toEqual(cu.spellIds.slice(0, 2))
  })

  it('giữ đúng thứ tự trẻ đã chọn', () => {
    const picked = [cu.spellIds[3]!, cu.spellIds[0]!]
    expect(resolvePetLoadout(picked, open())).toEqual(picked)
  })

  it('bỏ chiêu con thú CHƯA mở tới, rồi lấp cho đủ hai', () => {
    // Hồ sơ lưu lúc con thú đã tiến hoá, giờ đọc lại ở một con chưa tiến hoá.
    const saved = [cu.spellIds[3]!, cu.spellIds[2]!]
    const out = resolvePetLoadout(saved, unlockedSpells(cu, 0))
    expect(out).toEqual(cu.spellIds.slice(0, 2))
  })

  it('bỏ qua id lạ mà không vỡ', () => {
    const out = resolvePetLoadout(['khong-co-that', cu.spellIds[1]!], open())
    expect(out).toHaveLength(2)
    expect(out).toContain(cu.spellIds[1]!)
  })

  it('cắt bớt khi hồ sơ cũ lưu nhiều hơn hai chiêu', () => {
    // Bộ chiêu thời còn bốn ô. Xem `StudentProgress.loadout`.
    expect(resolvePetLoadout(cu.spellIds, open())).toHaveLength(2)
  })

  it('KHÔNG BAO GIỜ rỗng - rỗng là trẻ kẹt cứng giữa trận', () => {
    expect(resolvePetLoadout([], open()).length).toBeGreaterThan(0)
    expect(resolvePetLoadout(['rac'], unlockedSpells(cu, 0)).length).toBeGreaterThan(0)
  })

  it('dựng thẳng từ con thú thì ra đúng những chiêu ấy', () => {
    const spells = equippedSpells(cu, at(10), [cu.spellIds[3]!])
    expect(spells).toHaveLength(2)
    expect(spells[0]!.id).toBe(cu.spellIds[3]!)
    expect(spells.every((spell) => SPELLS[spell.id])).toBe(true)
  })
})
