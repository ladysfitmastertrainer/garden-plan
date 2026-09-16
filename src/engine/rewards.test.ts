import { describe, expect, it } from 'vitest'
import { createRng } from './rng'
import {
  LOOT_TABLE,
  MAX_LEVEL,
  bonusAwards,
  findLootItem,
  levelFromTotalXp,
  rollLoot,
  statsForLevel,
  xpToNextLevel,
  type BattleOutcome,
} from './rewards'

const outcome = (overrides: Partial<BattleOutcome> = {}): BattleOutcome => ({
  victory: true,
  goldEarned: 30,
  xpEarned: 40,
  bestCombo: 3,
  accuracy: 0.8,
  ...overrides,
})

describe('levelFromTotalXp', () => {
  it('chưa có kinh nghiệm thì ở cấp 1', () => {
    expect(levelFromTotalXp(0).level).toBe(1)
  })

  it('lên cấp 2 sau đúng lượng kinh nghiệm của cấp 1', () => {
    expect(levelFromTotalXp(xpToNextLevel(1) - 1).level).toBe(1)
    expect(levelFromTotalXp(xpToNextLevel(1)).level).toBe(2)
  })

  it('cấp đầu lên nhanh hơn cấp sau - trẻ cần thấy tiến bộ sớm', () => {
    expect(xpToNextLevel(1)).toBeLessThan(xpToNextLevel(10))
  })

  it('kinh nghiệm dư được giữ lại cho cấp tiếp theo', () => {
    const progress = levelFromTotalXp(xpToNextLevel(1) + 10)
    expect(progress.level).toBe(2)
    expect(progress.xpIntoLevel).toBe(10)
    expect(progress.xpForNext).toBe(xpToNextLevel(2))
  })

  it('không vượt quá cấp tối đa dù kinh nghiệm rất lớn', () => {
    expect(levelFromTotalXp(10_000_000).level).toBe(MAX_LEVEL)
  })

  it('kinh nghiệm âm không làm vỡ phép tính', () => {
    expect(levelFromTotalXp(-500).level).toBe(1)
  })
})

describe('statsForLevel', () => {
  it('lên cấp thì máu và sức mạnh đều tăng', () => {
    const l1 = statsForLevel(1)
    const l10 = statsForLevel(10)
    expect(l10.maxHp).toBeGreaterThan(l1.maxHp)
    expect(l10.power).toBeGreaterThan(l1.power)
  })

  it('cộng dồn chỉ số từ trang bị', () => {
    const withGear = statsForLevel(1, { bonusHp: 20, bonusPower: 0.3 })
    expect(withGear.maxHp).toBe(statsForLevel(1).maxHp + 20)
    expect(withGear.power).toBeCloseTo(statsForLevel(1).power + 0.3)
  })
})

describe('rollLoot', () => {
  it('rút lui thì không rơi đồ - chiến thắng phải đáng giá hơn', () => {
    const rng = createRng('loot')
    for (let i = 0; i < 50; i++) {
      expect(rollLoot(outcome({ victory: false }), rng)).toBeNull()
    }
  })

  it('thắng thì có cơ hội rơi đồ', () => {
    const rng = createRng('loot')
    let drops = 0
    for (let i = 0; i < 200; i++) if (rollLoot(outcome(), rng)) drops++
    expect(drops).toBeGreaterThan(0)
  })

  it('chuỗi dài và độ chính xác cao làm tăng tỉ lệ rơi đồ', () => {
    const count = (o: BattleOutcome) => {
      const rng = createRng('so-sanh')
      let drops = 0
      for (let i = 0; i < 500; i++) if (rollLoot(o, rng)) drops++
      return drops
    }
    expect(count(outcome({ bestCombo: 8, accuracy: 1 }))).toBeGreaterThan(
      count(outcome({ bestCombo: 0, accuracy: 0.3 })),
    )
  })

  it('đồ cực hiếm ít hơn hẳn đồ thường', () => {
    const rng = createRng('do-hiem')
    const counts: Record<string, number> = { common: 0, rare: 0, epic: 0 }
    for (let i = 0; i < 3000; i++) {
      const item = rollLoot(outcome({ accuracy: 1, bestCombo: 10 }), rng)
      if (item) counts[item.rarity] = (counts[item.rarity] ?? 0) + 1
    }
    expect(counts.common!).toBeGreaterThan(counts.rare!)
    expect(counts.rare!).toBeGreaterThan(counts.epic!)
  })

  it('mọi vật phẩm rơi ra đều có trong bảng đồ', () => {
    const rng = createRng('kiem-tra')
    for (let i = 0; i < 300; i++) {
      const item = rollLoot(outcome(), rng)
      if (item) expect(findLootItem(item.id)).toBeDefined()
    }
  })

  it('mọi vật phẩm trong bảng đều có ít nhất một chỉ số cộng thêm', () => {
    for (const item of LOOT_TABLE) {
      const total = (item.bonus.bonusHp ?? 0) + (item.bonus.bonusPower ?? 0)
      expect(total).toBeGreaterThan(0)
    }
  })

  it('id vật phẩm không trùng nhau', () => {
    expect(new Set(LOOT_TABLE.map((i) => i.id)).size).toBe(LOOT_TABLE.length)
  })
})

describe('bonusAwards', () => {
  it('thưởng khi làm đúng toàn bộ và thắng trận', () => {
    const awards = bonusAwards(outcome({ accuracy: 1 }))
    expect(awards.some((a) => a.label.includes('Không sai'))).toBe(true)
  })

  it('không thưởng "không sai câu nào" khi phải rút lui', () => {
    const awards = bonusAwards(outcome({ accuracy: 1, victory: false }))
    expect(awards.some((a) => a.label.includes('Không sai'))).toBe(false)
  })

  it('thưởng cho chuỗi đúng dài', () => {
    expect(bonusAwards(outcome({ bestCombo: 6 })).some((a) => a.label.includes('Chuỗi'))).toBe(true)
    expect(bonusAwards(outcome({ bestCombo: 2 })).some((a) => a.label.includes('Chuỗi'))).toBe(false)
  })
})
