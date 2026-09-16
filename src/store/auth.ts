/**
 * Xác thực.
 *
 * Ba trạng thái, bỏ đi một so với bản cũ:
 *  - `signed-out` : chưa ai đăng nhập.
 *  - `adult`      : phụ huynh, giáo viên hoặc quản trị viên, đăng nhập bằng email.
 *  - `child`      : trẻ trên máy dùng chung, phiên gắn với đúng một hồ sơ.
 *
 * Trạng thái `offline` cũ đã bỏ. App giờ yêu cầu có mạng, nên "chưa cấu hình máy
 * chủ" không còn là một chế độ chơi được - nó là một lỗi cấu hình, và máy chủ nói
 * thẳng ra điều đó thay vì lặng lẽ chuyển sang lưu trên máy.
 *
 * Trẻ em KHÔNG có email và KHÔNG có mật khẩu. Trên máy của gia đình, phụ huynh
 * đăng nhập rồi chọn hồ sơ con - trẻ không cần đăng nhập gì cả.
 *
 * Toàn bộ bảng dịch lỗi tiếng Anh sang tiếng Việt đã chuyển sang máy chủ (xem
 * `src/server/http.ts` và `app/api/auth/login/route.ts`). Ở đây chỉ còn
 * `error.message` - đã là câu tiếng Việt sẵn sàng hiện lên màn hình.
 */

import { create } from 'zustand'
import { apiRepository } from '../data/api'
import { syncCustomContent } from '../data/content-sync'
import { request } from '../data/request'
import { configureRepository, useGame } from './game'

export type AuthMode = 'signed-out' | 'adult' | 'child'

/**
 * Vai của người lớn.
 *
 * 'admin' là người tạo tài khoản cho người khác. Nó KHÔNG phải một vai tách biệt
 * với hai vai kia - quản trị viên vẫn quản lý lớp và xem tiến độ như giáo viên,
 * chỉ thêm quyền tạo tài khoản.
 */
export type AdultRole = 'parent' | 'teacher' | 'admin'

/**
 * Vai chọn được khi tự đăng ký.
 *
 * Cố ý KHÔNG phải `AdultRole`: 'admin' không bao giờ ra được từ biểu mẫu công
 * khai, và kiểu này là chỗ nói điều đó ra thành lời thay vì trông cậy vào việc
 * máy chủ nhớ kiểm - máy chủ vẫn kiểm, nhưng hai lớp cùng nói một điều thì lớp
 * nào hỏng cũng có lớp kia đỡ.
 */
export type SignUpRole = 'parent' | 'teacher'

export interface RosterEntry {
  studentId: string
  name: string
  avatar: string
  grade: number
}

/** Hình dạng máy chủ trả về ở `/api/auth/session`, `/login`, `/signup`, `/claim`. */
type SessionResponse =
  | { mode: 'signed-out' }
  | { mode: 'adult'; displayName: string; role: AdultRole }
  | { mode: 'child'; studentId: string }

interface AuthState {
  ready: boolean
  mode: AuthMode
  displayName: string | null
  role: AdultRole | null
  /** Hồ sơ mà phiên của trẻ đang gắn vào. Chỉ có nghĩa ở mode 'child'. */
  childStudentId: string | null
  busy: boolean
  error: string | null
  /**
   * Tin BÁO CHO BIẾT, không phải tin báo lỗi.
   *
   * Tách hẳn khỏi `error`: tô đỏ một việc bình thường lên như lỗi là doạ người
   * ta. Nhưng im lặng còn tệ hơn - bấm nút mà màn hình không đổi gì thì ai cũng
   * tưởng nút hỏng.
   */
  notice: string | null

  init: () => Promise<void>
  signUp: (input: {
    email: string
    password: string
    displayName: string
    role: SignUpRole
  }) => Promise<void>
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  loadRoster: (classCode: string) => Promise<RosterEntry[]>
  claimStudent: (studentId: string, pin: string) => Promise<void>
  /** Kéo lại nội dung tự soạn và nạp lại game. Nút "Đồng bộ" ở trang quản trị. */
  syncNow: () => Promise<void>
  /** Người lớn tự đổi mật khẩu; phải nhập lại mật khẩu cũ. */
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>
  /** Quên mật khẩu: xin một lá thư kèm liên kết đặt lại. */
  requestPasswordReset: (email: string) => Promise<void>
  /** Đặt mật khẩu mới bằng token lấy từ liên kết trong thư. */
  resetPassword: (accessToken: string, password: string) => Promise<void>
  clearError: () => void
}

const message = (cause: unknown): string =>
  cause instanceof Error ? cause.message : 'Có gì đó không ổn. Thử lại nhé.'

/**
 * Kéo nội dung tự soạn về, âm thầm.
 *
 * Nuốt lỗi có chủ ý, và chỉ ở ĐÂY. Đồng bộ nội dung là việc phụ đi kèm lúc đăng
 * nhập; hỏng giữa chừng thì trẻ vẫn phải vào chơi được với nội dung gốc trong mã.
 * Còn khi người lớn tự bấm nút "Đồng bộ" ở trang quản trị thì lỗi hiện thẳng ra
 * màn hình - lúc đó họ đang chờ kết quả và cần biết có hỏng hay không.
 */
async function syncContentQuietly(): Promise<void> {
  try {
    await syncCustomContent()
  } catch {
    // Nội dung gốc trong mã vẫn dùng được; không làm hỏng lượt vào app.
  }
}

export const useAuth = create<AuthState>((set) => ({
  ready: false,
  mode: 'signed-out',
  displayName: null,
  role: null,
  childStudentId: null,
  busy: false,
  error: null,
  notice: null,

  /**
   * Áp một câu trả lời của máy chủ vào trạng thái, rồi khởi động phần game.
   *
   * Cả bốn route xác thực đều trả về CÙNG một hình dạng, nên chỗ này viết một
   * lần và `init`, `signIn`, `signUp`, `claimStudent` dùng chung.
   */
  async init() {
    try {
      const session = await request<SessionResponse>('/api/auth/session')
      await apply(session, set)
    } catch (cause) {
      // Không nối được máy chủ lúc mở app. Nói ra và dừng ở màn đăng nhập - im
      // lặng thì người dùng nhìn một vòng xoay không bao giờ dứt.
      set({ ready: true, mode: 'signed-out', error: message(cause) })
    }
  },

  async signUp({ email, password, displayName, role }) {
    set({ busy: true, error: null, notice: null })
    try {
      const session = await request<SessionResponse>('/api/auth/signup', {
        method: 'POST',
        body: { email, password, displayName, role },
      })
      await apply(session, set)
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async signIn({ email, password }) {
    set({ busy: true, error: null, notice: null })
    try {
      const session = await request<SessionResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      await apply(session, set)
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async signOut() {
    // Cứ dọn phía trình duyệt kể cả khi máy chủ không trả lời: người bấm "Thoát"
    // muốn ra khỏi tài khoản ngay, không muốn nghe về một lỗi mạng.
    await request('/api/auth/logout', { method: 'POST' }).catch(() => {})
    useGame.getState().leaveStudent()
    set({
      mode: 'signed-out',
      displayName: null,
      role: null,
      childStudentId: null,
      error: null,
      notice: null,
    })
  },

  async loadRoster(classCode: string): Promise<RosterEntry[]> {
    set({ busy: true, error: null })
    try {
      const { roster } = await request<{ roster: RosterEntry[] }>('/api/auth/roster', {
        method: 'POST',
        body: { classCode },
      })
      if (roster.length === 0) set({ error: 'Lớp này chưa có bạn nào. Hỏi lại thầy cô nhé.' })
      return roster
    } catch (cause) {
      set({ error: message(cause) })
      return []
    } finally {
      set({ busy: false })
    }
  },

  async claimStudent(studentId: string, pin: string) {
    set({ busy: true, error: null })
    try {
      const session = await request<SessionResponse>('/api/auth/claim', {
        method: 'POST',
        body: { studentId, pin },
      })
      await apply(session, set)
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async syncNow() {
    await syncContentQuietly()
    await useGame.getState().init()
  },

  async changePassword({ currentPassword, newPassword }) {
    set({ busy: true, error: null, notice: null })
    try {
      await request('/api/auth/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      })
      set({ notice: 'Đã đổi mật khẩu xong.' })
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async requestPasswordReset(email) {
    set({ busy: true, error: null, notice: null })
    try {
      const { notice } = await request<{ notice: string }>('/api/auth/forgot', {
        method: 'POST',
        body: { email },
      })
      // Lời nhắn do máy chủ viết, không viết lại ở đây: nó cố ý mập mờ về việc
      // địa chỉ này có tài khoản hay không, và sửa lại cho "rõ ràng" là phá đúng
      // điều nó đang bảo vệ. Xem `app/api/auth/forgot/route.ts`.
      set({ notice })
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async resetPassword(accessToken, password) {
    set({ busy: true, error: null, notice: null })
    try {
      const session = await request<SessionResponse>('/api/auth/reset', {
        method: 'POST',
        body: { accessToken, password },
      })
      // Đổi xong là đăng nhập luôn - máy chủ đã mở phiên. Không bắt gõ lại mật
      // khẩu vừa đặt: người vừa mở được hộp thư và vừa tự chọn mật khẩu thì đã
      // chứng minh xong mình là ai.
      await apply(session, set)
      set({ notice: 'Đã đổi mật khẩu xong.' })
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  clearError() {
    set({ error: null, notice: null })
  },
}))

/**
 * Đưa câu trả lời của máy chủ vào trạng thái và dựng phần game tương ứng.
 *
 * Tầng lưu trữ giờ chỉ có một (`apiRepository`), nên không còn phải chọn giữa
 * IndexedDB và Supabase như bản cũ - chỉ cắm vào rồi chạy.
 */
async function apply(
  session: SessionResponse,
  set: (patch: Partial<AuthState>) => void,
): Promise<void> {
  if (session.mode === 'signed-out') {
    set({ ready: true, mode: 'signed-out', displayName: null, role: null, childStudentId: null })
    return
  }

  configureRepository(apiRepository)

  if (session.mode === 'adult') {
    void syncContentQuietly()
    set({
      ready: true,
      mode: 'adult',
      displayName: session.displayName,
      role: session.role,
      childStudentId: null,
      error: null,
    })
    await useGame.getState().init()
    return
  }

  // Trẻ trên máy dùng chung: kéo về nội dung cô giáo soạn cho lớp mình, rồi vào
  // thẳng hồ sơ của em - không bao giờ hiện danh sách hồ sơ cho trẻ thấy bạn khác.
  void syncContentQuietly()
  set({
    ready: true,
    mode: 'child',
    displayName: null,
    role: null,
    childStudentId: session.studentId,
    error: null,
  })
  await useGame.getState().init()
  await useGame.getState().selectStudent(session.studentId)
}
