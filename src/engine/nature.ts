/**
 * TÍNH CÁCH CON THÚ, SINH RA TỪ CÁCH ĐỨA TRẺ HỌC.
 *
 * Con thú không được sinh ra kèm tính cách. Nó lớn lên cùng một đứa trẻ cụ thể,
 * và nhiễm đúng cái nết của đứa trẻ ấy: em nào đọc đề xong bấm luôn thì con thú
 * thành GAN LÌ; em nào ngồi nhẩm cho chắc rồi mới bấm thì thành ĐIỀM TĨNH; em
 * nào hay mở gợi ý ra xem thì thành HAM HỌC.
 *
 * ---- VÌ SAO KHÔNG CÓ TÍNH CÁCH NÀO LÀ TÍNH CÁCH XẤU ----
 *
 * Đây là chỗ dễ làm hỏng nhất, và làm hỏng thì hỏng nặng.
 *
 * Nếu "nhanh" mạnh hơn "chậm", trò chơi vừa dạy trẻ rằng đoán bừa cho nhanh thì
 * hơn nghĩ kỹ - và nó dạy điều ấy hiệu quả hơn mọi lời cô giáo dặn. Nếu dùng
 * gợi ý bị phạt, trẻ sẽ thôi dùng gợi ý, kể cả lúc thật sự không hiểu bài, tức
 * là bỏ mất đúng công cụ học tập tốt nhất trong cả app.
 *
 * Nên mỗi tính cách làm CHÍNH CÁI NẾT ẤY tốt lên, không cái nào đè cái nào:
 *
 *   GAN LÌ     đánh đau hơn - phần thưởng cho em đã thuộc tới mức bấm không cần nghĩ.
 *   ĐIỀM TĨNH  trâu hơn - em đi chậm thì trận dài hơn, nên cần chịu đòn giỏi hơn.
 *   HAM HỌC    gợi ý KHÔNG còn làm yếu đòn đánh nữa.
 *
 * Cái thứ ba là cái đáng nói nhất. Bình thường mở gợi ý thì cú đánh chỉ còn 60%,
 * và đó là một cái giá hợp lý. Nhưng với đứa trẻ đã dùng gợi ý nhiều tới mức nó
 * thành nết, cái giá ấy đang thu của đúng em cần nó nhất. Gỡ đi.
 *
 * ---- VÀ NÓ LÀ MỘT TẤM GƯƠNG ----
 *
 * Tính cách hiện ra ở kho đồ, bằng chữ trẻ đọc được. Phụ huynh liếc vào là biết
 * con mình học kiểu gì - nhanh ẩu, chắc chậm, hay phải vịn - mà không cần đọc
 * một trang số liệu nào. Đó là thứ một bảng thống kê không làm được.
 *
 * Hàm thuần, không đụng React, không đụng Date.now().
 */

import type { Pet } from './pets'

export type PetNature = 'gan-li' | 'diem-tinh' | 'ham-hoc'

/**
 * Đếm nết, tích theo từng con thú.
 *
 * Theo TỪNG CON chứ không theo đứa trẻ, vì con thú là thứ mang tính cách. Một
 * em lúc mới chơi còn dò dẫm nên con thú đầu tiên điềm tĩnh; nửa năm sau em ấy
 * thuộc làu và con thú thứ hai gan lì. Hai con ấy phải khác nhau - đó chính là
 * câu chuyện của cả nửa năm.
 */
export interface NatureCounts {
  /** Trả lời nhanh, không mở gợi ý. */
  fast: number
  /** Trả lời chậm mà chắc, không mở gợi ý. */
  careful: number
  /** Có mở gợi ý. */
  hinted: number
}

export const EMPTY_COUNTS: NatureCounts = { fast: 0, careful: 0, hinted: 0 }

/**
 * Nhanh là dưới bao nhiêu, mili giây.
 *
 * SÁU giây, và con số này mượn từ thang thưởng tốc độ đã có (`speedMultiplier`:
 * dưới 4 giây là mức cao nhất, dưới 8 giây là mức nhì). Sáu nằm giữa hai mốc
 * ấy - đủ chặt để không phải ai cũng "nhanh", đủ rộng để một em lớp 1 đọc xong
 * đề bốn chữ rồi bấm vẫn được tính là nhanh.
 *
 * Một chỗ duy nhất, vì nếu thang kia đổi thì chỗ này phải đọc lại cùng lúc.
 */
export const FAST_MS = 6_000

/** Một câu vừa trả lời rơi vào nết nào. */
export function tallyOf(answer: { durationMs: number; usedHint: boolean }): keyof NatureCounts {
  if (answer.usedHint) return 'hinted'
  return answer.durationMs < FAST_MS ? 'fast' : 'careful'
}

/** Cộng dồn một trận vào bảng đếm cũ. */
export function addAnswers(
  counts: NatureCounts | undefined,
  answers: Array<{ durationMs: number; usedHint: boolean }>,
): NatureCounts {
  const out: NatureCounts = { ...(counts ?? EMPTY_COUNTS) }
  for (const answer of answers) out[tallyOf(answer)] += 1
  return out
}

/**
 * Bao nhiêu câu thì tính cách mới rõ.
 *
 * Mười hai, tức khoảng một trận rưỡi. Chốt sớm hơn thì tính cách nhảy qua nhảy
 * lại sau mỗi trận, và một thứ đổi liên tục thì không phải tính cách - trẻ sẽ
 * không bao giờ kịp thấy con thú của mình LÀ ai. Mười hai câu đủ để một nết
 * thật lộ ra, và cũng đủ gần để trẻ không phải chờ cả tuần.
 */
export const NATURE_AFTER = 12

/**
 * Tính cách con thú, hoặc `null` khi chưa đủ câu để nói.
 *
 * Hoà thì nghiêng về ĐIỀM TĨNH. Phải chọn một bên, và nếu phải chọn thì chọn
 * cái nết mà trò chơi muốn trẻ mang theo ra khỏi đây - nghĩ kỹ rồi hãy trả lời.
 */
export function natureOf(counts: NatureCounts | undefined): PetNature | null {
  const c = counts ?? EMPTY_COUNTS
  const total = c.fast + c.careful + c.hinted
  if (total < NATURE_AFTER) return null

  if (c.fast > c.careful && c.fast > c.hinted) return 'gan-li'
  if (c.hinted > c.careful && c.hinted > c.fast) return 'ham-hoc'
  return 'diem-tinh'
}

export interface NatureInfo {
  label: string
  emoji: string
  /** Một câu nói cho trẻ biết con thú mình thành ra thế nào, và VÌ SAO. */
  blurb: string
  /** Lợi ích, viết đúng cách trẻ đọc được trên thẻ thú. */
  perk: string
}

export const NATURE_INFO: Record<PetNature, NatureInfo> = {
  'gan-li': {
    label: 'Gan Lì',
    emoji: '⚡',
    blurb: 'Con đọc đề xong là bấm luôn, nên thú của con cũng ra đòn không cần nghĩ.',
    perk: 'Đánh đau hơn 10%',
  },
  'diem-tinh': {
    label: 'Điềm Tĩnh',
    emoji: '🛡️',
    blurb: 'Con nghĩ cho chắc rồi mới trả lời, nên thú của con đứng vững hơn.',
    perk: 'Nhiều máu hơn 10%',
  },
  'ham-hoc': {
    label: 'Ham Học',
    emoji: '📖',
    blurb: 'Con chịu khó mở gợi ý ra xem, nên gợi ý không còn làm thú của con yếu đi.',
    perk: 'Dùng gợi ý không bị giảm sát thương',
  },
}

/** Hệ số máu và sức, theo tính cách. Chưa rõ tính cách thì giữ nguyên. */
export function natureScale(nature: PetNature | null): { hp: number; power: number } {
  if (nature === 'gan-li') return { hp: 1, power: 1.1 }
  if (nature === 'diem-tinh') return { hp: 1.1, power: 1 }
  return { hp: 1, power: 1 }
}

/**
 * Con thú sau khi đã nhiễm tính cách.
 *
 * Đứng TÁCH khỏi `resolvePet` chứ không gộp vào, vì hai thứ trả lời hai câu hỏi
 * khác nhau: `resolvePet` nói "con thú này đã lớn tới đâu" - chuyện của riêng
 * con thú; còn đây nói "nó đã sống với đứa trẻ nào" - chuyện của một mối quan
 * hệ. Gộp lại thì mọi chỗ cần con số gốc (bộ sưu tập, bảng so sánh) sẽ phải gỡ
 * ngược ra.
 */
export function applyNature(pet: Pet, nature: PetNature | null): Pet {
  if (!nature) return pet
  const scale = natureScale(nature)
  return {
    ...pet,
    maxHp: Math.round(pet.maxHp * scale.hp),
    power: Math.round(pet.power * scale.power * 1000) / 1000,
  }
}

/**
 * Gợi ý còn phạt sát thương bao nhiêu. 1 nghĩa là không phạt gì.
 *
 * Con số 0,6 nằm ở `engine/battle.ts` (`HINT_DAMAGE_PENALTY`) và vẫn là mặc
 * định; ở đây chỉ trả lời câu "con thú này có được miễn không".
 */
export function hintPenaltyScale(nature: PetNature | null): number {
  return nature === 'ham-hoc' ? 1 : 0.6
}
