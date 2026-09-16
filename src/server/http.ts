/**
 * Khung chung cho mọi route API: một chỗ duy nhất biến lỗi thành câu trả lời.
 *
 * Không có nó thì mỗi route lại tự viết `try/catch` một kiểu, và sớm muộn sẽ có
 * một route quên - lúc đó Next trả về trang lỗi HTML, còn `fetch` ở trình duyệt
 * thì vấp phải "Unexpected token '<'" và người dùng nhận một lời báo lỗi vô
 * nghĩa thay cho lời báo thật.
 */
import 'server-only'

import { NextResponse } from 'next/server'

/** Lỗi có mã HTTP đi kèm. Mọi lỗi khác bị coi là hỏng hóc phía máy chủ (500). */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

/**
 * Máy chủ chưa được cấu hình xong - thiếu biến môi trường.
 *
 * Tách khỏi mọi lỗi khác vì nó có một tính chất riêng: lời nhắn của nó AN TOÀN
 * khi đưa ra ngoài. Nó chỉ nói tên một biến còn trống, không lộ dữ liệu của ai.
 *
 * Và nó cần được đưa ra ngoài. Người gặp lỗi này gần như luôn là người đang dựng
 * máy chủ, ngồi nhìn trình duyệt; gói nó vào câu "Máy chủ gặp trục trặc" rồi bắt
 * họ đi mò log là đúng kiểu bất tiện mà cả lần chuyển sang Node này sinh ra để
 * dẹp bỏ.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export const badRequest = (message: string) => new HttpError(400, message)
export const unauthorized = (message = 'Bạn cần đăng nhập trước.') => new HttpError(401, message)
export const forbidden = (message = 'Bạn không có quyền làm việc này.') => new HttpError(403, message)
export const notFound = (message = 'Không tìm thấy.') => new HttpError(404, message)

/**
 * Bọc một route handler.
 *
 * Trả về thứ gì thì thứ đó thành JSON. Ném `HttpError` thì thành `{ error }` kèm
 * đúng mã. Ném thứ khác thì thành 500, và lời nhắn thật chỉ đi vào log của máy
 * chủ - chi tiết lỗi Postgres không phải thứ để đưa cho người ngoài xem.
 */
export function route<Ctx = unknown>(
  fn: (req: Request, ctx: Ctx) => Promise<unknown>,
): (req: Request, ctx: Ctx) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const body = await fn(req, ctx)
      return NextResponse.json(body ?? { ok: true })
    } catch (cause) {
      if (cause instanceof HttpError) {
        return NextResponse.json({ error: cause.message }, { status: cause.status })
      }
      console.error('[api]', req.method, new URL(req.url).pathname, cause)
      if (cause instanceof ConfigError) {
        return NextResponse.json({ error: cause.message }, { status: 500 })
      }
      return NextResponse.json(
        { error: 'Máy chủ gặp trục trặc. Thử lại sau một chút nhé.' },
        { status: 500 },
      )
    }
  }
}

/** Đọc thân yêu cầu dạng JSON, báo lỗi tử tế khi nó không phải JSON. */
export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw badRequest('Nội dung gửi lên không đọc được.')
  }
}

/** Cắt khoảng trắng và bắt buộc có nội dung. */
export function requireText(value: unknown, label: string): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw badRequest(`${label} không được để trống.`)
  return text
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function requireEmail(value: unknown): string {
  const email = requireText(value, 'Email').toLowerCase()
  if (!EMAIL.test(email)) throw badRequest('Địa chỉ email không hợp lệ.')
  return email
}
