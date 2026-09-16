/**
 * Nội dung tự soạn: ai đọc được của ai, và đẩy lên thì ghi vào đâu.
 *
 * Phần HỢP NHẤT (`mergeContent`) vẫn ở lại trình duyệt - xem
 * `src/data/content-sync.ts`. Ở đây chỉ có hai việc mà chỉ máy chủ làm được:
 * quyết định người gọi được đọc nội dung của những ai, và đóng dấu `owner_id`
 * lên mọi dòng ghi xuống.
 *
 * Đóng dấu ở đây chứ không tin `owner_id` trình duyệt gửi lên là điểm mấu chốt.
 * Máy của một cô giáo còn giữ cả nội dung kéo về của người khác; tin số liệu
 * client gửi thì một dòng của người này ghi đè lên dòng của người kia.
 */
import 'server-only'

import { check, db } from './db'
import type { Session } from './session'

/** Bản đọc được từ máy chủ, giữ nguyên tên cột để `content-sync.ts` tự ánh xạ. */
export interface RemoteContent {
  questions: Array<{
    id: string
    owner_id: string
    skill_id: string
    entry: unknown
    updated_at: string
    deleted_at: string | null
  }>
  hidden: Array<{
    owner_id: string
    skill_id: string
    prompt: string
    updated_at: string
    deleted_at: string | null
  }>
  skillNames: Array<{
    owner_id: string
    skill_id: string
    name: string
    updated_at: string
    deleted_at: string | null
  }>
}

/**
 * Những người mà phiên hiện tại được đọc nội dung - bản dịch của `can_read_content`.
 *
 *  - người lớn : chính mình.
 *  - trẻ em    : người tạo hồ sơ của em, cộng giáo viên của mọi lớp em đang học.
 *
 * Trả về `null` nghĩa là không giới hạn ai (không dùng tới, nhưng để rõ ý định).
 */
async function readableOwners(session: Session): Promise<string[]> {
  if (session.kind === 'adult') return [session.userId]

  const owners = new Set<string>()

  const owner = await db()
    .from('students')
    .select('owner_id')
    .eq('id', session.studentId)
    .maybeSingle()
  check(owner.error, 'Không đọc được chủ hồ sơ')
  if (owner.data?.owner_id) owners.add(owner.data.owner_id as string)

  const teachers = await db()
    .from('class_members')
    .select('classes(teacher_id)')
    .eq('student_id', session.studentId)
  check(teachers.error, 'Không đọc được giáo viên của lớp')
  for (const row of (teachers.data as unknown as Array<{ classes: { teacher_id: string } | null }> | null) ??
    []) {
    if (row.classes?.teacher_id) owners.add(row.classes.teacher_id)
  }

  return [...owners]
}

export async function pullContent(session: Session): Promise<RemoteContent> {
  const owners = await readableOwners(session)
  // Trẻ chưa thuộc lớp nào và hồ sơ không có chủ: không có gì để đọc. Gọi `.in()`
  // với mảng rỗng vẫn chạy, nhưng thoát sớm thì đỡ ba vòng đi lại vô ích.
  if (owners.length === 0) return { questions: [], hidden: [], skillNames: [] }

  const [questions, hidden, names] = await Promise.all([
    db()
      .from('custom_questions')
      .select('id, owner_id, skill_id, entry, updated_at, deleted_at')
      .in('owner_id', owners),
    db()
      .from('custom_hidden')
      .select('owner_id, skill_id, prompt, updated_at, deleted_at')
      .in('owner_id', owners),
    db()
      .from('custom_skill_names')
      .select('owner_id, skill_id, name, updated_at, deleted_at')
      .in('owner_id', owners),
  ])

  check(questions.error, 'Không tải được câu hỏi tự soạn')
  check(hidden.error, 'Không tải được danh sách câu đã ẩn')
  check(names.error, 'Không tải được tên kỹ năng tự đặt')

  return {
    questions: (questions.data ?? []) as RemoteContent['questions'],
    hidden: (hidden.data ?? []) as RemoteContent['hidden'],
    skillNames: (names.data ?? []) as RemoteContent['skillNames'],
  }
}

/** Những dòng trình duyệt muốn đẩy lên. `owner_id` CỐ Ý không có mặt ở đây. */
export interface ContentPush {
  questions: Array<{
    id: string
    skill_id: string
    entry: unknown
    updated_at: string
    deleted_at: string | null
  }>
  hidden: Array<{ skill_id: string; prompt: string; updated_at: string; deleted_at: string | null }>
  skillNames: Array<{ skill_id: string; name: string; updated_at: string; deleted_at: string | null }>
}

/**
 * Ghi nội dung của NGƯỜI LỚN đang đăng nhập.
 *
 * Trẻ trên máy dùng chung chỉ kéo về, không đẩy lên - trước đây RLS từ chối, và
 * từ chối thì màn hình lại báo lỗi cho một việc vốn không phải lỗi. Ở đây nơi
 * gọi chặn trước, nên trẻ không bao giờ tới được hàm này.
 */
export async function pushContent(ownerId: string, push: ContentPush): Promise<number> {
  const stamp = <T extends object>(rows: T[]) => rows.map((row) => ({ ...row, owner_id: ownerId }))

  if (push.questions.length > 0) {
    const { error } = await db()
      .from('custom_questions')
      .upsert(stamp(push.questions), { onConflict: 'id' })
    check(error, 'Không lưu được câu hỏi tự soạn')
  }
  if (push.hidden.length > 0) {
    const { error } = await db()
      .from('custom_hidden')
      .upsert(stamp(push.hidden), { onConflict: 'owner_id,skill_id,prompt' })
    check(error, 'Không lưu được danh sách câu đã ẩn')
  }
  if (push.skillNames.length > 0) {
    const { error } = await db()
      .from('custom_skill_names')
      .upsert(stamp(push.skillNames), { onConflict: 'owner_id,skill_id' })
    check(error, 'Không lưu được tên kỹ năng tự đặt')
  }

  return push.questions.length + push.hidden.length + push.skillNames.length
}
