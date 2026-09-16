/**
 * Một chỗ duy nhất để gọi `/api`.
 *
 * Trình duyệt không còn biết Supabase tồn tại: không khoá `anon`, không thư viện
 * `@supabase/supabase-js` trong gói tải về (riêng nó đã 250 KB), không token nằm
 * trong `localStorage`. Chỉ có `fetch` tới chính tên miền của app, và cookie
 * `httpOnly` do máy chủ phát thì trình duyệt tự đính kèm.
 *
 * Mọi lỗi ra khỏi đây đều là `Error` có lời nhắn TIẾNG VIỆT đã sẵn sàng hiện lên
 * màn hình - máy chủ đã dịch rồi (xem `src/server/http.ts`). Giao diện chỉ việc
 * `catch` và hiện `error.message`, không phải đoán ý một mã lỗi nào nữa.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Phiên đã hết hạn hoặc chưa đăng nhập - nơi gọi thường muốn quay về màn đăng nhập. */
export const isUnauthorized = (cause: unknown): boolean =>
  cause instanceof ApiError && cause.status === 401

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Tham số trên địa chỉ, cho các route đọc. */
  query?: Record<string, string | number>
}

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, query } = options

  const url = new URL(path, typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, String(value))

  let response: Response
  try {
    response = await fetch(url.pathname + url.search, {
      method,
      // Cookie phiên nằm cùng tên miền. `same-origin` là mặc định của `fetch`
      // hiện đại, nhưng viết ra để lần sau không ai phải đi tra.
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    // `fetch` chỉ ném khi không nối được máy chủ. Mọi mã lỗi HTTP đều đi tiếp
    // xuống dưới, nên chỗ này luôn là "mất mạng" chứ không phải lỗi của app.
    throw new ApiError(0, 'Không nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại nhé.')
  }

  // 204 không có thân. Đọc `.json()` trên nó là ném lỗi, và lỗi đó sẽ trông như
  // máy chủ hỏng trong khi mọi thứ vừa chạy đúng.
  const payload =
    response.status === 204 ? {} : ((await response.json().catch(() => ({}))) as { error?: string })

  if (!response.ok) {
    throw new ApiError(response.status, payload.error ?? `Máy chủ trả về lỗi ${response.status}.`)
  }

  return payload as T
}
