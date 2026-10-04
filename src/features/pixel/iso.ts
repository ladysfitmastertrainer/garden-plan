/**
 * Khối đảo nổi dạng đẳng cự (isometric) cho bản đồ thế giới.
 *
 * Mặt trên là hình thoi tỉ lệ 2:1 - tỉ lệ chuẩn của đồ hoạ đẳng cự thời đó, vì
 * nó cho phép mọi đường chéo đi đúng 2 điểm ngang ứng với 1 điểm dọc, không bị
 * răng cưa. Hai mặt bên đổ xuống tạo độ dày, mặt trái tối hơn mặt phải vì quy
 * ước ánh sáng đến từ phía trên bên phải.
 *
 * Khối được SINH BẰNG CODE chứ không vẽ tay: hình thoi 48×24 là 1152 điểm ảnh,
 * vẽ tay thì gần như chắc chắn lệch, mà lệch một điểm là cạnh bị gợn ngay.
 */

import type { Sprite } from './sprite'

export const ISO_WIDTH = 48
export const ISO_TOP_HEIGHT = 24
export const ISO_DEPTH = 10
export const ISO_HEIGHT = ISO_TOP_HEIGHT + ISO_DEPTH

/** Cỡ đảo. Bản đồ đặt tay dùng nhiều cỡ để quần đảo không đều tăm tắp như bàn cờ. */
export interface IsoSize {
  width: number
  topHeight: number
  depth: number
}

/** Đảo hoang tí hon - chỉ để mặt biển đỡ trống, không bấm vào được. */
export const ISO_TINY: IsoSize = { width: 20, topHeight: 10, depth: 5 }
export const ISO_SMALL: IsoSize = { width: 36, topHeight: 18, depth: 8 }
export const ISO_MEDIUM: IsoSize = { width: 48, topHeight: 24, depth: 10 }
export const ISO_LARGE: IsoSize = { width: 64, topHeight: 32, depth: 13 }

/** Nửa bề rộng mặt trên tại hàng y, cho một cỡ đảo bất kỳ. */
function halfWidthAt(y: number, size: IsoSize): number {
  const half = size.topHeight / 2
  const step = size.width / size.topHeight
  return Math.round((y < half ? y + 1 : size.topHeight - y) * step * 2)
}

export interface IslandColors {
  /** Mặt trên (cỏ, cát, tuyết...). */
  top: string
  /** Viền sáng ở mép trên. */
  topEdge: string
  /** Vách bên trái - tối. */
  leftWall: string
  /** Vách bên phải - sáng hơn. */
  rightWall: string
  /** Đường viền ngoài cùng. */
  outline: string
}

/**
 * Sinh một khối đảo. Trả về sprite có nền trong suốt để xếp chồng lên mặt nước.
 */
export function makeIsoIsland(colors: IslandColors, size: IsoSize = ISO_MEDIUM): Sprite {
  const palette: Record<string, string> = {
    T: colors.top,
    E: colors.topEdge,
    L: colors.leftWall,
    R: colors.rightWall,
    '#': colors.outline,
  }

  const totalHeight = size.topHeight + size.depth

  // Dựng lưới rỗng rồi tô dần, dễ kiểm soát hơn là ghép chuỗi từng hàng.
  const grid: string[][] = Array.from({ length: totalHeight }, () =>
    Array.from({ length: size.width }, () => '.'),
  )

  // Mặt trên.
  for (let y = 0; y < size.topHeight; y++) {
    const half = halfWidthAt(y, size)
    const from = Math.max(0, size.width / 2 - half)
    const to = Math.min(size.width - 1, size.width / 2 + half - 1)
    for (let x = from; x <= to; x++) {
      const onEdge = x === from || x === to || x === from + 1 || x === to - 1
      grid[y]![x] = onEdge ? 'E' : 'T'
    }
  }

  // Vách: với mỗi cột, tìm hàng thấp nhất của mặt trên rồi đổ xuống.
  for (let x = 0; x < size.width; x++) {
    let lowest = -1
    for (let y = 0; y < size.topHeight; y++) {
      if (grid[y]![x] !== '.') lowest = y
    }
    if (lowest === -1) continue

    for (let d = 1; d <= size.depth; d++) {
      const y = lowest + d
      if (y >= totalHeight) break
      grid[y]![x] = x < size.width / 2 ? 'L' : 'R'
    }
  }

  // Viền ngoài: ô nào có hàng xóm trống thì tô màu viền.
  const outlined = grid.map((row) => [...row])
  for (let y = 0; y < totalHeight; y++) {
    for (let x = 0; x < size.width; x++) {
      if (grid[y]![x] === '.') continue
      const empty = (ny: number, nx: number) =>
        ny < 0 || nx < 0 || ny >= totalHeight || nx >= size.width || grid[ny]![nx] === '.'
      if (empty(y - 1, x) || empty(y + 1, x) || empty(y, x - 1) || empty(y, x + 1)) {
        outlined[y]![x] = '#'
      }
    }
  }

  return { palette, rows: outlined.map((row) => row.join('')), vector: (ctx, p) => drawIsoBlock(ctx, p, size) }
}

/**
 * Khối đảo vẽ bằng NÉT: cùng hình với lưới điểm ảnh ở trên, nhưng cạnh thẳng
 * mịn, viền đậm và mặt trên có vài túm cỏ - cùng nét với nhân vật vẽ tay.
 *
 * Lưới điểm ảnh vẫn được dựng như cũ, vì nó là thứ quyết định CỠ của khối và là
 * thứ `placeProp` ghép vào. Hình nét chỉ thay cách tô ra màn hình.
 */
function drawIsoBlock(ctx: CanvasRenderingContext2D, p: Record<string, string>, size: IsoSize): void {
  const w = size.width
  const th = size.topHeight
  const d = size.depth
  const inset = 0.8
  const top: Array<[number, number]> = [
    [w / 2, inset],
    [w - inset, th / 2],
    [w / 2, th - inset],
    [inset, th / 2],
  ]
  const poly = (points: Array<[number, number]>) => {
    ctx.beginPath()
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
  }
  const line = Math.max(0.9, w / 40)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // Hai vách
  poly([[inset, th / 2], [w / 2, th - inset], [w / 2, th - inset + d], [inset, th / 2 + d]])
  ctx.fillStyle = p.L!
  ctx.fill()
  poly([[w - inset, th / 2], [w / 2, th - inset], [w / 2, th - inset + d], [w - inset, th / 2 + d]])
  ctx.fillStyle = p.R!
  ctx.fill()
  // Vệt đất sẫm chạy ngang giữa vách - cho vách ra lớp đất chứ không phẳng lì.
  ctx.beginPath()
  ctx.moveTo(inset + 1.5, th / 2 + d * 0.55)
  ctx.lineTo(w / 2, th - inset + d * 0.55)
  ctx.lineTo(w - inset - 1.5, th / 2 + d * 0.55)
  ctx.lineWidth = line * 0.6
  ctx.strokeStyle = 'rgba(40, 25, 15, 0.25)'
  ctx.stroke()

  // Mặt trên
  poly(top)
  ctx.fillStyle = p.T!
  ctx.fill()
  // Mép sáng chạy dọc hai cạnh trên - ánh sáng tới từ phía trên.
  ctx.beginPath()
  ctx.moveTo(inset + line * 1.6, th / 2)
  ctx.lineTo(w / 2, inset + line * 0.9)
  ctx.lineTo(w - inset - line * 1.6, th / 2)
  ctx.lineWidth = line
  ctx.strokeStyle = p.E!
  ctx.stroke()
  // Vài túm cỏ trên mặt, chỉ ở khối đủ to để thấy được.
  if (w >= 30) {
    ctx.strokeStyle = 'rgba(30, 50, 20, 0.35)'
    ctx.lineWidth = line * 0.55
    for (const [fx, fy] of [[0.36, 0.55], [0.62, 0.4], [0.55, 0.7]] as const) {
      const cx = w * fx
      const cy = th * fy
      ctx.beginPath()
      ctx.moveTo(cx - 1.2, cy)
      ctx.lineTo(cx - 0.9, cy - 1.3)
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cy - 1.8)
      ctx.moveTo(cx + 1.2, cy)
      ctx.lineTo(cx + 0.9, cy - 1.3)
      ctx.stroke()
    }
  }

  // Viền: cạnh giữa hai vách, cạnh mặt trên, và cả bóng ngoài.
  ctx.lineWidth = line
  ctx.strokeStyle = p['#']!
  ctx.beginPath()
  ctx.moveTo(inset, th / 2)
  ctx.lineTo(w / 2, th - inset)
  ctx.lineTo(w - inset, th / 2)
  ctx.moveTo(w / 2, th - inset)
  ctx.lineTo(w / 2, th - inset + d)
  ctx.stroke()
  poly([[w / 2, inset], [w - inset, th / 2], [w - inset, th / 2 + d], [w / 2, th - inset + d], [inset, th / 2 + d], [inset, th / 2]])
  ctx.stroke()
}

/**
 * Tô xám một đảo để báo "chưa mở khoá" mà vẫn giữ nguyên hình khối.
 *
 * Giữ nguyên ĐỘ SÁNG của từng màu gốc rồi rút hết màu, chứ không tô mọi thứ
 * bằng một mã xám duy nhất. Cách cũ tô phẳng làm vật mốc trên đảo biến mất - cái
 * cổng vòm chỉ còn là một cục xám tròn, trẻ không đoán nổi đó là cái gì.
 */
export function greyOut(sprite: Sprite): Sprite {
  const palette: Record<string, string> = {}
  for (const [key, color] of Object.entries(sprite.palette)) {
    palette[key] = desaturate(color)
  }
  return {
    ...sprite,
    palette,
    // Hình vẽ tay không tráo bảng màu được - rút màu bằng bộ lọc.
    art: sprite.art ? { ...sprite.art, filter: 'grayscale(1) brightness(1.05) contrast(0.9)' } : undefined,
  }
}

/** Đổi một màu thành sắc xám xanh cùng độ sáng. */
function desaturate(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  // Hệ số độ sáng theo cảm nhận của mắt - mắt nhạy với xanh lá hơn xanh lam
  // nhiều lần, lấy trung bình cộng thì màu vàng và màu lam ra cùng một mức xám.
  const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  const dark = [0x39, 0x42, 0x4f]
  const pale = [0xd2, 0xda, 0xe4]
  const channel = (i: number) => Math.round(dark[i]! + (pale[i]! - dark[i]!) * light)
  return (
    '#' +
    [0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')
  )
}

/** Đặt một sprite nhỏ lên giữa mặt trên của khối đảo. */
export function placeProp(
  island: Sprite,
  prop: Sprite,
  offsetY = 2,
  offsetX = 0,
  size: IsoSize = ISO_MEDIUM,
): Sprite {
  const propWidth = prop.rows[0]?.length ?? 0
  const propHeight = prop.rows.length
  const totalHeight = size.topHeight + size.depth
  const originX = Math.round((size.width - propWidth) / 2) + offsetX
  // Đặt sao cho CHÂN prop nằm ở giữa mặt trên, không phải tâm prop - nếu canh
  // theo tâm thì vật trông như đang lún xuống đất.
  const originY = Math.round(size.topHeight / 2) - propHeight + offsetY

  const rows = island.rows.map((row) => [...row])
  const palette: Record<string, string> = { ...island.palette }

  // Ký tự của prop có thể trùng ký tự của đảo nên đổi tên để không đè bảng màu.
  const remap: Record<string, string> = {}
  let next = 0
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (const [char, color] of Object.entries(prop.palette)) {
    const key = alphabet[next++] ?? char
    remap[char] = key
    palette[key] = color
  }

  prop.rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '.') return
      const targetY = originY + y
      const targetX = originX + x
      if (targetY < 0 || targetY >= totalHeight || targetX < 0 || targetX >= size.width) return
      rows[targetY]![targetX] = remap[char] ?? char
    })
  })

  return { palette, rows: rows.map((row) => row.join('')) }
}

// --- Vật thể đặt trên đảo --------------------------------------------------------

/**
 * Lâu đài trung tâm - đứng giữa mọi quần đảo.
 *
 * Đây là thứ neo mắt trẻ vào GIỮA bản đồ. Trước đây chỗ này chỉ có một hòn đá,
 * nên không có gì nói cho trẻ biết đâu là trung tâm, và mắt tự đi tìm một đầu
 * mút để bắt đầu - tức là đọc bản đồ như một con đường.
 */
export const PROP_CASTLE: Sprite = {
  palette: { '#': '#3a2a30', r: '#d9443f', w: '#f2e4c9', s: '#c9b38c', g: '#6b4a2e' },
  rows: [
    '.......##.......',
    '......#rr#......',
    '..##..#rr#..##..',
    '.#rr#.#rr#.#rr#.',
    '#rrrr#rrrr#rrrr#',
    '#wwww#wwww#wwww#',
    '#wsww#wwsw#wwsw#',
    '#wwwwwwwwwwwwww#',
    '#ww#wwwwwwww#ww#',
    '#wwwwwwwwwwwwww#',
    '#wwsww#gg#wwsww#',
    '#wwwww#gg#wwwww#',
    '#wwwww#gg#wwwww#',
    '################',
    '................',
    '................',
  ],
}
// --- Vật mốc riêng của từng vùng ------------------------------------------------
//
// Bảy vật mốc dùng chung cho cả bốn vùng là quá ít: rải ra thì vùng nào cũng
// thành đá với bụi cây, và cái tên "Thung lũng Con Số" hay "Đảo Thanh Âm" chẳng
// còn nghĩa gì. Mỗi vùng giờ có một bộ riêng, và bộ đó phải NÓI ĐÚNG TÊN VÙNG:
// nhìn hòn đất là đoán ra môn học, không cần đọc nhãn.

/** Bàn tính - Thung lũng Con Số. */
export const PROP_ABACUS: Sprite = {
  palette: { '#': '#4a3826', '-': '#8a6b45', o: '#e0483e' },
  rows: [
    '................',
    '................',
    '..############..',
    '..#..........#..',
    '..#.oo..oo.o.#..',
    '..#----------#..',
    '..#.o.oo..oo.#..',
    '..#----------#..',
    '..#.oo.o.oo..#..',
    '..#----------#..',
    '..#.o..ooo.o.#..',
    '..#..........#..',
    '..############..',
    '..##......##....',
    '................',
    '................',
  ],
}

/** Bia đá khắc số - Thung lũng Con Số. */
export const PROP_OBELISK: Sprite = {
  palette: { '#': '#3f4451', s: '#8c98ab', l: '#cdd6e4', y: '#ffd447' },
  rows: [
    '................',
    '.......##.......',
    '......#ss#......',
    '......#sl#......',
    '......#ss#......',
    '.....#ssss#.....',
    '.....#slys#.....',
    '.....#ssss#.....',
    '.....#syls#.....',
    '.....#ssss#.....',
    '.....#slss#.....',
    '....##ssss##....',
    '....#llssll#....',
    '....########....',
    '................',
    '................',
  ],
}

/** Cụm tinh thể - Thung lũng Con Số. */
export const PROP_CRYSTAL: Sprite = {
  palette: { '#': '#1f3a5c', c: '#5aa9e6', l: '#c9e9ff' },
  rows: [
    '................',
    '................',
    '................',
    '.......##.......',
    '......#cc#......',
    '..##..#cc#..##..',
    '.#cl#.#cl#.#cl#.',
    '.#cc#.#cc#.#cc#.',
    '.#cc#.#cc#.#cc#.',
    '.#cc###cc###cc#.',
    '.#cccccccccccc#.',
    '.#cllccccccllc#.',
    '.##############.',
    '................',
    '................',
    '................',
  ],
}

/** Cây thông - Rừng Ngôn Từ. */
export const PROP_PINE: Sprite = {
  palette: { '#': '#14401f', d: '#2f8f4e', D: '#48b567', t: '#5b3618', T: '#3d240f' },
  rows: [
    '................',
    '.......##.......',
    '......#dd#......',
    '.....#dDdd#.....',
    '....##dddd##....',
    '.....#dDdd#.....',
    '....#dddddd#....',
    '...##dddddd##...',
    '....#dddddd#....',
    '...#dddddddd#...',
    '..##dddddddd##..',
    '.....#tttt#.....',
    '.....#tTTt#.....',
    '....##tttt##....',
    '................',
    '................',
  ],
}

/** Nấm rừng - Rừng Ngôn Từ. */
export const PROP_MUSHROOM: Sprite = {
  palette: { '#': '#4a1d10', r: '#d9443f', w: '#fff6f2', s: '#e8d9a8', l: '#fffaf0' },
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.....######.....',
    '...##rrrrrr##...',
    '..#rrwwrrwwrr#..',
    '..#rrrrrrrrrr#..',
    '...##########...',
    '......#ss#......',
    '......#sl#......',
    '......#ss#......',
    '.....##ss##.....',
    '.....######.....',
    '................',
    '................',
  ],
}

/** Bục sách - Rừng Ngôn Từ. */
export const PROP_BOOKSTAND: Sprite = {
  palette: { '#': '#4a2d12', w: '#c9903f', l: '#f5ead2', t: '#6b4a2e' },
  rows: [
    '................',
    '................',
    '................',
    '....########....',
    '...#wwwwwwww#...',
    '...#wllllllw#...',
    '...#wlwwwwlw#...',
    '...#wllllllw#...',
    '....########....',
    '......#tt#......',
    '......#tt#......',
    '.....##tt##.....',
    '....#tttttt#....',
    '....########....',
    '................',
    '................',
  ],
}

/** Trống hội - Đảo Thanh Âm. */
export const PROP_DRUM: Sprite = {
  palette: { '#': '#4a1d10', r: '#c0452c', l: '#f0d9a8' },
  rows: [
    '................',
    '................',
    '................',
    '................',
    '....########....',
    '...#llllllll#...',
    '..#rrrrrrrrrr#..',
    '..#rllrrrrllr#..',
    '..#rrrrrrrrrr#..',
    '..#rllrrrrllr#..',
    '..#rrrrrrrrrr#..',
    '...#llllllll#...',
    '....########....',
    '....##....##....',
    '................',
    '................',
  ],
}

/** Đàn hạc - Đảo Thanh Âm. */
export const PROP_HARP: Sprite = {
  palette: { '#': '#3b2a6b', y: '#f5c43a', l: '#fff6d6' },
  rows: [
    '................',
    '.....######.....',
    '....#yyyyyy#....',
    '...#yy####yy#...',
    '...#y#....#y#...',
    '...#y#.ll.#y#...',
    '...#y#.ll.#y#...',
    '...#y#.ll.#y#...',
    '...#yy.ll.yy#...',
    '....#yy..yy#....',
    '.....######.....',
    '....##yyyy##....',
    '....########....',
    '................',
    '................',
    '................',
  ],
}

/** Cây dừa - Đảo Thanh Âm. */
export const PROP_PALM: Sprite = {
  palette: { '#': '#14401f', d: '#3fbf5e', D: '#7fd98f', t: '#8a6b45', T: '#5b3618' },
  rows: [
    '................',
    '..##..####..##..',
    '.#dd##dDDd##dd#.',
    '.#ddd#dddd#ddd#.',
    '..###..dd..###..',
    '.......#t#......',
    '.......#t#......',
    '......#tT#......',
    '......#tt#......',
    '......#tT#......',
    '.....#ttt#......',
    '.....#tTt#......',
    '....##ttt##.....',
    '....#######.....',
    '................',
    '................',
  ],
}

/** Đèn lồng - Đồi Ánh Sáng. */
export const PROP_LANTERN: Sprite = {
  palette: { '#': '#5a3a12', y: '#f5c43a', l: '#fff6d6' },
  rows: [
    '................',
    '.......##.......',
    '.......##.......',
    '.....######.....',
    '....#yyyyyy#....',
    '...#yyllllyy#...',
    '...#yyllllyy#...',
    '...#yyllllyy#...',
    '....#yyyyyy#....',
    '.....######.....',
    '......#yy#......',
    '......####......',
    '................',
    '................',
    '................',
    '................',
  ],
}

/** Miếu ánh sáng - Đồi Ánh Sáng. */
export const PROP_SHRINE: Sprite = {
  palette: { '#': '#4a2a30', r: '#d9443f', w: '#f2e4c9', y: '#ffd447' },
  rows: [
    '................',
    '.......##.......',
    '.....######.....',
    '...##rrrrrr##...',
    '..#rrrrrrrrrr#..',
    '..############..',
    '...#wwwwwwww#...',
    '...#w#wwww#w#...',
    '...#w#wyyw#w#...',
    '...#w#wyyw#w#...',
    '...#wwwwwwww#...',
    '..##wwwwwwww##..',
    '..############..',
    '................',
    '................',
    '................',
  ],
}

/** Khóm hoa - Đồi Ánh Sáng. */
export const PROP_FLOWERS: Sprite = {
  palette: { '#': '#1f6d39', p: '#e8697a', y: '#f5c43a', g: '#3fbf5e' },
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..###.###.###...',
    '..#p#.#y#.#p#...',
    '..###.###.###...',
    '...#...#...#....',
    '...g...g...g....',
    '..#gggggggg#....',
    '..##########....',
    '................',
    '................',
    '................',
  ],
}

/**
 * Ghim "con đang ở đây".
 *
 * Nhân vật đứng trên đảo là chưa đủ: nó chỉ to 16 điểm ảnh, lẫn giữa cây cối và
 * nhà cửa rải khắp vùng, và ở lớp 5 thì cả bản đồ có tới hơn trăm ô đất. Cái
 * ghim đỏ nhô hẳn lên trên mọi thứ, lại nhún nhẹ, nên mắt bắt được ngay cả khi
 * không tìm.
 */
export const PROP_PIN: Sprite = {
  palette: { '#': '#3a1010', r: '#e0483e', w: '#fff6f2' },
  // Ghim vẽ nét: giọt nước ngược, chấm trắng ở giữa.
  vector: (ctx, p) => {
    ctx.beginPath()
    ctx.moveTo(8, 12)
    ctx.bezierCurveTo(5.5, 9, 2.6, 7.4, 2.6, 5.4)
    ctx.arc(8, 5.4, 5.4, Math.PI, 0)
    ctx.bezierCurveTo(13.4, 7.4, 10.5, 9, 8, 12)
    ctx.closePath()
    ctx.fillStyle = p.r!
    ctx.fill()
    ctx.lineWidth = 0.9
    ctx.lineJoin = 'round'
    ctx.strokeStyle = p['#']!
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(8, 5.4, 2.1, 0, Math.PI * 2)
    ctx.fillStyle = p.w!
    ctx.fill()
    ctx.stroke()
  },
  rows: [
    '................',
    '................',
    '...##########...',
    '..#wwwwwwwwww#..',
    '..#wrrrrrrrrw#..',
    '..#wrrrrrrrrw#..',
    '..#wwwwwwwwww#..',
    '...#rrrrrrrr#...',
    '....#rrrrrr#....',
    '.....#rrrr#.....',
    '......#rr#......',
    '.......##.......',
    '................',
    '................',
    '................',
    '................',
  ],
}

/** Tháp đá - Thung lũng Con Số. */
export const PROP_TOWER: Sprite = {
  palette: { '#': '#4a4f63', s: '#9aa6b8', l: '#d5dcea', y: '#ffd447' },
  rows: [
    '.....####.......',
    '....#llll#......',
    '....#slls#......',
    '....#ssss#......',
    '...##ssss##.....',
    '...#llyyll#.....',
    '...#slyysl#.....',
    '...#ssssss#.....',
    '...#sl##ls#.....',
    '...#ss##ss#.....',
    '..##ssssss##....',
    '..#llssssll#....',
    '..#ssssssss#....',
    '..##########....',
    '................',
    '................',
  ],
}

/** Cây cổ thụ - Rừng Ngôn Từ. */
export const PROP_TREE: Sprite = {
  palette: { '#': '#1f6d39', d: '#2f8f4e', D: '#48b567', t: '#7a4a22', T: '#5b3618' },
  rows: [
    '.....####.......',
    '...##dddd##.....',
    '..#dDDddddd#....',
    '.#dDDdddDddd#...',
    '.#ddddddDdddd#..',
    '#dDdddddddddd#..',
    '#ddddddddDddd#..',
    '.#dddddddddd#...',
    '..#ddddDddd#....',
    '...##dddd##.....',
    '.....#tt#.......',
    '.....#tT#.......',
    '.....#tt#.......',
    '....##tT##......',
    '................',
    '................',
  ],
}

/** Tháp chuông - Đảo Thanh Âm. */
export const PROP_BELLTOWER: Sprite = {
  palette: { '#': '#3b2a6b', b: '#a78bfa', l: '#e9defd', y: '#ffd447', s: '#7c5cd6' },
  rows: [
    '......##........',
    '.....#yy#.......',
    '....##bb##......',
    '...#bbbbbb#.....',
    '..#bllllllb#....',
    '..#bl####lb#....',
    '..#bl#yy#lb#....',
    '..#bl#yy#lb#....',
    '..#bll##llb#....',
    '..#bbbbbbbb#....',
    '..#ssssssss#....',
    '.##llllllll##...',
    '.#bbbbbbbbbb#...',
    '.############...',
    '................',
    '................',
  ],
}

/** Đèn hải đăng - Đồi Ánh Sáng. */
export const PROP_LIGHTHOUSE: Sprite = {
  palette: { '#': '#1d4e6b', w: '#f4f7fb', r: '#e0483e', y: '#ffe98a', s: '#c6d2de' },
  rows: [
    '.....####.......',
    '....#yyyy#......',
    '....#yyyy#......',
    '....##ww##......',
    '....#wwww#......',
    '....#rrrr#......',
    '....#wwww#......',
    '...#wwwwww#.....',
    '...#rrrrrr#.....',
    '...#wwwwww#.....',
    '..#wwwwwwww#....',
    '..#ssssssss#....',
    '..#wwwwwwww#....',
    '..##########....',
    '................',
    '................',
  ],
}


/**
 * Cổng đá dẫn sang quần đảo lớp sau. Lòng cổng sáng khi đã mở, và bị tô xám
 * cùng cả hòn đảo khi còn khoá - nên chỉ cần một hình cho cả hai trạng thái.
 */
export const PROP_PORTAL: Sprite = {
  palette: { '#': '#2b2a4a', l: '#e2ddf4', s: '#9a94c4', k: '#6b64a0', g: '#ffe066' },
  rows: [
    '................',
    '................',
    '.....######.....',
    '....#llllll#....',
    '...#lskkkksl#...',
    '...#lk#gg#kl#...',
    '...#lk#gg#kl#...',
    '...#lk#gg#kl#...',
    '...#lk#gg#kl#...',
    '...#lk#gg#kl#...',
    '...#lk#gg#kl#...',
    '...#lkk##kkl#...',
    '...#llllllll#...',
    '...##########...',
    '................',
    '................',
  ],
}

/** Bụi cây nhỏ - vật trang trí phụ cho đảo đỡ đơn điệu. */
export const PROP_BUSH: Sprite = {
  palette: { '#': '#1f6d39', d: '#3d9e58', D: '#57bd73' },
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....####.......',
    '...##dDDd##.....',
    '..#dddDdddd#....',
    '..#dddddddd#....',
    '...##dddd##.....',
    '.....####.......',
    '................',
    '................',
  ],
}

/** Tảng đá nhỏ. */
export const PROP_STONE: Sprite = {
  palette: { '#': '#4a4f63', s: '#9aa6b8', l: '#d5dcea' },
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '......###.......',
    '....##lll##.....',
    '...#slssssl#....',
    '...#ssssssss#...',
    '...##########...',
    '................',
    '................',
  ],
}

// --- Hình vẽ tay ---------------------------------------------------------------

/*
  Gắn tên file hình vẽ tay (`public/art/prop-<tên>.webp`, cắt từ các tờ
  `props-*.png` - xem mục "Đồ trang trí" trong `docs/art/prompts.md`) vào từng
  món. Chưa có file thì món vẫn vẽ bằng điểm ảnh, nên gắn sẵn không làm vỡ gì.

  Gắn VÀO CHÍNH đối tượng sprite, cùng lẽ với nhân vật trong `creatures.ts`: khu
  vườn và bản đồ tra món bằng danh tính, và mọi chỗ đang cầm sprite của món ấy
  tự nhận hình mới mà không phải sửa gì.
*/
const PROP_ART: Array<[Sprite, string]> = [
  [PROP_CASTLE, 'castle'],
  [PROP_TOWER, 'tower'],
  [PROP_BELLTOWER, 'belltower'],
  [PROP_LIGHTHOUSE, 'lighthouse'],
  [PROP_SHRINE, 'shrine'],
  [PROP_PORTAL, 'portal'],
  [PROP_OBELISK, 'obelisk'],
  [PROP_CRYSTAL, 'crystal'],
  [PROP_TREE, 'tree'],
  [PROP_PINE, 'pine'],
  [PROP_PALM, 'palm'],
  [PROP_BUSH, 'bush'],
  [PROP_MUSHROOM, 'mushroom'],
  [PROP_FLOWERS, 'flowers'],
  [PROP_STONE, 'stone'],
  [PROP_LANTERN, 'lantern'],
  [PROP_ABACUS, 'abacus'],
  [PROP_BOOKSTAND, 'bookstand'],
  [PROP_DRUM, 'drum'],
  [PROP_HARP, 'harp'],
]
for (const [sprite, id] of PROP_ART) sprite.art = { id: `prop-${id}` }
