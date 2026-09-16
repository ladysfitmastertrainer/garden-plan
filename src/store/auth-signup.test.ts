/**
 * Bấm "Tạo tài khoản" xong thì màn hình phải nói gì đó.
 *
 * Bug thật đã gặp: dự án còn bật "Confirm email" thì Supabase trả về người dùng
 * nhưng KHÔNG trả về phiên. Mã cũ chạy thẳng `init()`, `init()` không thấy phiên
 * nên để nguyên màn hình đăng nhập - bấm nút xong không có lỗi, không có lời
 * nào, không có gì đổi. Ai cũng tưởng nút hỏng.
 *
 * Ba nhánh phải phân biệt được, và không nhánh nào được im lặng:
 *   1. Có phiên ngay      -> vào thẳng app.
 *   2. Không có phiên     -> báo "kiểm tra hộp thư".
 *   3. Lỗi                -> báo lỗi, bằng tiếng Việt.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const signUp = vi.fn()
const getSession = vi.fn(async () => ({ data: { session: null } }))

vi.mock('../data/supabase-client', () => ({
  isSupabaseConfigured: () => true,
  getSupabase: async () => ({
    auth: { signUp, getSession, signOut: vi.fn() },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
  }),
  requireSupabase: async () => {
    throw new Error('không dùng trong test này')
  },
}))

// Kho trò chơi chạm vào IndexedDB; ở đây chỉ cần nó im lặng.
vi.mock('./game', () => ({
  configureRepository: vi.fn(),
  useGame: { getState: () => ({ init: vi.fn(async () => {}), selectStudent: vi.fn(async () => {}) }) },
}))

const { useAuth } = await import('./auth')

const DANG_KY = {
  email: 'coha@truong.edu.vn',
  password: 'MatKhau123',
  displayName: 'Cô Hà',
  role: 'teacher' as const,
}

beforeEach(() => {
  signUp.mockReset()
  getSession.mockReset()
  getSession.mockResolvedValue({ data: { session: null } })
  useAuth.setState({ error: null, notice: null, busy: false, mode: 'signed-out' })
})

describe('đăng ký xong thì màn hình nói gì', () => {
  it('chưa có phiên thì BÁO đi kiểm tra hộp thư, không im lặng', async () => {
    signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null })

    await useAuth.getState().signUp(DANG_KY)

    const { notice, error } = useAuth.getState()
    expect(notice).toBeTruthy()
    expect(notice).toContain('coha@truong.edu.vn')
    expect(notice).toMatch(/xác nhận/i)
    // Đây không phải lỗi - tô đỏ lên là doạ người ta.
    expect(error).toBeNull()
  })

  it('không khẳng định chắc "đã tạo tài khoản"', async () => {
    // Supabase trả về đúng kết quả này cho cả email ĐÃ đăng ký, để người lạ không
    // dò được ai đang dùng hệ thống. Nói chắc là nói sai một nửa số lần.
    signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null })

    await useAuth.getState().signUp(DANG_KY)
    expect(useAuth.getState().notice).toMatch(/nếu/i)
  })

  it('có phiên ngay thì không báo gì cả, vào thẳng app', async () => {
    signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: { access_token: 'x' } }, error: null })

    await useAuth.getState().signUp(DANG_KY)
    expect(useAuth.getState().notice).toBeNull()
  })

  it('bấm xong là hết bận, dù đi nhánh nào', async () => {
    // Còn `busy` thì nút vẫn khoá ở chữ "Đang xử lý..." vĩnh viễn.
    signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null })
    await useAuth.getState().signUp(DANG_KY)
    expect(useAuth.getState().busy).toBe(false)
  })
})

describe('lỗi nói bằng tiếng Việt', () => {
  const dich = async (raw: string) => {
    signUp.mockResolvedValue({ data: {}, error: new Error(raw) })
    await useAuth.getState().signUp(DANG_KY)
    return useAuth.getState().error ?? ''
  }

  it('hết lượt gửi thư', async () => {
    const text = await dich('email rate limit exceeded')
    expect(text).toMatch(/hết lượt/i)
    expect(text).not.toMatch(/rate limit/i)
  })

  it('email đã có tài khoản', async () => {
    expect(await dich('User already registered')).toMatch(/đã có tài khoản/i)
  })

  it('mật khẩu quá ngắn', async () => {
    expect(await dich('Password should be at least 6 characters')).toMatch(/6 ký tự/i)
  })

  it('máy chủ chưa bật chế độ cho trẻ', async () => {
    expect(await dich('Anonymous sign-ins are disabled')).toMatch(/mã lớp/i)
  })

  it('lỗi lạ thì giữ nguyên còn hơn đoán sai', async () => {
    const la = 'something nobody planned for'
    expect(await dich(la)).toBe(la)
  })

  it('có lỗi thì KHÔNG hiện kèm tin báo thành công', async () => {
    await dich('email rate limit exceeded')
    expect(useAuth.getState().notice).toBeNull()
  })
})
