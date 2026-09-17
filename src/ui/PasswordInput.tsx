/**
 * Ô nhập mật khẩu, kèm con mắt bật/tắt che chữ.
 *
 * VÌ SAO CẦN. Mật khẩu bị che là để người đứng sau lưng không đọc được - hợp lý
 * ở quán cà phê, nhưng chỗ app này được dùng là phòng giáo viên và máy tính bảng
 * ở lớp, nơi người ta gõ bằng một ngón trên bàn phím ảo. Gõ sai một ký tự mà
 * không nhìn lại được thì chỉ còn cách xoá sạch gõ lại, và với ô "nhắc lại mật
 * khẩu mới" thì người ta sẽ gõ sai đúng kiểu ấy lần thứ hai.
 *
 * MỘT COMPONENT CHO CẢ SÁU Ô. App có sáu ô mật khẩu nằm ở ba màn hình khác nhau
 * (đăng nhập, đặt lại mật khẩu, đổi mật khẩu). Gắn con mắt vào từng chỗ thì sáu
 * bản sao của cùng một đoạn, và cái thứ bảy thêm vào sau này sẽ quên mất nó.
 *
 * Con mắt KHÔNG nằm trong thứ tự Tab. Người dùng bàn phím đi từ ô mật khẩu là
 * sang thẳng nút bấm chính - chèn một nút phụ vào giữa thì mỗi lần đăng nhập
 * phải Tab thêm một nhịp, để đổi lấy một tính năng chỉ có nghĩa khi nhìn thấy
 * màn hình. Vẫn bấm được bằng chuột và bằng ngón tay, và trình đọc màn hình vẫn
 * gặp nó khi duyệt qua các nút.
 */

'use client'

import { useId, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Gợi ý cho trình quản lý mật khẩu. Luôn phải truyền - đây là ô mật khẩu. */
  autoComplete: 'current-password' | 'new-password'
  autoFocus?: boolean
  /** Ô đang có gì đó chưa ổn (quá ngắn, hai ô chưa giống nhau) - tô viền cảnh báo. */
  invalid?: boolean
  /** Nhãn của ô, để trình đọc màn hình biết con mắt này thuộc về ô nào. */
  label: string
}

export function PasswordInput({
  value,
  onChange,
  autoComplete,
  autoFocus,
  invalid,
  label,
}: Props) {
  const [shown, setShown] = useState(false)
  const inputId = useId()

  return (
    <span className="relative block">
      <input
        id={inputId}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border-4 bg-white py-3 pl-4 text-lg outline-none"
        style={{
          // Chừa chỗ cho con mắt. Thiếu nó thì chữ chui xuống dưới cái nút, và
          // đúng ký tự cuối cùng vừa gõ - thứ người ta đang muốn nhìn - bị che.
          paddingRight: 56,
          borderColor: invalid
            ? 'var(--color-warn)'
            : 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
        }}
      />

      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        // Ngoài thứ tự Tab - xem ghi chú ở đầu file.
        tabIndex={-1}
        aria-controls={inputId}
        aria-pressed={shown}
        aria-label={shown ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
        title={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute flex items-center justify-center"
        style={{
          // Ô chạm 44px - mức tối thiểu để một ngón tay người lớn bấm trúng trên
          // màn hình cảm ứng mà không chạm nhầm vào ô nhập ngay bên cạnh.
          top: '50%',
          right: 6,
          transform: 'translateY(-50%)',
          width: 44,
          height: 44,
          background: 'none',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        <span aria-hidden="true">{shown ? '🙈' : '👁️'}</span>
      </button>
    </span>
  )
}
