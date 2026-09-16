/**
 * Màn hình đăng nhập.
 *
 * Hai lối vào tách bạch:
 *  - Người lớn (phụ huynh / giáo viên): email + mật khẩu.
 *  - Trẻ trên máy dùng chung ở lớp: mã lớp → chọn ảnh đại diện của mình → mã PIN.
 *
 * Trẻ không bao giờ phải nhập email hay mật khẩu, và không gõ tên mình ra.
 */

import { useEffect, useState } from 'react'
import { useAuth, type RosterEntry, type SignUpRole } from '../../store/auth'

type Tab = 'child' | 'adult'

export function AuthScreen() {
  const [tab, setTab] = useState<Tab>('child')
  const error = useAuth((s) => s.error)
  const notice = useAuth((s) => s.notice)
  const clearError = useAuth((s) => s.clearError)

  return (
    <div className="pixel-ui mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 py-8">
      <header className="text-center">
        <p className="text-6xl">🏰</p>
        <h1 className="pixel-font text-4xl">HỌC VIỆN TRÍ TUỆ</h1>
      </header>

      <div className="flex gap-2">
        {(['child', 'adult'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              clearError()
              setTab(value)
            }}
            className="pixel-font flex-1 border-4 py-3 text-lg"
            style={{
              borderColor: tab === value ? 'var(--color-brand)' : 'transparent',
              background: tab === value ? 'var(--color-brand-soft)' : 'var(--color-paper-sunk)',
            }}
          >
            {value === 'child' ? '🎒 Học sinh' : '👨‍👩‍👧 Phụ huynh / Giáo viên'}
          </button>
        ))}
      </div>

      {error && (
        <p
          className="rounded-2xl p-4 text-center text-lg font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Tin vui thì tô xanh, không tô đỏ như lỗi. Xuống dòng giữ nguyên để tách
          "đã gửi thư" khỏi "giờ con phải làm gì". */}
      {notice && (
        <p
          className="whitespace-pre-line rounded-2xl p-4 text-center text-lg font-bold"
          style={{ background: 'var(--color-good-soft)', color: 'var(--color-good)' }}
          role="status"
        >
          {notice}
        </p>
      )}

      {tab === 'child' ? <ChildLogin /> : <AdultLogin />}
    </div>
  )
}

// --- Lối vào của trẻ -----------------------------------------------------------

function ChildLogin() {
  const loadRoster = useAuth((s) => s.loadRoster)
  const claimStudent = useAuth((s) => s.claimStudent)
  const busy = useAuth((s) => s.busy)

  const [classCode, setClassCode] = useState('')
  const [roster, setRoster] = useState<RosterEntry[] | null>(null)
  const [picked, setPicked] = useState<RosterEntry | null>(null)
  const [pin, setPin] = useState('')

  // Bước 3: nhập mã PIN
  if (picked) {
    return (
      <div className="pixel-panel grid gap-5 text-center">
        <div>
          <p className="text-6xl">{picked.avatar}</p>
          <p className="text-2xl font-extrabold">{picked.name}</p>
        </div>

        <div>
          <p className="mb-2 font-bold">Nhập mã bí mật 4 số của con</p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="flex h-16 w-14 items-center justify-center rounded-2xl border-4 text-3xl font-extrabold"
                style={{
                  borderColor:
                    pin.length === index ? 'var(--color-brand)' : 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
                }}
              >
                {pin[index] ? '●' : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={busy || pin.length >= 4}
              onClick={() => setPin(pin + digit)}
              className="btn btn-ghost text-2xl"
            >
              {digit}
            </button>
          ))}
          <button type="button" onClick={() => setPin('')} disabled={busy} className="btn btn-ghost text-lg">
            Xoá
          </button>
          <button
            type="button"
            disabled={busy || pin.length >= 4}
            onClick={() => setPin(pin + '0')}
            className="btn btn-ghost text-2xl"
          >
            0
          </button>
          <button
            type="button"
            disabled={busy || pin.length !== 4}
            onClick={() => void claimStudent(picked.studentId, pin).then(() => setPin(''))}
            className="btn btn-good text-lg"
          >
            Vào
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setPicked(null)
            setPin('')
          }}
          className="text-base font-bold underline opacity-70"
        >
          Chọn lại bạn khác
        </button>
      </div>
    )
  }

  // Bước 2: chọn ảnh đại diện của mình trong danh sách lớp
  if (roster) {
    return (
      <div className="pixel-panel grid gap-4">
        <p className="text-center text-xl font-extrabold">Con là bạn nào?</p>
        <div className="grid grid-cols-3 gap-3">
          {roster.map((entry) => (
            <button
              key={entry.studentId}
              type="button"
              onClick={() => setPicked(entry)}
              className="rounded-2xl p-3 text-center"
              style={{ background: 'var(--color-paper-sunk)' }}
            >
              <span className="block text-4xl">{entry.avatar}</span>
              <span className="block text-base font-bold">{entry.name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setRoster(null)
            setClassCode('')
          }}
          className="text-base font-bold underline opacity-70"
        >
          Nhập lại mã lớp
        </button>
      </div>
    )
  }

  // Bước 1: nhập mã lớp
  return (
    <form
      className="pixel-panel grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void loadRoster(classCode).then((result) => {
          if (result.length > 0) setRoster(result)
        })
      }}
    >
      <label className="grid gap-2">
        <span className="font-bold">Mã lớp của con</span>
        <input
          value={classCode}
          onChange={(event) => setClassCode(event.target.value.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="VD: K7M2XP"
          className="rounded-2xl border-4 bg-white px-4 py-3 text-center text-3xl font-extrabold tracking-widest outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
        />
        <span className="text-base opacity-70">Thầy cô sẽ cho con mã này.</span>
      </label>
      <button type="submit" disabled={busy || classCode.length < 4} className="btn btn-primary text-xl">
        {busy ? 'Đang tìm lớp...' : 'Tiếp tục'}
      </button>
    </form>
  )
}

// --- Lối vào của người lớn -------------------------------------------------------

/** Ba việc người lớn làm ở màn này, mỗi việc một bộ ô nhập. */
type Doing = 'signIn' | 'register' | 'forgot'

function AdultLogin() {
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)
  const requestPasswordReset = useAuth((s) => s.requestPasswordReset)
  const busy = useAuth((s) => s.busy)
  const notice = useAuth((s) => s.notice)

  const [doing, setDoing] = useState<Doing>('signIn')
  const registering = doing === 'register'

  // Xong một việc thì về màn đăng nhập, vì đó là việc tiếp theo của họ. Để
  // nguyên ở ô đăng ký thì lời nhắn bảo "quay lại đăng nhập" mà trước mặt vẫn là
  // cái nút "Tạo tài khoản".
  useEffect(() => {
    if (notice) setDoing('signIn')
  }, [notice])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<SignUpRole>('parent')

  const submit = () => {
    if (doing === 'forgot') void requestPasswordReset(email)
    else if (registering) void signUp({ email, password, displayName, role })
    else void signIn({ email, password })
  }

  return (
    <form
      className="pixel-panel grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {registering && (
        <>
          <label className="grid gap-2">
            <span className="font-bold">Tên của bạn</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
              style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
            />
          </label>
{/*
            Hai vai, không có 'admin'. Quản trị viên là vai xoá được tài khoản
            người khác, nên nó chỉ được phong bởi một quản trị viên khác - máy chủ
            hạ mọi giá trị lạ xuống 'parent', xem `app/api/auth/signup/route.ts`.
          */}
          <div className="grid gap-2">
            <span className="font-bold">Bạn là</span>
            <div className="grid grid-cols-2 gap-2">
              {(['parent', 'teacher'] as SignUpRole[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className="rounded-2xl border-4 py-3 font-bold"
                  style={{
                    borderColor: role === value ? 'var(--color-brand)' : 'transparent',
                    background: role === value ? 'var(--color-brand-soft)' : 'var(--color-paper-sunk)',
                  }}
                >
                  {value === 'parent' ? 'Phụ huynh' : 'Giáo viên'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <label className="grid gap-2">
        <span className="font-bold">Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
        />
      </label>

      {doing !== 'forgot' && (
        <label className="grid gap-2">
          <span className="font-bold">Mật khẩu</span>
          <input
            type="password"
            autoComplete={registering ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
            style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
          />
        </label>
      )}

      {doing === 'forgot' && (
        <div className="grid gap-2">
          <p className="text-base leading-snug opacity-70">
            Nhập địa chỉ email của tài khoản. Chúng tôi sẽ gửi một liên kết để bạn chọn mật khẩu mới.
          </p>
          {/* Lối ra thứ hai, nói TRƯỚC chứ không đợi thư không tới rồi mới nói.
              Ở trường thì hỏi thầy cô quản trị thường nhanh hơn chờ hộp thư. */}
          <p
            className="rounded-xl p-2 text-base leading-snug"
            style={{ background: 'var(--color-paper-sunk)' }}
          >
            Không nhận được thư? Quản trị viên của trường đặt lại mật khẩu hộ bạn được ngay, không
            cần chờ.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={
          busy ||
          !email ||
          (doing !== 'forgot' && password.length < 6) ||
          (registering && !displayName)
        }
        className="btn btn-primary text-xl"
      >
        {busy
          ? 'Đang xử lý...'
          : doing === 'forgot'
            ? 'Gửi thư đặt lại mật khẩu'
            : registering
              ? 'Tạo tài khoản'
              : 'Đăng nhập'}
      </button>

      <div className="grid gap-2 text-center">
        {doing === 'signIn' && (
          <button
            type="button"
            onClick={() => setDoing('forgot')}
            className="text-base font-bold underline opacity-70"
          >
            Quên mật khẩu?
          </button>
        )}

        <button
          type="button"
          onClick={() => setDoing(registering ? 'signIn' : 'register')}
          className="text-base font-bold underline opacity-70"
        >
          {registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        </button>

        {doing === 'forgot' && (
          <button
            type="button"
            onClick={() => setDoing('signIn')}
            className="text-base font-bold underline opacity-70"
          >
            ← Quay lại đăng nhập
          </button>
        )}
      </div>
    </form>
  )
}
