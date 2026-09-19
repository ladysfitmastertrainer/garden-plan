/**
 * Chuẩn bị một trận PVP từ phía trình duyệt: bộ câu hỏi và chỉ số đội thú.
 *
 * Tách khỏi component vì hai chỗ cùng cần - người thách soạn đề và khai chỉ số,
 * người nhận lời chỉ khai chỉ số - và vì hai việc này không đụng gì tới React.
 */

import { companionOf } from '../../content/pets'
import { equippedSpells } from '../../engine/loadout'
import { contentSource } from '../../content/registry'
import type { Grade, Question, Subject } from '../../content/types'
import { levelFromTotalXp, statsForLevel, findLootItem } from '../../engine/rewards'
import { createRng } from '../../engine/rng'
import { selectQuestions, type SelectionContext } from '../../engine/selector'
import type { MasteryMap } from '../../engine/mastery'
import type { PvpSideStats } from '../../store/pvp'
import type { StudentProfile, StudentProgress } from '../../data/types'

/**
 * Số câu một trận PVP.
 *
 * Ngắn hơn hẳn trận đánh quái. Một trận với bạn phải gọn trong một giờ ra chơi,
 * và quan trọng hơn: bên thua cần được thua NHANH rồi đánh lại, chứ không phải
 * ngồi chịu đựng mười bốn câu khi đã biết mình không gỡ nổi.
 */
export const PVP_QUESTIONS = 7

/**
 * Soạn bộ đề cho một trận.
 *
 * Bốc theo mức thạo của NGƯỜI THÁCH - đây là chỗ duy nhất hơi thiên vị, và nó
 * thiên vị về phía khó: bộ chọn ưu tiên những kỹ năng người ấy đang luyện dở,
 * tức là những câu chính người ấy còn chưa chắc. Bù lại bên kia không phải chờ
 * thêm một vòng thoả thuận đề bài, mà chờ thì lời thách nguội mất.
 */
/**
 * Trọn bộ tham số cho một lời thách đấu.
 *
 * Gói lại ở đây vì giờ có HAI chỗ gửi lời thách: bảng bạn cùng lớp, và hộp
 * thoại hiện ra khi hai đứa trẻ chạm mặt nhau trên bản đồ. Hai chỗ soạn đề
 * theo hai cách khác nhau thì cùng một lời thách lại ra hai trận khác nhau,
 * và không ai phát hiện ra cho tới khi có người thắc mắc vì sao đề dễ hơn.
 */
export function challengeInput(
  student: StudentProfile,
  progress: StudentProgress,
  region: { subject: Subject; grade: Grade },
  opponentId: string,
) {
  return {
    studentId: student.id,
    opponentId,
    subject: region.subject,
    grade: region.grade,
    questions: buildPvpQuestions(student.id, region.subject, region.grade, progress.mastery),
    stats: pvpStats(student, progress, region.subject),
  }
}

export function buildPvpQuestions(
  studentId: string,
  subject: Subject,
  grade: Grade,
  mastery: MasteryMap,
): Question[] {
  const ctx: SelectionContext = {
    subject,
    grade,
    mastery,
    now: Date.now(),
    rng: createRng(`${studentId}-pvp-${Date.now()}`),
    source: contentSource,
    // Không dồn sang nhóm thử thách: đây là cuộc đua tốc độ, không phải bài
    // kiểm tra. Đề quá khó thì cả hai cùng ngồi nghĩ, và cái nhanh tay - thứ
    // duy nhất chế độ này đo - không còn chỗ nào để lộ ra.
    weights: { learning: 40, review: 45, challenge: 15 },
  }
  return selectQuestions(ctx, PVP_QUESTIONS).map((s) => s.question)
}

/**
 * Máu, sức đánh và BỘ CHIÊU mang vào đấu trường - đúng con thú đi theo trẻ.
 *
 * Đấu trường giờ chạy y hệt trận đánh quái: hai con thú đánh lẫn nhau, trả lời
 * đúng thì được chọn chiêu để tung. Nên những con số khai ở đây phải là con số
 * của CÙNG con thú ấy, dựng bằng CÙNG những hàm ấy - lệch một chỗ là cùng một
 * con thú đánh ở hai nơi ra hai kiểu.
 *
 * Bộ chiêu khai lên cả hai id, vì máy bên kia cần vẽ ra chiêu mà bạn mình vừa
 * tung. Máy chủ vẫn kiểm lại từng id (xem `server/pvp.ts`): một chuỗi bất kỳ
 * gửi lên từ trình duyệt đã sửa không được phép thành một cú đánh.
 */
export function pvpStats(
  student: StudentProfile,
  progress: StudentProgress,
  subject: Subject,
): PvpSideStats {
  const pet = companionOf(progress.pets, progress.companion, subject, progress.petXp ?? {})
  const bonus = student.equippedItemIds.reduce(
    (acc, id) => {
      const item = findLootItem(id)
      return {
        bonusHp: acc.bonusHp + (item?.bonus.bonusHp ?? 0),
        bonusPower: acc.bonusPower + (item?.bonus.bonusPower ?? 0),
      }
    },
    { bonusHp: 0, bonusPower: 0 },
  )

  const level = levelFromTotalXp(student.totalXp).level
  const hero = statsForLevel(level, bonus)
  const spells = equippedSpells(pet, progress.petXp?.[pet.id] ?? 0, progress.petLoadout?.[pet.id])

  return {
    // Máu của đúng con thú ấy, y như trận đánh quái - thanh máu trong đấu
    // trường phải đọc ra cùng một con số mà trẻ vẫn quen nhìn.
    maxHp: Math.max(1, Math.round(pet.maxHp)),
    power: Math.round(hero.power * pet.power * 100) / 100,
    pet: pet.id,
    spells: spells.map((spell) => spell.id),
  }
}
