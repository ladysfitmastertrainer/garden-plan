/**
 * Màn trận đấu kiểu máy điện tử cầm tay (Pokémon GBA).
 *
 * Bố cục lấy đúng của Pokémon Gen 3:
 *   - Quái ở TRÊN BÊN PHẢI, đứng trên một bệ elip.
 *   - Nhân vật của trẻ ở DƯỚI BÊN TRÁI, cũng trên một bệ elip.
 *   - Khung máu của quái ở trên bên TRÁI, của trẻ ở dưới bên PHẢI (chéo nhau).
 *   - Đáy màn hình là hộp thoại viền dày.
 *
 * Toàn bộ dùng MẢNG MÀU PHẲNG: không gradient, không bóng mờ, góc gần vuông.
 * Máy ngày đó không làm được gradient, và chính sự "thô" đó tạo nên nét riêng.
 *
 * Hiệu ứng trúng đòn cũng theo đúng quy ước thời đó: nhân vật NHẤP NHÁY biến
 * mất - hiện lại vài lần, thay vì ám đỏ hay nổ hạt.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useReduceMotion } from '../../shell/useReduceMotion'
import { useMeasureOnLayout } from '../../shell/useMeasureOnLayout'
import type { Subject } from '../../content/types'
import type { BattleState } from '../../engine/battle'
import { monsterSpriteFor, towerSpriteFor } from '../pixel/creatures'
import {
  Combatant,
  ENEMY_SCALE,
  EffectBurst,
  HERO_SCALE,
  HpBox,
  SCENE_BY_HABITAT,
  SCENE_BY_SUBJECT,
  StatusAura,
  Trainer,
  arenaScales,
} from './arena'
import { EFFECT_UI } from './effects'
import { petSpriteFor } from '../inventory/PetCollection'

/**
 * Hoạt cảnh mở màn dài bao lâu, mili giây.
 *
 * Đủ để mắt kịp thấy hai bên lao vào, chưa đủ để trẻ sốt ruột - trẻ tiểu học
 * bấm tiếp sau chừng một giây im lặng.
 */
const INTRO_MS = 1150

/*
  ---- SPRITE PHẢI CO GIÃN THEO KHUNG TRẬN ----

  Trước đây hai nhân vật dùng bội số CỐ ĐỊNH: 8 cho trẻ (128 điểm ảnh) và 6 cho
  quái (96 điểm ảnh), bất kể khung trận to bằng nào. Con số ấy được chọn cho một
  màn hình máy tính, và nó đứng nguyên ở mọi nơi khác:

    * Điện thoại dọc: khung trận rộng chừng 360px. Một con quái 96px và một nhân
      vật 128px trong đó thì hai bên gần như chạm nhau giữa sân, và thanh máu
      treo trên đầu bị đội lên sát mép.
    * Điện thoại nằm ngang: khung trận CAO có 270px. Cũng hai cái sprite ấy, giờ
      chiếm gần trọn chiều cao - nên xoay ngang xong mọi thứ còn chật hơn lúc
      dựng đứng, đúng ngược với cái người ta mong đợi khi xoay máy.

  Giờ đo khung trận thật rồi suy ra bội số. Vẫn là SỐ NGUYÊN - pixel art phóng
  theo số lẻ là méo hết điểm ảnh, đó là điều kiện sống còn chứ không phải sở
  thích. Nên các bước nhảy hơi thô (7 → 8 là to thêm 14%), và đó là cái giá phải
  trả, không phải lỗi.
*/

/** Tên hệ viết tắt cho cái nhãn trên thanh máu quái - chỗ đó chỉ đủ vài chữ. */
const ELEMENT_SHORT: Record<Subject, string> = {
  math: 'Số',
  vietnamese: 'Chữ',
  music: 'Âm',
  ethics: 'Sáng',
}

/** Màu nền của nhãn hệ, trùng màu môn học ở mọi nơi khác trong app. */
const ELEMENT_BADGE: Record<Subject, string> = {
  math: '#f7d98b',
  vietnamese: '#f7b3c5',
  music: '#cbb9fb',
  ethics: '#a8e0f5',
}

/** Mỗi môn một loài quái riêng. */
/**
 * Hoạt cảnh riêng cho từng nguyên tố.
 *
 * Trước đây tung phép nào cũng chỉ loé trắng một cái y hệt nhau, nên trẻ không
 * thấy khác gì giữa "Búa Phép Tính" và "Bão Chữ" - chọn phép xong mà màn hình
 * không đáp lại thì quyết định vừa rồi coi như vô nghĩa.
 *
 * Ký tự bay ra lấy đúng chất của môn: Toán rơi chữ số, Tiếng Việt bay chữ cái,
 * Âm nhạc bắn nốt nhạc, Đạo đức toả tia sáng. Vừa là hiệu ứng, vừa nhắc trẻ
 * phép này thuộc môn nào.
 */
const SPELL_FX: Record<Subject, { flash: string; colour: string; glyphs: string[] }> = {
  math: { flash: '#ffe9a8', colour: '#f59e0b', glyphs: ['7', '3', '9', '5', '2', '8', '4', '6'] },
  vietnamese: { flash: '#ffd6e2', colour: '#ef4476', glyphs: ['a', 'ă', 'b', 'ê', 'm', 'n', 'ơ', 'h'] },
  music: { flash: '#e4d9ff', colour: '#8b5cf6', glyphs: ['♪', '♫', '♩', '♬', '♪', '♫', '♩', '♬'] },
  ethics: { flash: '#cdeeff', colour: '#0ea5e9', glyphs: ['✦', '✧', '✦', '✧', '✦', '✧', '✦', '✧'] },
}

/**
 * Chùm ký tự bay vào chỗ con quái.
 *
 * Toạ độ đích trùng với chỗ số sát thương hiện ra (76% ngang, 30% dọc) để cả
 * hai cùng kể một câu chuyện: phép bay tới, trúng, rồi bật ra con số.
 */
function SpellBurst({
  element,
  strong,
  reduceMotion,
}: {
  element: Subject
  strong: boolean
  reduceMotion: boolean
}) {
  const fx = SPELL_FX[element]
  // Máy yếu hoặc trẻ đã tắt hiệu ứng chuyển động thì chỉ hiện một chùm tĩnh.
  const count = reduceMotion ? 3 : strong ? 10 : 7

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // Rải đều quanh đích rồi rơi vào, không random để lần nào cũng như nhau
        // - hiệu ứng nhấp nháy ngẫu nhiên làm trẻ khó đoán chuyện gì đang xảy ra.
        const spread = ((i - (count - 1) / 2) / count) * 120
        return (
          <motion.span
            key={i}
            className="pixel-font absolute"
            style={{
              left: '76%',
              top: '30%',
              fontSize: strong ? 30 : 24,
              lineHeight: 1,
              color: fx.colour,
              textShadow: '2px 0 0 #1b2432, -2px 0 0 #1b2432, 0 2px 0 #1b2432, 0 -2px 0 #1b2432',
            }}
            initial={{ x: spread, y: -70, opacity: 0, scale: 0.6 }}
            animate={
              reduceMotion
                ? { x: spread * 0.4, y: 0, opacity: [0, 1, 0], scale: 1 }
                : { x: spread * 0.2, y: 0, opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1] }
            }
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.035, ease: 'easeIn' }}
          >
            {fx.glyphs[i % fx.glyphs.length]}
          </motion.span>
        )
      })}
    </div>
  )
}

type Turn = 'hero-attacks' | 'enemy-attacks' | 'no-damage' | null

export function PixelBattle({
  battle,
  subject,
  avatar,
  heroName,
  heroLevel,
  enemyLevel,
}: {
  battle: BattleState
  subject: Subject
  avatar: string
  /** Tên trẻ - chỉ dùng làm hạt giống MÀU của nhân vật. Xem `pixel/heroes.ts`. */
  heroName: string
  heroLevel: number
  enemyLevel: number
}) {
  const reduceMotion = useReduceMotion()
  const scene = battle.enemy.habitat ? SCENE_BY_HABITAT[battle.enemy.habitat] : SCENE_BY_SUBJECT[subject]
  // Mỗi con quái một hình riêng, khớp với cái tên nó mang.
  const enemySprite = battle.enemy.isTower
    ? towerSpriteFor(subject)
    : monsterSpriteFor(subject, battle.enemy.variant, battle.enemy.isBoss, battle.enemy.habitat)

  const answerCount = battle.answers.length
  const [turn, setTurn] = useState<{ key: number; kind: Turn }>({ key: -1, kind: null })

  useEffect(() => {
    if (battle.phase !== 'feedback' || !battle.lastDamage) return
    const { toEnemy, toPlayer } = battle.lastDamage
    setTurn({
      key: answerCount,
      kind: toEnemy > 0 ? 'hero-attacks' : toPlayer > 0 ? 'enemy-attacks' : 'no-damage',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerCount, battle.phase])

  /**
   * Hoạt cảnh mở màn: chớp sáng, hai bên lao vào, rồi khung máu mới hiện.
   *
   * Đổi theo id của quái nên MỖI TRẬN diễn lại một lần - không phải mỗi lần
   * component render. Trước đây trận bắt đầu bằng cách mọi thứ hiện ra cùng lúc,
   * đứng im: không có gì nói cho trẻ biết "trận đấu vừa bắt đầu".
   */
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    setIntro(true)
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS)
    return () => window.clearTimeout(timer)
  }, [battle.enemy.id])

  /*
    Đo khung trận thật rồi suy ra bội số phóng của hai nhân vật.

    Dùng `useMeasureOnLayout` chứ không đo một lần lúc dựng, vì khung trận co
    theo chỗ trống còn lại: phông chữ pixel nạp xong, dải nhắc cài app hiện lên
    rồi biến mất, người ta xoay máy - mỗi lần như thế chiều cao khung đổi, và một
    con số đo hụt sẽ đứng nguyên đó suốt cả trận.
  */
  const arenaRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(() => ({ hero: HERO_SCALE, enemy: ENEMY_SCALE }))

  useMeasureOnLayout(arenaRef, () => {
    const el = arenaRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    if (width === 0 || height === 0) return

    const next = arenaScales(width, height)
    // So rồi mới đặt: `useMeasureOnLayout` nghe cả ResizeObserver, mà đặt state
    // vô điều kiện ở đây thì mỗi lần đo lại là một lần vẽ lại, và lần vẽ lại ấy
    // đánh thức chính cái observer vừa gọi mình.
    setFit((current) =>
      current.hero === next.hero && current.enemy === next.enemy ? current : next,
    )
  })

  /*
    Chiều cao THẬT của khung máu trẻ.

    Cần đo chứ không đoán: khung này cao bao nhiêu là tuỳ phông chữ pixel đã nạp
    xong chưa, tuỳ tên thú dài ngắn, và tuỳ cỡ chữ của máy. Một con số gõ tay sẽ
    đúng trên máy của người viết ra nó và sai ở mọi máy khác.
  */
  const heroHpRef = useRef<HTMLDivElement>(null)
  const [heroHpHeight, setHeroHpHeight] = useState(70)

  useMeasureOnLayout(heroHpRef, () => {
    const height = heroHpRef.current?.getBoundingClientRect().height ?? 0
    if (height > 0) setHeroHpHeight((current) => (current === height ? current : height))
  })

  /**
   * Nhãn "đúng / chưa đúng" hiện ngay trong khung trận.
   *
   * Chỉ hiện ở pha chọn phép và pha phản hồi - tức sau khi trẻ đã trả lời. Ở pha
   * câu hỏi thì `lastJudgement` vẫn còn của câu TRƯỚC, hiện lên là nói dối.
   */
  const verdict =
    (battle.phase === 'feedback' || battle.phase === 'spell') && battle.lastJudgement
      ? {
          good: battle.lastJudgement.correct,
          text: battle.lastJudgement.correct
            ? battle.lastJudgement.quality === 'ok'
              ? '~ TẠM ĐƯỢC'
              : '✓ ĐÚNG RỒI!'
            : '✗ CHƯA ĐÚNG',
        }
      : null

  /** Con thú ra trận - chính con sẽ ăn đòn tiếp theo. */
  const activePet = battle.pet
  const live = turn.key === answerCount ? turn.kind : null
  const damage = battle.lastDamage
  const heroHurt = live === 'enemy-attacks'

  return (
    <motion.div
      ref={arenaRef}
      className="pixel-ui relative overflow-hidden"
      style={{
        border: '4px solid #1b2432',
        borderRadius: 6,
        // Màn hình ngang đặt lại biến này thành 100% để khung trận cao bằng cột
        // bên trái. Dùng biến CSS chứ không dùng !important.
        //
        // Mức thấp nhất là 300px chứ không phải 230px: thanh máu của trẻ treo trên
        // đầu nhân vật, mà nhân vật cao 128 điểm ảnh và đứng cách đáy 12%. Cộng
        // lại vừa đúng mép trên của khung 230px, nên chỉ cần phông chữ nhỉnh hơn
        // một chút là thanh máu bị cắt cụt.
        height: 'var(--arena-height, clamp(300px, 44dvh, 380px))',
        background: scene.sky,
        // Ảnh nền sắc cạnh, không làm mượt khi phóng to.
        imageRendering: 'pixelated',
      }}
      // Rung cả khung ở MỖI cú chạm, rung theo BẬC chứ không mượt: máy thời đó
      // dịch cả màn hình theo số nguyên điểm ảnh. Con ăn đòn thì rung mạnh và
      // lâu; con đánh trúng quái thì rung ngắn một nhịp - bản trước chỉ rung khi
      // con ăn đòn, nên đòn của con chạm vào quái mà sân đứng im như không.
      // Bắt đầu ở 0,25 giây: đúng lúc cú lao chạm tới (xem `Combatant`).
      animate={
        reduceMotion
          ? { x: 0, y: 0 }
          : heroHurt
            ? { x: [0, -10, 10, -7, 7, -3, 0], y: [0, 3, -3, 2, -2, 0, 0] }
            : live === 'hero-attacks'
              ? { x: [0, 6, -6, 3, 0], y: [0, -2, 2, 0, 0] }
              : { x: 0, y: 0 }
      }
      transition={{ duration: heroHurt ? 0.45 : 0.3, delay: 0.25, ease: 'linear' }}
    >
      {/* Mặt đất: một mảng màu phẳng chiếm nửa dưới */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '48%', background: scene.ground }} />

      {/* Chớp sáng mở màn. Nằm trên nền nhưng DƯỚI hai nhân vật, nên hai bên lao
          vào giữa lúc ánh chớp còn chưa tắt. */}
      <AnimatePresence>
        {intro && !reduceMotion && (
          <motion.div
            className="absolute inset-0"
            style={{ background: '#ffffff', zIndex: 1 }}
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, times: [0, 0.35, 1], ease: 'linear' }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Quái: trên - phải, sprite nhỏ hơn một chút cho cảm giác ở xa */}
      <Combatant
        sprite={enemySprite}
        scene={scene}
        flip
        style={{ right: '12%', top: '16%' }}
        attacking={live === 'enemy-attacks'}
        hit={live === 'hero-attacks'}
        direction={-1}
        reduceMotion={reduceMotion}
        turnKey={turn.key}
        scale={fit.enemy}
        // Quái lao vào từ mép phải, trẻ từ mép trái - hai bên gặp nhau giữa sân.
        enterFrom={220}
        idleDelay="0.4s"
        overlay={
          <StatusAura
            kinds={battle.enemyStatus.map((effect) => effect.kind)}
            reduceMotion={reduceMotion}
          />
        }
      />

      {/*
        Cú nổ của chiêu cuối, giữa sân.

        Đọc từ `lastSpell` - trường này chỉ khác null ở pha phản hồi ngay sau cú
        đánh, nên cú nổ tự tắt khi sang câu mới mà không cần đồng hồ nào.
      */}
      <EffectBurst
        kind={battle.lastSpell?.effect ?? null}
        label={battle.lastSpell?.effect ? EFFECT_UI[battle.lastSpell.effect].label : ''}
        icon={battle.lastSpell?.effect ? EFFECT_UI[battle.lastSpell.effect].icon : ''}
        color={battle.lastSpell?.effect ? EFFECT_UI[battle.lastSpell.effect].color : '#fff'}
        turnKey={turn.key}
        reduceMotion={reduceMotion}
      />

      {/*
        CON THÚ ĐANG RA TRẬN đứng ở tuyến đầu, không phải nhân vật của trẻ.

        Engine vẫn luôn nói như vậy - "trẻ không tự đánh mà có một ĐỘI THÚ đánh
        thay", sát thương của quái rơi vào con đang đứng, con ấy gục thì con sau
        bước ra. Nhưng sân đấu lại vẽ nhân vật của trẻ lao vào. Nên suốt cả trận,
        thứ trẻ nhìn thấy nói ngược với thứ luật chơi đang làm, và đàn thú - vốn
        quyết định máu, sức đánh và cả bộ chiêu - không bao giờ xuất hiện.

        Đổi con đứng đây là đổi luôn câu trả lời cho "nuôi thú để làm gì": con
        thú của trẻ là thứ đang đánh nhau, nhìn thấy được, và đổi hình mỗi lần
        tiến hoá.

        `key` theo id con thú để hoạt cảnh chạy lại từ đầu khi con trước gục và
        con sau bước ra - nếu không thì con mới hiện ra ở đúng tư thế con cũ vừa
        ngã xuống.
      */}
      {activePet ? (
        <Combatant
          key={activePet.pet.id}
          sprite={petSpriteFor(activePet.pet.sprite, activePet.pet.element)}
          scene={scene}
          style={{ left: '9%', bottom: '12%' }}
          attacking={live === 'hero-attacks'}
          hit={live === 'enemy-attacks'}
          direction={1}
          reduceMotion={reduceMotion}
          turnKey={turn.key}
          scale={fit.hero}
          enterFrom={-220}
          idleDelay="0s"
        />
      ) : null}

      {/* Trẻ đứng lùi sau con thú, nhỏ hơn: chỗ của người ra lệnh, không phải
          chỗ của người ăn đòn. */}
      <Trainer
        avatar={avatar}
        name={heroName}
        scale={Math.max(3, Math.round(fit.hero * 0.5))}
        style={{ left: '1%', bottom: '9%' }}
        reduceMotion={reduceMotion}
      />

{/*
        HAI KHUNG MÁU ĐÃ ĐỔI CHỖ.
        Bố cục cũ đặt máu quái ở trên-trái, máu trẻ ở dưới-phải: đúng kiểu game
        thời đó, nhưng hai thanh đều rời khỏi chủ của nó, và mắt đọc từ trên
        xuống nên thanh trên cùng bị hiểu thành "của mình".
        Giờ thanh của trẻ treo NGAY TRÊN ĐẦU nhân vật - không còn gì để nhầm.
      */}

      {/* Khung máu của trẻ: bám ngay trên đầu nhân vật.
          `bottom` tính từ chân nhân vật (12%) cộng chiều cao sprite (8 × 16 =
          128px) - dùng phần trăm thuần thì khung trận cao thấp khác nhau là
          thanh máu trôi khỏi đầu.

          `min()` là cái chặn: khung trận co theo chỗ trống còn lại, và khi nó
          tụt xuống dưới khoảng 215px thì 12% cộng 132px đẩy thanh máu vượt qua
          mép trên. Chặn ở "cách đáy đúng bằng chiều cao khung trừ 62px" nên dù
          khung có thấp tới đâu, thanh máu vẫn nằm trong. */}
      <motion.div
        ref={heroHpRef}
        className="absolute"
        style={{
          left: '4%',
          /*
            Treo trên đầu nhân vật, nhưng KHÔNG BAO GIỜ trèo qua mép trên.

            Chiều cao nhân vật là `fit.hero × 16` điểm ảnh, cộng 4px cho khỏi
            dính đầu. Gõ cứng 132px như trước thì nhân vật co lại mà thanh máu
            vẫn treo ở chỗ cũ, lơ lửng giữa trời.

            Cái chặn phải trừ CHIỀU CAO THẬT của chính khung máu này. Bản trước
            trừ một con số 62px gõ tay, mà khung máu cao hơn thế - nên ở khung
            trận thấp, cái chặn đẩy khung máu lên tới mức nửa trên của nó thò hẳn
            ra ngoài viền. Đo rồi trừ thì không còn chỗ nào để lệch.
          */
          bottom: `min(calc(12% + ${fit.hero * 16 + 4}px), calc(100% - ${heroHpHeight + 8}px))`,
          zIndex: 3,
        }}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.75 }}
      >
        <HpBox
          name="Con"
          level={heroLevel}
          hp={battle.playerHp}
          // Máu hiển thị là máu CON THÚ đang đánh, nên mức tối đa cũng phải là
          // của nó. Lấy player.maxHp (máu của riêng nhân vật thời chưa có thú)
          // sẽ ra những con số vô lý kiểu "108/50".
          maxHp={battle.pet.pet.maxHp}
          showNumbers
        />
      </motion.div>

      {/* Khung máu quái: xuống chỗ cũ của thanh máu trẻ, dưới - PHẢI. */}
      <motion.div
        className="absolute"
        style={{ right: 10, bottom: 10, zIndex: 3 }}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.85 }}
      >
        {/*
          Hệ HIỆN TẠI của quái, chỉ hiện với con biết đổi hệ.

          Khung diễn biến có báo "đổi sang hệ Thanh Âm", nhưng dòng đó trôi đi
          mất sau một câu, còn quyết định chọn phép thì diễn ra ở câu SAU. Cái
          nhãn này đứng yên ngay trên thanh máu quái, nên lúc bảng phép mở ra
          trẻ vẫn nhìn thấy mình đang đánh vào hệ gì.
        */}
        {battle.enemy.shiftEvery ? (
          <div className="mb-1 flex justify-end">
            <span
              className="pixel-font text-base"
              style={{
                padding: '1px 8px',
                borderRadius: 4,
                border: '3px solid #1b2432',
                background: ELEMENT_BADGE[battle.enemyElement],
                color: '#101620',
              }}
            >
              Hệ {ELEMENT_SHORT[battle.enemyElement]}
              {battle.enraged && ' · 😡'}
            </span>
          </div>
        ) : null}

        <HpBox
          name={battle.enemy.name}
          level={enemyLevel}
          hp={battle.enemyHp}
          maxHp={battle.enemy.maxHp}
        />
      </motion.div>

      {/* Kết quả đúng/sai, hiện NGAY TRONG khung trận.
          Trước đây chỉ có ở khung thoại phía dưới, mà trên màn hình dọc thì khung
          đó nằm ngoài tầm mắt - trẻ vừa bấm xong phải cúi xuống mới biết mình
          đúng hay sai, đúng lúc đáng lẽ phải sướng nhất. */}
      <AnimatePresence>
        {verdict && (
          <motion.div
            key={`verdict-${answerCount}`}
            className="pixel-font absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
            style={{
              top: 10,
              zIndex: 4,
              padding: '4px 14px',
              borderRadius: 6,
              border: '4px solid #1b2432',
              background: verdict.good ? '#d7f5d0' : '#f5d0d0',
              color: verdict.good ? '#2f7d32' : '#a32e2e',
              fontSize: 22,
              lineHeight: 1.2,
            }}
            initial={{ opacity: 0, y: -14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            aria-hidden="true"
          >
            {verdict.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Số sát thương bay lên tại chỗ trúng đòn */}
      <AnimatePresence>
        {live && damage && (live === 'hero-attacks' || live === 'enemy-attacks') && (
          <motion.span
            key={turn.key}
            className="pixel-font absolute -translate-x-1/2"
            style={{
              left: live === 'hero-attacks' ? '76%' : '17%',
              top: live === 'hero-attacks' ? '30%' : '58%',
              fontSize: live === 'hero-attacks' && battle.lastSpell?.matchup === 'strong' ? 46 : 34,
              lineHeight: 1,
              color:
                live === 'hero-attacks' && battle.lastSpell?.matchup === 'strong'
                  ? '#ffd447'
                  : '#ffffff',
              // Viền chữ bằng bốn bóng đổ cứng, không dùng bóng mờ - đúng cách
              // chữ được viền trong game pixel.
              textShadow:
                '2px 0 0 #1b2432, -2px 0 0 #1b2432, 0 2px 0 #1b2432, 0 -2px 0 #1b2432',
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: 'linear' }}
            aria-hidden="true"
          >
            -{live === 'hero-attacks' ? damage.toEnemy : damage.toPlayer}
            {live === 'hero-attacks' && battle.lastSpell && (
              <span
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
                style={{ top: '100%', fontSize: 15 }}
              >
                {battle.lastSpell.matchup === 'strong'
                  ? 'KHẮC CHẾ!'
                  : battle.lastSpell.matchup === 'weak'
                    ? 'bị khắc'
                    : battle.lastSpell.spell.name}
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Hoạt cảnh của phép vừa tung - mỗi nguyên tố một kiểu */}
      <AnimatePresence>
        {live === 'hero-attacks' && battle.lastSpell && (
          <SpellBurst
            key={`burst-${turn.key}`}
            element={battle.lastSpell.spell.element}
            strong={battle.lastSpell.matchup === 'strong'}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>

      {/*
        Loé trắng toàn màn hình lúc va chạm. Máy thời đó không làm được hiệu ứng
        phức tạp nên dùng đúng một thủ pháp này để báo "vừa có cú đánh trúng" -
        và nó vẫn là cách hiệu quả nhất.
      */}
      <AnimatePresence>
        {live && (live === 'hero-attacks' || live === 'enemy-attacks') && !reduceMotion && (
          <motion.div
            key={`flash-${turn.key}`}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                live === 'enemy-attacks'
                  ? '#ff5a5a'
                  : battle.lastSpell
                    ? SPELL_FX[battle.lastSpell.spell.element].flash
                    : '#ffffff',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.75, 0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, delay: 0.25, ease: 'linear' }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Chuỗi đúng liên tiếp */}
      {battle.combo >= 2 && (
        <div
          className="pixel-font absolute left-1/2 -translate-x-1/2 px-2 text-xl"
          style={{
            top: 8,
            background: '#ffd447',
            border: '3px solid #1b2432',
            borderRadius: 4,
            color: '#1b2432',
          }}
        >
          CHUOI x{battle.combo}
        </div>
      )}
    </motion.div>
  )
}

/*
  Vẫn xuất lại `arenaScales` từ đây.

  Nó đã chuyển sang `arena.tsx` cùng với hai hằng số nó dùng, nhưng
  `arena-scale.test.ts` nhập nó từ file này - và cái tên trong câu "test này
  giữ đúng ba điều" ở đầu file test ấy trỏ về đây. Một dòng xuất lại rẻ hơn việc
  bắt người đọc đi tìm.
*/
export { arenaScales } from './arena'

