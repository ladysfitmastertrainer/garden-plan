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

import { useEffect, useRef } from 'react'
import type { Grade, Subject } from '../../content/types'
import { usePvp } from '../../store/pvp'

const LOBBY_MS = 6_000
/**
 * Nhịp khi có bạn ĐỨNG CÙNG MỘT VÙNG ĐẤT.
 *
 * Lúc này nhịp tim không còn chỉ để đếm đầu người: nó là thứ vẽ ra chỗ đứng của
 * bạn ấy trên bản đồ. Sáu giây một lần thì bạn mình không đi bộ mà nhấp nháy từ
 * chỗ này sang chỗ kia, cách nhau cả chục ô - nhìn như lỗi chứ không như một
 * người đang đi.
 *
 * Một giây rưỡi là chỗ dừng có tính toán, và nó được chọn từ hai đầu:
 *
 *   ĐỦ NHANH để hai đứa trẻ thấy nhau ĐANG ĐI chứ không phải đang nhảy cóc.
 *   Nhân vật của bạn trượt từ chỗ cũ sang chỗ mới trong khoảng đúng bằng một
 *   nhịp (xem `transition` chỗ vẽ bạn cùng lớp trong `Overworld`), nên ở nhịp
 *   này bạn mình đi thành một đường liền chứ không giật từng quãng.
 *
 *   ĐỦ CHẬM để một lớp ba mươi máy không đè chết máy chủ: hai mươi lượt gọi
 *   mỗi giây, và chỉ ở ĐÚNG lúc có người để nhìn. Cả lớp tản ra bốn hòn đảo
 *   khác nhau thì mọi máy quay về sáu giây như cũ.
 *
 * Nhanh hơn nữa thì phải đổi cách làm chứ không phải đổi con số: một đường
 * truyền mở sẵn thay cho việc hỏi đi hỏi lại. Đó là một việc khác, lớn hơn.
 */
const TOGETHER_MS = 1_500
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
  /** Ô trẻ đang đứng trong vùng đất. Bỏ trống khi đang ở bản đồ thế giới. */
  at?: { x: number; y: number } | null,
): void {
  const heartbeat = usePvp((s) => s.heartbeat)
  const poll = usePvp((s) => s.poll)
  const goOffline = usePvp((s) => s.goOffline)
  const inMatch = usePvp((s) => s.match?.status === 'active')

  /*
    Ô đang đứng đọc qua REF, không qua mảng phụ thuộc.

    Trẻ bước một ô là `at` đổi. Để nó vào mảng phụ thuộc thì mỗi bước chân huỷ
    cái đồng hồ cũ rồi dựng một cái mới - nhịp tim không bao giờ đủ thời gian
    chạy hết một vòng, và một đứa trẻ đi liên tục sẽ không bao giờ báo vị trí về
    máy chủ. Ref thì nhịp cứ đều đặn, mỗi lần đập lại đọc chỗ đứng MỚI NHẤT.
  */
  const atRef = useRef(at)
  atRef.current = at

  // Có bạn nào đứng cùng vùng đất với mình không - quyết định nhịp nhanh hay chậm.
  const together = usePvp((s) =>
    where === null
      ? false
      : s.lobby.some((e) => e.subject === where.subject && e.grade === where.grade),
  )

  // Nhịp chậm: báo chỗ đứng, nhận lời thách.
  useEffect(() => {
    if (!studentId) return
    const beat = () => void heartbeat(studentId, where, atRef.current)
    beat()
    const timer = window.setInterval(beat, together ? TOGETHER_MS : LOBBY_MS)
    return () => window.clearInterval(timer)
  }, [studentId, where?.subject, where?.grade, together, heartbeat])

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
