'use client'

/**
 * Vỏ client của trang `/admin`.
 *
 * Nó làm đúng hai việc mà `AdminScreen` không nên phải biết: khởi động phiên
 * đăng nhập, và bật những thiết lập cấp trang (chế độ chuyển động, mở khoá âm
 * thanh) mà trước đây `App.tsx` lo cho cả app.
 *
 * KHÔNG chặn ai ở đây. Trang quản trị vẫn mở cho bất kỳ ai gõ đúng địa chỉ, y
 * như hồi nó còn là `#admin` - nó nằm ngoài đường đi của trẻ chứ chưa bao giờ là
 * một lớp bảo mật. Chặn thật nằm ở máy chủ: những tab cần dữ liệu (Tài khoản,
 * Lớp học, Hồ sơ trẻ) gọi `/api`, và `/api` hỏi bạn là ai.
 */

import { useEffect } from 'react'
import { useAuth } from '../../store/auth'
import { useAppChrome } from '../../shell/useAppChrome'
import { AdminScreen } from './AdminScreen'

export function AdminGate() {
  const initAuth = useAuth((s) => s.init)

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  useAppChrome()

  return <AdminScreen />
}
