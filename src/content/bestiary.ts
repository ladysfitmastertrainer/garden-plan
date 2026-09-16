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
import type { Grade, Subject } from './types'

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
}

export function createEnemy({
  subject,
  grade,
  nodeIndex,
  isBoss,
  rng,
  variant: fixedVariant,
}: EnemyRequest): Enemy {
  const bestiary = BESTIARY[subject]
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
    isBoss,
  }
}
