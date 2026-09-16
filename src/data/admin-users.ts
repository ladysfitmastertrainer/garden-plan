/**
 * Gọi API quản lý tài khoản người lớn.
 *
 * Mọi việc thật xảy ra phía máy chủ - xem `src/server/accounts.ts`. File này chỉ
 * gửi yêu cầu. Nó KHÔNG tự kiểm ai là admin: kiểm ở trình duyệt chỉ để giao diện
 * gọn mắt, còn chặn thật thì phải chặn ở nơi người dùng không sửa được.
 *
 * Bản trước gọi Edge Function qua `supabase.functions.invoke`, và phải tự moi
 * lời nhắn lỗi ra khỏi lớp vỏ mà `invoke` bọc quanh nó - không moi thì admin chỉ
 * thấy "Edge Function returned a non-2xx status". Giờ lỗi về thẳng dưới dạng câu
 * tiếng Việt, nên cả đoạn đó biến mất.
 */

import { request } from './request'

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

export async function listAccounts(): Promise<AdultAccount[]> {
  const { users } = await request<{ users: AdultAccount[] }>('/api/admin/users')
  return users
}

export async function createAccount(input: {
  email: string
  displayName: string
  role: string
}): Promise<CreatedAccount> {
  return request<CreatedAccount>('/api/admin/users', { method: 'POST', body: input })
}

export async function resetAccountPassword(userId: string): Promise<string> {
  const { password } = await request<{ password: string }>(`/api/admin/users/${userId}/password`, {
    method: 'POST',
  })
  return password
}

export async function updateAccount(input: {
  userId: string
  displayName: string
  email: string
  role: string
}): Promise<void> {
  const { userId, ...rest } = input
  await request(`/api/admin/users/${userId}`, { method: 'PATCH', body: rest })
}

/**
 * Xoá hẳn một tài khoản người lớn.
 *
 * Kéo theo lớp, học sinh và toàn bộ tiến độ học của từng em - khoá ngoại nối
 * tầng. Nơi gọi PHẢI hỏi lại người dùng kèm con số cụ thể trước khi chạm vào đây.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await request(`/api/admin/users/${userId}`, { method: 'DELETE' })
}
