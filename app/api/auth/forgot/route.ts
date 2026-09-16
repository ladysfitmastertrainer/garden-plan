/**
 * Quên mật khẩu: gửi thư kèm liên kết đặt lại.
 *
 * Supabase vẫn là bên gửi thư - nó giữ mật khẩu, nó có sẵn máy chủ thư đã cấu
 * hình, và nó biết token nào hợp lệ. Khác bản cũ ở chỗ lời gọi này xuất phát từ
 * MÁY CHỦ chứ không từ trình duyệt, và liên kết trong thư quay về một trang của
 * app (`/dat-lai-mat-khau`) chứ không về đâu khác.
 *
 * HAI ĐIỀU KIỆN để nó chạy được, cả hai đều nằm trong Dashboard của Supabase:
 *
 *   1. Authentication → Emails → SMTP Settings đã cắm một cổng gửi thư giao dịch
 *      (đường gửi chung của Supabase chỉ vài thư/giờ cho cả dự án - đủ để nghịch,
 *      không đủ cho một trường).
 *   2. Authentication → URL Configuration → Redirect URLs có mặt địa chỉ
 *      `<địa-chỉ-app>/dat-lai-mat-khau`. Thiếu dòng này là Supabase lặng lẽ thả
 *      người dùng về Site URL, và triệu chứng trông y hệt "thư không tới".
 *
 * Xem supabase/README.md mục 5.
 */

import { appOrigin } from '@/server/env'
import { authClient } from '@/server/db'
import { readJson, requireEmail, route } from '@/server/http'

export const POST = route(async (req) => {
  const body = await readJson<{ email?: string }>(req)
  const email = requireEmail(body.email)

  const { error } = await authClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin(req)}/dat-lai-mat-khau`,
  })

  /*
    Lỗi của máy chủ thư thì PHẢI nói ra - im lặng ở đây là để người dùng ngồi chờ
    một lá thư không bao giờ tới. Nhưng lời nhắn phải chỉ sang lối đi được, chứ
    "lỗi máy chủ" rồi thôi là bỏ họ đứng đó.
  */
  if (error && /smtp|sending|rate limit|too many/i.test(error.message)) {
    throw new Error(error.message)
  }

  /*
    Mọi trường hợp còn lại trả về CÙNG một câu, kể cả khi địa chỉ này chưa có tài
    khoản nào. Trả lời khác nhau là biến ô "quên mật khẩu" thành công cụ dò xem
    ai đang dùng hệ thống - mà đây là app của trẻ con, danh sách phụ huynh và
    giáo viên của một trường không phải thứ để người lạ tra.

    Lời nhắn vì thế viết "Nếu ... là địa chỉ của một tài khoản", không viết chắc
    "đã gửi" - nói chắc là nói sai một nửa số lần.
  */
  return {
    notice:
      `Nếu ${email} là địa chỉ của một tài khoản, thư đặt lại mật khẩu vừa được gửi tới đó.\n` +
      'Mở thư rồi bấm vào liên kết trong đó nhé. Nhớ ngó cả hộp thư rác.',
  }
})
