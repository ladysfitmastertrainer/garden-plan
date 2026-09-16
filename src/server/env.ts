/**
 * Biến môi trường của máy chủ, đọc một lần và kiểm tra ngay.
 *
 * `import 'server-only'` là một cái chốt cửa: nếu có ai lỡ tay import file này
 * từ một Client Component, build sẽ HỎNG NGAY với lời nhắn rõ ràng, thay vì âm
 * thầm gói khoá `service_role` vào gói JavaScript gửi xuống trình duyệt. Đó đúng
 * là tai nạn mà cả kiến trúc này sinh ra để tránh, nên nó đáng một dòng import.
 */
import 'server-only'

import { ConfigError } from './http'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new ConfigError(
      `Máy chủ chưa cấu hình xong: thiếu biến môi trường ${name}. ` +
        'Chép .env.example thành .env.local rồi điền vào, xem hướng dẫn trong supabase/README.md.',
    )
  }
  return value
}

/**
 * Đọc lười (lazy) chứ không đọc lúc nạp module.
 *
 * `next build` nạp mọi route để dựng trước trang; đọc thẳng ở tầng module là
 * build hỏng trên máy CI không có sẵn khoá, dù chẳng trang nào cần tới nó. Gọi
 * hàm thì lỗi chỉ nổ ra đúng lúc một yêu cầu thật sự cần khoá.
 */
export const env = {
  supabaseUrl: () => required('SUPABASE_URL'),
  /** Khoá bỏ qua toàn bộ RLS. CHỈ ĐƯỢC tồn tại trong tiến trình Node. */
  serviceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  /** Khoá ký cookie phiên. Đổi khoá này là mọi người bị đăng xuất. */
  sessionSecret: () => required('SESSION_SECRET'),
  /**
   * Địa chỉ thật của app, để dựng liên kết trong thư đặt lại mật khẩu.
   *
   * KHÔNG bắt buộc: bỏ trống thì lấy theo địa chỉ của chính yêu cầu đang xử lý,
   * đủ dùng khi chạy máy local. Nhưng khi đã lên máy chủ thật thì nên khai, vì
   * đứng sau một reverse proxy thì yêu cầu tới nơi thường mang `http` và tên máy
   * nội bộ - liên kết trong thư sẽ trỏ về một địa chỉ không ai mở được.
   */
  appUrl: () => process.env.APP_URL?.replace(/\/+$/, '') ?? null,
  isProduction: () => process.env.NODE_ENV === 'production',
}

/**
 * Địa chỉ gốc để quay về sau khi bấm liên kết trong thư.
 *
 * `APP_URL` thắng nếu có. Không có thì lấy từ yêu cầu - đây là giá trị do trình
 * duyệt gửi lên nên về nguyên tắc là không đáng tin, nhưng nó KHÔNG tự quyết
 * định được thư đi đâu: Supabase chỉ chấp nhận những địa chỉ đã khai trong
 * Authentication → URL Configuration → Redirect URLs, mọi thứ khác bị nó rơi về
 * Site URL. Danh sách đó mới là thứ chặn thật.
 */
export function appOrigin(req: Request): string {
  const configured = env.appUrl()
  if (configured) return configured

  const header = req.headers.get('origin')
  if (header) return header.replace(/\/+$/, '')

  return new URL(req.url).origin
}
