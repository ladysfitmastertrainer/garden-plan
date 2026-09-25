/**
 * Nơi engine lấy câu hỏi.
 *
 * Gộp BA nguồn về sau một cửa duy nhất:
 *  - TỰ SOẠN (`custom.ts`): câu thầy cô tự viết ở trang quản trị.
 *  - GENERATOR (Toán, Âm nhạc): sinh câu mới mỗi lần gọi, không bao giờ cạn.
 *  - NGÂN HÀNG (Tiếng Việt, Đạo đức): câu soạn tay trong mã, số lượng có hạn.
 *
 * Thứ tự ưu tiên đúng như trên. Ai đã bỏ công viết một câu cho lớp mình thì câu
 * đó phải được hỏi, không phải nằm chờ may rủi lẫn giữa mấy chục câu khác. Hỏi
 * hết rồi mới rơi xuống nguồn dưới, nên trận đấu không bao giờ tắc vì hết câu.
 *
 * `selector.ts` chỉ thấy interface `QuestionSource` nên không cần biết kỹ năng
 * đang hỏi thuộc loại nào.
 */

import type { QuestionRequest, QuestionSource } from '../engine/selector'
import type { Rng } from '../engine/rng'
import { bankToQuestion, type Bank, type BankEntry } from './bank'
import { customQuestions, isHidden } from './custom'
import { getSkill, requireSkill, type Skill } from './curriculum'
import type { Generator, GeneratorMap } from './factory'
import { mathGenerators } from './math'
import { musicGenerators } from './music'
import ethicsG1G3 from './ethics/g1-g3'
import ethicsG2 from './ethics/g2'
import ethicsG4G5 from './ethics/g4-g5'
import ethicsExtraG1G2 from './ethics/extra-g1-g2'
import ethicsExtraG3G5 from './ethics/extra-g3-g5'
import ethicsExtraG1B from './ethics/extra-g1-b'
import ethicsExtraG1C from './ethics/extra-g1-c'
import vietnameseG1G3 from './vietnamese/g1-g3'
import vietnameseG2 from './vietnamese/g2'
import vietnameseG4G5 from './vietnamese/g4-g5'
import vietnameseExtraG1 from './vietnamese/extra-g1'
import vietnameseExtraG1B from './vietnamese/extra-g1-b'
import type { Difficulty, Question } from './types'

export const GENERATORS: GeneratorMap = {
  ...mathGenerators,
  ...musicGenerators,
}

/**
 * Gộp nhiều ngân hàng, NỐI câu của cùng một kỹ năng lại với nhau.
 *
 * Không dùng phép trải `{ ...a, ...b }`: hai file cùng khai một kỹ năng thì file
 * sau ĐÈ MẤT toàn bộ câu của file trước, và không có gì báo lỗi - số câu của kỹ
 * năng ấy lặng lẽ tụt về chỉ còn phần bổ sung.
 */
export function mergeBanks(...banks: Bank[]): Bank {
  const out: Bank = {}
  for (const bank of banks) {
    for (const [skillId, entries] of Object.entries(bank)) {
      out[skillId] = [...(out[skillId] ?? []), ...entries]
    }
  }
  return out
}

export const BANKS: Bank = mergeBanks(
  vietnameseG1G3,
  vietnameseG2,
  vietnameseG4G5,
  vietnameseExtraG1,
  vietnameseExtraG1B,
  ethicsG1G3,
  ethicsG2,
  ethicsG4G5,
  // Tình huống bổ sung - xem đầu mỗi file vì sao có chúng.
  ethicsExtraG1G2,
  ethicsExtraG3G5,
  ethicsExtraG1B,
  ethicsExtraG1C,
)

/**
 * Số lần thử lại khi generator sinh trúng câu đã hỏi trong trận.
 * Generator ngẫu nhiên nên thử lại vài lần gần như chắc chắn ra câu khác.
 */
const GENERATOR_RETRIES = 12

export const contentSource: QuestionSource = {
  getQuestion({ skillId, difficulty, rng, exclude }: QuestionRequest): Question | null {
    const skill = getSkill(skillId)
    if (!skill) return null

    const mine = customQuestions(skillId)
    if (mine.length > 0) {
      const picked = fromBank(skill, mine, difficulty, rng, exclude)
      if (picked) return picked
    }

    const generator = GENERATORS[skillId]
    if (generator) return fromGenerator(skill, generator, difficulty, rng, exclude)

    const entries = visibleBank(skillId)
    if (entries) return fromBank(skill, entries, difficulty, rng, exclude)

    return null
  },
}

/**
 * Ngân hàng gốc sau khi bỏ những câu bị ẩn ở trang quản trị.
 *
 * Trả `null` khi kỹ năng vốn không có ngân hàng, nhưng trả MẢNG RỖNG khi có mà
 * bị ẩn hết - hai chuyện khác nhau, và chỗ gọi cần phân biệt được.
 */
function visibleBank(skillId: string): BankEntry[] | null {
  const entries = BANKS[skillId]
  if (!entries) return null
  return entries.filter((entry) => !isHidden(skillId, entry.prompt))
}

function fromGenerator(
  skill: Skill,
  generator: Generator,
  difficulty: Difficulty,
  rng: Rng,
  exclude: ReadonlySet<string>,
): Question | null {
  for (let attempt = 0; attempt < GENERATOR_RETRIES; attempt++) {
    const question = generator(skill, difficulty, rng)
    if (question && !exclude.has(question.id)) return question
  }
  return null
}

function fromBank(
  skill: Skill,
  entries: BankEntry[],
  difficulty: Difficulty,
  rng: Rng,
  exclude: ReadonlySet<string>,
): Question | null {
  const candidates = entries
    .filter((e) => e.difficulty === difficulty)
    .map((entry) => bankToQuestion(skill, entry, rng))
    .filter((q) => !exclude.has(q.id))

  return candidates.length > 0 ? rng.pick(candidates) : null
}

// --- Tiện ích cho script kiểm tra nội dung và màn hình quản lí ---------------

export function hasContent(skillId: string): boolean {
  return skillId in GENERATORS || skillId in BANKS || customQuestions(skillId).length > 0
}

export type ContentKind = 'generator' | 'bank' | 'none'

export function contentKind(skillId: string): ContentKind {
  if (skillId in GENERATORS) return 'generator'
  if (skillId in BANKS) return 'bank'
  if (customQuestions(skillId).length > 0) return 'bank'
  return 'none'
}

/**
 * Sinh thử một mẫu câu hỏi cho một kỹ năng ở một độ khó.
 * Dùng trong `scripts/validate-content.ts` và màn hình xem trước nội dung.
 */
export function sampleQuestion(
  skillId: string,
  difficulty: Difficulty,
  rng: Rng,
): Question | null {
  const skill = requireSkill(skillId)

  const mine = customQuestions(skillId).filter((e) => e.difficulty === difficulty)
  if (mine.length > 0) return bankToQuestion(skill, rng.pick(mine), rng)

  const generator = GENERATORS[skillId]
  if (generator) return generator(skill, difficulty, rng)

  const entries = (visibleBank(skillId) ?? []).filter((e) => e.difficulty === difficulty)
  return entries.length > 0 ? bankToQuestion(skill, rng.pick(entries), rng) : null
}

/** Số câu soạn tay của một kỹ năng, kể cả câu tự soạn. Generator là Infinity. */
export function contentCount(skillId: string): number {
  if (skillId in GENERATORS) return Number.POSITIVE_INFINITY
  return (visibleBank(skillId)?.length ?? 0) + customQuestions(skillId).length
}
