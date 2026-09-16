/**
 * Năm lục địa = năm lưới ký tự gõ tay. Rất dễ để sót một vùng đứt rời khỏi đất
 * liền, hoặc lỡ tay vẽ lại thành một dây đảo nối đuôi nhau. Test này bắt hết
 * trước khi trẻ mở bản đồ ra.
 */

import { describe, expect, it } from 'vitest'
import { GRADES, SUBJECTS, type Subject } from '../../content/types'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CONTINENTS,
  GRID,
  anchorCell,
  cellKind,
  cellLevel,
  cellsOfKind,
  isLand,
  projectCell,
  type CellKind,
} from './continent'

/** Bốn hướng kề cạnh trên lưới. */
const NEIGHBOURS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

/** Mọi ô đất của một lớp. */
function landCells(grade: (typeof GRADES)[number]) {
  const cells: Array<{ c: number; r: number }> = []
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) if (isLand(grade, c, r)) cells.push({ c, r })
  }
  return cells
}

/** Số mảnh đất rời nhau - lục địa liền thì phải đúng một mảnh. */
function pieces(grade: (typeof GRADES)[number]): number {
  const seen = new Set<string>()
  let count = 0

  for (const start of landCells(grade)) {
    const key = `${start.c},${start.r}`
    if (seen.has(key)) continue
    count++
    seen.add(key)

    const queue = [start]
    while (queue.length > 0) {
      const { c, r } = queue.shift()!
      for (const [dc, dr] of NEIGHBOURS) {
        const nc = c + dc
        const nr = r + dr
        const nk = `${nc},${nr}`
        if (!isLand(grade, nc, nr) || seen.has(nk)) continue
        seen.add(nk)
        queue.push({ c: nc, r: nr })
      }
    }
  }
  return count
}

/** Hai vùng có chạm cạnh nhau không. */
function touches(grade: (typeof GRADES)[number], a: CellKind, b: CellKind): boolean {
  for (const cell of cellsOfKind(grade, a)) {
    for (const [dc, dr] of NEIGHBOURS) {
      if (cellKind(grade, cell.c + dc, cell.r + dr) === b) return true
    }
  }
  return false
}

describe('lục địa của năm lớp', () => {
  it('lưới nào cũng đúng 12 dòng, mỗi dòng 12 ký tự', () => {
    for (const grade of GRADES) {
      const rows = CONTINENTS[grade].rows
      expect(rows, `lớp ${grade}`).toHaveLength(GRID)
      for (const [index, row] of rows.entries()) {
        expect(row.length, `lớp ${grade} dòng ${index}`).toBe(GRID)
      }
    }
  })

  it('chỉ dùng những ký tự có trong bảng', () => {
    for (const grade of GRADES) {
      for (const row of CONTINENTS[grade].rows) {
        for (const char of row) {
          expect('.TVDNCG-tvdncg', `lớp ${grade}: ký tự lạ '${char}'`).toContain(char)
        }
      }
    }
  })

  it('mỗi lớp có đủ bốn vùng môn học và một lâu đài', () => {
    for (const grade of GRADES) {
      for (const subject of SUBJECTS) {
        expect(cellsOfKind(grade, subject).length, `lớp ${grade}: thiếu vùng ${subject}`)
          .toBeGreaterThan(0)
      }
      expect(cellsOfKind(grade, 'castle').length, `lớp ${grade}: thiếu lâu đài`).toBeGreaterThan(0)
    }
  })

  it('đúng HAI mảnh đất: lục địa, và đảo Thanh Âm', () => {
    // Đất rời nhau thì phải có cầu để nối, mà cầu là thứ CÓ HƯỚNG - trẻ nhìn
    // hướng là tưởng phải đi lần lượt. Nên lục địa phải liền một dải.
    //
    // Đảo Thanh Âm là ngoại lệ DUY NHẤT, và là ngoại lệ có chủ đích: tên nó là
    // đảo thì nó phải là đảo. Tách rời không kéo theo thứ tự nào cả, vì chẳng có
    // đường bộ nào để mà "đi qua vùng này rồi mới tới vùng kia".
    for (const grade of GRADES) {
      expect(pieces(grade), `lớp ${grade}: đất vỡ vụn không đúng hai mảnh`).toBe(2)
    }
  })

  it('vùng Âm nhạc tách hẳn khỏi lục địa - không dính vào vùng nào', () => {
    for (const grade of GRADES) {
      for (const other of ['math', 'vietnamese', 'ethics', 'castle', 'land'] as const) {
        expect(
          touches(grade, 'music', other),
          `lớp ${grade}: đảo Thanh Âm dính vào ${other}`,
        ).toBe(false)
      }
    }
  })

  it('ba vùng trên lục địa đều chạm THẲNG vào lâu đài', () => {
    // Không vùng nào được nấp sau vùng khác: đứng ở lâu đài là bước thẳng sang
    // được, không phải đi vòng qua ai.
    for (const grade of GRADES) {
      for (const subject of ['math', 'vietnamese', 'ethics'] as const) {
        expect(
          touches(grade, subject, 'castle'),
          `lớp ${grade}: vùng ${subject} không chạm lâu đài`,
        ).toBe(true)
      }
    }
  })

  it('lục địa nào cũng có đất cao - bản đồ không phẳng lì', () => {
    for (const grade of GRADES) {
      const raised = landCells(grade).filter(({ c, r }) => cellLevel(grade, c, r) === 1)
      expect(raised.length, `lớp ${grade}: không có ô đất cao nào`).toBeGreaterThan(3)
    }
  })

  it('mỗi vùng là một mảng liền, không bị xé đôi', () => {
    for (const grade of GRADES) {
      for (const subject of SUBJECTS) {
        const cells = cellsOfKind(grade, subject)
        const seen = new Set([`${cells[0]!.c},${cells[0]!.r}`])
        const queue = [cells[0]!]
        while (queue.length > 0) {
          const { c, r } = queue.shift()!
          for (const [dc, dr] of NEIGHBOURS) {
            const nc = c + dc
            const nr = r + dr
            const nk = `${nc},${nr}`
            if (cellKind(grade, nc, nr) !== subject || seen.has(nk)) continue
            seen.add(nk)
            queue.push({ c: nc, r: nr })
          }
        }
        expect(seen.size, `lớp ${grade}: vùng ${subject} bị xé rời`).toBe(cells.length)
      }
    }
  })

  it('lớp 1 đến lớp 4 có cổng sang lớp sau, lớp 5 thì hết đường', () => {
    for (const grade of GRADES) {
      const gates = cellsOfKind(grade, 'gate').length
      if (grade === 5) expect(gates, 'lớp 5 không được có cổng').toBe(0)
      else expect(gates, `lớp ${grade}: thiếu cổng`).toBeGreaterThan(0)
    }
  })

  it('lục địa to dần theo lớp', () => {
    const area = (grade: (typeof GRADES)[number]) => landCells(grade).length
    expect(area(1)).toBeLessThan(area(2))
    expect(area(3)).toBeLessThan(area(5))
    expect(area(4)).toBeLessThan(area(5))
  })

  it('năm lục địa năm hình khác nhau, không phải một khuôn đổi màu', () => {
    const shapes = GRADES.map((grade) => CONTINENTS[grade].rows.join('|'))
    expect(new Set(shapes).size).toBe(GRADES.length)
  })

  it('năm lớp là năm BỐ CỤC khác nhau, không phải một bản đồ phóng to dần', () => {
    // Một bản nháp đã mắc đúng cái bẫy này: bốn trên năm lớp đặt Toán ở Bắc,
    // Tiếng Việt ở Đông, Đạo đức ở Tây, Âm nhạc ở Nam - chỉ khác kích cỡ. So
    // chuỗi ký tự thì vẫn "khác nhau", nhưng chơi rồi mới thấy vẫn một nơi.
    //
    // Nên test này so HƯỚNG của từng vùng trên màn hình. Lưới xoay 45 độ, nên
    // hướng phải tính từ (c - r) cho trục đông-tây và (c + r) cho trục bắc-nam.
    const compass = (grade: (typeof GRADES)[number], subject: Subject) => {
      const cells = cellsOfKind(grade, subject)
      const east = cells.reduce((a, { c, r }) => a + (c - r), 0) / cells.length
      const south = cells.reduce((a, { c, r }) => a + (c + r), 0) / cells.length - (GRID - 1)
      return `${south < -2 ? 'B' : south > 2 ? 'N' : ''}${east < -2 ? 'T' : east > 2 ? 'Đ' : ''}`
    }

    const arrangements = GRADES.map((grade) =>
      SUBJECTS.map((subject) => compass(grade, subject)).join('|'),
    )
    expect(new Set(arrangements).size, `bố cục trùng nhau: ${arrangements.join(' / ')}`)
      .toBe(GRADES.length)

    // Và không môn nào bị đóng đinh vào một hướng suốt cả năm lớp.
    for (const subject of SUBJECTS) {
      const dirs = GRADES.map((grade) => compass(grade, subject))
      expect(new Set(dirs).size, `${subject} nằm cùng một hướng ở ${6 - new Set(dirs).size} lớp`)
        .toBeGreaterThanOrEqual(3)
    }
  })

  it('mỗi lục địa một màu biển riêng', () => {
    const seas = GRADES.map((grade) => CONTINENTS[grade].sea.light)
    expect(new Set(seas).size).toBe(GRADES.length)
  })

  it('mọi ô đất vẽ lọt trong khung canvas', () => {
    for (const grade of GRADES) {
      for (const { c, r } of landCells(grade)) {
        const { x, y } = projectCell(c, r)
        const where = `lớp ${grade} ô (${c},${r})`
        expect(x, `${where} tràn ra trái`).toBeGreaterThanOrEqual(0)
        expect(y, `${where} tràn lên trên`).toBeGreaterThanOrEqual(0)
        expect(x, `${where} tràn ra phải`).toBeLessThanOrEqual(CANVAS_WIDTH)
        expect(y, `${where} tràn xuống dưới`).toBeLessThanOrEqual(CANVAS_HEIGHT)
      }
    }
  })

  it('ô đại diện của mỗi vùng nằm ĐÚNG TRONG vùng đó', () => {
    // Lấy tâm hình học thì vùng hình lưỡi liềm sẽ có tâm rơi xuống biển, và vật
    // mốc cắm xuống nước.
    for (const grade of GRADES) {
      for (const kind of [...SUBJECTS, 'castle'] as Array<Subject | 'castle'>) {
        const anchor = anchorCell(grade, kind)
        expect(anchor, `lớp ${grade}: ${kind} không có ô đại diện`).not.toBeNull()
        expect(cellKind(grade, anchor!.c, anchor!.r), `lớp ${grade}: ô đại diện của ${kind} sai`)
          .toBe(kind)
      }
    }
  })
})
