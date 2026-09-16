/**
 * Bộ vẽ pixel art.
 *
 * Sprite được viết THẲNG TRONG CODE dưới dạng lưới ký tự + bảng màu, không dùng
 * file ảnh. Nhờ vậy không cần hoạ sĩ, không cần asset, sửa một điểm ảnh chỉ là
 * sửa một ký tự, và toàn bộ nhân vật đi kèm mã nguồn.
 *
 * Vẽ lên canvas ở đúng kích thước gốc (16×16) rồi phóng to bằng CSS với
 * `image-rendering: pixelated` - đúng cách máy điện tử cầm tay ngày xưa hiển thị:
 * điểm ảnh to, vuông, sắc cạnh, không bị làm mượt.
 */

import { useEffect, useRef } from 'react'

export interface Sprite {
  /** Ký tự '.' luôn là trong suốt. */
  palette: Record<string, string>
  /** Mỗi chuỗi là một hàng điểm ảnh; mọi hàng phải dài bằng nhau. */
  rows: string[]
}

export function spriteSize(sprite: Sprite): { width: number; height: number } {
  return { width: sprite.rows[0]?.length ?? 0, height: sprite.rows.length }
}

/** Kiểm tra sprite có vuông vắn không - gọi trong test để bắt lỗi gõ nhầm. */
export function validateSprite(sprite: Sprite): string[] {
  const errors: string[] = []
  const width = sprite.rows[0]?.length ?? 0

  if (sprite.rows.length === 0) errors.push('Sprite rỗng')

  sprite.rows.forEach((row, index) => {
    if (row.length !== width) {
      errors.push(`Hàng ${index} dài ${row.length}, phải là ${width}`)
    }
    for (const char of row) {
      if (char !== '.' && !(char in sprite.palette)) {
        errors.push(`Hàng ${index}: ký tự '${char}' không có trong bảng màu`)
      }
    }
  })

  return errors
}

function paint(canvas: HTMLCanvasElement, sprite: Sprite): void {
  const { width, height } = spriteSize(sprite)
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)

  sprite.rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '.') return
      const color = sprite.palette[char]
      if (!color) return
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    })
  })
}

export function PixelSprite({
  sprite,
  scale = 6,
  flip = false,
  className,
  style,
}: {
  sprite: Sprite
  scale?: number
  /** Lật ngang để nhân vật quay mặt về phía đối thủ. */
  flip?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { width, height } = spriteSize(sprite)

  useEffect(() => {
    if (ref.current) paint(ref.current, sprite)
  }, [sprite])

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        width: width * scale,
        height: height * scale,
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
