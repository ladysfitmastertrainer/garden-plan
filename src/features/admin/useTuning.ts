/**
 * Nối kho thiết lập (một module thường, không phải zustand) vào React.
 *
 * `useSyncExternalStore` là cách đúng cho một kho nằm ngoài React: nó tự lo
 * chuyện đọc rách nửa chừng khi React render đồng thời, mà một `useState` +
 * `useEffect` viết tay thì không.
 */

import { useSyncExternalStore } from 'react'
import { contentRevision, subscribeCustomContent } from '../../content/custom'
import {
  getMotionMode,
  getTuning,
  subscribeTuning,
  type MotionMode,
  type Tuning,
} from '../../content/tuning'

export function useTuning(): Tuning {
  return useSyncExternalStore(subscribeTuning, getTuning, getTuning)
}

export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribeTuning, getMotionMode, getMotionMode)
}

/**
 * Kho nội dung tự soạn. Cùng lý do dùng `useSyncExternalStore` như trên.
 *
 * Trả về SỐ LẦN SỬA chứ không trả về cả kho - xem `contentRevision`. Màn hình
 * dùng con số này làm khoá để tính lại danh sách sau mỗi lần sửa.
 */
export function useCustomContentVersion(): number {
  return useSyncExternalStore(subscribeCustomContent, contentRevision, contentRevision)
}
