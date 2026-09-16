/**
 * Thú đồng hành, phép thuật và khắc chế nguyên tố.
 *
 * ĐÂY LÀ THỨ CHỮA CHỨNG CHÁN. Vòng chơi cũ là: đi bộ tới cổng, trả lời 10 câu,
 * thắng - lặp lại 19 lần mỗi vùng. Trả lời đúng thì sát thương tự nhảy ra, trẻ
 * không có quyết định nào để đưa ra, nên trận thứ hai giống hệt trận thứ nhất.
 *
 * Giờ giữa các câu hỏi có một quyết định thật: trả lời đúng cho con QUYỀN TUNG
 * PHÉP, và chọn phép nào thì tuỳ nguyên tố của quái trước mặt. Cùng một câu trả
 * lời đúng có thể gây 12 hoặc 27 sát thương, khác nhau ở chỗ con chọn.
 *
 * Bốn nguyên tố chính là bốn môn học, không đặt thêm hệ mới - nhờ vậy trẻ học
 * luôn rằng bốn môn là bốn sức mạnh ngang nhau, và vòng khắc chế khép kín:
 *
 *      Số Học  →  Ngôn Từ  →  Thanh Âm  →  Ánh Sáng  →  Số Học
 *
 * Hàm thuần, không đụng React, không đụng Date.now().
 */

import type { Subject } from '../content/types'

/** Nguyên tố = môn học. Xem SUBJECT_ELEMENT để lấy tên hiển thị. */
export type Element = Subject

/** Nguyên tố này mạnh hơn nguyên tố nào. Vòng khép kín bốn bậc. */
const BEATS: Record<Element, Element> = {
  math: 'vietnamese',
  vietnamese: 'music',
  music: 'ethics',
  ethics: 'math',
}

/**
 * Hệ nào khắc được hệ đã cho. Dùng để đảm bảo đội hình luôn có đường ra:
 * thiếu con khắc chế thì bảng chọn phép chỉ còn toàn lựa chọn xấu.
 */
export function counterElement(defend: Element): Element {
  return (Object.keys(BEATS) as Element[]).find((attack) => BEATS[attack] === defend)!
}

export const STRONG_MULTIPLIER = 1.5
export const WEAK_MULTIPLIER = 0.7

/**
 * Hệ số sát thương khi nguyên tố `attack` đánh vào nguyên tố `defend`.
 *
 * Cố ý KHÔNG cho hệ số 0: trẻ chọn sai nguyên tố vẫn gây được sát thương, chỉ
 * ít hơn. Một lựa chọn dẫn tới "vô tác dụng" sẽ khiến trẻ thấy mình bị phạt vì
 * đã trả lời đúng.
 */
export function elementMultiplier(attack: Element, defend: Element): number {
  if (BEATS[attack] === defend) return STRONG_MULTIPLIER
  if (BEATS[defend] === attack) return WEAK_MULTIPLIER
  return 1
}

/** Lời mô tả ngắn cho trẻ biết vì sao đòn vừa rồi mạnh hay yếu. */
export function matchupLabel(attack: Element, defend: Element): 'strong' | 'weak' | 'neutral' {
  const m = elementMultiplier(attack, defend)
  if (m > 1) return 'strong'
  if (m < 1) return 'weak'
  return 'neutral'
}

// --- Phép thuật ---------------------------------------------------------------

export interface Spell {
  id: string
  name: string
  element: Element
  /** Hệ số nhân vào sát thương cơ bản. */
  power: number
  /** Câu tường thuật khi tung phép, hiện trong khung diễn biến. */
  flavour: string
}

// --- Thú đồng hành ------------------------------------------------------------

/**
 * Hình thái tiến hoá của một thú.
 *
 * Gắn THẲNG vào con gốc chứ không tạo một con riêng trong bộ thú: tiến hoá là
 * cùng một con lớn lên, không phải bắt được con mới. Nhờ vậy danh sách thú đã
 * thu phục (`pets`) không đổi khi tiến hoá, và bộ sưu tập vẫn là 12 ô.
 */
export interface PetEvolution {
  name: string
  sprite: string
  maxHp: number
  power: number
  /** Phép học thêm khi tiến hoá. Gộp vào phép cũ chứ không thay thế. */
  spellIds: string[]
  /** Cấp cần đạt để tiến hoá. */
  atLevel: number
}

export interface Pet {
  id: string
  name: string
  element: Element
  /** Id sprite trong features/pixel/creatures. */
  sprite: string
  maxHp: number
  /** Hệ số sát thương riêng của thú. 1.0 là trung bình. */
  power: number
  /** Các phép thú này biết. Luôn có ít nhất một phép cùng nguyên tố. */
  spellIds: string[]
  evolution?: PetEvolution
}

// --- Cấp độ và tiến hoá --------------------------------------------------------

export const MAX_PET_LEVEL = 10

/**
 * Kinh nghiệm cần để ĐẠT một cấp. Dùng công thức thay vì bảng tra để không có
 * chỗ nào gõ lệch: cấp 1 cần 0, cấp 2 cần 40, cấp 5 cần 400.
 */
export function xpForLevel(level: number): number {
  return 20 * level * (level - 1)
}

/** Cấp hiện tại của thú, tính từ tổng kinh nghiệm. */
export function petLevel(xp: number): number {
  let level = 1
  while (level < MAX_PET_LEVEL && xp >= xpForLevel(level + 1)) level++
  return level
}

/** Còn bao nhiêu kinh nghiệm nữa thì lên cấp. null khi đã kịch cấp. */
export function xpToNextLevel(xp: number): { need: number; into: number; span: number } | null {
  const level = petLevel(xp)
  if (level >= MAX_PET_LEVEL) return null
  const floor = xpForLevel(level)
  const ceiling = xpForLevel(level + 1)
  return { need: ceiling - xp, into: xp - floor, span: ceiling - floor }
}

/**
 * Thú ở trạng thái THỰC TẾ: đã cộng chỉ số theo cấp và đã tiến hoá nếu đủ cấp.
 *
 * Mọi nơi dùng thú trong trận đều phải đi qua hàm này. Dùng thẳng dữ liệu gốc
 * thì con thú đã tiến hoá vẫn đánh yếu như lúc mới bắt.
 */
export function resolvePet(pet: Pet, xp: number): Pet {
  const level = petLevel(xp)
  const evolved = pet.evolution && level >= pet.evolution.atLevel ? pet.evolution : null
  const base = evolved ?? pet

  return {
    ...pet,
    name: base.name,
    sprite: base.sprite,
    // Mỗi cấp cộng thêm một chút máu và sức mạnh, ngoài cú nhảy khi tiến hoá.
    maxHp: base.maxHp + (level - 1) * 2,
    power: Math.round((base.power + (level - 1) * 0.03) * 1000) / 1000,
    spellIds: evolved ? [...new Set([...pet.spellIds, ...evolved.spellIds])] : pet.spellIds,
  }
}

/** Con thú này đã tiến hoá chưa. */
export function hasEvolved(pet: Pet, xp: number): boolean {
  return Boolean(pet.evolution && petLevel(xp) >= pet.evolution.atLevel)
}

/**
 * Thú nào vừa tiến hoá khi kinh nghiệm đi từ `before` lên `after`.
 * Dùng ở màn tổng kết để báo tin - tiến hoá mà không ai báo thì mất hẳn ý nghĩa.
 */
export function justEvolved(pet: Pet, before: number, after: number): boolean {
  return !hasEvolved(pet, before) && hasEvolved(pet, after)
}

/** Thú khi đã vào trận - thêm máu hiện tại. */
export interface BattlePet {
  pet: Pet
  hp: number
}

export function toBattlePet(pet: Pet): BattlePet {
  return { pet, hp: pet.maxHp }
}

/** Thú còn đứng được không. */
export function isAlive(p: BattlePet): boolean {
  return p.hp > 0
}

/**
 * Thú tiếp theo còn sống, tính từ sau `from`. Trả -1 khi cả đội đã gục.
 *
 * Đi vòng từ đầu chứ không chỉ tiến về sau: nếu thú số 1 gục trước rồi thú số 3
 * cũng gục, thú số 2 vẫn phải được gọi ra.
 */
export function nextAlive(team: BattlePet[], from: number): number {
  for (let step = 1; step <= team.length; step++) {
    const index = (from + step) % team.length
    if (isAlive(team[index]!)) return index
  }
  return -1
}

export function teamAlive(team: BattlePet[]): number {
  return team.filter(isAlive).length
}

/** Tổng máu còn lại của cả đội - dùng cho thanh máu chung kiểu Prodigy. */
export function teamHp(team: BattlePet[]): { hp: number; maxHp: number } {
  return team.reduce(
    (acc, p) => ({ hp: acc.hp + p.hp, maxHp: acc.maxHp + p.pet.maxHp }),
    { hp: 0, maxHp: 0 },
  )
}
