/**
 * Màn hình có đủ rộng để xếp khung phụ SANG BÊN bản đồ không.
 *
 * Cặp song sinh của `useCompactLayout`, và hai hàm này trả lời hai câu hỏi ở hai
 * đầu của cùng một dải: một bên hỏi "máy có nhỏ tới mức khung phụ phải chui vào
 * ngăn kéo không", bên này hỏi "máy có lớn tới mức khung phụ đứng được thành một
 * cột riêng không". Ở giữa hai đầu là bố cục một cột cũ.
 *
 * NGƯỠNG PHẢI KHỚP với `@media (min-width: 1000px) and (min-height: 640px)`
 * trong `globals.css` - chỗ dựng cột phụ. Lệch nhau thì hàng nút thu lại còn
 * biểu tượng đúng ở cỡ máy mà nó đang có thừa chỗ để ghi tên, hoặc ngược lại.
 */

import { useSyncExternalStore } from 'react'

const WIDE_QUERY = '(min-width: 1000px) and (min-height: 640px)'

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(WIDE_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export function useWideLayout(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_QUERY).matches,
    // Giá trị lúc dựng ở máy chủ, nơi không có `window`. Trình duyệt sửa lại
    // ngay ở lượt vẽ đầu tiên - cùng lẽ với `useCompactLayout`.
    () => false,
  )
}
