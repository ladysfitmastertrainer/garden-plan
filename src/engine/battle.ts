/**
 * Máy trạng thái trận đấu theo lượt.
 *
 * VÒNG CHƠI: câu hỏi → (đúng) chọn phép → tung phép → phản hồi → câu tiếp theo.
 *
 * Bước "chọn phép" là bước quan trọng nhất và cũng là bước mới nhất. Trước đây
 * trả lời đúng thì sát thương tự nhảy ra, trẻ không có quyết định nào để đưa ra,
 * nên trận thứ hai giống hệt trận thứ nhất. Giờ trả lời đúng cho trẻ QUYỀN TUNG
 * PHÉP, và chọn phép nào thì tuỳ nguyên tố của quái trước mặt - cùng một câu
 * đúng có thể ra 12 hoặc 27 sát thương.
 *
 * Trẻ không tự đánh mà có một ĐỘI THÚ đánh thay. Thanh máu hiển thị là máu của
 * cả đội; sát thương của quái rơi vào con đang ra trận, con đó gục thì con sau
 * bước ra. Hết cả đội thì về làng nghỉ - vẫn KHÔNG có màn hình "Game Over".
 *
 * Hàm thuần: không đụng React, không gọi Date.now() (thời điểm luôn truyền vào).
 */

import type {
  ChoiceQuality,
  Difficulty,
  Grade,
  Judgement,
  Question,
  Subject,
  Virtue,
} from '../content/types'
import { getTuning } from '../content/tuning'
import { judge, type AnswerInput } from './judge'
import {
  elementMultiplier,
  matchupLabel,
  nextAlive,
  teamAlive,
  teamHp,
  toBattlePet,
  type BattlePet,
  type Element,
  type Pet,
  type Spell,
} from './pets'

export interface Enemy {
  id: string
  name: string
  /** Emoji đại diện - MVP chưa cần sprite. */
  emoji: string
  /** Nguyên tố của quái. Quyết định phép nào khắc chế được nó. */
  element: Element
  maxHp: number
  /** Sát thương mỗi lần quái đánh trả. */
  attack: number
  goldReward: number
  xpReward: number
  /**
   * Con quái thứ mấy trong bầy của môn đó, tính từ 0. Giao diện dùng số này để
   * chọn HÌNH trong `MONSTER_FAMILY`, nhờ vậy TÊN và HÌNH luôn khớp nhau -
   * không còn cảnh tên "Rô-bốt Cộng Trừ" mà vẽ ra con slime.
   */
  variant: number
  /**
   * Trùm cuối của vùng đất.
   *
   * Là một CỜ RIÊNG chứ không đoán từ tên: giao diện trước đây dò ký tự '⭐'
   * trong tên quái để biết đó có phải trùm không, nên đổi cách đặt tên một cái
   * là con trùm mất hình trùm.
   */
  isBoss: boolean
  /**
   * Trùm trong Tháp Trí Tuệ.
   *
   * Lại là một CỜ RIÊNG, vì đúng lý do cũ: giao diện cần biết để đổi hình và đổi
   * khung, và đoán ra từ dữ liệu (kiểu "có `shiftEvery` thì chắc là trùm tháp")
   * là đúng cái bẫy mà cờ `isBoss` sinh ra để tránh.
   */
  isTower?: boolean

  /*
    ---- Bốn nét dưới đây làm nên ĐỘ KHÓ THẬT, và chỉ trùm trong tháp mới có ----

    Cách dễ nhất để một con quái khó hơn là cho nó nhiều máu hơn. Đó cũng là cách
    tệ nhất: trận đấu không khó hơn một chút nào, nó chỉ DÀI hơn. Trẻ vẫn bấm
    đúng những nút cũ, chỉ phải bấm thêm mười lần nữa - và cái đó không gọi là
    thử thách, nó gọi là mỏi tay.

    Bốn nét dưới đây đổi CÂU HỎI mà trận đấu đặt ra cho trẻ, chứ không đổi độ dài
    của nó. Trùm vùng đất hỏi "con có thuộc bài không". Trùm trong tháp hỏi thêm
    "con có ĐANG NHÌN không", và đó là câu hỏi không học thuộc trước được.
  */

  /**
   * Giáp: trừ THẲNG một lượng sát thương sau khi đã nhân mọi hệ số.
   *
   * Đây là nét quan trọng nhất. Bình thường chọn đúng hệ được gấp 1,5 lần chọn
   * sai - hơn, nhưng chưa tới mức bắt buộc, nên trẻ cứ bấm phép quen tay cũng
   * qua. Giáp cắt một khoản CỐ ĐỊNH, nên nó ăn gần trọn một đòn yếu mà chỉ sứt
   * một góc đòn khắc chế: cùng con số giáp ấy biến khoảng cách 1,5 lần thành
   * hơn mười lần. Chọn đúng hệ từ chỗ "nên làm" thành chỗ "phải làm".
   *
   * Vẫn không bao giờ về 0 - xem ghi chú ở `elementMultiplier`. Đòn sai hệ còn
   * đúng một điểm sát thương: đủ để trẻ thấy mình vẫn làm được gì đó, đủ ít để
   * thấy ngay là mình vừa chọn sai.
   */
  armor?: number
  /**
   * Cứ bấy nhiêu câu thì quái ĐỔI NGUYÊN TỐ một lần.
   *
   * Không có nó thì cả trận chỉ có một nước đi đúng, tìm ra ở câu đầu rồi lặp
   * lại mười ba lần. Có nó thì bảng phép phải được ĐỌC LẠI, và con thú vừa là
   * chủ lực ba câu trước bỗng thành con bị khắc.
   */
  shiftEvery?: number
  /** Vòng nguyên tố quái xoay qua. Bỏ trống thì đi hết bốn hệ theo vòng khắc chế. */
  elementCycle?: Element[]
  /**
   * Trẻ trả lời sai hoặc để hết giờ thì quái HỒI bấy nhiêu máu.
   *
   * Phạt cái đoán mò, chứ không phạt cái chậm. Ở trận thường đoán bừa mười câu
   * vẫn có thể thắng nhờ ba câu đúng cuối; ở đây mỗi câu bừa trả lại cho quái
   * đúng phần trẻ vừa lấy đi, nên chỉ đường nào thật sự chắc mới dẫn tới đích.
   */
  regenOnMiss?: number
  /** Máu tụt dưới tỉ lệ này (0..1) thì quái nổi giận. Bỏ trống là không bao giờ. */
  enrageAt?: number
  /** Nổi giận rồi thì sát thương nhân lên bấy nhiêu, và đồng hồ rút ngắn một phần tư. */
  enrageAttackScale?: number
}

export interface PlayerStats {
  maxHp: number
  /** Hệ số sát thương từ cấp độ, trang bị và pet. 1.0 là mặc định. */
  power: number
}

export type BattlePhase = 'question' | 'spell' | 'feedback' | 'victory' | 'retreat'

export interface AnswerRecord {
  questionId: string
  skillId: string
  subject: Subject
  difficulty: Difficulty
  correct: boolean
  quality?: ChoiceQuality
  durationMs: number
  usedHint: boolean
  answeredAt: number
}

/** Kết quả một lần tung phép, để giao diện vẽ số sát thương và nhãn khắc chế. */
export interface SpellHit {
  spell: Spell
  damage: number
  matchup: 'strong' | 'weak' | 'neutral'
}

export interface BattleState {
  phase: BattlePhase
  enemy: Enemy
  enemyHp: number
  /**
   * Nguyên tố quái đang mang NGAY LÚC NÀY.
   *
   * Tách khỏi `enemy.element` vì trùm trong tháp đổi hệ giữa trận: `enemy` là
   * bản khai bất biến của con quái, còn đây là trạng thái. Mọi chỗ tính khắc chế
   * phải đọc trường này - đọc `enemy.element` thì bảng phép vẫn tô "Khắc chế!"
   * theo cái hệ con quái đã bỏ lại từ ba câu trước.
   */
  enemyElement: Element
  /** Quái đã nổi giận chưa. Một chiều: nổi rồi thì không nguôi. */
  enraged: boolean
  player: PlayerStats
  /** Máu CẢ ĐỘI thú, không phải máu riêng con nào. */
  playerHp: number
  /** Đội thú của trẻ. */
  team: BattlePet[]
  /** Con thú đang đứng ra trận. */
  activeIndex: number
  question: Question | null
  /** Epoch ms lúc câu hỏi hiện ra - dùng để tính thưởng tốc độ. */
  questionShownAt: number
  hintUsed: boolean
  /** Số câu đúng liên tiếp trong trận này. */
  combo: number
  bestCombo: number
  answers: AnswerRecord[]
  lastJudgement: Judgement | null
  lastDamage: { toEnemy: number; toPlayer: number } | null
  /** Phép vừa tung, để giao diện hiện tên phép và nhãn "Khắc chế!". */
  lastSpell: SpellHit | null
  /**
   * Sát thương gốc đang chờ trẻ chọn phép. Chỉ khác null ở pha 'spell'.
   * Chưa nhân nguyên tố và chưa nhân sức mạnh của thú.
   */
  pendingDamage: number | null
  goldEarned: number
  xpEarned: number
  /** Điểm phẩm chất tích được từ các tình huống Đạo đức. */
  virtues: Partial<Record<Virtue, number>>
  questionsAsked: number
  maxQuestions: number
  /**
   * Giới hạn thời gian cho MỖI câu, mili giây. `null` là không đếm giờ.
   *
   * Chỉ trận trùm và trận đầu đàn mới đặt giới hạn: ở đó đề đã khó hơn, và cái
   * đồng hồ là thứ buộc trẻ phải THẠO chứ không phải ngồi dò từng đáp án. Trận
   * thường tuyệt đối không đếm giờ - trẻ đang học, không đang thi.
   */
  timeLimitMs: number | null
  /** Lời tường thuật hiển thị trong khung diễn biến trận đấu. */
  log: string[]
}

export interface BattleConfig {
  enemy: Enemy
  player: PlayerStats
  /** Đội thú ra trận. Rỗng thì trận không thể bắt đầu. */
  team: Pet[]
  /** Hết số câu này mà quái chưa gục thì trận kết thúc hoà (tính là rút lui). */
  maxQuestions?: number
  /** Giới hạn thời gian mỗi câu. Bỏ trống là không đếm giờ. */
  timeLimitMs?: number | null
}

// --- Hằng số cân bằng --------------------------------------------------------

const BASE_DAMAGE = 8
const DIFFICULTY_DAMAGE = 4
const MAX_COMBO_STACKS = 5
const COMBO_STEP = 0.12
const HINT_DAMAGE_PENALTY = 0.6
/** Lựa chọn "tạm được" trong tình huống Đạo đức gây ít sát thương hơn "tốt". */
const QUALITY_MULTIPLIER: Record<ChoiceQuality, number> = { good: 1, ok: 0.6, poor: 0 }

const DEFAULT_MAX_QUESTIONS = 10

/** Tên hệ tiếng Việt, dùng trong khung diễn biến trận đấu. */
const ELEMENT_NAME: Record<Element, string> = {
  math: 'Số Học',
  vietnamese: 'Ngôn Từ',
  music: 'Thanh Âm',
  ethics: 'Ánh Sáng',
}

/** Vòng đổi hệ mặc định: đúng vòng khắc chế, nên đoán trước được. */
const DEFAULT_ELEMENT_CYCLE: Element[] = ['math', 'vietnamese', 'music', 'ethics']

/**
 * Giờ cho mỗi câu ở trận trùm và trận đầu đàn.
 *
 * Trùm gấp hơn đầu đàn: đầu đàn là chỗ tập dượt gặp giữa đường, trùm là bài
 * kiểm tra cuối vùng đất. Trẻ nào còn phải nhẩm từng bước sẽ không kịp trùm,
 * và đó chính là ý - phải thạo mới qua được.
 *
 * Trùm trong tháp gấp hơn nữa, vì ở đó mỗi câu còn phải đọc lại hệ con quái
 * vừa đổi rồi mới chọn phép - hai việc trong cùng một khoảng thời gian ngắn hơn.
 *
 * Đây là hàm CẤU HÌNH, không phải một bước của máy trạng thái, nên nó được phép
 * đọc kho thiết lập. Phần lõi (`submitAnswer`, `castSpell`) vẫn thuần: mọi con
 * số nó cần đều đi vào qua `BattleConfig`.
 */
export function timeLimitFor(kind: 'boss' | 'mini' | 'tower', grade: Grade): number {
  const tuning = getTuning()
  const seconds =
    kind === 'tower' ? tuning.towerSeconds : kind === 'boss' ? tuning.bossSeconds : tuning.miniBossSeconds
  return Math.round(seconds * (grade <= 2 ? tuning.youngReaderFactor : 1) * 1000)
}

/** Thưởng cho trả lời nhanh. Ngưỡng nới rộng vì trẻ lớp 1 đọc đề còn chậm. */
export function speedMultiplier(durationMs: number): number {
  if (durationMs < 4_000) return 1.5
  if (durationMs < 8_000) return 1.25
  if (durationMs < 15_000) return 1
  return 0.85
}

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, MAX_COMBO_STACKS) * COMBO_STEP
}

/**
 * Nguyên tố kế tiếp trong vòng xoay của quái.
 *
 * Mặc định đi theo đúng VÒNG KHẮC CHẾ (Số Học → Ngôn Từ → Thanh Âm → Ánh Sáng),
 * không bốc ngẫu nhiên. Ngẫu nhiên thì hai lượt liền có thể ra cùng một hệ và
 * trẻ tưởng cơ chế hỏng; đi vòng thì sau vài lượt trẻ ĐOÁN TRƯỚC được hệ sắp
 * tới - và đoán trước được chính là phần thưởng cho việc chịu khó nhìn.
 */
export function nextEnemyElement(state: BattleState): Element {
  const cycle = state.enemy.elementCycle ?? DEFAULT_ELEMENT_CYCLE
  const at = cycle.indexOf(state.enemyElement)
  return cycle[(at + 1) % cycle.length] ?? state.enemyElement
}

/** Sát thương một đòn của quái, đã tính cả cơn giận. */
export function enemyAttackOf(state: BattleState): number {
  const scale = state.enraged ? (state.enemy.enrageAttackScale ?? 1) : 1
  return Math.max(1, Math.round(state.enemy.attack * scale))
}

/**
 * Quái hồi máu vì trẻ trả lời sai.
 *
 * Không bao giờ vượt quá máu tối đa - một con trùm đầy máu lại trồi lên trên
 * vạch đầy là một thanh máu nói dối. Và không hồi khi quái đã gục: trận đã xong.
 */
function regenAfterMiss(state: BattleState, log: string[]): Pick<BattleState, 'enemyHp' | 'log'> {
  const heal = state.enemy.regenOnMiss ?? 0
  if (heal <= 0 || state.enemyHp <= 0) return { enemyHp: state.enemyHp, log }

  const healed = Math.min(state.enemy.maxHp, state.enemyHp + heal)
  const gained = healed - state.enemyHp
  if (gained <= 0) return { enemyHp: state.enemyHp, log }

  return {
    enemyHp: healed,
    log: [...log, `🩸 ${state.enemy.name} hút lại ${gained} máu từ câu trả lời sai.`],
  }
}

// --- Vòng đời trận đấu -------------------------------------------------------

export function createBattle(
  config: BattleConfig,
  firstQuestion: Question,
  now: number,
): BattleState {
  const team = config.team.map(toBattlePet)
  return {
    phase: 'question',
    enemy: config.enemy,
    enemyHp: config.enemy.maxHp,
    enemyElement: config.enemy.element,
    enraged: false,
    player: config.player,
    playerHp: teamHp(team).hp,
    team,
    activeIndex: 0,
    question: firstQuestion,
    questionShownAt: now,
    hintUsed: false,
    combo: 0,
    bestCombo: 0,
    answers: [],
    lastJudgement: null,
    lastDamage: null,
    lastSpell: null,
    pendingDamage: null,
    goldEarned: 0,
    xpEarned: 0,
    virtues: {},
    questionsAsked: 1,
    maxQuestions: config.maxQuestions ?? DEFAULT_MAX_QUESTIONS,
    timeLimitMs: config.timeLimitMs ?? null,
    log: [`${config.enemy.emoji} ${config.enemy.name} xuất hiện!`],
  }
}

/**
 * Hết giờ một câu.
 *
 * Tính như một câu trả lời sai: quái đánh trả, chuỗi combo đứt, và câu đó vẫn
 * được ghi vào sổ để lịch ôn tập biết kỹ năng này còn yếu.
 *
 * KỂ CẢ MÔN ĐẠO ĐỨC. Ở đó chọn phương án chưa hay thì không bị trừ máu - vì đó
 * là một lựa chọn, và trẻ cần được phép chọn sai để học. Nhưng hết giờ không
 * phải một lựa chọn, đó là không chọn gì cả; miễn trừ nốt trường hợp này thì
 * đồng hồ ở vùng Đạo đức chỉ là hình vẽ.
 */
export function timeUp(state: BattleState, now: number): BattleState {
  if (state.phase !== 'question' || !state.question || state.timeLimitMs === null) return state

  const question = state.question
  const record: AnswerRecord = {
    questionId: question.id,
    skillId: question.skillId,
    subject: question.subject,
    difficulty: question.difficulty,
    correct: false,
    durationMs: state.timeLimitMs,
    usedHint: state.hintUsed,
    answeredAt: now,
  }

  const attacked = applyEnemyAttack(state, enemyAttackOf(state))
  return {
    ...state,
    answers: [...state.answers, record],
    lastJudgement: { correct: false, message: 'Hết giờ mất rồi! Câu sau nhanh hơn nhé.' },
    ...attacked,
    ...regenAfterMiss(state, attacked.log),
    phase: 'feedback',
    combo: 0,
    lastSpell: null,
    pendingDamage: null,
  }
}

/** Con thú đang ra trận. */
export function activePet(state: BattleState): BattlePet | null {
  return state.team[state.activeIndex] ?? null
}

/** Bấm gợi ý: trả lời đúng vẫn được tính, nhưng sát thương giảm. */
export function useHint(state: BattleState): BattleState {
  if (state.phase !== 'question' || state.hintUsed) return state
  return { ...state, hintUsed: true }
}

export function submitAnswer(state: BattleState, input: AnswerInput, now: number): BattleState {
  if (state.phase !== 'question' || !state.question) return state

  const question = state.question
  const judgement = judge(question, input)
  const durationMs = Math.max(0, now - state.questionShownAt)
  const isEthics = question.subject === 'ethics'

  // Ghi nhận câu trả lời NGAY, không đợi tung phép xong: thống kê và lịch ôn
  // tập không được phụ thuộc vào việc trẻ có bấm tiếp hay không.
  const record: AnswerRecord = {
    questionId: question.id,
    skillId: question.skillId,
    subject: question.subject,
    difficulty: question.difficulty,
    correct: judgement.correct,
    quality: judgement.quality,
    durationMs,
    usedHint: state.hintUsed,
    answeredAt: now,
  }

  const earnedGold = judgement.correct ? 2 + question.difficulty : 0
  const earnedXp = judgement.correct ? 3 + question.difficulty * 2 : 1

  const virtues = { ...state.virtues }
  for (const virtue of judgement.virtues ?? []) {
    if (judgement.quality === 'good') virtues[virtue] = (virtues[virtue] ?? 0) + 1
  }

  const base = {
    ...state,
    answers: [...state.answers, record],
    lastJudgement: judgement,
    goldEarned: state.goldEarned + earnedGold,
    xpEarned: state.xpEarned + earnedXp,
    virtues,
  }

  if (judgement.correct) {
    const qualityFactor = judgement.quality ? QUALITY_MULTIPLIER[judgement.quality] : 1
    const pendingDamage = Math.round(
      (BASE_DAMAGE + DIFFICULTY_DAMAGE * question.difficulty) *
        state.player.power *
        speedMultiplier(durationMs) *
        comboMultiplier(state.combo) *
        (state.hintUsed ? HINT_DAMAGE_PENALTY : 1) *
        qualityFactor,
    )

    const combo = state.combo + 1
    return {
      ...base,
      phase: 'spell',
      combo,
      bestCombo: Math.max(state.bestCombo, combo),
      pendingDamage,
      lastDamage: null,
      lastSpell: null,
      log: [
        ...state.log,
        isEthics ? '✨ Đúng rồi! Chọn phép để cảm hoá.' : '✅ Đúng rồi! Chọn phép để tung.',
      ],
    }
  }

  // --- Trả lời chưa đúng -----------------------------------------------------
  if (isEthics) {
    // Lựa chọn chưa tốt: chỉ mất lượt, tuyệt đối không trừ máu.
    return {
      ...base,
      phase: 'feedback',
      combo: 0,
      lastDamage: { toEnemy: 0, toPlayer: 0 },
      lastSpell: null,
      pendingDamage: null,
      log: [...state.log, '💭 Lựa chọn này chưa ổn. Con mất một lượt để suy nghĩ lại.'],
    }
  }

  const attacked = applyEnemyAttack(state, enemyAttackOf(state))
  return {
    ...base,
    ...attacked,
    ...regenAfterMiss(state, attacked.log),
    phase: 'feedback',
    combo: 0,
    lastSpell: null,
    pendingDamage: null,
  }
}

/**
 * Quái đánh trả: sát thương rơi vào con thú đang ra trận, con đó gục thì con
 * sau bước ra. Trả về phần trạng thái thay đổi.
 */
function applyEnemyAttack(
  state: BattleState,
  damage: number,
): Pick<BattleState, 'team' | 'activeIndex' | 'playerHp' | 'lastDamage' | 'log'> {
  const team = state.team.map((p, i) =>
    i === state.activeIndex ? { ...p, hp: Math.max(0, p.hp - damage) } : p,
  )
  const log = [...state.log, `💥 ${state.enemy.name} đánh trả ${damage} sát thương.`]

  let activeIndex = state.activeIndex
  const fainted = team[state.activeIndex]!.hp <= 0
  if (fainted) {
    log.push(`😵 ${team[state.activeIndex]!.pet.name} đã kiệt sức.`)
    const next = nextAlive(team, state.activeIndex)
    if (next >= 0) {
      activeIndex = next
      log.push(`🔄 ${team[next]!.pet.name} bước ra thay!`)
    }
  }

  return { team, activeIndex, playerHp: teamHp(team).hp, lastDamage: { toEnemy: 0, toPlayer: damage }, log }
}

/**
 * Tung phép sau khi trả lời đúng.
 *
 * Nhận cả đối tượng `Spell` chứ không nhận id: engine phải sạch dữ liệu, bộ
 * phép nằm bên `content/pets.ts`.
 *
 * `casterIndex` cho phép gọi MỘT CON KHÁC trong đội ra tung phép. Đây không
 * phải tính năng phụ: thú chỉ biết phép cùng hệ của mình, nên nếu chỉ được dùng
 * con đang đứng thì gặp quái khắc hệ là cả ba lựa chọn đều "bị khắc" - trẻ có
 * ba nút bấm nhưng không có lựa chọn nào. Đổi con chính là nước đi đúng.
 */
export function castSpell(
  state: BattleState,
  spell: Spell,
  now: number,
  casterIndex?: number,
): BattleState {
  if (state.phase !== 'spell' || state.pendingDamage === null) return state

  const swap =
    casterIndex !== undefined &&
    casterIndex !== state.activeIndex &&
    state.team[casterIndex] !== undefined &&
    state.team[casterIndex]!.hp > 0
  const active = swap ? casterIndex! : state.activeIndex
  const pet = state.team[active] ?? null
  const multiplier = elementMultiplier(spell.element, state.enemyElement)
  const raw = Math.round(state.pendingDamage * spell.power * multiplier * (pet?.pet.power ?? 1))
  // Giáp trừ SAU khi đã nhân mọi hệ số, nên nó ăn gần trọn một đòn sai hệ mà chỉ
  // sứt một góc đòn khắc chế. Vẫn để lại 1 - không đòn nào của trẻ là vô ích.
  const damage = Math.max(1, raw - (state.enemy.armor ?? 0))
  const matchup = matchupLabel(spell.element, state.enemyElement)

  const log = [...state.log]
  if (swap) log.push(`🔄 ${pet?.pet.name} bước ra tung phép!`)
  log.push(`⚔️ ${pet?.pet.name ?? 'Thú'} ${spell.flavour} - ${damage} sát thương!`)
  if (matchup === 'strong') log.push('🔥 Khắc chế! Sát thương tăng mạnh.')
  else if (matchup === 'weak') log.push('🪨 Bị khắc. Lần sau thử phép hệ khác xem sao.')
  if (matchup !== 'strong' && raw - damage > 0) {
    log.push(`🛡️ Giáp chặn mất ${raw - damage} sát thương. Đánh đúng hệ mới xuyên qua được.`)
  }
  if (state.combo >= 3) log.push(`✨ Chuỗi ${state.combo} câu đúng liên tiếp!`)

  const enemyHp = Math.max(0, state.enemyHp - damage)

  // Nổi giận ngay tại đòn làm máu tụt qua ngưỡng, để dòng báo nằm sát dòng sát
  // thương vừa gây ra - đọc là hiểu ngay vì sao nó nổi giận.
  const threshold = state.enemy.enrageAt ?? 0
  const enraged =
    state.enraged || (threshold > 0 && enemyHp > 0 && enemyHp <= state.enemy.maxHp * threshold)
  const justEnraged = enraged && !state.enraged
  if (justEnraged) {
    log.push(`😡 ${state.enemy.name} nổi giận! Đòn đánh mạnh hơn và thời gian rút ngắn.`)
  }

  return {
    ...state,
    phase: 'feedback',
    activeIndex: active,
    enemyHp,
    enraged,
    // Cơn giận rút đồng hồ đi một phần tư. Đây là chỗ DUY NHẤT `timeLimitMs` đổi
    // giữa trận, và nó chỉ rút ngắn - không bao giờ nới ra.
    timeLimitMs:
      justEnraged && state.timeLimitMs !== null
        ? Math.round(state.timeLimitMs * 0.75)
        : state.timeLimitMs,
    lastDamage: { toEnemy: damage, toPlayer: 0 },
    lastSpell: { spell, damage, matchup },
    pendingDamage: null,
    questionShownAt: now,
    log,
  }
}

/**
 * Chuyển từ màn phản hồi sang câu tiếp theo, hoặc kết thúc trận.
 *
 * Gọi với `nextQuestion = null` khi bộ chọn câu đã cạn - trận kết thúc như
 * trường hợp hết lượt.
 */
export function advance(
  state: BattleState,
  nextQuestion: Question | null,
  now: number,
): BattleState {
  if (state.phase !== 'feedback') return state

  if (state.enemyHp <= 0) {
    return {
      ...state,
      phase: 'victory',
      question: null,
      goldEarned: state.goldEarned + state.enemy.goldReward,
      xpEarned: state.xpEarned + state.enemy.xpReward,
      log: [...state.log, `🏆 Con đã thắng ${state.enemy.name}!`],
    }
  }

  if (teamAlive(state.team) === 0) {
    return {
      ...state,
      phase: 'retreat',
      question: null,
      log: [
        ...state.log,
        '🏡 Cả đội thú về làng nghỉ ngơi. Toàn bộ vàng và kinh nghiệm vẫn được giữ.',
      ],
    }
  }

  const outOfQuestions = !nextQuestion || state.questionsAsked >= state.maxQuestions
  if (outOfQuestions) {
    return {
      ...state,
      phase: 'retreat',
      question: null,
      log: [...state.log, '🏡 Hết lượt rồi. Con mang theo toàn bộ phần thưởng về làng.'],
    }
  }

  // Đổi hệ TRƯỚC khi câu hỏi mới hiện ra, để trẻ thấy hệ mới cùng lúc với câu
  // hỏi mới chứ không phải sau khi đã trả lời xong và không sửa được nữa.
  const questionsAsked = state.questionsAsked + 1
  const shiftEvery = state.enemy.shiftEvery ?? 0
  const shifting = shiftEvery > 0 && (questionsAsked - 1) % shiftEvery === 0
  const enemyElement = shifting ? nextEnemyElement(state) : state.enemyElement

  return {
    ...state,
    phase: 'question',
    question: nextQuestion,
    questionShownAt: now,
    hintUsed: false,
    lastJudgement: null,
    lastDamage: null,
    lastSpell: null,
    questionsAsked,
    enemyElement,
    log: shifting
      ? [...state.log, `🌀 ${state.enemy.name} đổi sang hệ ${ELEMENT_NAME[enemyElement]}!`]
      : state.log,
  }
}

export function isOver(state: BattleState): boolean {
  return state.phase === 'victory' || state.phase === 'retreat'
}

/** Tỉ lệ đúng trong trận, dùng cho màn tổng kết. */
export function battleAccuracy(state: BattleState): number {
  if (state.answers.length === 0) return 0
  return state.answers.filter((a) => a.correct).length / state.answers.length
}
