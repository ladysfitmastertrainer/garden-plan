/**
 * Đọc trạng thái một trận đấu.
 *
 * Đây là đường bị gọi nhiều nhất trong cả app: hai máy hỏi lại vài lần một giây
 * suốt trận. Nên nó chỉ ĐỌC - mọi thứ làm thay đổi trận đều nằm ở ba đường con
 * bên cạnh (`respond`, `buzz`, `abandon`).
 */

import { requireWriteStudent } from '@/server/guard'
import { badRequest, route } from '@/server/http'
import { currentMatch, lastFinishedMatch, sweepStaleRound } from '@/server/pvp'

type Ctx = { params: Promise<{ id: string }> }

export const GET = route<Ctx>(async (req, ctx) => {
  const { id } = await ctx.params
  const studentId = new URL(req.url).searchParams.get('studentId')
  if (!studentId) throw badRequest('Thiếu hồ sơ học sinh.')
  await requireWriteStudent(studentId)

  /*
    Dọn vòng bị treo TRƯỚC khi đọc.

    Đây là đường bị gọi liên tục suốt trận, nên nó cũng là chỗ duy nhất chắc chắn
    có người ghé qua khi một bên đã biến mất - xem `sweepStaleRound`. Không có ai
    quét nền chạy riêng, và với một tính năng cỡ này thì dựng một cái như thế là
    thừa: bên còn lại đang hỏi lại mỗi 700 mili giây, đủ để tự dọn chỗ cho mình.
  */
  await sweepStaleRound(id)

  /*
    Trả về trận ĐANG đánh, hoặc trận VỪA XONG nếu không còn trận nào đang đánh.

    Nhánh thứ hai nghe thừa nhưng không hề: trận kết thúc rơi khỏi `currentMatch`
    ngay lập tức, nên máy của bên thua - vốn đang hỏi lại chứ không cầm kết quả
    trong tay - sẽ nhận về `null` và trận đấu biến mất không một lời nào, đúng
    vào lúc cần một lời giải thích nhất.
  */
  const active = await currentMatch(studentId)
  return { match: active ?? (await lastFinishedMatch(studentId)) }
})
