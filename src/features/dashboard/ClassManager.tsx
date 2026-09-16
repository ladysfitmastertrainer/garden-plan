/**
 * Quản lý lớp cho giáo viên: tạo lớp, thêm học sinh, đặt mã PIN.
 *
 * Đặt mã PIN là bước BẮT BUỘC: hồ sơ chưa có mã PIN thì em đó chưa đăng nhập
 * được trên máy dùng chung ở lớp. Màn hình này nhắc rất rõ những em còn thiếu.
 */

import { useCallback, useEffect, useState } from 'react'
import { GRADES, type Grade } from '../../content/types'
import { classApi as api, type ClassRow, type ClassStudent } from '../../data/classes'
import { ConfirmModal } from '../../ui/ConfirmModal'

const AVATARS = ['🦊', '🐼', '🐯', '🐨', '🦁', '🐸', '🐧', '🦄', '🐢', '🐙', '🦉', '🐝']

export function ClassManager() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selected, setSelected] = useState<ClassRow | null>(null)
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshClasses = useCallback(async () => {
    try {
      setClasses(await api.listClasses())
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  const refreshStudents = useCallback(
    async (classId: string) => {
      try {
        setStudents(await api.listStudents(classId))
        setError(null)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    },
    [],
  )

  useEffect(() => {
    void refreshClasses()
  }, [refreshClasses])

  useEffect(() => {
    if (selected) void refreshStudents(selected.id)
  }, [selected, refreshStudents])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  // Không còn nhánh "chưa cấu hình Supabase" như bản cũ: giờ chỉ có một tầng lưu
  // trữ, và nếu máy chủ chưa được cấu hình thì chính nó nói ra điều đó - lời báo
  // hiện ở ô `error` phía dưới, kèm đúng tên biến môi trường còn thiếu.
  return (
    <div className="grid gap-5">
      {error && (
        <p
          role="alert"
          className="rounded-2xl p-4 font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
        >
          {error}
        </p>
      )}

      {selected ? (
        <ClassDetail
          classRow={selected}
          students={students}
          busy={busy}
          onBack={() => {
            setSelected(null)
            void refreshClasses()
          }}
          onAddStudent={(input) =>
            run(async () => {
              await api.addStudent(selected.id, input)
              await refreshStudents(selected.id)
            })
          }
          onRemoveStudent={(studentId) =>
            run(async () => {
              await api.removeStudent(selected.id, studentId)
              await refreshStudents(selected.id)
            })
          }
          onSetPin={(studentId, pin) =>
            run(async () => {
              await api.setPin(studentId, pin)
              await refreshStudents(selected.id)
            })
          }
        />
      ) : (
        <ClassList
          classes={classes}
          busy={busy}
          onOpen={setSelected}
          onCreate={(name) =>
            run(async () => {
              await api.createClass(name)
              await refreshClasses()
            })
          }
          onDelete={(classId) =>
            run(async () => {
              await api.deleteClass(classId)
              await refreshClasses()
            })
          }
        />
      )}
    </div>
  )
}

function ClassList({
  classes,
  busy,
  onOpen,
  onCreate,
  onDelete,
}: {
  classes: ClassRow[]
  busy: boolean
  onOpen: (row: ClassRow) => void
  onCreate: (name: string) => void
  onDelete: (classId: string) => void
}) {
  const [name, setName] = useState('')
  const [pendingClass, setPendingClass] = useState<ClassRow | null>(null)

  return (
    <>
      <section className="card grid gap-3">
        <h2 className="text-xl font-extrabold">Lớp của tôi</h2>
        {classes.length === 0 && <p className="opacity-70">Chưa có lớp nào. Tạo lớp đầu tiên bên dưới.</p>}
        {classes.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'var(--color-paper-sunk)' }}>
            <button type="button" onClick={() => onOpen(row)} className="flex-1 text-left">
              <span className="block text-lg font-extrabold">{row.name}</span>
              <span className="block text-base opacity-70">
                {row.studentCount} học sinh · mã lớp <code className="font-extrabold tracking-widest">{row.joinCode}</code>
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPendingClass(row)}
              className="rounded-xl px-3 py-2 opacity-50 hover:opacity-100"
              aria-label={`Xoá lớp ${row.name}`}
            >
              🗑️
            </button>
          </div>
        ))}
      </section>

      <form
        className="card grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim()) {
            onCreate(name.trim())
            setName('')
          }
        }}
      >
        <h2 className="text-xl font-extrabold">Tạo lớp mới</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ví dụ: Lớp 3A"
          className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
        />
        <button type="submit" disabled={busy || !name.trim()} className="btn btn-primary">
          Tạo lớp
        </button>
      </form>

      {pendingClass && (
        <ConfirmModal
          title={`Xoá lớp "${pendingClass.name}"?`}
          message={`Lớp và mã lớp sẽ biến mất.\nHồ sơ và tiến độ của ${pendingClass.studentCount} học sinh VẪN ĐƯỢC GIỮ.`}
          confirmLabel="Xoá lớp"
          cancelLabel="Giữ lại"
          danger
          onClose={() => setPendingClass(null)}
          onConfirm={() => {
            onDelete(pendingClass.id)
            setPendingClass(null)
          }}
        />
      )}
    </>
  )
}

function ClassDetail({
  classRow,
  students,
  busy,
  onBack,
  onAddStudent,
  onRemoveStudent,
  onSetPin,
}: {
  classRow: ClassRow
  students: ClassStudent[]
  busy: boolean
  onBack: () => void
  onAddStudent: (input: { name: string; avatar: string; grade: Grade }) => void
  onRemoveStudent: (studentId: string) => void
  onSetPin: (studentId: string, pin: string) => void
}) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0]!)
  const [grade, setGrade] = useState<Grade>(1)
  const [pendingRemove, setPendingRemove] = useState<ClassStudent | null>(null)
  const missingPin = students.filter((s) => !s.hasPin)

  return (
    <>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="btn btn-ghost px-4">
          ←
        </button>
        <div>
          <h2 className="text-2xl font-extrabold">{classRow.name}</h2>
          <p className="opacity-70">
            Mã lớp: <code className="text-lg font-extrabold tracking-widest">{classRow.joinCode}</code>
          </p>
        </div>
      </div>

      <p className="rounded-2xl p-4 text-base" style={{ background: 'var(--color-brand-soft)' }}>
        Học sinh vào máy ở lớp bằng <strong>mã lớp</strong> rồi chọn ảnh đại diện của mình và nhập
        mã PIN. Mã lớp cho thấy tên và ảnh đại diện của cả lớp, nên đừng dán ở nơi công cộng.
      </p>

      {missingPin.length > 0 && (
        <p
          className="rounded-2xl p-4 font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
        >
          ⚠️ {missingPin.length} học sinh chưa có mã PIN nên chưa đăng nhập được trên máy của lớp:{' '}
          {missingPin.map((s) => s.name).join(', ')}
        </p>
      )}

      <section className="card grid gap-3">
        <h3 className="text-xl font-extrabold">Học sinh ({students.length})</h3>
        {students.length === 0 && <p className="opacity-70">Chưa có học sinh nào trong lớp.</p>}
        {students.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            busy={busy}
            onSetPin={(pin) => onSetPin(student.id, pin)}
            onRemove={() => setPendingRemove(student)}
          />
        ))}
      </section>

      <form
        className="card grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          onAddStudent({ name: name.trim(), avatar, grade })
          setName('')
        }}
      >
        <h3 className="text-xl font-extrabold">Thêm học sinh</h3>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tên học sinh"
          maxLength={30}
          className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
        />
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatar(emoji)}
              aria-label={`Chọn ${emoji}`}
              className="aspect-square rounded-2xl border-4 text-2xl"
              style={{
                borderColor: avatar === emoji ? 'var(--color-brand)' : 'transparent',
                background: avatar === emoji ? 'var(--color-brand-soft)' : 'var(--color-paper-sunk)',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {GRADES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGrade(value)}
              className="rounded-2xl border-4 py-2 font-extrabold"
              style={{
                borderColor: grade === value ? 'var(--color-brand)' : 'transparent',
                background: grade === value ? 'var(--color-brand-soft)' : 'var(--color-paper-sunk)',
              }}
            >
              Lớp {value}
            </button>
          ))}
        </div>
        <button type="submit" disabled={busy || !name.trim()} className="btn btn-primary">
          Thêm vào lớp
        </button>
      </form>

      {pendingRemove && (
        <ConfirmModal
          title={`Gỡ ${pendingRemove.name} khỏi lớp?`}
          message={`Em sẽ không còn vào lớp bằng mã lớp được nữa.\nHồ sơ và tiến độ của em VẪN ĐƯỢC GIỮ.`}
          confirmLabel="Gỡ khỏi lớp"
          cancelLabel="Giữ lại"
          onClose={() => setPendingRemove(null)}
          onConfirm={() => {
            onRemoveStudent(pendingRemove.id)
            setPendingRemove(null)
          }}
        >
          <span className="text-5xl leading-none" aria-hidden="true">
            {pendingRemove.avatar}
          </span>
        </ConfirmModal>
      )}
    </>
  )
}

function StudentRow({
  student,
  busy,
  onSetPin,
  onRemove,
}: {
  student: ClassStudent
  busy: boolean
  onSetPin: (pin: string) => void
  onRemove: () => void
}) {
  const [pin, setPin] = useState('')
  const [editing, setEditing] = useState(false)

  return (
    <div className="grid gap-2 rounded-2xl p-3" style={{ background: 'var(--color-paper-sunk)' }}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{student.avatar}</span>
        <div className="flex-1">
          <p className="font-extrabold">{student.name}</p>
          <p className="text-base opacity-70">
            Lớp {student.grade} ·{' '}
            {student.hasPin ? (
              '🔑 đã có mã PIN'
            ) : (
              <span style={{ color: 'var(--color-warn)' }}>⚠️ chưa có mã PIN</span>
            )}
          </p>
        </div>
        <button type="button" onClick={() => setEditing(!editing)} className="btn btn-ghost px-4 text-base">
          {student.hasPin ? 'Đổi mã' : 'Đặt mã'}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl px-3 py-2 opacity-50 hover:opacity-100"
          aria-label={`Gỡ ${student.name} khỏi lớp`}
        >
          ✕
        </button>
      </div>

      {editing && (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (/^\d{4}$/.test(pin)) {
              onSetPin(pin)
              setPin('')
              setEditing(false)
            }
          }}
        >
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="4 chữ số"
            aria-label={`Mã PIN cho ${student.name}`}
            className="flex-1 rounded-xl border-4 bg-white px-3 py-2 text-center text-xl font-extrabold tracking-widest outline-none"
            style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
          />
          <button type="submit" disabled={busy || !/^\d{4}$/.test(pin)} className="btn btn-good px-5">
            Lưu
          </button>
        </form>
      )}
    </div>
  )
}
