/**
 * NHỮNG MẢNH CHUNG CỦA MỘT SÂN ĐẤU.
 *
 * Trước đây tất cả nằm trong `PixelBattle`, vì chỉ có một sân đấu duy nhất -
 * trận đánh quái. Giờ có hai: trận đánh quái, và trận tay đôi với bạn cùng lớp.
 *
 * Tách ra chứ không chép sang, và lý do rất cụ thể: hai sân đấu chép từ nhau sẽ
 * TRÔI khỏi nhau. Sửa nhịp rung lúc trúng đòn ở một bên thì bên kia vẫn rung
 * kiểu cũ, và trẻ sẽ học hai thứ ngôn ngữ hình ảnh cho cùng một chuyện. Cả điểm
 * của việc "trận PVP nhìn giống trận đánh quái" là để trẻ KHÔNG phải học lại.
 */

import { motion } from 'framer-motion'
import type { Subject } from '../../content/types'
import { PixelSprite } from '../pixel/sprite'
import { heroSprite } from '../pixel/heroes'

/**
 * Khung trận mà hai con số 8 và 6 dưới đây được vẽ vừa.
 *
 * 400×320 không phải con số tròn cho đẹp: nó được chọn để một điện thoại phổ
 * thông XOAY NGANG rơi vào đúng hệ số 1,0 (khung trận khi đó rộng chừng 402px),
 * còn khi dựng đứng thì rơi xuống khoảng 0,89 - tức thấp hơn đúng một bậc. Nhờ
 * vậy xoay máy ra là sân đấu to lên thấy được, chứ không phải to lên trên giấy.
 */
const ARENA_REFERENCE = { width: 400, height: 320 }
export const HERO_SCALE = 8
export const ENEMY_SCALE = 6

/**
 * Bội số phóng của hai nhân vật, vừa với một khung trận cỡ này.
 *
 * Lấy chiều CHẬT HƠN trong hai chiều làm chuẩn: khung rộng mà thấp thì chiều cao
 * là thứ chặn, và ngược lại. Lấy trung bình hay lấy bề ngang thôi là có một
 * hướng máy nào đó sprite tràn ra ngoài.
 */
export function arenaScales(width: number, height: number): { hero: number; enemy: number } {
  const factor = Math.min(width / ARENA_REFERENCE.width, height / ARENA_REFERENCE.height)
  const pick = (base: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(base * factor)))

  // Sàn 4 và 3: dưới mức đó thì con quái nhỏ hơn cái thanh máu của chính nó, và
  // trẻ không còn nhận ra mình đang đánh con gì.
  return { hero: pick(HERO_SCALE, 4, 12), enemy: pick(ENEMY_SCALE, 3, 9) }
}


/** Nền trận đấu: hai mảng màu phẳng, không chuyển sắc. */
export const SCENE_BY_SUBJECT: Record<Subject, { sky: string; ground: string; platform: string; platformEdge: string }> = {
  math: { sky: '#a8dcf0', ground: '#7cc96a', platform: '#5aab4c', platformEdge: '#3d7f36' },
  vietnamese: { sky: '#f6c9d8', ground: '#6fbf86', platform: '#4fa06a', platformEdge: '#357a4c' },
  music: { sky: '#c9c2f5', ground: '#77c6e0', platform: '#4fa3c4', platformEdge: '#357c99' },
  ethics: { sky: '#bfe6ff', ground: '#8fd98f', platform: '#66b96e', platformEdge: '#468f50' },
}


/**
 * Một bên tham chiến, KÈM LUÔN bệ đứng của mình.
 *
 * Bệ được vẽ như con của nhân vật chứ không đặt riêng: nếu tách rời thì mỗi lần
 * đổi cỡ sprite hay đổi vị trí lại phải căn tay hai chỗ, và nó lệch ngay.
 */
export function Combatant({
  sprite,
  scene,
  style,
  flip,
  attacking,
  hit,
  direction,
  reduceMotion,
  turnKey,
  scale = 7,
  enterFrom,
  idleDelay,
}: {
  sprite: Parameters<typeof PixelSprite>[0]['sprite']
  scene: { platform: string; platformEdge: string }
  style: React.CSSProperties
  flip?: boolean
  attacking: boolean
  hit: boolean
  /** 1 = mặt quay sang phải, -1 = sang trái. Quyết định hướng lao tới. */
  direction: 1 | -1
  reduceMotion: boolean
  turnKey: number
  scale?: number
  /** Lệch ngang lúc mở màn, tính bằng điểm ảnh. Âm là lao vào từ bên trái. */
  enterFrom: number
  /** Lệch pha nhịp nhún, để hai bên không nhún cùng lúc như hai con rối. */
  idleDelay: string
}) {
  const spriteWidth = 16 * scale

  return (
    <motion.div
      className="absolute"
      style={{ ...style, zIndex: 2 }}
      initial={reduceMotion ? false : { x: enterFrom, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.9, 0.3, 1] }}
    >
    <motion.div
      key={`${turnKey}-${attacking}-${hit}`}
      animate={
        reduceMotion
          ? {}
          : attacking
            ? { x: [0, -direction * 9, direction * 30, 0] }
            : hit
              ? // Quy ước trúng đòn của game thời đó: sprite nhấp nháy tắt - hiện,
                // cộng một cú GIẬT tần số cao. Giật thưa và nhẹ thì chỉ thấy
                // sprite trôi qua trôi lại; phải nhiều bậc và biên độ giảm dần
                // mới ra cảm giác vừa ăn một đòn nặng.
                {
                  opacity: [1, 0, 1, 0, 1, 0, 1],
                  x: [0, -direction * 12, direction * 10, -direction * 7, direction * 5, -direction * 3, 0],
                }
              : {}
      }
      transition={
        attacking
          ? { duration: 0.35 }
          : hit
            ? { duration: 0.38, delay: 0.25, ease: 'linear' }
            : { duration: 0.55, delay: 0.25 }
      }
    >
      <div className="relative" style={{ width: spriteWidth }}>
        {/* Bệ elip nằm dưới chân, vẽ trước nên luôn ở phía sau nhân vật. */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: scale * 0.5,
            width: spriteWidth * 1.35,
            height: scale * 3,
            background: scene.platform,
            border: `3px solid ${scene.platformEdge}`,
            borderRadius: '50%',
          }}
          aria-hidden="true"
        />
        {/*
          Bóng mờ đuổi theo sau sprite chính, trễ hơn một nhịp rất ngắn. Mắt
          gộp hai hình thành một vệt nhoè - đúng cảm giác "giật nhoè" khi trúng
          đòn. Không dùng filter blur: làm mượt điểm ảnh là phá nét pixel.
        */}
        {hit && !reduceMotion && (
          <motion.div
            className="absolute inset-0"
            style={{ opacity: 0.4, mixBlendMode: 'screen' }}
            initial={{ x: 0 }}
            animate={{
              x: [0, -direction * 12, direction * 10, -direction * 7, direction * 5, -direction * 3, 0],
            }}
            transition={{ duration: 0.38, delay: 0.3, ease: 'linear' }}
            aria-hidden="true"
          >
            <PixelSprite sprite={sprite} scale={scale} flip={flip} />
          </motion.div>
        )}

        {/* Nhún nhẹ trong lúc chờ lượt. Dừng hẳn khi đang đánh hoặc đang trúng
            đòn - hai chuyển động chồng lên nhau thì cú đánh mất sức nặng. */}
        <div
          style={
            {
              position: 'relative',
              // MỘT "điểm ảnh gốc" của sprite mỗi nấc, hai nấc là hai điểm ảnh - đúng
              // biên độ nhún chờ lượt của game pixel. Gấp đôi lên là nhân vật bay hẳn
              // khỏi bệ, nhìn thành nhảy chứ không phải thở.
              '--idle': `${scale}px`,
              animation:
                attacking || hit
                  ? undefined
                  : `battle-idle 1.1s steps(1, end) ${idleDelay} infinite`,
            } as React.CSSProperties
          }
        >
          <PixelSprite sprite={sprite} scale={scale} flip={flip} />
        </div>
      </div>
    </motion.div>
    </motion.div>
  )
}

/**
 * Khung máu kiểu GBA: tên + cấp ở trên, thanh máu ở dưới.
 * Thanh đổi màu theo mức còn lại - xanh rồi vàng rồi đỏ - đúng quy ước quen
 * thuộc, và là cách báo nguy hiểm không cần đọc chữ.
 */
export function HpBox({
  name,
  level,
  hp,
  maxHp,
  showNumbers,
}: {
  name: string
  /**
   * Cấp của chủ nhân thanh máu. Bỏ trống thì KHÔNG hiện chữ "Lv" nào.
   *
   * Đấu trường tay đôi không biết cấp của bạn bên kia - dữ liệu trận đấu cố ý
   * chỉ mang đúng những gì cần để đánh nhau. Một chữ "Lv0" ở đó nói sai, mà
   * nói sai còn tệ hơn không nói.
   */
  level?: number
  hp: number
  maxHp: number
  showNumbers?: boolean
}) {
  const percent = maxHp === 0 ? 0 : Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const color = percent > 50 ? '#4bc95a' : percent > 20 ? '#f0c419' : '#e0483e'

  return (
    <div
      className="pixel-font"
      style={{
        minWidth: 168,
        background: '#f8f8f0',
        border: '3px solid #1b2432',
        borderRadius: 5,
        boxShadow: 'inset 0 0 0 2px #d8d8c8',
        padding: '3px 8px 5px',
        color: '#1b2432',
      }}
    >
      <div className="flex items-baseline justify-between gap-2" style={{ lineHeight: 1.1 }}>
        <span className="truncate text-lg">{name}</span>
        {level !== undefined && <span className="shrink-0 text-base">Lv{level}</span>}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm" style={{ color: '#c8a800' }}>
          HP
        </span>
        <div
          style={{
            flex: 1,
            height: 9,
            background: '#5a6472',
            border: '2px solid #1b2432',
            borderRadius: 3,
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={hp}
          aria-valuemin={0}
          aria-valuemax={maxHp}
          aria-label={`Máu của ${name}`}
        >
          <motion.div
            style={{ height: '100%', background: color }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: 'linear', delay: 0.3 }}
          />
        </div>
      </div>

      {showNumbers && (
        <p className="text-right text-base" style={{ lineHeight: 1 }}>
          {hp}/{maxHp}
        </p>
      )}
    </div>
  )
}


/**
 * Nhân vật của trẻ, đứng lùi sau con thú.
 *
 * Nhỏ hơn hẳn và KHÔNG có bệ đứng: bệ đứng là thứ nói "đây là đấu thủ", mà đấu
 * thủ ở sân này là con thú. Người đứng sau chỉ để trẻ nhận ra bên nào là bên
 * mình - và để bạn kia có một khuôn mặt, chứ không chỉ có một cái tên.
 */
export function Trainer({
  avatar,
  name,
  scale,
  style,
  flip,
  reduceMotion,
}: {
  avatar: string
  name: string
  scale: number
  style: React.CSSProperties
  /** Đứng ở nửa sân bên kia thì quay mặt lại, nhìn về phía đối thủ. */
  flip?: boolean
  reduceMotion: boolean
}) {
  return (
    <motion.div
      className="absolute"
      style={{ ...style, zIndex: 1, lineHeight: 0, transform: flip ? 'scaleX(-1)' : undefined }}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      aria-hidden="true"
    >
      <PixelSprite sprite={heroSprite(avatar, name)} scale={scale} />
    </motion.div>
  )
}
