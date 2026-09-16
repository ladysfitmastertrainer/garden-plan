/**
 * Màn đi cảnh kiểu máy điện tử cầm tay: bản đồ ô vuông nhìn từ trên xuống, nhân
 * vật đi từng ô một, khung nhìn bám theo nhân vật.
 *
 * Cách vẽ: TOÀN BỘ bản đồ được vẽ một lần vào một canvas duy nhất rồi chỉ dịch
 * chuyển canvas đó theo camera. Nếu vẽ mỗi ô một phần tử thì một bản đồ 13×30 ô
 * là gần 400 phần tử, cuộn sẽ giật trên máy tính bảng cũ - đúng loại máy các
 * trường hay dùng.
 *
 * Điều khiển: phím mũi tên / WASD cho máy tính, và một D-pad chạm cho máy tính
 * bảng. Trẻ tiểu học hầu hết chơi trên tablet nên D-pad là đường vào chính.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMeasureOnLayout } from '../../shell/useMeasureOnLayout'
import { creatureFromAvatar, monsterSpriteFor, viewFor } from '../pixel/creatures'
import { PixelSprite } from '../pixel/sprite'
import type { TileKind, TileSet } from '../pixel/tiles'
import type { Subject } from '../../content/types'
import type { MapNode } from '../../content/worldmap'
import type { Biome } from './biome'
import { getTuning } from '../../content/tuning'
import { createRng } from '../../engine/rng'
import { buildRouteMap, gateAt, isWalkable, wanderStep, type RouteMap } from './routemap'

const TILE = 16
/**
 * Số ô hiển thị trong khung nhìn.
 *
 * Máy nằm ngang dùng khung THẤP HƠN: màn hình điện thoại xoay ngang chỉ cao
 * chừng 390px, giữ nguyên 9 hàng là riêng khung game đã cao gần 300px và đẩy mọi
 * thứ khác khỏi tầm nhìn. Bề ngang giữ nguyên - chỗ tiết kiệm được dành cho
 * D-pad chuyển sang đứng cạnh.
 */
const VIEW_COLS = 11
const VIEW_ROWS = 9
const VIEW_ROWS_WIDE = 7
/**
 * Bề ngang D-pad chiếm khi nó đứng CẠNH khung game (màn hình ngang).
 *
 * Phải trừ ra khi tính bội số phóng, nếu không khung game lấy trọn bề ngang cột
 * rồi đẩy D-pad tràn ra ngoài mép màn hình.
 */
const DPAD_WIDTH = 200

/** Khe giữa khung game với D-pad, cộng lề dưới của trang. */
const VIEW_MARGIN = 28

/**
 * Bội số phóng lớn nhất.
 *
 * Trần cũ là 4, đặt hồi khung game còn đo theo bề ngang điện thoại. Trên màn
 * hình máy tính thì 4 là quá bé: khung game rộng 704px giữa một màn 1440px,
 * nhân vật chỉ bằng đầu ngón tay. Mở tới 6 rồi để bề ngang và chiều cao thật
 * quyết định - máy nhỏ vẫn tự về 2 như cũ.
 */
const MAX_SCALE = 6

/**
 * Bề ngang tối thiểu để D-pad đứng CẠNH khung game thay vì nằm dưới.
 *
 * 820px bắt trọn cả điện thoại nằm ngang (844px) lẫn mọi màn hình máy tính.
 * Trước đây điều kiện là "lùn VÀ rộng", nên trên máy tính D-pad vẫn nằm dưới và
 * ăn mất 195px chiều cao - khung game phải co lại còn bội số 3, nhỏ tí xíu giữa
 * một màn hình 1440px. Cùng ngưỡng với `@media` trong `index.css`.
 */
const SIDE_DPAD_MIN_WIDTH = 820

function hasSideDpad(): boolean {
  return window.innerWidth >= SIDE_DPAD_MIN_WIDTH
}

/** Màn hình lùn: bớt hàng đi cho vừa. Máy tính cao ráo thì giữ đủ chín hàng. */
function isShortScreen(): boolean {
  return window.innerHeight <= 560
}
/** Thời gian đi hết một ô, mili giây. Chậm hơn game người lớn cho trẻ kịp nhìn. */
const STEP_MS = 170
/**
 * Số hàng ít nhất còn chấp nhận được.
 *
 * Dưới bảy hàng thì nhân vật đứng giữa chỉ nhìn thấy ba ô phía trước - không đủ
 * để thấy con quái đang tiến tới mà tránh, nên mọi cuộc chạm mặt đều thành ra
 * bất ngờ.
 */
const MIN_ROWS = 7

/** Đáy cùng: thà khung game bé còn hơn D-pad rơi khỏi màn hình. */
const FLOOR_ROWS = 5

type Direction = 'up' | 'down' | 'left' | 'right'

const DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

interface Props {
  nodes: MapNode[]
  /** Hạt giống bản đồ: cùng môn + lớp thì luôn ra cùng khung cảnh. */
  seed: string
  /** Vùng đất: quyết định địa hình, bảng màu và kiểu bố cục đường đi. */
  biome: Biome
  subject: Subject
  avatar: string
  onEnterGate: (node: MapNode) => void
  /**
   * Khoá điều khiển khi đang có hội thoại. Thiếu cái này thì trẻ bấm tiếp là
   * nhân vật ĐI XUYÊN QUA cổng trong lúc hộp thoại vẫn đang mở.
   */
  paused?: boolean
  /** Hộp thoại, vẽ đè lên đáy khung game đúng chỗ game thời đó đặt nó. */
  dialogue?: React.ReactNode
  /**
   * Gọi khi trẻ bước vào ô cỏ cao và gặp quái hoang.
   *
   * Cỏ cao vốn đã là quy ước "chỗ này có quái" của dòng game này, và bản đồ đã
   * rắc sẵn cỏ cao quanh mỗi cổng - nên chỉ cần gắn xác suất vào là thế giới có
   * chuyện xảy ra giữa hai cổng, thay vì chỉ có đi bộ.
   */
  onWildEncounter?: (variant: number) => void
  /**
   * Trẻ đụng phải một con quái đang đi lang thang. `node` là chặng con quái đó
   * canh; `null` nghĩa là mini boss trong hang.
   */
  onMonsterBump?: (node: MapNode | null) => void
  /** Thú đi theo sau lưng nhân vật. Không có thì chỉ mình nhân vật đi. */
  follower?: { sprite: import('../pixel/sprite').Sprite } | null
  /**
   * Chỗ đặt nhân vật khi mới vào màn. Bỏ trống thì đứng ở điểm xuất phát.
   *
   * Dùng để trả trẻ về ĐÚNG CHỖ vừa đánh nhau xong, thay vì về đầu bản đồ.
   */
  startAt?: { x: number; y: number } | null
  /** Báo mỗi khi nhân vật bước sang ô mới, để bên ngoài nhớ lại chỗ đứng. */
  onPosition?: (pos: { x: number; y: number }) => void
}

/** Cỏ rung bao lâu trước khi con quái ló mặt ra. */
const RUSTLE_MS = 460
/** Con quái đứng cho trẻ nhìn bao lâu rồi mới vào trận. */
const REVEAL_MS = 620

export function Overworld({
  nodes,
  seed,
  biome,
  subject,
  avatar,
  onEnterGate,
  paused = false,
  dialogue,
  onWildEncounter,
  onMonsterBump,
  follower,
  startAt,
  onPosition,
}: Props) {
  const bossIndex = nodes.findIndex((node) => node.kind === 'boss')
  const map = useMemo(
    () =>
      buildRouteMap(nodes.length, seed, {
        shape: biome.shape,
        width: biome.width,
        ground: biome.ground,
        border: biome.border,
        gateHalo: biome.gateHalo,
        scatter: biome.scatter,
        bossIndex,
      }),
    [nodes.length, seed, biome, bossIndex],
  )
  const creature = creatureFromAvatar(avatar)
  const bossNode = bossIndex >= 0 ? nodes[bossIndex] : undefined

  /**
   * Đàn quái đi lang thang trên bản đồ.
   *
   * Thay cho những ô cửa bất động: mỗi chặng có một con quái canh, quẩn quanh
   * chỗ của nó. Trẻ thấy chúng nhúc nhích từ xa nên bản đồ có sự sống, mà vẫn
   * biết chính xác phải tới đâu.
   *
   * MỖI CHẶNG ĐÁNH ĐỀU CÓ MỘT CON, kể cả chặng còn khoá - con quái LÀ cái mốc
   * của chặng, không phải thứ trang trí thêm cạnh ô cửa. Trước đây chỉ chặng đã
   * mở khoá mới sinh quái thay cửa, mà hồ sơ mới thì đúng một chặng được mở -
   * nên cả bản đồ là 18 ô cửa có một con quái đứng đè lên, và chỉ một con nhúc
   * nhích. Nhìn vừa rối vừa chết.
   *
   * HAI CHỖ KHÔNG SINH QUÁI: trùm cuối đã có hình riêng đứng giữa sân đấu, và
   * chặng ôn tập vốn là một cánh cổng chứ không phải một con quái.
   *
   * CẢ ĐÀN CÙNG ĐI, kể cả quái ở chặng còn khoá. Một bản đồ mà chỉ đúng một con
   * nhúc nhích thì vẫn là bản đồ chết - phần còn lại trông như hình dán. Chặng
   * đã mở hay chưa thì đọc bằng MÀU (quái chặng khoá xám lại) chứ không đọc bằng
   * việc nó có động đậy hay không.
   */
  const [monsters, setMonsters] = useState<
    Array<{
      id: string
      x: number
      y: number
      anchor: { x: number; y: number }
      node: MapNode | null
      roams: boolean
    }>
  >([])

  useEffect(() => {
    const roamers = map.gates.flatMap((gate) => {
      const node = nodes[gate.nodeIndex]
      if (!node || node.kind !== 'battle') return []
      return [
        {
          id: `node-${gate.nodeIndex}`,
          x: gate.x,
          y: gate.y,
          anchor: { x: gate.x, y: gate.y },
          node,
          roams: true,
        },
      ]
    })

    const minis = map.denSpots.map((spot, index) => ({
      id: `mini-${index}`,
      x: spot.x,
      y: spot.y,
      anchor: { x: spot.x, y: spot.y },
      node: null,
      roams: true,
    }))

    setMonsters([...roamers, ...minis])
  }, [map, nodes])

  /**
   * Những ô cửa KHÔNG vẽ nữa: chặng đánh nào cũng có một con quái đứng làm mốc,
   * vẽ thêm ô cửa dưới chân nó là thừa và làm bản đồ rối.
   *
   * Cửa của trùm cuối và chặng ôn tập thì vẫn giữ - ở đó không có con nào đứng
   * thay.
   */
  const roamingGates = useMemo(() => {
    const hidden = new Set<string>()
    for (const gate of map.gates) {
      const node = nodes[gate.nodeIndex]
      // Cùng điều kiện với chỗ sinh quái bên trên.
      if (node?.kind === 'battle') hidden.add(`${gate.x},${gate.y}`)
    }
    return hidden
  }, [map, nodes])

  /**
   * Cùng tập trên nhưng ở dạng chuỗi, để đưa xuống canvas bản đồ.
   *
   * Canvas phải so sánh tập này bằng GIÁ TRỊ. Trước đây nó nhận thẳng một `Set`
   * dựng từ state `monsters`, mà `monsters` đổi mảng mỗi 900ms theo nhịp đi của
   * đàn quái - nên cả bản đồ bị vẽ lại mỗi 900ms dù không có gì đổi.
   */
  const roamingKey = useMemo(() => [...roamingGates].sort().join(' '), [roamingGates])

  // Nhịp đi của cả đàn. Chậm hơn nhịp bước của trẻ để trẻ luôn đuổi kịp.
  useEffect(() => {
    if (paused) return
    const rng = createRng(`${seed}-wander`)
    const timer = window.setInterval(() => {
      setMonsters((current) =>
        current.map((m) =>
          m.roams
            ? {
                ...m,
                // Mini boss quanh quẩn TRONG hang; quái thường thì đi quanh chặng
                // của nó. Cho mini boss ra ngoài là hang hết ý nghĩa - trẻ gặp nó
                // ngay trên đường đi mà chẳng cần tìm.
                ...wanderStep(map, m, m.anchor, 2, rng, m.node ? undefined : (map.den ?? undefined)),
              }
            : m,
        ),
      )
    }, getTuning().monsterStepMs)
    return () => window.clearInterval(timer)
  }, [map, paused, seed])

  // Đọc đàn quái trong `tryMove` mà không phải phụ thuộc vào nó: đàn đổi mỗi
  // 900ms, mà `tryMove` chỉ cần vị trí đàn TẠI LÚC bước chân chạm ô.
  const monstersRef = useRef(monsters)
  monstersRef.current = monsters


  /**
   * Con quái hoang đang nhảy ra khỏi bụi cỏ.
   *
   * Hai nhịp: `shown: false` là bụi cỏ rung, `shown: true` là con quái đã đứng
   * trên bản đồ. Xong hai nhịp mới vào trận.
   *
   * Trước đây bước vào cỏ cao là trận nổ ra ngay lập tức, không có con quái nào
   * trên bản đồ - trẻ đang đi bộ thì đột nhiên ở trong một trận đấu, không hiểu
   * đối thủ ở đâu ra.
   */
  const [ambush, setAmbush] = useState<{ variant: number; shown: boolean } | null>(null)
// Khoá chân trẻ trong lúc con quái đang nhảy ra, cùng lý do như khoá lúc có
  // hội thoại: bấm tiếp là đi xuyên qua cả đoạn hoạt cảnh.
  const ambushRef = useRef(ambush)
  ambushRef.current = ambush

  // Hàm báo gặp quái cũng đọc qua ref. Màn bản đồ truyền xuống một arrow viết
  // thẳng trong JSX, nên mỗi lần nó render là một danh tính mới; để hàm đó vào
  // mảng phụ thuộc của hiệu ứng bên dưới thì đồng hồ bị đặt lại từ đầu mỗi lần
  // render, và con quái có thể không bao giờ nhảy ra.
  const onWildRef = useRef(onWildEncounter)
  onWildRef.current = onWildEncounter

  const [pos, setPos] = useState(startAt ?? map.start)
  // Thú đi theo luôn đứng ở ô nhân vật VỪA RỜI KHỎI, nên nó bám sát một bước
  // phía sau đúng kiểu thú cưng đi theo chủ.
  const [trail, setTrail] = useState(startAt ?? map.start)
  // Chỗ đứng đã nhớ, đọc qua ref: chỉ dùng lúc ĐỔI BẢN ĐỒ. Để nó vào mảng phụ
  // thuộc của effect bên dưới thì mỗi bước đi lại kéo nhân vật về chỗ cũ.
  const startAtRef = useRef(startAt)
  startAtRef.current = startAt
  const [facing, setFacing] = useState<Direction>('up')
  const [stepping, setStepping] = useState(false)
  const [scale, setScale] = useState(3)
  // Tên là `viewport` chứ không phải `view`: `view` bên dưới đã là góc nhìn
  // sprite của nhân vật.
  const [viewport, setViewport] = useState({ cols: VIEW_COLS, rows: VIEW_ROWS })
  const containerRef = useRef<HTMLDivElement>(null)

  // Bản đồ đổi (đổi môn) thì đặt nhân vật vào chỗ đã nhớ của vùng đó, hoặc điểm
  // xuất phát nếu đây là lần đầu tới.
  useEffect(() => {
    const at = startAtRef.current ?? map.start
    setPos(at)
    setTrail(at)
    setFacing('up')
  }, [map])

  // Khung nhìn co theo màn hình, nhưng luôn là bội số nguyên của ô để điểm ảnh
  // không bị méo - đây là điều kiện sống còn của pixel art.
  //
  // Đo CHỖ TRỐNG THẬT chứ không lấy phỏng theo chiều cao màn hình. Trước đây
  // khung game được chia 72% chiều cao máy, mà riêng thanh hồ sơ, hàng nút và
  // tên vùng trên điện thoại dọc đã ăn 62% - cộng lại vượt xa một màn, và
  // D-pad, thứ trẻ cần nhất, rơi hẳn xuống dưới tầm nhìn.
  //
  // Nhờ đo thật nên phần đầu trang có đổi gì đi nữa, khung game cũng tự vừa.
  /*
    Đo lại mỗi khi bố cục quanh khung game đổi - xem `useMeasureOnLayout`.

    Cùng lý do với bản đồ thế giới: huy hiệu đồng bộ và lời mời cài app tới muộn
    và biến mất muộn, mà đo một lần lúc dựng thì khung game giữ nguyên cỡ đã trót
    chọn.
  */
  useMeasureOnLayout(containerRef, () => {
    const el = containerRef.current
    const width = el?.clientWidth ?? 0
    if (!el || width === 0) return

    const wide = hasSideDpad()
    const cols = VIEW_COLS
    const maxRows = isShortScreen() ? VIEW_ROWS_WIDE : VIEW_ROWS
    const usable = wide ? width - DPAD_WIDTH : width
    const maxScale = Math.max(2, Math.min(MAX_SCALE, Math.floor(usable / (cols * TILE))))

    // Chỗ trống còn lại theo chiều dọc: dưới phần đầu trang, trên D-pad. Máy
    // nằm ngang thì D-pad đứng CẠNH khung game nên không trừ.
    const top = el.getBoundingClientRect().top + window.scrollY
    const dpad = wide ? 0 : (el.lastElementChild?.getBoundingClientRect().height ?? 0)
    const spare = window.innerHeight - top - dpad - VIEW_MARGIN

    // Lấy bội số phóng LỚN NHẤT mà vẫn còn đủ hàng để nhìn. Phóng to quan
    // trọng hơn nhìn xa: trẻ cần thấy rõ con quái, còn bảy hàng là đủ để né.
    let pick = { scale: 2, rows: FLOOR_ROWS }
    for (let s = maxScale; s >= 2; s--) {
      const fit = Math.min(maxRows, Math.floor(spare / (TILE * s)))
      if (fit >= MIN_ROWS) {
        pick = { scale: s, rows: fit }
        break
      }
      if (s === 2) pick = { scale: 2, rows: Math.max(FLOOR_ROWS, fit) }
    }

    setScale(pick.scale)
    setViewport((current) =>
      current.cols === cols && current.rows === pick.rows ? current : { cols, rows: pick.rows },
    )
  })

  const tryMove = useCallback(
    (direction: Direction) => {
      if (stepping || paused || ambushRef.current) return
      setFacing(direction)

      const { dx, dy } = DELTA[direction]
      const next = { x: pos.x + dx, y: pos.y + dy }
      if (!isWalkable(map, next.x, next.y)) return

      setStepping(true)
      setTrail(pos)
      setPos(next)
      onPosition?.(next)
      window.setTimeout(() => {
        setStepping(false)
        // Đụng quái được xét TRƯỚC ô cổng: con quái mới là thứ trẻ nhìn thấy
        // và nhắm tới, cái cổng chỉ là chỗ nó đứng canh.
        const bumped = monstersRef.current.find((m) => m.x === next.x && m.y === next.y)
        if (bumped) {
          if (bumped.node) onEnterGate(bumped.node)
          else onMonsterBump?.(null)
          return
        }

        const gate = gateAt(map, next.x, next.y)
        const node = gate ? nodes[gate.nodeIndex] : null
        if (node) {
          onEnterGate(node)
          return
        }
        // Cổng được ưu tiên hơn quái hoang: đứng lên cổng mà bị quái chặn thì
        // trẻ tưởng mình bấm hụt.
        const tile = map.tiles[next.y]?.[next.x]
        if (tile === 'tallGrass' && Math.random() < getTuning().encounterChance) {
          setAmbush({ variant: Math.floor(Math.random() * 4), shown: false })
        }
      }, STEP_MS)
    },
    [map, nodes, onEnterGate, onMonsterBump, onPosition, paused, pos.x, pos.y, stepping],
  )

  // Bụi cỏ rung -> con quái ló ra -> vào trận.
  useEffect(() => {
    if (!ambush) return

    if (!ambush.shown) {
      const timer = window.setTimeout(
        () => setAmbush((current) => (current ? { ...current, shown: true } : current)),
        RUSTLE_MS,
      )
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      onWildRef.current?.(ambush.variant)
      setAmbush(null)
    }, REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [ambush])

  // Bàn phím cho máy tính.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const direction = keyToDirection(event.key)
      if (!direction) return
      event.preventDefault()
      tryMove(direction)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tryMove])

  // Sprite đổi theo hướng đang đi: đi lên thấy lưng, đi ngang thấy nghiêng.
  const view = viewFor(creature, facing)

  const viewWidth = viewport.cols * TILE * scale
  const viewHeight = viewport.rows * TILE * scale

  // Camera bám nhân vật nhưng dừng lại ở rìa bản đồ, không để lộ khoảng trống.
  const camX = clamp(
    (pos.x + 0.5) * TILE * scale - viewWidth / 2,
    0,
    Math.max(0, map.width * TILE * scale - viewWidth),
  )
  const camY = clamp(
    (pos.y + 0.5) * TILE * scale - viewHeight / 2,
    0,
    Math.max(0, map.height * TILE * scale - viewHeight),
  )

  return (
    <div ref={containerRef} className="pixel-ui overworld-layout grid justify-items-center gap-3">
      <div
        className="relative overflow-hidden"
        style={{
          width: viewWidth,
          height: viewHeight,
          border: '4px solid #1b2432',
          borderRadius: 6,
          background: biome.colors[biome.ground === 'sand' ? 'sand' : 'grass'],
        }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            transform: `translate3d(${-camX}px, ${-camY}px, 0)`,
            transition: `transform ${STEP_MS}ms linear`,
          }}
        >
          <MapCanvas
            map={map}
            scale={scale}
            tiles={biome.tiles}
            ground={biome.ground}
            hideGates={roamingKey}
          />

          {/* Con trùm đứng sẵn trong sân đấu. Thấy nó từ xa là biết đoạn đường
              này dẫn tới đâu - trước đây trùm chỉ là một dấu ★ nhỏ trên cổng. */}
          {map.arena && bossNode && !bossNode.cleared && (
            <div
              className="absolute"
              style={{
                // Canh giữa theo SÂN, không theo cột cổng: cổng trùm có thể
                // lệch sát mép sân, canh theo nó là con trùm đè lên ngọn đuốc.
                left: ((map.arena.left + map.arena.right + 1) / 2 - 1) * TILE * scale,
                top: (map.arena.top + 0.35) * TILE * scale,
                lineHeight: 0,
                animation: 'boss-bob 1.6s steps(2, end) infinite',
              }}
              aria-hidden="true"
            >
              <PixelSprite sprite={monsterSpriteFor(subject, 0, true)} scale={scale * 2} />
            </div>
          )}

          {/* Đàn quái canh từng chặng */}
          {monsters.map((m) => (
            <div
              key={m.id}
              className="absolute"
              style={{
                left: m.x * TILE * scale,
                top: m.y * TILE * scale,
                width: TILE * scale,
                height: TILE * scale,
                transition: `left 400ms linear, top 400ms linear`,
                zIndex: 1,
              }}
              aria-hidden="true"
            >
              <PixelSprite
                // Mini boss là CON ĐẦU ĐÀN của bầy, không phải trùm cuối: vẫn hình
                // quái thường nhưng lấy con dữ nhất bầy, vẽ to hơn và đeo dấu ★★.
                // Cho nó mượn hình trùm là trẻ tưởng đã gặp trùm ngay giữa đường.
                sprite={monsterSpriteFor(subject, m.node ? m.node.index : 3, false)}
                scale={m.node === null ? scale : scale * 0.85}
              />
              {m.node && <GateBadge node={m.node} x={0} y={0} size={TILE * scale} />}
              {m.node === null && (
                <span
                  className="pixel-font absolute left-1/2 -translate-x-1/2 px-1"
                  style={{
                    top: -TILE * scale * 0.5,
                    fontSize: TILE * scale * 0.34,
                    lineHeight: 1,
                    background: '#f8f8f0',
                    border: '3px solid #1b2432',
                    borderRadius: 4,
                    color: '#b4521f',
                  }}
                >
                  ★★
                </span>
              )}
            </div>
          ))}

          {/* Dấu trạng thái nổi trên mỗi cổng */}
          {map.gates.map((gate) => {
            const node = nodes[gate.nodeIndex]
            // Chặng có quái tuần tra thì dấu đi theo con quái, không đứng lại ở
            // ô cửa cũ - nếu không thì dấu và con quái tách rời nhau.
            if (!node || roamingGates.has(`${gate.x},${gate.y}`)) return null
            return (
              <GateBadge
                key={gate.nodeIndex}
                node={node}
                x={gate.x * TILE * scale}
                y={gate.y * TILE * scale}
                size={TILE * scale}
              />
            )
          })}

          {/* Thú đi theo - vẽ TRƯỚC nhân vật để nhân vật luôn nằm trên */}
          {follower && (trail.x !== pos.x || trail.y !== pos.y) && (
            <div
              className="absolute"
              style={{
                left: trail.x * TILE * scale,
                top: trail.y * TILE * scale,
                width: TILE * scale,
                height: TILE * scale,
                transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
              }}
              aria-hidden="true"
            >
              <PixelSprite sprite={follower.sprite} scale={scale} />
            </div>
          )}

          {/* Bụi cỏ rung rồi con quái hoang nhảy ra.
              Bụi cỏ rung NGAY CHỖ TRẺ ĐỨNG và vẽ đè lên nhân vật - trẻ đang đứng
              trong bụi cỏ nên bụi cỏ là tiền cảnh. Nhưng con quái thì nhảy ra Ô
              PHÍA TRƯỚC MẶT: để nó ở ngay ô của trẻ thì nó che mất nhân vật, và
              trẻ không còn thấy mình đang ở đâu. */}
          {ambush && (
            <div
              className="absolute"
              style={{
                left: (pos.x + (ambush.shown ? DELTA[facing].dx : 0)) * TILE * scale,
                top: (pos.y + (ambush.shown ? DELTA[facing].dy : 0)) * TILE * scale,
                width: TILE * scale,
                height: TILE * scale,
                lineHeight: 0,
                zIndex: 3,
                animation: ambush.shown
                  ? 'ambush-pop 300ms steps(3, end)'
                  : `grass-rustle 160ms steps(2, end) infinite`,
              }}
              aria-hidden="true"
            >
              <PixelSprite
                sprite={
                  ambush.shown
                    ? monsterSpriteFor(subject, ambush.variant, false)
                    : biome.tiles.tallGrass
                }
                scale={scale}
              />
            </div>
          )}

          {/* Nhân vật */}
          <div
            className="absolute"
            style={{
              left: pos.x * TILE * scale,
              top: pos.y * TILE * scale,
              width: TILE * scale,
              height: TILE * scale,
              transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
            }}
          >
            <PixelSprite
              sprite={view.sprite}
              scale={scale}
              flip={view.flip}
              style={{
                // Nhún nhẹ khi bước - hai khung hình, đúng kiểu hoạt cảnh đi bộ
                // của game thời đó.
                transform: `${view.flip ? 'scaleX(-1)' : ''} translateY(${stepping ? -2 : 0}px)`,
              }}
            />
          </div>
        </div>

        {/* Hộp thoại nằm ĐÈ LÊN đáy khung game, không nằm dưới bản đồ - nếu đặt
            dưới thì trên màn hình dọc nó rơi khỏi tầm nhìn và trẻ không thấy. */}
        {dialogue && (
          <div className="absolute inset-x-2 bottom-2" style={{ zIndex: 2 }}>
            {dialogue}
          </div>
        )}
      </div>

      <DPad onMove={tryMove} disabled={stepping || paused || ambush !== null} />
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function keyToDirection(key: string): Direction | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up'
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down'
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left'
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right'
    default:
      return null
  }
}

/**
 * Một ô cảnh dựng sẵn ở khổ gốc 16×16, dán thẳng lên bản đồ được.
 *
 * Bản đồ lớn nhất là 15×44 ô; tô từng điểm ảnh cho cả bản đồ là khoảng 280.000
 * lệnh `fillRect`, đủ chặn luồng chính vài trăm mili giây trên tablet cũ. Vẽ
 * MỖI LOẠI ô đúng một lần rồi `drawImage` thì chỉ còn đúng số ô - vài trăm lệnh.
 */
function stampTile(tiles: TileSet, ground: TileKind, kind: TileKind): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  // Ô có phần trong suốt (cây, đuốc) cần nền bên dưới, nếu không sẽ thủng.
  // Đuốc đứng trong sân đấu nên nền của nó là đá lát, không phải mặt đất -
  // lót nhầm là có một vũng cỏ giữa sân.
  const under = kind === 'torch' ? tiles.arena : tiles[ground]
  drawSprite(ctx, under, 0, 0)
  if (tiles[kind] !== under) drawSprite(ctx, tiles[kind], 0, 0)
  return canvas
}

/** Vẽ toàn bộ bản đồ vào một canvas duy nhất. Vẽ lại chỉ khi bản đồ đổi. */
function MapCanvas({
  map,
  scale,
  tiles,
  ground,
  hideGates,
}: {
  map: RouteMap
  scale: number
  tiles: TileSet
  ground: TileKind
  /**
   * Toạ độ "x,y" của những ô cửa được thay bằng đường đi, nối bằng dấu cách.
   *
   * Là CHUỖI chứ không phải `Set`: hiệu ứng vẽ so sánh nó bằng giá trị, nên bản
   * đồ chỉ vẽ lại khi tập ô cửa thật sự đổi. Nhận `Set` thì mỗi lần cha render
   * lại là một danh tính mới và cả bản đồ bị vẽ lại oan.
   */
  hideGates: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = map.width * TILE
    canvas.height = map.height * TILE

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const hidden = new Set(hideGates ? hideGates.split(' ') : [])
    // Bản đồ chỉ dùng 11 loại ô, nên bảng này dựng nhiều nhất 11 lần cho cả lượt vẽ.
    const stamps = new Map<TileKind, HTMLCanvasElement>()

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const raw = map.tiles[y]![x]!
        const kind = raw === 'gate' && hidden.has(`${x},${y}`) ? 'path' : raw
        let stamp = stamps.get(kind)
        if (!stamp) {
          stamp = stampTile(tiles, ground, kind)
          stamps.set(kind, stamp)
        }
        ctx.drawImage(stamp, x * TILE, y * TILE)
      }
    }
  }, [map, tiles, ground, hideGates])

  return (
    <canvas
      ref={ref}
      style={{
        width: map.width * TILE * scale,
        height: map.height * TILE * scale,
        imageRendering: 'pixelated',
        display: 'block',
      }}
      aria-hidden="true"
    />
  )
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: { palette: Record<string, string>; rows: string[] },
  originX: number,
  originY: number,
): void {
  sprite.rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '.') return
      const color = sprite.palette[char]
      if (!color) return
      ctx.fillStyle = color
      ctx.fillRect(originX + x, originY + y, 1, 1)
    })
  })
}

/** Dấu hiệu trên cổng: đã xong, đang mở, hay còn khoá. */
function GateBadge({
  node,
  x,
  y,
  size,
}: {
  node: MapNode
  x: number
  y: number
  size: number
}) {
  const label = node.cleared ? '✓' : node.kind === 'boss' ? '★' : '!'
  const color = node.cleared ? '#2f7d32' : '#e0483e'

  return (
    <div
      className="pixel-font absolute flex items-center justify-center"
      style={{
        left: x + size * 0.25,
        top: y - size * 0.45,
        width: size * 0.5,
        height: size * 0.5,
        background: '#f8f8f0',
        border: '3px solid #1b2432',
        borderRadius: 4,
        color,
        fontSize: size * 0.34,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {label}
    </div>
  )
}

/** Phím điều hướng cho màn hình cảm ứng. Ô chạm to để ngón tay trẻ không trượt. */
function DPad({ onMove, disabled }: { onMove: (d: Direction) => void; disabled: boolean }) {
  const button = (direction: Direction, glyph: string, gridArea: string) => (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault()
        onMove(direction)
      }}
      aria-label={
        { up: 'Đi lên', down: 'Đi xuống', left: 'Sang trái', right: 'Sang phải' }[direction]
      }
      className="pixel-font flex items-center justify-center text-2xl"
      style={{
        gridArea,
        width: 62,
        height: 62,
        background: '#f8f8f0',
        border: '4px solid #1b2432',
        borderRadius: 6,
        boxShadow: '0 4px 0 0 #1b2432',
        color: '#1b2432',
      }}
    >
      {glyph}
    </button>
  )

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateAreas: '". up ." "left . right" ". down ."',
        gridTemplateColumns: 'repeat(3, auto)',
      }}
    >
      {button('up', '▲', 'up')}
      {button('left', '◀', 'left')}
      {button('right', '▶', 'right')}
      {button('down', '▼', 'down')}
    </div>
  )
}
