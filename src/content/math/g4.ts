/** Bộ sinh câu hỏi Toán lớp 4. */

import { choice, numeric, text, type GeneratorMap } from '../factory'

/** Ước chung lớn nhất - dùng để rút gọn phân số. */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

const PLACE_NAMES = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn', 'trăm nghìn', 'triệu']

const g4: GeneratorMap = {
  'math.g4.so-lon': (skill, d, rng) => {
    if (d === 1) {
      const n = rng.int(10_000, 999_999)
      const digits = String(n).split('').reverse()
      const place = rng.int(0, digits.length - 1)
      return numeric(skill, d, {
        prompt: `Trong số ${n.toLocaleString('vi-VN')}, chữ số ở hàng ${PLACE_NAMES[place]} là chữ số nào?`,
        value: Number(digits[place]),
        explanation: `Đếm từ phải sang trái: hàng ${PLACE_NAMES[place]} của ${n.toLocaleString('vi-VN')} là chữ số ${digits[place]}.`,
        hint: 'Đếm các hàng từ phải sang trái.',
      })
    }
    if (d === 2) {
      const place = rng.int(1, 5)
      const digit = rng.int(1, 9)
      const n = digit * 10 ** place + rng.int(0, 10 ** place - 1)
      return numeric(skill, d, {
        prompt: `Chữ số ${digit} trong số ${n.toLocaleString('vi-VN')} có giá trị là bao nhiêu?`,
        value: digit * 10 ** place,
        explanation: `Chữ số ${digit} đứng ở hàng ${PLACE_NAMES[place]} nên có giá trị ${digit} × ${(10 ** place).toLocaleString('vi-VN')} = ${(digit * 10 ** place).toLocaleString('vi-VN')}.`,
        hint: 'Giá trị = chữ số × giá trị của hàng.',
      })
    }
    const a = rng.int(100_000, 9_999_999)
    const b = a + rng.int(-5000, 5000)
    const bigger = Math.max(a, b)
    return choice(skill, d, {
      prompt: `Số nào lớn hơn: ${a.toLocaleString('vi-VN')} hay ${b.toLocaleString('vi-VN')}?`,
      correct: bigger.toLocaleString('vi-VN'),
      distractors: [Math.min(a, b).toLocaleString('vi-VN')],
      explanation: `Hai số có cùng số chữ số thì so từ hàng cao nhất xuống. ${bigger.toLocaleString('vi-VN')} lớn hơn.`,
      rng,
    })
  },

  'math.g4.bon-phep-tinh': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(1000, 9000)
      const b = rng.int(1000, 9000)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a} + ${b} = ${a + b}.`,
      })
    }
    if (d === 2) {
      const a = rng.int(12, 99)
      const b = rng.int(12, 99)
      return numeric(skill, d, {
        prompt: `${a} × ${b} = ?`,
        value: a * b,
        explanation: `${a} × ${b} = ${a * b}. Nhân với hàng đơn vị trước, rồi hàng chục, sau đó cộng lại.`,
        hint: 'Đặt tính rồi nhân theo từng hàng.',
      })
    }
    const a = rng.int(2, 12)
    const b = rng.int(2, 12)
    const c = rng.int(2, 20)
    return numeric(skill, d, {
      prompt: `${a} + ${b} × ${c} = ?`,
      value: a + b * c,
      explanation: `Nhân chia làm trước, cộng trừ làm sau: ${b} × ${c} = ${b * c}, rồi ${a} + ${b * c} = ${a + b * c}.`,
      hint: 'Thứ tự thực hiện: nhân chia trước, cộng trừ sau.',
    })
  },

  'math.g4.phan-so': (skill, d, rng) => {
    if (d === 1) {
      const denom = rng.int(4, 12)
      const a = rng.int(1, denom - 2)
      const b = rng.int(1, denom - a - 1)
      return text(skill, d, {
        prompt: `${a}/${denom} + ${b}/${denom} = ?  (viết dạng tử/mẫu, ví dụ 3/5)`,
        accepted: [`${a + b}/${denom}`, ...simplifiedForms(a + b, denom)],
        explanation: `Hai phân số cùng mẫu số thì cộng tử số, giữ nguyên mẫu số: ${a}/${denom} + ${b}/${denom} = ${a + b}/${denom}.`,
        hint: 'Cùng mẫu số thì chỉ cộng tử số.',
      })
    }
    if (d === 2) {
      const k = rng.int(2, 6)
      const a = rng.int(1, 8)
      const b = rng.int(a + 1, 12)
      const g = gcd(a, b)
      return text(skill, d, {
        prompt: `Rút gọn phân số ${a * k}/${b * k}  (viết dạng tử/mẫu)`,
        accepted: [`${a / g}/${b / g}`, `${a}/${b}`],
        explanation: `Chia cả tử và mẫu cho ${k}: ${a * k}/${b * k} = ${a}/${b}${g > 1 ? ` = ${a / g}/${b / g}` : ''}.`,
        hint: 'Tìm số chia hết cả tử lẫn mẫu.',
      })
    }
    const denom = rng.int(3, 10)
    const a = rng.int(1, denom - 1)
    // Lấy tử số thứ hai khác a bằng cách chọn trong phần còn lại - luôn khác nhau
    // nên không bao giờ rơi vào tình huống "hai phân số bằng nhau".
    const others = Array.from({ length: denom - 1 }, (_, i) => i + 1).filter((v) => v !== a)
    const b = rng.pick(others)
    const bigger = a > b ? `${a}/${denom}` : `${b}/${denom}`
    return choice(skill, d, {
      prompt: `Phân số nào lớn hơn: ${a}/${denom} hay ${b}/${denom}?`,
      correct: bigger,
      distractors: [a > b ? `${b}/${denom}` : `${a}/${denom}`],
      explanation: `Hai phân số cùng mẫu số, phân số nào có tử số lớn hơn thì lớn hơn. Vậy ${bigger} lớn hơn.`,
      rng,
    })
  },

  'math.g4.goc': (skill, d, rng) => {
    if (d === 1) {
      const kinds = [
        { name: 'góc nhọn', range: [10, 89] as const },
        { name: 'góc vuông', range: [90, 90] as const },
        { name: 'góc tù', range: [91, 179] as const },
        { name: 'góc bẹt', range: [180, 180] as const },
      ]
      const kind = rng.pick(kinds)
      const degrees = rng.int(kind.range[0], kind.range[1])
      return choice(skill, d, {
        prompt: `Góc có số đo ${degrees}° là góc gì?`,
        correct: kind.name,
        distractors: kinds.filter((k) => k.name !== kind.name).map((k) => k.name),
        explanation: `Góc nhọn nhỏ hơn 90°, góc vuông bằng 90°, góc tù lớn hơn 90° và nhỏ hơn 180°, góc bẹt bằng 180°. Vậy ${degrees}° là ${kind.name}.`,
        rng,
      })
    }
    if (d === 2 && rng.chance(0.6)) {
      /*
        Góc tạo bởi hai kim đồng hồ lúc đúng giờ - mỗi giờ kim giờ lệch 30°.
        Bậc này từng chỉ có ba câu (ba hình, mỗi hình một câu).
      */
      const hour = rng.int(1, 11)
      const angle = Math.min(hour * 30, 360 - hour * 30)
      const name = angle < 90 ? 'góc nhọn' : angle === 90 ? 'góc vuông' : angle < 180 ? 'góc tù' : 'góc bẹt'
      return choice(skill, d, {
        prompt: `Lúc đúng ${hour} giờ, kim giờ và kim phút tạo thành góc gì?`,
        correct: name,
        distractors: ['góc nhọn', 'góc vuông', 'góc tù', 'góc bẹt'].filter((k) => k !== name),
        explanation: `Mỗi giờ trên mặt đồng hồ ứng với 30°. Lúc ${hour} giờ, hai kim tạo góc ${angle}°, đó là ${name}.`,
        hint: 'Lúc 3 giờ hai kim tạo góc vuông.',
        rng,
      })
    }
    if (d === 2) {
      const shapes = [
        { name: 'hình chữ nhật', right: 4 },
        { name: 'hình vuông', right: 4 },
        { name: 'tam giác vuông', right: 1 },
      ]
      const shape = rng.pick(shapes)
      return numeric(skill, d, {
        prompt: `${shape.name.charAt(0).toUpperCase()}${shape.name.slice(1)} có mấy góc vuông?`,
        value: shape.right,
        explanation: `${shape.name} có ${shape.right} góc vuông.`,
      })
    }
    const part = rng.int(20, 70)
    return numeric(skill, d, {
      prompt: `Một góc vuông được chia thành hai góc. Một góc có số đo ${part}°. Góc còn lại có số đo bao nhiêu độ?`,
      value: 90 - part,
      unit: '°',
      explanation: `Góc vuông bằng 90°, nên góc còn lại là 90° - ${part}° = ${90 - part}°.`,
      hint: 'Góc vuông có số đo 90 độ.',
    })
  },

  'math.g4.dien-tich': (skill, d, rng) => {
    if (d === 1) {
      const long = rng.int(4, 20)
      const short = rng.int(2, long)
      return numeric(skill, d, {
        prompt: `Hình chữ nhật có chiều dài ${long} cm, chiều rộng ${short} cm. Diện tích hình chữ nhật đó là bao nhiêu xăng-ti-mét vuông?`,
        value: long * short,
        unit: 'cm²',
        explanation: `Diện tích = dài × rộng = ${long} × ${short} = ${long * short} cm².`,
        hint: 'Diện tích hình chữ nhật bằng dài nhân rộng.',
      })
    }
    if (d === 2) {
      const side = rng.int(3, 20)
      return numeric(skill, d, {
        prompt: `Hình vuông có cạnh ${side} cm. Diện tích hình vuông đó là bao nhiêu xăng-ti-mét vuông?`,
        value: side * side,
        unit: 'cm²',
        explanation: `Diện tích hình vuông = cạnh × cạnh = ${side} × ${side} = ${side * side} cm².`,
      })
    }
    const short = rng.int(2, 12)
    const long = rng.int(short + 1, 24)
    return numeric(skill, d, {
      prompt: `Hình chữ nhật có diện tích ${long * short} cm² và chiều rộng ${short} cm. Chiều dài hình chữ nhật đó là bao nhiêu xăng-ti-mét?`,
      value: long,
      unit: 'cm',
      explanation: `Chiều dài = diện tích : chiều rộng = ${long * short} : ${short} = ${long} cm.`,
      hint: 'Làm ngược lại công thức diện tích.',
    })
  },

  'math.g4.bieu-do-cot': (skill, d, rng) => {
    const subjects = ['Toán', 'Tiếng Việt', 'Âm nhạc', 'Mĩ thuật']
    const values = subjects.map(() => rng.int(3, 20))
    const table = subjects.map((s, i) => `  ${s}: ${'█'.repeat(values[i]!)} (${values[i]})`).join('\n')
    const maxIndex = values.indexOf(Math.max(...values))
    const minIndex = values.indexOf(Math.min(...values))

    if (d === 1) {
      return choice(skill, d, {
        prompt: `Biểu đồ số bạn yêu thích từng môn học:\n\n${table}\n\nMôn nào được nhiều bạn yêu thích nhất?`,
        correct: subjects[maxIndex]!,
        distractors: subjects.filter((_, i) => i !== maxIndex),
        explanation: `Cột dài nhất là môn ${subjects[maxIndex]} với ${values[maxIndex]} bạn.`,
        rng,
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: `Biểu đồ số bạn yêu thích từng môn học:\n\n${table}\n\nMôn ${subjects[maxIndex]} nhiều hơn môn ${subjects[minIndex]} bao nhiêu bạn?`,
        value: values[maxIndex]! - values[minIndex]!,
        unit: 'bạn',
        explanation: `${values[maxIndex]} - ${values[minIndex]} = ${values[maxIndex]! - values[minIndex]!} bạn.`,
      })
    }
    return numeric(skill, d, {
      prompt: `Biểu đồ số bạn yêu thích từng môn học:\n\n${table}\n\nTổng cộng có bao nhiêu lượt bình chọn?`,
      value: values.reduce((sum, v) => sum + v, 0),
      unit: 'lượt',
      explanation: `Cộng tất cả: ${values.join(' + ')} = ${values.reduce((sum, v) => sum + v, 0)}.`,
      hint: 'Cộng giá trị của tất cả các cột.',
    })
  },
}

/** Các cách viết rút gọn cũng được chấp nhận khi cộng phân số. */
function simplifiedForms(numerator: number, denominator: number): string[] {
  const g = gcd(numerator, denominator)
  if (g <= 1) return []
  const simplified = `${numerator / g}/${denominator / g}`
  return denominator / g === 1 ? [simplified, String(numerator / g)] : [simplified]
}

export default g4
