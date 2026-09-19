/**
 * Chuẩn bị một trận PVP từ phía trình duyệt: bộ câu hỏi và chỉ số đội thú.
 *
 * Tách khỏi component vì hai chỗ cùng cần - người thách soạn đề và khai chỉ số,
 * người nhận lời chỉ khai chỉ số - và vì hai việc này không đụng gì tới React.
 */

import { buildTeam } from '../../content/pets'
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
 * Máu và sức đánh mang vào trận, lấy từ đội thú đang có.
 *
 * Đội thú CÓ được tính, nếu không thì cả việc thu phục và nuôi thú chẳng có
 * nghĩa gì ở đấu trường. Nhưng nó chỉ là một hệ số nhân - người quyết định vẫn
 * là người bấm đúng trước. Xem `pvpDamage` ở `server/pvp.ts`.
 */
export function pvpStats(
  student: StudentProfile,
  progress: StudentProgress,
  subject: Subject,
): PvpSideStats {
  const team = buildTeam(progress.pets ?? [], subject, 3, progress.petXp ?? {})
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
  const teamHp = team.reduce((sum, pet) => sum + pet.maxHp, 0)
  const teamPower = team.reduce((sum, pet) => sum + pet.power, 0) / Math.max(1, team.length)

  return {
    // Máu cả đội cộng lại, y như trận đánh quái - thanh máu trong PVP phải đọc
    // ra cùng một con số mà trẻ vẫn quen nhìn.
    maxHp: Math.max(1, Math.round(teamHp)),
    power: Math.round(hero.power * teamPower * 100) / 100,
    /*
      Con đứng đầu đội là con RA SÂN.

      `buildTeam` xếp con cùng hệ với môn lên đầu, nên ở đảo Toán thì con thú
      hệ Số Học của trẻ bước ra - đúng con đang khoẻ nhất trong trận này.
    */
    pet: team[0]?.id ?? null,
  }
}
