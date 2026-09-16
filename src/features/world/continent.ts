/**
 * LỤC ĐỊA của từng lớp - một khối đất liền, không phải mấy hòn đảo rời.
 *
 * Trước đây mỗi môn là một hòn đảo riêng nổi giữa biển, nối nhau bằng cầu. Cầu
 * là thứ có HƯỚNG: đi từ đảo này sang đảo kia. Dù bốn môn mở hết ngay từ đầu,
 * hình vẽ vẫn kể chuyện "đi lần lượt", và trẻ đọc hình chứ không đọc luật.
 *
 * Giờ bốn môn là bốn VÙNG ĐẤT của cùng một lục địa, chạm cạnh nhau, quây quanh
 * lâu đài ở giữa. Không có cầu thì không có thứ tự. Muốn sang vùng nào thì bước
 * thẳng sang, y như đi trong sân nhà mình.
 *
 * CÁCH VẼ: lục địa là một lưới ô 12×12 viết bằng ký tự, mỗi ô là một khối đất
 * hình thoi kiểu đẳng cự (isometric). Ô cạnh nhau ghép khít thành mặt đất liền;
 * tường bên chỉ lộ ra ở mép giáp biển, nhờ thứ tự vẽ từ sau ra trước.
 *
 *   .  biển          C  lâu đài trung tâm
 *   T  Toán          G  cổng sang lớp sau
 *   V  Tiếng Việt    -  đất trống (eo đất nối hai vùng)
 *   D  Đạo đức
 *   N  Âm nhạc
 *
 * CHỮ THƯỜNG LÀ ĐẤT CAO. `t` vẫn là vùng Toán, chỉ là ở trên một bậc. Mặt đất
 * phẳng lì từ mép này sang mép kia thì bản đồ trông như tấm giấy dán; nhấc vài
 * mảng lên một bậc là có cao nguyên, có vách, có bóng.
 *
 * ĐẢO THANH ÂM ĐÚNG NGHĨA LÀ ĐẢO: vùng Âm nhạc tách hẳn khỏi lục địa, có hào
 * nước bao quanh. Tên nó là đảo thì nó phải là đảo. Tách rời KHÔNG kéo theo thứ
 * tự nào - trẻ vẫn chạm thẳng vào nó, không phải đi qua vùng nào trước.
 *
 * NĂM LỚP LÀ NĂM BỐ CỤC KHÁC NHAU, không phải một bản đồ phóng to dần.
 *
 * Có một bản nháp đã mắc đúng cái bẫy đó: bốn trên năm lớp đặt Toán ở Bắc, Tiếng
 * Việt ở Đông, Đạo đức ở Tây, Âm nhạc ở Nam - chỉ khác kích cỡ. Nhìn qua thì
 * tưởng năm nơi, chơi rồi mới thấy vẫn một nơi. Giờ mỗi lớp đổi cả HƯỚNG của
 * từng vùng lẫn hình khối chung:
 *
 *   lớp 1  cỏ ba lá nhỏ   Toán Bắc      · Việt Nam-Đông · Đức Nam-Tây  · đảo Bắc-Đông
 *   lớp 2  khối tròn      Toán Bắc-Tây  · Việt Bắc-Đông · Đức Nam      · đảo Tây
 *   lớp 3  chong chóng    Toán Bắc-Đông · Việt Nam-Đông · Đức Bắc-Tây  · đảo Nam
 *   lớp 4  ba bán đảo     Toán Tây      · Việt Đông     · Đức Nam      · đảo Bắc
 *   lớp 5  răng cưa lớn   Toán Bắc-Tây  · Việt Đông     · Đức Nam-Tây  · đảo Nam-Đông
 *
 * Không hướng nào lặp lại giữa hai lớp cho cùng một môn quá một lần, và diện tích
 * tăng dần: 60 → 77 → 90 → 98 → 106 ô.
 *
 * NĂM LỚP LÀ NĂM BỐ CỤC KHÁC NHAU, không phải một bản đồ phóng to dần.
 *
 * Có một bản nháp đã mắc đúng cái bẫy đó: bốn trên năm lớp đặt Toán ở Bắc, Tiếng
 * Việt ở Đông, Đạo đức ở Tây, Âm nhạc ở Nam - chỉ khác kích cỡ. Nhìn qua thì
 * tưởng năm nơi, chơi rồi mới thấy vẫn một nơi. Giờ mỗi lớp đổi cả HƯỚNG của
 * từng vùng lẫn hình khối chung:
 *
 *   lớp 1  cỏ ba lá nhỏ   Toán Bắc      · Việt Nam-Đông · Đức Nam-Tây  · đảo Bắc-Đông
 *   lớp 2  khối tròn      Toán Bắc-Tây  · Việt Bắc-Đông · Đức Nam      · đảo Tây
 *   lớp 3  chong chóng    Toán Bắc-Đông · Việt Nam-Đông · Đức Bắc-Tây  · đảo Nam
 *   lớp 4  ba bán đảo     Toán Tây      · Việt Đông     · Đức Nam      · đảo Bắc
 *   lớp 5  răng cưa lớn   Toán Bắc-Tây  · Việt Đông     · Đức Nam-Tây  · đảo Nam-Đông
 *
 * Không hướng nào lặp lại giữa hai lớp cho cùng một môn quá một lần, và diện tích
 * tăng dần: 60 → 77 → 90 → 98 → 99 ô.
 *
 * LƯỚI XOAY 45 ĐỘ KHI LÊN MÀN HÌNH. Ô (c, r) rơi vào `x = (c - r)`, `y = (c + r)`
 * nên đọc lưới thô mà đoán hình lục địa là đoán sai: góc trên bên trái của lưới
 * ra ĐỈNH màn hình, góc trên bên phải ra CẠNH PHẢI. Sửa hình thì sửa xong phải
 * xem lại bằng mắt, đừng tin trí tưởng tượng.
 */

import type { Grade, Subject } from '../../content/types'

/** Một ô đất hình thoi: rộng gấp đôi cao - tỉ lệ đẳng cự kinh điển. */
export const TILE_W = 28
export const TILE_H = 14
/** Độ dày của khối đất, phần tường lộ ra ở mép giáp biển. */
export const TILE_DEPTH = 7
/** Chiều cao một bậc đất. Ô viết chữ THƯỜNG được nhấc lên đúng một bậc. */
export const LEVEL_H = 7
/** Lưới vuông 12×12 ô. */
export const GRID = 12

/** Gốc toạ độ ngang: ô xa nhất bên trái là (0, GRID-1). */
const ORIGIN_X = (GRID - 1) * (TILE_W / 2)
/** Chừa dải nước phía trên, đủ chỗ cho cả những ô đất cao nhất. */
const ORIGIN_Y = LEVEL_H + 6

export const CANVAS_WIDTH = (GRID - 1) * TILE_W + TILE_W
export const CANVAS_HEIGHT = (GRID - 1) * TILE_H + TILE_H + TILE_DEPTH + ORIGIN_Y + 6

export type CellKind = Subject | 'castle' | 'gate' | 'land' | 'sea'

const CHAR_TO_KIND: Record<string, CellKind> = {
  '.': 'sea',
  T: 'math',
  V: 'vietnamese',
  D: 'ethics',
  N: 'music',
  C: 'castle',
  G: 'gate',
  '-': 'land',
}

export interface Continent {
  /** Tên vùng đất, hiện ở đầu bản đồ. */
  title: string
  /** Màu biển. Mỗi lục địa một vùng biển riêng. */
  sea: { light: string; dark: string }
  /** 12 dòng, mỗi dòng 12 ký tự. Xem bảng ký tự ở đầu file. */
  rows: string[]
}

export const CONTINENTS: Record<Grade, Continent> = {
  // Lớp 1: chữ thập - bốn vùng nhỏ toả bốn phía, eo đất ngắn và rõ. Lục địa đầu
  // đời nên đọc được trong một cái liếc mắt.
  1: {
    title: 'VỊNH KHỞI ĐẦU',
    sea: { light: '#4fa8d8', dark: '#3f94c4' },
    rows: [
      '..G..NN.....',
      '..T.NNNN....',
      '.Tt..NN.....',
      '.Ttt........',
      '.TTtTCC.VVV.',
      '..TTCCCCVVVV',
      '....CCCCVVVV',
      '.....CC.VVV.',
      '....DDDD....',
      '....DDDD....',
      '....DDDD....',
      '.....DD.....',
    ],
  },

  // Lớp 2: lục địa tròn - bốn vùng là bốn phần tư của cùng một khối đất, không
  // còn eo nào cả. Đây là hình "liền" nhất trong năm lớp.
  2: {
    title: 'ĐẠI DƯƠNG XANH',
    sea: { light: '#2f6fa8', dark: '#2a6699' },
    rows: [
      '.....VV.....',
      '....VvvV....',
      '...VvvvvV...',
      '..TVvvvvV...',
      '.TTTVCCV....',
      'TTTTCCCC....',
      'TTTTCCCCDD..',
      '.TTTTCCDDDD.',
      '......DDddDG',
      'NNN...DDddd.',
      'NNN....DDdD.',
      'NNN.........',
    ],
  },

  // Lớp 3: chong chóng - bốn cánh xoắn quanh lâu đài, không cánh nào thẳng hàng
  // với cánh nào.
  3: {
    title: 'XỨ SƯƠNG MÙ',
    sea: { light: '#2e8f96', dark: '#277b81' },
    rows: [
      '.G.TTT......',
      '.TTtttTT....',
      '.TTtttTT.VV.',
      '..TTTTT.VVVV',
      '.DDDCCCCVVVV',
      'DDDDCCCCVVVV',
      'DDDDCCCCVVVV',
      'DDDDCCCCV...',
      'DDDD......N.',
      '.DDD.....nnN',
      '........Nnnn',
      '.........NnN',
    ],
  },

  // Lớp 4: ngã tư - lục địa chữ thập dày, bốn nhánh rộng bằng nhau.
  4: {
    title: 'NGÃ TƯ GIÓ',
    sea: { light: '#2a5b96', dark: '#24508a' },
    rows: [
      'NNN....GVVVV',
      'NNN...VVVvvV',
      'NNN...VVVvvV',
      '.....CCVVVVV',
      '....CCCC....',
      '...CCCCCC...',
      '...CCCCCCDD.',
      '....CCCCDDD.',
      'TTTTTCCDDdDD',
      'TttTTT.DdddD',
      'TttTTT.DDddD',
      'TTTT....DDD.',
    ],
  },

  // Lớp 5: vòng lớn - lục địa rộng nhất, bốn vùng vây kín lâu đài. Hết đường,
  // không còn cổng sang đâu nữa.
  5: {
    title: 'ĐẠI LỤC CUỐI',
    sea: { light: '#3b4a86', dark: '#334078' },
    rows: [
      '......VVVvVV',
      '......VVvvvV',
      '.TTT..VVvvvV',
      'TTTTTCCV....',
      'TTTTCCCC.nNN',
      'TttcCCCC.NNN',
      'TttcCCCC.NNN',
      'TTTDCCCC.NNN',
      'TTDDDccD....',
      '.TDDddddDD..',
      '..DDDddDDD..',
      '..DDDDDDDD..',
    ],
  },
}

/** Loại ô trong một lưới bất kỳ. Ngoài lưới thì tính là biển. */
export function kindAt(rows: string[], c: number, r: number): CellKind {
  if (c < 0 || r < 0 || c >= GRID || r >= GRID) return 'sea'
  const char = rows[r]?.[c] ?? '.'
  // Chữ thường chỉ là cùng vùng đó ở TRÊN CAO, không phải một loại đất khác.
  return CHAR_TO_KIND[char.toUpperCase()] ?? 'sea'
}

/** Bậc đất của ô trong một lưới bất kỳ: 0 là mặt bằng, 1 là cao nguyên. */
export function levelAt(rows: string[], c: number, r: number): number {
  if (c < 0 || r < 0 || c >= GRID || r >= GRID) return 0
  const char = rows[r]?.[c] ?? '.'
  return char >= 'a' && char <= 'z' ? 1 : 0
}

/** Loại ô ở toạ độ lưới của một lớp. */
export function cellKind(grade: Grade, c: number, r: number): CellKind {
  return kindAt(CONTINENTS[grade].rows, c, r)
}

/** Bậc đất của ô ở một lớp. */
export function cellLevel(grade: Grade, c: number, r: number): number {
  return levelAt(CONTINENTS[grade].rows, c, r)
}

/**
 * Soi một lưới xem có dựng thành lục địa hợp lệ không.
 *
 * Trình vẽ bản đồ trong trang quản trị gọi hàm này sau mỗi nét vẽ. Trả về danh
 * sách lỗi bằng tiếng người - rỗng nghĩa là dùng được.
 *
 * Cùng bộ quy tắc mà `continent.test.ts` kiểm, nhưng test vẫn tự cài lại phép
 * kiểm của nó: một bài test gọi chính thứ nó đang canh thì canh cái gì nữa.
 */
export function validateContinent(rows: string[]): string[] {
  const errors: string[] = []
  const land: Array<{ c: number; r: number }> = []
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) if (kindAt(rows, c, r) !== 'sea') land.push({ c, r })
  }

  const step = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const

  // Đếm số mảnh đất rời nhau.
  const seen = new Set<string>()
  let pieces = 0
  for (const start of land) {
    if (seen.has(`${start.c},${start.r}`)) continue
    pieces++
    const queue = [start]
    seen.add(`${start.c},${start.r}`)
    while (queue.length > 0) {
      const cell = queue.shift()!
      for (const [dc, dr] of step) {
        const next = { c: cell.c + dc, r: cell.r + dr }
        const key = `${next.c},${next.r}`
        if (kindAt(rows, next.c, next.r) === 'sea' || seen.has(key)) continue
        seen.add(key)
        queue.push(next)
      }
    }
  }
  if (pieces !== 2) {
    errors.push(`Phải có đúng 2 mảnh đất (lục địa + đảo Thanh Âm), đang có ${pieces}.`)
  }

  const touches = (a: CellKind, b: CellKind) =>
    land.some(
      ({ c, r }) =>
        kindAt(rows, c, r) === a && step.some(([dc, dr]) => kindAt(rows, c + dc, r + dr) === b),
    )

  const LABEL: Record<string, string> = {
    math: 'Toán',
    vietnamese: 'Tiếng Việt',
    ethics: 'Đạo đức',
    music: 'Âm nhạc',
  }

  for (const subject of ['math', 'vietnamese', 'ethics'] as const) {
    if (!land.some(({ c, r }) => kindAt(rows, c, r) === subject)) {
      errors.push(`Thiếu hẳn vùng ${LABEL[subject]}.`)
    } else if (!touches(subject, 'castle')) {
      errors.push(`Vùng ${LABEL[subject]} chưa chạm lâu đài.`)
    }
  }

  if (!land.some(({ c, r }) => kindAt(rows, c, r) === 'music')) {
    errors.push('Thiếu hẳn đảo Thanh Âm.')
  } else {
    for (const other of ['math', 'vietnamese', 'ethics', 'castle', 'land'] as const) {
      if (touches('music', other)) {
        errors.push(`Đảo Thanh Âm đang dính vào ${LABEL[other] ?? 'đất liền'} - phải tách hẳn ra biển.`)
        break
      }
    }
  }

  if (!land.some(({ c, r }) => kindAt(rows, c, r) === 'castle')) errors.push('Thiếu lâu đài.')

  return errors
}

export function isLand(grade: Grade, c: number, r: number): boolean {
  return cellKind(grade, c, r) !== 'sea'
}

/** Góc trên bên trái của khung bao ô (c, r) trên màn hình. */
export function projectCell(c: number, r: number, level = 0): { x: number; y: number } {
  return {
    x: (c - r) * (TILE_W / 2) + ORIGIN_X,
    y: (c + r) * (TILE_H / 2) + ORIGIN_Y - level * LEVEL_H,
  }
}

/** Tâm mặt trên của ô - chỗ đặt vật mốc và huy hiệu. Tính cả bậc đất. */
export function cellCentre(grade: Grade, c: number, r: number): { x: number; y: number } {
  const { x, y } = projectCell(c, r, cellLevel(grade, c, r))
  return { x: x + TILE_W / 2, y: y + TILE_H / 2 }
}

export function cellsOfKind(grade: Grade, kind: CellKind): Array<{ c: number; r: number }> {
  const cells: Array<{ c: number; r: number }> = []
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (cellKind(grade, c, r) === kind) cells.push({ c, r })
    }
  }
  return cells
}

/**
 * Ô đại diện của một vùng - chỗ cắm vật mốc và treo huy hiệu tiến độ.
 *
 * Lấy ô GẦN TÂM VÙNG NHẤT chứ không lấy tâm hình học: tâm hình học của một vùng
 * hình lưỡi liềm có thể rơi ra ngoài vùng, và vật mốc sẽ cắm xuống biển.
 */
export function anchorCell(grade: Grade, kind: CellKind): { c: number; r: number } | null {
  const cells = cellsOfKind(grade, kind)
  if (cells.length === 0) return null

  const mid = cells.reduce(
    (acc, cell) => ({ c: acc.c + cell.c / cells.length, r: acc.r + cell.r / cells.length }),
    { c: 0, r: 0 },
  )
  return cells.reduce((best, cell) =>
    Math.hypot(cell.c - mid.c, cell.r - mid.r) < Math.hypot(best.c - mid.c, best.r - mid.r)
      ? cell
      : best,
  )
}

/**
 * Các nhịp ngang của mặt trên hình thoi, tính sẵn một lần.
 *
 * Tô hình thoi bằng từng NHỊP NGANG chứ không kẻ đường chéo: kẻ đường thì trình
 * duyệt làm mượt cạnh, mà phóng to lên 3-4 lần là thấy ngay vệt xám nhoè - hỏng
 * hết chất pixel của cả game.
 */
export const DIAMOND_SPANS: Array<{ x0: number; x1: number }> = Array.from(
  { length: TILE_H },
  (_, i) => {
    const step = Math.min(i, TILE_H - 1 - i)
    const width = 4 * step + 4
    const x0 = (TILE_W - width) / 2
    return { x0, x1: x0 + width - 1 }
  },
)
