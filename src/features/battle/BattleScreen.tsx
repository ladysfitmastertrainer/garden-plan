/** Màn hình trận đấu: thanh máu, câu hỏi, phản hồi và tổng kết. */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SUBJECT_LABEL, VIRTUE_LABEL, type Subject, type Virtue } from '../../content/types'
import type { AnswerInput } from '../../engine/judge'
import { equippedSpells } from '../../engine/loadout'
import { levelFromTotalXp } from '../../engine/rewards'
import { useGame } from '../../store/game'
import { SpellPicker, PetStrip } from './SpellPicker'
import { PixelBattle } from './PixelBattle'
import { DialogueBox } from '../../ui/DialogueBox'
import { QuestionView } from '../question/QuestionView'
import { questionLimitMs } from '../../engine/battle'

/**
 * Nhịp cảnh báo dài bao lâu, mili giây.
 *
 * Đủ để đọc hết một dòng sáu chữ và hiểu ra chuyện gì sắp xảy ra, chưa đủ để
 * sốt ruột. Ngắn hơn thì nó chỉ là một cái chớp; dài hơn thì mỗi vòng đấu có
 * một quãng chết, mà một trận có tới mười vòng.
 */
const WARNING_MS = 1_500

/**
 * Đòn đánh diễn ra trong bao lâu trước khi BẢNG GIẢI THÍCH hiện ra.
 *
 * Khớp với hoạt cảnh trong `PixelBattle`: khung trận rung, số sát thương bay
 * lên, nhãn "Khắc chế!" nảy ra, thanh máu tụt xuống.
 *
 * Cả cái bảng chờ, không phải riêng cái nút. Bản trước chỉ hoãn cái nút, và
 * như thế vẫn sai thứ tự: bảng giải thích đã che mất nửa dưới sân đấu ngay từ
 * lúc đòn đánh còn đang bay, nên thứ trẻ nhìn thấy là một bảng chữ hiện ra
 * trước khi hiểu vì sao. Đánh xong, máu tụt xong, RỒI mới tới lời giải thích.
 */
const HIT_MS = 1_100

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
  const attack = useGame((s) => s.attack)
  const defend = useGame((s) => s.defend)
  const timeUp = useGame((s) => s.timeUp)
  const useHint = useGame((s) => s.useHint)
  const next = useGame((s) => s.next)
  const cast = useGame((s) => s.cast)
  const closeBattle = useGame((s) => s.closeBattle)
  const student = useGame((s) => s.student)
  const battleNode = useGame((s) => s.battleNode)

  const savedLoadout = useGame((s) => s.progress.petLoadout)
  const petXp = useGame((s) => s.progress.petXp)
  const [submitted, setSubmitted] = useState<AnswerInput | null>(null)
  const finished = battle?.phase === 'victory' || battle?.phase === 'retreat'

  // Trận kết thúc thì chốt sổ ngay: cộng vàng, quay đồ rơi, lưu tiến độ. Việc
  // này xoá `battle` và đặt `summary`, nên màn tổng kết do trang cha hiển thị.
  useEffect(() => {
    if (finished) void closeBattle()
  }, [finished, closeBattle])

  /*
    Nhịp cảnh báo TỰ HẾT, không đợi trẻ bấm.

    Đây là lượt của QUÁI. Bắt trẻ bấm một nút để con quái được phép đánh mình
    thì vừa vô lý vừa thêm một cú chạm vào mỗi vòng - mà một trận có tới mười
    vòng. Trẻ không mất gì vì chờ: đồng hồ đỡ đòn chỉ bắt đầu chạy khi câu hỏi
    hiện ra, tức là sau nhịp này.
  */
  const warning = battle?.phase === 'warning'
  /**
   * Đòn đánh đã diễn xong chưa - quyết định lúc nào nút "Tiếp tục" hiện ra.
   *
   * Đếm lại từ đầu ở mỗi lần vào pha phản hồi: `feedbackTurn` đổi giá trị theo
   * số câu đã trả lời, nên hai lượt liên tiếp không dùng chung một lần đếm.
   */
  const [hitDone, setHitDone] = useState(false)
  const feedbackTurn = battle?.phase === 'feedback' ? battle.answers.length : -1

  useEffect(() => {
    if (feedbackTurn < 0) {
      setHitDone(false)
      return
    }
    setHitDone(false)
    const timer = window.setTimeout(() => setHitDone(true), HIT_MS)
    return () => window.clearTimeout(timer)
  }, [feedbackTurn])
  useEffect(() => {
    if (!warning) return
    const timer = window.setTimeout(defend, WARNING_MS)
    return () => window.clearTimeout(timer)
  }, [warning, defend])

  if (!battle || !subject || finished) return null

  const accent = SUBJECT_COLOR[subject]
  const isEthics = subject === 'ethics'
  const inFeedback = battle.phase === 'feedback'
  // Pha chọn phép: câu hỏi khoá lại, trẻ đang quyết định tung phép nào.
  const inSpell = battle.phase === 'spell'
  /*
    Pha chờ: SÂN ĐẤU MỘT MÌNH TRÊN MÀN HÌNH.

    Đây là khoảnh khắc cả màn trận được thiết kế lại để có: giữa hai lượt, khung
    hỏi biến hẳn đi và chỉ còn con quái, đội thú, hai thanh máu, cùng một nút
    "Tấn công". Trẻ nhìn thấy mình đang ở đâu trong trận trước khi bước vào câu
    tiếp theo - thứ mà một chuỗi câu hỏi nối đuôi nhau không bao giờ cho.
  */
  const inReady = battle.phase === 'ready'
  /**
   * Quái đang gồng lên, câu hỏi đỡ đòn chưa hiện.
   *
   * Nhịp này ngắn nhưng không bỏ được: thiếu nó thì đòn của quái tới như một
   * câu hỏi nữa - trẻ vừa bấm "Tiếp tục" xong đã thấy đề bài mới, không kịp
   * hiểu rằng thế trận vừa đổi chủ.
   */
  const inWarning = battle.phase === 'warning'
  /** Lượt của quái: câu hỏi này để ĐỠ ĐÒN, và luôn có đồng hồ. */
  const defending = battle.stance === 'defend'
  const limitMs = questionLimitMs(battle)

  const handleAnswer = (input: AnswerInput) => {
    if (battle.phase !== 'question') return
    setSubmitted(input)
    answer(input)
  }

  const handleNext = () => {
    setSubmitted(null)
    next()
  }

  /*
    Hai chiêu dùng trong trận này, của ĐÚNG con thú đang đứng trên sân.

    Dựng lại từ `battle.pet` chứ không đọc một bộ đã chốt lúc vào trận: con thú
    có thể vừa tiến hoá ngay giữa trận trước và mở thêm chiêu, và `equippedSpells`
    tự bỏ những chiêu nó chưa mở rồi lấp cho đủ hai ô.
  */
  const loadout = equippedSpells(
    battle.pet.pet,
    petXp?.[battle.pet.pet.id] ?? 0,
    savedLoadout?.[battle.pet.pet.id],
  ).map((spell) => spell.id)

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
          heroName={student?.name ?? ''}
          heroLevel={levelFromTotalXp(student?.totalXp ?? 0).level}
          // Cấp của quái đi theo cấp của con (xem `enemyScaleForLevel`). Trận tập
          // và dữ liệu cũ không mang cấp thì đoán theo chặng như trước.
          enemyLevel={battle.enemy.level ?? (battleNode?.index ?? 0) + (student?.grade ?? 1)}
        />

        {/*
          Nút "Tấn công", nằm ĐÈ LÊN sân đấu chứ không nằm trong khung hỏi.

          Trong khung hỏi thì nó kéo cả khung ấy hiện lên giữa hai lượt, mà khung
          hỏi lúc nằm ngang là một khung nổi che gần kín màn hình - đúng cái vừa
          được dọn đi. Ở đây nó là một nút nổi trên chính sân đấu, và sân đấu ở
          lại trọn vẹn cho tới lúc trẻ quyết định ra đòn.
        */}
        <AnimatePresence>
          {inReady && (
            <motion.div
              className="absolute inset-x-0 bottom-0 flex justify-center p-3"
              style={{ zIndex: 7 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <button
                type="button"
                onClick={attack}
                autoFocus
                className="btn btn-primary px-8 text-2xl"
                style={{ background: accent, minHeight: 56 }}
              >
                ⚔️ Tấn công!
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          Cảnh báo quái sắp ra đòn, vẽ ĐÈ LÊN sân đấu.

          Không dùng khung hỏi: khung hỏi là chỗ của câu hỏi, mà cả điểm của
          nhịp này là lúc CHƯA có câu hỏi nào. Một dải chữ to giữa sân đấu, nền
          đỏ, rung nhẹ - trẻ sáu tuổi đọc ra "sắp có chuyện" trước cả khi đọc
          xong chữ.
        */}
        <AnimatePresence>
          {inWarning && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-3"
              style={{ zIndex: 8, background: 'rgb(120 20 20 / 0.28)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.p
                className="pixel-font battle-warning"
                initial={{ scale: 0.7 }}
                animate={{ scale: [0.7, 1.08, 1], x: [0, -5, 5, -3, 3, 0] }}
                transition={{ duration: 0.5 }}
                role="status"
              >
                ⚠️ {battle.enemy.name} sắp tấn công!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {inSpell && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-2"
              style={{ zIndex: 5, background: 'rgb(12 16 24 / 0.55)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              // Biến đi GẦN NHƯ TỨC THÌ. Cú lao của con thú bắt đầu ngay khi bấm
              // phép, và bản trước để lớp phủ tối này mờ dần mất gần nửa cú lao -
              // đúng khoảnh khắc đáng xem nhất bị phủ một tấm màn.
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
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
          {inFeedback && judgement && hitDone && (
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
                  {battle.blocked
                    ? '🛡️ Đỡ được rồi!'
                    : feedbackHeadline(judgement.correct, isEthics, judgement.quality)}
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

      <PetStrip
        pet={battle.pet}
        ultimateCooldown={battle.ultimateCooldown}
        status={battle.enemyStatus}
      />
      </div>

      {/*
        Hộp thoại ở đáy màn hình - đúng chỗ game thời đó đặt lời thoại và lệnh.

        Máy nằm ngang thì nó rời khỏi dòng chảy và NỔI LÊN GIỮA MÀN HÌNH như một
        khung hỏi, để sân đấu lấy trọn chỗ (xem `.battle-ask` trong globals.css).
        Và ở hai pha mà trận đánh mới là thứ đáng nhìn - trẻ đang chọn phép, hoặc
        đang xem kết quả câu vừa rồi - nó biến hẳn đi: cả hai pha ấy đã có lớp
        phủ riêng ngay trên sân đấu, nên khung hỏi đứng đó chỉ để che.

        Chỉ khi nằm ngang. Màn hình dọc thì đây vẫn là một khối xếp dưới sân đấu,
        và `.battle-ask-hidden` không có tác dụng gì - luật ấy nằm trong
        @media của hướng ngang.
      */}
      {/*
        Pha chờ và pha cảnh báo thì khung hỏi KHÔNG ĐƯỢC DỰNG RA, ở cả hai hướng
        máy.

        Giấu bằng CSS thì ở màn hình dọc nó vẫn giữ nguyên chỗ, và sân đấu vẫn
        bị ép vào đúng khoảng cũ - trong khi cả điểm của pha chờ là để sân đấu
        nở ra. Không dựng thì khối co giãn tự trả chỗ ấy về cho sân đấu.
      */}
      {!inReady && !inWarning && (
      <div className={`pixel-panel battle-ask${inFeedback || inSpell ? ' battle-ask-hidden' : ''}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="pixel-font text-lg uppercase" style={{ color: accent }}>
            {defending ? `🛡️ ${battle.enemy.name} tấn công!` : SUBJECT_LABEL[subject]}
          </p>
          <TurnPips current={battle.questionsAsked} total={battle.maxQuestions} color={accent} />
        </div>

        {/*
          Lượt của quái nói thẳng ra luật chơi, mỗi lần.

          Không phải vì trẻ quên, mà vì hậu quả của câu này khác hẳn câu trước
          đó: trả lời đúng ở đây KHÔNG gây sát thương, nó chỉ giữ cho mình không
          bị đánh. Một đứa bé bảy tuổi không suy ra được điều ấy từ một cái viền
          đổi màu.
        */}
        {defending && (
          <p className="battle-defend-note mb-2">
            Trả lời kịp giờ thì con đỡ được đòn này. Không kịp là ăn đòn đấy!
          </p>
        )}

        {limitMs !== null && (
          <BattleTimer
            limitMs={limitMs}
            startedAt={battle.questionShownAt}
            // Đồng hồ chỉ chạy lúc trẻ đang được trả lời. Ở pha chọn phép và pha
            // phản hồi thì nó đứng im - trẻ đang xem con thú tung phép, không
            // được tính vào thời gian suy nghĩ.
            running={battle.phase === 'question'}
            defending={defending}
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
      )}

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
  defending = false,
  onExpire,
}: {
  /** Đồng hồ này đang đếm một cú đánh đang bay tới, không phải một bài kiểm tra. */
  defending?: boolean
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
        {/* Ở lượt đỡ đòn, cái đồng hồ KHÔNG nói về trận đấu mà nói về cú đánh
            đang bay tới - "trận này có đếm giờ" ở đó vừa sai vừa vô nghĩa, vì
            trận thường vốn không đếm giờ ở lượt nào khác. */}
        <span className="pixel-font text-base opacity-70">
          {defending ? 'Đỡ nhanh lên!' : 'Trận này có đếm giờ!'}
        </span>
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
          /*
            Trận tập nói KHÁC, và nó phải nói khác ngay ở đây chứ không phải
            bằng một dòng thêm phía dưới.

            Bảng phần thưởng là một ô co giãn - nó nở ra lấp hết chỗ trống, nên
            mọi thứ đặt sau nó đều bị đẩy khỏi mép máy. Mà quan trọng hơn: câu
            "phần thưởng đã vào túi của con" là câu SAI ở bàn hướng dẫn, và dán
            một lời đính chính bên dưới một câu sai thì câu sai vẫn được đọc
            trước. Một đứa trẻ phát hiện ra vàng không vào túi thật thì lần sau
            nó không tin bảng này nữa.
          */
          summary.tutorial
            ? victory
              ? 'Hạ được rồi! Bảng dưới đây là phần thưởng - trận nào xong con cũng sẽ thấy nó.\nĐây là trận tập nên vàng và kinh nghiệm không cộng vào hồ sơ đâu. Trận thật thì có!'
              : 'Không sao cả, đây mới là tập thôi.\nTrong game này hết máu chỉ là về làng nghỉ - con không mất gì hết.'
            : victory
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
        {/* Trận tập không chia kinh nghiệm cho thú, nên dòng "+0 mỗi con" ở đó
            chỉ là một số 0 để trẻ phải giải thích với chính mình. */}
        {!summary.tutorial && (
          <Row label="🐾 Thú nhận được" value={`+${summary.petXpGained} kinh nghiệm mỗi con`} />
        )}
        {summary.petsEvolved.map((evo) => (
          <Row
            key={evo.to}
            // Một ngôi sao cho mỗi nấc đã qua, và nói rõ nấc mấy trên ba: nấc
            // cuối cùng phải đọc ra KHÁC hẳn nấc đầu, nếu không thì cả quãng
            // đường từ cấp 5 lên cấp 20 chỉ nhận được đúng một lời chúc như nhau.
            label={`${'🌟'.repeat(evo.stage)} TIẾN HOÁ`}
            value={`${evo.from} đã tiến hoá thành ${evo.to}! (nấc ${evo.stage}/3)`}
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
