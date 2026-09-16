/**
 * Hộp thoại nổi kiểu máy điện tử cầm tay: phủ mờ toàn màn hình rồi đặt khung
 * ngay giữa tầm mắt.
 *
 * Lý do phải nổi lên chứ không nằm dưới nội dung: trên màn hình cao, một hộp
 * thoại đặt bên dưới bản đồ rơi khỏi tầm nhìn - trẻ bấm vào đảo, thấy "không có
 * gì xảy ra" và bấm tiếp. Khung nổi ép câu hỏi "vào vùng này chứ?" nằm đúng chỗ
 * trẻ đang nhìn, và chặn luôn mọi thao tác khác cho tới khi trẻ trả lời.
 *
 * Đóng được bằng: nút, phím Esc, hoặc chạm ra ngoài khung.
 */

import { useEffect, useRef } from 'react'

/** Những thứ nhận được tiêu điểm bàn phím bên trong khung. */
const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export function PixelModal({
  title,
  onClose,
  children,
}: {
  /** Tiêu đề - vừa hiện ra, vừa là nhãn cho trình đọc màn hình. */
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null

    // Đưa tiêu điểm vào nút đầu tiên trong khung, không phải vào cả khung: trẻ
    // dùng bàn phím bấm Enter một cái là đi tiếp được ngay.
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      // Giữ tiêu điểm quẩn trong khung - Tab ra ngoài thì người dùng bàn phím
      // lạc vào bản đồ phía sau mà không thấy vòng viền ở đâu.
      const items = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!items || items.length === 0) return
      const firstItem = items[0]!
      const lastItem = items[items.length - 1]!
      const active = document.activeElement

      if (event.shiftKey && (active === firstItem || !panelRef.current?.contains(active))) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="pixel-ui fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgb(12 16 24 / 0.66)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pixel-panel w-full max-w-md"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        // Chạm bên trong khung không được tính là chạm ra ngoài để đóng.
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
