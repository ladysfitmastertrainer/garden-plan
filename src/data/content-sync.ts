/**
 * Đồng bộ nội dung tự soạn với Supabase.
 *
 * Khác hẳn `syncing.ts`: ở đó là dữ liệu học tập của TRẺ, ghi liên tục giữa trận
 * và tuyệt đối không được chờ mạng. Ở đây là nội dung do NGƯỜI LỚN soạn - vài
 * lần một buổi, ngồi trước bàn phím, và chờ một giây là chấp nhận được. Nên
 * không cần hàng đợi ngoài: đẩy thẳng, lỗi thì báo thẳng.
 *
 * Một lần đồng bộ gồm ba bước, theo đúng thứ tự:
 *
 *   1. KÉO VỀ  - lấy mọi dòng của những người mình được phép đọc.
 *   2. HỢP NHẤT - `mergeContent` quyết bản nào thắng, theo mốc thời gian.
 *   3. ĐẨY LÊN  - gửi những dòng CỦA MÌNH mà máy chủ chưa có hoặc đang cũ hơn.
 *
 * Kéo trước rồi mới đẩy, để nếu máy khác vừa xoá một câu thì lệnh xoá đó tới nơi
 * trước khi máy này kịp đẩy bản cũ của câu ấy lên lại.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getCustomContent,
  keyId,
  mergeContent,
  replaceContent,
  sanitiseContent,
  setContentOwner,
  stampOwner,
  type CustomContent,
  type CustomRow,
} from '../content/custom'

export interface ContentSyncResult {
  /** Số câu còn sống sau khi hợp nhất. */
  questions: number
  /** Số dòng đã gửi lên. */
  pushed: number
  /** Số dòng nhận về từ máy khác. */
  pulled: number
}

/** Hàng lấy từ máy chủ, trước khi ép về dạng của kho cục bộ. */
interface RemoteRow {
  id: string
  owner_id: string
  skill_id: string
  updated_at: string
  deleted_at: string | null
}

interface RemoteQuestion extends RemoteRow {
  entry: unknown
}

const millis = (iso: string | null): number | null => {
  if (!iso) return null
  const value = Date.parse(iso)
  return Number.isFinite(value) ? value : null
}

const iso = (ms: number | null): string | null => (ms === null ? null : new Date(ms).toISOString())

/**
 * Kéo mọi dòng đọc được về.
 *
 * KHÔNG lọc theo `owner_id`: RLS đã lo việc đó, và lọc thêm ở client thì trẻ
 * trên máy dùng chung sẽ không nhận được nội dung cô giáo soạn - các em đọc
 * được chính là nhờ luật lớp học trong `can_read_content`.
 */
async function pullAll(supabase: SupabaseClient): Promise<CustomContent> {
  const [questions, hidden, names] = await Promise.all([
    supabase.from('custom_questions').select('id, owner_id, skill_id, entry, updated_at, deleted_at'),
    supabase.from('custom_hidden').select('owner_id, skill_id, prompt, updated_at, deleted_at'),
    supabase.from('custom_skill_names').select('owner_id, skill_id, name, updated_at, deleted_at'),
  ])

  const failure = questions.error ?? hidden.error ?? names.error
  if (failure) throw new Error(failure.message)

  // `hidden` và `custom_skill_names` không có cột id riêng - khoá chính là
  // (owner, skill, prompt). Dựng lại id cục bộ từ khoá đó, để hai máy cùng sinh
  // ra đúng một id cho cùng một dòng và `mergeContent` khớp được chúng.
  return sanitiseContent({
    questions: (questions.data ?? []).map((row) => {
      const remote = row as unknown as RemoteQuestion
      return {
        id: remote.id,
        skillId: remote.skill_id,
        value: remote.entry,
        updatedAt: millis(remote.updated_at) ?? 0,
        deletedAt: millis(remote.deleted_at),
        ownerId: remote.owner_id,
      }
    }),
    hidden: (hidden.data ?? []).map((row) => {
      const remote = row as unknown as RemoteRow & { prompt: string }
      return {
        id: keyId('hidden', remote.skill_id, remote.prompt),
        skillId: remote.skill_id,
        value: remote.prompt,
        updatedAt: millis(remote.updated_at) ?? 0,
        deletedAt: millis(remote.deleted_at),
        ownerId: remote.owner_id,
      }
    }),
    skillNames: (names.data ?? []).map((row) => {
      const remote = row as unknown as RemoteRow & { name: string }
      return {
        id: keyId('name', remote.skill_id, ''),
        skillId: remote.skill_id,
        value: remote.name,
        updatedAt: millis(remote.updated_at) ?? 0,
        deletedAt: millis(remote.deleted_at),
        ownerId: remote.owner_id,
      }
    }),
  })
}

export async function syncCustomContent(supabase: SupabaseClient): Promise<ContentSyncResult> {
  const { data: auth } = await supabase.auth.getUser()
  const ownerId = auth.user?.id
  if (!ownerId) throw new Error('Chưa đăng nhập')

  setContentOwner(ownerId)
  const before = getCustomContent()
  const remote = await pullAll(supabase)
  const merged = mergeContent(before, remote)
  replaceContent(merged)

  const pulled = countNew(before, remote)

  // Chỉ người lớn mới có hồ sơ trong `profiles`, và RLS chỉ cho họ ghi. Trẻ trên
  // máy dùng chung kéo về là xong - đẩy lên sẽ bị từ chối, mà từ chối thì màn
  // hình lại báo lỗi cho một việc vốn không phải lỗi.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', ownerId)
    .maybeSingle()

  if (!profile) {
    return { questions: alive(merged.questions).length, pushed: 0, pulled }
  }

  const pushed = await pushAll(supabase, ownerId, merged, remote)
  return { questions: alive(merged.questions).length, pushed, pulled }
}

const alive = <T>(rows: Array<CustomRow<T>>) => rows.filter((row) => row.deletedAt === null)

/** Đếm những dòng máy chủ có mà máy này chưa biết, hoặc đang giữ bản cũ hơn. */
function countNew(mine: CustomContent, theirs: CustomContent): number {
  const known = new Map<string, number>()
  for (const group of [mine.questions, mine.hidden, mine.skillNames]) {
    for (const row of group) known.set(row.id, row.updatedAt)
  }

  let count = 0
  for (const group of [theirs.questions, theirs.hidden, theirs.skillNames]) {
    for (const row of group) {
      const seen = known.get(row.id)
      if (seen === undefined || row.updatedAt > seen) count++
    }
  }
  return count
}

/**
 * Đẩy những dòng của mình mà máy chủ chưa có hoặc đang cũ hơn.
 *
 * Chỉ gửi phần CHÊNH LỆCH. Gửi tất cả mỗi lần thì một cô giáo có hai trăm câu sẽ
 * nhá lên mạng hai trăm dòng mỗi lần bấm nút, và ở lớp học dùng 3G thì đó là
 * chuyện có thật.
 */
async function pushAll(
  supabase: SupabaseClient,
  ownerId: string,
  merged: CustomContent,
  remote: CustomContent,
): Promise<number> {
  const remoteAt = new Map<string, number>()
  for (const group of [remote.questions, remote.hidden, remote.skillNames]) {
    for (const row of group) remoteAt.set(row.id, row.updatedAt)
  }

  /**
   * Đẩy được không: phải MỚI HƠN bản trên máy chủ, VÀ phải là của mình.
   *
   * Vế thứ hai mới là vế quan trọng. Máy này còn giữ cả nội dung kéo về của
   * người khác - học sinh có câu cô giáo soạn, phụ huynh có câu của chính mình
   * gửi từ máy khác. Đẩy bừa lên dưới tên mình thì hoặc là chép trộm bài người
   * khác, hoặc bị máy chủ từ chối và cả lần đồng bộ hỏng theo.
   */
  const canPush = <T>(row: CustomRow<T>) => {
    if (row.ownerId !== null && row.ownerId !== ownerId) return false
    const there = remoteAt.get(row.id)
    return there === undefined || row.updatedAt > there
  }

  const questions = merged.questions.filter(canPush).map((row) => ({
    id: row.id,
    owner_id: ownerId,
    skill_id: row.skillId,
    entry: row.value,
    updated_at: new Date(row.updatedAt).toISOString(),
    deleted_at: iso(row.deletedAt),
  }))

  const hidden = merged.hidden.filter(canPush).map((row) => ({
    owner_id: ownerId,
    skill_id: row.skillId,
    prompt: row.value,
    updated_at: new Date(row.updatedAt).toISOString(),
    deleted_at: iso(row.deletedAt),
  }))

  const names = merged.skillNames.filter(canPush).map((row) => ({
    owner_id: ownerId,
    skill_id: row.skillId,
    name: row.value,
    updated_at: new Date(row.updatedAt).toISOString(),
    deleted_at: iso(row.deletedAt),
  }))

  if (questions.length > 0) {
    const { error } = await supabase.from('custom_questions').upsert(questions, { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }
  if (hidden.length > 0) {
    const { error } = await supabase
      .from('custom_hidden')
      .upsert(hidden, { onConflict: 'owner_id,skill_id,prompt' })
    if (error) throw new Error(error.message)
  }
  if (names.length > 0) {
    const { error } = await supabase
      .from('custom_skill_names')
      .upsert(names, { onConflict: 'owner_id,skill_id' })
    if (error) throw new Error(error.message)
  }

  // Đóng dấu những dòng vừa gửi đi. Lần đồng bộ sau chúng đã có chủ, nên không
  // bị đẩy lại, và trang quản trị biết đây là của mình chứ không phải hàng kéo
  // về chỉ đọc.
  stampOwner(
    new Set([
      ...merged.questions.filter(canPush).map((row) => row.id),
      ...merged.hidden.filter(canPush).map((row) => row.id),
      ...merged.skillNames.filter(canPush).map((row) => row.id),
    ]),
    ownerId,
  )

  return questions.length + hidden.length + names.length
}
