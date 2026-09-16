/**
 * Nội dung tự soạn: kéo về và đẩy lên.
 *
 * Phần hợp nhất theo mốc thời gian vẫn nằm ở trình duyệt (`src/data/content-sync.ts`).
 * Ở đây chỉ làm hai việc mà chỉ máy chủ làm được: lọc theo quyền đọc, và đóng
 * dấu chủ sở hữu lên mọi dòng ghi xuống.
 */

import { pullContent, pushContent, type ContentPush } from '@/server/content'
import { requireAdult, requireSession } from '@/server/guard'
import { readJson, route } from '@/server/http'

export const GET = route(async () => {
  const session = await requireSession()

  /*
    Trả về luôn `ownerId` - id của chính người đang gọi, `null` nếu là trẻ.

    Bước hợp nhất ở trình duyệt cần nó để biết dòng nào là CỦA MÌNH và được phép
    đẩy lên lại. Máy của một cô giáo còn giữ cả nội dung kéo về của người khác;
    đẩy bừa lên dưới tên mình thì hoặc là chép bài người ta, hoặc bị máy chủ từ
    chối và cả lần đồng bộ hỏng theo.
  */
  const ownerId = session.kind === 'adult' ? session.userId : null
  return { ownerId, ...(await pullContent(session)) }
})

export const POST = route(async (req) => {
  // Trẻ trên máy dùng chung chỉ kéo về. `requireAdult` chặn ngay ở đây.
  const adult = await requireAdult()
  const body = await readJson<Partial<ContentPush>>(req)

  const pushed = await pushContent(adult.userId, {
    questions: body.questions ?? [],
    hidden: body.hidden ?? [],
    skillNames: body.skillNames ?? [],
  })
  return { pushed }
})
