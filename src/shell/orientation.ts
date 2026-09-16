/**
 * Ưu tiên màn hình NẰM NGANG trên điện thoại.
 *
 * Trang web KHÔNG tự xoay được máy của người dùng - không trình duyệt nào cho
 * phép. Chỉ có hai đường thật sự có tác dụng:
 *
 *  1. App đã CÀI VỀ MÁY (PWA): `orientation: 'landscape'` trong manifest. Đây là
 *     đường chính, và nó chỉ chạy trên Android.
 *  2. Đang ở chế độ TOÀN MÀN HÌNH: `screen.orientation.lock()`. Chrome trên
 *     Android chấp nhận; gọi ngoài chế độ toàn màn hình thì bị từ chối.
 *
 * iOS/Safari KHÔNG hỗ trợ `lock()`, và cũng bỏ qua trường `orientation` của
 * manifest. Trên iPhone/iPad, trẻ phải tự xoay máy và tắt khoá xoay của hệ điều
 * hành - đây là giới hạn của iOS, không phải thứ sửa được bằng mã.
 *
 * Nên hàm này là "cố gắng thêm", không phải bảo đảm. Bố cục vẫn phải chạy được
 * ở cả hai hướng, và nó chạy được.
 */

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape' | 'portrait' | 'any') => Promise<void>
}

/** Có phải màn hình nhỏ kiểu điện thoại không. Máy tính bảng và máy tính thì để yên. */
export function isPhoneSized(): boolean {
  return Math.min(window.screen.width, window.screen.height) <= 520
}

export function preferLandscape(): void {
  if (!isPhoneSized()) return

  const orientation = window.screen?.orientation as LockableOrientation | undefined
  // Nuốt lỗi có chủ ý: trình duyệt từ chối là chuyện bình thường (không ở chế độ
  // toàn màn hình, hoặc iOS không có hàm này). Không có gì để báo cho trẻ cả.
  void orientation?.lock?.('landscape').catch(() => {})
}
