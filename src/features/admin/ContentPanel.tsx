/**
 * Soi VÀ SỬA ngân hàng nội dung.
 *
 * Trang này trước đây chỉ đọc, với lý do chính đáng: câu hỏi nằm trong mã nguồn,
 * sửa từ trình duyệt thì lần dựng sau là mất sạch mà người sửa cứ tưởng đã lưu.
 * Cách chữa không phải là cấm sửa, mà là tách hai tầng và NÓI THẲNG ra:
 *
 *   - Ngân hàng gốc trong mã: không đụng vào được từ đây, không bao giờ mất.
 *   - Phần tự soạn: nằm trong máy này, xuất ra tệp được để mang sang máy khác.
 *
 * Nhờ vậy sửa sai cũng không hỏng được gì: "Xoá hết phần tự sửa" là về như cũ.
 *
 * Việc cũ của trang - CHỈ RA CHỖ THIẾU - vẫn giữ nguyên, vì đó mới là thứ nói
 * cho thầy cô biết nên soạn gì trước.
 */

import { useMemo, useState } from 'react'
import { originalSkillName, skillsFor } from '../../content/curriculum'
import type { BankEntry } from '../../content/bank'
import { BANKS, contentCount, contentKind, sampleQuestion } from '../../content/registry'
import {
  addQuestion,
  customCounts,
  customRows,
  exportContent,
  importContent,
  isHidden,
  isMine,
  removeQuestion,
  resetContent,
  setHidden,
  setSkillName,
  updateQuestion,
} from '../../content/custom'
import {
  GRADES,
  SUBJECTS,
  SUBJECT_LABEL,
  type Difficulty,
  type Grade,
  type Subject,
} from '../../content/types'
import { syncCustomContent } from '../../data/content-sync'
import { getSupabase, isSupabaseConfigured } from '../../data/supabase-client'
import { createRng } from '../../engine/rng'
import { useAuth } from '../../store/auth'
import { ConfirmModal } from '../../ui/ConfirmModal'
import { QuestionEditor } from './QuestionEditor'
import { SheetImport } from './SheetImport'
import { TabStrip } from './TabStrip'

const DIFFICULTIES: Difficulty[] = [1, 2, 3]

const KIND_LABEL = {
  generator: 'bộ sinh',
  bank: 'soạn tay',
  none: 'chưa có',
} as const

const SUBJECT_TABS = SUBJECTS.map((id) => ({ id, label: SUBJECT_LABEL[id] }))
const GRADE_TABS = GRADES.map((id) => ({ id, label: `Lớp ${id}` }))

export function ContentPanel() {
  const [subject, setSubject] = useState<Subject>('math')
  const [grade, setGrade] = useState<Grade>(1)
  const [openSkill, setOpenSkill] = useState<string | null>(null)
  // Tăng lên sau mỗi lần sửa để tính lại danh sách. Kho nội dung nằm ngoài
  // React nên không tự báo cho màn hình này.
  const [revision, setRevision] = useState(0)
  const [wipeOpen, setWipeOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const mode = useAuth((s) => s.mode)

  const bump = () => {
    setRevision((n) => n + 1)
    setNotice(null)
  }

  const rows = useMemo(() => {
    const rng = createRng(`admin-${subject}-g${grade}-${revision}`)
    return skillsFor(subject, grade).map((skill) => ({
      skill,
      kind: contentKind(skill.id),
      count: contentCount(skill.id),
      mine: customRows(skill.id).length,
      // Thử lấy thật một câu ở mỗi mức: đếm được không có nghĩa là mức nào cũng ra câu.
      levels: DIFFICULTIES.map((difficulty) => Boolean(sampleQuestion(skill.id, difficulty, rng))),
    }))
  }, [subject, grade, revision])

  const gaps = rows.filter((row) => row.kind === 'none' || row.levels.some((ok) => !ok))
  const counts = useMemo(() => customCounts(), [revision])
  const touched = counts.questions + counts.hidden + counts.renamed > 0

  const download = () => {
    const blob = new Blob([exportContent()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `noi-dung-tu-soan-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Đồng bộ TAY, và lỗi hiện thẳng ra.
   *
   * Khác hẳn lần đồng bộ tự động lúc đăng nhập - lần đó nuốt lỗi vì trẻ đang chờ
   * vào chơi. Ở đây người lớn vừa bấm nút và đang nhìn màn hình: im lặng lúc này
   * là để họ tưởng đã gửi xong trong khi chưa có gì lên tới nơi.
   */
  const syncNow = async () => {
    setSyncing(true)
    setNotice(null)
    try {
      const supabase = await getSupabase()
      if (!supabase) throw new Error('Chưa cấu hình Supabase trên máy này.')
      const result = await syncCustomContent(supabase)
      setNotice(
        `✓ Đã đồng bộ: gửi lên ${result.pushed} dòng, nhận về ${result.pulled} dòng. ` +
          `Hiện có ${result.questions} câu tự soạn.`,
      )
    } catch (cause) {
      setNotice(`✕ Không đồng bộ được: ${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      setSyncing(false)
      setRevision((n) => n + 1)
    }
  }

  const upload = async (file: File) => {
    const added = importContent(await file.text())
    setNotice(
      added === null
        ? '✕ Tệp không đọc được. Cần đúng tệp JSON đã xuất ra từ đây.'
        : `✓ Đã nạp ${added} câu tự soạn.`,
    )
    setRevision((n) => n + 1)
  }

  return (
    <div className="grid gap-4">
      <section className="card grid gap-3">
        {/* Hai hàng này cũng một dòng, cuộn ngang - cùng lý do với hàng danh
            mục ở trang quản trị: bốn môn và năm lớp không vừa màn điện thoại. */}
        <TabStrip
          items={SUBJECT_TABS}
          value={subject}
          label="Môn học"
          onChange={(value) => {
            setSubject(value)
            setOpenSkill(null)
          }}
        />

        <TabStrip
          items={GRADE_TABS}
          value={grade}
          label="Lớp"
          tone="warm"
          onChange={(value) => {
            setGrade(value)
            setOpenSkill(null)
          }}
        />
      </section>

      <section className="card grid gap-2">
        <h3 className="text-xl font-extrabold">
          {SUBJECT_LABEL[subject]} lớp {grade} · {rows.length} kỹ năng
        </h3>
        <p className="text-base opacity-70">
          {gaps.length === 0
            ? '✓ Kỹ năng nào cũng ra được câu ở cả ba mức khó.'
            : `⚠ ${gaps.length} kỹ năng còn thiếu câu ở mức nào đó.`}
        </p>
      </section>

      {/* Nói thẳng phần tự soạn lưu ở đâu. Người soạn tưởng đã lưu lên máy chủ
          rồi đổi máy là mất công cả buổi - đó là lỗi của trang, không phải của
          họ. */}
      <section className="card grid gap-2">
        <h3 className="text-xl font-extrabold">📦 Phần tự soạn</h3>
        <p className="text-base opacity-70">
          {touched
            ? `${counts.questions} câu tự soạn · ${counts.hidden} câu gốc đang ẩn · ${counts.renamed} kỹ năng đổi tên.`
            : 'Chưa sửa gì. App đang chạy đúng nội dung gốc.'}
        </p>
        <p className="text-base opacity-70">
          {mode === 'adult'
            ? 'Đã đăng nhập: phần tự soạn được đồng bộ sang các máy khác của bạn, và học sinh trong lớp bạn dạy cũng nhận được.'
            : isSupabaseConfigured()
              ? 'Chưa đăng nhập nên phần tự soạn chỉ nằm trong máy này. Đăng nhập để đồng bộ, hoặc xuất ra tệp để mang đi.'
              : 'Máy này chạy hoàn toàn ngoại tuyến nên phần tự soạn chỉ nằm ở đây. Muốn mang đi thì xuất ra tệp rồi nạp vào máy kia.'}{' '}
          Ngân hàng gốc trong mã không bao giờ bị sửa.
        </p>

        {notice && (
          <p
            className="rounded-xl p-2 text-base font-bold"
            style={{ background: 'var(--color-brand-soft)' }}
            role="status"
          >
            {notice}
          </p>
        )}

        {mode === 'adult' && (
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncing}
            className="btn btn-primary text-base"
          >
            {syncing ? 'Đang đồng bộ...' : '☁ Đồng bộ ngay'}
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            disabled={!touched}
            className="btn btn-ghost flex-1 text-base"
          >
            ⬇ Xuất ra tệp
          </button>

          <label className="btn btn-ghost flex-1 cursor-pointer text-center text-base">
            ⬆ Nạp từ tệp
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file)
                event.target.value = ''
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => setWipeOpen(true)}
            disabled={!touched}
            className="btn btn-ghost px-5 text-base"
            style={{ color: touched ? 'var(--color-warn)' : undefined }}
          >
            Xoá hết phần tự sửa
          </button>
        </div>
      </section>

      <section className="grid gap-2">
        {rows.map(({ skill, kind, count, levels, mine }) => {
          const missing = levels.some((ok) => !ok)
          const open = openSkill === skill.id
          const renamed = originalSkillName(skill.id) !== skill.name

          return (
            <div
              key={skill.id}
              className="card grid gap-1"
              style={{ borderColor: missing ? '#e0483e' : open ? 'var(--color-brand)' : undefined }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-extrabold">
                  {skill.name}
                  {renamed && <span className="ml-2 text-sm opacity-60">(đã đổi tên)</span>}
                </span>
                <span className="pixel-font text-base opacity-70">
                  {KIND_LABEL[kind]} · {count === Infinity ? 'vô hạn' : `${count} câu`}
                  {mine > 0 && ` · ${mine} câu của mình`}
                </span>
              </div>

              <p className="text-sm opacity-60">{skill.description}</p>

              <div className="flex flex-wrap items-center gap-2">
                {DIFFICULTIES.map((difficulty, index) => (
                  <span
                    key={difficulty}
                    className="pixel-font px-2 py-1 text-sm"
                    style={{
                      borderRadius: 4,
                      background: levels[index] ? '#d7f5d0' : '#f5d0d0',
                      color: levels[index] ? '#2f7d32' : '#a32e2e',
                    }}
                  >
                    mức {difficulty} {levels[index] ? '✓' : '✕'}
                  </span>
                ))}

                <button
                  type="button"
                  onClick={() => setOpenSkill(open ? null : skill.id)}
                  className="btn btn-ghost ml-auto px-4 text-base"
                >
                  {open ? 'Đóng' : '✏️ Soạn'}
                </button>
              </div>

              {open && (
                <SkillEditor skillId={skill.id} skillName={skill.name} onChange={bump} />
              )}

              {!open && <code className="text-xs opacity-50">{skill.id}</code>}
            </div>
          )
        })}
      </section>

      {wipeOpen && (
        <ConfirmModal
          title="Xoá hết phần tự sửa?"
          message={
            'Mọi câu tự soạn, câu đang ẩn và tên đã đổi trên máy này sẽ mất.\n' +
            'Nội dung gốc thì không sao cả - muốn giữ phần của mình thì xuất ra tệp trước đã nhé.'
          }
          confirmLabel="Xoá hết"
          danger
          onClose={() => setWipeOpen(false)}
          onConfirm={() => {
            resetContent()
            setWipeOpen(false)
            setNotice('✓ Đã về đúng nội dung gốc.')
            setRevision((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}

/** Phần soạn của MỘT kỹ năng: đổi tên, câu của mình, và câu gốc. */
function SkillEditor({
  skillId,
  skillName,
  onChange,
}: {
  skillId: string
  skillName: string
  onChange: () => void
}) {
  const [name, setName] = useState(skillName)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const mine = customRows(skillId)
  const original = BANKS[skillId] ?? []
  const originalName = originalSkillName(skillId) ?? skillName

  return (
    <div className="mt-2 grid gap-3 border-t-4 pt-3" style={{ borderColor: 'var(--color-paper-sunk)' }}>
      {/* --- Tên kỹ năng --- */}
      <div className="grid gap-1">
        <span className="text-sm font-bold opacity-70">Tên kỹ năng (hiện cho trẻ thấy)</span>
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="admin-input flex-1"
            style={{ minWidth: 200 }}
          />
          <button
            type="button"
            onClick={() => {
              setSkillName(skillId, name.trim() === originalName ? '' : name)
              onChange()
            }}
            disabled={name.trim() === skillName}
            className="btn btn-primary px-5 text-base"
          >
            Lưu tên
          </button>
          {name !== originalName && (
            <button
              type="button"
              onClick={() => {
                setName(originalName)
                setSkillName(skillId, '')
                onChange()
              }}
              className="btn btn-ghost px-4 text-base"
            >
              Về tên gốc
            </button>
          )}
        </div>
      </div>

      <SheetImport skill={{ id: skillId, name: skillName }} onChange={onChange} />

      {/* --- Câu của mình --- */}
      <div className="grid gap-2">
        <p className="text-base font-extrabold">Câu của mình ({mine.length})</p>
        <p className="text-sm opacity-60">
          Câu ở đây được hỏi TRƯỚC câu gốc. Hỏi hết rồi mới quay lại ngân hàng gốc, nên trận đấu
          không bao giờ hết câu.
        </p>

        {mine.map((row) =>
          editingId === row.id ? (
            <QuestionEditor
              key={row.id}
              editing={row.value}
              onSave={(raw) => {
                const ok = updateQuestion(row.id, raw)
                if (ok) {
                  setEditingId(null)
                  onChange()
                }
                return ok
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <QuestionRow
              key={row.id}
              entry={row.value}
              note={isMine(row) ? undefined : 'người khác soạn'}
              actions={
                isMine(row) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingId(row.id)}
                      className="btn btn-ghost px-3 text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoving(row.id)}
                      className="btn btn-ghost px-3 text-sm"
                      style={{ color: 'var(--color-warn)' }}
                    >
                      Xoá
                    </button>
                  </>
                ) : null
              }
            />
          ),
        )}

        {adding ? (
          <QuestionEditor
            onSave={(raw) => {
              const ok = addQuestion(skillId, raw)
              if (ok) {
                setAdding(false)
                onChange()
              }
              return ok
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn btn-primary text-base"
          >
            + Thêm câu hỏi
          </button>
        )}
      </div>

      {/* --- Câu gốc --- */}
      {original.length > 0 && (
        <div className="grid gap-2">
          <p className="text-base font-extrabold">Câu gốc trong mã ({original.length})</p>
          <p className="text-sm opacity-60">
            Không sửa được từ đây, nhưng ẩn đi được nếu chưa hợp với lớp mình.
          </p>
          {original.map((entry, index) => {
            const off = isHidden(skillId, entry.prompt)
            return (
              <QuestionRow
                key={index}
                entry={entry}
                dim={off}
                actions={
                  <button
                    type="button"
                    onClick={() => {
                      setHidden(skillId, entry.prompt, !off)
                      onChange()
                    }}
                    className="btn btn-ghost px-3 text-sm"
                  >
                    {off ? 'Hiện lại' : 'Ẩn'}
                  </button>
                }
              />
            )
          })}
        </div>
      )}

      {removing !== null && (
        <ConfirmModal
          title="Xoá câu này?"
          message={mine.find((row) => row.id === removing)?.value.prompt ?? ''}
          confirmLabel="Xoá"
          danger
          onClose={() => setRemoving(null)}
          onConfirm={() => {
            removeQuestion(removing)
            setRemoving(null)
            onChange()
          }}
        />
      )}
    </div>
  )
}

const ENTRY_LABEL: Record<BankEntry['kind'], string> = {
  choice: 'Trắc nghiệm',
  text: 'Gõ đáp án',
  order: 'Sắp thứ tự',
  pairs: 'Nối cặp',
  scenario: 'Tình huống',
}

function QuestionRow({
  entry,
  actions,
  dim = false,
  note,
}: {
  entry: BankEntry
  actions: React.ReactNode
  dim?: boolean
  /** Ghi chú nhỏ bên cạnh thể loại, ví dụ "người khác soạn". */
  note?: string
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl p-2"
      style={{ background: 'var(--color-paper-sunk)', opacity: dim ? 0.5 : 1 }}
    >
      <span className="pixel-font shrink-0 text-sm opacity-70">mức {entry.difficulty}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold leading-snug">{entry.prompt}</span>
        <span className="block text-sm opacity-60">
          {ENTRY_LABEL[entry.kind]}
          {entry.kind === 'choice' && ` · đáp án: ${entry.correct}`}
          {entry.kind === 'text' && ` · đáp án: ${entry.accepted[0]}`}
          {note && ` · ${note}`}
          {dim && ' · đang ẩn'}
        </span>
      </span>
      <span className="flex shrink-0 gap-1">{actions}</span>
    </div>
  )
}
