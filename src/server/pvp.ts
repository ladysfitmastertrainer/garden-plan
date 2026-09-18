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

import type { Grade, Subject } from '@/content/types'
import { pvpTimeLimitMs } from '@/data/pvp-types'
import type {
  LobbyEntry,
  PvpEvent,
  PvpMatch,
  PvpQuestion,
  PvpSide,
  PvpStatus,
} from '@/data/pvp-types'
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
  where: { subject: Subject | null; grade: Grade | null; x?: number | null; y?: number | null },
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
    .select('student_id, subject, grade, x, y, students(id, name, avatar)')
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
  'challenger_power, opponent_power, buzzes, events, winner_id'

export interface Buzz {
  studentId: string
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
  const side = (id: string, hp: number, maxHp: number, power: number): PvpSide => ({
    studentId: id,
    name: names.get(id)?.name ?? 'Bạn',
    avatar: names.get(id)?.avatar ?? '🦊',
    hp,
    maxHp,
    power,
  })

  return {
    id: row.id,
    status: row.status,
    subject: row.subject,
    grade: row.grade as Grade,
    round: row.round,
    questions: row.questions,
    challenger: side(
      row.challenger_id,
      row.challenger_hp,
      row.challenger_max,
      Number(row.challenger_power),
    ),
    opponent: side(row.opponent_id, row.opponent_hp, row.opponent_max, Number(row.opponent_power)),
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
  side?: { maxHp: number; power: number },
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
 * Sức đội thú KHI VÀO PVP - nén lại bằng căn bậc hai.
 *
 * Ở trận đánh quái, `power` đi thẳng vào công thức: nuôi thú tới nấc tiến hoá
 * cuối thì đội có thể chạm mốc 2,3 - gấp hơn hai lần một đội mới. Ở đó điều ấy
 * đúng và nên thế, vì đối thủ là một con quái do máy dựng, và cả việc nuôi thú
 * sinh ra để trẻ thấy mình mạnh dần lên.
 *
 * Ở PVP thì đối thủ là bạn ngồi bàn bên. Để nguyên hệ số ấy thì trận đấu ngã ngũ
 * TRƯỚC KHI câu hỏi đầu tiên hiện ra: bạn nào chơi lâu hơn thì đánh gấp đôi, và
 * bạn kia có trả lời nhanh cỡ nào cũng không gỡ nổi. Lúc đó phần thưởng rơi vào
 * cái trẻ ĐÃ CÓ, chứ không vào cái trẻ vừa LÀM - mà cái trẻ vừa làm mới là cái
 * chế độ này muốn đo.
 *
 * Căn bậc hai kéo khoảng 1,0-2,3 xuống còn 1,0-1,52, hẹp hơn hẳn khoảng thưởng
 * tốc độ 1,0-1,8. Đội thú vẫn có ích, và có ích thấy được; nó chỉ không còn đè
 * bẹp được tốc độ nữa.
 */
export function pvpPowerFactor(power: number): number {
  return Math.sqrt(Math.max(0.01, power))
}

/**
 * Sát thương một đòn trong PVP.
 *
 * Người quyết định là người bấm đúng trước. Một bạn đội thú xoàng mà nhanh tay
 * vẫn thắng được bạn nuôi thú giỏi mà chậm - xem `pvpPowerFactor`.
 */
export function pvpDamage(difficulty: number, power: number, elapsedMs: number): number {
  const base = 10 + Math.max(0, difficulty) * 5
  return Math.max(1, Math.round(base * pvpPowerFactor(power) * speedBonus(elapsedMs)))
}

export interface BuzzResult {
  match: PvpMatch
  /** Con có giành được quyền tấn công ở vòng này không. null là vòng chưa ngã ngũ. */
  won: boolean | null
}

/**
 * "Em trả lời xong rồi."
 *
 * Máy gửi lên ĐÚNG hay SAI, không gửi thời gian: thời gian do máy chủ tự đo.
 *
 * Luật của một vòng, và nó phải đọc được thành một câu cho trẻ bảy tuổi:
 * AI BẤM ĐÚNG TRƯỚC THÌ ĐƯỢC ĐÁNH. Bấm nhanh mà sai thì mất lượt, và bạn kia
 * vẫn còn nguyên cơ hội. Cả hai cùng sai thì vòng đó không ai đánh ai.
 */
export async function buzz(
  studentId: string,
  matchId: string,
  round: number,
  correct: boolean,
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
  const next: Buzz[] = [...buzzes, { studentId, correct, at: now }]

  if (!roundIsSettled(next)) {
    // Chưa ngã ngũ: ghi lượt bấm rồi chờ bạn kia.
    return { match: await update(matchId, { buzzes: next }), won: null }
  }

  const winner = next.find((b) => b.correct) ?? null
  return { match: await resolveRound(row, next, now), won: winner?.studentId === studentId }
}

export interface RoundInput {
  challengerId: string
  opponentId: string
  challengerHp: number
  opponentHp: number
  challengerPower: number
  opponentPower: number
  round: number
  /** Tổng số vòng của trận - hết vòng mà chưa ai gục thì tính điểm. */
  totalRounds: number
  difficulty: number
  buzzes: Buzz[]
  /** Máy chủ đo được bao lâu kể từ lúc vòng bắt đầu. */
  elapsedMs: number
}

export interface RoundOutcome {
  challengerHp: number
  opponentHp: number
  event: PvpEvent
  finished: boolean
  winnerId: string | null
}

/**
 * Một vòng đã đủ điều kiện ngã ngũ chưa.
 *
 * Xong khi có người bấm ĐÚNG, hoặc khi cả hai đã bấm. Người bấm đúng trước
 * không cần chờ bạn kia trả lời nốt - chờ thì cái "nhanh tay" mất hết ý nghĩa,
 * vì phần thưởng của việc nhanh hơn chính là được đánh NGAY.
 */
export function roundIsSettled(buzzes: Buzz[]): boolean {
  return buzzes.some((b) => b.correct) || buzzes.length >= 2
}

/**
 * Luật của một vòng, dạng thuần - không đụng cơ sở dữ liệu.
 *
 * Đọc thành một câu cho trẻ bảy tuổi: AI BẤM ĐÚNG TRƯỚC THÌ ĐƯỢC ĐÁNH. Bấm
 * nhanh mà sai thì mất lượt, và bạn kia vẫn còn nguyên cơ hội. Cả hai cùng sai
 * thì vòng đó không ai đánh ai.
 *
 * Tách khỏi phần ghi cơ sở dữ liệu vì đây là chỗ DUY NHẤT quyết định ai thắng
 * ai trong cả chế độ chơi này, và một luật quan trọng như thế phải kiểm được
 * bằng test mà không cần dựng máy chủ.
 */
export function settleRound(input: RoundInput): RoundOutcome {
  const first = input.buzzes[0] ?? null
  const winner = input.buzzes.find((b) => b.correct) ?? null

  const isChallenger = winner?.studentId === input.challengerId
  const power = isChallenger ? input.challengerPower : input.opponentPower
  const damage = winner ? pvpDamage(input.difficulty, power, input.elapsedMs) : 0

  let challengerHp = input.challengerHp
  let opponentHp = input.opponentHp
  if (winner) {
    if (isChallenger) opponentHp = Math.max(0, opponentHp - damage)
    else challengerHp = Math.max(0, challengerHp - damage)
  }

  const event: PvpEvent = {
    round: input.round,
    attackerId: winner?.studentId ?? null,
    damage,
    firstId: first?.studentId ?? null,
    firstCorrect: first?.correct ?? false,
  }

  const knockedOut = challengerHp <= 0 || opponentHp <= 0
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
    : challengerHp === opponentHp
      ? null
      : challengerHp > opponentHp
        ? input.challengerId
        : input.opponentId

  return { challengerHp, opponentHp, event, finished, winnerId }
}

/** Chốt một vòng rồi ghi xuống: cộng sát thương, sang câu sau, xem trận xong chưa. */
async function resolveRound(row: MatchRow, buzzes: Buzz[], now: number): Promise<PvpMatch> {
  const outcome = settleRound({
    challengerId: row.challenger_id,
    opponentId: row.opponent_id,
    challengerHp: row.challenger_hp,
    opponentHp: row.opponent_hp,
    challengerPower: Number(row.challenger_power),
    opponentPower: Number(row.opponent_power),
    round: row.round,
    totalRounds: row.questions.length,
    difficulty: row.questions[row.round]?.difficulty ?? 1,
    buzzes,
    elapsedMs: Math.max(0, now - Date.parse(row.round_started_at)),
  })

  return update(row.id, {
    challenger_hp: outcome.challengerHp,
    opponent_hp: outcome.opponentHp,
    events: [...(row.events ?? []), outcome.event],
    buzzes: [],
    round: row.round + 1,
    round_started_at: new Date(now).toISOString(),
    status: outcome.finished ? 'finished' : 'active',
    winner_id: outcome.winnerId,
  })
}
