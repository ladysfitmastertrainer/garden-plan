/**
 * Trang soát hình - `/xem-hinh`. CHỈ có khi chạy `npm run dev`.
 *
 * Bày mọi nhân vật đúng như game vẽ ra - đủ mười hai tông của nhân vật trẻ, bốn
 * nấc của từng con thú, bóng đen của con chưa gặp, trùm hoá đá trong tháp - để
 * duyệt một tờ hình Gemini vừa cắt mà không phải đăng nhập rồi đi tìm con ấy
 * trong game. Con nào chưa có hình vẽ tay thì hiện bằng điểm ảnh như trong game.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArtGallery } from '@/features/art/ArtGallery'

export const metadata: Metadata = {
  title: 'Soát hình - Học Viện Trí Tuệ',
  robots: { index: false, follow: false },
}

export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <ArtGallery />
}
