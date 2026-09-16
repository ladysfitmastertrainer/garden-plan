/**
 * Đọc bảng tính thầy cô nạp lên.
 *
 * Mỗi test là một cách người thật gõ bảng thật: thiếu dấu, viết hoa lung tung,
 * để dòng trắng ở cuối, nạp lại file cũ lần thứ hai. Không cái nào được làm hỏng
 * cả file, và không cái nào được im lặng nuốt một dòng.
 */

import { describe, expect, it } from 'vitest'
import { findSkill, normalise, parseSheet, templateRows, TEMPLATE_HEADERS } from './sheet'

const SKILLS = [
  { id: 'math.g1.cong-tru-10', name: 'Cộng trừ trong phạm vi 10' },
  { id: 'math.g1.dem-100', name: 'Đếm và so sánh đến 100' },
  { id: 'vietnamese.g1.doc-hieu-cau', name: 'Đọc hiểu câu ngắn' },
  { id: 'vietnamese.g2.doc-hieu-cau', name: 'Đọc hiểu câu ngắn' },
]

const opts = (extra = {}) => ({ skills: SKILLS, ...extra })

const HANG = {
  ky_nang: 'math.g1.cong-tru-10',
  muc_do: 1,
  the_loai: 'trắc nghiệm',
  de_bai: 'Lớp có 4 bạn nam và 3 bạn nữ. Cả lớp có mấy bạn?',
  dap_an_dung: '7 bạn',
  dap_an_sai: '5 bạn | 6 bạn',
  loi_giai: '4 + 3 = 7.',
  goi_y: 'Đếm cả hai nhóm.',
}

describe('bỏ dấu để so tên', () => {
  it('bỏ dấu, bỏ hoa thường, bỏ dấu cách', () => {
    expect(normalise('Cộng trừ trong phạm vi 10')).toBe('congtrutrongphamvi10')
    expect(normalise('KY_NANG')).toBe('kynang')
  })

  it('chữ đ cũng phải bỏ dấu - nếu không "Đọc hiểu" không bao giờ khớp', () => {
    expect(normalise('Đọc hiểu câu ngắn')).toBe('dochieucaungan')
    expect(normalise('ĐÁP ÁN ĐÚNG')).toBe('dapandung')
  })
})

describe('dò kỹ năng', () => {
  it('nhận mã kỹ năng', () => {
    expect(findSkill('math.g1.dem-100', SKILLS)).toEqual({ id: 'math.g1.dem-100' })
  })

  it('nhận cả TÊN kỹ năng, không cần đúng dấu', () => {
    // Không ai nhớ mã kỹ năng, nhưng ai cũng đọc được tên.
    expect(findSkill('cong tru trong pham vi 10', SKILLS)).toEqual({ id: 'math.g1.cong-tru-10' })
    expect(findSkill('CỘNG TRỪ TRONG PHẠM VI 10', SKILLS)).toEqual({ id: 'math.g1.cong-tru-10' })
  })

  it('tên trùng ở nhiều lớp thì BÁO LỖI chứ không đoán bừa', () => {
    // Đoán sai là câu rơi vào lớp khác, và không ai hiểu vì sao.
    const found = findSkill('Đọc hiểu câu ngắn', SKILLS)
    expect('error' in found && found.error).toMatch(/trùng ở 2 kỹ năng/)
  })

  it('tên lạ thì nói rõ là không tìm thấy', () => {
    const found = findSkill('Môn gì đó không có', SKILLS)
    expect('error' in found && found.error).toMatch(/không có kỹ năng nào/)
  })
})

describe('đọc một hàng bình thường', () => {
  it('lấy đủ đề bài, đáp án, mức khó, lời giải, gợi ý', () => {
    const { questions, problems } = parseSheet([HANG], opts())
    expect(problems).toEqual([])
    expect(questions).toHaveLength(1)

    const entry = questions[0]!.entry
    expect(questions[0]!.skillId).toBe('math.g1.cong-tru-10')
    expect(entry.kind).toBe('choice')
    expect(entry.prompt).toBe(HANG.de_bai)
    expect(entry.kind === 'choice' && entry.correct).toBe('7 bạn')
    expect(entry.kind === 'choice' && entry.distractors).toEqual(['5 bạn', '6 bạn'])
    expect(entry.hint).toBe('Đếm cả hai nhóm.')
  })

  it('tên cột viết kiểu gì cũng nhận', () => {
    const { questions } = parseSheet(
      [{ 'Kỹ năng': 'math.g1.cong-tru-10', 'ĐỀ BÀI': '2 + 2 = ?', 'Đáp án đúng': '4', 'Đáp án sai': '5' }],
      opts(),
    )
    expect(questions).toHaveLength(1)
    expect(questions[0]!.entry.prompt).toBe('2 + 2 = ?')
  })

  it('tách đáp án sai bằng gạch đứng, chấm phẩy hay xuống dòng đều được', () => {
    for (const sai of ['5 | 6 | 8', '5; 6; 8', '5\n6\n8']) {
      const { questions } = parseSheet([{ ...HANG, dap_an_sai: sai }], opts())
      expect(questions[0]!.entry.kind === 'choice' && questions[0]!.entry.distractors).toEqual(['5', '6', '8'])
    }
  })

  it('mức khó lạ thì về mức 1 chứ không vứt cả dòng', () => {
    expect(parseSheet([{ ...HANG, muc_do: 9 }], opts()).questions[0]!.entry.difficulty).toBe(1)
    expect(parseSheet([{ ...HANG, muc_do: '' }], opts()).questions[0]!.entry.difficulty).toBe(1)
    expect(parseSheet([{ ...HANG, muc_do: 3 }], opts()).questions[0]!.entry.difficulty).toBe(3)
  })
})

describe('đoán thể loại', () => {
  it('có đáp án sai thì là trắc nghiệm, không có thì trẻ tự gõ', () => {
    const tracNghiem = parseSheet([{ ...HANG, the_loai: '' }], opts())
    expect(tracNghiem.questions[0]!.entry.kind).toBe('choice')

    const goDapAn = parseSheet([{ ...HANG, the_loai: '', dap_an_sai: '' }], opts())
    expect(goDapAn.questions[0]!.entry.kind).toBe('text')
  })

  it('cột thể loại nói gì thì nghe nấy', () => {
    const { questions } = parseSheet([{ ...HANG, the_loai: 'gõ đáp án', dap_an_sai: '' }], opts())
    expect(questions[0]!.entry.kind).toBe('text')
  })

  it('câu gõ đáp án nhận nhiều cách viết', () => {
    const { questions } = parseSheet(
      [{ ...HANG, the_loai: 'gõ đáp án', dap_an_dung: '20 | hai mươi', dap_an_sai: '' }],
      opts(),
    )
    const entry = questions[0]!.entry
    expect(entry.kind === 'text' && entry.accepted).toEqual(['20', 'hai mươi'])
  })

  it('bảo là trắc nghiệm mà không có đáp án sai thì báo lỗi', () => {
    const { problems } = parseSheet([{ ...HANG, the_loai: 'trắc nghiệm', dap_an_sai: '' }], opts())
    expect(problems[0]!.reason).toMatch(/ít nhất một đáp án sai/)
  })
})

describe('một dòng hỏng không làm hỏng cả file', () => {
  it('nhận dòng tốt, báo riêng dòng hỏng, kèm SỐ DÒNG', () => {
    const { questions, problems } = parseSheet(
      [HANG, { ...HANG, de_bai: '' }, { ...HANG, de_bai: 'Câu thứ ba', dap_an_dung: '' }],
      opts(),
    )
    expect(questions).toHaveLength(1)
    expect(problems).toEqual([
      { row: 3, reason: 'thiếu đề bài' },
      { row: 4, reason: 'thiếu đáp án đúng' },
    ])
  })

  it('số dòng tính cả dòng tiêu đề, để mở file ra là thấy đúng chỗ', () => {
    const { problems } = parseSheet([{ ...HANG, de_bai: '' }], opts())
    expect(problems[0]!.row).toBe(2)
  })

  it('bỏ qua dòng trắng ở cuối bảng, không coi là lỗi', () => {
    // Ai cũng để vài dòng trắng ở cuối, và báo lỗi cho chúng chỉ tổ làm người ta
    // tưởng file mình hỏng.
    const { questions, problems } = parseSheet(
      [HANG, {}, { de_bai: '', dap_an_dung: '', dap_an_sai: '' }],
      opts(),
    )
    expect(questions).toHaveLength(1)
    expect(problems).toEqual([])
  })
})

describe('cột kỹ năng', () => {
  it('thiếu cột kỹ năng thì dùng vùng đang mở', () => {
    const { questions } = parseSheet(
      [{ de_bai: '1 + 1 = ?', dap_an_dung: '2', dap_an_sai: '3' }],
      opts({ defaultSkillId: 'math.g1.dem-100' }),
    )
    expect(questions[0]!.skillId).toBe('math.g1.dem-100')
  })

  it('không có cột kỹ năng mà cũng không mở vùng nào thì báo lỗi', () => {
    const { problems } = parseSheet([{ de_bai: '1 + 1 = ?', dap_an_dung: '2', dap_an_sai: '3' }], opts())
    expect(problems[0]!.reason).toMatch(/thiếu cột kỹ năng/)
  })

  it('một file nạp được cho NHIỀU kỹ năng', () => {
    // Đây mới là cách thầy cô dùng thật: một file cho cả học kỳ.
    const { questions } = parseSheet(
      [HANG, { ...HANG, ky_nang: 'Đếm và so sánh đến 100', de_bai: 'Số nào lớn hơn: 45 hay 54?', dap_an_dung: '54', dap_an_sai: '45' }],
      opts(),
    )
    expect(questions.map((q) => q.skillId)).toEqual(['math.g1.cong-tru-10', 'math.g1.dem-100'])
  })
})

describe('khoá file vào đúng một kỹ năng', () => {
  // Khối nạp file nằm BÊN TRONG từng mục kỹ năng, nên mọi câu phải rơi vào đúng
  // mục người ta đang mở - đó là điều người bấm nút đang trông đợi.
  const khoa = (extra = {}) =>
    opts({ lockedSkillId: 'math.g1.dem-100', ...extra })

  it('không có cột kỹ năng thì mọi câu vào mục đang mở', () => {
    const { questions } = parseSheet(
      [{ de_bai: '1 + 1 = ?', dap_an_dung: '2', dap_an_sai: '3' }],
      khoa(),
    )
    expect(questions[0]!.skillId).toBe('math.g1.dem-100')
  })

  it('cột kỹ năng ghi đúng mục đang mở thì vẫn nhận', () => {
    const { questions, problems } = parseSheet(
      [{ ...HANG, ky_nang: 'math.g1.dem-100' }],
      khoa(),
    )
    expect(problems).toEqual([])
    expect(questions[0]!.skillId).toBe('math.g1.dem-100')
  })

  it('ghi đúng mục nhưng bằng TÊN cũng nhận', () => {
    const { problems } = parseSheet([{ ...HANG, ky_nang: 'Đếm và so sánh đến 100' }], khoa())
    expect(problems).toEqual([])
  })

  it('ghi kỹ năng KHÁC thì BÁO RA, không lặng lẽ xếp sang chỗ khác', () => {
    // Câu nằm nhầm mục là câu trẻ không bao giờ gặp, mà người soạn thì tưởng đã
    // nạp xong.
    const { questions, problems } = parseSheet(
      [{ ...HANG, ky_nang: 'math.g1.cong-tru-10' }],
      khoa(),
    )
    expect(questions).toHaveLength(0)
    expect(problems[0]!.reason).toMatch(/ghi kỹ năng khác/)
  })

  it('ghi một cái tên không có thật cũng bị chặn', () => {
    const { problems } = parseSheet([{ ...HANG, ky_nang: 'Môn Bơi Lội' }], khoa())
    expect(problems[0]!.reason).toMatch(/ghi kỹ năng khác/)
  })

  it('file mẫu tải từ trong một mục thì nạp lại ngay tại mục đó phải sạch lỗi', () => {
    const skill = { id: 'math.g1.dem-100', name: 'Đếm và so sánh đến 100' }
    const { questions, problems } = parseSheet(templateRows(skill), khoa())
    expect(problems).toEqual([])
    expect(questions).toHaveLength(5)
    expect(new Set(questions.map((q) => q.skillId))).toEqual(new Set(['math.g1.dem-100']))
  })
})

describe('nạp trùng', () => {
  it('trùng trong chính file thì bỏ dòng sau, không báo là lỗi', () => {
    const { questions, duplicates, problems } = parseSheet([HANG, { ...HANG }], opts())
    expect(questions).toHaveLength(1)
    expect(problems).toEqual([])
    expect(duplicates[0]!.reason).toMatch(/trùng với một dòng phía trên/)
  })

  it('câu kho đã có rồi thì bỏ qua, và NÓI RA là đã bỏ', () => {
    // Nạp lại file cũ lần thứ hai là chuyện thường. Im lặng nhân đôi cả kho thì
    // trẻ gặp mỗi câu hai lần mà không ai hiểu vì sao.
    const { questions, duplicates } = parseSheet(
      [HANG],
      opts({ existing: () => [HANG.de_bai] }),
    )
    expect(questions).toHaveLength(0)
    expect(duplicates[0]!.reason).toMatch(/kho đã có câu này rồi/)
  })

  it('so trùng bỏ qua dấu và hoa thường', () => {
    const { duplicates } = parseSheet(
      [HANG],
      opts({ existing: () => [HANG.de_bai.toUpperCase()] }),
    )
    expect(duplicates).toHaveLength(1)
  })
})

describe('file mẫu', () => {
  // Nội dung file mẫu - đủ năm thể loại - kiểm ở `sheet-kinds.test.ts`, nơi có
  // sẵn danh sách kỹ năng mà mẫu trỏ tới. Ở đây chỉ canh phần khung.
  it('mọi cột trong mẫu đều là cột bộ đọc nhận ra', () => {
    const rows = templateRows(null)
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual([...TEMPLATE_HEADERS].sort())
    }
  })

  it('mỗi dòng mẫu chỉ điền những cột của riêng thể loại đó', () => {
    // Bảng mười bốn cột nhìn thì sợ. Điều cần nhìn thấy trong mẫu là phần lớn ô
    // để trống - soạn một câu trắc nghiệm vẫn chỉ phải điền bốn ô.
    const [tracNghiem] = templateRows(null)
    const daDien = Object.entries(tracNghiem!).filter(([, v]) => v !== '').map(([k]) => k)
    expect(daDien).not.toContain('ve_trai')
    expect(daDien).not.toContain('lua_chon')
  })
})
