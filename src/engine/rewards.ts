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

/**
 * Sức mạnh THẬT của bên con khi vào trận - thứ quái phải theo kịp.
 *
 * Trong trận, thứ đánh và thứ ăn đòn là CON THÚ, không phải nhân vật: sát thương
 * nhân cả sức đánh của nhân vật (`power`, đã gồm đồ đeo) lẫn sức đánh của thú
 * (`petPower`, đã gồm cấp và tiến hoá), còn đòn của quái trừ thẳng vào máu thú.
 */
export interface FighterStrength {
  /** Cấp của nhân vật - mốc để tính cấp của quái. */
  level: number
  power: number
  petPower: number
  petMaxHp: number
}

/**
 * Bên con lúc mới chơi: cấp 1, không đồ, thú khởi đầu cấp 1 (máu 95, sức 1).
 * Mọi con số gốc của quái - máu theo chặng, đòn theo chặng - được cân cho đúng
 * bên này, nên đây là mốc để chia.
 */
export const REFERENCE_FIGHTER: FighterStrength = { level: 1, power: 1, petPower: 1, petMaxHp: 95 }

/** Mỗi cấp quái cao hơn con thì mạnh thêm bấy nhiêu. */
const PER_LEVEL_GAP = { hp: 0.08, attack: 0.06 }

/**
 * Quái mạnh cỡ nào, và mang cấp mấy, trước một bên con có sức mạnh `fighter`.
 *
 * HAI BƯỚC:
 *
 *  1. THEO KỊP con. Máu quái nhân đúng theo sức đánh thật của con, đòn quái nhân
 *     đúng theo máu thật của thú - so với bên con lúc mới chơi. Nhờ vậy số đòn
 *     để hạ quái và số đòn con chịu được không bị việc mạnh lên xoá mất.
 *
 *  2. VƯỢT con một khoảng. Quái mang cấp `cấp con + gap`, và mỗi cấp chênh cộng
 *     thêm 8% máu, 6% đòn. Quái thường cao hơn con một cấp - con cấp 1 gặp quái
 *     cấp 2, con cấp 10 gặp quái cấp 11 - trùm cao hơn ba.
 *
 * Bản trước chỉ theo CẤP nhân vật (5% sức đánh mỗi cấp) mà bỏ qua con thú - thứ
 * mạnh lên nhanh nhất: tới cấp 20 thú đã tiến hoá thì máu gấp bốn, sức đánh gấp
 * đôi. Sát thương của con vì thế đi trước máu quái gần gấp đôi, và quái mang cấp
 * cao mà đánh vẫn như bù nhìn.
 */
export function enemyScaleFor(
  fighter: FighterStrength,
  gap: number,
): { hp: number; attack: number; level: number } {
  const ref = REFERENCE_FIGHTER
  const level = Math.max(1, Math.min(MAX_LEVEL, Math.floor(fighter.level)))
  return {
    hp: ((fighter.power * fighter.petPower) / (ref.power * ref.petPower)) * (1 + PER_LEVEL_GAP.hp * gap),
    attack: (fighter.petMaxHp / ref.petMaxHp) * (1 + PER_LEVEL_GAP.attack * gap),
    level: level + gap,
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
