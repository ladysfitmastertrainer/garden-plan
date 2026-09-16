/**
 * Tạo và quản lý tài khoản người lớn, thay cho việc tự đăng ký.
 *
 * Đây là Edge Function `supabase/functions/admin-users` cũ, chuyển nguyên luật
 * sang Node. Lý do nó từng phải là Edge Function: tạo tài khoản hộ người khác
 * cần khoá `service_role`, và app hồi đó là trang tĩnh nên không có "phía máy
 * chủ" nào ngoài Supabase. Giờ có rồi, nên đoạn mã này về đúng chỗ của nó - cùng
 * kho, cùng TypeScript, cùng một lệnh chạy, không còn deploy riêng bằng Deno.
 *
 * Tài khoản tạo ra mang `email_confirm: true` - ĐÃ XÁC NHẬN SẴN. Nhờ vậy cả
 * luồng này không gửi lá thư nào, nên không phụ thuộc vào SMTP. Mật khẩu sinh
 * ngẫu nhiên và trả về cho màn hình admin xem đúng một lần.
 */
import 'server-only'

import { randomInt } from 'node:crypto'
import { check, db } from './db'
import { badRequest } from './http'
import { cleanRole, type Adult, type AdultRole } from './guard'

export interface AdultAccount {
  id: string
  email: string
  displayName: string
  role: AdultRole
  createdAt: string
  /** Số hồ sơ trẻ thuộc về người này - xoá tài khoản là xoá theo cả chúng. */
  students: number
  /** Số lớp người này đang dạy - cũng mất theo. */
  classes: number
}

/**
 * Mật khẩu dễ đọc cho người, đủ khó cho máy.
 *
 * Bỏ những ký tự dễ đọc nhầm khi chép tay hoặc đọc qua điện thoại: O và 0, I và
 * l và 1. Admin sẽ đọc chuỗi này cho cô giáo nghe, nên một ký tự mơ hồ là một
 * lần gọi lại.
 *
 * `randomInt` của Node lấy số ngẫu nhiên KHÔNG LỆCH trong khoảng cho trước. Bản
 * Deno cũ dùng `byte % alphabet.length`, mà 256 không chia hết cho 56 nên vài ký
 * tự đầu bảng xuất hiện nhiều hơn số còn lại - lệch nhỏ, nhưng đây là mật khẩu
 * nên sửa luôn.
 */
export function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 14 }, () => alphabet[randomInt(alphabet.length)]).join('')
}

// --- Xem danh sách ---------------------------------------------------------------

export async function listAccounts(): Promise<AdultAccount[]> {
  const { data, error } = await db()
    .from('profiles')
    .select('id, display_name, role, created_at')
    .order('created_at', { ascending: false })
  check(error, 'Không tải được danh sách tài khoản')

  // `profiles` không giữ email - nó nằm ở `auth.users`. Ghép lại để admin nhận
  // ra ai là ai; tên hiển thị thì trùng nhau như cơm bữa.
  const { data: users } = await db().auth.admin.listUsers({ page: 1, perPage: 1000 })
  const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? '']))

  /*
    Đếm học sinh và lớp của từng người.

    Không phải để trang trí: xoá một người lớn là xoá theo CẢ học sinh, lớp, và
    toàn bộ tiến độ học của từng em - khoá ngoại nối tầng như thế. Hộp thoại xác
    nhận mà không nói được con số thì người bấm không biết mình đang xoá gì.
  */
  const [students, classes] = await Promise.all([
    db().from('students').select('owner_id'),
    db().from('classes').select('teacher_id'),
  ])

  const countBy = (rows: Array<Record<string, unknown>> | null, key: string) => {
    const out = new Map<string, number>()
    for (const row of rows ?? []) {
      const id = String(row[key] ?? '')
      out.set(id, (out.get(id) ?? 0) + 1)
    }
    return out
  }
  const studentCount = countBy(students.data, 'owner_id')
  const classCount = countBy(classes.data, 'teacher_id')

  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: emailById.get(row.id as string) ?? '',
    displayName: row.display_name as string,
    role: cleanRole(row.role),
    createdAt: row.created_at as string,
    students: studentCount.get(row.id as string) ?? 0,
    classes: classCount.get(row.id as string) ?? 0,
  }))
}

// --- Tạo tài khoản mới ------------------------------------------------------------

export interface CreatedAccount {
  password: string
  user: { id: string; email: string; displayName: string; role: AdultRole }
}

export async function createAccount(
  caller: Adult,
  input: { email: string; displayName: string; role: unknown },
): Promise<CreatedAccount> {
  /*
    Ai được làm việc này - giữ nguyên luật của bản Edge Function.

    Quản trị VÀ giáo viên đều tạo được tài khoản, vì chính giáo viên mới là người
    biết phụ huynh lớp mình là ai. Nhưng chỉ quản trị mới phong được vai: giáo
    viên tạo ra phụ huynh, không tạo ra giáo viên khác - nếu không thì một tài
    khoản bị lộ là cả trường mọc thêm giáo viên.

    Giáo viên xin vai gì cũng ra phụ huynh. Không báo lỗi, chỉ hạ xuống - việc họ
    định làm vẫn xong, chỉ là ở đúng mức quyền của họ.
  */
  const role = caller.role === 'admin' ? cleanRole(input.role) : 'parent'

  const password = generatePassword()
  const { data, error } = await db().auth.admin.createUser({
    email: input.email,
    password,
    // Mấu chốt của cả luồng này: đánh dấu đã xác nhận, nên Supabase không gửi
    // thư nào, nên SMTP hỏng hay không cũng không liên quan.
    email_confirm: true,
    user_metadata: { display_name: input.displayName, role },
  })

  if (error) {
    throw badRequest(/already/i.test(error.message) ? 'Email này đã có tài khoản rồi.' : error.message)
  }

  // Trigger `handle_new_user` chỉ chạy khi có metadata lúc đăng ký; đặt lại cho
  // chắc, phòng khi trigger bỏ qua người dùng tạo bằng khoá quản trị.
  const upsert = await db()
    .from('profiles')
    .upsert({ id: data.user.id, role, display_name: input.displayName }, { onConflict: 'id' })
  check(upsert.error, 'Không tạo được hồ sơ cho tài khoản mới')

  // Mật khẩu trả về ĐÚNG MỘT LẦN này. Nó không được lưu ở đâu dạng đọc được, nên
  // admin chép ngay hoặc đặt lại cái khác.
  return { password, user: { id: data.user.id, email: input.email, displayName: input.displayName, role } }
}

// --- Đặt lại mật khẩu -------------------------------------------------------------

export async function resetAccountPassword(userId: string): Promise<string> {
  const password = generatePassword()
  const { error } = await db().auth.admin.updateUserById(userId, {
    password,
    /*
      XÁC NHẬN LUÔN email, không chỉ đổi mật khẩu.

      Tài khoản đăng ký từ trước - hồi app còn cho tự đăng ký - có thể chưa bao
      giờ bấm liên kết trong thư, và khi hệ thống thư hỏng thì họ không bao giờ
      bấm được nữa. Admin đặt lại mật khẩu cho ai là đã xác nhận người đó bằng
      đường khác rồi; đưa họ mật khẩu mới rồi vẫn chặn ở cửa "chưa xác nhận" thì
      cái nút này chẳng giải quyết được gì.
    */
    email_confirm: true,
  })
  if (error) throw badRequest(error.message)
  return password
}

// --- Sửa tài khoản -----------------------------------------------------------------

export async function updateAccount(
  caller: Adult,
  userId: string,
  input: { displayName: string; email: string; role: unknown },
): Promise<void> {
  const role = cleanRole(input.role)

  /*
    KHÔNG cho tự hạ vai của chính mình.

    Quản trị viên cuối cùng tự hạ mình xuống 'parent' là cả hệ thống không còn ai
    tạo được tài khoản nữa, và gỡ ra thì phải mở SQL Editor. Chặn ngay tại đây rẻ
    hơn nhiều so với đi giải thích sau.
  */
  if (userId === caller.userId && role !== 'admin') {
    throw badRequest('Không thể tự bỏ quyền quản trị của chính mình.')
  }

  // Người quản trị cuối cùng cũng không bị ai khác hạ vai.
  if (role !== 'admin') await refuseIfLastAdmin(userId, 'phải có người khác giữ vai này trước đã')

  if (input.email) {
    const { error } = await db().auth.admin.updateUserById(userId, {
      email: input.email,
      // Đổi email xong mà bắt xác nhận lại thì người ta mất đường vào ngay lập
      // tức - mà quản trị viên đổi hộ là đã xác nhận bằng đường khác rồi.
      email_confirm: true,
    })
    if (error) {
      throw badRequest(
        /already/i.test(error.message) ? 'Email này đã có tài khoản khác dùng.' : error.message,
      )
    }
  }

  const { error } = await db()
    .from('profiles')
    .update({ display_name: input.displayName, role })
    .eq('id', userId)
  check(error, 'Không sửa được tài khoản')

  // Giữ metadata khớp với bảng hồ sơ, để lần đăng nhập sau không đọc ra vai cũ.
  await db().auth.admin.updateUserById(userId, {
    user_metadata: { display_name: input.displayName, role },
  })
}

// --- Xoá tài khoản ------------------------------------------------------------------

export async function deleteAccount(caller: Adult, userId: string): Promise<void> {
  // Tự xoá mình là mất đường vào ngay giữa chừng, và không ai hoàn tác được.
  if (userId === caller.userId) throw badRequest('Không thể tự xoá tài khoản của chính mình.')

  const { data: target } = await db().from('profiles').select('role').eq('id', userId).maybeSingle()
  if (target?.role === 'admin') await refuseIfLastAdmin(userId, 'không xoá được')

  // Xoá người dùng là xoá theo cả hồ sơ, lớp, học sinh và tiến độ - khoá ngoại
  // nối tầng lo phần đó. Giao diện đã hỏi rõ trước khi gọi tới đây.
  const { error } = await db().auth.admin.deleteUser(userId)
  if (error) throw badRequest(error.message)
}

/** Chặn mọi thao tác làm hệ thống mất người quản trị cuối cùng. */
async function refuseIfLastAdmin(userId: string, consequence: string): Promise<void> {
  const { count } = await db()
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
  if ((count ?? 0) > 1) return

  // Chỉ còn một admin. Nếu đó chính là người đang bị đụng tới thì chặn.
  const { data } = await db().from('profiles').select('role').eq('id', userId).maybeSingle()
  if (data?.role === 'admin') {
    throw badRequest(`Đây là quản trị viên duy nhất - ${consequence}.`)
  }
}
