/**
 * Luật đi từ lớp này sang lớp sau.
 *
 * Mỗi lớp là MỘT quần đảo riêng, gồm đúng bốn vùng đất - bốn môn học của lớp
 * đó. Trẻ lớp 2 mở app ra chỉ thấy quần đảo lớp 2; học xong cả bốn vùng thì cây
 * cầu sang quần đảo lớp 3 mới hiện ra.
 *
 * KHÔNG lưu thêm trạng thái nào: lớp đã mở suy ra được từ `clearedNodes` vốn đã
 * có. Thêm một cột "lớp cao nhất đã mở" vào dữ liệu là tự tạo ra hai nguồn chân
 * lý có thể lệch nhau, và lệch rồi thì trẻ mất map đang chơi dở.
 *
 * Hàm thuần, không đụng React.
 */

import { totalNodes } from '../../content/worldmap'
import { GRADES, SUBJECTS, type Grade, type Subject } from '../../content/types'
import { regionKey } from '../../data/types'

export const FIRST_GRADE: Grade = 1
export const LAST_GRADE: Grade = 5

export interface RegionProgress {
  cleared: number
  total: number
  complete: boolean
}

/**
 * Tiến độ một vùng. `cleared` bị chặn trên bởi `total` vì node ôn tập có thể
 * đẩy số chặng đã qua vượt quá số chặng thật.
 */
export function regionProgress(
  clearedByRegion: Record<string, number>,
  subject: Subject,
  grade: Grade,
): RegionProgress {
  const total = totalNodes(subject, grade)
  const cleared = Math.min(clearedByRegion[regionKey(subject, grade)] ?? 0, total)
  return { cleared, total, complete: cleared >= total }
}

export interface GradeProgress {
  /** Số môn đã đi hết. */
  done: number
  /** Luôn là 4 - bốn môn. */
  total: number
  complete: boolean
}

export function gradeProgress(
  clearedByRegion: Record<string, number>,
  grade: Grade,
): GradeProgress {
  const done = SUBJECTS.filter(
    (subject) => regionProgress(clearedByRegion, subject, grade).complete,
  ).length
  return { done, total: SUBJECTS.length, complete: done === SUBJECTS.length }
}

/** Còn những môn nào chưa đi hết ở lớp này. */
export function remainingSubjects(
  clearedByRegion: Record<string, number>,
  grade: Grade,
): Subject[] {
  return SUBJECTS.filter((subject) => !regionProgress(clearedByRegion, subject, grade).complete)
}

/**
 * Lớp cao nhất trẻ được vào.
 *
 * Đi lên từng bậc một và DỪNG ở lớp đầu tiên chưa học hết - không nhảy cóc. Nếu
 * cho phép nhảy cóc thì một đứa trẻ lỡ tay hoàn thành lớp 4 sẽ mở luôn lớp 5 mà
 * bỏ trống lớp 3, đúng thứ trình tự chương trình sinh ra để ngăn.
 */
export function highestUnlockedGrade(
  clearedByRegion: Record<string, number>,
  startGrade: Grade,
): Grade {
  let grade = startGrade
  while (grade < LAST_GRADE && gradeProgress(clearedByRegion, grade).complete) {
    grade = (grade + 1) as Grade
  }
  return grade
}

/**
 * Các lớp trẻ được xem, theo thứ tự.
 *
 * Bắt đầu từ LỚP CỦA TRẺ chứ không phải lớp 1: trẻ lớp 2 không có việc gì ở
 * quần đảo lớp 1, và bày ra đó chỉ làm bản đồ rối thêm. Lớp đã học xong vẫn giữ
 * lại để quay về luyện thêm.
 */
export function unlockedGrades(
  clearedByRegion: Record<string, number>,
  startGrade: Grade,
): Grade[] {
  const highest = highestUnlockedGrade(clearedByRegion, startGrade)
  return GRADES.filter((grade) => grade >= startGrade && grade <= highest)
}
