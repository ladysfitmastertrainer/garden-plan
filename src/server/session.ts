/**
 * Phiên đăng nhập, đựng trong cookie `httpOnly` và ký bằng JWT.
 *
 * Vì sao TỰ ký thay vì giữ token của Supabase: token Supabase muốn sống được
 * trong trình duyệt thì phải nằm ở `localStorage`, tức là mọi đoạn script chạy
 * trên trang đều đọc được nó. Cookie `httpOnly` thì JavaScript không đọc nổi -
 * kể cả script của chính app. Và vì máy chủ đã cầm khoá `service_role`, nó không
 * cần token của người dùng để làm gì; nó chỉ cần biết người gọi LÀ AI.
 *
 * Nên trong token này chỉ có đúng danh tính, KHÔNG có vai:
 *
 *   { kind: 'adult', sub: <user id> }     hoặc     { kind: 'child', sub: <student id> }
 *
 * Vai (`parent` / `teacher` / `admin`) được tra lại từ bảng `profiles` ở MỖI yêu
 * cầu. Nhét vai vào token thì nhanh hơn một truy vấn, nhưng một quản trị viên bị
 * hạ quyền vẫn giữ nguyên quyền cũ cho tới lúc token hết hạn - đúng thứ không
 * được phép xảy ra với một nút bấm xoá được cả trường.
 */
import 'server-only'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { env } from './env'

export const SESSION_COOKIE = 'hvtt_session'

export type Session =
  | { kind: 'adult'; userId: string }
  /** Trẻ trên máy dùng chung ở lớp: phiên gắn với ĐÚNG MỘT hồ sơ học sinh. */
  | { kind: 'child'; studentId: string }

/**
 * Người lớn giữ phiên 30 ngày; trẻ chỉ 12 tiếng.
 *
 * Máy tính bảng ở lớp truyền tay nhau. Một phiên của trẻ sống qua đêm nghĩa là
 * sáng hôm sau em khác cầm máy lên và đang ở trong hồ sơ của bạn mình. Mười hai
 * tiếng phủ trọn một ngày học rồi tự tắt.
 */
const TTL_SECONDS = { adult: 30 * 24 * 60 * 60, child: 12 * 60 * 60 } as const

const secret = () => new TextEncoder().encode(env.sessionSecret())

export async function signSession(session: Session): Promise<string> {
  const sub = session.kind === 'adult' ? session.userId : session.studentId
  return new SignJWT({ kind: session.kind })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS[session.kind]}s`)
    .sign(secret())
}

/** Đọc phiên từ cookie. Trả `null` cho mọi trường hợp hỏng - không ném lỗi. */
export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    const sub = payload.sub
    if (typeof sub !== 'string') return null
    if (payload.kind === 'adult') return { kind: 'adult', userId: sub }
    if (payload.kind === 'child') return { kind: 'child', studentId: sub }
    return null
  } catch {
    // Hết hạn, sai chữ ký, hoặc rác. Ba trường hợp đều dẫn tới cùng một việc:
    // coi như chưa đăng nhập.
    return null
  }
}

export async function startSession(session: Session): Promise<void> {
  ;(await cookies()).set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    // `secure` tắt khi chạy máy local qua http://localhost - bật lên là trình
    // duyệt từ chối lưu cookie và không ai đăng nhập được lúc phát triển.
    secure: env.isProduction(),
    path: '/',
    maxAge: TTL_SECONDS[session.kind],
  })
}

export async function endSession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}
