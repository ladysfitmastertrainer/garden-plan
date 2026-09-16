/**
 * Báo cáo tiến độ của một học sinh.
 *
 * Thiết kế theo câu hỏi mà phụ huynh thật sự hỏi: "con đang yếu chỗ nào?" chứ
 * không phải "con được mấy điểm". Vì vậy phần "cần luyện thêm" đứng trên cùng,
 * và mọi con số đều quy về một kỹ năng cụ thể có tên gọi rõ ràng.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  SUBJECTS,
  SUBJECT_LABEL,
  VIRTUE_LABEL,
  type Subject,
  type Virtue,
} from '../../content/types'
import type { StoredAttempt, StudentProfile, StudentProgress } from '../../data/types'
import { MASTERY_LEVEL_LABEL } from '../../engine/mastery'
import { levelFromTotalXp } from '../../engine/rewards'
import { getRepository } from '../../store/game'
import {
  academicAttempts,
  attemptsBySubject,
  dailyActivity,
  skillRows,
  formatDuration,
  justStartedSkills,
  studyStreakDays,
  subjectStats,
  summarizeAttempts,
  weakestSkills,
  type SkillRow,
} from './analytics'

const SUBJECT_COLOR: Record<Subject, string> = {
  math: 'var(--color-math)',
  vietnamese: 'var(--color-vietnamese)',
  music: 'var(--color-music)',
  ethics: 'var(--color-ethics)',
}

export function ProgressReport({
  student,
  progress,
}: {
  student: StudentProfile
  progress: StudentProgress
}) {
  const [attempts, setAttempts] = useState<StoredAttempt[] | null>(null)
  const [subject, setSubject] = useState<Subject>('math')
  const now = Date.now()

  useEffect(() => {
    let alive = true
    void getRepository()
      .listAttempts(student.id, 2000)
      .then((rows) => {
        if (alive) setAttempts(rows)
      })
      .catch(() => {
        if (alive) setAttempts([])
      })
    return () => {
      alive = false
    }
  }, [student.id])

  const academic = useMemo(() => academicAttempts(attempts ?? []), [attempts])
  const overall = useMemo(() => summarizeAttempts(academic), [academic])
  const allTime = useMemo(() => summarizeAttempts(attempts ?? []), [attempts])
  const streak = useMemo(() => studyStreakDays(attempts ?? [], now), [attempts, now])
  const week = useMemo(() => dailyActivity(attempts ?? [], 7, now), [attempts, now])
  const bySubject = useMemo(() => attemptsBySubject(academic), [academic])

  const weak = weakestSkills(progress.mastery, subject, student.grade, now, 5)
  const justStarted = justStartedSkills(progress.mastery, subject, student.grade, now)
  const rows = skillRows(progress.mastery, subject, student.grade, now)
  const stats = subjectStats(progress.mastery, subject, student.grade, now)
  const { level } = levelFromTotalXp(student.totalXp)

  const earnedVirtues = (Object.entries(progress.virtues) as Array<[Virtue, number]>).filter(
    ([, count]) => count > 0,
  )

  return (
    <div className="grid gap-5">
      <div className="card flex flex-wrap items-center gap-4">
        <span className="text-5xl">{student.avatar}</span>
        <div className="flex-1">
          <p className="text-2xl font-extrabold">{student.name}</p>
          <p className="opacity-70">
            Lớp {student.grade} · Cấp {level} · {progress.battlesWon}/{progress.battlesPlayed} trận thắng
          </p>
        </div>
      </div>

      {/* Tổng quan */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Tổng thời gian học" value={formatDuration(allTime.totalMs)} />
        <Stat label="Số câu đã làm" value={String(allTime.total)} />
        <Stat
          label="Trả lời đúng"
          value={overall.total === 0 ? '—' : `${Math.round(overall.accuracy * 100)}%`}
          note="Không tính môn Đạo đức"
        />
        <Stat label="Chuỗi ngày học" value={streak > 0 ? `${streak} ngày 🔥` : 'Chưa có'} />
      </div>

      {attempts === null && <p className="opacity-60">Đang tải dữ liệu...</p>}

      {attempts !== null && attempts.length === 0 && (
        <div className="card text-center">
          <p className="text-lg">Con chưa làm bài nào. Số liệu sẽ xuất hiện sau trận đầu tiên.</p>
        </div>
      )}

      {/* Bảy ngày gần nhất */}
      {attempts !== null && attempts.length > 0 && <WeekChart week={week} />}

      {/* Theo môn */}
      <section className="card grid gap-3">
        <h2 className="text-xl font-extrabold">Theo môn học</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUBJECTS.map((s) => {
            const stat = subjectStats(progress.mastery, s, student.grade, now)
            const attemptStat = bySubject[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className="rounded-2xl border-4 p-3 text-left"
                style={{
                  borderColor: subject === s ? SUBJECT_COLOR[s] : 'transparent',
                  background: 'var(--color-paper-sunk)',
                }}
              >
                <p className="font-extrabold">{SUBJECT_LABEL[s]}</p>
                <p className="text-base opacity-70">
                  Đã học {stat.startedSkills}/{stat.totalSkills} kỹ năng · thạo {stat.masteredSkills}
                </p>
                <p className="text-base opacity-70">
                  {s === 'ethics'
                    ? `${attemptStat.total} tình huống đã xử lý`
                    : `${attemptStat.total} câu · đúng ${
                        attemptStat.total === 0 ? '—' : `${Math.round(attemptStat.accuracy * 100)}%`
                      }`}
                </p>
                {stat.dueCount > 0 && (
                  <p className="text-base font-bold" style={{ color: SUBJECT_COLOR[s] }}>
                    🔁 {stat.dueCount} kỹ năng đến hạn ôn
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Cần luyện thêm - phần quan trọng nhất */}
      <section className="card grid gap-3">
        <h2 className="text-xl font-extrabold">
          Cần luyện thêm · {SUBJECT_LABEL[subject]}
        </h2>
        {weak.length === 0 ? (
          <p className="opacity-70">
            {stats.startedSkills === 0
              ? 'Con chưa học kỹ năng nào ở môn này.'
              : 'Không có kỹ năng nào con đang gặp khó. Rất tốt!'}
          </p>
        ) : (
          <>
            <p className="text-base opacity-70">
              Những kỹ năng con làm sai từ 1/5 số câu trở lên. Kỹ năng mới học mà làm đúng hết thì
              không nằm ở đây, dù điểm mức thạo còn thấp.
            </p>
            <ul className="grid gap-2">
              {weak.map((row) => (
                <SkillBar key={row.skill.id} row={row} color={SUBJECT_COLOR[subject]} />
              ))}
            </ul>
          </>
        )}

        {justStarted.length > 0 && (
          <p className="text-base opacity-70">
            🌱 Mới bắt đầu, chưa đủ dữ liệu để đánh giá:{' '}
            {justStarted.map((row) => row.skill.name).join(', ')}
          </p>
        )}
      </section>

      {/* Toàn bộ kỹ năng của môn đang chọn */}
      <section className="card grid gap-3">
        <h2 className="text-xl font-extrabold">Tất cả kỹ năng · {SUBJECT_LABEL[subject]}</h2>
        <ul className="grid gap-2">
          {rows.map((row) => (
            <SkillBar key={row.skill.id} row={row} color={SUBJECT_COLOR[subject]} showLevel />
          ))}
        </ul>
      </section>

      {/* Phẩm chất - thay cho điểm số môn Đạo đức */}
      <section className="card grid gap-3">
        <h2 className="text-xl font-extrabold">Phẩm chất con đang xây dựng</h2>
        <p className="text-base opacity-70">
          Môn Đạo đức không chấm đúng/sai. Mỗi lần con chọn cách ứng xử tốt trong một tình huống,
          con được ghi nhận một phẩm chất.
        </p>
        {earnedVirtues.length === 0 ? (
          <p className="opacity-70">Chưa có ghi nhận nào. Cùng con chơi vài tình huống Đạo đức nhé.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {earnedVirtues
              .sort((a, b) => b[1] - a[1])
              .map(([virtue, count]) => (
                <span
                  key={virtue}
                  className="rounded-full px-4 py-2 font-bold"
                  style={{ background: 'var(--color-good-soft)', color: 'var(--color-good)' }}
                >
                  {VIRTUE_LABEL[virtue]} × {count}
                </span>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card">
      <p className="text-base opacity-70">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
      {note && <p className="text-sm opacity-50">{note}</p>}
    </div>
  )
}

function SkillBar({
  row,
  color,
  showLevel,
}: {
  row: SkillRow
  color: string
  showLevel?: boolean
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold">{row.skill.name}</span>
        <span className="shrink-0 text-base opacity-70">
          {showLevel && row.attempts === 0
            ? MASTERY_LEVEL_LABEL.new
            : `${row.mastery}%${row.accuracy === null ? '' : ` · đúng ${Math.round(row.accuracy * 100)}%`}`}
        </span>
      </div>
      <div
        className="mt-1 h-3 overflow-hidden rounded-full"
        style={{ background: 'var(--color-paper-sunk)' }}
        role="progressbar"
        aria-valuenow={row.mastery}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Mức thạo ${row.skill.name}`}
      >
        <div className="h-full rounded-full" style={{ background: color, width: `${row.mastery}%` }} />
      </div>
      {row.isDue && (
        <p className="text-sm font-bold" style={{ color }}>
          🔁 Đến hạn ôn lại
        </p>
      )}
    </li>
  )
}

function WeekChart({ week }: { week: ReturnType<typeof dailyActivity> }) {
  const max = Math.max(1, ...week.map((d) => d.attempts))
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  return (
    <section className="card grid gap-3">
      <h2 className="text-xl font-extrabold">Bảy ngày gần nhất</h2>
      <div className="flex justify-between gap-2">
        {week.map((day) => {
          const label = weekdays[new Date(`${day.date}T00:00:00`).getDay()]
          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-sm font-bold opacity-60">{day.attempts || ''}</span>
              {/*
                Cột phải nằm trong một khung CÓ CHIỀU CAO XÁC ĐỊNH. Trước đây
                chiều cao theo % được đặt trên phần tử có cha co theo nội dung
                nên mọi cột đều sập thành một vạch.
              */}
              <div className="flex w-full flex-col justify-end" style={{ height: 110 }}>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${(day.attempts / max) * 100}%`,
                    minHeight: day.attempts > 0 ? 6 : 3,
                    background: day.attempts > 0 ? 'var(--color-brand)' : 'var(--color-paper-sunk)',
                  }}
                  title={`${day.date}: ${day.attempts} câu`}
                />
              </div>
              <span className="text-sm opacity-60">{label}</span>
            </div>
          )
        })}
      </div>
      <p className="text-base opacity-70">
        Tổng {week.reduce((sum, d) => sum + d.attempts, 0)} câu trong 7 ngày qua
      </p>
    </section>
  )
}
