/**
 * Chiêu con đã học, và bộ chiêu con mang ra trận.
 *
 * Hai con số khác nhau, đừng lẫn:
 *
 *   ĐÃ HỌC  - tổng số chiêu con biết. Mới vào đúng 2, thăng cấp mới học thêm.
 *   Ô RA TRẬN - trong số đã học, con mang được mấy chiêu vào trận. Tối đa 4.
 *
 * Lúc mới chơi hai con số bằng nhau (2 và 2), nên không có gì phải sắp - đúng
 * như trẻ mong đợi: có hai chiêu thì mang cả hai. Từ cấp 3 trở đi số chiêu đã
 * học vượt số ô, và lúc đó việc sắp chiêu mới thật sự là một quyết định.
 *
 * Trước đây MỌI phép mà đội thú biết đều hiện ra cùng lúc - sáu tới chín nút
 * ngay từ trận đầu. Trẻ lớp 1 nhìn vào không chọn, mà bấm bừa cái gần nhất.
 * Nhiều lựa chọn không phải là nhiều quyết định.
 */

import { SPELLS } from '../content/pets'
import type { BattlePet, Spell } from './pets'

/** Mốc cấp mở thêm Ô mang ra trận. Xếp từ cao xuống thấp để tra là lấy cái đầu. */
const SLOT_TIERS: Array<{ atLevel: number; slots: number }> = [
  { atLevel: 10, slots: 4 },
  { atLevel: 5, slots: 3 },
  { atLevel: 1, slots: 2 },
]

/**
 * Mốc cấp HỌC THÊM chiêu.
 *
 * Dày ở đoạn đầu rồi thưa dần. Cấp 2 tới sau chừng hai trận, cấp 3 sau năm
 * trận - đủ gần để trẻ thấy phần thưởng, đủ xa để mỗi lần học thêm còn là một
 * sự kiện. Sau cấp 10 thì giãn hẳn ra, vì lúc đó con đã có bốn ô và học thêm
 * chỉ là đổi màu lựa chọn chứ không mở ra lối chơi mới.
 */
const SPELL_TIERS: Array<{ atLevel: number; count: number }> = [
  { atLevel: 26, count: 9 },
  { atLevel: 20, count: 8 },
  { atLevel: 15, count: 7 },
  { atLevel: 11, count: 6 },
  { atLevel: 8, count: 5 },
  { atLevel: 5, count: 4 },
  { atLevel: 3, count: 3 },
  { atLevel: 1, count: 2 },
]

/** Số ô chiêu tối đa. */
export const MAX_SLOTS = 4

/** Số chiêu ít nhất con luôn có, kể cả ở cấp 0 của một hồ sơ hỏng. */
export const MIN_KNOWN = 2

export function slotsForLevel(level: number): number {
  return SLOT_TIERS.find((tier) => level >= tier.atLevel)?.slots ?? 2
}

/** Cấp kế tiếp mở thêm ô, hoặc null nếu đã mở hết. */
export function nextSlotLevel(level: number): number | null {
  const next = [...SLOT_TIERS].reverse().find((tier) => tier.atLevel > level)
  return next?.atLevel ?? null
}

/** Số chiêu con đã học ở cấp này. */
export function spellsKnownAt(level: number): number {
  return SPELL_TIERS.find((tier) => level >= tier.atLevel)?.count ?? MIN_KNOWN
}

/** Cấp kế tiếp học thêm chiêu, hoặc null nếu đã học hết bảng. */
export function nextSpellLevel(level: number): number | null {
  const next = [...SPELL_TIERS].reverse().find((tier) => tier.atLevel > level)
  return next?.atLevel ?? null
}

/**
 * Thứ tự HỌC chiêu: lần lượt mỗi con một chiêu, rồi mới vòng lại chiêu thứ hai.
 *
 * Không phải học hết chiêu của con thứ nhất rồi mới sang con thứ hai. Lấy theo
 * từng con thì hai chiêu đầu tiên đều cùng một hệ, và trận nào cũng chỉ có một
 * nước đi đúng - trẻ bấm nút nào cũng như nhau. Vòng qua từng con thì ngay từ
 * cấp 1 con đã có hai hệ khác nhau trong tay, và câu hỏi "đánh bằng chiêu nào"
 * mới có câu trả lời thật.
 *
 * Trong mỗi con, thứ tự giữ nguyên như đã khai trong bộ thú: chiêu cơ bản
 * trước, chiêu mạnh sau.
 */
export function learnOrder(pets: Array<{ spellIds: string[] }>): Spell[] {
  const deepest = pets.reduce((max, pet) => Math.max(max, pet.spellIds.length), 0)
  const seen = new Set<string>()
  const out: Spell[] = []

  for (let round = 0; round < deepest; round++) {
    for (const pet of pets) {
      // Chiêu SỚM NHẤT của con này mà chưa ai trong đội đóng góp. Lấy thẳng
      // `spellIds[round]` thì con nào trùng chiêu với con trước sẽ mất lượt,
      // và hai chiêu đầu tiên lại rơi hết vào một con - đúng cái phải tránh.
      const id = pet.spellIds.find((candidate) => !seen.has(candidate) && SPELLS[candidate])
      if (id === undefined) continue
      seen.add(id)
      out.push(SPELLS[id]!)
    }
  }
  return out
}

/**
 * Những chiêu con ĐÃ HỌC ở cấp này, theo đúng thứ tự học.
 *
 * Nhận cả `BattlePet` (trong trận) lẫn `Pet` (ở kho đồ) - hai nơi cùng cần danh
 * sách này, và khác nhau chỉ ở chỗ có máu hiện tại hay không.
 */
export function knownSpells(pets: Array<{ spellIds: string[] }>, level: number): Spell[] {
  return learnOrder(pets).slice(0, spellsKnownAt(level))
}

/**
 * Số ô thật sự dùng được: không bao giờ nhiều hơn số chiêu đã học.
 *
 * Cấp 10 mở ô thứ tư, nhưng nếu đội thú trước mặt chỉ biết ba chiêu thì bày ra
 * một ô trống vĩnh viễn chỉ tổ làm trẻ tưởng mình đang thiếu cái gì.
 */
export function usableSlots(level: number, knownCount: number): number {
  return Math.max(1, Math.min(slotsForLevel(level), knownCount))
}

/**
 * Bộ chiêu thật sự mang ra trận.
 *
 * KHÔNG BAO GIỜ TRẢ VỀ RỖNG. Bộ đã lưu có thể toàn phép của một con thú vừa bị
 * đổi ra khỏi đội, hoặc của một hồ sơ cũ chưa từng chọn gì. Rỗng thì trẻ trả lời
 * đúng xong không có nút nào để bấm - kẹt cứng giữa trận. Thiếu bao nhiêu thì
 * lấp bấy nhiêu từ những chiêu con đã học.
 */
export function resolveLoadout(
  saved: string[] | undefined,
  known: Spell[],
  slots: number,
): string[] {
  const knownIds = new Set(known.map((spell) => spell.id))
  const picked = (saved ?? []).filter((id) => knownIds.has(id)).slice(0, slots)

  for (const spell of known) {
    if (picked.length >= slots) break
    if (!picked.includes(spell.id)) picked.push(spell.id)
  }
  return picked
}

/**
 * Lọc danh sách lựa chọn trong trận theo bộ chiêu đã sắp.
 *
 * Hai việc mà bản đầu làm sai, và cả hai đều đẻ ra thừa nút:
 *
 *  1. MỖI CHIÊU MỘT NÚT. Danh sách vào đây là từng cặp (chiêu, con thú), mà hai
 *     con trong đội biết chung một chiêu là chuyện thường - thành ra "Tia Số"
 *     hiện hai lần cạnh nhau, và bốn ô hoá năm nút.
 *
 *  2. HẾT ĐƯỜNG THÌ VẪN PHẢI TRONG HẠN MỨC. Khi con thú giữ cả bộ chiêu ngã
 *     xuống giữa trận, không còn chiêu nào trong bộ tung được nữa. Bản cũ lúc
 *     đó đổ HẾT phép của những con còn sống ra - hai nút thành bốn, đúng ngay
 *     lúc trẻ đang cuống. Giờ chỉ lấy đúng `limit` chiêu đầu.
 */
export function filterByLoadout<T extends { spell: Spell }>(
  options: T[],
  loadout: string[],
  limit: number,
): T[] {
  const room = Math.max(1, limit)

  const firstOf = (ids: string[]): T[] => {
    const out: T[] = []
    for (const id of ids) {
      if (out.length >= room) break
      const found = options.find((option) => option.spell.id === id)
      if (found) out.push(found)
    }
    return out
  }

  const kept = firstOf(loadout)
  if (kept.length > 0) return kept

  // Không còn con nào tung được chiêu trong bộ: lấy tạm từng chiêu một của
  // những con còn sống, vẫn không quá số ô.
  const seen = new Set<string>()
  const spare: T[] = []
  for (const option of options) {
    if (spare.length >= room) break
    if (seen.has(option.spell.id)) continue
    seen.add(option.spell.id)
    spare.push(option)
  }
  return spare
}

/** Chỉ để đọc cho dễ ở chỗ gọi - `BattlePet` cũng là một thứ có `pet.spellIds`. */
export function petsOf(team: BattlePet[]): Array<{ spellIds: string[] }> {
  return team.map((member) => member.pet)
}
