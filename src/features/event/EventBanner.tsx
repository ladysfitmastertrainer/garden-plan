/**
 * Dải sự kiện 20/10 nổi ở mép trên màn bản đồ.
 *
 * Trước giờ G: đồng hồ đếm ngược tới lúc bốn trùm sấm thức giấc.
 * Trong ngày: báo chúng đã thức giấc và còn bao lâu nữa thì biến mất - và nếu
 * trẻ đang đứng trong vùng đất bị nguyền, nói luôn lời nguyền là gì.
 * Hết ngày: không hiện gì nữa.
 *
 * Nổi CỐ ĐỊNH và không nhận chạm: nó là một tấm biển báo, không phải một cái
 * nút - nằm đè lên bản đồ mà nuốt mất cú chạm thì trẻ bấm mũi tên không ăn.
 */

import { useEffect, useState } from 'react'
import {
  CURSES,
  EVENT_END,
  EVENT_START,
  HIDDEN_BOSSES,
  eventNow,
  eventPhase,
  formatCountdown,
  hiddenBossBeaten,
} from '../../content/event2010'
import type { Subject } from '../../content/types'

/** Giờ của sự kiện, tự cập nhật mỗi \`intervalMs\`. */
export function useEventClock(intervalMs = 1000): number {
  const [now, setNow] = useState(() => eventNow())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(eventNow()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

export function EventBanner({
  region,
  beaten,
}: {
  /** Vùng đất đang đứng, nếu là vùng có trùm ẩn đang nấp (môn ấy, đúng lớp của trẻ). */
  region: Subject | null
  beaten: string[] | undefined
}) {
  const now = useEventClock()
  const phase = eventPhase(now)
  if (phase === 'over') return null

  const left = bossesLeft(beaten)
  const curse = phase === 'live' && region && !hiddenBossBeaten(beaten, region) ? CURSES[HIDDEN_BOSSES[region].curse] : null
  // Hạ đủ bốn con rồi thì dải chỉ còn một lời chúc mừng, không đếm gì nữa.
  if (phase === 'live' && left === 0) {
    return (
      <div className="event-banner" role="status">
        ⚡ Con đã hạ cả bốn Trùm Sấm! Chúc mừng ngày 20/10 🌷
      </div>
    )
  }

  return (
    <div className="event-banner" role="status">
      {phase === 'before' ? (
        <>⚡ 20/10 · Bốn Trùm Sấm thức giấc sau <strong>{formatCountdown(EVENT_START - now)}</strong></>
      ) : (
        <>
          ⚡ Trùm Sấm đã thức giấc! Tìm dấu tia sét dưới mặt đất · còn{' '}
          <strong>{formatCountdown(EVENT_END - now)}</strong>
        </>
      )}
      {curse && (
        <span className="event-banner-curse">
          Lời nguyền {curse.name}: {curse.text}
        </span>
      )}
    </div>
  )
}

/** Còn bao nhiêu con trùm ẩn chưa bị em ấy hạ. */
function bossesLeft(beaten: string[] | undefined): number {
  return (Object.keys(HIDDEN_BOSSES) as Subject[]).filter((s) => !hiddenBossBeaten(beaten, s)).length
}
