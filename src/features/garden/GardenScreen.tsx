/**
 * HỘP CẢNH - mảnh vườn riêng, nơi đàn thú của trẻ thật sự SỐNG.
 *
 * Mọi màn hình khác trong game này dẫn tới một trận đánh. Màn này không dẫn đi
 * đâu cả, và đó là điểm của nó. Ở bộ sưu tập, mười hai con thú là mười hai cái
 * thẻ xếp thành hàng; ở đây chúng đi lại trên đất, giữa những cái cây do chính
 * đứa trẻ đặt xuống.
 *
 * ---- HAI THỨ PHẢI ĐÚNG, KHÔNG THÌ CẢ MÀN NÀY VÔ NGHĨA ----
 *
 * THỨ NHẤT: THÚ PHẢI ĐI. Một mảnh đất đẹp với mấy con thú đứng chôn chân là một
 * bức tranh, và trẻ nhìn một bức tranh đúng ba giây. Chúng phải nhúc nhích, phải
 * đi từ chỗ này sang chỗ kia, phải quay mặt theo hướng đi - lúc ấy mới thành
 * "đàn thú của con đang chơi ngoài vườn".
 *
 * THỨ HAI: ĐẶT SAI PHẢI SỬA ĐƯỢC KHÔNG MẤT GÌ. Trẻ bảy tuổi đặt cái cây đầu
 * tiên vào chỗ xấu nhất có thể. Dỡ ra mà mất vàng thì em ấy thôi không thử nữa,
 * và một khu vườn không ai dám thử thì là một bài kiểm tra chứ không phải vườn.
 * Xem `removeGardenPart` - hoàn đủ.
 *
 * ---- VẼ NGHIÊNG BẰNG ĐÚNG NHỮNG MẢNH CỦA BẢN ĐỒ ----
 *
 * Ô đất dựng bằng `makeIsoIsland`, món cảnh vật gắn bằng `placeProp` - cùng hai
 * hàm mà bản đồ thế giới đang dùng. Nhờ vậy khu vườn nhìn ra là cùng một thế
 * giới với chỗ trẻ vừa đi đánh quái, chứ không phải một trò chơi khác dán vào.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import {
  GARDEN_COLS,
  GARDEN_PARTS,
  GARDEN_ROWS,
  cellKey,
  cleanGarden,
  gardenSlots,
  getGardenPart,
  nextSlotLevel,
} from '../../content/garden'
import { ISO_MEDIUM, makeIsoIsland, placeProp } from '../pixel/iso'
import { PixelSprite } from '../pixel/sprite'
import { petSpriteFor } from '../inventory/PetCollection'
import { getPet } from '../../content/pets'
import { resolvePet } from '../../engine/pets'
import { levelFromTotalXp } from '../../engine/rewards'
import { useGame } from '../../store/game'
import { useUi } from '../../store/ui'
import { useMeasureOnLayout } from '../../shell/useMeasureOnLayout'
import { useReduceMotion } from '../../shell/useReduceMotion'

/** Cỏ của khu vườn - xanh tươi hơn mọi vùng đất trên bản đồ, vì đây là nhà. */
const SOIL = {
  top: '#7cc96a',
  topEdge: '#9adb86',
  leftWall: '#5a4630',
  rightWall: '#7a6140',
  outline: '#2c4426',
}

const TILE = makeIsoIsland(SOIL, ISO_MEDIUM)

/** Điểm ảnh gốc; cả khu vườn phóng to bằng CSS nên giữ số nguyên ở đây. */
const HALF_W = ISO_MEDIUM.width / 2
const HALF_H = ISO_MEDIUM.topHeight / 2

/** Toạ độ màn hình của một ô, trước khi phóng to. */
function cellAt(col: number, row: number) {
  return {
    x: (col - row) * HALF_W + (GARDEN_ROWS - 1) * HALF_W,
    y: (col + row) * HALF_H,
  }
}

/**
 * VÙNG BẤM PHẢI ĐÚNG HÌNH VIÊN GẠCH, không phải hình chữ nhật bao quanh nó.
 *
 * Đây là một lỗi đã suýt lọt, và nó thuộc loại không ai báo cáo được: ô đất là
 * hình thoi, nhưng một cái nút thì là hình chữ nhật. Hai ô cạnh nhau có hộp chữ
 * nhật CHỒNG LÊN NHAU ở bốn góc, và ô nào vẽ sau thì nuốt góc của ô vẽ trước.
 *
 * Hậu quả trên tay một đứa trẻ: bấm vào khoảng đất trống cạnh cái cây thì lại
 * trúng cái cây, và cây bị dỡ mất. Em ấy sẽ không nói "vùng bấm sai", em ấy sẽ
 * nói "cái cây của con tự biến mất".
 *
 * Cắt theo đúng bóng viên gạch - mặt thoi ở trên, hai vách ở dưới - thì phần bị
 * cắt không nhận chạm nữa, và hai ô cạnh nhau khít vào nhau không chồng chỗ nào.
 */
const TILE_CLIP = (() => {
  const h = ISO_MEDIUM.topHeight + ISO_MEDIUM.depth
  const shoulder = ((ISO_MEDIUM.topHeight / 2) / h) * 100
  const hem = ((ISO_MEDIUM.topHeight / 2 + ISO_MEDIUM.depth) / h) * 100
  return `polygon(50% 0%, 100% ${shoulder}%, 100% ${hem}%, 50% 100%, 0% ${hem}%, 0% ${shoulder}%)`
})()

const BOARD_W = (GARDEN_COLS + GARDEN_ROWS - 1) * HALF_W + ISO_MEDIUM.width
const BOARD_H = (GARDEN_COLS + GARDEN_ROWS - 1) * HALF_H + ISO_MEDIUM.topHeight + ISO_MEDIUM.depth

/** Mọi ô, xếp theo thứ tự vẽ: ô xa vẽ trước để ô gần đè lên. */
const CELLS = Array.from({ length: GARDEN_ROWS }, (_, row) =>
  Array.from({ length: GARDEN_COLS }, (_, col) => ({ col, row })),
)
  .flat()
  .sort((a, b) => a.col + a.row - (b.col + b.row))

export function GardenScreen() {
  const go = useUi((s) => s.go)
  const student = useGame((s) => s.student)
  const progress = useGame((s) => s.progress)
  const place = useGame((s) => s.placeGardenPart)
  const remove = useGame((s) => s.removeGardenPart)
  const reduceMotion = useReduceMotion()

  /** Món đang cầm trên tay. `null` là đang rảnh tay - bấm vào ô là dỡ. */
  const [holding, setHolding] = useState<string | null>(null)

  if (!student) return null

  const level = levelFromTotalXp(student.totalXp).level
  const garden = cleanGarden(progress.garden)
  const used = Object.keys(garden).length
  const slots = gardenSlots(level)
  const nextSlot = nextSlotLevel(level)

  return (
    <div className="pixel-ui mx-auto grid max-w-2xl gap-4 px-4 py-5">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => go('game')} className="btn btn-ghost px-4">
          ←
        </button>
        <h1 className="pixel-font flex-1 text-2xl">VƯỜN CỦA {student.name.toUpperCase()}</h1>
      </header>

      <section className="pixel-panel grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-extrabold">🌳 Mảnh vườn</h2>
          <p className="text-base opacity-70">
            {used}/{slots} ô · 🪙 {student.gold}
          </p>
        </div>
        <p className="text-base opacity-70">
          {holding
            ? 'Bấm vào một ô trống để đặt xuống. Bấm lại vào món đang cầm để bỏ cầm.'
            : 'Chọn một món ở dưới rồi bấm vào ô trống. Bấm vào món đã đặt để dỡ ra - lấy lại đủ vàng.'}
        </p>
        {nextSlot !== null && (
          <p className="text-base opacity-70">Cấp {nextSlot} sẽ mở thêm một ô nữa.</p>
        )}
      </section>

      <Plot
        garden={garden}
        holding={holding}
        full={used >= slots}
        gold={student.gold}
        ownedPets={progress.pets ?? []}
        petXp={progress.petXp ?? {}}
        reduceMotion={reduceMotion}
        onCell={(col, row) => {
          const key = cellKey(col, row)
          if (garden[key]) {
            remove(col, row)
            return
          }
          if (holding) place(col, row, holding)
        }}
      />

      <Shelf
        holding={holding}
        gold={student.gold}
        full={used >= slots}
        onPick={(id) => setHolding((prev) => (prev === id ? null : id))}
      />
    </div>
  )
}

/**
 * Bội số phóng lớn nhất và nhỏ nhất của mảnh vườn.
 *
 * Khu vườn vẽ ở kích thước gốc chỉ rộng 264 điểm ảnh - trên một màn hình máy
 * tính thì nó bé bằng con tem, và mấy con thú thành mấy cái chấm. Phóng to là
 * bắt buộc, không phải trang trí.
 *
 * Sàn 2 vì dưới mức ấy sprite thú 16 điểm ảnh không còn nhận ra là con gì. Trần
 * 4 vì trên mức ấy một cái cây chiếm gần nửa màn điện thoại, và trẻ mất cảm
 * giác đây là một mảnh đất có nhiều chỗ.
 */
const ZOOM_MIN = 2
const ZOOM_MAX = 4

/** Mặt đất, những món đã đặt, và đàn thú đang đi lại trên đó. */
function Plot({
  garden,
  holding,
  full,
  gold,
  ownedPets,
  petXp,
  reduceMotion,
  onCell,
}: {
  garden: Record<string, string>
  holding: string | null
  full: boolean
  gold: number
  ownedPets: string[]
  petXp: Record<string, number>
  reduceMotion: boolean
  onCell: (col: number, row: number) => void
}) {
  const cost = holding ? (getGardenPart(holding)?.cost ?? 0) : 0
  const canPlace = holding !== null && !full && gold >= cost

  /*
    Phóng to cho VỪA ĐÚNG chỗ trống, đo lại mỗi khi bố cục đổi.

    Gõ cứng một bội số thì hoặc là điện thoại phải cuộn ngang để xem hết vườn -
    một thao tác không đứa bé nào nghĩ ra - hoặc là màn hình máy tính bỏ phí hai
    phần ba bề ngang. Đo rồi chia thì cả hai đều vừa.

    Làm tròn XUỐNG số nguyên: bội số lẻ kiểu 2,7 làm điểm ảnh bị kéo méo, mà cả
    trò chơi này dựng trên pixel sắc cạnh.
  */
  const boxRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(ZOOM_MIN)
  /*
    Vườn rộng hơn khung thì phải NÓI RA.

    Một mảnh đất hình thoi rộng bằng (số cột + số hàng) nửa ô, nên ở bội số 2 nó
    luôn vượt bề ngang một cái điện thoại. Khung tự cuộn ngang được, nhưng một
    đứa bé bảy tuổi không đoán ra là còn vườn ở bên phải - em ấy chỉ thấy vườn
    mình bị cắt cụt, và cho rằng nó thế.

    Hạ bội số xuống 1 cho vừa thì chữa được chỗ này mà hỏng chỗ khác: con thú 16
    điểm ảnh thành một cái chấm, và cả màn này sống bằng việc nhìn thấy chúng.
  */
  const [panned, setPanned] = useState(false)

  useMeasureOnLayout(boxRef, () => {
    const width = boxRef.current?.clientWidth ?? 0
    if (width === 0) return
    const fit = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.floor(width / BOARD_W)))
    setZoom((prev) => (prev === fit ? prev : fit))
    const wide = BOARD_W * fit > width
    setPanned((prev) => (prev === wide ? prev : wide))
  })

  return (
    <div
      ref={boxRef}
      className="pixel-panel relative"
      style={{ padding: 10, background: '#bfe6ff', overflowX: 'auto', overflowY: 'hidden' }}
    >
      {panned && (
        <p
          className="pixel-font sticky left-0 text-base"
          style={{ color: '#1b2432', opacity: 0.6, lineHeight: 1 }}
        >
          👉 Vuốt ngang để xem hết vườn
        </p>
      )}
      <div
        className="relative mx-auto"
        style={{
          width: BOARD_W * zoom,
          height: (BOARD_H + 18) * zoom,
          imageRendering: 'pixelated',
        }}
      >
      <div
        className="absolute left-0 top-0"
        style={{
          width: BOARD_W,
          height: BOARD_H + 18,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/*
          HAI LƯỢT VẼ: hình trước, vùng bấm sau. Và chúng KHÔNG gộp được.

          Gộp làm một cái nút rồi cắt nó theo hình viên gạch thì phần bị cắt
          lấy luôn đường viền của ô - vì viền chạy đúng trên đường cắt, và
          sprite thì vẽ bằng điểm ảnh vuông chứ không theo một hình thoi toán
          học. Mất viền thì cả mảnh vườn thành một mảng xanh liền, và trẻ không
          còn thấy ô nào ra ô nào để mà đặt cây xuống.

          Nên: lượt một vẽ hình, không nhận chạm. Lượt hai là những cái nút
          trong suốt đã cắt, nằm đè lên trên. Nút vẽ sau nên nằm trên mọi hình,
          và hình vẫn giữ nguyên từng nét viền.
        */}
        {CELLS.map(({ col, row }) => {
          const part = getGardenPart(garden[cellKey(col, row)] ?? '')
          const at = cellAt(col, row)
          return (
            <div
              key={`ve-${col}-${row}`}
              className="pointer-events-none absolute"
              style={{
                left: at.x,
                top: at.y,
                lineHeight: 0,
                // Ô trống sáng lên khi đang cầm món và đặt được - để trẻ thấy
                // chỗ nào bấm vào có chuyện xảy ra, chỗ nào không.
                filter: !part && canPlace ? 'brightness(1.18)' : undefined,
              }}
            >
              <PixelSprite
                sprite={part ? placeProp(TILE, part.sprite, 2, 0, ISO_MEDIUM) : TILE}
                scale={1}
              />
            </div>
          )
        })}

        {CELLS.map(({ col, row }) => {
          const part = getGardenPart(garden[cellKey(col, row)] ?? '')
          const at = cellAt(col, row)
          return (
            <button
              key={`bam-${col}-${row}`}
              type="button"
              onClick={() => onCell(col, row)}
              title={part ? `${part.name} - bấm để dỡ, lấy lại ${part.cost} vàng` : 'Ô trống'}
              className="absolute"
              style={{
                left: at.x,
                top: at.y,
                width: ISO_MEDIUM.width,
                height: ISO_MEDIUM.topHeight + ISO_MEDIUM.depth,
                padding: 0,
                border: 'none',
                background: 'transparent',
                clipPath: TILE_CLIP,
                cursor: part || canPlace ? 'pointer' : 'default',
              }}
            />
          )
        })}

        <Pets ownedPets={ownedPets} petXp={petXp} reduceMotion={reduceMotion} />
      </div>
      </div>
    </div>
  )
}

/**
 * Đàn thú đi lang thang trên vườn.
 *
 * Mỗi con tự chọn một ô rồi đi tới đó, nghỉ một lát, rồi chọn ô khác. Nhịp nghỉ
 * LỆCH NHAU (mỗi con một quãng ngẫu nhiên) vì nếu cả đàn cùng bước một lúc thì
 * chúng trông như một đội hình diễu hành chứ không phải mấy con vật đang chơi.
 *
 * Tôn trọng `reduceMotion`: khi trẻ (hoặc máy) đã xin bớt chuyển động thì đàn
 * thú đứng yên ở chỗ của mình. Vẫn thấy đủ cả đàn, chỉ là không ai đi.
 */
function Pets({
  ownedPets,
  petXp,
  reduceMotion,
}: {
  ownedPets: string[]
  petXp: Record<string, number>
  reduceMotion: boolean
}) {
  /*
    Nhiều nhất SÁU con ra vườn một lúc.

    Mười hai con trên hai mươi tư ô là một cái chợ - không con nào nhìn rõ, và
    con thú trẻ vừa nuôi lên cấp lẫn mất trong đám đông. Sáu là vừa đủ đông để
    mảnh đất có sự sống mà vẫn nhận ra từng con.
  */
  const pets = useMemo(
    () =>
      ownedPets
        .map((id) => getPet(id))
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .slice(0, 6)
        .map((pet) => resolvePet(pet, petXp[pet.id] ?? 0)),
    [ownedPets, petXp],
  )

  return (
    <>
      {pets.map((pet, index) => (
        <Wanderer
          key={pet.id}
          sprite={petSpriteFor(pet.sprite, pet.element)}
          seat={index}
          reduceMotion={reduceMotion}
        />
      ))}
    </>
  )
}

/** Một con thú, đi từ ô này sang ô khác mãi. */
function Wanderer({
  sprite,
  seat,
  reduceMotion,
}: {
  sprite: Parameters<typeof PixelSprite>[0]['sprite']
  /** Số thứ tự trong đàn - quyết định chỗ đứng ban đầu và nhịp lệch. */
  seat: number
  reduceMotion: boolean
}) {
  const start = useMemo(
    () => ({ col: seat % GARDEN_COLS, row: Math.floor(seat / GARDEN_COLS) % GARDEN_ROWS }),
    [seat],
  )
  const [spot, setSpot] = useState(start)
  /** Quay mặt theo hướng vừa đi. Một con thú đi lùi trông như bị kéo. */
  const [facingLeft, setFacingLeft] = useState(false)

  useEffect(() => {
    if (reduceMotion) return
    // Lệch nhịp theo chỗ ngồi để cả đàn không bước cùng lúc.
    const every = 2_600 + seat * 700
    const timer = window.setInterval(() => {
      setSpot((prev) => {
        const next = {
          col: Math.floor(Math.random() * GARDEN_COLS),
          row: Math.floor(Math.random() * GARDEN_ROWS),
        }
        setFacingLeft(cellAt(next.col, next.row).x < cellAt(prev.col, prev.row).x)
        return next
      })
    }, every)
    return () => window.clearInterval(timer)
  }, [reduceMotion, seat])

  const at = cellAt(spot.col, spot.row)

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ zIndex: 10 + spot.col + spot.row, lineHeight: 0 }}
      initial={false}
      animate={{
        // Đứng giữa mặt ô, nhích lên một chút cho khỏi lún xuống đất.
        x: at.x + HALF_W - 8,
        y: at.y + HALF_H - 14,
      }}
      transition={{ duration: reduceMotion ? 0 : 1.4, ease: 'easeInOut' }}
    >
      <PixelSprite sprite={sprite} scale={1} flip={facingLeft} />
    </motion.div>
  )
}

/** Giá bày những món đặt được, kèm giá tiền. */
function Shelf({
  holding,
  gold,
  full,
  onPick,
}: {
  holding: string | null
  gold: number
  full: boolean
  onPick: (id: string) => void
}) {
  return (
    <section className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-extrabold">🪴 Đồ trang trí</h2>
        {full && <p className="text-base opacity-70">Hết ô rồi - dỡ bớt một món nhé.</p>}
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
      >
        {GARDEN_PARTS.map((part) => {
          const picked = holding === part.id
          const tooDear = gold < part.cost
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => onPick(part.id)}
              disabled={tooDear && !picked}
              className="card flex items-center gap-2 text-left"
              style={{
                padding: 8,
                borderWidth: picked ? 5 : undefined,
                background: picked ? '#fff3c4' : undefined,
                opacity: tooDear && !picked ? 0.5 : 1,
              }}
            >
              <PixelSprite sprite={part.sprite} scale={2} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold leading-tight">
                  {part.name}
                  {picked && ' ✓'}
                </span>
                <span className="block text-sm leading-tight opacity-70">🪙 {part.cost}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
