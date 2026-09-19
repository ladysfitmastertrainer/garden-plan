/**
 * BỐN HIỆU ỨNG, NÓI BẰNG MỘT GIỌNG.
 *
 * Mỗi hiệu ứng của chiêu cuối xuất hiện ở bốn chỗ khác nhau trên màn hình: cái
 * nhãn trên nút chọn chiêu, hoạt cảnh phủ lên con quái lúc nó dính đòn, con dấu
 * nhỏ theo con quái suốt mấy lượt sau, và dòng chữ trong khung diễn biến.
 *
 * Bốn chỗ ấy phải là MỘT thứ trong đầu trẻ. Nếu nút ghi "Trói" mà hoạt cảnh vẽ
 * màu tím còn con dấu vẽ màu xanh thì trẻ không nối được ba thứ ấy với nhau, và
 * hiệu ứng - thứ đắt nhất của cả bản này - trở thành một hiệu ứng trang trí.
 *
 * Nên tên, biểu tượng và MÀU của mỗi hiệu ứng khai đúng một lần, ở đây.
 *
 * Màu chọn theo thứ trẻ đã biết từ đời thật, không theo bảng màu của game: lửa
 * cam, băng xanh nhạt, dây thừng nâu, hố đen tím. Một đứa bé sáu tuổi đoán được
 * "cái màu cam đang cháy" trước khi kịp đọc chữ.
 */

import type { EffectKind } from '../../engine/pets'

export interface EffectUi {
  /** Tên gọi, đúng một hoặc hai chữ để lọt vào một cái nhãn nhỏ. */
  label: string
  icon: string
  /** Màu chính - viền hoạt cảnh, nền con dấu. */
  color: string
  /** Màu nền nhạt, để chữ sẫm đọc được trên nó. */
  tint: string
  /** Một câu cho trẻ biết nó SẼ LÀM GÌ, hiện trên nút chọn chiêu. */
  hint: string
}

export const EFFECT_UI: Record<EffectKind, EffectUi> = {
  burn: {
    label: 'Cháy',
    icon: '🔥',
    color: '#e2584d',
    tint: '#ffd9a8',
    hint: 'Quái mất máu thêm 3 lượt',
  },
  freeze: {
    label: 'Đóng băng',
    icon: '🧊',
    color: '#3a9ac6',
    tint: '#cdeaf7',
    hint: 'Quái mất lượt đánh tới',
  },
  bind: {
    label: 'Trói',
    icon: '🪢',
    color: '#8a5a2b',
    tint: '#f0dcc0',
    hint: 'Đòn của quái yếu đi một nửa',
  },
  drain: {
    label: 'Hút',
    icon: '🌀',
    color: '#7c5cd6',
    tint: '#ddd4f7',
    hint: 'Hút máu quái về cho con',
  },
}
