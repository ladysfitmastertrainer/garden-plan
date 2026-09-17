/**
 * Nhịp hỏi lại máy chủ của đấu trường.
 *
 * HAI NHỊP KHÁC HẲN NHAU, và gộp lại thành một là hỏng một trong hai:
 *
 *   - Ngoài bản đồ: 6 giây một lần. Chỉ để bạn bè thấy nhau và để lời thách đấu
 *     tới nơi. Nhanh hơn thì ba mươi máy tính bảng trong một lớp đập vào máy chủ
 *     liên tục suốt cả buổi học, chỉ để trả lời "chưa có gì mới".
 *
 *   - Trong trận: 700 mili giây một lần. Ở đây mỗi nhịp là một quãng trẻ ngồi
 *     nhìn màn hình đứng im sau khi đã bấm xong, nên nó phải ngắn.
 *
 * Nhịp KHÔNG quyết định ai thắng lượt bấm - việc đó xong ngay tại máy chủ vào
 * đúng lúc yêu cầu chạm tới nơi. Hỏi lại chỉ quyết định trẻ THẤY kết quả sớm
 * hay muộn.
 */

import { useEffect } from 'react'
import type { Grade, Subject } from '../../content/types'
import { usePvp } from '../../store/pvp'

const LOBBY_MS = 6_000
const MATCH_MS = 700

/**
 * Giữ cho vị trí và trận đấu luôn mới.
 *
 * `where` là đảo đang đứng; `null` nghĩa là đang ở bản đồ thế giới, và lúc đó
 * bạn bè vẫn thấy em nhưng không thách đấu được - "ở đảo nào thì chiến ở đảo đó".
 */
export function usePvpSync(
  studentId: string | null,
  where: { subject: Subject; grade: Grade } | null,
): void {
  const heartbeat = usePvp((s) => s.heartbeat)
  const poll = usePvp((s) => s.poll)
  const goOffline = usePvp((s) => s.goOffline)
  const inMatch = usePvp((s) => s.match?.status === 'active')

  // Nhịp chậm: báo chỗ đứng, nhận lời thách.
  useEffect(() => {
    if (!studentId) return
    void heartbeat(studentId, where)
    const timer = window.setInterval(() => void heartbeat(studentId, where), LOBBY_MS)
    return () => window.clearInterval(timer)
  }, [studentId, where?.subject, where?.grade, heartbeat])

  // Nhịp nhanh: chỉ chạy khi thật sự đang đánh nhau.
  useEffect(() => {
    if (!studentId || !inMatch) return
    const timer = window.setInterval(() => void poll(studentId), MATCH_MS)
    return () => window.clearInterval(timer)
  }, [studentId, inMatch, poll])

  /*
    Đóng tab thì xoá dấu vết vị trí ngay.

    Không có nó thì bạn bè vẫn thấy tên em ấy sáng đèn thêm 45 giây nữa (xem
    `PRESENCE_TTL_MS`), thách đấu, rồi ngồi chờ một lời nhận không bao giờ tới.
    Bốn mươi lăm giây là rất dài với một đứa bé đang háo hức.

    `pagehide` chứ không phải `beforeunload`: trên iOS Safari - tức trên phần lớn
    máy tính bảng ở trường - `beforeunload` gần như không bao giờ chạy.
  */
  useEffect(() => {
    if (!studentId) return
    const bye = () => void goOffline(studentId)
    window.addEventListener('pagehide', bye)
    return () => window.removeEventListener('pagehide', bye)
  }, [studentId, goOffline])
}
