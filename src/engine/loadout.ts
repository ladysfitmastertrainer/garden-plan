/**
 * Bốn chiêu con thú biết, và HAI chiêu nó mang ra trận.
 *
 * Hai con số khác nhau, đừng lẫn:
 *
 *   ĐÃ MỞ    - trong bốn chiêu của con thú, nó đã với tới mấy chiêu. Hai lúc
 *              mới bắt, ba sau nấc tiến hoá thứ nhất, bốn sau nấc thứ hai.
 *   MANG RA TRẬN - trong số đã mở, trẻ cầm theo mấy chiêu. LUÔN LÀ HAI.
 *
 * Lúc mới bắt hai con số bằng nhau (2 và 2), nên không có gì phải sắp - đúng
 * như trẻ mong đợi: có hai chiêu thì mang cả hai. Từ nấc tiến hoá thứ nhất trở
 * đi số chiêu đã mở vượt số ô, và lúc đó việc sắp chiêu mới thật sự là một
 * quyết định: cầm chiêu nhà cho chắc, hay cầm chiêu mượn hệ để chờ đúng con
 * quái khắc mình.
 *
 * ---- HAI Ô, VÀ VÌ SAO KHÔNG PHẢI BỐN ----
 *
 * Trước đây số ô nở theo cấp của TRẺ: hai ô lúc mới vào, bốn ô ở cấp 10. Và
 * danh sách chiêu thì gom của CẢ ĐỘI ba con. Cả hai điều ấy đi cùng đội hình,
 * và đội hình thì không còn.
 *
 * Hai ô là cố định, vì hai lựa chọn đã đủ để có một quyết định thật (đánh khắc
 * hệ hay đánh mạnh) mà trẻ lớp 1 vẫn đọc hết được trong một nhịp. Bốn nút thì
 * trẻ bấm bừa cái gần nhất - nhiều lựa chọn không phải là nhiều quyết định.
 *
 * Và vì chỉ có hai ô cho bốn chiêu, mỗi nấc tiến hoá không chỉ CHO THÊM mà còn
 * BẮT PHẢI BỎ BỚT. Đó mới là chỗ trẻ phải nghĩ.
 */

import { SPELLS } from '../content/pets'
import { evolutionStage, unlockedSpellIds, type Pet, type Spell } from './pets'

/** Số chiêu mang ra trận. Cố định, không nở theo cấp nữa. */
export const EQUIPPED_SLOTS = 2

/**
 * Nấc tiến hoá nào mở chiêu thứ mấy.
 *
 * Chỉ số của mảng là số chiêu ĐÃ MỞ, giá trị là nấc cần đạt. Chiêu thứ 3 cần
 * nấc 1, chiêu thứ 4 cần nấc 2. Nấc 3 (cấp 20) không có trong bảng vì nó không
 * mở thêm chiêu nào - nó đổi hình và cộng chỉ số.
 */
const STAGE_FOR_SPELL: Record<number, number> = { 3: 1, 4: 2 }

/** Toàn bộ chiêu con thú này sẽ có, kể cả chiêu chưa mở. Luôn đủ bốn. */
export function allSpellsOf(pet: Pet): Spell[] {
  return pet.spellIds.map((id) => SPELLS[id]).filter((s): s is Spell => s !== undefined)
}

/**
 * Những chiêu con thú ĐÃ MỞ ở lượng kinh nghiệm này.
 *
 * Nhận `Pet` gốc kèm `xp` chứ không nhận con đã qua `resolvePet`. Hai đường vào
 * cùng ra một kết quả, nhưng đường này còn dùng được ở kho đồ - nơi cần hỏi
 * "con này mà nuôi thêm thì mở ra chiêu gì" về một con CHƯA ra trận.
 */
export function unlockedSpells(pet: Pet, xp: number): Spell[] {
  return unlockedSpellIds(pet, xp)
    .map((id) => SPELLS[id])
    .filter((s): s is Spell => s !== undefined)
}

/**
 * Nấc tiến hoá kế tiếp MỞ THÊM CHIÊU, hoặc null khi đã đủ bốn.
 *
 * Trả về cấp cần đạt, để giao diện nói được "cấp 10 thì học chiêu cuối". Đọc
 * mốc cấp từ chính bản khai của con thú (`evolutions[].atLevel`) chứ không gõ
 * lại 5 và 10 ở đây: hai chỗ cùng khai một con số thì sẽ có ngày lệch nhau.
 */
export function nextUnlockLevel(pet: Pet, xp: number): number | null {
  const open = unlockedSpellIds(pet, xp).length
  const stage = STAGE_FOR_SPELL[open + 1]
  if (stage === undefined) return null
  return pet.evolutions[stage - 1]?.atLevel ?? null
}

/** Con thú đã mở hết bốn chiêu chưa. */
export function hasAllSpells(pet: Pet, xp: number): boolean {
  return unlockedSpellIds(pet, xp).length >= pet.spellIds.length
}

/**
 * Hai chiêu thật sự mang ra trận.
 *
 * KHÔNG BAO GIỜ TRẢ VỀ RỖNG. Bộ đã lưu có thể là của một con thú khác vừa bị
 * đổi ra, hoặc chứa một chiêu con thú CHƯA mở tới - hồ sơ lưu từ trước khi bản
 * này ra đời, hoặc trẻ đổi con thú đi theo mà bộ chiêu cũ còn nằm đó. Rỗng thì
 * trẻ trả lời đúng xong không có nút nào để bấm, kẹt cứng giữa trận.
 *
 * Thiếu bao nhiêu thì lấp bấy nhiêu, lấy từ đầu danh sách đã mở - tức là hai
 * chiêu nền. Chúng luôn có, và luôn là lựa chọn tử tế.
 */
export function resolvePetLoadout(saved: string[] | undefined, unlocked: Spell[]): string[] {
  const open = new Set(unlocked.map((spell) => spell.id))
  const picked = (saved ?? []).filter((id) => open.has(id)).slice(0, EQUIPPED_SLOTS)

  for (const spell of unlocked) {
    if (picked.length >= EQUIPPED_SLOTS) break
    if (!picked.includes(spell.id)) picked.push(spell.id)
  }
  return picked
}

/**
 * Chiêu đang cầm, dựng thẳng từ con thú và bộ đã lưu. Một lời gọi cho cả hai
 * bước, vì không chỗ nào cần riêng một trong hai.
 */
export function equippedSpells(pet: Pet, xp: number, saved: string[] | undefined): Spell[] {
  const unlocked = unlockedSpells(pet, xp)
  return resolvePetLoadout(saved, unlocked)
    .map((id) => SPELLS[id])
    .filter((s): s is Spell => s !== undefined)
}

/**
 * Chiêu này đã mở chưa, và nếu chưa thì còn chờ nấc nào.
 *
 * Dùng ở kho đồ để vẽ hai chiêu CHƯA mở dưới dạng ô khoá kèm lời hẹn, thay vì
 * giấu chúng đi. Giấu đi thì trẻ không biết có gì đang chờ mình; bày ra thì
 * nấc tiến hoá kế tiếp có một khuôn mặt cụ thể.
 */
export function spellLockOf(
  pet: Pet,
  xp: number,
  spellId: string,
): { locked: boolean; atLevel: number | null } {
  const at = pet.spellIds.indexOf(spellId)
  if (at < 0) return { locked: true, atLevel: null }

  const stage = STAGE_FOR_SPELL[at + 1]
  if (stage === undefined) return { locked: false, atLevel: null }

  return {
    locked: evolutionStage(pet, xp) < stage,
    atLevel: pet.evolutions[stage - 1]?.atLevel ?? null,
  }
}
