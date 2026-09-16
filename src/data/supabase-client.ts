/**
 * Client Supabase, nạp động.
 *
 * Cấu hình qua biến môi trường (xem `.env.example`). Nếu CHƯA cấu hình, app vẫn
 * chạy bình thường ở chế độ offline hoàn toàn - đây là chủ ý: người mới clone
 * repo về phải chạy được ngay mà không cần lập dự án Supabase, và lớp học mất
 * mạng vẫn dùng được.
 *
 * Thư viện `@supabase/supabase-js` nặng khoảng 250 KB nên được `import()` động:
 * ai chơi offline thì không phải tải về thứ mình không bao giờ dùng.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

let clientPromise: Promise<SupabaseClient> | null = null

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return Promise.resolve(null)

  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        /*
          PHẢI bật, nếu không mọi liên kết gửi qua email đều hỏng.

          Bấm "xác nhận email" hay "đặt lại mật khẩu" thì Supabase xác thực xong
          sẽ trả người dùng về app kèm token trong phần "#" của địa chỉ. Đặt
          `false` là client ném thẳng token đó đi: người ta bấm xác nhận, quay về
          app, và thấy y như chưa làm gì cả.

          Bản đầu đặt `false` vì sợ phiên của trẻ lẫn vào địa chỉ trên máy tính
          bảng dùng chung. Lo đó đúng, nhưng chặn nhầm chỗ: supabase-js tự XOÁ
          token khỏi địa chỉ ngay sau khi đọc, nên nó không nằm lại trong lịch sử
          trình duyệt. Mà trẻ thì vào bằng mã lớp và mã PIN, không bao giờ nhận
          được liên kết email nào.
        */
        detectSessionInUrl: true,
      },
    }),
  )
  return clientPromise
}

/** Dùng khi đã chắc chắn Supabase được cấu hình. */
export async function requireSupabase(): Promise<SupabaseClient> {
  const supabase = await getSupabase()
  if (!supabase) {
    throw new Error(
      'Chưa cấu hình Supabase. Đặt VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong .env.local',
    )
  }
  return supabase
}
