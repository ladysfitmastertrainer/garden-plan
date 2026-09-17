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
import { usePvp } from '../store/pvp'
import { PvpScreen } from '../features/pvp/PvpScreen'
import { useUi } from '../store/ui'
import { InstallPrompt } from '../ui/InstallPrompt'
import { RotateHint } from '../ui/RotateHint'
import { useAppChrome } from './useAppChrome'
import type { PvpStatus } from '../data/pvp-types'

/**
 * Những trạng thái trận PVP chiếm CẢ màn hình.
 *
 * 'pending' và 'declined' cố ý không có mặt: cả hai mới chỉ là tin nhắn về một
 * trận đấu chưa từng xảy ra, và chúng thuộc về khung hỏi nhỏ ở màn bản đồ
 * (`PvpLobby`). Chiếm cả màn hình để báo "bạn ấy chưa muốn đấu" thì lời từ chối
 * hoá ra to tiếng hơn cả trận đấu.
 */
const PVP_FULLSCREEN = new Set<PvpStatus>(['active', 'finished', 'abandoned'])

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
    Quản trị viên thì `/` không phải chỗ của họ - đưa thẳng sang trang quản trị.

    KHÔNG có ngoại lệ nào, và đó là chủ ý. Bản trước có một lá cờ trong
    `sessionStorage` để nút "← Về game" trên trang quản trị tạm tắt cái đẩy này;
    cờ ấy sống theo TAB nên sống dai hơn phiên đăng nhập, và cờ của một phiên đã
    chết nằm lại trả lời thay cho phiên sau - quản trị viên đăng nhập vào tab đó
    không được đưa sang `/admin` nữa mà rơi vào khu vực người lớn. Bỏ nút ấy đi
    thì cả lá cờ lẫn cả lớp lỗi ấy biến mất theo: quản trị viên làm trọn việc của
    mình ở `/admin`, kể cả lập lớp.
  */
  useEffect(() => {
    if (ready && role === 'admin') router.replace('/admin')
  }, [ready, role, router])

  /*
    Hai dải nhắc nằm NGOÀI `Screen`, trên cùng dòng chảy trang, nên chúng có mặt
    ở mọi màn và không màn nào phải tự lo cho chúng.

    Lời mời cài app đứng TRƯỚC lời nhắc xoay máy vì nó giải quyết luôn cả hai
    việc: bản đã cài tự nằm ngang theo manifest, nên trẻ nào cài rồi thì không
    bao giờ phải đọc tới dải thứ hai nữa. Xem `shell/orientation.ts`.
  */
  return (
    <>
      <InstallPrompt />
      <RotateHint />
      <Screen />
    </>
  )
}

/** Màn hình đang hiển thị. Tách khỏi `GameShell` để lời nhắc xoay máy bọc được tất cả. */
function Screen() {
  const authReady = useAuth((s) => s.ready)
  const mode = useAuth((s) => s.mode)
  const role = useAuth((s) => s.role)
  const gameReady = useGame((s) => s.ready)
  const student = useGame((s) => s.student)
  const battle = useGame((s) => s.battle)
  const summary = useGame((s) => s.summary)
  const screen = useUi((s) => s.screen)
  const pvpMatch = usePvp((s) => s.match)

  if (!authReady) return <Loading />
  if (mode === 'signed-out') return <AuthScreen />

  /*
    Sắp sang `/admin` thì đứng yên, đừng vẽ tạm một màn khác.

    Việc chuyển trang ở trên nằm trong `useEffect`, nên React vẽ xong một lượt
    rồi mới chuyển. Không có nhánh này thì lượt vẽ ấy rơi vào khu vực người lớn -
    quản trị viên đăng nhập xong thấy chớp qua màn hình của giáo viên rồi mới tới
    được trang quản trị, và màn hình ấy còn kịp bắn hai lượt gọi máy chủ để lấy
    dữ liệu mà nó sắp bị bỏ đi.
  */
  if (role === 'admin') return <Loading />

  if (!gameReady) return <Loading />

  /*
    Khu vực người lớn được hỏi TRƯỚC câu "đã chọn hồ sơ trẻ nào chưa".

    Thứ tự cũ ngược lại, và nó làm nút "Quản lý lớp" thành nút chết: nút ấy gọi
    `go('dashboard')`, nhưng giáo viên thì chưa chọn hồ sơ trẻ nào nên nhánh
    `!student` chặn lại và vẽ đúng màn vừa bấm. Bấm mà không có gì xảy ra.

    Việc quản lý lớp không cần hồ sơ trẻ nào cả, nên nó không việc gì phải đứng
    sau câu hỏi ấy.
  */
  if (screen === 'dashboard') return <DashboardScreen />

  // Ở chế độ trẻ dùng máy chung, hồ sơ đã được chọn sẵn lúc nhập mã PIN - không
  // bao giờ hiện danh sách hồ sơ cho trẻ thấy bạn khác trong lớp.
  if (!student) {
    if (mode === 'child') return <Loading />

    /*
      Giáo viên hạ cánh xuống khu vực người lớn, không phải màn chọn hồ sơ trẻ.

      Màn kia được viết cho phụ huynh, và lời lẽ trên đó nói thẳng với trẻ ("Chào
      con! Hãy chọn một người bạn đồng hành"). Giáo viên thì gần như không bao giờ
      có hồ sơ trẻ của riêng mình, nên với họ nó vừa lạc lõng vừa là ngõ cụt - mà
      tệ hơn, danh sách "Ai đang chơi hôm nay?" chính là sổ điểm danh cả lớp họ
      vừa lập, kèm nút xoá cạnh từng em.

      Vẫn vào được màn ấy khi họ tự chọn (`screen === 'profiles'`): giáo viên
      có con riêng dùng app là chuyện có thật, chỉ là nó không phải mặc định.

      Chỉ còn 'teacher' ở đây, không còn 'admin': quản trị viên đã bị nhánh trên
      đưa sang `/admin` rồi, và TypeScript biết điều đó - thêm `|| role ===
      'admin'` vào là nó báo so sánh thừa.
    */
    if (role === 'teacher' && screen !== 'profiles') return <DashboardScreen />

    return <ProfileScreen />
  }

  // Trận đấu và màn tổng kết luôn được ưu tiên: không để trẻ bị kéo ra giữa chừng.
  if (battle) return <BattleScreen />
  if (summary) return <BattleSummaryScreen onDone={() => useGame.setState({ summary: null })} />

  /*
    Trận PVP chiếm cả màn hình, nhưng đứng SAU trận đánh quái.

    Thứ tự này quan trọng: một lời thách đấu tới nơi trong lúc trẻ đang đánh trùm
    mà kéo em ấy ra khỏi trận thì vừa mất công vừa mất cả con trùm. Lời thách vẫn
    nằm đó chờ - đánh xong quay ra bản đồ là thấy.

    'pending' KHÔNG vào đây: lúc ấy chưa có trận nào cả, mới chỉ là một lời mời,
    và nó thuộc về khung hỏi nhỏ ở màn bản đồ (`PvpLobby`).
  */
  if (pvpMatch && PVP_FULLSCREEN.has(pvpMatch.status)) return <PvpScreen />

  if (screen === 'profiles') return <ProfileScreen />
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
