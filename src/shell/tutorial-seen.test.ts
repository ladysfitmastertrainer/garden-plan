import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { invitedToTutorial, markTutorialInvited } from './tutorial-seen'

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

afterEach(() => vi.unstubAllGlobals())

describe('nhớ đã mời hồ sơ nào xem hướng dẫn', () => {
  it('hồ sơ mới thì chưa từng được mời', () => {
    expect(invitedToTutorial('be-an')).toBe(false)
  })

  it('mời rồi thì không hỏi lại', () => {
    markTutorialInvited('be-an')
    expect(invitedToTutorial('be-an')).toBe(true)
  })

  /*
    Máy tính bảng dùng chung cả lớp là chuyện thường ở đây, và lời từ chối của
    em vào trước KHÔNG được trả lời thay em vào sau.
  */
  it('mỗi hồ sơ một câu trả lời riêng', () => {
    markTutorialInvited('be-an')
    expect(invitedToTutorial('be-binh')).toBe(false)
  })

  /*
    Kho nhớ hỏng thì IM LẶNG, ngược hẳn với lời mời cài app.

    Lời mời cài app là một dải nhỏ ở mép trên nên lỗi rơi về phía hỏi lại. Lời
    mời xem hướng dẫn là một khung nổi chắn giữa màn hình: một trình duyệt chặn
    `localStorage` thì nhớ được gì đâu, và hỏi lại thành hỏi ở MỌI lần mở app.
    Lối vào chủ động trong ngăn kéo ☰ vẫn còn, nên không ai mất đường xem.
  */
  it('không đọc được kho nhớ thì coi như đã mời rồi, không chắn đường trẻ', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('chế độ riêng tư')
      },
      setItem: () => {},
      removeItem: () => {},
    })
    expect(invitedToTutorial('be-an')).toBe(true)
  })

  it('không ghi được thì cũng không làm app hỏng', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('hết chỗ')
      },
      removeItem: () => {},
    })
    expect(() => markTutorialInvited('be-an')).not.toThrow()
  })
})
