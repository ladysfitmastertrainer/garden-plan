/**
 * Hộp thoại "chắc chưa?" dùng chung.
 *
 * Thay cho `window.confirm`. Hộp thoại mặc định của trình duyệt rơi ra ngoài
 * hẳn thế giới của game: phông chữ hệ điều hành, nút tiếng Anh, khung xám nhạt
 * dán ở mép trên màn hình. Trẻ đang ở trong một trò chơi pixel thì không nên bị
 * một mẩu giao diện lạ chặn đường.
 *
 * Quan trọng hơn: `window.confirm` KHOÁ CỨNG luồng JavaScript, không đóng bằng
 * Esc theo cách của app, không lồng được hình con thú vào cho trẻ nhận ra mình
 * đang xoá hồ sơ của ai, và trên vài trình duyệt di động nó còn bị chặn thẳng.
 *
 * NÚT HUỶ ĐỨNG TRƯỚC trong DOM - không phải để cho đẹp. `PixelModal` đưa tiêu
 * điểm vào phần tử đầu tiên, nên mở hộp thoại rồi bấm Enter theo quán tính sẽ
 * rơi vào "thôi", không rơi vào "xoá".
 */

import { PixelModal } from './PixelModal'

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Thôi',
  danger = false,
  onConfirm,
  onClose,
  children,
}: {
  title: string
  /** Lời giải thích. Xuống dòng bằng `\n` để tách ý cho dễ đọc. */
  message: string
  confirmLabel: string
  cancelLabel?: string
  /** Việc không lấy lại được thì nút đồng ý tô đỏ. */
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
  /** Hình kèm theo - ví dụ con thú của hồ sơ sắp xoá. */
  children?: React.ReactNode
}) {
  return (
    <PixelModal title={title} onClose={onClose}>
      <div className="grid justify-items-center gap-3 text-center">
        {children}

        <h3 className="pixel-font text-2xl leading-tight">{title}</h3>
        <p className="whitespace-pre-line text-lg leading-snug">{message}</p>

        <div className="mt-1 flex w-full gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost flex-1 text-lg"
            style={{ minHeight: 48 }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary flex-[2] text-lg"
            style={{ minHeight: 48, background: danger ? '#e0483e' : undefined }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </PixelModal>
  )
}
