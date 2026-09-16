import { describe, expect, it } from 'vitest'
import { skillsFor } from '../../content/curriculum'
import type { StoredAttempt } from '../../data/types'
import { applyAttempt, createMastery, type MasteryMap } from '../../engine/mastery'
import {
  academicAttempts,
  attemptsBySubject,
  dailyActivity,
  dayKey,
  formatDuration,
  justStartedSkills,
  skillRows,
  strongestSkills,
  studyStreakDays,
  subjectStats,
  summarizeAttempts,
  weakestSkills,
} from './analytics'

const NOW = new Date('2026-03-15T10:00:00').getTime()
const DAY = 86_400_000

const attempt = (patch: Partial<StoredAttempt> = {}): StoredAttempt => ({
  studentId: 's1',
  questionId: 'q',
  skillId: 'math.g1.dem-100',
  subject: 'math',
  difficulty: 1,
  correct: true,
  durationMs: 6_000,
  usedHint: false,
  answeredAt: NOW,
  ...patch,
})

/** Luyện một kỹ năng tới xấp xỉ mức thạo mong muốn. */
function trained(skillId: string, target: number, wrongTimes = 0): MasteryMap {
  let m = createMastery(skillId, NOW)
  let guard = 0
  while (m.mastery < target && guard++ < 100) {
    m = applyAttempt(m, { correct: true, difficulty: 2, durationMs: 5_000 }, NOW)
  }
  for (let i = 0; i < wrongTimes; i++) {
    m = applyAttempt(m, { correct: false, difficulty: 2, durationMs: 9_000 }, NOW)
  }
  return { [skillId]: m }
}

describe('skillRows', () => {
  it('liệt kê đủ kỹ năng của lớp hiện tại và các lớp dưới', () => {
    const rows = skillRows({}, 'math', 2, NOW)
    const ids = rows.map((r) => r.skill.id)
    expect(ids).toContain('math.g1.dem-100')
    expect(ids).toContain('math.g2.nhan-2-5')
    expect(ids).not.toContain('math.g3.chu-vi')
  })

  it('kỹ năng chưa học hiện là "Chưa học" với mức thạo 0, không phải điểm kém', () => {
    const row = skillRows({}, 'math', 1, NOW)[0]!
    expect(row.level).toBe('new')
    expect(row.mastery).toBe(0)
    expect(row.accuracy).toBeNull()
  })

  it('tỉ lệ đúng tính trên số lần đã làm', () => {
    const mastery = trained('math.g1.dem-100', 50, 2)
    const row = skillRows(mastery, 'math', 1, NOW).find((r) => r.skill.id === 'math.g1.dem-100')!
    expect(row.accuracy).toBeCloseTo(row.correct / row.attempts)
    expect(row.attempts).toBeGreaterThan(0)
  })
})

describe('subjectStats', () => {
  it('môn chưa học gì thì mọi con số đều bằng 0, không chia cho 0', () => {
    const stats = subjectStats({}, 'math', 1, NOW)
    expect(stats.startedSkills).toBe(0)
    expect(stats.averageMastery).toBe(0)
    expect(stats.masteredSkills).toBe(0)
    expect(Number.isNaN(stats.averageMastery)).toBe(false)
  })

  it('đếm đúng tổng số kỹ năng của môn', () => {
    const stats = subjectStats({}, 'math', 1, NOW)
    expect(stats.totalSkills).toBe(skillsFor('math', 1).length)
  })

  it('mức thạo trung bình CHỈ tính trên kỹ năng đã học', () => {
    // Học tốt đúng một kỹ năng, còn lại bỏ trống.
    const mastery = trained('math.g1.dem-100', 90)
    const stats = subjectStats(mastery, 'math', 1, NOW)
    expect(stats.startedSkills).toBe(1)
    // Nếu gộp cả phần chưa học thì con số sẽ tụt xuống quanh 15 và gây hiểu nhầm.
    expect(stats.averageMastery).toBeGreaterThan(80)
  })

  it('đếm được kỹ năng đã thạo', () => {
    const mastery = trained('math.g1.dem-100', 85)
    expect(subjectStats(mastery, 'math', 1, NOW).masteredSkills).toBe(1)
  })

  it('đếm được kỹ năng đến hạn ôn', () => {
    const mastery = trained('math.g1.dem-100', 50)
    mastery['math.g1.dem-100']!.dueAt = NOW - DAY
    expect(subjectStats(mastery, 'math', 1, NOW).dueCount).toBe(1)
  })
})

/** Làm `total` câu, trong đó sai `wrong` câu. */
function withRecord(skillId: string, total: number, wrong: number): MasteryMap {
  let m = createMastery(skillId, NOW)
  for (let i = 0; i < total; i++) {
    m = applyAttempt(m, { correct: i >= wrong, difficulty: 2, durationMs: 6_000 }, NOW)
  }
  return { [skillId]: m }
}

describe('weakestSkills', () => {
  it('xếp kỹ năng sai nhiều nhất lên đầu', () => {
    const mastery: MasteryMap = {
      ...withRecord('math.g1.dem-100', 10, 3), // đúng 70%
      ...withRecord('math.g1.cong-tru-10', 10, 8), // đúng 20%
      ...withRecord('math.g1.hinh-phang', 10, 5), // đúng 50%
    }
    expect(weakestSkills(mastery, 'math', 1, NOW)[0]!.skill.id).toBe('math.g1.cong-tru-10')
  })

  it('KHÔNG coi kỹ năng mới học mà làm đúng hết là kỹ năng yếu', () => {
    // Đây là lỗi trình bày thật đã gặp: mức thạo còn 35% nhưng đúng 100%, mà
    // vẫn bị xếp vào "cần luyện thêm" khiến phụ huynh hiểu nhầm.
    const mastery = withRecord('math.g1.dem-100', 3, 0)
    expect(mastery['math.g1.dem-100']!.mastery).toBeLessThan(80)
    expect(weakestSkills(mastery, 'math', 1, NOW)).toHaveLength(0)
  })

  it('chưa làm đủ 2 câu thì chưa kết luận là yếu', () => {
    const mastery = withRecord('math.g1.dem-100', 1, 1)
    expect(weakestSkills(mastery, 'math', 1, NOW)).toHaveLength(0)
  })

  it('KHÔNG coi kỹ năng chưa học là kỹ năng yếu', () => {
    expect(weakestSkills({}, 'math', 1, NOW)).toHaveLength(0)
  })

  it('bỏ qua kỹ năng đã thạo', () => {
    const mastery = trained('math.g1.dem-100', 90)
    expect(weakestSkills(mastery, 'math', 1, NOW)).toHaveLength(0)
  })

  it('giới hạn được số dòng trả về', () => {
    const mastery: MasteryMap = {
      ...withRecord('math.g1.dem-100', 10, 6),
      ...withRecord('math.g1.cong-tru-10', 10, 7),
      ...withRecord('math.g1.hinh-phang', 10, 8),
    }
    expect(weakestSkills(mastery, 'math', 1, NOW, 2)).toHaveLength(2)
  })
})

describe('justStartedSkills', () => {
  it('gom những kỹ năng mới làm một câu', () => {
    const mastery = withRecord('math.g1.dem-100', 1, 0)
    const started = justStartedSkills(mastery, 'math', 1, NOW)
    expect(started.map((r) => r.skill.id)).toEqual(['math.g1.dem-100'])
  })

  it('làm đủ nhiều rồi thì không còn là "mới bắt đầu"', () => {
    const mastery = withRecord('math.g1.dem-100', 5, 0)
    expect(justStartedSkills(mastery, 'math', 1, NOW)).toHaveLength(0)
  })
})

describe('formatDuration', () => {
  it('vài chục giây không hiện thành "0 phút"', () => {
    expect(formatDuration(45_000)).toBe('dưới 1 phút')
  })

  it('chưa học gì thì nói rõ là chưa có', () => {
    expect(formatDuration(0)).toBe('chưa có')
  })

  it('hiển thị phút và giờ đúng', () => {
    expect(formatDuration(5 * 60_000)).toBe('5 phút')
    expect(formatDuration(90 * 60_000)).toBe('1 giờ 30 phút')
    expect(formatDuration(120 * 60_000)).toBe('2 giờ')
  })
})

describe('strongestSkills', () => {
  it('xếp kỹ năng tốt nhất lên đầu', () => {
    const mastery: MasteryMap = {
      ...trained('math.g1.dem-100', 30),
      ...trained('math.g1.cong-tru-10', 90),
    }
    expect(strongestSkills(mastery, 'math', 1, NOW)[0]!.skill.id).toBe('math.g1.cong-tru-10')
  })
})

describe('dailyActivity', () => {
  it('trả về đủ số ngày yêu cầu, kể cả ngày không học', () => {
    const days = dailyActivity([attempt()], 7, NOW)
    expect(days).toHaveLength(7)
    expect(days.every((d) => typeof d.date === 'string')).toBe(true)
  })

  it('ngày cuối cùng là hôm nay', () => {
    const days = dailyActivity([], 7, NOW)
    expect(days[days.length - 1]!.date).toBe(dayKey(NOW))
  })

  it('gom đúng số câu và số câu đúng theo ngày', () => {
    const days = dailyActivity(
      [
        attempt({ correct: true }),
        attempt({ correct: false }),
        attempt({ correct: true, answeredAt: NOW - DAY }),
      ],
      7,
      NOW,
    )
    const today = days[days.length - 1]!
    const yesterday = days[days.length - 2]!
    expect(today.attempts).toBe(2)
    expect(today.correct).toBe(1)
    expect(yesterday.attempts).toBe(1)
  })

  it('bỏ qua dữ liệu cũ hơn khoảng thời gian đang xem', () => {
    const days = dailyActivity([attempt({ answeredAt: NOW - 30 * DAY })], 7, NOW)
    expect(days.reduce((sum, d) => sum + d.attempts, 0)).toBe(0)
  })

  it('quy đổi thời gian làm bài ra phút', () => {
    const days = dailyActivity(
      Array.from({ length: 10 }, () => attempt({ durationMs: 30_000 })),
      7,
      NOW,
    )
    expect(days[days.length - 1]!.minutes).toBe(5)
  })
})

describe('studyStreakDays', () => {
  it('chưa học ngày nào thì chuỗi bằng 0', () => {
    expect(studyStreakDays([], NOW)).toBe(0)
  })

  it('học liên tiếp ba ngày tính tới hôm nay thì chuỗi là 3', () => {
    const attempts = [0, 1, 2].map((i) => attempt({ answeredAt: NOW - i * DAY }))
    expect(studyStreakDays(attempts, NOW)).toBe(3)
  })

  it('hôm nay chưa học nhưng hôm qua có thì chuỗi vẫn giữ', () => {
    const attempts = [1, 2].map((i) => attempt({ answeredAt: NOW - i * DAY }))
    expect(studyStreakDays(attempts, NOW)).toBe(2)
  })

  it('bỏ trọn một ngày thì chuỗi đứt', () => {
    const attempts = [3, 4, 5].map((i) => attempt({ answeredAt: NOW - i * DAY }))
    expect(studyStreakDays(attempts, NOW)).toBe(0)
  })

  it('học nhiều lần trong một ngày vẫn chỉ tính một ngày', () => {
    const attempts = [attempt(), attempt(), attempt()]
    expect(studyStreakDays(attempts, NOW)).toBe(1)
  })
})

describe('summarizeAttempts', () => {
  it('không có dữ liệu thì trả về 0 chứ không phải NaN', () => {
    const summary = summarizeAttempts([])
    expect(summary.accuracy).toBe(0)
    expect(summary.averageSeconds).toBe(0)
    expect(Number.isNaN(summary.accuracy)).toBe(false)
  })

  it('tính đúng tỉ lệ đúng và thời gian trung bình', () => {
    const summary = summarizeAttempts([
      attempt({ correct: true, durationMs: 4_000 }),
      attempt({ correct: false, durationMs: 8_000 }),
    ])
    expect(summary.total).toBe(2)
    expect(summary.correct).toBe(1)
    expect(summary.accuracy).toBe(0.5)
    expect(summary.averageSeconds).toBe(6)
  })

  it('đếm số lần dùng gợi ý', () => {
    const summary = summarizeAttempts([attempt({ usedHint: true }), attempt()])
    expect(summary.hintsUsed).toBe(1)
  })
})

describe('attemptsBySubject', () => {
  it('tách đúng theo môn', () => {
    const byS = attemptsBySubject([
      attempt({ subject: 'math' }),
      attempt({ subject: 'math' }),
      attempt({ subject: 'music' }),
    ])
    expect(byS.math.total).toBe(2)
    expect(byS.music.total).toBe(1)
    expect(byS.vietnamese.total).toBe(0)
  })

  it('môn không có dữ liệu vẫn có mục, giá trị 0', () => {
    const byS = attemptsBySubject([])
    expect(byS.ethics.accuracy).toBe(0)
  })
})

describe('academicAttempts', () => {
  it('LOẠI môn Đạo đức khỏi thống kê tỉ lệ đúng', () => {
    const filtered = academicAttempts([
      attempt({ subject: 'math' }),
      attempt({ subject: 'ethics', correct: false }),
    ])
    expect(filtered).toHaveLength(1)
    expect(filtered[0]!.subject).toBe('math')
  })

  it('giữ nguyên ba môn còn lại', () => {
    const filtered = academicAttempts([
      attempt({ subject: 'math' }),
      attempt({ subject: 'vietnamese' }),
      attempt({ subject: 'music' }),
    ])
    expect(filtered).toHaveLength(3)
  })
})
