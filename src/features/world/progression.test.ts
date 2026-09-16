/**
 * Luật mở khoá lớp quyết định trẻ được đi tới đâu. Sai ở đây thì hoặc trẻ bị
 * nhốt trong lớp đã học xong, hoặc nhảy cóc qua cả một lớp - hai lỗi đều chỉ lộ
 * ra sau hàng tuần chơi, nên phải chặn bằng test ngay.
 */

import { describe, expect, it } from 'vitest'
import { SUBJECTS, type Grade } from '../../content/types'
import { totalNodes } from '../../content/worldmap'
import { regionKey } from '../../data/types'
import {
  gradeProgress,
  highestUnlockedGrade,
  regionProgress,
  remainingSubjects,
  unlockedGrades,
} from './progression'

/** Dữ liệu của một trẻ đã đi hết mọi môn của các lớp cho trước. */
function cleared(...grades: Grade[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const grade of grades) {
    for (const subject of SUBJECTS) {
      out[regionKey(subject, grade)] = totalNodes(subject, grade)
    }
  }
  return out
}

describe('tiến độ một vùng', () => {
  it('chưa chơi thì 0 chặng, chưa xong', () => {
    const p = regionProgress({}, 'math', 2)
    expect(p.cleared).toBe(0)
    expect(p.total).toBe(totalNodes('math', 2))
    expect(p.complete).toBe(false)
  })

  it('đi hết thì tính là xong', () => {
    expect(regionProgress(cleared(2), 'math', 2).complete).toBe(true)
  })

  it('node ôn tập đẩy số chặng vượt mức thì vẫn chặn lại ở tổng số chặng thật', () => {
    // Không chặn thì bảng tiến độ hiện "8/7 chặng".
    const total = totalNodes('music', 3)
    const p = regionProgress({ [regionKey('music', 3)]: total + 4 }, 'music', 3)
    expect(p.cleared).toBe(total)
    expect(p.complete).toBe(true)
  })
})

describe('tiến độ một lớp', () => {
  it('đếm theo số MÔN đã đi hết, không phải số chặng', () => {
    const progress = { [regionKey('math', 1)]: totalNodes('math', 1) }
    const p = gradeProgress(progress, 1)
    expect(p.done).toBe(1)
    expect(p.total).toBe(4)
    expect(p.complete).toBe(false)
  })

  it('xong cả bốn môn mới là xong lớp', () => {
    expect(gradeProgress(cleared(3), 3).complete).toBe(true)
  })

  it('thiếu đúng một chặng của một môn thì chưa xong lớp', () => {
    const progress = cleared(2)
    progress[regionKey('ethics', 2)] = totalNodes('ethics', 2) - 1
    expect(gradeProgress(progress, 2).complete).toBe(false)
    expect(remainingSubjects(progress, 2)).toEqual(['ethics'])
  })

  it('kể tên đúng các môn còn thiếu', () => {
    expect(remainingSubjects({}, 4)).toEqual([...SUBJECTS])
    expect(remainingSubjects(cleared(4), 4)).toEqual([])
  })
})

describe('mở khoá lớp', () => {
  it('trẻ mới vào chỉ có đúng lớp của mình', () => {
    expect(highestUnlockedGrade({}, 2)).toBe(2)
    expect(unlockedGrades({}, 2)).toEqual([2])
  })

  it('học hết lớp mình thì mở lớp kế tiếp', () => {
    expect(highestUnlockedGrade(cleared(2), 2)).toBe(3)
    expect(unlockedGrades(cleared(2), 2)).toEqual([2, 3])
  })

  it('học hết nhiều lớp liên tiếp thì mở tiếp nhiều lớp', () => {
    expect(unlockedGrades(cleared(1, 2, 3), 1)).toEqual([1, 2, 3, 4])
  })

  it('KHÔNG nhảy cóc: xong lớp 4 mà chưa xong lớp 3 thì vẫn dừng ở lớp 3', () => {
    // Trường hợp này có thật khi phụ huynh đổi lớp cho con giữa chừng.
    expect(highestUnlockedGrade(cleared(4), 3)).toBe(3)
    expect(unlockedGrades(cleared(4), 3)).toEqual([3])
  })

  it('không bao giờ vượt quá lớp 5', () => {
    expect(highestUnlockedGrade(cleared(1, 2, 3, 4, 5), 1)).toBe(5)
    expect(unlockedGrades(cleared(1, 2, 3, 4, 5), 5)).toEqual([5])
  })

  it('lớp dưới lớp của trẻ KHÔNG hiện ra', () => {
    // Trẻ lớp 3 không có việc gì ở quần đảo lớp 1.
    expect(unlockedGrades(cleared(3), 3)).toEqual([3, 4])
    expect(unlockedGrades(cleared(3), 3)).not.toContain(1)
  })

  it('lớp đã học xong vẫn giữ lại để quay về luyện thêm', () => {
    expect(unlockedGrades(cleared(2, 3), 2)).toContain(2)
  })
})
