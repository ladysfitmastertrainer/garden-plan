/**
 * Kho thiết lập nhận số từ ô nhập của người dùng VÀ từ `localStorage` - tức là
 * từ hai chỗ đều có thể chứa rác. Một `monsterStepMs` bằng 0 lọt vào là
 * `setInterval` chạy điên và treo cả trình duyệt, nên `sanitise` phải là cái
 * chặn cuối cùng chứ không phải một phép lịch sự.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING, TUNING_RANGE, sanitise, type Tuning } from './tuning'

const KEYS = Object.keys(DEFAULT_TUNING) as Array<keyof Tuning>

describe('sanitise', () => {
  it('không có gì thì ra đúng bộ mặc định', () => {
    expect(sanitise(null)).toEqual(DEFAULT_TUNING)
    expect(sanitise(undefined)).toEqual(DEFAULT_TUNING)
    expect(sanitise({})).toEqual(DEFAULT_TUNING)
  })

  it('mọi giá trị mặc định đều nằm trong khoảng cho phép', () => {
    for (const key of KEYS) {
      const range = TUNING_RANGE[key]
      expect(DEFAULT_TUNING[key], `${key} nằm ngoài khoảng của chính nó`).toBeGreaterThanOrEqual(
        range.min,
      )
      expect(DEFAULT_TUNING[key], `${key} nằm ngoài khoảng của chính nó`).toBeLessThanOrEqual(
        range.max,
      )
    }
  })

  it('số quá lớn hay quá nhỏ đều bị kéo về hai đầu khoảng', () => {
    for (const key of KEYS) {
      const range = TUNING_RANGE[key]
      expect(sanitise({ [key]: 1e9 })[key], `${key} không bị chặn trên`).toBe(range.max)
      expect(sanitise({ [key]: -1e9 })[key], `${key} không bị chặn dưới`).toBe(range.min)
    }
  })

  it('rác thì rơi về mặc định chứ không lọt qua', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, '10', null, undefined, {}]) {
      const out = sanitise({ monsterStepMs: bad } as unknown as Partial<Tuning>)
      expect(out.monsterStepMs, `giá trị ${String(bad)} lọt qua`).toBe(
        DEFAULT_TUNING.monsterStepMs,
      )
    }
  })

  it('nhịp đi của đàn quái không bao giờ được xuống 0 - đó là treo trình duyệt', () => {
    expect(sanitise({ monsterStepMs: 0 }).monsterStepMs).toBeGreaterThan(0)
    expect(TUNING_RANGE.monsterStepMs.min).toBeGreaterThan(0)
  })

  it('giữ nguyên số hợp lệ, và không đụng tới các mục khác', () => {
    const out = sanitise({ bossSeconds: 25 })
    expect(out.bossSeconds).toBe(25)
    expect(out.questionsPerBattle).toBe(DEFAULT_TUNING.questionsPerBattle)
  })
})
