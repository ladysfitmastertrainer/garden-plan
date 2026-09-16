/**
 * Tạo tài khoản cho giáo viên và phụ huynh, thay cho việc họ tự đăng ký.
 *
 * Bê mô hình của app Diet Plan: admin điền tên và email, hệ thống sinh mật khẩu,
 * và mật khẩu HIỆN THẲNG TRÊN MÀN HÌNH. Không lá thư nào phải gửi đi - nên cả
 * luồng này không phụ thuộc vào SMTP, đúng chỗ đang hỏng.
 *
 * Đổi lại, mật khẩu chỉ hiện ĐÚNG MỘT LẦN. Nó không được lưu ở đâu dạng đọc
 * được, kể cả trong cơ sở dữ liệu - đó là điều đúng đắn, nhưng nghĩa là màn hình
 * này phải làm việc chép lại thật dễ: chữ to, một nút chép, và lời nhắc rõ ràng.
 */

import { useEffect, useState } from 'react'
import {
  createAccount,
  deleteAccount,
  listAccounts,
  resetAccountPassword,
  updateAccount,
  type AdultAccount,
} from '../../data/admin-users'
import { useAuth } from '../../store/auth'
import { ConfirmModal } from '../../ui/ConfirmModal'

const ROLE_LABEL: Record<string, string> = {
  parent: 'Phụ huynh',
  teacher: 'Giáo viên',
  admin: 'Quản trị',
}

/** Mật khẩu vừa sinh, kèm chỗ nó thuộc về - để admin biết đang chép của ai. */
interface FreshPassword {
  email: string
  password: string
}

export function AccountsPanel() {
  const mode = useAuth((s) => s.mode)
  // Sửa và xoá là việc của quản trị. Giáo viên tạo được tài khoản phụ huynh,
  // nhưng không đổi vai hay xoá ai - máy chủ cũng chặn, đây chỉ là để giao diện
  // không bày ra nút bấm vào là báo lỗi.
  const role = useAuth((s) => s.role)
  const isAdmin = role === 'admin'

  const [accounts, setAccounts] = useState<AdultAccount[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [fresh, setFresh] = useState<FreshPassword | null>(null)
  const [copied, setCopied] = useState(false)

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [newRole, setNewRole] = useState('teacher')

  /** Tài khoản đang mở form sửa, và bản nháp đang gõ dở. */
  const [editing, setEditing] = useState<AdultAccount | null>(null)
  const [draft, setDraft] = useState({ displayName: '', email: '', role: 'teacher' })
  /** Tài khoản đang chờ xác nhận xoá. Giữ cả hàng để hộp thoại nói được con số. */
  const [removing, setRemoving] = useState<AdultAccount | null>(null)

  const load = async () => {
    setError(null)
    try {
      setAccounts(await listAccounts())
    } catch (cause) {
      setAccounts([])
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  useEffect(() => {
    if (mode === 'adult') void load()
    else setAccounts([])
  }, [mode])

  const create = async () => {
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const result = await createAccount({ email, displayName, role: newRole })
      setFresh({ email: result.user.email, password: result.password })
      setEmail('')
      setDisplayName('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (account: AdultAccount) => {
    setEditing(account)
    setDraft({ displayName: account.displayName, email: account.email, role: account.role })
    setError(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setBusy(true)
    setError(null)
    try {
      await updateAccount({ userId: editing.id, ...draft })
      setEditing(null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (account: AdultAccount) => {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount(account.id)
      setRemoving(null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setRemoving(null)
    } finally {
      setBusy(false)
    }
  }

  const reset = async (account: AdultAccount) => {
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      setFresh({ email: account.email, password: await resetAccountPassword(account.id) })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  if (mode !== 'adult') {
    return (
      <section className="card grid gap-2">
        <h3 className="text-xl font-extrabold">🔑 Tài khoản người lớn</h3>
        <p className="text-base opacity-70">
          Cần đăng nhập bằng một tài khoản quản trị mới dùng được phần này.
        </p>
      </section>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Mật khẩu vừa sinh đứng TRÊN CÙNG và ở lại cho tới khi admin tự đóng.
          Nó chỉ hiện một lần duy nhất - trôi mất là phải đặt lại cái khác. */}
      {fresh && (
        <section
          className="card grid gap-2"
          style={{ borderColor: 'var(--color-good)', background: 'var(--color-good-soft)' }}
        >
          <h3 className="text-xl font-extrabold">✓ Mật khẩu cho {fresh.email}</h3>
          <p className="text-base">
            Chép ngay và đưa cho người ta. <strong>Mật khẩu này chỉ hiện một lần</strong> — đóng đi
            là không xem lại được, phải đặt lại cái mới.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code
              className="flex-1 rounded-xl px-4 py-3 text-2xl font-bold"
              style={{ background: '#fff', minWidth: 220, letterSpacing: '0.05em' }}
            >
              {fresh.password}
            </code>
            <button
              type="button"
              className="btn btn-primary px-5 text-base"
              onClick={() => {
                void navigator.clipboard?.writeText(fresh.password)
                setCopied(true)
              }}
            >
              {copied ? '✓ Đã chép' : '📋 Chép'}
            </button>
            <button
              type="button"
              className="btn btn-ghost px-5 text-base"
              onClick={() => {
                setFresh(null)
                setCopied(false)
              }}
            >
              Đóng
            </button>
          </div>
        </section>
      )}

      {error && (
        <p
          className="card text-base font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      <section className="card grid gap-3">
        <div>
          <h3 className="text-xl font-extrabold">➕ Tạo tài khoản mới</h3>
          <p className="text-base opacity-70">
            Tài khoản tạo ở đây <strong>đã xác nhận sẵn</strong> — người nhận đăng nhập được ngay,
            không cần chờ thư.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-bold opacity-70">Tên hiển thị</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cô Hà"
              className="admin-input"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold opacity-70">Email đăng nhập</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coha@truong.edu.vn"
              className="admin-input"
            />
          </label>
        </div>

        <div className="grid gap-1">
          <span className="text-sm font-bold opacity-70">Vai trò</span>
          <div className="flex flex-wrap gap-2">
            {(['teacher', 'parent', 'admin'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setNewRole(value)}
                aria-pressed={newRole === value}
                className="btn flex-1 text-base"
                style={{
                  background: newRole === value ? 'var(--color-brand)' : 'var(--color-paper-sunk)',
                  color: newRole === value ? '#fff' : 'var(--color-ink)',
                }}
              >
                {ROLE_LABEL[value]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void create()}
          disabled={busy || !email.trim() || !displayName.trim()}
          className="btn btn-primary text-base"
        >
          {busy ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
      </section>

      <section className="grid gap-2">
        <h3 className="text-xl font-extrabold">
          Tài khoản hiện có {accounts === null ? '' : `(${accounts.length})`}
        </h3>

        {accounts === null && <p className="text-base opacity-70">Đang tải...</p>}
        {accounts?.length === 0 && !error && (
          <p className="text-base opacity-70">Chưa có tài khoản nào, hoặc bạn không phải quản trị viên.</p>
        )}

        {accounts?.map((account) =>
          editing?.id === account.id ? (
            <div
              key={account.id}
              className="card grid gap-3"
              style={{ borderColor: 'var(--color-brand)' }}
            >
              <h4 className="text-base font-extrabold">Sửa tài khoản</h4>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-bold opacity-70">Tên hiển thị</span>
                  <input
                    value={draft.displayName}
                    onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                    className="admin-input"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-bold opacity-70">Email đăng nhập</span>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    className="admin-input"
                  />
                </label>
              </div>

              <div className="grid gap-1">
                <span className="text-sm font-bold opacity-70">Vai trò</span>
                <div className="flex flex-wrap gap-2">
                  {(['teacher', 'parent', 'admin'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDraft({ ...draft, role: value })}
                      aria-pressed={draft.role === value}
                      className="btn flex-1 text-base"
                      style={{
                        background:
                          draft.role === value ? 'var(--color-brand)' : 'var(--color-paper-sunk)',
                        color: draft.role === value ? '#fff' : 'var(--color-ink)',
                      }}
                    >
                      {ROLE_LABEL[value]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={busy || !draft.displayName.trim()}
                  className="btn btn-primary flex-1 text-base"
                >
                  {busy ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-ghost px-5 text-base"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <div key={account.id} className="card flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold">{account.displayName}</span>
                <span className="block text-sm opacity-60">{account.email}</span>
                {/* Nói ngay ở đây chứ không đợi lúc hỏi xoá: người ta cần thấy ai
                    đang giữ dữ liệu gì trước khi động vào. */}
                {(account.students > 0 || account.classes > 0) && (
                  <span className="block text-sm opacity-60">
                    {account.students > 0 && `${account.students} hồ sơ trẻ`}
                    {account.students > 0 && account.classes > 0 && ' · '}
                    {account.classes > 0 && `${account.classes} lớp`}
                  </span>
                )}
              </span>
              <span className="pixel-font shrink-0 text-sm opacity-70">
                {ROLE_LABEL[account.role] ?? account.role}
              </span>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => openEdit(account)}
                    disabled={busy}
                    className="btn btn-ghost shrink-0 px-4 text-sm"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void reset(account)}
                    disabled={busy}
                    className="btn btn-ghost shrink-0 px-4 text-sm"
                  >
                    Đặt lại mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoving(account)}
                    disabled={busy}
                    className="btn btn-ghost shrink-0 px-4 text-sm"
                    style={{ color: 'var(--color-warn)' }}
                  >
                    Xoá
                  </button>
                </>
              )}
            </div>
          ),
        )}
      </section>

      {/*
        Hộp thoại xoá phải NÓI RA con số.

        Xoá một tài khoản người lớn là xoá theo cả lớp, học sinh và toàn bộ tiến
        độ học của từng em - khoá ngoại nối tầng lo phần đó, và không có nút hoàn
        tác nào cả. Một câu "bạn có chắc không?" trống rỗng ở đây là vô trách
        nhiệm.
      */}
      {removing && (
        <ConfirmModal
          title={`Xoá tài khoản ${removing.displayName}?`}
          message={
            removing.students > 0 || removing.classes > 0
              ? `Xoá tài khoản này sẽ xoá theo ${removing.students} hồ sơ trẻ và ${removing.classes} lớp, ` +
                'cùng toàn bộ tiến độ học của từng em.\n' +
                'Không có cách nào lấy lại. Chắc chắn chưa?'
              : 'Tài khoản này chưa có hồ sơ trẻ hay lớp nào.\nXoá xong không lấy lại được.'
          }
          confirmLabel="Xoá tài khoản"
          danger
          onClose={() => setRemoving(null)}
          onConfirm={() => void remove(removing)}
        />
      )}
    </div>
  )
}
