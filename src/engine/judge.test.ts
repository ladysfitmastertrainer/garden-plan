import { describe, expect, it } from 'vitest'
import { judge, normalizeText } from './judge'
import {
  audioQuestion,
  decimalQuestion,
  mcQuestion,
  numericQuestion,
  orderQuestion,
  pairsQuestion,
  rhythmQuestion,
  scenarioQuestion,
  textQuestion,
} from './test-fixtures'

describe('normalizeText', () => {
  it('GIỮ NGUYÊN dấu tiếng Việt - bỏ dấu sẽ chấm sai nghĩa', () => {
    expect(normalizeText('Mã')).toBe('mã')
    expect(normalizeText('Mã')).not.toBe(normalizeText('Ma'))
  })

  it('bỏ qua hoa thường, khoảng trắng thừa và dấu câu', () => {
    expect(normalizeText('  Con  TRÂU. ')).toBe('con trâu')
  })

  it('chuẩn hoá về NFC nên chữ tổ hợp và chữ dựng sẵn là một', () => {
    const precomposed = 'ế'
    const combining = 'ế'
    expect(normalizeText(precomposed)).toBe(normalizeText(combining))
  })
})

describe('judge - trắc nghiệm', () => {
  it('chọn đúng đáp án', () => {
    expect(judge(mcQuestion, { kind: 'choice', choiceId: 'b' }).correct).toBe(true)
  })

  it('chọn sai đáp án và nhận được lời giải thích', () => {
    const result = judge(mcQuestion, { kind: 'choice', choiceId: 'a' })
    expect(result.correct).toBe(false)
    expect(result.message).toBe(mcQuestion.explanation)
  })

  it('câu nghe nhạc chấm giống trắc nghiệm', () => {
    expect(judge(audioQuestion, { kind: 'choice', choiceId: 'cao' }).correct).toBe(true)
    expect(judge(audioQuestion, { kind: 'choice', choiceId: 'thap' }).correct).toBe(false)
  })
})

describe('judge - nhập số', () => {
  it('đúng giá trị', () => {
    expect(judge(numericQuestion, { kind: 'numeric', value: 7 }).correct).toBe(true)
  })

  it('sai giá trị', () => {
    expect(judge(numericQuestion, { kind: 'numeric', value: 8 }).correct).toBe(false)
  })

  it('không chấp nhận NaN', () => {
    expect(judge(numericQuestion, { kind: 'numeric', value: Number.NaN }).correct).toBe(false)
  })

  it('chấp nhận sai số cho phép với số thập phân', () => {
    expect(judge(decimalQuestion, { kind: 'numeric', value: 0.333 }).correct).toBe(true)
    expect(judge(decimalQuestion, { kind: 'numeric', value: 0.34 }).correct).toBe(false)
  })
})

describe('judge - nhập chữ', () => {
  it('chấp nhận mọi cách viết đã liệt kê', () => {
    expect(judge(textQuestion, { kind: 'text', value: 'trâu' }).correct).toBe(true)
    expect(judge(textQuestion, { kind: 'text', value: 'Con Trâu' }).correct).toBe(true)
  })

  it('viết thiếu dấu bị tính là sai', () => {
    expect(judge(textQuestion, { kind: 'text', value: 'trau' }).correct).toBe(false)
  })
})

describe('judge - sắp xếp và nối cặp', () => {
  it('đúng thứ tự', () => {
    expect(judge(orderQuestion, { kind: 'order', orderedIds: ['w1', 'w2', 'w3'] }).correct).toBe(true)
  })

  it('sai thứ tự', () => {
    expect(judge(orderQuestion, { kind: 'order', orderedIds: ['w2', 'w1', 'w3'] }).correct).toBe(false)
  })

  it('thiếu phần tử thì chưa tính là đúng', () => {
    expect(judge(orderQuestion, { kind: 'order', orderedIds: ['w1', 'w2'] }).correct).toBe(false)
  })

  it('nối đúng toàn bộ cặp, không phụ thuộc thứ tự nối', () => {
    const result = judge(pairsQuestion, {
      kind: 'pairs',
      pairs: [
        { leftId: 'mi', rightId: 'E' },
        { leftId: 'do', rightId: 'C' },
        { leftId: 're', rightId: 'D' },
      ],
    })
    expect(result.correct).toBe(true)
  })

  it('một cặp nối sai là cả câu sai', () => {
    const result = judge(pairsQuestion, {
      kind: 'pairs',
      pairs: [
        { leftId: 'do', rightId: 'D' },
        { leftId: 're', rightId: 'C' },
        { leftId: 'mi', rightId: 'E' },
      ],
    })
    expect(result.correct).toBe(false)
  })
})

describe('judge - gõ nhịp', () => {
  // tempo 60 => 1 phách = 1000ms; pattern [1,1,2] => khoảng cách 1000ms rồi 1000ms
  it('gõ đúng khoảng cách thì đúng', () => {
    const result = judge(rhythmQuestion, { kind: 'rhythm', timestampsMs: [0, 1000, 2000] })
    expect(result.correct).toBe(true)
  })

  it('vào sớm hay muộn cả bài vẫn đúng, miễn giữ đều nhịp', () => {
    const result = judge(rhythmQuestion, { kind: 'rhythm', timestampsMs: [500, 1500, 2500] })
    expect(result.correct).toBe(true)
  })

  it('lệch trong sai số cho phép vẫn đúng', () => {
    const result = judge(rhythmQuestion, { kind: 'rhythm', timestampsMs: [0, 1150, 2100] })
    expect(result.correct).toBe(true)
  })

  it('lệch quá sai số thì sai', () => {
    const result = judge(rhythmQuestion, { kind: 'rhythm', timestampsMs: [0, 1500, 2500] })
    expect(result.correct).toBe(false)
  })

  it('gõ thiếu tiếng thì báo rõ số tiếng cần gõ', () => {
    const result = judge(rhythmQuestion, { kind: 'rhythm', timestampsMs: [0, 1000] })
    expect(result.correct).toBe(false)
    expect(result.message).toContain('3 tiếng')
  })
})

describe('judge - tình huống Đạo đức', () => {
  it('lựa chọn tốt được ghi nhận kèm phẩm chất', () => {
    const result = judge(scenarioQuestion, { kind: 'choice', choiceId: 'nhan-loi' })
    expect(result.correct).toBe(true)
    expect(result.quality).toBe('good')
    expect(result.virtues).toContain('honesty')
  })

  it('lựa chọn tạm được vẫn tính là trả lời được', () => {
    const result = judge(scenarioQuestion, { kind: 'choice', choiceId: 'don-dep' })
    expect(result.correct).toBe(true)
    expect(result.quality).toBe('ok')
  })

  it('lựa chọn chưa tốt trả về lời giải thích riêng, không phải câu "sai rồi"', () => {
    const result = judge(scenarioQuestion, { kind: 'choice', choiceId: 'do-loi' })
    expect(result.correct).toBe(false)
    expect(result.quality).toBe('poor')
    expect(result.message).toBe('Đổ lỗi cho người khác làm mất lòng tin. Hãy thử cách khác nhé.')
  })

  it('lựa chọn không tồn tại là lỗi lập trình, phải ném ra', () => {
    expect(() => judge(scenarioQuestion, { kind: 'choice', choiceId: 'khong-co' })).toThrow()
  })
})

describe('judge - sai kiểu đầu vào', () => {
  it('ném lỗi thay vì âm thầm chấm sai cho trẻ', () => {
    expect(() => judge(numericQuestion, { kind: 'text', value: '7' })).toThrow()
  })
})
