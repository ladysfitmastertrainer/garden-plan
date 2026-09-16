/**
 * Trình vẽ lục địa: tô từng ô, xem trước ngay, soi lỗi, rồi LƯU.
 *
 * Trước đây nó không lưu gì cả - vẽ xong nó trả về một khối TypeScript kèm câu
 * "dán vào continent.ts". Lý lẽ hồi đó không sai: năm lục địa nằm trong mã
 * nguồn, đi cùng git, có test canh, và cho trang này ghi đè thì bản trên máy một
 * đằng mã nguồn một nẻo. Nhưng hệ quả là người dùng thật của trang quản trị -
 * thầy cô, ban giám hiệu - không dán được vào đâu cả, nên với họ cả mục này là
 * một màn hình chết.
 *
 * Giờ nó đi đúng con đường mà câu hỏi tự soạn đã đi (xem `content/custom.ts`):
 *
 *   MÃ NGUỒN  - `CONTINENTS` trong `continent.ts`, bản gốc, không ai sửa được từ
 *               trình duyệt, không bao giờ mất.
 *   BẢN TỰ VẼ - CHỒNG LÊN bản gốc, đồng bộ qua Supabase như mọi nội dung tự
 *               soạn khác. Bỏ đi là mọi thứ về như cũ.
 *
 * Nhờ vậy vẽ hỏng cũng không hỏng được gì: nút "Trả về bản gốc" luôn có đó, và
 * bản trong git vẫn nguyên vẹn để so.
 *
 * Lưới vẽ ở đây là LƯỚI THÔ (12×12, hàng r, cột c), không phải hình trên màn
 * hình: lưới xoay 45 độ khi chiếu ra, nên vẽ trên hình xoay thì không lần ra
 * được ô nào ứng với ký tự nào. Khung xem trước bên cạnh lo phần hình.
 */

import { useMemo, useState } from 'react'
import { GRADES, SUBJECT_LABEL, type Grade } from '../../content/types'
import {
  clearCustomContinent,
  customContinent,
  customContinentSavedAt,
  setCustomContinent,
} from '../../content/custom'
import { syncCustomContent } from '../../data/content-sync'
import { ContinentCanvas, type LandPalette } from '../world/ContinentCanvas'
import { CONTINENTS, continentFor, GRID, validateContinent } from '../world/continent'
import { useCustomContentVersion } from './useTuning'

/** Bút vẽ: ký tự sẽ tô, kèm màu để nhận ra trên lưới. */
const BRUSHES = [
  { char: '.', label: 'Biển', color: '#2f6fa8', ink: '#ffffff' },
  { char: 'T', label: SUBJECT_LABEL.math, color: '#8fb35a', ink: '#1b2432' },
  { char: 'V', label: SUBJECT_LABEL.vietnamese, color: '#3f9c63', ink: '#ffffff' },
  { char: 'D', label: SUBJECT_LABEL.ethics, color: '#7fd9c0', ink: '#1b2432' },
  { char: 'N', label: SUBJECT_LABEL.music, color: '#e8d9a8', ink: '#1b2432' },
  { char: 'C', label: 'Lâu đài', color: '#d8c49a', ink: '#1b2432' },
  { char: 'G', label: 'Cổng lớp sau', color: '#b7a9d8', ink: '#1b2432' },
  { char: '-', label: 'Đất trống', color: '#8fa878', ink: '#1b2432' },
] as const

const PALETTE: LandPalette = {
  math: { top: '#8fb35a', topEdge: '#adcd7b', leftWall: '#6f5a32', rightWall: '#8f7644', outline: '#3a3a1e' },
  vietnamese: { top: '#3f9c63', topEdge: '#5bbd80', leftWall: '#4a3a24', rightWall: '#665030', outline: '#1c3325' },
  music: { top: '#e8d9a8', topEdge: '#f7ecc9', leftWall: '#8a7350', rightWall: '#ab9166', outline: '#3a3324' },
  ethics: { top: '#7fd9c0', topEdge: '#a5ece0', leftWall: '#57705f', rightWall: '#749183', outline: '#24403a' },
  castle: { top: '#d8c49a', topEdge: '#efe0bd', leftWall: '#7c6444', rightWall: '#9c7f57', outline: '#3b3225' },
  land: { top: '#8fa878', topEdge: '#a9c08f', leftWall: '#6b5233', rightWall: '#8a6b45', outline: '#2f3a24' },
  gate: { top: '#b7a9d8', topEdge: '#d4cbec', leftWall: '#5b4d80', rightWall: '#77679c', outline: '#2b2a4a' },
}

export function MapEditor() {
  const [grade, setGrade] = useState<Grade>(1)
  const [rows, setRows] = useState<string[]>(() => [...continentFor(1).rows])
  const [brush, setBrush] = useState<string>('T')
  const [high, setHigh] = useState(false)
  const [saving, setSaving] = useState(false)
  /** Lời báo sau lần lưu gần nhất. `null` là chưa lưu lần nào trong phiên này. */
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  // Kho tự soạn nằm ngoài React, nên phải nghe nó để biết lúc bản đồ được lưu
  // hoặc được trả về gốc mà vẽ lại dòng trạng thái. Xem `useCustomContentVersion`.
  useCustomContentVersion()

  const errors = useMemo(() => validateContinent(rows), [rows])

  /** Bản đang có hiệu lực: bản tự vẽ nếu có, không thì bản trong mã nguồn. */
  const saved = continentFor(grade).rows
  const savedAt = customContinentSavedAt(grade)
  const drawn = customContinent(grade) !== null
  const dirty = rows.join('\n') !== saved.join('\n')

  const loadGrade = (next: Grade) => {
    setGrade(next)
    setRows([...continentFor(next).rows])
    setNote(null)
  }

  const paint = (c: number, r: number) => {
    setRows((current) =>
      current.map((row, index) => {
        if (index !== r) return row
        // Biển và đất trống không có bậc cao - chữ thường chỉ có nghĩa với vùng.
        const char = brush === '.' || brush === '-' ? brush : high ? brush.toLowerCase() : brush
        return row.slice(0, c) + char + row.slice(c + 1)
      }),
    )
  }

  /**
   * Lưu bản đồ, rồi đẩy luôn lên máy chủ.
   *
   * Ghi vào kho cục bộ TRƯỚC, đẩy lên sau, và hai việc báo lỗi riêng: cô giáo vẽ
   * xong mà mạng lớp học rớt thì công vẽ vẫn còn trên máy này và tự lên đường ở
   * lần đồng bộ sau. Gộp làm một thì mất mạng là mất cả bản vẽ.
   */
  const save = async () => {
    if (saving || errors.length > 0) return
    setSaving(true)
    setCustomContinent(grade, rows)
    try {
      await syncCustomContent()
      setNote({ ok: true, text: 'Đã lưu và gửi lên máy chủ. Các em sẽ thấy bản đồ mới.' })
    } catch (cause) {
      setNote({
        ok: false,
        text: `Đã lưu trên máy này, nhưng chưa gửi lên được: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
      })
    } finally {
      setSaving(false)
    }
  }

  /** Bỏ bản tự vẽ, quay lại bản trong mã nguồn. */
  const revert = async () => {
    if (saving) return
    setSaving(true)
    clearCustomContinent(grade)
    setRows([...CONTINENTS[grade].rows])
    try {
      await syncCustomContent()
      setNote({ ok: true, text: 'Đã trả về bản đồ gốc.' })
    } catch {
      setNote({ ok: false, text: 'Đã trả về bản gốc trên máy này, chưa gửi lên được.' })
    } finally {
      setSaving(false)
    }
  }

  const savedTime =
    savedAt === null
      ? null
      : new Date(savedAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })

  return (
    <div className="grid gap-4">
      <section className="card grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {GRADES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => loadGrade(value)}
              aria-pressed={grade === value}
              className="btn flex-1 text-base"
              style={{ background: grade === value ? '#fff3c4' : 'var(--color-paper-sunk)' }}
            >
              Lớp {value}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {BRUSHES.map((item) => (
            <button
              key={item.char}
              type="button"
              onClick={() => setBrush(item.char)}
              aria-pressed={brush === item.char}
              className="px-3 py-2 text-base font-bold"
              style={{
                borderRadius: 8,
                border: `4px solid ${brush === item.char ? '#1b2432' : 'transparent'}`,
                background: item.color,
                color: item.ink,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-base">
          <input type="checkbox" checked={high} onChange={(e) => setHigh(e.target.checked)} />
          Tô thành <strong>đất cao</strong> (chữ thường — có vách đá)
        </label>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card grid gap-2">
          <h3 className="text-xl font-extrabold">Lưới thô</h3>
          <p className="text-sm opacity-60">
            Hàng = r, cột = c. Ra màn hình thì lưới xoay 45°, nên đừng đoán hình ở đây — nhìn
            khung bên cạnh.
          </p>
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
          >
            {rows.flatMap((row, r) =>
              [...row].map((char, c) => {
                const item = BRUSHES.find((b) => b.char === char.toUpperCase()) ?? BRUSHES[0]
                const raised = char >= 'a' && char <= 'z'
                return (
                  <button
                    key={`${c}-${r}`}
                    type="button"
                    onClick={() => paint(c, r)}
                    onMouseEnter={(event) => event.buttons === 1 && paint(c, r)}
                    aria-label={`Ô cột ${c} hàng ${r}, đang là ${item.label}`}
                    style={{
                      aspectRatio: '1',
                      background: item.color,
                      color: item.ink,
                      border: raised ? '2px solid #1b2432' : '1px solid rgb(0 0 0 / 0.15)',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {raised ? '▲' : ''}
                  </button>
                )
              }),
            )}
          </div>
        </section>

        <section className="card grid justify-items-center gap-2">
          <h3 className="w-full text-xl font-extrabold">Xem trước</h3>
          {/* Lục địa vẽ đúng cỡ thật, rộng hơn màn điện thoại. Cho nó tự cuộn
              trong khung của mình, không thì nó đẩy cả trang quản trị rộng ra
              và mọi mục khác cũng phải kéo ngang theo. */}
          <div className="flex w-full min-w-0 justify-center overflow-x-auto">
            <div
              style={{
                border: '4px solid #1b2432',
                borderRadius: 6,
                overflow: 'hidden',
                background: CONTINENTS[grade].sea.light,
              }}
            >
              <ContinentCanvas rows={rows} palette={PALETTE} scale={1} />
            </div>
          </div>

          {errors.length === 0 ? (
            <p className="text-base" style={{ color: '#2f7d32' }}>
              ✓ Lục địa hợp lệ.
            </p>
          ) : (
            <ul className="grid w-full gap-1">
              {errors.map((error) => (
                <li key={error} className="text-base" style={{ color: '#a32e2e' }}>
                  ⚠ {error}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card grid gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 className="text-xl font-extrabold">Bản đồ Lớp {grade}</h3>

          {/*
            Nói thẳng bản nào đang có hiệu lực. Trước đây mục này chỉ đưa ra một
            khối TypeScript kèm câu "dán vào continent.ts" - việc mà người dùng
            thật của trang này không làm được, nên trình vẽ coi như không lưu gì.
          */}
          <p className="min-w-0 flex-1 text-base opacity-70">
            {dirty
              ? '● Có thay đổi chưa lưu'
              : drawn
                ? `✓ Bản tự vẽ, lưu lúc ${savedTime}`
                : 'Đang dùng bản đồ gốc.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRows([...saved])}
              disabled={!dirty || saving}
              className="btn btn-ghost"
              style={{ opacity: dirty && !saving ? 1 : 0.4 }}
            >
              Hoàn tác
            </button>
            {/* Chỉ có nghĩa khi đang tồn tại một bản tự vẽ để mà bỏ đi. */}
            {drawn && (
              <button
                type="button"
                onClick={() => void revert()}
                disabled={saving}
                className="btn btn-ghost"
              >
                Trả về bản gốc
              </button>
            )}
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !dirty || errors.length > 0}
              className="btn btn-good px-5"
              style={{ opacity: saving || !dirty || errors.length > 0 ? 0.4 : 1 }}
            >
              {saving ? 'Đang lưu…' : 'Lưu bản đồ'}
            </button>
          </div>
        </div>

        {/* Nút Lưu đã khoá sẵn khi còn lỗi, nhưng khoá mà không nói vì sao thì
            người dùng bấm mãi không được và không hiểu. */}
        {errors.length > 0 && (
          <p className="text-base" style={{ color: 'var(--color-warn)' }}>
            Còn lỗi ở khung xem trước, sửa xong mới lưu được.
          </p>
        )}

        {note && (
          <p
            role="status"
            className="rounded-xl p-3 text-base font-bold"
            style={{
              background: note.ok ? 'var(--color-good-soft)' : 'var(--color-warn-soft)',
              color: note.ok ? 'var(--color-good)' : 'var(--color-warn)',
            }}
          >
            {note.text}
          </p>
        )}

        <p className="text-base opacity-70">
          Bản đồ gốc nằm trong mã nguồn và không bao giờ mất. Bản vẽ ở đây chồng lên nó, nên trả
          về bản gốc được bất cứ lúc nào.
        </p>
      </section>
    </div>
  )
}
