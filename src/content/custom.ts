/**
 * Nội dung do thầy cô / bố mẹ tự soạn, chồng lên ngân hàng có sẵn trong mã.
 *
 * Trang quản trị trước đây CHỈ ĐỌC, với lý do chính đáng: câu hỏi nằm trong
 * `src/content`, sửa từ trình duyệt thì mã nguồn vẫn y nguyên và lần dựng sau là
 * mất sạch. Nhưng hệ quả là người BIẾT lớp mình cần gì lại là người duy nhất
 * không sửa được gì.
 *
 * Kho này giải quyết bằng cách tách hẳn hai tầng:
 *
 *   MÃ NGUỒN  - ngân hàng gốc, không ai sửa được từ trình duyệt, không bao giờ
 *               mất.
 *   KHO NÀY   - phần thêm vào và phần ẩn đi, nằm trong localStorage của máy này
 *               và được đồng bộ lên Supabase nếu có đăng nhập.
 *
 * Nhờ vậy sửa sai cũng không hỏng được nội dung gốc: xoá kho này là mọi thứ về
 * như cũ.
 *
 * MỖI THỨ MỘT DÒNG, CÓ ID VÀ CÓ MỐC THỜI GIAN. Cô giáo soạn mười câu trên laptop
 * buổi tối rồi sáng hôm sau sửa thêm trên máy tính bảng ở lớp: nếu cả bộ là một
 * khối thì máy gửi sau ghi đè máy kia, mất trắng một buổi tối mà không ai được
 * báo. Chia thành dòng thì hai máy hợp nhất được - xem `mergeContent`.
 *
 * Xoá thì ĐÁNH DẤU chứ không bỏ hẳn, vì cùng lý do: bỏ hẳn thì lần đồng bộ sau
 * máy kia lại đẩy câu đó quay về.
 *
 * KHÔNG PHẢI ZUSTAND, cùng lý do với `tuning.ts`: `content` và `engine` cố ý
 * không biết gì về React, mà chính chúng mới là chỗ đọc kho này.
 */

import type { BankEntry } from './bank'
import type { Difficulty, ScenarioOption, Virtue } from './types'
import { VIRTUE_LABEL } from './types'

/** Một dòng trong kho: có id để hợp nhất, có mốc để biết bản nào mới hơn. */
export interface CustomRow<T> {
  id: string
  value: T
  /** Epoch ms của lần sửa cuối. Bản nào mới hơn thì thắng. */
  updatedAt: number
  /** Epoch ms lúc xoá, hoặc null nếu còn dùng. Bia mộ, không phải rác. */
  deletedAt: number | null
  /**
   * Ai soạn dòng này. `null` là "của máy này, chưa gửi lên bao giờ".
   *
   * Cần có, vì máy này còn kéo về cả nội dung của người khác: học sinh nhận câu
   * cô giáo soạn, phụ huynh nhận câu của chính mình từ máy khác. Không phân biệt
   * được thì trang quản trị sẽ mời người ta sửa một câu mà máy chủ sẽ từ chối -
   * và tệ hơn: sửa xong tưởng đã lưu.
   */
  ownerId: string | null
}

export interface QuestionRow extends CustomRow<BankEntry> {
  skillId: string
}

export interface HiddenRow extends CustomRow<string> {
  skillId: string
}

export interface SkillNameRow extends CustomRow<string> {
  skillId: string
}

export interface CustomContent {
  questions: QuestionRow[]
  hidden: HiddenRow[]
  skillNames: SkillNameRow[]
}

const EMPTY: CustomContent = { questions: [], hidden: [], skillNames: [] }

const STORAGE_KEY = 'hvtt.content.v2'
/** Bản cũ: gom theo kỹ năng, không id, không mốc thời gian. */
const LEGACY_KEY = 'hvtt.content.v1'

/** Bia mộ sống đủ lâu để một máy tính bảng bỏ trong tủ cả kỳ nghỉ hè vẫn kịp biết. */
const TOMBSTONE_MS = 90 * 24 * 60 * 60 * 1000

/** Giới hạn cho lành: kho này nằm trong localStorage, không phải cơ sở dữ liệu. */
export const LIMITS = {
  maxQuestionsPerSkill: 60,
  maxPromptLength: 400,
  maxChoiceLength: 120,
  maxChoices: 6,
} as const

const DIFFICULTIES: Difficulty[] = [1, 2, 3]

function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty)
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function cleanList(value: unknown, max: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => cleanText(item, maxLength))
    .filter((item) => item.length > 0)
    .slice(0, max)
}

/**
 * Id CỐ ĐỊNH cho những dòng mà danh tính nằm ở nội dung chứ không ở một uuid.
 *
 * Hai máy cùng ẩn một câu phải ra cùng một id. Nếu mỗi máy tự sinh uuid riêng
 * thì hợp nhất sẽ thành hai dòng, và lệnh "hiện lại" ở máy này không gỡ được
 * lệnh "ẩn" của máy kia - câu đó biến mất vĩnh viễn mà không ai hiểu vì sao.
 *
 * Câu hỏi thì ngược lại, vẫn dùng uuid: hai người soạn hai câu khác nhau cho
 * cùng một kỹ năng là chuyện bình thường, và cả hai đều phải được giữ.
 */
export function keyId(prefix: 'hidden' | 'name', skillId: string, value: string): string {
  return prefix === 'name' ? `name:${skillId}` : `hidden:${skillId}:${value}`
}

/** Id do MÁY đặt, để hai máy đang offline không bao giờ đụng id của nhau. */
export function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    // Trình duyệt cũ hoặc ngữ cảnh không an toàn: đủ ngẫu nhiên cho việc này.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

/**
 * Nhặt ra một câu hợp lệ, hoặc `null`.
 *
 * Gắt tay có chủ ý: kho này đi qua localStorage, qua tệp JSON người dùng tự mang
 * tới, VÀ qua máy chủ - nên mọi thứ vào đây đều là dữ liệu lạ. Một câu thiếu đáp
 * án lọt được vào ngân hàng là trẻ đang đánh trùm thì gặp câu không trả lời nổi.
 */
export function sanitiseEntry(raw: unknown): BankEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, unknown>

  const difficulty: Difficulty = isDifficulty(input.difficulty) ? input.difficulty : 1
  const prompt = cleanText(input.prompt, LIMITS.maxPromptLength)
  if (!prompt) return null

  const hint = cleanText(input.hint, LIMITS.maxPromptLength)
  const image = cleanText(input.image, 16)
  const base = {
    difficulty,
    prompt,
    explanation: cleanText(input.explanation, LIMITS.maxPromptLength),
    ...(hint ? { hint } : {}),
    ...(image ? { image } : {}),
  }

  switch (input.kind) {
    case 'choice': {
      const correct = cleanText(input.correct, LIMITS.maxChoiceLength)
      const distractors = cleanList(
        input.distractors,
        LIMITS.maxChoices - 1,
        LIMITS.maxChoiceLength,
      ).filter((item) => item !== correct)
      // Một đáp án đúng mà không có đáp án sai nào thì không phải câu trắc nghiệm.
      if (!correct || distractors.length === 0) return null
      return { ...base, kind: 'choice', correct, distractors }
    }
    case 'text': {
      const accepted = cleanList(input.accepted, 8, LIMITS.maxChoiceLength)
      if (accepted.length === 0) return null
      return { ...base, kind: 'text', accepted }
    }
    case 'order': {
      const items = cleanList(input.items, 10, LIMITS.maxChoiceLength)
      if (items.length < 2) return null
      return { ...base, kind: 'order', items }
    }
    case 'pairs': {
      const pairs = sanitisePairs(input.pairs)
      // Một cặp thì không có gì để nối. Hai cặp trở lên mới thành câu hỏi.
      if (pairs.length < 2) return null
      return { ...base, kind: 'pairs', pairs }
    }
    case 'scenario': {
      const options = sanitiseOptions(input.options)
      if (options.length < 2) return null
      return { ...base, kind: 'scenario', options }
    }
    default:
      return null
  }
}

/**
 * Nối cặp: mỗi phần tử là [vế trái, vế phải].
 *
 * Bỏ cặp nào thiếu một vế thay vì bỏ cả câu. Thiếu vế phải nghĩa là người soạn
 * gõ lệch một dòng giữa hai cột - phần còn lại vẫn dùng được, và trang quản trị
 * sẽ nói rõ dòng nào lệch.
 */
function sanitisePairs(raw: unknown): Array<[string, string]> {
  if (!Array.isArray(raw)) return []
  const out: Array<[string, string]> = []
  const seen = new Set<string>()

  for (const item of raw) {
    if (!Array.isArray(item)) continue
    const left = cleanText(item[0], LIMITS.maxChoiceLength)
    const right = cleanText(item[1], LIMITS.maxChoiceLength)
    if (!left || !right) continue
    // Vế trái trùng nhau là câu hỏi có hai lời giải đúng cho cùng một ô.
    if (seen.has(left)) continue
    seen.add(left)
    out.push([left, right])
    if (out.length >= LIMITS.maxChoices) break
  }
  return out
}

const QUALITIES: Array<ScenarioOption['quality']> = ['good', 'ok', 'poor']

const VIRTUES = Object.keys(VIRTUE_LABEL) as Virtue[]

/** Nhặt phẩm chất hợp lệ. Tên lạ thì bỏ, không làm hỏng cả lựa chọn. */
function sanitiseVirtues(raw: unknown): Virtue[] {
  if (!Array.isArray(raw)) return []
  const out: Virtue[] = []
  for (const item of raw) {
    const value = typeof item === 'string' ? (item.trim() as Virtue) : null
    if (value && VIRTUES.includes(value) && !out.includes(value)) out.push(value)
  }
  return out
}

function sanitiseOptions(raw: unknown): ScenarioOption[] {
  if (!Array.isArray(raw)) return []
  const out: ScenarioOption[] = []

  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const label = cleanText(row.label, LIMITS.maxChoiceLength)
    if (!label) continue
    const quality = QUALITIES.includes(row.quality as ScenarioOption['quality'])
      ? (row.quality as ScenarioOption['quality'])
      : 'ok'
    out.push({
      id: cleanText(row.id, 40) || `tu-soan-${index + 1}`,
      label,
      quality,
      feedback: cleanText(row.feedback, LIMITS.maxPromptLength),
      // Phẩm chất chỉ cộng cho lựa chọn ĐÁNG khen. Gắn vào lựa chọn "chưa nên"
      // thì trẻ chọn sai vẫn được thưởng, và cả cơ chế mất nghĩa.
      virtues: quality === 'good' ? sanitiseVirtues(row.virtues) : [],
    })
    if (out.length >= LIMITS.maxChoices) break
  }
  return out
}

function rowShape(
  raw: unknown,
): { id: string; skillId: string; updatedAt: number; deletedAt: number | null; ownerId: string | null } | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, unknown>
  const skillId = cleanText(input.skillId, 120)
  if (!skillId) return null

  const updatedAt = typeof input.updatedAt === 'number' && Number.isFinite(input.updatedAt)
    ? input.updatedAt
    : 0
  const deletedAt = typeof input.deletedAt === 'number' && Number.isFinite(input.deletedAt)
    ? input.deletedAt
    : null

  const ownerId = cleanText(input.ownerId, 60)
  return {
    id: cleanText(input.id, 60) || newId(),
    skillId,
    updatedAt,
    deletedAt,
    ownerId: ownerId || null,
  }
}

/** Ép cả kho về dạng dùng được. Hỏng dòng nào thì bỏ dòng đó, không bỏ cả kho. */
export function sanitiseContent(raw: unknown): CustomContent {
  if (!raw || typeof raw !== 'object') return { ...EMPTY }
  const input = raw as Record<string, unknown>

  const questions: QuestionRow[] = []
  if (Array.isArray(input.questions)) {
    for (const item of input.questions) {
      const shape = rowShape(item)
      if (!shape) continue
      const value = sanitiseEntry((item as Record<string, unknown>).value)
      // Bia mộ không cần nội dung hợp lệ - nó chỉ nói "cái này đã bị xoá".
      if (!value && shape.deletedAt === null) continue
      questions.push({ ...shape, value: value ?? PLACEHOLDER_ENTRY })
    }
  }

  const hidden: HiddenRow[] = []
  if (Array.isArray(input.hidden)) {
    for (const item of input.hidden) {
      const shape = rowShape(item)
      if (!shape) continue
      const value = cleanText((item as Record<string, unknown>).value, LIMITS.maxPromptLength)
      if (!value) continue
      hidden.push({ ...shape, id: keyId('hidden', shape.skillId, value), value })
    }
  }

  const skillNames: SkillNameRow[] = []
  if (Array.isArray(input.skillNames)) {
    for (const item of input.skillNames) {
      const shape = rowShape(item)
      if (!shape) continue
      const value = cleanText((item as Record<string, unknown>).value, 80)
      if (!value) continue
      skillNames.push({ ...shape, id: keyId('name', shape.skillId, ''), value })
    }
  }

  return { questions, hidden, skillNames }
}

/** Chỗ giữ chân cho bia mộ: không bao giờ hiện ra vì dòng đó đã bị xoá. */
const PLACEHOLDER_ENTRY: BankEntry = {
  kind: 'text',
  difficulty: 1,
  prompt: '(đã xoá)',
  explanation: '',
  accepted: ['(đã xoá)'],
}

/**
 * Đọc bản v1 (gom theo kỹ năng, không id) và dựng lại thành các dòng.
 *
 * Người dùng đã soạn cả buổi trên bản cũ - nâng cấp mà mất sạch thì không khác
 * gì phản bội. Mốc thời gian lấy là "bây giờ": bản cũ chỉ có trên đúng một máy
 * nên không có gì để so.
 */
function fromLegacy(raw: unknown): CustomContent {
  if (!raw || typeof raw !== 'object') return { ...EMPTY }
  const input = raw as Record<string, unknown>
  const now = Date.now()
  const out: CustomContent = { questions: [], hidden: [], skillNames: [] }

  if (input.questions && typeof input.questions === 'object') {
    for (const [skillId, list] of Object.entries(input.questions as Record<string, unknown>)) {
      if (!Array.isArray(list)) continue
      for (const item of list) {
        const value = sanitiseEntry(item)
        if (value) out.questions.push({ id: newId(), skillId, value, updatedAt: now, deletedAt: null, ownerId: null })
      }
    }
  }

  if (input.hidden && typeof input.hidden === 'object') {
    for (const [skillId, list] of Object.entries(input.hidden as Record<string, unknown>)) {
      for (const prompt of cleanList(list, 200, LIMITS.maxPromptLength)) {
        out.hidden.push({ id: keyId('hidden', skillId, prompt), skillId, value: prompt, updatedAt: now, deletedAt: null, ownerId: null })
      }
    }
  }

  if (input.skillNames && typeof input.skillNames === 'object') {
    for (const [skillId, name] of Object.entries(input.skillNames as Record<string, unknown>)) {
      const value = cleanText(name, 80)
      if (value) out.skillNames.push({ id: keyId('name', skillId, ''), skillId, value, updatedAt: now, deletedAt: null, ownerId: null })
    }
  }

  return out
}

function load(): CustomContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return sanitiseContent(JSON.parse(raw))

    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const migrated = fromLegacy(JSON.parse(legacy))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      // Giữ lại bản cũ: nếu bản mới có gì đó sai, còn đường lần lại.
      return migrated
    }
    return { ...EMPTY }
  } catch {
    // Chế độ riêng tư, dữ liệu site bị xoá, JSON hỏng - đều về kho rỗng, tức là
    // dùng nguyên nội dung gốc. Không có gì để báo cho ai cả.
    return { ...EMPTY }
  }
}

let current: CustomContent = load()
const listeners = new Set<() => void>()

/**
 * Đếm số lần kho bị sửa.
 *
 * React nối vào kho này qua `useSyncExternalStore`, mà `getSnapshot` bắt buộc
 * phải trả về một giá trị SO SÁNH ĐƯỢC BẰNG ===. Trả về chính `current` thì
 * không được: mỗi lần ghi là một đối tượng mới, và React render vô tận. Một con
 * số tăng dần thì vừa ổn định vừa bắt được cả những lần sửa không đổi số lượng,
 * như sửa lại đề bài của một câu đã có.
 */
let revision = 0

export function contentRevision(): number {
  return revision
}

export function getCustomContent(): CustomContent {
  return current
}

function commit(next: CustomContent): void {
  current = prune(next)
  revision++
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Không lưu được thì vẫn đổi trong phiên này. Mất khi tải lại, không sao.
  }
  for (const listener of listeners) listener()
}

/** Bỏ bia mộ đã quá hạn. Đến lúc này mọi máy đều đã biết tin từ lâu. */
function prune(content: CustomContent): CustomContent {
  const cutoff = Date.now() - TOMBSTONE_MS
  const alive = <T>(row: CustomRow<T>) => row.deletedAt === null || row.deletedAt > cutoff
  return {
    questions: content.questions.filter(alive),
    hidden: content.hidden.filter(alive),
    skillNames: content.skillNames.filter(alive),
  }
}

/**
 * Id của người đang đăng nhập, do lớp đồng bộ đặt vào.
 *
 * Để ở đây thay vì bắt trang quản trị đi hỏi kho xác thực: `content` cố ý không
 * biết gì về React lẫn Supabase, và một chuỗi id thì không kéo theo phụ thuộc
 * nào cả.
 */
let myOwnerId: string | null = null

export function setContentOwner(ownerId: string | null): void {
  myOwnerId = ownerId
}

/** Dòng này mình sửa được không? Của người khác thì chỉ đọc. */
export function isMine<T>(row: CustomRow<T>): boolean {
  return row.ownerId === null || row.ownerId === myOwnerId
}

/** Đóng dấu chủ sở hữu cho những dòng vừa đẩy lên thành công. */
export function stampOwner(ids: Set<string>, ownerId: string): void {
  if (ids.size === 0) return
  const mark = <R extends CustomRow<unknown>>(rows: R[]): R[] =>
    rows.map((row) => (ids.has(row.id) ? { ...row, ownerId } : row))

  commit({
    questions: mark(current.questions),
    hidden: mark(current.hidden),
    skillNames: mark(current.skillNames),
  })
}

export function subscribeCustomContent(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Thay cả kho - chỉ dùng cho đồng bộ và nạp tệp. */
export function replaceContent(next: CustomContent): void {
  commit(next)
}

// --- Câu hỏi tự soạn ---------------------------------------------------------

/** Những câu còn sống của một kỹ năng, kèm id để trang quản trị gọi tên. */
export function customRows(skillId: string): QuestionRow[] {
  return current.questions.filter((row) => row.skillId === skillId && row.deletedAt === null)
}

/** Chỉ phần nội dung - đây là thứ `registry.ts` cần. */
export function customQuestions(skillId: string): BankEntry[] {
  return customRows(skillId).map((row) => row.value)
}

/** Thêm một câu. Trả về `false` nếu câu không hợp lệ hoặc kỹ năng đã đầy. */
export function addQuestion(skillId: string, raw: unknown): boolean {
  const value = sanitiseEntry(raw)
  if (!value) return false
  if (customRows(skillId).length >= LIMITS.maxQuestionsPerSkill) return false

  commit({
    ...current,
    questions: [
      ...current.questions,
      { id: newId(), skillId, value, updatedAt: Date.now(), deletedAt: null, ownerId: null },
    ],
  })
  return true
}

/** Sửa câu mang id này. Trả về `false` nếu câu mới không hợp lệ. */
export function updateQuestion(id: string, raw: unknown): boolean {
  const value = sanitiseEntry(raw)
  const found = current.questions.find((row) => row.id === id && row.deletedAt === null)
  if (!value || !found) return false

  commit({
    ...current,
    questions: current.questions.map((row) =>
      row.id === id ? { ...row, value, updatedAt: Date.now() } : row,
    ),
  })
  return true
}

export function removeQuestion(id: string): void {
  const now = Date.now()
  commit({
    ...current,
    questions: current.questions.map((row) =>
      row.id === id ? { ...row, updatedAt: now, deletedAt: now } : row,
    ),
  })
}

// --- Ẩn câu gốc --------------------------------------------------------------

export function isHidden(skillId: string, prompt: string): boolean {
  return current.hidden.some(
    (row) => row.skillId === skillId && row.value === prompt && row.deletedAt === null,
  )
}

export function setHidden(skillId: string, prompt: string, hide: boolean): void {
  const now = Date.now()
  const found = current.hidden.find((row) => row.skillId === skillId && row.value === prompt)

  if (!found) {
    if (!hide) return
    commit({
      ...current,
      hidden: [
        ...current.hidden,
        {
          id: keyId('hidden', skillId, prompt),
          skillId,
          value: prompt,
          updatedAt: now,
          deletedAt: null,
          ownerId: null,
        },
      ],
    })
    return
  }

  if ((found.deletedAt === null) === hide) return
  commit({
    ...current,
    hidden: current.hidden.map((row) =>
      row.id === found.id ? { ...row, updatedAt: now, deletedAt: hide ? null : now } : row,
    ),
  })
}

// --- Đổi tên kỹ năng ---------------------------------------------------------

export function skillNameOverride(skillId: string): string | null {
  const found = current.skillNames.find((row) => row.skillId === skillId && row.deletedAt === null)
  return found?.value ?? null
}

export function setSkillName(skillId: string, name: string): void {
  const clean = cleanText(name, 80)
  const now = Date.now()
  const found = current.skillNames.find((row) => row.skillId === skillId)

  if (!clean) {
    if (!found || found.deletedAt !== null) return
    commit({
      ...current,
      skillNames: current.skillNames.map((row) =>
        row.id === found.id ? { ...row, updatedAt: now, deletedAt: now } : row,
      ),
    })
    return
  }

  if (!found) {
    commit({
      ...current,
      skillNames: [
        ...current.skillNames,
        { id: keyId('name', skillId, ''), skillId, value: clean, updatedAt: now, deletedAt: null, ownerId: null },
      ],
    })
    return
  }

  commit({
    ...current,
    skillNames: current.skillNames.map((row) =>
      row.id === found.id ? { ...row, value: clean, updatedAt: now, deletedAt: null } : row,
    ),
  })
}

// --- Hợp nhất hai kho ---------------------------------------------------------

/**
 * Gộp kho của máy này với kho lấy từ máy chủ.
 *
 * Luật: cùng id thì BẢN MỚI HƠN THẮNG, kể cả khi bản mới hơn là một lệnh xoá.
 * Không có id ở bên kia thì giữ nguyên - đó là việc máy kia chưa biết.
 *
 * Bằng điểm (`updatedAt` y hệt nhau) thì ưu tiên bản ĐÃ XOÁ. Rất hiếm, nhưng
 * phải chọn một phía cố định, và giữ lại một câu mà người dùng đã xoá thì khó
 * chịu hơn là mất một lần sửa vặt.
 */
export function mergeContent(mine: CustomContent, theirs: CustomContent): CustomContent {
  return {
    questions: mergeRows(mine.questions, theirs.questions),
    hidden: mergeRows(mine.hidden, theirs.hidden),
    skillNames: mergeRows(mine.skillNames, theirs.skillNames),
  }
}

function mergeRows<R extends CustomRow<unknown>>(mine: R[], theirs: R[]): R[] {
  const byId = new Map<string, R>()
  for (const row of mine) byId.set(row.id, row)

  for (const row of theirs) {
    const existing = byId.get(row.id)
    if (!existing) {
      byId.set(row.id, row)
      continue
    }
    if (row.updatedAt > existing.updatedAt) {
      byId.set(row.id, row)
    } else if (row.updatedAt === existing.updatedAt && row.deletedAt !== null) {
      byId.set(row.id, row)
    }
  }

  return [...byId.values()]
}

// --- Mang đi, mang về, dọn sạch ----------------------------------------------

export function exportContent(): string {
  return JSON.stringify(current, null, 2)
}

/**
 * Nạp từ tệp JSON. Trả về số câu nhận được, hoặc `null` nếu tệp không đọc nổi.
 *
 * HỢP NHẤT chứ không thay thế: người dùng nạp tệp của đồng nghiệp thì phần mình
 * đang có phải còn nguyên. Muốn về tay trắng thì đã có nút "Xoá hết".
 */
export function importContent(text: string): number | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  // Nhận được cả tệp bản cũ - có người đã xuất ra trước khi cập nhật.
  const incoming =
    parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).questions)
      ? sanitiseContent(parsed)
      : fromLegacy(parsed)

  commit(mergeContent(current, incoming))
  return incoming.questions.filter((row) => row.deletedAt === null).length
}

export function resetContent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // như trên
  }
  commit({ ...EMPTY })
}

/** Có sửa gì chưa - trang quản trị dùng để hiện dấu "đã đổi". */
export function customCounts(): { questions: number; hidden: number; renamed: number } {
  const alive = <T>(row: CustomRow<T>) => row.deletedAt === null
  return {
    questions: current.questions.filter(alive).length,
    hidden: current.hidden.filter(alive).length,
    renamed: current.skillNames.filter(alive).length,
  }
}
