/**
 * Đọc/ghi hồ sơ và tiến độ học sinh.
 *
 * Toàn bộ nội dung file này trước đây chạy TRONG TRÌNH DUYỆT
 * (`src/data/supabase.ts`). Chuyển sang đây đổi hai thứ:
 *
 *   1. Phần ánh xạ giữa cột trong bảng và kiểu dữ liệu của game không còn phải
 *      đi kèm trong gói JavaScript gửi xuống máy trẻ.
 *   2. Đổi tên một cột chỉ cần sửa ở đây rồi deploy, không phải chờ mọi máy tính
 *      bảng trong lớp tải bản mới về.
 */
import 'server-only'

import type { Grade, Subject, Virtue } from '@/content/types'
import type { LeitnerBox, SkillMastery } from '@/engine/mastery'
import {
  emptyProgress,
  type StoredAttempt,
  type StudentProfile,
  type StudentProgress,
} from '@/data/types'
import { check, db } from './db'

// --- Ánh xạ giữa hàng trong bảng và kiểu dữ liệu của game ---------------------

interface StudentRow {
  id: string
  name: string
  avatar: string
  grade: number
  total_xp: number
  gold: number
  equipped_item_ids: string[] | null
  created_at: string
  last_played_at: string
}

const STUDENT_COLUMNS =
  'id, name, avatar, grade, total_xp, gold, equipped_item_ids, created_at, last_played_at'

export function toStudent(row: StudentRow): StudentProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    grade: row.grade as Grade,
    totalXp: row.total_xp,
    gold: row.gold,
    equippedItemIds: row.equipped_item_ids ?? [],
    createdAt: Date.parse(row.created_at),
    lastPlayedAt: Date.parse(row.last_played_at),
  }
}

interface MasteryRow {
  student_id: string
  skill_id: string
  mastery: number
  box: number
  due_at: string
  attempts: number
  correct: number
  streak: number
  last_seen_at: string
}

function toMastery(row: MasteryRow): SkillMastery {
  return {
    skillId: row.skill_id,
    mastery: row.mastery,
    box: row.box as LeitnerBox,
    dueAt: Date.parse(row.due_at),
    attempts: row.attempts,
    correct: row.correct,
    streak: row.streak,
    lastSeenAt: Date.parse(row.last_seen_at),
  }
}

function fromMastery(studentId: string, m: SkillMastery): MasteryRow {
  return {
    student_id: studentId,
    skill_id: m.skillId,
    mastery: m.mastery,
    box: m.box,
    due_at: new Date(m.dueAt).toISOString(),
    attempts: m.attempts,
    correct: m.correct,
    streak: m.streak,
    last_seen_at: new Date(m.lastSeenAt).toISOString(),
  }
}

interface AttemptRow {
  student_id: string
  question_id: string
  skill_id: string
  subject: string
  difficulty: number
  correct: boolean
  quality: string | null
  duration_ms: number
  used_hint: boolean
  answered_at: string
}

function toAttempt(row: AttemptRow): StoredAttempt {
  return {
    studentId: row.student_id,
    questionId: row.question_id,
    skillId: row.skill_id,
    subject: row.subject as Subject,
    difficulty: row.difficulty as 1 | 2 | 3,
    correct: row.correct,
    ...(row.quality ? { quality: row.quality as StoredAttempt['quality'] } : {}),
    durationMs: row.duration_ms,
    usedHint: row.used_hint,
    answeredAt: Date.parse(row.answered_at),
  }
}

function fromAttempt(studentId: string, a: StoredAttempt): AttemptRow {
  return {
    // Lấy từ ĐƯỜNG DẪN chứ không từ thân yêu cầu. Tin `a.studentId` do trình
    // duyệt gửi lên nghĩa là ai cũng ghi được nhật ký vào hồ sơ của bất kỳ ai -
    // cổng chặn đã kiểm quyền trên id trong đường dẫn, không phải id trong body.
    student_id: studentId,
    question_id: a.questionId,
    skill_id: a.skillId,
    subject: a.subject,
    difficulty: a.difficulty,
    correct: a.correct,
    quality: a.quality ?? null,
    duration_ms: Math.round(a.durationMs),
    used_hint: a.usedHint,
    answered_at: new Date(a.answeredAt).toISOString(),
  }
}

// --- Hồ sơ ---------------------------------------------------------------------

/** Mọi hồ sơ người này được xem: hồ sơ mình sở hữu, cộng học sinh lớp mình dạy. */
export async function listStudentsFor(userId: string): Promise<StudentProfile[]> {
  const owned = await db().from('students').select(STUDENT_COLUMNS).eq('owner_id', userId)
  check(owned.error, 'Không tải được danh sách học sinh')

  const taught = await db()
    .from('class_members')
    .select('students!inner(' + STUDENT_COLUMNS + '), classes!inner(teacher_id)')
    .eq('classes.teacher_id', userId)
  check(taught.error, 'Không tải được học sinh của lớp')

  // Gộp theo id: một em vừa do mình tạo vừa thuộc lớp mình dạy chỉ hiện một lần.
  const byId = new Map<string, StudentProfile>()
  for (const row of (owned.data as unknown as StudentRow[] | null) ?? []) {
    byId.set(row.id, toStudent(row))
  }
  for (const row of (taught.data as unknown as Array<{ students: StudentRow | null }> | null) ?? []) {
    if (row.students) byId.set(row.students.id, toStudent(row.students))
  }

  return [...byId.values()].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
}

export async function getStudent(studentId: string): Promise<StudentProfile | null> {
  const { data, error } = await db()
    .from('students')
    .select(STUDENT_COLUMNS)
    .eq('id', studentId)
    .maybeSingle()
  check(error, 'Không tải được hồ sơ học sinh')
  return data ? toStudent(data as unknown as StudentRow) : null
}

export async function createStudent(
  ownerId: string,
  input: { name: string; avatar: string; grade: Grade },
): Promise<StudentProfile> {
  const { data, error } = await db()
    .from('students')
    .insert({
      owner_id: ownerId,
      name: input.name,
      avatar: input.avatar,
      grade: input.grade,
      // Không đặt mã PIN ở đây. Hồ sơ chưa có mã PIN thì chưa dùng được trên máy
      // dùng chung ở lớp; trên máy gia đình thì không cần vì phụ huynh đã đăng
      // nhập. Đặt mã qua `PUT /api/students/[id]/pin` khi cần.
    })
    .select(STUDENT_COLUMNS)
    .single()
  check(error, 'Không tạo được hồ sơ học sinh')

  const student = toStudent(data as unknown as StudentRow)
  await db().from('student_progress').insert({ student_id: student.id })
  return student
}

export async function saveStudent(student: StudentProfile): Promise<void> {
  const { error } = await db()
    .from('students')
    .update({
      name: student.name,
      avatar: student.avatar,
      grade: student.grade,
      total_xp: student.totalXp,
      gold: student.gold,
      equipped_item_ids: student.equippedItemIds,
      last_played_at: new Date(student.lastPlayedAt).toISOString(),
    })
    .eq('id', student.id)
  check(error, 'Không lưu được hồ sơ học sinh')
}

export async function deleteStudent(studentId: string): Promise<void> {
  const { error } = await db().from('students').delete().eq('id', studentId)
  check(error, 'Không xoá được hồ sơ học sinh')
}

// --- Tiến độ -------------------------------------------------------------------

export async function getProgress(studentId: string): Promise<StudentProgress> {
  // Bốn bảng rời nhau nên tải song song cho nhanh.
  const [masteryResult, progressResult, inventoryResult, virtuesResult] = await Promise.all([
    db().from('skill_mastery').select('*').eq('student_id', studentId),
    db().from('student_progress').select('*').eq('student_id', studentId).maybeSingle(),
    db().from('inventory').select('item_id').eq('student_id', studentId),
    db().from('virtues').select('virtue, count').eq('student_id', studentId),
  ])

  check(masteryResult.error, 'Không tải được mức thạo')
  check(progressResult.error, 'Không tải được tiến độ')
  check(inventoryResult.error, 'Không tải được kho đồ')
  check(virtuesResult.error, 'Không tải được điểm phẩm chất')

  const base = emptyProgress()

  const mastery: StudentProgress['mastery'] = {}
  for (const row of (masteryResult.data as unknown as MasteryRow[] | null) ?? []) {
    mastery[row.skill_id] = toMastery(row)
  }

  const virtues: StudentProgress['virtues'] = {}
  for (const row of (virtuesResult.data as Array<{ virtue: string; count: number }> | null) ?? []) {
    virtues[row.virtue as Virtue] = row.count
  }

  const progressRow = progressResult.data as unknown as
    | {
        cleared_nodes: Record<string, number>
        battles_played: number
        battles_won: number
        /*
          Bốn cột dưới đây thêm ở migration 0008. Hàng ghi trước đó không có
          chúng, nên mọi chỗ đọc đều phải chịu được giá trị trống - đọc thẳng
          vào là một hồ sơ cũ đủ làm cả màn hình kho đồ trắng xoá.
        */
        pets?: string[] | null
        pet_xp?: Record<string, number> | null
        loadout?: string[] | null
        tower_cleared?: string[] | null
      }
    | null

  return {
    ...base,
    mastery,
    inventory: ((inventoryResult.data as Array<{ item_id: string }> | null) ?? []).map(
      (row) => row.item_id,
    ),
    virtues,
    clearedNodes: { ...base.clearedNodes, ...(progressRow?.cleared_nodes ?? {}) },
    pets: progressRow?.pets ?? [],
    petXp: progressRow?.pet_xp ?? {},
    loadout: progressRow?.loadout ?? [],
    towerCleared: progressRow?.tower_cleared ?? [],
    battlesPlayed: progressRow?.battles_played ?? 0,
    battlesWon: progressRow?.battles_won ?? 0,
  }
}

export async function saveProgress(studentId: string, progress: StudentProgress): Promise<void> {
  const masteryRows = Object.values(progress.mastery).map((m) => fromMastery(studentId, m))

  const virtueRows = Object.entries(progress.virtues)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([virtue, count]) => ({ student_id: studentId, virtue, count: count ?? 0 }))

  const results = await Promise.all([
    masteryRows.length > 0
      ? db().from('skill_mastery').upsert(masteryRows, { onConflict: 'student_id,skill_id' })
      : Promise.resolve({ error: null }),
    db()
      .from('student_progress')
      .upsert(
        {
          student_id: studentId,
          cleared_nodes: progress.clearedNodes,
          /*
            Bốn trường này TỪNG bị rơi mất ở đúng chỗ này - xem migration 0008.

            Chúng không bắt buộc trong `StudentProgress` (hồ sơ cũ thiếu), nên
            phải có giá trị thay thế: một hồ sơ cũ mà ghi giá trị trống đè lên
            cột `not null` là cả lượt lưu thất bại, và lượt lưu ấy đang mang
            theo cả tiến độ bài học của trẻ.
          */
          pets: progress.pets ?? [],
          pet_xp: progress.petXp ?? {},
          loadout: progress.loadout ?? [],
          tower_cleared: progress.towerCleared ?? [],
          battles_played: progress.battlesPlayed,
          battles_won: progress.battlesWon,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' },
      ),
    virtueRows.length > 0
      ? db().from('virtues').upsert(virtueRows, { onConflict: 'student_id,virtue' })
      : Promise.resolve({ error: null }),
  ])

  for (const result of results) check(result.error, 'Không lưu được tiến độ')

  await syncInventory(studentId, progress.inventory)
}

/** Kho đồ là bảng chỉ-thêm: chỉ chèn những món máy chủ chưa có. */
async function syncInventory(studentId: string, inventory: string[]): Promise<void> {
  if (inventory.length === 0) return

  const { data, error } = await db().from('inventory').select('item_id').eq('student_id', studentId)
  check(error, 'Không tải được kho đồ')

  const remaining = ((data as Array<{ item_id: string }> | null) ?? []).map((row) => row.item_id)
  // Đếm theo số lượng: trẻ nhặt được hai cái mũ vải thì phải có hai dòng.
  const toInsert: Array<{ student_id: string; item_id: string }> = []

  for (const itemId of inventory) {
    const index = remaining.indexOf(itemId)
    if (index === -1) toInsert.push({ student_id: studentId, item_id: itemId })
    else remaining.splice(index, 1)
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await db().from('inventory').insert(toInsert)
    check(insertError, 'Không lưu được kho đồ')
  }
}

// --- Nhật ký trả lời -----------------------------------------------------------

export async function recordAttempts(studentId: string, attempts: StoredAttempt[]): Promise<void> {
  if (attempts.length === 0) return
  const { error } = await db()
    .from('attempts')
    // Bấm hai lần, hoặc mạng chập chờn làm trình duyệt gửi lại - ràng buộc unique
    // ở server lo phần khử trùng, ở đây chỉ cần bỏ qua bản đã có.
    .upsert(
      attempts.map((a) => fromAttempt(studentId, a)),
      { onConflict: 'student_id,question_id,answered_at', ignoreDuplicates: true },
    )
  check(error, 'Không ghi được nhật ký trả lời')
}

export async function listAttempts(studentId: string, limit = 500): Promise<StoredAttempt[]> {
  const { data, error } = await db()
    .from('attempts')
    .select('*')
    .eq('student_id', studentId)
    .order('answered_at', { ascending: false })
    .limit(limit)
  check(error, 'Không tải được nhật ký trả lời')
  // Trả về theo thứ tự thời gian tăng dần - giao diện đọc xuôi.
  return ((data as unknown as AttemptRow[] | null) ?? []).map(toAttempt).reverse()
}
