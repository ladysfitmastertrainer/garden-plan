'use client'

/**
 * Điều phối màn hình của phần chơi.
 *
 * Luồng chơi là một chuỗi trạng thái tuyến tính (đăng nhập → chọn hồ sơ → bản đồ
 * → trận đấu → tổng kết), và trẻ không gõ địa chỉ, nên phần này KHÔNG dùng router
 * - trạng thái quyết định màn nào hiện ra.
 *
 * Phần duy nhất cần địa chỉ thật là trang quản trị, và giờ nó có một: `/admin`.
 * Bản cũ nhận ra nó qua `#admin` trong địa chỉ, vì trang tĩnh không có đường dẫn
 * nào khác; Next thì cho mỗi màn một đường dẫn, nên cái mẹo ấy không cần nữa -
 * xem `app/admin/page.tsx`.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthScreen } from '../features/auth/AuthScreen'
import { BattleScreen, BattleSummaryScreen } from '../features/battle/BattleScreen'
import { MapScreen } from '../features/map/MapScreen'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { DashboardScreen } from '../features/dashboard/DashboardScreen'
import { InventoryScreen } from '../features/inventory/InventoryScreen'
import { useAuth } from '../store/auth'
import { useGame } from '../store/game'
import { useUi } from '../store/ui'
import { RotateHint } from '../ui/RotateHint'
import { useAppChrome } from './useAppChrome'

export function GameShell() {
  const initAuth = useAuth((s) => s.init)
  const role = useAuth((s) => s.role)
  const ready = useAuth((s) => s.ready)
  const router = useRouter()

  // Xác thực chạy trước và quyết định luôn tầng lưu trữ nào được dùng, nên nó là
  // thứ duy nhất được khởi động ở đây - `useGame.init()` do nó gọi.
  useEffect(() => {
    void initAuth()
  }, [initAuth])

  useAppChrome()

  /*
    Quản trị viên đăng nhập xong thì đưa thẳng sang trang quản trị.

    Không có nhánh này thì họ rơi vào đúng màn hình của giáo viên, và không có
    lối nào trên giao diện dẫn tới việc họ vào đây để làm. Bản cũ cũng làm vậy,
    chỉ khác là nó đổi `#` trong địa chỉ; giờ là một lần chuyển trang thật, nên
    nút "← Về game" của trình duyệt cũng hoạt động đúng.
  */
  useEffect(() => {
    if (ready && role === 'admin') router.replace('/admin')
  }, [ready, role, router])

  // Lời nhắc xoay máy nằm NGOÀI `Screen`, trên cùng dòng chảy trang, nên nó có
  // mặt ở mọi màn và không màn nào phải tự lo cho nó.
  return (
    <>
      <RotateHint />
      <Screen />
    </>
  )
}

/** Màn hình đang hiển thị. Tách khỏi `GameShell` để lời nhắc xoay máy bọc được tất cả. */
function Screen() {
  const authReady = useAuth((s) => s.ready)
  const mode = useAuth((s) => s.mode)
  const gameReady = useGame((s) => s.ready)
  const student = useGame((s) => s.student)
  const battle = useGame((s) => s.battle)
  const summary = useGame((s) => s.summary)
  const screen = useUi((s) => s.screen)

  if (!authReady) return <Loading />
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

export function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="animate-pulse text-5xl">🏰</p>
    </div>
  )
}
