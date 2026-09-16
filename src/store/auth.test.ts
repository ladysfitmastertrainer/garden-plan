/**
 * Kho xác thực, chạy với một máy chủ `/api` giả.
 *
 * Thay cho `auth-signup.test.ts` và `auth-recovery.test.ts` cũ. Hai bộ đó kiểm
 * những luồng đã đi cùng Supabase Auth phía trình duyệt: xác nhận email, gửi lại
 * thư, đặt lại mật khẩu qua liên kết trong hộp thư. App giờ không gửi lá thư
 * nào - tài khoản tạo ra đã xác nhận sẵn, và quên mật khẩu thì quản trị viên đặt
 * lại hộ.
 *
 * Cái còn lại để kiểm, và là cái đáng kiểm hơn: kho này đọc đúng câu trả lời của
 * máy chủ chưa, và hỏng thì có nói ra không.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from './auth'
import { useGame } from './game'

/** Những lần trình duyệt gọi ra ngoài, để kiểm gọi đúng chỗ đúng cách. */
let calls: Array<{ path: string; method: string; body: unknown }> = []

/**
 * Máy chủ giả.
 *
 * `routes` chỉ cần khai những đường dẫn mà test quan tâm; mọi đường khác trả về
 * một câu trả lời rỗng hợp lệ, để `useGame.init()` chạy qua được mà không phải
 * dựng cả một database giả.
 */
function fakeServer(routes: Record<string, { status?: number; body: unknown }>): void {
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const path = String(url).split('?')[0]!
    const method = init?.method ?? 'GET'
    calls.push({ path, method, body: init?.body ? JSON.parse(String(init.body)) : undefined })

    const route = routes[`${method} ${path}`] ?? routes[path]
    if (route) {
      return new Response(JSON.stringify(route.body), { status: route.status ?? 200 })
    }

    // Mặc định: không có học sinh nào, không có nội dung tự soạn nào.
    return new Response(
      JSON.stringify({ students: [], attempts: [], ownerId: null, questions: [], hidden: [], skillNames: [] }),
      { status: 200 },
    )
  })
}

const CO_HA = { mode: 'adult', displayName: 'Cô Hà', role: 'teacher' }

beforeEach(() => {
  calls = []
  useAuth.setState({
    ready: false,
    mode: 'signed-out',
    displayName: null,
    role: null,
    childStudentId: null,
    busy: false,
    error: null,
    notice: null,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('mở app', () => {
  it('chưa đăng nhập thì dừng ở màn đăng nhập, không báo lỗi', async () => {
    fakeServer({ '/api/auth/session': { body: { mode: 'signed-out' } } })

    await useAuth.getState().init()
    const state = useAuth.getState()
    expect(state.ready).toBe(true)
    expect(state.mode).toBe('signed-out')
    // Chưa đăng nhập là một câu trả lời hợp lệ, không phải một lỗi.
    expect(state.error).toBeNull()
  })

  it('đã có phiên thì vào thẳng, không hỏi lại mật khẩu', async () => {
    fakeServer({ '/api/auth/session': { body: CO_HA } })

    await useAuth.getState().init()
    expect(useAuth.getState()).toMatchObject({
      ready: true,
      mode: 'adult',
      displayName: 'Cô Hà',
      role: 'teacher',
    })
  })

  it('mất mạng lúc mở app thì NÓI RA, không xoay vòng mãi', async () => {
    /*
      Đây là lỗi mà bản cũ hay để lọt nhất. `ready` phải bật lên kể cả khi hỏng -
      không thì màn hình đứng ở con dấu 🏰 nhấp nháy vĩnh viễn và không ai biết
      chuyện gì đang xảy ra.
    */
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })

    await useAuth.getState().init()
    const state = useAuth.getState()
    expect(state.ready).toBe(true)
    expect(state.mode).toBe('signed-out')
    expect(state.error).toMatch(/Không nối được máy chủ/)
  })
})

describe('người lớn đăng nhập', () => {
  it('gửi email và mật khẩu tới đúng route', async () => {
    fakeServer({ 'POST /api/auth/login': { body: CO_HA } })

    await useAuth.getState().signIn({ email: 'coha@truong.edu.vn', password: 'matkhau' })

    const login = calls.find((c) => c.path === '/api/auth/login')
    expect(login).toMatchObject({
      method: 'POST',
      body: { email: 'coha@truong.edu.vn', password: 'matkhau' },
    })
    expect(useAuth.getState().mode).toBe('adult')
  })

  it('sai mật khẩu thì hiện đúng câu máy chủ nói, không dịch lại', async () => {
    // Bảng dịch lỗi đã chuyển hẳn sang máy chủ. Kho này chỉ chuyển tiếp - dịch
    // thêm một lần nữa ở đây là hai nơi cùng sửa một câu, và chúng sẽ lệch nhau.
    fakeServer({
      'POST /api/auth/login': { status: 400, body: { error: 'Email hoặc mật khẩu chưa đúng.' } },
    })

    await useAuth.getState().signIn({ email: 'coha@truong.edu.vn', password: 'sai' })
    expect(useAuth.getState().error).toBe('Email hoặc mật khẩu chưa đúng.')
    expect(useAuth.getState().mode).toBe('signed-out')
  })

  it('hỏng rồi thì vẫn tắt cờ bận, nút không kẹt', async () => {
    fakeServer({ 'POST /api/auth/login': { status: 500, body: { error: 'Máy chủ gặp trục trặc.' } } })

    await useAuth.getState().signIn({ email: 'a@b.com', password: 'matkhau' })
    expect(useAuth.getState().busy).toBe(false)
  })

  it('đăng ký gửi kèm vai người dùng tự chọn', async () => {
    fakeServer({
      'POST /api/auth/signup': { body: { mode: 'adult', displayName: 'Cô Lan', role: 'teacher' } },
    })

    await useAuth.getState().signUp({
      email: 'lan@truong.edu.vn',
      password: 'matkhau',
      displayName: 'Cô Lan',
      role: 'teacher',
    })

    expect(calls.find((c) => c.path === '/api/auth/signup')!.body).toMatchObject({
      displayName: 'Cô Lan',
      role: 'teacher',
    })
    expect(useAuth.getState().role).toBe('teacher')
  })
})

describe('quên mật khẩu', () => {
  it('xin thư xong thì hiện lời nhắn của máy chủ, không tự viết lại', async () => {
    /*
      Lời nhắn cố ý mập mờ - "NẾU đây là địa chỉ của một tài khoản" - để ô này
      không trở thành công cụ dò xem ai đang dùng hệ thống. Viết lại cho "rõ
      ràng" ở phía trình duyệt là phá đúng điều nó đang bảo vệ, nên kho này chỉ
      chuyển tiếp nguyên văn.
    */
    const notice = 'Nếu a@b.com là địa chỉ của một tài khoản, thư đặt lại mật khẩu vừa được gửi.'
    fakeServer({ 'POST /api/auth/forgot': { body: { notice } } })

    await useAuth.getState().requestPasswordReset('a@b.com')
    expect(useAuth.getState().notice).toBe(notice)
    // Tin vui thì tô xanh, không tô đỏ như lỗi.
    expect(useAuth.getState().error).toBeNull()
  })

  it('máy chủ thư hỏng thì báo lỗi, KHÔNG báo đã gửi', async () => {
    // Đây là lỗi tệ nhất để nuốt: người dùng ngồi chờ một lá thư không bao giờ
    // tới, và không ai bảo cho biết.
    fakeServer({
      'POST /api/auth/forgot': { status: 500, body: { error: 'Error sending recovery email' } },
    })

    await useAuth.getState().requestPasswordReset('a@b.com')
    expect(useAuth.getState().error).toBeTruthy()
    expect(useAuth.getState().notice).toBeNull()
  })

  it('đặt mật khẩu mới xong là đăng nhập luôn', async () => {
    fakeServer({
      'POST /api/auth/reset': { body: { mode: 'adult', displayName: 'Cô Hà', role: 'teacher' } },
    })

    await useAuth.getState().resetPassword('token-tu-lien-ket', 'matkhaumoi')

    expect(calls.find((c) => c.path === '/api/auth/reset')!.body).toEqual({
      accessToken: 'token-tu-lien-ket',
      password: 'matkhaumoi',
    })
    expect(useAuth.getState().mode).toBe('adult')
    expect(useAuth.getState().notice).toMatch(/Đã đổi mật khẩu/)
  })

  it('liên kết hết hạn thì báo lỗi và KHÔNG mở phiên nào', async () => {
    fakeServer({
      'POST /api/auth/reset': {
        status: 400,
        body: { error: 'Liên kết trong thư đã hết hạn hoặc đã được dùng rồi.' },
      },
    })

    await useAuth.getState().resetPassword('token-cu', 'matkhaumoi')
    expect(useAuth.getState().error).toMatch(/hết hạn/)
    expect(useAuth.getState().mode).toBe('signed-out')
  })
})

describe('trẻ vào bằng mã lớp', () => {
  it('lấy được danh sách lớp mà KHÔNG cần đăng nhập trước', async () => {
    fakeServer({
      'POST /api/auth/roster': {
        body: { roster: [{ studentId: 'be-an', name: 'An', avatar: '🦊', grade: 2 }] },
      },
    })

    const roster = await useAuth.getState().loadRoster('k7m2xp')
    expect(roster).toHaveLength(1)
    // Không có lời gọi đăng nhập nào chen vào trước đó - bản cũ phải tạo một
    // phiên ẩn danh của Supabase mới gọi được RPC.
    expect(calls.map((c) => c.path)).toEqual(['/api/auth/roster'])
  })

  it('lớp rỗng thì nói bằng lời trẻ hiểu được', async () => {
    fakeServer({ 'POST /api/auth/roster': { body: { roster: [] } } })

    await useAuth.getState().loadRoster('k7m2xp')
    expect(useAuth.getState().error).toMatch(/Hỏi lại thầy cô/)
  })

  it('đúng mã PIN thì vào thẳng hồ sơ của mình', async () => {
    fakeServer({
      'POST /api/auth/claim': { body: { mode: 'child', studentId: 'be-an' } },
      '/api/students': {
        body: {
          students: [
            {
              id: 'be-an',
              name: 'An',
              avatar: '🦊',
              grade: 2,
              totalXp: 0,
              gold: 0,
              equippedItemIds: [],
              createdAt: 0,
              lastPlayedAt: 0,
            },
          ],
        },
      },
      '/api/students/be-an/progress': {
        body: {
          progress: {
            mastery: {},
            inventory: [],
            pets: [],
            petXp: {},
            virtues: {},
            clearedNodes: {},
            battlesPlayed: 0,
            battlesWon: 0,
          },
        },
      },
    })

    await useAuth.getState().claimStudent('be-an', '1234')
    const state = useAuth.getState()
    expect(state.mode).toBe('child')
    expect(state.childStudentId).toBe('be-an')
    // Hồ sơ được chọn sẵn - không bao giờ hiện danh sách cho trẻ thấy bạn khác.
    expect(useGame.getState().student?.id).toBe('be-an')
  })

  it('sai mã PIN thì báo lỗi và không có phiên nào được mở', async () => {
    fakeServer({
      'POST /api/auth/claim': {
        status: 400,
        body: { error: 'Mã PIN chưa đúng. Con thử lại nhé.' },
      },
    })

    await useAuth.getState().claimStudent('be-an', '0000')
    expect(useAuth.getState().error).toMatch(/Mã PIN chưa đúng/)
    expect(useAuth.getState().mode).toBe('signed-out')
  })
})

describe('đăng xuất', () => {
  it('dọn sạch trạng thái kể cả khi máy chủ không trả lời', async () => {
    // Người bấm "Thoát" muốn ra khỏi tài khoản ngay, không muốn nghe về lỗi mạng.
    useAuth.setState({ mode: 'adult', displayName: 'Cô Hà', role: 'teacher' })
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })

    await useAuth.getState().signOut()
    expect(useAuth.getState()).toMatchObject({
      mode: 'signed-out',
      displayName: null,
      role: null,
      childStudentId: null,
    })
  })
})

describe('đổi mật khẩu', () => {
  it('gửi cả mật khẩu cũ lẫn mới', async () => {
    // Bắt nhập lại mật khẩu cũ là có chủ ý: cookie phiên sống 30 ngày, nên một
    // máy bỏ quên ở phòng giáo viên vẫn đang đăng nhập.
    fakeServer({ 'POST /api/auth/password': { body: { ok: true } } })

    await useAuth.getState().changePassword({ currentPassword: 'cu', newPassword: 'moi123' })
    expect(calls.find((c) => c.path === '/api/auth/password')!.body).toEqual({
      currentPassword: 'cu',
      newPassword: 'moi123',
    })
    expect(useAuth.getState().notice).toMatch(/Đã đổi mật khẩu/)
  })

  it('sai mật khẩu cũ thì báo lỗi, không báo thành công', async () => {
    fakeServer({
      'POST /api/auth/password': { status: 400, body: { error: 'Mật khẩu hiện tại chưa đúng.' } },
    })

    await useAuth.getState().changePassword({ currentPassword: 'sai', newPassword: 'moi123' })
    expect(useAuth.getState().error).toBe('Mật khẩu hiện tại chưa đúng.')
    expect(useAuth.getState().notice).toBeNull()
  })
})
