/**
 * Dòng nhắc xoay ngang máy.
 *
 * Trang web KHÔNG tự xoay được máy của người dùng (xem `app/orientation.ts`).
 * Trên Android đã cài app thì manifest lo được; còn trên iPhone thì không có
 * cách nào - nên chỗ duy nhất còn lại là nhờ chính đứa trẻ xoay hộ.
 *
 * Đây là LỜI NHẮC, không phải cái chặn. Bố cục dọc vẫn chơi được đầy đủ, nên
 * dựng một tấm chắn "hãy xoay máy" che hết màn hình là cướp quyền của trẻ vì
 * một thứ chỉ dễ chịu hơn chứ không bắt buộc. Nó nằm trên dòng chảy trang chứ
 * không đè lên nội dung, để không che mất nút nào.
 */

import { useEffect, useState } from 'react'
import { isPhoneSized } from '../app/orientation'
import { useUi } from '../store/ui'

export function RotateHint() {
  const dismissed = useUi((s) => s.rotateHintDismissed)
  const dismiss = useUi((s) => s.dismissRotateHint)
  const portraitPhone = usePortraitPhone()

  if (dismissed || !portraitPhone) return null

  return (
    <div
      className="pixel-ui flex items-center gap-2 px-3 py-2"
      style={{
        background: '#fff3c4',
        borderBottom: '4px solid #1b2432',
      }}
      role="status"
    >
      <span
        aria-hidden="true"
        className="text-2xl leading-none"
        style={{ animation: 'rotate-hint 1.8s steps(2, end) infinite' }}
      >
        📱
      </span>
      <p className="flex-1 text-sm font-bold leading-snug">
        Xoay ngang máy cho dễ chơi nhé!
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 px-3 font-bold"
        // 44px là ngưỡng tối thiểu cho ngón tay trẻ con - nút này nhỏ nhưng không
        // được nhỏ hơn thế.
        style={{ minHeight: 44, minWidth: 44 }}
        aria-label="Bỏ qua lời nhắc xoay máy"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Máy cỡ điện thoại đang dựng đứng hay không.
 *
 * Nghe cả `orientation` lẫn `resize`: trên một số máy Android, xoay máy chỉ bắn
 * ra `resize` chứ không bắn `change` của media query.
 */
function usePortraitPhone(): boolean {
  const [portrait, setPortrait] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(orientation: portrait)')
    const update = () => setPortrait(query.matches && isPhoneSized())

    update()
    query.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      query.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return portrait
}
