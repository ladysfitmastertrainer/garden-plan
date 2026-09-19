/**
 * SÂN ĐẤU TAY ĐÔI, dựng bằng đúng những mảnh của sân đấu đánh quái.
 *
 * Trước đây màn PVP chỉ là hai dòng chữ và hai thanh máu xếp trong một cái khung
 * - đúng nghĩa một bảng điểm. Trẻ vừa rời một trận đánh quái có bệ đứng, có
 * sprite lao vào nhau, có số sát thương bật ra, rồi bước sang đây và thấy một
 * cái bảng. Cùng một trò chơi mà hai nửa nói hai thứ tiếng.
 *
 * Giờ nó dùng lại `Combatant`, `HpBox` và bảng màu cảnh nền từ `battle/arena` -
 * nhập chứ không chép, để hai sân đấu không bao giờ trôi khỏi nhau.
 *
 * ---- VÀ CON THÚ RA SÂN ----
 *
 * Đội thú vốn đã quyết định máu và sức đánh của trận PVP, nhưng chưa bao giờ
 * được VẼ ra. Nuôi thú cả tháng rồi vào đấu trường không thấy con thú của mình
 * đâu thì nó là một con số vô hình, và một con số vô hình thì thấy phế.
 *
 * Ở đây con đầu đội của mỗi bên đứng ra ĐẰNG TRƯỚC - nó mới là thứ lao vào và
 * ăn đòn - còn nhân vật của trẻ đứng lùi sau, nhỏ hơn, đúng chỗ của người ra
 * lệnh. Cũng là cách mà chính engine đã mô tả trận đấu từ đầu: "trẻ không tự
 * đánh mà có một ĐỘI THÚ đánh thay".
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import {
  Combatant,
  ENEMY_SCALE,
  HERO_SCALE,
  HpBox,
  SCENE_BY_SUBJECT,
  Trainer,
  arenaScales,
} from '../battle/arena'
import { getPet, petsOfElement } from '../../content/pets'
import type { Subject } from '../../content/types'
import type { PvpEvent, PvpSide } from '../../data/pvp-types'
import { petSpriteFor } from '../inventory/PetCollection'
import { useMeasureOnLayout } from '../../shell/useMeasureOnLayout'
import { useReduceMotion } from '../../shell/useReduceMotion'

/**
 * Con thú ra sân của một bên.
 *
 * Trận tạo từ trước migration 0011 không có id nào cả, và một sân đấu trống
 * một bên thì tệ hơn một sân đấu đoán sai: rơi về con thú mặc định của môn đó -
 * đúng con mà `buildTeam` sẽ phát cho một hồ sơ chưa bắt được gì.
 */
function petOf(side: PvpSide, subject: Subject) {
  const chosen = side.pet ? getPet(side.pet) : null
  return chosen ?? petsOfElement(subject)[0] ?? null
}

export function PvpArena({
  me,
  foe,
  subject,
  /** Vòng vừa ngã ngũ, để biết ai vừa đánh ai. `null` là chưa có gì xảy ra. */
  flash,
  studentId,
}: {
  me: PvpSide
  foe: PvpSide
  subject: Subject
  flash: PvpEvent | null
  studentId: string
}) {
  const reduceMotion = useReduceMotion()
  const scene = SCENE_BY_SUBJECT[subject]

  /*
    Đo khung trận thật rồi suy ra bội số phóng - y hệt trận đánh quái.

    Không gõ cứng, vì khung này co theo chỗ trống còn lại: khung hỏi ở dưới cao
    thấp tuỳ đề bài, người ta xoay máy, phông chữ nạp xong. Một con số đo hụt sẽ
    đứng nguyên đó suốt cả trận.
  */
  const arenaRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(() => ({ hero: HERO_SCALE, enemy: ENEMY_SCALE }))

  useMeasureOnLayout(arenaRef, () => {
    const el = arenaRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    if (width === 0 || height === 0) return
    const next = arenaScales(width, height)
    setFit((current) =>
      current.hero === next.hero && current.enemy === next.enemy ? current : next,
    )
  })

  /*
    Đòn đánh chỉ diễn MỘT LẦN cho mỗi vòng.

    `flash` sống vài giây rồi tắt, nhưng thành phần này vẽ lại nhiều lần trong
    quãng ấy (đồng hồ chạy, trẻ bấm). Không khoá theo số vòng thì mỗi lần vẽ lại
    là một lần hai bên lao vào nhau, và sân đấu rung liên tục.
  */
  const [turn, setTurn] = useState<{ key: number; mine: boolean | null }>({ key: -1, mine: null })
  useEffect(() => {
    if (!flash) return
    setTurn({
      key: flash.round,
      mine: flash.attackerId === null ? null : flash.attackerId === studentId,
    })
  }, [flash?.round, flash?.attackerId, studentId, flash])

  const live = flash !== null && turn.key === flash.round ? turn.mine : null
  const myPet = petOf(me, subject)
  const foePet = petOf(foe, subject)

  return (
    <motion.div
      ref={arenaRef}
      className="pixel-ui relative overflow-hidden"
      style={{
        border: '4px solid #1b2432',
        borderRadius: 6,
        height: 'var(--arena-height, clamp(230px, 34dvh, 300px))',
        background: scene.sky,
        imageRendering: 'pixelated',
      }}
      // Rung cả khung khi CHÍNH MÌNH ăn đòn - cùng quy ước với trận đánh quái.
      animate={live === false && !reduceMotion ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: 'linear' }}
    >
      <div className="absolute inset-x-0 bottom-0" style={{ height: '48%', background: scene.ground }} />

      {/* Bên kia: trên - phải, sprite nhỏ hơn cho cảm giác ở xa. */}
      {foePet && (
        <Combatant
          sprite={petSpriteFor(foePet.sprite, foePet.element)}
          scene={scene}
          flip
          style={{ right: '12%', top: '14%' }}
          attacking={live === false}
          hit={live === true}
          direction={-1}
          reduceMotion={reduceMotion}
          turnKey={turn.key}
          scale={fit.enemy}
          enterFrom={220}
          idleDelay="0.4s"
        />
      )}

      {/*
        Nhân vật của bạn ấy: đứng LÙI RA SAU con thú, tức là về phía mép sân của
        bạn ấy - đúng gương của bên mình (`left: 2%` trong khi con thú ở
        `left: 9%`).

        Đặt ở `right: 30%` như bản đầu thì nó rơi vào GIỮA sân, thành ra trông
        như trẻ bên kia đang đứng chen giữa hai con thú đánh nhau.
      */}
      <Trainer
        avatar={foe.avatar}
        name={foe.name}
        scale={Math.max(3, Math.round(fit.enemy * 0.7))}
        style={{ right: '2%', top: '11%' }}
        flip
        reduceMotion={reduceMotion}
      />

      {/* Bên mình: dưới - trái, sprite to hơn cho cảm giác ở gần. */}
      {myPet && (
        <Combatant
          sprite={petSpriteFor(myPet.sprite, myPet.element)}
          scene={scene}
          style={{ left: '9%', bottom: '12%' }}
          attacking={live === true}
          hit={live === false}
          direction={1}
          reduceMotion={reduceMotion}
          turnKey={turn.key}
          scale={fit.hero}
          enterFrom={-220}
          idleDelay="0s"
        />
      )}

      <Trainer
        avatar={me.avatar}
        name={me.name}
        scale={Math.max(3, Math.round(fit.hero * 0.5))}
        style={{ left: '2%', bottom: '10%' }}
        reduceMotion={reduceMotion}
      />

      {/* Máu của mình: dưới - phải. Máu bạn ấy: trên - trái. Chéo nhau, đúng
          kiểu máy điện tử thời đó và đúng như trận đánh quái. */}
      <motion.div
        className="absolute"
        style={{ left: 10, top: 10, zIndex: 3 }}
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.5 }}
      >
        <HpBox name={foe.name} hp={foe.hp} maxHp={foe.maxHp} />
      </motion.div>

      <motion.div
        className="absolute"
        style={{ right: 10, bottom: 10, zIndex: 3 }}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.6 }}
      >
        <HpBox name={`${me.name} (con)`} hp={me.hp} maxHp={me.maxHp} showNumbers />
      </motion.div>

      {/* Số sát thương bật ra ở chỗ bên vừa ăn đòn - cùng ngôn ngữ với trận
          đánh quái, nên trẻ không phải học lại lần nữa. */}
      <AnimatePresence>
        {flash && flash.attackerId !== null && (
          <motion.span
            key={flash.round}
            className="pixel-font absolute"
            style={{
              left: live ? '74%' : '18%',
              top: live ? '26%' : '58%',
              fontSize: 34,
              lineHeight: 1,
              color: live ? '#ffd447' : '#ff6b5e',
              textShadow:
                '2px 0 0 #1b2432, -2px 0 0 #1b2432, 0 2px 0 #1b2432, 0 -2px 0 #1b2432',
              zIndex: 4,
            }}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.25 }}
            aria-hidden="true"
          >
            -{flash.damage}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
