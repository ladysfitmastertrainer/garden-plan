/**
 * Hộp thoại kiểu máy điện tử cầm tay: chữ chạy ra từng ký tự, con trỏ ▼ nhấp
 * nháy ở góc khi đã chạy xong.
 *
 * Chữ chạy dần không phải để làm màu: nó ép nhịp đọc chậm lại vừa đúng tốc độ
 * trẻ tiểu học đọc, và cho trẻ một lý do để thật sự đọc thay vì bấm cho qua.
 * Chạm một lần thì chữ hiện hết ngay - trẻ đọc nhanh không phải chờ.
 */

import { useEffect, useRef, useState } from 'react'

/** Mili giây mỗi ký tự. */
const CHAR_MS = 28

export function DialogueBox({
  text,
  onAdvance,
  actionLabel,
  children,
  className,
}: {
  text: string
  /** Gọi khi trẻ chạm tiếp sau lúc chữ đã hiện hết. Bỏ trống thì không có nút. */
  onAdvance?: () => void
  actionLabel?: string
  /** Nội dung thêm bên dưới lời thoại (nút bấm, lựa chọn...). */
  children?: React.ReactNode
  /** Lớp thêm cho khung ngoài, để nơi gọi xếp nó vào bố cục của mình. */
  className?: string
}) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    setShown('')
    setDone(false)
    let index = 0

    const tick = () => {
      index++
      setShown(text.slice(0, index))
      if (index >= text.length) {
        setDone(true)
        return
      }
      timer.current = window.setTimeout(tick, CHAR_MS)
    }
    timer.current = window.setTimeout(tick, CHAR_MS)

    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [text])

  const skipOrAdvance = () => {
    if (!done) {
      if (timer.current !== null) window.clearTimeout(timer.current)
      setShown(text)
      setDone(true)
      return
    }
    onAdvance?.()
  }

  return (
    <div
      className={className ? `pixel-panel relative ${className}` : 'pixel-panel relative'}
      role="status"
      aria-live="polite"
      onClick={onAdvance || !done ? skipOrAdvance : undefined}
    >
      {/* Chữ đầy đủ được đặt sẵn nhưng ẩn đi để hộp không nhảy cao khi chữ chạy. */}
      <p className="relative text-xl leading-snug">
        <span aria-hidden="true" className="invisible whitespace-pre-line">
          {text}
        </span>
        <span className="absolute inset-0 whitespace-pre-line">{shown}</span>
      </p>

      {children}

      {done && onAdvance && (
        <button
          type="button"
          /*
            CHẶN SỰ KIỆN NỔI LÊN, nếu không thì một cú bấm đi được HAI câu.

            Cả khung này cũng bắt `onClick` để trẻ chạm vào chữ là bỏ qua hiệu
            ứng chạy chữ. Cái nút nằm bên trong khung ấy, nên bấm nút là chạy
            cả hai tay xử lý: tay của nút gọi `onAdvance`, rồi sự kiện nổi lên
            tới khung và - vì chữ đã chạy xong - khung gọi `onAdvance` thêm
            lần nữa. Một câu thoại bị nuốt mất, im lặng, mỗi lần bấm.

            Chỉ lộ ra khi nơi gọi truyền `onAdvance` VÀ dùng khung để kể một
            chuỗi lời thoại - trước bàn hướng dẫn thì chưa chỗ nào làm cả hai.
          */
          onClick={(event) => {
            event.stopPropagation()
            onAdvance()
          }}
          className="btn btn-primary mt-3 w-full text-xl"
        >
          {actionLabel ?? 'Tiếp tục'}
        </button>
      )}

      {done && !onAdvance && (
        <span
          className="pixel-cursor pixel-font absolute bottom-1 right-3 text-2xl"
          aria-hidden="true"
        >
          ▼
        </span>
      )}
    </div>
  )
}
