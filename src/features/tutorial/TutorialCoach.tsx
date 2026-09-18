'use client'

/**
 * Người dẫn, dưới dạng một DẢI CHỮ ở đầu màn hình.
 *
 * Nó phải là một dải chứ không phải một khung nổi, vì nó nói CHỒNG LÊN những
 * màn hình không thuộc về bàn hướng dẫn: trận tập dùng đúng `BattleScreen` thật
 * và màn tổng kết dùng đúng `BattleSummaryScreen` thật. Một khung nổi đè lên
 * đó sẽ che mất chính thứ nó đang chỉ, và tệ hơn, trẻ phải đóng nó lại mới
 * chơi tiếp được - tức là mỗi lời chỉ dẫn lại thêm một cú chạm.
 *
 * Nằm cùng chỗ với lời mời cài app và lời nhắc xoay máy: một ô trong CỘT CO
 * GIÃN của `app-shell`, ngoài `Screen`. Nhờ vậy nó có mặt ở mọi màn mà không
 * màn nào phải tự lo cho nó, và màn chơi bên dưới tự co lại đúng bằng phần còn
 * thừa - xem ghi chú ở `GameShell`.
 */

import { battleCoach } from '../../content/tutorial'
import { markTutorialInvited } from '../../shell/tutorial-seen'
import { useGame } from '../../store/game'
import { useTutorial } from '../../store/tutorial'

export function TutorialCoach() {
  const active = useTutorial((s) => s.active)
  const step = useTutorial((s) => s.step)
  const finish = useTutorial((s) => s.finish)
  const battle = useGame((s) => s.battle)
  const summary = useGame((s) => s.summary)
  const student = useGame((s) => s.student)

  if (!active) return null

  const line = coachLine(step, battle, summary !== null)
  if (line === null) return null

  return (
    <div
      className="pixel-ui flex flex-wrap items-center gap-2 px-3 py-2"
      style={{ background: '#fff3c4', borderBottom: '4px solid #1b2432' }}
      /*
        `role="status"` chứ không phải `alert`: lời chỉ dẫn đổi theo từng pha
        của trận, và một `alert` sẽ cắt ngang trình đọc màn hình ở mỗi lần đổi -
        kể cả lúc nó đang đọc dở đề bài.
      */
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        🎓
      </span>

      <p className="min-w-0 flex-1 text-sm font-bold leading-snug">{line}</p>

      <button
        type="button"
        onClick={() => {
          if (student) markTutorialInvited(student.id)
          finish()
          /*
            Bỏ qua GIỮA TRẬN TẬP thì bỏ luôn cả trận.

            Thiếu dòng này thì "Bỏ qua" là một lời hứa nửa vời: bàn hướng dẫn
            tắt, dải chữ này biến mất, nhưng trận đấu vẫn đứng nguyên đó chiếm
            cả màn hình - và màn trận không có lối ra nào ngoài việc đánh cho
            xong. Trẻ bấm "bỏ qua" mà vẫn phải đánh nốt mười câu.

            Bỏ ngang một trận tập không mất gì của ai: nó vốn đã không ghi mức
            thạo, không cộng vàng, không đếm vào số trận (xem `battleKind` bằng
            'tutorial' trong `store/game.ts`). Với một trận THẬT thì dòng này sẽ
            là chuyện khác hẳn - nhưng dải chữ này chỉ có mặt ở bàn hướng dẫn.
          */
          if (battle || summary) {
            useGame.setState({
              battle: null,
              summary: null,
              battleNode: null,
              battleSubject: null,
              battleGrade: null,
              queue: [],
              queueIndex: 0,
            })
          }
        }}
        className="shrink-0 px-3 text-sm font-bold underline"
        // Cùng ngưỡng 44px với hai dải nhắc kia: nhỏ thì được, nhỏ hơn ngón tay
        // trẻ con thì không.
        style={{ minHeight: 44 }}
      >
        Bỏ qua
      </button>
    </div>
  )
}

/**
 * Câu người dẫn đang nói, hoặc `null` nếu lúc này không cần nói gì.
 *
 * `null` ở hai chặng có màn hình riêng - lời chào và sổ tay - vì ở đó chữ đã
 * nằm ngay giữa màn hình rồi, và một dải nhắc lại phía trên chỉ lấy mất chỗ.
 */
function coachLine(
  step: string,
  battle: ReturnType<typeof useGame.getState>['battle'],
  hasSummary: boolean,
): string | null {
  if (step === 'walk') return 'Bấm mũi tên để đi tới chỗ con quái.'
  if (step !== 'battle') return null

  // Màn tổng kết: hỏi TRƯỚC khi hỏi tới trận, vì lúc này `battle` đã bị xoá.
  if (hasSummary) return 'Đây là bảng phần thưởng sau mỗi trận. Bấm "Về bản đồ" để đi tiếp.'
  if (!battle) return null

  return battleCoach(battle.phase, battle.stance, battle.enemy.name)
}
