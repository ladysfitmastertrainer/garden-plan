/**
 * Xác thực và chọn tầng lưu trữ.
 *
 * Bốn trạng thái:
 *  - `offline`    : chưa cấu hình Supabase. Chơi hoàn toàn trên máy, không tài
 *                   khoản. App phải chạy được ở trạng thái này.
 *  - `signed-out` : đã cấu hình Supabase nhưng chưa ai đăng nhập.
 *  - `adult`      : phụ huynh hoặc giáo viên đăng nhập bằng email.
 *  - `child`      : trẻ trên máy dùng chung, phiên ẩn danh gắn với đúng một hồ sơ.
 *
 * Trẻ em KHÔNG có email và KHÔNG có mật khẩu. Trên máy của gia đình, phụ huynh
 * đăng nhập rồi chọn hồ sơ con - trẻ không cần đăng nhập gì cả.
 */

import { create } from 'zustand'
import type { SupabaseClient } from '@supabase/supabase-js'
import { localRepository } from '../data/local'

import { getSupabase, isSupabaseConfigured } from '../data/supabase-client'
import {
  createSyncingRepository,
  watchConnectivity,
  type SyncStatus,
  type SyncingRepository,
} from '../data/syncing'
import { syncCustomContent } from '../data/content-sync'
import { configureRepository, useGame } from './game'

/*
  Đọc phần "#" của địa chỉ NGAY khi nạp mô-đun, trước khi supabase-js kịp dọn.

  Mọi liên kết gửi qua email đều quay về đây kèm thông tin trong đó: xác nhận
  đăng ký, đặt lại mật khẩu, hoặc một lời báo lỗi khi liên kết đã hết hạn. Đọc
  muộn hơn một nhịp là mất sạch, và người dùng lại nhìn một màn hình không nói gì.
*/
const linkParams = new URLSearchParams(
  (typeof window === 'undefined' ? '' : window.location.hash).replace(/^#/, ''),
)
/** 'recovery' khi tới từ thư đặt lại mật khẩu, 'signup' khi từ thư xác nhận. */
const linkType = linkParams.get('type')
/** Supabase báo lỗi ngay trong địa chỉ khi liên kết hỏng hoặc đã dùng rồi. */
const linkError = linkParams.get('error_description') ?? linkParams.get('error')

/**
 * Địa chỉ gốc của trang, để bảo Supabase trả người dùng về đúng đây sau khi bấm
 * liên kết trong thư.
 *
 * Có `window` hay không vẫn phải chạy được: kho này còn bị nạp trong test chạy ở
 * Node, và ở đó một tham chiếu `window` trần sẽ ném lỗi làm hỏng cả hàm - lỗi
 * hiện ra cho người dùng thành "window is not defined" thay vì lời nhắn thật.
 */
function appOrigin(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.origin
}

export type AuthMode = 'offline' | 'signed-out' | 'adult' | 'child'
/**
 * Vai của người lớn.
 *
 * 'admin' thêm ở migration 0004: người tạo tài khoản cho người khác. Nó KHÔNG
 * phải một vai riêng biệt với hai vai kia - quản trị viên vẫn quản lý lớp và
 * xem tiến độ như giáo viên, chỉ thêm quyền tạo tài khoản.
 */
export type AdultRole = 'parent' | 'teacher' | 'admin'

export interface RosterEntry {
  studentId: string
  name: string
  avatar: string
  grade: number
}

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
   * Tách hẳn khỏi `error`: đăng ký xong mà còn phải xác nhận email thì đó là
   * việc bình thường, tô đỏ lên như lỗi là doạ người ta. Nhưng im lặng còn tệ
   * hơn - bấm nút mà màn hình không đổi gì thì ai cũng tưởng nút hỏng.
   */
  notice: string | null
  /**
   * Đang ở giữa luồng đặt lại mật khẩu.
   *
   * Lúc này người dùng ĐÃ có phiên hợp lệ - Supabase cấp nó qua liên kết trong
   * thư - nhưng chưa được vào app: việc duy nhất họ cần làm là chọn mật khẩu
   * mới. Không có cờ này thì `init()` thấy có phiên là thả thẳng vào game, và
   * màn hình đặt mật khẩu không bao giờ hiện ra.
   */
  recovering: boolean
  syncStatus: SyncStatus

  init: () => Promise<void>
  signUp: (input: { email: string; password: string; displayName: string; role: AdultRole }) => Promise<void>
  signIn: (input: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  loadRoster: (classCode: string) => Promise<RosterEntry[]>
  claimStudent: (studentId: string, pin: string) => Promise<void>
  syncNow: () => Promise<void>
  /** Gửi thư đặt lại mật khẩu. */
  requestPasswordReset: (email: string) => Promise<void>
  /** Đặt mật khẩu mới, khi đang ở giữa luồng đặt lại. */
  updatePassword: (password: string) => Promise<void>
  /** Gửi lại thư xác nhận cho người đăng ký rồi mà chưa nhận được thư. */
  resendConfirmation: (email: string) => Promise<void>
  clearError: () => void
}

const IDLE_SYNC: SyncStatus = { pending: 0, lastSyncedAt: null, lastError: null, syncing: false }

let syncing: SyncingRepository | null = null
let stopWatching: (() => void) | null = null

/** Bật chế độ chơi hoàn toàn trên máy. */
function useLocalOnly(): void {
  stopWatching?.()
  stopWatching = null
  syncing = null
  configureRepository(localRepository)
}

/**
 * Bật chế độ đồng bộ với Supabase cho người dùng đang đăng nhập.
 * Module `data/supabase` được nạp động để chế độ offline không phải tải nó về.
 */
async function useSynced(
  client: SupabaseClient,
  set: (patch: Partial<AuthState>) => void,
): Promise<SyncingRepository> {
  const { createSupabaseRepository } = await import('../data/supabase')
  stopWatching?.()
  syncing = createSyncingRepository(createSupabaseRepository(client))
  configureRepository(syncing)
  syncing.subscribe((syncStatus) => set({ syncStatus }))
  stopWatching = watchConnectivity(syncing)
  return syncing
}

/**
 * Kéo nội dung tự soạn về, âm thầm.
 *
 * Nuốt lỗi có chủ ý, và chỉ ở ĐÂY. Đồng bộ nội dung là việc phụ đi kèm lúc đăng
 * nhập; hỏng mạng giữa chừng thì trẻ vẫn phải vào chơi được với nội dung gốc.
 * Còn khi người lớn tự bấm nút "Đồng bộ" ở trang quản trị thì lỗi hiện thẳng ra
 * màn hình - lúc đó họ đang chờ kết quả và cần biết có hỏng hay không.
 */
async function syncContentQuietly(): Promise<void> {
  try {
    const supabase = await getSupabase()
    if (supabase) await syncCustomContent(supabase)
  } catch {
    // Nội dung gốc trong mã vẫn dùng được; không làm hỏng lượt vào app.
  }
}

/**
 * Lỗi của Supabase trả về bằng tiếng Anh, mà người đọc màn hình này là phụ huynh
 * và thầy cô Việt Nam. Chỉ dịch những câu HAY GẶP - còn lại giữ nguyên còn hơn
 * đoán sai thành một câu tiếng Việt vô nghĩa.
 */
const ERROR_VI: Array<[RegExp, string]> = [
  [/email rate limit exceeded/i, 'Hệ thống gửi thư đã hết lượt trong giờ này. Đợi khoảng một tiếng rồi thử lại, hoặc nhờ người quản trị tắt phần xác nhận email.'],
  [/invalid login credentials/i, 'Email hoặc mật khẩu chưa đúng.'],
  // Nhắc CẢ HAI đường. Nếu hệ thống thư đang hỏng thì nút 'Gửi lại thư' cũng
  // vô ích, và người ta sẽ bấm nó mãi mà không ai bảo cho biết.
  [/email not confirmed/i, 'Tài khoản chưa xác nhận. Mở thư trong hộp thư và bấm xác nhận, hoặc nhờ quản trị viên đặt lại mật khẩu hộ - cách đó xác nhận luôn tài khoản.'],
  [/user already registered/i, 'Email này đã có tài khoản rồi. Bấm "Đã có tài khoản? Đăng nhập" nhé.'],
  [/password should be at least/i, 'Mật khẩu phải dài ít nhất 6 ký tự.'],
  // Đứng SAU hai mẫu về liên kết ở dưới thì đã muộn: chuỗi "Email link is
  // invalid or has expired" cũng khớp mẫu này, và người dùng nhận một lời khuyên
  // sai hoàn toàn - đi đổi địa chỉ email trong khi việc cần làm là xin liên kết
  // mới. Nên thu hẹp lại, chỉ bắt đúng câu Supabase nói về ĐỊA CHỈ.
  [/email address .* is invalid|invalid email/i, 'Địa chỉ email này không dùng được. Thử một địa chỉ khác nhé.'],
  [/anonymous sign-ins are disabled/i, 'Máy chủ chưa bật chế độ cho trẻ vào bằng mã lớp. Nhờ người quản trị bật giúp.'],
  [/failed to fetch|network/i, 'Không nối được mạng. Kiểm tra kết nối rồi thử lại nhé.'],
  [/link is invalid or has expired|otp_expired|token has expired/i, 'Liên kết trong thư đã hết hạn hoặc đã dùng rồi. Bấm "Gửi lại thư" để nhận liên kết mới nhé.'],
  [/access_denied/i, 'Liên kết trong thư không dùng được nữa. Hãy xin một liên kết mới.'],
  [/same as the old password|should be different/i, 'Mật khẩu mới phải khác mật khẩu cũ.'],
  [/auth session missing|session_not_found/i, 'Phiên đặt lại mật khẩu đã hết hạn. Hãy bấm "Quên mật khẩu?" để xin liên kết mới.'],
  [/invalid jwt|jwt expired|token is malformed|invalid claim/i, 'Phiên đăng nhập đã hỏng hoặc hết hạn. Hãy bấm "Quên mật khẩu?" để xin một liên kết mới.'],
  /*
    Hệ thống thư của máy chủ đang hỏng.

    ĐỨNG CUỐI BẢNG, và mẫu không được chứa chữ "mail". Bản đầu viết
    `/error sending|smtp|mail/` và nó nuốt luôn câu "Email link is invalid or has
    expired" - người dùng bấm một liên kết hết hạn lại nhận lời khuyên đi tìm
    quản trị viên. Đúng cái bẫy đã sập một lần ở mẫu `/is invalid/` phía trên:
    mẫu rộng đặt sớm thì mọi mẫu sau nó thành vô nghĩa.

    Nói "lỗi máy chủ" rồi thôi là bỏ người ta đứng đó. App này LUÔN có lối ra thứ
    hai - quản trị viên đặt lại mật khẩu hộ - nên lời báo phải chỉ thẳng vào đó.
  */
  [/error sending|smtp|failed to send/i, 'Máy chủ đang không gửi được thư. Nhờ quản trị viên vào trang quản trị đặt lại mật khẩu hộ bạn — nhanh hơn chờ thư.'],
]

function message(cause: unknown): string {
  const raw = cause instanceof Error ? cause.message : String(cause)
  return ERROR_VI.find(([pattern]) => pattern.test(raw))?.[1] ?? raw
}

export const useAuth = create<AuthState>((set, get) => ({
  ready: false,
  mode: 'offline',
  displayName: null,
  role: null,
  childStudentId: null,
  busy: false,
  error: null,
  notice: null,
  recovering: false,
  syncStatus: IDLE_SYNC,

  async init() {
    // Liên kết hỏng hoặc đã dùng rồi: nói ra ngay. Đây là trường hợp hay gặp
    // nhất mà bản cũ im lặng - vài trình quét thư bấm trước liên kết, tới lượt
    // người dùng bấm thì token đã tiêu.
    if (linkError) set({ error: message(new Error(linkError)) })

    if (!isSupabaseConfigured()) {
      useLocalOnly()
      set({ ready: true, mode: 'offline' })
      await useGame.getState().init()
      return
    }

    const supabase = (await getSupabase())!
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user

    if (!user) {
      useLocalOnly()
      set({ ready: true, mode: 'signed-out' })
      return
    }

    // Tới từ thư đặt lại mật khẩu: có phiên nhưng CHƯA được vào app.
    if (linkType === 'recovery') {
      set({ ready: true, recovering: true, mode: 'signed-out' })
      return
    }

    if (user.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .maybeSingle()

      const repository = await useSynced(supabase, set)
      void syncContentQuietly()
      set({
        ready: true,
        mode: 'adult',
        displayName: (profile?.display_name as string | undefined) ?? user.email,
        role: ((profile?.role as AdultRole | undefined) ?? 'parent'),
      })
      await useGame.getState().init()
      await repository.sync()
      await useGame.getState().init()
      return
    }

    // Người dùng ẩn danh: phải có phiên gắn với một hồ sơ học sinh mới hợp lệ.
    const { data: session } = await supabase
      .from('student_sessions')
      .select('student_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!session) {
      await supabase.auth.signOut()
      useLocalOnly()
      set({ ready: true, mode: 'signed-out' })
      return
    }

    const repository = await useSynced(supabase, set)
    // Trẻ trên máy dùng chung: kéo về nội dung cô giáo soạn cho lớp mình.
    void syncContentQuietly()
    set({ ready: true, mode: 'child', childStudentId: session.student_id as string })
    await repository.sync()
    await useGame.getState().init()
    await useGame.getState().selectStudent(session.student_id as string)
  },

  async signUp({ email, password, displayName, role }) {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ busy: true, error: null, notice: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Trigger handle_new_user() đọc phần này để dựng hồ sơ ngay lúc đăng ký.
          data: { display_name: displayName, role },
          // Bấm xác nhận trong thư thì quay về CHÍNH trang này. Bỏ trống là
          // Supabase dùng "Site URL" ở bảng điều khiển - mặc định localhost:3000,
          // tức là một địa chỉ chẳng có gì.
          emailRedirectTo: appOrigin(),
        },
      })
      if (error) throw error

      // Dự án còn bật "Confirm email" thì Supabase trả về người dùng nhưng KHÔNG
      // trả về phiên. Trước đây chỗ này chạy thẳng `init()`, mà `init()` không
      // thấy phiên nào nên để nguyên màn hình đăng nhập - bấm nút xong không có
      // gì xảy ra, không lỗi, không lời nào. Ai cũng tưởng nút hỏng.
      //
      // Lời nhắn cố ý viết "nếu địa chỉ này chưa có tài khoản": Supabase trả về
      // đúng kết quả ấy cho cả email đã đăng ký rồi, để người lạ không dò được ai
      // đang dùng hệ thống. Nói chắc "đã tạo tài khoản" là nói sai một nửa số lần.
      if (!data.session) {
        set({
          notice:
            `Nếu địa chỉ ${email} chưa có tài khoản, một thư xác nhận vừa được gửi tới đó.
` +
            'Mở thư, bấm xác nhận, rồi quay lại đây đăng nhập.',
        })
        return
      }

      await get().init()
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async signIn({ email, password }) {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ busy: true, error: null })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await get().init()
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async signOut() {
    const supabase = await getSupabase()
    // Đẩy nốt hàng đợi trước khi thoát để không mất bài trẻ vừa làm.
    if (syncing) await syncing.push().catch(() => {})
    await supabase?.auth.signOut()
    useLocalOnly()
    useGame.getState().leaveStudent()
    set({
      mode: isSupabaseConfigured() ? 'signed-out' : 'offline',
      displayName: null,
      role: null,
      childStudentId: null,
      syncStatus: IDLE_SYNC,
      error: null,
    })
  },

  async loadRoster(classCode: string): Promise<RosterEntry[]> {
    const supabase = await getSupabase()
    if (!supabase) return []
    set({ busy: true, error: null })
    try {
      // Trẻ chưa có tài khoản nào; đăng nhập ẩn danh để gọi được RPC.
      const { data: current } = await supabase.auth.getSession()
      if (!current.session) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) throw error
      }

      const { data, error } = await supabase.rpc('list_class_roster', {
        p_join_code: classCode.trim().toUpperCase(),
      })
      if (error) throw error

      const roster = ((data as Array<{ student_id: string; name: string; avatar: string; grade: number }>) ?? []).map(
        (row) => ({ studentId: row.student_id, name: row.name, avatar: row.avatar, grade: row.grade }),
      )
      if (roster.length === 0) set({ error: 'Không tìm thấy lớp nào có mã này.' })
      return roster
    } catch (cause) {
      set({ error: message(cause) })
      return []
    } finally {
      set({ busy: false })
    }
  },

  async claimStudent(studentId: string, pin: string) {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ busy: true, error: null })
    try {
      const { error } = await supabase.rpc('claim_student', {
        p_student_id: studentId,
        p_pin: pin,
      })
      if (error) throw error
      await get().init()
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async syncNow() {
    if (syncing) await syncing.sync()
    await syncContentQuietly()
    await useGame.getState().init()
  },

  async requestPasswordReset(email) {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ busy: true, error: null, notice: null })
    try {
      // `redirectTo` phải trỏ về CHÍNH trang này. Bỏ trống thì Supabase dùng
      // "Site URL" trong bảng điều khiển, mà mặc định nó là localhost:3000 -
      // người dùng bấm xong rơi vào một địa chỉ chẳng có gì.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: appOrigin(),
      })
      if (error) throw error

      // Không xác nhận địa chỉ này có tồn tại hay không, cùng lý do với lúc đăng
      // ký: không để người lạ dò ra ai đang dùng hệ thống.
      set({
        notice:
          `Nếu ${email} là địa chỉ của một tài khoản, thư đặt lại mật khẩu vừa được gửi tới đó.\n` +
          'Mở thư rồi bấm vào liên kết trong đó nhé.',
      })
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async updatePassword(password) {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ busy: true, error: null, notice: null })
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Xong việc thì dọn phần "#" khỏi địa chỉ, để tải lại trang không rơi vào
      // màn hình đặt mật khẩu một lần nữa.
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname)
      }
      set({ recovering: false, notice: 'Đã đổi mật khẩu xong. Mời bạn đăng nhập lại.' })
      await supabase.auth.signOut()
      await get().init()
    } catch (cause) {
      set({ error: message(cause) })
    } finally {
      set({ busy: false })
    }
  },

  async resendConfirmation(email) {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ busy: true, error: null, notice: null })
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: appOrigin() },
      })
      if (error) throw error
      set({ notice: `Đã gửi lại thư xác nhận tới ${email}. Nhớ ngó cả hộp thư rác nhé.` })
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
