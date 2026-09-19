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

/**
 * Hệ ĐỐI DIỆN trong vòng bốn bậc - hai bước, không phải một.
 *
 * Đây là hệ mà một con thú hệ `e` cần mượn thêm để tự đứng được một mình.
 *
 * Nghe ngược, nên nói cho hết lẽ. Con thú hệ Ngôn Từ sợ nhất quái hệ Số Học,
 * vì Số Học khắc Ngôn Từ. Phản xạ đầu tiên là phát cho nó một chiêu Số Học -
 * nhưng Số Học đánh Số Học chỉ ra hệ số 1,0, chẳng gỡ được gì. Thứ nó cần là
 * hệ KHẮC ĐƯỢC Số Học, tức Ánh Sáng: đi hai bước trong vòng, không phải một.
 *
 *      Số Học  →  Ngôn Từ  →  Thanh Âm  →  Ánh Sáng  →  Số Học
 *
 * Hai bước từ Ngôn Từ là Ánh Sáng. Và vì vòng có bốn bậc nên phép này tự đối
 * xứng: đối diện của đối diện là chính nó (Số Học ↔ Thanh Âm, Ngôn Từ ↔ Ánh
 * Sáng). Nhờ vậy hai con thú đối hệ nhau mượn chiêu của nhau, không cần bảng
 * tra riêng.
 */
export function oppositeElement(e: Element): Element {
  return BEATS[BEATS[e]]
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

/**
 * Chiêu cuối làm gì NGOÀI việc gây sát thương.
 *
 * Bốn kiểu, mỗi hệ một kiểu, và cả bốn đều chọn theo một tiêu chuẩn: TRẺ SÁU
 * TUỔI PHẢI NHÌN RA NÓ ĐANG LÀM GÌ mà không cần ai giải thích. Một hiệu ứng
 * kiểu "giảm 15% kháng phép trong 3 lượt" thì đúng về cân bằng và vô hình trên
 * màn hình - trẻ chỉ thấy các con số hơi khác, và hiệu ứng ấy coi như không có.
 *
 *   'burn'   CHÁY      - quái mất máu mỗi lượt. Thấy được: ngọn lửa trên đầu
 *                        quái, và một số đỏ bật ra mỗi lượt dù con không đánh.
 *   'freeze' ĐÓNG BĂNG - quái mất đúng lượt đánh kế tiếp. Thấy được: khối băng
 *                        phủ kín quái, rồi vỡ ra.
 *   'bind'   TRÓI      - đòn của quái yếu đi một nửa. Thấy được: dây quấn quanh
 *                        quái, và con số sát thương của nó tụt hẳn.
 *   'drain'  HÚT       - quái mất máu mỗi lượt, và con thú HỒI đúng bấy nhiêu.
 *                        Thấy được nhất trong bốn: thanh máu của mình dài ra.
 */
export type EffectKind = 'burn' | 'freeze' | 'bind' | 'drain'

export interface SpellEffect {
  kind: EffectKind
  /** Hiệu ứng sống được mấy lượt kể từ lượt sau. */
  turns: number
  /**
   * Máu mất mỗi lượt, tính theo PHẦN TRĂM cú đánh đã tung ra ('burn', 'drain').
   *
   * Theo phần trăm chứ không phải một con số cứng: cùng một chiêu cuối tung ở
   * trận đầu tiên và ở trận trùm cuối phải đáng giá như nhau. Một con số cứng
   * thì hoặc là quá mạnh lúc đầu, hoặc thành vô nghĩa về sau.
   */
  tickPercent?: number
}

export interface Spell {
  id: string
  name: string
  element: Element
  /** Hệ số nhân vào sát thương cơ bản. */
  power: number
  /** Câu tường thuật khi tung phép, hiện trong khung diễn biến. */
  flavour: string
  /**
   * Chiêu thứ mấy trong bốn chiêu của một con thú.
   *
   *   1, 2 - chiêu nền, hệ của chính con thú. Có ngay từ đầu.
   *   3    - chiêu MƯỢN HỆ (xem `oppositeElement`), mở ở nấc tiến hoá thứ nhất.
   *   4    - chiêu cuối, hệ của chính nó, mở ở nấc tiến hoá thứ hai.
   */
  tier: 1 | 2 | 3 | 4
  /** Chỉ chiêu bậc 4 mới có. */
  effect?: SpellEffect
}

/**
 * Chiêu cuối nghỉ bao nhiêu lượt sau mỗi lần dùng.
 *
 * Ba, và con số này đến từ độ dài một trận. Trận thường cho con mười lượt ra
 * đòn, nên hồi ba lượt tức là dùng được chừng ba lần - đủ để trẻ học được cách
 * dùng nó, chưa đủ để nó thành cái nút duy nhất đáng bấm.
 *
 * ĐẾM THEO MỌI LƯỢT TRÔI QUA, không phải theo lượt mình thắng. Ở đấu trường,
 * đếm theo lượt thắng nghĩa là em đang bị dẫn trước lại càng lâu được nạp lại -
 * thua thì hồi chiêu đứng yên, và trận đấu khoá chặt lại đúng lúc em ấy cần
 * một đường gỡ nhất.
 */
export const ULTIMATE_COOLDOWN = 3

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
  /**
   * ĐÚNG BỐN chiêu, xếp theo thứ tự mở khoá - xem `Spell.tier`.
   *
   * Khai đủ cả bốn ngay từ đây, kể cả hai chiêu con thú chưa với tới. Chiêu nào
   * đã mở là việc của `unlockedSpellIds`, và để một chỗ duy nhất trả lời câu ấy
   * thì màn hình kho đồ mới CHO TRẺ XEM TRƯỚC được hai chiêu đang chờ ở nấc
   * sau - thứ đáng để nuôi tiếp.
   */
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
/**
 * BAO NHIÊU chiêu con thú đã mở ở nấc này. Hai, ba hoặc bốn.
 *
 * Mở theo NẤC TIẾN HOÁ chứ không theo cấp của trẻ, và đó là cả điểm của bản
 * này. Trước đây số chiêu nở ra theo cấp của TRẺ, nên con thú vừa bắt được
 * hôm qua đã biết đủ chiêu như con nuôi từ đầu năm - nuôi thú chẳng để làm gì.
 * Giờ chiêu thứ ba tới ở nấc tiến hoá thứ nhất, chiêu cuối ở nấc thứ hai: muốn
 * có chúng thì phải NUÔI ĐÚNG CON ẤY.
 *
 * Nấc thứ ba (cấp 20) không thêm chiêu nào - nó đổi hình và cộng chỉ số. Bốn
 * chiêu là đủ cho hai ô mang ra trận; thêm chiêu thứ năm chỉ làm loãng lựa
 * chọn chứ không mở ra nước đi nào mới.
 */
export function unlockedSpellCount(pet: Pet, xp: number): number {
  return Math.min(pet.spellIds.length, 2 + Math.min(2, evolutionStage(pet, xp)))
}

/** Những chiêu con thú đã mở, theo đúng thứ tự bậc. */
export function unlockedSpellIds(pet: Pet, xp: number): string[] {
  return pet.spellIds.slice(0, unlockedSpellCount(pet, xp))
}

export function resolvePet(pet: Pet, xp: number): Pet {
  const level = petLevel(xp)
  const reached = evolutionsReached(pet, xp)
  const base = reached[reached.length - 1] ?? pet

  return {
    ...pet,
    name: base.name,
    sprite: base.sprite,
    /*
      Mỗi cấp cộng thêm máu, ngoài cú nhảy khi tiến hoá.

      NĂM một cấp chứ không phải hai. Con số cũ tính cho một ĐỘI ba con - ba
      con cùng lên cấp thì đội được sáu máu mỗi cấp. Giờ chỉ còn một con ra
      trận, nên nó phải gánh cả phần ấy, nếu không thì càng lên cao con thú
      càng hụt hơi so với con quái.
    */
    maxHp: base.maxHp + (level - 1) * 5,
    power: Math.round((base.power + (level - 1) * 0.03) * 1000) / 1000,
    // Chỉ những chiêu đã mở. Con thú chưa tiến hoá cầm sẵn chiêu cuối trong tay
    // thì cả hai nấc tiến hoá đầu chẳng còn gì để mong.
    spellIds: unlockedSpellIds(pet, xp),
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

/*
  ---- CHỖ NÀY TỪNG LÀ ĐỘI HÌNH BA CON ----

  `nextAlive`, `teamAlive` và `teamHp` đã ở đây: con đang đứng gục thì con sau
  bước ra, và thanh máu là máu ba con cộng lại.

  Cả ba đi cùng đội hình. Giờ ra trận đúng MỘT con thú trẻ tự chọn, nên "con
  tiếp theo" không còn là một câu hỏi nữa - con ấy gục là trận kết thúc. Giữ lại
  ba hàm ấy để "phòng khi cần" thì chúng sẽ đứng đó mô tả một luật chơi không
  còn tồn tại, và người đọc sau sẽ tin vào chúng.

  Máu của một con thú giờ đọc thẳng từ `BattlePet.hp`.
*/
