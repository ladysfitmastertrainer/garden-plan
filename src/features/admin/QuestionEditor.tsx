/**
 * Soạn một câu hỏi.
 *
 * Mở cả năm thể loại. Nạp lên bằng Excel được thì cũng phải sửa được ở đây -
 * không thì một lỗi chính tả trong file phải sửa bằng cách xoá đi nạp lại.
 *
 * Mỗi thể loại có đúng một chỗ dễ soạn sai, và biểu mẫu chặn ngay tại chỗ đó:
 * nối cặp thì hai vế phải đi thành cặp (nên gõ chung một ô, không phải hai cột
 * rời như trong Excel); sắp xếp thì thứ tự gõ vào CHÍNH LÀ đáp án; tình huống
 * thì mỗi lựa chọn mang theo mức đánh giá và lời phản hồi của riêng nó.
 *
 * Form giữ dữ liệu ở dạng chuỗi thô rồi mới đưa qua `sanitiseEntry` lúc lưu -
 * kiểm tra một chỗ duy nhất, cùng chỗ mà tệp JSON nhập vào phải đi qua.
 */

import { useState } from 'react'
import type { BankEntry } from '../../content/bank'
import { LIMITS, sanitiseEntry } from '../../content/custom'
import type { Difficulty } from '../../content/types'

type Kind = 'choice' | 'text' | 'order' | 'pairs' | 'scenario'

const KIND_LABEL: Record<Kind, string> = {
  choice: 'Trắc nghiệm',
  text: 'Gõ đáp án',
  order: 'Sắp thứ tự',
  pairs: 'Nối cặp',
  scenario: 'Tình huống (Đạo đức)',
}

const QUALITY_LABEL = {
  good: 'Nên làm',
  ok: 'Tạm được',
  poor: 'Chưa nên',
} as const

type Quality = keyof typeof QUALITY_LABEL

interface Draft {
  kind: Kind
  difficulty: Difficulty
  prompt: string
  explanation: string
  hint: string
  /** Trắc nghiệm */
  correct: string
  distractors: string
  /** Gõ đáp án: mỗi dòng một cách viết được chấp nhận */
  accepted: string
  /** Sắp thứ tự: mỗi dòng một phần, theo ĐÚNG thứ tự đúng */
  items: string
  /** Nối cặp: mỗi dòng một cặp, hai vế cách nhau bằng "=" */
  pairs: string
  /** Tình huống */
  options: Array<{ label: string; quality: Quality; feedback: string }>
}

const BLANK: Draft = {
  kind: 'choice',
  difficulty: 1,
  prompt: '',
  explanation: '',
  hint: '',
  correct: '',
  distractors: '',
  accepted: '',
  items: '',
  pairs: '',
  options: [
    { label: '', quality: 'good', feedback: '' },
    { label: '', quality: 'poor', feedback: '' },
  ],
}

/** Dựng lại bản nháp từ một câu đã lưu, để sửa tiếp. */
function draftFrom(entry: BankEntry): Draft {
  const base: Draft = {
    ...BLANK,
    difficulty: entry.difficulty,
    prompt: entry.prompt,
    explanation: entry.explanation,
    hint: entry.hint ?? '',
  }

  switch (entry.kind) {
    case 'choice':
      return { ...base, kind: 'choice', correct: entry.correct, distractors: entry.distractors.join('\n') }
    case 'text':
      return { ...base, kind: 'text', accepted: entry.accepted.join('\n') }
    case 'order':
      return { ...base, kind: 'order', items: entry.items.join('\n') }
    case 'pairs':
      return {
        ...base,
        kind: 'pairs',
        pairs: entry.pairs.map(([left, right]) => `${left} = ${right}`).join('\n'),
      }
    case 'scenario':
      return {
        ...base,
        kind: 'scenario',
        options: entry.options.map((o) => ({
          label: o.label,
          quality: o.quality as Quality,
          feedback: o.feedback,
        })),
      }
    default:
      return base
  }
}

const lines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

/** Bản nháp -> dữ liệu thô đúng dạng `BankEntry`, chưa kiểm tra. */
function toRaw(draft: Draft): unknown {
  const base = {
    difficulty: draft.difficulty,
    prompt: draft.prompt,
    explanation: draft.explanation,
    hint: draft.hint,
  }

  switch (draft.kind) {
    case 'choice':
      return { ...base, kind: 'choice', correct: draft.correct, distractors: lines(draft.distractors) }
    case 'text':
      return { ...base, kind: 'text', accepted: lines(draft.accepted) }
    case 'order':
      return { ...base, kind: 'order', items: lines(draft.items) }
    case 'pairs':
      return {
        ...base,
        kind: 'pairs',
        pairs: lines(draft.pairs)
          .map((line) => line.split('=').map((half) => half.trim()))
          .filter((halves) => halves.length === 2 && halves[0] && halves[1]),
      }
    case 'scenario':
      return {
        ...base,
        kind: 'scenario',
        options: draft.options
          .filter((o) => o.label.trim().length > 0)
          .map((o, index) => ({ id: `tu-soan-${index + 1}`, ...o })),
      }
  }
}

/**
 * Nói CỤ THỂ đang thiếu gì.
 *
 * `sanitiseEntry` chỉ trả về null - đủ để chặn câu hỏng, không đủ để người soạn
 * biết phải sửa đâu. Hai chỗ phải khớp nhau, nên mỗi lần nới điều kiện ở
 * `custom.ts` thì sửa cả ở đây.
 */
function whatIsMissing(draft: Draft): string | null {
  if (!draft.prompt.trim()) return 'Chưa có đề bài.'

  if (draft.kind === 'choice') {
    if (!draft.correct.trim()) return 'Chưa có đáp án đúng.'
    const wrong = lines(draft.distractors).filter((item) => item !== draft.correct.trim())
    if (wrong.length === 0) return 'Cần ít nhất một đáp án sai, mỗi dòng một đáp án.'
  }

  if (draft.kind === 'text' && lines(draft.accepted).length === 0) {
    return 'Chưa có cách viết nào được chấp nhận.'
  }

  if (draft.kind === 'order' && lines(draft.items).length < 2) {
    return 'Câu sắp xếp cần ít nhất hai phần, mỗi dòng một phần.'
  }

  if (draft.kind === 'pairs') {
    const rows = lines(draft.pairs)
    const bad = rows.find((line) => line.split('=').filter((half) => half.trim()).length !== 2)
    if (bad) return `Dòng "${bad}" chưa đủ hai vế. Viết theo mẫu: mèo = meo meo`
    if (rows.length < 2) return 'Câu nối cặp cần ít nhất hai cặp, mỗi dòng một cặp.'
  }

  if (draft.kind === 'scenario' && draft.options.filter((o) => o.label.trim()).length < 2) {
    return 'Tình huống cần ít nhất hai lựa chọn.'
  }

  return null
}

export function QuestionEditor({
  editing,
  onSave,
  onCancel,
}: {
  /** Câu đang sửa; bỏ trống là soạn câu mới. */
  editing?: BankEntry
  onSave: (raw: unknown) => boolean
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(() => (editing ? draftFrom(editing) : BLANK))
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const setOption = (index: number, patch: Partial<Draft['options'][number]>) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }))
    setError(null)
  }

  const save = () => {
    const missing = whatIsMissing(draft)
    if (missing) {
      setError(missing)
      return
    }
    const raw = toRaw(draft)
    // Kiểm tra lần cuối bằng chính hàm mà kho dùng - nếu nó từ chối thì form
    // đang nói dối người soạn, và đó là lỗi cần thấy ngay.
    if (!sanitiseEntry(raw) || !onSave(raw)) {
      setError('Không lưu được. Kiểm tra lại đề bài và đáp án nhé.')
      return
    }
  }

  return (
    <div className="card grid gap-3" style={{ borderColor: 'var(--color-brand)' }}>
      <h4 className="text-lg font-extrabold">{editing ? 'Sửa câu hỏi' : 'Câu hỏi mới'}</h4>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Thể loại">
          <select
            value={draft.kind}
            onChange={(e) => set('kind', e.target.value as Kind)}
            className="admin-input"
          >
            {(Object.keys(KIND_LABEL) as Kind[]).map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mức khó">
          <div className="flex gap-2">
            {([1, 2, 3] as Difficulty[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => set('difficulty', value)}
                aria-pressed={draft.difficulty === value}
                className="btn flex-1 text-base"
                style={{
                  background: draft.difficulty === value ? '#fff3c4' : 'var(--color-paper-sunk)',
                }}
              >
                Mức {value}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Đề bài">
        <textarea
          value={draft.prompt}
          onChange={(e) => set('prompt', e.target.value)}
          maxLength={LIMITS.maxPromptLength}
          rows={2}
          placeholder="Ví dụ: 7 + 5 = ?"
          className="admin-input"
        />
      </Field>

      {draft.kind === 'choice' && (
        <>
          <Field label="Đáp án ĐÚNG">
            <input
              value={draft.correct}
              onChange={(e) => set('correct', e.target.value)}
              maxLength={LIMITS.maxChoiceLength}
              className="admin-input"
            />
          </Field>
          <Field label={`Đáp án sai (mỗi dòng một đáp án, tối đa ${LIMITS.maxChoices - 1})`}>
            <textarea
              value={draft.distractors}
              onChange={(e) => set('distractors', e.target.value)}
              rows={3}
              placeholder={'11\n13\n10'}
              className="admin-input"
            />
          </Field>
        </>
      )}

      {draft.kind === 'text' && (
        <Field label="Cách viết được chấp nhận (mỗi dòng một cách)">
          <textarea
            value={draft.accepted}
            onChange={(e) => set('accepted', e.target.value)}
            rows={3}
            placeholder={'mười hai\n12'}
            className="admin-input"
          />
        </Field>
      )}

      {draft.kind === 'order' && (
        <Field label="Các phần, gõ theo ĐÚNG THỨ TỰ ĐÚNG (mỗi dòng một phần)">
          <textarea
            value={draft.items}
            onChange={(e) => set('items', e.target.value)}
            rows={4}
            placeholder={'Em\nđi\nhọc\nmỗi ngày'}
            className="admin-input"
          />
        </Field>
      )}

      {draft.kind === 'pairs' && (
        <Field label='Các cặp cần nối (mỗi dòng một cặp, viết "vế trái = vế phải")'>
          <textarea
            value={draft.pairs}
            onChange={(e) => set('pairs', e.target.value)}
            rows={4}
            placeholder={'mèo = meo meo\nchó = gâu gâu\ngà trống = ò ó o'}
            className="admin-input"
          />
        </Field>
      )}

      {draft.kind === 'scenario' && (
        <div className="grid gap-2">
          <p className="text-base font-bold">Các lựa chọn</p>
          {draft.options.map((option, index) => (
            <div key={index} className="grid gap-2 rounded-xl p-2" style={{ background: 'var(--color-paper-sunk)' }}>
              <div className="flex gap-2">
                <input
                  value={option.label}
                  onChange={(e) => setOption(index, { label: e.target.value })}
                  maxLength={LIMITS.maxChoiceLength}
                  placeholder={`Lựa chọn ${index + 1}`}
                  className="admin-input flex-1"
                />
                <select
                  value={option.quality}
                  onChange={(e) => setOption(index, { quality: e.target.value as Quality })}
                  className="admin-input"
                  style={{ width: 130 }}
                >
                  {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => (
                    <option key={q} value={q}>
                      {QUALITY_LABEL[q]}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={option.feedback}
                onChange={(e) => setOption(index, { feedback: e.target.value })}
                maxLength={LIMITS.maxPromptLength}
                placeholder="Lời nói với con sau khi chọn - phần dạy nằm ở đây"
                className="admin-input"
              />
            </div>
          ))}
          {draft.options.length < LIMITS.maxChoices && (
            <button
              type="button"
              onClick={() =>
                set('options', [...draft.options, { label: '', quality: 'ok', feedback: '' }])
              }
              className="btn btn-ghost text-base"
            >
              + Thêm lựa chọn
            </button>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Lời giải (hiện sau khi trả lời)">
          <textarea
            value={draft.explanation}
            onChange={(e) => set('explanation', e.target.value)}
            rows={2}
            className="admin-input"
          />
        </Field>
        <Field label="Gợi ý (không bắt buộc)">
          <textarea
            value={draft.hint}
            onChange={(e) => set('hint', e.target.value)}
            rows={2}
            className="admin-input"
          />
        </Field>
      </div>

      {error && (
        <p
          className="rounded-xl p-2 text-base font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={save} className="btn btn-primary flex-1 text-base">
          {editing ? 'Lưu thay đổi' : 'Thêm câu này'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost px-5 text-base">
          Huỷ
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-bold opacity-70">{label}</span>
      {children}
    </label>
  )
}
