/**
 * Luật một vòng đấu trường - chỗ DUY NHẤT quyết định ai thắng ai.
 *
 * Kiểm được mà không cần dựng máy chủ, vì `settleRound` là hàm thuần. Đó cũng
 * là lý do nó được tách ra khỏi phần ghi cơ sở dữ liệu ngay từ đầu.
 *
 * Tệp này viết lại khi đấu trường đổi từ CUỘC ĐUA BẤM (một vòng một người được
 * đánh) sang TRẬN ĐẤU HAI CON THÚ (ai trả lời đúng thì bên ấy ra đòn). Luật cũ
 * không còn chỗ nào trong game nữa.
 */

import { describe, expect, it } from 'vitest'

import { ULTIMATE_COOLDOWN } from '../engine/pets'

import {
  roundIsSettled,
  settleRound,
  speedBonus,
  type Buzz,
  type PvpSideState,
  type RoundInput,
} from './pvp'

const ME = 'minh-hy'
const FOE = 'thao-tien'
const T0 = 1_700_000_000_000

/** Bấm ở giây thứ `second` của vòng. */
const buzz = (studentId: string, correct: boolean, second: number, spellId?: string): Buzz => ({
  studentId,
  correct,
  at: T0 + second * 1_000,
  spellId: spellId ?? null,
})

const side = (studentId: string, over: Partial<PvpSideState> = {}): PvpSideState => ({
  studentId,
  hp: 100,
  maxHp: 100,
  power: 1,
  // Hai bên cùng hệ Ngôn Từ: không ai khắc ai, nên mọi test dưới đây đo đúng
  // thứ nó muốn đo chứ không bị hệ số khắc chế trộn vào.
  element: 'vietnamese',
  spells: ['gio-chu', 'bao-chu'],
  cooldown: 0,
  status: [],
  ...over,
})

const round = (over: Partial<RoundInput> = {}): RoundInput => ({
  challenger: side(ME),
  opponent: side(FOE),
  round: 0,
  totalRounds: 7,
  difficulty: 1,
  buzzes: [],
  roundStartedAt: T0,
  ...over,
})

const hitOf = (out: ReturnType<typeof settleRound>, id: string) =>
  out.event.hits!.find((h) => h.studentId === id) ?? null

describe('khi nào một vòng ngã ngũ', () => {
  it('phải ĐỦ CẢ HAI người bấm', () => {
    expect(roundIsSettled([buzz(ME, true, 1)])).toBe(false)
    expect(roundIsSettled([buzz(ME, true, 1), buzz(FOE, false, 3)])).toBe(true)
  })

  it('bấm đúng KHÔNG còn chốt vòng ngay như luật cũ', () => {
    // Giờ câu trả lời của người bấm sau vẫn còn ý nghĩa - bạn ấy cũng được đánh.
    expect(roundIsSettled([buzz(ME, true, 1)])).toBe(false)
  })
})

describe('ai được ra đòn', () => {
  it('cả hai cùng đúng thì CẢ HAI cùng đánh', () => {
    const out = settleRound(round({ buzzes: [buzz(ME, true, 1), buzz(FOE, true, 3)] }))
    expect(out.event.hits).toHaveLength(2)
    expect(out.challenger.hp).toBeLessThan(100)
    expect(out.opponent.hp).toBeLessThan(100)
  })

  it('một người sai thì chỉ người đúng đánh', () => {
    const out = settleRound(round({ buzzes: [buzz(ME, true, 1), buzz(FOE, false, 3)] }))
    expect(out.event.hits).toHaveLength(1)
    expect(out.opponent.hp).toBeLessThan(100)
    expect(out.challenger.hp).toBe(100)
  })

  it('cả hai cùng sai thì không ai mất máu', () => {
    const out = settleRound(round({ buzzes: [buzz(ME, false, 1), buzz(FOE, false, 3)] }))
    expect(out.event.hits).toHaveLength(0)
    expect(out.challenger.hp).toBe(100)
    expect(out.opponent.hp).toBe(100)
  })

  it('ghi lại AI BẤM TRƯỚC, kể cả khi người đó trả lời sai', () => {
    const out = settleRound(round({ buzzes: [buzz(FOE, false, 1), buzz(ME, true, 3)] }))
    expect(out.event.firstId).toBe(FOE)
    expect(out.event.firstCorrect).toBe(false)
  })
})

describe('sát thương', () => {
  it('bấm nhanh hơn thì đánh đau hơn - thưởng tốc độ vẫn còn', () => {
    expect(speedBonus(1_000)).toBeGreaterThan(speedBonus(9_000))

    const out = settleRound(round({ buzzes: [buzz(ME, true, 1), buzz(FOE, true, 9)] }))
    expect(hitOf(out, ME)!.damage).toBeGreaterThan(hitOf(out, FOE)!.damage)
  })

  it('câu khó hơn thì đánh đau hơn', () => {
    const easy = settleRound(round({ difficulty: 1, buzzes: [buzz(ME, true, 1), buzz(FOE, false, 2)] }))
    const hard = settleRound(round({ difficulty: 4, buzzes: [buzz(ME, true, 1), buzz(FOE, false, 2)] }))
    expect(hitOf(hard, ME)!.damage).toBeGreaterThan(hitOf(easy, ME)!.damage)
  })

  it('chiêu mạnh hơn thì đánh đau hơn', () => {
    const base = settleRound(
      round({ buzzes: [buzz(ME, true, 1, 'gio-chu'), buzz(FOE, false, 2)] }),
    )
    const better = settleRound(
      round({ buzzes: [buzz(ME, true, 1, 'bao-chu'), buzz(FOE, false, 2)] }),
    )
    expect(hitOf(better, ME)!.damage).toBeGreaterThan(hitOf(base, ME)!.damage)
  })

  it('KHẮC CHẾ tính theo hệ của CHIÊU, không theo hệ con thú', () => {
    /*
      Đây là chỗ chiêu mượn hệ kiếm sống. Con thú Ngôn Từ gặp con thú Số Học
      thì hai chiêu nhà bị khắc; chiêu Ánh Sáng mượn được mới xuyên qua.
    */
    const foe = side(FOE, { element: 'math' })
    const me = side(ME, { spells: ['gio-chu', 'binh-minh'] })

    const home = settleRound(
      round({ challenger: me, opponent: foe, buzzes: [buzz(ME, true, 1, 'gio-chu'), buzz(FOE, false, 2)] }),
    )
    const borrowed = settleRound(
      round({ challenger: me, opponent: foe, buzzes: [buzz(ME, true, 1, 'binh-minh'), buzz(FOE, false, 2)] }),
    )
    expect(hitOf(borrowed, ME)!.damage).toBeGreaterThan(hitOf(home, ME)!.damage * 2)
  })

  it('đội thú khoẻ hơn thì đánh đau hơn, nhưng KHÔNG lấn át được tốc độ', () => {
    const strongSlow = settleRound(
      round({
        challenger: side(ME, { power: 2.3 }),
        buzzes: [buzz(ME, true, 9), buzz(FOE, true, 1)],
      }),
    )
    // Bạn thú xoàng mà nhanh tay vẫn đánh đau hơn bạn nuôi thú giỏi mà chậm.
    expect(hitOf(strongSlow, FOE)!.damage).toBeGreaterThan(hitOf(strongSlow, ME)!.damage)
  })

  it('không đòn nào xuống dưới 1', () => {
    const out = settleRound(
      round({
        challenger: side(ME, { power: 0.01, status: [{ kind: 'bind', turnsLeft: 2, perTurn: 0 }] }),
        difficulty: 0,
        buzzes: [buzz(ME, true, 30), buzz(FOE, false, 31)],
      }),
    )
    expect(hitOf(out, ME)!.damage).toBeGreaterThanOrEqual(1)
  })
})

describe('cả hai đánh trong CÙNG một nhịp', () => {
  it('hai bên cùng hết máu thì cùng gục, và trận HOÀ', () => {
    /*
      Cú đánh của mỗi bên tính trên máu ĐẦU VÒNG. Cho bên nhanh hơn đánh trước
      thì ở những giây cuối trận đấu quay về đúng cái cũ: hơn nhau nửa giây là
      một bên chưa kịp ra đòn đã hết máu.
    */
    const out = settleRound(
      round({
        challenger: side(ME, { hp: 3 }),
        opponent: side(FOE, { hp: 3 }),
        buzzes: [buzz(ME, true, 1), buzz(FOE, true, 6)],
      }),
    )
    expect(out.challenger.hp).toBe(0)
    expect(out.opponent.hp).toBe(0)
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBeNull()
  })

  it('máu không bao giờ xuống dưới 0 - thanh máu không được phép âm', () => {
    const out = settleRound(
      round({ opponent: side(FOE, { hp: 2 }), buzzes: [buzz(ME, true, 1), buzz(FOE, false, 2)] }),
    )
    expect(out.opponent.hp).toBe(0)
  })
})

describe('chiêu cuối và hồi chiêu', () => {
  const withUltimate = (over: Partial<PvpSideState> = {}) =>
    side(ME, { spells: ['gio-chu', 'thien-thu'], ...over })

  it('dùng chiêu cuối thì hồi chiêu được đặt ngay', () => {
    const out = settleRound(
      round({
        challenger: withUltimate(),
        buzzes: [buzz(ME, true, 1, 'thien-thu'), buzz(FOE, false, 2)],
      }),
    )
    expect(hitOf(out, ME)!.spellId).toBe('thien-thu')
    // Đặt ULTIMATE_COOLDOWN rồi trừ một ở cuối vòng này.
    expect(out.challenger.cooldown).toBe(ULTIMATE_COOLDOWN - 1)
  })

  it('còn hồi chiêu thì KHÔNG tung được, rơi về chiêu còn lại', () => {
    const out = settleRound(
      round({
        challenger: withUltimate({ cooldown: 2 }),
        buzzes: [buzz(ME, true, 1, 'thien-thu'), buzz(FOE, false, 2)],
      }),
    )
    expect(hitOf(out, ME)!.spellId).toBe('gio-chu')
    expect(hitOf(out, ME)!.effect).toBeNull()
  })

  it('hồi chiêu nhích theo MỌI vòng, kể cả vòng trả lời sai', () => {
    const out = settleRound(
      round({
        challenger: withUltimate({ cooldown: 3 }),
        buzzes: [buzz(ME, false, 1), buzz(FOE, false, 2)],
      }),
    )
    // Thua liên tiếp vẫn nạp lại được, để bên đang bị dẫn còn đường gỡ.
    expect(out.challenger.cooldown).toBe(2)
  })

  it('chiêu KHÔNG khai lúc vào trận thì không dùng được', () => {
    // Một trình duyệt bị sửa khai bừa id chiêu cuối của hệ khác.
    const out = settleRound(
      round({ buzzes: [buzz(ME, true, 1, 'vang-duong'), buzz(FOE, false, 2)] }),
    )
    expect(hitOf(out, ME)!.spellId).toBe('gio-chu')
  })

  it('không khai chiêu nào thì vòng ấy không có đòn nào ra', () => {
    const out = settleRound(
      round({ challenger: side(ME, { spells: [] }), buzzes: [buzz(ME, true, 1), buzz(FOE, false, 2)] }),
    )
    expect(hitOf(out, ME)).toBeNull()
    expect(out.opponent.hp).toBe(100)
  })
})

describe('hiệu ứng của chiêu cuối', () => {
  it('TRÓI bám vào đối thủ và cắt đòn của bạn ấy còn một nửa', () => {
    const bound = settleRound(
      round({
        challenger: side(ME, { spells: ['gio-chu', 'thien-thu'] }),
        buzzes: [buzz(ME, true, 1, 'thien-thu'), buzz(FOE, false, 2)],
      }),
    )
    expect(bound.opponent.status.map((e) => e.kind)).toContain('bind')

    const free = settleRound(round({ buzzes: [buzz(FOE, true, 1), buzz(ME, false, 2)] }))
    const tied = settleRound(
      round({
        opponent: side(FOE, { status: [{ kind: 'bind', turnsLeft: 2, perTurn: 0 }] }),
        buzzes: [buzz(FOE, true, 1), buzz(ME, false, 2)],
      }),
    )
    expect(hitOf(tied, FOE)!.damage).toBeLessThan(hitOf(free, FOE)!.damage)
  })

  it('ĐÓNG BĂNG làm đối thủ mất hẳn lượt đánh, dù trả lời đúng', () => {
    const out = settleRound(
      round({
        opponent: side(FOE, { status: [{ kind: 'freeze', turnsLeft: 1, perTurn: 0 }] }),
        buzzes: [buzz(FOE, true, 1), buzz(ME, false, 2)],
      }),
    )
    // Vẫn ghi một dòng, nhưng 0 sát thương - im lặng thì trẻ tưởng mình bấm sai.
    expect(hitOf(out, FOE)!.damage).toBe(0)
    expect(hitOf(out, FOE)!.spellId).toBeNull()
    expect(out.challenger.hp).toBe(100)
  })

  it('CHÁY trừ máu ở đầu vòng sau, không cần ai trả lời đúng', () => {
    const out = settleRound(
      round({
        opponent: side(FOE, { status: [{ kind: 'burn', turnsLeft: 3, perTurn: 7 }] }),
        buzzes: [buzz(ME, false, 1), buzz(FOE, false, 2)],
      }),
    )
    expect(out.opponent.hp).toBe(93)
    expect(out.event.ticks?.[FOE]).toBe(7)
    expect(out.opponent.status[0]!.turnsLeft).toBe(2)
  })

  it('HÚT trừ máu đối thủ và HỒI đúng bấy nhiêu cho mình', () => {
    const out = settleRound(
      round({
        challenger: side(ME, { hp: 50 }),
        opponent: side(FOE, { status: [{ kind: 'drain', turnsLeft: 3, perTurn: 9 }] }),
        buzzes: [buzz(ME, false, 1), buzz(FOE, false, 2)],
      }),
    )
    expect(out.opponent.hp).toBe(91)
    expect(out.challenger.hp).toBe(59)
  })

  it('hồi máu không bao giờ vượt quá máu tối đa', () => {
    const out = settleRound(
      round({
        challenger: side(ME, { hp: 98 }),
        opponent: side(FOE, { status: [{ kind: 'drain', turnsLeft: 3, perTurn: 20 }] }),
        buzzes: [buzz(ME, false, 1), buzz(FOE, false, 2)],
      }),
    )
    expect(out.challenger.hp).toBe(100)
  })

  it('hiệu ứng hết hạn thì rời khỏi danh sách', () => {
    const out = settleRound(
      round({
        opponent: side(FOE, { status: [{ kind: 'bind', turnsLeft: 1, perTurn: 0 }] }),
        buzzes: [buzz(ME, false, 1), buzz(FOE, false, 2)],
      }),
    )
    expect(out.opponent.status).toHaveLength(0)
  })

  it('vết cháy ăn nốt máu cuối thì hạ được đối thủ TRƯỚC khi bạn ấy kịp đánh', () => {
    const out = settleRound(
      round({
        opponent: side(FOE, { hp: 4, status: [{ kind: 'burn', turnsLeft: 2, perTurn: 9 }] }),
        buzzes: [buzz(ME, false, 1), buzz(FOE, true, 2)],
      }),
    )
    expect(out.opponent.hp).toBe(0)
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBe(ME)
  })
})

describe('trận kết thúc lúc nào', () => {
  it('còn vòng và cả hai còn máu thì chưa xong', () => {
    const out = settleRound(round({ buzzes: [buzz(ME, true, 1), buzz(FOE, true, 2)] }))
    expect(out.finished).toBe(false)
    expect(out.winnerId).toBeNull()
  })

  it('một bên hết máu là xong ngay, bên kia thắng', () => {
    const out = settleRound(
      round({ opponent: side(FOE, { hp: 1 }), buzzes: [buzz(ME, true, 1), buzz(FOE, false, 2)] }),
    )
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBe(ME)
  })

  it('hết vòng thì bên nhiều máu hơn thắng', () => {
    const out = settleRound(
      round({
        round: 6,
        opponent: side(FOE, { hp: 40 }),
        buzzes: [buzz(ME, false, 1), buzz(FOE, false, 2)],
      }),
    )
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBe(ME)
  })

  it('hết vòng mà bằng máu thì HOÀ, không tung đồng xu chọn bừa', () => {
    const out = settleRound(
      round({ round: 6, buzzes: [buzz(ME, false, 1), buzz(FOE, false, 2)] }),
    )
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBeNull()
  })
})
