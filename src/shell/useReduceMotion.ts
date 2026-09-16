/**
 * Có nên tắt bớt hoạt cảnh không - hỏi CẢ HAI nguồn.
 *
 * Không dùng `useReducedMotion` của framer-motion nữa: nó chỉ đọc cài đặt của
 * hệ điều hành, nên thiết lập trong app không đè lên được. Máy trường học hay
 * bị tắt sẵn hiệu ứng động ở mức hệ điều hành, và với game cho trẻ thì hoạt
 * cảnh là thứ nói cho trẻ biết vừa có chuyện gì - không phải trang trí.
 */

import { useEffect, useState } from 'react'
import { useMotionMode } from '../features/admin/useTuning'

/** Máy có đang yêu cầu giảm chuyển động không. */
function useSystemPrefersReduce(): boolean {
  const [reduce, setReduce] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduce
}

export function useReduceMotion(): boolean {
  const mode = useMotionMode()
  const system = useSystemPrefersReduce()

  if (mode === 'full') return false
  if (mode === 'reduced') return true
  return system
}
