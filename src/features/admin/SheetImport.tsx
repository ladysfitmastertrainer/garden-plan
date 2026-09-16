/**
 * Nạp câu hỏi từ file Excel.
 *
 * Khối này thuộc về ĐÚNG MỘT KỸ NĂNG - nó nằm bên trong mục "Đếm và so sánh đến
 * 100", và mọi câu trong file sẽ rơi vào đúng mục đó. Bản đầu tiên là một hộp
 * chung đặt trên đầu trang, nhận file cho cả bốn môn cùng lúc; nhưng cả trang
 * này tổ chức theo môn / lớp / kỹ năng, nên một cái hộp phủ lên tất cả vừa mâu
 * thuẫn vừa dễ khiến người ta nạp nhầm chỗ mà không biết.
 *
 * Hai quyết định đáng nói:
 *
 * 1. XEM TRƯỚC RỒI MỚI GHI. Thầy cô nạp một file sáu chục dòng; đổ thẳng vào kho
 *    rồi mới báo "có 3 dòng hỏng" thì họ phải đi dò xem ba dòng nào đã lọt. Ở đây
 *    file được đọc, soi, rồi bày ra kết quả - bấm nút thứ hai mới thật sự ghi.
 *
 * 2. THƯ VIỆN ĐỌC EXCEL NẠP ĐỘNG. `xlsx` nặng cỡ 400KB, mà trẻ con thì không bao
 *    giờ mở trang này. `import()` trong lúc bấm nút nghĩa là gói của trẻ không
 *    phải cõng nó.
 *
 * Bản thân việc hiểu bảng nằm ở `content/sheet.ts` và không biết gì về Excel -
 * nhờ vậy phần dễ sai nhất kiểm chứng được mà không cần dựng file .xlsx thật.
 */

import { useState } from 'react'
import { addQuestion, customRows } from '../../content/custom'
import {
  parseSheet,
  templateRows,
  TEMPLATE_HEADERS,
  type SheetResult,
  type SkillLookup,
} from '../../content/sheet'

/** Thư viện đọc Excel. Chỉ tải về khi thật sự có người nạp file. */
async function sheetLib() {
  return import('xlsx')
}

export function SheetImport({
  skill,
  onChange,
}: {
  /** Kỹ năng mà khối này thuộc về. Mọi câu nạp lên đều vào đây. */
  skill: SkillLookup
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<SheetResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<number | null>(null)

  const reset = () => {
    setResult(null)
    setError(null)
    setSaved(null)
    setFileName(null)
  }

  const readFile = async (file: File) => {
    setBusy(true)
    reset()
    setFileName(file.name)
    try {
      const XLSX = await sheetLib()
      const book = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const first = book.SheetNames[0]
      if (!first) throw new Error('File không có trang tính nào.')

      // `defval: ''` để ô trống thành chuỗi rỗng chứ không biến mất khỏi hàng -
      // thiếu nó thì cột trống làm lệch cách dò tên cột.
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(book.Sheets[first]!, {
        defval: '',
        raw: false,
      })

      setResult(
        parseSheet(rows, {
          skills: [skill],
          lockedSkillId: skill.id,
          existing: (skillId) => customRows(skillId).map((row) => row.value.prompt),
        }),
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `Không đọc được file: ${cause.message}`
          : 'Không đọc được file này. Cần file .xlsx hoặc .csv.',
      )
    } finally {
      setBusy(false)
    }
  }

  const commit = () => {
    if (!result) return
    let count = 0
    for (const item of result.questions) {
      if (addQuestion(item.skillId, item.entry)) count++
    }
    setSaved(count)
    setResult(null)
    onChange()
  }

  const downloadTemplate = async () => {
    const XLSX = await sheetLib()
    const book = XLSX.utils.book_new()

    const sheet = XLSX.utils.json_to_sheet(templateRows(skill), {
      header: [...TEMPLATE_HEADERS],
    })
    XLSX.utils.book_append_sheet(book, sheet, 'Câu hỏi')

    // Không còn trang "Mã kỹ năng" nữa: file này chỉ dùng cho đúng một mục, và
    // cột ky_nang đã điền sẵn. Bày ra 132 mã kỹ năng lúc này chỉ là nhiễu.
    XLSX.writeFile(book, `mau-cau-hoi-${skill.id}.xlsx`)
  }

  const total = result ? result.questions.length : 0
  const hasSomething = result !== null && (total > 0 || result.problems.length > 0 || result.duplicates.length > 0)

  return (
    <div className="card grid gap-3" style={{ borderColor: 'var(--color-brand)' }}>
      <div>
        <h4 className="text-lg font-extrabold">📄 Nạp câu hỏi từ Excel</h4>
        <p className="text-sm opacity-70">
          Mỗi dòng một câu, và mọi câu trong file sẽ vào mục{' '}
          <strong>{skill.name}</strong>. Nạp được cả năm thể loại: trắc nghiệm, gõ đáp án, sắp thứ
          tự, nối cặp và tình huống. Tải file mẫu về xem là rõ — mỗi thể loại có sẵn một dòng, và
          chỉ dùng vài cột của riêng nó.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="btn btn-primary flex-1 cursor-pointer text-center text-base">
          {busy ? 'Đang đọc...' : '📂 Chọn file Excel'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void readFile(file)
              event.target.value = ''
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => void downloadTemplate()}
          className="btn btn-ghost px-5 text-base"
        >
          ⬇ Tải file mẫu
        </button>
      </div>

      {fileName && !error && (
        <p className="text-sm opacity-60">
          File: <strong>{fileName}</strong>
        </p>
      )}

      {error && (
        <p
          className="rounded-xl p-2 text-base font-bold"
          style={{ background: 'var(--color-warn-soft)', color: 'var(--color-warn)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      {saved !== null && (
        <p
          className="rounded-xl p-2 text-base font-bold"
          style={{ background: 'var(--color-good-soft)', color: 'var(--color-good)' }}
          role="status"
        >
          ✓ Đã thêm {saved} câu vào kho.
        </p>
      )}

      {hasSomething && (
        <div className="grid gap-2">
          <p className="text-base font-extrabold">
            Đọc được {total} câu
            {result.duplicates.length > 0 && ` · bỏ qua ${result.duplicates.length} câu trùng`}
            {result.problems.length > 0 && ` · ${result.problems.length} dòng lỗi`}
          </p>

          {result.questions.length > 0 && (
            <div className="grid gap-1" style={{ maxHeight: 220, overflowY: 'auto' }}>
              {result.questions.slice(0, 50).map((item) => (
                <div
                  key={item.row}
                  className="flex items-baseline gap-2 rounded-lg p-2"
                  style={{ background: 'var(--color-paper-sunk)' }}
                >
                  <span className="pixel-font shrink-0 text-sm opacity-60">dòng {item.row}</span>
                  <span className="min-w-0 flex-1 text-sm leading-snug">{item.entry.prompt}</span>
                  <span className="pixel-font shrink-0 text-sm opacity-60">
                    mức {item.entry.difficulty}
                  </span>
                </div>
              ))}
              {result.questions.length > 50 && (
                <p className="text-sm opacity-60">… và {result.questions.length - 50} câu nữa.</p>
              )}
            </div>
          )}

          {/* Lỗi nói rõ DÒNG SỐ MẤY - để mở file ra là sửa đúng chỗ, không phải dò. */}
          {result.problems.length > 0 && (
            <div
              className="grid gap-1 rounded-xl p-2"
              style={{ background: 'var(--color-warn-soft)' }}
            >
              <p className="text-base font-bold" style={{ color: 'var(--color-warn)' }}>
                Những dòng chưa nạp được:
              </p>
              {result.problems.slice(0, 20).map((problem) => (
                <p key={problem.row} className="text-sm">
                  Dòng {problem.row}: {problem.reason}
                </p>
              ))}
              {result.problems.length > 20 && (
                <p className="text-sm">… và {result.problems.length - 20} dòng nữa.</p>
              )}
            </div>
          )}

          {result.duplicates.length > 0 && (
            <p className="text-sm opacity-70">
              {result.duplicates.length} dòng bị bỏ qua vì đã có câu y hệt — nạp lại cùng một file
              không làm kho nhân đôi.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={commit}
              disabled={total === 0}
              className="btn btn-primary flex-1 text-base"
            >
              Thêm {total} câu vào kho
            </button>
            <button type="button" onClick={reset} className="btn btn-ghost px-5 text-base">
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
