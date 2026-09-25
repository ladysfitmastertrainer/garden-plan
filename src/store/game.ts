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
import { useUi } from './ui'
import type { Enemy, PlayerStats } from '../engine/battle'
import { getSkill } from '../content/curriculum'
import { PETS, SPELLS, companionOf, getPet } from '../content/pets'
import { cellKey, cleanGarden, gardenSlots, getGardenPart } from '../content/garden'
import { addAnswers, hintPenaltyScale, natureOf } from '../engine/nature'
import { currentEvolution, evolutionStage, justEvolved, type Pet } from '../engine/pets'
import { contentSource } from '../content/registry'
import { getTuning } from '../content/tuning'
import { buildWorldMap, type MapNode, type WorldMap } from '../content/worldmap'
import { TOWER_QUESTIONS, createTowerBoss, towerGrades } from '../content/tower'
import { recentQuestions, rememberQuestions } from './recent-questions'
import {
  TUTORIAL_GRADE,
  TUTORIAL_MAX_QUESTIONS,
  TUTORIAL_QUESTIONS,
  TUTORIAL_SUBJECT,
  tutorialEnemy,
} from '../content/tutorial'
import type { Grade, Habitat, Question, Subject } from '../content/types'
import {
  advance as advanceBattle,
  beginAttack,
  beginDefend,
  createBattle,
  defendLimitFor,
  questionLimitMs,
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
  type FighterStrength,
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

/**
 * Loại trận đang đánh.
 *
 * 'tower' là trận trong Tháp Trí Tuệ: đề bốc qua nhiều lớp, quái đổi hệ giữa
 * trận, có giáp và biết nổi giận. Xem `content/tower.ts`.
 */
/**
 * 'secret' là quái ẩn - đánh như đầu đàn nhưng thưởng hậu hơn hẳn.
 *
 * Phần chênh ấy KHÔNG trả cho việc đánh, mà trả cho việc TÌM RA: muốn gặp nó
 * thì phải tìm ra bậc thang, leo lên khu đất cao, rồi men tới đúng góc trong
 * cùng. Một đứa trẻ chịu khó đi hết bản đồ đáng được nhiều hơn đứa đi thẳng
 * từ cổng này sang cổng kia.
 */
/**
 * Con quái của một trận gặp dọc đường, tuỳ theo gặp ở đâu.
 *
 * Ba mức, và khoảng cách giữa chúng nói lên công sức bỏ ra: quái hoang nhảy
 * ra từ bụi cỏ nên yếu hơn cả quái ở cổng; đầu đàn phải rẽ vào hang mới gặp;
 * quái ẩn thì phải tìm ra bậc thang, leo lên khu đất cao rồi men tới đúng góc
 * trong cùng - nên nó thưởng gấp đôi đầu đàn.
 */
function enemyFor(kind: 'wild' | 'mini' | 'secret', enemy: Enemy): Enemy {
  if (kind === 'wild') {
    return {
      ...enemy,
      name: `${enemy.name} hoang`,
      maxHp: Math.round(enemy.maxHp * 0.6),
      // Cấp trên khung máu đi theo độ mạnh thật: yếu hơn quái cổng thì kém một cấp.
      level: Math.max(1, (enemy.level ?? 1) - 1),
    }
  }
  if (kind === 'mini') {
    return {
      ...enemy,
      // Thủy quái cũng đánh theo luật đầu đàn, nhưng nó không cầm đầu bầy nào:
      // "Rắn Biển Ba Trăm Thước Đầu Đàn" là một cái tên thừa chữ.
      name: enemy.habitat === 'deep' ? enemy.name : `${enemy.name} Đầu Đàn`,
      maxHp: Math.round(enemy.maxHp * 1.35),
      attack: enemy.attack + 3,
      level: Math.max(1, (enemy.level ?? 1) + 1),
      goldReward: enemy.goldReward * 2,
      xpReward: enemy.xpReward * 2,
    }
  }
  return {
    ...enemy,
    name: `${enemy.name} Ẩn Mình`,
    maxHp: Math.round(enemy.maxHp * 1.6),
    attack: enemy.attack + 4,
    level: Math.max(1, (enemy.level ?? 1) + 2),
    goldReward: enemy.goldReward * 4,
    xpReward: enemy.xpReward * 4,
  }
}

/**
 * Loại trận đang đánh.
 *
 * 'tutorial' là loại DUY NHẤT không ghi gì xuống hồ sơ: không mức thạo, không
 * vàng, không kinh nghiệm, không đếm vào số trận đã chơi. Nó là một trận tập
 * với một con slime tập sự, và một buổi tập không được để lại dấu vết trong học
 * bạ. Hai chỗ phải biết điều đó - `commitBattleStep` và `closeBattle` - đều
 * kiểm tra đúng cái tên này.
 */
export type BattleKind = 'node' | 'wild' | 'mini' | 'secret' | 'tower' | 'tutorial'

/**
 * Thứ nhận được sau khi thắng một trận đấu trường.
 *
 * ---- TRỨNG, CHỨ KHÔNG PHẢI CƯỚP ----
 *
 * Trò chơi gốc mà ý này mượn về (Monster Capsule) cho người thắng ĐỔI LẤY một
 * con thú của người thua. Ở đây thì không, và đó là một quyết định về trẻ con
 * chứ không phải về cân bằng: một em bảy tuổi mất con thú nuôi cả tháng vào tay
 * bạn ngồi cạnh sẽ khóc thật, và sáng hôm sau đó là chuyện ngoài sân trường.
 *
 * Nên người thắng nhận một quả TRỨNG cùng loài với con thú vừa đấu - tức một
 * con mới tinh, cấp 1, của chính loài ấy - còn người thua không mất gì cả. Vẫn
 * đủ sướng, vẫn là "chiến lợi phẩm mang hình bạn ấy", mà không ai phải khóc.
 *
 * Đã có con ấy rồi thì quy ra vàng. Một quả trứng trùng con đang nuôi thì không
 * phải phần thưởng, nó là một dòng thông báo.
 */
export interface PvpReward {
  kind: 'egg' | 'gold'
  /** Loài vừa nở ra. Chỉ có ở 'egg'. */
  petId?: string
  petName?: string
  /** Vàng nhận thay, khi đã có con ấy rồi. */
  gold?: number
}

/**
 * Thắng một trận đấu trường mà đã có sẵn con thú ấy thì được bấy nhiêu vàng.
 *
 * Ngang một trận đánh quái thường. Đấu trường ngắn hơn (bảy câu so với mười),
 * nhưng đối thủ là một đứa trẻ khác đang cố hết sức - nên công sức bỏ ra không
 * kém, và phần thưởng không được kém.
 */
const PVP_GOLD = 25

/** Nhớ lại nhiều nhất bấy nhiêu trận, để hồ sơ không phình ra - xem `pvpClaimed`. */
const PVP_CLAIMED_KEPT = 20

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
  /** Thú vừa tiến hoá: tên cũ, tên mới, và nấc thứ mấy trong ba nấc. */
  petsEvolved: Array<{ from: string; to: string; stage: number }>
  /**
   * Những kỹ năng con trả lời sai trong trận, tên đọc được.
   *
   * Thua mà không biết vì sao thì lần sau cũng thua y hệt. Đây là chỗ biến một
   * trận thua thành một câu nói được: "con còn vướng ở phép cộng có nhớ".
   */
  missedSkills: string[]
  /** Có dựng lại được đúng trận này không - để hiện nút "Đánh lại ngay". */
  canRetry: boolean
  /**
   * Đây là trận TẬP của bàn hướng dẫn.
   *
   * Màn tổng kết vẫn liệt kê đủ vàng, kinh nghiệm và chuỗi đúng - đó là cả lý
   * do cho trẻ nhìn thấy nó: bảng này sẽ hiện ra sau mọi trận từ giờ trở đi,
   * nên phải học đọc nó một lần. Nhưng những con số ấy KHÔNG được cộng thật, và
   * nói dối một đứa trẻ về phần thưởng thì lần sau nó không tin bảng này nữa.
   * Cờ này để màn tổng kết nói thẳng ra điều đó.
   */
  tutorial?: boolean
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
    kind: BattleKind
    variant?: number
    habitat?: Habitat
  } | null
  /** Loại trận đang đánh. Quyết định tỉ lệ thu phục thú. */
  battleKind: BattleKind
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
  /**
   * Nhận thưởng sau một trận đấu trường đã THẮNG.
   *
   * Gọi được nhiều lần cho cùng một trận mà chỉ phát đúng một lần - xem
   * `pvpClaimed`. Lần sau trả về `null`.
   */
  claimPvpReward: (matchId: string, foePetId: string | null) => PvpReward | null
  /**
   * Đặt một món xuống ô (cột, hàng). Trả vàng ngay.
   *
   * Không làm gì khi thiếu vàng, hết ô, hoặc ô đã có món - ba trường hợp mà
   * giao diện lẽ ra đã chặn, nhưng luật thì phải sống ở đây.
   */
  placeGardenPart: (col: number, row: number, partId: string) => void
  /** Dỡ món ở ô (cột, hàng) và HOÀN ĐỦ vàng. */
  removeGardenPart: (col: number, row: number) => void

  worldMap: (subject: Subject, grade?: Grade) => WorldMap
  startBattle: (subject: Subject, node: MapNode, grade?: Grade) => void
  /**
   * Trận gặp quái hoang khi đang đi cảnh: ngắn hơn trận ở cổng, không mở khoá
   * chặng nào, nhưng có cơ hội thu phục thú.
   */
  startWildBattle: (
    subject: Subject,
    grade?: Grade,
    kind?: 'wild' | 'mini' | 'secret',
    /** Con thứ mấy trong bầy - để con nhảy ra khỏi bụi cỏ đúng là con vào trận. */
    variant?: number,
    /** Môi trường con quái nhảy ra - nước nông, hang, tán cây, núi lửa. */
    habitat?: Habitat,
  ) => void
  /**
   * Bước vào một tầng Tháp Trí Tuệ.
   *
   * Không nhận `MapNode`: tháp không nằm trên bản đồ chặng nào, nó là một cánh
   * cửa riêng ở giữa lục địa.
   */
  startTowerBattle: (subject: Subject, grade?: Grade) => void
  /**
   * Trận TẬP của bàn hướng dẫn: một con slime tập sự và sáu câu cộng trừ trong
   * phạm vi 5, không ghi gì xuống hồ sơ.
   *
   * Không nhận môn cũng không nhận lớp: bàn hướng dẫn luôn là Toán lớp 1 với
   * mọi đứa trẻ, vì lúc này em đang học cách bấm nút chứ không học Toán. Xem
   * `content/tutorial.ts`.
   */
  startTutorialBattle: () => void
  /** Trẻ bấm "Tấn công" ở pha chờ: câu hỏi hiện ra và đồng hồ bắt đầu chạy. */
  attack: () => void
  /** Hết nhịp cảnh báo: câu hỏi đỡ đòn hiện ra và đồng hồ bắt đầu chạy. */
  defend: () => void
  /** Đánh dấu một chỗ trên bản đồ là đã tìm ra, và lưu lại ngay. */
  markFound: (key: string) => void
  answer: (input: AnswerInput) => void
  /** Hết giờ một câu ở trận trùm / trận đầu đàn. Tính như trả lời sai. */
  timeUp: () => void
  /** Tung phép sau khi trả lời đúng. Chỉ có tác dụng ở pha chọn phép. */
  cast: (spellId: string) => void
  useHint: () => void
  /** Sắp lại bộ chiêu mang ra trận. */
  setLoadout: (petId: string, spellIds: string[]) => void
  setCompanion: (petId: string) => void
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
  const { battle, student, progress, battleKind } = get()
  if (!battle || !student) return

  const record = next.answers[next.answers.length - 1]
  if (!record) return

  /*
    TRẬN TẬP KHÔNG VÀO SỔ.

    Câu "1 + 1" trong bàn hướng dẫn không nói gì về việc trẻ có thạo phép cộng
    hay không - nó nói về việc trẻ đã tìm ra cái nút chưa. Ghi nó vào mức thạo
    thì lịch giãn cách tưởng em này vừa ôn xong phép cộng trong phạm vi 10 và
    đẩy bài ấy lùi lại hàng tuần; ghi vào sổ trả lời thì bảng của bố mẹ có một
    buổi học không có thật.

    Dừng ở đây nhưng VẪN đẩy trạng thái trận đi tiếp và vẫn phát tiếng: trận tập
    phải chạy y hệt trận thật, chỉ là không để lại gì.
  */
  if (battleKind === 'tutorial') {
    set({ battle: next })
    playEffect(record.correct ? 'correct' : 'wrong')
    return
  }

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

/**
 * Con thú ra trận, kèm chỉ số của người điều khiển nó.
 *
 * Gom hai thứ vào một hàm vì chúng KHÔNG độc lập: mức phạt khi bấm gợi ý phụ
 * thuộc vào tính cách của chính con thú sắp ra sân (xem `engine/nature.ts`).
 * Để rời nhau thì mỗi chỗ dựng trận phải tự nhớ tra tính cách trước khi khai
 * chỉ số - bốn chỗ, và chỉ cần một chỗ quên là con thú Ham Học mất đặc điểm
 * duy nhất của nó, lặng lẽ.
 */
function fighterFor(
  progress: StudentProgress,
  subject: Subject,
  level: number,
  bonus: { bonusHp?: number; bonusPower?: number } = {},
): { pet: Pet; player: PlayerStats } {
  const pet = companionOf(
    progress.pets,
    progress.companion,
    subject,
    progress.petXp ?? {},
    progress.petNature ?? {},
  )
  return {
    pet,
    player: {
      ...statsForLevel(level, bonus),
      hintPenalty: hintPenaltyScale(natureOf(progress.petNature?.[pet.id])),
    },
  }
}

/**
 * Sức mạnh thật của bên con, để quái theo kịp - xem `enemyScaleFor`.
 *
 * Đọc từ ĐÚNG đội hình sắp ra trận (`fighterFor`): sức đánh của nhân vật đã gồm
 * đồ đeo, sức đánh và máu của thú đã gồm cấp và tiến hoá của nó.
 */
function strengthOf(fighter: { pet: Pet; player: PlayerStats }, level: number): FighterStrength {
  return { level, power: fighter.player.power, petPower: fighter.pet.power, petMaxHp: fighter.pet.maxHp }
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
      // Né câu đã gặp ở những trận trước - xem `store/recent-questions.ts`.
      recent: recentQuestions(student.id),
    }

    const selections = selectQuestions(ctx, getTuning().questionsPerBattle)
    if (selections.length === 0) return
    rememberQuestions(student.id, selections.map((sel) => sel.question.id))

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
      // Quái theo kịp rồi vượt sức mạnh thật của con - xem `enemyScaleFor`.
      fighter: strengthOf(fighterFor(progress, subject, level, bonus), level),
    })

    const queue = selections.map((s) => s.question)
    set({
      battle: createBattle(
        {
          enemy,
          player: fighterFor(progress, subject, level, bonus).player,
          pet: fighterFor(progress, subject, level, bonus).pet,
          maxQuestions: queue.length,
          timeLimitMs: node.kind === 'boss' ? timeLimitFor('boss', target) : null,
          // Lượt ĐỠ ĐÒN luôn có đồng hồ, kể cả trận thường - xem defendLimitFor.
          defendLimitMs: defendLimitFor(node.kind === 'boss' ? 'boss' : 'normal', target),
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

  startWildBattle(subject, grade, kind = 'wild', variant, habitat) {
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
      ...(kind === 'wild' ? {} : { difficultyBoost: 1 }),
      recent: recentQuestions(student.id),
    }
    // Trận ngắn: 5 câu cho quái hoang, 8 câu cho mini boss. Quái hoang là nhịp
    // nghỉ giữa các chặng, không phải một chặng nữa - kéo dài bằng trận ở cổng
    // thì đi cảnh thành cực hình.
    const selections = selectQuestions(ctx, kind === 'wild' ? 5 : 8)
    if (selections.length === 0) return
    rememberQuestions(student.id, selections.map((sel) => sel.question.id))

    const rng = createRng(`${student.id}-wildenemy-${Date.now()}`)
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
      // Quái hoang yếu hơn quái ở cổng cùng khu vực một bậc; mini boss thì mạnh
      // hơn quái thường nhưng vẫn dưới trùm cuối.
      nodeIndex: kind === 'wild' ? Math.max(0, cleared - 1) : cleared + 2,
      isBoss: false,
      rng,
      // Mini boss trong hang luôn là con dữ nhất bầy - khớp với hình đứng trong
      // hang. Quái hoang thì lấy đúng con vừa nhảy ra khỏi bụi cỏ.
      // Thủy quái cũng vậy: con vào trận là đúng con vừa nhô lên.
      ...(kind === 'wild' || (kind === 'mini' && habitat === 'deep')
        ? variant === undefined
          ? {}
          : { variant }
        : { variant: 3 }),
      // Gặp ở nước nông, trong hang, trên tán cây hay miệng núi lửa thì là con
      // của nơi ấy. Đầu đàn trong hang quái dữ thì không có môi trường - trận
      // 'mini' duy nhất mang môi trường là thủy quái ngoài khơi.
      ...(habitat && (kind !== 'mini' || habitat === 'deep') ? { habitat } : {}),
      fighter: strengthOf(fighterFor(progress, subject, level, bonus), level),
    })


    const queue = selections.map((sel) => sel.question)
    set({
      battle: createBattle(
        {
          enemy: enemyFor(kind, enemy),
          player: fighterFor(progress, subject, level, bonus).player,
          pet: fighterFor(progress, subject, level, bonus).pet,
          maxQuestions: queue.length,
          timeLimitMs: kind === 'wild' ? null : timeLimitFor('mini', target),
          defendLimitMs: defendLimitFor(kind === 'wild' ? 'normal' : 'mini', target),
        },
        queue[0]!,
        Date.now(),
      ),
      battleSubject: subject,
      battleNode: null,
      lastFight: { subject, grade: target, node: null, kind, variant, habitat },
      battleKind: kind,
      battleGrade: target,
      queue,
      queueIndex: 0,
      summary: null,
    })
  },

  startTowerBattle(subject, grade) {
    const { student, progress } = get()
    if (!student) return

    const target: Grade = grade ?? student.grade
    const grades = towerGrades(target)

    /*
      Đề bốc qua NHIỀU LỚP, không riêng lớp hiện tại.

      Một nửa số câu ở lớp hiện tại, nửa còn lại chia đều cho các lớp dưới. Đây
      là chỗ tháp khác hẳn trùm vùng đất: trùm vùng đất kiểm tra một lớp, tháp
      kiểm tra cả quãng đường trẻ đã đi. Một em quên sạch bài lớp trước thì vẫn
      qua được trùm lớp này, nhưng sẽ không qua được tháp - và đó là ý.
    */
    const lower = grades.filter((g) => g !== target)
    const forCurrent = lower.length === 0 ? TOWER_QUESTIONS : Math.ceil(TOWER_QUESTIONS / 2)
    const quota = new Map<Grade, number>([[target, forCurrent]])
    let left = TOWER_QUESTIONS - forCurrent
    lower.forEach((g, index) => {
      const take = Math.floor(left / (lower.length - index))
      quota.set(g, take)
      left -= take
    })

    const rng = createRng(`${student.id}-tower-${subject}-${Date.now()}`)
    const picked: Question[] = []
    const recent = recentQuestions(student.id)
    for (const [g, count] of quota) {
      if (count <= 0) continue
      const ctx: SelectionContext = {
        subject,
        grade: g,
        mastery: progress.mastery,
        now: Date.now(),
        rng,
        source: contentSource,
        // Dồn hết sang nhóm thử thách và nâng độ khó HAI bậc - trùm vùng đất chỉ
        // nâng một. Đây là bài cuối cùng, không phải một chặng nữa.
        weights: { challenge: 85, review: 15, learning: 0 },
        difficultyBoost: 2,
        recent,
      }
      picked.push(...selectQuestions(ctx, count).map((s) => s.question))
    }
    if (picked.length === 0) return
    rememberQuestions(student.id, picked.map((q) => q.id))

    // Xáo lên: xếp theo lớp thì trẻ đọc ra ngay "ba câu dễ rồi tới phần khó", và
    // nhịp của trận đấu vỡ làm mấy khúc rời nhau.
    const queue = rng.shuffle(picked)

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

    set({
      battle: createBattle(
        {
          enemy: createTowerBoss(subject, target, strengthOf(fighterFor(progress, subject, level, bonus), level)),
          player: fighterFor(progress, subject, level, bonus).player,
          /*
            Vẫn đúng con thú ấy, không có ngoại lệ nào cho tháp.

            Chỗ này từng xin ĐỘI BỐN CON thay vì ba, vì trùm tháp xoay qua cả
            bốn hệ và một đội ba con luôn có một hệ không ai gánh nổi. Ngoại lệ
            ấy mất nghĩa khi ra trận chỉ còn một con: giờ hai hệ trong tay là
            của chính con thú (chiêu nhà và chiêu mượn), và đó là thứ trẻ mang
            theo ở mọi trận, tháp hay không.

            Trùm tháp vì vậy khó đúng theo cách nó định khó: có lượt trẻ không
            có chiêu nào khắc được hệ nó vừa đổi sang, và phải chọn giữa đánh
            yếu hay dồn chiêu cuối.
          */
          pet: fighterFor(progress, subject, level, bonus).pet,
          maxQuestions: queue.length,
          timeLimitMs: timeLimitFor('tower', target),
          defendLimitMs: defendLimitFor('tower', target),
        },
        queue[0]!,
        Date.now(),
      ),
      battleSubject: subject,
      battleNode: null,
      lastFight: { subject, grade: target, node: null, kind: 'tower' },
      battleKind: 'tower',
      battleGrade: target,
      queue,
      queueIndex: 0,
      summary: null,
    })
  },

  startTutorialBattle() {
    const { student, progress } = get()
    if (!student) return

    const queue = TUTORIAL_QUESTIONS

    set({
      battle: createBattle(
        {
          enemy: tutorialEnemy(),
          /*
            Sức mạnh và máu THẬT của trẻ, không phải một bộ số riêng cho bàn tập.

            Cả điểm của bàn này là trận sau đó diễn ra y hệt. Cho trẻ một bộ chỉ
            số mạnh hơn ở đây thì con số sát thương em vừa học đọc sẽ nhỏ đi
            ngay ở trận thật đầu tiên, và bài học hoá ra dạy sai. Con slime
            được chọn máu theo đúng chỉ số cấp 1 này - xem `content/tutorial.ts`.

            KHÔNG cộng trang bị: một em quay lại xem hướng dẫn khi đã có đồ sẽ
            hạ con slime trong một đòn và mất luôn lượt đỡ đòn.
          */
          player: fighterFor(progress, TUTORIAL_SUBJECT, 1).player,
          pet: fighterFor(progress, TUTORIAL_SUBJECT, 1).pet,
          maxQuestions: TUTORIAL_MAX_QUESTIONS,
          // Lượt ra đòn KHÔNG đếm giờ, y như mọi trận thường: trẻ đang học, và
          // ở bàn này em còn đang vừa học vừa đọc lời người dẫn.
          timeLimitMs: null,
          // Lượt đỡ đòn thì có, vì trận thật cũng vậy - và giờ của lớp 1 là giờ
          // rộng nhất trong game.
          defendLimitMs: defendLimitFor('normal', TUTORIAL_GRADE),
        },
        queue[0]!,
        Date.now(),
      ),
      battleSubject: TUTORIAL_SUBJECT,
      battleNode: null,
      /*
        KHÔNG có "đánh lại ngay" cho trận tập.

        `lastFight` phải bị xoá chứ không chỉ bỏ trống: nó còn giữ trận THẬT
        trẻ đánh trước khi mở hướng dẫn, và để nguyên thì nút "Đánh lại ngay"
        trên màn tổng kết của bàn tập sẽ ném em ấy thẳng vào con trùm cũ.
      */
      lastFight: null,
      battleKind: 'tutorial',
      battleGrade: TUTORIAL_GRADE,
      queue,
      queueIndex: 0,
      summary: null,
    })
  },

  markFound(key) {
    const { student, progress } = get()
    if (!student) return
    const found = progress.foundSpots ?? []
    if (found.includes(key)) return

    const updated: StudentProgress = { ...progress, foundSpots: [...found, key] }
    set({ progress: updated })
    void repository.saveProgress(student.id, updated)
  },

  attack() {
    const { battle } = get()
    if (!battle) return
    set({ battle: beginAttack(battle, Date.now()) })
  },

  defend() {
    const { battle } = get()
    if (!battle) return
    set({ battle: beginDefend(battle, Date.now()) })
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
    // `questionLimitMs` chứ không phải `timeLimitMs`: lượt đỡ đòn có đồng hồ
    // riêng, và ở trận thường thì đó là đồng hồ DUY NHẤT trong trận.
    if (battle.phase !== 'question' || questionLimitMs(battle) === null) return

    const now = Date.now()
    commitBattleStep(timeUpAction(battle, now), battle.question, now, set, get)
  },

  setLoadout(petId, spellIds) {
    const { student, progress } = get()
    if (!student) return

    const updated: StudentProgress = {
      ...progress,
      petLoadout: { ...(progress.petLoadout ?? {}), [petId]: spellIds },
    }
    set({ progress: updated })
    void repository.saveProgress(student.id, updated)
  },

  placeGardenPart(col, row, partId) {
    const { student, progress } = get()
    if (!student) return

    const part = getGardenPart(partId)
    if (!part) return

    const garden = cleanGarden(progress.garden)
    const key = cellKey(col, row)
    if (garden[key]) return

    const level = levelFromTotalXp(student.totalXp).level
    if (Object.keys(garden).length >= gardenSlots(level)) return
    if (student.gold < part.cost) return

    const updated: StudentProgress = { ...progress, garden: { ...garden, [key]: partId } }
    const poorer: StudentProfile = { ...student, gold: student.gold - part.cost }
    set({ progress: updated, student: poorer })
    void repository.saveProgress(student.id, updated)
    void repository.saveStudent(poorer)
  },

  removeGardenPart(col, row) {
    const { student, progress } = get()
    if (!student) return

    const garden = cleanGarden(progress.garden)
    const key = cellKey(col, row)
    const part = getGardenPart(garden[key] ?? '')
    if (!part) return

    const { [key]: _gone, ...rest } = garden
    const updated: StudentProgress = { ...progress, garden: rest }
    // HOÀN ĐỦ. Một khu vườn không ai dám thử thì không phải khu vườn - xem
    // ghi chú đầu `content/garden.ts`.
    const richer: StudentProfile = { ...student, gold: student.gold + part.cost }
    set({ progress: updated, student: richer })
    void repository.saveProgress(student.id, updated)
    void repository.saveStudent(richer)
  },

  claimPvpReward(matchId, foePetId) {
    const { student, progress } = get()
    if (!student) return null

    const claimed = progress.pvpClaimed ?? []
    if (claimed.includes(matchId)) return null

    const foePet = foePetId ? getPet(foePetId) : null
    if (!foePet) return null

    const owned = progress.pets ?? []
    const isNew = !owned.includes(foePet.id)

    const updated: StudentProgress = {
      ...progress,
      pets: isNew ? [...owned, foePet.id] : owned,
      pvpClaimed: [...claimed, matchId].slice(-PVP_CLAIMED_KEPT),
    }
    set({ progress: updated })
    void repository.saveProgress(student.id, updated)

    if (!isNew) {
      const richer: StudentProfile = { ...student, gold: student.gold + PVP_GOLD }
      set({ student: richer })
      void repository.saveStudent(richer)
      return { kind: 'gold', gold: PVP_GOLD }
    }

    playEffect('levelup')
    return { kind: 'egg', petId: foePet.id, petName: foePet.name }
  },

  setCompanion(petId) {
    const { student, progress } = get()
    if (!student) return

    const updated: StudentProgress = { ...progress, companion: petId }
    set({ progress: updated })
    void repository.saveProgress(student.id, updated)
  },

  cast(spellId) {
    const { battle } = get()
    const spell = SPELLS[spellId]
    if (!battle || !spell) return

    const next = castSpell(battle, spell, Date.now())
    // `castSpell` trả về NGUYÊN trạng thái cũ khi chiêu cuối còn hồi. Không so
    // sánh thì một cú bấm vào nút đang khoá vẫn kêu tiếng "đúng rồi" và trẻ
    // tưởng mình vừa tung được chiêu.
    if (next === battle) return

    set({ battle: next })
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
    if (lastFight.kind === 'tower') {
      get().startTowerBattle(lastFight.subject, lastFight.grade)
      return
    }
    get().startWildBattle(
      lastFight.subject,
      lastFight.grade,
      lastFight.kind === 'mini' ? 'mini' : 'wild',
      lastFight.variant,
      lastFight.habitat,
    )
  },

  async closeBattle() {
    const { battle, student, progress, battleSubject, battleNode, battleGrade, battleKind } = get()
    // battleNode có thể là null: đó là trận gặp quái hoang giữa đường.
    if (!battle || !student || !battleSubject) {
      set({ battle: null, summary: null })
      return
    }

    const victory = battle.phase === 'victory'

    /*
      ---- TRẬN TẬP KHÉP LẠI Ở ĐÂY, TRƯỚC MỌI THỨ CÒN LẠI ----

      Cả phần dưới của hàm này là việc CHỐT SỔ: cộng vàng, cộng kinh nghiệm,
      quay đồ rơi, bốc thú, mở chặng tiếp theo, rồi lưu hồ sơ lên máy chủ. Không
      việc nào trong số đó được xảy ra sau một trận với con slime tập sự.

      Nhưng màn tổng kết thì VẪN hiện, và vẫn liệt kê đủ vàng với kinh nghiệm
      trẻ vừa kiếm trong trận. Đó là cả lý do bàn hướng dẫn có một trận thật:
      bảng này sẽ hiện ra sau mọi trận từ giờ trở đi, nên phải học đọc nó một
      lần. Cờ `tutorial` để chính cái bảng ấy nói thẳng rằng lần này không cộng
      thật - xem `BattleSummaryScreen`.
    */
    if (battleKind === 'tutorial') {
      set({
        battle: null,
        battleNode: null,
        battleSubject: null,
        battleGrade: null,
        queue: [],
        queueIndex: 0,
        summary: {
          victory,
          goldEarned: battle.goldEarned,
          xpEarned: battle.xpEarned,
          loot: null,
          leveledUp: false,
          newLevel: levelFromTotalXp(student.totalXp).level,
          bonuses: [],
          accuracy:
            battle.answers.length === 0
              ? 0
              : battle.answers.filter((a) => a.correct).length / battle.answers.length,
          bestCombo: battle.bestCombo,
          petCaught: null,
          petXpGained: 0,
          petsEvolved: [],
          // Đề ở đây không gắn với kỹ năng nào có thật để mà "còn vướng".
          missedSkills: [],
          canRetry: false,
          tutorial: true,
        },
      })
      return
    }

    /*
      Thắng thì con quái vừa đụng biến khỏi bản đồ.

      Đánh dấu ở ĐÂY chứ không ở lúc đụng vào: đụng vào mà thua thì con quái
      vẫn đứng đó, và nó phải đứng đó - trẻ rút lui khỏi một trận chưa thắng
      thì trận ấy chưa xong.

      Kho giao diện giữ danh sách này chứ không phải tiến độ của trẻ: nó là
      trạng thái của chuyến đi, không phải một thành tựu. Rời vùng đất là cả
      đàn đứng dậy.
    */
    if (victory) useUi.getState().beatPendingMonster()
    else useUi.getState().bumpMonster(null)
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

    // Tầng tháp vừa hạ. Ghi riêng, KHÔNG cộng vào tiến độ vùng đất - xem ghi chú
    // ở `towerCleared` trong `data/types.ts`.
    const towerKey = regionKey(battleSubject, battleGrade ?? student.grade)
    const towerCleared =
      victory && battleKind === 'tower'
        ? [...new Set([...(progress.towerCleared ?? []), towerKey])]
        : (progress.towerCleared ?? [])

    /*
      Kinh nghiệm cho thú: TRỌN VẸN cho đúng con vừa ra trận.

      Trước đây chia đều cho cả đội ba con, kể cả con ngồi dự bị - vì cả ba
      cùng theo trẻ suốt trận và bắt trẻ "cho từng con ra đánh đủ lượt" thì
      chọn phép biến thành chia ca. Giờ chỉ một con ra trận, nên không còn ai
      để chia, và cũng không nên chia: nuôi một con tới nấc tiến hoá thứ hai
      là cả một chặng đường, mà rải kinh nghiệm cho mười một con đứng ngoài
      thì chặng ấy dài gấp mười hai lần.

      Đổi con đi theo vì vậy là một quyết định có giá - đúng như nó nên thế.
    */
    const petXpGained = Math.max(1, Math.round(battle.xpEarned / 2))
    const petXp = { ...(progress.petXp ?? {}) }
    const petsEvolved: BattleSummary['petsEvolved'] = []

    /*
      Nết trả lời của trận này ngấm vào con thú vừa ra sân.

      Tích MỌI câu, kể cả câu sai: nết là cách trẻ tiếp cận một câu hỏi - bấm
      liền, nghĩ kỹ, hay mở gợi ý - và cách ấy có thật dù câu trả lời đúng hay
      sai. Chỉ đếm câu đúng thì một em hay sai sẽ mãi không có tính cách, mà đó
      đúng là em cần được nhìn thấy mình nhất.
    */
    const petNature = {
      ...(progress.petNature ?? {}),
      [battle.pet.pet.id]: addAnswers(progress.petNature?.[battle.pet.pet.id], battle.answers),
    }

    for (const member of [battle.pet]) {
      const id = member.pet.id
      const before = petXp[id] ?? 0
      const after = before + petXpGained
      petXp[id] = after

      // So trên DỮ LIỆU GỐC chứ không phải con đã cộng cấp trong trận: con
      // trong trận đã mang tên sau tiến hoá rồi, so ở đó thì không bao giờ thấy
      // khoảnh khắc chuyển.
      const source = getPet(id)
      const gained = source ? justEvolved(source, before, after) : null
      if (source && gained) {
        petsEvolved.push({
          // Tên CŨ là tên con thú vừa mang, có thể đã là một nấc tiến hoá rồi -
          // không phải tên lúc mới bắt. Lấy `source.name` thì con lên nấc ba sẽ
          // được báo là "Sóc Số → Sóc Vũ Trụ", bỏ mất hai nấc ở giữa.
          from: currentEvolution(source, before)?.name ?? source.name,
          to: gained.name,
          stage: evolutionStage(source, after),
        })
      }
    }

    // Thu phục thú: chỉ ở trận quái hoang, chỉ khi thắng, và chỉ những con
    // CHƯA có. Trận ở cổng không rơi thú để trẻ có lý do đi lang thang.
    const owned = progress.pets ?? []
    const catchable = PETS.filter((pet) => pet.element === battleSubject && !owned.includes(pet.id))
    // Mini boss là phần thưởng cho việc chịu khó tìm hang, nên tỉ lệ ra thú cao
    // hơn hẳn quái hoang gặp dọc đường.
    const catchChance = battleKind === 'mini' ? 0.85 : 0.5
    // Chỉ quái hoang và đầu đàn mới rơi thú. Trận ở cổng không rơi để trẻ có lý
    // do đi lang thang; trận trong tháp không rơi vì ở đó phần thưởng là chính
    // cái tầng vừa hạ, và một con thú cấp 1 rơi ra sau trận khó nhất game thì
    // vừa lạc lõng vừa hạ giá trị của nó.
    const wildKind = battleKind === 'wild' || battleKind === 'mini'
    const caught =
      victory && wildKind && catchable.length > 0 && rng.chance(catchChance)
        ? rng.pick(catchable)
        : null

    const updatedProgress: StudentProgress = {
      ...progress,
      clearedNodes,
      towerCleared,
      pets: caught ? [...owned, caught.id] : owned,
      petXp,
      petNature,
      inventory: loot ? [...progress.inventory, loot.id] : progress.inventory,
      battlesPlayed: progress.battlesPlayed + 1,
      battlesWon: progress.battlesWon + (victory ? 1 : 0),
    }

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

    /*
      HIỆN PHẦN THƯỞNG TRƯỚC, LƯU SAU.

      Bản trước chờ ba lượt gọi máy chủ nối nhau - lưu hồ sơ, lưu tiến độ, rồi
      LẤY LẠI cả danh sách hồ sơ - xong mới đặt màn tổng kết. Trên mạng trường
      học thì đó là một hai giây màn hình đứng im ngay sau khi trẻ vừa hạ được
      con quái, tức là đúng khoảnh khắc đáng ăn mừng nhất lại là khoảnh khắc
      game trông như bị treo.

      Mọi con số ở đây đã tính xong rồi, không có gì phải chờ máy chủ trả lời
      cả. Nên đặt trạng thái ngay, rồi mới lưu - phần lưu vẫn được chờ ở dưới,
      nên trình tự với phần còn lại của app không đổi.

      Danh sách hồ sơ cập nhật TẠI CHỖ thay vì đi lấy lại: chỉ đúng một hồ sơ
      vừa đổi, và mình đang cầm bản mới trong tay.
    */
    set({
      student: updatedStudent,
      students: get().students.map((profile) =>
        profile.id === updatedStudent.id ? updatedStudent : profile,
      ),
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

    // Lưu SAU khi màn tổng kết đã hiện. Vẫn chờ ở đây, nên mọi thứ gọi
    // `closeBattle` rồi đọc kho lưu trữ vẫn thấy dữ liệu mới.
    await repository.saveStudent(updatedStudent)
    await repository.saveProgress(student.id, updatedProgress)
  },
}))
