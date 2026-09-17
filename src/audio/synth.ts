/**
 * Tổng hợp âm thanh bằng Web Audio API.
 *
 * Không dùng file mp3 nào: mọi nốt nhạc, giai điệu và tiết tấu đều được sinh
 * lúc chạy từ `AudioSpec`. Nhờ vậy bài tập Âm nhạc sinh ra vô hạn, chạy được
 * offline và không vướng bản quyền thu âm.
 */

import type { AudioSpec, NoteName, RhythmSpec, Timbre, ToneSpec } from '../content/types'

const DEFAULT_TEMPO = 90
const DEFAULT_GAIN = 0.6
/** Tần số nốt La quãng 4 - mốc chuẩn quốc tế. */
const A4_FREQUENCY = 440
const SEMITONES: Record<string, number> = {
  C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2,
}

let context: AudioContext | null = null

/**
 * Trình duyệt chặn phát âm thanh trước khi người dùng chạm vào trang, nên
 * AudioContext chỉ được tạo lúc có thao tác đầu tiên.
 */
export function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null

  context ??= new Ctor()
  if (context.state === 'suspended') void context.resume()
  return context
}

/** 'C4' -> 261.63 Hz. Hỗ trợ dấu thăng (#) và dấu giáng (b). */
export function noteToFrequency(note: NoteName): number {
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(note.trim())
  if (!match) throw new Error(`Tên nốt không hợp lệ: ${note}`)

  const [, letter, accidental, octaveText] = match
  const octave = Number(octaveText)
  let semitonesFromA4 = SEMITONES[letter!]! + (octave - 4) * 12
  if (accidental === '#') semitonesFromA4 += 1
  if (accidental === 'b') semitonesFromA4 -= 1

  return A4_FREQUENCY * 2 ** (semitonesFromA4 / 12)
}

const OSCILLATOR_TYPE: Record<Timbre, OscillatorType> = {
  sine: 'sine',
  triangle: 'triangle',
  square: 'square',
  sawtooth: 'sawtooth',
  // 'bell' và 'pluck' khác nhau ở đường bao âm lượng chứ không ở dạng sóng.
  bell: 'sine',
  pluck: 'triangle',
}

interface Envelope {
  attack: number
  decay: number
  sustain: number
  release: number
}

const ENVELOPE: Record<Timbre, Envelope> = {
  sine: { attack: 0.02, decay: 0.05, sustain: 0.8, release: 0.12 },
  triangle: { attack: 0.02, decay: 0.05, sustain: 0.8, release: 0.12 },
  square: { attack: 0.01, decay: 0.04, sustain: 0.7, release: 0.1 },
  sawtooth: { attack: 0.01, decay: 0.04, sustain: 0.7, release: 0.1 },
  bell: { attack: 0.005, decay: 0.4, sustain: 0.15, release: 0.6 },
  pluck: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.2 },
}

/**
 * Phát một nốt đơn tại thời điểm `startAt` (giây, theo đồng hồ của AudioContext).
 *
 * `destination` cho phép nối nốt vào một nút khác thay vì thẳng ra loa. Nhạc
 * trận đấu cần điều đó: cả bản nhạc đi qua MỘT nút âm lượng chung, nên tắt nhạc
 * là vặn nhỏ đúng một chỗ, thay vì phải đuổi theo từng nốt đã hẹn giờ trước.
 */
export function scheduleNote(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  durationSec: number,
  gainValue: number,
  timbre: Timbre,
  destination: AudioNode = ctx.destination,
): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const env = ENVELOPE[timbre]

  oscillator.type = OSCILLATOR_TYPE[timbre]
  oscillator.frequency.setValueAtTime(frequency, startAt)

  // Đường bao ADSR - nốt vào và tắt mượt, tránh tiếng "tách" khó chịu.
  const peak = Math.max(0.001, gainValue)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peak, startAt + env.attack)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, peak * env.sustain),
    startAt + env.attack + env.decay,
  )
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec + env.release)

  oscillator.connect(gain)
  gain.connect(destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + durationSec + env.release + 0.05)
}

/** Tổng thời lượng của một đoạn âm thanh, tính bằng mili giây. */
export function audioDurationMs(spec: AudioSpec): number {
  if (spec.kind === 'rhythm') {
    const beatMs = 60_000 / spec.tempo
    return spec.pattern.reduce((sum, beats) => sum + beats * beatMs, 0)
  }
  const beatMs = 60_000 / (spec.tempo ?? DEFAULT_TEMPO)
  if (spec.chord) return Math.max(...(spec.beats ?? [2])) * beatMs
  return spec.notes.reduce((sum, _note, i) => sum + (spec.beats?.[i] ?? 1) * beatMs, 0)
}

function playTone(ctx: AudioContext, spec: ToneSpec): void {
  const beatSec = 60 / (spec.tempo ?? DEFAULT_TEMPO)
  const timbre = spec.timbre ?? 'sine'
  let cursor = ctx.currentTime + 0.05

  spec.notes.forEach((note, index) => {
    const beats = spec.beats?.[index] ?? 1
    const gainValue = spec.gains?.[index] ?? DEFAULT_GAIN
    // Ngân ngắn hơn ô nhịp một chút để hai nốt liền nhau vẫn tách bạch.
    const durationSec = beats * beatSec * 0.85
    scheduleNote(ctx, noteToFrequency(note), cursor, durationSec, gainValue, timbre)
    if (!spec.chord) cursor += beats * beatSec
  })
}

/** Tiếng gõ nhịp: xung ngắn, cao độ cố định, nghe như tiếng thanh phách. */
function playRhythm(ctx: AudioContext, spec: RhythmSpec): void {
  const beatSec = 60 / spec.tempo
  let cursor = ctx.currentTime + 0.05

  for (const beats of spec.pattern) {
    scheduleNote(ctx, 880, cursor, 0.08, 0.5, spec.timbre ?? 'pluck')
    cursor += beats * beatSec
  }
}

/** Phát một đoạn âm thanh. Trả về thời lượng (ms) để UI biết khi nào phát xong. */
export function play(spec: AudioSpec): number {
  const ctx = ensureAudioContext()
  if (!ctx) return 0

  if (spec.kind === 'rhythm') playRhythm(ctx, spec)
  else playTone(ctx, spec)

  return audioDurationMs(spec)
}

// --- Hiệu ứng âm thanh trong trận đấu ---------------------------------------

export type SoundEffect = 'hit' | 'correct' | 'wrong' | 'victory' | 'levelup' | 'coin' | 'tap'

const EFFECTS: Record<SoundEffect, ToneSpec> = {
  tap: { kind: 'tone', notes: ['A5'], beats: [0.15], tempo: 240, timbre: 'pluck', gains: [0.4] },
  hit: { kind: 'tone', notes: ['C5', 'G5'], beats: [0.2, 0.3], tempo: 240, timbre: 'triangle' },
  correct: { kind: 'tone', notes: ['C5', 'E5', 'G5'], beats: [0.3, 0.3, 0.5], tempo: 300, timbre: 'bell' },
  // Quãng nghịch đi xuống - báo sai nhưng KHÔNG chói tai, tránh làm trẻ sợ.
  wrong: { kind: 'tone', notes: ['E4', 'C4'], beats: [0.3, 0.5], tempo: 200, timbre: 'triangle', gains: [0.35, 0.35] },
  victory: {
    kind: 'tone',
    notes: ['C5', 'E5', 'G5', 'C6'],
    beats: [0.3, 0.3, 0.3, 1],
    tempo: 280,
    timbre: 'bell',
  },
  levelup: { kind: 'tone', notes: ['G4', 'C5', 'E5', 'G5'], beats: [0.25, 0.25, 0.25, 0.8], tempo: 300, timbre: 'bell' },
  coin: { kind: 'tone', notes: ['E6', 'B6'], beats: [0.1, 0.2], tempo: 400, timbre: 'bell', gains: [0.3, 0.3] },
}

let muted = false

export function setMuted(value: boolean): void {
  muted = value
}

export function isMuted(): boolean {
  return muted
}

export function playEffect(effect: SoundEffect): void {
  if (muted) return
  play(EFFECTS[effect])
}

export function playAudio(spec: AudioSpec): number {
  if (muted) return audioDurationMs(spec)
  return play(spec)
}
