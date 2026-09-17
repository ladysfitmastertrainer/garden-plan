/** Trạng thái điều hướng cấp cao. Tách riêng để cả bản đồ lẫn App cùng đọc được. */

import { create } from 'zustand'

import type { Grade, Subject } from '../content/types'

/**
 * Màn hình cấp cao đang mở.
 *
 * 'profiles' là màn chọn hồ sơ trẻ. Trước đây nó không phải một giá trị ở đây mà
 * là hệ quả của việc CHƯA chọn hồ sơ nào - hợp lý với phụ huynh, nhưng giáo viên
 * thì gần như không bao giờ có hồ sơ trẻ của riêng mình, nên họ mắc kẹt vĩnh
 * viễn ở màn ấy. Giờ nó là một nơi đi tới được, chứ không phải một ngõ cụt rơi
 * vào. Xem `GameShell`.
 */
export type Screen = 'game' | 'profiles' | 'dashboard' | 'inventory'

/** Vùng đất đang mở. `null` nghĩa là đang đứng ở bản đồ thế giới. */
export interface Region {
  subject: Subject
  grade: Grade
}

export function regionKey(region: Region): string {
  return `${region.subject}-g${region.grade}`
}

interface UiState {
  screen: Screen
  /**
   * Đã qua cổng kiểm tra của người lớn chưa. Reset mỗi lần mở lại app - đây là
   * rào cản để trẻ không tự vào xem số liệu, không phải cơ chế bảo mật.
   */
  adultUnlocked: boolean
  muted: boolean
  /**
   * Nhạc nền đang bật hay tắt - CÔNG TẮC RIÊNG, không chung với `muted`.
   *
   * Hai thứ này bị tắt vì hai lý do khác nhau. `muted` tắt cả tiếng game, gần
   * như luôn là vì đang ở chỗ không được phát ra tiếng. Nhạc nền thì bị tắt
   * ngay cả khi tiếng game vẫn cần: một lớp học bật tiếng trả lời đúng cho cả
   * lớp nghe, nhưng ba mươi cái máy cùng phát một bản nhạc thì thành ồn.
   *
   * Không nhớ qua lần mở app sau, giống `muted`: mỗi buổi học một hoàn cảnh.
   */
  musicOn: boolean
  /**
   * Trẻ đã tắt lời nhắc xoay ngang máy chưa.
   *
   * Reset mỗi lần mở lại app, giống `adultUnlocked`: nhắc một lần mỗi phiên là
   * đủ, mà nhắc lại ở phiên sau cũng không phiền - có khi hôm nay trẻ cầm máy
   * kiểu khác.
   */
  rotateHintDismissed: boolean
  /**
   * Lời mời cài app đang hiện.
   *
   * Có mặt ở đây chỉ để lời nhắc xoay máy biết đường nhường chỗ: hai dải xếp
   * chồng nhau ăn gần một phần năm màn hình điện thoại, mà dải trên đã hứa "tự
   * nằm ngang" rồi nên dải dưới hoá thừa. Một lời nhắc một lúc là đủ với trẻ sáu
   * tuổi.
   */
  installInviteOpen: boolean

  /**
   * Vùng đất đang mở và chỗ nhân vật đang đứng trong từng vùng.
   *
   * PHẢI nằm ở đây chứ không phải trong state của màn bản đồ: lúc vào trận, App
   * thay `MapScreen` bằng `BattleScreen`, nên mọi state cục bộ của màn bản đồ bị
   * xoá sạch. Đánh xong một con quái là trẻ bị ném ngược ra bản đồ thế giới và
   * phải đi bộ lại từ đầu vùng - trên bản đồ 80 ô thì đó là hình phạt, không
   * phải trò chơi.
   */
  region: Region | null
  /**
   * Vùng đất trẻ VỪA Ở TRONG, kể cả khi đã quay ra bản đồ thế giới.
   *
   * Khác `region` ở chỗ nó KHÔNG bị xoá lúc trẻ đi ra: bản đồ thế giới cần biết
   * cắm cái ghim "con đang ở đây" lên hòn đảo nào, mà lúc đó `region` đã là null
   * rồi - nếu không thì chẳng còn gì để hiện bản đồ thế giới cả.
   */
  lastRegion: Region | null
  /** Ô đang đứng của từng vùng, theo `regionKey`. */
  overworldPos: Record<string, { x: number; y: number }>

  go: (screen: Screen) => void
  setInstallInviteOpen: (open: boolean) => void
  unlockAdult: () => void
  setMuted: (muted: boolean) => void
  setMusicOn: (on: boolean) => void
  dismissRotateHint: () => void
  enterRegion: (region: Region | null) => void
  rememberPos: (key: string, pos: { x: number; y: number }) => void
}

export const useUi = create<UiState>((set) => ({
  screen: 'game',
  adultUnlocked: false,
  muted: false,
  musicOn: true,
  rotateHintDismissed: false,
  installInviteOpen: false,
  region: null,
  lastRegion: null,
  overworldPos: {},

  go: (screen) => set({ screen }),
  setInstallInviteOpen: (installInviteOpen) => set({ installInviteOpen }),
  unlockAdult: () => set({ adultUnlocked: true }),
  setMuted: (muted) => set({ muted }),
  setMusicOn: (musicOn) => set({ musicOn }),
  dismissRotateHint: () => set({ rotateHintDismissed: true }),
  enterRegion: (region) => set(region ? { region, lastRegion: region } : { region }),
  rememberPos: (key, pos) =>
    set((state) => ({ overworldPos: { ...state.overworldPos, [key]: pos } })),
}))
