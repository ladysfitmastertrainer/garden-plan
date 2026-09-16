/**
 * Đo lại mỗi khi bố cục quanh một phần tử thay đổi.
 *
 * Cả bản đồ thế giới lẫn màn đi cảnh đều chọn bội số phóng bằng cách đo chỗ
 * trống còn lại. Đo MỘT LẦN lúc dựng là sai, vì lúc đó trang chưa yên:
 *
 *   * Huy hiệu đồng bộ hiện lên trong khi app kéo dữ liệu về, chiếm 45px rồi
 *     biến mất. Bản đồ đo trúng lúc nó còn đó thì chọn bội số nhỏ hơn một bậc,
 *     và giữ nguyên cỡ bé ấy mãi - tới khi người dùng rời đi rồi quay lại,
 *     component dựng lại và đo lại. Đúng triệu chứng "lần đầu bé tí, lần sau
 *     bình thường".
 *   * Phông chữ pixel nạp xong thì hàng tiêu đề đổi chiều cao.
 *   * Lời mời cài app cũng xuất hiện muộn y như vậy.
 *
 * Một khung hình `requestAnimationFrame` không đủ: những thứ trên tới muộn hơn
 * thế nhiều, và tới vào lúc không đoán trước được. Nên thay vì đoán, hãy NGHE:
 *
 *   ResizeObserver    - phần tử hoặc khung cha đổi kích thước
 *   MutationObserver  - anh em của nó xuất hiện hoặc biến mất
 *   fonts.ready       - phông nạp xong
 *   resize/orientation - người dùng đổi cỡ cửa sổ hoặc xoay máy
 */

import { useEffect, useRef, type RefObject } from 'react'

export function useMeasureOnLayout(
  ref: RefObject<HTMLElement | null>,
  measure: () => void,
): void {
  // Giữ hàm đo trong ref: nơi gọi thường viết hàm mới mỗi lần render, mà gắn lại
  // toàn bộ observer sau mỗi render thì vừa phí vừa dễ sinh vòng lặp.
  const latest = useRef(measure)
  latest.current = measure

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let alive = true
    const run = () => {
      if (alive) latest.current()
    }

    run()
    const frame = window.requestAnimationFrame(run)

    const observers: Array<ResizeObserver | MutationObserver> = []

    if (typeof ResizeObserver !== 'undefined') {
      const size = new ResizeObserver(run)
      size.observe(el)
      // Khung cha cũng phải nghe: chỗ trống của phần tử này phụ thuộc vào chiều
      // cao của cả khối, không riêng bề ngang của chính nó.
      if (el.parentElement) size.observe(el.parentElement)
      observers.push(size)
    }

    if (el.parentElement && typeof MutationObserver !== 'undefined') {
      // Đây là cái bắt được huy hiệu đồng bộ: nó là ANH EM của phần tử này, nên
      // xuất hiện rồi biến mất mà không làm phần tử này đổi kích thước lần nào.
      const children = new MutationObserver(run)
      children.observe(el.parentElement, { childList: true })
      observers.push(children)
    }

    window.addEventListener('resize', run)
    window.addEventListener('orientationchange', run)
    void document.fonts?.ready.then(run).catch(() => {})

    return () => {
      alive = false
      window.cancelAnimationFrame(frame)
      for (const observer of observers) observer.disconnect()
      window.removeEventListener('resize', run)
      window.removeEventListener('orientationchange', run)
    }
  }, [ref])
}
