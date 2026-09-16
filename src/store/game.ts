/**
 * Store trung tâm: nối engine (luật chơi) với nội dung và tầng lưu trữ.
 *
 * Nguyên tắc: store KHÔNG chứa luật chơi. Mọi phép tính sát thương, mức thạo,
 * phần thưởng đều gọi sang `src/engine`. Store chỉ điều phối và lưu.
 *
 * Tiến độ được ghi NGAY sau mỗi câu trả lời chứ không đợi hết trận, để trẻ đóng
 * máy giữa chừng vẫn không mất công sức.
 */

import { create } from 'zustand'
import { createEnemy } from '../content/bestiary'
import { getSkill } from '../content/curriculum'
import { PETS, SPELLS, buildTeam, getPet } from '../content/pets'
import { justEvolved } from '../engine/pets'
import { contentSource } from '../content/registry'
import { getTuning } from '../content/tuning'
import { buildWorldMap, type MapNode, type WorldMap } from '../content/worldmap'
import type { Grade, Question, Subject } from '../content/types'
import {
  advance as advanceBattle,
  createBattle,
  submitAnswer,
  timeLimitFor,
  timeUp as timeUpAction,
  useHint as useHintAction,
  type BattleState,
} from '../engine/battle'
import { castSpell } from '../engine/battle'
import type { AnswerInput } from '../engine/judge'
import { applyAttempt, getOrCreate, type MasteryMap } from '../engine/mastery'
import {
  bonusAwards,
  levelFromTotalXp,
  rollLoot,
  statsForLevel,
  findLootItem,
  type LootItem,
} from '../engine/rewards'
import { createRng } from '../engine/rng'
import { selectQuestion, selectQuestions, type SelectionContext } from '../engine/selector'
import { apiRepository } from '../data/api'
import {
  emptyProgress,
  migrateClearedNodes,
  regionKey,
  type Repository,
  type StoredAttempt,
  type StudentProfile,
  type StudentProgress,
} from '../data/types'
import { playEffect } from '../audio/synth'

/**
 * Tầng lưu trữ đang dùng.
 *
 * Chỉ còn một bản thật - `apiRepository`, gọi `/api`. Chỗ thay được lúc chạy vẫn
 * giữ, vì test chạy trọn vòng lặp game với repository trong bộ nhớ
 * (`data/memory.ts`) mà không cần máy chủ nào.
 */
let repository: Repository = apiRepository

export function getRepository(): Repository {
  return repository
}

export function configureRepository(next: Repository): void {
  repository = next
}

/** Số câu tối đa trong một trận. Đủ dài để có tiến triển, đủ ngắn để không chán. */

export interface BattleSummary {
  victory: boolean
  goldEarned: number
  xpEarned: number
  loot: LootItem | null
  leveledUp: boolean
  newLevel: number
  bonuses: ReturnType<typeof bonusAwards>
  accuracy: number
  bestCombo: number
  /** Thú thu phục được sau trận quái hoang. */
  petCaught: { id: string; name: string } | null
  /** Kinh nghiệm mỗi thú trong đội nhận được sau trận. */
  petXpGained: number
  /** Thú vừa tiến hoá: tên cũ và tên mới. */
  petsEvolved: Array<{ from: string; to: string }>
  /**
   * Những kỹ năng con trả lời sai trong trận, tên đọc được.
   *
   * Thua mà không biết vì sao thì lần sau cũng thua y hệt. Đây là chỗ biến một
   * trận thua thành một câu nói được: "con còn vướng ở phép cộng có nhớ".
   */
  missedSkills: string[]
  /** Có dựng lại được đúng trận này không - để hiện nút "Đánh lại ngay". */
  canRetry: boolean
}

interface GameState {
  ready: boolean
  students: StudentProfile[]
  student: StudentProfile | null
  progress: StudentProgress

  battle: BattleState | null
  battleSubject: Subject | null
  battleNode: MapNode | null
  /**
   * Trận vừa khép lại, giữ đủ tham số để dựng lại y hệt.
   *
   * Thua xong bắt trẻ đi bộ ngược về chỗ con quái là hình phạt nặng nhất trong
   * cả game này - nặng hơn mất vàng nhiều. Giữ lại đây để nút "Đánh lại ngay"
   * đưa con vào thẳng trận mới.
   */
  lastFight: {
    subject: Subject
    grade: Grade
    node: MapNode | null
    kind: 'node' | 'wild' | 'mini'
    variant?: number
  } | null
  /** Loại trận đang đánh. Quyết định tỉ lệ thu phục thú. */
  battleKind: 'node' | 'wild' | 'mini'
  /** Lớp của vùng đất đang chơi - có thể thấp hơn lớp của trẻ. */
  battleGrade: Grade | null
  /** Câu hỏi đã chọn sẵn cho cả trận. */
  queue: Question[]
  queueIndex: number
  summary: BattleSummary | null

  init: () => Promise<void>
  createStudent: (input: { name: string; avatar: string; grade: Grade }) => Promise<void>
  selectStudent: (studentId: string) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  leaveStudent: () => void
  /** Mặc hoặc cởi một món trang bị đã có trong kho. */
  toggleEquip: (itemId: string) => Promise<void>

  worldMap: (subject: Subject, grade?: Grade) => WorldMap
  startBattle: (subject: Subject, node: MapNode, grade?: Grade) => void
  /**
   * Trận gặp quái hoang khi đang đi cảnh: ngắn hơn trận ở cổng, không mở khoá
   * chặng nào, nhưng có cơ hội thu phục thú.
   */
  startWildBattle: (
    subject: Subject,
    grade?: Grade,
    kind?: 'wild' | 'mini',
    /** Con thứ mấy trong bầy - để con nhảy ra khỏi bụi cỏ đúng là con vào trận. */
    variant?: number,
  ) => void
  answer: (input: AnswerInput) => void
  /** Hết giờ một câu ở trận trùm / trận đầu đàn. Tính như trả lời sai. */
  timeUp: () => void
  /** Tung phép sau khi trả lời đúng. Chỉ có tác dụng ở pha chọn phép. */
  cast: (spellId: string, casterIndex?: number) => void
  useHint: () => void
  /** Sắp lại bộ chiêu mang ra trận. */
  setLoadout: (spellIds: string[]) => void
  next: () => void
  closeBattle: () => Promise<void>
  /** Đánh lại đúng con quái vừa thua, không phải đi bộ ngược về. */
  retryLastFight: () => void
}

/**
 * Phần việc chung sau MỘT lượt của trẻ, dù lượt đó kết thúc bằng một đáp án hay
 * bằng tiếng chuông hết giờ: cập nhật mức thạo, cộng điểm phẩm chất, lưu ngay
 * xuống máy, ghi lượt vào sổ và phát tiếng.
 *
 * Tách ra vì hai đường vào - `answer` và `timeUp` - phải ghi sổ GIỐNG HỆT nhau.
 * Một câu để hết giờ mà không vào sổ thì lịch ôn tập tưởng trẻ chưa gặp kỹ năng
 * đó bao giờ, và sẽ không xếp nó lên ôn lại.
 */
function commitBattleStep(
  next: BattleState,
  question: Question,
  now: number,
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
): void {
  const { battle, student, progress } = get()
  if (!battle || !student) return

  const record = next.answers[next.answers.length - 1]
  if (!record) return

  // Cập nhật mức thạo và LƯU NGAY - trẻ tắt máy giữa chừng vẫn giữ tiến độ.
  const mastery: MasteryMap = {
    ...progress.mastery,
    [question.skillId]: applyAttempt(
      getOrCreate(progress.mastery, question.skillId, now),
      {
        correct: record.correct,
        difficulty: record.difficulty,
        durationMs: record.durationMs,
        usedHint: record.usedHint,
      },
      now,
    ),
  }

  const virtues = { ...progress.virtues }
  for (const [virtue, count] of Object.entries(next.virtues)) {
    const key = virtue as keyof typeof virtues
    virtues[key] = (progress.virtues[key] ?? 0) + ((count ?? 0) - (battle.virtues[key] ?? 0))
  }

  const updatedProgress: StudentProgress = { ...progress, mastery, virtues }
  set({ battle: next, progress: updatedProgress })

  void repository.saveProgress(student.id, updatedProgress)
  void repository.recordAttempts([{ ...record, studentId: student.id } as StoredAttempt])

  playEffect(record.correct ? 'correct' : 'wrong')
}

export const useGame = create<GameState>((set, get) => ({
  ready: false,
  students: [],
  student: null,
  progress: emptyProgress(),

  battle: null,
  battleSubject: null,
  battleNode: null,
  lastFight: null,
  battleKind: 'node',
  battleGrade: null,
  queue: [],
  queueIndex: 0,
  summary: null,

  async init() {
    const students = await repository.listStudents()
    set({ students, ready: true })
  },

  async createStudent(input) {
    const student = await repository.createStudent(input)
    set({ students: await repository.listStudents() })
    await get().selectStudent(student.id)
  },

  async selectStudent(studentId) {
    const student = get().students.find((s) => s.id === studentId)
    if (!student) return
    const stored = await repository.getProgress(studentId)
    // Hồ sơ tạo trước khi có bản đồ theo vùng lưu tiến độ theo môn, chuyển sang
    // khoá theo vùng ngay lúc mở hồ sơ - chỗ duy nhất biết chắc lớp của trẻ.
    const progress = {
      ...stored,
      clearedNodes: migrateClearedNodes(stored.clearedNodes, student.grade),
    }
    const touched = { ...student, lastPlayedAt: Date.now() }
    await repository.saveStudent(touched)
    set({ student: touched, progress })
  },

  async deleteStudent(studentId) {
    await repository.deleteStudent(studentId)
    const students = await repository.listStudents()
    const isCurrent = get().student?.id === studentId
    set({
      students,
      ...(isCurrent ? { student: null, progress: emptyProgress() } : {}),
    })
  },

  leaveStudent() {
    set({ student: null, progress: emptyProgress(), battle: null, summary: null })
  },

  async toggleEquip(itemId) {
    const { student, progress } = get()
    if (!student) return
    // Chỉ mặc được món đã thật sự có trong kho.
    if (!progress.inventory.includes(itemId)) return

    const equipped = student.equippedItemIds.includes(itemId)
    const updated: StudentProfile = {
      ...student,
      equippedItemIds: equipped
        ? student.equippedItemIds.filter((id) => id !== itemId)
        : [...student.equippedItemIds, itemId],
    }

    set({ student: updated })
    await repository.saveStudent(updated)
    set({ students: await repository.listStudents() })
  },

  worldMap(subject, grade) {
    const { student, progress } = get()
    const target: Grade = grade ?? student?.grade ?? 1
    return buildWorldMap(
      subject,
      target,
      progress.clearedNodes[regionKey(subject, target)] ?? 0,
      progress.mastery,
      Date.now(),
    )
  },

  startBattle(subject, node, grade) {
    const { student, progress } = get()
    if (!student) return

    // Vùng đất quyết định lớp của câu hỏi, KHÔNG phải lớp của trẻ: em lớp 3 sang
    // ôn vùng lớp 1 thì phải nhận câu lớp 1, nếu không thì "ôn tập" vô nghĩa.
    const target: Grade = grade ?? student.grade

    const rng = createRng(`${student.id}-${node.id}-${Date.now()}`)
    const ctx: SelectionContext = {
      subject,
      grade: target,
      mastery: progress.mastery,
      now: Date.now(),
      rng,
      source: contentSource,
      // Node ôn tập chỉ hỏi bài đến hạn; node thường dùng tỉ lệ trộn mặc định.
      ...(node.kind === 'review' ? { weights: { review: 100, learning: 0, challenge: 0 } } : {}),
      // Trùm hỏi khó hơn hẳn một bậc, và ưu tiên bốc vào nhóm trẻ đã thạo - đây
      // là bài kiểm tra cuối vùng đất chứ không phải một chặng nữa.
      ...(node.kind === 'boss'
        ? { weights: { challenge: 70, review: 25, learning: 5 }, difficultyBoost: 1 }
        : {}),
    }

    const selections = selectQuestions(ctx, getTuning().questionsPerBattle)
    if (selections.length === 0) return

    const level = levelFromTotalXp(student.totalXp).level
    const bonus = student.equippedItemIds.reduce(
      (acc, id) => {
        const item = findLootItem(id)
        return {
          bonusHp: acc.bonusHp + (item?.bonus.bonusHp ?? 0),
          bonusPower: acc.bonusPower + (item?.bonus.bonusPower ?? 0),
        }
      },
      { bonusHp: 0, bonusPower: 0 },
    )

    const enemy = createEnemy({
      subject,
      grade: target,
      nodeIndex: node.index,
      isBoss: node.kind === 'boss',
      rng,
      // Cùng công thức với bản đồ đi cảnh, nên con quái trẻ nhắm tới ngoài đường
      // đúng là con hiện ra khi vào trận.
      variant: node.index,
    })

    const queue = selections.map((s) => s.question)
    set({
      battle: createBattle(
        {
          enemy,
          player: statsForLevel(level, bonus),
          team: buildTeam(progress.pets ?? [], subject, 3, progress.petXp ?? {}),
          maxQuestions: queue.length,
          timeLimitMs: node.kind === 'boss' ? timeLimitFor('boss', target) : null,
        },
        queue[0]!,
        Date.now(),
      ),
      battleSubject: subject,
      battleNode: node,
      lastFight: { subject, grade: target, node, kind: 'node' },
      battleKind: 'node',
      battleGrade: target,
      queue,
      queueIndex: 0,
      summary: null,
    })
  },

  startWildBattle(subject, grade, kind = 'wild', variant) {
    const { student, progress } = get()
    if (!student) return
    const target: Grade = grade ?? student.grade

    const cleared = progress.clearedNodes[regionKey(subject, target)] ?? 0
    const ctx: SelectionContext = {
      subject,
      grade: target,
      mastery: progress.mastery,
      now: Date.now(),
      source: contentSource,
      rng: createRng(`${student.id}-wild-${Date.now()}`),
      // Đầu đàn trong hang khó hơn quái dọc đường, nhưng dưới trùm một bậc:
      // chỉ nâng độ khó, không dồn hết sang nhóm thử thách như trận trùm.
      ...(kind === 'mini' ? { difficultyBoost: 1 } : {}),
    }
    // Trận ngắn: 5 câu cho quái hoang, 8 câu cho mini boss. Quái hoang là nhịp
    // nghỉ giữa các chặng, không phải một chặng nữa - kéo dài bằng trận ở cổng
    // thì đi cảnh thành cực hình.
    const selections = selectQuestions(ctx, kind === 'mini' ? 8 : 5)
    if (selections.length === 0) return

    const rng = createRng(`${student.id}-wildenemy-${Date.now()}`)
    const enemy = createEnemy({
      subject,
      grade: target,
      // Quái hoang yếu hơn quái ở cổng cùng khu vực một bậc; mini boss thì mạnh
      // hơn quái thường nhưng vẫn dưới trùm cuối.
      nodeIndex: kind === 'mini' ? cleared + 2 : Math.max(0, cleared - 1),
      isBoss: false,
      rng,
      // Mini boss trong hang luôn là con dữ nhất bầy - khớp với hình đứng trong
      // hang. Quái hoang thì lấy đúng con vừa nhảy ra khỏi bụi cỏ.
      ...(kind === 'mini' ? { variant: 3 } : variant === undefined ? {} : { variant }),
    })

    const level = levelFromTotalXp(student.totalXp).level
    const bonus = student.equippedItemIds.reduce(
      (acc, id) => {
        const item = findLootItem(id)
        return {
          bonusHp: acc.bonusHp + (item?.bonus.bonusHp ?? 0),
          bonusPower: acc.bonusPower + (item?.bonus.bonusPower ?? 0),
        }
      },
      { bonusHp: 0, bonusPower: 0 },
    )

    const queue = selections.map((sel) => sel.question)
    set({
      battle: createBattle(
        {
          enemy:
            kind === 'mini'
              ? {
                  ...enemy,
                  name: `${enemy.name} Đầu Đàn`,
                  maxHp: Math.round(enemy.maxHp * 1.35),
                  attack: enemy.attack + 3,
                  goldReward: enemy.goldReward * 2,
                  xpReward: enemy.xpReward * 2,
                }
              : { ...enemy, name: `${enemy.name} hoang`, maxHp: Math.round(enemy.maxHp * 0.6) },
          player: statsForLevel(level, bonus),
          team: buildTeam(progress.pets ?? [], subject, 3, progress.petXp ?? {}),
          maxQuestions: queue.length,
          timeLimitMs: kind === 'mini' ? timeLimitFor('mini', target) : null,
        },
        queue[0]!,
        Date.now(),
      ),
      battleSubject: subject,
      battleNode: null,
      lastFight: { subject, grade: target, node: null, kind, variant },
      battleKind: kind,
      battleGrade: target,
      queue,
      queueIndex: 0,
      summary: null,
    })
  },

  answer(input) {
    const { battle, student } = get()
    if (!battle || !battle.question || !student) return

    const now = Date.now()
    commitBattleStep(submitAnswer(battle, input, now), battle.question, now, set, get)
  },

  timeUp() {
    const { battle, student } = get()
    if (!battle || !battle.question || !student) return
    if (battle.phase !== 'question' || battle.timeLimitMs === null) return

    const now = Date.now()
    commitBattleStep(timeUpAction(battle, now), battle.question, now, set, get)
  },

  setLoadout(spellIds) {
    const { student, progress } = get()
    if (!student) return

    const updated: StudentProgress = { ...progress, loadout: spellIds }
    set({ progress: updated })
    void repository.saveProgress(student.id, updated)
  },

  cast(spellId, casterIndex) {
    const { battle } = get()
    const spell = SPELLS[spellId]
    if (!battle || !spell) return
    set({ battle: castSpell(battle, spell, Date.now(), casterIndex) })
    playEffect('correct')
  },

  useHint() {
    const { battle } = get()
    if (battle) set({ battle: useHintAction(battle) })
  },

  next() {
    const { battle, queue, queueIndex, student, progress, battleSubject } = get()
    if (!battle || !student || !battleSubject) return

    const nextIndex = queueIndex + 1
    let nextQuestion = queue[nextIndex] ?? null

    // Phòng khi hàng đợi cạn sớm (ngân hàng mỏng): chọn bù một câu tại chỗ.
    if (!nextQuestion && battle.questionsAsked < battle.maxQuestions) {
      const picked = selectQuestion(
        {
          subject: battleSubject,
          grade: student.grade,
          mastery: progress.mastery,
          now: Date.now(),
          rng: createRng(`${student.id}-refill-${Date.now()}`),
          source: contentSource,
        },
        new Set(queue.map((q) => q.id)),
      )
      nextQuestion = picked?.question ?? null
    }

    const advanced = advanceBattle(battle, nextQuestion, Date.now())
    set({
      battle: advanced,
      queueIndex: nextQuestion ? nextIndex : queueIndex,
      ...(nextQuestion ? { queue: queue[nextIndex] ? queue : [...queue, nextQuestion] } : {}),
    })

    if (advanced.phase === 'victory') playEffect('victory')
  },

  /**
   * Đánh lại đúng con quái vừa thua.
   *
   * Dựng trận MỚI chứ không khôi phục trận cũ: bộ câu hỏi được bốc lại, nên con
   * gặp lại đúng những kỹ năng mình còn yếu chứ không phải học thuộc đáp án của
   * lượt trước. Máu cũng đầy lại - thua rồi mà vẫn phải đánh với đội thú kiệt
   * sức thì "thử lại" chỉ là thua chậm hơn.
   */
  retryLastFight() {
    const { lastFight } = get()
    if (!lastFight) return

    set({ summary: null })
    if (lastFight.kind === 'node' && lastFight.node) {
      get().startBattle(lastFight.subject, lastFight.node, lastFight.grade)
      return
    }
    get().startWildBattle(lastFight.subject, lastFight.grade, lastFight.kind === 'mini' ? 'mini' : 'wild', lastFight.variant)
  },

  async closeBattle() {
    const { battle, student, progress, battleSubject, battleNode, battleGrade, battleKind } = get()
    // battleNode có thể là null: đó là trận gặp quái hoang giữa đường.
    if (!battle || !student || !battleSubject) {
      set({ battle: null, summary: null })
      return
    }

    const victory = battle.phase === 'victory'
    const accuracy =
      battle.answers.length === 0
        ? 0
        : battle.answers.filter((a) => a.correct).length / battle.answers.length

    const outcome = {
      victory,
      goldEarned: battle.goldEarned,
      xpEarned: battle.xpEarned,
      bestCombo: battle.bestCombo,
      accuracy,
    }

    const rng = createRng(`${student.id}-loot-${battle.enemy.id}-${Date.now()}`)
    const loot = rollLoot(outcome, rng)
    const bonuses = bonusAwards(outcome)
    const bonusGold = bonuses.reduce((sum, b) => sum + b.gold, 0)
    const bonusXp = bonuses.reduce((sum, b) => sum + b.xp, 0)

    const levelBefore = levelFromTotalXp(student.totalXp).level
    const totalXp = student.totalXp + battle.xpEarned + bonusXp
    const levelAfter = levelFromTotalXp(totalXp).level

    const updatedStudent: StudentProfile = {
      ...student,
      totalXp,
      gold: student.gold + battle.goldEarned + bonusGold,
      lastPlayedAt: Date.now(),
      // Tự động mặc món đồ mới nếu chưa mặc gì cùng loại - trẻ nhỏ ngại vào kho.
      equippedItemIds: loot ? [...new Set([...student.equippedItemIds, loot.id])] : student.equippedItemIds,
    }

    const clearedNodes = { ...progress.clearedNodes }
    if (victory && battleNode && battleNode.kind !== 'review') {
      const key = regionKey(battleSubject, battleGrade ?? student.grade)
      clearedNodes[key] = Math.max(clearedNodes[key] ?? 0, battleNode.index + 1)
    }

    // Kinh nghiệm cho thú: chia đều cho cả đội, kể cả con chưa phải ra đánh.
    // Con dự bị vẫn theo trẻ suốt trận, và bắt trẻ phải "cho từng con ra đánh
    // đủ lượt" thì việc chọn phép biến thành việc chia ca, không còn là chiến
    // thuật nữa.
    const petXpGained = Math.max(1, Math.round(battle.xpEarned / 2))
    const petXp = { ...(progress.petXp ?? {}) }
    const petsEvolved: Array<{ from: string; to: string }> = []

    for (const member of battle.team) {
      const id = member.pet.id
      const before = petXp[id] ?? 0
      const after = before + petXpGained
      petXp[id] = after

      // So trên DỮ LIỆU GỐC chứ không phải con đã cộng cấp trong trận: con
      // trong trận đã mang tên sau tiến hoá rồi, so ở đó thì không bao giờ thấy
      // khoảnh khắc chuyển.
      const source = getPet(id)
      if (source && justEvolved(source, before, after)) {
        petsEvolved.push({ from: source.name, to: source.evolution!.name })
      }
    }

    // Thu phục thú: chỉ ở trận quái hoang, chỉ khi thắng, và chỉ những con
    // CHƯA có. Trận ở cổng không rơi thú để trẻ có lý do đi lang thang.
    const owned = progress.pets ?? []
    const catchable = PETS.filter((pet) => pet.element === battleSubject && !owned.includes(pet.id))
    // Mini boss là phần thưởng cho việc chịu khó tìm hang, nên tỉ lệ ra thú cao
    // hơn hẳn quái hoang gặp dọc đường.
    const catchChance = battleKind === 'mini' ? 0.85 : 0.5
    const caught =
      victory && battleKind !== 'node' && catchable.length > 0 && rng.chance(catchChance)
        ? rng.pick(catchable)
        : null

    const updatedProgress: StudentProgress = {
      ...progress,
      clearedNodes,
      pets: caught ? [...owned, caught.id] : owned,
      petXp,
      inventory: loot ? [...progress.inventory, loot.id] : progress.inventory,
      battlesPlayed: progress.battlesPlayed + 1,
      battlesWon: progress.battlesWon + (victory ? 1 : 0),
    }

    await repository.saveStudent(updatedStudent)
    await repository.saveProgress(student.id, updatedProgress)

    if (levelAfter > levelBefore) playEffect('levelup')

    // Hai kỹ năng con sai NHIỀU NHẤT, không phải mọi kỹ năng con sai.
    //
    // Một trận thua có thể vướng bảy tám bài; đọc cả danh sách đó thì trẻ chỉ
    // thấy mình dốt toàn tập chứ không nhặt ra được điều gì. Hai cái tên là thứ
    // một đứa bé tám tuổi nhớ được khi bấm "Đánh lại ngay".
    const missCount = new Map<string, number>()
    for (const a of battle.answers) {
      if (a.correct) continue
      missCount.set(a.skillId, (missCount.get(a.skillId) ?? 0) + 1)
    }
    const missedSkills = [...missCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id]) => getSkill(id)?.name)
      .filter((name): name is string => Boolean(name))

    set({
      student: updatedStudent,
      students: await repository.listStudents(),
      progress: updatedProgress,
      battle: null,
      battleNode: null,
      battleSubject: null,
      battleGrade: null,
      queue: [],
      queueIndex: 0,
      summary: {
        victory,
        goldEarned: battle.goldEarned + bonusGold,
        xpEarned: battle.xpEarned + bonusXp,
        loot,
        leveledUp: levelAfter > levelBefore,
        newLevel: levelAfter,
        bonuses,
        accuracy,
        bestCombo: battle.bestCombo,
        petCaught: caught ? { id: caught.id, name: caught.name } : null,
        petXpGained,
        petsEvolved,
        missedSkills,
        canRetry: get().lastFight !== null,
      },
    })
  },
}))
