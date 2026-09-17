/**
 * Màn đấu tay đôi với một bạn cùng lớp.
 *
 * KHÁC HẲN trận đánh quái, và cố ý khác: ở đây KHÔNG có bước chọn phép.
 *
 * Trận đánh quái đặt câu hỏi "đánh bằng phép nào" - một quyết định có suy tính,
 * cần thời gian, và cần con quái đứng yên chờ. Trận PVP đặt một câu hỏi khác
 * hẳn: "con có chắc bài tới mức bấm được ngay không". Nhét bảng chọn phép vào
 * giữa thì cái đồng hồ chung của hai bên mất hết ý nghĩa - người trả lời trước
 * lại thành người phải chờ lâu nhất.
 *
 * Nên ở đây cả quyết định nằm gọn trong một nhịp: đọc, chắc, bấm. Đội thú vẫn
 * có mặt - máu và sức đánh lấy từ đội (xem `pvp-setup.ts`) - nhưng chúng là cái
 * trẻ ĐÃ CÓ, còn cái quyết định trận đấu là cái trẻ vừa LÀM.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SUBJECT_LABEL, type Subject } from '../../content/types'
import { asQuestion, pvpTimeLimitMs, sidesOf, type PvpEvent, type PvpMatch } from '../../data/pvp-types'
import { judge, type AnswerInput } from '../../engine/judge'
import { usePvp } from '../../store/pvp'
import { useGame } from '../../store/game'
import { QuestionView } from '../question/QuestionView'
import { playEffect } from '../../audio/synth'

const SUBJECT_COLOR: Record<Subject, string> = {
  math: 'var(--color-math)',
  vietnamese: 'var(--color-vietnamese)',
  music: 'var(--color-music)',
  ethics: 'var(--color-ethics)',
}

export function PvpScreen() {
  const match = usePvp((s) => s.match)
  const student = useGame((s) => s.student)
  if (!match || !student) return null
  if (match.status === 'pending') return null

  const sides = sidesOf(match, student.id)
  if (!sides) return null

  return match.status === 'active' ? (
    <Duel match={match} studentId={student.id} />
  ) : (
    <Result match={match} studentId={student.id} />
  )
}

// --- Đang đánh -----------------------------------------------------------------

function Duel({ match, studentId }: { match: PvpMatch; studentId: string }) {
  const answered = usePvp((s) => s.answered)
  const buzz = usePvp((s) => s.buzz)
  const leave = usePvp((s) => s.leave)

  const sides = sidesOf(match, studentId)!
  const accent = SUBJECT_COLOR[match.subject]
  const question = useMemo(
    () => (match.questions[match.round] ? asQuestion(match.questions[match.round]!) : null),
    [match.questions, match.round],
  )

  const [submitted, setSubmitted] = useState<AnswerInput | null>(null)
  useEffect(() => setSubmitted(null), [match.round])

  /*
    Chớp kết quả của vòng vừa xong.

    Không có nó thì màn hình nhảy thẳng sang câu tiếp theo, và trẻ không bao giờ
    biết mình vừa thắng hay thua lượt bấm - máu hai bên thì đổi, nhưng đổi lúc
    nào và vì sao thì không ai nói. Chính cái khoảnh khắc "ai nhanh hơn" là thứ
    đáng xem nhất của chế độ này.
  */
  const lastEvent = match.events[match.events.length - 1] ?? null
  const [flash, setFlash] = useState<PvpEvent | null>(null)
  useEffect(() => {
    if (!lastEvent) return
    setFlash(lastEvent)
    playEffect(lastEvent.attackerId === studentId ? 'correct' : 'wrong')
    const timer = window.setTimeout(() => setFlash(null), 1_400)
    return () => window.clearTimeout(timer)
  }, [match.events.length, lastEvent, studentId])

  const send = (correct: boolean) => {
    if (!answered) void buzz(studentId, correct)
  }

  const onAnswer = (input: AnswerInput) => {
    if (!question || answered) return
    setSubmitted(input)
    // Chấm NGAY trên máy này rồi chỉ gửi lên đúng/sai. Gửi cả đáp án để máy chủ
    // chấm thì mỗi lượt bấm phải chờ thêm một vòng mạng trước khi thứ tự được
    // chốt - mà thứ tự chính là thứ đang tranh nhau.
    send(judge(question, input).correct)
  }

  return (
    <div className="pixel-ui mx-auto flex h-dvh max-w-3xl flex-col gap-3 px-3 py-3">
      <header className="pixel-panel grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="pixel-font text-lg uppercase" style={{ color: accent }}>
            ⚔️ {SUBJECT_LABEL[match.subject]} lớp {match.grade}
          </p>
          <p className="pixel-font text-lg opacity-70">
            Câu {Math.min(match.round + 1, match.questions.length)}/{match.questions.length}
          </p>
        </div>

        <div className="grid gap-1">
          <Fighter side={sides.me} mine />
          <Fighter side={sides.foe} mine={false} waiting={!match.buzzed.includes(sides.foe.studentId)} />
        </div>
      </header>

      <div className="pixel-panel relative flex-1 overflow-y-auto">
        <RoundTimer
          key={match.round}
          startedAt={match.roundStartedAt}
          limitMs={pvpTimeLimitMs(match.grade)}
          running={!answered}
          onExpire={() => send(false)}
          color={accent}
        />

        {question && (
          <>
            <p className="mb-4 whitespace-pre-line text-2xl font-bold leading-snug">
              {question.prompt}
            </p>
            <QuestionView
              question={question}
              onAnswer={onAnswer}
              disabled={answered}
              submitted={submitted}
            />
          </>
        )}

        {/* Đã bấm xong nhưng bạn kia chưa: đè lên câu hỏi để trẻ không ngồi bấm
            tiếp vào những đáp án đã khoá và tưởng máy treo. */}
        <AnimatePresence>
          {answered && !flash && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4 text-center"
              style={{ background: 'rgb(12 16 24 / 0.6)', zIndex: 5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="pixel-font text-2xl" style={{ color: '#fff' }}>
                Đã trả lời! Chờ {sides.foe.name}...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {flash && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-4"
              style={{ background: 'rgb(12 16 24 / 0.7)', zIndex: 6 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="pixel-panel text-center"
                style={{ padding: '14px 20px' }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <p className="pixel-font text-3xl leading-tight">{flashTitle(flash, studentId)}</p>
                <p className="mt-1 text-lg leading-snug">{flashLine(flash, studentId, sides.foe.name)}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => void leave(studentId)}
        className="btn btn-ghost w-full text-base"
      >
        Bỏ trận này
      </button>
    </div>
  )
}

function flashTitle(event: PvpEvent, studentId: string): string {
  if (!event.attackerId) return '😬 Cả hai cùng trượt!'
  return event.attackerId === studentId ? '⚡ Con nhanh hơn!' : '💥 Bạn ấy nhanh hơn!'
}

function flashLine(event: PvpEvent, studentId: string, foeName: string): string {
  if (!event.attackerId) {
    return 'Không ai trả lời đúng, nên lượt này không ai mất máu.'
  }
  const mine = event.attackerId === studentId
  // Trường hợp đáng nói nhất: người bấm trước lại là người bấm sai. Nói ra thì
  // trẻ học được rằng nhanh mà ẩu thì mất lượt - bài học chính của chế độ này.
  const stolen = event.firstId !== null && event.firstId !== event.attackerId
  const who = mine ? 'Con' : foeName
  const damage = `${who} tung một đòn ${event.damage} sát thương!`
  return stolen ? `Người bấm trước trả lời sai. ${damage}` : damage
}

// --- Hai đấu thủ ---------------------------------------------------------------

function Fighter({
  side,
  mine,
  waiting,
}: {
  side: { name: string; avatar: string; hp: number; maxHp: number }
  mine: boolean
  waiting?: boolean
}) {
  const ratio = side.maxHp === 0 ? 0 : Math.max(0, side.hp) / side.maxHp
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{side.avatar}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-base font-bold leading-tight">
            {mine ? `${side.name} (con)` : side.name}
          </span>
          <span className="pixel-font text-base opacity-70">
            {Math.max(0, side.hp)}/{side.maxHp}
            {waiting === false && ' ✓'}
          </span>
        </span>
        <span
          className="mt-1 block h-3 overflow-hidden"
          style={{ background: '#5a6472', border: '2px solid #1b2432', borderRadius: 3 }}
        >
          <span
            className="block h-full"
            style={{
              width: `${ratio * 100}%`,
              background: ratio > 0.5 ? '#4caf50' : ratio > 0.2 ? '#f0c419' : '#e2584d',
              transition: 'width 0.3s',
            }}
          />
        </span>
      </span>
    </div>
  )
}

// --- Đồng hồ -------------------------------------------------------------------

/**
 * Thanh đếm giờ của một vòng.
 *
 * Đếm từ `roundStartedAt` - mốc của MÁY CHỦ - chứ không từ lúc component hiện
 * ra. Hai máy nhận được vòng mới lệch nhau vài trăm mili giây, và đếm từ lúc
 * mình thấy thì máy nào nhận chậm hơn lại được nhiều giờ hơn.
 */
function RoundTimer({
  startedAt,
  limitMs,
  running,
  onExpire,
  color,
}: {
  startedAt: number
  limitMs: number
  running: boolean
  onExpire: () => void
  color: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [running])

  const left = Math.max(0, startedAt + limitMs - now)
  const ratio = limitMs === 0 ? 0 : left / limitMs

  useEffect(() => {
    if (running && left === 0) onExpire()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, left === 0])

  return (
    <div className="mb-3 grid gap-1">
      <div
        className="h-4 overflow-hidden"
        style={{ background: '#5a6472', border: '3px solid #1b2432', borderRadius: 4 }}
        role="img"
        aria-label={`Còn ${Math.ceil(left / 1000)} giây`}
      >
        <div
          className="h-full"
          style={{
            width: `${ratio * 100}%`,
            background: ratio > 0.4 ? color : ratio > 0.15 ? '#f0c419' : '#e2584d',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
      <p className="pixel-font text-right text-base opacity-70">{Math.ceil(left / 1000)}s</p>
    </div>
  )
}

// --- Kết quả -------------------------------------------------------------------

function Result({ match, studentId }: { match: PvpMatch; studentId: string }) {
  const dismiss = usePvp((s) => s.dismiss)
  const sides = sidesOf(match, studentId)!
  const won = match.winnerId === studentId
  const draw = match.winnerId === null && match.status === 'finished'

  const headline = draw
    ? '🤝 Hoà!'
    : won
      ? '🏆 Con thắng!'
      : match.status === 'abandoned'
        ? '🚪 Trận đấu dừng giữa chừng'
        : '💪 Bạn ấy thắng lượt này'

  return (
    <div className="pixel-ui mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4 py-6">
      <div className="pixel-panel grid gap-3 text-center">
        <h2 className="pixel-font text-3xl leading-tight">{headline}</h2>

        <div className="grid gap-2">
          <Fighter side={sides.me} mine />
          <Fighter side={sides.foe} mine={false} />
        </div>

        {/*
          Lời nhắn cho người thua phải nói về TRẬN SAU, không về trận vừa rồi.
          Một đứa bé vừa thua bạn ngồi ngay cạnh mình không cần nghe phân tích;
          nó cần biết lần sau vẫn còn cơ hội.
        */}
        <p className="text-lg leading-snug">
          {draw
            ? 'Hai con ngang sức ngang tài! Đấu lại một trận nữa xem sao.'
            : won
              ? `Con trả lời đúng nhanh hơn ${sides.foe.name}. Giỏi lắm!`
              : 'Lần sau đọc đề xong là bấm luôn nhé - thuộc bài thì tay nhanh hơn.'}
        </p>

        <button type="button" onClick={dismiss} className="btn btn-primary w-full text-xl">
          Về bản đồ
        </button>
      </div>
    </div>
  )
}
