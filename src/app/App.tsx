/**
 * Điều phối màn hình.
 *
 * MVP chưa cần router theo URL: luồng chơi là một chuỗi trạng thái tuyến tính
 * (đăng nhập → chọn hồ sơ → bản đồ → trận đấu → tổng kết), và trẻ không gõ địa
 * chỉ. Khi thêm dashboard phụ huynh ở giai đoạn sau sẽ gắn React Router vào đây.
 */

import { useEffect, useState } from 'react'
import { AdminScreen } from '../features/admin/AdminScreen'
import { AuthScreen } from '../features/auth/AuthScreen'
import { NewPasswordScreen } from '../features/auth/NewPasswordScreen'
import { BattleScreen, BattleSummaryScreen } from '../features/battle/BattleScreen'
import { MapScreen } from '../features/map/MapScreen'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { DashboardScreen } from '../features/dashboard/DashboardScreen'
import { InventoryScreen } from '../features/inventory/InventoryScreen'
import { useAuth } from '../store/auth'
import { useGame } from '../store/game'
import { useUi } from '../store/ui'
import { ensureAudioContext } from '../audio/synth'
import { RotateHint } from '../ui/RotateHint'
import { useMotionMode } from '../features/admin/useTuning'
import { preferLandscape } from './orientation'

/**
 * Trang quản trị vào bằng `#admin`, không có nút nào dẫn tới.
 *
 * Nghe cả `hashchange` để gõ địa chỉ xong là vào được ngay, không phải tải lại.
 */
function useAdminRoute(): boolean {
  const role = useAuth((s) => s.role)
  const [hash, setHash] = useState(() => window.location.hash)

  /*
    Ai vào trang quản trị:

      * bất kỳ ai gõ `#admin` - giữ nguyên như cũ, đây là cửa sau cho người lớn
        trên máy không đăng nhập, và nó chưa bao giờ là một lớp bảo mật;
      * VÀ người mang vai 'admin', ngay khi đăng nhập xong.

    Vế thứ hai là thứ còn thiếu: quản trị viên đăng nhập rồi rơi vào đúng màn
    hình của giáo viên, không có lối nào dẫn tới việc họ vào đây để làm.

    `#game` là đường ra: nút "← Về game" đặt nó, nên tải lại trang cũng không bị
    hất ngược về trang quản trị.
  */
  const isAdmin = hash.startsWith('#admin') || (role === 'admin' && !hash.startsWith('#game'))

  useEffect(() => {
    const check = () => setHash(window.location.hash)
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])

  return isAdmin
}

export function App() {
  const initAuth = useAuth((s) => s.init)
  const isAdmin = useAdminRoute()

  // Xác thực chạy trước và quyết định luôn tầng lưu trữ nào được dùng, nên nó
  // là thứ duy nhất được khởi động ở đây - `useGame.init()` do nó gọi.
  useEffect(() => {
    void initAuth()
  }, [initAuth])

  // Chế độ chuyển động lên thẻ <html>, để CSS đọc được. Không có nó thì lựa
  // chọn "Luôn bật" trong trang quản trị chỉ tác động tới hoạt cảnh viết bằng
  // JavaScript, còn hoạt cảnh viết bằng CSS vẫn bị hệ điều hành tắt.
  const motionMode = useMotionMode()
  useEffect(() => {
    document.documentElement.dataset.motion = motionMode
  }, [motionMode])

  // Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người dùng.
  // Khoá hướng màn hình cũng vậy - phải đi kèm một thao tác thật.
  useEffect(() => {
    const unlock = () => {
      ensureAudioContext()
      preferLandscape()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // Lời nhắc xoay máy nằm NGOÀI `Screen`, trên cùng dòng chảy trang, nên nó có
  // mặt ở mọi màn và không màn nào phải tự lo cho nó.
  // Trang quản trị đứng NGOÀI mọi thứ khác: không cần đăng nhập, không có lời
  // nhắc xoay máy, không có hồ sơ trẻ nào được chọn. Nó là công cụ, không phải
  // một màn chơi.
  if (isAdmin) return <AdminScreen />

  return (
    <>
      <RotateHint />
      <Screen />
    </>
  )
}

/** Màn hình đang hiển thị. Tách khỏi `App` để lời nhắc xoay máy bọc được tất cả. */
function Screen() {
  const authReady = useAuth((s) => s.ready)
  const mode = useAuth((s) => s.mode)
  const recovering = useAuth((s) => s.recovering)
  const gameReady = useGame((s) => s.ready)
  const student = useGame((s) => s.student)
  const battle = useGame((s) => s.battle)
  const summary = useGame((s) => s.summary)
  const screen = useUi((s) => s.screen)

  if (!authReady) return <Loading />

  // Đặt lại mật khẩu đi TRƯỚC mọi thứ. Lúc này người dùng đã có phiên hợp lệ do
  // liên kết trong thư cấp, nên nếu để lọt xuống dưới thì họ vào thẳng game và
  // không bao giờ đổi được mật khẩu.
  if (recovering) return <NewPasswordScreen />

  if (mode === 'signed-out') return <AuthScreen />
  if (!gameReady) return <Loading />

  // Ở chế độ trẻ dùng máy chung, hồ sơ đã được chọn sẵn lúc nhập mã PIN - không
  // bao giờ hiện danh sách hồ sơ cho trẻ thấy bạn khác trong lớp.
  if (!student) {
    return mode === 'child' ? <Loading /> : <ProfileScreen />
  }

  // Trận đấu và màn tổng kết luôn được ưu tiên: không để trẻ bị kéo ra giữa chừng.
  if (battle) return <BattleScreen />
  if (summary) return <BattleSummaryScreen onDone={() => useGame.setState({ summary: null })} />

  if (screen === 'dashboard') return <DashboardScreen />
  if (screen === 'inventory') return <InventoryScreen />
  return <MapScreen />
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="animate-pulse text-5xl">🏰</p>
    </div>
  )
}
