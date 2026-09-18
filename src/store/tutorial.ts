/**
 * Bàn hướng dẫn đang mở tới đâu.
 *
 * Kho riêng chứ không nhét vào `store/ui.ts`, vì nó có một vòng đời khác hẳn:
 * `ui` giữ chỗ trẻ đang đứng trong thế giới game, còn cái này giữ chỗ trẻ đang
 * đứng trong một BÀI HỌC VỀ game - nó bắt đầu trước khi trẻ tới bản đồ và kết
 * thúc trước khi trẻ thật sự chơi.
 *
 * Nó cũng phải sống lâu hơn cả màn hình hướng dẫn. Trận tập chiếm trọn màn hình
 * bằng đúng `BattleScreen` thật (xem `GameShell`), nên `TutorialScreen` bị gỡ
 * khỏi cây trong suốt trận; mọi state cục bộ của nó sẽ mất theo. Ở đây thì
 * không: đánh xong quay ra, bàn hướng dẫn đi tiếp từ đúng chỗ đã dừng.
 */

import { create } from 'zustand'

/**
 * Các chặng của bàn hướng dẫn.
 *
 * 'battle' KHÔNG có màn hình riêng - nó là chặng mà màn trận thật chiếm chỗ.
 * Giữ tên chặng ở đây để người dẫn biết mình đang nói trong lúc nào, và để
 * `closeBattle` biết đưa trẻ về đâu khi trận tập khép lại.
 */
export type TutorialStep = 'welcome' | 'walk' | 'battle' | 'handbook'

interface TutorialState {
  /** Bàn hướng dẫn đang chạy. Sai thì mọi thứ ở đây im lặng hoàn toàn. */
  active: boolean
  step: TutorialStep
  /**
   * Lời mời hai lựa chọn đang hiện.
   *
   * Tách khỏi `active`: lúc đang hỏi thì bàn hướng dẫn CHƯA chạy, và trẻ vẫn
   * đang đứng trên bản đồ của mình. Gộp hai cờ vào một thì câu hỏi "con có muốn
   * xem không" đã tự trả lời hộ trẻ là có.
   */
  inviteOpen: boolean

  /** Mở lời mời hai lựa chọn. */
  openInvite: () => void
  /** Trẻ chọn "không" - đóng lời mời, mọi thứ diễn ra như bình thường. */
  declineInvite: () => void
  /** Bắt đầu bàn hướng dẫn, từ đầu. Dùng cho cả lời mời lẫn lối vào trong ngăn kéo. */
  start: () => void
  goTo: (step: TutorialStep) => void
  /** Đóng bàn hướng dẫn, dù đang dở chặng nào. */
  finish: () => void
}

export const useTutorial = create<TutorialState>((set) => ({
  active: false,
  step: 'welcome',
  inviteOpen: false,

  openInvite: () => set({ inviteOpen: true }),
  declineInvite: () => set({ inviteOpen: false }),
  start: () => set({ active: true, step: 'welcome', inviteOpen: false }),
  goTo: (step) => set({ step }),
  finish: () => set({ active: false, step: 'welcome', inviteOpen: false }),
}))
