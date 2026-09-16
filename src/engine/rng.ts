/**
 * Bộ sinh số ngẫu nhiên có hạt giống (seeded PRNG).
 *
 * Dùng thay cho Math.random ở mọi nơi trong engine và các generator câu hỏi, vì:
 *  - test tất định: cùng seed cho ra cùng kết quả, không có test chập chờn;
 *  - tái lập được: khi trẻ báo "câu này sai", ta dựng lại đúng câu đó từ seed.
 */

export interface Rng {
  /** Số thực trong [0, 1). */
  next(): number
  /** Số nguyên trong [min, max] - bao gồm cả hai đầu. */
  int(min: number, max: number): number
  /** Chọn ngẫu nhiên một phần tử. Ném lỗi nếu mảng rỗng. */
  pick<T>(items: readonly T[]): T
  /** Chọn n phần tử khác nhau (không lặp). Trả về ít hơn n nếu mảng ngắn. */
  sample<T>(items: readonly T[], n: number): T[]
  /** Trả về bản sao đã xáo trộn - không thay đổi mảng gốc. */
  shuffle<T>(items: readonly T[]): T[]
  /** true với xác suất p (0..1). */
  chance(p: number): boolean
  /** Chọn theo trọng số. Trọng số âm bị coi là 0. */
  weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T
}

/**
 * mulberry32 - PRNG 32-bit nhỏ gọn, chất lượng phân phối đủ tốt cho game.
 * Không dùng cho mục đích mật mã.
 */
export function createRng(seed: number | string): Rng {
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number => {
    if (max < min) [min, max] = [max, min]
    return min + Math.floor(next() * (max - min + 1))
  }

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('rng.pick: mảng rỗng')
    return items[int(0, items.length - 1)]!
  }

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i)
      ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
    }
    return copy
  }

  const sample = <T,>(items: readonly T[], n: number): T[] => shuffle(items).slice(0, n)

  const chance = (p: number): boolean => next() < p

  const weighted = <T,>(entries: ReadonlyArray<readonly [T, number]>): T => {
    if (entries.length === 0) throw new Error('rng.weighted: không có lựa chọn nào')
    const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0)
    if (total <= 0) return entries[0]![0]
    let roll = next() * total
    for (const [value, weight] of entries) {
      roll -= Math.max(0, weight)
      if (roll < 0) return value
    }
    return entries[entries.length - 1]![0]
  }

  return { next, int, pick, sample, shuffle, chance, weighted }
}

/** FNV-1a - biến chuỗi seed thành số 32-bit. */
function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
