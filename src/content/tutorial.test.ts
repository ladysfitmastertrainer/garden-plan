import { describe, expect, it } from 'vitest'

import {
  HANDBOOK,
  TUTORIAL_ENEMY_HP,
  TUTORIAL_GRADE,
  TUTORIAL_MAX_QUESTIONS,
  TUTORIAL_QUESTIONS,
  TUTORIAL_SUBJECT,
  WALK_SCRIPT,
  battleCoach,
  tutorialEnemy,
  tutorialNodes,
} from './tutorial'
import { getSkill } from './curriculum'
import { buildTeam, starterTeam } from './pets'
import { knownSpells, resolveLoadout, usableSlots } from '../engine/loadout'
import { counterElement, matchupLabel } from '../engine/pets'
import { judge } from '../engine/judge'
import {
  advance,
  beginAttack,
  beginDefend,
  castSpell,
  createBattle,
  submitAnswer,
  type BattleState,
} from '../engine/battle'
import { SPELLS } from './pets'
import { statsForLevel } from '../engine/rewards'
import { MONSTER_FAMILY, SLIME, monsterSpriteFor } from '../features/pixel/creatures'

const NOW = 1_700_000_000_000

describe('đề của bàn hướng dẫn', () => {
  it('trỏ tới một kỹ năng CÓ THẬT trong chương trình', () => {
    for (const question of TUTORIAL_QUESTIONS) {
      expect(getSkill(question.skillId), question.id).toBeDefined()
    }
  })

  it('câu nào cũng có gợi ý - nút 💡 là một thứ bàn này phải dạy', () => {
    for (const question of TUTORIAL_QUESTIONS) {
      expect(question.hint, question.id).toBeTruthy()
      expect(question.explanation, question.id).toBeTruthy()
    }
  })

  it('đáp án khai trong đề đúng là đáp án engine chấm đúng', () => {
    for (const question of TUTORIAL_QUESTIONS) {
      expect(question.type).toBe('multiple-choice')
      if (question.type !== 'multiple-choice') continue
      const verdict = judge(question, { kind: 'choice', choiceId: question.answer.choiceId })
      expect(verdict.correct, question.id).toBe(true)
    }
  })

  it('dễ tới mức không phải nghĩ: toàn bộ ở độ khó 1, lớp 1', () => {
    for (const question of TUTORIAL_QUESTIONS) {
      expect(question.difficulty, question.id).toBe(1)
      expect(question.grade, question.id).toBe(TUTORIAL_GRADE)
    }
  })

  /*
    Hàng đợi phải phủ được CẢ lượt ra đòn lẫn lượt đỡ đòn.

    Thiếu một câu là `next()` trong `store/game.ts` bốc bù từ ngân hàng THẬT, và
    một câu Toán lớp 5 rơi vào giữa bàn hướng dẫn thì vừa lạc lõng vừa phá lời
    hứa "bàn này không chấm điểm con".
  */
  it('đủ câu cho cả trận, không phải bốc bù từ ngân hàng thật', () => {
    // Trận dài nhất: `maxQuestions` lượt ra đòn, mỗi lượt kéo theo một lượt đỡ.
    expect(TUTORIAL_QUESTIONS.length).toBeGreaterThanOrEqual(TUTORIAL_MAX_QUESTIONS * 2)
  })
})

describe('con quái của bàn hướng dẫn', () => {
  it('cùng hệ với vùng đất, nên đội mặc định luôn có một phép khắc chế nó', () => {
    const enemy = tutorialEnemy()
    expect(enemy.element).toBe(TUTORIAL_SUBJECT)

    // Đúng đội hình một hồ sơ mới ra trận, và đúng bộ chiêu ở cấp 1.
    const team = buildTeam([], TUTORIAL_SUBJECT, 3, {})
    const known = knownSpells(team, 1)
    const loadout = resolveLoadout(undefined, known, usableSlots(1, known.length))
    const elements = loadout.map((id) => SPELLS[id]!.element)

    expect(elements).toContain(counterElement(enemy.element))
    expect(
      elements.some((element) => matchupLabel(element, enemy.element) === 'strong'),
    ).toBe(true)
  })

  /*
    Tên trên thanh máu phải nói về CON ĐANG ĐỨNG TRƯỚC MẶT.

    Hình con quái do `variant` quyết định, không do tên - nên một cái tên nghe
    hay mà vẽ ra con khác là chuyện xảy ra được, và đã từng xảy ra (xem ghi chú
    ở `variant` trong `engine/battle.ts`). Ở bàn hướng dẫn thì nó tệ hơn ở chỗ
    khác: đây là con quái đầu tiên đời trẻ nhìn thấy trong game này.
  */
  it('tên khớp với hình: variant trỏ tới đúng con slime trong bầy Toán', () => {
    const enemy = tutorialEnemy()
    const family = MONSTER_FAMILY[TUTORIAL_SUBJECT]

    expect(enemy.variant).toBeGreaterThanOrEqual(0)
    expect(enemy.variant).toBeLessThan(family.length)
    expect(monsterSpriteFor(TUTORIAL_SUBJECT, enemy.variant, enemy.isBoss)).toBe(SLIME)
    expect(enemy.name.toLowerCase()).toContain('slime')
  })

  it('không phải trùm, và yếu tới mức không hạ nổi một con thú cấp 1', () => {
    const enemy = tutorialEnemy()
    expect(enemy.isBoss).toBe(false)

    const weakest = Math.min(...starterTeam(TUTORIAL_SUBJECT).map((pet) => pet.maxHp))
    // Bốn lượt đỡ đòn hụt sạch vẫn không gục con thú yếu nhất trong đội mặc định.
    expect(enemy.attack * TUTORIAL_MAX_QUESTIONS).toBeLessThan(weakest)
  })
})

/*
  ---- MÁU CON SLIME PHẢI SỐNG ĐƯỢC VỚI CẢ HAI ĐẦU CỦA KHOẢNG SÁT THƯƠNG ----

  Sát thương một đòn ở cấp 1 dao động gấp hơn ba lần tuỳ trẻ trả lời nhanh hay
  chậm, chọn đúng phép hay không (xem ghi chú ở `TUTORIAL_ENEMY_HP`). Hai test
  dưới đây khoá hai đầu ấy lại:

    - đầu CHẬM NHẤT vẫn phải thắng, nếu không thì một đứa trẻ đọc đề kỹ bị bàn
      hướng dẫn cho về làng;
    - đầu NHANH NHẤT không được thắng ngay đòn đầu, nếu không thì trẻ không bao
      giờ thấy lượt đỡ đòn - mà đó là nửa cơ chế của trận đấu.

  Cả hai đánh bằng engine thật, không bằng công thức chép lại: một ngày nào đó
  hằng số cân bằng trong `engine/battle.ts` đổi, và đây là chỗ báo.
*/
describe('trận tập luôn kết thúc như bàn hướng dẫn hứa', () => {
  /** Dựng trận tập y hệt `startTutorialBattle` trong `store/game.ts`. */
  function startFight(): BattleState {
    return createBattle(
      {
        enemy: tutorialEnemy(),
        player: statsForLevel(1),
        team: buildTeam([], TUTORIAL_SUBJECT, 3, {}),
        maxQuestions: TUTORIAL_MAX_QUESTIONS,
        timeLimitMs: null,
        defendLimitMs: 30_000,
      },
      TUTORIAL_QUESTIONS[0]!,
      NOW,
    )
  }

  /**
   * Hai lựa chọn hai đầu mà bảng chọn phép bày ra ở cấp 1: đòn nặng nhất và đòn
   * nhẹ nhất.
   *
   * Kèm theo CON THÚ TUNG PHÉP, vì `SpellPicker` gọi đúng con biết phép ấy ra
   * đánh chứ không dùng con đang đứng - mà sức của con thú nhân thẳng vào sát
   * thương. Bỏ qua chỗ này là đo hụt mất một phần mười đòn mạnh nhất, đúng phần
   * quyết định con slime có chết ngay đòn đầu hay không.
   */
  function spellsAtLevelOne(enemyElement: string) {
    const team = buildTeam([], TUTORIAL_SUBJECT, 3, {})
    const known = knownSpells(team, 1)
    const loadout = resolveLoadout(undefined, known, usableSlots(1, known.length))
    const options = loadout.flatMap((id) =>
      team.flatMap((pet, casterIndex) =>
        pet.spellIds.includes(id) ? [{ spell: SPELLS[id]!, casterIndex, pet }] : [],
      ),
    )
    const rank = (option: (typeof options)[number]) =>
      option.spell.power *
      option.pet.power *
      (matchupLabel(option.spell.element, enemyElement as never) === 'strong' ? 1.5 : 1)

    const sorted = [...options].sort((a, b) => rank(b) - rank(a))
    return { strong: sorted[0]!, weakest: sorted[sorted.length - 1]! }
  }

  /**
   * Đánh trọn một trận. `delayMs` là thời gian trẻ ngồi nghĩ mỗi câu, `best` là
   * có chọn đúng phép khắc chế hay không - hai thứ duy nhất trẻ điều khiển được.
   */
  function playThrough(delayMs: number, best: boolean): BattleState {
    let state = startFight()
    const { strong, weakest } = spellsAtLevelOne(state.enemy.element)
    let at = NOW
    let index = 0

    // Cắt vòng lặp ở một con số rộng rãi: trận có nhiều nhất bốn lượt ra đòn và
    // bốn lượt đỡ, nên chạm tới đây nghĩa là máy trạng thái bị treo.
    for (let guard = 0; guard < 40 && state.phase !== 'victory' && state.phase !== 'retreat'; guard++) {
      if (state.phase === 'ready') {
        state = beginAttack(state, at)
        continue
      }
      if (state.phase === 'warning') {
        state = beginDefend(state, at)
        continue
      }
      if (state.phase === 'question') {
        const question = state.question!
        at += delayMs
        if (question.type !== 'multiple-choice') throw new Error('đề hướng dẫn phải là trắc nghiệm')
        state = submitAnswer(state, { kind: 'choice', choiceId: question.answer.choiceId }, at)
        continue
      }
      if (state.phase === 'spell') {
        const pick = best ? strong : weakest
        state = castSpell(state, pick.spell, at, pick.casterIndex)
        continue
      }
      if (state.phase === 'feedback') {
        index++
        state = advance(state, TUTORIAL_QUESTIONS[index] ?? null, at)
      }
    }

    return state
  }

  it('trẻ trả lời CHẬM và chọn phép không khắc chế vẫn thắng', () => {
    // 20 giây mỗi câu: rơi vào bậc thưởng tốc độ thấp nhất (0,85).
    expect(playThrough(20_000, false).phase).toBe('victory')
  })

  it('trẻ trả lời NHANH và chọn đúng phép khắc chế cũng thắng', () => {
    expect(playThrough(1_000, true).phase).toBe('victory')
  })

  it('không ai hạ được con slime chỉ bằng MỘT đòn', () => {
    // Nếu một đòn là xong thì trận nhảy thẳng sang 'victory' và trẻ không bao
    // giờ nhìn thấy lượt đỡ đòn - mà đó là nửa cơ chế của trận đấu.
    let state = startFight()
    const { strong } = spellsAtLevelOne(state.enemy.element)
    const question = TUTORIAL_QUESTIONS[0]!
    if (question.type !== 'multiple-choice') throw new Error('đề hướng dẫn phải là trắc nghiệm')

    state = beginAttack(state, NOW)
    // Nhanh nhất có thể: thưởng tốc độ cao nhất, phép khắc chế, con thú khoẻ nhất.
    state = submitAnswer(state, { kind: 'choice', choiceId: question.answer.choiceId }, NOW)
    state = castSpell(state, strong.spell, NOW, strong.casterIndex)

    expect(state.enemyHp).toBeGreaterThan(0)
    expect(advance(state, TUTORIAL_QUESTIONS[1]!, NOW).phase).toBe('warning')
  })

  it('máu khai trong hằng số đúng bằng máu con quái mang ra trận', () => {
    expect(tutorialEnemy().maxHp).toBe(TUTORIAL_ENEMY_HP)
  })
})

describe('bản đồ của bàn hướng dẫn', () => {
  it('chặng cuối là trùm, các chặng trước đều là chặng đánh', () => {
    const nodes = tutorialNodes()
    expect(nodes[nodes.length - 1]!.kind).toBe('boss')
    expect(nodes.slice(0, -1).every((node) => node.kind === 'battle')).toBe(true)
  })

  it('đánh số liền nhau từ 0 - bộ sinh bản đồ tra chặng bằng chính số này', () => {
    expect(tutorialNodes().map((node) => node.index)).toEqual([0, 1, 2, 3])
  })

  /*
    Bốn chặng là con số nhỏ nhất cho ra một bản đồ TRÔNG NHƯ THẬT: hai chặng chỉ
    cho một bãi đất mười hai ô, và trên điện thoại dựng đứng nó là một ô chữ
    nhật bé xíu trôi giữa màn hình. Bốn chặng còn kéo theo một cái hang và hai
    ngôi nhà - đúng ba thứ cuốn sổ tay ở cuối bàn sẽ nhắc tới.
  */
  it('đủ chặng để bản đồ cao bằng một vùng đất thật', () => {
    expect(tutorialNodes().length).toBeGreaterThanOrEqual(4)
  })

  it('không chặng nào bị đánh dấu đã qua - bàn tập không có tiến độ', () => {
    for (const node of tutorialNodes()) expect(node.cleared).toBe(false)
  })
})

describe('lời người dẫn', () => {
  it('nói đúng việc phải làm ở từng pha của trận', () => {
    expect(battleCoach('ready', 'attack', 'Slime Tập Sự')).toContain('Tấn công')
    expect(battleCoach('spell', 'attack', 'Slime Tập Sự')).toContain('Khắc chế')
    expect(battleCoach('warning', 'defend', 'Slime Tập Sự')).toContain('ra đòn')
  })

  it('lượt đỡ đòn nói KHÁC lượt ra đòn, và gọi tên con quái', () => {
    const attacking = battleCoach('question', 'attack', 'Slime Tập Sự')
    const defending = battleCoach('question', 'defend', 'Slime Tập Sự')
    expect(attacking).not.toBe(defending)
    expect(defending).toContain('Slime Tập Sự')
  })

  it('im lặng ở những pha không có gì để chỉ', () => {
    expect(battleCoach('victory', 'attack', 'Slime Tập Sự')).toBeNull()
    expect(battleCoach('retreat', 'attack', 'Slime Tập Sự')).toBeNull()
  })

  it('lời dẫn mở màn có nhắc tới bốn mũi tên - cách điều khiển duy nhất trên điện thoại', () => {
    expect(WALK_SCRIPT.join(' ')).toContain('mũi tên')
  })
})

describe('sổ tay', () => {
  it('thẻ nào cũng có đủ biểu tượng, tên và nội dung', () => {
    for (const entry of HANDBOOK) {
      expect(entry.emoji, entry.title).toBeTruthy()
      expect(entry.title).toBeTruthy()
      expect(entry.body.length, entry.title).toBeGreaterThan(40)
    }
  })

  it('không có tên thẻ nào trùng nhau', () => {
    const titles = HANDBOOK.map((entry) => entry.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  /*
    Sổ tay phải nói ĐỦ những cơ chế mà bàn tập không diễn được.

    Danh sách này là hợp đồng: thêm một cơ chế lớn vào game mà quên nói với trẻ
    thì test này báo. Dò bằng TỪ KHOÁ chứ không bằng thứ tự, để viết lại câu chữ
    cho hay hơn không làm hỏng test.
  */
  it('nói đủ những thứ bàn tập không diễn được', () => {
    const all = HANDBOOK.map((entry) => `${entry.title} ${entry.body}`).join(' ')
    for (const keyword of [
      'Tháp',
      'thách đấu',
      'tiến hoá',
      'cỏ cao',
      'Đạo đức',
      'gợi ý',
      'kho đồ',
      'về làng',
    ]) {
      expect(all.toLowerCase(), keyword).toContain(keyword.toLowerCase())
    }
  })
})
