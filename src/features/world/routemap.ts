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
  /**
   * Khu đất CAO, vây kín bằng vách đá, chỉ vào được qua bậc thang.
   *
   * Hình chữ nhật này là cả khu, KỂ CẢ vách: mép trái và mép trên là hàng vách,
   * phần đi lại được nằm lọt bên trong.
   */
  plateau: ArenaRect | null
  /** Khu đất TRŨNG. Cùng luật với khu cao, chỉ khác là bước xuống. */
  hollow: ArenaRect | null
  /** Bậc thang lên xuống. Mỗi ô ở đây thay chỗ đúng một ô vách. */
  stairs: Array<{ x: number; y: number }>
  /** Cửa của từng ngôi nhà trên khu đất cao - bước lên là vào nhà. */
  doors: Array<{ x: number; y: number }>
  /**
   * Ô có quái ẩn. KHÔNG có ô cảnh riêng: nhìn vào bản đồ không thấy gì cả.
   *
   * Đó là chủ ý. Một cái ô sáng lên báo "có quái ẩn ở đây" thì nó thôi là ẩn -
   * phần thưởng khi ấy trả cho việc đi tới, chứ không trả cho việc tìm ra.
   */
  secrets: Array<{ x: number; y: number }>
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

  // --- ĐỘ CAO: MỘT KHU ĐẤT CAO VÀ MỘT KHU TRŨNG -------------------------------
  //
  // Cả cơ chế độ cao gói gọn trong một câu: vây kín bằng ô KHÔNG ĐI QUA ĐƯỢC,
  // rồi chừa đúng một ô bậc thang. Không cần toạ độ z, không cần "tầng" nào
  // trong trạng thái nhân vật - phần còn lại của mã nguồn không phải biết là
  // bản đồ có độ cao.
  //
  // Đặt ở đây, SAU cảnh vật rải rác nhưng TRƯỚC viền và cổng: rải rác không
  // được rắc cây vào giữa khu đất, mà khu đất cũng không được đè lên viền.

  let plateau: ArenaRect | null = null
  let hollow: ArenaRect | null = null
  const stairs: Array<{ x: number; y: number }> = []
  const doors: Array<{ x: number; y: number }> = []

  /**
   * Những ô BẮT BUỘC phải còn đi tới được sau mỗi lần khoét.
   *
   * Mở đầu là các cổng chặng. Mỗi khu đất khoét xong lại thêm một ô bên trong
   * nó vào đây - và đó là chỗ bản trước bỏ sót: khu cao khoét trước thì lúc ấy
   * vẫn vào được, nhưng khu trũng khoét sau dựng vách đè đúng lên chân bậc
   * thang của nó. Cổng vẫn tới được nên phép kiểm nói "ổn", mà cả khu đất cao
   * - kèm ngôi nhà và chỗ giấu quái - thì không ai vào được nữa.
   *
   * Thấy được điều này là nhờ in bản đồ ra chữ: vùng Âm nhạc lớp 1 có hai khu
   * đất nằm chồng lên nhau, hàng vách của khu dưới đúng là hàng chân thang của
   * khu trên.
   */
  const mustReach: Array<{ x: number; y: number }> = gates.map((g) => ({ x: g.x, y: g.y }))

  /**
   * Từ chỗ xuất phát có còn đi tới được mọi ô bắt buộc không.
   *
   * Chạy trên mảng ô đang dựng dở, nên phải tự coi viền là đã đóng: viền được
   * vẽ ở bước cuối cùng, mà thiếu nó thì phép loang vòng được qua hàng ngoài
   * cùng và trả lời "vẫn tới được" cho một bản đồ thật ra đã tắc.
   */
  const stillReachable = (extra: { x: number; y: number } | null): boolean => {
    const seen = new Set<string>([`${start.x},${start.y}`])
    const queue = [start]
    while (queue.length > 0) {
      const cur = queue.shift()!
      for (const [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ] as const) {
        const nx = cur.x + dx
        const ny = cur.y + dy
        if (nx <= 0 || ny <= 0 || nx >= width - 1 || ny >= height - 1) continue
        const key = `${nx},${ny}`
        if (seen.has(key) || !WALKABLE[tiles[ny]![nx]!]) continue
        seen.add(key)
        queue.push({ x: nx, y: ny })
      }
    }
    const needed = extra ? [...mustReach, extra] : mustReach
    return needed.every((cell) => seen.has(`${cell.x},${cell.y}`))
  }

  /**
   * Khoét một khu đất ở độ cao khác.
   *
   * Trả về null khi chỗ ấy đụng phải thứ không được đụng. Thà không có khu đất
   * còn hơn có một khu đất nuốt mất cổng chặng - lúc ấy trẻ kẹt hẳn.
   */
  const carveLevel = (
    left: number,
    top: number,
    right: number,
    bottom: number,
    fill: TileKind,
  ): ArenaRect | null => {
    if (right - left < 3 || bottom - top < 3) return null
    if (left < 1 || top < 1 || right > width - 2 || bottom > height - 2) return null

    // Không được chạm vào cổng, sân đấu trùm, hang hay mặt nước - bốn thứ đã có chủ.
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const kind = tiles[y]![x]!
        if (kind === "gate" || kind === "arena" || kind === "water") return null
        if (gates.some((g) => g.x === x && g.y === y)) return null
      }
    }

    // Chụp lại nguyên trạng để hoàn tác được - xem phần kiểm ở cuối hàm.
    const before = [] as TileKind[][]
    for (let y = top; y <= bottom; y++) before.push(tiles[y]!.slice(left, right + 1))
    const footBefore = tiles[clamp(bottom + 1, 1, height - 2)]![
      clamp(Math.round((left + right) / 2), left + 1, right - 1)
    ]!

    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const onEdge = x === left || x === right || y === top || y === bottom
        set(x, y, onEdge ? "cliff" : fill)
      }
    }

    /*
      Bậc thang đặt ở mép DƯỚI, và luôn đúng một cái.

      Mép dưới vì đường chính chạy phía dưới khu đất: bậc thang quay mặt ra
      đường thì trẻ nhìn thấy nó trong lúc đi qua và hiểu ngay là leo lên được.
      Quay ra mép trên thì nó khuất sau chính khu đất ấy.

      Đúng một cái, không phải hai: hai lối vào thì khu đất thành một đoạn
      đường vòng, đi qua lúc nào không hay. Một lối thì phải quay lại đúng chỗ
      cũ mới ra được - và đó mới là cảm giác leo lên một chỗ cao.
    */
    const stairX = clamp(Math.round((left + right) / 2), left + 1, right - 1)
    set(stairX, bottom, "stairs")

    // Lối dẫn từ đường chính tới chân bậc thang, nếu không thì bậc thang treo
    // lơ lửng giữa bãi cỏ và chẳng ai nghĩ là đi vào được.
    const footY = clamp(bottom + 1, 1, height - 2)
    if (tiles[footY]![stairX]! !== "cliff") set(stairX, footY, "path")

    /*
      KHOÉT XONG MỚI HỎI: mọi chặng có còn tới được không?

      Đây không phải kiểm tra thừa. Một vòng vách đá không cần phủ lên cổng nào
      cũng vẫn cắt đứt được đường tới cổng ấy - chỉ cần nó nằm vắt ngang đúng
      đoạn đường độc đạo dẫn vào. Kiểm trước khi khoét thì phải đoán trước hình
      dạng của cả mạng đường; kiểm sau khi khoét thì chỉ việc nhìn kết quả.

      Hỏng thì HOÀN TÁC, trả lại đúng từng ô như cũ, và vùng đó chịu không có
      khu đất này. Thà thiếu một khu đất còn hơn một cổng chặng không tới được:
      trẻ đi hết bản đồ mà tắc thì không có cách nào hiểu được vì sao.
    */
    // Ô ngay trong bậc thang: nếu chỗ này không tới được thì cả khu đất vô nghĩa.
    const inner = { x: stairX, y: bottom - 1 }
    if (!stillReachable(inner)) {
      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) tiles[y]![x] = before[y - top]![x - left]!
      }
      tiles[footY]![stairX] = footBefore
      return null
    }

    stairs.push({ x: stairX, y: bottom })
    mustReach.push(inner)
    return { left, top, right, bottom }
  }

  /*
    QUÉT CẢ BẢN ĐỒ TÌM CHỖ TRỐNG, thay vì neo vào một cổng nào đó.

    Hai bản trước đều neo khu đất vào một cổng chặng rồi đo sang hai bên, và cả
    hai đều để lọt những vùng không còn chỗ quanh bất kỳ cổng nào. In bản đồ
    Tiếng Việt lớp 3 ra chữ mới thấy vì sao: sân đấu trùm chiếm một mảng lớn ở
    góc trên, đường đi ngoằn ngoèo cắt ngang giữa, và bốn cổng còn lại đều dính
    mép bản đồ - không cổng nào còn đủ năm cột trống bên cạnh.

    Quét thì không phải đoán: thử mọi chỗ đặt, lấy chỗ đầu tiên lọt. Phép thử
    không hề dễ dãi - `carveLevel` vẫn từ chối mọi chỗ đụng vào cổng, sân đấu hay
    mặt nước, và vẫn hoàn tác nếu khoét xong mà có thứ gì đó không còn tới được.
    Nên quét chỉ mở rộng chỗ ĐƯỢC PHÉP đặt, không nới lỏng điều kiện nào.

    Khu cao quét từ trên xuống, khu trũng quét từ dưới lên - để hai khu không
    dồn vào một đầu bản đồ, và đi từ đầu này sang đầu kia thì gặp cả hai.
  */
  const scanFor = (
    fill: TileKind,
    span: number,
    tall: number,
    fromTop: boolean,
  ): ArenaRect | null => {
    const rows: number[] = []
    for (let top = 1; top + tall <= height - 2; top++) rows.push(top)
    if (!fromTop) rows.reverse()

    for (const top of rows) {
      for (let left = 1; left + span <= rightEdge; left++) {
        const carved = carveLevel(left, top, left + span, top + tall, fill)
        if (carved) return carved
      }
    }
    return null
  }

  if (count >= 3) {
    /*
      Khuông nhạc thử LỀ TRÊN trước.

      Vùng Âm nhạc dựng bản đồ thành một khuông nhạc: mỗi chặng là một dòng kẻ
      chạy hết bề ngang. Khoét một khu đất vào giữa đó là cắt đứt hai ba dòng kẻ,
      và nó thôi là khuông nhạc. Dải bốn hàng trên dòng kẻ đầu tiên vốn để trống,
      nên thử chỗ ấy trước; chỗ ấy bị sân đấu trùm chiếm thì mới xuống quét chung
      với các vùng khác.
    */
    if (opts.shape === "staff") {
      /*
        Khuông nhạc CHỈ có khu đất cao, và chỉ ở lề trên.

        Dòng kẻ cách nhau ba hàng, mà một khu đất mỏng nhất cũng chiếm bốn hàng
        - nên không có chỗ nào lọt giữa hai dòng kẻ. Đặt ở đâu trong khuông thì
        cũng cắt đứt một tới hai dòng, và cắt hai chỗ là khuông nhạc chỉ còn ba
        dòng nguyên vẹn. Lúc ấy vùng Âm nhạc thôi là khuông nhạc.

        Lề trên có bốn hàng để trống, vừa đủ một khu đất cao - kèm ngôi nhà và
        chỗ giấu quái. Lề dưới chỉ còn một hàng, nên vùng này KHÔNG có khu
        trũng, và đó là đánh đổi có chủ ý: giữ hình dáng riêng của vùng đất
        đáng hơn là có đủ cả hai kiểu địa hình ở mọi nơi.
      */
      // Quét ngang hết lề trên, thử khổ rộng trước: sân đấu trùm có thể đã
      // chiếm một đầu của dải này (vùng Âm nhạc lớp 1 đúng như vậy), nên gõ
      // cứng một chỗ đặt là mất cả khu đất cao của vùng ấy.
      for (const span of [5, 4, 3]) {
        for (let left = 1; !plateau && left + span <= rightEdge; left++) {
          plateau = carveLevel(left, 1, left + span, MARGIN_TOP, "highland")
        }
        if (plateau) break
      }
    } else {
      // Khổ rộng trước, hẹp sau: 4×4 vẫn đủ một ngôi nhà, một lối men và một
      // góc để giấu quái - nhỏ hơn thì thôi, chứ không phải không có.
      plateau = scanFor("highland", 4, 4, true) ?? scanFor("highland", 3, 3, true)
      hollow = scanFor("hollow", 4, 3, false) ?? scanFor("hollow", 3, 3, false)
    }
  }
  if (plateau) {
    /*
      NHÀ TRÊN KHU ĐẤT CAO: mái ở ô trên, cửa ở ô ngay dưới.

      Hai ô chứ không một: một ô 16 điểm ảnh thì cái nhà bé bằng nhân vật và
      đọc ra thành một bụi cây. Mái ở ô trên, cửa ở ô dưới - bước lên cửa là
      vào nhà.
    */
    const doorRow = plateau.bottom - 1
    const roofRow = doorRow - 1
    if (roofRow > plateau.top) {
      /*
        QUÉT HẾT BỀ NGANG, lấy cột đầu tiên dựng được - tối đa hai nhà.

        Bản trước gõ cứng hai vị trí, cột thứ ba và thứ sáu tính từ mép trái. Ở
        một khu đất rộng năm cột thì cột thứ sáu rơi ra ngoài, còn cột thứ ba
        đúng là cột bậc thang - nên vùng Toán lớp 1 không có ngôi nhà nào, mà
        khu đất cao thì vẫn dựng ra bình thường. Quét thì chỉ mất chỗ đẹp.
      */
      for (let x = plateau.left + 1; x <= plateau.right - 1 && doors.length < 2; x++) {
        // Chừa cột bậc thang: dựng nhà đè lên đó là bịt luôn lối vào.
        if (stairs.some((st) => st.x === x)) continue
        // Hai nhà dính nhau đọc ra thành một dãy tường, không ra hai ngôi nhà.
        if (doors.some((d) => Math.abs(d.x - x) < 2)) continue
        set(x, roofRow, "house")
        set(x, doorRow, "door")
        doors.push({ x, y: doorRow })
      }
    }
  }

  // --- QUÁI ẨN ----------------------------------------------------------------
  //
  // Hai ô, và cả hai đều nằm ở GÓC TRONG CÙNG của một khu đất phải leo thang mới
  // vào được. Chọn góc chứ không chọn chỗ bất kỳ, vì góc là nơi người ta đi qua
  // mà không bước vào: muốn giẫm trúng thì phải cố ý đi men hết một vòng.
  //
  // Không nằm trên đường chính, không cạnh cổng, và không có dấu hiệu gì trên
  // mặt đất - phần thưởng ở đây trả cho việc TÌM RA, nên nó phải tìm mới ra.
  const secrets: Array<{ x: number; y: number }> = []
  const farCorner = (rect: ArenaRect | null): { x: number; y: number } | null => {
    if (!rect) return null

    /*
      Quét HẾT phần trong, lấy ô xa bậc thang nhất.

      Bản trước chỉ thử ba góc gõ cứng, và ở một khu đất rộng năm cột thì hai
      ngôi nhà đứng đúng vào hai cột góc ấy - vùng Âm nhạc lớp 1 vì thế không có
      chỗ giấu quái nào, dù khu đất và nhà đều dựng ra bình thường.

      Xa bậc thang nhất chứ không phải một góc cố định: đó mới là thứ thật sự
      cần: vào được rồi vẫn còn phải đi men thêm một quãng nữa mới giẫm trúng.
    */
    const stair = stairs.find((st) => st.y === rect.bottom)
    let best: { x: number; y: number } | null = null
    let bestFar = -1

    for (let y = rect.top + 1; y <= rect.bottom - 1; y++) {
      for (let x = rect.left + 1; x <= rect.right - 1; x++) {
        if (!WALKABLE[tiles[y]![x]!]) continue
        if (doors.some((d) => d.x === x && d.y === y)) continue
        if (stairs.some((st) => st.x === x && st.y === y)) continue

        const far = stair ? Math.abs(stair.x - x) + Math.abs(stair.y - y) : x + y
        if (far > bestFar) {
          bestFar = far
          best = { x, y }
        }
      }
    }
    return best
  }
  for (const corner of [farCorner(plateau), farCorner(hollow)]) {
    if (corner && !doors.some((d) => d.x === corner.x && d.y === corner.y)) secrets.push(corner)
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

  return {
    width,
    height,
    tiles,
    gates,
    start,
    arena,
    den,
    denSpots,
    plateau,
    hollow,
    stairs,
    doors,
    secrets,
  }
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
