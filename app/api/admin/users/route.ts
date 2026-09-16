/**
 * Tài khoản người lớn. Thay cho Edge Function `admin-users`.
 *
 * Xem và tạo: quản trị viên HOẶC giáo viên. Sửa, xoá, đặt lại mật khẩu: chỉ quản
 * trị viên - xem `src/server/accounts.ts` để biết vì sao chia như vậy.
 */

import { createAccount, listAccounts } from '@/server/accounts'
import { requireStaff } from '@/server/guard'
import { readJson, requireEmail, requireText, route } from '@/server/http'

export const GET = route(async () => {
  await requireStaff()
  return { users: await listAccounts() }
})

export const POST = route(async (req) => {
  const caller = await requireStaff()
  const body = await readJson<{ email?: string; displayName?: string; role?: string }>(req)

  return createAccount(caller, {
    email: requireEmail(body.email),
    displayName: requireText(body.displayName, 'Tên hiển thị'),
    role: body.role,
  })
})
