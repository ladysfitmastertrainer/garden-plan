/**
 * Máy chủ thư đã cắm đúng chưa?
 *
 *   node scripts/smtp-check.mjs email-cua-mot-tai-khoan-co-that@example.com
 *
 * Vì sao cần kịch bản này: nhìn bằng mắt thì ba tình huống dưới đây giống hệt
 * nhau - bấm "Quên mật khẩu" xong không thấy thư đâu:
 *
 *   1. Gửi được thật, thư nằm trong mục spam;
 *   2. Hết hạn ngạch (Supabase chặn ở 30 thư/giờ nếu chưa nới);
 *   3. SMTP sai hoặc bị nhà cung cấp từ chối.
 *
 * Supabase trả về ba câu trả lời khác hẳn nhau cho ba việc đó. Kịch bản này gọi
 * đúng đường mà `/api/auth/forgot` gọi rồi in nguyên văn ra, nên không phải đoán.
 *
 * Dùng `recover` (quên mật khẩu) chứ không phải đăng ký: nó không tạo ra tài
 * khoản rác nào. Đổi lại, email đưa vào PHẢI là tài khoản có thật - với địa chỉ
 * lạ, Supabase cố tình trả về "thành công" mà chẳng gửi gì, để người ngoài không
 * dò được ai đã đăng ký.
 *
 * Từ bản Next.js, kịch bản đọc `SUPABASE_SERVICE_ROLE_KEY` thay cho khoá `anon`
 * cũ - app không còn khoá `anon` nữa. Khoá này không rời khỏi máy bạn; nó chỉ
 * được dùng làm `apikey` cho đúng một lời gọi tới chính dự án của bạn.
 */

import { readFileSync } from 'node:fs'

const doc = (ten) => {
  for (const file of ['.env.local', '.env']) {
    let noiDung
    try {
      noiDung = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    } catch {
      continue
    }
    const dong = noiDung.match(new RegExp(`^${ten}=(.*)$`, 'm'))
    if (dong?.[1]?.trim()) return dong[1].trim()
  }
  return ''
}

const url = doc('SUPABASE_URL')
const khoa = doc('SUPABASE_SERVICE_ROLE_KEY')
const email = process.argv[2]

if (!url || !khoa) {
  console.error('Chưa có SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local')
  process.exit(1)
}
if (!email) {
  console.error('Thiếu email. Ví dụ: node scripts/smtp-check.mjs thay@truong.edu.vn')
  process.exit(1)
}

console.log(`Dự án : ${url}`)
console.log(`Gửi tới: ${email}\n`)

const batDau = Date.now()
const tra = await fetch(`${url}/auth/v1/recover`, {
  method: 'POST',
  headers: { apikey: khoa, Authorization: `Bearer ${khoa}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
})
const than = await tra.text()
const giay = ((Date.now() - batDau) / 1000).toFixed(1)

console.log(`HTTP ${tra.status} sau ${giay}s`)
console.log(than.slice(0, 500) || '(thân rỗng)')
console.log()

if (tra.ok) {
  console.log('✓ Supabase nhận lời và không báo lỗi gửi.')
  console.log('  Không thấy thư thì xem mục spam, rồi xem Logs → Auth Logs.')
  console.log(`  Lưu ý: nếu ${email} không phải tài khoản có thật thì câu trả lời này`)
  console.log('  vô nghĩa - Supabase luôn đáp "thành công" với địa chỉ lạ.')
  console.log()
  console.log('  Thư tới nhưng bấm vào liên kết lại rơi về một trang trống?')
  console.log('  Đó là lỗi KHÁC, không phải SMTP: Authentication → URL Configuration')
  console.log('  → Redirect URLs phải có dòng <địa-chỉ-app>/dat-lai-mat-khau.')
} else if (tra.status === 429) {
  console.log('✕ HẾT HẠN NGẠCH, không phải lỗi SMTP.')
  console.log('  Authentication → Rate Limits → Emails, nâng mức lên.')
} else if (/error sending|smtp|failed to send/i.test(than)) {
  console.log('✕ SMTP HỎNG. Supabase không giao được thư cho nhà cung cấp.')
  console.log('  Kiểm tra: host smtp-relay.brevo.com, cổng 587, Username dạng')
  console.log('  ...@smtp-brevo.com, Password là SMTP key xsmtpsib-..., và địa chỉ')
  console.log('  người gửi đã được xác nhận bên Brevo.')
} else {
  console.log('✕ Lỗi khác - đọc nguyên văn ở trên.')
}

// Đặt mã thoát chứ không gọi process.exit: fetch còn giữ kết nối mở, và ép
// thoát giữa chừng thì Node trên Windows chết kèm một dòng "Assertion failed"
// chẳng liên quan gì tới việc gửi thư - đọc vào chỉ tổ hoang mang.
process.exitCode = tra.ok ? 0 : 1
