/**
 * Vẽ cả lục địa vào MỘT canvas duy nhất.
 *
 * Một canvas chứ không phải mỗi ô một phần tử: lục địa có tới bảy tám chục ô, và
 * bài học ở màn đi cảnh vẫn còn nguyên giá trị ở đây - vẽ mỗi ô một phần tử là
 * bản đồ giật ngay trên máy tính bảng cũ.
 *
 * Canvas vẽ ở KHỔ GỐC rồi phóng to bằng CSS với `image-rendering: pixelated`,
 * nên điểm ảnh to, vuông, sắc cạnh. Mọi thứ tô bằng `fillRect` theo từng nhịp
 * ngang - không kẻ đường chéo, vì trình duyệt sẽ làm mượt cạnh và phóng lên 3
 * lần là thấy vệt xám nhoè.
 */

import { useEffect, useRef } from 'react'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DIAMOND_SPANS,
  GRID,
  LEVEL_H,
  TILE_DEPTH,
  TILE_H,
  TILE_W,
  kindAt,
  levelAt,
  projectCell,
  type CellKind,
} from './continent'

export interface LandColors {
  top: string
  topEdge: string
  leftWall: string
  rightWall: string
  outline: string
}

export type LandPalette = Record<Exclude<CellKind, 'sea'>, LandColors>

/**
 * Hàng thấp nhất của mặt hình thoi tại mỗi cột - biết chân mặt đất ở đâu thì mới
 * biết dựng tường từ chỗ nào. Tính một lần cho cả đời chương trình.
 */
const BOTTOM_ROW: number[] = (() => {
  const bottom = new Array<number>(TILE_W).fill(-1)
  DIAMOND_SPANS.forEach((span, row) => {
    for (let x = span.x0; x <= span.x1; x++) bottom[x] = row
  })
  return bottom
})()

export function ContinentCanvas({
  rows,
  palette,
  scale,
}: {
  /** 12 dòng ký tự. Xem bảng ký tự trong `continent.ts`. */
  rows: string[]
  palette: LandPalette
  scale: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Vẽ từ SAU RA TRƯỚC. Ô phía trước đè lên tường của ô phía sau, nên tường chỉ
    // còn lộ ra ở mép giáp biển - đó là thứ biến một rổ khối rời thành một khối
    // đất liền có bờ.
    const cells: Array<{ c: number; r: number }> = []
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) if (kindAt(rows, c, r) !== 'sea') cells.push({ c, r })
    }
    cells.sort((a, b) => a.c + a.r - (b.c + b.r))

    for (const { c, r } of cells) {
      const kind = kindAt(rows, c, r)
      if (kind === 'sea') continue
      const colors = palette[kind]
      const level = levelAt(rows, c, r)
      const { x, y } = projectCell(c, r, level)

      // Tường bên: từ chân mặt đất xuống hết độ dày, cộng thêm chiều cao của bậc.
      // Ô đất cao có vách cao hơn - đó chính là cái vách đá nhìn ra được.
      const wall = TILE_DEPTH + level * LEVEL_H
      for (let px = 0; px < TILE_W; px++) {
        const bottom = BOTTOM_ROW[px]!
        if (bottom < 0) continue
        ctx.fillStyle = px < TILE_W / 2 ? colors.leftWall : colors.rightWall
        ctx.fillRect(x + px, y + bottom + 1, 1, wall)
      }

      // Mặt trên.
      ctx.fillStyle = colors.top
      DIAMOND_SPANS.forEach((span, row) => {
        ctx.fillRect(x + span.x0, y + row, span.x1 - span.x0 + 1, 1)
      })
    }

    // Bờ biển và ranh giới vùng, vẽ sau cùng để không bị ô nào đè lên.
    for (const { c, r } of cells) {
      const kind = kindAt(rows, c, r)
      if (kind === 'sea') continue
      const colors = palette[kind]
      const { x, y } = projectCell(c, r, levelAt(rows, c, r))
      const half = TILE_H / 2

      // Bốn cạnh của hình thoi ứng với bốn ô hàng xóm trên lưới. Lưới xoay 45 độ
      // nên c-1 ra cạnh trên-trái chứ không phải cạnh trái.
      const edges: Array<{ dc: number; dr: number; from: number; to: number; side: 'x0' | 'x1' }> = [
        { dc: -1, dr: 0, from: 0, to: half - 1, side: 'x0' },
        { dc: 0, dr: -1, from: 0, to: half - 1, side: 'x1' },
        { dc: 0, dr: 1, from: half, to: TILE_H - 1, side: 'x0' },
        { dc: 1, dr: 0, from: half, to: TILE_H - 1, side: 'x1' },
      ]

      for (const edge of edges) {
        const neighbour = kindAt(rows, c + edge.dc, r + edge.dr)
        const sameLevel = levelAt(rows, c + edge.dc, r + edge.dr) === levelAt(rows, c, r)
        // Cùng vùng VÀ cùng bậc thì hai ô là một mặt đất phẳng, không kẻ gì cả.
        // Khác bậc thì phải kẻ, nếu không cái vách đá mất viền và trông như dán.
        if (neighbour === kind && sameLevel) continue

        // Giáp biển thì kẻ viền đậm - đó là đường bờ. Giáp một vùng khác thì kẻ
        // vệt sáng, đủ để trẻ thấy hai vùng là hai nơi mà vẫn liền một dải đất.
        ctx.fillStyle = neighbour === 'sea' ? colors.outline : colors.topEdge
        for (let row = edge.from; row <= edge.to; row++) {
          const span = DIAMOND_SPANS[row]!
          ctx.fillRect(x + (edge.side === 'x0' ? span.x0 : span.x1), y + row, 1, 1)
        }
      }
    }
  }, [rows, palette])

  return (
    <canvas
      ref={ref}
      style={{
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        imageRendering: 'pixelated',
        display: 'block',
      }}
      aria-hidden="true"
    />
  )
}
