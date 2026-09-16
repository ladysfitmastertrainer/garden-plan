/**
 * Đồng bộ nội dung tự soạn với máy chủ.
 *
 * Đây là thứ DUY NHẤT còn giữ luật hợp nhất ở phía trình duyệt, và có lý do: nội
 * dung tự soạn nằm trong kho cục bộ (`content/custom.ts`) để trang quản trị sửa
 * được ngay không phải chờ mạng, nên hai bên vẫn có thể lệch nhau.
 *
 * Nó khác hẳn dữ liệu học tập của TRẺ - thứ đó ghi thẳng qua API, không hàng đợi,
 * không hợp nhất (xem `api.ts`). Ở đây là nội dung do NGƯỜI LỚN soạn: vài lần một
 * buổi, ngồi trước bàn phím, và chờ một giây là chấp nhận được. Nên không cần
 * hàng đợi ngoài: đẩy thẳng, lỗi thì báo thẳng.
 *
 * Một lần đồng bộ gồm ba bước, theo đúng thứ tự:
 *
 *   1. KÉO VỀ  - lấy mọi dòng máy chủ cho phép mình đọc.
 *   2. HỢP NHẤT - `mergeContent` quyết bản nào thắng, theo mốc thời gian.
 *   3. ĐẨY LÊN  - gửi những dòng CỦA MÌNH mà máy chủ chưa có hoặc đang cũ hơn.
 *
 * Kéo trước rồi mới đẩy, để nếu máy khác vừa xoá một câu thì lệnh xoá đó tới nơi
 * trước khi máy này kịp đẩy bản cũ của câu ấy lên lại.
 */

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
import { request } from './request'

export interface ContentSyncResult {
  /** Số câu còn sống sau khi hợp nhất. */
  questions: number
  /** Số dòng đã gửi lên. */
  pushed: number
  /** Số dòng nhận về từ máy khác. */
  pulled: number
}

/** Hình dạng máy chủ trả về - vẫn giữ tên cột của bảng. */
interface PullResponse {
  /** Id của chính người đang gọi; `null` khi là trẻ trên máy dùng chung. */
  ownerId: string | null
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

const millis = (iso: string | null): number | null => {
  if (!iso) return null
  const value = Date.parse(iso)
  return Number.isFinite(value) ? value : null
}

const iso = (ms: number | null): string | null => (ms === null ? null : new Date(ms).toISOString())

/**
 * Ép dữ liệu máy chủ về dạng của kho cục bộ.
 *
 * `hidden` và `custom_skill_names` không có cột id riêng - khoá chính là
 * (owner, skill, prompt). Dựng lại id cục bộ từ khoá đó, để hai máy cùng sinh ra
 * đúng một id cho cùng một dòng và `mergeContent` khớp được chúng.
 */
function toLocal(remote: PullResponse): CustomContent {
  return sanitiseContent({
    questions: remote.questions.map((row) => ({
      id: row.id,
      skillId: row.skill_id,
      value: row.entry,
      updatedAt: millis(row.updated_at) ?? 0,
      deletedAt: millis(row.deleted_at),
      ownerId: row.owner_id,
    })),
    hidden: remote.hidden.map((row) => ({
      id: keyId('hidden', row.skill_id, row.prompt),
      skillId: row.skill_id,
      value: row.prompt,
      updatedAt: millis(row.updated_at) ?? 0,
      deletedAt: millis(row.deleted_at),
      ownerId: row.owner_id,
    })),
    skillNames: remote.skillNames.map((row) => ({
      id: keyId('name', row.skill_id, ''),
      skillId: row.skill_id,
      value: row.name,
      updatedAt: millis(row.updated_at) ?? 0,
      deletedAt: millis(row.deleted_at),
      ownerId: row.owner_id,
    })),
  })
}

export async function syncCustomContent(): Promise<ContentSyncResult> {
  const response = await request<PullResponse>('/api/content')

  const before = getCustomContent()
  const remote = toLocal(response)
  const merged = mergeContent(before, remote)
  replaceContent(merged)

  const pulled = countNew(before, remote)
  const ownerId = response.ownerId

  // Trẻ trên máy dùng chung kéo về là xong. Máy chủ cũng từ chối nếu cố đẩy, mà
  // từ chối thì màn hình lại báo lỗi cho một việc vốn không phải lỗi.
  if (!ownerId) return { questions: alive(merged.questions).length, pushed: 0, pulled }

  setContentOwner(ownerId)
  const pushed = await pushAll(ownerId, merged, remote)
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
   * gửi từ máy khác. Máy chủ cũng đóng dấu `owner_id` lại một lần nữa khi ghi,
   * nên đây chỉ là lọc cho đỡ tốn đường truyền; nhưng lọc đúng thì một cô giáo
   * không vô tình gửi bài của đồng nghiệp lên dưới tên mình.
   */
  const canPush = <T>(row: CustomRow<T>) => {
    if (row.ownerId !== null && row.ownerId !== ownerId) return false
    const there = remoteAt.get(row.id)
    return there === undefined || row.updatedAt > there
  }

  const questions = merged.questions.filter(canPush).map((row) => ({
    id: row.id,
    skill_id: row.skillId,
    entry: row.value,
    updated_at: new Date(row.updatedAt).toISOString(),
    deleted_at: iso(row.deletedAt),
  }))

  const hidden = merged.hidden.filter(canPush).map((row) => ({
    skill_id: row.skillId,
    prompt: row.value,
    updated_at: new Date(row.updatedAt).toISOString(),
    deleted_at: iso(row.deletedAt),
  }))

  const skillNames = merged.skillNames.filter(canPush).map((row) => ({
    skill_id: row.skillId,
    name: row.value,
    updated_at: new Date(row.updatedAt).toISOString(),
    deleted_at: iso(row.deletedAt),
  }))

  if (questions.length + hidden.length + skillNames.length === 0) return 0

  const { pushed } = await request<{ pushed: number }>('/api/content', {
    method: 'POST',
    body: { questions, hidden, skillNames },
  })

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

  return pushed
}
