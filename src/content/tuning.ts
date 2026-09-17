/**
 * Những con số cân bằng game, gom về một chỗ và sửa được từ trang quản trị.
 *
 * Trước đây chúng nằm rải rác: giờ đếm của trùm trong `engine/battle.ts`, tỉ lệ
 * gặp quái trong `features/world/Overworld.tsx`, máu quái trong
 * `content/bestiary.ts`, số câu mỗi trận trong `store/game.ts`. Muốn chỉnh một
 * con số cho vừa sức một lớp là phải mở mã nguồn và dựng lại app - thầy cô
 * không làm được, mà đó lại chính là người biết lớp mình cần gì.
 *
 * KHÔNG PHẢI ZUSTAND. Kho này phải đọc được từ cả `engine` lẫn `content` - hai
 * tầng cố ý không biết gì về React. Nên nó là một module thường, đọc bằng
 * `getTuning()`, và React nối vào qua `useSyncExternalStore`.
 *
 * Lưu bằng `localStorage` chứ không phải IndexedDB: engine đọc nó trong lúc
 * đang tính toán, không chờ được một lời hứa. Đây cũng là thiết lập của MÁY chứ
 * không phải của từng trẻ - đổi số ở đây là đổi cho mọi hồ sơ trên máy đó.
 */

export interface Tuning {
  // --- Trận đấu ---
  /** Số câu hỏi mỗi trận ở cổng chặng. */
  questionsPerBattle: number
  /** Giờ cho mỗi câu khi đánh trùm cuối, tính bằng giây. */
  bossSeconds: number
  /** Giờ cho mỗi câu khi đánh đầu đàn trong hang. */
  miniBossSeconds: number
  /**
   * Giờ cho mỗi câu khi đánh trùm trong Tháp Trí Tuệ.
   *
   * Gấp hơn trùm vùng đất, vì ở đó việc phải làm nhiều hơn: đọc lại hệ của quái
   * rồi mới chọn phép. Cơn giận còn rút tiếp một phần tư số này.
   */
  towerSeconds: number
  /** Nhân thêm giờ cho lớp 1-2, vì các em còn đánh vần cả đề bài. */
  youngReaderFactor: number

  // --- Sức của quái ---
  /** Nhân vào máu quái. 1 là mặc định; 0.7 cho lớp yếu, 1.3 cho lớp khá. */
  enemyHpScale: number
  /** Nhân vào sát thương quái. */
  enemyAttackScale: number

  // --- Phần thưởng ---
  goldScale: number
  xpScale: number

  // --- Màn đi cảnh ---
  /** Xác suất gặp quái hoang mỗi bước đi vào ô cỏ cao. */
  encounterChance: number
  /** Nhịp đi của đàn quái trên bản đồ, mili giây. */
  monsterStepMs: number
}

export const DEFAULT_TUNING: Tuning = {
  questionsPerBattle: 10,
  bossSeconds: 16,
  miniBossSeconds: 26,
  towerSeconds: 13,
  youngReaderFactor: 1.4,
  enemyHpScale: 1,
  enemyAttackScale: 1,
  goldScale: 1,
  xpScale: 1,
  encounterChance: 0.08,
  monsterStepMs: 900,
}

/**
 * Khoảng cho phép của từng số.
 *
 * Trang quản trị dựng ô nhập từ bảng này, và `sanitise` cũng dùng nó - nên
 * không có đường nào nhét được một con số vô lý vào, kể cả sửa tay localStorage.
 * Một giá trị `0` lọt vào `monsterStepMs` là treo cả trình duyệt.
 */
export const TUNING_RANGE: Record<keyof Tuning, { min: number; max: number; step: number }> = {
  questionsPerBattle: { min: 3, max: 20, step: 1 },
  bossSeconds: { min: 5, max: 120, step: 1 },
  miniBossSeconds: { min: 5, max: 120, step: 1 },
  towerSeconds: { min: 5, max: 120, step: 1 },
  youngReaderFactor: { min: 1, max: 3, step: 0.1 },
  enemyHpScale: { min: 0.3, max: 3, step: 0.1 },
  enemyAttackScale: { min: 0.2, max: 3, step: 0.1 },
  goldScale: { min: 0.5, max: 5, step: 0.5 },
  xpScale: { min: 0.5, max: 5, step: 0.5 },
  encounterChance: { min: 0, max: 0.4, step: 0.01 },
  monsterStepMs: { min: 300, max: 3000, step: 50 },
}

/**
 * Chế độ chuyển động, ĐÈ ĐƯỢC lên cài đặt của hệ điều hành.
 *
 *   system  - theo máy (mặc định, và là cách cư xử đúng)
 *   full    - luôn bật, kể cả khi máy đang tắt hiệu ứng động
 *   reduced - luôn tắt, kể cả khi máy đang bật
 *
 * Vì sao cần: máy tính trường học và máy chạy chế độ tiết kiệm pin thường bị
 * TẮT SẴN hiệu ứng động ở mức hệ điều hành, mà người dùng không hề biết. Với
 * một game cho trẻ con thì hoạt cảnh không phải trang trí - nó là thứ nói cho
 * trẻ biết vừa có chuyện gì xảy ra. Thầy cô phải có đường bật lại mà không
 * phải đi lục Cài đặt của Windows.
 *
 * Mặc định vẫn là `system`: tôn trọng lựa chọn của người dùng cho tới khi họ
 * nói khác đi.
 */
export type MotionMode = 'system' | 'full' | 'reduced'

export const MOTION_MODES: Array<{ value: MotionMode; label: string; hint: string }> = [
  { value: 'system', label: 'Theo máy', hint: 'Nghe theo cài đặt hiệu ứng động của hệ điều hành.' },
  { value: 'full', label: 'Luôn bật', hint: 'Bật hoạt cảnh kể cả khi máy đang tắt hiệu ứng động.' },
  { value: 'reduced', label: 'Luôn tắt', hint: 'Tắt hoạt cảnh kể cả khi máy đang bật.' },
]

const MOTION_KEY = 'hvtt.motion.v1'

function loadMotion(): MotionMode {
  try {
    const raw = localStorage.getItem(MOTION_KEY)
    return raw === 'full' || raw === 'reduced' ? raw : 'system'
  } catch {
    return 'system'
  }
}

let motion: MotionMode = loadMotion()

export function getMotionMode(): MotionMode {
  return motion
}

export function setMotionMode(next: MotionMode): void {
  motion = next
  try {
    localStorage.setItem(MOTION_KEY, next)
  } catch {
    // Không lưu được thì vẫn đổi trong phiên này.
  }
  for (const listener of listeners) listener()
}

const STORAGE_KEY = 'hvtt.tuning.v1'

/** Ép mọi giá trị về đúng khoảng cho phép. Số hỏng thì rơi về mặc định. */
export function sanitise(input: Partial<Tuning> | null | undefined): Tuning {
  const out = { ...DEFAULT_TUNING }
  if (!input) return out

  for (const key of Object.keys(DEFAULT_TUNING) as Array<keyof Tuning>) {
    const value = input[key]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    const range = TUNING_RANGE[key]
    out[key] = Math.min(range.max, Math.max(range.min, value))
  }
  return out
}

function load(): Tuning {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return sanitise(raw ? (JSON.parse(raw) as Partial<Tuning>) : null)
  } catch {
    // Chế độ riêng tư, dữ liệu site bị xoá, JSON hỏng - đều về mặc định, không
    // có gì để báo cho ai cả.
    return { ...DEFAULT_TUNING }
  }
}

let current: Tuning = load()
const listeners = new Set<() => void>()

export function getTuning(): Tuning {
  return current
}

export function setTuning(patch: Partial<Tuning>): void {
  current = sanitise({ ...current, ...patch })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Không lưu được thì vẫn đổi trong phiên này. Mất khi tải lại, không sao.
  }
  for (const listener of listeners) listener()
}

export function resetTuning(): void {
  current = { ...DEFAULT_TUNING }
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // như trên
  }
  for (const listener of listeners) listener()
}

/** Có gì khác mặc định không - trang quản trị dùng để hiện dấu "đã đổi". */
export function changedKeys(): Array<keyof Tuning> {
  return (Object.keys(DEFAULT_TUNING) as Array<keyof Tuning>).filter(
    (key) => current[key] !== DEFAULT_TUNING[key],
  )
}

export function subscribeTuning(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
