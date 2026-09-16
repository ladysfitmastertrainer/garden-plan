/**
 * Trang chơi - `/`.
 *
 * Server Component mỏng dính: nó chỉ cắm `GameShell` vào. Cả phần game là canvas,
 * âm thanh Web Audio và hoạt cảnh theo khung hình, tức là chạy hoàn toàn ở trình
 * duyệt, nên không có gì để dựng sẵn trên máy chủ.
 */

import { GameShell } from '@/shell/GameShell'

export default function Page() {
  return <GameShell />
}
