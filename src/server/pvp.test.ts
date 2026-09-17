/**
 * Luật trọng tài của đấu trường.
 *
 * Cả chế độ chơi này đứng trên đúng một câu - "ai bấm đúng trước thì được đánh"
 * - và câu ấy được thi hành ở đúng một chỗ: `settleRound`. Tệp này khoá nó lại.
 *
 * Phần nối với cơ sở dữ liệu cố ý KHÔNG có ở đây. Nó chỉ làm ba việc: đọc hàng,
 * gọi hàm dưới đây, ghi hàng xuống. Luật thì nằm gọn trong phần thuần.
 */

import { describe, expect, it } from 'vitest'
import { pvpDamage, roundIsSettled, settleRound, speedBonus, type Buzz } from './pvp'

/**
 * Sức đội thú cao nhất thực tế đạt được.
 *
 * Ba con ở nấc tiến hoá cuối, kịch cấp 20, cộng thêm hệ số cấp của nhân vật.
 * Không gõ bừa một số cho tròn: chính con số này là thứ quyết định việc nuôi
 * thú có đè bẹp được tốc độ hay không.
 */
const MAX_TEAM_POWER = 2.4

const A = 'be-an'
const B = 'be-binh'

const buzz = (studentId: string, correct: boolean, at = 0): Buzz => ({ studentId, correct, at })

const round = (buzzes: Buzz[], overrides: Partial<Parameters<typeof settleRound>[0]> = {}) =>
  settleRound({
    challengerId: A,
    opponentId: B,
    challengerHp: 100,
    opponentHp: 100,
    challengerPower: 1,
    opponentPower: 1,
    round: 0,
    totalRounds: 7,
    difficulty: 1,
    buzzes,
    elapsedMs: 5_000,
    ...overrides,
  })

describe('khi nào một vòng ngã ngũ', () => {
  it('có người bấm ĐÚNG là xong ngay, không chờ bạn kia', () => {
    // Chờ cho đủ hai người thì phần thưởng của việc nhanh hơn biến mất: nhanh
    // hay chậm cũng phải ngồi đợi như nhau.
    expect(roundIsSettled([buzz(A, true)])).toBe(true)
  })

  it('một người bấm SAI thì chưa xong - bạn kia vẫn còn cơ hội', () => {
    expect(roundIsSettled([buzz(A, false)])).toBe(false)
  })

  it('cả hai cùng bấm thì xong, dù cùng sai', () => {
    expect(roundIsSettled([buzz(A, false), buzz(B, false)])).toBe(true)
  })

  it('chưa ai bấm thì chưa xong', () => {
    expect(roundIsSettled([])).toBe(false)
  })
})

describe('ai được tấn công', () => {
  it('người bấm ĐÚNG TRƯỚC được đánh', () => {
    const out = round([buzz(A, true, 1), buzz(B, true, 2)])
    expect(out.event.attackerId).toBe(A)
    expect(out.opponentHp).toBeLessThan(100)
    expect(out.challengerHp).toBe(100)
  })

  it('bấm nhanh mà SAI thì mất lượt - bạn kia đúng sau vẫn được đánh', () => {
    // Đây là bài học chính của cả chế độ chơi: nhanh mà ẩu thì không ăn thua.
    const out = round([buzz(A, false, 1), buzz(B, true, 2)])
    expect(out.event.attackerId).toBe(B)
    expect(out.event.firstId).toBe(A)
    expect(out.event.firstCorrect).toBe(false)
    expect(out.challengerHp).toBeLessThan(100)
    expect(out.opponentHp).toBe(100)
  })

  it('cả hai cùng sai thì không ai mất máu', () => {
    const out = round([buzz(A, false, 1), buzz(B, false, 2)])
    expect(out.event.attackerId).toBeNull()
    expect(out.event.damage).toBe(0)
    expect(out.challengerHp).toBe(100)
    expect(out.opponentHp).toBe(100)
  })

  it('ghi lại AI BẤM TRƯỚC, kể cả khi người đó không phải người đánh', () => {
    // Giao diện dựa vào đây để nói "người bấm trước trả lời sai" - không có nó
    // thì trẻ chỉ thấy mình bấm trước mà vẫn không được đánh, và tưởng máy sai.
    const out = round([buzz(B, false, 1), buzz(A, true, 2)])
    expect(out.event.firstId).toBe(B)
    expect(out.event.attackerId).toBe(A)
  })
})

describe('sát thương', () => {
  it('bấm nhanh hơn thì đánh đau hơn', () => {
    expect(speedBonus(1_000)).toBeGreaterThan(speedBonus(4_000))
    expect(speedBonus(4_000)).toBeGreaterThan(speedBonus(10_000))
    expect(speedBonus(10_000)).toBe(1)
  })

  it('câu khó hơn thì đánh đau hơn', () => {
    expect(pvpDamage(3, 1, 5_000)).toBeGreaterThan(pvpDamage(1, 1, 5_000))
  })

  it('đội thú khoẻ hơn thì đánh đau hơn', () => {
    // Nuôi thú phải có ích ở đây, nếu không thì cả phần thu phục và tiến hoá
    // chẳng liên quan gì tới đấu trường.
    expect(pvpDamage(1, 1.6, 5_000)).toBeGreaterThan(pvpDamage(1, 1, 5_000))
  })

  it('nhưng đội thú KHÔNG lấn át được tốc độ', () => {
    /*
      ĐÂY LÀ TEST QUAN TRỌNG NHẤT CỦA CẢ TỆP, và nó đã bắt được một lỗi thật:
      bản đầu để `power` đi thẳng vào công thức, và một đội nuôi tới nấc tiến hoá
      cuối (power ~2,3) đánh gấp hơn hai lần một đội mới - nhiều hơn cả khoảng
      thưởng cho tốc độ. Trận đấu ngã ngũ trước khi câu hỏi đầu tiên hiện ra.

      So hai đầu xa nhất của khoảng thật: đội MẠNH NHẤT bấm chậm, đối lại đội
      YẾU NHẤT bấm nhanh. Bên nhanh phải thắng.
    */
    const strongestSlow = pvpDamage(1, MAX_TEAM_POWER, 20_000)
    const weakestFast = pvpDamage(1, 1, 1_000)
    expect(weakestFast).toBeGreaterThan(strongestSlow)
  })

  it('đội thú vẫn có ích thấy rõ khi hai bên nhanh như nhau', () => {
    // Nén tốc độ lại là đúng, nén tới mức nuôi thú thành vô nghĩa thì sai.
    const strong = pvpDamage(1, MAX_TEAM_POWER, 1_000)
    const weak = pvpDamage(1, 1, 1_000)
    expect(strong).toBeGreaterThan(weak * 1.3)
  })

  it('không bao giờ xuống dưới 1', () => {
    expect(pvpDamage(0, 0.1, 60_000)).toBeGreaterThanOrEqual(1)
  })
})

describe('trận kết thúc lúc nào', () => {
  it('còn vòng và cả hai còn máu thì chưa xong', () => {
    const out = round([buzz(A, true)])
    expect(out.finished).toBe(false)
    expect(out.winnerId).toBeNull()
  })

  it('một bên hết máu là xong ngay, bên kia thắng', () => {
    const out = round([buzz(A, true)], { opponentHp: 3 })
    expect(out.opponentHp).toBe(0)
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBe(A)
  })

  it('máu không bao giờ tụt xuống dưới 0 - thanh máu không được phép âm', () => {
    expect(round([buzz(A, true)], { opponentHp: 1 }).opponentHp).toBe(0)
  })

  it('hết vòng thì bên nhiều máu hơn thắng', () => {
    const out = round([buzz(B, true)], {
      round: 6,
      totalRounds: 7,
      challengerHp: 80,
      opponentHp: 40,
    })
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBe(A)
  })

  it('hết vòng mà bằng máu thì HOÀ, không tung đồng xu chọn bừa', () => {
    const out = round([buzz(A, false), buzz(B, false)], {
      round: 6,
      totalRounds: 7,
      challengerHp: 50,
      opponentHp: 50,
    })
    expect(out.finished).toBe(true)
    expect(out.winnerId).toBeNull()
  })
})
