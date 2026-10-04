/**
 * Màn hình đăng nhập - TỪNG BƯỚC, mỗi bước một màn hình.
 *
 *   Bước 0: ai đang vào? - hai lựa chọn lớn: Học sinh, hoặc Phụ huynh / Giáo viên.
 *   Học sinh:  mã lớp → chọn mình trong danh sách lớp → mã bí mật 4 số.
 *   Người lớn: email + mật khẩu (kèm đăng ký hai bước và quên mật khẩu).
 *
 * Bản trước đặt hai lối vào thành hai thẻ trên cùng một màn, và cả ba bước của
 * trẻ nằm chung khung với hàng thẻ ấy. Trên điện thoại thì mọi thứ chen nhau
 * trong một màn hình: cái lâu đài, hàng thẻ, ô nhập, nút - và trẻ không biết
 * mình đang ở bước nào. Mỗi bước một màn, có nút quay lại và dấu "Bước 1/3",
 * thì lúc nào cũng chỉ có ĐÚNG một việc trước mặt.
 *
 * Trẻ không bao giờ phải nhập email hay mật khẩu, và không gõ tên mình ra.
 */

import { useEffect, useRef, useState } from 'react'
import { useAuth, type RosterEntry, type SignUpRole } from '../../store/auth'
import { PasswordInput } from '../../ui/PasswordInput'

type Who = 'child' | 'adult' | null

export function AuthScreen() {
  const [who, setWho] = useState<Who>(null)
  const error = useAuth((s) => s.error)
  const notice = useAuth((s) => s.notice)
  const clearError = useAuth((s) => s.clearError)

  const choose = (next: Who) => {
    clearError()
    setWho(next)
  }

  /*
    Màn đăng nhập VỪA ĐÚNG MỘT MÀN HÌNH, không phải một trang cuộn - xem
    `auth-layout` trong `globals.css`: phần đầu giữ nguyên cỡ, chỉ KHUNG NHẬP
    được co và cuộn.
  */
  return (
    <div className="pixel-ui auth-layout mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 py-8">
      {/* Màn chọn vai mới có cái lâu đài to: đó là màn chào. Các bước sau chỉ giữ
          tên app cho nhỏ - chỗ ấy dành cho việc đang làm. */}
      <header className="auth-head text-center">
        {who === null && <p className="auth-crest text-6xl">🏰</p>}
        <h1 className={`pixel-font ${who === null ? 'text-4xl' : 'text-2xl opacity-70'}`}>HỌC VIỆN TRÍ TUỆ</h1>
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

      {who === null && <ChooseWho onChoose={choose} />}
      {who === 'child' && <ChildLogin onBack={() => choose(null)} />}
      {who === 'adult' && <AdultLogin onBack={() => choose(null)} />}
    </div>
  )
}

/**
 * Thanh đầu mỗi bước: nút quay lại bên trái, "Bước x/y" bên phải.
 *
 * Nút quay lại luôn ở ĐÚNG một chỗ ở mọi bước, nên ngón tay quen chỗ ấy sau một
 * lần bấm. Và nó là một nút thật, to cỡ ngón tay, chứ không phải dòng chữ gạch
 * chân ở cuối khung như bản trước - thứ trẻ bảy tuổi không nhận ra là bấm được.
 */
function StepBar({ onBack, step, total, label }: { onBack: () => void; step?: number; total?: number; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onBack} className="btn btn-ghost px-4 text-lg" style={{ minHeight: 44 }}>
        ← Quay lại
      </button>
      <span className="pixel-font text-right text-base leading-tight opacity-70">
        {label ?? (step && total ? `Bước ${step}/${total}` : '')}
      </span>
    </div>
  )
}

// --- Bước 0: chọn vai -------------------------------------------------------------

function ChooseWho({ onChoose }: { onChoose: (who: Who) => void }) {
  return (
    <div className="pixel-panel grid gap-4">
      <p className="text-center text-xl font-extrabold">Ai đang vào học thế?</p>
      {(
        [
          { who: 'child', icon: '🎒', title: 'Học sinh', hint: 'Vào bằng mã lớp thầy cô cho' },
          { who: 'adult', icon: '👨‍👩‍👧', title: 'Phụ huynh / Giáo viên', hint: 'Vào bằng email và mật khẩu' },
        ] as const
      ).map((option) => (
        <button
          key={option.who}
          type="button"
          onClick={() => onChoose(option.who)}
          className="flex items-center gap-4 rounded-2xl border-4 p-5 text-left"
          style={{ borderColor: 'var(--color-brand)', background: 'var(--color-brand-soft)' }}
        >
          <span className="text-5xl leading-none" aria-hidden="true">
            {option.icon}
          </span>
          <span className="grid gap-1">
            <span className="pixel-font text-2xl leading-tight">{option.title}</span>
            <span className="text-base opacity-70">{option.hint}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

// --- Lối vào của trẻ -----------------------------------------------------------

function ChildLogin({ onBack }: { onBack: () => void }) {
  const loadRoster = useAuth((s) => s.loadRoster)
  const claimStudent = useAuth((s) => s.claimStudent)
  const busy = useAuth((s) => s.busy)

  const [classCode, setClassCode] = useState('')
  const [roster, setRoster] = useState<RosterEntry[] | null>(null)
  const [picked, setPicked] = useState<RosterEntry | null>(null)
  const [pin, setPin] = useState('')
  const pinRef = useRef<HTMLInputElement>(null)

  /*
    Đủ bốn số là VÀO LUÔN, không bắt bấm thêm nút.

    Sai mã thì xoá trắng để gõ lại từ đầu - giữ lại ba số đúng một số sai thì trẻ
    không biết số nào sai, chỉ biết xoá từng số một.
  */
  useEffect(() => {
    if (!picked || pin.length !== 4 || busy) return
    void claimStudent(picked.studentId, pin).then(() => {
      setPin('')
      pinRef.current?.focus()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, picked])

  // Bước 3: nhập mã bí mật
  if (picked) {
    return (
      <div className="pixel-panel grid gap-5 text-center">
        <StepBar
          step={3}
          total={3}
          onBack={() => {
            setPicked(null)
            setPin('')
          }}
        />
        <div>
          <p className="text-6xl">{picked.avatar}</p>
          <p className="text-2xl font-extrabold">{picked.name}</p>
        </div>

        {/*
          Ô nhập THẬT, không phải bàn phím vẽ trên màn hình.

          Bản trước tự vẽ một bàn phím số 0-9 chiếm nửa màn hình. Trên điện
          thoại cái đó thừa hẳn: máy vốn đã có bàn phím, và `inputMode="numeric"`
          gọi đúng bàn phím số của máy ra - to, quen tay. Trên máy tính thì gõ
          phím số luôn.

          Bốn ô tròn vẫn giữ để trẻ thấy mình đã gõ mấy số: ô nhập thật nằm
          trong suốt ĐÈ LÊN bốn ô ấy, nên chạm vào đâu trong dải ô cũng là chạm
          vào ô nhập, và bàn phím bật lên.
        */}
        <label className="grid justify-items-center gap-2">
          <span className="font-bold">Nhập mã bí mật 4 số của con</span>
          <span className="relative flex justify-center gap-2">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="flex h-16 w-14 items-center justify-center rounded-2xl border-4 bg-white text-3xl font-extrabold"
                style={{
                  borderColor:
                    pin.length === index ? 'var(--color-brand)' : 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
                }}
                aria-hidden="true"
              >
                {pin[index] ? '●' : ''}
              </span>
            ))}
            <input
              ref={pinRef}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoComplete="off"
              autoFocus
              disabled={busy}
              aria-label="Mã bí mật 4 số"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              style={{ caretColor: 'transparent' }}
            />
          </span>
          <span className="text-base opacity-70">{busy ? 'Đang mở cửa...' : 'Chạm vào ô để gõ mã'}</span>
        </label>
      </div>
    )
  }

  // Bước 2: chọn ảnh đại diện của mình trong danh sách lớp
  if (roster) {
    return (
      <div className="pixel-panel grid gap-4">
        <StepBar
          step={2}
          total={3}
          onBack={() => {
            setRoster(null)
            setClassCode('')
          }}
        />
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
      <StepBar step={1} total={3} onBack={onBack} />
      <label className="grid gap-2">
        <span className="text-xl font-extrabold">Mã lớp của con</span>
        <input
          value={classCode}
          onChange={(event) => setClassCode(event.target.value.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          autoFocus
          placeholder="VD: K7M2XP"
          className="rounded-2xl border-4 bg-white px-4 py-3 text-center text-3xl font-extrabold tracking-widest outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
        />
        <span className="text-base opacity-70">Thầy cô sẽ cho con mã này.</span>
      </label>
      <button type="submit" disabled={busy || classCode.length < 4} className="btn btn-primary text-xl">
        {busy ? 'Đang tìm lớp...' : 'Tiếp tục →'}
      </button>
    </form>
  )
}

// --- Lối vào của người lớn -------------------------------------------------------

/**
 * Bốn việc người lớn làm ở màn này, mỗi việc một bộ ô nhập.
 *
 * ĐĂNG KÝ CHIẾM HAI VIỆC, không phải một, và đó là chỗ khác so với bản đầu.
 *
 * Gộp cả bốn ô vào một biểu mẫu thì nó cao 933px - trên một máy 360×640 nghĩa
 * là hơn một màn hình rưỡi, nên nút "Tạo tài khoản" nằm ngoài tầm nhìn cho tới
 * khi người ta vuốt xuống. Cắt làm hai thì mỗi nửa vừa một màn hình ở mọi cỡ
 * máy, và không có gì phải cuộn nữa.
 *
 * Cắt ở đâu cũng có chủ ý: "bạn là ai" (tên, vai trò) là những câu hỏi về CON
 * NGƯỜI, "tài khoản" (email, mật khẩu) là những câu hỏi về CÁCH ĐĂNG NHẬP. Cắt
 * giữa hai nhóm ấy thì mỗi màn có một chủ đề đọc ra được, chứ không phải bốn ô
 * bị chặt đôi cho vừa màn hình.
 */
type Doing = 'signIn' | 'registerWho' | 'registerAccount' | 'forgot'

function AdultLogin({ onBack }: { onBack: () => void }) {
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)
  const requestPasswordReset = useAuth((s) => s.requestPasswordReset)
  const busy = useAuth((s) => s.busy)
  const notice = useAuth((s) => s.notice)

  const [doing, setDoing] = useState<Doing>('signIn')
  /** Đang ở một trong hai bước đăng ký - dùng cho những chỗ không cần biết bước nào. */
  const registering = doing === 'registerWho' || doing === 'registerAccount'

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

  /*
    Bấm nút chính làm gì - MỘT chỗ duy nhất trả lời, kể cả bước một.

    Bước một không gửi gì lên máy chủ, nó chỉ đi tiếp sang bước hai. Nhưng nó
    vẫn là `submit` của một `<form>` thật, nên bấm Enter trong ô tên cũng đi
    tiếp được - trên máy tính đó là thứ người ta làm theo phản xạ, và một biểu
    mẫu nuốt phím Enter thì trông như bị treo.
  */
  const submit = () => {
    if (doing === 'forgot') void requestPasswordReset(email)
    else if (doing === 'registerWho') setDoing('registerAccount')
    else if (doing === 'registerAccount') void signUp({ email, password, displayName, role })
    else void signIn({ email, password })
  }

  /** Nút chính đang bị khoá vì còn thiếu gì đó. */
  const blocked =
    doing === 'registerWho'
      ? !displayName.trim()
      : doing === 'forgot'
        ? !email
        : !email || password.length < 6

  return (
    <form
      className="pixel-panel grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {/*
        Thanh đầu: nút quay lại cùng một chỗ với các bước của trẻ. Đang ở một
        việc con (đăng ký, quên mật khẩu) thì lùi một bước; đang ở màn đăng nhập
        thì lùi về màn chọn vai.
      */}
      <StepBar
        onBack={() => (doing === 'signIn' ? onBack() : setDoing(doing === 'registerAccount' ? 'registerWho' : 'signIn'))}
        label={
          doing === 'forgot'
            ? 'Quên mật khẩu'
            : registering
              ? `Tạo tài khoản · ${doing === 'registerWho' ? '1' : '2'}/2`
              : 'Phụ huynh / Giáo viên'
        }
      />

      {/*
        Bước hai nhắc lại tên vừa nhập. Một màn chỉ có email và mật khẩu thì
        không có gì nói cho người ta biết mình đang tạo tài khoản cho AI - nhất
        là khi một thầy cô lập hộ đồng nghiệp. ("Bước 1/2" thì đã nằm trên thanh
        đầu, xem `StepBar`.)
      */}
      {doing === 'registerAccount' && (
        <p className="text-center text-base leading-snug opacity-70">
          <strong>{displayName}</strong> · {role === 'parent' ? 'Phụ huynh' : 'Giáo viên'}
        </p>
      )}

      {doing === 'registerWho' && (
        <>
          <label className="grid gap-2">
            <span className="font-bold">Tên của bạn</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoFocus
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


      {doing !== 'registerWho' && (
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
      )}

      {(doing === 'signIn' || doing === 'registerAccount') && (
        <label className="grid gap-2">
          <span className="font-bold">Mật khẩu</span>
          <PasswordInput
            label="Mật khẩu"
            autoComplete={registering ? 'new-password' : 'current-password'}
            value={password}
            onChange={setPassword}
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

      <button type="submit" disabled={busy || blocked} className="btn btn-primary text-xl">
        {busy
          ? 'Đang xử lý...'
          : doing === 'forgot'
            ? 'Gửi thư đặt lại mật khẩu'
            : doing === 'registerWho'
              ? 'Tiếp tục →'
              : doing === 'registerAccount'
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

        {/*
          Lùi một bước thì dùng nút "← Quay lại" trên thanh đầu - và lùi KHÔNG
          xoá gì cả: mọi ô nhập sống ở `AdultLogin`, không sống trong từng bước,
          nên người ta lùi lại sửa cái tên rồi đi tiếp mà email vẫn còn nguyên.

          Ở bước hai, liên kết về đăng nhập biến đi: thanh đầu đã có lối lùi, và
          một hàng chữ ở đây đúng bằng khoảng còn thiếu để cả bước hai nằm gọn
          trong một màn hình điện thoại nhỏ.
        */}
        {doing !== 'registerAccount' && doing !== 'forgot' && (
          <button
            type="button"
            onClick={() => setDoing(registering ? 'signIn' : 'registerWho')}
            className="text-base font-bold underline opacity-70"
          >
            {registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
        )}
      </div>
    </form>
  )
}
