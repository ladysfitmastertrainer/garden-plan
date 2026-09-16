/**
 * Đọc câu hỏi từ một bảng tính.
 *
 * File này KHÔNG biết gì về Excel. Nó nhận vào những hàng đã được bóc thành đối
 * tượng thuần, và trả ra câu hỏi hợp lệ cùng danh sách dòng hỏng. Nhờ vậy toàn
 * bộ phần dễ sai - ghép cột, đoán thể loại, dò mã kỹ năng - kiểm chứng được mà
 * không cần dựng một file .xlsx thật.
 *
 * Nguyên tắc dẫn đường: THẦY CÔ KHÔNG PHẢI HỌC ĐỊNH DẠNG CỦA MÁY.
 *
 *  - Tên cột nhận cả có dấu lẫn không dấu, cả hoa lẫn thường: "Kỹ năng",
 *    "ky_nang", "KY NANG" đều được. Người ta gõ lại bảng bằng tay, và sẽ không
 *    ai gõ đúng từng dấu một.
 *  - Cột kỹ năng nhận cả MÃ lẫn TÊN kỹ năng. Mã thì chính xác nhưng không ai
 *    nhớ; tên thì ai cũng đọc được.
 *  - Một dòng hỏng KHÔNG làm hỏng cả file. Báo rõ dòng số mấy, sai chỗ nào, rồi
 *    nhận nốt những dòng còn lại.
 */

import type { BankEntry } from './bank'
import { sanitiseEntry } from './custom'
import { VIRTUE_LABEL, type Difficulty, type Virtue } from './types'

/** Một dòng trong bảng, khoá là tên cột đúng như người ta gõ. */
export type SheetRow = Record<string, unknown>

export interface ParsedQuestion {
  /** Số dòng trong file, tính cả dòng tiêu đề - để người dùng mở ra sửa đúng chỗ. */
  row: number
  skillId: string
  entry: BankEntry
}

export interface SheetProblem {
  row: number
  reason: string
}

export interface SheetResult {
  questions: ParsedQuestion[]
  problems: SheetProblem[]
  /** Dòng bỏ qua vì đã có sẵn câu y hệt. Không phải lỗi, nhưng phải nói ra. */
  duplicates: SheetProblem[]
}

export interface SkillLookup {
  id: string
  name: string
}

/**
 * Bỏ dấu, bỏ hoa thường, bỏ mọi thứ không phải chữ và số.
 *
 * Dùng cho cả tên cột lẫn tên kỹ năng. `đ` không tự tách ra khi chuẩn hoá NFD
 * nên phải thay tay - thiếu dòng đó là "Đọc hiểu" không bao giờ khớp.
 */
export function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** Tên cột chấp nhận được, xếp theo ý nghĩa. Viết thường không dấu sau chuẩn hoá. */
const COLUMNS: Record<string, string[]> = {
  skill: ['kynang', 'makynang', 'skill', 'skillid', 'bai', 'chude'],
  difficulty: ['mucdo', 'muc', 'dokho', 'difficulty', 'level'],
  kind: ['theloai', 'loai', 'dang', 'kind', 'type'],
  prompt: ['debai', 'cauhoi', 'noidung', 'prompt', 'question'],
  correct: ['dapandung', 'dapan', 'ketqua', 'correct', 'answer'],
  wrong: ['dapansai', 'dapannhieu', 'phuongansai', 'distractors', 'wrong'],
  explanation: ['loigiai', 'giaithich', 'explanation'],
  hint: ['goiy', 'hint'],
  // Nối cặp: hai cột song song, khớp nhau theo THỨ TỰ DÒNG trong ô.
  left: ['vetrai', 'cottrai', 'noitu', 'left'],
  right: ['vephai', 'cotphai', 'noivoi', 'right'],
  // Tình huống Đạo đức: bốn cột song song, cùng khớp theo thứ tự.
  options: ['luachon', 'cacluachon', 'phuongan', 'options'],
  qualities: ['mucdochon', 'danhgia', 'nendunghay', 'quality', 'qualities'],
  feedbacks: ['phanhoi', 'loiphanhoi', 'nhanxet', 'feedback', 'feedbacks'],
  virtues: ['phamchat', 'ductinh', 'virtue', 'virtues'],
}

/** Ký tự tách nhiều đáp án trong một ô: gạch đứng, chấm phẩy, hoặc xuống dòng. */
const SPLIT = /\s*[|;]\s*|\r?\n/

function readCell(row: SheetRow, keys: Map<string, string>, field: string): string {
  const key = keys.get(field)
  if (key === undefined) return ''
  const value = row[key]
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

/** Ghép tên cột thật trong file với ý nghĩa ta cần. */
function mapColumns(row: SheetRow): Map<string, string> {
  const found = new Map<string, string>()
  for (const actual of Object.keys(row)) {
    const clean = normalise(actual)
    for (const [field, accepted] of Object.entries(COLUMNS)) {
      if (!found.has(field) && accepted.includes(clean)) found.set(field, actual)
    }
  }
  return found
}

type Kind = 'choice' | 'text' | 'order' | 'pairs' | 'scenario'

const KIND_WORDS: Record<string, Kind> = {
  tracnghiem: 'choice',
  chon: 'choice',
  choice: 'choice',
  abcd: 'choice',
  godapan: 'text',
  tuluan: 'text',
  dienvao: 'text',
  text: 'text',
  nhap: 'text',
  sapxep: 'order',
  sapthutu: 'order',
  thutu: 'order',
  order: 'order',
  noicap: 'pairs',
  noi: 'pairs',
  ghepcap: 'pairs',
  pairs: 'pairs',
  tinhhuong: 'scenario',
  daoduc: 'scenario',
  xuly: 'scenario',
  scenario: 'scenario',
}

/** "nên làm" / "tạm được" / "chưa nên" -> mức máy hiểu. */
const QUALITY_WORDS: Record<string, 'good' | 'ok' | 'poor'> = {
  nen: 'good',
  nenlam: 'good',
  tot: 'good',
  dung: 'good',
  good: 'good',
  tam: 'ok',
  tamduoc: 'ok',
  binhthuong: 'ok',
  ok: 'ok',
  chuanen: 'poor',
  chua: 'poor',
  khongnen: 'poor',
  sai: 'poor',
  poor: 'poor',
}

/** Tên phẩm chất tiếng Việt -> mã. Nhận cả mã lẫn tên hiển thị. */
const VIRTUE_BY_WORD = new Map<string, Virtue>(
  (Object.entries(VIRTUE_LABEL) as Array<[Virtue, string]>).flatMap(([id, label]) => [
    [normalise(id), id],
    [normalise(label), id],
  ]),
)

function readVirtues(raw: string): Virtue[] {
  return raw
    .split(/\s*,\s*/)
    .map((word) => VIRTUE_BY_WORD.get(normalise(word)))
    .filter((v): v is Virtue => Boolean(v))
}

/** Cắt một ô thành nhiều phần theo gạch đứng / chấm phẩy / xuống dòng. */
function parts(raw: string): string[] {
  return raw.split(SPLIT).map((item) => item.trim()).filter(Boolean)
}

/**
 * Như `parts` nhưng GIỮ LẠI Ô TRỐNG, vì vị trí mới là thứ mang nghĩa.
 *
 * Dùng cho những cột của tình huống Đạo đức, nơi bốn cột khớp nhau theo thứ tự.
 * Phẩm chất thường chỉ gắn cho lựa chọn đầu, nên người ta viết "Trách nhiệm | |"
 * - bỏ ô trống đi thì danh sách còn đúng một mục, và nó nhảy lên khớp với lựa
 * chọn số một hay số ba tuỳ may rủi.
 *
 * Ô trống HOÀN TOÀN thì trả mảng rỗng, nghĩa là "cột này không điền" - khác hẳn
 * với "điền nhưng để trống vài chỗ".
 */
function slots(raw: string): string[] {
  if (!raw.trim()) return []
  return raw.split(SPLIT).map((item) => item.trim())
}

function readDifficulty(raw: string): Difficulty {
  const n = Number(raw)
  return n === 2 || n === 3 ? (n as Difficulty) : 1
}

/**
 * Dò kỹ năng theo mã trước, rồi tới tên.
 *
 * Tên trùng nhau giữa các lớp là chuyện có thật ("Đọc hiểu câu ngắn" có ở nhiều
 * lớp), nên khi mơ hồ thì ưu tiên kỹ năng của vùng đang mở, và nếu vẫn mơ hồ thì
 * báo lỗi chứ không đoán bừa - đoán sai là câu rơi vào lớp khác và không ai hiểu
 * vì sao.
 */
export function findSkill(
  raw: string,
  skills: SkillLookup[],
): { id: string } | { error: string } {
  const wanted = normalise(raw)
  if (!wanted) return { error: 'thiếu mã hoặc tên kỹ năng' }

  const byId = skills.find((skill) => normalise(skill.id) === wanted)
  if (byId) return { id: byId.id }

  const byName = skills.filter((skill) => normalise(skill.name) === wanted)
  if (byName.length === 1) return { id: byName[0]!.id }
  if (byName.length > 1) {
    return { error: `tên "${raw}" trùng ở ${byName.length} kỹ năng, hãy dùng mã kỹ năng` }
  }

  return { error: `không có kỹ năng nào tên hay mã là "${raw}"` }
}

export interface ParseOptions {
  /** Danh sách kỹ năng hợp lệ để dò cột "kỹ năng". */
  skills: SkillLookup[]
  /** Kỹ năng dùng cho dòng không ghi cột kỹ năng - thường là vùng đang mở. */
  defaultSkillId?: string
  /**
   * Khoá cả file vào ĐÚNG MỘT kỹ năng.
   *
   * Nạp file ngay trong mục "Đếm và so sánh đến 100" thì mọi câu phải rơi vào
   * đúng mục đó - đó là điều người bấm nút đang trông đợi. Dòng nào lỡ ghi kỹ
   * năng khác thì BÁO RA chứ không lặng lẽ xếp sang chỗ khác: câu nằm nhầm mục
   * là câu trẻ không bao giờ gặp, mà người soạn thì tưởng đã nạp xong.
   */
  lockedSkillId?: string
  /** Đề bài đã có sẵn trong kho, theo kỹ năng - để nhận ra hàng nạp trùng. */
  existing?: (skillId: string) => string[]
}

interface Cells {
  correctRaw: string
  wrong: string[]
  leftRaw: string
  rightRaw: string
  optionsRaw: string
  qualitiesRaw: string
  feedbacksRaw: string
  virtuesRaw: string
}

/**
 * Dựng câu hỏi từ các ô đã đọc, hoặc nói rõ thiếu gì.
 *
 * Mỗi thể loại tự kiểm điều kiện RIÊNG của mình trước khi đưa xuống
 * `sanitiseEntry`. Để `sanitiseEntry` từ chối thì nó chỉ trả `null`, và người
 * soạn nhận đúng một câu "câu không hợp lệ" - không đủ để biết phải sửa đâu
 * trong một file sáu chục dòng.
 */
function buildEntry(
  kind: Kind,
  base: { difficulty: Difficulty; prompt: string; explanation: string; hint: string },
  cells: Cells,
): { entry: BankEntry } | { error: string } {
  const fail = (error: string) => ({ error })

  let raw: unknown
  switch (kind) {
    case 'choice': {
      if (!cells.correctRaw) return fail('thiếu đáp án đúng')
      if (cells.wrong.length === 0) return fail('câu trắc nghiệm cần ít nhất một đáp án sai')
      raw = { ...base, kind: 'choice', correct: cells.correctRaw, distractors: cells.wrong }
      break
    }
    case 'text': {
      if (!cells.correctRaw) return fail('thiếu đáp án đúng')
      raw = { ...base, kind: 'text', accepted: parts(cells.correctRaw) }
      break
    }
    case 'order': {
      // Ô đáp án ghi ĐÚNG THỨ TỰ MONG MUỐN; máy tự xáo trước khi hỏi trẻ.
      const items = parts(cells.correctRaw)
      if (items.length < 2) return fail('câu sắp xếp cần ít nhất hai phần, ngăn bằng dấu |')
      raw = { ...base, kind: 'order', items }
      break
    }
    case 'pairs': {
      const left = parts(cells.leftRaw)
      const right = parts(cells.rightRaw)
      if (left.length === 0 || right.length === 0) {
        return fail('câu nối cặp cần cả cột "ve_trai" và "ve_phai"')
      }
      if (left.length !== right.length) {
        return fail(
          `vế trái có ${left.length} mục nhưng vế phải có ${right.length} - hai cột phải khớp nhau`,
        )
      }
      if (left.length < 2) return fail('câu nối cặp cần ít nhất hai cặp')
      raw = { ...base, kind: 'pairs', pairs: left.map((item, i) => [item, right[i]]) }
      break
    }
    case 'scenario': {
      const labels = slots(cells.optionsRaw)
      if (labels.length < 2) return fail('tình huống cần ít nhất hai lựa chọn ở cột "lua_chon"')

      const blank = labels.findIndex((label) => !label)
      if (blank >= 0) {
        return fail(`lựa chọn thứ ${blank + 1} bỏ trống - các cột khớp nhau theo thứ tự nên không bỏ trống được`)
      }

      const qualities = slots(cells.qualitiesRaw)
      const feedbacks = slots(cells.feedbacksRaw)
      const virtues = slots(cells.virtuesRaw)

      /*
        Các cột của tình huống khớp nhau theo THỨ TỰ, nên lệch một mục là hỏng
        nặng: lời khen gắn sang lựa chọn chưa nên làm, và câu hỏi dạy trẻ đúng
        điều ngược lại. Thà từ chối cả dòng còn hơn nhận vào rồi dạy sai.
      */
      if (qualities.length > 0 && qualities.length !== labels.length) {
        return fail(
          `có ${labels.length} lựa chọn nhưng ${qualities.length} mức đánh giá - hai cột phải khớp nhau`,
        )
      }
      if (feedbacks.length > 0 && feedbacks.length !== labels.length) {
        return fail(
          `có ${labels.length} lựa chọn nhưng ${feedbacks.length} lời phản hồi - hai cột phải khớp nhau`,
        )
      }

      const bad = qualities.find((word) => word && !QUALITY_WORDS[normalise(word)])
      if (bad) {
        return fail(`không hiểu mức "${bad}" - hãy ghi: nên làm / tạm được / chưa nên`)
      }

      raw = {
        ...base,
        kind: 'scenario',
        options: labels.map((label, i) => ({
          id: `tu-soan-${i + 1}`,
          label,
          // Không ghi mức thì lựa chọn ĐẦU coi là nên làm, còn lại là chưa nên -
          // hợp với thói quen "đáp án đúng viết trước".
          quality: qualities[i] ? QUALITY_WORDS[normalise(qualities[i])] : i === 0 ? 'good' : 'poor',
          feedback: feedbacks[i] ?? '',
          virtues: readVirtues(virtues[i] ?? ''),
        })),
      }
      break
    }
  }

  const entry = sanitiseEntry(raw)
  return entry ? { entry } : fail('câu không hợp lệ, kiểm tra lại đề bài và đáp án')
}

export function parseSheet(rows: SheetRow[], options: ParseOptions): SheetResult {
  const questions: ParsedQuestion[] = []
  const problems: SheetProblem[] = []
  const duplicates: SheetProblem[] = []

  // Đề bài đã nhận trong chính file này, để bắt cả trùng nội bộ.
  const seen = new Set<string>()

  for (const [index, row] of rows.entries()) {
    // +2: một cho dòng tiêu đề, một vì người ta đếm từ 1.
    const line = index + 2
    const keys = mapColumns(row)

    const prompt = readCell(row, keys, 'prompt')
    const correctRaw = readCell(row, keys, 'correct')
    const wrongRaw = readCell(row, keys, 'wrong')
    const leftRaw = readCell(row, keys, 'left')
    const rightRaw = readCell(row, keys, 'right')
    const optionsRaw = readCell(row, keys, 'options')

    // Dòng trống hoàn toàn: người ta hay để vài dòng trắng ở cuối bảng.
    if (!prompt && !correctRaw && !wrongRaw && !leftRaw && !optionsRaw) continue

    if (!prompt) {
      problems.push({ row: line, reason: 'thiếu đề bài' })
      continue
    }

    const skillRaw = readCell(row, keys, 'skill')
    let skillId = options.lockedSkillId ?? options.defaultSkillId ?? ''

    if (options.lockedSkillId) {
      // Cột kỹ năng vẫn đọc, nhưng chỉ để kiểm tra người ta có nạp nhầm chỗ không.
      if (skillRaw) {
        const found = findSkill(skillRaw, options.skills)
        const named = 'id' in found ? found.id : null
        if (named !== options.lockedSkillId) {
          problems.push({
            row: line,
            reason: `dòng này ghi kỹ năng khác ("${skillRaw}") - hãy nạp ở đúng mục đó`,
          })
          continue
        }
      }
    } else if (skillRaw) {
      const found = findSkill(skillRaw, options.skills)
      if ('error' in found) {
        problems.push({ row: line, reason: found.error })
        continue
      }
      skillId = found.id
    }

    if (!skillId) {
      problems.push({ row: line, reason: 'thiếu cột kỹ năng' })
      continue
    }

    const wrong = parts(wrongRaw)

    /*
      Thể loại: theo cột nếu có, không thì suy ra từ những cột đã điền.

      Suy đoán theo thứ tự cột nào ĐẶC TRƯNG nhất. Điền "lựa chọn" thì chỉ có thể
      là tình huống; điền "vế trái" thì chỉ có thể là nối cặp; còn giữa trắc
      nghiệm và gõ đáp án thì có đáp án sai hay không là dấu hiệu đủ tốt.

      Riêng SẮP XẾP không suy đoán được: nhìn ô đáp án nó giống hệt một câu gõ
      đáp án có nhiều cách viết. Thể loại đó bắt buộc phải ghi ra.
    */
    const kindRaw = normalise(readCell(row, keys, 'kind'))
    const kind: Kind =
      KIND_WORDS[kindRaw] ??
      (optionsRaw ? 'scenario' : leftRaw || rightRaw ? 'pairs' : wrong.length > 0 ? 'choice' : 'text')

    const base = {
      difficulty: readDifficulty(readCell(row, keys, 'difficulty')),
      prompt,
      explanation: readCell(row, keys, 'explanation'),
      hint: readCell(row, keys, 'hint'),
    }

    const built = buildEntry(kind, base, {
      correctRaw,
      wrong,
      leftRaw,
      rightRaw,
      optionsRaw,
      qualitiesRaw: readCell(row, keys, 'qualities'),
      feedbacksRaw: readCell(row, keys, 'feedbacks'),
      virtuesRaw: readCell(row, keys, 'virtues'),
    })

    if ('error' in built) {
      problems.push({ row: line, reason: built.error })
      continue
    }
    const entry = built.entry

    const fingerprint = `${skillId}::${normalise(prompt)}`
    if (seen.has(fingerprint)) {
      duplicates.push({ row: line, reason: 'trùng với một dòng phía trên trong cùng file' })
      continue
    }
    if ((options.existing?.(skillId) ?? []).some((old) => normalise(old) === normalise(prompt))) {
      duplicates.push({ row: line, reason: 'kho đã có câu này rồi' })
      continue
    }
    seen.add(fingerprint)

    questions.push({ row: line, skillId, entry })
  }

  return { questions, problems, duplicates }
}

/** Tên cột trong file mẫu, đúng thứ tự người ta sẽ đọc từ trái sang. */
export const TEMPLATE_HEADERS = [
  'ky_nang',
  'muc_do',
  'the_loai',
  'de_bai',
  'dap_an_dung',
  'dap_an_sai',
  've_trai',
  've_phai',
  'lua_chon',
  'muc_do_chon',
  'phan_hoi',
  'pham_chat',
  'loi_giai',
  'goi_y',
] as const

const BLANK: Record<(typeof TEMPLATE_HEADERS)[number], string> = {
  ky_nang: '',
  muc_do: '1',
  the_loai: '',
  de_bai: '',
  dap_an_dung: '',
  dap_an_sai: '',
  ve_trai: '',
  ve_phai: '',
  lua_chon: '',
  muc_do_chon: '',
  phan_hoi: '',
  pham_chat: '',
  loi_giai: '',
  goi_y: '',
}

/**
 * Một dòng mẫu cho MỖI thể loại, để nhìn là hiểu chứ không phải đọc hướng dẫn.
 *
 * Phần lớn ô để trống, và đó là điều cần nhìn thấy: mỗi thể loại chỉ dùng vài
 * cột của riêng nó. Bảng mười bốn cột nhìn thì sợ, nhưng soạn một câu trắc
 * nghiệm vẫn chỉ phải điền bốn ô như cũ.
 */
export function templateRows(skill: SkillLookup | null): Array<Record<string, string>> {
  // MỌI dòng trỏ vào cùng một kỹ năng: file mẫu tải về từ trong một mục thì nạp
  // lại ngay tại mục đó phải chạy được, không dòng nào bị báo "nạp nhầm chỗ".
  const id = skill?.id ?? 'math.g1.cong-tru-10'
  const viet = id
  const ethics = id

  return [
    {
      ...BLANK,
      ky_nang: id,
      the_loai: 'trắc nghiệm',
      de_bai: 'Lớp có 4 bạn nam và 3 bạn nữ. Cả lớp có mấy bạn?',
      dap_an_dung: '7 bạn',
      dap_an_sai: '5 bạn | 6 bạn | 8 bạn',
      loi_giai: '4 + 3 = 7 bạn.',
      goi_y: 'Đếm cả nam và nữ nhé.',
    },
    {
      ...BLANK,
      ky_nang: id,
      muc_do: '2',
      the_loai: 'gõ đáp án',
      de_bai: 'Viết số liền sau của 19',
      dap_an_dung: '20 | hai mươi',
      loi_giai: 'Liền sau 19 là 20.',
    },
    {
      ...BLANK,
      ky_nang: viet,
      the_loai: 'sắp xếp',
      de_bai: 'Sắp các từ thành câu đúng',
      // Ghi ĐÚNG THỨ TỰ MONG MUỐN; máy tự xáo trước khi hỏi trẻ.
      dap_an_dung: 'Em | đi | học | mỗi ngày',
      loi_giai: 'Câu đúng: Em đi học mỗi ngày.',
    },
    {
      ...BLANK,
      ky_nang: viet,
      muc_do: '2',
      the_loai: 'nối cặp',
      de_bai: 'Nối con vật với tiếng kêu của nó',
      // Hai cột khớp nhau theo thứ tự: mèo-meo meo, chó-gâu gâu, gà-ò ó o.
      ve_trai: 'mèo | chó | gà trống',
      ve_phai: 'meo meo | gâu gâu | ò ó o',
      loi_giai: 'Mỗi con vật có một tiếng kêu riêng.',
    },
    {
      ...BLANK,
      ky_nang: ethics,
      the_loai: 'tình huống',
      de_bai: 'Con vừa đi chơi ngoài sân về và sắp ăn cơm. Con sẽ làm gì trước?',
      lua_chon: 'Rửa tay sạch bằng xà phòng rồi mới ăn | Lau tay vào khăn rồi ăn | Ăn luôn cho nhanh',
      muc_do_chon: 'nên làm | tạm được | chưa nên',
      phan_hoi:
        'Đúng rồi! Tay sạch thì bụng mới khoẻ. | Đỡ hơn không lau, nhưng khăn cũng có vi khuẩn con nhé. | Tay bẩn mang vi khuẩn vào bụng, dễ đau bụng lắm.',
      pham_chat: 'Trách nhiệm | | ',
    },
  ]
}
