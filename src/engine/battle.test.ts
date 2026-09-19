import { describe, expect, it } from 'vitest'
import {
  activePet,
  advance,
  battleAccuracy,
  beginAttack,
  beginDefend,
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
import { BIND_ATTACK_SCALE, hasEffect } from './battle'
import { ULTIMATE_COOLDOWN, type EffectKind, type Element, type Pet, type Spell } from './pets'
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
  tier: 1,
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
  pet: pet('mot', 'math', 50),
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
  beginDefend(
    advance(
      castSpell(submitAnswer(state, { kind: 'numeric', value: 7 }, NOW), NEUTRAL, NOW),
      numericQuestion,
      NOW,
    ),
    NOW,
  )

/** Trả lời đúng sau `ms` mili giây - dừng ở pha chọn phép. */
const answerRight = (state: BattleState, ms = 6_000) =>
  submitAnswer(state, { kind: 'numeric', value: 7 }, state.questionShownAt + ms)

/** Trả lời đúng rồi tung luôn phép trung tính - vòng đầy đủ của một lượt đúng. */
const rightAndCast = (state: BattleState, ms = 6_000, spell: Spell = NEUTRAL) =>
  castSpell(answerRight(state, ms), spell, NOW)

const answerWrong = (state: BattleState, ms = 6_000) =>
  submitAnswer(state, { kind: 'numeric', value: 99 }, state.questionShownAt + ms)

/**
 * Đi trọn MỘT VÒNG rồi về lại lượt của con.
 *
 * Đi qua đúng đường mà trận thật đi - tung phép, quái ra đòn, trẻ đỡ hụt - chứ
 * không nặn trạng thái bằng tay. Dùng cho mọi test về hiệu ứng và hồi chiêu,
 * vốn đều đo theo số LƯỢT trôi qua.
 */
const advanceRound = (state: BattleState): BattleState => {
  const next = advance(state, numericQuestion, NOW)
  // Quái bị đóng băng thì `advance` bỏ thẳng sang vòng sau - không có lượt đỡ.
  if (next.phase === 'ready') return beginAttack(next, NOW)
  return beginAttack(advance(answerWrong(beginDefend(next, NOW)), numericQuestion, NOW), NOW)
}

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

  it('máu của trẻ là máu CON THÚ đi theo mình', () => {
    const s = start({ pet: pet('a', 'math', 30) })
    expect(s.playerHp).toBe(30)
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
    const weakPet = rightAndCast(start({ pet: pet('yeu', 'math', 50, 0.8) }))
    const strongPet = rightAndCast(start({ pet: pet('manh', 'math', 50, 1.3) }))
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
      s = beginDefend(advance(s, numericQuestion, NOW), NOW)
      s = advance(answerRight(s), numericQuestion, NOW)
      s = beginAttack(s, NOW)
    }
    expect(damages[3]!).toBeGreaterThan(damages[0]!)
  })

  it('chiêu mượn hệ vẫn khắc chế được, dù con thú không cùng hệ với nó', () => {
    /*
      Đây là cả lý do chiêu thứ ba tồn tại. Con thú hệ Số Học gặp quái hệ Số
      Học thì hai chiêu nhà chỉ ra 1,0; chiêu mượn hệ Ánh Sáng mới xuyên qua
      được. Sát thương tính theo HỆ CỦA CHIÊU, không theo hệ của con thú.
    */
    const s = start({ pet: pet('a', 'math', 40) })
    const cast = castSpell(answerRight(s), STRONG, NOW)
    expect(cast.lastSpell!.matchup).toBe('strong')
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

describe('một con thú đi một mình', () => {
  // Sát thương giờ chỉ tới từ LƯỢT CỦA QUÁI, nên mọi test ở đây đi qua đó.

  it('sát thương rơi thẳng vào con thú', () => {
    const s = answerWrong(enemyTurn(start({ pet: pet('a', 'math', 40) })))
    expect(s.pet.hp).toBe(28)
    expect(s.playerHp).toBe(28)
  })

  it('còn máu là trận còn tiếp', () => {
    let s = answerWrong(enemyTurn(start({ pet: pet('a', 'math', 40) })))
    s = advance(s, numericQuestion, NOW)
    expect(s.phase).toBe('ready')
  })

  it('con thú gục là về làng ngay - không còn ai bước ra thay', () => {
    let s = answerWrong(enemyTurn(start({ pet: pet('a', 'math', 10) })))
    expect(s.playerHp).toBe(0)
    expect(s.log.some((line) => line.includes('kiệt sức'))).toBe(true)
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
  it('ra đòn xong thì quái GỒNG LÊN trước, chưa hỏi ngay', () => {
    /*
      Nhịp cảnh báo là thứ biến đòn của quái từ "một câu hỏi nữa" thành một cú
      đánh đang bay tới. Thiếu nó thì trẻ vừa bấm "Tiếp tục" xong đã thấy đề
      bài mới, không kịp hiểu rằng thế trận vừa đổi chủ.
    */
    const warned = advance(rightAndCast(start()), numericQuestion, NOW)
    expect(warned.phase).toBe('warning')
    expect(warned.stance).toBe('defend')
    expect(warned.log.some((line) => line.includes('gồng lên'))).toBe(true)

    const asked = beginDefend(warned, NOW)
    expect(asked.phase).toBe('question')
    expect(asked.stance).toBe('defend')
    expect(questionLimitMs(asked)).toBeGreaterThan(0)
  })

  it('đồng hồ đỡ đòn chỉ chạy TỪ LÚC câu hỏi hiện ra', () => {
    // Nhịp cảnh báo là của quái, không phải của trẻ. Tính nó vào thời gian
    // suy nghĩ thì trẻ mất gần hai giây cho một việc mình không làm gì cả.
    const warned = advance(rightAndCast(start()), numericQuestion, NOW)
    const asked = beginDefend(warned, NOW + 1_500)
    expect(asked.questionShownAt).toBe(NOW + 1_500)
  })

  it('chỉ pha cảnh báo mới mở được câu hỏi đỡ đòn', () => {
    const s = start()
    expect(beginDefend(s, NOW)).toBe(s)
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

    const theirs = beginDefend(advance(rightAndCast(mine), numericQuestion, NOW), NOW)
    expect(questionLimitMs(theirs)).toBe(theirs.defendLimitMs)
  })

  it('đỡ được thì quái MẤT LƯỢT ĐÁNH, và không ai mất máu', () => {
    const s = answerRight(enemyTurn(start()))
    expect(s.blocked).toBe(true)
    expect(s.playerHp).toBe(50)
    expect(s.lastDamage!.toPlayer).toBe(0)
    // Đỡ được đã là phần thưởng. Gộp thêm sát thương vào thì lượt của quái hoá
    // ra lại là cơ hội của trẻ.
    expect(s.lastDamage!.toEnemy).toBe(0)
    expect(s.log.some((line) => line.includes('đỡ được'))).toBe(true)
  })

  it('đỡ trượt thì ăn đúng cú đánh của quái', () => {
    const s = answerWrong(enemyTurn(start()))
    expect(s.blocked).toBe(false)
    expect(s.playerHp).toBe(50 - 12)
    expect(s.lastDamage!.toPlayer).toBe(12)
  })

  it('đỡ xong là về đầu vòng, chờ trẻ bấm "Tấn công"', () => {
    let s = enemyTurn(start())
    s = advance(answerRight(s), numericQuestion, NOW)
    expect(s.phase).toBe('ready')
    expect(s.stance).toBe('attack')
    expect(s.blocked).toBe(false)
  })

  it('lượt đỡ KHÔNG tính vào số lượt ra đòn', () => {
    const before = start()
    let s = enemyTurn(before)
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
    let s = start({ pet: pet('mot', 'math', 12) })
    s = rightAndCast(s)
    const goldEarned = s.goldEarned
    const xpEarned = s.xpEarned
    s = beginDefend(advance(s, numericQuestion, NOW), NOW)
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
    s = beginDefend(advance(s, numericQuestion, NOW), NOW) // tới lượt quái
    expect(s.stance).toBe('defend')
    s = advance(answerRight(s), numericQuestion, NOW) // đỡ được, về đầu vòng
    expect(s.phase).toBe('ready')
    expect(s.questionsAsked).toBe(2)

    s = rightAndCast(beginAttack(s, NOW))
    s = beginDefend(advance(s, numericQuestion, NOW), NOW)
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
    s = beginDefend(advance(s, numericQuestion, NOW), NOW)
    s = advance(answerRight(s), null, NOW)
    expect(s.phase).toBe('retreat')
  })

  it('ưu tiên thắng khi cả hai cùng về 0 máu', () => {
    let s = start({
      enemy: { ...config().enemy, maxHp: 5, attack: 999 },
      pet: pet('mot', 'math', 10),
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
    s = beginDefend(advance(s, mcQuestion, NOW), NOW)
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
    const afterCombo = beginDefend(advance(s, numericQuestion, NOW), NOW)
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

    const enemy = beginDefend(advance(soft, scenarioQuestion, NOW), NOW)
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

describe('chiêu cuối: hiệu ứng và hồi chiêu', () => {
  /** Bốn chiêu cuối giả lập, mỗi cái một kiểu hiệu ứng. Hệ Toán = trung tính. */
  const ult = (kind: EffectKind, turns: number, tickPercent?: number): Spell => ({
    ...NEUTRAL,
    id: `ult-${kind}`,
    name: `Chiêu ${kind}`,
    power: 2,
    tier: 4,
    effect: { kind, turns, tickPercent },
  })

  const BURN = ult('burn', 3, 0.3)
  const DRAIN = ult('drain', 3, 0.25)
  const BIND = ult('bind', 2)
  const FREEZE = ult('freeze', 1)

  describe('hồi chiêu', () => {
    it('trận mở màn thì chiêu cuối đã sẵn sàng', () => {
      expect(fresh().ultimateCooldown).toBe(0)
    })

    it('tung chiêu cuối là hồi chiêu bật lên ngay', () => {
      expect(rightAndCast(start(), 6_000, BURN).ultimateCooldown).toBe(ULTIMATE_COOLDOWN)
    })

    it('chiêu thường KHÔNG đụng tới hồi chiêu', () => {
      expect(rightAndCast(start(), 6_000, NEUTRAL).ultimateCooldown).toBe(0)
    })

    it('còn hồi chiêu thì engine TỪ CHỐI, không chỉ làm mờ cái nút', () => {
      // Luật chơi phải sống trong engine. Chỉ khoá ở giao diện thì một cú bấm
      // hai lần thật nhanh cũng lách qua được.
      const cooling = rightAndCast(start(), 6_000, BURN)
      const next = answerRight(advanceRound(cooling))
      expect(castSpell(next, BURN, NOW)).toBe(next)
    })

    it('vẫn tung được chiêu thường trong lúc chiêu cuối đang nghỉ', () => {
      const cooling = rightAndCast(start(), 6_000, BURN)
      const next = answerRight(advanceRound(cooling))
      expect(castSpell(next, NEUTRAL, NOW).phase).toBe('feedback')
    })

    it('mỗi lượt của con nhích một bước, rồi sẵn sàng trở lại', () => {
      let s = rightAndCast(start(), 6_000, BURN)
      expect(s.ultimateCooldown).toBe(3)
      s = advanceRound(s)
      expect(s.ultimateCooldown).toBe(2)
      s = rightAndCast(s)
      s = advanceRound(s)
      expect(s.ultimateCooldown).toBe(1)
      s = rightAndCast(s)
      s = advanceRound(s)
      expect(s.ultimateCooldown).toBe(0)
    })
  })

  describe('hiệu ứng bám lên quái', () => {
    it('chiêu cuối gắn hiệu ứng, chiêu thường thì không', () => {
      expect(rightAndCast(start(), 6_000, BURN).enemyStatus.map((e) => e.kind)).toEqual(['burn'])
      expect(rightAndCast(start(), 6_000, NEUTRAL).enemyStatus).toEqual([])
    })

    it('máu mất mỗi lượt chốt theo CÚ ĐÁNH đã tung ra', () => {
      const s = rightAndCast(start(), 6_000, BURN)
      expect(s.enemyStatus[0]!.perTurn).toBe(Math.round(s.lastDamage!.toEnemy * 0.3))
    })

    it('giao diện đọc được hiệu ứng vừa gắn từ `lastSpell`', () => {
      expect(rightAndCast(start(), 6_000, BURN).lastSpell!.effect).toBe('burn')
      expect(rightAndCast(start(), 6_000, NEUTRAL).lastSpell!.effect).toBeNull()
    })

    it('hai hiệu ứng khác loại CÙNG SỐNG, không cái nào xoá cái nào', () => {
      // Gỡ hồi chiêu bằng tay: trong trận thật phải chờ ba lượt giữa hai chiêu
      // cuối, mà ba lượt ấy lại làm vết trói đầu tiên tan mất trước khi đo.
      let s = rightAndCast(start(), 6_000, BIND)
      s = { ...advanceRound(s), ultimateCooldown: 0 }
      s = rightAndCast(s, 6_000, BURN)
      expect(s.enemyStatus.map((e) => e.kind).sort()).toEqual(['bind', 'burn'])
    })

    it('tung lại cùng một hiệu ứng thì làm mới, không chồng hai lớp', () => {
      let s = rightAndCast(start(), 6_000, BURN)
      s = { ...advanceRound(s), ultimateCooldown: 0 }
      s = rightAndCast(s, 6_000, BURN)
      expect(s.enemyStatus.filter((e) => e.kind === 'burn')).toHaveLength(1)
    })
  })

  describe('CHÁY - quái mất máu mỗi lượt', () => {
    it('trừ máu ở cuối lượt của con, và đếm ngược', () => {
      let s = rightAndCast(start(), 6_000, BURN)
      const perTurn = s.enemyStatus[0]!.perTurn
      const afterCast = s.enemyHp

      s = advance(s, numericQuestion, NOW)
      expect(s.enemyHp).toBe(afterCast - perTurn)
      expect(s.enemyStatus[0]!.turnsLeft).toBe(2)
      expect(s.log.some((line) => line.includes('Vết cháy'))).toBe(true)
    })

    it('cháy tới lượt thứ ba thì tắt', () => {
      // Mỗi vòng phải có một lượt ra đòn thật, nếu không thì trận đứng yên ở
      // pha chờ và hiệu ứng không ăn nhịp nào - xem advanceRound.
      let s = rightAndCast(start(), 6_000, BURN)
      s = advanceRound(s)
      expect(s.enemyStatus[0]!.turnsLeft).toBe(2)
      s = advanceRound(rightAndCast(s))
      expect(s.enemyStatus[0]!.turnsLeft).toBe(1)
      s = advanceRound(rightAndCast(s))
      expect(s.enemyStatus).toHaveLength(0)
    })

    it('vết cháy ăn nốt máu cuối thì THẮNG, và vẫn cộng đủ phần thưởng', () => {
      const s = rightAndCast(start({ enemy: { ...config().enemy, maxHp: 26 } }), 6_000, BURN)
      const won = advance(s, numericQuestion, NOW)
      expect(won.enemyHp).toBe(0)
      expect(won.phase).toBe('victory')
      expect(won.goldEarned).toBeGreaterThanOrEqual(config().enemy.goldReward)
    })
  })

  describe('HÚT - quái mất máu, con thú hồi lại bấy nhiêu', () => {
    it('thanh máu của mình DÀI RA, đó là chỗ trẻ nhìn thấy hiệu ứng', () => {
      const hurt = rightAndCast(start(), 6_000, DRAIN)
      const wounded = { ...hurt, pet: { ...hurt.pet, hp: 20 }, playerHp: 20 }
      const s = advance(wounded, numericQuestion, NOW)
      expect(s.playerHp).toBeGreaterThan(20)
      expect(s.pet.hp).toBe(s.playerHp)
    })

    it('không hồi quá máu tối đa - thanh máu không được phép nói dối', () => {
      const full = rightAndCast(start(), 6_000, DRAIN)
      const s = advance(full, numericQuestion, NOW)
      expect(s.playerHp).toBe(s.pet.pet.maxHp)
    })
  })

  describe('TRÓI - đòn của quái yếu đi một nửa', () => {
    it('quái đang bị trói thì đánh nhẹ hẳn', () => {
      const free = answerWrong(enemyTurn(start()))
      const boundState = rightAndCast(start(), 6_000, BIND)
      const bound = answerWrong(beginDefend(advance(boundState, numericQuestion, NOW), NOW))

      const freeHit = free.lastDamage!.toPlayer
      const boundHit = bound.lastDamage!.toPlayer
      expect(boundHit).toBeLessThan(freeHit)
      expect(boundHit).toBe(Math.round(freeHit * BIND_ATTACK_SCALE))
    })

    it('dây trói đứt sau hai lượt', () => {
      let s = rightAndCast(start(), 6_000, BIND)
      s = advanceRound(s)
      s = advanceRound(rightAndCast(s))
      expect(hasEffect(s, 'bind')).toBe(false)
      expect(s.log.some((line) => line.includes('Dây trói đứt'))).toBe(true)
    })
  })

  describe('ĐÓNG BĂNG - quái mất nguyên lượt đánh', () => {
    it('bỏ thẳng sang vòng sau, không đi qua pha gồng lên', () => {
      // Quái đang đứng sững thì không có gì để gồng.
      const s = advance(rightAndCast(start(), 6_000, FREEZE), numericQuestion, NOW)
      expect(s.phase).toBe('ready')
      expect(s.stance).toBe('attack')
      expect(s.log.some((line) => line.includes('mất lượt đánh'))).toBe(true)
    })

    it('trẻ KHÔNG mất máu ở lượt bị bỏ qua ấy', () => {
      const s = advance(rightAndCast(start(), 6_000, FREEZE), numericQuestion, NOW)
      expect(s.playerHp).toBe(s.pet.pet.maxHp)
    })

    it('chỉ bỏ ĐÚNG MỘT lượt - lượt sau quái đánh lại bình thường', () => {
      let s = advance(rightAndCast(start(), 6_000, FREEZE), numericQuestion, NOW)
      expect(hasEffect(s, 'freeze')).toBe(false)
      s = rightAndCast(beginAttack(s, NOW))
      s = advance(s, numericQuestion, NOW)
      expect(s.phase).toBe('warning')
    })

    it('vẫn đếm là một vòng đã đánh, không cho đánh thêm lượt miễn phí', () => {
      const before = rightAndCast(start(), 6_000, FREEZE)
      const after = advance(before, numericQuestion, NOW)
      expect(after.questionsAsked).toBe(before.questionsAsked + 1)
    })
  })
})
