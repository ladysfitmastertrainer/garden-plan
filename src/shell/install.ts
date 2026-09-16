'use client'

/**
 * Cài app về máy: nhận biết tình huống, và nhớ lời từ chối.
 *
 * Tách khỏi thành phần giao diện vì ba câu hỏi ở đây đều trả lời được mà không
 * cần React, và đều dễ trả lời sai theo kiểu chỉ lộ ra trên máy thật.
 */

/** Lời từ chối sống trong `localStorage`, không phải `sessionStorage`. */
const DISMISS_KEY = 'hvtt:khong-muon-cai'

/**
 * Đang chạy dưới dạng app đã cài, chứ không phải trong tab trình duyệt.
 *
 * Hai phép thử vì hai hệ điều hành trả lời theo hai cách: Android/Chrome đổi
 * `display-mode`, còn iOS đặt một cờ riêng của Safari lên `navigator`.
 */
export function isInstalled(): boolean {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true
    return (navigator as Navigator & { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

/**
 * iPhone hoặc iPad.
 *
 * iPad từ iPadOS 13 khai `platform` là 'MacIntel' y như máy Mac, nên phải hỏi
 * thêm màn hình có chạm được không - Mac thì không.
 */
export function isIos(): boolean {
  try {
    const ua = navigator.userAgent
    if (/iPhone|iPod/.test(ua)) return true
    return /iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  } catch {
    return false
  }
}

export function dismissedInstall(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissInstall(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // Không nhớ được thì lời mời hiện lại ở lần sau. Phiền, không hỏng.
  }
}

/**
 * Đăng ký service worker.
 *
 * Nó không lưu đệm gì cả - lý do đầy đủ nằm trong `public/sw.js`. Ở đây chỉ cần
 * biết: không có nó thì Chrome không bao giờ mời cài app.
 *
 * Nuốt lỗi có chủ ý. Service worker cần HTTPS (hoặc localhost), và chế độ duyệt
 * riêng tư thì từ chối hẳn. Cả hai đều không phải chuyện để báo cho một đứa trẻ
 * đang muốn chơi.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.register('/sw.js').catch(() => {})
}
