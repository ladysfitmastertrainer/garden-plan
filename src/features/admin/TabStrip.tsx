/**
 * Hàng danh mục một dòng, cuộn ngang.
 *
 * Trước đây các hàng này là `flex-wrap`: sáu thẻ nhân 150px bề ngang tối thiểu
 * là 900px, rộng hơn cả khung 896px của trang - nên thẻ cuối rớt xuống dòng
 * hai, và mọi thẻ đều bị bóp lại cho vừa. Đọc thì xấu mà bấm cũng dễ trượt.
 *
 * Giờ hàng không bao giờ xuống dòng nữa. Thừa chỗ thì cuộn ngang:
 *
 *   * điện thoại, máy bảng: vuốt - đúng cử chỉ người ta vẫn quen;
 *   * máy tính: hai mũi tên hiện ra ở mép nào còn thẻ chưa thấy;
 *   * bàn phím: cứ Tab như thường, trình duyệt tự kéo thẻ đang focus vào tầm
 *     nhìn, nên hai mũi tên kia để `aria-hidden` cho khỏi lặp.
 *
 * Đổi thẻ bằng cách nào đi nữa thì thẻ đang chọn cũng được kéo vào tầm nhìn.
 */

import { useEffect, useRef, useState } from 'react'
import { useMeasureOnLayout } from '../../app/useMeasureOnLayout'

export type TabItem<T extends string | number> = {
  readonly id: T
  readonly label: string
}

/** Màu của thẻ đang chọn. `warm` dành cho hàng lớp, để phân biệt với hàng môn. */
export type TabTone = 'brand' | 'warm'

const TONE: Record<TabTone, { nen: string; chu: string }> = {
  brand: { nen: 'var(--color-brand)', chu: '#fff' },
  warm: { nen: '#fff3c4', chu: 'var(--color-ink)' },
}

/** Chừa một mép nhỏ khi kéo thẻ vào tầm nhìn, để thẻ không dính sát cạnh. */
const MEP = 12

export function TabStrip<T extends string | number>({
  items,
  value,
  onChange,
  label,
  tone = 'brand',
}: {
  items: readonly TabItem<T>[]
  value: T
  onChange: (id: T) => void
  /** Hàng này là danh mục gì - cho người dùng trình đọc màn hình. */
  label: string
  tone?: TabTone
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const [con, setCon] = useState({ dau: false, cuoi: false })

  // Mép nào còn thẻ chưa thấy? Quyết định dải mờ và mũi tên ở mép đó.
  const soi = () => {
    const rail = railRef.current
    if (!rail) return
    const dau = rail.scrollLeft > 2
    const cuoi = rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 2
    // Giữ nguyên đối tượng cũ khi không có gì đổi: hàm này chạy theo
    // ResizeObserver, mà trả về đối tượng mới mỗi lần thì render lại vô ích.
    setCon((truoc) => (truoc.dau === dau && truoc.cuoi === cuoi ? truoc : { dau, cuoi }))
  }

  // Bề ngang hàng đổi thì phải soi lại - xem `useMeasureOnLayout`.
  useMeasureOnLayout(railRef, soi)

  useEffect(() => {
    const rail = railRef.current
    const nut = rail?.querySelector<HTMLElement>('[data-chon="1"]')
    if (!rail || !nut) return

    // Chỉ kéo khi thẻ thật sự nằm ngoài tầm nhìn: thấy rồi mà vẫn kéo thì hàng
    // nhảy một cái vô cớ sau mỗi lần bấm.
    const trai = nut.offsetLeft
    const phai = trai + nut.offsetWidth
    if (trai < rail.scrollLeft + MEP) rail.scrollTo({ left: trai - MEP })
    else if (phai > rail.scrollLeft + rail.clientWidth - MEP)
      rail.scrollTo({ left: phai - rail.clientWidth + MEP })
  }, [value])

  const truot = (huong: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: huong * Math.max(160, rail.clientWidth * 0.8) })
  }

  return (
    <div className="tab-strip" data-dau={con.dau ? '1' : '0'} data-cuoi={con.cuoi ? '1' : '0'}>
      <div ref={railRef} className="tab-rail" role="group" aria-label={label} onScroll={soi}>
        {items.map((item) => {
          const chon = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={chon}
              data-chon={chon ? '1' : '0'}
              className="btn text-base"
              style={{
                background: chon ? TONE[tone].nen : 'var(--color-paper-sunk)',
                color: chon ? TONE[tone].chu : 'var(--color-ink)',
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {con.dau && (
        <button
          type="button"
          className="tab-arrow tab-arrow-dau"
          onClick={() => truot(-1)}
          aria-hidden
          tabIndex={-1}
        >
          ‹
        </button>
      )}
      {con.cuoi && (
        <button
          type="button"
          className="tab-arrow tab-arrow-cuoi"
          onClick={() => truot(1)}
          aria-hidden
          tabIndex={-1}
        >
          ›
        </button>
      )}
    </div>
  )
}
