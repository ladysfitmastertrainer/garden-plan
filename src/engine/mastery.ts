/**
 * Theo dõi mức thạo từng kỹ năng + lịch ôn tập giãn cách (Leitner 5 hộp).
 *
 * Hai con số song song, phục vụ hai mục đích khác nhau:
 *  - `mastery` (0-100): "trẻ thạo tới đâu" - dùng để chọn độ khó và hiển thị
 *    cho phụ huynh.
 *  - `box` + `dueAt`: "khi nào cần ôn lại" - dùng để chống quên.
 *
 * Toàn bộ hàm ở đây là hàm thuần, không đọc Date.now() - thời điểm luôn được
 * truyền vào để test kiểm soát được.
 */

export type LeitnerBox = 1 | 2 | 3 | 4 | 5

export interface SkillMastery {
  skillId: string
  /** 0-100. */
  mastery: number
  box: LeitnerBox
  /** Epoch ms. Tới hạn khi dueAt <= now. */
  dueAt: number
  attempts: number
  correct: number
  /** Số câu đúng liên tiếp gần nhất của kỹ năng này. */
  streak: number
  lastSeenAt: number
}

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

/** Khoảng cách ôn lại theo hộp. Chỉ số 0 bỏ trống cho khớp box 1-5. */
const BOX_INTERVAL: readonly number[] = [0, 10 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY]

/** Ngưỡng coi là đã thạo - dùng cho mở khoá kỹ năng tiếp theo và huy hiệu. */
export const MASTERED_THRESHOLD = 80
/** Ngưỡng coi là đủ nền để học kỹ năng phụ thuộc. */
export const PREREQUISITE_THRESHOLD = 60

export type MasteryLevel = 'new' | 'learning' | 'practising' | 'mastered'

export const MASTERY_LEVEL_LABEL: Record<MasteryLevel, string> = {
  new: 'Chưa học',
  learning: 'Đang học',
  practising: 'Đang luyện',
  mastered: 'Đã thạo',
}

export function createMastery(skillId: string, now: number): SkillMastery {
  return {
    skillId,
    mastery: 0,
    box: 1,
    dueAt: now,
    attempts: 0,
    correct: 0,
    streak: 0,
    lastSeenAt: 0,
  }
}

export function masteryLevel(m: SkillMastery): MasteryLevel {
  if (m.attempts === 0) return 'new'
  if (m.mastery >= MASTERED_THRESHOLD) return 'mastered'
  if (m.mastery >= 40) return 'practising'
  return 'learning'
}

export function isDue(m: SkillMastery, now: number): boolean {
  return m.attempts > 0 && m.dueAt <= now
}

export interface AttemptOutcome {
  correct: boolean
  /** Độ khó của câu vừa làm (1-3). Câu khó đúng thì tăng nhiều hơn. */
  difficulty: 1 | 2 | 3
  /** Thời gian trả lời, ms. Trả lời nhanh và đúng được thưởng nhẹ. */
  durationMs: number
  /** Trẻ có bấm gợi ý không - có gợi ý thì tăng ít hơn. */
  usedHint?: boolean
}

/**
 * Cập nhật mức thạo sau một lần trả lời.
 *
 * Điểm tăng giảm dần: càng gần 100 càng khó lên, nên trẻ không "đạt 100 rồi
 * bỏ" mà vẫn phải duy trì. Điểm trừ khi sai cố định và nhẹ hơn điểm cộng, để
 * một lần lỡ tay không xoá sạch công sức.
 */
export function applyAttempt(
  prev: SkillMastery,
  outcome: AttemptOutcome,
  now: number,
): SkillMastery {
  const { correct, difficulty, durationMs, usedHint = false } = outcome

  let mastery = prev.mastery
  let box = prev.box
  let streak = prev.streak

  if (correct) {
    // Tăng theo khoảng cách còn lại tới 100 -> tiệm cận, không bao giờ nhảy vọt.
    const headroom = 100 - mastery
    const difficultyFactor = 0.6 + 0.2 * difficulty // 0.8 / 1.0 / 1.2
    const hintFactor = usedHint ? 0.5 : 1
    const fluencyBonus = durationMs > 0 && durationMs < 5_000 ? 1.1 : 1
    const gain = Math.max(3, Math.round(headroom * 0.22 * difficultyFactor * hintFactor * fluencyBonus))
    mastery = Math.min(100, mastery + gain)
    streak = prev.streak + 1
    // Lên hộp khi có 2 câu đúng liên tiếp - tránh lên hộp vì ăn may một câu.
    if (streak >= 2 && box < 5) box = (box + 1) as LeitnerBox
  } else {
    mastery = Math.max(0, mastery - 12)
    streak = 0
    // Lùi một hộp thay vì về hộp 1: với trẻ nhỏ, xoá sạch tiến độ gây nản.
    if (box > 1) box = (box - 1) as LeitnerBox
  }

  return {
    skillId: prev.skillId,
    mastery,
    box,
    dueAt: now + (BOX_INTERVAL[box] ?? BOX_INTERVAL[1]!),
    attempts: prev.attempts + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak,
    lastSeenAt: now,
  }
}

/** Tỉ lệ đúng, trả về null khi chưa có lần làm nào. */
export function accuracy(m: SkillMastery): number | null {
  return m.attempts === 0 ? null : m.correct / m.attempts
}

export type MasteryMap = Record<string, SkillMastery>

export function getOrCreate(map: MasteryMap, skillId: string, now: number): SkillMastery {
  return map[skillId] ?? createMastery(skillId, now)
}

/** Danh sách kỹ năng đến hạn ôn, sắp theo mức quá hạn nhiều nhất trước. */
export function dueSkills(map: MasteryMap, now: number): SkillMastery[] {
  return Object.values(map)
    .filter((m) => isDue(m, now))
    .sort((a, b) => a.dueAt - b.dueAt)
}
