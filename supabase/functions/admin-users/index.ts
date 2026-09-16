/**
 * Tạo và quản lý tài khoản người lớn, thay cho việc tự đăng ký.
 *
 * Vì sao phải là Edge Function chứ không viết thẳng trong app: tạo tài khoản hộ
 * người khác cần khoá `service_role`, thứ bỏ qua toàn bộ Row Level Security. Khoá
 * đó mà nằm trong gói JavaScript gửi xuống trình duyệt thì ai mở DevTools cũng
 * đọc được, và họ đọc được mọi dữ liệu của mọi đứa trẻ. Nó phải ở lại phía máy
 * chủ, và trên Supabase thì đây là chỗ duy nhất có "phía máy chủ".
 *
 * Tài khoản tạo ra mang `email_confirm: true` - ĐÃ XÁC NHẬN SẴN. Nhờ vậy cả
 * luồng này không gửi lá thư nào, nên không phụ thuộc vào SMTP. Mật khẩu sinh
 * ngẫu nhiên và trả về cho màn hình admin xem, đúng như app Diet Plan làm.
 *
 * Triển khai:
 *   supabase functions deploy admin-users
 * hoặc dán file này vào Dashboard → Edge Functions → New function.
 *
 * Không cần khai biến môi trường nào: Supabase tự cấp SUPABASE_URL và
 * SUPABASE_SERVICE_ROLE_KEY cho mọi Edge Function.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

/**
 * Mật khẩu dễ đọc cho người, đủ khó cho máy.
 *
 * Bỏ những ký tự dễ đọc nhầm khi chép tay hoặc đọc qua điện thoại: O và 0, I và
 * l và 1. Admin sẽ đọc chuỗi này cho cô giáo nghe, nên một ký tự mơ hồ là một
 * lần gọi lại.
 */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(14))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

interface Body {
  action?: 'list' | 'create' | 'reset' | 'update' | 'delete'
  email?: string
  displayName?: string
  role?: string
  userId?: string
}

/** Vai hợp lệ; mọi thứ khác rơi về 'parent'. */
function cleanRole(value: unknown): 'parent' | 'teacher' | 'admin' {
  return value === 'teacher' || value === 'admin' ? value : 'parent'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Chỉ nhận POST' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // --- Người gọi là ai, và có phải admin không ---------------------------------
  //
  // Kiểm bằng CHÍNH token của người gọi, không tin bất cứ thứ gì trong thân yêu
  // cầu. Thiếu bước này thì ai biết địa chỉ hàm cũng tạo được tài khoản.
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Chưa đăng nhập' }, 401)

  const { data: caller, error: callerError } = await admin.auth.getUser(token)
  if (callerError || !caller.user) return json({ error: 'Phiên đăng nhập không hợp lệ' }, 401)

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.user.id)
    .maybeSingle()

  /*
    Ai được làm việc này - bê đúng luật của app training-plan.

    Quản trị VÀ giáo viên đều tạo được tài khoản, vì chính giáo viên mới là người
    biết phụ huynh lớp mình là ai. Nhưng chỉ quản trị mới phong được vai: giáo
    viên tạo ra phụ huynh, không tạo ra giáo viên khác - nếu không thì một tài
    khoản bị lộ là cả trường mọc thêm giáo viên.
  */
  const isAdmin = profile?.role === 'admin'
  const isStaff = isAdmin || profile?.role === 'teacher'
  if (!isStaff) {
    return json({ error: 'Chỉ quản trị viên hoặc giáo viên mới làm được việc này' }, 403)
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Nội dung gửi lên không đọc được' }, 400)
  }

  // --- Xem danh sách -----------------------------------------------------------
  if (body.action === 'list') {
    const { data, error } = await admin
      .from('profiles')
      .select('id, display_name, role, created_at')
      .order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, 500)

    // `profiles` không giữ email - nó nằm ở `auth.users`. Ghép lại để admin nhận
    // ra ai là ai; tên hiển thị thì trùng nhau như cơm bữa.
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? '']))

    /*
      Đếm học sinh và lớp của từng người.

      Không phải để trang trí: xoá một người lớn là xoá theo CẢ học sinh, lớp, và
      toàn bộ tiến độ học của từng em - khoá ngoại nối tầng như thế. Hộp thoại
      xác nhận mà không nói được con số thì người bấm không biết mình đang xoá gì.
    */
    const [students, classes] = await Promise.all([
      admin.from('students').select('owner_id'),
      admin.from('classes').select('teacher_id'),
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

    return json({
      users: (data ?? []).map((row) => ({
        id: row.id,
        email: emailById.get(row.id) ?? '',
        displayName: row.display_name,
        role: row.role,
        createdAt: row.created_at,
        students: studentCount.get(row.id) ?? 0,
        classes: classCount.get(row.id) ?? 0,
      })),
    })
  }

  // --- Tạo tài khoản mới -------------------------------------------------------
  if (body.action === 'create') {
    const email = (body.email ?? '').trim().toLowerCase()
    const displayName = (body.displayName ?? '').trim()
    const wanted = body.role === 'teacher' || body.role === 'admin' ? body.role : 'parent'
    // Giáo viên xin vai gì cũng ra phụ huynh. Không báo lỗi, chỉ hạ xuống - việc
    // họ định làm vẫn xong, chỉ là ở đúng mức quyền của họ.
    const role = isAdmin ? wanted : 'parent'

    if (!email || !displayName) return json({ error: 'Cần đủ tên và email' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Địa chỉ email không hợp lệ' }, 400)

    const password = generatePassword()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      // Mấu chốt của cả luồng này: đánh dấu đã xác nhận, nên Supabase không gửi
      // thư nào, nên SMTP hỏng hay không cũng không liên quan.
      email_confirm: true,
      user_metadata: { display_name: displayName, role },
    })

    if (error) {
      const already = /already/i.test(error.message)
      return json({ error: already ? 'Email này đã có tài khoản rồi' : error.message }, 400)
    }

    // Trigger `handle_new_user` chỉ chạy khi có email trong metadata gốc; đặt lại
    // cho chắc, phòng khi trigger bỏ qua người dùng tạo bằng khoá quản trị.
    await admin
      .from('profiles')
      .upsert({ id: data.user.id, role, display_name: displayName }, { onConflict: 'id' })

    // Mật khẩu trả về ĐÚNG MỘT LẦN này. Nó không được lưu ở đâu dạng đọc được,
    // nên admin chép ngay hoặc đặt lại cái khác.
    return json({ ok: true, password, user: { id: data.user.id, email, displayName, role } })
  }

  // --- Đặt lại mật khẩu --------------------------------------------------------
  if (body.action === 'reset') {
    if (!body.userId) return json({ error: 'Thiếu tài khoản cần đặt lại' }, 400)
    // Đặt lại mật khẩu của người khác là việc nặng tay hơn tạo mới: nó cắt đường
    // vào của một tài khoản đang dùng. Chỉ quản trị.
    if (!isAdmin) return json({ error: 'Chỉ quản trị viên mới đặt lại được mật khẩu' }, 403)

    const password = generatePassword()
    const { error } = await admin.auth.admin.updateUserById(body.userId, {
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
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true, password })
  }

  // --- Sửa tài khoản -----------------------------------------------------------
  if (body.action === 'update') {
    // Sửa người khác là việc của quản trị. Giáo viên tạo được tài khoản, nhưng
    // không đổi được vai hay email của ai.
    if (!isAdmin) return json({ error: 'Chỉ quản trị viên mới sửa được tài khoản' }, 403)
    if (!body.userId) return json({ error: 'Thiếu tài khoản cần sửa' }, 400)

    const displayName = (body.displayName ?? '').trim()
    const email = (body.email ?? '').trim().toLowerCase()
    if (!displayName) return json({ error: 'Tên hiển thị không được để trống' }, 400)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Địa chỉ email không hợp lệ' }, 400)
    }

    const role = cleanRole(body.role)

    /*
      KHÔNG cho tự hạ vai của chính mình.

      Quản trị viên cuối cùng tự hạ mình xuống 'parent' là cả hệ thống không còn
      ai tạo được tài khoản nữa, và gỡ ra thì phải mở SQL Editor. Chặn ngay tại
      đây rẻ hơn nhiều so với đi giải thích sau.
    */
    if (body.userId === caller.user.id && role !== 'admin') {
      return json({ error: 'Không thể tự bỏ quyền quản trị của chính mình' }, 400)
    }

    // Người quản trị cuối cùng cũng không bị ai khác hạ vai.
    if (role !== 'admin') {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
      if ((count ?? 0) <= 1) {
        return json({ error: 'Đây là quản trị viên duy nhất - phải có người khác giữ vai này trước đã' }, 400)
      }
    }

    if (email) {
      const { error } = await admin.auth.admin.updateUserById(body.userId, {
        email,
        // Đổi email xong mà bắt xác nhận lại thì người ta mất đường vào ngay lập
        // tức - mà quản trị viên đổi hộ là đã xác nhận bằng đường khác rồi.
        email_confirm: true,
      })
      if (error) {
        const already = /already/i.test(error.message)
        return json({ error: already ? 'Email này đã có tài khoản khác dùng' : error.message }, 400)
      }
    }

    const { error } = await admin
      .from('profiles')
      .update({ display_name: displayName, role })
      .eq('id', body.userId)
    if (error) return json({ error: error.message }, 400)

    // Giữ metadata khớp với bảng hồ sơ, để lần đăng nhập sau không đọc ra vai cũ.
    await admin.auth.admin.updateUserById(body.userId, {
      user_metadata: { display_name: displayName, role },
    })

    return json({ ok: true })
  }

  // --- Xoá tài khoản -----------------------------------------------------------
  if (body.action === 'delete') {
    if (!isAdmin) return json({ error: 'Chỉ quản trị viên mới xoá được tài khoản' }, 403)
    if (!body.userId) return json({ error: 'Thiếu tài khoản cần xoá' }, 400)

    // Tự xoá mình là mất đường vào ngay giữa chừng, và không ai hoàn tác được.
    if (body.userId === caller.user.id) {
      return json({ error: 'Không thể tự xoá tài khoản của chính mình' }, 400)
    }

    const { data: target } = await admin
      .from('profiles')
      .select('role')
      .eq('id', body.userId)
      .maybeSingle()

    if (target?.role === 'admin') {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
      if ((count ?? 0) <= 1) {
        return json({ error: 'Đây là quản trị viên duy nhất - không xoá được' }, 400)
      }
    }

    // Xoá người dùng là xoá theo cả hồ sơ, lớp, học sinh và tiến độ - khoá ngoại
    // nối tầng lo phần đó. Giao diện đã hỏi rõ trước khi gọi tới đây.
    const { error } = await admin.auth.admin.deleteUser(body.userId)
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true })
  }

  return json({ error: 'Không hiểu việc cần làm' }, 400)
})
