'use client'

/**
 * Lời mời cài app về máy.
 *
 * Vì sao đáng có: trẻ mở app trong tab trình duyệt thì mất một phần ba màn hình
 * cho thanh địa chỉ, và quan trọng hơn - bản đã cài mới đọc được
 * `orientation: 'landscape'` trong manifest, tức là mới tự nằm ngang. Xem
 * `shell/orientation.ts`.
 *
 * HAI ĐƯỜNG KHÁC HẲN NHAU, vì hai hệ điều hành làm hai kiểu:
 *
 *   Android/Chrome - trình duyệt tự bắn `beforeinstallprompt`. Giữ lấy sự kiện
 *                    đó rồi mở hộp thoại cài thật khi trẻ bấm nút.
 *   iOS/Safari     - KHÔNG có sự kiện nào, không có hộp thoại nào, và không có
 *                    cách nào gọi ra bằng mã. Chỉ còn cách chỉ đường bằng lời.
 *
 * Đây là LỜI MỜI, không phải cái chặn - cùng lẽ với `RotateHint`. App chạy đầy
 * đủ trong tab trình duyệt, nên dựng một tấm chắn bắt cài trước mới cho chơi là
 * cướp quyền của trẻ vì một thứ chỉ dễ chịu hơn.
 */

import { useEffect, useState } from 'react'

import { useUi } from '../store/ui'

import {
  dismissInstall,
  dismissedInstall,
  isInstalled,
  isIos,
  registerServiceWorker,
} from '../shell/install'

/** Sự kiện riêng của Chrome, chưa có trong thư viện kiểu chuẩn. */
interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [gone, setGone] = useState(false)
  const setInviteOpen = useUi((s) => s.setInstallInviteOpen)

  useEffect(() => {
    registerServiceWorker()

    // Đã cài rồi, hoặc đã bảo "không", thì thôi.
    if (isInstalled() || dismissedInstall()) return

    const onPrompt = (raw: Event) => {
      /*
        Chặn hộp thoại mặc định của Chrome để tự mời bằng lời của mình.

        Không chặn thì Chrome tự hiện một dải nhỏ ở đáy màn hình bằng tiếng máy,
        vào đúng lúc nó muốn - thường là lúc trẻ đang bấm dở một thứ khác. Giữ
        lấy sự kiện thì mời được đúng chỗ, đúng lúc, bằng tiếng Việt.
      */
      raw.preventDefault()
      setEvent(raw as InstallEvent)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)

    // iOS không bao giờ bắn sự kiện trên, nên hỏi thẳng xem có phải iPhone không.
    if (isIos()) setShowIos(true)

    // Cài xong thì dẹp lời mời ngay, không đợi tải lại trang.
    const onInstalled = () => setGone(true)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const open = !gone && (event !== null || showIos)

  /*
    Báo cho lời nhắc xoay máy biết mà nhường chỗ.

    Trong `useEffect` chứ không gọi thẳng lúc render: đặt state của một kho khác
    ngay giữa lượt render là React cảnh báo, và ở chế độ nghiêm ngặt thì nó chạy
    hai lần. Dọn cờ lúc rời màn để dải kia sống lại đúng lúc.
  */
  useEffect(() => {
    setInviteOpen(open)
    return () => setInviteOpen(false)
  }, [open, setInviteOpen])

  if (!open) return null

  const close = () => {
    dismissInstall()
    setGone(true)
  }

  const install = async () => {
    if (!event) return
    await event.prompt()
    const { outcome } = await event.userChoice
    // Bấm "để sau" trong hộp thoại của Chrome cũng là một câu trả lời. Hỏi lại
    // ngay sau đó là phiền.
    if (outcome === 'dismissed') dismissInstall()
    setGone(true)
  }

  return (
    <div
      className="pixel-ui flex flex-wrap items-center gap-2 px-3 py-2"
      style={{ background: '#e7e0ff', borderBottom: '4px solid #1b2432' }}
      role="status"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        📲
      </span>

      <p className="min-w-0 flex-1 text-sm font-bold leading-snug">
        {event ? (
          <>Cài app về máy để chơi toàn màn hình và tự nằm ngang.</>
        ) : (
          <>
            Cài về máy: bấm <strong>Chia sẻ</strong> ở thanh dưới, rồi chọn{' '}
            <strong>Thêm vào MH chính</strong>.
          </>
        )}
      </p>

      {/* iOS thì không có nút nào để bấm - Safari không cho mở hộp thoại cài
          bằng mã. Hiện một nút không làm gì còn tệ hơn không có nút. */}
      {event && (
        <button
          type="button"
          onClick={() => void install()}
          className="btn btn-primary shrink-0 px-4 text-sm"
          style={{ minHeight: 44 }}
        >
          Cài app
        </button>
      )}

      <button
        type="button"
        onClick={close}
        className="shrink-0 px-3 font-bold"
        // Cùng ngưỡng 44px với `RotateHint`: nhỏ thì được, nhỏ hơn ngón tay trẻ
        // con thì không.
        style={{ minHeight: 44, minWidth: 44 }}
        aria-label="Bỏ qua lời mời cài app"
      >
        ✕
      </button>
    </div>
  )
}
