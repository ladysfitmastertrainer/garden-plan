'use client'

/**
 * Người lớn tự đổi mật khẩu của mình.
 *
 * Máy chủ đã làm được việc này từ lâu (`POST /api/auth/password`) và store đã có
 * `changePassword` kèm test, nhưng KHÔNG màn hình nào gọi tới - nên trên thực tế
 * không ai đổi được mật khẩu của mình. Đây là chỗ nối dây còn thiếu.
 *
 * Đặt ở `src/ui` chứ không nằm trong `features/dashboard`: trang quản trị cũng
 * có đúng nhu cầu ấy, và cũng có sẵn thanh tài khoản để nhét vào.
 */

import { useState } from 'react'

import { useAuth } from '../store/auth'

/** Máy chủ từ chối mật khẩu ngắn hơn chừng này - xem `app/api/auth/password/route.ts`. */
const MIN_LENGTH = 6

export function ChangePassword() {
  const changePassword = useAuth((s) => s.changePassword)
  const clearError = useAuth((s) => s.clearError)
  const busy = useAuth((s) => s.busy)
  const error = useAuth((s) => s.error)
  const notice = useAuth((s) => s.notice)

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const close = () => {
    setOpen(false)
    setCurrent('')
    setNext('')
    setConfirm('')
  }

  const mismatch = confirm.length > 0 && next !== confirm
  const tooShort = next.length > 0 && next.length < MIN_LENGTH
  const ready = !busy && current.length > 0 && next.length >= MIN_LENGTH && next === confirm

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Dọn lời báo cũ mỗi lần mở ra. `error` và `notice` dùng chung cho cả
          // store, nên không dọn thì mở form lên đã thấy sẵn câu trả lời của một
          // việc khác - ví dụ "Đã gửi thư đặt lại mật khẩu" từ màn đăng nhập.
          clearError()
          if (open) close()
          else setOpen(true)
        }}
        className="btn btn-ghost"
      >
        🔑 Đổi mật khẩu
      </button>

      {/*
        `basis-full` đẩy khối này xuống dòng riêng của hàng tài khoản: nó là một
        biểu mẫu ba ô, không nhét vừa cạnh mấy cái nút.

        `min-w-72` là vì trên trang quản trị, hàng tài khoản KHÔNG chiếm hết bề
        ngang - nó là một ô trong header canh hai đầu, nên rộng bằng đúng nội
        dung của nó. Không có chiều rộng tối thiểu thì "dòng riêng" ấy hoá ra chỉ
        rộng bằng mấy cái nút, và ba ô mật khẩu bị bóp lại thành cột giấy.
      */}
      {open && (
        <div className="card min-w-72 basis-full">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!ready) return
              void changePassword({ currentPassword: current, newPassword: next }).then(() => {
                // Store báo kết quả qua `error`/`notice` chứ không ném ra, nên
                // hỏi lại nó xem vừa rồi có trót lọt không. Hỏng thì giữ nguyên
                // form để sửa, và lời báo lỗi nằm ngay dưới.
                if (useAuth.getState().error === null) close()
              })
            }}
          >
            <label className="grid gap-1">
              <span className="text-base font-bold">Mật khẩu hiện tại</span>
              <input
                type="password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                autoComplete="current-password"
                className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
                style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-base font-bold">Mật khẩu mới</span>
              <input
                type="password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                autoComplete="new-password"
                className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
                style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
              />
              {tooShort && (
                <span className="text-base" style={{ color: 'var(--color-warn)' }}>
                  Phải dài ít nhất {MIN_LENGTH} ký tự.
                </span>
              )}
            </label>

            {/*
              Ô nhắc lại KHÔNG phải thủ tục thừa. Gõ nhầm một ký tự ở ô trên là
              tự khoá mình ra khỏi tài khoản, mà giáo viên thì thường đổi mật
              khẩu trên máy dùng chung, nơi trình duyệt không nhớ hộ gì cả.
            */}
            <label className="grid gap-1">
              <span className="text-base font-bold">Nhắc lại mật khẩu mới</span>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                className="rounded-2xl border-4 bg-white px-4 py-3 text-lg outline-none"
                style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
              />
              {mismatch && (
                <span className="text-base" style={{ color: 'var(--color-warn)' }}>
                  Hai ô chưa giống nhau.
                </span>
              )}
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-2xl p-3 text-base font-bold"
                style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
              >
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={!ready} className="btn btn-good px-5">
                Lưu mật khẩu mới
              </button>
              <button type="button" onClick={close} className="btn btn-ghost px-5">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tin vui thì tô xanh, và hiện cả khi form đã đóng - đó là lúc nó xuất
          hiện, vì đổi xong là form tự đóng lại. */}
      {!open && notice && (
        <p
          role="status"
          className="basis-full rounded-2xl p-3 text-base font-bold"
          style={{ background: 'var(--color-good-soft)', color: 'var(--color-good)' }}
        >
          {notice}
        </p>
      )}
    </>
  )
}
