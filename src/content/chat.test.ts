import { describe, expect, it } from 'vitest'

import { CHAT_LINES, chatText, isChatLine } from './chat'

/*
  ---- BẢNG CÂU LÀ MỘT DANH SÁCH ĐÓNG, VÀ ĐÓ LÀ CẢ TÍNH NĂNG ----

  Mọi test ở đây đều kiểm cùng một điều: không có đường nào để một chuỗi chữ do
  người dùng nghĩ ra đi tới được màn hình một đứa trẻ khác. Đó là thứ thay cho
  cả một hệ thống kiểm duyệt - lưu tin nhắn, nút báo cáo, lọc từ ngữ, người thật
  đọc khi có chuyện - nên nó phải được giữ bằng test chứ không bằng trí nhớ.
*/
describe('bảng câu nói', () => {
  it('có đủ câu để nói một chuyện, không ít tới mức vô dụng', () => {
    expect(CHAT_LINES.length).toBeGreaterThanOrEqual(6)
  })

  it('mã câu không trùng nhau, và câu nào cũng có chữ', () => {
    const ids = CHAT_LINES.map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const line of CHAT_LINES) expect(line.text.trim(), line.id).toBeTruthy()
  })

  it('mã câu chỉ gồm chữ thường và gạch ngang - an toàn để đi vào cơ sở dữ liệu', () => {
    for (const line of CHAT_LINES) {
      expect(line.id, line.id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  /*
    Phép thử cho mọi câu muốn thêm vào bảng: nhận được nó SAU KHI VỪA THUA thì
    có còn tử tế không. "Thua rồi nhé" hay "Dễ quá" nghe vui trong đầu người
    viết, nhưng trẻ con bấm lại rất nhiều lần, và bấm vào đúng lúc xấu nhất.
  */
  it('không câu nào mang nghĩa chê bai hay thách thức khó nghe', () => {
    const banned = ['dốt', 'ngu', 'thua', 'dễ quá', 'gà', 'kém', 'chán']
    for (const line of CHAT_LINES) {
      for (const word of banned) {
        expect(line.text.toLowerCase(), `${line.id}: ${line.text}`).not.toContain(word)
      }
    }
  })

  it('hai câu đầu là chào và rủ đấu - hai việc trẻ muốn làm nhất khi gặp bạn', () => {
    expect(CHAT_LINES[0]!.text.toLowerCase()).toContain('chào')
    expect(CHAT_LINES[1]!.text.toLowerCase()).toContain('đấu')
  })
})

describe('kiểm mã câu', () => {
  it('nhận mọi mã có trong bảng', () => {
    for (const line of CHAT_LINES) expect(isChatLine(line.id), line.id).toBe(true)
  })

  /*
    Đây là hàng rào duy nhất giữa một cột trong cơ sở dữ liệu và bất cứ thứ gì
    máy trẻ gửi lên. Nó phải từ chối MỌI thứ khác, không chỉ những thứ trông
    đáng ngờ.
  */
  it('từ chối mọi thứ không có trong bảng', () => {
    for (const value of [
      'khong-co-that',
      'Số điện thoại của mẹ mình là 09xxx',
      '<script>alert(1)</script>',
      '',
      ' chao ',
      'CHAO',
      null,
      undefined,
      42,
      {},
      ['chao'],
    ]) {
      expect(isChatLine(value), JSON.stringify(value)).toBe(false)
    }
  })
})

describe('tra mã ra chữ', () => {
  it('mã có thật thì ra đúng câu trong bảng', () => {
    for (const line of CHAT_LINES) expect(chatText(line.id)).toBe(line.text)
  })

  /*
    Trả `null` chứ KHÔNG trả lại chính cái mã. Một mã lạ lọt tới đây nghĩa là có
    thứ gì đó không nằm trong bảng vừa đi qua được máy chủ, và việc cuối cùng
    nên làm là in nó ra màn hình một đứa trẻ.
  */
  it('mã lạ thì im lặng, không in nguyên chuỗi ra màn hình', () => {
    expect(chatText('khong-co-that')).toBeNull()
    expect(chatText('Cho mình xin địa chỉ nhà bạn')).toBeNull()
    expect(chatText(null)).toBeNull()
    expect(chatText(undefined)).toBeNull()
    expect(chatText('')).toBeNull()
  })
})
