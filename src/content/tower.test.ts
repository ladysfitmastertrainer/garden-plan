/**
 * Tháp Trí Tuệ.
 *
 * Bốn con trùm ở đây phải khó hơn trùm vùng đất BẰNG CƠ CHẾ, không bằng máu.
 * Toàn bộ tệp này tồn tại để giữ đúng câu ấy: nếu một ngày nào đó ai đó gỡ giáp
 * hoặc gỡ việc đổi hệ và chỉ nhân máu lên cho đủ khó, test sẽ đỏ.
 */

import { describe, expect, it } from 'vitest'
import {
  TOWER_FLOORS,
  TOWER_QUESTIONS,
  TOWER_SUBJECTS,
  createTowerBoss,
  towerFloor,
  towerGrades,
  validateTower,
} from './tower'
import { createEnemy } from './bestiary'
import { SUBJECTS, type Grade, type Subject } from './types'
import { createRng } from '../engine/rng'
import {
  advance,
  beginAttack,
  beginDefend,
  castSpell,
  createBattle,
  enemyAttackOf,
  nextEnemyElement,
  submitAnswer,
  timeUp,
  type BattleConfig,
  type BattleState,
} from '../engine/battle'
import type { Pet, Spell } from '../engine/pets'
import { numericQuestion } from '../engine/test-fixtures'

const NOW = 1_700_000_000_000

const pet = (id: string, element: Subject, maxHp = 60, power = 1): Pet => ({
  id,
  name: id,
  element,
  sprite: 'slime',
  maxHp,
  power,
  spellIds: [],
  evolutions: [],
})

const spell = (element: Subject): Spell => ({
  id: `p-${element}`,
  name: element,
  tier: 1,
  element,
  power: 1,
  flavour: 'tung một đòn',
})

/**
 * Trận trong tháp, dựng từ đúng con trùm thật, và đã bấm "Tấn công".
 *
 * Từ bản có hai lượt, trận mở màn ở pha chờ - màn hình chỉ có sân đấu và một
 * nút. Mọi test trong tệp này nói về đòn đánh và về luật riêng của trùm tháp,
 * không nói về pha chờ, nên chúng bắt đầu ở đúng chỗ chúng cần.
 */
function towerBattle(subject: Subject = 'math', grade: Grade = 3, overrides: Partial<BattleConfig> = {}) {
  return beginAttack(
    createBattle(
    {
      enemy: createTowerBoss(subject, grade),
      player: { maxHp: 60, power: 1 },
      pet: pet('pet-math', 'math'),
      maxQuestions: TOWER_QUESTIONS,
      timeLimitMs: 13_000,
      ...overrides,
    },
      numericQuestion,
      NOW,
    ),
    NOW,
  )
}

const answerRight = (s: BattleState, ms = 6_000) =>
  submitAnswer(s, { kind: 'numeric', value: 7 }, s.questionShownAt + ms)
const answerWrong = (s: BattleState, ms = 6_000) =>
  submitAnswer(s, { kind: 'numeric', value: 99 }, s.questionShownAt + ms)
const hit = (s: BattleState, element: Subject) => castSpell(answerRight(s), spell(element), NOW)

/**
 * TRỌN MỘT VÒNG: con ra đòn, đỡ được đòn của quái, rồi lại tới lượt con.
 *
 * Từ bản có hai lượt, một vòng đi qua hai lần `advance` chứ không phải một -
 * và quái chỉ đổi hệ ở đầu lượt của con. Gọi `advance` một lần rồi đọc
 * `enemyElement` là đọc đúng vào giữa lượt của quái, lúc hệ chưa kịp đổi.
 */
const round = (s: BattleState, element: Subject): BattleState =>
  beginAttack(
    advance(
      answerRight(beginDefend(advance(hit(s, element), numericQuestion, NOW), NOW)),
      numericQuestion,
      NOW,
    ),
    NOW,
  )

describe('bản khai của tháp', () => {
  it('đủ bốn tầng, mỗi môn một tầng, không tầng nào trùng số', () => {
    expect(validateTower()).toEqual([])
    expect(TOWER_FLOORS).toHaveLength(SUBJECTS.length)
    expect(TOWER_SUBJECTS).toHaveLength(SUBJECTS.length)
  })

  it('mỗi môn tra ra đúng tầng của mình', () => {
    for (const subject of SUBJECTS) {
      expect(towerFloor(subject).subject).toBe(subject)
    }
  })

  it('đề bốc qua lớp hiện tại và hai lớp dưới, không bao giờ vượt lên trên', () => {
    expect(towerGrades(1)).toEqual([1])
    expect(towerGrades(2)).toEqual([1, 2])
    expect(towerGrades(5)).toEqual([3, 4, 5])
    for (const g of [1, 2, 3, 4, 5] as Grade[]) {
      expect(Math.max(...towerGrades(g))).toBe(g)
      expect(Math.min(...towerGrades(g))).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('trùm tháp khó hơn trùm vùng đất BẰNG CƠ CHẾ, không bằng máu', () => {
  const boss = (grade: Grade) =>
    createEnemy({
      subject: 'math',
      grade,
      // Chặng cuối của một vùng - con trùm khoẻ nhất mà bản đồ có.
      nodeIndex: 18,
      isBoss: true,
      rng: createRng('so-sanh'),
    })

  it('có đủ bốn nét mà trùm vùng đất KHÔNG có', () => {
    const tower = createTowerBoss('math', 3)
    const region = boss(3)

    // Đây là danh sách kiểm: mất nét nào thì trận trong tháp tụt về đúng một
    // trận trùm dài hơn, và cả ý tưởng của tính năng này biến mất.
    expect(tower.armor, 'thiếu giáp').toBeGreaterThan(0)
    expect(tower.shiftEvery, 'không đổi hệ').toBeGreaterThan(0)
    expect(tower.regenOnMiss, 'không hút máu khi trẻ sai').toBeGreaterThan(0)
    expect(tower.enrageAt, 'không nổi giận').toBeGreaterThan(0)
    expect(tower.isTower).toBe(true)

    expect(region.armor).toBeUndefined()
    expect(region.shiftEvery).toBeUndefined()
    expect(region.regenOnMiss).toBeUndefined()
    expect(region.enrageAt).toBeUndefined()
  })

  it('máu có trâu hơn, nhưng KHÔNG trâu tới mức trận chỉ dài ra', () => {
    // Trận trong tháp dài gấp 1,4 lần (14 câu so với 10), nên máu được phép dày
    // hơn theo. Vượt quá ba lần thì cái dày ấy không còn là để trận đủ chỗ cho
    // bốn cơ chế diễn ra nữa - nó thành chính cái độ khó, và đó là thứ phải tránh.
    for (const grade of [1, 3, 5] as Grade[]) {
      const ratio = createTowerBoss('math', grade).maxHp / boss(grade).maxHp
      expect(ratio, `lớp ${grade}`).toBeGreaterThan(1)
      expect(ratio, `lớp ${grade}: máu trâu quá, đang lười`).toBeLessThan(3)
    }
  })
})

describe('giáp: chọn sai hệ thì gần như không xuyên nổi', () => {
  it('giáp trừ SAU khi nhân hệ số, nên nó ăn đòn sai hệ mà chỉ sứt đòn khắc chế', () => {
    const start = towerBattle('math', 3)
    // Ánh Sáng khắc Số Học; Ngôn Từ bị Số Học khắc lại.
    const strong = hit(start, 'ethics').lastSpell!.damage
    const weak = hit(start, 'vietnamese').lastSpell!.damage

    expect(strong).toBeGreaterThan(weak)
    // Không có giáp thì tỉ lệ này là 1,5 / 0,7 ≈ 2,1. Giáp phải đẩy nó lên hẳn -
    // đó chính là thứ biến "nên chọn đúng hệ" thành "phải chọn đúng hệ".
    expect(strong / weak).toBeGreaterThan(4)
  })

  it('đòn sai hệ vẫn gây ít nhất 1 sát thương - không đòn nào của trẻ là vô ích', () => {
    const s = towerBattle('math', 5)
    expect(hit(s, 'vietnamese').lastSpell!.damage).toBeGreaterThanOrEqual(1)
  })

  it('nói ra rằng giáp vừa chặn mất bao nhiêu', () => {
    // Bị chặn mà không ai nói thì trẻ chỉ thấy "phép của mình yếu", và sẽ không
    // bao giờ tự nghĩ ra rằng mình nên đổi hệ.
    const s = hit(towerBattle('math', 3), 'vietnamese')
    expect(s.log.some((line) => line.includes('Giáp chặn'))).toBe(true)
  })
})

describe('đổi hệ: cả trận không còn một nước đi đúng duy nhất', () => {
  it('đi theo đúng vòng khắc chế, không bốc ngẫu nhiên', () => {
    const s = towerBattle('math', 3)
    expect(s.enemyElement).toBe('math')
    expect(nextEnemyElement(s)).toBe('vietnamese')
    expect(nextEnemyElement({ ...s, enemyElement: 'ethics' })).toBe('math')
  })

  it('đổi hệ đúng nhịp `shiftEvery`, và đổi TRƯỚC khi câu mới hiện ra', () => {
    let s = towerBattle('math', 3)
    const seen: string[] = [s.enemyElement]

    for (let i = 0; i < 6; i++) {
      s = round(s, 'ethics')
      seen.push(s.enemyElement)
    }

    // shiftEvery = 3: ba câu một hệ.
    expect(seen).toEqual(['math', 'math', 'math', 'vietnamese', 'vietnamese', 'vietnamese', 'music'])
  })

  it('tính khắc chế theo hệ HIỆN TẠI, không theo hệ lúc vào trận', () => {
    let s = towerBattle('math', 3)
    for (let i = 0; i < 3; i++) s = round(s, 'ethics')
    expect(s.enemyElement).toBe('vietnamese')

    // Số Học khắc Ngôn Từ. Đọc nhầm sang `enemy.element` thì đòn này bị tính là
    // "bị khắc" và cả cơ chế đổi hệ thành vô nghĩa.
    expect(hit(s, 'math').lastSpell!.matchup).toBe('strong')
  })
})

describe('hút máu: đoán mò không còn là một chiến thuật', () => {
  it('trả lời sai thì quái hồi máu', () => {
    const start = beginDefend(advance(hit(towerBattle('math', 3), 'ethics'), numericQuestion, NOW), NOW)
    const hurt = start.enemyHp
    const after = answerWrong(start)
    expect(after.enemyHp).toBeGreaterThan(hurt)
    expect(after.log.some((line) => line.includes('hút lại'))).toBe(true)
  })

  it('hết giờ cũng tính như trả lời sai', () => {
    const start = beginDefend(advance(hit(towerBattle('math', 3), 'ethics'), numericQuestion, NOW), NOW)
    expect(timeUp(start, NOW).enemyHp).toBeGreaterThan(start.enemyHp)
  })

  it('không bao giờ hồi vượt quá máu tối đa', () => {
    const s = answerWrong(towerBattle('math', 3))
    expect(s.enemyHp).toBeLessThanOrEqual(s.enemy.maxHp)
  })

  it('quái đã gục thì không hồi lại được nữa', () => {
    const s = towerBattle('math', 3, { enemy: { ...createTowerBoss('math', 3), maxHp: 4 } })
    const dead = hit(s, 'ethics')
    expect(dead.enemyHp).toBe(0)
    expect(answerWrong(dead).enemyHp).toBe(0)
  })
})

describe('nổi giận: nửa sau của trận không giống nửa đầu', () => {
  /**
   * Trùm đúng bản thật nhưng máu vừa đủ mỏng để MỘT đòn khắc chế đưa nó qua
   * ngưỡng 40% mà chưa gục.
   *
   * Đo sát thương trước rồi mới đặt máu, thay vì gõ sẵn một con số: chỉ cần ai
   * đó chỉnh hệ số sát thương hay độ khó của câu hỏi mẫu là con số gõ sẵn ấy
   * rơi sang phía "một đòn chết luôn", và cả nhóm test này lặng lẽ kiểm nhầm.
   */
  const probeDamage = hit(towerBattle('math', 3), 'ethics').lastSpell!.damage
  const frail = () => ({
    ...createTowerBoss('math', 3),
    maxHp: Math.ceil(probeDamage * 1.5),
    regenOnMiss: 0,
  })

  it('qua ngưỡng máu thì đánh mạnh hơn và đồng hồ rút ngắn', () => {
    const s = towerBattle('math', 3, { enemy: frail() })
    expect(s.enraged).toBe(false)

    const angry = hit(s, 'ethics')
    expect(angry.enemyHp).toBeGreaterThan(0)
    expect(angry.enemyHp).toBeLessThanOrEqual(s.enemy.maxHp * 0.4)
    expect(angry.enraged).toBe(true)
    expect(angry.timeLimitMs!).toBeLessThan(s.timeLimitMs!)
    expect(enemyAttackOf(angry)).toBeGreaterThan(enemyAttackOf(s))
    expect(angry.log.some((line) => line.includes('nổi giận'))).toBe(true)
  })

  it('chỉ báo MỘT LẦN, và đồng hồ chỉ rút một lần', () => {
    let s = hit(towerBattle('math', 3, { enemy: frail() }), 'ethics')
    const shortened = s.timeLimitMs
    s = advance(s, numericQuestion, NOW)
    s = hit(s, 'ethics')
    expect(s.timeLimitMs).toBe(shortened)
    expect(s.log.filter((line) => line.includes('nổi giận'))).toHaveLength(1)
  })

  it('nổi rồi thì không nguôi, kể cả khi máu không tụt thêm', () => {
    const angry = hit(towerBattle('math', 3, { enemy: frail() }), 'ethics')
    expect(advance(angry, numericQuestion, NOW).enraged).toBe(true)
  })

  it('quái thường không bao giờ nổi giận', () => {
    const plain = createEnemy({
      subject: 'math',
      grade: 3,
      nodeIndex: 2,
      isBoss: false,
      rng: createRng('thuong'),
    })
    const s = createBattle(
      { enemy: { ...plain, maxHp: 10 }, player: { maxHp: 60, power: 1 }, pet: pet('a', 'math') },
      numericQuestion,
      NOW,
    )
    const after = hit(s, 'ethics')
    expect(after.enraged).toBe(false)
    expect(enemyAttackOf(after)).toBe(plain.attack)
  })
})
