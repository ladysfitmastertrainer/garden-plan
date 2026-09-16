/**
 * Ba thể loại còn lại trong bảng tính: sắp xếp, nối cặp, tình huống.
 *
 * Cả ba đều phải diễn tả nhiều mục trong một ô, và chỗ nguy hiểm giống nhau:
 * hai cột song song bị LỆCH nhau một dòng. Lệch ở câu nối cặp thì trẻ không bao
 * giờ nối đúng; lệch ở tình huống thì lời khen gắn sang lựa chọn chưa nên làm và
 * câu hỏi dạy trẻ đúng điều ngược lại. Nên phần lớn test ở đây là về lệch cột.
 */

import { describe, expect, it } from 'vitest'
import { parseSheet, templateRows } from './sheet'

const SKILLS = [
  { id: 'math.g1.cong-tru-10', name: 'Cộng trừ trong phạm vi 10' },
  { id: 'vietnamese.g1.ghep-tieng', name: 'Ghép tiếng' },
  { id: 'ethics.g1.tu-cham-soc', name: 'Tự chăm sóc bản thân' },
]

const opts = (extra = {}) => ({ skills: SKILLS, ...extra })
const one = (row: Record<string, unknown>) => parseSheet([row], opts())

describe('sắp xếp', () => {
  const HANG = {
    ky_nang: 'vietnamese.g1.ghep-tieng',
    the_loai: 'sắp xếp',
    de_bai: 'Sắp các từ thành câu đúng',
    dap_an_dung: 'Em | đi | học',
  }

  it('lấy đúng thứ tự người soạn ghi', () => {
    const { questions, problems } = one(HANG)
    expect(problems).toEqual([])
    const entry = questions[0]!.entry
    expect(entry.kind).toBe('order')
    expect(entry.kind === 'order' && entry.items).toEqual(['Em', 'đi', 'học'])
  })

  it('một phần thì không có gì để sắp', () => {
    expect(one({ ...HANG, dap_an_dung: 'Em' }).problems[0]!.reason).toMatch(/ít nhất hai phần/)
  })

  it('KHÔNG tự đoán là sắp xếp - phải ghi rõ thể loại', () => {
    // Nhìn ô đáp án, "Em | đi | học" giống hệt một câu gõ đáp án nhiều cách viết.
    // Đoán bừa là biến câu điền từ thành câu kéo thả.
    const { questions } = one({ ...HANG, the_loai: '' })
    expect(questions[0]!.entry.kind).toBe('text')
  })

  it('nhận nhiều cách gọi tên thể loại', () => {
    for (const ten of ['sắp xếp', 'sap xep', 'thứ tự', 'ORDER']) {
      expect(one({ ...HANG, the_loai: ten }).questions[0]!.entry.kind).toBe('order')
    }
  })
})

describe('nối cặp', () => {
  const HANG = {
    ky_nang: 'vietnamese.g1.ghep-tieng',
    de_bai: 'Nối con vật với tiếng kêu',
    ve_trai: 'mèo | chó | gà',
    ve_phai: 'meo meo | gâu gâu | ò ó o',
  }

  it('ghép hai cột theo đúng thứ tự dòng', () => {
    const { questions, problems } = one(HANG)
    expect(problems).toEqual([])
    const entry = questions[0]!.entry
    expect(entry.kind).toBe('pairs')
    expect(entry.kind === 'pairs' && entry.pairs).toEqual([
      ['mèo', 'meo meo'],
      ['chó', 'gâu gâu'],
      ['gà', 'ò ó o'],
    ])
  })

  it('tự đoán ra nối cặp khi thấy cột vế trái', () => {
    expect(one({ ...HANG, the_loai: '' }).questions[0]!.entry.kind).toBe('pairs')
  })

  it('HAI CỘT LỆCH NHAU thì từ chối, và nói rõ lệch bao nhiêu', () => {
    // Nhận vào thì mọi cặp sau chỗ lệch đều sai, mà trẻ thì không bao giờ nối đúng.
    const { problems } = one({ ...HANG, ve_phai: 'meo meo | gâu gâu' })
    expect(problems[0]!.reason).toMatch(/3 mục nhưng vế phải có 2/)
  })

  it('thiếu hẳn một cột thì nói rõ thiếu cột nào', () => {
    expect(one({ ...HANG, ve_phai: '' }).problems[0]!.reason).toMatch(/ve_trai.*ve_phai/)
  })

  it('một cặp thì không phải câu nối', () => {
    expect(one({ ...HANG, ve_trai: 'mèo', ve_phai: 'meo meo' }).problems[0]!.reason).toMatch(
      /ít nhất hai cặp/,
    )
  })

  it('vế trái trùng nhau thì bỏ bớt, vì một ô không thể có hai lời giải', () => {
    const { questions } = one({ ...HANG, ve_trai: 'mèo | mèo | gà', ve_phai: 'meo meo | gâu gâu | ò ó o' })
    const entry = questions[0]!.entry
    expect(entry.kind === 'pairs' && entry.pairs).toHaveLength(2)
  })
})

describe('tình huống Đạo đức', () => {
  const HANG = {
    ky_nang: 'ethics.g1.tu-cham-soc',
    the_loai: 'tình huống',
    de_bai: 'Con vừa đi chơi về và sắp ăn cơm. Con làm gì trước?',
    lua_chon: 'Rửa tay bằng xà phòng | Lau tay vào khăn | Ăn luôn cho nhanh',
    muc_do_chon: 'nên làm | tạm được | chưa nên',
    phan_hoi: 'Tay sạch bụng khoẻ. | Đỡ hơn không lau. | Dễ đau bụng lắm.',
    pham_chat: 'Trách nhiệm | | ',
  }

  it('dựng đủ nhãn, mức đánh giá và lời phản hồi, khớp theo thứ tự', () => {
    const { questions, problems } = one(HANG)
    expect(problems).toEqual([])
    const entry = questions[0]!.entry
    expect(entry.kind).toBe('scenario')
    if (entry.kind !== 'scenario') return

    expect(entry.options.map((o) => o.label)).toEqual([
      'Rửa tay bằng xà phòng',
      'Lau tay vào khăn',
      'Ăn luôn cho nhanh',
    ])
    expect(entry.options.map((o) => o.quality)).toEqual(['good', 'ok', 'poor'])
    expect(entry.options[0]!.feedback).toBe('Tay sạch bụng khoẻ.')
  })

  it('phẩm chất nhận tên tiếng Việt, và chỉ cộng cho lựa chọn NÊN LÀM', () => {
    const { questions } = one(HANG)
    const entry = questions[0]!.entry
    if (entry.kind !== 'scenario') throw new Error('sai thể loại')
    expect(entry.options[0]!.virtues).toEqual(['responsibility'])
    // Gắn vào lựa chọn chưa nên thì trẻ chọn sai vẫn được thưởng.
    expect(entry.options[2]!.virtues).toEqual([])
  })

  it('phẩm chất gắn nhầm vào lựa chọn chưa nên thì bị bỏ', () => {
    const { questions } = one({ ...HANG, pham_chat: ' | | Nhân ái' })
    const entry = questions[0]!.entry
    if (entry.kind !== 'scenario') throw new Error('sai thể loại')
    expect(entry.options.every((o) => o.virtues.length === 0)).toBe(true)
  })

  it('SỐ LỰA CHỌN KHÁC SỐ MỨC thì từ chối cả dòng', () => {
    // Đây là lỗi nguy hiểm nhất của cả file: lệch một mục là lời khen chạy sang
    // lựa chọn chưa nên làm, và câu hỏi dạy trẻ điều ngược lại.
    const { problems } = one({ ...HANG, muc_do_chon: 'nên làm | tạm được' })
    expect(problems[0]!.reason).toMatch(/3 lựa chọn nhưng 2 mức đánh giá/)
  })

  it('số lời phản hồi lệch cũng từ chối', () => {
    const { problems } = one({ ...HANG, phan_hoi: 'Chỉ có một câu.' })
    expect(problems[0]!.reason).toMatch(/3 lựa chọn nhưng 1 lời phản hồi/)
  })

  it('mức đánh giá lạ thì nói rõ nên ghi thế nào', () => {
    const { problems } = one({ ...HANG, muc_do_chon: 'xuất sắc | tạm được | chưa nên' })
    expect(problems[0]!.reason).toMatch(/không hiểu mức "xuất sắc"/)
    expect(problems[0]!.reason).toMatch(/nên làm \/ tạm được \/ chưa nên/)
  })

  it('không ghi mức thì lựa chọn đầu là nên làm, còn lại chưa nên', () => {
    const { questions } = one({ ...HANG, muc_do_chon: '', phan_hoi: '', pham_chat: '' })
    const entry = questions[0]!.entry
    if (entry.kind !== 'scenario') throw new Error('sai thể loại')
    expect(entry.options.map((o) => o.quality)).toEqual(['good', 'poor', 'poor'])
  })

  it('một lựa chọn thì không phải tình huống', () => {
    const { problems } = one({ ...HANG, lua_chon: 'Rửa tay', muc_do_chon: 'nên làm', phan_hoi: 'Tốt.' })
    expect(problems[0]!.reason).toMatch(/ít nhất hai lựa chọn/)
  })

  it('tự đoán ra tình huống khi thấy cột lựa chọn', () => {
    expect(one({ ...HANG, the_loai: '' }).questions[0]!.entry.kind).toBe('scenario')
  })
})

describe('file mẫu phủ hết năm thể loại', () => {
  it('mọi dòng mẫu đều đọc lại được, không dòng nào lỗi', () => {
    const { questions, problems } = parseSheet(templateRows(null), opts())
    expect(problems).toEqual([])
    expect(questions.map((q) => q.entry.kind)).toEqual([
      'choice',
      'text',
      'order',
      'pairs',
      'scenario',
    ])
  })

  it('mã kỹ năng trong file mẫu là mã có thật', () => {
    // Mẫu trỏ vào kỹ năng không tồn tại thì người đầu tiên nạp thử sẽ thấy lỗi
    // ngay ở chính file ta phát cho họ.
    const { problems } = parseSheet(templateRows(null), opts())
    expect(problems.filter((p) => /không có kỹ năng/.test(p.reason))).toEqual([])
  })
})
