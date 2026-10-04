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
import { ART_MANIFEST } from '../art/manifest'

export interface Sprite {
  /** Ký tự '.' luôn là trong suốt. */
  palette: Record<string, string>
  /** Mỗi chuỗi là một hàng điểm ảnh; mọi hàng phải dài bằng nhau. */
  rows: string[]
  /**
   * Hình vẽ tay thay cho lưới điểm ảnh, nếu đã có - xem `SpriteArt`.
   *
   * Gắn THẲNG vào sprite chứ không bắt từng màn hình tự tra, vì có hơn sáu mươi
   * chỗ vẽ nhân vật trong app: chỗ nào đang cầm sprite của con quái thì tự
   * nhận luôn hình mới của nó, không chỗ nào phải sửa.
   */
  art?: SpriteArt
  /**
   * Vẽ bằng NÉT thay cho lưới điểm ảnh: khối đảo, ô vườn, ghim bản đồ - những
   * thứ hình học đơn giản, vẽ bằng code là đủ đẹp mà không cần ảnh.
   *
   * Toạ độ tính bằng điểm ảnh của lưới (`rows`): lưới vẫn là thứ quyết định cỡ
   * của sprite, nên mọi bố cục quanh nó không đổi. `palette` truyền vào chứ không
   * đóng gói sẵn, để `greyOut` hay `recolor` tráo màu vẫn ăn vào hình nét.
   */
  vector?: (ctx: CanvasRenderingContext2D, palette: Record<string, string>) => void
}

/**
 * Hình vẽ tay của một sprite: một file trong `public/art`.
 *
 * Chưa có file (chưa có trong `ART_MANIFEST`) thì sprite vẽ bằng lưới điểm ảnh
 * như cũ - nên bộ hình mới gắn vào được dần từng tờ, không tờ nào phải chờ.
 */
export interface SpriteArt {
  /** Tên file trong `public/art`, không có đuôi. */
  id: string
  /** Bộ lọc CSS: tô màu nhân vật của trẻ, hoá đá trùm trong tháp, bóng đen thú chưa gặp. */
  filter?: string
  /**
   * Cỡ so với khung, 0..1. Con thú nấc 1 phải bé hơn nấc 4 dù hai hình cùng
   * được cắt sát mép - không có cái này thì con non cũng to bằng con trưởng thành.
   */
  size?: number
  /**
   * Hình vẽ quay mặt NGƯỢC chiều lưới điểm ảnh. Lưới điểm ảnh của sinh vật quay
   * sang phải (sân đấu lật con quái cho nó nhìn về phía thú của trẻ), còn quái
   * trên tờ hình Gemini được vẽ quay sang trái - đúng chỗ nó đứng trong trận.
   * Đánh dấu ở đây thì PixelSprite lật bù lại, không màn hình nào phải biết.
   */
  mirrored?: boolean
  /**
   * Màu NHÂN lên hình (multiply): trắng thành màu này, đen vẫn đen. Dành cho thân
   * trắng như gấu trúc, nơi bộ lọc xoay màu không có màu nào để xoay.
   */
  multiply?: string
}

/** Hình vẽ tay của sprite này, nếu file đã có. */
export function artOf(sprite: Sprite): SpriteArt | null {
  return sprite.art && ART_MANIFEST[sprite.art.id] ? sprite.art : null
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

/**
 * Độ phân giải của sprite vẽ nét: đủ mịn cho cỡ hiện trên màn hình (kể cả màn
 * hình mật độ cao), nhưng có trần - khung bản đồ còn kéo giãn thêm bằng CSS.
 */
function vectorResolution(scale: number): number {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.min(16, Math.max(2, Math.ceil(scale * dpr * 1.5)))
}

function paint(canvas: HTMLCanvasElement, sprite: Sprite, scale: number): void {
  const { width, height } = spriteSize(sprite)
  if (sprite.vector) {
    const res = vectorResolution(scale)
    canvas.width = width * res
    canvas.height = height * res
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(res, res)
    sprite.vector(ctx, sprite.palette)
    ctx.restore()
    return
  }
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
  const art = artOf(sprite)

  useEffect(() => {
    if (ref.current) paint(ref.current, sprite, scale)
  }, [sprite, scale])

  if (art) {
    /*
      Khung giữ ĐÚNG cỡ của sprite pixel, để bố cục quanh nó không xê dịch dù
      con này đã có hình mới còn con bên cạnh thì chưa. Hình đặt sát đáy khung
      cho chân nhân vật đứng đúng chỗ chân sprite cũ vẫn đứng.
    */
    const meta = ART_MANIFEST[art.id]!
    const size = art.size ?? 1
    return (
      <span
        className={className}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          width: width * scale,
          height: height * scale,
          transform: flip !== !!art.mirrored ? 'scaleX(-1)' : undefined,
          ...style,
        }}
        aria-hidden="true"
      >
        {art.multiply && (
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${((1 - size) / 2) * 100}%`,
              width: `${size * 100}%`,
              height: `${size * 100}%`,
              background: art.multiply,
              mixBlendMode: 'multiply',
              WebkitMaskImage: `url(/art/${art.id}.webp)`,
              maskImage: `url(/art/${art.id}.webp)`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskPosition: 'bottom',
              maskPosition: 'bottom',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}
        <img
          src={`/art/${art.id}.webp`}
          alt=""
          width={meta.w}
          height={meta.h}
          draggable={false}
          decoding="async"
          style={{
            width: `${size * 100}%`,
            height: `${size * 100}%`,
            objectFit: 'contain',
            objectPosition: 'bottom',
            filter: art.filter,
            // Khung ngoài hay đặt `pixelated` cho sprite điểm ảnh, và thuộc tính
            // ấy được kế thừa - hình vẽ tay mà phóng kiểu đó thì nét ra răng cưa.
            imageRendering: 'auto',
            pointerEvents: 'none',
          }}
        />
      </span>
    )
  }

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        width: width * scale,
        height: height * scale,
        imageRendering: sprite.vector ? 'auto' : 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}
