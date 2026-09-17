'use client'

/**
 * Nhạc trận đấu, SOẠN chứ không phải một tệp thu sẵn.
 *
 * Vì sao không dùng file: game này vẽ bằng điểm ảnh và phát tiếng bằng bộ tổng
 * hợp âm có sẵn (`synth.ts`) - một bản thu phòng thu đặt cạnh đàn thú pixel thì
 * lạc quẻ, mà còn kéo theo vài megabyte nữa vào kho và một câu hỏi bản quyền.
 * Mấy chục nốt nhạc viết thành mảng thì nặng vài trăm byte, chạy được cả khi
 * mất mạng, và sửa cao độ là sửa một con số.
 *
 * Nhạc nền chung (`music.ts`) là một tệp dài, êm, để nghe trong lúc đi bản đồ.
 * Bản này ngược lại: ngắn, nhịp gấp, giọng thứ - nó phải nói được rằng có
 * chuyện đang xảy ra. Hai thứ không bao giờ kêu cùng lúc (xem `GameShell`).
 */

import { ensureAudioContext, noteToFrequency, scheduleNote } from './synth'
import type { NoteName, Timbre } from '../content/types'

/** Nhịp độ, phách một phút. Gấp hơn nhạc nền, chưa tới mức nhạc đua xe. */
const TEMPO = 132
const BEAT_SEC = 60 / TEMPO

/**
 * Âm lượng cả bản, và nó phải NHỎ.
 *
 * Nhạc trận chạy dưới tiếng con thú tung phép, tiếng trả lời đúng, tiếng quái
 * đánh trả - tức là dưới đúng những tiếng đang nói cho trẻ biết vừa có chuyện
 * gì xảy ra. To hơn thì nó nuốt mất chúng, mà trong một trận đấu thì đó là nuốt
 * mất phần thông tin chứ không chỉ phần vui tai.
 */
const VOLUME = 0.14

/** Một bước trong bè. `null` là lặng - nghỉ cũng là một phần của giai điệu. */
export interface Step {
  note: NoteName | null
  /** Trường độ tính theo phách. 0.5 là một móc đơn. */
  beats: number
}

/**
 * Vòng hợp âm: Am - F - C - G, mỗi hợp âm hai ô nhịp.
 *
 * Đây là vòng i - VI - III - VII của giọng La thứ, và nó được chọn vì một lý do
 * cụ thể: nó đi TỚI mà không ngả sang bi thương. Giọng thứ để trận đấu ra dáng
 * trận đấu; còn bậc VI và III thì sáng, nên cả vòng nghe như đang xông lên chứ
 * không như đang thua.
 */
const CHORDS: Array<{ low: NoteName; high: NoteName }> = [
  { low: 'A2', high: 'A3' },
  { low: 'F2', high: 'F3' },
  { low: 'C3', high: 'C4' },
  { low: 'G2', high: 'G3' },
]

/** Bè trầm: móc đơn đều tăm tắp, đảo lên quãng tám ở phách hai và bốn. */
function bassLine(): Step[] {
  const out: Step[] = []
  for (const chord of CHORDS) {
    // Mỗi hợp âm hai ô nhịp, mỗi ô tám móc đơn.
    for (let bar = 0; bar < 2; bar++) {
      const bass = [chord.low, chord.low, chord.high, chord.low, chord.low, chord.low, chord.high, chord.low]
      for (const note of bass) out.push({ note, beats: 0.5 })
    }
  }
  return out
}

/**
 * Bè giai điệu, viết tay từng ô nhịp.
 *
 * Tám ô, mỗi ô cộng lại đúng bốn phách. Cố ý để một phách NGHỈ ở cuối các ô
 * chẵn: một giai điệu chạy liên tục không nghỉ thì tới vòng thứ ba là thành
 * tiếng ồn, mà trẻ nghe bản này vài chục lần mỗi buổi.
 */
const LEAD: Step[] = [
  // Ô 1 - Am
  { note: 'A4', beats: 0.5 }, { note: 'C5', beats: 0.5 }, { note: 'E5', beats: 1 },
  { note: 'D5', beats: 0.5 }, { note: 'C5', beats: 0.5 }, { note: 'B4', beats: 1 },
  // Ô 2 - Am
  { note: 'A4', beats: 0.5 }, { note: 'B4', beats: 0.5 }, { note: 'C5', beats: 1 },
  { note: 'A4', beats: 1 }, { note: null, beats: 1 },
  // Ô 3 - F
  { note: 'F4', beats: 0.5 }, { note: 'A4', beats: 0.5 }, { note: 'C5', beats: 1 },
  { note: 'D5', beats: 0.5 }, { note: 'C5', beats: 0.5 }, { note: 'A4', beats: 1 },
  // Ô 4 - F
  { note: 'G4', beats: 0.5 }, { note: 'A4', beats: 0.5 }, { note: 'F4', beats: 1 },
  { note: 'C4', beats: 1 }, { note: null, beats: 1 },
  // Ô 5 - C
  { note: 'C5', beats: 0.5 }, { note: 'E5', beats: 0.5 }, { note: 'G5', beats: 1 },
  { note: 'E5', beats: 0.5 }, { note: 'D5', beats: 0.5 }, { note: 'C5', beats: 1 },
  // Ô 6 - C
  { note: 'B4', beats: 0.5 }, { note: 'C5', beats: 0.5 }, { note: 'D5', beats: 1 },
  { note: 'E5', beats: 1 }, { note: null, beats: 1 },
  // Ô 7 - G
  { note: 'D5', beats: 0.5 }, { note: 'B4', beats: 0.5 }, { note: 'G4', beats: 1 },
  { note: 'B4', beats: 0.5 }, { note: 'D5', beats: 0.5 }, { note: 'G5', beats: 1 },
  // Ô 8 - G
  { note: 'F5', beats: 0.5 }, { note: 'E5', beats: 0.5 }, { note: 'D5', beats: 1 },
  { note: 'B4', beats: 1 }, { note: null, beats: 1 },
]

/** Tiếng gõ nhịp: phách 1 và 3 nặng, thêm một tiếng lót ở cuối mỗi nửa ô. */
const DRUM: Step[] = Array.from({ length: 8 }).flatMap<Step>(() => [
  { note: 'A5', beats: 1 },
  { note: null, beats: 0.5 },
  { note: 'A5', beats: 0.5 },
  { note: 'A5', beats: 1 },
  { note: null, beats: 0.5 },
  { note: 'A5', beats: 0.5 },
])

export interface Track {
  steps: Step[]
  timbre: Timbre
  gain: number
  /** Ngân bao nhiêu phần của ô nhịp. Ngắn thì tách bạch, dài thì liền mạch. */
  hold: number
}

export const TRACKS: Track[] = [
  { steps: bassLine(), timbre: 'triangle', gain: 0.55, hold: 0.9 },
  { steps: LEAD, timbre: 'square', gain: 0.32, hold: 0.85 },
  { steps: DRUM, timbre: 'pluck', gain: 0.22, hold: 0.25 },
]

/** Độ dài một vòng, tính bằng phách. Ba bè đều phải bằng đúng con số này. */
export const LOOP_BEATS = 32

export function loopSeconds(): number {
  return LOOP_BEATS * BEAT_SEC
}

/**
 * Hẹn giờ trọn MỘT vòng nhạc, bắt đầu tại `startAt`.
 *
 * Nhận `ctx` từ ngoài để dựng được bản nhạc vào một `OfflineAudioContext` mà
 * kiểm: máy không nghe được, nhưng đo biên độ thì đo được - và đó là cách duy
 * nhất biết bản nhạc có thật sự kêu hay không mà không phải mở loa lên nghe.
 */
export function scheduleLoop(ctx: BaseAudioContext, destination: AudioNode, startAt: number): void {
  for (const track of TRACKS) {
    let cursor = startAt
    for (const step of track.steps) {
      const seconds = step.beats * BEAT_SEC
      if (step.note) {
        scheduleNote(
          ctx as AudioContext,
          noteToFrequency(step.note),
          cursor,
          seconds * track.hold,
          track.gain,
          track.timbre,
          destination,
        )
      }
      cursor += seconds
    }
  }
}

// --- Phát trong game --------------------------------------------------------

/**
 * Hẹn trước bao nhiêu giây.
 *
 * Web Audio hẹn giờ bằng đồng hồ riêng, chính xác tới từng mẫu; còn `setInterval`
 * của trình duyệt thì trượt hàng chục mili giây và chậm hẳn lại khi tab bị ẩn.
 * Nên bộ đếm chỉ làm đúng một việc: thỉnh thoảng tỉnh dậy xem đã cần hẹn vòng
 * tiếp theo chưa. Mọi thứ về NHỊP đều do Web Audio giữ.
 */
const LOOKAHEAD_SEC = 1.5

let gainNode: GainNode | null = null
let timer: number | null = null
/** Thời điểm vòng nhạc kế tiếp bắt đầu, theo đồng hồ của AudioContext. */
let nextLoopAt = 0

export function startBattleTheme(): void {
  if (timer !== null) return

  const ctx = ensureAudioContext()
  if (!ctx) return

  gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(VOLUME, ctx.currentTime)
  gainNode.connect(ctx.destination)

  nextLoopAt = ctx.currentTime + 0.1

  const tick = () => {
    const node = gainNode
    if (!node) return
    while (nextLoopAt < ctx.currentTime + LOOKAHEAD_SEC) {
      scheduleLoop(ctx, node, nextLoopAt)
      nextLoopAt += loopSeconds()
    }
  }

  tick()
  timer = window.setInterval(tick, 500)
}

/**
 * Dừng nhạc trận.
 *
 * Vặn nhỏ dần rồi mới ngắt: nốt đã hẹn giờ thì không gọi lại được, nên cắt
 * thẳng nút âm lượng về 0 sẽ để lại một tiếng "tạch" của những nốt đang ngân dở.
 * Nửa giây là đủ êm mà vẫn kịp trước khi màn tổng kết hiện ra.
 */
export function stopBattleTheme(): void {
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }

  const ctx = ensureAudioContext()
  const node = gainNode
  gainNode = null
  if (!ctx || !node) return

  const now = ctx.currentTime
  node.gain.cancelScheduledValues(now)
  node.gain.setValueAtTime(node.gain.value, now)
  node.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
  window.setTimeout(() => node.disconnect(), 800)
}

export function isBattleThemePlaying(): boolean {
  return timer !== null
}
