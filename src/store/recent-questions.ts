/**
 * Những câu hỏi một đứa trẻ vừa gặp gần đây, qua mọi trận.
 *
 * Bộ chọn câu dùng danh sách này để NÉ câu cũ khi còn câu mới (xem `recent`
 * trong `engine/selector.ts`). Không có nó thì đánh xong con quái này sang con
 * quái kia là gặp lại đúng những câu vừa làm.
 *
 * LƯU TRÊN MÁY, không lưu lên máy chủ - và đó là đánh đổi có tính toán. Tiến độ
 * trên máy chủ nằm trong những cột riêng của bảng `student_progress`, nên thêm
 * một trường là thêm một lần sửa cơ sở dữ liệu. Còn thứ này chỉ là một gợi ý để
 * bốc câu cho đa dạng: đổi máy thì mất lịch sử, và cái giá duy nhất là vài câu
 * đầu trên máy mới có thể trùng với câu đã gặp trên máy cũ.
 *
 * Tách theo từng học sinh, vì một máy tính bảng ở lớp học có nhiều em dùng
 * chung - câu em này vừa gặp không có lý do gì để em kia phải né.
 */

/**
 * Nhớ bao nhiêu câu gần nhất.
 *
 * Đủ dài để phủ vài chục trận (mỗi trận 5-14 câu), nên cả buổi chơi hiếm khi
 * gặp lại câu cũ. Không dài hơn: kỹ năng nào có ngân hàng nhỏ thì nhớ quá nhiều
 * là né hết cả ngân hàng, và bộ chọn phải lùi về câu cũ ở mọi lượt bốc - lúc đó
 * danh sách này chỉ còn là việc thừa.
 */
export const RECENT_LIMIT = 200

const KEY = 'hvtt.recent-questions.v1.'

export function recentQuestions(studentId: string): Set<string> {
  try {
    const raw = localStorage.getItem(KEY + studentId)
    const list: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

/** Ghi thêm những câu vừa bốc cho một trận. Câu mới nhất nằm cuối, cắt ở đầu. */
export function rememberQuestions(studentId: string, ids: readonly string[]): void {
  try {
    const before = [...recentQuestions(studentId)].filter((id) => !ids.includes(id))
    const next = [...before, ...ids].slice(-RECENT_LIMIT)
    localStorage.setItem(KEY + studentId, JSON.stringify(next))
  } catch {
    // Không ghi được (chế độ ẩn danh, đầy bộ nhớ) thì thôi: bốc câu vẫn chạy
    // bình thường, chỉ là không né được câu của trận trước.
  }
}
