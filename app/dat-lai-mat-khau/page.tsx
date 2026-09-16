/**
 * Trang đặt mật khẩu mới - `/dat-lai-mat-khau`.
 *
 * Đây là địa chỉ mà liên kết trong thư quay về. Nó PHẢI có mặt trong Supabase
 * Dashboard → Authentication → URL Configuration → Redirect URLs, nếu không thì
 * Supabase lặng lẽ thả người dùng về Site URL và triệu chứng trông y hệt "thư
 * không tới". Xem supabase/README.md mục 6.
 */

import type { Metadata } from 'next'
import { NewPasswordScreen } from '@/features/auth/NewPasswordScreen'

export const metadata: Metadata = {
  title: 'Đặt mật khẩu mới - Học Viện Trí Tuệ',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <NewPasswordScreen />
}
