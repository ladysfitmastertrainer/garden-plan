/** Màn hình trận đấu: thanh máu, câu hỏi, phản hồi và tổng kết. */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SUBJECT_LABEL, VIRTUE_LABEL, type Subject, type Virtue } from '../../content/types'
import type { AnswerInput } from '../../engine/judge'
import { knownSpells, petsOf, resolveLoadout, usableSlots } from '../../engine/loadout'
import { levelFromTotalXp } from '../../engine/rewards'
import { useGame } from '../../store/game'
import { SpellPicker, TeamStrip } from './SpellPicker'
import { PixelBattle } from './PixelBattle'
import { DialogueBox } from '../../ui/DialogueBox'
import { QuestionView } from '../question/QuestionView'

const SUBJECT_COLOR: Record<Subject, string> = {
  math: 'var(--color-math)',
  vietnamese: 'var(--color-vietnamese)',
  music: 'var(--color-music)',
  ethics: 'var(--color-ethics)',
}

export function BattleScreen() {
  const battle = useGame((s) => s.battle)
  const subject = useGame((s) => s.battleSubject)
  const answer = useGame((s) => s.answer)
  const timeUp = useGame((s) => s.timeUp)
  const useHint = useGame((s) => s.useHint)
  const next = useGame((s) => s.next)
  const cast = useGame((s) => s.cast)
  const closeBattle = useGame((s) => s.closeBattle)
  const student = useGame((s) => s.student)
  const battleNode = useGame((s) => s.battleNode)

  const savedLoadout = useGame((s) => s.progress.loadout)
  const [submitted, setSubmitted] = useState<AnswerInput | null>(null)
  const finished = battle?.phase === 'victory' || battle?.phase === 'retreat'

  // Trận kết thúc thì chốt sổ ngay: cộng vàng, quay đồ rơi, lưu tiến độ. Việc
  // này xoá `battle` và đặt `summary`, nên màn tổng kết do trang cha hiển thị.
  useEffect(() => {
    if (finished) void closeBattle()
  }, [finished, closeBattle])

  if (!battle || !subject || finished) return null

  const accent = SUBJECT_COLOR[subject]
  const isEthics = subject === 'ethics'
  const inFeedback = battle.phase === 'feedback'
  // Pha chọn phép: câu hỏi khoá lại, trẻ đang quyết định tung phép nào.
  const inSpell = battle.phase === 'spell'

  const handleAnswer = (input: AnswerInput) => {
    if (battle.phase !== 'question') return
    setSubmitted(input)
    answer(input)
  }

  const handleNext = () => {
    setSubmitted(null)
    next()
  }

  // Bộ chiêu dùng trong trận này: chỉ những chiêu con ĐÃ HỌC ở cấp hiện tại,
  // cắt theo số ô, và tự lấp đầy nếu trẻ chưa sắp gì hoặc đội thú đã đổi.
  const known = knownSpells(petsOf(battle.team), levelFromTotalXp(student?.totalXp ?? 0).level)
  const loadout = resolveLoadout(
    savedLoadout,
    known,
    usableSlots(levelFromTotalXp(student?.totalXp ?? 0).level, known.length),
  )

  const judgement = battle.lastJudgement

  return (
    <div className="pixel-ui battle-layout mx-auto flex h-dvh max-w-3xl flex-col gap-3 px-3 py-3">
      {/* Cột trái khi máy nằm ngang: sân đấu và đội thú. Ở màn hình dọc thì đây
          chỉ là một khối xếp dọc bình thường. */}
      <div className="battle-stage">
      {/*
        Khung trận và bảng chọn phép nằm CHUNG một khối định vị: bảng phép phải
        đè lên khung trận, không được rơi xuống đáy trang.
      */}
      <div className="relative battle-arena">
        <PixelBattle
          battle={battle}
          subject={subject}
          avatar={student?.avatar ?? '🦊'}
          heroLevel={levelFromTotalXp(student?.totalXp ?? 0).level}
          // Cấp của quái lấy theo chặng trên bản đồ: đi càng xa gặp quái càng mạnh.
          enemyLevel={(battleNode?.index ?? 0) + (student?.grade ?? 1)}
        />

        <AnimatePresence>
          {inSpell && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-2"
              style={{ zIndex: 5, background: 'rgb(12 16 24 / 0.55)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SpellPicker battle={battle} loadout={loadout} onCast={cast} />
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          Phản hồi ĐÈ LÊN khung trận chứ không xếp xuống dưới.

          Xếp dưới thì mỗi lần trả lời xong trang lại dài thêm gần 200px, và trên
          điện thoại dọc nút "Tiếp tục" rơi hẳn ra ngoài màn hình - câu nào cũng
          phải vuốt xuống một lần. Ở màn hình ngang còn tệ hơn: nó chen vào lưới
          hai cột và bóp khung trận từ 260px xuống còn 45px.

          Đè lên thì hộp thoại nằm sát đáy khung trận - đúng chỗ game nhập vai
          thời đó đặt lời thoại - và không thêm một điểm ảnh chiều cao nào.
        */}
        <AnimatePresence>
          {inFeedback && judgement && (
            <motion.div
              className="absolute inset-0 flex items-end justify-center p-2"
              style={{ zIndex: 6, background: 'rgb(12 16 24 / 0.45)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="pixel-panel w-full"
                style={{
                  maxWidth: 560,
                  maxHeight: '100%',
                  overflowY: 'auto',
                  padding: '10px 14px',
                  background: judgement.correct ? 'var(--color-good-soft)' : 'var(--color-warn-soft)',
                  borderColor: judgement.correct ? 'var(--color-good)' : 'var(--color-warn)',
                }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.2 }}
                // Trình đọc màn hình đọc phần này ngay khi nó hiện ra, nếu không trẻ
                // khiếm thị sẽ không biết mình trả lời đúng hay sai.
                role="status"
                aria-live="polite"
              >
                <p className="text-xl font-extrabold leading-tight">
                  {feedbackHeadline(judgement.correct, isEthics, judgement.quality)}
                </p>
                <p className="mt-1 text-lg leading-snug">{judgement.message}</p>

                {judgement.virtues && judgement.virtues.length > 0 && judgement.quality === 'good' && (
                  <p className="mt-1 text-base font-bold" style={{ color: 'var(--color-good)' }}>
                    +1 {judgement.virtues.map((v: Virtue) => VIRTUE_LABEL[v]).join(', +1 ')}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  autoFocus
                  className="btn btn-primary mt-3 w-full text-xl"
                >
                  Tiếp tục →
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TeamStrip team={battle.team} activeIndex={battle.activeIndex} />
      </div>

      {/* Hộp thoại ở đáy màn hình - đúng chỗ game thời đó đặt lời thoại và lệnh.
          Máy nằm ngang thì nó là CỘT PHẢI và tự cuộn riêng. */}
      <div className="pixel-panel battle-ask">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="pixel-font text-lg uppercase" style={{ color: accent }}>
            {SUBJECT_LABEL[subject]}
          </p>
          <TurnPips current={battle.questionsAsked} total={battle.maxQuestions} color={accent} />
        </div>

        {battle.timeLimitMs !== null && (
          <BattleTimer
            limitMs={battle.timeLimitMs}
            startedAt={battle.questionShownAt}
            // Đồng hồ chỉ chạy lúc trẻ đang được trả lời. Ở pha chọn phép và pha
            // phản hồi thì nó đứng im - trẻ đang xem con thú tung phép, không
            // được tính vào thời gian suy nghĩ.
            running={battle.phase === 'question'}
            onExpire={timeUp}
          />
        )}
        <p className="battle-prompt mb-5 whitespace-pre-line text-2xl font-bold leading-snug">
          {battle.question?.prompt}
        </p>

        {battle.question?.media?.image && (
          <p className="mb-4 text-center text-5xl">{battle.question.media.image}</p>
        )}

        {battle.question && (
          <QuestionView
            question={battle.question}
            onAnswer={handleAnswer}
            disabled={inFeedback || inSpell}
            submitted={submitted}
          />
        )}

        {!inFeedback && battle.question?.hint && (
          <div className="mt-4 text-center">
            {battle.hintUsed ? (
              <p className="rounded-xl p-3 text-base" style={{ background: 'var(--color-brand-soft)' }}>
                💡 {battle.question.hint}
              </p>
            ) : (
              <button type="button" onClick={useHint} className="text-base font-bold underline opacity-70">
                💡 Cho con một gợi ý
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

/**
 * Đồng hồ đếm ngược, chỉ có ở trận trùm và trận đầu đàn.
 *
 * Hết giờ tính như một câu sai: quái đánh trả và chuỗi combo đứt. Nhờ vậy con
 * trùm đòi trẻ phải THẠO bài chứ không phải ngồi dò từng đáp án tới khi trúng -
 * mà đó mới là thứ cần kiểm tra ở cuối một vùng đất.
 *
 * Thanh chạy bằng CSS, React chỉ giữ CON SỐ GIÂY. Nếu đẩy cả thanh qua state thì
 * màn trận đấu vẽ lại 60 lần một giây.
 */
function BattleTimer({
  limitMs,
  startedAt,
  running,
  onExpire,
}: {
  limitMs: number
  startedAt: number
  running: boolean
  onExpire: () => void
}) {
  const [leftMs, setLeftMs] = useState(() => Math.max(0, limitMs - (Date.now() - startedAt)))

  useEffect(() => {
    if (!running) return

    const remaining = Math.max(0, limitMs - (Date.now() - startedAt))
    setLeftMs(remaining)
    if (remaining === 0) {
      onExpire()
      return
    }

    const expire = window.setTimeout(onExpire, remaining)
    const tick = window.setInterval(() => {
      setLeftMs((prev) => {
        const next = Math.max(0, limitMs - (Date.now() - startedAt))
        // Chỉ đổi state khi con số giây hiển thị thật sự đổi.
        return Math.ceil(next / 1000) === Math.ceil(prev / 1000) ? prev : next
      })
    }, 200)

    return () => {
      window.clearTimeout(expire)
      window.clearInterval(tick)
    }
  }, [limitMs, startedAt, running, onExpire])

  // Mười giây cuối chuyển đỏ: trẻ tiểu học bắt màu nhanh hơn bắt con số.
  const urgent = leftMs <= 10_000
  const color = urgent ? '#e0483e' : '#2f7d32'

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="pixel-font text-lg" style={{ color }}>
          ⏱ {Math.ceil(leftMs / 1000)}s
        </span>
        <span className="pixel-font text-base opacity-70">Trận này có đếm giờ!</span>
      </div>
      <div
        className="h-3 overflow-hidden"
        style={{ background: '#5a6472', border: '2px solid #1b2432', borderRadius: 3 }}
      >
        <div
          // Câu mới là một thanh mới: dựng lại phần tử để hoạt cảnh chạy từ đầu.
          key={startedAt}
          className="h-full"
          style={{
            background: color,
            transformOrigin: 'left',
            animation: running ? `battle-timer ${limitMs}ms linear forwards` : 'none',
            transform: running ? undefined : `scaleX(${leftMs / limitMs})`,
          }}
        />
      </div>
    </div>
  )
}

/**
 * Lời mở đầu phản hồi. Với môn Đạo đức tuyệt đối không dùng chữ "Sai" - lựa
 * chọn chưa tốt vẫn là một suy nghĩ của trẻ, cần được dẫn dắt chứ không gạch bỏ.
 */
function feedbackHeadline(correct: boolean, isEthics: boolean, quality?: string): string {
  if (isEthics) {
    if (quality === 'good') return '🌟 Lựa chọn rất tốt!'
    if (quality === 'ok') return '👍 Cũng được đấy'
    return '💭 Cùng nghĩ lại nhé'
  }
  return correct ? '✅ Chính xác!' : '📘 Chưa đúng, con xem nhé'
}

/**
 * Số lượt còn lại dạng chấm tròn thay vì chữ "Câu 3/10".
 * Trẻ lớp 1 đếm chấm nhanh hơn đọc phân số.
 */
function TurnPips({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Câu ${current} trên ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: i < current ? 10 : 8,
            height: i < current ? 10 : 8,
            background: i < current ? color : 'var(--color-paper-sunk)',
            border: i === current - 1 ? '2px solid rgba(0,0,0,.25)' : undefined,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

/**
 * Màn tổng kết sau trận.
 * Rút lui KHÔNG được trình bày như một thất bại: không có chữ "thua", không có
 * màu đỏ, và phần thưởng vẫn được liệt kê đầy đủ.
 */
export function BattleSummaryScreen({ onDone }: { onDone: () => void }) {
  const summary = useGame((s) => s.summary)
  const retry = useGame((s) => s.retryLastFight)
  if (!summary) return null

  const { victory } = summary

  return (
    <div className="pixel-ui summary-layout mx-auto flex h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 py-6 text-center">
      <motion.p
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        className="summary-cheer text-7xl"
      >
        {victory ? '🏆' : '🏡'}
      </motion.p>
      <h2 className="summary-title pixel-font text-3xl">
        {victory ? 'CON ĐÃ CHIẾN THẮNG!' : 'CON VỀ LÀNG NGHỈ NGƠI'}
      </h2>

      <DialogueBox
        className="summary-say"
        text={
          victory
            ? 'Tuyệt vời! Phần thưởng đã vào túi của con.'
            : summary.missedSkills.length > 0
              ? `Không sao cả. Vàng và kinh nghiệm con kiếm được vẫn giữ nguyên.
Lần này con còn vướng ở: ${summary.missedSkills.join(', ')}.`
              : 'Không sao cả. Toàn bộ vàng và kinh nghiệm con kiếm được vẫn được giữ nguyên.'
        }
      />

      {/* Bảng phần thưởng là thứ DÀI RA được: thắng đậm thì có thêm dòng đồ
          rơi, dòng thu phục thú, mỗi con tiến hoá một dòng. Cho RIÊNG nó cuộn,
          để nút "Về bản đồ" luôn nằm nguyên chỗ cũ trong tầm mắt. */}
      <div className="summary-stats pixel-panel grid w-full gap-2 text-left text-lg">
        <Row label="🪙 Vàng nhận được" value={`+${summary.goldEarned}`} />
        <Row label="⭐ Kinh nghiệm" value={`+${summary.xpEarned}`} />
        <Row label="🎯 Trả lời đúng" value={`${Math.round(summary.accuracy * 100)}%`} />
        <Row label="🔥 Chuỗi dài nhất" value={String(summary.bestCombo)} />
        {summary.bonuses.map((bonus) => (
          <Row key={bonus.label} label={`🎁 ${bonus.label}`} value={`+${bonus.gold} vàng`} />
        ))}
        {summary.loot && <Row label={`${summary.loot.emoji} Nhặt được`} value={summary.loot.name} />}
        {summary.petCaught && (
          <Row label="🐾 Thu phục được" value={`${summary.petCaught.name} đã gia nhập đội!`} />
        )}
        <Row label="🐾 Thú nhận được" value={`+${summary.petXpGained} kinh nghiệm mỗi con`} />
        {summary.petsEvolved.map((evo) => (
          <Row
            key={evo.to}
            label="🌟 TIẾN HOÁ"
            value={`${evo.from} đã tiến hoá thành ${evo.to}!`}
          />
        ))}
        {summary.leveledUp && <Row label="🎉 Lên cấp!" value={`Cấp ${summary.newLevel}`} />}
      </div>

      {/*
        Thua thì nút ĐÁNH LẠI đứng trước, và nó là nút chính.

        Hình phạt nặng nhất trong cả game này không phải mất vàng - mà là bắt trẻ
        đi bộ ngược lại chỗ con quái. Đủ để một đứa bé tám tuổi bỏ máy xuống. Con
        quái vẫn còn đó trên bản đồ, nhưng đánh lại được ngay từ đây thì thua chỉ
        còn là "thử lại một lần nữa", không phải "làm lại từ đầu".

        Thắng thì không hiện nút này: đánh lại một chặng vừa xong là đi ngược.
      */}
      <div className="summary-go grid w-full gap-2">
        {!victory && summary.canRetry && (
          <button type="button" onClick={retry} className="btn btn-primary w-full text-xl">
            ⚔️ Đánh lại ngay
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className={`btn w-full text-xl ${victory || !summary.canRetry ? 'btn-primary' : 'btn-ghost'}`}
        >
          Về bản đồ
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="font-extrabold">{value}</span>
    </div>
  )
}
