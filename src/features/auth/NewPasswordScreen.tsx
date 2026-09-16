/**
 * Đặt mật khẩu mới, sau khi bấm liên kết trong thư.
 *
 * Màn này chen vào TRƯỚC mọi thứ khác: lúc này người dùng đã có phiên hợp lệ do
 * Supabase cấp qua liên kết, nên nếu để lọt vào app thì họ vào thẳng game và
 * không bao giờ đổi được mật khẩu - phiên kia hết hạn là mất tài khoản như cũ.
 *
 * Hai ô mật khẩu chứ không phải một. Gõ sai một ký tự trong ô duy nhất thì mật
 * khẩu mới là một chuỗi không ai biết, và lần này thì mất thật - chính cái liên
 * kết vừa dùng cũng không dùng lại được nữa.
 */

import { useState } from 'react'
import { useAuth } from '../../store/auth'

/** Ngắn hơn thì Supabase cũng từ chối; chặn sớm để đỡ một vòng gọi mạng. */
const MIN_LENGTH = 6

export function NewPasswordScreen() {
  const updatePassword = useAuth((s) => s.updatePassword)
  const busy = useAuth((s) => s.busy)
  const error = useAuth((s) => s.error)

  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')

  const tooShort = password.length > 0 && password.length < MIN_LENGTH
  const mismatch = again.length > 0 && password !== again
  const ready = password.length >= MIN_LENGTH && password === again

  return (
    <div className="pixel-ui mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 py-8">
      <header className="text-center">
        <p className="text-6xl">🔑</p>
        <h1 className="pixel-font text-3xl">ĐẶT MẬT KHẨU MỚI</h1>
      </header>

      {error && (
        <p
          className="rounded-2xl p-4 text-center text-lg font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      <form
        className="pixel-panel grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (ready && !busy) void updatePassword(password)
        }}
      >
        <p className="text-base leading-snug opacity-70">
          Chọn một mật khẩu mới cho tài khoản của bạn. Ít nhất {MIN_LENGTH} ký tự.
        </p>

        <label className="grid gap-2">
          <span className="font-bold">Mật khẩu mới</span>
          <input
            type="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
            style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
          />
          {tooShort && (
            <span className="text-base" style={{ color: 'var(--color-warn)' }}>
              Cần ít nhất {MIN_LENGTH} ký tự.
            </span>
          )}
        </label>

        <label className="grid gap-2">
          <span className="font-bold">Gõ lại mật khẩu</span>
          <input
            type="password"
            autoComplete="new-password"
            value={again}
            onChange={(event) => setAgain(event.target.value)}
            className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
            style={{
              borderColor: mismatch
                ? 'var(--color-warn)'
                : 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
            }}
          />
          {mismatch && (
            <span className="text-base" style={{ color: 'var(--color-warn)' }}>
              Hai ô chưa giống nhau.
            </span>
          )}
        </label>

        <button type="submit" disabled={busy || !ready} className="btn btn-primary text-xl">
          {busy ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
        </button>
      </form>
    </div>
  )
}
