/**
 * Cổng vào khu vực người lớn.
 *
 * Một phép nhân hai chữ số - đủ để trẻ tiểu học không tự mò vào xem số liệu về
 * chính mình, nhưng KHÔNG phải cơ chế bảo mật. Dữ liệu thật được bảo vệ bằng RLS
 * phía server, không phải bằng màn hình này.
 */

import { useMemo, useState } from 'react'
import { createRng } from '../../engine/rng'

export function ParentGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  // Seed theo phút để mỗi lần mở là một phép tính khác, nhưng ổn định khi gõ dở.
  const [seed] = useState(() => Math.floor(Date.now() / 60_000))
  const { a, b } = useMemo(() => {
    const rng = createRng(seed)
    return { a: rng.int(11, 19), b: rng.int(3, 9) }
  }, [seed])

  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)

  const submit = () => {
    if (Number(value) === a * b) onPass()
    else {
      setWrong(true)
      setValue('')
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4">
      <header className="text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="text-2xl font-extrabold">Khu vực dành cho người lớn</h1>
        <p className="mt-1 text-base opacity-70">Giải phép tính này để vào xem tiến độ.</p>
      </header>

      <form
        className="card grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <p className="text-center text-3xl font-extrabold">
          {a} × {b} = ?
        </p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setWrong(false)
          }}
          aria-label="Kết quả phép tính"
          aria-invalid={wrong}
          className="rounded-2xl border-4 bg-white px-4 py-3 text-center text-3xl font-extrabold outline-none"
          style={{
            borderColor: wrong ? 'var(--color-warn)' : 'color-mix(in srgb, var(--color-ink) 15%, transparent)',
          }}
        />
        {wrong && (
          <p role="alert" className="text-center font-bold" style={{ color: 'var(--color-warn)' }}>
            Chưa đúng, thử lại nhé.
          </p>
        )}
        <button type="submit" disabled={!value.trim()} className="btn btn-primary text-xl">
          Vào xem
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          Quay lại game
        </button>
      </form>
    </div>
  )
}
