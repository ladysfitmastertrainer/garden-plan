/** Bộ sinh câu hỏi Toán lớp 1. */

import { choice, numeric, type GeneratorMap } from '../factory'

const g1: GeneratorMap = {
  'math.g1.dem-100': (skill, d, rng) => {
    if (d === 1) {
      const n = rng.int(0, 98)
      return numeric(skill, d, {
        prompt: `Số liền sau của ${n} là số nào?`,
        value: n + 1,
        explanation: `Số liền sau của ${n} là ${n + 1}, vì đếm thêm 1 đơn vị.`,
        hint: 'Đếm thêm một đơn vị nữa.',
      })
    }
    if (d === 2) {
      const a = rng.int(10, 99)
      let b = rng.int(10, 99)
      if (rng.chance(0.2)) b = a
      const sign = a > b ? '>' : a < b ? '<' : '='
      return choice(skill, d, {
        prompt: `Điền dấu thích hợp:  ${a}  ...  ${b}`,
        correct: sign,
        distractors: ['>', '<', '='],
        explanation:
          sign === '='
            ? `${a} bằng ${b}.`
            : `${a} ${sign} ${b}. So chữ số hàng chục trước, hàng chục bằng nhau thì so hàng đơn vị.`,
        hint: 'So chữ số hàng chục trước đã.',
        rng,
      })
    }
    const step = rng.pick([2, 5, 10])
    const start = rng.int(0, 5) * step
    const missingIndex = rng.int(1, 3)
    const seq = [0, 1, 2, 3, 4].map((i) => start + i * step)
    const shown = seq.map((v, i) => (i === missingIndex ? '?' : String(v))).join(', ')
    return numeric(skill, d, {
      prompt: `Điền số còn thiếu:  ${shown}`,
      value: seq[missingIndex]!,
      explanation: `Dãy số này đếm thêm ${step} mỗi lần, nên số cần điền là ${seq[missingIndex]}.`,
      hint: `Xem hai số liền nhau cách nhau bao nhiêu.`,
    })
  },

  'math.g1.cong-tru-10': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(1, 8)
      const b = rng.int(1, 10 - a)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a} cộng ${b} bằng ${a + b}.`,
        hint: `Đếm thêm ${b} từ số ${a}.`,
      })
    }
    if (d === 2) {
      const a = rng.int(3, 10)
      const b = rng.int(1, a)
      return numeric(skill, d, {
        prompt: `${a} - ${b} = ?`,
        value: a - b,
        explanation: `${a} trừ ${b} bằng ${a - b}.`,
        hint: `Đếm lùi ${b} từ số ${a}.`,
      })
    }
    const total = rng.int(4, 10)
    const known = rng.int(1, total - 1)
    return numeric(skill, d, {
      prompt: `?  +  ${known}  =  ${total}`,
      value: total - known,
      explanation: `Lấy ${total} trừ ${known} được ${total - known}.`,
      hint: 'Muốn tìm số hạng còn thiếu thì lấy tổng trừ số hạng đã biết.',
    })
  },

  'math.g1.cong-tru-20': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(6, 9)
      const b = rng.int(11 - a, 9)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a} + ${b}: tách ${b} thành ${10 - a} và ${b - (10 - a)}. ${a} + ${10 - a} = 10, rồi 10 + ${b - (10 - a)} = ${a + b}.`,
        hint: 'Làm tròn 10 trước rồi cộng phần còn lại.',
      })
    }
    if (d === 2) {
      const a = rng.int(11, 18)
      const b = rng.int(a - 9, 9)
      return numeric(skill, d, {
        prompt: `${a} - ${b} = ?`,
        value: a - b,
        explanation: `${a} - ${b}: lấy ${a} trừ về 10 trước (trừ ${a - 10}), còn phải trừ ${b - (a - 10)} nữa, được ${a - b}.`,
        hint: 'Trừ về tròn 10 trước.',
      })
    }
    const a = rng.int(12, 20)
    const result = rng.int(2, 9)
    return numeric(skill, d, {
      prompt: `${a}  -  ?  =  ${result}`,
      value: a - result,
      explanation: `Lấy ${a} trừ ${result} được ${a - result}.`,
      hint: 'Muốn tìm số trừ thì lấy số bị trừ trừ đi hiệu.',
    })
  },

  'math.g1.hinh-phang': (skill, d, rng) => {
    const shapes = [
      { name: 'hình tròn', emoji: '⭕', sides: 0 },
      { name: 'hình tam giác', emoji: '🔺', sides: 3 },
      { name: 'hình vuông', emoji: '🟥', sides: 4 },
      { name: 'hình chữ nhật', emoji: '▬', sides: 4 },
    ]
    /*
      Đồ vật quanh em mang hình gì - nhận ra hình trong đời sống, không chỉ
      trong hình vẽ. Hai bậc dưới từng chỉ có bốn và ba câu (mỗi hình một câu).
    */
    const objects = [
      { name: 'bánh xe đạp', shape: 'hình tròn' },
      { name: 'mặt đồng hồ', shape: 'hình tròn' },
      { name: 'cái đĩa', shape: 'hình tròn' },
      { name: 'miếng bánh chưng', shape: 'hình vuông' },
      { name: 'khăn mùi xoa', shape: 'hình vuông' },
      { name: 'quyển vở', shape: 'hình chữ nhật' },
      { name: 'cửa ra vào', shape: 'hình chữ nhật' },
      { name: 'mặt bàn học', shape: 'hình chữ nhật' },
      { name: 'lá cờ đuôi nheo', shape: 'hình tam giác' },
      { name: 'miếng bánh sandwich cắt chéo', shape: 'hình tam giác' },
    ]
    if (d === 1 && rng.chance(0.5)) {
      const obj = rng.pick(objects)
      return choice(skill, d, {
        prompt: `${obj.name.charAt(0).toUpperCase()}${obj.name.slice(1)} có dạng hình gì?`,
        correct: obj.shape,
        distractors: shapes.map((s) => s.name).filter((n) => n !== obj.shape),
        explanation: `${obj.name.charAt(0).toUpperCase()}${obj.name.slice(1)} có dạng ${obj.shape}.`,
        rng,
      })
    }
    if (d === 2 && rng.chance(0.5)) {
      const [a, b] = rng.shuffle(shapes.filter((s) => s.sides > 0))
      return numeric(skill, d, {
        prompt: `Một ${a!.name} và một ${b!.name} có tất cả bao nhiêu cạnh?`,
        value: a!.sides + b!.sides,
        explanation: `${a!.name} có ${a!.sides} cạnh, ${b!.name} có ${b!.sides} cạnh. ${a!.sides} + ${b!.sides} = ${a!.sides + b!.sides}.`,
        hint: 'Đếm cạnh của từng hình rồi cộng lại.',
      })
    }
    if (d === 1) {
      const target = rng.pick(shapes)
      return choice(skill, d, {
        prompt: `Đâu là ${target.name}?`,
        correct: { id: 'c0', label: target.name, image: target.emoji },
        distractors: shapes
          .filter((s) => s.name !== target.name)
          .map((s) => ({ id: `d-${s.name}`, label: s.name, image: s.emoji })),
        explanation: `Hình ${target.emoji} chính là ${target.name}.`,
        rng,
      })
    }
    if (d === 2) {
      const target = rng.pick(shapes.filter((s) => s.sides > 0))
      return numeric(skill, d, {
        prompt: `${target.name.charAt(0).toUpperCase()}${target.name.slice(1)} có mấy cạnh?`,
        value: target.sides,
        explanation: `${target.name} có ${target.sides} cạnh.`,
        image: target.emoji,
      })
    }
    const target = rng.pick(shapes)
    const count = rng.int(2, 4)
    const others = shapes.filter((s) => s.name !== target.name)
    const row = rng.shuffle([
      ...Array.from({ length: count }, () => target.emoji),
      ...Array.from({ length: rng.int(2, 4) }, () => rng.pick(others).emoji),
    ]).join(' ')
    return numeric(skill, d, {
      prompt: `Có bao nhiêu ${target.name} trong dãy sau?\n\n${row}`,
      value: count,
      explanation: `Đếm được ${count} ${target.name}.`,
      hint: 'Chỉ tay vào từng hình và đếm.',
    })
  },

  'math.g1.do-dai-cm': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(2, 9)
      const b = rng.int(2, 9)
      return numeric(skill, d, {
        prompt: `Đoạn thẳng AB dài ${a} cm, đoạn thẳng BC dài ${b} cm. Đoạn thẳng AC dài bao nhiêu xăng-ti-mét?`,
        value: a + b,
        unit: 'cm',
        explanation: `${a} cm + ${b} cm = ${a + b} cm.`,
      })
    }
    if (d === 2) {
      const total = rng.int(10, 20)
      const cut = rng.int(2, total - 2)
      return numeric(skill, d, {
        prompt: `Băng giấy dài ${total} cm, cắt đi ${cut} cm. Băng giấy còn lại dài bao nhiêu xăng-ti-mét?`,
        value: total - cut,
        unit: 'cm',
        explanation: `${total} cm - ${cut} cm = ${total - cut} cm.`,
      })
    }
    const penCm = rng.int(12, 18)
    const eraserCm = rng.int(3, 6)
    return numeric(skill, d, {
      prompt: `Cái bút dài ${penCm} cm, cục tẩy dài ${eraserCm} cm. Cái bút dài hơn cục tẩy bao nhiêu xăng-ti-mét?`,
      value: penCm - eraserCm,
      unit: 'cm',
      explanation: `Muốn biết dài hơn bao nhiêu thì lấy ${penCm} - ${eraserCm} = ${penCm - eraserCm} cm.`,
      hint: 'Dài hơn bao nhiêu thì làm phép trừ.',
    })
  },

  'math.g1.xem-gio-dung': (skill, d, rng) => {
    if (d === 1) {
      const hour = rng.int(1, 12)
      return numeric(skill, d, {
        prompt: `Kim ngắn chỉ vào số ${hour}, kim dài chỉ vào số 12. Bây giờ là mấy giờ?`,
        value: hour,
        unit: 'giờ',
        explanation: `Kim dài chỉ số 12 nghĩa là giờ đúng. Kim ngắn chỉ số ${hour} nên là ${hour} giờ.`,
        image: '🕐',
      })
    }
    if (d === 2) {
      const hour24 = rng.int(13, 23)
      return numeric(skill, d, {
        prompt: `${hour24} giờ còn gọi là mấy giờ chiều (hoặc tối)?`,
        value: hour24 - 12,
        unit: 'giờ',
        explanation: `${hour24} - 12 = ${hour24 - 12}, nên ${hour24} giờ là ${hour24 - 12} giờ chiều.`,
        hint: 'Lấy số giờ trừ đi 12.',
      })
    }
    const start = rng.int(1, 9)
    const add = rng.int(2, 5)
    return numeric(skill, d, {
      prompt: `Bây giờ là ${start} giờ. Sau ${add} giờ nữa là mấy giờ?`,
      value: start + add,
      unit: 'giờ',
      explanation: `${start} + ${add} = ${start + add} giờ.`,
    })
  },
}

export default g1
