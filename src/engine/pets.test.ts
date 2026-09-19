/**
 * Vòng khắc chế là thứ khiến việc "chọn phép nào" có ý nghĩa. Nếu nó hở một
 * chỗ - có nguyên tố không khắc được ai, hoặc khắc được tất cả - thì quyết định
 * của trẻ mất giá trị ngay, mà nhìn bằng mắt rất khó thấy.
 */

import { describe, expect, it } from 'vitest'
import { SUBJECTS, type Subject } from '../content/types'
import {
  EVOLUTION_LEVELS,
  PETS,
  SPELLS,
  borrowedElement,
  companionOf,
  defaultCompanion,
  getPet,
  petsOfElement,
} from '../content/pets'
import { ALL_SPRITES } from '../features/pixel/creatures'
import {
  counterElement,
  evolutionStage,
  hasEvolved,
  justEvolved,
  MAX_PET_LEVEL,
  nextEvolution,
  petLevel,
  resolvePet,
  xpForLevel,
  xpToNextLevel,
  STRONG_MULTIPLIER,
  WEAK_MULTIPLIER,
  elementMultiplier,
  isAlive,
  matchupLabel,
  oppositeElement,
  toBattlePet,
  unlockedSpellIds,
} from './pets'

describe('khắc chế nguyên tố', () => {
  it('mỗi nguyên tố khắc ĐÚNG một nguyên tố khác', () => {
    for (const attack of SUBJECTS) {
      const strong = SUBJECTS.filter((d) => elementMultiplier(attack, d) === STRONG_MULTIPLIER)
      expect(strong, `${attack} phải khắc đúng một hệ`).toHaveLength(1)
    }
  })

  it('mỗi nguyên tố BỊ khắc bởi đúng một nguyên tố khác', () => {
    for (const defend of SUBJECTS) {
      const weak = SUBJECTS.filter((a) => elementMultiplier(a, defend) === WEAK_MULTIPLIER)
      expect(weak, `${defend} phải bị đúng một hệ khắc`).toHaveLength(1)
    }
  })

  it('không nguyên tố nào tự khắc chính mình', () => {
    for (const element of SUBJECTS) {
      expect(elementMultiplier(element, element)).toBe(1)
    }
  })

  it('vòng khắc chế khép kín và đi hết cả bốn hệ', () => {
    // Đi theo mũi tên "khắc" bốn bước phải quay về đúng chỗ xuất phát, và
    // không được lặp lại hệ nào giữa chừng - đó mới là một vòng thật.
    const beaten = (a: Subject) => SUBJECTS.find((d) => elementMultiplier(a, d) === STRONG_MULTIPLIER)!
    let current: Subject = 'math'
    const seen: Subject[] = [current]
    for (let i = 0; i < 3; i++) {
      current = beaten(current)
      seen.push(current)
    }
    expect(new Set(seen).size).toBe(4)
    expect(beaten(current)).toBe('math')
  })

  it('chọn sai hệ vẫn gây sát thương, không bao giờ bằng 0', () => {
    // Trả lời đúng mà đòn đánh vô tác dụng thì trẻ thấy như bị phạt.
    for (const a of SUBJECTS) {
      for (const d of SUBJECTS) {
        expect(elementMultiplier(a, d)).toBeGreaterThan(0)
      }
    }
  })

  it('nhãn khắc chế khớp với hệ số', () => {
    expect(matchupLabel('math', 'vietnamese')).toBe('strong')
    expect(matchupLabel('vietnamese', 'math')).toBe('weak')
    expect(matchupLabel('math', 'music')).toBe('neutral')
  })
})

describe('bộ thú và bộ phép', () => {
  it('mọi phép thú biết đều có thật', () => {
    for (const pet of PETS) {
      for (const id of pet.spellIds) {
        expect(SPELLS[id], `${pet.id} biết phép không tồn tại: ${id}`).toBeDefined()
      }
    }
  })

  it('thú nào cũng có ít nhất một phép CÙNG nguyên tố với mình', () => {
    for (const pet of PETS) {
      const same = pet.spellIds.filter((id) => SPELLS[id]!.element === pet.element)
      expect(same.length, `${pet.id} không có phép cùng hệ`).toBeGreaterThan(0)
    }
  })

  it('mỗi nguyên tố có đủ thú để chọn', () => {
    for (const element of SUBJECTS) {
      expect(petsOfElement(element).length, element).toBeGreaterThanOrEqual(3)
    }
  })

  it('id thú không trùng nhau', () => {
    expect(new Set(PETS.map((p) => p.id)).size).toBe(PETS.length)
  })

  it('getPet trả null với id lạ', () => {
    expect(getPet('khong-co-con-nay')).toBeNull()
  })
})

describe('hệ đối diện - đường ra của một con thú đi một mình', () => {
  it('đi HAI bước trong vòng khắc chế, nên đối diện của đối diện là chính nó', () => {
    for (const element of SUBJECTS) {
      expect(oppositeElement(oppositeElement(element)), element).toBe(element)
      expect(oppositeElement(element), element).not.toBe(element)
    }
  })

  it('hệ mượn BỊT ĐÚNG lỗ hổng: nó khắc được cái hệ đang khắc con thú', () => {
    /*
      Đây là cả lý do chiêu thứ ba tồn tại, và cũng là chỗ rất dễ làm sai.

      Con thú hệ Ngôn Từ sợ nhất quái hệ Số Học. Phản xạ đầu tiên là phát cho nó
      một chiêu Số Học - nhưng Số Học đánh Số Học chỉ ra 1,0, chẳng gỡ được gì.
      Thứ nó cần là hệ KHẮC ĐƯỢC Số Học.
    */
    for (const element of SUBJECTS) {
      const bully = counterElement(element)
      expect(
        elementMultiplier(oppositeElement(element), bully),
        `${element}: hệ mượn không khắc được kẻ đang khắc mình`,
      ).toBe(STRONG_MULTIPLIER)
    }
  })

  it('mọi con thú đều khai đúng hệ mượn ấy ở chiêu thứ ba', () => {
    for (const pet of PETS) {
      expect(borrowedElement(pet), pet.id).toBe(oppositeElement(pet.element))
      expect(SPELLS[pet.spellIds[2]!]!.element, pet.id).toBe(oppositeElement(pet.element))
    }
  })
})

describe('con thú đi theo trẻ', () => {
  it('con mặc định của mỗi môn cùng hệ với môn đó', () => {
    for (const subject of SUBJECTS) {
      expect(defaultCompanion(subject).element).toBe(subject)
    }
  })

  it('trẻ chọn con nào thì con ấy ra trận', () => {
    expect(companionOf(['cu-chu', 'rong-so'], 'rong-so', 'vietnamese').id).toBe('rong-so')
  })

  it('chưa chọn bao giờ thì phát con CÙNG HỆ với môn, trong số con đang có', () => {
    expect(companionOf(['gau-dem', 'cu-chu'], undefined, 'vietnamese').id).toBe('cu-chu')
  })

  it('chọn một con chưa thu phục thì rơi về con hợp môn nhất đang có', () => {
    expect(companionOf(['gau-dem'], 'rong-so', 'math').id).toBe('gau-dem')
  })

  it('id lạ trong danh sách đã thu phục thì bỏ qua', () => {
    expect(companionOf(['khong-ton-tai', 'rong-so'], undefined, 'math').id).toBe('rong-so')
  })

  it('tay trắng thì vẫn có một con ra trận - không bao giờ trả về rỗng', () => {
    for (const subject of SUBJECTS) {
      expect(companionOf([], undefined, subject).id).toBe(defaultCompanion(subject).id)
      expect(companionOf(undefined, undefined, subject)).toBeTruthy()
    }
  })

  it('con ra trận đã cộng cấp và đã tiến hoá, không phải dữ liệu gốc', () => {
    const raw = getPet('cu-chu')!
    const grown = companionOf(['cu-chu'], 'cu-chu', 'vietnamese', { 'cu-chu': xpForLevel(10) })
    expect(grown.maxHp).toBeGreaterThan(raw.maxHp)
    expect(grown.name).not.toBe(raw.name)
    expect(grown.spellIds).toHaveLength(4)
  })

  it('con chưa tiến hoá ra trận với ĐÚNG hai chiêu, không cầm sẵn chiêu cuối', () => {
    const fresh = companionOf(['cu-chu'], 'cu-chu', 'vietnamese')
    expect(fresh.spellIds).toHaveLength(2)
  })
})

describe('một con thú trong trận', () => {
  it('mới vào trận thì đầy máu và còn đứng được', () => {
    for (const subject of SUBJECTS) {
      const fighter = toBattlePet(defaultCompanion(subject))
      expect(fighter.hp).toBe(fighter.pet.maxHp)
      expect(isAlive(fighter)).toBe(true)
    }
  })

  it('hết máu là không còn đứng được', () => {
    const fighter = toBattlePet(defaultCompanion('math'))
    expect(isAlive({ ...fighter, hp: 0 })).toBe(false)
  })

  it('máu đủ dày để một con đi một mình chịu được cả trận', () => {
    /*
      Con số này từng là máu của BA con cộng lại. Bỏ đội mà quên nhân máu lên
      thì trẻ vào trận đầu tiên với 34 máu trước con quái đánh mỗi đòn tám
      điểm - bốn đòn là về làng, và không ai hiểu vì sao trận đấu ngắn thế.
    */
    for (const subject of SUBJECTS) {
      expect(defaultCompanion(subject).maxHp, subject).toBeGreaterThanOrEqual(80)
    }
  })
})

describe('cấp độ và tiến hoá', () => {
  it('chưa đánh trận nào thì ở cấp 1', () => {
    expect(petLevel(0)).toBe(1)
  })

  it('kinh nghiệm càng nhiều cấp càng cao, không bao giờ tụt', () => {
    let previous = 0
    for (let xp = 0; xp <= 2000; xp += 37) {
      const level = petLevel(xp)
      expect(level).toBeGreaterThanOrEqual(previous)
      previous = level
    }
  })

  it('cấp bị chặn trên, không tăng vô hạn', () => {
    expect(petLevel(1_000_000)).toBe(MAX_PET_LEVEL)
    expect(xpToNextLevel(1_000_000)).toBeNull()
  })

  it('mốc kinh nghiệm khớp với cấp', () => {
    for (let level = 1; level <= MAX_PET_LEVEL; level++) {
      expect(petLevel(xpForLevel(level)), `đủ mốc cấp ${level}`).toBe(level)
      if (level > 1) {
        expect(petLevel(xpForLevel(level) - 1), `thiếu 1 điểm thì chưa lên cấp ${level}`).toBe(
          level - 1,
        )
      }
    }
  })

  it('thanh tiến trình lên cấp luôn nằm trong khoảng 0 tới 100%', () => {
    for (let xp = 0; xp < xpForLevel(MAX_PET_LEVEL); xp += 13) {
      const next = xpToNextLevel(xp)!
      expect(next.into).toBeGreaterThanOrEqual(0)
      expect(next.into).toBeLessThan(next.span)
      expect(next.need).toBeGreaterThan(0)
    }
  })

  it('thú nào cũng có ĐỦ BA nấc tiến hoá, ở cấp 5, 10 và 20', () => {
    for (const pet of PETS) {
      expect(
        pet.evolutions.map((e) => e.atLevel),
        `${pet.id}: mốc tiến hoá sai`,
      ).toEqual([...EVOLUTION_LEVELS])
    }
  })

  it('nấc cuối đúng bằng cấp kịch trần - không có cấp nào thừa ra', () => {
    // Cấp nằm sau nấc cuối là cấp không dẫn tới đâu, và chính khoảng trống ấy là
    // thứ bản một nấc mắc phải: kịch cấp 10 mà nấc duy nhất nằm ở cấp 5.
    expect(EVOLUTION_LEVELS[EVOLUTION_LEVELS.length - 1]).toBe(MAX_PET_LEVEL)
  })

  it('tiến hoá làm thú KHOẺ HƠN ở MỌI nấc, không bao giờ yếu đi', () => {
    // Tiến hoá mà chỉ số tụt thì trẻ mất động lực nuôi thú ngay lập tức.
    for (const pet of PETS) {
      for (const evolution of pet.evolutions) {
        const before = resolvePet(pet, xpForLevel(evolution.atLevel) - 1)
        const after = resolvePet(pet, xpForLevel(evolution.atLevel))
        expect(after.maxHp, `${pet.id} nấc ${evolution.atLevel}: máu tụt`).toBeGreaterThan(
          before.maxHp,
        )
        expect(after.power, `${pet.id} nấc ${evolution.atLevel}: sức mạnh tụt`).toBeGreaterThan(
          before.power,
        )
      }
    }
  })

  it('tới kịch cấp thì con thú mở ĐỦ CẢ BỐN chiêu của mình', () => {
    // Nuôi tới cấp 20 mà vẫn thiếu chiêu thì phần thưởng của nấc cuối chỉ là
    // vài điểm máu - không đáng cả trăm trận.
    for (const pet of PETS) {
      const top = resolvePet(pet, xpForLevel(MAX_PET_LEVEL))
      expect(top.spellIds, pet.id).toEqual(pet.spellIds)
    }
  })

  it('chiêu mở theo NẤC TIẾN HOÁ, không theo cấp của trẻ', () => {
    for (const pet of PETS) {
      expect(unlockedSpellIds(pet, 0), pet.id).toHaveLength(2)
      expect(unlockedSpellIds(pet, xpForLevel(5)), pet.id).toHaveLength(3)
      expect(unlockedSpellIds(pet, xpForLevel(10)), pet.id).toHaveLength(4)
      expect(unlockedSpellIds(pet, xpForLevel(20)), pet.id).toHaveLength(4)
    }
  })

  it('tiến hoá KHÔNG đổi hệ - con thú vẫn là con thú đó', () => {
    for (const pet of PETS) {
      for (const level of EVOLUTION_LEVELS) {
        expect(resolvePet(pet, xpForLevel(level)).element).toBe(pet.element)
        expect(resolvePet(pet, xpForLevel(level)).id).toBe(pet.id)
      }
    }
  })

  it('đổi tên và đổi hình đúng lúc đạt từng cấp tiến hoá', () => {
    const pet = PETS[0]!
    let previousName = pet.name
    for (const evolution of pet.evolutions) {
      const mark = xpForLevel(evolution.atLevel)
      expect(resolvePet(pet, mark - 1).name).toBe(previousName)
      expect(resolvePet(pet, mark).name).toBe(evolution.name)
      previousName = evolution.name
    }
  })

  it('đếm đúng nấc thú đang đứng', () => {
    const pet = PETS[0]!
    expect(evolutionStage(pet, 0)).toBe(0)
    expect(hasEvolved(pet, 0)).toBe(false)
    pet.evolutions.forEach((evolution, index) => {
      expect(evolutionStage(pet, xpForLevel(evolution.atLevel) - 1)).toBe(index)
      expect(evolutionStage(pet, xpForLevel(evolution.atLevel))).toBe(index + 1)
      expect(hasEvolved(pet, xpForLevel(evolution.atLevel))).toBe(true)
    })
  })

  it('nấc kế tiếp luôn là nấc gần nhất còn ở phía trước', () => {
    const pet = PETS[0]!
    expect(nextEvolution(pet, 0)?.atLevel).toBe(EVOLUTION_LEVELS[0])
    expect(nextEvolution(pet, xpForLevel(EVOLUTION_LEVELS[0]))?.atLevel).toBe(EVOLUTION_LEVELS[1])
    // Lên hết rồi thì không còn gì để ngóng - giao diện dựa vào null này để đổi
    // sang câu "đã tới hình thái cuối cùng".
    expect(nextEvolution(pet, xpForLevel(MAX_PET_LEVEL))).toBeNull()
  })

  it('chỉ báo tiến hoá ĐÚNG MỘT LẦN, ở trận vượt qua mốc', () => {
    // Báo lại ở mọi trận sau đó thì lời chúc mừng thành tiếng ồn.
    const pet = PETS[0]!
    const mark = xpForLevel(pet.evolutions[0]!.atLevel)
    expect(justEvolved(pet, mark - 10, mark)?.name).toBe(pet.evolutions[0]!.name)
    expect(justEvolved(pet, mark, mark + 10)).toBeNull()
    expect(justEvolved(pet, 0, mark - 10)).toBeNull()
  })

  it('nhảy qua hai nấc trong một trận thì báo NẤC CAO NHẤT', () => {
    // Trẻ cần thấy hình cuối cùng con thú đang mang, không phải hình nó vừa đi
    // ngang qua - báo nấc giữa là báo một con thú không còn tồn tại.
    const pet = PETS[0]!
    const crossed = justEvolved(pet, 0, xpForLevel(pet.evolutions[1]!.atLevel))
    expect(crossed?.name).toBe(pet.evolutions[1]!.name)
  })

  it('con ra trận dùng hình ĐÃ tiến hoá khi đủ cấp', () => {
    const id = defaultCompanion('math').id
    const base = companionOf([id], id, 'math')
    const grown = companionOf([id], id, 'math', { [id]: xpForLevel(9) })
    expect(grown.maxHp).toBeGreaterThan(base.maxHp)
    expect(grown.name).not.toBe(base.name)
  })
})

describe('hình thái tiến hoá phải NHÌN THẤY được', () => {
  /** Số điểm ảnh đặc của một hình - thước đo "to hơn" duy nhất đọc được bằng máy. */
  const filled = (id: string) =>
    ALL_SPRITES[id]!.rows.join('').split('').filter((c) => c !== '.').length

  it('mỗi nấc ĐỔI HÌNH, không chỉ đổi tên', () => {
    // Đây đúng là lỗi đã mắc một lần: mọi hình tiến hoá trỏ về chính hình gốc,
    // nên trẻ nuôi cả chục trận mà con thú trông y hệt lúc mới bắt.
    for (const pet of PETS) {
      const sprites = [pet.sprite, ...pet.evolutions.map((e) => e.sprite)]
      expect(new Set(sprites).size, `${pet.id}: có hai nấc trùng hình`).toBe(sprites.length)
    }
  })

  it('mọi hình tiến hoá đều có thật trong bộ sprite', () => {
    for (const pet of PETS) {
      for (const evolution of pet.evolutions) {
        expect(ALL_SPRITES[evolution.sprite], `${pet.id}: thiếu hình ${evolution.sprite}`).toBeDefined()
      }
    }
  })

  it('hình tiến hoá vẫn tô được theo nguyên tố', () => {
    // `recolor` chỉ đổi các ký tự B, S và viền. Hình nào không dùng B thì tiến
    // hoá xong mất luôn màu hệ, nhìn thành một con xám lạc loài.
    for (const pet of PETS) {
      for (const evolution of pet.evolutions) {
        const sprite = ALL_SPRITES[evolution.sprite]!
        expect(sprite.palette.B, `${evolution.sprite}: không có ký tự thân B`).toBeDefined()
      }
    }
  })

  it('nấc sau to hơn nấc trước - mỗi lần tiến hoá phải bệ vệ hơn thấy rõ', () => {
    for (const pet of PETS) {
      const chain = [pet.sprite, ...pet.evolutions.map((e) => e.sprite)]
      for (let i = 1; i < chain.length; i++) {
        expect(
          filled(chain[i]!),
          `${pet.id}: hình ${chain[i]} không to hơn ${chain[i - 1]}`,
        ).toBeGreaterThan(filled(chain[i - 1]!))
      }
    }
  })
})
