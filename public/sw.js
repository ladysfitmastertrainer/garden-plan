/*
 * Service worker TỐI GIẢN, cố ý.
 *
 * Nó tồn tại vì đúng một lý do: Chrome chỉ mời người dùng cài app khi trang có
 * một service worker CÓ trình xử lý `fetch`. Không có tệp này thì sự kiện
 * `beforeinstallprompt` không bao giờ bắn ra, và nút "Cài app về máy" không bao
 * giờ hiện.
 *
 * KHÔNG lưu đệm gì hết, và đó là một quyết định chứ không phải việc chưa làm
 * xong. App này yêu cầu luôn có mạng - ba tầng lưu trữ chồng nhau của bản cũ đã
 * bị bỏ đúng vì chúng là phần khó gỡ lỗi nhất dự án (xem `src/data/api.ts`).
 * Thêm một tầng đệm ở đây là dựng lại đúng cái đã phá bỏ, chỉ khác là lần này nó
 * nằm ngoài tầm mắt và sống dai hơn cả lần tải lại trang.
 *
 * Trình xử lý `fetch` KHÔNG gọi `respondWith`: nó chỉ cần có mặt. Để trình duyệt
 * tự đi lấy như bình thường thì không đụng gì tới tải theo dải, tới luồng dữ
 * liệu, hay tới cách Next phục vụ tệp tĩnh.
 */

// Bản mới thay bản cũ ngay, không đợi đóng hết tab. Một service worker cũ nằm
// lại là thứ rất khó lần ra khi app đã đổi.
self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Cố ý để trống. Xem chú thích đầu tệp.
})
