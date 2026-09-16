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

  return { palette, rows: outlined.map((row) => row.join('')) }
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
  return { palette, rows: sprite.rows }
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
