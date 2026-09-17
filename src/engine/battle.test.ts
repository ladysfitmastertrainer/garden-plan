import { describe, expect, it } from 'vitest'
import {
  activePet,
  advance,
  battleAccuracy,
  beginAttack,
  castSpell,
  comboMultiplier,
  createBattle,
  defendLimitFor,
  isOver,
  questionLimitMs,
  speedMultiplier,
  submitAnswer,
  timeLimitFor,
  timeUp,
  useHint,
  type BattleConfig,
  type BattleState,
} from './battle'
import type { Element, Pet, Spell } from './pets'
import { mcQuestion, numericQuestion, scenarioQuestion } from './test-fixtures'

const NOW = 1_700_000_000_000

/** Thú dựng riêng cho test để các con số máu không phụ thuộc bộ thú thật. */
const pet = (id: string, element: Element, maxHp: number, power = 1): Pet => ({
  id,
  name: id,
  element,
  sprite: 'slime',
  maxHp,
  power,
  spellIds: [],
  evolutions: [],
})

/** Phép trung tính với quái hệ Toán - dùng làm mốc so sánh sát thương. */
const NEUTRAL: Spell = {
  id: 'trung-tinh',
  name: 'Trung Tính',
  element: 'math',
  power: 1,
  flavour: 'tung một đòn thường',
}
/** Ánh Sáng khắc Số Học. */
const STRONG: Spell = { ...NEUTRAL, id: 'manh', element: 'ethics' }
/** Số Học bị Ánh Sáng khắc, nên Ngôn Từ đánh vào Số Học là bị khắc lại. */
const WEAK: Spell = { ...NEUTRAL, id: 'yeu', element: 'vietnamese' }

const config = (overrides: Partial<BattleConfig> = {}): BattleConfig => ({
  enemy: {
    id: 'slime',
    name: 'Slime Số Học',
    emoji: '🟢',
    element: 'math',
    maxHp: 100,
    attack: 12,
    goldReward: 20,
    xpReward: 30,
    variant: 0,
    isBoss: false,
  },
  player: { maxHp: 50, power: 1 },
  team: [pet('mot', 'math', 50)],
  ...overrides,
})

/** Trận vừa dựng xong: đang ở pha chờ, chưa ai ra đòn. */
const fresh = (overrides: Partial<BattleConfig> = {}): BattleState =>
  createBattle(config(overrides), numericQuestion, NOW)

/**
 * Trận đã bấm "Tấn công" - tức là đang ở LƯỢT CỦA CON, có câu hỏi trên màn hình.
 *
 * Gần như mọi test dưới đây nói về lượt của con, nên helper mặc định đưa thẳng
 * tới đó. Lượt của quái có helper riêng (`enemyTurn`) vì nó là một thế trận
 * khác hẳn: cùng một câu trả lời sai, hậu quả không giống nhau.
 */
const start = (overrides: Partial<BattleConfig> = {}): BattleState =>
  beginAttack(fresh(overrides), NOW)

/**
 * Đưa trận tới LƯỢT CỦA QUÁI: con ra đòn xong, quái lao tới.
 *
 * Đi qua đúng đường mà trận thật đi - trả lời đúng, tung phép, rồi `advance` -
 * chứ không nặn một trạng thái bằng tay. Nặn tay thì test vẫn xanh kể cả khi
 * đường đi thật đã hỏng.
 */
const enemyTurn = (state: BattleState): BattleState =>
  advance(castSpell(submitAnswer(state, { kind: 'numeric', value: 7 }, NOW), NEUTRAL, NOW), numericQuestion, NOW)

/** Trả lời đúng sau `ms` mili giây - dừng ở pha chọn phép. */
const answerRight = (state: BattleState, ms = 6_000) =>
  submitAnswer(state, { kind: 'numeric', value: 7 }, state.questionShownAt + ms)

/** Trả lời đúng rồi tung luôn phép trung tính - vòng đầy đủ của một lượt đúng. */
const rightAndCast = (state: BattleState, ms = 6_000, spell: Spell = NEUTRAL) =>
  castSpell(answerRight(state, ms), spell, NOW)

const answerWrong = (state: BattleState, ms = 6_000) =>
  submitAnswer(state, { kind: 'numeric', value: 99 }, state.questionShownAt + ms)

describe('createBattle', () => {
  it('bắt đầu ở PHA CHỜ, không nhảy thẳng vào câu hỏi', () => {
    /*
      Trận mở màn bằng việc con quái hiện ra và trẻ nhìn thấy nó. Bản trước nhảy
      thẳng vào câu hỏi, mà câu hỏi thì che gần kín màn hình - con quái vừa xuất
      hiện đã bị che mất.
    */
    const s = fresh()
    expect(s.phase).toBe('ready')
    expect(s.stance).toBe('attack')
    expect(s.enemyHp).toBe(100)
    expect(s.playerHp).toBe(50)
    expect(s.question).toBe(numericQuestion)
    expect(isOver(s)).toBe(false)
  })

  it('bấm "Tấn công" mới mở câu hỏi ra, và đồng hồ bắt đầu từ lúc ấy', () => {
    const s = beginAttack(fresh(), NOW + 5_000)
    expect(s.phase).toBe('question')
    expect(s.stance).toBe('attack')
    // Khoảng trẻ đang ngắm sân đấu KHÔNG bị tính vào thời gian suy nghĩ.
    expect(s.questionShownAt).toBe(NOW + 5_000)
  })

  it('chỉ pha chờ mới bấm được "Tấn công"', () => {
    const s = start()
    expect(beginAttack(s, NOW)).toBe(s)
  })

  it('máu của trẻ là máu CẢ ĐỘI cộng lại', () => {
    const s = start({ team: [pet('a', 'math', 30), pet('b', 'music', 25)] })
    expect(s.playerHp).toBe(55)
    expect(s.team).toHaveLength(2)
    expect(activePet(s)!.pet.id).toBe('a')
  })
})

describe('trả lời đúng rồi tung phép', () => {
  it('trả lời đúng KHÔNG gây sát thương ngay mà chuyển sang pha chọn phép', () => {
    // Đây là chỗ trẻ được ra quyết định. Gây sát thương luôn là mất bước đó.
    const s = answerRight(start())
    expect(s.phase).toBe('spell')
    expect(s.enemyHp).toBe(100)
    expect(s.pendingDamage).toBeGreaterThan(0)
    expect(s.combo).toBe(1)
  })

  it('tung phép mới thực sự gây sát thương', () => {
    const s = rightAndCast(start())
    expect(s.phase).toBe('feedback')
    expect(s.enemyHp).toBeLessThan(100)
    expect(s.playerHp).toBe(50)
    expect(s.lastDamage!.toEnemy).toBeGreaterThan(0)
    expect(s.lastDamage!.toPlayer).toBe(0)
    expect(s.lastSpell!.spell.id).toBe('trung-tinh')
  })

  it('phép khắc chế mạnh hơn hẳn phép bị khắc', () => {
    const strong = rightAndCast(start(), 6_000, STRONG)
    const neutral = rightAndCast(start(), 6_000, NEUTRAL)
    const weak = rightAndCast(start(), 6_000, WEAK)

    expect(strong.lastDamage!.toEnemy).toBeGreaterThan(neutral.lastDamage!.toEnemy)
    expect(neutral.lastDamage!.toEnemy).toBeGreaterThan(weak.lastDamage!.toEnemy)
    expect(strong.lastSpell!.matchup).toBe('strong')
    expect(weak.lastSpell!.matchup).toBe('weak')
  })

  it('phép bị khắc vẫn gây sát thương, không bao giờ bằng 0', () => {
    // Trả lời đúng mà đòn vô tác dụng thì trẻ thấy như bị phạt.
    const s = rightAndCast(start(), 20_000, WEAK)
    expect(s.lastDamage!.toEnemy).toBeGreaterThan(0)
  })

  it('phép mạnh hơn của cùng một hệ gây sát thương cao hơn', () => {
    const weakSpell = rightAndCast(start(), 6_000, NEUTRAL)
    const bigSpell = rightAndCast(start(), 6_000, { ...NEUTRAL, id: 'to', power: 1.45 })
    expect(bigSpell.lastDamage!.toEnemy).toBeGreaterThan(weakSpell.lastDamage!.toEnemy)
  })

  it('sức mạnh riêng của thú ảnh hưởng tới sát thương', () => {
    const weakPet = rightAndCast(start({ team: [pet('yeu', 'math', 50, 0.8)] }))
    const strongPet = rightAndCast(start({ team: [pet('manh', 'math', 50, 1.3)] }))
    expect(strongPet.lastDamage!.toEnemy).toBeGreaterThan(weakPet.lastDamage!.toEnemy)
  })

  it('cộng vàng và kinh nghiệm ngay khi trả lời, không đợi tung phép', () => {
    // Trẻ bỏ dở lúc đang chọn phép vẫn phải giữ được phần thưởng của câu đó.
    const s = answerRight(start())
    expect(s.goldEarned).toBeGreaterThan(0)
    expect(s.xpEarned).toBeGreaterThan(0)
  })

  it('trả lời nhanh gây sát thương cao hơn trả lời chậm', () => {
    const fast = rightAndCast(start(), 2_000)
    const slow = rightAndCast(start(), 20_000)
    expect(fast.lastDamage!.toEnemy).toBeGreaterThan(slow.lastDamage!.toEnemy)
  })

  it('dùng gợi ý thì sát thương giảm nhưng vẫn tính là đúng', () => {
    const withHint = rightAndCast(useHint(start()))
    const without = rightAndCast(start())
    expect(withHint.lastJudgement!.correct).toBe(true)
    expect(withHint.lastDamage!.toEnemy).toBeLessThan(without.lastDamage!.toEnemy)
    expect(withHint.answers[0]!.usedHint).toBe(true)
  })

  it('chuỗi đúng liên tiếp làm sát thương tăng dần', () => {
    let s = start()
    const damages: number[] = []
    for (let i = 0; i < 4; i++) {
      s = rightAndCast(s)
      damages.push(s.lastDamage!.toEnemy)
      // Một vòng đầy đủ: ra đòn xong thì tới lượt quái, đỡ được rồi mới tới
      // lượt sau của con.
      s = advance(s, numericQuestion, NOW)
      s = advance(answerRight(s), numericQuestion, NOW)
      s = beginAttack(s, NOW)
    }
    expect(damages[3]!).toBeGreaterThan(damages[0]!)
  })

  it('gọi con khác trong đội ra tung phép thì con đó thành con đang đứng', () => {
    // Thú chỉ biết phép cùng hệ của mình. Không cho đổi con thì gặp quái khắc
    // hệ là mọi lựa chọn đều "bị khắc" - ba cái nút mà không có quyết định nào.
    const s = start({ team: [pet('a', 'math', 40), pet('b', 'ethics', 40)] })
    const cast = castSpell(answerRight(s), STRONG, NOW, 1)
    expect(cast.activeIndex).toBe(1)
    expect(cast.lastSpell!.matchup).toBe('strong')
    expect(cast.log.some((line) => line.includes('bước ra tung phép'))).toBe(true)
  })

  it('không gọi được con đã gục ra tung phép', () => {
    const s = start({ team: [pet('a', 'math', 40), pet('b', 'ethics', 40)] })
    const downed = { ...s, team: [s.team[0]!, { ...s.team[1]!, hp: 0 }] }
    const cast = castSpell(answerRight(downed), STRONG, NOW, 1)
    expect(cast.activeIndex).toBe(0)
  })

  it('không cho tung phép khi chưa trả lời đúng', () => {
    const s = start()
    expect(castSpell(s, NEUTRAL, NOW)).toBe(s)
  })

  it('không cho tung phép hai lần cho cùng một câu', () => {
    const once = rightAndCast(start())
    expect(castSpell(once, STRONG, NOW)).toBe(once)
  })
})

describe('submitAnswer - trả lời sai', () => {
  it('ĐÁNH TRƯỢT thôi - quái không đánh trả ở lượt của con', () => {
    /*
      Đây là luật đã đổi, và đổi vì một lý do: giờ quái có lượt riêng ngay sau
      lượt này. Trừng phạt ở cả hai chỗ là trừng phạt hai lần cho cùng một lỗi,
      mà tệ hơn là nó xoá mất ý nghĩa của lượt đỡ đòn - ăn đòn rồi thì đỡ hay
      không cũng thế.
    */
    const s = answerWrong(start())
    expect(s.playerHp).toBe(50)
    expect(s.combo).toBe(0)
    expect(s.lastDamage!.toEnemy).toBe(0)
    expect(s.lastDamage!.toPlayer).toBe(0)
  })

  it('chuỗi combo đứt khi trả lời sai', () => {
    let s = enemyTurn(start())
    s = answerWrong(s)
    expect(s.combo).toBe(0)
  })

  it('vẫn được một chút kinh nghiệm - cố gắng cũng đáng ghi nhận', () => {
    const s = answerWrong(start())
    expect(s.xpEarned).toBeGreaterThan(0)
    expect(s.goldEarned).toBe(0)
  })

  it('lời giải thích luôn được trả về khi sai', () => {
    const s = answerWrong(start())
    expect(s.lastJudgement!.message).toBe(numericQuestion.explanation)
  })
})

describe('đội thú thay nhau ra trận', () => {
  // Sát thương giờ chỉ tới từ LƯỢT CỦA QUÁI, nên mọi test ở đây đi qua đó.
  const twoPets = () => enemyTurn(start({ team: [pet('a', 'math', 12), pet('b', 'music', 40)] }))

  it('sát thương rơi vào con đang ra trận, không chia đều cả đội', () => {
    const s = answerWrong(twoPets())
    expect(s.team[0]!.hp).toBe(0)
    expect(s.team[1]!.hp).toBe(40)
  })

  it('con gục thì con sau tự bước ra', () => {
    const s = answerWrong(twoPets())
    expect(s.activeIndex).toBe(1)
    expect(activePet(s)!.pet.id).toBe('b')
    expect(s.log.some((line) => line.includes('bước ra thay'))).toBe(true)
  })

  it('còn thú là trận còn tiếp, không kết thúc sớm', () => {
    let s = answerWrong(twoPets())
    s = advance(s, numericQuestion, NOW)
    expect(s.phase).toBe('ready')
  })

  it('hết cả đội mới về làng', () => {
    let s = enemyTurn(start({ team: [pet('a', 'math', 10), pet('b', 'music', 10)] }))
    s = answerWrong(s)
    s = advance(s, numericQuestion, NOW)
    s = enemyTurn(beginAttack(s, NOW))
    s = answerWrong(s)
    expect(s.playerHp).toBe(0)
    s = advance(s, numericQuestion, NOW)
    expect(s.phase).toBe('retreat')
  })
})

describe('môn Đạo đức không trừ máu', () => {
  const ethicsStart = () => beginAttack(createBattle(config(), scenarioQuestion, NOW), NOW)

  it('lựa chọn chưa tốt KHÔNG làm mất máu, chỉ mất lượt', () => {
    const s = submitAnswer(ethicsStart(), { kind: 'choice', choiceId: 'do-loi' }, NOW + 5_000)
    expect(s.phase).toBe('feedback')
    expect(s.playerHp).toBe(50)
    expect(s.lastDamage!.toPlayer).toBe(0)
    expect(s.lastDamage!.toEnemy).toBe(0)
    expect(s.combo).toBe(0)
  })

  it('lựa chọn tốt gây sát thương mạnh hơn lựa chọn tạm được', () => {
    const good = castSpell(
      submitAnswer(ethicsStart(), { kind: 'choice', choiceId: 'nhan-loi' }, NOW + 5_000),
      NEUTRAL,
      NOW,
    )
    const ok = castSpell(
      submitAnswer(ethicsStart(), { kind: 'choice', choiceId: 'don-dep' }, NOW + 5_000),
      NEUTRAL,
      NOW,
    )
    expect(good.lastDamage!.toEnemy).toBeGreaterThan(ok.lastDamage!.toEnemy)
  })

  it('chỉ lựa chọn tốt mới tích điểm phẩm chất', () => {
    const good = submitAnswer(ethicsStart(), { kind: 'choice', choiceId: 'nhan-loi' }, NOW + 5_000)
    expect(good.virtues.honesty).toBe(1)
    expect(good.virtues.responsibility).toBe(1)

    const ok = submitAnswer(ethicsStart(), { kind: 'choice', choiceId: 'don-dep' }, NOW + 5_000)
    expect(ok.virtues.responsibility).toBeUndefined()
  })
})

/*
  MỘT VÒNG CÓ HAI LƯỢT, và đây là phần luật mới nhất của trận đấu.

  Trước kia trận đấu chỉ là một chuỗi câu hỏi: trả lời đúng thì đánh được quái,
  sai thì ăn đòn ngay tại chỗ. Quái không có lượt nào của riêng nó, nên "quái
  tấn công" chỉ là hệ quả của một câu sai chứ không phải một việc quái làm.

  Giờ mỗi vòng đi qua hai lượt rõ rệt:

    lượt của CON  - bấm "Tấn công", trả lời; đúng thì tung phép, sai thì trượt
    lượt của QUÁI - quái lao tới kèm đồng hồ; trả lời kịp thì ĐỠ được, không
                    kịp hoặc sai thì ăn đòn

  Những test dưới đây giữ đúng hai điều dễ mất nhất khi ai đó sửa tiếp: sát
  thương vào trẻ CHỈ đi ra từ lượt của quái, và lượt đỡ đòn LUÔN có đồng hồ kể
  cả ở trận thường.
*/
describe('hai lượt trong một vòng', () => {
  it('ra đòn xong là tới lượt quái, kèm đồng hồ', () => {
    const s = advance(rightAndCast(start()), numericQuestion, NOW)
    expect(s.phase).toBe('question')
    expect(s.stance).toBe('defend')
    expect(questionLimitMs(s)).toBeGreaterThan(0)
    expect(s.log.some((line) => line.includes('lao tới'))).toBe(true)
  })

  it('TRẬN THƯỜNG cũng có đồng hồ ở lượt đỡ đòn - và chỉ ở đó', () => {
    /*
      Ngoại lệ có chủ ý với luật "trận thường tuyệt đối không đếm giờ". Luật ấy
      nói về câu hỏi để HỌC: trẻ đang học thì không được vừa nghĩ vừa nhìn đồng
      hồ. Câu này không phải để học - nó là con quái đang lao tới, và cái đồng
      hồ chính là cú đánh đang bay đến.
    */
    const mine = start()
    expect(mine.timeLimitMs).toBeNull()
    expect(questionLimitMs(mine)).toBeNull()

    const theirs = advance(rightAndCast(mine), numericQuestion, NOW)
    expect(questionLimitMs(theirs)).toBe(theirs.defendLimitMs)
  })

  it('đỡ được thì quái MẤT LƯỢT ĐÁNH, và không ai mất máu', () => {
    const s = answerRight(advance(rightAndCast(start()), numericQuestion, NOW))
    expect(s.blocked).toBe(true)
    expect(s.playerHp).toBe(50)
    expect(s.lastDamage!.toPlayer).toBe(0)
    // Đỡ được đã là phần thưởng. Gộp thêm sát thương vào thì lượt của quái hoá
    // ra lại là cơ hội của trẻ.
    expect(s.lastDamage!.toEnemy).toBe(0)
    expect(s.log.some((line) => line.includes('đỡ được'))).toBe(true)
  })

  it('đỡ trượt thì ăn đúng cú đánh của quái', () => {
    const s = answerWrong(advance(rightAndCast(start()), numericQuestion, NOW))
    expect(s.blocked).toBe(false)
    expect(s.playerHp).toBe(50 - 12)
    expect(s.lastDamage!.toPlayer).toBe(12)
  })

  it('đỡ xong là về đầu vòng, chờ trẻ bấm "Tấn công"', () => {
    let s = advance(rightAndCast(start()), numericQuestion, NOW)
    s = advance(answerRight(s), numericQuestion, NOW)
    expect(s.phase).toBe('ready')
    expect(s.stance).toBe('attack')
    expect(s.blocked).toBe(false)
  })

  it('lượt đỡ KHÔNG tính vào số lượt ra đòn', () => {
    const before = start()
    let s = advance(rightAndCast(before), numericQuestion, NOW)
    expect(s.questionsAsked).toBe(before.questionsAsked)
    s = advance(answerRight(s), numericQuestion, NOW)
    expect(s.questionsAsked).toBe(before.questionsAsked + 1)
  })
})

describe('đồng hồ đỡ đòn', () => {
  it('trận trùm và đầu đàn: đỡ đòn LUÔN gấp hơn ra đòn', () => {
    for (const kind of ['boss', 'mini', 'tower'] as const) {
      for (const grade of [1, 3, 5] as const) {
        expect(defendLimitFor(kind, grade)).toBeLessThan(timeLimitFor(kind, grade))
      }
    }
  })

  it('lớp 1-2 được thêm giờ đọc đề ở cả lượt đỡ đòn', () => {
    expect(defendLimitFor('normal', 1)).toBeGreaterThan(defendLimitFor('normal', 3))
  })

  it('quái nổi giận thì đồng hồ đỡ đòn ngắn lại theo', () => {
    /*
      Thiếu điều này thì lời báo "thời gian rút ngắn" chỉ đúng một nửa: quái nổi
      giận mà cú đánh của nó vẫn cho trẻ đúng ngần ấy giây để đỡ - tức là nửa
      đáng sợ nhất của cơn giận không xảy ra.
    */
    const angry = start({
      enemy: { ...config().enemy, maxHp: 100, enrageAt: 0.9 },
      timeLimitMs: 16_000,
    })
    const after = rightAndCast(angry)
    expect(after.enraged).toBe(true)
    expect(after.defendLimitMs).toBeLessThan(angry.defendLimitMs)
  })
})

describe('advance - kết thúc trận', () => {
  it('thắng khi quái hết máu, được cộng thêm thưởng của quái', () => {
    let s = start({ enemy: { ...config().enemy, maxHp: 5 } })
    s = rightAndCast(s)
    const goldBeforeVictory = s.goldEarned
    s = advance(s, numericQuestion, NOW)
    expect(s.phase).toBe('victory')
    expect(s.goldEarned).toBe(goldBeforeVictory + 20)
    expect(isOver(s)).toBe(true)
  })

  it('hết máu là RÚT LUI, không phải thua - giữ nguyên vàng và kinh nghiệm', () => {
    let s = start({ team: [pet('mot', 'math', 12)] })
    s = rightAndCast(s)
    const goldEarned = s.goldEarned
    const xpEarned = s.xpEarned
    s = advance(s, numericQuestion, NOW)
    s = answerWrong(s)
    s = advance(s, numericQuestion, NOW)

    expect(s.phase).toBe('retreat')
    expect(s.playerHp).toBe(0)
    expect(s.goldEarned).toBe(goldEarned)
    expect(s.xpEarned).toBeGreaterThanOrEqual(xpEarned)
    expect(s.log.some((line) => line.includes('về làng'))).toBe(true)
  })

  it('hết số câu cho phép thì kết thúc trận', () => {
    /*
      `maxQuestions` đếm LƯỢT RA ĐÒN CỦA CON, không đếm số câu hỏi hiện ra.

      Đây là điều phải giữ khi thêm lượt đỡ đòn: một vòng giờ có hai câu, nên
      nếu đếm cả hai thì mỗi trận chỉ còn một nửa số đòn, và toàn bộ máu quái -
      thứ đã cân theo mười đòn - phải tính lại từ đầu.
    */
    let s = start({ maxQuestions: 2 })
    s = rightAndCast(s)
    s = advance(s, numericQuestion, NOW) // tới lượt quái
    expect(s.stance).toBe('defend')
    s = advance(answerRight(s), numericQuestion, NOW) // đỡ được, về đầu vòng
    expect(s.phase).toBe('ready')
    expect(s.questionsAsked).toBe(2)

    s = rightAndCast(beginAttack(s, NOW))
    s = advance(s, numericQuestion, NOW)
    s = advance(answerRight(s), numericQuestion, NOW)
    expect(s.phase).toBe('retreat')
  })

  it('hết câu ngay ở lượt quái cũng kết thúc trận, KHÔNG treo vòng lặp', () => {
    /*
      Bản đầu của nhánh này quay về pha chờ để "bỏ qua lượt của quái cho tử tế",
      và nó treo trận đấu: số lượt ra đòn chỉ tăng ở cuối vòng, nên ngân hàng
      câu hỏi cạn đưa trận vào vòng chờ → hỏi → phản hồi → chờ mãi mãi, không
      bao giờ có màn tổng kết. Một trận không kết thúc được thì tệ hơn hẳn một
      lượt quái bị bỏ qua.
    */
    let s = rightAndCast(start())
    s = advance(s, null, NOW)
    expect(s.phase).toBe('retreat')
    expect(isOver(s)).toBe(true)
  })

  it('hết câu ở đầu vòng thì kết thúc trận gọn gàng', () => {
    let s = rightAndCast(start())
    s = advance(s, numericQuestion, NOW)
    s = advance(answerRight(s), null, NOW)
    expect(s.phase).toBe('retreat')
  })

  it('ưu tiên thắng khi cả hai cùng về 0 máu', () => {
    let s = start({
      enemy: { ...config().enemy, maxHp: 5, attack: 999 },
      team: [pet('mot', 'math', 10)],
    })
    s = rightAndCast(s)
    s = advance(s, numericQuestion, NOW)
    expect(s.phase).toBe('victory')
  })
})

describe('hàm phụ trợ', () => {
  it('thưởng tốc độ giảm dần theo thời gian trả lời', () => {
    expect(speedMultiplier(2_000)).toBeGreaterThan(speedMultiplier(6_000))
    expect(speedMultiplier(6_000)).toBeGreaterThan(speedMultiplier(12_000))
    expect(speedMultiplier(30_000)).toBeLessThan(1)
  })

  it('hệ số chuỗi bị chặn trên để không vỡ cân bằng', () => {
    expect(comboMultiplier(100)).toBe(comboMultiplier(5))
  })

  it('không cho trả lời khi đang ở pha chọn phép', () => {
    const s = answerRight(start())
    expect(answerRight(s)).toBe(s)
  })

  it('không cho trả lời khi đang ở màn phản hồi', () => {
    const s = rightAndCast(start())
    expect(answerRight(s)).toBe(s)
  })

  it('không cho bấm gợi ý hai lần', () => {
    const once = useHint(start())
    expect(useHint(once)).toBe(once)
  })

  it('tỉ lệ đúng tính trên các câu đã trả lời', () => {
    let s = rightAndCast(start())
    s = advance(s, mcQuestion, NOW)
    s = submitAnswer(s, { kind: 'choice', choiceId: 'a' }, NOW + 3_000)
    expect(battleAccuracy(s)).toBe(0.5)
  })

  it('trận chưa trả lời câu nào thì tỉ lệ đúng là 0, không phải NaN', () => {
    expect(battleAccuracy(start())).toBe(0)
  })
})

describe('đếm giờ ở trận trùm', () => {
  const timed = (ms = 16_000) => start({ timeLimitMs: ms })

  it('trận thường không có đồng hồ', () => {
    expect(start().timeLimitMs).toBeNull()
  })

  it('trùm gấp hơn đầu đàn ở mọi lớp', () => {
    for (const grade of [1, 2, 3, 4, 5] as const) {
      expect(timeLimitFor('boss', grade)).toBeLessThan(timeLimitFor('mini', grade))
    }
  })

  it('lớp 1-2 được thêm giờ đọc đề', () => {
    expect(timeLimitFor('boss', 2)).toBeGreaterThan(timeLimitFor('boss', 3))
    expect(timeLimitFor('mini', 1)).toBeGreaterThan(timeLimitFor('mini', 5))
  })

  it('hết giờ ở LƯỢT QUÁI: ăn đòn thật, combo đứt', () => {
    const s = rightAndCast(timed())
    const afterCombo = advance(s, numericQuestion, NOW)
    expect(afterCombo.combo).toBe(1)

    const out = timeUp(afterCombo, NOW)
    expect(out.phase).toBe('feedback')
    expect(out.combo).toBe(0)
    expect(out.playerHp).toBeLessThan(afterCombo.playerHp)
    expect(out.lastJudgement?.correct).toBe(false)
  })

  it('hết giờ vẫn được ghi vào sổ để lịch ôn tập biết kỹ năng này còn yếu', () => {
    const out = timeUp(timed(), NOW)
    const record = out.answers[out.answers.length - 1]
    expect(record?.questionId).toBe(numericQuestion.id)
    expect(record?.correct).toBe(false)
    expect(record?.durationMs).toBe(16_000)
  })

  it('môn Đạo đức KHÔNG được miễn: hết giờ là không chọn gì, không phải chọn chưa hay', () => {
    /*
      Luật "Đạo đức không trừ máu" nói về LỰA CHỌN: trẻ cần được phép chọn sai
      để học. Hết giờ thì không phải một lựa chọn, đó là không chọn gì cả.

      Phải thử ở LƯỢT CỦA QUÁI, vì từ bản này sát thương chỉ đi ra từ đó - ở
      lượt của con, hết giờ chỉ là đánh trượt.
    */
    const ethics = beginAttack(
      createBattle(config({ timeLimitMs: 16_000 }), scenarioQuestion, NOW),
      NOW,
    )
    const soft = submitAnswer(ethics, { kind: 'choice', choiceId: 'do-loi' }, NOW + 1_000)
    expect(soft.playerHp).toBe(ethics.playerHp)

    const enemy = advance(soft, scenarioQuestion, NOW)
    expect(enemy.stance).toBe('defend')
    // Chọn phương án chưa hay ở lượt quái: vẫn không mất máu.
    expect(
      submitAnswer(enemy, { kind: 'choice', choiceId: 'do-loi' }, NOW + 1_000).playerHp,
    ).toBe(enemy.playerHp)
    // Để hết giờ: mất máu.
    expect(timeUp(enemy, NOW).playerHp).toBeLessThan(enemy.playerHp)
  })

  it('trận không đếm giờ thì gọi hết giờ cũng không xảy ra gì', () => {
    const s = start()
    expect(timeUp(s, NOW)).toBe(s)
  })

  it('đang ở pha chọn phép thì đồng hồ không cướp lượt của trẻ', () => {
    const s = answerRight(timed())
    expect(s.phase).toBe('spell')
    expect(timeUp(s, NOW)).toBe(s)
  })
})
