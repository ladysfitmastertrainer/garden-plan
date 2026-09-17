/**
 * Nhạc nền đúng ba việc, và cả ba đều chỉ lộ ra trên máy thật nếu sai.
 *
 *  1. KHÔNG tải gì cho tới khi thật sự bật. Tệp này dài một tiếng - để trình
 *     duyệt tự đi tải lúc dựng trang là ép mỗi đứa trẻ tải vài chục megabyte
 *     trước khi làm được gì, kể cả đứa đã tắt nhạc.
 *  2. Bị trình duyệt chặn thì ĐỢI cú chạm đầu tiên rồi phát, chứ không im luôn.
 *  3. Chuyển sang tab khác thì dừng, quay về thì chạy tiếp.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isMusicOn, setMusicOn, resetMusicForTest, watchVisibility } from './music'

/** Một thẻ <audio> giả, ghi lại đúng những gì module thật sự làm với nó. */
class FakeAudio {
  src: string
  loop = false
  preload = ''
  volume = 1
  paused = true
  playCalls = 0

  constructor(src: string) {
    this.src = src
    created.push(this)
  }

  play(): Promise<void> {
    this.playCalls += 1
    if (blockPlay) return Promise.reject(new Error('trình duyệt chặn'))
    this.paused = false
    return Promise.resolve()
  }

  pause(): void {
    this.paused = true
  }
}

/**
 * Trình duyệt có đang chặn tiếng tự phát không.
 *
 * Cờ ở NGOÀI lớp, không phải một trường của nó: trường khai trong thân lớp là
 * thuộc tính RIÊNG của từng thể hiện, nên gán vào `prototype` không tới được
 * nó - và test "bị chặn" lặng lẽ chạy qua nhánh không bị chặn.
 */
let blockPlay = false
let created: FakeAudio[]
let windowListeners: Map<string, Array<() => void>>
let docListeners: Map<string, Array<() => void>>
let hidden: boolean

const fire = (map: Map<string, Array<() => void>>, type: string) => {
  for (const fn of [...(map.get(type) ?? [])]) fn()
}

beforeEach(() => {
  created = []
  windowListeners = new Map()
  docListeners = new Map()
  hidden = false
  blockPlay = false

  const add = (map: Map<string, Array<() => void>>) => (type: string, fn: () => void) => {
    map.set(type, [...(map.get(type) ?? []), fn])
  }
  const remove = (map: Map<string, Array<() => void>>) => (type: string, fn: () => void) => {
    map.set(type, (map.get(type) ?? []).filter((x) => x !== fn))
  }

  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('window', {
    Audio: FakeAudio,
    addEventListener: add(windowListeners),
    removeEventListener: remove(windowListeners),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
  })
  vi.stubGlobal('document', {
    addEventListener: add(docListeners),
    removeEventListener: remove(docListeners),
    get hidden() {
      return hidden
    },
  })
  resetMusicForTest()
})

afterEach(() => {
  resetMusicForTest()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('chỉ tải khi thật sự bật', () => {
  it('chưa bật thì chưa dựng thẻ audio nào', () => {
    expect(created).toHaveLength(0)
    expect(isMusicOn()).toBe(false)
  })

  it('bật lên mới dựng, và dựng với preload "none"', () => {
    setMusicOn(true)
    expect(created).toHaveLength(1)
    // Đây là dòng giữ lời hứa "tải dần theo lúc nghe": thiếu nó thì trình duyệt
    // đi lấy cả tệp một tiếng ngay lúc dựng trang.
    expect(created[0]!.preload).toBe('none')
    expect(created[0]!.loop).toBe(true)
    expect(created[0]!.playCalls).toBe(1)
  })

  it('nhạc nhỏ hơn hẳn tiếng game, để không nuốt mất hiệu ứng', () => {
    setMusicOn(true)
    expect(created[0]!.volume).toBeGreaterThan(0)
    expect(created[0]!.volume).toBeLessThan(0.5)
  })

  it('gọi bật hai lần không dựng thêm thẻ nào', () => {
    setMusicOn(true)
    setMusicOn(true)
    expect(created).toHaveLength(1)
    expect(created[0]!.playCalls).toBe(1)
  })
})

describe('bị chặn thì đợi cú chạm đầu tiên', () => {
  it('trình duyệt chặn: im lặng chờ, rồi chạm một cái là phát', async () => {
    /*
      Mọi trình duyệt đều chặn tiếng tự phát cho tới khi người dùng chạm vào
      trang. Bắt lỗi rồi im lặng thì nhạc không bao giờ kêu; hiện một nút "bấm
      để bật nhạc" thì lại thêm một thứ chắn đường một đứa bé sáu tuổi.
    */
    blockPlay = true
    setMusicOn(true)
    await Promise.resolve()
    await Promise.resolve()

    expect(created[0]!.playCalls).toBe(1)
    expect(created[0]!.paused).toBe(true)
    expect(windowListeners.get('pointerdown')).toHaveLength(1)

    // Trẻ bấm một nút bất kỳ - không phải nút nào dành riêng cho nhạc.
    blockPlay = false
    fire(windowListeners, 'pointerdown')
    expect(created[0]!.playCalls).toBe(2)
  })

  it('tắt nhạc trong lúc đang chờ thì cú chạm sau đó KHÔNG bật nhạc lên', async () => {
    blockPlay = true
    setMusicOn(true)
    await Promise.resolve()
    await Promise.resolve()
    blockPlay = false

    setMusicOn(false)
    fire(windowListeners, 'pointerdown')
    expect(created[0]!.playCalls).toBe(1)
  })
})

describe('đổi tab thì dừng', () => {
  it('ẩn đi thì dừng, quay lại thì chạy tiếp', () => {
    setMusicOn(true)
    const stop = watchVisibility()
    expect(created[0]!.paused).toBe(false)

    hidden = true
    fire(docListeners, 'visibilitychange')
    expect(created[0]!.paused).toBe(true)

    hidden = false
    fire(docListeners, 'visibilitychange')
    expect(created[0]!.paused).toBe(false)

    stop()
    expect(docListeners.get('visibilitychange')).toHaveLength(0)
  })

  it('nhạc đang tắt thì đổi tab không bật nó lên', () => {
    setMusicOn(true)
    setMusicOn(false)
    watchVisibility()
    const before = created[0]!.playCalls

    hidden = false
    fire(docListeners, 'visibilitychange')
    expect(created[0]!.playCalls).toBe(before)
  })
})
