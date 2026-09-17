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
 *
 * Dải này là lời mời TỰ HIỆN RA, nên nó nhớ lời từ chối và không hỏi lại. Lối
 * vào chủ động - mục "Cài app về máy" trong ngăn kéo - thì không nhớ gì cả:
 * xem `InstallCard`.
 */

import { useEffect, useState } from 'react'

import { useUi } from '../store/ui'

import {
  dismissInstall,
  dismissedInstall,
  isHandheld,
  isIos,
  registerServiceWorker,
  runInstall,
  useInstallState,
} from '../shell/install'

export function InstallPrompt() {
  const { canInstall, installed } = useInstallState()
  const [gone, setGone] = useState(false)
  const [refused, setRefused] = useState(true)
  const setInviteOpen = useUi((s) => s.setInstallInviteOpen)

  /*
    Đọc lời từ chối ở LƯỢT VẼ SAU, không phải lúc dựng state.

    `localStorage` không có ở máy chủ, mà Next dựng sẵn trang này ở đó. Bắt đầu
    bằng "đã từ chối" rồi sửa lại ngay khi tới trình duyệt: hai lượt vẽ đầu tiên
    giống hệt nhau ở cả hai nơi, và không có dải nào loé lên rồi biến mất.
  */
  useEffect(() => {
    registerServiceWorker()
    setRefused(dismissedInstall())
  }, [])

  /*
    MỜI NGAY CẢ KHI CHROME CHƯA ĐƯA LỜI MỜI CỦA NÓ.

    Đây là chỗ bản trước im lặng, và im lặng gần như mọi lúc: dải này chỉ hiện
    ra khi `beforeinstallprompt` đã bắn. Mà Chrome giữ sự kiện ấy rất chặt - nó
    không bắn nếu người dùng từng gạt đi dải mời của chính Chrome (im khoảng ba
    tháng sau đó), không bắn khi chưa "đủ tương tác", và trên iOS thì không bao
    giờ có. Kết quả: app có đủ manifest, đủ service worker, đủ điều kiện cài -
    mà người dùng mở lên không thấy một lời nào.

    Nên điều kiện đổi từ "Chrome đã mời chưa" thành "đây có phải máy cầm tay
    không". Có nút bấm thì mời bằng nút; không có thì chỉ đường bằng lời, vì
    trên cả iPhone lẫn Android đều có một đường cài bằng tay và nó luôn dùng
    được. Vẫn là LỜI MỜI: một lần bấm ✕ là im hẳn.
  */
  const handheld = typeof window !== 'undefined' && isHandheld()
  const open = !gone && !refused && !installed && (canInstall || handheld)
  const onIos = typeof navigator !== 'undefined' && isIos()

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
    // Bấm "để sau" trong hộp thoại của Chrome cũng là một câu trả lời. Hỏi lại
    // ngay sau đó là phiền - nhưng ngăn kéo thì vẫn còn đó nếu đổi ý.
    if ((await runInstall()) === 'tu-choi') dismissInstall()
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
        {canInstall ? (
          <>Cài app về máy để chơi toàn màn hình và tự nằm ngang.</>
        ) : onIos ? (
          <>
            Cài về máy: bấm <strong>Chia sẻ</strong> ở thanh dưới, rồi chọn{' '}
            <strong>Thêm vào MH chính</strong>.
          </>
        ) : (
          <>
            Cài về máy: mở trình đơn <strong>⋮</strong> của trình duyệt, rồi chọn{' '}
            <strong>Cài ứng dụng</strong>.
          </>
        )}
      </p>

      {/* iOS thì không có nút nào để bấm - Safari không cho mở hộp thoại cài
          bằng mã. Hiện một nút không làm gì còn tệ hơn không có nút. */}
      {canInstall && (
        <button
          type="button"
          onClick={() => void install()}
          className="btn btn-primary shrink-0 px-4 text-sm"
          style={{ minHeight: 44 }}
        >
          Cài đặt
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

/**
 * "Cài app về máy", nằm trong ngăn kéo sau nút ☰.
 *
 * Đây là LỐI VÀO CHỦ ĐỘNG, và vì thế nó khác dải mời ở trên đúng một điều quan
 * trọng: nó KHÔNG nhớ lời từ chối nào cả. Bấm ✕ trên dải mời là nói "đừng hỏi
 * nữa", không phải "không bao giờ cho tôi cài" - mà bản trước hiểu thành vế
 * thứ hai, và một máy đã bấm ✕ thì mất hẳn đường cài app.
 *
 * Bốn tình huống, bốn câu trả lời khác nhau, và không câu nào là một cái nút
 * chết: đã cài rồi thì nói thế; Chrome đã sẵn sàng thì có nút bấm; iPhone thì
 * chỉ đường qua nút Chia sẻ; còn lại - thường là Chrome chưa đủ điều kiện mời -
 * thì chỉ đường qua trình đơn ⋮ của chính trình duyệt.
 */
export function InstallCard() {
  const { canInstall, installed } = useInstallState()
  const [done, setDone] = useState(false)

  useEffect(() => registerServiceWorker(), [])

  if (installed || done) {
    return (
      <section className="pixel-panel grid gap-1">
        <p className="pixel-font text-xl">📲 Cài app về máy</p>
        <p className="text-base leading-snug">✓ Đã cài trên máy này rồi.</p>
      </section>
    )
  }

  const ios = typeof navigator !== 'undefined' && isIos()

  return (
    <section className="pixel-panel grid gap-2">
      <p className="pixel-font text-xl">📲 Cài app về máy</p>
      <p className="text-base leading-snug">
        Cài rồi thì app chiếm trọn màn hình, tự nằm ngang, và mở nhanh hơn.
      </p>

      {canInstall ? (
        <button
          type="button"
          onClick={() => void runInstall().then((r) => r === 'da-cai' && setDone(true))}
          className="btn btn-primary w-full text-lg"
        >
          Cài đặt
        </button>
      ) : ios ? (
        <p className="text-base leading-snug">
          Trên iPhone: bấm <strong>Chia sẻ</strong> ở thanh dưới, rồi chọn{' '}
          <strong>Thêm vào MH chính</strong>.
        </p>
      ) : (
        <p className="text-base leading-snug">
          Trên Android: mở trình đơn <strong>⋮</strong> của trình duyệt, rồi chọn{' '}
          <strong>Cài ứng dụng</strong> (hoặc <strong>Thêm vào màn hình chính</strong>).
        </p>
      )}
    </section>
  )
}
