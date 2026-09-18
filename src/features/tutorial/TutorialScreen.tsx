'use client'

/**
 * BÀN HƯỚNG DẪN.
 *
 * Không phải một trang chữ giải thích game, mà là một VÙNG ĐẤT NHỎ để chơi thử.
 * Lý do rất đơn giản: người chơi của app này bắt đầu từ lớp 1, và một đứa bé
 * sáu tuổi chưa đọc nổi một trang hướng dẫn. Thứ em ấy đọc được là bốn mũi tên
 * và một con quái đứng chắn đường.
 *
 * Ba chặng, và chỉ chặng cuối mới có chữ:
 *
 *   'welcome'  - một lời chào, hai cái nút. Chặng duy nhất bỏ qua được mà chưa
 *                thấy gì.
 *   'walk'     - bản đồ đi cảnh THẬT (`Overworld`, y hệt vùng đất thật) với bốn
 *                chặng giả. Trẻ tự bấm mũi tên, tự đi tới chỗ con quái.
 *   'battle'   - KHÔNG có màn hình ở đây. Trận tập dùng đúng `BattleScreen` của
 *                game, và `GameShell` cho nó chiếm trọn màn hình như mọi trận
 *                khác. Người dẫn đi theo bằng một dải chữ ở đầu màn hình
 *                (`TutorialCoach`).
 *   'handbook' - sổ tay: những cơ chế không diễn được trong một bàn tập (tháp,
 *                đấu trường, thú tiến hoá). Đọc SAU khi đã đánh, nên mấy chữ
 *                "khắc chế" hay "lượt đỡ đòn" đã trỏ tới một thứ trẻ từng thấy.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import {
  HANDBOOK,
  TUTORIAL_GRADE,
  TUTORIAL_SUBJECT,
  WALK_SCRIPT,
  tutorialNodes,
} from '../../content/tutorial'
import { buildTeam } from '../../content/pets'
import { useCompactLayout } from '../../shell/useCompactLayout'
import { markTutorialInvited } from '../../shell/tutorial-seen'
import { useGame } from '../../store/game'
import { useTutorial } from '../../store/tutorial'
import { DialogueBox } from '../../ui/DialogueBox'
import { petSpriteFor } from '../inventory/PetCollection'
import { biomeFor } from '../world/biome'
import { Overworld } from '../world/Overworld'
import { buildRouteMap } from '../world/routemap'
import { tutorialStartSpot } from './start-spot'

/**
 * Hạt giống của bản đồ bàn hướng dẫn.
 *
 * Một chuỗi CỐ ĐỊNH, nên bàn tập của mọi đứa trẻ là cùng một bãi đất: cùng chỗ
 * con quái đứng, cùng bụi cỏ ở cùng một ô. Nhờ vậy lời người dẫn ("con quái đang
 * đi qua đi lại kia") luôn trỏ tới một thứ có thật trên màn hình, và một thầy cô
 * chỉ cho cả lớp cùng lúc thì ba mươi cái máy hiện ra ba mươi tấm bản đồ giống
 * hệt nhau.
 */
const TUTORIAL_SEED = 'tutorial'

export function TutorialScreen() {
  const step = useTutorial((s) => s.step)
  const goTo = useTutorial((s) => s.goTo)
  const finish = useTutorial((s) => s.finish)
  const student = useGame((s) => s.student)

  /*
    Đánh xong trận tập thì đi tiếp sang sổ tay.

    Màn này chỉ được dựng khi KHÔNG có trận và KHÔNG có màn tổng kết nào đang
    mở (xem thứ tự trong `GameShell`). Nên hễ nó dựng ra mà chặng vẫn còn là
    'battle', nghĩa là trận tập vừa khép lại xong - đây là chỗ duy nhất biết
    được điều đó mà không phải đi hỏi màn trận.
  */
  useEffect(() => {
    if (step === 'battle') goTo('handbook')
  }, [step, goTo])

  /** Đóng bàn hướng dẫn và nhớ rằng hồ sơ này đã được mời rồi. */
  const close = () => {
    if (student) markTutorialInvited(student.id)
    finish()
  }

  if (step === 'welcome') return <Welcome onStart={() => goTo('walk')} onSkip={close} />
  if (step === 'walk') return <WalkAct />
  if (step === 'handbook') return <Handbook onDone={close} />

  // Chặng 'battle': màn trận đang chiếm màn hình, hoặc hiệu ứng ở trên vừa
  // chuyển chặng và lượt vẽ sau sẽ là sổ tay.
  return null
}

/** Lời chào mở màn. Nói bàn này dài bao lâu, vì đó là câu trẻ sẽ hỏi đầu tiên. */
function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="pixel-ui mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4 py-8">
      <h1 className="pixel-font text-center text-3xl">BÀN HƯỚNG DẪN</h1>

      <DialogueBox
        text={
          'Ta sẽ chỉ con ba việc thôi:\nđi trong vùng đất, đánh một trận, và đọc bảng phần thưởng.\n\nChừng ba phút là xong. Bỏ ngang lúc nào cũng được.'
        }
      />

      <div className="grid gap-2">
        <button type="button" onClick={onStart} autoFocus className="btn btn-primary text-xl">
          Bắt đầu!
        </button>
        <button type="button" onClick={onSkip} className="btn btn-ghost text-lg">
          Thôi, con chơi luôn
        </button>
      </div>
    </div>
  )
}

/**
 * Chặng đi cảnh.
 *
 * Dùng ĐÚNG `Overworld` của vùng đất thật, không phải một bản rút gọn. Cả điểm
 * của bàn này là những gì trẻ tập ở đây dùng được ngay ở vùng thật: cùng bốn
 * mũi tên, cùng cách con quái đi lang thang, cùng cảm giác bụi cỏ rung lên
 * trước khi có chuyện.
 */
function WalkAct() {
  const goTo = useTutorial((s) => s.goTo)
  const startTutorialBattle = useGame((s) => s.startTutorialBattle)
  const student = useGame((s) => s.student)
  const immersive = useCompactLayout()

  /** Câu thứ mấy trong lời dẫn mở màn. Bằng độ dài lời dẫn nghĩa là đã nói xong. */
  const [line, setLine] = useState(0)
  const talking = line < WALK_SCRIPT.length

  const biome = biomeFor(TUTORIAL_SUBJECT, TUTORIAL_GRADE)
  const nodes = useMemo(() => tutorialNodes(), [])

  /*
    Dựng LẠI đúng tấm bản đồ mà `Overworld` sắp dựng, chỉ để biết đặt trẻ ở đâu.

    Nghe như làm hai lần, nhưng `buildRouteMap` là hàm thuần và chạy từ cùng một
    hạt giống, nên hai lần gọi cho ra hai tấm bản đồ giống hệt nhau tới từng ô.
    Cách còn lại là bắt `Overworld` báo ngược lưới ô của nó ra ngoài - thêm một
    tham số vào một thành phần đã có hai chục, chỉ để phục vụ một màn hình.
  */
  const startAt = useMemo(() => {
    const map = buildRouteMap(nodes.length, TUTORIAL_SEED, {
      shape: biome.shape,
      width: biome.width,
      ground: biome.ground,
      border: biome.border,
      gateHalo: biome.gateHalo,
      scatter: biome.scatter,
      bossIndex: nodes.findIndex((node) => node.kind === 'boss'),
    })
    return tutorialStartSpot(map)
  }, [biome, nodes])

  /*
    Con thú đi theo sau lưng, y như ở vùng đất thật.

    Không phải để cho đẹp: đội hình mặc định của một hồ sơ mới là ba con thú mà
    trẻ chưa hề gặp, và con đi theo ở đây CHÍNH LÀ con sẽ bước ra tung phép vài
    phút sau trong trận tập. Nhờ vậy cái tên trên nút phép không phải là một cái
    tên lạ - nó là bạn đồng hành vừa đi cùng con suốt quãng đường.

    Nhớ theo GIÁ TRỊ chứ không theo đối tượng `Pet`: `buildTeam` dựng đội mới ở
    mỗi lần vẽ, và `petSpriteFor` tô lại màu ra một sprite mới - hai cái cộng
    lại là con thú vẽ lại canvas ở mọi lần vẽ. Cùng mẹo với `SubjectMap`.
  */
  const ownedPets = useGame((s) => s.progress.pets)
  const petXp = useGame((s) => s.progress.petXp)
  const leader = buildTeam(ownedPets ?? [], TUTORIAL_SUBJECT, 3, petXp ?? {})[0]
  const follower = useMemo(
    () => (leader ? { sprite: petSpriteFor(leader.sprite, leader.element) } : null),
    [leader?.sprite, leader?.element],
  )

  /*
    Mọi lối vào trận trên bàn này đổ về cùng MỘT trận tập.

    Đụng con quái, bước lên cổng, hay giẫm phải một ô cỏ cao - trẻ làm cách nào
    cũng được, và cách nào cũng dẫn tới con slime tập sự. Bắt trẻ phải tìm đúng
    một lối là biến bài học đầu tiên thành một câu đố.

    Đổi chặng TRƯỚC khi dựng trận: hai lệnh này nằm trong cùng một lần xử lý sự
    kiện nên React gộp chúng làm một lượt vẽ, và lượt vẽ ấy đã có cả chặng
    'battle' lẫn trận đấu - màn này không bao giờ bị dựng ra ở giữa.
  */
  const toBattle = () => {
    goTo('battle')
    startTutorialBattle()
  }

  const area = (
    <div className={`pixel-ui region-layout grid gap-3${immersive ? ' region-immersive' : ''}`}>
      {/* Máy tính còn chỗ cho một dòng tên; điện thoại thì bản đồ chiếm trọn máy
          và dải người dẫn ở đầu màn hình đã nói rõ đây là bàn hướng dẫn. */}
      {!immersive && (
        <div className="region-head flex items-center gap-3">
          <div className="flex-1">
            <h2 className="pixel-font text-2xl">Bãi Tập</h2>
            <p className="pixel-font text-lg opacity-70">
              Bàn hướng dẫn · đi bộ thử một vòng
            </p>
          </div>
        </div>
      )}

      <Overworld
        nodes={nodes}
        seed={TUTORIAL_SEED}
        biome={biome}
        subject={TUTORIAL_SUBJECT}
        avatar={student?.avatar ?? '🦊'}
        name={student?.name ?? ''}
        startAt={startAt}
        follower={follower}
        fill={immersive}
        // Khoá chân trong lúc người dẫn còn nói: bốn mũi tên cũng tự ẩn đi theo,
        // nên trẻ không bấm vào một nút đang không làm gì.
        paused={talking}
        onEnterGate={toBattle}
        /*
          Con quái canh chặng đã có `onEnterGate` lo rồi - `Overworld` gọi cả
          hai lần lượt cho cùng một cú đụng. Chỉ con đầu đàn trong hang
          (`node` bằng null) mới không có ai gọi thay, nên nó phải tự vào trận
          ở đây, còn lại thì im lặng để không dựng trận hai lần.
        */
        onMonsterBump={(node) => {
          if (!node) toBattle()
        }}
        onWildEncounter={toBattle}
        onEnterHouse={toBattle}
        onSecret={toBattle}
        dialogue={
          <AnimatePresence>
            {talking && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
              >
                <DialogueBox
                  // Câu mới là một hộp thoại mới: thiếu khoá này thì chữ không
                  // chạy lại từ đầu, câu sau hiện ra nguyên cả dòng.
                  key={line}
                  text={WALK_SCRIPT[line]!}
                  onAdvance={() => setLine((current) => current + 1)}
                  actionLabel={line === WALK_SCRIPT.length - 1 ? 'Con hiểu rồi!' : 'Tiếp'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        }
      />
    </div>
  )

  if (immersive) return <div className="pixel-ui map-layout map-immersive">{area}</div>

  return (
    <div className="pixel-ui map-layout mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-4">
      {area}
    </div>
  )
}

/**
 * Sổ tay: phần còn lại của game, mỗi cơ chế một thẻ.
 *
 * Đây là chặng DUY NHẤT của bàn hướng dẫn đòi trẻ đọc, và nó được đặt ở cuối
 * có chủ ý - lúc này em đã đi, đã đánh, đã thắng, nên mấy chữ trong đây đều
 * trỏ về một thứ em vừa tự tay làm. Đặt ở đầu thì nó chỉ là một bức tường chữ
 * đứng giữa đứa trẻ và trò chơi.
 */
function Handbook({ onDone }: { onDone: () => void }) {
  return (
    <div className="pixel-ui mx-auto flex min-h-dvh max-w-2xl flex-col gap-3 px-4 py-6">
      <header className="text-center">
        <h1 className="pixel-font text-3xl">SỔ TAY</h1>
        <p className="mt-1 text-base opacity-70">
          Còn mấy thứ nữa con sẽ gặp khi chơi. Đọc lướt cũng được.
        </p>
      </header>

      <div className="grid gap-2">
        {HANDBOOK.map((entry) => (
          <section key={entry.title} className="pixel-panel grid gap-1">
            <p className="pixel-font text-xl">
              {entry.emoji} {entry.title}
            </p>
            <p className="text-base leading-snug">{entry.body}</p>
          </section>
        ))}
      </div>

      <button type="button" onClick={onDone} className="btn btn-primary w-full text-xl">
        Xong rồi, đi chơi thôi! 🎉
      </button>
    </div>
  )
}
