/**
 * NHỮNG CÂU TRẺ NÓI VỚI NHAU - một danh sách đóng, không có ô chữ tự do.
 *
 * Đây là quyết định quan trọng nhất của cả tính năng này, và nó là quyết định
 * về AN TOÀN chứ không phải về kỹ thuật.
 *
 * Một ô nhập chữ tự do giữa hai đứa bé bảy tuổi kéo theo cả một hệ thống khác:
 * phải lưu lại toàn bộ tin nhắn để thầy cô xem lại, phải có nút báo cáo, phải
 * lọc từ ngữ, và cuối cùng vẫn phải có một NGƯỜI THẬT đọc khi có chuyện. Trường
 * nào không dựng đủ bốn thứ đó thì ô chữ ấy là một chỗ để bắt nạt nhau, và là
 * một chỗ để một đứa trẻ viết ra số điện thoại của mẹ.
 *
 * Một danh sách đóng thì không cần thứ nào trong bốn thứ trên - không phải vì
 * đã lọc kỹ, mà vì KHÔNG CÓ GÌ ĐỂ LỌC. Trẻ chỉ chọn được một trong tám câu dưới
 * đây, và cả tám đều tử tế.
 *
 * Đây cũng đúng cách Pokémon, Animal Crossing và Rocket League làm cho trẻ em,
 * và ở tuổi này nó còn TIỆN hơn: một đứa bé lớp 1 gõ một câu mất nửa phút, bấm
 * một nút mất nửa giây.
 *
 * ---- CHỈ CÓ MÃ CÂU ĐI QUA ĐƯỜNG TRUYỀN ----
 *
 * Máy trẻ gửi lên `id`, không gửi chữ. Máy chủ kiểm `id` có trong bảng này
 * không rồi mới ghi, và máy bên kia tra ngược `id` ra chữ từ chính bảng này.
 * Nhờ vậy dù ai đó sửa mã trong trình duyệt để gửi một chuỗi bất kỳ, thứ duy
 * nhất tới được màn hình đứa trẻ khác vẫn là một trong tám câu ở đây - hoặc
 * không gì cả.
 */

export interface ChatLine {
  id: string
  text: string
}

/**
 * Tám câu, và cả tám đều nói được với bất cứ ai.
 *
 * Không có câu nào mang nghĩa xấu kể cả khi bấm đi bấm lại hay bấm sai lúc -
 * đó là phép thử cho mọi câu muốn thêm vào đây. "Thua rồi nhé" hay "Dễ quá"
 * nghe vui trong đầu người viết, nhưng nhận được nó sau khi vừa thua thì không
 * vui chút nào, mà trẻ con thì bấm lại rất nhiều lần.
 *
 * Thứ tự có chủ ý: hai câu đầu là hai việc trẻ muốn làm nhất khi gặp bạn -
 * chào, và rủ đấu - nên chúng nằm ở chỗ ngón tay chạm tới trước.
 */
export const CHAT_LINES: ChatLine[] = [
  { id: 'chao', text: 'Chào bạn!' },
  { id: 'dau-nhe', text: 'Đấu một trận nhé?' },
  { id: 'di-cung', text: 'Đi cùng mình nhé!' },
  { id: 'cho-ti', text: 'Chờ mình một chút!' },
  { id: 'gioi-qua', text: 'Bạn giỏi quá!' },
  { id: 'co-len', text: 'Cố lên!' },
  { id: 'cam-on', text: 'Cảm ơn bạn!' },
  { id: 'hen-sau', text: 'Hẹn lần sau nha!' },
]

const BY_ID = new Map(CHAT_LINES.map((line) => [line.id, line]))

/** Mã câu này có thật không. Máy chủ hỏi hàm này trước khi ghi bất cứ thứ gì. */
export function isChatLine(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id)
}

/**
 * Chữ ứng với một mã câu, hoặc `null` nếu mã ấy không có thật.
 *
 * Trả `null` chứ không trả chính cái mã: một mã lạ lọt tới đây nghĩa là ai đó
 * vừa gửi lên thứ không nằm trong bảng, và thứ cuối cùng nên làm là in nó ra
 * màn hình một đứa trẻ.
 */
export function chatText(id: string | null | undefined): string | null {
  if (!id) return null
  return BY_ID.get(id)?.text ?? null
}
