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
  buildTeam,
  getPet,
  petsOfElement,
  starterTeam,
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
  nextAlive,
  teamAlive,
  teamHp,
  toBattlePet,
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

describe('đội hình', () => {
  it('đội mặc định luôn đủ ba thú và đủ ba nguyên tố KHÁC nhau', () => {
    // Ba hệ khác nhau nghĩa là gặp quái hệ nào trẻ cũng có đường khắc chế.
    for (const subject of SUBJECTS) {
      const team = starterTeam(subject)
      expect(team).toHaveLength(3)
      expect(new Set(team.map((p) => p.element)).size).toBe(3)
    }
  })

  it('đội hình LUÔN có con khắc chế được quái của vùng đó', () => {
    // Đây là điều kiện để bảng chọn phép có ít nhất một lựa chọn tốt. Thiếu nó
    // thì trẻ bấm nút nào cũng "bị khắc", và quyết định thành giả.
    for (const subject of SUBJECTS) {
      const counter = counterElement(subject)
      expect(
        starterTeam(subject).some((p) => p.element === counter),
        `${subject}: đội mặc định không có con khắc chế`,
      ).toBe(true)

      // Kể cả khi trẻ đã thu phục ba con cùng một hệ khác.
      const hoarded = petsOfElement(subject).map((p) => p.id)
      expect(
        buildTeam(hoarded, subject).some((p) => p.element === counter),
        `${subject}: đội dựng từ thú đã thu phục mất con khắc chế`,
      ).toBe(true)
    }
  })

  it('đội mặc định mở đầu bằng thú cùng nguyên tố với môn đang học', () => {
    for (const subject of SUBJECTS) {
      expect(starterTeam(subject)[0]!.element).toBe(subject)
    }
  })

  it('thú đã thu phục được xếp trước, thú cùng hệ với môn đứng đầu', () => {
    const team = buildTeam(['gau-dem', 'cu-chu'], 'vietnamese')
    expect(team[0]!.id).toBe('cu-chu')
    expect(team.map((p) => p.id)).toContain('gau-dem')
    expect(team).toHaveLength(3)
  })

  it('id lạ trong danh sách đã thu phục thì bỏ qua, vẫn đủ đội', () => {
    const team = buildTeam(['khong-ton-tai', 'rong-so'], 'math')
    expect(team).toHaveLength(3)
    expect(team.map((p) => p.id)).toContain('rong-so')
  })

  it('không có thú nào thì vẫn ra đội mặc định', () => {
    expect(buildTeam([], 'music')).toHaveLength(3)
  })

  it('đội không bao giờ có hai thú trùng nhau', () => {
    for (const subject of SUBJECTS) {
      const team = buildTeam([starterTeam(subject)[0]!.id], subject)
      expect(new Set(team.map((p) => p.id)).size).toBe(team.length)
    }
  })
})

describe('đội hình trong trận', () => {
  const team = () => starterTeam('math').map(toBattlePet)

  it('mới vào trận thì thú nào cũng đầy máu', () => {
    for (const p of team()) {
      expect(p.hp).toBe(p.pet.maxHp)
      expect(isAlive(p)).toBe(true)
    }
  })

  it('gọi thú tiếp theo còn sống', () => {
    const t = team()
    t[1]!.hp = 0
    expect(nextAlive(t, 0)).toBe(2)
  })

  it('QUAY VÒNG về đầu đội chứ không chỉ tiến về sau', () => {
    // Thú số 1 gục trước, rồi thú số 3 gục: thú số 2 vẫn phải được gọi ra.
    const t = team()
    t[0]!.hp = 0
    expect(nextAlive(t, 2)).toBe(1)
  })

  it('cả đội gục thì trả -1', () => {
    const t = team()
    for (const p of t) p.hp = 0
    expect(nextAlive(t, 0)).toBe(-1)
    expect(teamAlive(t)).toBe(0)
  })

  it('đếm đúng số thú còn đứng được', () => {
    const t = team()
    t[0]!.hp = 0
    expect(teamAlive(t)).toBe(2)
  })

  it('máu cả đội cộng dồn đúng', () => {
    const t = team()
    const full = teamHp(t)
    expect(full.hp).toBe(full.maxHp)
    t[0]!.hp -= 10
    expect(teamHp(t).hp).toBe(full.hp - 10)
    expect(teamHp(t).maxHp).toBe(full.maxHp)
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

  it('tiến hoá học THÊM phép chứ không mất phép cũ, kể cả khi nhảy hai nấc một lúc', () => {
    for (const pet of PETS) {
      const top = resolvePet(pet, xpForLevel(MAX_PET_LEVEL))
      for (const id of pet.spellIds) {
        expect(top.spellIds, `${pet.id} mất phép gốc ${id}`).toContain(id)
      }
      // Nhảy thẳng từ cấp 1 lên kịch cấp: phép của những nấc đi ngang qua cũng
      // phải theo về, không chỉ phép của nấc cuối.
      for (const evolution of pet.evolutions) {
        for (const id of evolution.spellIds) {
          expect(top.spellIds, `${pet.id} thiếu phép nấc ${evolution.atLevel}`).toContain(id)
        }
      }
    }
  })

  it('tới nấc cuối thú biết ĐỦ CẢ BỐN phép của hệ mình', () => {
    // Nuôi tới cấp 20 mà bảng phép vẫn thiếu thì phần thưởng của nấc cuối chỉ là
    // vài điểm máu - không đáng cả trăm trận.
    for (const pet of PETS) {
      const top = resolvePet(pet, xpForLevel(MAX_PET_LEVEL))
      const ofElement = Object.values(SPELLS).filter((s) => s.element === pet.element)
      for (const spell of ofElement) {
        expect(top.spellIds, `${pet.id} thiếu phép ${spell.id}`).toContain(spell.id)
      }
    }
  })

  it('phép học thêm khi tiến hoá đều là phép có thật và cùng hệ', () => {
    for (const pet of PETS) {
      for (const evolution of pet.evolutions) {
        for (const id of evolution.spellIds) {
          expect(SPELLS[id], `${pet.id}: phép tiến hoá không tồn tại`).toBeDefined()
          expect(SPELLS[id]!.element, `${pet.id}: phép tiến hoá khác hệ`).toBe(pet.element)
        }
      }
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

  it('đội hình dùng thú ĐÃ tiến hoá khi đủ cấp', () => {
    const id = starterTeam('math')[0]!.id
    const base = buildTeam([id], 'math')[0]!
    const grown = buildTeam([id], 'math', 3, { [id]: xpForLevel(9) })[0]!
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
