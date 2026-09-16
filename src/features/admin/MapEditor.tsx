/**
 * Trình vẽ lục địa: tô từng ô, xem trước ngay, soi lỗi, rồi xuất lưới ký tự.
 *
 * XUẤT RA CHỨ KHÔNG TỰ LƯU, có chủ ý. Năm lục địa nằm trong `continent.ts` -
 * mã nguồn, đi cùng git, có test canh. Cho trang này ghi đè vào một kho cục bộ
 * thì bản trên máy này một đằng, mã nguồn một nẻo, và người sửa tưởng đã xong.
 * Nên nó làm đúng việc khó nhất - vẽ và soi - rồi trả về một khối chữ để dán
 * vào `continent.ts`.
 *
 * Lưới vẽ ở đây là LƯỚI THÔ (12×12, hàng r, cột c), không phải hình trên màn
 * hình: lưới xoay 45 độ khi chiếu ra, nên vẽ trên hình xoay thì không lần ra
 * được ô nào ứng với ký tự nào. Khung xem trước bên cạnh lo phần hình.
 */

import { useMemo, useState } from 'react'
import { GRADES, SUBJECT_LABEL, type Grade } from '../../content/types'
import { ContinentCanvas, type LandPalette } from '../world/ContinentCanvas'
import { CONTINENTS, GRID, validateContinent } from '../world/continent'

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
  const [rows, setRows] = useState<string[]>(() => [...CONTINENTS[1].rows])
  const [brush, setBrush] = useState<string>('T')
  const [high, setHigh] = useState(false)

  const errors = useMemo(() => validateContinent(rows), [rows])
  const dirty = rows.join('\n') !== CONTINENTS[grade].rows.join('\n')

  const loadGrade = (next: Grade) => {
    setGrade(next)
    setRows([...CONTINENTS[next].rows])
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

  const exported = [
    '    rows: [',
    ...rows.map((row) => `      '${row}',`),
    '    ],',
  ].join('\n')

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

      <section className="card grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Đường dẫn này không có chỗ ngắt dòng nào, nên trên điện thoại nó
              một mình quyết định bề ngang tối thiểu của cả trang quản trị (385px)
              và đẩy mọi thẻ khác tràn ra ngoài. Cho phép ngắt giữa chừng. */}
          <h3 className="text-xl font-extrabold" style={{ overflowWrap: 'anywhere' }}>
            Dán vào `src/features/world/continent.ts`
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRows([...CONTINENTS[grade].rows])}
              disabled={!dirty}
              className="btn btn-ghost"
              style={{ opacity: dirty ? 1 : 0.4 }}
            >
              Hoàn tác hết
            </button>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(exported)}
              className="btn btn-primary"
            >
              Chép
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={exported}
          rows={14}
          aria-label="Lưới ký tự để dán vào mã nguồn"
          className="w-full rounded-xl border-4 bg-white p-2 font-mono text-xs"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
        />
      </section>
    </div>
  )
}
