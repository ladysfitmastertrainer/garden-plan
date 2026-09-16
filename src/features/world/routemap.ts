/**
 * Sinh tuyến đường đi bộ từ danh sách chặng.
 *
 * Hàm thuần, không đụng DOM - test được. Bản đồ là một lưới ô: đường đi nối các
 * chặng từ dưới lên, mỗi chặng là một cổng đặt trên đường, rìa bản đồ đóng kín
 * để trẻ không đi lạc ra ngoài.
 *
 * BỐN KIỂU BỐ CỤC, mỗi môn một kiểu (xem `biome.ts`):
 *   terrace - bậc đá xếp tầng, đường rộng hai ô, viền đá      (Toán)
 *   winding - lối mòn ngoằn ngoèo giữa rừng dày               (Tiếng Việt)
 *   coast   - đường men bờ, nửa phải bản đồ là biển           (Đạo đức)
 *   staff   - các dòng kẻ ngang xếp thành khuông nhạc         (Âm nhạc)
 *
 * Chặng trùm được khoét riêng một SÂN ĐẤU lát đá có đuốc ở bốn góc. Trước đây
 * trùm chỉ khác con quái thường ở một dấu ★ nhỏ trên cổng, đi tới nơi không có
 * cảm giác gì.
 *
 * Dùng RNG có hạt giống nên CÙNG MỘT MÔN + LỚP luôn ra CÙNG MỘT BẢN ĐỒ. Trẻ
 * quay lại lần sau vẫn thấy đúng khung cảnh quen thuộc, không phải một nơi lạ.
 */

import { createRng } from '../../engine/rng'
import { WALKABLE, type TileKind } from '../pixel/tiles'
import type { RouteShape, ScatterRule } from './biome'

/** Bề ngang mặc định, dùng khi gọi không kèm mô tả vùng đất. */
export const MAP_WIDTH = 13

const MARGIN_TOP = 4
const MARGIN_BOTTOM = 3

/** Số hàng giữa hai chặng liên tiếp. Khuông nhạc xếp dày hơn cho ra đúng hình. */
function rowsPerNode(shape: RouteShape): number {
  return shape === 'staff' ? 3 : 4
}

export interface GatePosition {
  nodeIndex: number
  x: number
  y: number
}

/** Vùng sân đấu trùm, tính bằng ô. Overworld dựa vào đây để đặt hình con trùm. */
export interface ArenaRect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface RouteMap {
  width: number
  height: number
  /** tiles[y][x] */
  tiles: TileKind[][]
  gates: GatePosition[]
  /** Chỗ nhân vật đứng khi mới vào bản đồ. */
  start: { x: number; y: number }
  /** Sân đấu trùm, nếu vùng này có chặng trùm. */
  arena: ArenaRect | null
  /** Hang quái dữ - nơi duy nhất mini boss xuất hiện. */
  den: ArenaRect | null
  /** Chỗ đứng của từng mini boss trong hang. */
  denSpots: Array<{ x: number; y: number }>
}

export interface RouteOptions {
  shape: RouteShape
  width: number
  /** Ô mặt đất nền. */
  ground: TileKind
  /** Vật liệu đóng kín viền. */
  border: TileKind
  /** Ô rắc quanh cổng. */
  gateHalo: TileKind
  scatter: ScatterRule[]
  /** Chặng nào là trùm. -1 nghĩa là vùng này không có trùm. */
  bossIndex: number
}

const DEFAULT_OPTIONS: RouteOptions = {
  shape: 'winding',
  width: MAP_WIDTH,
  ground: 'grass',
  border: 'tree',
  gateHalo: 'tallGrass',
  scatter: [
    { kind: 'flower', chance: 0.06 },
    { kind: 'rock', chance: 0.03 },
    { kind: 'tallGrass', chance: 0.05 },
  ],
  bossIndex: -1,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Cột của từng cổng. Đây là chỗ bốn kiểu bố cục tách nhau ra rõ nhất - nhìn
 * riêng dãy cột này đã đoán được đang ở vùng đất nào.
 */
function gateColumns(
  shape: RouteShape,
  count: number,
  width: number,
  seaStart: number,
  rng: ReturnType<typeof createRng>,
): number[] {
  const left = 3
  const right = shape === 'coast' ? seaStart - 3 : width - 4

  if (shape === 'winding') {
    // Lối mòn trong rừng: mỗi chặng lệch hẳn sang một bên, nhưng không bao giờ
    // trùng cột với chặng trước - trùng cột thì đoạn nối biến mất, đường thẳng
    // tuột một mạch và mất hẳn cảm giác len lỏi.
    const columns: number[] = []
    let previous = -99
    for (let i = 0; i < count; i++) {
      let x = previous
      for (let attempt = 0; attempt < 12 && Math.abs(x - previous) < 3; attempt++) {
        x = rng.int(2, width - 3)
      }
      columns.push(x)
      previous = x
    }
    return columns
  }

  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? left : right))
}

export function buildRouteMap(
  nodeCount: number,
  seed: string,
  options: Partial<RouteOptions> = {},
): RouteMap {
  const opts: RouteOptions = { ...DEFAULT_OPTIONS, ...options }
  const count = Math.max(1, nodeCount)
  const width = opts.width
  const step = rowsPerNode(opts.shape)
  const height = MARGIN_TOP + MARGIN_BOTTOM + (count - 1) * step + 1
  const rng = createRng(seed)

  /** Cột đầu tiên là biển, với bố cục ven bờ. */
  const seaStart = width - 4

  const tiles: TileKind[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => opts.ground),
  )

  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height
  const set = (x: number, y: number, kind: TileKind) => {
    if (inside(x, y)) tiles[y]![x] = kind
  }

  // --- Biển, với bố cục ven bờ ------------------------------------------------
  if (opts.shape === 'coast') {
    for (let y = 0; y < height; y++) {
      // Bờ biển lượn vào lượn ra, không phải một đường kẻ thẳng.
      const edge = seaStart + (rng.chance(0.4) ? 1 : 0)
      for (let x = edge; x < width; x++) set(x, y, 'water')
      set(edge - 1, y, 'sand')
    }
  }

  // --- Cổng và đường đi -------------------------------------------------------
  const columns = gateColumns(opts.shape, count, width, seaStart, rng)
  const gates: GatePosition[] = columns.map((x, index) => ({
    nodeIndex: index,
    x,
    y: height - MARGIN_BOTTOM - index * step,
  }))

  /** Vẽ đoạn dọc, dày `thick` cột tính từ x sang phải. */
  const drawV = (x: number, fromY: number, toY: number, thick = 1) => {
    for (let y = Math.min(fromY, toY); y <= Math.max(fromY, toY); y++) {
      for (let t = 0; t < thick; t++) set(clamp(x + t, 1, width - 2), y, 'path')
    }
  }
  /** Vẽ đoạn ngang, dày `thick` hàng tính từ y xuống dưới. */
  const drawH = (y: number, fromX: number, toX: number, thick = 1) => {
    for (let x = Math.min(fromX, toX); x <= Math.max(fromX, toX); x++) {
      for (let t = 0; t < thick; t++) set(x, clamp(y + t, 1, height - 2), 'path')
    }
  }

  const thick = opts.shape === 'terrace' ? 2 : 1

  // Đoạn dẫn từ chỗ đứng ban đầu tới chặng đầu tiên.
  // Phải trừ 2 chứ không phải 1: hàng cuối cùng là viền, đứng vào đó thì nhân
  // vật kẹt ngay từ bước đầu.
  const start = { x: gates[0]!.x, y: Math.min(height - 2, gates[0]!.y + 1) }
  drawV(start.x, start.y, gates[0]!.y, thick)

  if (opts.shape === 'staff') {
    // Khuông nhạc: mỗi chặng là một dòng kẻ chạy hết bề ngang, cổng là nốt nhạc
    // đậu trên dòng kẻ đó.
    for (const gate of gates) drawH(gate.y, 1, width - 2)
    for (let i = 0; i < gates.length - 1; i++) {
      drawV(gates[i]!.x, gates[i]!.y, gates[i + 1]!.y)
    }
  } else {
    for (let i = 0; i < gates.length - 1; i++) {
      const from = gates[i]!
      const to = gates[i + 1]!
      if (opts.shape === 'terrace') {
        // Rẽ ngang TRƯỚC rồi mới leo: ra đúng hình bậc thang đá xếp tầng.
        drawH(from.y, from.x, to.x, thick)
        drawV(to.x, from.y, to.y, thick)
      } else if (opts.shape === 'winding') {
        // Bẻ ở lưng chừng để đoạn nối gãy hai lần, không phải một chữ L cứng.
        const midY = Math.round((from.y + to.y) / 2)
        drawV(from.x, from.y, midY)
        drawH(midY, from.x, to.x)
        drawV(to.x, midY, to.y)
      } else {
        drawV(from.x, from.y, to.y)
        drawH(to.y, from.x, to.x)
      }
    }
  }

  // --- Cỏ/hoa quanh cổng: gợi ý "chỗ này có quái" ------------------------------
  for (const gate of gates) {
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const x = gate.x + dx
      const y = gate.y + dy
      if (inside(x, y) && tiles[y]![x] === opts.ground) set(x, y, opts.gateHalo)
    }
  }

  // --- Rải rác cảnh vật: chỉ đè lên đất trống, không đè lên đường --------------
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y]![x] !== opts.ground) continue
      let roll = rng.next()
      for (const rule of opts.scatter) {
        if (roll < rule.chance) {
          set(x, y, rule.kind)
          break
        }
        roll -= rule.chance
      }
    }
  }

  // Mép phải được phép chạm tới. Bố cục ven bờ phải dừng trước mặt nước.
  const rightEdge = opts.shape === 'coast' ? seaStart - 1 : width - 2

  // --- Sân đấu trùm -----------------------------------------------------------
  let arena: ArenaRect | null = null
  const boss = opts.bossIndex >= 0 ? gates[opts.bossIndex] : undefined
  if (boss) {
    const rightLimit = rightEdge
    arena = {
      left: clamp(boss.x - 3, 1, rightLimit),
      right: clamp(boss.x + 3, 1, rightLimit),
      top: clamp(boss.y - 3, 1, height - 2),
      bottom: clamp(boss.y + 1, 1, height - 2),
    }
    for (let y = arena.top; y <= arena.bottom; y++) {
      for (let x = arena.left; x <= arena.right; x++) set(x, y, 'arena')
    }
    // Đuốc CHỈ ở bốn góc. Cổng trùm luôn nằm giữa hai góc nên lối vào không bao
    // giờ bị bịt - đặt đuốc dày hơn là có ngày nhốt trẻ ở ngoài sân.
    set(arena.left, arena.top, 'torch')
    set(arena.right, arena.top, 'torch')
    set(arena.left, arena.bottom, 'torch')
    set(arena.right, arena.bottom, 'torch')
  }

  // --- Hang quái dữ -----------------------------------------------------------
  //
  // Một khoảnh đất riêng nằm LỆCH khỏi đường chính, nối vào bằng một lối cụt.
  // Lệch khỏi đường là có chủ ý: trẻ đi thẳng từ cổng này sang cổng kia sẽ không
  // vấp phải mini boss, phải chủ động rẽ vào mới gặp - đó mới là phần thưởng cho
  // việc chịu khó đi lang thang.
  let den: ArenaRect | null = null
  const denSpots: Array<{ x: number; y: number }> = []

  if (count >= 3) {
    // Đặt ở lưng chừng đường, phía đối diện với cổng ở hàng đó.
    const anchor = gates[Math.floor(count / 2)]!
    const toLeft = anchor.x > width / 2
    const denRight = toLeft ? anchor.x - 3 : Math.min(rightEdge, anchor.x + 7)
    const denLeft = toLeft ? Math.max(1, anchor.x - 7) : anchor.x + 3
    const denTop = clamp(anchor.y - 1, 1, height - 4)
    const denBottom = clamp(denTop + 2, 1, height - 2)

    // Chỉ cần ba cột là đủ một cái hang. Đòi rộng hơn thì vùng ven biển - vốn
    // chỉ có tám cột đất - không bao giờ có hang, và mini boss biến mất khỏi
    // đúng một môn.
    if (denRight - denLeft >= 2) {
      den = { left: denLeft, right: denRight, top: denTop, bottom: denBottom }
      for (let y = den.top; y <= den.bottom; y++) {
        for (let x = den.left; x <= den.right; x++) set(x, y, 'arena')
      }
      // Lối cụt nối hang với cổng gần nhất, nếu không thì hang thành ốc đảo.
      drawH(anchor.y, anchor.x, toLeft ? den.right : den.left)

      const midY = Math.floor((den.top + den.bottom) / 2)
      denSpots.push({ x: toLeft ? den.left + 1 : den.right - 1, y: midY })
      if (den.right - den.left >= 4) {
        denSpots.push({ x: toLeft ? den.left + 1 : den.right - 1, y: den.top })
      }
    }
  }

  // --- Viền khép kín. Làm SAU CÙNG để chắc chắn không bị thứ khác đè -----------
  for (let x = 0; x < width; x++) {
    set(x, 0, opts.border)
    set(x, height - 1, opts.border)
  }
  for (let y = 0; y < height; y++) {
    set(0, y, opts.border)
    set(width - 1, y, opts.border)
  }

  // Cổng đặt cuối cùng để chắc chắn ô chặng luôn là cổng.
  for (const gate of gates) set(gate.x, gate.y, 'gate')

  return { width, height, tiles, gates, start, arena, den, denSpots }
}

/**
 * Một bước đi lang thang của con quái.
 *
 * Quái chỉ quẩn quanh CHỖ CỦA NÓ trong bán kính `radius`. Cho đi tự do khắp bản
 * đồ thì hai chuyện xảy ra: trẻ đi hết cả vùng mà không gặp con nào, hoặc cả bầy
 * dồn về một góc. Quẩn quanh chỗ cũ thì mỗi cổng vẫn luôn có người canh.
 *
 * Trả về vị trí mới, hoặc chính vị trí cũ khi không đi được đâu.
 */
export function wanderStep(
  map: RouteMap,
  pos: { x: number; y: number },
  anchor: { x: number; y: number },
  radius: number,
  rng: { int: (min: number, max: number) => number; chance: (p: number) => boolean },
  /** Giam con quái trong đúng khung này. Mini boss không được rời hang. */
  bounds?: ArenaRect,
): { x: number; y: number } {
  // Đứng yên phần lớn thời gian: quái chạy loạn xạ làm trẻ chóng mặt và rất khó
  // bấm trúng, nhất là trên màn hình cảm ứng.
  if (!rng.chance(0.55)) return pos

  const moves = [
    { x: pos.x, y: pos.y - 1 },
    { x: pos.x, y: pos.y + 1 },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x + 1, y: pos.y },
  ].filter(
    (next) =>
      isWalkable(map, next.x, next.y) &&
      Math.abs(next.x - anchor.x) <= radius &&
      Math.abs(next.y - anchor.y) <= radius &&
      (!bounds ||
        (next.x >= bounds.left &&
          next.x <= bounds.right &&
          next.y >= bounds.top &&
          next.y <= bounds.bottom)),
  )

  if (moves.length === 0) return pos
  return moves[rng.int(0, moves.length - 1)]!
}

export function isWalkable(map: RouteMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false
  return WALKABLE[map.tiles[y]![x]!]
}

export function gateAt(map: RouteMap, x: number, y: number): GatePosition | null {
  return map.gates.find((gate) => gate.x === x && gate.y === y) ?? null
}
