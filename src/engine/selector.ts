/**
 * Chọn câu hỏi kế tiếp - "bộ não" quyết định trẻ gặp gì trong trận đấu.
 *
 * Tỉ lệ trộn mỗi trận:
 *   70% kỹ năng đang học · 20% ôn tập đến hạn · 10% thử thách khó hơn một bậc
 *
 * Vì sao không hỏi tuần tự: trẻ luyện tuần tự sẽ quên bài cũ (đường cong quên
 * Ebbinghaus) và chán vì không bao giờ được thử sức. Ba nhóm trên giải cả hai.
 */

import type { Difficulty, Grade, Question, Subject } from '../content/types'
import { skillsUpToGrade, type Skill } from '../content/curriculum'
import {
  MASTERED_THRESHOLD,
  PREREQUISITE_THRESHOLD,
  getOrCreate,
  isDue,
  type MasteryMap,
} from './mastery'
import type { Rng } from './rng'

export type Bucket = 'learning' | 'review' | 'challenge'

const BUCKET_WEIGHT: Record<Bucket, number> = {
  learning: 70,
  review: 20,
  challenge: 10,
}

/** Thứ tự thay thế khi nhóm bốc trúng đang rỗng. */
const FALLBACK_ORDER: Record<Bucket, Bucket[]> = {
  learning: ['learning', 'review', 'challenge'],
  review: ['review', 'learning', 'challenge'],
  challenge: ['challenge', 'learning', 'review'],
}

export interface QuestionRequest {
  skillId: string
  difficulty: Difficulty
  rng: Rng
  /** Id các câu đã dùng trong trận - tránh hỏi lặp. */
  exclude: ReadonlySet<string>
}

/**
 * Nguồn cấp câu hỏi. Toán và Âm nhạc sinh tự động, Tiếng Việt và Đạo đức lấy
 * từ ngân hàng soạn sẵn - engine không cần biết sự khác biệt đó.
 */
export interface QuestionSource {
  getQuestion(request: QuestionRequest): Question | null
}

export interface SelectionContext {
  subject: Subject
  grade: Grade
  mastery: MasteryMap
  now: number
  rng: Rng
  source: QuestionSource
  /**
   * Ghi đè tỉ lệ trộn mặc định. Node "Ôn tập" trên bản đồ truyền
   * `{ review: 100, learning: 0, challenge: 0 }` để chỉ hỏi bài đến hạn.
   * Nhóm rỗng vẫn được thay thế theo FALLBACK_ORDER nên không bao giờ bí.
   */
  weights?: Partial<Record<Bucket, number>>
  /**
   * Nâng độ khó thêm mấy bậc, tối đa tới bậc 3. Trận trùm truyền 1 vào đây.
   *
   * KHÔNG dùng `weights` thay được: dồn trọng số sang nhóm "thử thách" chỉ có
   * tác dụng khi trẻ đã thạo sẵn vài kỹ năng, mà trẻ mới vào vùng thì nhóm đó
   * rỗng và FALLBACK_ORDER kéo về nhóm "học mới" - trận trùm hoá ra dễ y hệt
   * trận thường. Bậc khó phải được nâng THẲNG, không qua nhóm.
   */
  difficultyBoost?: number
  /**
   * Id những câu trẻ đã gặp ở CÁC TRẬN TRƯỚC - né chúng nếu còn câu khác.
   *
   * `exclude` của từng lượt bốc chỉ nhớ trong một trận, nên đánh xong con quái
   * này sang con quái kia là gặp lại đúng những câu vừa làm: kỹ năng đang học
   * có trọng số cao nhất, mà ngân hàng soạn tay của nó chỉ có vài câu mỗi bậc.
   *
   * Đây là ƯU TIÊN, không phải lệnh cấm - xem `selectQuestions`. Kho cạn thì
   * câu cũ vẫn được hỏi lại, vì một trận thiếu câu còn tệ hơn một câu lặp.
   */
  recent?: ReadonlySet<string>
}

export interface Selection {
  skill: Skill
  difficulty: Difficulty
  bucket: Bucket
  question: Question
}

/**
 * Số kỹ năng tối thiểu luôn phải sẵn sàng.
 *
 * Cổng tiên quyết được thiết kế để THU HẸP lựa chọn, không phải để bỏ đói. Một
 * học sinh lớp 1 mới vào môn Tiếng Việt chỉ có đúng một kỹ năng không tiên
 * quyết, nên nếu chỉ dựa vào cổng khoá thì cả trận đấu chỉ quanh quẩn vài câu.
 * Khi số kỹ năng mở khoá ít hơn ngưỡng này, ta mở thêm theo đúng thứ tự chương
 * trình cho đủ.
 */
const MIN_AVAILABLE_SKILLS = 3

/**
 * Kỹ năng đã mở khoá chưa.
 * Kỹ năng tiên quyết ở lớp DƯỚI lớp hiện tại được mặc định là đã học ở trường,
 * nếu không một học sinh lớp 5 mới vào game sẽ bị chặn hết nội dung lớp 5.
 */
export function isUnlocked(skill: Skill, mastery: MasteryMap, grade: Grade): boolean {
  return skill.prerequisites.every((prereqId) => {
    const prereqGrade = parseGradeFromId(prereqId)
    if (prereqGrade !== null && prereqGrade < grade) return true
    return (mastery[prereqId]?.mastery ?? 0) >= PREREQUISITE_THRESHOLD
  })
}

function parseGradeFromId(skillId: string): Grade | null {
  const match = /\.g([1-5])\./.exec(skillId)
  return match ? (Number(match[1]) as Grade) : null
}

export function bucketOf(skill: Skill, mastery: MasteryMap, now: number): Bucket {
  const m = mastery[skill.id]
  if (m && isDue(m, now)) return 'review'
  if ((m?.mastery ?? 0) >= MASTERED_THRESHOLD) return 'challenge'
  return 'learning'
}

/** Độ khó phù hợp với mức thạo hiện tại. */
export function difficultyFor(masteryScore: number, bucket: Bucket): Difficulty {
  let d: Difficulty = masteryScore < 40 ? 1 : masteryScore < 75 ? 2 : 3
  // Nhóm thử thách nâng thêm một bậc - đây là chỗ trẻ đã thạo được thử sức.
  if (bucket === 'challenge') d = Math.min(3, d + 1) as Difficulty
  return d
}

/** Trọng số chọn trong cùng một nhóm: ưu tiên chỗ yếu nhất / quá hạn lâu nhất. */
function skillWeight(skill: Skill, bucket: Bucket, mastery: MasteryMap, now: number): number {
  const m = mastery[skill.id]
  switch (bucket) {
    case 'review': {
      const overdueDays = m ? (now - m.dueAt) / 86_400_000 : 0
      return 1 + Math.max(0, overdueDays)
    }
    case 'learning':
      // Kỹ năng chưa học bao giờ được ưu tiên vừa phải, không áp đảo.
      return m ? 110 - m.mastery : 60
    case 'challenge':
      return 1
  }
}

/** Chọn một kỹ năng + độ khó, chưa lấy câu hỏi. */
/**
 * Danh sách kỹ năng được phép phục vụ: ưu tiên kỹ năng đã mở khoá, và nếu chưa
 * đủ `MIN_AVAILABLE_SKILLS` thì mở thêm theo thứ tự chương trình.
 */
export function availableSkills(ctx: SelectionContext): Skill[] {
  const all = skillsUpToGrade(ctx.subject, ctx.grade)
  const unlocked = all.filter((s) => isUnlocked(s, ctx.mastery, ctx.grade))
  if (unlocked.length >= MIN_AVAILABLE_SKILLS) return unlocked

  const unlockedIds = new Set(unlocked.map((s) => s.id))
  const extras = all
    .filter((s) => !unlockedIds.has(s.id))
    .slice(0, MIN_AVAILABLE_SKILLS - unlocked.length)
  return [...unlocked, ...extras]
}

export function selectSkill(
  ctx: SelectionContext,
  excludeSkillIds: ReadonlySet<string> = new Set(),
): { skill: Skill; difficulty: Difficulty; bucket: Bucket } | null {
  const candidates = availableSkills(ctx).filter((s) => !excludeSkillIds.has(s.id))
  if (candidates.length === 0) return null

  const byBucket: Record<Bucket, Skill[]> = { learning: [], review: [], challenge: [] }
  for (const skill of candidates) byBucket[bucketOf(skill, ctx.mastery, ctx.now)].push(skill)

  const drawn = ctx.rng.weighted(
    (Object.keys(BUCKET_WEIGHT) as Bucket[]).map(
      (b) => [b, ctx.weights?.[b] ?? BUCKET_WEIGHT[b]] as const,
    ),
  )
  const bucket = FALLBACK_ORDER[drawn].find((b) => byBucket[b].length > 0)
  if (!bucket) return null

  const pool = byBucket[bucket]
  const skill = ctx.rng.weighted(
    pool.map((s) => [s, skillWeight(s, bucket, ctx.mastery, ctx.now)] as const),
  )
  const score = getOrCreate(ctx.mastery, skill.id, ctx.now).mastery
  const difficulty = Math.min(
    3,
    difficultyFor(score, bucket) + Math.max(0, ctx.difficultyBoost ?? 0),
  ) as Difficulty
  return { skill, difficulty, bucket }
}

/**
 * Thứ tự thử độ khó khi mức mong muốn đã cạn câu.
 * Ưu tiên hạ xuống trước rồi mới nâng lên: thà cho trẻ một câu dễ hơn còn hơn
 * ném cho trẻ một câu quá sức.
 */
function difficultyFallbacks(preferred: Difficulty, preferHarder = false): Difficulty[] {
  const order: Difficulty[] = [preferred]
  // Trận trùm đảo chiều ưu tiên: hết câu ở bậc mong muốn thì tìm LÊN trước.
  // Giữ nguyên chiều xuống là con trùm lặng lẽ tụt về độ khó thường.
  for (const offset of preferHarder ? [1, -1, 2, -2] : [-1, 1, -2, 2]) {
    const candidate = preferred + offset
    if (candidate >= 1 && candidate <= 3) order.push(candidate as Difficulty)
  }
  return order
}

/**
 * Chọn trọn một câu hỏi. Thử tối đa `maxTries` kỹ năng khác nhau phòng khi
 * nguồn đã hết câu cho kỹ năng bốc trúng (ngân hàng soạn tay có giới hạn).
 */
export function selectQuestion(
  ctx: SelectionContext,
  exclude: ReadonlySet<string> = new Set(),
  maxTries = 8,
): Selection | null {
  const triedSkills = new Set<string>()

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const picked = selectSkill(ctx, triedSkills)
    if (!picked) return null
    triedSkills.add(picked.skill.id)

    for (const difficulty of difficultyFallbacks(
      picked.difficulty,
      (ctx.difficultyBoost ?? 0) > 0,
    )) {
      const question = ctx.source.getQuestion({
        skillId: picked.skill.id,
        difficulty,
        rng: ctx.rng,
        exclude,
      })
      if (question) return { ...picked, difficulty, question }
    }
  }
  return null
}

/** Chọn sẵn danh sách câu cho cả trận, không trùng câu và hạn chế trùng kỹ năng. */
export function selectQuestions(ctx: SelectionContext, count: number): Selection[] {
  const selections: Selection[] = []
  const usedQuestionIds = new Set<string>()

  const recent = ctx.recent ?? new Set<string>()

  for (let i = 0; i < count; i++) {
    /*
      Hai lượt bốc: trước hết né cả câu đã gặp ở trận trước, và chỉ khi không
      còn câu nào như thế mới chịu hỏi lại câu cũ.

      Lượt đầu cũng tự rải sang kỹ năng khác: `selectQuestion` thử tối đa tám
      kỹ năng, nên kỹ năng đang học mà hết câu mới thì nó chuyển sang ôn một kỹ
      năng khác - thay vì hỏi lại đúng câu của con quái vừa rồi.
    */
    const fresh =
      recent.size > 0 ? selectQuestion(ctx, new Set([...usedQuestionIds, ...recent])) : null
    const selection = fresh ?? selectQuestion(ctx, usedQuestionIds)
    if (!selection) break
    usedQuestionIds.add(selection.question.id)
    selections.push(selection)
  }
  return selections
}
