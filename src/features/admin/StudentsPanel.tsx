/**
 * Danh sách trẻ trên máy này: tiến độ từng vùng, đổi lớp, đặt lại, xoá.
 *
 * Đọc thẳng qua `Repository` chứ không qua `useGame`: store của game chỉ giữ
 * tiến độ của MỘT hồ sơ đang chơi, còn trang này cần nhìn cả bàn cùng lúc.
 *
 * Mọi thao tác ở đây đều không lấy lại được, nên cái nào cũng phải qua một hộp
 * thoại xác nhận nói rõ mất gì và giữ gì.
 */

import { useCallback, useEffect, useState } from 'react'
import { totalNodes } from '../../content/worldmap'
import { GRADES, SUBJECTS, SUBJECT_LABEL, type Grade, type Subject } from '../../content/types'
import { emptyProgress, type StudentProfile, type StudentProgress } from '../../data/types'
import { levelFromTotalXp } from '../../engine/rewards'
import { getRepository } from '../../store/game'
import { HERO_CREATURES, creatureFromAvatar } from '../pixel/creatures'
import { PixelSprite } from '../pixel/sprite'
import { ConfirmModal } from '../../ui/ConfirmModal'

interface Row {
  student: StudentProfile
  progress: StudentProgress
}

/** Cùng công thức khoá vùng mà `store/game.ts` dùng, để hai nơi không lệch nhau. */
function regionKey(subject: Subject, grade: Grade): string {
  return `${subject}.g${grade}`
}

export function StudentsPanel() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [pending, setPending] = useState<{ row: Row; action: 'reset' | 'delete' } | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const repository = getRepository()
    const students = await repository.listStudents()
    const loaded = await Promise.all(
      students.map(async (student) => ({
        student,
        progress: await repository.getProgress(student.id),
      })),
    )
    setRows(loaded)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const run = async (job: () => Promise<void>) => {
    setBusy(true)
    try {
      await job()
      await reload()
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  if (rows === null) return <p className="card">Đang đọc dữ liệu trên máy…</p>
  if (rows.length === 0) return <p className="card">Máy này chưa có hồ sơ nào.</p>

  return (
    <div className="grid gap-3">
      <p className="card text-base opacity-70">
        {rows.length} hồ sơ trên máy này. Dữ liệu nằm trong trình duyệt của máy — xoá trình duyệt
        là mất, và máy khác không thấy.
      </p>

      {rows.map((row) => (
        <StudentCard
          key={row.student.id}
          row={row}
          busy={busy}
          onGrade={(grade) =>
            void run(async () => {
              await getRepository().saveStudent({ ...row.student, grade })
            })
          }
          onReset={() => setPending({ row, action: 'reset' })}
          onDelete={() => setPending({ row, action: 'delete' })}
        />
      ))}

      {pending?.action === 'reset' && (
        <ConfirmModal
          title={`Đặt lại tiến độ của ${pending.row.student.name}?`}
          message={
            'Mọi chặng đã qua, mức thạo, thú và vàng sẽ về như lúc mới tạo hồ sơ.\n' +
            'Tên, nhân vật và lớp thì giữ nguyên.'
          }
          confirmLabel="Đặt lại"
          cancelLabel="Thôi"
          danger
          onClose={() => setPending(null)}
          onConfirm={() =>
            void run(async () => {
              await getRepository().saveProgress(pending.row.student.id, emptyProgress())
              await getRepository().saveStudent({
                ...pending.row.student,
                gold: 0,
                totalXp: 0,
                equippedItemIds: [],
              })
            })
          }
        >
          <PixelSprite
            sprite={HERO_CREATURES[creatureFromAvatar(pending.row.student.avatar)]}
            scale={4}
          />
        </ConfirmModal>
      )}

      {pending?.action === 'delete' && (
        <ConfirmModal
          title={`Xoá hồ sơ của ${pending.row.student.name}?`}
          message={'Cả hồ sơ lẫn toàn bộ tiến độ sẽ biến mất.\nKhông lấy lại được đâu.'}
          confirmLabel="Xoá hồ sơ"
          cancelLabel="Giữ lại"
          danger
          onClose={() => setPending(null)}
          onConfirm={() =>
            void run(async () => {
              await getRepository().deleteStudent(pending.row.student.id)
            })
          }
        >
          <PixelSprite
            sprite={HERO_CREATURES[creatureFromAvatar(pending.row.student.avatar)]}
            scale={4}
          />
        </ConfirmModal>
      )}
    </div>
  )
}

function StudentCard({
  row,
  busy,
  onGrade,
  onReset,
  onDelete,
}: {
  row: Row
  busy: boolean
  onGrade: (grade: Grade) => void
  onReset: () => void
  onDelete: () => void
}) {
  const { student, progress } = row
  const { level } = levelFromTotalXp(student.totalXp)

  return (
    <section className="card grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <PixelSprite sprite={HERO_CREATURES[creatureFromAvatar(student.avatar)]} scale={3} />
        <div className="flex-1">
          <p className="text-xl font-extrabold">{student.name}</p>
          <p className="pixel-font text-base opacity-70">
            Cấp {level} · 🪙 {student.gold} · {Object.keys(progress.mastery).length} kỹ năng đã đụng
            tới
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onReset} disabled={busy} className="btn btn-ghost text-base">
            Đặt lại tiến độ
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="btn text-base"
            style={{ background: '#f5d0d0', color: '#a32e2e' }}
          >
            Xoá
          </button>
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-base font-extrabold">Lớp</span>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy || value === student.grade}
              onClick={() => onGrade(value)}
              aria-pressed={value === student.grade}
              className="btn flex-1 text-base"
              style={{
                background: value === student.grade ? '#fff3c4' : 'var(--color-paper-sunk)',
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-base font-extrabold">Tiến độ vùng đất của lớp {student.grade}</span>
        <div className="grid gap-1 sm:grid-cols-2">
          {SUBJECTS.map((subject) => {
            const cleared = progress.clearedNodes[regionKey(subject, student.grade)] ?? 0
            const total = totalNodes(subject, student.grade)
            const done = total > 0 && cleared >= total
            return (
              <div
                key={subject}
                className="flex items-center gap-2 px-2 py-1"
                style={{ background: 'var(--color-paper-sunk)', borderRadius: 8 }}
              >
                <span className="flex-1 text-base">{SUBJECT_LABEL[subject]}</span>
                <span className="pixel-font text-base" style={{ color: done ? '#2f7d32' : undefined }}>
                  {done && '✓ '}
                  {cleared}/{total}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
