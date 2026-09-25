/**
 * Quái vật cho từng môn.
 *
 * Mỗi môn có một "nguyên tố" riêng (xem SUBJECT_ELEMENT) và một bầy quái mang
 * màu sắc của môn đó, để trẻ nhận ra ngay mình đang luyện môn nào.
 *
 * Cân bằng: máu và sát thương tăng dần theo vị trí node trên bản đồ và theo
 * lớp, nhưng sát thương của quái được giữ thấp có chủ ý - trận đấu nên kết thúc
 * vì trẻ trả lời xong, không phải vì trẻ hết máu.
 */

import type { Enemy } from '../engine/battle'
import type { Rng } from '../engine/rng'
import { getTuning } from './tuning'
import type { Grade, Habitat, Subject } from './types'

interface EnemyTemplate {
  name: string
  emoji: string
}

const BESTIARY: Record<Subject, EnemyTemplate[]> = {
  math: [
    { name: 'Slime Con Số', emoji: '🟢' },
    { name: 'Nhện Phép Tính', emoji: '🕷️' },
    { name: 'Gấu Đếm Ngược', emoji: '🐻' },
    { name: 'Rô-bốt Cộng Trừ', emoji: '🤖' },
  ],
  vietnamese: [
    { name: 'Cú Chữ Nghĩa', emoji: '🦉' },
    { name: 'Mực Lem Luốc', emoji: '🦑' },
    { name: 'Vẹt Nói Nhịu', emoji: '🦜' },
    { name: 'Sách Cũ Biết Bay', emoji: '📖' },
  ],
  music: [
    { name: 'Chuông Lạc Nhịp', emoji: '🔔' },
    { name: 'Trống Ương Bướng', emoji: '🥁' },
    { name: 'Sáo Ma Mãnh', emoji: '🪈' },
    { name: 'Mèo Hát Sai Tông', emoji: '🐱' },
  ],
  ethics: [
    { name: 'Bóng Giận Dỗi', emoji: '☁️' },
    { name: 'Quỷ Lười Biếng', emoji: '😈' },
    { name: 'Sương Ích Kỷ', emoji: '🌫️' },
    { name: 'Bóng Tối Dối Trá', emoji: '🌑' },
  ],
}

const BOSSES: Record<Subject, EnemyTemplate> = {
  math: { name: 'Rồng Số Học', emoji: '🐉' },
  vietnamese: { name: 'Phượng Hoàng Ngôn Từ', emoji: '🦅' },
  music: { name: 'Long Vương Thanh Âm', emoji: '🐲' },
  ethics: { name: 'Chúa Tể Bóng Đêm', emoji: '👹' },
}

/**
 * Bầy quái của từng MÔI TRƯỜNG, bốn con mỗi nơi.
 *
 * Thứ tự là hợp đồng với `HABITAT_FAMILY` trong `features/pixel/creatures.ts`,
 * y như bầy của môn: đổi một bên mà quên bên kia là tên một đằng hình một nẻo.
 *
 * Tên vẫn mang chút chữ nghĩa của lớp học ("Cua Đá Đếm Càng", "Khỉ Hỏi Vặn")
 * vì đây vẫn là trận hỏi bài - nhưng CON VẬT là con của nơi ấy.
 */
export const HABITAT_BESTIARY: Record<Habitat, EnemyTemplate[]> = {
  // Lội ra đảo: cá và những thứ sống dưới nước nông.
  sea: [
    { name: 'Cá Nóc Phồng Má', emoji: '🐡' },
    { name: 'Sứa Điện Lấp Lánh', emoji: '🪼' },
    { name: 'Cá Kiếm Nhanh Nhảu', emoji: '🐟' },
    { name: 'Cá Mập Con', emoji: '🦈' },
  ],
  // Trong hang: giáp xác và bò sát, những loài ưa tối và ẩm.
  cave: [
    { name: 'Cua Đá Đếm Càng', emoji: '🦀' },
    { name: 'Tôm Hùm Hang', emoji: '🦞' },
    { name: 'Thằn Lằn Mắt To', emoji: '🦎' },
    { name: 'Rắn Hang Cuộn Tròn', emoji: '🐍' },
  ],
  // Trên tán cây: thú rừng.
  forest: [
    { name: 'Khỉ Hỏi Vặn', emoji: '🐒' },
    { name: 'Sóc Bay Tinh Nghịch', emoji: '🐿️' },
    { name: 'Heo Rừng Húc Bậy', emoji: '🐗' },
    { name: 'Hổ Con Gầm Gừ', emoji: '🐯' },
  ],
  // Miệng núi lửa: những thứ sinh ra từ nham thạch.
  lava: [
    { name: 'Slime Dung Nham', emoji: '🔥' },
    { name: 'Kỳ Nhông Lửa', emoji: '🦎' },
    { name: 'Người Đá Than Hồng', emoji: '🪨' },
    { name: 'Đốm Lửa Lang Thang', emoji: '✨' },
  ],
}

/** Tên nơi chốn của từng môi trường - dùng cho lời chào khi bước vào khu ấy. */
export const HABITAT_PLACE: Record<Habitat, string> = {
  sea: 'Bãi Đảo Nước Nông',
  cave: 'Hang Đá Vọng',
  forest: 'Tán Cây Cổ Thụ',
  lava: 'Miệng Núi Lửa',
}

export interface EnemyRequest {
  subject: Subject
  grade: Grade
  /** Vị trí node trên bản đồ, tính từ 0. */
  nodeIndex: number
  isBoss: boolean
  rng: Rng
  /**
   * Chọn sẵn con thứ mấy trong bầy. Trận ở cổng truyền vào theo số thứ tự chặng
   * để con quái đứng trên bản đồ ĐÚNG LÀ con bước vào trận; bỏ trống thì bốc
   * ngẫu nhiên, dành cho quái hoang gặp dọc đường.
   */
  variant?: number
  /**
   * Môi trường con quái nhảy ra. Có thì lấy con trong bầy của môi trường ấy
   * thay cho bầy của môn - xem `HABITAT_BESTIARY`.
   */
  habitat?: Habitat
}

export function createEnemy({
  subject,
  grade,
  nodeIndex,
  isBoss,
  rng,
  variant: fixedVariant,
  habitat,
}: EnemyRequest): Enemy {
  // Trùm không bao giờ đổi theo môi trường: trùm là của vùng đất, không phải
  // của một góc nào trong nó.
  const wildHabitat = isBoss ? undefined : habitat
  const bestiary = wildHabitat ? HABITAT_BESTIARY[wildHabitat] : BESTIARY[subject]
  const variant = isBoss
    ? 0
    : (fixedVariant ?? rng.int(0, bestiary.length - 1)) % bestiary.length
  const template = isBoss ? BOSSES[subject] : bestiary[variant]!

  // Máu tăng đều để trẻ thấy tiến bộ, nhưng không tăng dốc tới mức trận nào
  // cũng phải trả lời hết 10 câu.
  const baseHp = 60 + nodeIndex * 14 + (grade - 1) * 10

  // Thầy cô chỉnh được bốn hệ số này ở trang quản trị - lớp yếu hạ máu quái
  // xuống, lớp khá nâng lên, không phải sửa mã nguồn.
  const tuning = getTuning()
  const maxHp = Math.max(1, Math.round((isBoss ? baseHp * 1.8 : baseHp) * tuning.enemyHpScale))

  // Sát thương giữ thấp: trẻ sai 4-5 câu vẫn còn cơ hội gỡ.
  const attack = Math.max(
    1,
    Math.round((8 + Math.floor(nodeIndex / 2) + (isBoss ? 4 : 0)) * tuning.enemyAttackScale),
  )

  return {
    id: `${subject}-g${grade}-n${nodeIndex}${isBoss ? '-boss' : ''}`,
    name: isBoss ? `${template.name} ⭐` : template.name,
    emoji: template.emoji,
    // Quái mang nguyên tố của chính môn học đó. Nhờ vậy trẻ luôn đoán được
    // trước mình sắp gặp hệ gì và chuẩn bị phép cho hợp.
    element: subject,
    maxHp,
    attack,
    goldReward: Math.round((isBoss ? 60 + nodeIndex * 5 : 18 + nodeIndex * 3) * tuning.goldScale),
    xpReward: Math.round((isBoss ? 80 + nodeIndex * 6 : 25 + nodeIndex * 4) * tuning.xpScale),
    variant,
    ...(wildHabitat ? { habitat: wildHabitat } : {}),
    isBoss,
  }
}
