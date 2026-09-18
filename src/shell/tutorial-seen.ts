'use client'

/**
 * "Hồ sơ này đã được mời xem hướng dẫn chưa."
 *
 * Nằm trong `localStorage` chứ không trong tiến độ của trẻ, và đó là một quyết
 * định chứ không phải đường tắt: đây là chuyện của CÁI MÁY này, không phải một
 * thành tựu của đứa trẻ. Một em đã xem hướng dẫn trên máy bảng ở lớp mà tối về
 * mở máy ở nhà thì được mời lại - đúng như mong đợi, vì cái máy ở nhà cầm khác,
 * bấm khác, và lời mời ấy mất đúng một cú chạm để gạt đi.
 *
 * Khoá gắn theo ID HỒ SƠ. Máy tính bảng dùng chung cả lớp là chuyện thường ở
 * đây, và lời mời phải hỏi từng em một - em vào sau không được thừa hưởng cái
 * "thôi khỏi" của em vào trước.
 */

/** Có số hiệu :v1, để bản sau đổi nội dung hướng dẫn thì mời lại được cả lượt. */
const KEY_PREFIX = 'hvtt:da-moi-huong-dan:v1:'

function keyFor(studentId: string): string {
  return `${KEY_PREFIX}${studentId}`
}

export function invitedToTutorial(studentId: string): boolean {
  try {
    return localStorage.getItem(keyFor(studentId)) === '1'
  } catch {
    /*
      Không đọc được thì coi như ĐÃ MỜI RỒI, tức là im lặng.

      Ngược hẳn với `dismissedInstall`, nơi lỗi rơi về phía mời lại. Ở đó lời
      mời là một dải nhỏ trên đầu trang; ở đây nó là một khung nổi chặn giữa màn
      hình. Một trình duyệt chặn `localStorage` (chế độ riêng tư, thiết lập chặt)
      thì nhớ được gì đâu - hỏi lại thành hỏi ở MỌI lần mở app, và cái khung ấy
      đứng chắn giữa đứa trẻ với trò chơi của nó. Lối vào chủ động trong ngăn kéo
      thì vẫn còn nguyên, nên không ai mất đường xem hướng dẫn.
    */
    return true
  }
}

export function markTutorialInvited(studentId: string): void {
  try {
    localStorage.setItem(keyFor(studentId), '1')
  } catch {
    // Không nhớ được thì lời mời hiện lại ở lần sau. Phiền, không hỏng.
  }
}
