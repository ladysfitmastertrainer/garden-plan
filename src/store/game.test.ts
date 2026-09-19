/**
 * Chơi trọn vòng lặp game bằng store thật, nội dung thật, engine thật -
 * chỉ tầng lưu trữ là bản trong bộ nhớ.
 *
 * Đây là kiểm chứng chính của giai đoạn giao diện: nếu test này xanh thì luồng
 * "chọn hồ sơ → bản đồ → trận đấu → phần thưởng → lưu tiến độ" chạy đúng, kể cả
 * khi chưa mở trình duyệt.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRepository } from '../data/memory'
import { regionKey } from '../data/types'
import type { Question } from '../content/types'
import { petLevel, xpForLevel } from '../engine/pets'
import { configureRepository, useGame } from './game'
import { useUi } from './ui'

// Web Audio không có trong môi trường test - chặn lại để không ném lỗi.
vi.mock('../audio/synth', () => ({
  playEffect: () => {},
  playAudio: () => 0,
  ensureAudioContext: () => null,
  audioDurationMs: () => 0,
}))

const repository = createMemoryRepository()
configureRepository(repository)

/** Trả lời ĐÚNG câu đang hiện, bất kể thể loại. */
function answerCorrectly(question: Question): void {
  const { answer } = useGame.getState()
  switch (question.type) {
    case 'multiple-choice':
    case 'audio-choice':
      answer({ kind: 'choice', choiceId: question.answer.choiceId })
      break
    case 'numeric-input':
      answer({ kind: 'numeric', value: question.answer.value })
      break
    case 'text-input':
      answer({ kind: 'text', value: question.answer.accepted[0]! })
      break
    case 'drag-order':
      answer({ kind: 'order', orderedIds: question.answer.orderedIds })
      break
    case 'match-pairs':
      answer({ kind: 'pairs', pairs: question.answer.pairs })
      break
    case 'rhythm-tap': {
      const beatMs = 60_000 / question.audio.tempo
      const timestamps = [0]
      for (let i = 0; i < question.audio.pattern.length - 1; i++) {
        timestamps.push(timestamps[i]! + question.audio.pattern[i]! * beatMs)
      }
      answer({ kind: 'rhythm', timestampsMs: timestamps })
      break
    }
    case 'scenario': {
      const good = question.options.find((o) => o.quality === 'good')!
      answer({ kind: 'choice', choiceId: good.id })
      break
    }
  }
}

/** Trả lời SAI câu đang hiện. Với Đạo đức là chọn phương án chưa tốt. */
function answerWrongly(question: Question): void {
  const { answer } = useGame.getState()
  switch (question.type) {
    case 'multiple-choice':
    case 'audio-choice': {
      const wrong = question.choices.find((c) => c.id !== question.answer.choiceId)!
      answer({ kind: 'choice', choiceId: wrong.id })
      break
    }
    case 'numeric-input':
      answer({ kind: 'numeric', value: question.answer.value + 12345 })
      break
    case 'text-input':
      answer({ kind: 'text', value: 'xxxxx-khong-dung' })
      break
    case 'drag-order':
      answer({ kind: 'order', orderedIds: [...question.answer.orderedIds].reverse() })
      break
    case 'match-pairs': {
      const pairs = question.answer.pairs
      const rotated = pairs.map((p, i) => ({
        leftId: p.leftId,
        rightId: pairs[(i + 1) % pairs.length]!.rightId,
      }))
      answer({ kind: 'pairs', pairs: rotated })
      break
    }
    case 'rhythm-tap':
      answer({
        kind: 'rhythm',
        timestampsMs: question.audio.pattern.map((_, i) => i * 5_000),
      })
      break
    case 'scenario': {
      const poor = question.options.find((o) => o.quality === 'poor')
      answer({ kind: 'choice', choiceId: (poor ?? question.options[0]!).id })
      break
    }
  }
}

/**
 * Chơi tới khi trận kết thúc. `mode` quyết định trả lời đúng hay sai.
 *
 * Trần vòng lặp gấp đôi so với trước, vì một vòng giờ có hai lượt: con ra đòn,
 * rồi quái ra đòn. Mười lượt ra đòn kéo theo tới bốn mươi bước máy trạng thái.
 */
async function playBattle(mode: 'win' | 'lose'): Promise<void> {
  for (let guard = 0; guard < 200; guard++) {
    const state = useGame.getState()
    if (!state.battle) break
    if (state.battle.phase === 'warning') {
      // Trong app, nhịp cảnh báo tự hết sau một giây rưỡi. Ở test thì gọi thẳng.
      state.defend()
    } else if (state.battle.phase === 'ready') {
      // Pha chờ: sân đấu một mình trên màn hình, trẻ bấm "Tấn công" mới đi tiếp.
      state.attack()
    } else if (state.battle.phase === 'question' && state.battle.question) {
      if (mode === 'win') answerCorrectly(state.battle.question)
      else answerWrongly(state.battle.question)
    } else if (state.battle.phase === 'spell') {
      // Trả lời đúng xong phải chọn phép thì đòn mới thật sự tung ra.
      state.cast(state.battle.pet.pet.spellIds[0]!)
    } else if (state.battle.phase === 'feedback') {
      state.next()
    } else {
      // victory / retreat - trong app là useEffect gọi, ở test gọi thẳng.
      await state.closeBattle()
      break
    }
  }
}

async function newStudent(grade: 1 | 2 | 3 | 4 | 5 = 1) {
  await useGame.getState().init()
  await useGame.getState().createStudent({ name: 'Bé Test', avatar: '🦊', grade })
}

beforeEach(() => {
  repository.reset()
  useUi.setState({ beatenMonsters: [], pendingMonster: null })
  useGame.setState({
    ready: false,
    students: [],
    student: null,
    progress: {
      mastery: {},
      inventory: [],
      virtues: {},
      clearedNodes: {},
      battlesPlayed: 0,
      battlesWon: 0,
    },
    battle: null,
    battleSubject: null,
    battleNode: null,
    queue: [],
    queueIndex: 0,
    summary: null,
  })
})

describe('hồ sơ học sinh', () => {
  it('tạo hồ sơ xong là vào chơi được ngay', async () => {
    await newStudent(1)
    const { student } = useGame.getState()
    expect(student?.name).toBe('Bé Test')
    expect(student?.grade).toBe(1)
    expect(student?.gold).toBe(0)
  })

  it('xoá hồ sơ thì xoá luôn tiến độ', async () => {
    await newStudent()
    const id = useGame.getState().student!.id
    await useGame.getState().deleteStudent(id)
    expect(useGame.getState().students).toHaveLength(0)
    expect(useGame.getState().student).toBeNull()
  })
})

describe('bản đồ', () => {
  it('học sinh mới vào được MỌI chặng, kể cả trùm cuối', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')

    // Không còn khoá chặng: nhảy thẳng vào chặng cuối cũng mở được trận. Cái
    // chặn là con quái mạnh dần, không phải một cánh cửa.
    for (const node of [map.nodes[0]!, map.nodes[map.nodes.length - 1]!]) {
      useGame.setState({ battle: null })
      useGame.getState().startBattle('math', node)
      expect(useGame.getState().battle, `chặng ${node.id} không mở được trận`).not.toBeNull()
    }
    useGame.setState({ battle: null })

    // Chặng gợi ý vẫn là chặng chưa qua đầu tiên - trẻ vẫn được dẫn đường.
    expect(map.nextNode?.id).toBe(map.nodes[0]!.id)
  })

  it('trùm cuối mạnh hơn hẳn chặng đầu, đó mới là thứ chặn trẻ lại', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')

    useGame.getState().startBattle('math', map.nodes[0]!)
    const first = useGame.getState().battle!.enemy
    useGame.setState({ battle: null })

    useGame.getState().startBattle('math', map.nodes[map.nodes.length - 1]!)
    const boss = useGame.getState().battle!.enemy
    useGame.setState({ battle: null })

    expect(boss.maxHp).toBeGreaterThan(first.maxHp * 2)
    expect(boss.attack).toBeGreaterThan(first.attack)
    expect(boss.isBoss).toBe(true)
  })

  it('bản đồ luôn kết thúc bằng một trận trùm', async () => {
    await newStudent(2)
    const map = useGame.getState().worldMap('vietnamese')
    expect(map.nodes.at(-1)!.kind).toBe('boss')
  })
})

describe('màn tổng kết hiện ngay, không đợi lưu xong', () => {
  it('phần thưởng lên màn hình TRƯỚC khi kho lưu trữ trả lời', async () => {
    /*
      Bản trước chờ ba lượt gọi máy chủ nối nhau - lưu hồ sơ, lưu tiến độ, rồi
      lấy lại cả danh sách hồ sơ - xong mới đặt màn tổng kết. Trên mạng trường
      học thì đó là một hai giây màn hình đứng im ngay sau khi trẻ vừa hạ được
      con quái: đúng khoảnh khắc đáng ăn mừng nhất lại là lúc game trông như
      treo.

      Test này giữ đúng thứ tự ấy, và nó phải giữ bằng một kho lưu trữ CHẬM -
      với kho trong bộ nhớ thì mọi thứ xong trong cùng một nhịp, và cả hai thứ
      tự đều xanh như nhau.
    */
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useGame.getState().startBattle('math', map.nodes[0]!)

    // Đánh cho tới lúc thắng, nhưng CHƯA chốt sổ.
    for (let guard = 0; guard < 200; guard++) {
      const state = useGame.getState()
      const battle = state.battle
      if (!battle || battle.phase === 'victory' || battle.phase === 'retreat') break
      if (battle.phase === 'warning') state.defend()
      else if (battle.phase === 'ready') state.attack()
      else if (battle.phase === 'question' && battle.question) answerCorrectly(battle.question)
      else if (battle.phase === 'spell') state.cast(battle.pet.pet.spellIds[0]!)
      else if (battle.phase === 'feedback') state.next()
    }
    expect(useGame.getState().battle?.phase).toBe('victory')

    // Kho lưu trữ đứng im cho tới khi mình cho phép.
    let mocuatkho = () => {}
    const cho = new Promise<void>((resolve) => {
      mocuatkho = resolve
    })
    configureRepository({
      ...repository,
      saveProgress: async (id, progress) => {
        await cho
        return repository.saveProgress(id, progress)
      },
    })

    const xong = useGame.getState().closeBattle()
    // Nhường vài nhịp cho React và cho các lời hứa đã xong chạy tiếp.
    await Promise.resolve()
    await Promise.resolve()

    expect(useGame.getState().summary, 'phần thưởng phải có mặt trước khi lưu xong').not.toBeNull()
    expect(useGame.getState().summary?.victory).toBe(true)

    mocuatkho()
    await xong
    configureRepository(repository)
  })
})

describe('quái bị hạ thì biến khỏi bản đồ', () => {
  /*
    Đi qua ĐÚNG đường mà game đi: đụng vào con quái, đánh trọn trận, rồi mới xem
    kết quả.

    Kiểm riêng kho giao diện thì chỉ chứng minh mấy hàm ấy chạy đúng - không
    chứng minh được rằng `closeBattle` có gọi tới chúng hay không, mà đó mới là
    mối nối dễ đứt: nó nằm vắt giữa hai kho, và không có kiểu dữ liệu nào ràng
    buộc hai bên với nhau.
  */
  it('đụng vào rồi THẮNG: con quái đó vào danh sách đã hạ', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useUi.getState().bumpMonster('node-0')
    useGame.getState().startBattle('math', map.nodes[0]!)
    await playBattle('win')

    expect(useUi.getState().beatenMonsters).toContain('node-0')
  })

  it('đụng vào rồi THUA: con quái vẫn đứng đó', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useUi.getState().bumpMonster('node-0')
    useGame.getState().startBattle('math', map.nodes[0]!)
    await playBattle('lose')

    expect(useUi.getState().beatenMonsters).toEqual([])
  })
})

describe('vòng lặp trận đấu', () => {
  it('chơi thắng thì mở khoá chặng tiếp theo và nhận thưởng', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useGame.getState().startBattle('math', map.nodes[0]!)

    expect(useGame.getState().battle).not.toBeNull()
    await playBattle('win')

    const { summary, student, progress } = useGame.getState()
    expect(summary?.victory).toBe(true)
    expect(student!.gold).toBeGreaterThan(0)
    expect(student!.totalXp).toBeGreaterThan(0)
    expect(progress.clearedNodes[regionKey('math', 1)]).toBe(1)
    expect(progress.battlesWon).toBe(1)

    const mapAfter = useGame.getState().worldMap('math')
    expect(mapAfter.nodes[0]!.cleared).toBe(true)
    expect(mapAfter.nextNode?.id).toBe(mapAfter.nodes[1]!.id)
  })

  it('trả lời sai hết thì RÚT LUI, vẫn giữ kinh nghiệm và không mở khoá chặng mới', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useGame.getState().startBattle('math', map.nodes[0]!)
    await playBattle('lose')

    const { summary, student, progress } = useGame.getState()
    expect(summary?.victory).toBe(false)
    // Cố gắng vẫn được ghi nhận - đây là quy tắc chống nản của game.
    expect(student!.totalXp).toBeGreaterThan(0)
    expect(progress.clearedNodes[regionKey('math', 1)] ?? 0).toBe(0)
    expect(progress.battlesPlayed).toBe(1)
    expect(progress.battlesWon).toBe(0)
  })

  it('mức thạo được lưu NGAY sau mỗi câu, không đợi hết trận', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useGame.getState().startBattle('math', map.nodes[0]!)

    // Trận mở màn ở pha chờ - phải bấm "Tấn công" thì câu hỏi mới mở ra.
    useGame.getState().attack()
    const question = useGame.getState().battle!.question!
    answerCorrectly(question)

    const inMemory = useGame.getState().progress.mastery[question.skillId]
    expect(inMemory?.attempts).toBe(1)
    expect(inMemory?.correct).toBe(1)

    // Và đã nằm trong kho lưu trữ, không chỉ trong RAM.
    const saved = await repository.getProgress(useGame.getState().student!.id)
    expect(saved.mastery[question.skillId]?.attempts).toBe(1)
  })

  it('mọi câu trả lời đều được ghi nhật ký cho dashboard phụ huynh', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useGame.getState().startBattle('math', map.nodes[0]!)
    await playBattle('win')

    const attempts = await repository.listAttempts(useGame.getState().student!.id)
    expect(attempts.length).toBeGreaterThan(0)
    expect(attempts[0]).toHaveProperty('skillId')
    expect(attempts[0]).toHaveProperty('durationMs')
  })
})

describe('đi lại tự do giữa các vùng đất', () => {
  it('trẻ lớp 3 sang vùng lớp 1 thì nhận câu hỏi LỚP 1, không phải lớp 3', async () => {
    await newStudent(3)
    const map = useGame.getState().worldMap('math', 1)
    useGame.getState().startBattle('math', map.nodes[0]!, 1)

    const questions = useGame.getState().queue
    expect(questions.length).toBeGreaterThan(0)
    for (const question of questions) {
      expect(question.grade).toBe(1)
    }
  })

  it('tiến độ mỗi vùng tính riêng, không lẫn sang vùng lớp khác', async () => {
    await newStudent(3)

    // Đánh thắng chặng đầu ở vùng lớp 1.
    const g1 = useGame.getState().worldMap('math', 1)
    useGame.getState().startBattle('math', g1.nodes[0]!, 1)
    await playBattle('win')

    const { progress } = useGame.getState()
    expect(progress.clearedNodes[regionKey('math', 1)]).toBe(1)
    // Vùng lớp 3 chưa đụng tới thì vẫn phải là chưa đi chặng nào.
    expect(progress.clearedNodes[regionKey('math', 3)] ?? 0).toBe(0)

    const g3 = useGame.getState().worldMap('math', 3)
    expect(g3.nodes[0]!.cleared).toBe(false)
  })

  it('mọi vùng từ lớp 1 tới lớp của trẻ đều vào chơi được ngay', async () => {
    await newStudent(4)
    for (const subject of ['math', 'vietnamese', 'ethics', 'music'] as const) {
      for (const grade of [1, 2, 3, 4] as const) {
        const map = useGame.getState().worldMap(subject, grade)
        useGame.getState().startBattle(subject, map.nodes[0]!, grade)
        expect(useGame.getState().battle, `${subject} lớp ${grade} không mở được trận`).not.toBeNull()
        useGame.setState({ battle: null })
      }
    }
  })

  it('dữ liệu cũ lưu theo môn được chuyển sang khoá theo vùng khi mở hồ sơ', async () => {
    await newStudent(2)
    const id = useGame.getState().student!.id

    // Giả lập hồ sơ tạo từ phiên bản trước: khoá là 'math' chứ không phải 'math.g2'.
    await repository.saveProgress(id, {
      ...useGame.getState().progress,
      clearedNodes: { math: 3 } as Record<string, number>,
    })
    useGame.getState().leaveStudent()
    await useGame.getState().init()
    await useGame.getState().selectStudent(id)

    const { progress } = useGame.getState()
    expect(progress.clearedNodes[regionKey('math', 2)]).toBe(3)
    expect(progress.clearedNodes.math).toBeUndefined()
  })
})

describe('kho đồ và trang bị', () => {
  it('chỉ mặc được món đã thật sự có trong kho', async () => {
    await newStudent()
    await useGame.getState().toggleEquip('vuong-mien-so-hoc')
    expect(useGame.getState().student!.equippedItemIds).toEqual([])
  })

  it('mặc rồi cởi được, và được lưu lại', async () => {
    await newStudent()
    useGame.setState({
      progress: { ...useGame.getState().progress, inventory: ['mu-vai'] },
    })

    await useGame.getState().toggleEquip('mu-vai')
    expect(useGame.getState().student!.equippedItemIds).toContain('mu-vai')
    expect((await repository.listStudents())[0]!.equippedItemIds).toContain('mu-vai')

    await useGame.getState().toggleEquip('mu-vai')
    expect(useGame.getState().student!.equippedItemIds).not.toContain('mu-vai')
  })

  it('trang bị làm tăng máu tối đa trong trận', async () => {
    await newStudent()
    const map = useGame.getState().worldMap('math')

    useGame.getState().startBattle('math', map.nodes[0]!)
    const hpWithout = useGame.getState().battle!.player.maxHp
    useGame.setState({ battle: null })

    useGame.setState({
      progress: { ...useGame.getState().progress, inventory: ['giap-sao-bang'] },
    })
    await useGame.getState().toggleEquip('giap-sao-bang')
    useGame.getState().startBattle('math', map.nodes[0]!)

    expect(useGame.getState().battle!.player.maxHp).toBeGreaterThan(hpWithout)
  })
})

describe('quy tắc riêng môn Đạo đức', () => {
  it('chọn phương án chưa tốt KHÔNG làm mất máu', async () => {
    await newStudent(2)
    const map = useGame.getState().worldMap('ethics')
    useGame.getState().startBattle('ethics', map.nodes[0]!)

    const battle = useGame.getState().battle!
    const hpBefore = battle.playerHp
    answerWrongly(battle.question!)
    expect(useGame.getState().battle!.playerHp).toBe(hpBefore)
  })

  it('chọn phương án tốt thì tích điểm phẩm chất vào hồ sơ', async () => {
    await newStudent(2)
    const map = useGame.getState().worldMap('ethics')
    useGame.getState().startBattle('ethics', map.nodes[0]!)
    useGame.getState().attack()
    answerCorrectly(useGame.getState().battle!.question!)

    const virtues = useGame.getState().progress.virtues
    expect(Object.values(virtues).some((count) => (count ?? 0) > 0)).toBe(true)
  })
})

describe('chơi được cả 4 môn ở mọi lớp', () => {
  const subjects = ['math', 'vietnamese', 'ethics', 'music'] as const
  const grades = [1, 2, 3, 4, 5] as const

  for (const subject of subjects) {
    for (const grade of grades) {
      it(`${subject} lớp ${grade}: vào trận và đánh thắng được`, async () => {
        await newStudent(grade)
        const map = useGame.getState().worldMap(subject)
        useGame.getState().startBattle(subject, map.nodes[0]!)

        expect(useGame.getState().battle, `${subject} lớp ${grade} không vào được trận`).not.toBeNull()
        await playBattle('win')

        expect(useGame.getState().summary?.victory).toBe(true)
      })
    }
  }
})

describe('nuôi thú và tiến hoá', () => {
  it('đánh xong trận thì ĐÚNG con ra trận được cộng kinh nghiệm', async () => {
    /*
      Trọn vẹn cho một con, chứ không rải cho cả bộ sưu tập. Nuôi một con tới
      nấc tiến hoá thứ hai đã là cả một chặng; chia cho mười hai con đứng ngoài
      thì chặng ấy dài gấp mười hai lần, và không ai tới đích.
    */
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useGame.getState().startBattle('math', map.nodes[0]!)
    const fighter = useGame.getState().battle!.pet.pet.id

    await playBattle('win')

    const { progress, summary } = useGame.getState()
    expect(summary!.petXpGained).toBeGreaterThan(0)
    expect(progress.petXp?.[fighter]).toBe(summary!.petXpGained)
    expect(Object.keys(progress.petXp ?? {})).toEqual([fighter])
  })

  it('đủ kinh nghiệm thì thú tiến hoá và màn tổng kết báo tin', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')

    // Đặt một con sát mốc tiến hoá rồi đánh một trận cho nó vượt qua.
    useGame.getState().startBattle('math', map.nodes[0]!)
    const leader = useGame.getState().battle!.pet.pet.id
    useGame.setState({ battle: null })
    useGame.setState((s) => ({
      progress: { ...s.progress, petXp: { [leader]: xpForLevel(5) - 1 } },
    }))

    useGame.getState().startBattle('math', map.nodes[0]!)
    await playBattle('win')

    const { summary, progress } = useGame.getState()
    expect(summary!.petsEvolved.length).toBeGreaterThan(0)
    expect(summary!.petsEvolved[0]!.to).not.toBe(summary!.petsEvolved[0]!.from)
    expect(petLevel(progress.petXp![leader]!)).toBeGreaterThanOrEqual(5)
  })

  it('tiến hoá rồi thì trận sau KHÔNG báo lại nữa', async () => {
    // Báo lại ở mọi trận sau đó thì lời chúc mừng thành tiếng ồn.
    await newStudent(1)
    const map = useGame.getState().worldMap('math')
    useGame.getState().startBattle('math', map.nodes[0]!)
    const leader = useGame.getState().battle!.pet.pet.id
    useGame.setState({ battle: null })
    useGame.setState((s) => ({
      progress: { ...s.progress, petXp: { [leader]: xpForLevel(6) } },
    }))

    useGame.getState().startBattle('math', map.nodes[0]!)
    await playBattle('win')
    expect(useGame.getState().summary!.petsEvolved).toEqual([])
  })

  it('thú đã tiến hoá ra trận với chỉ số mạnh hơn', async () => {
    await newStudent(1)
    const map = useGame.getState().worldMap('math')

    useGame.getState().startBattle('math', map.nodes[0]!)
    const before = useGame.getState().battle!.pet
    const leader = before.pet.id
    useGame.setState({ battle: null })
    useGame.setState((s) => ({
      progress: { ...s.progress, pets: [leader], petXp: { [leader]: xpForLevel(6) } },
    }))

    useGame.getState().startBattle('math', map.nodes[0]!)
    const after = useGame.getState().battle!.pet
    expect(after.pet.id).toBe(leader)
    expect(after.pet.maxHp).toBeGreaterThan(before.pet.maxHp)
    expect(after.pet.name).not.toBe(before.pet.name)
  })
})
