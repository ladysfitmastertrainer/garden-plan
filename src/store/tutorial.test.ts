import { beforeEach, describe, expect, it } from 'vitest'

import { useTutorial } from './tutorial'

beforeEach(() => useTutorial.getState().finish())

describe('lời mời và bàn hướng dẫn là hai thứ khác nhau', () => {
  /*
    Lúc đang HỎI thì bàn hướng dẫn chưa chạy, và trẻ vẫn đứng trên bản đồ của
    mình. Gộp hai cờ vào một là câu hỏi "con có muốn xem không" tự trả lời hộ
    trẻ rằng có.
  */
  it('mở lời mời không bật bàn hướng dẫn', () => {
    useTutorial.getState().openInvite()
    expect(useTutorial.getState().inviteOpen).toBe(true)
    expect(useTutorial.getState().active).toBe(false)
  })

  it('trả lời "không" thì đóng lời mời và không có gì xảy ra nữa', () => {
    useTutorial.getState().openInvite()
    useTutorial.getState().declineInvite()
    expect(useTutorial.getState().inviteOpen).toBe(false)
    expect(useTutorial.getState().active).toBe(false)
  })

  it('trả lời "có" thì vào bàn hướng dẫn và lời mời tự đóng', () => {
    useTutorial.getState().openInvite()
    useTutorial.getState().start()
    expect(useTutorial.getState().active).toBe(true)
    expect(useTutorial.getState().inviteOpen).toBe(false)
    expect(useTutorial.getState().step).toBe('welcome')
  })
})

describe('đi qua các chặng', () => {
  it('luôn bắt đầu lại từ đầu, kể cả lần mở thứ hai', () => {
    useTutorial.getState().start()
    useTutorial.getState().goTo('handbook')
    useTutorial.getState().finish()

    useTutorial.getState().start()
    expect(useTutorial.getState().step).toBe('welcome')
  })

  it('đóng giữa chừng thì tắt hẳn, không để lại chặng dở', () => {
    useTutorial.getState().start()
    useTutorial.getState().goTo('battle')
    useTutorial.getState().finish()

    expect(useTutorial.getState().active).toBe(false)
    expect(useTutorial.getState().step).toBe('welcome')
  })
})
