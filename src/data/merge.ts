/**
 * Hợp nhất dữ liệu giữa máy và server.
 *
 * Tình huống thật: trẻ chơi offline ở nhà trên máy tính bảng, hôm sau chơi ở
 * lớp trên máy khác, rồi máy tính bảng mới lên mạng. Hai bên đều có dữ liệu mới.
 *
 * Quy tắc: hợp nhất theo TỪNG KỸ NĂNG chứ không lấy nguyên cục một bên. Bản ghi
 * nào được làm gần đây hơn (`lastSeenAt`) thì thắng. Riêng các con số chỉ tăng
 * (số lần làm, số câu đúng, vàng, kinh nghiệm, số trận) thì lấy giá trị lớn hơn
 * để công sức của trẻ không bao giờ bị nuốt mất.
 *
 * Toàn bộ file là hàm thuần, test được không cần mạng.
 */

import type { SkillMastery } from '../engine/mastery'
import type { StudentProfile, StudentProgress } from './types'


export function mergeSkillMastery(local: SkillMastery, remote: SkillMastery): SkillMastery {
  // Bản ghi mới hơn quyết định trạng thái học tập hiện tại (mức thạo, hộp, lịch ôn).
  const newer = remote.lastSeenAt > local.lastSeenAt ? remote : local

  return {
    ...newer,
    // Các con số tích luỹ thì cộng dồn theo kiểu "không bao giờ giảm".
    attempts: Math.max(local.attempts, remote.attempts),
    correct: Math.max(local.correct, remote.correct),
    lastSeenAt: Math.max(local.lastSeenAt, remote.lastSeenAt),
  }
}

export type MasteryMap = Record<string, SkillMastery>

export function mergeMasteryMaps(local: MasteryMap, remote: MasteryMap): MasteryMap {
  const merged: MasteryMap = { ...local }
  for (const [skillId, remoteEntry] of Object.entries(remote)) {
    const localEntry = merged[skillId]
    merged[skillId] = localEntry ? mergeSkillMastery(localEntry, remoteEntry) : remoteEntry
  }
  return merged
}

export function mergeProgress(local: StudentProgress, remote: StudentProgress): StudentProgress {
  // Gộp theo HỢP của hai tập khoá: mỗi bên có thể đã đi những vùng bên kia chưa
  // biết tới, nên không thể chỉ duyệt khoá của một bên.
  const clearedNodes: Record<string, number> = {}
  for (const key of new Set([
    ...Object.keys(local.clearedNodes),
    ...Object.keys(remote.clearedNodes),
  ])) {
    // Đã mở khoá chặng nào rồi thì không bao giờ khoá lại.
    clearedNodes[key] = Math.max(local.clearedNodes[key] ?? 0, remote.clearedNodes[key] ?? 0)
  }

  const virtues: StudentProgress['virtues'] = { ...local.virtues }
  for (const [virtue, count] of Object.entries(remote.virtues)) {
    const key = virtue as keyof StudentProgress['virtues']
    virtues[key] = Math.max(virtues[key] ?? 0, count ?? 0)
  }

  return {
    mastery: mergeMasteryMaps(local.mastery, remote.mastery),
    // Vật phẩm là tập hợp: gộp lại, không trùng lặp.
    inventory: [...new Set([...local.inventory, ...remote.inventory])],
    virtues,
    clearedNodes,
    battlesPlayed: Math.max(local.battlesPlayed, remote.battlesPlayed),
    battlesWon: Math.max(local.battlesWon, remote.battlesWon),
  }
}

export function mergeStudent(local: StudentProfile, remote: StudentProfile): StudentProfile {
  // Hồ sơ nào chơi gần đây hơn thì quyết định tên, ảnh đại diện, lớp, trang bị.
  const newer = remote.lastPlayedAt > local.lastPlayedAt ? remote : local

  return {
    ...newer,
    gold: Math.max(local.gold, remote.gold),
    totalXp: Math.max(local.totalXp, remote.totalXp),
    equippedItemIds: [...new Set([...local.equippedItemIds, ...remote.equippedItemIds])],
    createdAt: Math.min(local.createdAt, remote.createdAt),
    lastPlayedAt: Math.max(local.lastPlayedAt, remote.lastPlayedAt),
  }
}
