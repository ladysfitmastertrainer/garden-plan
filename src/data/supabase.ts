/**
 * Repository chạy trên Supabase.
 *
 * Dùng trực tiếp thì mọi thao tác đều cần mạng. Trong app, nó luôn được bọc bởi
 * `SyncingRepository` (xem `syncing.ts`) để chơi offline vẫn mượt.
 *
 * Toàn bộ phân quyền nằm ở RLS phía server (xem `supabase/migrations`), không ở
 * đây - client chỉ gửi truy vấn, server quyết định cho thấy gì.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Grade, Subject, Virtue } from '../content/types'
import type { LeitnerBox, SkillMastery } from '../engine/mastery'
// Client được truyền vào từ ngoài: module này không tự nạp Supabase, nhờ vậy
// nó chỉ bị kéo vào bundle khi thật sự dùng tới.
import {
  emptyProgress,
  type Repository,
  type StoredAttempt,
  type StudentProfile,
  type StudentProgress,
} from './types'

// --- Ánh xạ giữa hàng trong bảng và kiểu dữ liệu của game ---------------------

interface StudentRow {
  id: string
  owner_id: string
  name: string
  avatar: string
  grade: number
  total_xp: number
  gold: number
  equipped_item_ids: string[]
  created_at: string
  last_played_at: string
}

function toStudent(row: StudentRow): StudentProfile {
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

function fromAttempt(a: StoredAttempt): AttemptRow {
  return {
    student_id: a.studentId,
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

/** Ném lỗi kèm thông điệp tiếng Việt thay vì để lỗi Postgres thô lọt lên UI. */
function check(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`)
}

// --- Repository ----------------------------------------------------------------

export function createSupabaseRepository(client: SupabaseClient): Repository {
  return {
    async listStudents(): Promise<StudentProfile[]> {
      const { data, error } = await client
        .from('students')
        .select('*')
        .order('last_played_at', { ascending: false })
      check(error, 'Không tải được danh sách học sinh')
      return (data as StudentRow[] | null)?.map(toStudent) ?? []
    },

    async createStudent(input: { name: string; avatar: string; grade: Grade }) {
      const { data: auth } = await client.auth.getUser()
      if (!auth.user) throw new Error('Chưa đăng nhập')

      const { data, error } = await client
        .from('students')
        .insert({
          owner_id: auth.user.id,
          name: input.name.trim(),
          avatar: input.avatar,
          grade: input.grade,
          // Không đặt mã PIN ở đây. Hồ sơ chưa có mã PIN thì chưa dùng được trên
          // máy dùng chung ở lớp; trên máy gia đình thì không cần mã PIN vì phụ
          // huynh đã đăng nhập. Đặt mã qua `setStudentPin()` khi cần.
        })
        .select()
        .single()
      check(error, 'Không tạo được hồ sơ học sinh')

      const student = toStudent(data as StudentRow)
      await client.from('student_progress').insert({ student_id: student.id })
      return student
    },

    async saveStudent(student: StudentProfile): Promise<void> {
      const { error } = await client
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
    },

    async deleteStudent(studentId: string): Promise<void> {
      const { error } = await client.from('students').delete().eq('id', studentId)
      check(error, 'Không xoá được hồ sơ học sinh')
    },

    async getProgress(studentId: string): Promise<StudentProgress> {
      // Bốn bảng rời nhau nên tải song song cho nhanh.
      const [masteryResult, progressResult, inventoryResult, virtuesResult] = await Promise.all([
        client.from('skill_mastery').select('*').eq('student_id', studentId),
        client.from('student_progress').select('*').eq('student_id', studentId).maybeSingle(),
        client.from('inventory').select('item_id').eq('student_id', studentId),
        client.from('virtues').select('virtue, count').eq('student_id', studentId),
      ])

      check(masteryResult.error, 'Không tải được mức thạo')
      check(progressResult.error, 'Không tải được tiến độ')
      check(inventoryResult.error, 'Không tải được kho đồ')
      check(virtuesResult.error, 'Không tải được điểm phẩm chất')

      const base = emptyProgress()

      const mastery: StudentProgress['mastery'] = {}
      for (const row of (masteryResult.data as MasteryRow[] | null) ?? []) {
        mastery[row.skill_id] = toMastery(row)
      }

      const virtues: StudentProgress['virtues'] = {}
      for (const row of (virtuesResult.data as Array<{ virtue: string; count: number }> | null) ?? []) {
        virtues[row.virtue as Virtue] = row.count
      }

      const progressRow = progressResult.data as
        | { cleared_nodes: Record<string, number>; battles_played: number; battles_won: number }
        | null

      return {
        mastery,
        inventory: ((inventoryResult.data as Array<{ item_id: string }> | null) ?? []).map(
          (row) => row.item_id,
        ),
        virtues,
        clearedNodes: { ...base.clearedNodes, ...(progressRow?.cleared_nodes ?? {}) },
        battlesPlayed: progressRow?.battles_played ?? 0,
        battlesWon: progressRow?.battles_won ?? 0,
      }
    },

    async saveProgress(studentId: string, progress: StudentProgress): Promise<void> {
      const masteryRows = Object.values(progress.mastery).map((m) => fromMastery(studentId, m))

      const virtueRows = Object.entries(progress.virtues)
        .filter(([, count]) => (count ?? 0) > 0)
        .map(([virtue, count]) => ({ student_id: studentId, virtue, count: count ?? 0 }))

      const results = await Promise.all([
        masteryRows.length > 0
          ? client.from('skill_mastery').upsert(masteryRows, { onConflict: 'student_id,skill_id' })
          : Promise.resolve({ error: null }),
        client.from('student_progress').upsert(
          {
            student_id: studentId,
            cleared_nodes: progress.clearedNodes,
            battles_played: progress.battlesPlayed,
            battles_won: progress.battlesWon,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'student_id' },
        ),
        virtueRows.length > 0
          ? client.from('virtues').upsert(virtueRows, { onConflict: 'student_id,virtue' })
          : Promise.resolve({ error: null }),
      ])

      for (const result of results) check(result.error, 'Không lưu được tiến độ')

      await syncInventory(client, studentId, progress.inventory)
    },

    async recordAttempts(attempts: StoredAttempt[]): Promise<void> {
      if (attempts.length === 0) return
      const { error } = await client
        .from('attempts')
        // Gửi lại lô cũ sau khi mất mạng là chuyện bình thường; ràng buộc unique
        // ở server lo phần khử trùng, ở đây chỉ cần bỏ qua bản đã có.
        .upsert(attempts.map(fromAttempt), {
          onConflict: 'student_id,question_id,answered_at',
          ignoreDuplicates: true,
        })
      check(error, 'Không ghi được nhật ký trả lời')
    },

    async listAttempts(studentId: string, limit = 500): Promise<StoredAttempt[]> {
      const { data, error } = await client
        .from('attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('answered_at', { ascending: false })
        .limit(limit)
      check(error, 'Không tải được nhật ký trả lời')
      // Trả về theo thứ tự thời gian tăng dần cho khớp với bản local.
      return ((data as AttemptRow[] | null) ?? []).map(toAttempt).reverse()
    },
  }
}

/**
 * Đặt mã PIN cho một học sinh - bắt buộc trước khi em đó dùng máy chung ở lớp.
 * Việc băm mã do server làm (bcrypt), mã thô không bao giờ được lưu.
 */
export async function setStudentPin(
  studentId: string,
  pin: string,
  client: SupabaseClient,
): Promise<void> {
  const { error } = await client.rpc('set_student_pin', { p_student_id: studentId, p_pin: pin })
  check(error, 'Không đặt được mã PIN')
}

/** Kho đồ là bảng chỉ-thêm: chỉ chèn những món server chưa có. */
async function syncInventory(
  client: SupabaseClient,
  studentId: string,
  inventory: string[],
): Promise<void> {
  if (inventory.length === 0) return

  const { data, error } = await client.from('inventory').select('item_id').eq('student_id', studentId)
  check(error, 'Không tải được kho đồ')

  const existing = ((data as Array<{ item_id: string }> | null) ?? []).map((row) => row.item_id)
  // Đếm theo số lượng: trẻ nhặt được hai cái mũ vải thì phải có hai dòng.
  const toInsert: Array<{ student_id: string; item_id: string }> = []
  const remaining = [...existing]

  for (const itemId of inventory) {
    const index = remaining.indexOf(itemId)
    if (index === -1) toInsert.push({ student_id: studentId, item_id: itemId })
    else remaining.splice(index, 1)
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await client.from('inventory').insert(toInsert)
    check(insertError, 'Không lưu được kho đồ')
  }
}
