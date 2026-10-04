/**
 * Vẽ cả lục địa vào MỘT canvas duy nhất.
 *
 * Một canvas chứ không phải mỗi ô một phần tử: lục địa có tới bảy tám chục ô, và
 * bài học ở màn đi cảnh vẫn còn nguyên giá trị ở đây - vẽ mỗi ô một phần tử là
 * bản đồ giật ngay trên máy tính bảng cũ.
 *
 * VẼ BẰNG NÉT, cùng kiểu với nhân vật và bản đồ đi cảnh: mặt đất tô mảng phẳng,
 * vách đất hai tông, viền nâu đậm chỉ ở chỗ đáng có viền - bờ biển, ranh giới hai
 * vùng, mép bậc đất cao. Giữa hai ô cùng một vùng thì KHÔNG kẻ gì, nên một vùng
 * đọc ra là một khối đất liền chứ không phải một bàn cờ hình thoi.
 *
 * Toạ độ vẫn là toạ độ khổ gốc (\`CANVAS_WIDTH\` × \`CANVAS_HEIGHT\`), chỉ có nét
 * được tô ở độ phân giải cao hơn - mọi dấu mốc đặt đè lên bản đồ không phải đổi gì.
 */

import { useEffect, useRef } from 'react'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
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

/** Số giả ngẫu nhiên cố định theo ô: cùng lục địa thì cùng túm cỏ. */
function rand(c: number, r: number, salt: number): number {
  let h = (c * 374761393 + r * 668265263 + salt * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Độ phân giải: đủ mịn cho cỡ hiện ra và màn hình mật độ cao, có trần. */
function resolution(scale: number): number {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.min(8, Math.max(2, Math.ceil(scale * dpr * 1.5)))
}

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
    const res = resolution(scale)
    canvas.width = CANVAS_WIDTH * res
    canvas.height = CANVAS_HEIGHT * res

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(res, 0, 0, res, 0, 0)
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const cells: Array<{ c: number; r: number }> = []
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) if (kindAt(rows, c, r) !== 'sea') cells.push({ c, r })
    }
    // Từ sau ra trước: ô gần mắt vẽ sau, đè lên vách của ô phía sau nó.
    cells.sort((a, b) => a.c + a.r - (b.c + b.r))

    const half = TILE_H / 2
    const poly = (points: Array<[number, number]>) => {
      ctx.beginPath()
      points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)))
      ctx.closePath()
    }

    for (const { c, r } of cells) {
      const kind = kindAt(rows, c, r)
      if (kind === 'sea') continue
      const colors = palette[kind]
      const level = levelAt(rows, c, r)
      const { x, y } = projectCell(c, r, level)
      const wall = TILE_DEPTH + level * LEVEL_H
      const left: [number, number] = [x, y + half]
      const bottom: [number, number] = [x + TILE_W / 2, y + TILE_H]
      const right: [number, number] = [x + TILE_W, y + half]

      // Hai vách. Viền ngoài của vách vẽ luôn ở đây: ô phía trước vẽ sau sẽ che
      // phần nào bị khuất, nên chỉ còn lại đúng đường viền nhìn thấy được.
      poly([left, bottom, [bottom[0], bottom[1] + wall], [left[0], left[1] + wall]])
      ctx.fillStyle = colors.leftWall
      ctx.fill()
      poly([right, bottom, [bottom[0], bottom[1] + wall], [right[0], right[1] + wall]])
      ctx.fillStyle = colors.rightWall
      ctx.fill()
      // Đường dọc ở góc trái / phải chỉ kẻ khi góc ấy lộ ra biển (hay bậc đất
      // thấp hơn). Ô bên cạnh mà là đất thì góc ấy là chỗ hai vách nối liền, kẻ
      // vào là chia một bờ đất thẳng thành từng khúc.
      const open = (dc: number, dr: number) =>
        kindAt(rows, c + dc, r + dr) === 'sea' || levelAt(rows, c + dc, r + dr) < level
      ctx.beginPath()
      ctx.moveTo(left[0], left[1] + wall)
      ctx.lineTo(bottom[0], bottom[1] + wall)
      ctx.lineTo(right[0], right[1] + wall)
      if (open(-1, 0)) {
        ctx.moveTo(left[0], left[1])
        ctx.lineTo(left[0], left[1] + wall)
      }
      if (open(0, -1)) {
        ctx.moveTo(right[0], right[1])
        ctx.lineTo(right[0], right[1] + wall)
      }
      ctx.moveTo(bottom[0], bottom[1])
      ctx.lineTo(bottom[0], bottom[1] + wall)
      ctx.lineWidth = 0.8
      ctx.strokeStyle = colors.outline
      ctx.stroke()

      // Mặt trên. Nới ra một chút để hai ô cùng vùng liền nhau không hở khe.
      poly([[x + TILE_W / 2, y - 0.25], [x + TILE_W + 0.4, y + half], [x + TILE_W / 2, y + TILE_H + 0.25], [x - 0.4, y + half]])
      ctx.fillStyle = colors.top
      ctx.fill()

      // Túm cỏ, thưa thôi - đủ cho mặt đất có chất, không thành hoa văn.
      if (rand(c, r, 1) < 0.6) {
        const cx = x + TILE_W * (0.35 + rand(c, r, 2) * 0.3)
        const cy = y + TILE_H * (0.4 + rand(c, r, 3) * 0.3)
        ctx.beginPath()
        ctx.moveTo(cx - 1.4, cy)
        ctx.lineTo(cx - 1, cy - 1.4)
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx, cy - 2)
        ctx.moveTo(cx + 1.4, cy)
        ctx.lineTo(cx + 1, cy - 1.4)
        ctx.lineWidth = 0.55
        ctx.strokeStyle = colors.leftWall
        ctx.globalAlpha = 0.45
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    // Viền mặt trên: bờ biển đậm, ranh giới hai vùng hay hai bậc đất mảnh hơn.
    // Vẽ sau cùng để không ô nào đè mất.
    for (const { c, r } of cells) {
      const kind = kindAt(rows, c, r)
      if (kind === 'sea') continue
      const colors = palette[kind]
      const level = levelAt(rows, c, r)
      const { x, y } = projectCell(c, r, level)
      const top: [number, number] = [x + TILE_W / 2, y]
      const left: [number, number] = [x, y + half]
      const bottom: [number, number] = [x + TILE_W / 2, y + TILE_H]
      const right: [number, number] = [x + TILE_W, y + half]

      const edges: Array<{ dc: number; dr: number; from: [number, number]; to: [number, number] }> = [
        { dc: -1, dr: 0, from: top, to: left },
        { dc: 0, dr: -1, from: top, to: right },
        { dc: 0, dr: 1, from: left, to: bottom },
        { dc: 1, dr: 0, from: right, to: bottom },
      ]
      for (const edge of edges) {
        const neighbour = kindAt(rows, c + edge.dc, r + edge.dr)
        const neighbourLevel = levelAt(rows, c + edge.dc, r + edge.dr)
        if (neighbour === kind && neighbourLevel === level) continue
        // Ô bên cạnh CAO hơn thì chính nó vẽ viền của nó rồi - vẽ thêm ở đây là
        // một đường kẻ thừa nằm dưới chân vách của ô kia.
        if (neighbour !== 'sea' && neighbourLevel > level) continue
        ctx.beginPath()
        ctx.moveTo(edge.from[0], edge.from[1])
        ctx.lineTo(edge.to[0], edge.to[1])
        const coast = neighbour === 'sea' || neighbourLevel < level
        ctx.lineWidth = coast ? 0.9 : 0.6
        ctx.strokeStyle = coast ? colors.outline : colors.leftWall
        ctx.stroke()
      }
    }
  }, [rows, palette, scale])

  return (
    <canvas
      ref={ref}
      style={{
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        // Khung ngoài đặt `pixelated` cho sprite điểm ảnh - nét vẽ thì phải mịn.
        imageRendering: 'auto',
        display: 'block',
      }}
      aria-hidden="true"
    />
  )
}
