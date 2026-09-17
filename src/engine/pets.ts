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
 * Một hình thái tiến hoá của thú.
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
  /** Phép học thêm ở nấc này. Gộp vào phép cũ chứ không thay thế. */
  spellIds: string[]
  /** Cấp cần đạt để lên nấc này. */
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
  /**
   * BA nấc tiến hoá, xếp theo cấp tăng dần.
   *
   * Là một MẢNG chứ không phải một trường `evolution` duy nhất như bản đầu. Một
   * nấc duy nhất ở cấp 5 để lại một khoảng trống dài: từ đó tới kịch cấp con thú
   * chỉ nhích thêm hai điểm máu mỗi cấp, không còn cái mốc nào để ngóng. Ba nấc
   * chia quãng đường thành ba chặng, mỗi chặng có một hình mới ở cuối.
   */
  evolutions: PetEvolution[]
}

// --- Cấp độ và tiến hoá --------------------------------------------------------

/**
 * Kịch cấp là 20 - đúng bằng cấp của nấc tiến hoá cuối.
 *
 * Không đặt cao hơn: cấp nằm sau nấc cuối là cấp không dẫn tới đâu, và chính
 * khoảng trống ấy là thứ bản trước mắc phải khi kịch cấp 10 mà nấc duy nhất
 * nằm ở cấp 5.
 */
export const MAX_PET_LEVEL = 20

/**
 * Kinh nghiệm cần để ĐẠT một cấp. Dùng công thức thay vì bảng tra để không có
 * chỗ nào gõ lệch: cấp 1 cần 0, cấp 2 cần 40, cấp 5 cần 400.
 *
 * Bậc hai nên quãng đường dài dần: cấp 10 cần 1.800, cấp 20 cần 7.600. Một trận
 * chia cho thú chừng 50-80 điểm, nên nấc cuối là mục tiêu của cả năm học chứ
 * không phải của một buổi chiều - và nó nên như vậy.
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

/** Những nấc tiến hoá thú đã qua, theo thứ tự. Rỗng nghĩa là còn hình gốc. */
export function evolutionsReached(pet: Pet, xp: number): PetEvolution[] {
  const level = petLevel(xp)
  return pet.evolutions.filter((e) => level >= e.atLevel)
}

/**
 * Thú đang ở nấc thứ mấy: 0 là hình gốc, 1..3 là các nấc đã tiến hoá.
 *
 * Giao diện dùng số này để vẽ số sao cạnh tên - một ngôi sao đơn lẻ kiểu bản
 * một nấc không nói được con ở nấc hai khác con ở nấc ba chỗ nào.
 */
export function evolutionStage(pet: Pet, xp: number): number {
  return evolutionsReached(pet, xp).length
}

/** Hình thái hiện tại. null nghĩa là thú vẫn ở hình gốc. */
export function currentEvolution(pet: Pet, xp: number): PetEvolution | null {
  const reached = evolutionsReached(pet, xp)
  return reached[reached.length - 1] ?? null
}

/** Nấc tiến hoá kế tiếp đang chờ. null khi đã lên hết. */
export function nextEvolution(pet: Pet, xp: number): PetEvolution | null {
  const level = petLevel(xp)
  return pet.evolutions.find((e) => level < e.atLevel) ?? null
}

/**
 * Thú ở trạng thái THỰC TẾ: đã cộng chỉ số theo cấp và đã tiến hoá tới nấc cao
 * nhất mà cấp hiện tại với tới.
 *
 * Mọi nơi dùng thú trong trận đều phải đi qua hàm này. Dùng thẳng dữ liệu gốc
 * thì con thú đã tiến hoá vẫn đánh yếu như lúc mới bắt.
 */
export function resolvePet(pet: Pet, xp: number): Pet {
  const level = petLevel(xp)
  const reached = evolutionsReached(pet, xp)
  const base = reached[reached.length - 1] ?? pet

  return {
    ...pet,
    name: base.name,
    sprite: base.sprite,
    // Mỗi cấp cộng thêm một chút máu và sức mạnh, ngoài cú nhảy khi tiến hoá.
    maxHp: base.maxHp + (level - 1) * 2,
    power: Math.round((base.power + (level - 1) * 0.03) * 1000) / 1000,
    // Gộp phép của MỌI nấc đã qua, không chỉ nấc hiện tại: nhảy thẳng từ cấp 4
    // lên cấp 12 trong một trận thì phép của nấc giữa cũng phải theo về.
    spellIds: [...new Set([...pet.spellIds, ...reached.flatMap((e) => e.spellIds)])],
  }
}

/** Con thú này đã tiến hoá ít nhất một nấc chưa. */
export function hasEvolved(pet: Pet, xp: number): boolean {
  return evolutionStage(pet, xp) > 0
}

/**
 * Nấc thú VỪA lên khi kinh nghiệm đi từ `before` tới `after`, hoặc null.
 *
 * Dùng ở màn tổng kết để báo tin - tiến hoá mà không ai báo thì mất hẳn ý nghĩa.
 * Trả về NẤC CAO NHẤT khi một trận đưa thú qua hai mốc một lúc: trẻ cần thấy
 * hình cuối cùng con thú đang mang, không phải hình nó vừa đi ngang qua.
 */
export function justEvolved(pet: Pet, before: number, after: number): PetEvolution | null {
  const gained = evolutionsReached(pet, after).slice(evolutionStage(pet, before))
  return gained[gained.length - 1] ?? null
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
