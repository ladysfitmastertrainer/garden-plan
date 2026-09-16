/**
 * Cấp độ, chỉ số và phần thưởng rơi ra sau trận.
 *
 * Đường cong kinh nghiệm cố ý dốc thoải ở những cấp đầu: trẻ cần thấy mình lên
 * cấp trong vài phút chơi đầu tiên, nếu không sẽ bỏ trước khi kịp thích.
 */

import type { Rng } from './rng'
import type { PlayerStats } from './battle'

export const MAX_LEVEL = 50

/** Kinh nghiệm cần để đi từ `level` lên `level + 1`. */
export function xpToNextLevel(level: number): number {
  return 40 + (level - 1) * 30
}

export interface LevelProgress {
  level: number
  /** Kinh nghiệm đã tích trong cấp hiện tại. */
  xpIntoLevel: number
  /** Tổng kinh nghiệm cần cho cấp hiện tại. */
  xpForNext: number
}

export function levelFromTotalXp(totalXp: number): LevelProgress {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))

  while (level < MAX_LEVEL) {
    const need = xpToNextLevel(level)
    if (remaining < need) break
    remaining -= need
    level++
  }

  return {
    level,
    xpIntoLevel: level >= MAX_LEVEL ? 0 : remaining,
    xpForNext: level >= MAX_LEVEL ? 0 : xpToNextLevel(level),
  }
}

export interface EquipmentBonus {
  bonusHp?: number
  bonusPower?: number
}

export function statsForLevel(level: number, bonus: EquipmentBonus = {}): PlayerStats {
  return {
    maxHp: 50 + (level - 1) * 8 + (bonus.bonusHp ?? 0),
    power: 1 + (level - 1) * 0.05 + (bonus.bonusPower ?? 0),
  }
}

// --- Vật phẩm rơi ------------------------------------------------------------

export type Rarity = 'common' | 'rare' | 'epic'

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Thường',
  rare: 'Hiếm',
  epic: 'Cực hiếm',
}

export interface LootItem {
  id: string
  name: string
  emoji: string
  rarity: Rarity
  bonus: EquipmentBonus
}

const LOOT_TABLE: LootItem[] = [
  { id: 'mu-vai', name: 'Mũ vải', emoji: '🧢', rarity: 'common', bonus: { bonusHp: 4 } },
  { id: 'ao-choang-cu', name: 'Áo choàng cũ', emoji: '🧥', rarity: 'common', bonus: { bonusHp: 6 } },
  { id: 'but-long-ngong', name: 'Bút lông ngỗng', emoji: '🪶', rarity: 'common', bonus: { bonusPower: 0.05 } },
  { id: 'kinh-tri-tue', name: 'Kính trí tuệ', emoji: '🤓', rarity: 'rare', bonus: { bonusPower: 0.12 } },
  { id: 'giap-sao-bang', name: 'Giáp sao băng', emoji: '🛡️', rarity: 'rare', bonus: { bonusHp: 18 } },
  { id: 'sao-thanh-am', name: 'Sáo thanh âm', emoji: '🎶', rarity: 'rare', bonus: { bonusPower: 0.15 } },
  { id: 'vuong-mien-so-hoc', name: 'Vương miện Số Học', emoji: '👑', rarity: 'epic', bonus: { bonusHp: 20, bonusPower: 0.25 } },
  { id: 'den-long-tri-tue', name: 'Đèn lồng Trí Tuệ', emoji: '🏮', rarity: 'epic', bonus: { bonusHp: 30, bonusPower: 0.18 } },
]

const RARITY_WEIGHT: Record<Rarity, number> = { common: 70, rare: 25, epic: 5 }

export interface BattleOutcome {
  victory: boolean
  goldEarned: number
  xpEarned: number
  /** Chuỗi đúng dài nhất trong trận - chuỗi dài tăng cơ hội rơi đồ tốt. */
  bestCombo: number
  accuracy: number
}

/**
 * Quay đồ rơi. Chỉ rơi khi thắng - rút lui vẫn giữ vàng và kinh nghiệm nhưng
 * không có đồ, để chiến thắng vẫn đáng giá.
 */
export function rollLoot(outcome: BattleOutcome, rng: Rng): LootItem | null {
  if (!outcome.victory) return null

  const dropChance = 0.35 + Math.min(0.3, outcome.bestCombo * 0.05) + outcome.accuracy * 0.15
  if (!rng.chance(dropChance)) return null

  const rarity = rng.weighted(
    (Object.keys(RARITY_WEIGHT) as Rarity[]).map((r) => [r, RARITY_WEIGHT[r]] as const),
  )
  const pool = LOOT_TABLE.filter((item) => item.rarity === rarity)
  return pool.length > 0 ? rng.pick(pool) : null
}

/** Thưởng thêm cho thành tích xuất sắc, hiển thị riêng ở màn tổng kết. */
export interface BonusAward {
  label: string
  gold: number
  xp: number
}

export function bonusAwards(outcome: BattleOutcome): BonusAward[] {
  const awards: BonusAward[] = []
  if (outcome.accuracy === 1 && outcome.victory) {
    awards.push({ label: 'Không sai câu nào!', gold: 15, xp: 20 })
  }
  if (outcome.bestCombo >= 5) {
    awards.push({ label: `Chuỗi ${outcome.bestCombo} câu liên tiếp!`, gold: 10, xp: 15 })
  }
  return awards
}

export function findLootItem(id: string): LootItem | undefined {
  return LOOT_TABLE.find((item) => item.id === id)
}

export { LOOT_TABLE }
