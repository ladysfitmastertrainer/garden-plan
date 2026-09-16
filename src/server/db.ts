/**
 * Client Supabase chạy bằng khoá `service_role` - CỬA DUY NHẤT vào cơ sở dữ liệu.
 *
 * Khoá này bỏ qua toàn bộ Row Level Security. Trước đây trình duyệt tự nói
 * chuyện với Supabase bằng khoá `anon`, và RLS là thứ duy nhất đứng giữa một đứa
 * trẻ và dữ liệu của cả trường. Giờ thì trình duyệt không còn biết Supabase tồn
 * tại: nó gọi `/api/...`, và phân quyền do `guard.ts` quyết định bằng TypeScript
 * chạy ở đây - đọc được, test được, sửa được bằng một lần `git commit` thay vì
 * dán SQL vào Dashboard.
 *
 * RLS vẫn được giữ nguyên trong `supabase/migrations` làm LỚP THỨ HAI. Nó không
 * còn là nơi viết luật, nhưng nếu khoá `anon` có lọt ra ngoài thì nó vẫn đứng đó.
 */
import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

let client: SupabaseClient | null = null

export function db(): SupabaseClient {
  client ??= createClient(env.supabaseUrl(), env.serviceRoleKey(), {
    // Máy chủ không có "người đang đăng nhập" - mỗi yêu cầu tự mang danh tính
    // của nó trong cookie. Giữ phiên ở đây chỉ tổ lẫn người này sang người khác.
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

/**
 * Client DÙNG MỘT LẦN RỒI BỎ, chỉ để kiểm tra mật khẩu.
 *
 * Bẫy ở đây thật và khó thấy: gọi `signInWithPassword` trên client dùng chung ở
 * trên thì supabase-js ghi nhớ phiên vừa lấy được, và từ đó gắn token của NGƯỜI
 * DÙNG vào mọi truy vấn sau - thay cho khoá `service_role`. Cả máy chủ đột nhiên
 * tụt xuống quyền của người vừa đăng nhập, và lỗi sinh ra trông như RLS chặn
 * nhầm chứ không như một client bị nhiễm trạng thái.
 *
 * Một client mới cho mỗi lần kiểm mật khẩu thì không có gì để nhiễm.
 */
export function authClient(): SupabaseClient {
  return createClient(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Ném lỗi kèm câu tiếng Việt thay vì để lỗi Postgres thô lọt lên giao diện. */
export function check(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`)
}
