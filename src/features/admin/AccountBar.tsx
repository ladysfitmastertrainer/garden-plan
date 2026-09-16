'use client'

/**
 * Ai đang đăng nhập, và lối ra.
 *
 * Trang quản trị trước đây không có thứ này, và đó là một lỗ thật chứ không phải
 * thiếu sót thẩm mỹ: nút Đăng xuất duy nhất của app nằm ở màn bản đồ, mà quản
 * trị viên thì được đưa thẳng vào đây khi đăng nhập. Không có đường ra nghĩa là
 * trên máy dùng chung ở phòng giáo viên, người sau mở trình duyệt lên là đang ở
 * trong tài khoản người trước - tài khoản xoá được cả trường.
 *
 * Cũng nói luôn TÊN người đang đăng nhập. Trang này có những nút tác động tới
 * người khác (đặt lại mật khẩu, xoá tài khoản), nên biết mình đang là ai không
 * phải chuyện trang trí.
 *
 * KHÔNG có lối xuống phần chơi. Quản trị viên làm trọn việc của mình ở đây - kể
 * cả lập lớp, xem tab "🏫 Lớp học" - nên một nút "về game" chỉ là chỗ để bấm
 * nhầm. Đó cũng là lý do `GameShell` đưa họ về `/admin` không điều kiện.
 */

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../store/auth'
import { AccountLabel, SignOutButton } from '../../ui/account'
import { ChangePassword } from '../../ui/ChangePassword'

export function AccountBar() {
  const ready = useAuth((s) => s.ready)
  const mode = useAuth((s) => s.mode)
  const router = useRouter()

  // Chưa hỏi xong máy chủ thì chưa vẽ gì. Vẽ sớm là chớp một nhịp "Chưa đăng
  // nhập" vào mặt người đang đăng nhập bình thường.
  if (!ready) return null

  if (mode !== 'adult') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {/*
          Trang quản trị vẫn mở cho người chưa đăng nhập - các tab Cân bằng, Nội
          dung và Bản đồ chạy hoàn toàn trên máy này. Nhưng những tab cần dữ liệu
          sẽ báo lỗi, nên nói trước còn hơn để họ bấm rồi mới hiểu.
        */}
        <span className="text-base opacity-70">Chưa đăng nhập</span>
        <Link href="/" className="btn btn-primary">
          Đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AccountLabel />
      <ChangePassword />
      <SignOutButton onDone={() => router.push('/')} />
    </div>
  )
}
