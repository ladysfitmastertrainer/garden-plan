/** Kiểu dữ liệu hồ sơ và tiến độ của một học sinh. */

import type { AnswerRecord } from '../engine/battle'
import type { MasteryMap } from '../engine/mastery'
import type { Grade, Subject, Virtue } from '../content/types'

export interface StudentProfile {
  id: string
  name: string
  /** Emoji đại diện - trẻ chưa đọc thạo nhận ra hồ sơ của mình qua hình này. */
  avatar: string
  grade: Grade
  totalXp: number
  gold: number
  /** Id vật phẩm đang mặc (xem `engine/rewards.ts`). */
  equippedItemIds: string[]
  createdAt: number
  lastPlayedAt: number
}

export interface StudentProgress {
  mastery: MasteryMap
  /** Id mọi vật phẩm đã nhặt được. */
  inventory: string[]
  /**
   * Id các thú đã thu phục. Không bắt buộc: hồ sơ lưu từ trước bản cập nhật
   * thú sẽ thiếu trường này, và mọi chỗ đọc đều phải chịu được `undefined`.
   */
  pets?: string[]
  /**
   * Kinh nghiệm của từng thú, theo id. Không bắt buộc vì hồ sơ cũ chưa có -
   * thiếu thì coi như 0, tức thú ở cấp 1.
   */
  petXp?: Record<string, number>
  /**
   * Bộ chiêu trẻ đã sắp để mang ra trận, theo thứ tự.
   *
   * Không bắt buộc: hồ sơ cũ chưa từng chọn gì, và `resolveLoadout` tự lấp đầy
   * từ những phép đội thú đang biết. Số ô nở theo cấp (xem `engine/loadout.ts`),
   * nên danh sách này có thể dài hơn số ô hiện có - phần thừa bị cắt lúc vào
   * trận chứ không bị xoá, để lên cấp là dùng lại được ngay.
   */
  loadout?: string[]
  virtues: Partial<Record<Virtue, number>>
  /**
   * Số chặng đã hoàn thành, theo từng VÙNG ĐẤT - tức từng cặp (môn, lớp).
   * Khoá có dạng `math.g2`.
   *
   * Tách theo lớp chứ không gộp theo môn, vì trẻ đi lại tự do giữa các vùng: một
   * em lớp 3 sang ôn Toán lớp 1 thì tiến độ ở đó phải tính riêng, nếu gộp chung
   * thì bản đồ lớp 1 sẽ hiện đã qua hết trong khi em chưa đánh chặng nào.
   */
  clearedNodes: Record<string, number>
  /**
   * Những tầng Tháp Trí Tuệ đã hạ, khoá dạng `math.g2` y như `clearedNodes`.
   *
   * Tách khỏi `clearedNodes` vì tháp KHÔNG phải một chặng trên bản đồ: nó không
   * có số thứ tự, không mở khoá gì cho chặng sau, và không được tính vào tiến độ
   * của vùng đất. Nhét chung vào đó thì thanh "17/18 chặng" của vùng Toán tự
   * nhiên nhảy lên 18/18 chỉ vì trẻ vừa thắng một con trùm ở nơi khác.
   *
   * Không bắt buộc: hồ sơ lưu từ trước bản cập nhật tháp sẽ thiếu trường này.
   */
  towerCleared?: string[]
  battlesPlayed: number
  battlesWon: number
}

/** Khoá vùng đất dùng thống nhất ở mọi nơi. */
export function regionKey(subject: Subject, grade: number): string {
  return `${subject}.g${grade}`
}

export function emptyProgress(): StudentProgress {
  return {
    mastery: {},
    inventory: [],
    pets: [],
    petXp: {},
    virtues: {},
    clearedNodes: {},
    towerCleared: [],
    battlesPlayed: 0,
    battlesWon: 0,
  }
}

/**
 * Dữ liệu cũ lưu tiến độ theo môn (`math`) chứ không theo vùng (`math.g2`).
 * Chuyển sang dạng mới, gán vào đúng lớp của trẻ.
 */
export function migrateClearedNodes(
  clearedNodes: Record<string, number>,
  grade: number,
): Record<string, number> {
  const migrated: Record<string, number> = {}
  for (const [key, value] of Object.entries(clearedNodes)) {
    migrated[key.includes('.g') ? key : regionKey(key as Subject, grade)] = value
  }
  return migrated
}

/** Một lần trả lời đã ghi nhận, kèm học sinh nào - nguồn cho dashboard phụ huynh. */
export interface StoredAttempt extends AnswerRecord {
  studentId: string
}

/**
 * Cửa duy nhất để UI đọc/ghi dữ liệu.
 *
 * Giai đoạn MVP cài bằng IndexedDB (`local.ts`). Giai đoạn sau cắm Supabase vào
 * đúng interface này, phần game không phải sửa một dòng nào.
 */
export interface Repository {
  listStudents(): Promise<StudentProfile[]>
  createStudent(input: { name: string; avatar: string; grade: Grade }): Promise<StudentProfile>
  saveStudent(student: StudentProfile): Promise<void>
  deleteStudent(studentId: string): Promise<void>

  getProgress(studentId: string): Promise<StudentProgress>
  saveProgress(studentId: string, progress: StudentProgress): Promise<void>

  /** Ghi nhật ký từng câu trả lời - dùng cho màn hình phụ huynh và giáo viên. */
  recordAttempts(attempts: StoredAttempt[]): Promise<void>
  listAttempts(studentId: string, limit?: number): Promise<StoredAttempt[]>
}
