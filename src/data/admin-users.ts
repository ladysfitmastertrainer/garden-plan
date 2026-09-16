/**
 * Gọi Edge Function quản lý tài khoản người lớn.
 *
 * Mọi việc thật xảy ra phía máy chủ - xem `supabase/functions/admin-users`. File
 * này chỉ gửi yêu cầu kèm token của người đang đăng nhập và dịch lỗi sang tiếng
 * Việt. Nó KHÔNG tự kiểm ai là admin: kiểm ở trình duyệt chỉ để giao diện gọn
 * mắt, còn chặn thật thì phải chặn ở nơi người dùng không sửa được.
 */

import { getSupabase } from './supabase-client'

export interface AdultAccount {
  id: string
  email: string
  displayName: string
  role: string
  createdAt: string
  /** Số hồ sơ trẻ thuộc về người này - xoá tài khoản là xoá theo cả chúng. */
  students: number
  /** Số lớp người này đang dạy - cũng mất theo. */
  classes: number
}

export interface CreatedAccount {
  password: string
  user: { id: string; email: string; displayName: string; role: string }
}

/** Dịch những lỗi hay gặp; còn lại giữ nguyên còn hơn đoán sai. */
function translate(raw: string): string {
  if (/failed to fetch|network/i.test(raw)) {
    return 'Không gọi được máy chủ. Kiểm tra mạng, và kiểm tra hàm admin-users đã được triển khai chưa.'
  }
  if (/not found|404/i.test(raw)) {
    return 'Chưa có hàm admin-users trên Supabase. Xem hướng dẫn triển khai trong supabase/README.md.'
  }
  return raw
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Máy này chưa cấu hình Supabase.')

  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('Bạn cần đăng nhập trước.')

  const { data, error } = await supabase.functions.invoke('admin-users', { body })

  if (error) {
    // `invoke` gói lỗi HTTP lại, nên lời nhắn thật của hàm nằm trong phần thân -
    // không moi ra thì admin chỉ thấy "Edge Function returned a non-2xx status".
    const detail = await readError(error)
    throw new Error(translate(detail ?? error.message))
  }

  const payload = data as { error?: string } & T
  if (payload?.error) throw new Error(translate(payload.error))
  return payload
}

async function readError(error: unknown): Promise<string | null> {
  const response = (error as { context?: Response }).context
  if (!response || typeof response.json !== 'function') return null
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? null
  } catch {
    return null
  }
}

export async function listAccounts(): Promise<AdultAccount[]> {
  const { users } = await call<{ users: AdultAccount[] }>({ action: 'list' })
  return users
}

export async function createAccount(input: {
  email: string
  displayName: string
  role: string
}): Promise<CreatedAccount> {
  return call<CreatedAccount>({ action: 'create', ...input })
}

export async function resetAccountPassword(userId: string): Promise<string> {
  const { password } = await call<{ password: string }>({ action: 'reset', userId })
  return password
}

export async function updateAccount(input: {
  userId: string
  displayName: string
  email: string
  role: string
}): Promise<void> {
  await call<{ ok: true }>({ action: 'update', ...input })
}

/**
 * Xoá hẳn một tài khoản người lớn.
 *
 * Kéo theo lớp, học sinh và toàn bộ tiến độ học của từng em - khoá ngoại nối
 * tầng. Nơi gọi PHẢI hỏi lại người dùng kèm con số cụ thể trước khi chạm vào đây.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await call<{ ok: true }>({ action: 'delete', userId })
}
