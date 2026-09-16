'use client'

/**
 * Ai đang đăng nhập, và nút thoát ra.
 *
 * Tách ra khỏi `AccountBar` vì giờ có HAI chỗ người lớn hạ cánh xuống: trang
 * quản trị `/admin`, và khu vực người lớn của giáo viên. Cả hai đều cần đúng hai
 * thứ này, và cả hai đều từng thiếu nút Đăng xuất - trên máy dùng chung ở phòng
 * giáo viên, không có đường ra nghĩa là người sau mở máy lên là đang ở trong tài
 * khoản người trước.
 */

import { useAuth } from '../store/auth'

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  parent: 'Phụ huynh',
}

/**
 * Tên và vai của người đang đăng nhập.
 *
 * Không phải trang trí: những màn hình có thứ này đều có nút tác động tới người
 * khác - đặt lại mã PIN, xoá hồ sơ, xoá tài khoản - nên biết mình đang là ai là
 * một phần của việc bấm đúng nút.
 */
export function AccountLabel() {
  const displayName = useAuth((s) => s.displayName)
  const role = useAuth((s) => s.role)

  return (
    <span className="text-base">
      <strong>{displayName}</strong>
      {role && <span className="opacity-70"> · {ROLE_LABEL[role] ?? role}</span>}
    </span>
  )
}

/**
 * `onDone` chỉ dành cho nơi cần tự điều hướng sau khi thoát (trang `/admin` phải
 * quay về `/`). Trong phần chơi thì không cần: `GameShell` thấy mode đổi sang
 * 'signed-out' là tự vẽ màn đăng nhập.
 */
export function SignOutButton({ onDone }: { onDone?: () => void }) {
  const signOut = useAuth((s) => s.signOut)

  return (
    <button
      type="button"
      onClick={() => void signOut().then(() => onDone?.())}
      className="btn btn-ghost"
    >
      Đăng xuất
    </button>
  )
}
