/**
 * Luồng quên mật khẩu, và việc đọc liên kết gửi qua email.
 *
 * Chỗ dễ sai nhất ở đây không phải lời gọi API, mà là THỨ TỰ: người tới từ thư
 * đặt lại mật khẩu ĐÃ có phiên hợp lệ. Nếu cứ thấy có phiên là thả vào game thì
 * màn đặt mật khẩu không bao giờ hiện ra, phiên kia hết hạn, và tài khoản mất
 * thật - đúng cái ta đang đi chữa.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateUser = vi.fn()
const resetPasswordForEmail = vi.fn()
const resend = vi.fn()
const signOut = vi.fn(async () => ({ error: null }))
const getSession = vi.fn()

vi.mock('../data/supabase-client', () => ({
  isSupabaseConfigured: () => true,
  getSupabase: async () => ({
    auth: { updateUser, resetPasswordForEmail, resend, signOut, getSession, signUp: vi.fn() },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  }),
  requireSupabase: async () => {
    throw new Error('không dùng trong test này')
  },
}))

vi.mock('./game', () => ({
  configureRepository: vi.fn(),
  useGame: { getState: () => ({ init: vi.fn(async () => {}), selectStudent: vi.fn(async () => {}) }) },
}))

vi.mock('../data/content-sync', () => ({ syncCustomContent: vi.fn(async () => ({})) }))

/**
 * `auth.ts` đọc phần "#" của địa chỉ NGAY lúc nạp mô-đun, nên phải dựng `window`
 * trước khi import. Đây cũng chính là thứ đang được kiểm.
 */
const HASH = '#access_token=abc&type=recovery&refresh_token=def'
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: { hash: HASH, origin: 'https://truong.example', pathname: '/' },
    history: { replaceState: vi.fn() },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
})

const { useAuth } = await import('./auth')

beforeEach(() => {
  for (const spy of [updateUser, resetPasswordForEmail, resend, signOut, getSession]) spy.mockReset()
  signOut.mockResolvedValue({ error: null })
  getSession.mockResolvedValue({ data: { session: null } })
  useAuth.setState({ error: null, notice: null, busy: false, recovering: false, mode: 'signed-out' })
})

describe('tới từ thư đặt lại mật khẩu', () => {
  it('có phiên rồi vẫn KHÔNG được thả vào app', async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'coha@truong.edu.vn' } } },
    })

    await useAuth.getState().init()

    const state = useAuth.getState()
    expect(state.recovering).toBe(true)
    expect(state.mode).toBe('signed-out')
    expect(state.ready).toBe(true)
  })
})

describe('xin thư đặt lại mật khẩu', () => {
  it('nói rõ quay về ĐÚNG trang này', async () => {
    // Bỏ trống thì Supabase dùng "Site URL" ở bảng điều khiển - mặc định
    // localhost:3000, tức là người dùng bấm xong rơi vào một địa chỉ trống.
    resetPasswordForEmail.mockResolvedValue({ error: null })

    await useAuth.getState().requestPasswordReset('coha@truong.edu.vn')

    expect(resetPasswordForEmail).toHaveBeenCalledWith('coha@truong.edu.vn', {
      redirectTo: 'https://truong.example',
    })
  })

  it('báo đã gửi mà KHÔNG khẳng định địa chỉ đó có tài khoản', async () => {
    // Khẳng định là để người lạ dò ra ai đang dùng hệ thống.
    resetPasswordForEmail.mockResolvedValue({ error: null })

    await useAuth.getState().requestPasswordReset('coha@truong.edu.vn')

    const { notice } = useAuth.getState()
    expect(notice).toMatch(/nếu/i)
    expect(notice).toContain('coha@truong.edu.vn')
  })

  it('hỏng thì báo lỗi bằng tiếng Việt, không im lặng', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: new Error('email rate limit exceeded') })

    await useAuth.getState().requestPasswordReset('coha@truong.edu.vn')

    expect(useAuth.getState().error).toMatch(/hết lượt/i)
    expect(useAuth.getState().notice).toBeNull()
  })
})

describe('đặt mật khẩu mới', () => {
  it('lưu xong thì thoát hẳn luồng và mời đăng nhập lại', async () => {
    updateUser.mockResolvedValue({ error: null })
    useAuth.setState({ recovering: true })

    await useAuth.getState().updatePassword('MatKhauMoi123')

    expect(updateUser).toHaveBeenCalledWith({ password: 'MatKhauMoi123' })
    expect(useAuth.getState().recovering).toBe(false)
    expect(useAuth.getState().notice).toMatch(/đăng nhập lại/i)
  })

  it('dọn phần "#" khỏi địa chỉ để tải lại trang không rơi vào đây nữa', async () => {
    updateUser.mockResolvedValue({ error: null })
    useAuth.setState({ recovering: true })

    await useAuth.getState().updatePassword('MatKhauMoi123')

    expect(window.history.replaceState).toHaveBeenCalled()
  })

  it('đăng xuất phiên tạm sau khi đổi xong', async () => {
    // Phiên này do liên kết trong thư cấp, không phải do người dùng đăng nhập.
    // Để nguyên là ai cầm máy cũng vào thẳng được tài khoản đó.
    updateUser.mockResolvedValue({ error: null })
    useAuth.setState({ recovering: true })

    await useAuth.getState().updatePassword('MatKhauMoi123')

    expect(signOut).toHaveBeenCalled()
  })

  it('hỏng thì GIỮ NGUYÊN màn đặt mật khẩu để thử lại', async () => {
    updateUser.mockResolvedValue({ error: new Error('New password should be different from the old password.') })
    useAuth.setState({ recovering: true })

    await useAuth.getState().updatePassword('MatKhauCu')

    expect(useAuth.getState().recovering).toBe(true)
    expect(useAuth.getState().error).toMatch(/khác mật khẩu cũ/i)
  })

  it('bấm xong là hết bận, dù đi nhánh nào', async () => {
    updateUser.mockResolvedValue({ error: new Error('bất kỳ lỗi gì') })
    await useAuth.getState().updatePassword('MatKhauMoi123')
    expect(useAuth.getState().busy).toBe(false)
  })
})

describe('gửi lại thư xác nhận', () => {
  it('gửi đúng loại và nói rõ quay về đâu', async () => {
    resend.mockResolvedValue({ error: null })

    await useAuth.getState().resendConfirmation('coha@truong.edu.vn')

    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'coha@truong.edu.vn',
      options: { emailRedirectTo: 'https://truong.example' },
    })
    expect(useAuth.getState().notice).toMatch(/hộp thư rác/i)
  })
})

describe('dịch lỗi của liên kết trong thư', () => {
  const dich = async (raw: string) => {
    resetPasswordForEmail.mockResolvedValue({ error: new Error(raw) })
    await useAuth.getState().requestPasswordReset('a@b.com')
    return useAuth.getState().error ?? ''
  }

  it('liên kết hết hạn KHÔNG bị dịch nhầm thành lỗi địa chỉ email', async () => {
    // Bug thật: mẫu /is invalid/ đứng trước nên nuốt luôn câu này, và người dùng
    // nhận lời khuyên đi đổi email trong khi việc cần làm là xin liên kết mới.
    const text = await dich('Email link is invalid or has expired')
    expect(text).toMatch(/hết hạn|dùng rồi/i)
    expect(text).not.toMatch(/đổi|địa chỉ khác/i)
  })

  it('địa chỉ email hỏng thì vẫn dịch đúng thành lỗi địa chỉ', async () => {
    expect(await dich('Email address "x@y" is invalid')).toMatch(/địa chỉ email/i)
  })

  it('máy chủ không gửi được thư thì chỉ sang quản trị viên', async () => {
    const text = await dich('Error sending confirmation email')
    expect(text).toMatch(/quản trị viên/i)
  })

  it('lỗi thư KHÔNG nuốt mất câu về liên kết hết hạn', async () => {
    // Mẫu `/error sending|smtp|mail/` từng khớp cả "Email link is invalid or has
    // expired" - hai lỗi khác hẳn nhau, hai việc cần làm khác hẳn nhau.
    const text = await dich('Email link is invalid or has expired')
    expect(text).not.toMatch(/quản trị viên/i)
    expect(text).toMatch(/hết hạn|dùng rồi/i)
  })

  it('phiên hỏng thì chỉ đường về nút Quên mật khẩu', async () => {
    expect(await dich('invalid JWT: unable to parse or verify signature')).toMatch(/quên mật khẩu/i)
  })
})
