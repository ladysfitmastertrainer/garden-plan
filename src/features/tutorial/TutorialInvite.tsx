'use client'

/**
 * Lời mời xem hướng dẫn, HAI LỰA CHỌN, hiện ra ngay giây phút trẻ vào app.
 *
 * "Ngay giây phút đầu tiên" ở đây nghĩa là: ngay khi có một hồ sơ trẻ được
 * chọn và màn chơi hiện ra - không sớm hơn. Sớm hơn thì chưa biết đang mời AI:
 * máy tính bảng dùng chung cả lớp có nhiều hồ sơ, và lời từ chối của em vào
 * trước không được trả lời thay em vào sau (xem `shell/tutorial-seen.ts`).
 *
 * Là một KHUNG NỔI chứ không phải một dải nhắc, và đây là chỗ nó khác hẳn lời
 * mời cài app: cài app là việc làm lúc nào cũng được, còn hướng dẫn thì chỉ có
 * nghĩa TRƯỚC KHI chơi. Hỏi bằng một dải nhỏ ở mép trên thì trẻ đã bấm vào hòn
 * đảo đầu tiên trước khi kịp đọc.
 *
 * Chỉ hỏi MỘT LẦN cho mỗi hồ sơ trên mỗi máy. Trả lời "không" là xong chuyện -
 * nhưng không phải là hết đường: mục "Xem hướng dẫn" trong ngăn kéo ☰ mở lại
 * bàn hướng dẫn bất cứ lúc nào, và nó không quan tâm tới lời từ chối nào cả.
 * Cùng một lẽ với `InstallCard`: bấm "thôi" nghĩa là "đừng hỏi nữa", không phải
 * "đừng bao giờ cho tôi xem".
 */

import { useEffect } from 'react'

import { invitedToTutorial, markTutorialInvited } from '../../shell/tutorial-seen'
import { useGame } from '../../store/game'
import { useTutorial } from '../../store/tutorial'
import { useUi } from '../../store/ui'
import { PixelModal } from '../../ui/PixelModal'

export function TutorialInvite() {
  const student = useGame((s) => s.student)
  const battle = useGame((s) => s.battle)
  const summary = useGame((s) => s.summary)
  const screen = useUi((s) => s.screen)
  const active = useTutorial((s) => s.active)
  const inviteOpen = useTutorial((s) => s.inviteOpen)
  const openInvite = useTutorial((s) => s.openInvite)
  const declineInvite = useTutorial((s) => s.declineInvite)
  const start = useTutorial((s) => s.start)

  /*
    Chỉ mời khi trẻ đang thật sự đứng ở màn chơi.

    Bốn điều kiện, và điều kiện nào thiếu cũng đẻ ra một khung nổi chắn ngang
    một việc khác: chắn giữa trận đấu, chắn màn tổng kết, chắn kho đồ, hoặc
    chắn khu vực người lớn của bố mẹ.
  */
  const ready = Boolean(student) && !battle && !summary && screen === 'game' && !active

  useEffect(() => {
    if (!ready || !student) return
    /*
      Hỏi kho nhớ Ở ĐÂY chứ không lúc dựng state.

      `localStorage` không có ở máy chủ, mà Next dựng sẵn trang này ở đó. Hỏi
      trong hiệu ứng thì lượt vẽ đầu tiên ở hai nơi giống hệt nhau, và không có
      khung nào loé lên rồi biến mất.
    */
    if (invitedToTutorial(student.id)) return
    openInvite()
  }, [ready, student, openInvite])

  if (!inviteOpen || !ready || !student) return null

  /** Trả lời "không": đóng lại, và nhớ để lần sau đừng hỏi nữa. */
  const decline = () => {
    markTutorialInvited(student.id)
    declineInvite()
  }

  return (
    <PixelModal title="Con có muốn xem hướng dẫn không?" onClose={decline}>
      <h3 className="pixel-font text-2xl">CHÀO {student.name.toUpperCase()}!</h3>

      <p className="mt-2 text-lg leading-snug">
        Ta chỉ con cách chơi nhé? Có một bãi tập nhỏ: con đi thử một vòng, đánh
        thử một trận với con slime tập sự, chừng ba phút là xong.
      </p>

      <div className="mt-4 grid gap-2">
        {/*
          Nút "có" đứng TRƯỚC và là nút chính - đây là lời mời, không phải một
          câu hỏi trung lập. Nhưng nút "không" cũng là một cái nút đàng hoàng,
          cùng cỡ chạm, không phải một dòng chữ mờ ở góc: một đứa trẻ đã biết
          chơi rồi có quyền đi thẳng vào game mà không phải dò tìm lối ra.
        */}
        <button type="button" onClick={start} className="btn btn-primary text-xl">
          🎓 Có, chỉ con đi!
        </button>
        <button type="button" onClick={decline} className="btn btn-ghost text-lg">
          ▶️ Không, con chơi luôn
        </button>
      </div>

      <p className="mt-3 text-center text-sm opacity-70">
        Đổi ý lúc nào cũng được: bấm ☰ rồi chọn &ldquo;Xem hướng dẫn&rdquo;.
      </p>
    </PixelModal>
  )
}
