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
import {
  asQuestion,
  pvpPowerFactor,
  pvpTimeLimitMs,
  sidesOf,
  type PvpEvent,
  type PvpHit,
  type PvpMatch,
  type PvpSide,
} from '../../data/pvp-types'
import { judge, type AnswerInput } from '../../engine/judge'
import { usePvp } from '../../store/pvp'
import { useGame } from '../../store/game'
import { QuestionView } from '../question/QuestionView'
import { PvpArena } from './PvpArena'
import { PvpSpellPicker } from './PvpSpellPicker'
import { getPet } from '../../content/pets'
import { SPELLS } from '../../content/pets'
import { equippedSpells } from '../../engine/loadout'
import { petSpriteFor } from '../inventory/PetCollection'
import { PixelSprite } from '../pixel/sprite'
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
    ---- TRẢ LỜI ĐÚNG RỒI, GIỜ CHỌN CHIÊU ----

    Đấu trường chạy y hệt trận đánh quái: đúng thì được tung chiêu, và chiêu nào
    là quyết định của trẻ. Nên giữa "bấm đáp án" và "gửi lên máy chủ" giờ có một
    nhịp nữa, và `pending` là nhịp ấy.

    Lượt bấm CHỈ gửi đi khi đã chọn xong chiêu, vì máy chủ cần biết tung chiêu gì
    mới tính được sát thương. Trả lời sai thì gửi ngay - sai thì không có chiêu
    nào để chọn.

    ĐỒNG HỒ VẪN CHẠY trong lúc chọn: máy chủ đo từ lúc vòng bắt đầu tới lúc lượt
    bấm tới nơi, nên nghĩ lâu ở bước này cũng mất thưởng tốc độ y như nghĩ lâu ở
    bước đọc đề. Điều đó công bằng cho cả hai bên và không cần giải thích thêm.
  */
  const [pending, setPending] = useState(false)
  useEffect(() => setPending(false), [match.round])

  // Hai chiêu con thú của mình đang mang. Lấy từ hồ sơ chứ không từ trận: trận
  // chỉ giữ id, mà bảng chọn cần cả tên, hệ và hiệu ứng.
  const progress = useGame((s) => s.progress)
  const myPet = sides.me.pet ? getPet(sides.me.pet) : null
  const foePet = sides.foe.pet ? getPet(sides.foe.pet) : null
  const mySpells = useMemo(() => {
    const declared = (sides.me.spells ?? []).map((id) => SPELLS[id]).filter(Boolean)
    if (declared.length > 0) return declared as NonNullable<(typeof declared)[number]>[]
    // Trận tạo từ trước migration 0012 không khai chiêu nào. Rơi về hai chiêu
    // nền của con thú thì sân đấu vẫn đánh được, thay vì đứng hình.
    return myPet
      ? equippedSpells(myPet, progress.petXp?.[myPet.id] ?? 0, progress.petLoadout?.[myPet.id])
      : []
  }, [sides.me.spells, myPet, progress.petXp, progress.petLoadout])

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
    playEffect(hitsOf(lastEvent).some((h) => h.studentId === studentId && h.damage > 0) ? 'correct' : 'wrong')
    const timer = window.setTimeout(() => setFlash(null), 1_400)
    return () => window.clearTimeout(timer)
  }, [match.events.length, lastEvent, studentId])

  const send = (correct: boolean, spellId: string | null) => {
    setPending(false)
    if (!answered) void buzz(studentId, correct, spellId)
  }

  const onAnswer = (input: AnswerInput) => {
    if (!question || answered || pending) return
    setSubmitted(input)
    // Chấm NGAY trên máy này rồi chỉ gửi lên đúng/sai. Gửi cả đáp án để máy chủ
    // chấm thì mỗi lượt bấm phải chờ thêm một vòng mạng trước khi kết quả được
    // chốt - mà tốc độ chính là thứ đang tranh nhau.
    const correct = judge(question, input).correct
    if (!correct || mySpells.length === 0) {
      send(false, null)
      return
    }
    setPending(true)
  }

  /*
    Hết giờ mà chưa chọn xong chiêu: TỰ TUNG chiêu đầu tiên.

    Trả lời đúng rồi mà mất trắng lượt đánh vì mải chọn là một hình phạt không ai
    hiểu nổi - nhất là khi bạn kia đang ngồi đợi mình. Tự tung một chiêu tử tế
    thì tệ nhất cũng chỉ là đánh không đúng hệ.
  */
  const onExpire = () => {
    if (answered) return
    if (pending) send(true, mySpells[0]?.id ?? null)
    else send(false, null)
  }

  return (
    <div className="pixel-ui battle-layout mx-auto flex h-dvh max-w-3xl flex-col gap-3 px-3 py-3">
      {/* Cùng bộ tên lớp với trận đánh quái, nên mọi luật chia chiều cao đã
          viết cho màn ấy áp dụng luôn ở đây - kể cả bố cục hai cột khi máy
          nằm ngang. */}
      <div className="battle-stage">
        <div className="relative battle-arena">
          <PvpArena
            me={sides.me}
            foe={sides.foe}
            subject={match.subject}
            flash={flash}
            studentId={studentId}
          />

          {/* Trả lời đúng rồi: chọn chiêu. Đè lên sân đấu, cùng chỗ với hai
              lớp phủ dưới đây - cả ba đều là "chuyện đang xảy ra trên sân". */}
          <AnimatePresence>
            {pending && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center p-2"
                style={{ background: 'rgb(12 16 24 / 0.45)', zIndex: 7 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PvpSpellPicker
                  spells={mySpells}
                  foeElement={foePet?.element ?? null}
                  cooldown={sides.me.cooldown ?? 0}
                  onCast={(spellId) => send(true, spellId)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Đã bấm xong nhưng bạn kia chưa. Đè lên SÂN ĐẤU chứ không đè lên
              khung hỏi: khung hỏi ở dưới đã khoá hết đáp án rồi, còn chỗ trẻ
              đang nhìn lúc chờ là hai nhân vật. */}
          <AnimatePresence>
            {answered && !flash && (
              <motion.div
                className="absolute inset-0 flex items-end justify-center p-3"
                style={{ background: 'rgb(12 16 24 / 0.45)', zIndex: 5 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p
                  className="pixel-font text-xl"
                  style={{ color: '#fff', textShadow: '2px 2px 0 #1b2432' }}
                >
                  Đã trả lời! Chờ {sides.foe.name}...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {flash && (
              <motion.div
                className="absolute inset-0 flex items-end justify-center p-2"
                style={{ background: 'rgb(12 16 24 / 0.35)', zIndex: 6 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="pixel-panel w-full text-center"
                  style={{ maxWidth: 520, padding: '8px 14px' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <p className="pixel-font text-2xl leading-tight">
                    {flashTitle(flash, studentId)}
                  </p>
                  <p className="mt-1 text-base leading-snug">
                    {flashLine(flash, studentId, sides.foe.name)}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <TeamLine me={sides.me} foe={sides.foe} accent={accent} />
      </div>

      {/*
        Bấm xong rồi thì KHUNG HỎI BIẾN ĐI khi máy nằm ngang.

        Ở màn đánh quái, luật này gắn với pha chọn phép và pha phản hồi (xem
        `battle-ask-hidden` trong BattleScreen). PVP không có hai pha ấy, nên
        khung hỏi nổi giữa màn hình che kín sân đấu SUỐT CẢ TRẬN - đo trên máy
        844×390 thì hai nhân vật không hề nhìn thấy được lần nào.

        Mốc tương đương ở đây là `answered` VÀ `pending`: từ lúc trẻ bấm xong,
        đáp án đã khoá
        hết, và thứ duy nhất còn đáng nhìn là hai con thú đang đánh nhau - lúc
        chờ bạn kia lẫn lúc xem ai nhanh hơn đều đã có lớp phủ riêng trên sân
        đấu. Sang câu mới thì `answered` về false và khung hỏi hiện lại.

        Chỉ khi nằm ngang; màn hình dọc thì tên lớp này không có luật nào.
      */}
      <div
        className={`pixel-panel battle-ask relative${answered || pending ? ' battle-ask-hidden' : ''}`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="pixel-font text-lg uppercase" style={{ color: accent }}>
            ⚔️ {SUBJECT_LABEL[match.subject]} lớp {match.grade}
          </p>
          <p className="pixel-font text-lg opacity-70">
            Câu {Math.min(match.round + 1, match.questions.length)}/{match.questions.length}
          </p>
        </div>
        <RoundTimer
          key={match.round}
          startedAt={match.roundStartedAt}
          limitMs={pvpTimeLimitMs(match.grade)}
          running={!answered}
          onExpire={onExpire}
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
              disabled={answered || pending}
              submitted={submitted}
            />
          </>
        )}

        {/* Khoá đáp án khi đã bấm xong: hai lớp phủ "đang chờ" và "ai nhanh
            hơn" đã chuyển lên sân đấu, vì đó mới là chỗ trẻ đang nhìn. */}
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

/**
 * Đọc một vòng đã xong, chịu được CẢ HAI dạng dữ liệu.
 *
 * Trận mới ghi mọi cú đánh vào `hits`; trận đánh dở từ trước bản này chỉ có
 * `attackerId` với `damage`. Dựng lại dạng cũ thành một phần tử `hits` ngay ở
 * đây, để mọi chỗ bên dưới chỉ phải biết một dạng duy nhất.
 */
function hitsOf(event: PvpEvent): PvpHit[] {
  if (event.hits) return event.hits
  if (!event.attackerId) return []
  return [{ studentId: event.attackerId, damage: event.damage, spellId: null, effect: null }]
}

function flashTitle(event: PvpEvent, studentId: string): string {
  const hits = hitsOf(event).filter((h) => h.damage > 0)
  if (hits.length === 0) return '😬 Cả hai cùng trượt!'
  if (hits.length === 2) return '⚔️ Cả hai cùng đánh!'
  return hits[0]!.studentId === studentId ? '⚡ Con ra đòn!' : '💥 Bạn ấy ra đòn!'
}

function flashLine(event: PvpEvent, studentId: string, foeName: string): string {
  const hits = hitsOf(event)
  const mine = hits.find((h) => h.studentId === studentId) ?? null
  const theirs = hits.find((h) => h.studentId !== studentId) ?? null

  // Đóng băng ghi lại một cú đánh 0 sát thương. Nói thẳng ra, nếu không thì trẻ
  // trả lời đúng mà không thấy máu bạn kia tụt và tưởng máy hỏng.
  if (mine && mine.damage === 0 && mine.spellId === null) {
    return 'Con bị đóng băng nên không tung được chiêu nào lượt này!'
  }

  const say = (who: string, hit: PvpHit) => {
    const spell = hit.spellId ? SPELLS[hit.spellId] : null
    return spell
      ? `${who} tung ${spell.name} - ${hit.damage} sát thương!`
      : `${who} đánh ${hit.damage} sát thương!`
  }

  const lines: string[] = []
  if (mine && mine.damage > 0) lines.push(say('Con', mine))
  if (theirs && theirs.damage > 0) lines.push(say(foeName, theirs))

  // Máu mất vì vết cháy hay hố đen từ vòng trước. Nói riêng ra, vì nó KHÔNG
  // đến từ câu trả lời vừa rồi - gộp chung thì trẻ tưởng mình bị trừ oan.
  const tick = event.ticks?.[studentId] ?? 0
  if (tick > 0) lines.push(`Con mất thêm ${tick} máu vì hiệu ứng.`)

  if (lines.length === 0) return 'Không ai trả lời đúng, nên lượt này không ai mất máu vì đòn đánh.'
  return lines.join(' ')
}

// --- Dải đội thú ------------------------------------------------------------

/**
 * Dải đội thú dưới sân đấu: con nào đang đánh, và nó giúp được bao nhiêu.
 *
 * ĐÂY LÀ CHỖ ĐỘI THÚ THÔI VÔ HÌNH. Nó vẫn luôn quyết định máu và sức đánh của
 * trận PVP, nhưng con số ấy chỉ sống trong máy chủ - trẻ nuôi thú cả tháng rồi
 * vào đấu trường không thấy gì khác, nên tưởng thú chẳng để làm gì.
 *
 * Nói ra thành một con số phần trăm thì lần sau em ấy nhìn thấy nó to lên.
 *
 * Hiện CẢ HAI BÊN, và đó là chủ ý: biết bạn mình đang được cộng bao nhiêu thì
 * mới hiểu vì sao đòn của bạn ấy đau hơn - và đó là lý do để đi nuôi thú, chứ
 * không phải một điều bí ẩn.
 */
function TeamLine({ me, foe, accent }: { me: PvpSide; foe: PvpSide; accent: string }) {
  return (
    <div className="pixel-panel team-strip flex items-center gap-2" style={{ padding: '6px 10px' }}>
      <TeamSide side={me} accent={accent} mine />
      <span className="pixel-font shrink-0 text-lg opacity-50">VS</span>
      <TeamSide side={foe} accent={accent} mine={false} />
    </div>
  )
}

function TeamSide({ side, accent, mine }: { side: PvpSide; accent: string; mine: boolean }) {
  const pet = side.pet ? getPet(side.pet) : null
  /*
    Phần trăm cộng thêm, tính bằng ĐÚNG hàm mà máy chủ dùng để ra sát thương.

    Chép lại công thức ở đây thì có ngày máy chủ đổi cân bằng mà con số trên màn
    hình vẫn nói chuyện cũ - và một con số nói dối còn tệ hơn không có con số.
  */
  const bonus = Math.round((pvpPowerFactor(side.power) - 1) * 100)

  return (
    <span className={`flex min-w-0 flex-1 items-center gap-2${mine ? '' : ' flex-row-reverse'}`}>
      {pet && <PixelSprite sprite={petSpriteFor(pet.sprite, pet.element)} scale={2} />}
      <span className={`min-w-0 flex-1${mine ? '' : ' text-right'}`}>
        <span className="block truncate text-base font-bold leading-tight">
          {pet?.name ?? 'Chưa có thú'}
        </span>
        <span className="pixel-font block text-base leading-tight" style={{ color: accent }}>
          {bonus > 0 ? `+${bonus}% sát thương` : 'chưa cộng thêm'}
        </span>
      </span>
    </span>
  )
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
