/**
 * Quái theo kịp rồi vượt sức mạnh thật của con.
 *
 * Điều cần giữ không phải một con số mà một TỈ LỆ: số đòn con cần để hạ quái,
 * và số đòn quái cần để hạ con thú. Test mô phỏng đúng một em lên cấp CÙNG con
 * thú lên cấp và tiến hoá - bản trước chỉ theo cấp nhân vật, và một phép đo bỏ
 * qua con thú thì xanh trong khi quái ngoài đời vẫn yếu như bù nhìn.
 */

import { describe, expect, it } from 'vitest'
import { LEVEL_GAP, createEnemy } from './bestiary'
import { PETS } from './pets'
import { createTowerBoss } from './tower'
import { MAX_PET_LEVEL, resolvePet, xpForLevel } from '../engine/pets'
import { createRng } from '../engine/rng'
import { REFERENCE_FIGHTER, enemyScaleFor, statsForLevel, type FighterStrength } from '../engine/rewards'

/** Một em cấp `level`, thú khởi đầu cùng cấp (tối đa cấp thú), có thể đeo thêm đồ. */
function fighterAt(level: number, bonusPower = 0): FighterStrength {
  const pet = resolvePet(PETS[0]!, xpForLevel(Math.min(level, MAX_PET_LEVEL)))
  return { level, power: statsForLevel(level, { bonusPower }).power, petPower: pet.power, petMaxHp: pet.maxHp }
}

const enemyFor = (fighter?: FighterStrength, isBoss = false) =>
  createEnemy({
    subject: 'math',
    grade: 3,
    nodeIndex: 4,
    isBoss,
    rng: createRng('scale'),
    variant: 1,
    ...(fighter ? { fighter } : {}),
  })

/** Số đòn thường để hạ quái, và số đòn quái để hạ thú. */
function hits(fighter: FighterStrength, isBoss = false) {
  const enemy = enemyFor(fighter, isBoss)
  return {
    toWin: enemy.maxHp / (fighter.power * fighter.petPower),
    toLose: fighter.petMaxHp / enemy.attack,
  }
}

describe('quái theo kịp và vượt sức mạnh của con', () => {
  it('quái thường cao hơn con MỘT cấp, trùm cao hơn BA - ở mọi cấp', () => {
    for (const level of [1, 5, 10, 20, 35]) {
      expect(enemyFor(fighterAt(level)).level).toBe(level + LEVEL_GAP.normal)
      expect(enemyFor(fighterAt(level), true).level).toBe(level + LEVEL_GAP.boss)
    }
  })

  it('con mạnh lên - cả cấp, cả thú tiến hoá - thì quái mạnh lên theo, cả máu lẫn đòn', () => {
    let previous = enemyFor(fighterAt(1))
    for (const level of [5, 10, 20, 35, 50]) {
      const now = enemyFor(fighterAt(level))
      expect(now.maxHp, `cấp ${level}`).toBeGreaterThan(previous.maxHp)
      // Đòn quái theo MÁU THÚ, mà thú kịch cấp ở 20 - từ đó máu thú đứng yên
      // nên đòn quái cũng đứng yên. Không bao giờ được tụt xuống.
      expect(now.attack, `cấp ${level}`).toBeGreaterThanOrEqual(previous.attack)
      previous = now
    }
  })

  it('số đòn để hạ quái và để bị hạ GIỮ NGUYÊN khi con lên cấp và thú tiến hoá', () => {
    const start = hits(fighterAt(1))
    for (const level of [5, 10, 20, 30, 50]) {
      const now = hits(fighterAt(level))
      // Lệch chỉ vì làm tròn tới số nguyên.
      expect(now.toWin / start.toWin, `cấp ${level}`).toBeCloseTo(1, 1)
      expect(now.toLose / start.toLose, `cấp ${level}`).toBeGreaterThan(0.9)
      expect(now.toLose / start.toLose, `cấp ${level}`).toBeLessThan(1.1)
    }
  })

  it('đồ đeo cũng được tính - quái không bị đồ xịn đánh bẹp', () => {
    const plain = hits(fighterAt(10))
    const geared = hits(fighterAt(10, 0.5))
    expect(geared.toWin / plain.toWin).toBeCloseTo(1, 1)
  })

  it('quái cao hơn con thì KHÓ HƠN mốc lúc mới chơi, không chỉ ngang bằng', () => {
    // Mốc: bên con lúc mới chơi gặp quái đúng công thức gốc, chưa cộng cấp chênh.
    const base = enemyFor()
    const ref = REFERENCE_FIGHTER
    const baseline = { toWin: base.maxHp / (ref.power * ref.petPower), toLose: ref.petMaxHp / base.attack }
    const normal = hits(fighterAt(12))
    const boss = hits(fighterAt(12), true)
    expect(normal.toWin).toBeGreaterThan(baseline.toWin)
    expect(normal.toLose).toBeLessThan(baseline.toLose)
    // Trùm cao hơn nhiều cấp hơn, nên chênh nhiều hơn.
    expect(enemyScaleFor(fighterAt(12), LEVEL_GAP.boss).hp).toBeGreaterThan(
      enemyScaleFor(fighterAt(12), LEVEL_GAP.normal).hp,
    )
    expect(boss.toWin).toBeGreaterThan(normal.toWin)
  })

  it('không truyền sức mạnh thì quái y như công thức gốc, không mang cấp', () => {
    const plain = enemyFor()
    expect(plain.level).toBeUndefined()
    expect(enemyScaleFor(REFERENCE_FIGHTER, 0)).toEqual({ hp: 1, attack: 1, level: 1 })
  })

  it('trùm tháp cũng theo kịp, cao hơn con bốn cấp, kể cả giáp', () => {
    const low = createTowerBoss('math', 3, fighterAt(1))
    const high = createTowerBoss('math', 3, fighterAt(30))
    expect(high.level).toBe(34)
    expect(high.maxHp).toBeGreaterThan(low.maxHp)
    expect(high.attack).toBeGreaterThan(low.attack)
    expect(high.armor!).toBeGreaterThan(low.armor!)
  })
})
