/**
 * Khung HTML của cả app.
 *
 * Đây là Server Component: nó chạy trên máy chủ, không gửi một dòng JavaScript
 * nào xuống trình duyệt. Mọi thứ động - game, trang quản trị - nằm trong các
 * Client Component bên dưới.
 */

import type { Metadata, Viewport } from 'next'
import { Baloo_2, VT323 } from 'next/font/google'
import './globals.css'

/** Chữ bo tròn, thân thiện với trẻ và có đầy đủ dấu tiếng Việt. */
const baloo = Baloo_2({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
})

/**
 * Font pixel cho khung game.
 *
 * VT323 là một trong số rất ít font pixel trên Google Fonts CÓ ĐỦ DẤU TIẾNG
 * VIỆT - Press Start 2P, Silkscreen, Pixelify Sans đều thiếu. Chữ đề bài vẫn
 * dùng Baloo 2 cho trẻ dễ đọc; VT323 chỉ dùng cho khung và nhãn.
 */
const vt323 = VT323({
  subsets: ['latin', 'vietnamese'],
  weight: '400',
  variable: '--font-vt323',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Học Viện Trí Tuệ',
  description: 'Game học tập cho học sinh tiểu học: Toán, Tiếng Việt, Đạo đức, Âm nhạc',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/icon-192.png' },
  // Không cho công cụ tìm kiếm lập chỉ mục: đây là app của một trường, không
  // phải trang giới thiệu, và mọi đường vào đều cần đăng nhập.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#6d4aff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${baloo.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  )
}
