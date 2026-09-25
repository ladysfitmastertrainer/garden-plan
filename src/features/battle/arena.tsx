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

import { AnimatePresence, motion } from 'framer-motion'
import type { Habitat, Subject } from '../../content/types'
import type { EffectKind } from '../../engine/pets'
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
 * Nền trận khi đánh quái của một MÔI TRƯỜNG: đánh con cá thì đứng giữa nước,
 * đánh con cua thì đứng trong hang. Cùng một khuôn hai mảng màu với nền của môn,
 * chỉ đổi màu - để trẻ vào trận vẫn nhớ mình vừa bước ra từ đâu.
 */
export const SCENE_BY_HABITAT: Record<Habitat, (typeof SCENE_BY_SUBJECT)[Subject]> = {
  sea: { sky: '#9fe0f2', ground: '#5fb8e0', platform: '#efe2b4', platformEdge: '#c9b37a' },
  cave: { sky: '#3b3240', ground: '#6b5f58', platform: '#857871', platformEdge: '#51463f' },
  forest: { sky: '#bfe8a8', ground: '#4f9e4a', platform: '#b98552', platformEdge: '#8a5d33' },
  lava: { sky: '#5a2a24', ground: '#5d5654', platform: '#8a3a1c', platformEdge: '#ff6a1f' },
  // Ngoài khơi: trời xám bão, biển thẫm - trẻ đứng trên một mỏm đá giữa sóng.
  deep: { sky: '#6f8aa3', ground: '#2a5b96', platform: '#8a8f99', platformEdge: '#5a606b' },
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
  overlay,
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
  /**
   * Lớp vẽ đè lên sprite - dấu hiệu ứng đang bám (xem `StatusAura`).
   *
   * Nhận vào đây chứ không để chỗ gọi tự đặt một khối tuyệt đối bên ngoài: bên
   * ngoài thì phải tự tính lại bội số phóng và toạ độ, mà hai con số ấy đã sống
   * sẵn trong này rồi. Và quan trọng hơn - đặt trong này thì dấu RUNG THEO
   * sprite lúc trúng đòn, chứ không đứng yên trong khi con quái giật nảy lên.
   */
  overlay?: React.ReactNode
}) {
  const spriteWidth = 16 * scale
  /** Quãng lao khi ra đòn: gần trọn một thân sprite - xem nhánh `attacking`. */
  const lunge = spriteWidth * 0.9

  return (
    <motion.div
      className="absolute"
      // Bên đang lao tới nổi lên trên: nó lao sát vào đối thủ, và chui xuống dưới
      // thanh máu hay dưới chính con kia thì cú đánh mất một nửa.
      style={{ ...style, zIndex: attacking ? 4 : 2 }}
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
            ? /*
                CÚ LAO TỚI SÁT ĐỐI THỦ, không phải một cú nhích.

                Bản trước lao 30 điểm ảnh trong 0,35 giây - trên một sân rộng vài
                trăm điểm ảnh, mắt không nhận ra đó là một đòn đánh. Giờ lùi lấy đà,
                lao gần trọn một thân sprite theo ĐƯỜNG CHÉO tới chỗ đối thủ đứng
                (thú ở dưới - trái, quái ở trên - phải), khựng lại đúng lúc chạm,
                rồi mới lùi về. Tính theo cỡ sprite nên máy to máy nhỏ đều lao tới
                cùng một chỗ trên sân.
              */
              {
                x: [0, -direction * lunge * 0.15, direction * lunge, direction * lunge, 0],
                y: [0, 0, -direction * lunge * 0.4, -direction * lunge * 0.4, 0],
              }
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
          ? // Chạm ở mốc 50% (0,25 giây) - đúng lúc bên kia bắt đầu giật lùi, xem
            // `delay` của nhánh trúng đòn ngay dưới. Khựng lại một nhịp ở chỗ chạm
            // cho đòn có sức nặng, rồi mới lùi về.
            { duration: 0.5, times: [0, 0.2, 0.5, 0.62, 1], ease: 'easeOut' }
          : hit
            ? { duration: 0.38, delay: 0.25, ease: 'linear' }
            : { duration: 0.55, delay: 0.25 }
      }
    >
      <div className="relative" style={{ width: spriteWidth }}>
        {overlay}
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

/* ===========================================================================
   HOẠT HOẠ HIỆU ỨNG CHIÊU CUỐI

   Một hiệu ứng mà trẻ không NHÌN THẤY thì bằng không có. "Quái mất máu mỗi
   lượt" nếu chỉ là một dòng chữ trong khung diễn biến thì đứa bé sáu tuổi đang
   dán mắt vào sân đấu sẽ không bao giờ đọc, và chiêu cuối - thứ đắt nhất của cả
   bản này - hoá ra chỉ là một cú đánh mạnh.

   Nên mỗi hiệu ứng được kể HAI LẦN, bằng hai thứ khác nhau:

     CÚ NỔ   - một lần, to, giữa sân, ngay lúc chiêu chạm vào. Có tên hiệu ứng
               viết thẳng ra bằng chữ. Đây là lúc trẻ HỌC nó là cái gì.
     DẤU BÁM - nhỏ, lặng, bám trên mình con quái suốt mấy lượt sau. Đây là lúc
               trẻ NHỚ rằng nó vẫn đang có tác dụng.

   Thiếu cú nổ thì dấu bám là một hình lạ không ai biết từ đâu ra. Thiếu dấu bám
   thì cú nổ chớp qua rồi thôi, và lượt sau quái mất máu mà không rõ vì sao.
   =========================================================================== */

/**
 * Dấu hiệu ứng BÁM trên mình con quái, vẽ đè lên sprite.
 *
 * Vẽ bằng khối màu phẳng chứ không dùng emoji: cả sân đấu là pixel art, một
 * emoji bóng loáng của hệ điều hành dán lên đó là thứ duy nhất trên màn hình
 * trông như đến từ một trò chơi khác.
 *
 * Nằm đè lên đúng ô của sprite (`inset: 0`) nên nó co giãn theo bội số phóng mà
 * không phải tính lại gì - khung trận to nhỏ thế nào thì dấu cũng vừa bấy nhiêu.
 */
export function StatusAura({
  kinds,
  reduceMotion,
}: {
  kinds: EffectKind[]
  reduceMotion: boolean
}) {
  if (kinds.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 3 }} aria-hidden="true">
      {/* CHÁY: lưỡi lửa liếm lên từ chân, so le nhau cho ra nhịp bập bùng. */}
      {kinds.includes('burn') &&
        [12, 38, 64, 84].map((left, i) => (
          <motion.div
            key={`burn-${left}`}
            className="absolute"
            style={{
              left: `${left}%`,
              bottom: '6%',
              width: 6,
              height: 14,
              background: i % 2 === 0 ? '#ff9d3c' : '#e2584d',
              borderRadius: '3px 3px 0 0',
            }}
            animate={reduceMotion ? {} : { scaleY: [1, 1.7, 0.8, 1.4, 1], opacity: [0.95, 1, 0.8, 1] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'linear' }}
          />
        ))}

      {/* ĐÓNG BĂNG: khối băng phủ kín, hơi trong để còn thấy con quái bên dưới -
          phủ đục thì quái biến mất và trẻ tưởng nó chạy rồi. */}
      {kinds.includes('freeze') && (
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgb(140 215 245 / 0.5)', border: '3px solid #cdeaf7', borderRadius: 4 }}
          animate={reduceMotion ? {} : { opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* TRÓI: ba vòng dây vắt ngang. Nghiêng nhẹ cho ra dáng quấn quanh thân,
          chứ ba vạch thẳng băng thì trông như song sắt. */}
      {kinds.includes('bind') &&
        [26, 48, 70].map((top, i) => (
          <motion.div
            key={`bind-${top}`}
            className="absolute"
            style={{
              left: '-6%',
              top: `${top}%`,
              width: '112%',
              height: 6,
              background: '#8a5a2b',
              border: '2px solid #5d3a18',
              transform: `rotate(${i % 2 === 0 ? -6 : 5}deg)`,
            }}
            animate={reduceMotion ? {} : { x: [0, 2, -2, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: 'linear' }}
          />
        ))}

      {/* HÚT: những chấm máu bay NGANG, về phía bên mình. Hướng bay chính là
          chỗ nói ra "máu đang chảy về phía con" - bay lung tung thì nó chỉ là
          một đám bụi tím. */}
      {kinds.includes('drain') &&
        [20, 46, 72].map((top, i) => (
          <motion.div
            key={`drain-${top}`}
            className="absolute"
            style={{ top: `${top}%`, left: '10%', width: 7, height: 7, background: '#a78bfa', borderRadius: 2 }}
            animate={reduceMotion ? {} : { x: [0, -46], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.3, ease: 'linear' }}
          />
        ))}
    </div>
  )
}

/**
 * CÚ NỔ khi chiêu cuối chạm vào: tên hiệu ứng viết thẳng ra giữa sân.
 *
 * Viết BẰNG CHỮ, không chỉ bằng hình. Một khối băng hiện ra rồi tan đi thì trẻ
 * thấy đẹp nhưng không đọc ra luật; chữ "ĐÓNG BĂNG" nảy lên giữa sân đúng lúc
 * ấy thì lần sau nhìn cái dấu băng nhỏ trên mình quái là nhớ ra ngay.
 *
 * `turnKey` để `AnimatePresence` biết đây là một cú nổ MỚI: thiếu nó thì hai
 * lần tung cùng một chiêu cách nhau ba lượt chỉ diễn hoạt đúng lần đầu.
 */
export function EffectBurst({
  kind,
  label,
  icon,
  color,
  turnKey,
  reduceMotion,
}: {
  kind: EffectKind | null
  label: string
  icon: string
  color: string
  turnKey: number
  reduceMotion: boolean
}) {
  return (
    <AnimatePresence>
      {kind && (
        <motion.div
          key={`${turnKey}-${kind}`}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 6 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden="true"
        >
          <motion.div
            className="flex flex-col items-center"
            initial={reduceMotion ? false : { scale: 0.3, y: 14 }}
            animate={{ scale: [0.3, 1.25, 1], y: 0 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
          >
            <span style={{ fontSize: 46, lineHeight: 1 }}>{icon}</span>
            <span
              className="pixel-font"
              style={{
                fontSize: 26,
                lineHeight: 1,
                color,
                textShadow:
                  '2px 0 0 #1b2432, -2px 0 0 #1b2432, 0 2px 0 #1b2432, 0 -2px 0 #1b2432',
              }}
            >
              {label.toUpperCase()}!
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
