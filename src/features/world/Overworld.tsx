/**
 * Màn đi cảnh kiểu máy điện tử cầm tay: bản đồ ô vuông nhìn từ trên xuống, nhân
 * vật đi từng ô một, khung nhìn bám theo nhân vật.
 *
 * Cách vẽ: TOÀN BỘ bản đồ được vẽ một lần vào một canvas duy nhất rồi chỉ dịch
 * chuyển canvas đó theo camera. Nếu vẽ mỗi ô một phần tử thì một bản đồ 13×30 ô
 * là gần 400 phần tử, cuộn sẽ giật trên máy tính bảng cũ - đúng loại máy các
 * trường hay dùng.
 *
 * Điều khiển: phím mũi tên / WASD cho máy tính, và bốn mũi tên mờ nằm ĐÈ LÊN
 * khung game cho máy chạm. Trẻ tiểu học hầu hết chơi trên điện thoại và máy tính
 * bảng nên bốn mũi tên ấy mới là đường vào chính - xem `TouchPad`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMeasureOnLayout } from '../../shell/useMeasureOnLayout'
import { monsterSpriteFor } from '../pixel/creatures'
import { heroViewFor } from '../pixel/heroes'
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
 * Số CỘT là số co giãn, không phải hằng số.
 *
 * Trước đây nó cố định 11. Trên điện thoại xoay ngang, khung nhìn khi ấy bị
 * CHIỀU CAO chặn - bảy hàng ở bội số 3 cần 336px mà máy chỉ cho 302px, nên bội
 * số tụt về 2, và 11 cột ở bội số 2 chỉ rộng 352px giữa một màn hình 686px. Nửa
 * màn hình bỏ trống, đúng lúc người ta vừa xoay máy ra để nhìn cho rộng.
 *
 * Giờ chiều cao chọn BỘI SỐ, rồi bề ngang có bao nhiêu thì lấy bấy nhiêu cột.
 * Xoay ngang thành một dải rộng - đúng hình dạng của cái màn hình đang cầm.
 */
const MIN_COLS = 9
const VIEW_ROWS = 9
/**
 * Lề dưới của trang, chừa lại sau khung game.
 *
 * Không còn phải trừ chỗ cho D-pad: từ bản này D-pad nằm ĐÈ LÊN khung game chứ
 * không đứng dưới hay đứng cạnh nó nữa - xem `TouchPad`.
 */
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

/**
 * Số hàng ít nhất trên màn hình LÙN - tức điện thoại xoay ngang.
 *
 * Sáu thay vì bảy, và đây là một đánh đổi có tính toán chứ không phải nới lỏng
 * cho tiện: ở bội số 3, bảy hàng cần 336px mà máy xoay ngang chỉ cho khoảng
 * 302px. Giữ bảy thì cả khung tụt xuống bội số 2 và rộng đúng một nửa màn hình.
 *
 * Đổi lại được gì: khung game rộng 672px trên một màn hình 686px, thay vì 352px.
 *
 * Và MẤT gì - nói thẳng ra, vì nó có thật: xoay ngang thấy ÍT ô hơn dựng đứng
 * (14×6 = 84 ô, so với 12×9 = 108), chỉ là mỗi ô TO hơn rưỡi. Đây là đánh đổi
 * "nhìn rõ" lấy "nhìn xa", và nó nghiêng về nhìn rõ có chủ ý: người ta xoay máy
 * ra là để thứ trước mặt to lên, không phải để thấy thêm mấy ô ở rìa.
 */
const MIN_ROWS_WIDE = 6

/** Đáy cùng: thà khung game bé còn hơn phần đầu trang bị đẩy khỏi màn hình. */
const FLOOR_ROWS = 5

export interface Viewport {
  scale: number
  cols: number
  rows: number
}

/**
 * Chọn bội số phóng và số ô cho một khung nhìn cỡ `width × spare`.
 *
 * Hàm THUẦN, tách khỏi component để kiểm được bằng test mà không cần trình
 * duyệt. Đây là chỗ đã hỏng hai lần liền và cả hai lần đều chỉ lộ ra khi cầm
 * điện thoại lên xem, nên nó xứng đáng có test riêng.
 *
 * CHIỀU CAO chọn bội số, BỀ NGANG lấp cột. Xem ghi chú ở `MIN_COLS`.
 */
export function pickViewport(
  width: number,
  spare: number,
  mapWidth: number,
  shortScreen: boolean,
): Viewport {
  const minRows = shortScreen ? MIN_ROWS_WIDE : MIN_ROWS
  /*
    Số cột thật sự dùng.

    Chặn trên là bề rộng bản đồ - quá mép bản đồ chỉ còn nền trống, và một dải
    nền trống bên phải nhìn như khung game bị hỏng.

    KHÔNG có chặn dưới ở đây. `MIN_COLS` chỉ là điều kiện để CHỌN một bội số
    lớn trong vòng lặp dưới; ép nó thành sàn ở đây thì trên một màn hình hẹp
    hơn 9 ô, khung game rộng hơn cả màn hình và nửa bản đồ nằm ngoài mép - mà
    tràn còn tệ hơn hụt, vì trẻ không biết là mình đang không nhìn thấy nó.
  */
  const fitCols = (n: number) => Math.max(1, Math.min(mapWidth, n))

  for (let s = MAX_SCALE; s >= 2; s--) {
    const rows = Math.min(VIEW_ROWS, Math.floor(spare / (TILE * s)))
    const cols = Math.floor(width / (TILE * s))
    if (rows >= minRows && cols >= MIN_COLS) {
      return { scale: s, rows, cols: fitCols(cols) }
    }
  }

  // Máy quá nhỏ cho cả bội số 2: lấy những gì còn lấy được.
  return {
    scale: 2,
    rows: Math.max(FLOOR_ROWS, Math.min(VIEW_ROWS, Math.floor(spare / (TILE * 2)))),
    cols: fitCols(Math.floor(width / (TILE * 2))),
  }
}

/**
 * Khung nhìn lấp đầy màn hình, kèm một bước kéo giãn LẺ.
 *
 * Bội số vẽ vẫn là số nguyên - pixel art vẽ ở bội số lẻ là gợn ngay. Phần lẻ
 * còn thiếu để chạm mép màn hình do CSS kéo giãn cả khung một lần, đúng cách
 * bản đồ thế giới đã làm.
 */
export interface FillViewport extends Viewport {
  fit: number
}

/**
 * Khung nhìn cho chế độ TOÀN MÀN HÌNH trên điện thoại.
 *
 * Khác `pickViewport` ở đúng một điều, nhưng là điều quyết định: SỐ HÀNG SUY RA
 * TỪ TỈ LỆ MÀN HÌNH, không phải từ một hằng số.
 *
 * Bản cũ cố định trần chín hàng, và chín hàng là một con số hợp lý cho một khung
 * game nằm giữa trang. Nhưng khi khung game LÀ cả màn hình thì nó thành sai:
 * điện thoại dựng đứng cao gấp đôi bề ngang, mà chín hàng ở bội số 2 chỉ cao
 * 288px trên một máy 844px - đo thật trên ảnh chụp, hơn 550px bỏ trắng. Xoay
 * ngang thì lỗi đổi chiều: mười lăm cột (hết bề rộng bản đồ) ở bội số 3 rộng
 * 720px trên một màn 844px, và hai dải trắng đứng hai bên.
 *
 * Nên: bề ngang lấy được bao nhiêu cột thì lấy, rồi số hàng nhân theo đúng tỉ lệ
 * của cái màn hình đang cầm. Khung game và màn hình cùng một hình dạng, và bước
 * kéo giãn cuối cùng xoá nốt phần lẻ.
 *
 * Hàm THUẦN, kiểm được bằng test - xem viewport.test.ts.
 */
export function pickFillViewport(
  width: number,
  height: number,
  mapWidth: number,
  mapHeight: number,
  shortScreen: boolean,
): FillViewport {
  const minRows = shortScreen ? MIN_ROWS_WIDE : MIN_ROWS

  /*
    Bước kéo giãn LUÔN tính lại từ số ô cuối cùng, không bao giờ mang theo.

    Đây chính là chỗ đã sai một lần: nhánh dự phòng ở cuối hàm nâng số hàng lên
    cho đủ sàn nhưng vẫn dùng lại `fit` tính từ số hàng CŨ, và khung game cao
    313px trên một màn 280px. Test bắt được (940×280), mắt thì không.
  */
  const frame = (scale: number, cols: number, rows: number): FillViewport => {
    const tile = TILE * scale
    // Lấy bên CHẬT hơn, nên khung không bao giờ tràn ra ngoài mép nào.
    return { scale, cols, rows, fit: Math.min(width / (cols * tile), height / (rows * tile)) }
  }

  const build = (scale: number): FillViewport => {
    const tile = TILE * scale
    // Chặn trên là bề rộng bản đồ: quá mép chỉ còn nền trống, và một dải nền
    // trống bên phải nhìn như khung game bị hỏng.
    const cols = Math.max(1, Math.min(mapWidth, Math.floor(width / tile)))
    // Cùng tỉ lệ với màn hình: rows / cols = height / width.
    const rows = Math.max(1, Math.min(mapHeight, Math.round((cols * height) / width)))
    return frame(scale, cols, rows)
  }

  for (let scale = MAX_SCALE; scale >= 2; scale--) {
    const view = build(scale)
    if (view.cols >= MIN_COLS && view.rows >= minRows) return view
  }

  // Máy quá nhỏ cho cả bội số 2: lấy những gì còn lấy được, và vẫn giữ sàn hàng
  // để nhân vật không đứng sát mép trên dưới. Ở đây khung THÀ hụt còn hơn tràn -
  // `frame` tính lại bước kéo giãn cho đúng số hàng mới.
  const floor = build(2)
  return frame(2, floor.cols, Math.min(mapHeight, Math.max(FLOOR_ROWS, floor.rows)))
}

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
  /** Tên trẻ - chỉ dùng làm hạt giống MÀU của nhân vật. Xem `pixel/heroes.ts`. */
  name: string
  onEnterGate: (node: MapNode) => void
  /**
   * Khoá điều khiển khi đang có hội thoại. Thiếu cái này thì trẻ bấm tiếp là
   * nhân vật ĐI XUYÊN QUA cổng trong lúc hộp thoại vẫn đang mở.
   */
  paused?: boolean
  /** Hộp thoại, vẽ đè lên đáy khung game đúng chỗ game thời đó đặt nó. */
  dialogue?: React.ReactNode
  /**
   * Nút nổi ở hai góc TRÊN của khung game: quay lại, và mở bảng điều khiển.
   *
   * Chúng nằm TRONG khung chứ không nổi trên trang, và đó là cả lý do có tham
   * số này. Khung game được căn giữa màn hình, nên trên điện thoại luôn còn hai
   * dải trống trên và dưới nó; nút dán vào mép MÀN HÌNH thì trôi ra giữa dải
   * trống ấy, rời hẳn khỏi thứ nó điều khiển. Dán vào mép KHUNG thì nó nằm ngay
   * trên tấm bản đồ, đúng một chỗ ở mọi cỡ máy và mọi hướng xoay.
   */
  hud?: React.ReactNode
  /**
   * Khung game LẤP ĐẦY màn hình - bật trên điện thoại, tắt trên máy tính.
   *
   * Trên máy tính khung game là một khối nằm giữa trang, có phần đầu trang và
   * hàng nút ở trên, nên nó phải chừa chỗ cho chúng. Trên điện thoại nó là cả
   * màn hình, và mọi điểm ảnh bỏ trắng là một điểm ảnh lấy mất của trò chơi.
   */
  fill?: boolean
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
  onMonsterBump?: (node: MapNode | null, id?: string) => void
  /**
   * Những con quái ĐÃ BỊ HẠ trong lần ghé này - không vẽ ra nữa.
   *
   * Danh sách sống theo chuyến đi chứ không theo hồ sơ: rời vùng đất rồi quay
   * lại thì cả đàn đứng dậy. Xem `beatenMonsters` trong `store/ui.ts`.
   */
  beaten?: string[]
  /**
   * Trẻ bước lên CỬA một ngôi nhà trên khu đất cao.
   *
   * Truyền toạ độ cửa chứ không truyền số thứ tự: toạ độ là thứ không đổi khi
   * bản đồ dựng lại, nên nó dùng luôn được làm khoá nhớ "nhà này lục rồi".
   */
  onEnterHouse?: (at: { x: number; y: number }) => void
  /** Trẻ giẫm trúng một ô có quái ẩn. Cùng lẽ với trên: truyền toạ độ. */
  onSecret?: (at: { x: number; y: number }) => void
  /**
   * Bạn cùng lớp đang đi trong CÙNG vùng đất này, đã kèm hình và chỗ đứng.
   *
   * Nhận hình đã tô màu sẵn chứ không nhận emoji: thành phần này vẽ lại ở mọi
   * bước chân, và tô màu một hình là dựng một đối tượng mới - trả về hình mới
   * ở mỗi lần vẽ nghĩa là cả đám bạn tô lại canvas liên tục.
   */
  friends?: Array<{ id: string; name: string; sprite: import('../pixel/sprite').Sprite; x: number; y: number }>
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

/**
 * Danh sách bạn cùng lớp RỖNG, dựng một lần.
 *
 * Không viết `friends ?? []` thẳng trong thân hàm: mảng rỗng viết tại chỗ là
 * một danh tính mới ở mỗi lần vẽ, và nó đi thẳng vào mảng phụ thuộc của
 * useMemo/useEffect bên dưới.
 */
const EMPTY_FRIENDS: NonNullable<Props['friends']> = []
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
  name,
  onEnterGate,
  paused = false,
  dialogue,
  hud,
  fill = false,
  onWildEncounter,
  onMonsterBump,
  onEnterHouse,
  onSecret,
  beaten,
  friends,
  follower,
  startAt,
  onPosition,
}: Props) {
  const crowd = friends ?? EMPTY_FRIENDS
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
   * Đàn quái CÒN SỐNG - đây mới là danh sách được vẽ ra và đụng vào được.
   *
   * Lọc ở đây chứ không xoá khỏi `monsters`: `monsters` được dựng lại mỗi khi
   * bản đồ đổi, còn danh sách đã hạ thì sống lâu hơn thế. Trộn hai vòng đời
   * vào một mảng là có ngày con quái đã hạ sống lại giữa chuyến đi.
   */
  const alive = useMemo(
    () => (beaten && beaten.length > 0 ? monsters.filter((m) => !beaten.includes(m.id)) : monsters),
    [monsters, beaten],
  )
  const aliveRef = useRef(alive)
  aliveRef.current = alive

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
  const [viewport, setViewport] = useState({ cols: MIN_COLS, rows: VIEW_ROWS })
  /** Bước kéo giãn LẺ chồng lên bội số vẽ. 1 = không kéo giãn (máy tính). */
  const [fit, setFit] = useState(1)
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

    // Chỗ trống còn lại theo chiều dọc: tất cả những gì dưới phần đầu trang.
    // Khung game lấy TRỌN bề ngang - bốn mũi tên nằm đè lên nó nên không ăn chỗ.
    const top = el.getBoundingClientRect().top + window.scrollY
    /*
      Lề dưới trang chỉ có nghĩa khi khung game còn đứng trong một trang.

      Ở chế độ toàn màn hình nó KHÔNG còn: dưới khung không có gì nữa cả, nên
      28px chừa lại ở đó là 28px bỏ trắng ngay sát mép máy.
    */
    const spare = fill ? fillHeightBelow(el, top) : window.innerHeight - top - VIEW_MARGIN

    const pick = fill
      ? pickFillViewport(width, spare, map.width, map.height, isShortScreen())
      : { ...pickViewport(width, spare, map.width, isShortScreen()), fit: 1 }

    setScale(pick.scale)
    setViewport((current) =>
      current.cols === pick.cols && current.rows === pick.rows
        ? current
        : { cols: pick.cols, rows: pick.rows },
    )
    // So sánh xấp xỉ: số thực đổi ở chữ số thứ mười hai vẫn là một lần vẽ lại.
    setFit((current) => (Math.abs(current - pick.fit) < 0.01 ? current : pick.fit))
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
        const bumped = aliveRef.current.find((m) => m.x === next.x && m.y === next.y)
        if (bumped) {
          // Báo kèm id để bên ngoài nhớ được con nào vừa bị đụng: thắng trận thì
          // đúng con đó biến khỏi bản đồ.
          onMonsterBump?.(bumped.node, bumped.id)
          if (bumped.node) onEnterGate(bumped.node)
          return
        }

        const gate = gateAt(map, next.x, next.y)
        const node = gate ? nodes[gate.nodeIndex] : null
        if (node) {
          /*
            Báo luôn con quái canh cổng này, y như khi đụng thẳng vào nó.

            Đàn quái đi lang thang quanh chỗ của mình, nên con canh cổng có lúc
            bước ra khỏi ô cổng. Lúc ấy trẻ đi thẳng lên cổng là vào trận mà
            KHÔNG đụng vào con nào - và bản trước vì thế không nhớ được con nào
            vừa bị hạ. Đánh thắng xong quay ra, nó vẫn đứng đó như chưa có gì.

            Đây đúng là lỗi "đánh quái xong quái không biến mất": nó chỉ xảy ra
            khi con quái vừa đi chệch khỏi cổng, nên lúc gặp lúc không.
          */
          const guard = aliveRef.current.find((m) => m.node?.id === node.id)
          onMonsterBump?.(node, guard?.id)
          onEnterGate(node)
          return
        }
        // Cổng được ưu tiên hơn quái hoang: đứng lên cổng mà bị quái chặn thì
        // trẻ tưởng mình bấm hụt.
        const tile = map.tiles[next.y]?.[next.x]

        /*
          Cửa nhà và ô quái ẩn đứng TRƯỚC quái hoang trong hàng ưu tiên.

          Cả hai đều là thứ trẻ cố ý đi tới: leo thang lên khu đất cao rồi men
          tới đúng ô ấy. Để một con quái hoang nhảy ra chen ngang đúng lúc đó
          thì công đi tìm bị một phép tung đồng xu xoá mất.
        */
        if (tile === 'door') {
          onEnterHouse?.(next)
          return
        }
        if (map.secrets.some((spot) => spot.x === next.x && spot.y === next.y)) {
          onSecret?.(next)
          return
        }

        if (tile === 'tallGrass' && Math.random() < getTuning().encounterChance) {
          setAmbush({ variant: Math.floor(Math.random() * 4), shown: false })
        }
      }, STEP_MS)
    },
    [
      map,
      nodes,
      onEnterGate,
      onEnterHouse,
      onMonsterBump,
      onPosition,
      onSecret,
      paused,
      pos.x,
      pos.y,
      stepping,
    ],
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
  const view = heroViewFor(avatar, name, facing)

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
      {/*
        HAI LỚP LỒNG NHAU, mỗi lớp một việc - giống hệt bản đồ thế giới.

        Lớp NGOÀI giữ kích thước THẬT sau khi kéo giãn, nên bố cục quanh nó biết
        khung game chiếm bao nhiêu chỗ, và mọi lớp phủ - bốn mũi tên, hộp thoại,
        hai nút góc trên - treo vào đây để KHÔNG bị kéo giãn theo. Chữ và nút mà
        giãn theo bản đồ thì trên máy rộng chúng phình ra, trên máy hẹp co lại,
        mà chẳng vì lý do gì cả.

        Lớp TRONG giữ toạ độ GỐC: mọi thứ bên trong được đặt theo `ô × TILE ×
        scale`, và một phép nhân nữa cho bước kéo giãn sẽ len vào vài chục chỗ
        tính toạ độ. Một lần `transform: scale` ở đây làm xong việc ấy.
      */}
      <div className="relative" style={{ width: viewWidth * fit, height: viewHeight * fit }}>
      <div
        className="absolute left-0 top-0 overflow-hidden"
        style={{
          width: viewWidth,
          height: viewHeight,
          transform: fit === 1 ? undefined : `scale(${fit})`,
          transformOrigin: 'top left',
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
          {alive.map((m) => (
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

          {/*
            BẠN CÙNG LỚP ĐANG ĐI TRONG CÙNG VÙNG ĐẤT NÀY.

            Vẽ TRƯỚC nhân vật của trẻ, nên khi hai đứa đứng chồng ô thì nhân vật
            của chính em ấy nằm trên - một tấm bản đồ mà con không tìm thấy mình
            ở đâu thì mọi thứ khác trên đó đều vô nghĩa.

            Chỗ đứng tới nơi theo NHỊP TIM, hai giây rưỡi một lần (xem
            `usePvpSync`), chứ không theo từng bước chân. Nên bạn mình không đi
            từng ô như nhân vật của trẻ mà trượt một quãng dài. `transition` kéo
            quãng ấy ra cho mượt: một cú trượt chậm đọc ra là "bạn ấy vừa đi qua
            đằng kia", còn một cú nhảy tức thì đọc ra là màn hình bị lỗi.
          */}
          {crowd.map((friend) => (
            <div
              key={friend.id}
              className="absolute"
              style={{
                left: friend.x * TILE * scale,
                top: friend.y * TILE * scale,
                width: TILE * scale,
                height: TILE * scale,
                transition: 'left 600ms ease-out, top 600ms ease-out',
                zIndex: 1,
              }}
            >
              <PixelSprite sprite={friend.sprite} scale={scale} />
              {/*
                Tên treo trên đầu, và nó là thứ BẮT BUỘC chứ không phải trang trí.

                Cả lớp dùng chung ba hình nhân vật; màu tách được hai em ra nhưng
                không nói được em nào là em nào. Cái tên mới là thứ biến "có ai
                đó ở kia" thành "Bảo An ở kia".
              */}
              <span
                className="pixel-font absolute whitespace-nowrap"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: TILE * scale - 2,
                  fontSize: Math.max(10, scale * 4),
                  lineHeight: 1,
                  padding: '1px 4px',
                  color: '#fff',
                  background: 'rgb(12 16 24 / 0.7)',
                  borderRadius: 3,
                }}
              >
                {friend.name}
              </span>
            </div>
          ))}

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

      </div>

        {/* Hộp thoại nằm ĐÈ LÊN đáy khung game, không nằm dưới bản đồ - nếu đặt
            dưới thì trên màn hình dọc nó rơi khỏi tầm nhìn và trẻ không thấy. */}
        {dialogue && (
          <div className="absolute inset-x-2 bottom-2" style={{ zIndex: 3 }}>
            {dialogue}
          </div>
        )}

        {/*
          Bốn mũi tên nằm ĐÈ LÊN khung game, mờ.

          Giấu đi khi đang có hội thoại - hộp thoại nằm đúng chỗ ấy, và lúc đó
          nhân vật cũng không đi được nữa.

          ĐIỀU KIỆN LÀ `paused`, KHÔNG PHẢI `dialogue`. Bản trước viết `!dialogue`
          và bốn mũi tên biến mất sạch: `dialogue` là một `<AnimatePresence>` -
          một phần tử React LUÔN LUÔN tồn tại, chỉ rỗng ruột khi không có gì để
          hiện - nên `!dialogue` không bao giờ đúng. Trên điện thoại, nơi bốn mũi
          tên này là cách điều khiển DUY NHẤT, nhân vật đứng chết tại chỗ.
        */}
        {!paused && (
          <TouchPad
            onMove={tryMove}
            disabled={stepping || ambush !== null}
            viewHeight={viewHeight * fit}
          />
        )}

        {/* Hai góc TRÊN của khung. Bốn mũi tên ở góc dưới - trái, hộp thoại dán
            vào đáy khung: ba lớp phủ, ba chỗ, không lớp nào che lớp nào. */}
        {hud}
      </div>
    </div>
  )
}

/**
 * Chỗ trống còn lại bên dưới `el` ở chế độ toàn màn hình.
 *
 * KHÔNG phải `window.innerHeight - top`, và phần chênh lệch là phần khuyết của
 * máy tai thỏ: khối bọc ngoài đã đệm `env(safe-area-inset-bottom)` ở đáy (xem
 * `globals.css`), nên đo tới tận đáy CỬA SỔ là đo quá xuống dưới vạch gạt về
 * màn hình chính - đúng chỗ bốn mũi tên đi cảnh đứng. Ngón tay chạm xuống đó thì
 * máy hiểu là muốn thoát app, không phải muốn đi sang trái.
 *
 * Nên phép đo dừng ở đáy phần NỘI DUNG của khối bọc. Không có khối bọc thì quay
 * về phép đo cũ - thà khung game hơi thấp còn hơn không dựng được.
 */
function fillHeightBelow(el: HTMLElement, top: number): number {
  const host = el.parentElement
  if (!host) return window.innerHeight - top

  const style = window.getComputedStyle(host)
  const bottom = host.getBoundingClientRect().bottom - (parseFloat(style.paddingBottom) || 0)
  const spare = bottom + window.scrollY - top
  return spare > 0 ? spare : window.innerHeight - top
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
/**
 * Bốn mũi tên MỜ, nằm đè lên góc dưới - trái của khung game.
 *
 * Trước đây D-pad là một khối trắng đục 195px đứng NGOÀI khung game - dưới nó
 * trên điện thoại dọc, cạnh nó trên màn hình rộng. Hai chỗ đều sai theo cùng một
 * kiểu: nó ăn mất chỗ của chính cái nó dùng để điều khiển. Trên điện thoại nằm
 * ngang, 200px bề ngang nhường cho D-pad ép khung game xuống nhỏ hơn cả lúc dựng
 * đứng - xoay máy ra để nhìn rõ hơn mà lại nhìn được ít hơn.
 *
 * Giờ nó nằm ĐÈ LÊN game, mờ, đúng kiểu game đi cảnh trên điện thoại. Khung game
 * lấy trọn màn hình, và ngón cái vẫn ở đúng chỗ nó vẫn hay đặt.
 *
 * GÓC DƯỚI - TRÁI, không phải giữa: đó là chỗ ngón cái trái rơi vào khi hai tay
 * cầm ngang máy, và nó cũng là góc xa nhân vật nhất - nhân vật luôn đứng giữa
 * khung (xem `camX`/`camY`), nên mũi tên không bao giờ che mất chính con mình.
 *
 * Nền để `pointer-events: none`, chỉ bốn cái nút nhận chạm. Không có nó thì cả
 * khối trong suốt kia nuốt mọi cú chạm rơi vào góc ấy.
 */
function TouchPad({
  onMove,
  disabled,
  viewHeight,
}: {
  onMove: (d: Direction) => void
  disabled: boolean
  /** Chiều cao khung game, để cụm mũi tên co theo chứ không đè kín nửa màn. */
  viewHeight: number
}) {
  /*
    Cỡ nút co theo khung game.

    Cỡ cố định 52px nghe thì gọn, nhưng khung game nhỏ nhất (bội số phóng 2, bảy
    hàng) chỉ cao 224px - cụm ba nút khi đó chiếm gần ba phần tư chiều cao, che
    mất cả lối đi phía trước nhân vật.

    Sàn 40px: dưới mức đó ngón tay trẻ bắt đầu bấm trượt. Trần 56px: to hơn nữa
    thì trên máy tính nó thành một khối chình ình giữa khung game rộng, trong khi
    ở đó gần như ai cũng dùng phím mũi tên.
  */
  const size = Math.max(40, Math.min(56, Math.round(viewHeight / 5.2)))

  const button = (direction: Direction, glyph: string, gridArea: string) => (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault()
        onMove(direction)
      }}
      // Không để trình duyệt hiểu cú vuốt trên nút thành cuộn trang hay phóng to.
      style={{
        gridArea,
        pointerEvents: 'auto',
        touchAction: 'none',
        width: size,
        height: size,
        background: 'rgb(248 248 240 / 0.42)',
        border: '3px solid rgb(27 36 50 / 0.45)',
        borderRadius: 10,
        color: 'rgb(27 36 50 / 0.75)',
        // Mờ mà vẫn đọc được trên nền cỏ sáng lẫn nền cát: viền chữ tối một vòng.
        textShadow: '0 1px 0 rgb(255 255 255 / 0.6)',
        /*
          CỐ Ý không tô mờ thêm khi `disabled`.

          `disabled` bật lên suốt 170 mili giây của MỖI bước đi (`stepping`), nên
          giữ ngón tay trên nút để đi liên tục là bốn mũi tên nhấp nháy theo từng
          bước. Nút vẫn không ăn cú chạm trong lúc đó - chỉ là nó không nói ra,
          và ở đây im lặng đúng hơn: trẻ đang đi, không phải đang bị chặn.
        */
      }}
      aria-label={
        { up: 'Đi lên', down: 'Đi xuống', left: 'Sang trái', right: 'Sang phải' }[direction]
      }
      className="pixel-font flex items-center justify-center text-xl"
    >
      {glyph}
    </button>
  )

  return (
    <div
      className="absolute grid gap-1"
      style={{
        left: 8,
        bottom: 8,
        zIndex: 2,
        pointerEvents: 'none',
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
