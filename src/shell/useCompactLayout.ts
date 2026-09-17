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
 * HAI điều kiện, nối bằng dấu phẩy - trong media query dấu phẩy nghĩa là HOẶC:
 *
 *   (max-width: 820px)   máy HẸP: điện thoại dựng đứng, máy tính bảng dựng đứng.
 *   (max-height: 560px)  máy LÙN: chính là điện thoại lúc xoay ngang.
 *
 * Vế thứ hai là vế bản đầu thiếu, và thiếu nó thì hỏng đúng cái việc người ta
 * xoay máy để làm. Một máy 844×390 nằm ngang thì RỘNG 844px - nó trượt khỏi vế
 * thứ nhất, rơi về bố cục máy tính, rồi dính tiếp một khối @media bẻ trang thành
 * lưới hai cột. Xoay máy ra để nhìn cho rõ, và màn chơi bị bóp vào một cột hẹp.
 */
const COMPACT_QUERY = '(max-width: 820px), (max-height: 560px)'

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
