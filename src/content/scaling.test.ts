/**
 * Quái mạnh lên theo cấp người chơi.
 *
 * Điều cần giữ không phải một con số mà một TỈ LỆ: số đòn con cần để hạ quái,
 * và số đòn quái cần để hạ con, không bị việc lên cấp xoá mất. Test đo đúng hai
 * tỉ lệ ấy ở nhiều cấp, thay vì chép lại công thức.
 */

import { describe, expect, it } from 'vitest'
import { createEnemy } from './bestiary'
import { createTowerBoss } from './tower'
import { createRng } from '../engine/rng'
import { MAX_LEVEL, enemyScaleForLevel, statsForLevel } from '../engine/rewards'

const enemyAt = (playerLevel: number, isBoss = false) =>
  createEnemy({
    subject: 'math',
    grade: 3,
    nodeIndex: 4,
    isBoss,
    rng: createRng('scale'),
    variant: 1,
    playerLevel,
  })

describe('quái mạnh lên theo cấp người chơi', () => {
  it('cấp 1 thì quái y như công thức gốc - không ai bị đổi gì khi mới chơi', () => {
    expect(enemyScaleForLevel(1)).toEqual({ hp: 1, attack: 1 })
    const plain = createEnemy({ subject: 'math', grade: 3, nodeIndex: 4, isBoss: false, rng: createRng('scale'), variant: 1 })
    expect(enemyAt(1).maxHp).toBe(plain.maxHp)
    expect(enemyAt(1).attack).toBe(plain.attack)
  })

  it('lên cấp thì quái cũng mạnh lên, cả máu lẫn đòn', () => {
    let previous = enemyAt(1)
    for (const level of [5, 10, 20, 35, MAX_LEVEL]) {
      const now = enemyAt(level)
      expect(now.maxHp, `cấp ${level}`).toBeGreaterThan(previous.maxHp)
      expect(now.attack, `cấp ${level}`).toBeGreaterThan(previous.attack)
      previous = now
    }
  })

  it('số đòn để hạ quái và số đòn để hạ con giữ nguyên ở mọi cấp', () => {
    const base = enemyAt(1)
    const baseStats = statsForLevel(1)
    const hitsToWin = base.maxHp / baseStats.power
    const hitsToLose = baseStats.maxHp / base.attack

    for (const level of [2, 8, 15, 30, MAX_LEVEL]) {
      const enemy = enemyAt(level)
      const stats = statsForLevel(level)
      // Lệch vì làm tròn tới số nguyên, không lệch vì công thức: dưới 5%.
      expect(enemy.maxHp / stats.power / hitsToWin, `cấp ${level}`).toBeCloseTo(1, 1)
      expect(stats.maxHp / enemy.attack / hitsToLose, `cấp ${level}`).toBeGreaterThan(0.9)
      expect(stats.maxHp / enemy.attack / hitsToLose, `cấp ${level}`).toBeLessThan(1.1)
    }
  })

  it('cấp trên khung máu đi theo cấp của con, trùm nhỉnh hơn', () => {
    expect(enemyAt(12).level).toBe(12)
    expect(enemyAt(12, true).level).toBe(14)
  })

  it('trùm tháp cũng mạnh lên, kể cả giáp - nếu không cấp cao đánh xuyên giáp như không', () => {
    const low = createTowerBoss('math', 3, 1)
    const high = createTowerBoss('math', 3, 30)
    expect(high.maxHp).toBeGreaterThan(low.maxHp)
    expect(high.attack).toBeGreaterThan(low.attack)
    expect(high.armor!).toBeGreaterThan(low.armor!)
    expect(createTowerBoss('math', 3)).toEqual(low)
  })

  it('cấp ngoài khoảng hợp lệ không làm quái hỏng', () => {
    expect(enemyScaleForLevel(0)).toEqual(enemyScaleForLevel(1))
    expect(enemyScaleForLevel(999)).toEqual(enemyScaleForLevel(MAX_LEVEL))
  })
})
