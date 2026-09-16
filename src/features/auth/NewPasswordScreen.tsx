'use client'

/**
 * Đặt mật khẩu mới, sau khi bấm liên kết trong thư.
 *
 * Trang RIÊNG ở `/dat-lai-mat-khau`. Bản cũ chen màn này vào trước mọi thứ khác
 * bằng một lá cờ `recovering` trong kho xác thực - vì trang tĩnh chỉ có một địa
 * chỉ duy nhất, nên mọi luồng phải chen chỗ với nhau ở đó. Giờ nó có đường dẫn
 * riêng, và cái cờ ấy không còn cần thiết.
 *
 * Token nằm sau dấu `#` trong địa chỉ. Phải đọc NGAY khi trang mở: trình duyệt
 * không gửi phần đó lên máy chủ, nó chỉ sống trong bộ nhớ của tab này. Đọc xong
 * thì xoá khỏi thanh địa chỉ để nó không nằm lại trong lịch sử duyệt web.
 *
 * Hai ô mật khẩu chứ không phải một. Gõ sai một ký tự trong ô duy nhất thì mật
 * khẩu mới là một chuỗi không ai biết, và lần này thì mất thật - chính cái liên
 * kết vừa dùng cũng không dùng lại được nữa.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../store/auth'

/** Ngắn hơn thì máy chủ cũng từ chối; chặn sớm để đỡ một vòng gọi mạng. */
const MIN_LENGTH = 6

/**
 * Đọc kết quả Supabase trả về trong phần `#` của địa chỉ.
 *
 * Hai khả năng, và phải phân biệt được: có `access_token` là liên kết còn dùng
 * được; có `error_description` là nó đã hỏng - hết hạn, hoặc một bộ quét thư nào
 * đó đã bấm trước mất rồi, chuyện xảy ra thường xuyên hơn người ta tưởng.
 */
function readHash(): { token: string | null; error: string | null } {
  if (typeof window === 'undefined') return { token: null, error: null }

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = params.get('error_description') ?? params.get('error')

  return {
    token: params.get('access_token'),
    error: error
      ? 'Liên kết trong thư đã hết hạn hoặc đã được dùng rồi. Hãy xin một liên kết mới nhé.'
      : null,
  }
}

export function NewPasswordScreen() {
  const resetPassword = useAuth((s) => s.resetPassword)
  const busy = useAuth((s) => s.busy)
  const error = useAuth((s) => s.error)
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')

  useEffect(() => {
    const { token: found, error: hashError } = readHash()
    setToken(found)
    setLinkError(hashError ?? (found ? null : 'Địa chỉ này thiếu liên kết đặt lại mật khẩu.'))
    setChecked(true)

    // Dọn phần `#` khỏi thanh địa chỉ. Token vẫn nằm trong `useState` nên biểu
    // mẫu dùng được bình thường, nhưng nó không còn trong lịch sử duyệt web và
    // không bị chép nhầm khi ai đó gửi địa chỉ này cho người khác.
    if (found) window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const tooShort = password.length > 0 && password.length < MIN_LENGTH
  const mismatch = again.length > 0 && password !== again
  const ready = Boolean(token) && password.length >= MIN_LENGTH && password === again

  return (
    <div className="pixel-ui mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 py-8">
      <header className="text-center">
        <p className="text-6xl">🔑</p>
        <h1 className="pixel-font text-3xl">ĐẶT MẬT KHẨU MỚI</h1>
      </header>

      {(error ?? linkError) && (
        <p
          className="rounded-2xl p-4 text-center text-lg font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
          role="alert"
        >
          {error ?? linkError}
        </p>
      )}

      {/* Liên kết hỏng thì không hiện biểu mẫu - gõ mật khẩu vào một ô chắc chắn
          không lưu được là mười giây lãng phí rồi nhận một lời báo lỗi. Đưa thẳng
          họ về chỗ xin liên kết mới. */}
      {checked && !token ? (
        <button type="button" onClick={() => router.replace('/')} className="btn btn-primary text-xl">
          ← Về màn đăng nhập
        </button>
      ) : (
        <form
          className="pixel-panel grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (ready && !busy) void resetPassword(token!, password).then(() => router.replace('/'))
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
      )}
    </div>
  )
}
