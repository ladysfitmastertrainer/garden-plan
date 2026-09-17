/**
 * Màn hình có phải loại "cầm trên tay" không.
 *
 * Dùng để bật chế độ TOÀN MÀN HÌNH của phần chơi: trên điện thoại, mọi khung
 * phụ - thanh hồ sơ, hàng nút, bảng bạn cùng lớp, lời mời cài app - cộng lại ăn
 * hơn một phần ba chiều cao máy, và chúng đẩy chính cái bản đồ mà trẻ đang chơi
 * xuống còn một ô bé tí ở giữa. Trên máy tính thì không có vấn đề ấy, nên chế độ
 * này chỉ bật ở đây.
 *
 * `useSyncExternalStore` chứ không phải `useEffect` + `useState`: Next dựng sẵn
 * trang này ở máy chủ, nơi không có `window`. Hàm đọc ở máy chủ trả về `false`
 * (bố cục máy tính), rồi trình duyệt sửa lại ngay ở lượt vẽ đầu tiên - không có
 * một khung hình nào hiện sai bố cục rồi mới nhảy sang bố cục đúng.
 */

import { useSyncExternalStore } from 'react'

/**
 * Ngưỡng bề ngang.
 *
 * 820px: cùng con số mà `app/globals.css` dùng cho màn đi cảnh, và nó bắt trọn
 * cả điện thoại dựng đứng lẫn nằm ngang (844px là chiều dài một máy phổ thông).
 * Máy tính bảng dựng đứng (768px) cũng vào đây - và nên vào, vì ở đó cũng chính
 * cái bản đồ là thứ trẻ cần nhìn.
 */
const COMPACT_QUERY = '(max-width: 820px)'

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(COMPACT_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export function useCompactLayout(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(COMPACT_QUERY).matches,
    // Giá trị lúc dựng ở máy chủ. Xem ghi chú ở đầu file.
    () => false,
  )
}
