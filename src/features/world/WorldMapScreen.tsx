/**
 * Bản đồ thế giới của MỘT lớp: quần đảo nổi trên mặt nước, mỗi đảo là một môn
 * học của lớp đó.
 *
 * MỖI LỚP MỘT BẢN ĐỒ RIÊNG. Trẻ lớp 2 mở ra chỉ thấy quần đảo lớp 2 - không còn
 * cảnh đảo của lớp 1, 3, 5 nằm chình ình tô xám trước mắt. Học hết cả bốn môn
 * thì cổng sang quần đảo lớp sau mới sáng lên.
 *
 * ĐI LẠI TỰ DO trong một quần đảo: bốn đảo của lớp đó mở hết ngay từ đầu, muốn
 * học môn nào trước cũng được. Chỉ việc đi SANG LỚP SAU là phải xong hết.
 *
 * Bố cục do `layout.ts` đặt tay từng toạ độ, năm lớp năm hình dáng khác nhau.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMeasureOnLayout } from '../../shell/useMeasureOnLayout'
import { SUBJECTS, SUBJECT_LABEL, type Grade, type Subject } from '../../content/types'
import { creatureFromAvatar, towerSpriteFor, viewFor } from '../pixel/creatures'
import { TOWER_FLOORS, towerFloorLabel } from '../../content/tower'
import {
  ISO_MEDIUM,
  PROP_ABACUS,
  PROP_BELLTOWER,
  PROP_BOOKSTAND,
  PROP_CASTLE,
  PROP_CRYSTAL,
  PROP_DRUM,
  PROP_FLOWERS,
  PROP_HARP,
  PROP_LANTERN,
  PROP_LIGHTHOUSE,
  PROP_MUSHROOM,
  PROP_OBELISK,
  PROP_PALM,
  PROP_PIN,
  PROP_PINE,
  PROP_PORTAL,
  PROP_SHRINE,
  PROP_STONE,
  PROP_TOWER,
  PROP_TREE,
  greyOut,
  makeIsoIsland,
  placeProp,
} from '../pixel/iso'
import { PixelSprite } from '../pixel/sprite'
import { PixelModal } from '../../ui/PixelModal'
import { useUi } from '../../store/ui'
import { biomeFor, tintForGrade } from './biome'
import { ContinentCanvas, type LandColors, type LandPalette } from './ContinentCanvas'

/** Khe dưới bản đồ: lề trang cộng chỗ cho bảng xem trước vùng hiện lên. */
const MAP_MARGIN = 24
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  continentFor,
  TILE_H,
  TILE_W,
  anchorCell,
  cellCentre,
  cellsOfKind,
} from './continent'
import { createRng } from '../../engine/rng'
import type { Sprite } from '../pixel/sprite'
import {
  gradeProgress,
  highestUnlockedGrade,
  regionProgress,
  remainingSubjects,
  unlockedGrades,
} from './progression'

interface RegionTheme {
  colors: LandColors
  /** Vật mốc lớn, cắm ở giữa vùng. Vẽ ở khổ gấp đôi. */
  prop: Sprite
  /**
   * Những thứ rải khắp vùng cho nó ra dáng một nơi chốn.
   *
   * Một vật mốc tí xíu giữa mảng đất trống thì không ra cái gì: "Rừng Ngôn Từ"
   * mà chỉ có đúng một cái cây thì là một cái cây, không phải một khu rừng. Danh
   * sách này được bốc lặp lại nên vùng nào rải dày thứ gì thì ra chất thứ đó.
   */
  scatter: Sprite[]
}

/**
 * Bốn vùng, bốn tông đất KHÁC HẲN NHAU.
 *
 * Hồi bốn môn còn là bốn hòn đảo rời thì màu gần nhau cũng không sao - biển ở
 * giữa đã tách chúng ra rồi. Giờ chúng chạm cạnh nhau trên cùng một lục địa, nên
 * chính cái màu là thứ duy nhất nói cho trẻ biết vùng này hết và vùng kia bắt
 * đầu ở đâu. Xanh ô-liu, xanh rừng sâu, cát, và xanh bạc hà: bốn tông không lẫn.
 */
const REGION_THEMES: Record<Subject, RegionTheme> = {
  math: {
    // Thung lũng Con Số: đá và cỏ khô, ngả ô-liu.
    colors: {
      top: '#8fb35a',
      topEdge: '#adcd7b',
      leftWall: '#6f5a32',
      rightWall: '#8f7644',
      outline: '#3a3a1e',
    },
    // Thung lũng đá: đài quan sát, bàn tính, bia khắc số, cụm tinh thể.
    prop: PROP_TOWER,
    scatter: [PROP_ABACUS, PROP_OBELISK, PROP_CRYSTAL, PROP_STONE, PROP_ABACUS],
  },
  vietnamese: {
    // Rừng Ngôn Từ: rừng sâu, xanh đậm nhất bản đồ.
    colors: {
      top: '#3f9c63',
      topEdge: '#5bbd80',
      leftWall: '#4a3a24',
      rightWall: '#665030',
      outline: '#1c3325',
    },
    // Rừng thì phải dày cây - đây là vùng rải dày nhất bản đồ.
    prop: PROP_TREE,
    scatter: [PROP_PINE, PROP_TREE, PROP_PINE, PROP_MUSHROOM, PROP_BOOKSTAND, PROP_PINE],
  },
  music: {
    // Đảo Thanh Âm: cát khô giữa biển.
    colors: {
      top: '#e8d9a8',
      topEdge: '#f7ecc9',
      leftWall: '#8a7350',
      rightWall: '#ab9166',
      outline: '#3a3324',
    },
    // Đảo cát giữa biển: tháp chuông, trống hội, đàn hạc, dừa.
    prop: PROP_BELLTOWER,
    scatter: [PROP_DRUM, PROP_PALM, PROP_HARP, PROP_PALM],
  },
  ethics: {
    // Đồi Ánh Sáng: đồi ven biển, xanh bạc hà sáng.
    colors: {
      top: '#7fd9c0',
      topEdge: '#a5ece0',
      leftWall: '#57705f',
      rightWall: '#749183',
      outline: '#24403a',
    },
    // Đồi ven biển đầy ánh sáng: hải đăng, đèn lồng, miếu, khóm hoa.
    prop: PROP_LIGHTHOUSE,
    scatter: [PROP_FLOWERS, PROP_SHRINE, PROP_LANTERN, PROP_FLOWERS, PROP_SHRINE],
  },
}

const HUB_COLORS = {
  top: '#d8c49a',
  topEdge: '#efe0bd',
  leftWall: '#7c6444',
  rightWall: '#9c7f57',
  outline: '#3b3225',
}

const DECOR_COLORS = {
  top: '#8fa878',
  topEdge: '#a9c08f',
  leftWall: '#6b5233',
  rightWall: '#8a6b45',
  outline: '#2f3a24',
}

const GATE_COLORS = {
  top: '#b7a9d8',
  topEdge: '#d4cbec',
  leftWall: '#5b4d80',
  rightWall: '#77679c',
  outline: '#2b2a4a',
}

interface Props {
  /** Lớp của trẻ - quần đảo đầu tiên, và là lớp thấp nhất trẻ được xem. */
  grade: Grade
  avatar: string
  clearedByRegion: Record<string, number>
  /** Những tầng tháp đã hạ, khoá dạng `math.g2`. */
  towerCleared: string[]
  onEnterRegion: (subject: Subject, grade: Grade) => void
  /** Bước vào một tầng Tháp Trí Tuệ ở giữa lục địa. */
  onEnterTower: (subject: Subject, grade: Grade) => void
}

interface RegionView {
  subject: Subject
  grade: Grade
  cleared: number
  total: number
  /** Ô đại diện của vùng trên lưới lục địa - chỗ cắm vật mốc và treo huy hiệu. */
  c: number
  r: number
}

export function WorldMapScreen({
  grade,
  avatar,
  clearedByRegion,
  towerCleared,
  onEnterRegion,
  onEnterTower,
}: Props) {
  const creature = creatureFromAvatar(avatar)
  const open = useMemo(() => unlockedGrades(clearedByRegion, grade), [clearedByRegion, grade])
  const highest = highestUnlockedGrade(clearedByRegion, grade)

  // Mở ra ở quần đảo mới nhất trẻ tới được, không phải ở lớp cũ đã học xong.
  const [view, setView] = useState<Grade>(highest)
  const [selected, setSelected] = useState<RegionView | null>(null)
  /**
   * Hòn đảo trẻ ĐANG Ở.
   *
   * Lấy từ vùng vừa bước vào (`lastRegion`), không phải từ cú chạm gần nhất. Bấm
   * vào một đảo chỉ là mở khung hỏi "vào đây chứ?" - chưa đi đâu cả, mà cái ghim
   * nhảy sang đó ngay thì nó nói dối.
   */
  const lastRegion = useUi((state) => state.lastRegion)
  const here = lastRegion && lastRegion.grade === view ? lastRegion.subject : null
  const [gateOpen, setGateOpen] = useState(false)
  const [towerOpen, setTowerOpen] = useState(false)
  const [scale, setScale] = useState(2)
  const containerRef = useRef<HTMLDivElement>(null)

  // Vừa học xong cả lớp thì đưa trẻ sang quần đảo mới luôn - phần thưởng phải
  // đến ngay, chứ không bắt trẻ tự đi tìm.
  useEffect(() => {
    setView((current) => (current < highest ? highest : current))
  }, [highest])

  // `continentFor` chứ không phải `CONTINENTS`: thầy cô vẽ lại bản đồ ở trang
  // quản trị thì trẻ phải thấy bản mới. Xem `continent.ts`.
  const layout = continentFor(view)
  const progress = gradeProgress(clearedByRegion, view)
  const canPass = progress.complete

  // Bảng màu của cả lục địa, nhuộm theo lớp. Nhớ lại theo `view` vì canvas chỉ vẽ
  // lại khi bảng màu đổi danh tính - dựng mới mỗi lần render là vẽ lại cả lục địa
  // mỗi lần trẻ chạm vào bất cứ thứ gì.
  const palette = useMemo<LandPalette>(() => {
    const tint = (c: LandColors): LandColors => ({
      top: tintForGrade(c.top, view),
      topEdge: tintForGrade(c.topEdge, view),
      leftWall: tintForGrade(c.leftWall, view),
      rightWall: tintForGrade(c.rightWall, view),
      outline: c.outline,
    })
    return {
      math: tint(REGION_THEMES.math.colors),
      vietnamese: tint(REGION_THEMES.vietnamese.colors),
      music: tint(REGION_THEMES.music.colors),
      ethics: tint(REGION_THEMES.ethics.colors),
      castle: tint(HUB_COLORS),
      land: tint(DECOR_COLORS),
      gate: GATE_COLORS,
    }
  }, [view])

  const regions = useMemo<RegionView[]>(
    () =>
      SUBJECTS.flatMap((subject) => {
        const anchor = anchorCell(view, subject)
        if (!anchor) return []
        const p = regionProgress(clearedByRegion, subject, view)
        return [{ subject, grade: view, cleared: p.cleared, total: p.total, ...anchor }]
      }),
    [clearedByRegion, view],
  )

  const castle = useMemo(() => anchorCell(view, 'castle'), [view])
  const gate = useMemo(() => anchorCell(view, 'gate'), [view])
  const scatter = useMemo(() => buildScatter(view), [view])

  /*
    Đo lại mỗi khi bố cục quanh bản đồ đổi - xem `useMeasureOnLayout`.

    Đo một lần lúc dựng là không đủ: huy hiệu đồng bộ hiện lên trong lúc app kéo
    dữ liệu về, chiếm 45px rồi biến mất. Đo trúng lúc nó còn đó thì bản đồ chọn
    bội số nhỏ hơn một bậc và giữ nguyên cỡ bé ấy cho tới khi người dùng rời đi
    rồi quay lại - đúng triệu chứng "lần đầu bé tí, lần sau bình thường".
  */
  useMeasureOnLayout(containerRef, () => {
    const el = containerRef.current
    const width = el?.clientWidth ?? 0
    if (!el || width === 0) return

    // Phải đo CẢ CHIỀU CAO. Đo mỗi bề ngang thì trên điện thoại nằm ngang
    // (844×390) bản đồ lấy bội số 2 và cao 388px - dài hơn cả màn hình, nên
    // nửa lục địa nằm dưới tầm nhìn và trẻ phải vuốt mới thấy vùng của mình.
    const head = el.firstElementChild?.getBoundingClientRect().height ?? 0
    const top = el.getBoundingClientRect().top + window.scrollY
    const spare = window.innerHeight - top - head - MAP_MARGIN

    // Chỉ dùng bội số nguyên: phóng to lẻ là điểm ảnh bị méo.
    const byWidth = Math.floor(width / CANVAS_WIDTH)
    const byHeight = Math.floor(spare / CANVAS_HEIGHT)
    setScale(Math.max(1, Math.min(3, Math.min(byWidth, byHeight))))
  })

  const index = open.indexOf(view)
  const previous = index > 0 ? open[index - 1]! : null
  const next = index >= 0 && index < open.length - 1 ? open[index + 1]! : null

  return (
    <div ref={containerRef} className="pixel-ui world-layout grid gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => previous !== null && setView(previous)}
          disabled={previous === null}
          className="btn btn-ghost px-4"
          style={{ opacity: previous === null ? 0.35 : 1 }}
          aria-label={previous === null ? 'Không có lớp trước' : `Về quần đảo lớp ${previous}`}
        >
          ◀
        </button>

        <div className="flex-1 text-center">
          <h2 className="pixel-font text-3xl leading-none">{layout.title}</h2>
          <p className="pixel-font text-xl leading-none opacity-70">
            Lớp {view} · {progress.done}/{progress.total} môn đã xong
          </p>
        </div>

        <button
          type="button"
          onClick={() => next !== null && setView(next)}
          disabled={next === null}
          className="btn btn-ghost px-4"
          style={{ opacity: next === null ? 0.35 : 1 }}
          aria-label={next === null ? 'Chưa mở lớp sau' : `Sang quần đảo lớp ${next}`}
        >
          ▶
        </button>
      </div>

      <div
        className="relative mx-auto"
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          border: '4px solid #1b2432',
          borderRadius: 6,
          overflow: 'hidden',
          background:
            `repeating-linear-gradient(0deg, ${layout.sea.light} 0 14px, ${layout.sea.dark} 14px 15px),` +
            `repeating-linear-gradient(90deg, ${layout.sea.light} 0 14px, ${layout.sea.dark} 14px 15px)`,
        }}
      >
        {/* Cả lục địa nằm gọn trong một canvas. Các dấu mốc bên dưới chỉ là lớp
            phủ đặt đúng toạ độ ô - chúng không vẽ ra đất. */}
        <ContinentCanvas rows={layout.rows} palette={palette} scale={scale} />

        {/* Cây cối, đá, nhà cửa rải khắp vùng. Vẽ TRƯỚC các dấu mốc chính để
            không che mất chúng, và xếp từ sau ra trước cho đúng chiều sâu. */}
        {scatter.map((item) => (
          <Marker key={item.key} grade={view} cell={item} scale={scale} lift={2}>
            <PixelSprite sprite={item.sprite} scale={scale} />
          </Marker>
        ))}

        {/*
          Toà tháp giữa lục địa - giờ BẤM ĐƯỢC.

          Trước đây nó là hình trang trí: vẽ to nhất bản đồ, đứng đúng giữa, và
          chạm vào thì không có gì xảy ra. Thứ to nhất màn hình mà không bấm được
          là một lời hứa suông với một đứa bé sáu tuổi.
        */}
        {castle && (
          <Marker grade={view} cell={castle} scale={scale} lift={TILE_H} big>
            <button
              type="button"
              onClick={() => setTowerOpen(true)}
              className="block"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Tháp Trí Tuệ - bốn trùm cuối cùng"
              title="Tháp Trí Tuệ"
            >
              <PixelSprite sprite={PROP_CASTLE} scale={scale * 2} />
            </button>
          </Marker>
        )}

        {/* Nhân vật đứng cạnh lâu đài khi chưa chọn vùng nào. Lệch sang trái để
            không che mất chính cái lâu đài. */}
        {here === null && castle && (
          <>
            <Marker grade={view} cell={castle} scale={scale} lift={2} nudgeX={-20}>
              <PixelSprite {...viewFor(creature, 'down')} scale={scale} />
            </Marker>
            <Marker grade={view} cell={castle} scale={scale} lift={-11} big>
              <span
                style={
                  {
                    display: 'block',
                    animation: 'pin-bob 1s steps(1, end) infinite',
                    '--bob': `${scale * 3}px`,
                  } as React.CSSProperties
                }
              >
                <PixelSprite sprite={PROP_PIN} scale={scale * 2} />
              </span>
            </Marker>
          </>
        )}

        {regions.map((region) => (
          <RegionMarker
            key={region.subject}
            region={region}
            scale={scale}
            creature={creature}
            isHere={here === region.subject}
            onSelect={() => setSelected(region)}
          />
        ))}

        {gate && (
          <NextGate
            cell={gate}
            grade={view}
            unlocked={canPass}
            scale={scale}
            onSelect={() => setGateOpen(true)}
          />
        )}
      </div>

      {/* Chú giải: mỗi môn một vật mốc riêng. */}
      <div className="flex flex-wrap justify-center gap-2">
        {SUBJECTS.map((subject) => (
          <span
            key={subject}
            className="pixel-panel flex items-center gap-1"
            style={{ padding: '2px 8px' }}
          >
            <PixelSprite sprite={REGION_THEMES[subject].prop} scale={2} />
            <span className="pixel-font text-lg">{SUBJECT_LABEL[subject]}</span>
          </span>
        ))}
      </div>

      {selected && (
        <RegionModal
          region={selected}
          onClose={() => setSelected(null)}
          onEnter={() => onEnterRegion(selected.subject, selected.grade)}
        />
      )}

      {towerOpen && (
        <TowerModal
          grade={view}
          towerCleared={towerCleared}
          onClose={() => setTowerOpen(false)}
          onEnter={(subject) => {
            setTowerOpen(false)
            onEnterTower(subject, view)
          }}
        />
      )}

      {gateOpen && gate && (
        <GateModal
          grade={view}
          unlocked={canPass}
          missing={remainingSubjects(clearedByRegion, view)}
          onClose={() => setGateOpen(false)}
          onPass={() => {
            setGateOpen(false)
            setView((current) => Math.min(5, current + 1) as Grade)
          }}
        />
      )}
    </div>
  )
}

/** Lời dẫn một câu. Tên vùng đã nằm ở đầu đề khung nên không nhắc lại ở đây. */
function regionMessage(region: RegionView): string {
  if (region.cleared === 0) {
    return 'Con chưa đặt chân tới đây bao giờ. Cùng khám phá nhé!'
  }
  if (region.cleared >= region.total) {
    return 'Con đã đi hết vùng này rồi. Quay lại luyện thêm cũng rất tốt!'
  }
  return `Con đã đi được ${region.cleared} trên ${region.total} chặng của vùng này.`
}

/**
 * Khung hỏi "vào vùng này chứ?". Hiện chính hòn đảo vừa bấm ở trên cùng - trẻ
 * chưa đọc chữ vẫn đối chiếu được ngay là mình đang đứng trước đảo nào.
 */
function RegionModal({
  region,
  onClose,
  onEnter,
}: {
  region: RegionView
  onClose: () => void
  onEnter: () => void
}) {
  const biome = biomeFor(region.subject, region.grade)
  const land = biome.land
  const title = `${land} — ${SUBJECT_LABEL[region.subject]} lớp ${region.grade}`
  const done = region.cleared >= region.total

  return (
    <PixelModal title={title} onClose={onClose}>
      <div className="grid justify-items-center gap-2 text-center">
        <PixelSprite sprite={islandSprite(region)} scale={2} />

        <h3 className="pixel-font text-3xl leading-none">{land}</h3>
        <p className="pixel-font text-2xl leading-none" style={{ color: '#4c4a7a' }}>
          {done && '✓ '}
          {SUBJECT_LABEL[region.subject]} · Lớp {region.grade}
        </p>

        <ProgressBar cleared={region.cleared} total={region.total} />

        <p className="text-base italic leading-snug opacity-80">{biome.flavour}</p>
        <p className="text-lg leading-snug">{regionMessage(region)}</p>

        <div className="mt-1 flex w-full gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1 text-lg">
            Để sau
          </button>
          <button type="button" onClick={onEnter} className="btn btn-primary flex-[2] text-xl">
            {done ? 'Luyện thêm' : 'Đi tới vùng này!'}
          </button>
        </div>
      </div>
    </PixelModal>
  )
}

/** Khung cổng sang lớp sau: hoặc chúc mừng, hoặc nói rõ còn thiếu môn nào. */
/**
 * Cửa vào Tháp Trí Tuệ: bốn tầng, mỗi tầng một con trùm của một môn.
 *
 * KHÔNG KHOÁ TẦNG NÀO, y như mọi chặng khác trên bản đồ (xem ghi chú "KHÔNG CÓ
 * KHOÁ CHẶNG" trong `content/worldmap.ts`). Cái chặn nằm ở con quái chứ không ở
 * ổ khoá - và khung này nói thẳng ra điều đó thay vì để trẻ tự đâm đầu vào.
 */
function TowerModal({
  grade,
  towerCleared,
  onClose,
  onEnter,
}: {
  grade: Grade
  towerCleared: string[]
  onClose: () => void
  onEnter: (subject: Subject) => void
}) {
  const done = new Set(towerCleared)
  const cleared = TOWER_FLOORS.filter((f) => done.has(`${f.subject}.g${grade}`)).length

  return (
    <PixelModal title={`Tháp Trí Tuệ — lớp ${grade}`} onClose={onClose}>
      <div className="grid gap-2">
        <div className="grid justify-items-center gap-1 text-center">
          <PixelSprite sprite={PROP_CASTLE} scale={2} />
          <h3 className="pixel-font text-3xl leading-none">THÁP TRÍ TUỆ</h3>
          <p className="pixel-font text-xl leading-none" style={{ color: '#4c4a7a' }}>
            {cleared}/{TOWER_FLOORS.length} tầng đã hạ
          </p>
          <p className="text-base leading-snug opacity-80">
            Bốn vị trùm mạnh nhất thế giới ngồi đây. Chúng <strong>đổi hệ</strong> giữa trận, có{' '}
            <strong>giáp</strong> chặn đòn sai hệ, <strong>hút máu</strong> mỗi lần con trả lời sai,
            và <strong>nổi giận</strong> khi sắp gục. Đề hỏi cả bài của những lớp trước.
          </p>
        </div>

        <div className="grid gap-2">
          {TOWER_FLOORS.map((floor) => {
            const beaten = done.has(`${floor.subject}.g${grade}`)
            return (
              <button
                key={floor.subject}
                type="button"
                onClick={() => onEnter(floor.subject)}
                className="card flex items-center gap-3 text-left"
                style={{ padding: 10, cursor: 'pointer' }}
              >
                <PixelSprite sprite={towerSpriteFor(floor.subject)} scale={2} />
                <span className="min-w-0 flex-1">
                  <span className="pixel-font block text-lg leading-tight opacity-70">
                    {towerFloorLabel(floor)}
                  </span>
                  <span className="block text-base font-bold leading-tight">
                    {beaten && '✓ '}
                    {floor.name}
                  </span>
                  <span className="block text-sm leading-tight opacity-70">{floor.tagline}</span>
                </span>
              </button>
            )
          })}
        </div>

        <button type="button" onClick={onClose} className="btn btn-ghost w-full text-lg">
          Để sau
        </button>
      </div>
    </PixelModal>
  )
}

function GateModal({
  grade,
  unlocked,
  missing,
  onClose,
  onPass,
}: {
  grade: Grade
  unlocked: boolean
  missing: Subject[]
  onClose: () => void
  onPass: () => void
}) {
  const nextGrade = Math.min(5, grade + 1) as Grade

  return (
    <PixelModal title={`Cổng sang quần đảo lớp ${nextGrade}`} onClose={onClose}>
      <div className="grid justify-items-center gap-2 text-center">
        <PixelSprite sprite={gateSprite(unlocked)} scale={2} />

        <h3 className="pixel-font text-3xl leading-none">
          {unlocked ? '' : '🔒 '}
          CỔNG LỚP {nextGrade}
        </h3>

        {unlocked ? (
          <>
            <p className="text-lg leading-snug">
              Con đã đi hết cả bốn vùng của lớp {grade}. Quần đảo lớp {nextGrade} đang đợi!
            </p>
            <div className="mt-1 flex w-full gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1 text-lg">
                Ở lại
              </button>
              <button type="button" onClick={onPass} className="btn btn-primary flex-[2] text-xl">
                Sang lớp {nextGrade}!
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg leading-snug">
              Đi hết cả bốn vùng của lớp {grade} thì cổng mới mở.
            </p>
            <p className="text-lg font-bold leading-snug">
              Còn thiếu: {missing.map((subject) => SUBJECT_LABEL[subject]).join(', ')}
            </p>
            <button type="button" onClick={onClose} className="btn btn-ghost mt-1 w-full text-lg">
              Đã hiểu
            </button>
          </>
        )}
      </div>
    </PixelModal>
  )
}

/** Thanh tiến độ chia ô - đếm được từng chặng thay vì đọc một con số phần trăm. */
function ProgressBar({ cleared, total }: { cleared: number; total: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div
        className="flex w-full gap-[3px] p-[3px]"
        style={{ border: '3px solid #1b2432', borderRadius: 4, background: '#d8d8c8' }}
        role="img"
        aria-label={`Đã qua ${cleared} trên ${total} chặng`}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            style={{ flex: 1, height: 12, background: index < cleared ? '#3f9b46' : '#f8f8f0' }}
          />
        ))}
      </div>
      <span className="pixel-font text-xl leading-none">
        {cleared}/{total} chặng
      </span>
    </div>
  )
}

/**
 * Hình hòn đảo. Tách khỏi component để khung hỏi dùng lại đúng hình đó - vẽ một
 * hình khác thì trẻ tưởng đang nói về đảo nào khác.
 */
function islandSprite(region: RegionView) {
  const theme = REGION_THEMES[region.subject]
  // Nhuộm theo lớp, cùng ánh sáng với vùng đất bên trong - bước qua cổng mà đổi
  // hẳn màu thì hai chỗ đó không còn là một nơi nữa.
  const colors = {
    top: tintForGrade(theme.colors.top, region.grade),
    topEdge: tintForGrade(theme.colors.topEdge, region.grade),
    leftWall: tintForGrade(theme.colors.leftWall, region.grade),
    rightWall: tintForGrade(theme.colors.rightWall, region.grade),
    outline: theme.colors.outline,
  }
  return placeProp(makeIsoIsland(colors, ISO_MEDIUM), theme.prop, 2, 0, ISO_MEDIUM)
}
/** Cổng sang lớp sau. Còn khoá thì tô xám. */
function gateSprite(unlocked: boolean) {
  return unlocked ? PROP_PORTAL : greyOut(PROP_PORTAL)
}

/**
 * Đặt một thứ gì đó lên đúng một ô của lục địa.
 *
 * `lift` là số điểm ảnh nhấc lên khỏi tâm ô: vật mốc phải đứng TRÊN mặt đất chứ
 * không lún vào giữa nó, nên chân vật mới là chỗ canh, không phải tâm vật.
 */
/**
 * Rải cây cối, đá, nhà cửa khắp mỗi vùng.
 *
 * Hạt giống cố định theo lớp nên lục địa KHÔNG đổi hình mỗi lần mở bản đồ: vùng
 * đất quen thuộc phải quen thuộc thật.
 *
 * Chừa trống ô đại diện và bốn ô quanh nó - chỗ đó dành cho vật mốc lớn, rải
 * chồng lên là vật mốc chìm nghỉm giữa một đống cây.
 */
function buildScatter(grade: Grade) {
  const items: Array<{ key: string; c: number; r: number; sprite: Sprite }> = []

  for (const subject of SUBJECTS) {
    const theme = REGION_THEMES[subject]
    const anchor = anchorCell(grade, subject)
    const rng = createRng(`scatter-${subject}-g${grade}`)

    const free = cellsOfKind(grade, subject).filter(
      (cell) => !anchor || Math.abs(cell.c - anchor.c) + Math.abs(cell.r - anchor.r) > 1,
    )
    const picked = free.filter(() => rng.next() <= 0.55)

    // Đảo Thanh Âm chỉ có chín ô; bốc ngẫu nhiên hụt là cả hòn đảo trống trơn,
    // còn mỗi cái tháp chuông giữa bãi cát. Hụt thì lấy bù cho đủ hai.
    const chosen = picked.length >= 2 ? picked : free.slice(0, 2)

    for (const cell of chosen) {
      const sprite = theme.scatter[rng.int(0, theme.scatter.length - 1)]
      if (!sprite) continue
      items.push({ key: `${subject}-${cell.c}-${cell.r}`, c: cell.c, r: cell.r, sprite })
    }
  }

  // Ô nằm sau vẽ trước, để vật phía trước che đúng thứ tự chiều sâu.
  return items.sort((a, b) => a.c + a.r - (b.c + b.r))
}

/**
 * Đặt một thứ gì đó đứng TRÊN một ô của lục địa.
 *
 * `lift` là số điểm ảnh nhấc lên khỏi tâm ô: canh theo CHÂN vật chứ không theo
 * tâm vật, nếu không vật trông như đang lún xuống đất.
 */
function Marker({
  grade,
  cell,
  scale,
  lift = 0,
  nudgeX = 0,
  big = false,
  children,
}: {
  grade: Grade
  cell: { c: number; r: number }
  scale: number
  lift?: number
  nudgeX?: number
  /** Vật mốc lớn vẽ ở khổ gấp đôi, nên nửa bề ngang cũng gấp đôi. */
  big?: boolean
  children: React.ReactNode
}) {
  const centre = cellCentre(grade, cell.c, cell.r)
  const size = big ? 32 : 16

  return (
    <span
      className="absolute"
      style={{
        left: (centre.x - size / 2 + nudgeX) * scale,
        top: (centre.y - size + lift) * scale,
        lineHeight: 0,
      }}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

/**
 * Vật mốc lớn, huy hiệu tiến độ và vùng chạm của một môn.
 *
 * Vật mốc vẽ ở KHỔ GẤP ĐÔI. Ở khổ gốc nó chỉ bằng nửa một ô đất, và một chấm nhỏ
 * giữa mảng đất rộng thì không nói được đây là nơi nào.
 *
 * Vùng chạm rộng bằng hai ô đất, KHÔNG phải riêng cái huy hiệu: trẻ con chạm vào
 * hòn đất chứ không chạm vào cái nhãn nhỏ trên nó.
 */
function RegionMarker({
  region,
  scale,
  creature,
  isHere,
  onSelect,
}: {
  region: RegionView
  scale: number
  creature: Parameters<typeof viewFor>[0]
  isHere: boolean
  onSelect: () => void
}) {
  const theme = REGION_THEMES[region.subject]
  const centre = cellCentre(region.grade, region.c, region.r)
  const done = region.cleared >= region.total

  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute"
      style={{
        left: (centre.x - TILE_W * 0.75) * scale,
        top: (centre.y - 32) * scale,
        width: TILE_W * 1.5 * scale,
        height: (32 + TILE_H * 1.6) * scale,
        lineHeight: 0,
      }}
      aria-label={`${isHere ? 'Con đang ở đây. ' : ''}${biomeFor(region.subject, region.grade).land}, ${SUBJECT_LABEL[region.subject]} lớp ${region.grade}, đã qua ${region.cleared} trên ${region.total} chặng`}
    >
      <span
        className="absolute"
        style={{ left: (TILE_W * 0.75 - 16) * scale, top: 0, lineHeight: 0 }}
        aria-hidden="true"
      >
        <PixelSprite sprite={theme.prop} scale={scale * 2} />
      </span>

      {isHere && (
        <>
          <span
            className="absolute"
            style={{ left: (TILE_W * 0.75 - 26) * scale, top: 20 * scale, lineHeight: 0 }}
            aria-hidden="true"
          >
            <PixelSprite {...viewFor(creature, 'down')} scale={scale} />
          </span>

          {/* Ghim nhô hẳn lên trên vật mốc - chỗ duy nhất chắc chắn không bị cây
              cối hay nhà cửa của vùng che mất. */}
          <span
            className="absolute"
            style={
              {
                left: (TILE_W * 0.75 - 16) * scale,
                top: -25 * scale,
                lineHeight: 0,
                animation: 'pin-bob 1s steps(1, end) infinite',
                '--bob': `${scale * 3}px`,
              } as React.CSSProperties
            }
            aria-hidden="true"
          >
            <PixelSprite sprite={PROP_PIN} scale={scale * 2} />
          </span>
        </>
      )}

      <span
        className="pixel-font absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-1"
        style={{
          top: 34 * scale,
          fontSize: 6 * scale,
          lineHeight: 1.15,
          background: done ? '#d7f5d0' : '#f8f8f0',
          border: `${Math.max(2, scale)}px solid #1b2432`,
          borderRadius: 3,
          color: '#1b2432',
        }}
      >
        {done ? '✓' : ''}
        {region.cleared}/{region.total}
      </span>
    </button>
  )
}

/** Cổng sang lục địa lớp sau, cắm ở mép đất. */
function NextGate({
  cell,
  grade,
  unlocked,
  scale,
  onSelect,
}: {
  cell: { c: number; r: number }
  grade: Grade
  unlocked: boolean
  scale: number
  onSelect: () => void
}) {
  const nextGrade = Math.min(5, grade + 1)
  const centre = cellCentre(grade, cell.c, cell.r)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute"
      style={{
        left: (centre.x - TILE_W * 0.75) * scale,
        top: (centre.y - 32) * scale,
        width: TILE_W * 1.5 * scale,
        height: (32 + TILE_H * 1.6) * scale,
        lineHeight: 0,
      }}
      aria-label={
        unlocked ? `Sang lục địa lớp ${nextGrade}` : `Cổng lớp ${nextGrade} còn khoá`
      }
    >
      <span
        className="absolute"
        style={{ left: (TILE_W * 0.75 - 16) * scale, top: 0, lineHeight: 0 }}
        aria-hidden="true"
      >
        <PixelSprite sprite={gateSprite(unlocked)} scale={scale * 2} />
      </span>

      <span
        className="pixel-font absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-1"
        style={{
          top: 34 * scale,
          fontSize: 6 * scale,
          lineHeight: 1.15,
          background: unlocked ? '#fff3c4' : '#c3ccd8',
          border: `${Math.max(2, scale)}px solid #1b2432`,
          borderRadius: 3,
          color: '#1b2432',
        }}
      >
        {unlocked ? '' : '🔒'}LỚP {nextGrade}
      </span>
    </button>
  )
}
