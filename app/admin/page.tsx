/**
 * Trang quản trị - `/admin`.
 *
 * Bản cũ vào đây bằng `#admin` gắn sau địa chỉ, vì một trang tĩnh không có đường
 * dẫn nào khác để mà đi. Giờ nó là một trang thật: bookmark được, nút quay lại
 * của trình duyệt chạy đúng, và không còn phải nghe `hashchange`.
 *
 * Trang này đứng NGOÀI mọi thứ khác: không có lời nhắc xoay máy, không hồ sơ trẻ
 * nào được chọn. Nó là công cụ của người lớn, không phải một màn chơi.
 */

import type { Metadata } from 'next'
import { AdminGate } from '@/features/admin/AdminGate'

export const metadata: Metadata = { title: 'Quản trị - Học Viện Trí Tuệ' }

export default function Page() {
  return <AdminGate />
}
