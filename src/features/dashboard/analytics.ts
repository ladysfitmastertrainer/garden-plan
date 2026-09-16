/**
 * Tính toán số liệu cho màn hình phụ huynh và giáo viên.
 *
 * Toàn bộ là hàm thuần, không đọc đồng hồ (thời điểm luôn truyền vào), nên test
 * được và không phụ thuộc UI.
 *
 * Nguyên tắc trình bày: người lớn cần biết CON ĐANG YẾU CHỖ NÀO, không cần một
 * điểm số tổng hợp vô nghĩa. Vì vậy mọi hàm ở đây đều quy về từng kỹ năng cụ
 * thể chứ không gộp thành "điểm trung bình" chung chung.
 */

import { skillsUpToGrade, type Skill } from '../../content/curriculum'
import type { Grade, Subject } from '../../content/types'
import {
  MASTERED_THRESHOLD,
  isDue,
  masteryLevel,
  type MasteryLevel,
  type MasteryMap,
} from '../../engine/mastery'
import type { StoredAttempt } from '../../data/types'

const DAY_MS = 86_400_000

// --- Theo kỹ năng --------------------------------------------------------------

export interface SkillRow {
  skill: Skill
  mastery: number
  level: MasteryLevel
  attempts: number
  correct: number
  /** null khi chưa làm câu nào. */
  accuracy: number | null
  dueAt: number | null
  isDue: boolean
}

export function skillRows(
  mastery: MasteryMap,
  subject: Subject,
  grade: Grade,
  now: number,
): SkillRow[] {
  return skillsUpToGrade(subject, grade).map((skill) => {
    const m = mastery[skill.id]
    return {
      skill,
      mastery: m?.mastery ?? 0,
      level: m ? masteryLevel(m) : 'new',
      attempts: m?.attempts ?? 0,
      correct: m?.correct ?? 0,
      accuracy: m && m.attempts > 0 ? m.correct / m.attempts : null,
      dueAt: m?.dueAt ?? null,
      isDue: m ? isDue(m, now) : false,
    }
  })
}

export interface SubjectStats {
  subject: Subject
  totalSkills: number
  /** Số kỹ năng đã làm ít nhất một câu. */
  startedSkills: number
  masteredSkills: number
  /** Trung bình mức thạo trên các kỹ năng ĐÃ HỌC. 0 khi chưa học gì. */
  averageMastery: number
  dueCount: number
}

export function subjectStats(
  mastery: MasteryMap,
  subject: Subject,
  grade: Grade,
  now: number,
): SubjectStats {
  const rows = skillRows(mastery, subject, grade, now)
  const started = rows.filter((row) => row.attempts > 0)

  return {
    subject,
    totalSkills: rows.length,
    startedSkills: started.length,
    masteredSkills: rows.filter((row) => row.mastery >= MASTERED_THRESHOLD).length,
    // Chỉ tính trên kỹ năng đã học: gộp cả phần chưa học vào sẽ kéo con số
    // xuống rất thấp và làm phụ huynh hiểu nhầm là con học kém.
    averageMastery:
      started.length === 0
        ? 0
        : Math.round(started.reduce((sum, row) => sum + row.mastery, 0) / started.length),
    dueCount: rows.filter((row) => row.isDue).length,
  }
}

/** Số lần làm tối thiểu trước khi dám kết luận một kỹ năng là "yếu". */
const MIN_ATTEMPTS_TO_JUDGE = 2
/** Dưới ngưỡng này mới coi là đang gặp khó. */
const STRUGGLING_ACCURACY = 0.8

/**
 * Những kỹ năng con đang gặp khó - phần quan trọng nhất của màn hình phụ huynh.
 *
 * Điều kiện là TỈ LỆ SAI, không phải điểm mức thạo thấp. Mức thạo của một kỹ
 * năng mới học luôn thấp dù trẻ làm đúng hết, vì nó cần thời gian để lên; liệt
 * kê những kỹ năng đó vào mục "cần luyện thêm" sẽ khiến phụ huynh lo lắng vô cớ
 * và đọc thấy mâu thuẫn kiểu "35% · đúng 100%".
 */
export function weakestSkills(
  mastery: MasteryMap,
  subject: Subject,
  grade: Grade,
  now: number,
  limit = 5,
): SkillRow[] {
  return skillRows(mastery, subject, grade, now)
    .filter(
      (row) =>
        row.attempts >= MIN_ATTEMPTS_TO_JUDGE &&
        row.mastery < MASTERED_THRESHOLD &&
        row.accuracy !== null &&
        row.accuracy < STRUGGLING_ACCURACY,
    )
    // Sai nhiều nhất lên đầu; cùng tỉ lệ sai thì mức thạo thấp hơn lên trước.
    .sort((a, b) => a.accuracy! - b.accuracy! || a.mastery - b.mastery)
    .slice(0, limit)
}

/** Kỹ năng mới bắt đầu, chưa đủ dữ liệu để kết luận gì. */
export function justStartedSkills(
  mastery: MasteryMap,
  subject: Subject,
  grade: Grade,
  now: number,
): SkillRow[] {
  return skillRows(mastery, subject, grade, now).filter(
    (row) => row.attempts > 0 && row.attempts < MIN_ATTEMPTS_TO_JUDGE,
  )
}

/** Kỹ năng con đã thạo - để phụ huynh có cái mà khen. */
export function strongestSkills(
  mastery: MasteryMap,
  subject: Subject,
  grade: Grade,
  now: number,
  limit = 5,
): SkillRow[] {
  return skillRows(mastery, subject, grade, now)
    .filter((row) => row.attempts > 0)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, limit)
}

// --- Theo thời gian -------------------------------------------------------------

export interface DayActivity {
  /** Dạng YYYY-MM-DD theo giờ địa phương. */
  date: string
  attempts: number
  correct: number
  minutes: number
}

/** Khoá ngày theo giờ ĐỊA PHƯƠNG - phụ huynh nghĩ theo ngày của mình, không theo UTC. */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/**
 * Hoạt động từng ngày trong `days` ngày gần nhất, kể cả ngày không học (hiện 0)
 * để biểu đồ không bị bóp méo.
 */
export function dailyActivity(attempts: StoredAttempt[], days: number, now: number): DayActivity[] {
  const buckets = new Map<string, DayActivity>()

  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(now - i * DAY_MS)
    buckets.set(key, { date: key, attempts: 0, correct: 0, minutes: 0 })
  }

  const totalMs = new Map<string, number>()
  for (const attempt of attempts) {
    const key = dayKey(attempt.answeredAt)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.attempts++
    if (attempt.correct) bucket.correct++
    totalMs.set(key, (totalMs.get(key) ?? 0) + attempt.durationMs)
  }

  for (const [key, ms] of totalMs) {
    const bucket = buckets.get(key)
    if (bucket) bucket.minutes = Math.round(ms / 60_000)
  }

  return [...buckets.values()]
}

/**
 * Số ngày học liên tiếp tính tới hôm nay.
 * Học hôm qua mà chưa học hôm nay vẫn được tính - chuỗi chỉ đứt khi bỏ trọn một
 * ngày, để trẻ không mất chuỗi chỉ vì hôm nay chưa kịp học.
 */
export function studyStreakDays(attempts: StoredAttempt[], now: number): number {
  if (attempts.length === 0) return 0

  const studied = new Set(attempts.map((a) => dayKey(a.answeredAt)))
  const today = dayKey(now)
  const yesterday = dayKey(now - DAY_MS)

  if (!studied.has(today) && !studied.has(yesterday)) return 0

  let streak = 0
  let cursor = studied.has(today) ? now : now - DAY_MS
  while (studied.has(dayKey(cursor))) {
    streak++
    cursor -= DAY_MS
  }
  return streak
}

// --- Tổng hợp -------------------------------------------------------------------

/**
 * Thời gian học dạng chữ. "0 phút" khi trẻ vừa làm chục câu thì đọc rất vô lý,
 * nên dưới một phút thì nói thẳng là dưới một phút.
 */
export function formatDuration(totalMs: number): string {
  if (totalMs <= 0) return 'chưa có'
  // So sánh trên mili giây, không trên số phút đã làm tròn: 45 giây làm tròn
  // thành 1 phút thì câu "1 phút" là sai sự thật.
  if (totalMs < 60_000) return 'dưới 1 phút'
  const minutes = Math.round(totalMs / 60_000)
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`
}

export interface AttemptSummary {
  total: number
  correct: number
  accuracy: number
  minutes: number
  /** Tổng thời gian thô, để hiển thị bằng `formatDuration`. */
  totalMs: number
  /** Thời gian trung bình mỗi câu, tính bằng giây. */
  averageSeconds: number
  hintsUsed: number
}

export function summarizeAttempts(attempts: StoredAttempt[]): AttemptSummary {
  if (attempts.length === 0) {
    return { total: 0, correct: 0, accuracy: 0, minutes: 0, totalMs: 0, averageSeconds: 0, hintsUsed: 0 }
  }

  const correct = attempts.filter((a) => a.correct).length
  const totalMs = attempts.reduce((sum, a) => sum + a.durationMs, 0)

  return {
    total: attempts.length,
    correct,
    accuracy: correct / attempts.length,
    minutes: Math.round(totalMs / 60_000),
    totalMs,
    averageSeconds: Math.round(totalMs / attempts.length / 1000),
    hintsUsed: attempts.filter((a) => a.usedHint).length,
  }
}

export function attemptsBySubject(attempts: StoredAttempt[]): Record<Subject, AttemptSummary> {
  const groups: Record<Subject, StoredAttempt[]> = {
    math: [],
    vietnamese: [],
    ethics: [],
    music: [],
  }
  for (const attempt of attempts) groups[attempt.subject]?.push(attempt)

  return {
    math: summarizeAttempts(groups.math),
    vietnamese: summarizeAttempts(groups.vietnamese),
    ethics: summarizeAttempts(groups.ethics),
    music: summarizeAttempts(groups.music),
  }
}

/**
 * Môn Đạo đức CỐ Ý bị loại khỏi thống kê "tỉ lệ đúng".
 * Lựa chọn chưa tốt trong một tình huống đạo đức không phải là "câu sai", và
 * quy nó thành phần trăm sẽ khiến phụ huynh đánh giá sai về con.
 */
export function academicAttempts(attempts: StoredAttempt[]): StoredAttempt[] {
  return attempts.filter((a) => a.subject !== 'ethics')
}
