/**
 * Đấu trường lớp học: ai đang ở đảo nào, và trận PVP giữa hai bạn cùng lớp.
 *
 * MÁY CHỦ LÀ TRỌNG TÀI, và đó là toàn bộ lý do file này tồn tại.
 *
 * Cả trò chơi xoay quanh đúng một câu: "ai nhanh tay hơn thì được tấn công".
 * Nếu mỗi máy tự bấm đồng hồ của mình rồi khai lên "em mất 1,2 giây" thì em nào
 * cầm máy chậm hơn sẽ luôn thua, mà em nào biết sửa số sẽ luôn thắng. Ở đây thứ
 * tự được xếp theo THỜI ĐIỂM YÊU CẦU TỚI NƠI - một đồng hồ duy nhất cho cả hai
 * bên - và máu, sát thương, người thắng đều do máy chủ tính.
 *
 * KHÔNG CÓ KẾT NỐI THỜI GIAN THỰC. Hai máy hỏi lại máy chủ vài lần một giây
 * (xem `store/pvp.ts`). Nghe thì thô, nhưng nó không ảnh hưởng tới sự công bằng:
 * việc hỏi lại chỉ quyết định trẻ THẤY kết quả nhanh hay chậm, còn ai thắng lượt
 * bấm thì đã được quyết ở đúng khoảnh khắc yêu cầu chạm vào máy chủ. Đổi lại,
 * trình duyệt không phải mở thêm một đường kết nối nào tới Supabase - vốn là
 * điều cả lần chuyển sang Next.js này sinh ra để dẹp bỏ.
 */
import 'server-only'

import { pvpPowerFactor } from '@/data/pvp-types'
import type { Grade, Subject } from '@/content/types'
import { pvpTimeLimitMs } from '@/data/pvp-types'
import type {
  LobbyEntry,
  PvpEvent,
  PvpHit,
  PvpMatch,
  PvpQuestion,
  PvpSide,
  PvpStatus,
} from '@/data/pvp-types'
/*
  Bộ chiêu và luật khắc chế nhập THẲNG từ phần nội dung của game.

  Máy chủ phải tự tính được sát thương, nếu không thì con số ấy do trình duyệt
  khai lên - và một con số do máy trẻ khai thì một máy trẻ đã bị sửa cũng khai
  được. `content/pets.ts` và `engine/pets.ts` đều là mã thuần, không chạm cơ sở
  dữ liệu, nên nhập vào đây an toàn cả hai chiều.
*/
import { SPELLS, getPet } from '@/content/pets'
import { ULTIMATE_COOLDOWN, elementMultiplier, type Element, type Spell } from '@/engine/pets'
import type { ActiveEffect } from '@/engine/battle'
import { check, db } from './db'
import { badRequest, forbidden, notFound } from './http'

/** Bao lâu không thấy tăm hơi thì coi như bạn ấy đã rời máy. */
const PRESENCE_TTL_MS = 45_000

/*
  Kiểu dữ liệu của trận đấu nằm ở `src/data/pvp-types.ts`, không ở đây.

  Giao diện cần đúng những kiểu ấy, mà mọi file trong `src/server/*` đều mở đầu
  bằng `import 'server-only'` - nhập từ đó vào mã chạy trong trình duyệt là hỏng
  cả bản dựng. Để kiểu ở một chỗ trung lập thì hai phía dùng chung một bản khai,
  và cái chốt cửa vẫn nguyên vẹn.
*/
export type {
  LobbyEntry,
  PvpEvent,
  PvpMatch,
  PvpQuestion,
  PvpSide,
  PvpStatus,
} from '@/data/pvp-types'

// --- Bạn nào đang ở đâu --------------------------------------------------------

/** Mọi lớp mà một học sinh có chân. Thường là một, nhưng không có gì cấm nhiều hơn. */
async function classesOf(studentId: string): Promise<string[]> {
  const { data, error } = await db()
    .from('class_members')
    .select('class_id')
    .eq('student_id', studentId)
  check(error, 'Không đọc được lớp của học sinh')
  return ((data as Array<{ class_id: string }> | null) ?? []).map((r) => r.class_id)
}

/**
 * Báo "em đang ở đây" và nhận lại danh sách bạn cùng lớp đang online.
 *
 * Gộp hai việc vào MỘT lượt gọi có chủ ý: màn bản đồ phải làm cả hai đều đặn vài
 * giây một lần, và tách ra thành hai lượt thì mỗi nhịp là hai vòng mạng cho mỗi
 * máy tính bảng trong lớp - ba mươi máy thì thành sáu mươi.
 *
 * Trẻ không ở lớp nào thì đây là một việc KHÔNG LÀM GÌ CẢ, không phải một lỗi:
 * app vẫn dùng được ở nhà, chỉ là ở đó không có ai để thách đấu.
 */
export async function heartbeat(
  studentId: string,
  where: {
    subject: Subject | null
    grade: Grade | null
    x?: number | null
    y?: number | null
    /** Mã câu vừa nói. API đã kiểm nó có trong bảng câu - xem `content/chat.ts`. */
    emote?: string | null
  },
): Promise<LobbyEntry[]> {
  const classIds = await classesOf(studentId)
  if (classIds.length === 0) return []

  const { error } = await db().from('class_presence').upsert(
    {
      student_id: studentId,
      class_id: classIds[0]!,
      subject: where.subject,
      grade: where.grade,
      // Ô đang đứng. Chỉ có nghĩa khi đang ở trong một vùng đất - xem migration 0009.
      x: where.subject === null ? null : (where.x ?? null),
      y: where.subject === null ? null : (where.y ?? null),
      // Nói xong thì máy nói gửi kèm mã câu trong vài nhịp rồi thôi, nên dòng
      // này tự trở về rỗng - không cần ai đi dọn.
      emote: where.emote ?? null,
      seen_at: new Date().toISOString(),
    },
    { onConflict: 'student_id' },
  )
  check(error, 'Không cập nhật được vị trí')

  return lobby(studentId, classIds)
}

export async function lobby(studentId: string, known?: string[]): Promise<LobbyEntry[]> {
  const classIds = known ?? (await classesOf(studentId))
  if (classIds.length === 0) return []

  const since = new Date(Date.now() - PRESENCE_TTL_MS).toISOString()
  const { data, error } = await db()
    .from('class_presence')
    .select('student_id, subject, grade, x, y, emote, students(id, name, avatar)')
    .in('class_id', classIds)
    .gte('seen_at', since)
  check(error, 'Không tải được danh sách bạn đang chơi')

  const rows =
    (data as unknown as Array<{
      student_id: string
      subject: Subject | null
      grade: number | null
      x: number | null
      y: number | null
      emote: string | null
      students: { id: string; name: string; avatar: string } | null
    }> | null) ?? []

  const others = rows.filter((row) => row.student_id !== studentId && row.students)
  const busy = await busyStudents(others.map((row) => row.student_id))

  return others
    .map((row) => ({
      studentId: row.student_id,
      name: row.students!.name,
      avatar: row.students!.avatar,
      subject: row.subject,
      grade: (row.grade ?? null) as Grade | null,
      x: row.x ?? null,
      y: row.y ?? null,
      emote: row.emote ?? null,
      busy: busy.has(row.student_id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

/** Những em đang vướng một trận chờ hoặc đang đánh dở. */
async function busyStudents(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()

  const { data, error } = await db()
    .from('pvp_matches')
    .select('challenger_id, opponent_id')
    .in('status', ['pending', 'active'])
    .or(`challenger_id.in.(${ids.join(',')}),opponent_id.in.(${ids.join(',')})`)
  check(error, 'Không kiểm được ai đang bận')

  const out = new Set<string>()
  for (const row of (data as Array<{ challenger_id: string; opponent_id: string }> | null) ?? []) {
    out.add(row.challenger_id)
    out.add(row.opponent_id)
  }
  return out
}

/** Rời máy: xoá dấu vết vị trí để bạn bè không thách một cái bóng. */
export async function clearPresence(studentId: string): Promise<void> {
  const { error } = await db().from('class_presence').delete().eq('student_id', studentId)
  check(error, 'Không xoá được vị trí')
}

// --- Đọc trận ------------------------------------------------------------------

const MATCH_COLUMNS =
  'id, class_id, challenger_id, opponent_id, subject, grade, status, questions, round, ' +
  'round_started_at, challenger_hp, opponent_hp, challenger_max, opponent_max, ' +
  'challenger_power, opponent_power, challenger_pet, opponent_pet, ' +
  'challenger_spells, opponent_spells, challenger_cd, opponent_cd, ' +
  'challenger_status, opponent_status, buzzes, events, winner_id'

export interface Buzz {
  studentId: string
  /** Chiêu bên này chọn tung. null khi trả lời sai hoặc hết giờ. */
  spellId?: string | null
  correct: boolean
  /** Thời điểm yêu cầu tới máy chủ, epoch ms. Đây là đồng hồ DUY NHẤT được tin. */
  at: number
}

interface MatchRow {
  id: string
  class_id: string
  challenger_id: string
  opponent_id: string
  subject: Subject
  grade: number
  status: PvpStatus
  questions: PvpQuestion[]
  round: number
  round_started_at: string
  challenger_hp: number
  opponent_hp: number
  challenger_max: number
  opponent_max: number
  challenger_power: number
  opponent_power: number
  challenger_pet: string | null
  opponent_pet: string | null
  challenger_spells: string[] | null
  opponent_spells: string[] | null
  challenger_cd: number | null
  opponent_cd: number | null
  challenger_status: ActiveEffect[] | null
  opponent_status: ActiveEffect[] | null
  buzzes: Buzz[]
  events: PvpEvent[]
  winner_id: string | null
}

async function nameOf(ids: string[]): Promise<Map<string, { name: string; avatar: string }>> {
  const { data, error } = await db().from('students').select('id, name, avatar').in('id', ids)
  check(error, 'Không đọc được tên học sinh')
  return new Map(
    ((data as Array<{ id: string; name: string; avatar: string }> | null) ?? []).map((s) => [
      s.id,
      { name: s.name, avatar: s.avatar },
    ]),
  )
}

async function toMatch(row: MatchRow): Promise<PvpMatch> {
  const names = await nameOf([row.challenger_id, row.opponent_id])
  const side = (which: 'challenger' | 'opponent'): PvpSide => {
    const mine = which === 'challenger'
    const id = mine ? row.challenger_id : row.opponent_id
    return {
      studentId: id,
      name: names.get(id)?.name ?? 'Bạn',
      avatar: names.get(id)?.avatar ?? '🦊',
      hp: mine ? row.challenger_hp : row.opponent_hp,
      maxHp: mine ? row.challenger_max : row.opponent_max,
      power: Number(mine ? row.challenger_power : row.opponent_power),
      pet: mine ? row.challenger_pet : row.opponent_pet,
      spells: (mine ? row.challenger_spells : row.opponent_spells) ?? [],
      cooldown: (mine ? row.challenger_cd : row.opponent_cd) ?? 0,
      status: (mine ? row.challenger_status : row.opponent_status) ?? [],
    }
  }

  return {
    id: row.id,
    status: row.status,
    subject: row.subject,
    grade: row.grade as Grade,
    round: row.round,
    questions: row.questions,
    challenger: side('challenger'),
    opponent: side('opponent'),
    // Chỉ trả về AI đã bấm, không trả về bấm đúng hay sai. Biết trước bạn mình
    // vừa trả lời sai là biết trước mình chỉ cần bấm đúng là thắng lượt - lúc ấy
    // cuộc đua tốc độ biến thành cuộc chờ.
    buzzed: (row.buzzes ?? []).map((b) => b.studentId),
    events: row.events ?? [],
    winnerId: row.winner_id,
    roundStartedAt: Date.parse(row.round_started_at),
  }
}

async function loadRow(matchId: string): Promise<MatchRow> {
  const { data, error } = await db()
    .from('pvp_matches')
    .select(MATCH_COLUMNS)
    .eq('id', matchId)
    .maybeSingle()
  check(error, 'Không tải được trận đấu')
  if (!data) throw notFound('Không tìm thấy trận đấu này.')
  return data as unknown as MatchRow
}

/**
 * Cứu một vòng bị treo vì một bên biến mất.
 *
 * Chuyện này CHẮC CHẮN xảy ra trong một lớp học: một em đóng máy, hết pin, hoặc
 * bị gọi lên bảng. Bên còn lại đã bấm xong và đang chờ - mà vòng chỉ ngã ngũ khi
 * đủ hai người, nên em ấy sẽ chờ mãi mãi. Có nút "Bỏ trận này", nhưng bắt một
 * đứa bé tự kết luận rằng mình đang chờ một người không bao giờ tới là bắt nó
 * làm cái việc mà máy chủ biết rõ hơn nó.
 *
 * Nên: quá hạn giờ của vòng cộng thêm một quãng nới tay cho đường truyền thì
 * chốt luôn với những gì đang có. Bên đã bấm đúng vẫn được đánh; bên biến mất
 * bị tính như trả lời sai - đúng như thể em ấy ngồi đó và để hết giờ.
 */
const SWEEP_GRACE_MS = 6_000

export async function sweepStaleRound(matchId: string): Promise<PvpMatch | null> {
  const row = await loadRow(matchId)
  if (row.status !== 'active') return null

  const buzzes = row.buzzes ?? []
  // Chưa ai bấm thì không có gì để chốt - cả hai vẫn đang đọc đề, hoặc cả hai
  // đã biến mất và trận này tự nó chết, không cần ai dọn.
  if (buzzes.length === 0) return null

  const limit = pvpTimeLimitMs(row.grade as Grade) + SWEEP_GRACE_MS
  if (Date.now() - Date.parse(row.round_started_at) < limit) return null

  // Bên chưa bấm bị tính như để hết giờ.
  const missing = [row.challenger_id, row.opponent_id].find(
    (id) => !buzzes.some((b) => b.studentId === id),
  )
  const filled = missing ? [...buzzes, { studentId: missing, correct: false, at: Date.now() }] : buzzes

  return resolveRound(row, filled, Date.now())
}

/** Trận đang chờ hoặc đang đánh của một học sinh. Mỗi em nhiều nhất một trận. */
export async function currentMatch(studentId: string): Promise<PvpMatch | null> {
  const { data, error } = await db()
    .from('pvp_matches')
    .select(MATCH_COLUMNS)
    .in('status', ['pending', 'active'])
    .or(`challenger_id.eq.${studentId},opponent_id.eq.${studentId}`)
    .order('created_at', { ascending: false })
    .limit(1)
  check(error, 'Không tải được trận đấu')

  const rows = (data as unknown as MatchRow[] | null) ?? []
  return rows[0] ? toMatch(rows[0]) : null
}

/**
 * Trận VỪA XONG của một học sinh, nếu em ấy chưa xem kết quả.
 *
 * Cần riêng một đường vì trận kết thúc rơi khỏi `currentMatch` ngay lập tức:
 * người thắng thấy màn tổng kết (máy em ấy đang cầm kết quả trong tay), còn
 * người thua thì máy đang hỏi lại và chỉ nhận về `null` - tức là trận đấu biến
 * mất không một lời giải thích, đúng vào lúc cần giải thích nhất.
 */
export async function lastFinishedMatch(studentId: string): Promise<PvpMatch | null> {
  const { data, error } = await db()
    .from('pvp_matches')
    .select(MATCH_COLUMNS)
    .in('status', ['finished', 'declined', 'abandoned'])
    .or(`challenger_id.eq.${studentId},opponent_id.eq.${studentId}`)
    .gte('updated_at', new Date(Date.now() - 60_000).toISOString())
    .order('updated_at', { ascending: false })
    .limit(1)
  check(error, 'Không tải được trận vừa xong')

  const rows = (data as unknown as MatchRow[] | null) ?? []
  return rows[0] ? toMatch(rows[0]) : null
}

// --- Thách đấu -----------------------------------------------------------------

export interface ChallengeInput {
  opponentId: string
  subject: Subject
  grade: Grade
  questions: PvpQuestion[]
  maxHp: number
  power: number
  /** Con thú ra trận, chốt ngay lúc thách - xem migration 0011. */
  pet?: string | null
  /** Hai chiêu mang vào trận, chốt cùng lúc - xem migration 0012. */
  spells?: string[]
}

export async function challenge(studentId: string, input: ChallengeInput): Promise<PvpMatch> {
  if (input.opponentId === studentId) throw badRequest('Không tự thách đấu mình được.')
  if (input.questions.length === 0) throw badRequest('Trận đấu phải có ít nhất một câu hỏi.')

  // CÙNG LỚP mới thách được nhau. Đây là ranh giới bảo vệ trẻ em quan trọng
  // nhất của tính năng này: không có đường nào để một người lạ ghép cặp với một
  // đứa trẻ, vì danh sách đối thủ chỉ dựng từ bảng lớp của chính em ấy.
  const mine = await classesOf(studentId)
  const theirs = await classesOf(input.opponentId)
  const shared = mine.find((id) => theirs.includes(id))
  if (!shared) throw forbidden('Chỉ thách đấu được bạn cùng lớp.')

  // Phải đang đứng CÙNG MỘT ĐẢO. "Các con ở đảo nào thì chiến được ở đảo đó."
  const here = await lobby(studentId, mine)
  const target = here.find((entry) => entry.studentId === input.opponentId)
  if (!target) throw badRequest('Bạn ấy vừa rời máy rồi.')
  if (target.busy) throw badRequest('Bạn ấy đang bận một trận khác.')
  if (target.subject !== input.subject || target.grade !== input.grade) {
    throw badRequest('Bạn ấy không còn ở đảo này nữa.')
  }

  const busy = await busyStudents([studentId])
  if (busy.has(studentId)) throw badRequest('Con đang có một trận chưa xong.')

  const { data, error } = await db()
    .from('pvp_matches')
    .insert({
      class_id: shared,
      challenger_id: studentId,
      opponent_id: input.opponentId,
      subject: input.subject,
      grade: input.grade,
      status: 'pending',
      questions: input.questions,
      challenger_hp: input.maxHp,
      challenger_max: input.maxHp,
      // Máu của bên kia chưa biết - máy em ấy khai lúc bấm "nhận". Tạm đặt bằng
      // bên này để cột `not null` có giá trị, và nó sẽ bị ghi đè ngay sau đó.
      opponent_hp: input.maxHp,
      opponent_max: input.maxHp,
      challenger_power: input.power,
      challenger_pet: input.pet ?? null,
      challenger_spells: input.spells ?? [],
    })
    .select(MATCH_COLUMNS)
    .single()
  check(error, 'Không tạo được trận đấu')

  return toMatch(data as unknown as MatchRow)
}

/** Nhận lời hoặc từ chối. Nhận thì khai luôn máu và sức của đội thú bên mình. */
export async function respond(
  studentId: string,
  matchId: string,
  accept: boolean,
  side?: { maxHp: number; power: number; pet?: string | null; spells?: string[] },
): Promise<PvpMatch> {
  const row = await loadRow(matchId)
  if (row.opponent_id !== studentId) throw forbidden('Lời thách này không dành cho con.')
  if (row.status !== 'pending') throw badRequest('Lời thách này không còn hiệu lực.')

  if (!accept) {
    return update(matchId, { status: 'declined' })
  }
  if (!side) throw badRequest('Thiếu chỉ số đội thú.')

  return update(matchId, {
    status: 'active',
    opponent_hp: side.maxHp,
    opponent_max: side.maxHp,
    opponent_power: side.power,
    opponent_pet: side.pet ?? null,
    opponent_spells: side.spells ?? [],
    round: 0,
    round_started_at: new Date().toISOString(),
  })
}

/** Bỏ dở giữa chừng - bên kia thắng, và biết vì sao mình thắng. */
export async function abandon(studentId: string, matchId: string): Promise<PvpMatch> {
  const row = await loadRow(matchId)
  assertPlayer(row, studentId)
  if (row.status !== 'pending' && row.status !== 'active') return toMatch(row)

  return update(matchId, {
    status: 'abandoned',
    winner_id: other(row, studentId),
  })
}

function assertPlayer(row: MatchRow, studentId: string): void {
  if (row.challenger_id !== studentId && row.opponent_id !== studentId) {
    throw forbidden('Con không ở trong trận đấu này.')
  }
}

function other(row: MatchRow, studentId: string): string {
  return row.challenger_id === studentId ? row.opponent_id : row.challenger_id
}

async function update(matchId: string, patch: Record<string, unknown>): Promise<PvpMatch> {
  const { data, error } = await db()
    .from('pvp_matches')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', matchId)
    .select(MATCH_COLUMNS)
    .single()
  check(error, 'Không cập nhật được trận đấu')
  return toMatch(data as unknown as MatchRow)
}

// --- Lượt bấm ------------------------------------------------------------------

/** Thưởng cho bấm nhanh. Đo bằng đồng hồ máy chủ, tính từ lúc vòng bắt đầu. */
export function speedBonus(elapsedMs: number): number {
  if (elapsedMs < 2_000) return 1.8
  if (elapsedMs < 4_000) return 1.5
  if (elapsedMs < 7_000) return 1.2
  return 1
}

/**
 * Sát thương NỀN của một đòn trong PVP, trước khi nhân chiêu và nhân hệ.
 *
 * Người quyết định vẫn là người bấm nhanh và bấm đúng. Một bạn thú xoàng mà
 * nhanh tay vẫn ăn được bạn nuôi thú giỏi mà chậm - xem `pvpPowerFactor`.
 */
export function pvpDamage(difficulty: number, power: number, elapsedMs: number): number {
  const base = 10 + Math.max(0, difficulty) * 5
  return Math.max(1, Math.round(base * pvpPowerFactor(power) * speedBonus(elapsedMs)))
}

export interface BuzzResult {
  match: PvpMatch
  /** Con có ra đòn được ở vòng này không. null là vòng chưa ngã ngũ. */
  won: boolean | null
}

/**
 * Một bên tham chiến, đủ mọi thứ cần để chấm một vòng.
 *
 * Gom thành một khối thay vì sáu tham số rời như bản trước. Sáu đã là nhiều;
 * thêm hiệu ứng và hồi chiêu thì thành mười hai, và mười hai tham số cùng kiểu
 * `number` xếp cạnh nhau là một cái bẫy gọi nhầm thứ tự không ai phát hiện ra.
 */
export interface PvpSideState {
  studentId: string
  hp: number
  maxHp: number
  power: number
  /** Hệ của con thú bên này - để tính khắc chế. Thiếu thì coi như không khắc ai. */
  element: Element | null
  /** Hai chiêu bên này mang vào trận. */
  spells: string[]
  cooldown: number
  status: ActiveEffect[]
}

export interface RoundInput {
  challenger: PvpSideState
  opponent: PvpSideState
  round: number
  /** Tổng số vòng của trận - hết vòng mà chưa ai gục thì tính điểm. */
  totalRounds: number
  difficulty: number
  buzzes: Buzz[]
  /** Mốc bắt đầu vòng, epoch ms. Mỗi bên đo riêng từ đây tới lúc mình bấm. */
  roundStartedAt: number
}

export interface RoundOutcome {
  challenger: PvpSideState
  opponent: PvpSideState
  event: PvpEvent
  finished: boolean
  winnerId: string | null
}

/**
 * Một vòng đã đủ điều kiện ngã ngũ chưa: KHI CẢ HAI ĐÃ BẤM.
 *
 * Đổi hẳn so với bản trước, và đây là chỗ đổi quan trọng nhất của cả bản này.
 *
 * Trước kia có người bấm đúng là vòng chốt NGAY, không chờ bạn kia - vì hồi ấy
 * một vòng chỉ một người được đánh, nên câu trả lời của người bấm sau không
 * đổi được gì nữa. Giờ cả hai cùng ra đòn, nên câu trả lời ấy VẪN CÒN Ý NGHĨA,
 * và chốt vòng trước khi nghe nó là cướp mất lượt đánh của bạn ấy.
 *
 * Không sợ chờ mãi: mỗi câu có đồng hồ (`pvpTimeLimitMs`), và máy bên kia tự
 * gửi lên một lượt bấm SAI khi hết giờ.
 */
export function roundIsSettled(buzzes: Buzz[]): boolean {
  return buzzes.length >= 2
}

/** Hiệu ứng ăn một nhịp ở ĐẦU vòng, rồi rút ngắn một lượt. */
function tickSide(
  side: PvpSideState,
  foe: PvpSideState,
): { side: PvpSideState; foe: PvpSideState; lost: number } {
  let hp = side.hp
  let healed = 0

  for (const effect of side.status) {
    if (effect.turnsLeft <= 0 || effect.perTurn <= 0) continue
    const bite = Math.min(hp, effect.perTurn)
    hp -= bite
    // HÚT: máu chảy sang bên kia. Chỉ có hai bên nên "bên kia" là đủ rõ, không
    // cần ghi lại ai đã tung chiêu.
    if (effect.kind === 'drain') healed += bite
  }

  const status = side.status
    .map((e) => ({ ...e, turnsLeft: e.turnsLeft - 1 }))
    .filter((e) => e.turnsLeft > 0)

  return {
    side: { ...side, hp: Math.max(0, hp), status },
    foe: { ...foe, hp: Math.min(foe.maxHp, foe.hp + healed) },
    lost: side.hp - Math.max(0, hp),
  }
}

/**
 * Chiêu bên này THẬT SỰ tung ra ở vòng này.
 *
 * Ba cửa phải qua, và cả ba là cửa của MÁY CHỦ chứ không phải của giao diện:
 *
 *  1. chiêu phải có thật;
 *  2. chiêu phải nằm trong hai chiêu bên này đã khai lúc vào trận - nếu không
 *     thì một trình duyệt bị sửa chỉ việc khai bừa id chiêu cuối của hệ khác;
 *  3. chiêu cuối phải hết hồi chiêu. Còn hồi thì RƠI VỀ chiêu còn lại chứ không
 *     bỏ cả lượt đánh: lỗi ở đây gần như luôn do trễ mạng (máy bên này chưa kịp
 *     biết vòng trước mình vừa dùng), và phạt trẻ mất nguyên một lượt vì đường
 *     truyền thì không đáng.
 */
function spellFor(side: PvpSideState, wanted: string | null | undefined): Spell | null {
  const allowed = side.spells.filter((id) => SPELLS[id])
  const basic = allowed.map((id) => SPELLS[id]!).find((s) => s.tier !== 4) ?? null
  const anySpell = allowed.length > 0 ? SPELLS[allowed[0]!]! : null

  if (!wanted || !allowed.includes(wanted)) return basic ?? anySpell

  const spell = SPELLS[wanted]!
  if (spell.tier === 4 && side.cooldown > 0) return basic
  return spell
}

/**
 * Luật của một vòng, dạng thuần - không đụng cơ sở dữ liệu.
 *
 * Đọc thành một câu cho trẻ bảy tuổi: AI TRẢ LỜI ĐÚNG THÌ CON THÚ CỦA BẠN ẤY
 * ĐƯỢC TUNG CHIÊU. Cả hai cùng đúng thì cả hai cùng đánh, ai nhanh hơn thì đánh
 * đau hơn. Cả hai cùng sai thì vòng đó không ai mất máu vì đòn đánh - dù vết
 * cháy từ vòng trước thì vẫn cứ cháy.
 *
 * Tách khỏi phần ghi cơ sở dữ liệu vì đây là chỗ DUY NHẤT quyết định ai thắng
 * ai trong cả chế độ chơi này, và một luật quan trọng như thế phải kiểm được
 * bằng test mà không cần dựng máy chủ.
 */
export function settleRound(input: RoundInput): RoundOutcome {
  const first = input.buzzes[0] ?? null

  /*
    ĐỌC CỜ BĂNG TRƯỚC KHI HIỆU ỨNG ĂN NHỊP.

    Đóng băng dài đúng một vòng, mà nhịp trừ lượt ở ngay dưới sẽ đưa nó về 0 và
    gỡ khỏi danh sách. Đọc sau nhịp ấy thì lớp băng tan trước khi kịp chặn cái
    gì, và chiêu cuối của hệ Thanh Âm trở thành một cú đánh mạnh không hơn -
    hỏng lặng lẽ, vì máu hai bên vẫn cộng trừ đúng.

    Cùng một cái bẫy đã gài ở trận đánh quái, và ở đó cũng phải đọc trước.
  */
  const frozen = new Set(
    [input.challenger, input.opponent]
      .filter((s) => s.status.some((e) => e.kind === 'freeze' && e.turnsLeft > 0))
      .map((s) => s.studentId),
  )

  /*
    ---- ĐẦU VÒNG: hiệu ứng của vòng trước ăn một nhịp ----

    Trước cú đánh, không phải sau. Một bên đang cháy mà chỉ còn ba máu thì vết
    cháy ấy hạ được bạn ấy, và điều đó phải xảy ra TRƯỚC khi bạn ấy kịp tung
    chiêu - nếu không thì chiêu cuối của vòng trước hoá ra chỉ có tác dụng khi
    đối thủ còn nhiều máu.
  */
  let challenger = input.challenger
  let opponent = input.opponent
  const ticks: Record<string, number> = {}

  {
    const a = tickSide(challenger, opponent)
    challenger = a.side
    opponent = a.foe
    if (a.lost > 0) ticks[challenger.studentId] = a.lost

    const b = tickSide(opponent, challenger)
    opponent = b.side
    challenger = b.foe
    if (b.lost > 0) ticks[opponent.studentId] = b.lost
  }

  // ---- CÚ ĐÁNH CỦA TỪNG BÊN ----
  const hits: PvpHit[] = []

  const strike = (attacker: PvpSideState, defender: PvpSideState) => {
    const buzz = input.buzzes.find((b) => b.studentId === attacker.studentId)
    if (!buzz || !buzz.correct) return { attacker, defender }

    // ĐÓNG BĂNG: đứng sững thì không tung được chiêu nào cả. Vẫn ghi một dòng
    // sát thương 0 để máy bên kia có cái mà diễn ra - im lặng thì trẻ tưởng
    // mình trả lời sai.
    if (frozen.has(attacker.studentId)) {
      hits.push({ studentId: attacker.studentId, damage: 0, spellId: null, effect: null })
      return { attacker, defender }
    }

    const spell = spellFor(attacker, buzz.spellId)
    if (!spell) return { attacker, defender }

    const elapsed = Math.max(0, buzz.at - input.roundStartedAt)
    const matchup = defender.element ? elementMultiplier(spell.element, defender.element) : 1
    // TRÓI cắt đòn còn một nửa - cùng con số với trận đánh quái.
    const bound = attacker.status.some((e) => e.kind === 'bind') ? 0.5 : 1
    const damage = Math.max(
      1,
      Math.round(
        pvpDamage(input.difficulty, attacker.power, elapsed) * spell.power * matchup * bound,
      ),
    )

    const effect = spell.effect ?? null
    hits.push({
      studentId: attacker.studentId,
      damage,
      spellId: spell.id,
      effect: effect?.kind ?? null,
    })

    return {
      attacker: {
        ...attacker,
        cooldown: spell.tier === 4 ? ULTIMATE_COOLDOWN : attacker.cooldown,
      },
      defender: {
        ...defender,
        hp: Math.max(0, defender.hp - damage),
        status: effect
          ? [
              ...defender.status.filter((e) => e.kind !== effect.kind),
              {
                kind: effect.kind,
                turnsLeft: effect.turns,
                perTurn: effect.tickPercent
                  ? Math.max(1, Math.round(damage * effect.tickPercent))
                  : 0,
              },
            ]
          : defender.status,
      },
    }
  }

  /*
    CẢ HAI ĐÁNH TRONG CÙNG MỘT NHỊP, không ai đánh trước ai.

    Cụ thể: cú đánh của mỗi bên tính trên máu ĐẦU VÒNG của đối thủ, chứ không
    trên máu sau khi đối thủ đã ăn đòn kia. Nhờ vậy hai bên cùng còn 5 máu mà
    cùng trả lời đúng thì CẢ HAI CÙNG GỤC, và trận ra kết quả hoà.

    Cho bên nhanh hơn đánh trước thì ở những giây cuối trận đấu quay về đúng cái
    cũ: hơn nhau nửa giây là một bên chưa kịp ra đòn đã hết máu. Thưởng tốc độ
    nằm ở CON SỐ sát thương, không nằm ở quyền được đánh trước.
  */
  const fromChallenger = strike(challenger, opponent)
  const fromOpponent = strike(opponent, challenger)

  challenger = {
    ...fromChallenger.attacker,
    hp: fromOpponent.defender.hp,
    status: fromOpponent.defender.status,
  }
  opponent = {
    ...fromOpponent.attacker,
    hp: fromChallenger.defender.hp,
    status: fromChallenger.defender.status,
  }

  // Hồi chiêu nhích một bước mỗi vòng, kể cả vòng trả lời sai.
  challenger = { ...challenger, cooldown: Math.max(0, challenger.cooldown - 1) }
  opponent = { ...opponent, cooldown: Math.max(0, opponent.cooldown - 1) }

  const event: PvpEvent = {
    round: input.round,
    /*
      Trường CŨ, giữ cho trận đang đánh dở lúc bản này lên không mất diễn biến,
      và cho màn tổng kết đọc được những trận đã xong từ trước. Khi đúng một bên
      ra đòn thì nó vẫn kể đúng chuyện; hai bên cùng đánh thì để trống, và chỗ
      đọc phải nhìn sang `hits`.
    */
    attackerId: hits.length === 1 ? hits[0]!.studentId : null,
    damage: hits.length === 1 ? hits[0]!.damage : 0,
    hits,
    ticks,
    firstId: first?.studentId ?? null,
    firstCorrect: first?.correct ?? false,
  }

  const knockedOut = challenger.hp <= 0 || opponent.hp <= 0
  const outOfRounds = input.round + 1 >= input.totalRounds
  const finished = knockedOut || outOfRounds

  /*
    Hết vòng mà chưa ai gục thì bên nhiều máu hơn thắng; bằng nhau thì HOÀ.

    Hoà được phép tồn tại. Ép ra một người thắng bằng cách tung đồng xu thì cả
    bảy câu vừa rồi thành vô nghĩa - và với hai đứa bé ngồi cạnh nhau, "hoà" là
    một kết quả chúng chấp nhận được, còn "thua vì máy chọn" thì không.
  */
  const winnerId = !finished
    ? null
    : challenger.hp === opponent.hp
      ? null
      : challenger.hp > opponent.hp
        ? challenger.studentId
        : opponent.studentId

  return { challenger, opponent, event, finished, winnerId }
}

/**
 * "Em trả lời xong rồi, và em tung chiêu này."
 *
 * Máy gửi lên ĐÚNG hay SAI cùng id chiêu, KHÔNG gửi thời gian: thời gian do máy
 * chủ tự đo, vì đó là thứ quyết định sát thương và cũng là thứ dễ khai gian nhất.
 */
export async function buzz(
  studentId: string,
  matchId: string,
  round: number,
  correct: boolean,
  spellId?: string | null,
): Promise<BuzzResult> {
  const row = await loadRow(matchId)
  assertPlayer(row, studentId)
  if (row.status !== 'active') throw badRequest('Trận đấu đã kết thúc.')

  // Bấm cho một vòng đã qua: bỏ qua trong im lặng, đừng báo lỗi. Chuyện này xảy
  // ra bình thường - đồng hồ bên này hết giờ đúng lúc bên kia vừa chốt vòng - và
  // một lời báo lỗi ở đây chỉ làm trẻ hoảng chứ không sửa được gì.
  if (round !== row.round) return { match: await toMatch(row), won: null }

  const buzzes = row.buzzes ?? []
  // Bấm hai lần trong một vòng thì lần sau không tính. Không có nó thì giữ nút
  // bấm liên tục là một cách gian lận.
  if (buzzes.some((b) => b.studentId === studentId)) {
    return { match: await toMatch(row), won: null }
  }

  const now = Date.now()
  const next: Buzz[] = [...buzzes, { studentId, correct, at: now, spellId: spellId ?? null }]

  if (!roundIsSettled(next)) {
    // Chưa ngã ngũ: ghi lượt bấm rồi chờ bạn kia.
    return { match: await update(matchId, { buzzes: next }), won: null }
  }

  return { match: await resolveRound(row, next, now), won: correct }
}

/** Chốt một vòng rồi ghi xuống: cộng sát thương, sang câu sau, xem trận xong chưa. */
async function resolveRound(row: MatchRow, buzzes: Buzz[], now: number): Promise<PvpMatch> {
  const sideOf = (which: 'challenger' | 'opponent'): PvpSideState => {
    const mine = which === 'challenger'
    const petId = (mine ? row.challenger_pet : row.opponent_pet) ?? ''
    return {
      studentId: mine ? row.challenger_id : row.opponent_id,
      hp: mine ? row.challenger_hp : row.opponent_hp,
      maxHp: mine ? row.challenger_max : row.opponent_max,
      power: Number(mine ? row.challenger_power : row.opponent_power),
      element: getPet(petId)?.element ?? null,
      spells: (mine ? row.challenger_spells : row.opponent_spells) ?? [],
      cooldown: (mine ? row.challenger_cd : row.opponent_cd) ?? 0,
      status: (mine ? row.challenger_status : row.opponent_status) ?? [],
    }
  }

  const outcome = settleRound({
    challenger: sideOf('challenger'),
    opponent: sideOf('opponent'),
    round: row.round,
    totalRounds: row.questions.length,
    difficulty: row.questions[row.round]?.difficulty ?? 1,
    buzzes,
    roundStartedAt: Date.parse(row.round_started_at),
  })

  return update(row.id, {
    challenger_hp: outcome.challenger.hp,
    opponent_hp: outcome.opponent.hp,
    challenger_cd: outcome.challenger.cooldown,
    opponent_cd: outcome.opponent.cooldown,
    challenger_status: outcome.challenger.status,
    opponent_status: outcome.opponent.status,
    events: [...(row.events ?? []), outcome.event],
    buzzes: [],
    round: row.round + 1,
    round_started_at: new Date(now).toISOString(),
    status: outcome.finished ? 'finished' : 'active',
    winner_id: outcome.winnerId,
  })
}
