'use client'

import { useSyncExternalStore } from 'react'

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

/**
 * Máy cầm tay - điện thoại hoặc máy tính bảng.
 *
 * Hỏi bằng KIỂU CON TRỎ chứ không bằng bề ngang màn hình: một cửa sổ trình
 * duyệt kéo hẹp trên máy tính vẫn là máy tính, và mời người ta "cài app về máy"
 * ở đó thì vừa thừa vừa khó hiểu. `pointer: coarse` nghĩa là ngón tay, và ngón
 * tay thì gần như chắc chắn là máy cầm tay.
 *
 * Dùng để quyết định CÓ MỜI HAY KHÔNG khi Chrome chưa chịu đưa lời mời của nó -
 * xem `InstallPrompt`.
 */
export function isHandheld(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches
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

/* ---------------------------------------------------------------------------
   MỘT CHỖ DUY NHẤT GIỮ LỜI MỜI CÀI CỦA CHROME
   ---------------------------------------------------------------------------

   Chrome bắn `beforeinstallprompt` ĐÚNG MỘT LẦN, và ai bắt được thì người ấy
   giữ. Bản trước có HAI chỗ cùng nghe: dải mời ở đầu trang, và một bản sao viết
   riêng nằm trong `MapScreen`. Cả hai cùng nhận được sự kiện, nhưng mỗi bên giữ
   một bản của riêng mình, nên bên nào hiện ra trước thì bên kia thành một cái
   nút chết - bấm vào gọi `prompt()` trên một sự kiện đã dùng rồi.

   Tệ hơn: dải mời ở đầu trang tự tắt vĩnh viễn sau một lần bấm ✕, và nó tắt
   TRƯỚC KHI kịp đăng ký nghe. Trẻ (hoặc bố mẹ) bấm ✕ một lần là cả máy đó không
   bao giờ cài được app nữa - không còn chỗ nào hỏi lại.

   Nên sự kiện được giữ ở ĐÂY, ngoài React, đúng một bản. Dải mời đọc nó, mà mục
   "Cài app về máy" trong ngăn kéo cũng đọc nó - và mục trong ngăn kéo thì KHÔNG
   quan tâm tới lời từ chối trước đó, vì mở ngăn kéo ra rồi bấm vào đúng dòng ấy
   là một việc người ta làm có chủ đích. */

/** Sự kiện riêng của Chrome, chưa có trong thư viện kiểu chuẩn. */
export interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallEvent | null = null
let installedNow = false
let wired = false
const watchers = new Set<() => void>()

function announce(): void {
  for (const watcher of watchers) watcher()
}

/**
 * Bắt đầu nghe - gọi bao nhiêu lần cũng chỉ nghe một lần.
 *
 * `preventDefault` để Chrome đừng tự hiện dải nhỏ bằng tiếng máy ở đáy màn hình,
 * vào đúng lúc nó muốn. Giữ lấy sự kiện thì mời được đúng chỗ, đúng lúc, bằng
 * tiếng Việt.
 */
function listen(): void {
  if (wired || typeof window === 'undefined') return
  wired = true

  window.addEventListener('beforeinstallprompt', (raw: Event) => {
    raw.preventDefault()
    deferred = raw as InstallEvent
    announce()
  })

  window.addEventListener('appinstalled', () => {
    deferred = null
    installedNow = true
    announce()
  })
}

export function watchInstall(onChange: () => void): () => void {
  listen()
  watchers.add(onChange)
  return () => {
    watchers.delete(onChange)
  }
}

/**
 * Trạng thái cài đặt, gói thành MỘT CHUỖI hai chữ số.
 *
 * `useSyncExternalStore` so sánh ảnh chụp bằng `Object.is`, nên trả về một đối
 * tượng mới mỗi lần hỏi là vẽ lại vô tận. Chuỗi thì bằng nhau là bằng nhau.
 * Chữ số đầu: Chrome đã đưa lời mời chưa. Chữ số sau: đã cài rồi chưa.
 */
export function installSnapshot(): string {
  return `${deferred ? 1 : 0}${installedNow || isInstalled() ? 1 : 0}`
}

/** Ảnh chụp lúc dựng ở máy chủ, nơi không có `window`. */
export function installSnapshotOnServer(): string {
  return '00'
}

/**
 * Mở hộp thoại cài thật của Chrome.
 *
 * Trả về 'khong-co' khi chưa có lời mời nào để mở - iOS luôn rơi vào đây, vì
 * Safari không cho gọi hộp thoại cài bằng mã.
 */
export async function runInstall(): Promise<'da-cai' | 'tu-choi' | 'khong-co'> {
  const event = deferred
  if (!event) return 'khong-co'

  // Một lời mời chỉ dùng được một lần. Bỏ đi trước khi chờ, để hai cú bấm nhanh
  // không cùng mở hai hộp thoại.
  deferred = null
  announce()

  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome === 'accepted' ? 'da-cai' : 'tu-choi'
}

/**
 * Trạng thái cài đặt, đọc được từ React.
 *
 * `useSyncExternalStore` chứ không phải `useEffect` + `useState`: Next dựng
 * sẵn trang này ở máy chủ, nơi không có `window`. Hàm đọc ở máy chủ trả về
 * "chưa mời, chưa cài", rồi trình duyệt sửa lại ngay ở lượt vẽ đầu tiên.
 */
export function useInstallState(): { canInstall: boolean; installed: boolean } {
  const snapshot = useSyncExternalStore(watchInstall, installSnapshot, installSnapshotOnServer)
  return { canInstall: snapshot[0] === '1', installed: snapshot[1] === '1' }
}
