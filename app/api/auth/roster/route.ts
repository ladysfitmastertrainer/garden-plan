/**
 * Danh sách lớp để trẻ chọn ảnh đại diện của mình.
 *
 * Route DUY NHẤT không cần đăng nhập, vì đây là bước đầu tiên của trẻ trên máy
 * dùng chung - lúc đó em chưa có phiên nào cả.
 */

import { loadRoster } from '@/server/classes'
import { readJson, requireText, route } from '@/server/http'

export const POST = route(async (req) => {
  const body = await readJson<{ classCode?: string }>(req)
  const classCode = requireText(body.classCode, 'Mã lớp')
  return { roster: await loadRoster(classCode) }
})
