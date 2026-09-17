'use client'

/**
 * Nhạc nền.
 *
 * Tách hẳn khỏi `synth.ts`, và đó không phải để cho gọn: hai thứ này khác nhau
 * về bản chất. Hiệu ứng trong `synth.ts` là những tiếng ngắn do máy TỰ SINH ra
 * bằng Web Audio - không tải gì về, không có độ trễ, bấm là kêu. Nhạc nền là
 * một TỆP dài vài chục megabyte, tải dần theo lúc nghe, và bị trình duyệt chặn
 * cho tới khi người dùng chạm vào trang. Nhét chung một module thì mọi luật của
 * cái này lại phải viết thêm một ngoại lệ cho cái kia.
 *
 * KHÔNG PHẢI ZUSTAND, cùng lẽ với `content/tuning.ts`: đây là một thiết bị của
 * trình duyệt, không phải một mẩu trạng thái giao diện. React nối vào bằng một
 * `useEffect` ở `GameShell`.
 */

/** Tệp nhạc nằm trong `public/`, nên đường dẫn là đường dẫn công khai. */
const SRC = '/nhac-nen.mp3'

/**
 * Âm lượng nhạc nền, cố định.
 *
 * Nhỏ hơn hẳn hiệu ứng, và đó là cả điểm của nó: nhạc nền phải nằm DƯỚI tiếng
 * con thú tung phép và tiếng trả lời đúng. Nghe được thì ấm, mà to hơn thì nó
 * nuốt mất chính những tiếng đang nói cho trẻ biết vừa có chuyện gì xảy ra.
 */
const VOLUME = 0.25

/** Nhỏ dần trong bao lâu khi tắt nhạc. Cắt phựt một phát nghe như máy hỏng. */
const FADE_MS = 600

let element: HTMLAudioElement | null = null
/** Người dùng CÓ MUỐN nghe nhạc không. Khác hẳn "nhạc có đang chạy không". */
let wanted = false
/** Đã gắn bộ nghe cử chỉ để mở khoá tự phát chưa. */
let waitingForGesture = false
let fadeTimer: number | null = null

function audio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (element) return element

  element = new Audio(SRC)
  element.loop = true
  /*
    `preload: 'none'` - KHÔNG tải gì cho tới khi thật sự bật nhạc.

    Tệp này dài một tiếng. Để trình duyệt tự đi tải ngay lúc dựng trang là ép
    mỗi đứa trẻ mở app phải tải vài chục megabyte trước khi làm được gì, kể cả
    đứa đã tắt nhạc. Tải dần theo lúc nghe thì trẻ nghe mười phút chỉ tốn phần
    dữ liệu của mười phút ấy.
  */
  element.preload = 'none'
  element.volume = VOLUME
  return element
}

/**
 * Thử phát, và nếu trình duyệt chặn thì ĐỢI CÚ CHẠM ĐẦU TIÊN.
 *
 * Mọi trình duyệt đều chặn tiếng tự phát cho tới khi người dùng chạm vào trang -
 * đúng luật, và không có cách nào xin ngoại lệ. Bắt lỗi rồi im lặng thì nhạc
 * không bao giờ kêu; hiện một nút "bấm để bật nhạc" thì lại thêm một thứ chắn
 * đường một đứa bé sáu tuổi.
 *
 * Nên: thử phát ngay (lần sau quay lại app thì trang đã được chạm rồi, nhạc lên
 * luôn), chặn lại thì gắn một bộ nghe DÙNG MỘT LẦN vào cú chạm kế tiếp. Trẻ bấm
 * nút bất kỳ là nhạc vào, mà không phải bấm nút nào dành riêng cho nhạc.
 */
function tryPlay(): void {
  const el = audio()
  if (!el || !wanted) return

  const started = el.play()
  if (!started) return

  void started.catch(() => {
    if (waitingForGesture || !wanted) return
    waitingForGesture = true

    const onGesture = () => {
      waitingForGesture = false
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
      if (wanted) void el.play().catch(() => {})
    }

    window.addEventListener('pointerdown', onGesture, { once: true })
    window.addEventListener('keydown', onGesture, { once: true })
  })
}

/** Dừng hẳn, nhỏ dần chứ không cắt phựt. */
function fadeOut(): void {
  const el = element
  if (!el) return

  if (fadeTimer !== null) window.clearInterval(fadeTimer)
  const step = VOLUME / (FADE_MS / 50)

  fadeTimer = window.setInterval(() => {
    const next = el.volume - step
    if (next <= 0.01 || wanted) {
      if (fadeTimer !== null) window.clearInterval(fadeTimer)
      fadeTimer = null
      // `wanted` bật lại giữa chừng thì bỏ việc tắt, trả âm lượng về chỗ cũ.
      if (wanted) {
        el.volume = VOLUME
        return
      }
      el.pause()
      el.volume = VOLUME
      return
    }
    el.volume = next
  }, 50)
}

/**
 * Bật hoặc tắt nhạc nền.
 *
 * Gọi bao nhiêu lần với cùng một giá trị cũng không sao - đây là nơi duy nhất
 * biết nhạc đang ở trạng thái nào, nên React cứ việc gọi lại ở mỗi lần vẽ.
 */
export function setMusicOn(on: boolean): void {
  if (wanted === on) return
  wanted = on

  if (on) {
    if (fadeTimer !== null) {
      window.clearInterval(fadeTimer)
      fadeTimer = null
    }
    const el = audio()
    if (el) el.volume = VOLUME
    tryPlay()
    return
  }

  fadeOut()
}

/**
 * Tạm dừng khi trẻ chuyển sang tab khác, và mở lại khi quay về.
 *
 * Không có nó thì nhạc chạy tiếp sau lưng: tốn pin, tốn dữ liệu, và - chuyện
 * thật - phát ra tiếng từ một tab mà người dùng không nhớ là mình còn mở.
 *
 * Trả về hàm gỡ bộ nghe, để `GameShell` dọn đúng theo vòng đời của nó.
 */
export function watchVisibility(): () => void {
  if (typeof document === 'undefined') return () => {}

  const onChange = () => {
    const el = element
    if (!el || !wanted) return
    if (document.hidden) el.pause()
    else void el.play().catch(() => {})
  }

  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

/** Chỉ dùng cho test: trả module về trạng thái vừa nạp. */
export function resetMusicForTest(): void {
  if (fadeTimer !== null) window.clearInterval(fadeTimer)
  fadeTimer = null
  element = null
  wanted = false
  waitingForGesture = false
}

/** Nhạc đang được bật hay không - dùng cho test và cho gỡ lỗi. */
export function isMusicOn(): boolean {
  return wanted
}
