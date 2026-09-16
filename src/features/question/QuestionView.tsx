/**
 * Hiển thị câu hỏi và thu câu trả lời.
 *
 * Một component cho mỗi thể loại, cùng chung giao kèo: nhận `question`, gọi
 * `onAnswer` đúng một lần khi trẻ chốt đáp án. Component KHÔNG tự chấm - việc
 * chấm nằm ở `engine/judge.ts`.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  AudioChoiceQuestion,
  DragOrderQuestion,
  MatchPairsQuestion,
  MultipleChoiceQuestion,
  NumericQuestion,
  Question,
  RhythmTapQuestion,
  ScenarioQuestion,
  TextQuestion,
} from '../../content/types'
import type { AnswerInput } from '../../engine/judge'
import { playAudio, playEffect } from '../../audio/synth'

interface Props {
  question: Question
  onAnswer: (input: AnswerInput) => void
  /** Khoá mọi tương tác khi đang hiện màn phản hồi. */
  disabled: boolean
  /** Đáp án trẻ vừa chọn, để tô màu ở màn phản hồi. */
  submitted: AnswerInput | null
}

export function QuestionView(props: Props) {
  const { question } = props
  switch (question.type) {
    case 'multiple-choice':
      return <ChoiceQuestion {...props} question={question} />
    case 'audio-choice':
      return <AudioQuestion {...props} question={question} />
    case 'numeric-input':
      return <NumericInput {...props} question={question} />
    case 'text-input':
      return <TextInput {...props} question={question} />
    case 'drag-order':
      return <OrderQuestion {...props} question={question} />
    case 'match-pairs':
      return <PairsQuestion {...props} question={question} />
    case 'rhythm-tap':
      return <RhythmQuestion {...props} question={question} />
    case 'scenario':
      return <Scenario {...props} question={question} />
  }
}

// --- Trắc nghiệm -------------------------------------------------------------

function ChoiceQuestion({
  question,
  onAnswer,
  disabled,
  submitted,
}: Props & { question: MultipleChoiceQuestion }) {
  const chosenId = submitted?.kind === 'choice' ? submitted.choiceId : null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {question.choices.map((choice) => {
        const isChosen = chosenId === choice.id
        const isAnswer = choice.id === question.answer.choiceId
        return (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer({ kind: 'choice', choiceId: choice.id })}
            className={[
              'choice',
              // Ở màn phản hồi luôn tô xanh đáp án đúng, kể cả khi trẻ chọn sai -
              // trẻ phải thấy đáp án đúng là gì chứ không chỉ biết mình sai.
              disabled && isAnswer ? 'choice-correct' : '',
              disabled && isChosen && !isAnswer ? 'choice-poor' : '',
              !disabled && isChosen ? 'choice-selected' : '',
            ].join(' ')}
          >
            {choice.image && <span className="text-3xl leading-none">{choice.image}</span>}
            <span className="text-lg">{choice.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// --- Nghe nhạc rồi chọn ------------------------------------------------------

function AudioQuestion({
  question,
  onAnswer,
  disabled,
  submitted,
}: Props & { question: AudioChoiceQuestion }) {
  const [playing, setPlaying] = useState(false)
  const played = useRef(false)

  const playClip = () => {
    if (playing) return
    setPlaying(true)
    const ms = playAudio(question.audio)
    played.current = true
    window.setTimeout(() => setPlaying(false), ms + 300)
  }

  // Tự phát một lần khi câu hỏi hiện ra để trẻ không phải mò nút.
  useEffect(() => {
    played.current = false
    const timer = window.setTimeout(playClip, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  const chosenId = submitted?.kind === 'choice' ? submitted.choiceId : null

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={playClip}
        disabled={playing}
        className="btn btn-primary mx-auto w-full max-w-sm text-xl"
      >
        {playing ? '🔊 Đang phát...' : '▶️ Nghe lại'}
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.choices.map((choice) => {
          const isChosen = chosenId === choice.id
          const isAnswer = choice.id === question.answer.choiceId
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer({ kind: 'choice', choiceId: choice.id })}
              className={[
                'choice',
                disabled && isAnswer ? 'choice-correct' : '',
                disabled && isChosen && !isAnswer ? 'choice-poor' : '',
                !disabled && isChosen ? 'choice-selected' : '',
              ].join(' ')}
            >
              <span className="text-lg">{choice.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Nhập số ------------------------------------------------------------------

function NumericInput({ question, onAnswer, disabled }: Props & { question: NumericQuestion }) {
  const [value, setValue] = useState('')

  useEffect(() => setValue(''), [question.id])

  const parsed = Number(value.replace(',', '.'))
  const canSubmit = value.trim() !== '' && Number.isFinite(parsed)

  return (
    <form
      className="grid justify-items-center gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit && !disabled) onAnswer({ kind: 'numeric', value: parsed })
      }}
    >
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          placeholder="?"
          aria-label="Nhập đáp án"
          className="w-44 rounded-2xl border-4 bg-white px-4 py-3 text-center text-4xl font-extrabold outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
        />
        {question.unit && <span className="text-2xl font-bold">{question.unit}</span>}
      </div>
      <button type="submit" disabled={disabled || !canSubmit} className="btn btn-primary w-full max-w-sm text-xl">
        Trả lời
      </button>
    </form>
  )
}

// --- Nhập chữ ------------------------------------------------------------------

function TextInput({ question, onAnswer, disabled }: Props & { question: TextQuestion }) {
  const [value, setValue] = useState('')

  useEffect(() => setValue(''), [question.id])

  return (
    <form
      className="grid justify-items-center gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (value.trim() && !disabled) onAnswer({ kind: 'text', value })
      }}
    >
      <input
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Viết câu trả lời..."
        aria-label="Nhập đáp án"
        className="w-full max-w-md rounded-2xl border-4 bg-white px-4 py-3 text-center text-2xl font-bold outline-none"
        style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
      />
      <button type="submit" disabled={disabled || !value.trim()} className="btn btn-primary w-full max-w-sm text-xl">
        Trả lời
      </button>
    </form>
  )
}

// --- Sắp xếp thứ tự -------------------------------------------------------------

/**
 * Sắp xếp bằng cách CHẠM chứ không kéo thả: chạm để đưa vào hàng, chạm lại để
 * gỡ ra. Kéo thả trên tablet với ngón tay trẻ rất dễ hỏng thao tác.
 */
function OrderQuestion({ question, onAnswer, disabled }: Props & { question: DragOrderQuestion }) {
  const [picked, setPicked] = useState<string[]>([])

  useEffect(() => setPicked([]), [question.id])

  const remaining = question.choices.filter((c) => !picked.includes(c.id))
  const labelOf = (id: string) => question.choices.find((c) => c.id === id)?.label ?? ''

  return (
    <div className="grid gap-4">
      <div
        className="flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-2xl border-4 border-dashed p-3"
        style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
      >
        {picked.length === 0 && <span className="opacity-50">Chạm vào các từ bên dưới theo đúng thứ tự</span>}
        {picked.map((id, position) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => setPicked(picked.filter((_, i) => i !== position))}
            className="rounded-xl px-4 py-2 text-lg font-bold text-white"
            style={{ background: 'var(--color-brand)' }}
          >
            {labelOf(id)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => setPicked([...picked, choice.id])}
            className="rounded-xl border-4 bg-white px-4 py-2 text-lg font-bold"
            style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
          >
            {choice.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || picked.length !== question.choices.length}
        onClick={() => onAnswer({ kind: 'order', orderedIds: picked })}
        className="btn btn-primary mx-auto w-full max-w-sm text-xl"
      >
        Trả lời
      </button>
    </div>
  )
}

// --- Nối cặp ---------------------------------------------------------------------

function PairsQuestion({ question, onAnswer, disabled }: Props & { question: MatchPairsQuestion }) {
  const [activeLeft, setActiveLeft] = useState<string | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    setActiveLeft(null)
    setLinks({})
  }, [question.id])

  const rightToLeft = useMemo(() => {
    const map: Record<string, string> = {}
    for (const [leftId, rightId] of Object.entries(links)) map[rightId] = leftId
    return map
  }, [links])

  const linkRight = (rightId: string) => {
    if (!activeLeft) return
    const next = { ...links }
    // Một vế phải chỉ nối được với một vế trái - gỡ liên kết cũ nếu có.
    const previousLeft = rightToLeft[rightId]
    if (previousLeft) delete next[previousLeft]
    next[activeLeft] = rightId
    setLinks(next)
    setActiveLeft(null)
    playEffect('tap')
  }

  const labelOfRight = (rightId: string) => question.right.find((c) => c.id === rightId)?.label ?? ''
  const complete = Object.keys(links).length === question.left.length

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {question.left.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveLeft(activeLeft === item.id ? null : item.id)}
              className={['choice', activeLeft === item.id ? 'choice-selected' : '', links[item.id] ? 'choice-correct' : ''].join(' ')}
            >
              <span className="flex-1">{item.label}</span>
              {links[item.id] && <span className="text-sm opacity-70">→ {labelOfRight(links[item.id]!)}</span>}
            </button>
          ))}
        </div>
        <div className="grid gap-2">
          {question.right.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled || !activeLeft}
              onClick={() => linkRight(item.id)}
              className={['choice', rightToLeft[item.id] ? 'choice-correct' : ''].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm opacity-70">
        {activeLeft ? 'Bây giờ chạm vào ô bên phải tương ứng' : 'Chạm một ô bên trái trước'}
      </p>

      <button
        type="button"
        disabled={disabled || !complete}
        onClick={() =>
          onAnswer({
            kind: 'pairs',
            pairs: Object.entries(links).map(([leftId, rightId]) => ({ leftId, rightId })),
          })
        }
        className="btn btn-primary mx-auto w-full max-w-sm text-xl"
      >
        Trả lời
      </button>
    </div>
  )
}

// --- Gõ nhịp ------------------------------------------------------------------------

function RhythmQuestion({ question, onAnswer, disabled }: Props & { question: RhythmTapQuestion }) {
  const [taps, setTaps] = useState<number[]>([])
  const startedAt = useRef<number | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setTaps([])
    startedAt.current = null
  }, [question.id])

  const listen = () => {
    if (playing) return
    setPlaying(true)
    setTaps([])
    startedAt.current = null
    const ms = playAudio(question.audio)
    window.setTimeout(() => setPlaying(false), ms + 300)
  }

  const tap = () => {
    if (disabled || playing) return
    const now = performance.now()
    startedAt.current ??= now
    setTaps([...taps, now - startedAt.current])
    playEffect('tap')
  }

  const expected = question.audio.pattern.length

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={listen} disabled={playing} className="btn btn-ghost">
          {playing ? '🔊 Đang phát...' : '▶️ Nghe lại'}
        </button>
        <button
          type="button"
          onClick={() => {
            setTaps([])
            startedAt.current = null
          }}
          disabled={disabled || taps.length === 0}
          className="btn btn-ghost"
        >
          ↺ Gõ lại
        </button>
      </div>

      <button
        type="button"
        onClick={tap}
        disabled={disabled || playing}
        className="mx-auto flex h-44 w-44 items-center justify-center rounded-full text-6xl text-white active:scale-95"
        style={{ background: 'var(--color-music)', boxShadow: '0 8px 0 0 rgb(0 0 0 / 0.2)' }}
        aria-label="Chạm để gõ nhịp"
      >
        🥁
      </button>

      <p className="text-center text-lg font-bold">
        Đã gõ {taps.length} / {expected} tiếng
      </p>

      <button
        type="button"
        disabled={disabled || taps.length !== expected}
        onClick={() => onAnswer({ kind: 'rhythm', timestampsMs: taps })}
        className="btn btn-primary mx-auto w-full max-w-sm text-xl"
      >
        Trả lời
      </button>
    </div>
  )
}

// --- Tình huống Đạo đức ----------------------------------------------------------------

/**
 * Khác mọi thể loại còn lại: KHÔNG tô đỏ, không có "đáp án đúng" được đánh dấu.
 * Lựa chọn tốt tô xanh, lựa chọn chưa tốt tô cam ấm - là gợi ý suy nghĩ lại chứ
 * không phải dấu gạch sai.
 */
function Scenario({ question, onAnswer, disabled, submitted }: Props & { question: ScenarioQuestion }) {
  const chosenId = submitted?.kind === 'choice' ? submitted.choiceId : null

  return (
    <div className="grid gap-3">
      {question.options.map((option) => {
        const isChosen = chosenId === option.id
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer({ kind: 'choice', choiceId: option.id })}
            className={[
              'choice',
              disabled && isChosen && option.quality === 'good' ? 'choice-correct' : '',
              disabled && isChosen && option.quality === 'ok' ? 'choice-selected' : '',
              disabled && isChosen && option.quality === 'poor' ? 'choice-poor' : '',
            ].join(' ')}
          >
            <span className="text-lg leading-snug">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

