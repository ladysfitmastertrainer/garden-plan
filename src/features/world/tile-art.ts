/**
 * BẢN ĐỒ ĐI CẢNH, VẼ THEO NÉT CỦA NHÂN VẬT.
 *
 * Nhân vật và nền trận đấu đã là hình vẽ tay: viền nâu đậm, tô mảng phẳng, khối
 * tròn trịa. Bản đồ pixel 16×16 đứng cạnh chúng thành hai thế giới khác nhau.
 *
 * KHÔNG thay bản đồ bằng ảnh. Bản đồ sinh từ lưới ô (`routemap.ts`), mỗi vùng
 * đất một hình dáng, rộng tới 15×64 ô và đi được khắp nơi - một tấm ảnh Gemini
 * thì chỉ là một khung cố định. Nên ở đây vẫn đọc ĐÚNG lưới ô ấy, chỉ khác cách
 * vẽ ra:
 *
 *   1. Mặt đất vẽ theo LỚP, không theo ô. Mọi ô cùng một loại mặt đất gộp thành
 *      một mảng liền, góc lồi bo tròn, viền đậm quanh cả mảng - nên đường đất
 *      là một dải đường uốn lượn chứ không phải một dãy ô vuông, và bờ biển là
 *      một đường bờ chứ không phải răng cưa.
 *   2. Lớp nào "cao" hơn lớp dưới (đất liền trên nước, khu đất cao, vách đá) có
 *      thêm một dải tối ở mép dưới - đủ cho mắt đọc ra độ cao kiểu nhìn chéo
 *      từ trên xuống.
 *   3. Vật đứng trên mặt đất (cây, đá, nhà, đuốc...) vẽ sau cùng, theo hàng từ
 *      trên xuống, để tán cây hàng dưới đè lên chân cây hàng trên.
 *
 * Màu lấy từ CÙNG bảng `TerrainColors` mà bản pixel dùng, nên mỗi vùng đất và
 * ánh sáng theo lớp (`biome.ts`) vẫn đổi tông đúng như trước.
 */

import { shade, type TerrainColors, type TileKind } from '../pixel/tiles'

/** Cạnh một ô, điểm ảnh canvas. Bản đồ phóng 2-6 lần khổ 16, nên 64 nét ở mọi mức. */
export const ART_TILE = 64

const T = ART_TILE
/** Viền: cùng nâu đậm với viền nhân vật vẽ tay. */
const INK = '#3b2a20'
/** Bề dày viền quanh mỗi mảng mặt đất. */
const LINE = 4

type Grid = TileKind[][]

/** Mặt đất phẳng: gộp thành mảng liền. */
const FLOORS = [
  'water',
  'lava',
  'shoal',
  'grass',
  'sand',
  'hollow',
  'highland',
  'tallGrass',
  'path',
  'ash',
  'caveFloor',
  'canopy',
  'arena',
] as const satisfies readonly TileKind[]

/** Khối cao chắn đường: cũng gộp thành mảng, nhưng có mặt vách phía trước. */
const WALLS = ['cliff', 'caveWall', 'basalt', 'foliage'] as const satisfies readonly TileKind[]

type Surface = (typeof FLOORS)[number] | (typeof WALLS)[number]

const SURFACE_SET = new Set<TileKind>([...FLOORS, ...WALLS])
/** Mặt đất "thấp hơn đất liền": đất liền vẽ đè lên với một bờ. */
const LOW = new Set<TileKind>(['water', 'lava', 'shoal'])

// --- tiện ích ---------------------------------------------------------------

/** Số giả ngẫu nhiên cố định theo toạ độ: cùng bản đồ thì cùng chi tiết. */
function rand(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Trộn hai màu hex, t = 0 là a, 1 là b. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t)
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}

/** Viền của một mảng: chính màu ấy kéo về nâu đậm, để ranh giới đất không gắt. */
function edgeOf(color: string): string {
  return mix(color, INK, 0.7)
}

function stroke(ctx: CanvasRenderingContext2D, width = LINE, color = INK): void {
  ctx.lineWidth = width
  ctx.strokeStyle = color
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
}

// --- mặt đất ------------------------------------------------------------------

/**
 * Loại mặt đất nằm dưới một ô.
 *
 * Ô mặt đất thì là chính nó. Ô có vật đứng (cây, đá, cổng...) thì lấy mặt đất
 * phổ biến nhất của bốn ô quanh nó - cổng đứng giữa đường thì nằm trên đường,
 * nhà trên khu đất cao thì nằm trên đất cao. Không có ô nào quanh để hỏi thì
 * là mặt đất chính của vùng.
 */
function surfaceGrid(tiles: Grid, ground: TileKind): Surface[][] {
  const h = tiles.length
  const w = tiles[0]?.length ?? 0
  const base = (SURFACE_SET.has(ground) ? ground : 'grass') as Surface
  return tiles.map((row, y) =>
    row.map((kind, x) => {
      if (kind === 'caveMouth') return 'caveWall'
      if (kind === 'torch') return 'arena'
      if (SURFACE_SET.has(kind)) return kind as Surface
      const votes = new Map<Surface, number>()
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const n = tiles[ny]![nx]!
        if (!SURFACE_SET.has(n) || (WALLS as readonly string[]).includes(n)) continue
        votes.set(n as Surface, (votes.get(n as Surface) ?? 0) + 1)
      }
      let best: Surface = base
      let most = 0
      for (const [s, n] of votes) if (n > most) [best, most] = [s, n]
      return best
    }),
  )
}

/**
 * Mảng liền của mọi ô thoả `inside`, góc lồi bo tròn.
 *
 * Một hình chữ nhật mỗi ô, cùng trong một Path2D: tô một lần là ra hợp của tất
 * cả, không lộ đường nối giữa hai ô. Góc nào mà cả hai cạnh kề lẫn ô chéo đều
 * nằm ngoài mảng là góc lồi - bo tròn góc ấy.
 */
function regionPath(w: number, h: number, inside: (x: number, y: number) => boolean, radius: number): Path2D {
  const path = new Path2D()
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && inside(x, y)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue
      const corner = (dx: number, dy: number) =>
        // Mép bản đồ không bo: mảng chạy ra ngoài khung nhìn chứ không dừng ở đó.
        x + dx < 0 || x + dx >= w || y + dy < 0 || y + dy >= h
          ? 0
          : !at(x + dx, y) && !at(x, y + dy) && !at(x + dx, y + dy)
            ? radius
            : 0
      const radii = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)]
      // Chồng lấn nửa điểm ảnh để khử khe sáng do khử răng cưa giữa hai ô.
      if (radii.some((r) => r > 0) && 'roundRect' in path) {
        path.roundRect(x * T - 0.5, y * T - 0.5, T + 1, T + 1, radii)
      } else {
        path.rect(x * T - 0.5, y * T - 0.5, T + 1, T + 1)
      }
    }
  }
  return path
}

/** Viền quanh một mảng: tô mảng ấy lệch đi tám hướng bằng màu viền. */
function outline(ctx: CanvasRenderingContext2D, path: Path2D, color: string, width: number, dy = 0): void {
  ctx.fillStyle = color
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.save()
    ctx.translate(Math.cos(a) * width, Math.sin(a) * width + dy)
    ctx.fill(path)
    ctx.restore()
  }
}

interface FloorStyle {
  fill: string
  /** Mép dưới tối, cao bao nhiêu điểm ảnh - lớp này nổi lên trên lớp dưới. */
  lift?: number
  radius?: number
  detail?: (ctx: CanvasRenderingContext2D, x: number, y: number) => void
}

// --- chi tiết trên mặt đất --------------------------------------------------

function tuft(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string): void {
  ctx.beginPath()
  ctx.moveTo(cx - s, cy)
  ctx.quadraticCurveTo(cx - s * 0.7, cy - s * 0.9, cx - s * 0.9, cy - s * 1.4)
  ctx.moveTo(cx, cy)
  ctx.quadraticCurveTo(cx + s * 0.1, cy - s, cx, cy - s * 1.7)
  ctx.moveTo(cx + s, cy)
  ctx.quadraticCurveTo(cx + s * 0.7, cy - s * 0.9, cx + s * 0.9, cy - s * 1.4)
  stroke(ctx, 3, color)
}

function pebble(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, line: string): void {
  ctx.beginPath()
  ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  stroke(ctx, 2.5, line)
}

function grassDetail(dark: string) {
  return (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const px = x * T
    const py = y * T
    if (rand(x, y, 1) < 0.55) tuft(ctx, px + T * (0.2 + rand(x, y, 2) * 0.6), py + T * (0.35 + rand(x, y, 3) * 0.5), 5, dark)
    if (rand(x, y, 4) < 0.2) tuft(ctx, px + T * (0.2 + rand(x, y, 5) * 0.6), py + T * (0.3 + rand(x, y, 6) * 0.5), 4, dark)
  }
}

function speckle(color: string, chance: number, size: number, salt: number) {
  return (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = color
    for (let i = 0; i < 3; i++) {
      if (rand(x, y, salt + i) > chance) continue
      ctx.beginPath()
      ctx.arc(x * T + T * (0.15 + rand(x, y, salt + 10 + i) * 0.7), y * T + T * (0.15 + rand(x, y, salt + 20 + i) * 0.7), size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function floorStyles(c: TerrainColors): Record<Surface, FloorStyle> {
  const highland = shade(c.grass, 0.18)
  const hollow = shade(c.grass, -0.18)
  return {
    water: {
      fill: c.water,
      detail: (ctx, x, y) => {
        if (rand(x, y, 7) > 0.5) return
        const cx = x * T + T * (0.25 + rand(x, y, 8) * 0.5)
        const cy = y * T + T * (0.3 + rand(x, y, 9) * 0.4)
        // Một gợn sóng hình chữ "~".
        ctx.beginPath()
        ctx.moveTo(cx - 12, cy + 2)
        ctx.quadraticCurveTo(cx - 6, cy - 5, cx, cy)
        ctx.quadraticCurveTo(cx + 6, cy + 5, cx + 12, cy - 2)
        stroke(ctx, 3, c.waterLight)
      },
    },
    lava: {
      fill: c.lava,
      detail: (ctx, x, y) => {
        const cx = x * T + T * (0.25 + rand(x, y, 8) * 0.5)
        const cy = y * T + T * (0.25 + rand(x, y, 9) * 0.5)
        ctx.beginPath()
        ctx.ellipse(cx, cy, T * 0.2, T * 0.12, 0, 0, Math.PI * 2)
        ctx.fillStyle = c.lavaLight
        ctx.fill()
        if (rand(x, y, 10) < 0.4) {
          ctx.beginPath()
          ctx.arc(x * T + T * 0.75, y * T + T * 0.7, 4, 0, Math.PI * 2)
          ctx.fillStyle = c.lavaDark
          ctx.fill()
        }
      },
    },
    shoal: {
      fill: c.shoal,
      lift: 0,
      detail: (ctx, x, y) => {
        speckle(c.sand, 0.5, 2.5, 30)(ctx, x, y)
        if (rand(x, y, 11) < 0.5) {
          ctx.beginPath()
          const cx = x * T + T * 0.5
          const cy = y * T + T * (0.3 + rand(x, y, 12) * 0.4)
          ctx.arc(cx, cy, 9, Math.PI * 0.2, Math.PI * 0.8)
          stroke(ctx, 2.5, c.waterLight)
        }
      },
    },
    grass: { fill: c.grass, detail: grassDetail(c.grassDark) },
    sand: { fill: c.sand, detail: speckle(c.sandDark, 0.45, 2.5, 40) },
    hollow: { fill: hollow, detail: grassDetail(shade(c.grassDark, -0.18)) },
    highland: { fill: highland, lift: 9, detail: grassDetail(shade(c.grassDark, 0.12)) },
    tallGrass: { fill: c.tallGrass },
    path: {
      fill: c.path,
      detail: (ctx, x, y) => {
        if (rand(x, y, 13) < 0.3) pebble(ctx, x * T + T * (0.2 + rand(x, y, 14) * 0.6), y * T + T * (0.2 + rand(x, y, 15) * 0.6), 4, c.pathDark, edgeOf(c.path))
        speckle(c.pathDark, 0.35, 2, 50)(ctx, x, y)
      },
    },
    ash: {
      fill: c.ash,
      detail: (ctx, x, y) => {
        speckle(c.ashDark, 0.6, 3, 60)(ctx, x, y)
        speckle(c.lava, 0.25, 2.5, 70)(ctx, x, y)
      },
    },
    caveFloor: {
      fill: c.caveFloor,
      detail: (ctx, x, y) => {
        if (rand(x, y, 16) < 0.35) pebble(ctx, x * T + T * (0.2 + rand(x, y, 17) * 0.6), y * T + T * (0.2 + rand(x, y, 18) * 0.6), 5, c.caveWallLight, edgeOf(c.caveFloor))
        speckle(c.caveFloorDark, 0.5, 2.5, 80)(ctx, x, y)
      },
    },
    canopy: {
      fill: c.plank,
      radius: T * 0.12,
      detail: (ctx, x, y) => {
        // Ván bắc ngang: hai đường ván mỗi ô, đầu ván so le theo hàng.
        ctx.beginPath()
        for (const f of [0.33, 0.66]) {
          ctx.moveTo(x * T + 3, y * T + T * f)
          ctx.lineTo(x * T + T - 3, y * T + T * f)
        }
        const joint = x * T + T * (y % 2 ? 0.3 : 0.7)
        ctx.moveTo(joint, y * T + T * 0.33)
        ctx.lineTo(joint, y * T + T * 0.66)
        stroke(ctx, 3, c.plankDark)
      },
    },
    arena: {
      fill: c.floor,
      radius: T * 0.08,
      detail: (ctx, x, y) => {
        // Đá lát: bốn phiến bo góc mỗi ô.
        ctx.beginPath()
        const g = 4
        const s = T / 2
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
          const rx = x * T + ox * s + g / 2
          const ry = y * T + oy * s + g / 2
          ctx.roundRect(rx, ry, s - g, s - g, 6)
        }
        ctx.fillStyle = (x + y) % 2 ? c.floor : mix(c.floor, c.floorDark, 0.35)
        ctx.fill()
        stroke(ctx, 2.5, c.floorLine)
      },
    },
    // Khối cao: mặt trên vẽ ở đây, mặt vách phía trước vẽ ở `wallFaces`.
    cliff: { fill: c.cliffTop, lift: 0, radius: T * 0.18 },
    caveWall: { fill: c.caveWallLight, lift: 0, radius: T * 0.22 },
    basalt: { fill: c.basaltLight, lift: 0, radius: T * 0.18 },
    foliage: { fill: c.canopy, lift: 0, radius: T * 0.4 },
  }
}

/** Màu hai mặt của khối cao: mặt vách phía trước, và đường nứt trên đó. */
function wallColors(c: TerrainColors): Record<(typeof WALLS)[number], { face: string; crack: string }> {
  return {
    cliff: { face: c.cliff, crack: c.cliffDark },
    caveWall: { face: c.caveWall, crack: c.caveWallDark },
    basalt: { face: c.basalt, crack: c.basaltDark },
    foliage: { face: c.canopyDark, crack: shade(c.canopyDark, -0.25) },
  }
}

// --- vật đứng trên mặt đất ----------------------------------------------------

function shadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number): void {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, rx * 0.32, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(40, 25, 15, 0.22)'
  ctx.fill()
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const cx = x * T + T / 2 + (rand(x, y, 90) - 0.5) * 6
  const by = y * T + T * 0.92
  shadow(ctx, cx, by, T * 0.36)
  // Thân
  ctx.beginPath()
  ctx.moveTo(cx - 7, by)
  ctx.lineTo(cx - 5, by - T * 0.38)
  ctx.lineTo(cx + 5, by - T * 0.38)
  ctx.lineTo(cx + 7, by)
  ctx.closePath()
  ctx.fillStyle = c.trunk
  ctx.fill()
  stroke(ctx, 3.5)
  // Tán: ba cụm tròn chồng lên nhau, trồi lên trên ô một chút.
  const r = T * 0.3 + rand(x, y, 91) * 3
  const top = by - T * 0.62
  const blobs: Array<[number, number, number]> = [
    [cx - r * 0.62, top + r * 0.25, r * 0.78],
    [cx + r * 0.62, top + r * 0.25, r * 0.78],
    [cx, top - r * 0.25, r * 0.92],
  ]
  const crown = new Path2D()
  for (const [bx, bY, br] of blobs) {
    crown.moveTo(bx + br, bY)
    crown.arc(bx, bY, br, 0, Math.PI * 2)
  }
  outline(ctx, crown, INK, 3.5)
  ctx.fillStyle = c.treeLeafDark
  ctx.fill(crown)
  // Phần sáng: cùng các cụm ấy, dịch lên trên-trái, cắt trong tán.
  ctx.save()
  ctx.clip(crown)
  ctx.fillStyle = c.treeLeaf
  for (const [bx, bY, br] of blobs) {
    ctx.beginPath()
    ctx.arc(bx - br * 0.18, bY - br * 0.22, br * 0.85, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = mix(c.treeLeaf, '#ffffff', 0.25)
  ctx.beginPath()
  ctx.arc(cx - r * 0.3, top - r * 0.45, r * 0.18, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const cx = x * T + T / 2
  const by = y * T + T * 0.82
  shadow(ctx, cx, by, T * 0.36)
  const rock = new Path2D()
  rock.moveTo(cx - T * 0.36, by)
  rock.bezierCurveTo(cx - T * 0.42, by - T * 0.3, cx - T * 0.2, by - T * 0.5, cx + T * 0.02, by - T * 0.48)
  rock.bezierCurveTo(cx + T * 0.28, by - T * 0.46, cx + T * 0.42, by - T * 0.26, cx + T * 0.36, by)
  rock.closePath()
  ctx.fillStyle = c.stoneDark
  ctx.fill(rock)
  ctx.save()
  ctx.clip(rock)
  ctx.fillStyle = c.stone
  ctx.beginPath()
  ctx.ellipse(cx - T * 0.05, by - T * 0.3, T * 0.36, T * 0.26, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.stoneLight
  ctx.beginPath()
  ctx.ellipse(cx - T * 0.12, by - T * 0.36, T * 0.12, T * 0.06, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.lineWidth = 3.5
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke(rock)
  ctx.restore()
}

function drawFlowers(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const spots: Array<[number, number]> = [
    [0.28, 0.35],
    [0.7, 0.5],
    [0.38, 0.78],
  ]
  for (const [fx, fy] of spots) {
    const cx = x * T + T * fx + (rand(x, y, fx * 100) - 0.5) * 8
    const cy = y * T + T * fy + (rand(x, y, fy * 100) - 0.5) * 8
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2
      ctx.moveTo(cx + Math.cos(a) * 5 + 4, cy + Math.sin(a) * 5)
      ctx.arc(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 4, 0, Math.PI * 2)
    }
    ctx.fillStyle = c.flower
    ctx.fill()
    stroke(ctx, 2)
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fillStyle = c.flowerCore
    ctx.fill()
  }
}

function drawTallGrass(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  // Ba bụi lá nhọn - quy ước "chỗ này có quái" của dòng game này, phải đọc ra
  // được ngay là CỎ CAO chứ không phải một mảng cỏ sẫm màu.
  for (const [fx, fy] of [[0.27, 0.5], [0.72, 0.42], [0.5, 0.92]] as const) {
    const cx = x * T + T * fx
    const by = y * T + T * fy
    const blade = new Path2D()
    for (const [dx, h] of [[-8, 18], [0, 24], [8, 18]] as const) {
      blade.moveTo(cx + dx - 5, by)
      blade.quadraticCurveTo(cx + dx - 3, by - h * 0.6, cx + dx + dx * 0.3, by - h)
      blade.quadraticCurveTo(cx + dx + 3, by - h * 0.6, cx + dx + 5, by)
      blade.closePath()
    }
    ctx.fillStyle = c.tallGrassDark
    ctx.fill(blade)
    ctx.save()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = INK
    ctx.lineJoin = 'round'
    ctx.stroke(blade)
    ctx.restore()
  }
}

function drawGate(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const cx = x * T + T / 2
  const by = y * T + T * 0.94
  const w = T * 0.76
  const h = T * 0.86
  const arch = (inset: number) => {
    const p = new Path2D()
    p.moveTo(cx - w / 2 + inset, by)
    p.lineTo(cx - w / 2 + inset, by - h + w / 2)
    p.arc(cx, by - h + w / 2, w / 2 - inset, Math.PI, 0)
    p.lineTo(cx + w / 2 - inset, by)
    p.closePath()
    return p
  }
  const outer = arch(0)
  ctx.fillStyle = c.stone
  ctx.fill(outer)
  const inner = arch(9)
  ctx.fillStyle = c.gateVoid
  ctx.fill(inner)
  ctx.save()
  ctx.clip(inner)
  ctx.fillStyle = mix(c.gateVoid, '#ffffff', 0.18)
  ctx.beginPath()
  ctx.arc(cx, by - h * 0.45, w * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.lineWidth = 3.5
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke(outer)
  ctx.lineWidth = 2.5
  ctx.stroke(inner)
  ctx.restore()
}

function drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const cx = x * T + T / 2
  const by = y * T + T * 0.9
  shadow(ctx, cx, by, T * 0.22)
  ctx.beginPath()
  ctx.moveTo(cx - 12, by)
  ctx.lineTo(cx - 8, by - T * 0.42)
  ctx.lineTo(cx + 8, by - T * 0.42)
  ctx.lineTo(cx + 12, by)
  ctx.closePath()
  ctx.fillStyle = c.stone
  ctx.fill()
  stroke(ctx, 3)
  ctx.beginPath()
  ctx.roundRect(cx - 14, by - T * 0.5, 28, 9, 3)
  ctx.fillStyle = c.stoneLight
  ctx.fill()
  stroke(ctx, 3)
  const fy = by - T * 0.52
  const flame = (s: number, color: string) => {
    ctx.beginPath()
    ctx.moveTo(cx, fy - 26 * s)
    ctx.bezierCurveTo(cx + 13 * s, fy - 10 * s, cx + 12 * s, fy, cx, fy)
    ctx.bezierCurveTo(cx - 12 * s, fy, cx - 13 * s, fy - 10 * s, cx, fy - 26 * s)
    ctx.fillStyle = color
    ctx.fill()
  }
  flame(1, c.flame)
  stroke(ctx, 2.5)
  flame(0.55, c.flameCore)
}

function drawStairs(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const px = x * T
  const py = y * T
  const steps = 4
  for (let i = 0; i < steps; i++) {
    const sy = py + (i * T) / steps
    ctx.beginPath()
    ctx.rect(px + 4, sy, T - 8, T / steps)
    ctx.fillStyle = i % 2 ? c.stone : c.stoneLight
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(px + 4, sy + T / steps)
    ctx.lineTo(px + T - 4, sy + T / steps)
    stroke(ctx, 2.5, c.stoneDark)
  }
  ctx.beginPath()
  ctx.moveTo(px + 4, py)
  ctx.lineTo(px + 4, py + T)
  ctx.moveTo(px + T - 4, py)
  ctx.lineTo(px + T - 4, py + T)
  stroke(ctx, 3.5)
}

function drawVine(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const px = x * T
  const py = y * T
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const ry = py + T * (0.15 + i * 0.24)
    ctx.moveTo(px + T * 0.28, ry)
    ctx.lineTo(px + T * 0.72, ry)
  }
  stroke(ctx, 7, INK)
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const ry = py + T * (0.15 + i * 0.24)
    ctx.moveTo(px + T * 0.28, ry)
    ctx.lineTo(px + T * 0.72, ry)
  }
  stroke(ctx, 3.5, c.plank)
  for (const fx of [0.26, 0.74]) {
    ctx.beginPath()
    ctx.moveTo(px + T * fx, py)
    ctx.lineTo(px + T * fx, py + T)
    stroke(ctx, 9, INK)
    ctx.beginPath()
    ctx.moveTo(px + T * fx, py)
    ctx.lineTo(px + T * fx, py + T)
    stroke(ctx, 5, c.plankDark)
  }
}

function drawStalagmite(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const cx = x * T + T / 2
  const by = y * T + T * 0.88
  shadow(ctx, cx, by, T * 0.3)
  const cone = new Path2D()
  cone.moveTo(cx - T * 0.3, by)
  cone.quadraticCurveTo(cx - T * 0.12, by - T * 0.4, cx - 2, by - T * 0.78)
  cone.quadraticCurveTo(cx + 4, by - T * 0.8, cx + 5, by - T * 0.7)
  cone.quadraticCurveTo(cx + T * 0.14, by - T * 0.35, cx + T * 0.3, by)
  cone.closePath()
  ctx.fillStyle = c.caveWall
  ctx.fill(cone)
  ctx.save()
  ctx.clip(cone)
  ctx.fillStyle = c.caveWallLight
  ctx.beginPath()
  ctx.ellipse(cx - T * 0.1, by - T * 0.3, T * 0.12, T * 0.4, 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.lineWidth = 3.5
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke(cone)
  ctx.restore()
}

function drawCaveMouth(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const cx = x * T + T / 2
  const by = y * T + T
  const mouth = new Path2D()
  mouth.moveTo(cx - T * 0.34, by)
  mouth.lineTo(cx - T * 0.34, by - T * 0.42)
  mouth.arc(cx, by - T * 0.42, T * 0.34, Math.PI, 0)
  mouth.lineTo(cx + T * 0.34, by)
  mouth.closePath()
  ctx.fillStyle = c.dark
  ctx.fill(mouth)
  ctx.save()
  ctx.lineWidth = 4
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke(mouth)
  ctx.restore()
}

/** Nhà: ô `house` là mái + nửa trên bức tường, ô `door` ngay dưới là tường có cửa. */
function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const px = x * T
  const py = y * T
  // Tường phần trên, nối liền xuống ô cửa bên dưới.
  ctx.beginPath()
  ctx.rect(px + 7, py + T * 0.55, T - 14, T * 0.45 + 2)
  ctx.fillStyle = c.wall
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(px + 7, py + T * 0.55)
  ctx.lineTo(px + 7, py + T + 2)
  ctx.moveTo(px + T - 7, py + T * 0.55)
  ctx.lineTo(px + T - 7, py + T + 2)
  stroke(ctx, 3.5)
  // Cửa sổ tròn
  ctx.beginPath()
  ctx.arc(px + T / 2, py + T * 0.8, 7, 0, Math.PI * 2)
  ctx.fillStyle = c.flameCore
  ctx.fill()
  stroke(ctx, 3)
  // Mái
  const roof = new Path2D()
  roof.moveTo(px + 1, py + T * 0.62)
  roof.lineTo(px + T * 0.5, py + T * 0.06)
  roof.lineTo(px + T - 1, py + T * 0.62)
  roof.closePath()
  ctx.fillStyle = c.roof
  ctx.fill(roof)
  ctx.save()
  ctx.clip(roof)
  ctx.fillStyle = c.roofDark
  ctx.fillRect(px + T * 0.5, py, T / 2, T)
  ctx.restore()
  ctx.save()
  ctx.lineWidth = 3.5
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke(roof)
  ctx.restore()
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors): void {
  const px = x * T
  const py = y * T
  ctx.beginPath()
  ctx.rect(px + 7, py, T - 14, T * 0.86)
  ctx.fillStyle = c.wall
  ctx.fill()
  ctx.beginPath()
  ctx.rect(px + 7, py + T * 0.7, T - 14, T * 0.16)
  ctx.fillStyle = c.wallDark
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(px + 7, py - 2)
  ctx.lineTo(px + 7, py + T * 0.86)
  ctx.lineTo(px + T - 7, py + T * 0.86)
  ctx.lineTo(px + T - 7, py - 2)
  stroke(ctx, 3.5)
  const door = new Path2D()
  door.moveTo(px + T * 0.33, py + T * 0.86)
  door.lineTo(px + T * 0.33, py + T * 0.35)
  door.arc(px + T * 0.5, py + T * 0.35, T * 0.17, Math.PI, 0)
  door.lineTo(px + T * 0.67, py + T * 0.86)
  door.closePath()
  ctx.fillStyle = c.doorWood
  ctx.fill(door)
  ctx.save()
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  ctx.stroke(door)
  ctx.restore()
  ctx.beginPath()
  ctx.arc(px + T * 0.6, py + T * 0.62, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = c.flameCore
  ctx.fill()
}

const OBJECTS: Partial<Record<TileKind, (ctx: CanvasRenderingContext2D, x: number, y: number, c: TerrainColors) => void>> = {
  tree: drawTree,
  rock: drawRock,
  flower: drawFlowers,
  tallGrass: drawTallGrass,
  gate: drawGate,
  torch: drawTorch,
  stairs: drawStairs,
  vine: drawVine,
  stalagmite: drawStalagmite,
  caveMouth: drawCaveMouth,
  house: drawHouse,
  door: drawDoor,
}

/**
 * Mặt vách phía trước của khối cao: ở ô nào mà ô ngay dưới không còn là khối ấy,
 * vẽ một dải vách tối có vết nứt dọc ở nửa dưới ô - mắt đọc ra một bờ dốc nhìn
 * chéo từ trên xuống, đúng như ô vách của bản pixel.
 */
function wallFaces(
  ctx: CanvasRenderingContext2D,
  surface: Surface[][],
  kind: (typeof WALLS)[number],
  colors: { face: string; crack: string },
): void {
  const h = surface.length
  const w = surface[0]?.length ?? 0
  const face = T * 0.42
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (surface[y]![x] !== kind) continue
      const below = y + 1 < h ? surface[y + 1]![x] : null
      if (below === kind) continue
      // Mép trong của KHU ĐẤT CAO không có vách: bên trong cao ngang mặt trên,
      // vách chỉ lộ ra ở phía ngoài - nơi đất thấp xuống. Khu TRŨNG thì ngược
      // lại: mép dưới của nó là chỗ đất ngoài cao hơn, không nhìn thấy vách.
      if (below === 'highland') continue
      // Hai ô góc của hàng vách ấy không nằm dưới ô trũng nào, nên hỏi thêm ô
      // vách bên cạnh.
      const overHollow = (cx: number) =>
        cx >= 0 && cx < w && y > 0 && surface[y]![cx] === kind && surface[y - 1]![cx] === 'hollow'
      if (overHollow(x) || overHollow(x - 1) || overHollow(x + 1)) continue
      const px = x * T
      const py = y * T + T - face
      ctx.fillStyle = colors.face
      ctx.fillRect(px - 0.5, py, T + 1, face)
      ctx.beginPath()
      ctx.moveTo(px - 0.5, py)
      ctx.lineTo(px + T + 0.5, py)
      for (const f of [0.22, 0.55, 0.8]) {
        const cx = px + T * f + (rand(x, y, f * 10) - 0.5) * 6
        ctx.moveTo(cx, py + 6)
        ctx.lineTo(cx + 2, py + face - 6)
      }
      stroke(ctx, 3, colors.crack)
    }
  }
}

/**
 * TIỀN CẢNH: phần tán cây trồi lên ô phía trên nó.
 *
 * Vẽ trên một lớp riêng nằm ĐÈ LÊN nhân vật. Trẻ đi tới ô ngay trên một cái cây
 * - tức là ra SAU cái cây - thì tán lá che mất chân mình, đúng như đi sau một
 * gốc cây thật. Chỉ phần trồi lên mới vào lớp này: phần trong ô của chính cái
 * cây không ai đứng vào được, và đứng ngay trước cây thì nhân vật phải đè lên
 * cây chứ không bị cây đè.
 */
export function paintForeground(ctx: CanvasRenderingContext2D, tiles: Grid, colors: TerrainColors): void {
  const h = tiles.length
  const w = tiles[0]?.length ?? 0
  ctx.clearRect(0, 0, w * T, h * T)
  for (let y = 1; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (tiles[y]![x] !== 'tree') continue
      ctx.save()
      ctx.beginPath()
      ctx.rect(x * T - T * 0.25, (y - 1) * T, T * 1.5, T)
      ctx.clip()
      drawTree(ctx, x, y, colors)
      ctx.restore()
    }
  }
}

/**
 * Vẽ cả bản đồ lên `ctx`, khổ `ART_TILE` điểm ảnh mỗi ô.
 *
 * `tiles` là lưới ĐÃ thay xong những ô cổng cần giấu - ở đây không biết gì về
 * chặng hay cổng, chỉ biết vẽ.
 */
export function paintMapArt(ctx: CanvasRenderingContext2D, tiles: Grid, colors: TerrainColors, ground: TileKind): void {
  const h = tiles.length
  const w = tiles[0]?.length ?? 0
  const surface = surfaceGrid(tiles, ground)
  const styles = floorStyles(colors)
  const base: Surface = (SURFACE_SET.has(ground) ? ground : 'grass') as Surface

  ctx.clearRect(0, 0, w * T, h * T)

  const paintLayer = (inside: (x: number, y: number) => boolean, style: FloorStyle, detailOf: Surface | null) => {
    const path = regionPath(w, h, inside, style.radius ?? T * 0.32)
    const line = edgeOf(style.fill)
    if (style.lift) {
      // Bóng đổ xuống mặt đất thấp hơn, ngay dưới bờ: thứ cho mắt biết chỗ này
      // CAO hơn chỗ kia, chứ không chỉ khác màu.
      ctx.save()
      ctx.translate(0, style.lift + 8)
      ctx.fillStyle = 'rgba(20, 15, 10, 0.18)'
      ctx.fill(path)
      ctx.restore()
      // Dải tối mép dưới: chính mảng ấy dịch xuống, có viền riêng. Tô theo
      // TỪNG Ô chứ không một màu cho cả mảng: đất liền gồm cả cỏ lẫn cát, và bờ
      // dưới bãi cát mà mang màu cỏ thì nhìn ra ngay là sai.
      outline(ctx, path, line, LINE, style.lift)
      ctx.save()
      ctx.translate(0, style.lift)
      ctx.clip(path)
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (inside(x, y)) {
            ctx.fillStyle = shade(styles[surface[y]![x]!].fill, -0.3)
            ctx.fillRect(x * T - 1, y * T - 1, T + 2, T + 2)
          }
      ctx.restore()
    }
    outline(ctx, path, line, LINE)
    ctx.fillStyle = style.fill
    ctx.fill(path)
    const detail = detailOf ? styles[detailOf].detail : style.detail
    if (detail) {
      ctx.save()
      ctx.clip(path)
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) detail(ctx, x, y)
      ctx.restore()
    }
  }
  const present = (kind: Surface) => surface.some((row) => row.includes(kind))

  // Nền dưới cùng: cả khung tô màu mặt đất, để mép bản đồ không lộ khoảng trống.
  ctx.fillStyle = styles[base].fill
  ctx.fillRect(0, 0, w * T, h * T)

  // 1. Nước: tô thẳng, không viền - đất liền vẽ đè lên sẽ làm bờ.
  if (present('water')) {
    ctx.fillStyle = styles.water.fill
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (surface[y]![x] === 'water') ctx.fillRect(x * T - 0.5, y * T - 0.5, T + 1, T + 1)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (surface[y]![x] === 'water') styles.water.detail!(ctx, x, y)
  }
  // 2. Nước nông và nham thạch: mảng bo tròn nằm trong nước / trong nền tro.
  for (const kind of ['shoal', 'lava'] as const) if (present(kind)) paintLayer((x, y) => surface[y]![x] === kind, styles[kind], null)

  // 3. ĐẤT LIỀN: mọi thứ không phải nước hay nham thạch, tô màu mặt đất chính.
  // Nổi lên trên nước với một bờ tối - nên bờ biển, bờ hồ tự hiện ra.
  const hasLow = surface.some((row) => row.some((k) => LOW.has(k)))
  paintLayer((x, y) => !LOW.has(surface[y]![x]!), { ...styles[base], lift: hasLow ? 8 : 0 }, base)

  // 4. Các mặt đất khác nằm trên đất liền.
  for (const kind of FLOORS) {
    if (kind === base || LOW.has(kind) || !present(kind)) continue
    paintLayer((x, y) => surface[y]![x] === kind, styles[kind], null)
  }

  const faces = wallColors(colors)
  for (const kind of WALLS) {
    if (!surface.some((row) => row.includes(kind))) continue
    const inside = (x: number, y: number) => surface[y]![x] === kind
    const style = styles[kind]
    const path = regionPath(w, h, inside, style.radius ?? T * 0.2)
    // Vách cao đổ bóng xuống chân: một dải tối mờ ngay dưới mặt vách.
    ctx.save()
    ctx.translate(0, T * 0.22)
    ctx.fillStyle = 'rgba(20, 15, 10, 0.22)'
    ctx.fill(path)
    ctx.restore()
    outline(ctx, path, INK, LINE)
    ctx.fillStyle = style.fill
    ctx.fill(path)
    ctx.save()
    ctx.clip(path)
    wallFaces(ctx, surface, kind, faces[kind])
    if (kind === 'foliage') {
      // Tán lá nhìn từ trên: những cụm lá tròn sáng rải khắp mặt trên.
      ctx.fillStyle = colors.canopyLight
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (inside(x, y) && rand(x, y, 120) < 0.7) {
            ctx.beginPath()
            ctx.arc(x * T + T * (0.25 + rand(x, y, 121) * 0.5), y * T + T * (0.2 + rand(x, y, 122) * 0.3), T * 0.14, 0, Math.PI * 2)
            ctx.fill()
          }
    }
    ctx.restore()
  }

  // Vật đứng: theo hàng từ trên xuống, để hàng dưới đè lên hàng trên.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const draw = OBJECTS[tiles[y]![x]!]
      if (draw) draw(ctx, x, y, colors)
    }
  }
}
