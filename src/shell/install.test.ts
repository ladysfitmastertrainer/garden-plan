import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { dismissInstall, dismissedInstall, isInstalled, isIos } from './install'

/** Giả lập một chiếc máy: user agent, số điểm chạm, và câu trả lời của media query. */
function device(opts: {
  ua?: string
  touch?: number
  displayMode?: string | null
  standalone?: boolean
}) {
  vi.stubGlobal('navigator', {
    userAgent: opts.ua ?? '',
    maxTouchPoints: opts.touch ?? 0,
    ...(opts.standalone === undefined ? {} : { standalone: opts.standalone }),
  })
  vi.stubGlobal('window', {
    matchMedia: (q: string) => ({ matches: opts.displayMode ? q.includes(opts.displayMode) : false }),
  })
}

let store: Record<string, string>

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  // Một test có du hành thời gian; trả đồng hồ về chỗ cũ để test sau không lệch.
  vi.useRealTimers()
})

describe('đang chạy dưới dạng app đã cài chưa', () => {
  it('trong tab trình duyệt thì chưa', () => {
    device({ ua: 'Mozilla/5.0 (Linux; Android 13)' })
    expect(isInstalled()).toBe(false)
  })

  it('Android đã cài: display-mode là standalone', () => {
    device({ ua: 'Mozilla/5.0 (Linux; Android 13)', displayMode: 'standalone' })
    expect(isInstalled()).toBe(true)
  })

  it('chế độ toàn màn hình cũng tính là đã cài', () => {
    device({ ua: 'Mozilla/5.0 (Linux; Android 13)', displayMode: 'fullscreen' })
    expect(isInstalled()).toBe(true)
  })

  it('iOS đã cài: Safari đặt cờ riêng trên navigator', () => {
    // iOS KHÔNG đổi display-mode, nên chỉ nhìn media query là bỏ sót hết iPhone.
    device({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', standalone: true })
    expect(isInstalled()).toBe(true)
  })

  it('trình duyệt chặn media query thì coi như chưa cài, không làm hỏng trang', () => {
    vi.stubGlobal('navigator', { userAgent: '', maxTouchPoints: 0 })
    vi.stubGlobal('window', {
      matchMedia: () => {
        throw new Error('chặn rồi')
      },
    })
    expect(() => isInstalled()).not.toThrow()
    expect(isInstalled()).toBe(false)
  })
})

describe('có phải iPhone hay iPad không', () => {
  it('iPhone thì đúng', () => {
    device({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })
    expect(isIos()).toBe(true)
  })

  it('iPad hiện đại khai là MacIntel, nhận ra bằng số điểm chạm', () => {
    /*
      Từ iPadOS 13, iPad khai user agent y hệt máy Mac. Chỉ nhìn chuỗi đó thì mọi
      iPad đều bị coi là máy tính để bàn và không bao giờ thấy lời chỉ đường cài
      app - mà iPad lại đúng là máy hay dùng ở lớp.
    */
    device({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', touch: 5 })
    expect(isIos()).toBe(true)
  })

  it('máy Mac thật thì KHÔNG phải iOS', () => {
    device({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', touch: 0 })
    expect(isIos()).toBe(false)
  })

  it('Android thì không', () => {
    device({ ua: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)', touch: 5 })
    expect(isIos()).toBe(false)
  })
})

describe('nhớ lời từ chối', () => {
  it('chưa bảo gì thì chưa từ chối', () => {
    expect(dismissedInstall()).toBe(false)
  })

  it('bảo "không" thì im - nhưng chỉ im hai tuần', () => {
    dismissInstall()
    expect(dismissedInstall()).toBe(true)

    // Mười ba ngày sau: vẫn im. Đây là quãng "đừng hỏi nữa" thật sự có hiệu lực.
    vi.setSystemTime(Date.now() + 13 * 24 * 60 * 60 * 1000)
    expect(dismissedInstall()).toBe(true)

    /*
      Mười lăm ngày sau: hỏi lại.

      Đây là cái được sửa. Bản trước ghi một dấu không bao giờ hết hạn, nên bấm
      ✕ một lần là máy đó mất hẳn đường cài app - mà người bấm chỉ định nói
      "giờ đừng hỏi nữa", không phải "đừng bao giờ hỏi nữa".
    */
    vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000)
    expect(dismissedInstall()).toBe(false)
    vi.useRealTimers()
  })

  it('lời từ chối của bản CŨ không còn hiệu lực', () => {
    /*
      Khoá cũ, giá trị cũ: '1' trong 'hvtt:khong-muon-cai'.

      Ai đã lỡ bấm ✕ ở bản trước thì đang mang đúng dấu này, và nó vĩnh viễn.
      Số hiệu ':v2' trong tên khoá mới làm nó hết hiệu lực - người dùng được
      mời lại mà không phải tự đi xoá dữ liệu trang.
    */
    store['hvtt:khong-muon-cai'] = '1'
    expect(dismissedInstall()).toBe(false)
  })

  it('giá trị rác thì ngả về phía MỜI LẠI', () => {
    // Thà hỏi thừa một lần còn hơn im lặng vì một con số hỏng.
    store['hvtt:khong-muon-cai:v2'] = 'hom-qua'
    expect(dismissedInstall()).toBe(false)
  })

  it('localStorage bị chặn thì không ném lỗi, chỉ là không nhớ được', () => {
    // Chế độ duyệt riêng tư. Lời mời hiện lại ở lần sau - phiền, không hỏng.
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('chặn rồi')
      },
      setItem: () => {
        throw new Error('chặn rồi')
      },
    })
    expect(() => dismissInstall()).not.toThrow()
    expect(dismissedInstall()).toBe(false)
  })
})
