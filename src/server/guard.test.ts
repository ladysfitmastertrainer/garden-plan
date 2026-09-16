/**
 * Phân quyền - luật vừa chuyển từ SQL (Row Level Security) sang TypeScript.
 *
 * Đây là bộ test QUAN TRỌNG NHẤT của lần chuyển này. Trước đây câu hỏi "ai được
 * đụng vào hồ sơ nào" do Postgres trả lời, và `supabase/tests/rls.test.ts` kiểm
 * chứng nó trên Postgres thật. Câu hỏi ấy giờ do `guard.ts` trả lời, nên nó cần
 * một bộ test riêng nói ĐÚNG những điều bộ kia nói:
 *
 *   - chủ hồ sơ            : đọc VÀ ghi
 *   - giáo viên dạy em đó  : chỉ ĐỌC
 *   - chính đứa trẻ đó     : đọc VÀ ghi hồ sơ của mình, không đụng được ai khác
 *
 * Hai lớp vẫn còn cả hai (RLS nằm nguyên trong database làm lớp thứ hai), và hai
 * lớp mà nói hai luật khác nhau thì sớm muộn sẽ có một lỗi không ai giải thích
 * nổi. Bộ test này là chỗ phát hiện ra điều đó.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Ai đang đăng nhập, do từng test đặt trước khi gọi. */
let session: { kind: 'adult'; userId: string } | { kind: 'child'; studentId: string } | null = null

/** Dữ liệu tối thiểu mà các cổng chặn cần tra. */
const world = {
  /** studentId -> ownerId */
  owners: new Map<string, string>(),
  /** studentId -> danh sách giáo viên dạy em đó */
  teachers: new Map<string, string[]>(),
  /** userId -> vai */
  roles: new Map<string, string>(),
  /** classId -> teacherId */
  classes: new Map<string, string>(),
}

vi.mock('./session', () => ({
  readSession: async () => session,
}))

/**
 * Một `db()` giả, dựng lại đúng phần bề mặt mà `guard.ts` dùng.
 *
 * Mỗi truy vấn trong `guard.ts` là một chuỗi `.from().select().eq()...`, nên bản
 * giả chỉ cần nhớ bảng nào và những cặp `eq` nào đã được gọi, rồi tự trả lời ở
 * bước cuối (`maybeSingle` hoặc `limit`).
 */
vi.mock('./db', () => ({
  check: (error: { message: string } | null, what: string) => {
    if (error) throw new Error(`${what}: ${error.message}`)
  },
  db: () => ({
    from(table: string) {
      const filters: Record<string, unknown> = {}
      const chain = {
        select: () => chain,
        eq(column: string, value: unknown) {
          filters[column] = value
          return chain
        },
        limit: async () => ({ data: rows(table, filters), error: null }),
        maybeSingle: async () => ({ data: rows(table, filters)[0] ?? null, error: null }),
      }
      return chain
    },
  }),
}))

function rows(table: string, f: Record<string, unknown>): Array<Record<string, unknown>> {
  if (table === 'profiles') {
    const role = world.roles.get(String(f.id))
    return role ? [{ role, display_name: 'Cô Hà' }] : []
  }

  if (table === 'students') {
    const owner = world.owners.get(String(f.id))
    return owner && owner === f.owner_id ? [{ id: f.id }] : []
  }

  if (table === 'class_members') {
    const teaching = world.teachers.get(String(f.student_id)) ?? []
    return teaching.includes(String(f['classes.teacher_id'])) ? [{ class_id: 'lop-1' }] : []
  }

  if (table === 'classes') {
    const teacher = world.classes.get(String(f.id))
    return teacher && teacher === f.teacher_id ? [{ id: f.id }] : []
  }

  return []
}

const {
  requireAdmin,
  requireAdult,
  requireOwnClass,
  requireReadStudent,
  requireStaff,
  requireWriteStudent,
} = await import('./guard')

const ME = 'phu-huynh'
const CO_HA = 'co-ha'
const QUAN_TRI = 'quan-tri'
const BE_AN = 'be-an'
const BE_BINH = 'be-binh'

beforeEach(() => {
  session = null
  world.owners.clear()
  world.teachers.clear()
  world.roles.clear()
  world.classes.clear()

  world.roles.set(ME, 'parent')
  world.roles.set(CO_HA, 'teacher')
  world.roles.set(QUAN_TRI, 'admin')

  // Bé An do phụ huynh tạo, và học lớp cô Hà. Bé Bình không liên quan tới ai.
  world.owners.set(BE_AN, ME)
  world.teachers.set(BE_AN, [CO_HA])
  world.owners.set(BE_BINH, 'nguoi-la')
})

describe('chưa đăng nhập', () => {
  it('không đọc được hồ sơ nào', async () => {
    await expect(requireReadStudent(BE_AN)).rejects.toThrow('Bạn cần đăng nhập')
  })

  it('không phải người lớn', async () => {
    await expect(requireAdult()).rejects.toThrow('Bạn cần đăng nhập')
  })
})

describe('chủ hồ sơ', () => {
  beforeEach(() => {
    session = { kind: 'adult', userId: ME }
  })

  it('đọc được hồ sơ của con mình', async () => {
    await expect(requireReadStudent(BE_AN)).resolves.toBeTruthy()
  })

  it('ghi được hồ sơ của con mình', async () => {
    await expect(requireWriteStudent(BE_AN)).resolves.toBeTruthy()
  })

  it('KHÔNG đọc được hồ sơ con nhà người khác', async () => {
    // 404 chứ không 403: người lạ không cần biết hồ sơ này có tồn tại hay không.
    await expect(requireReadStudent(BE_BINH)).rejects.toThrow('Không tìm thấy')
  })
})

describe('giáo viên dạy em đó', () => {
  beforeEach(() => {
    session = { kind: 'adult', userId: CO_HA }
  })

  it('đọc được tiến độ của học sinh lớp mình', async () => {
    await expect(requireReadStudent(BE_AN)).resolves.toBeTruthy()
  })

  it('KHÔNG ghi được dữ liệu học tập của học sinh', async () => {
    /*
      Đây là luật dễ mất nhất khi dịch từ SQL sang TypeScript, vì cả hai vế đều
      bắt đầu bằng "giáo viên thì được". Thầy cô xem được tiến độ nhưng không sửa
      được vàng, kinh nghiệm hay mức thạo - giống hệt `can_write_student` trong
      `supabase/migrations/0001_init.sql`, nơi giáo viên CỐ Ý bị loại.
    */
    await expect(requireWriteStudent(BE_AN)).rejects.toThrow('không sửa được')
  })

  it('KHÔNG đọc được học sinh của lớp người khác', async () => {
    await expect(requireReadStudent(BE_BINH)).rejects.toThrow('Không tìm thấy')
  })
})

describe('trẻ trên máy dùng chung', () => {
  beforeEach(() => {
    session = { kind: 'child', studentId: BE_AN }
  })

  it('đọc và ghi được hồ sơ của chính mình', async () => {
    await expect(requireReadStudent(BE_AN)).resolves.toBeTruthy()
    await expect(requireWriteStudent(BE_AN)).resolves.toBeTruthy()
  })

  it('KHÔNG đụng được vào hồ sơ bạn khác', async () => {
    await expect(requireReadStudent(BE_BINH)).rejects.toThrow('không phải hồ sơ của con')
    await expect(requireWriteStudent(BE_BINH)).rejects.toThrow('không phải hồ sơ của con')
  })

  it('không được coi là người lớn, kể cả khi id trùng với một tài khoản', async () => {
    // Phiên của trẻ mang `studentId`, không mang `userId`. Nhánh nào quên phân
    // biệt hai thứ đó là một đứa trẻ vào được trang quản trị.
    session = { kind: 'child', studentId: QUAN_TRI }
    await expect(requireAdult()).rejects.toThrow('chỉ dành cho người lớn')
    await expect(requireAdmin()).rejects.toThrow('chỉ dành cho người lớn')
  })
})

describe('vai của người lớn', () => {
  it('phụ huynh không phải nhân viên, không phải quản trị', async () => {
    session = { kind: 'adult', userId: ME }
    await expect(requireStaff()).rejects.toThrow('quản trị viên hoặc giáo viên')
    await expect(requireAdmin()).rejects.toThrow('Chỉ quản trị viên')
  })

  it('giáo viên là nhân viên nhưng không phải quản trị', async () => {
    session = { kind: 'adult', userId: CO_HA }
    await expect(requireStaff()).resolves.toMatchObject({ role: 'teacher' })
    await expect(requireAdmin()).rejects.toThrow('Chỉ quản trị viên')
  })

  it('quản trị viên qua được cả hai cổng', async () => {
    session = { kind: 'adult', userId: QUAN_TRI }
    await expect(requireStaff()).resolves.toMatchObject({ role: 'admin' })
    await expect(requireAdmin()).resolves.toMatchObject({ role: 'admin' })
  })

  it('vai đọc lại từ database mỗi lần, không lấy từ cookie', async () => {
    /*
      Vì sao điều này đáng một test riêng: nhét vai vào token thì nhanh hơn một
      truy vấn, nhưng một quản trị viên bị hạ quyền vẫn giữ nguyên quyền cũ cho
      tới lúc token hết hạn - ba mươi ngày, với một nút bấm xoá được cả trường.
    */
    session = { kind: 'adult', userId: QUAN_TRI }
    await expect(requireAdmin()).resolves.toBeTruthy()

    world.roles.set(QUAN_TRI, 'parent')
    await expect(requireAdmin()).rejects.toThrow('Chỉ quản trị viên')
  })

  it('tài khoản đã bị xoá thì coi như chưa đăng nhập', async () => {
    // Cookie vẫn còn hạn nhưng hồ sơ không còn. Trả 401 để trình duyệt dọn cookie
    // và hiện lại màn hình đăng nhập, thay vì 403 khiến người dùng tưởng mình bị
    // cấm cửa.
    session = { kind: 'adult', userId: 'nguoi-da-bi-xoa' }
    await expect(requireAdult()).rejects.toThrow('không còn tồn tại')
  })
})

describe('lớp học', () => {
  beforeEach(() => {
    world.classes.set('lop-2a', CO_HA)
  })

  it('giáo viên quản được lớp của mình', async () => {
    await expect(requireOwnClass({ userId: CO_HA, role: 'teacher', displayName: '' }, 'lop-2a'))
      .resolves.toBeUndefined()
  })

  it('KHÔNG quản được lớp của đồng nghiệp', async () => {
    await expect(
      requireOwnClass({ userId: 'co-lan', role: 'teacher', displayName: '' }, 'lop-2a'),
    ).rejects.toThrow('Không tìm thấy lớp')
  })

  it('quản trị viên cũng không mượn được lớp của người khác', async () => {
    // Quản trị viên quản lý TÀI KHOẢN, không phải lớp. Cho họ sửa lớp người khác
    // là mở một đường vòng vào dữ liệu học sinh mà không ai dự tính.
    await expect(
      requireOwnClass({ userId: QUAN_TRI, role: 'admin', displayName: '' }, 'lop-2a'),
    ).rejects.toThrow('Không tìm thấy lớp')
  })
})
