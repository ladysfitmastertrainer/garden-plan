/**
 * Đàn quái đã hạ: nhớ trong CHUYẾN ĐI, quên khi rời vùng đất.
 *
 * Ba điều dễ làm sai, và cả ba đều chỉ lộ ra sau vài phút chơi chứ không nổ ra
 * thành lỗi:
 *
 *   - Đụng vào rồi THUA mà con quái vẫn biến mất: trẻ rút lui khỏi một trận chưa
 *     thắng, quay ra thấy đường đã thoáng - tự nhiên được thưởng cho việc thua.
 *   - Nhớ vĩnh viễn: một vùng đã đi hết sẽ trống trơn, và trẻ quay lại ôn bài
 *     trong một nơi không còn gì sống.
 *   - Quên ngay giữa chuyến: hạ xong quay lại thấy nó đứng dậy, và cả cơ chế
 *     hoá ra không có thật.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { useUi } from './ui'

beforeEach(() => {
  useUi.setState({ beatenMonsters: [], pendingMonster: null, region: null })
})

describe('quái bị hạ thì biến khỏi bản đồ', () => {
  it('đụng vào rồi thắng: con đó biến mất', () => {
    const ui = useUi.getState()
    ui.bumpMonster('node-3')
    ui.beatPendingMonster()

    expect(useUi.getState().beatenMonsters).toEqual(['node-3'])
    // Đã chốt xong thì thôi treo, để trận sau không ăn nhầm kết quả trận này.
    expect(useUi.getState().pendingMonster).toBeNull()
  })

  it('đụng vào rồi THUA: con đó vẫn đứng đó', () => {
    const ui = useUi.getState()
    ui.bumpMonster('node-3')
    // Thua thì chỗ gọi xoá cờ treo mà không ghi vào danh sách đã hạ.
    ui.bumpMonster(null)

    expect(useUi.getState().beatenMonsters).toEqual([])
  })

  it('hạ hai con thì cả hai cùng biến mất', () => {
    const ui = useUi.getState()
    ui.bumpMonster('node-1')
    ui.beatPendingMonster()
    useUi.getState().bumpMonster('mini-0')
    useUi.getState().beatPendingMonster()

    expect(useUi.getState().beatenMonsters).toEqual(['node-1', 'mini-0'])
  })

  it('hạ đi hạ lại cùng một con cũng chỉ ghi một lần', () => {
    const ui = useUi.getState()
    ui.bumpMonster('node-1')
    ui.beatPendingMonster()
    useUi.getState().bumpMonster('node-1')
    useUi.getState().beatPendingMonster()

    expect(useUi.getState().beatenMonsters).toEqual(['node-1'])
  })

  it('không đụng con nào mà thắng thì không xoá nhầm con nào', () => {
    // Trận ở Tháp Trí Tuệ và trận gặp quái hoang giữa đường đều không đụng vào
    // con nào đứng trên bản đồ.
    useUi.getState().beatPendingMonster()
    expect(useUi.getState().beatenMonsters).toEqual([])
  })
})

describe('rời vùng đất thì cả đàn đứng dậy', () => {
  it('bước vào một vùng: danh sách đã hạ xoá sạch', () => {
    const ui = useUi.getState()
    ui.bumpMonster('node-2')
    ui.beatPendingMonster()
    expect(useUi.getState().beatenMonsters).toHaveLength(1)

    useUi.getState().enterRegion({ subject: 'math', grade: 2 })
    expect(useUi.getState().beatenMonsters).toEqual([])
    expect(useUi.getState().pendingMonster).toBeNull()
  })

  it('bước ra bản đồ thế giới: cũng xoá sạch', () => {
    const ui = useUi.getState()
    ui.enterRegion({ subject: 'math', grade: 2 })
    useUi.getState().bumpMonster('node-2')
    useUi.getState().beatPendingMonster()

    useUi.getState().enterRegion(null)
    expect(useUi.getState().beatenMonsters).toEqual([])
  })
})
