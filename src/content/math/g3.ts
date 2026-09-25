/** Bộ sinh câu hỏi Toán lớp 3. */

import { choice, numeric, type GeneratorMap } from '../factory'

const g3: GeneratorMap = {
  'math.g3.bang-nhan-chia': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(3, 9)
      const b = rng.int(2, 10)
      return numeric(skill, d, {
        prompt: `${a} × ${b} = ?`,
        value: a * b,
        explanation: `${a} × ${b} = ${a * b}.`,
        hint: `Nhớ lại bảng nhân ${a}.`,
      })
    }
    if (d === 2) {
      const a = rng.int(3, 9)
      const b = rng.int(2, 10)
      return numeric(skill, d, {
        prompt: `${a * b} : ${a} = ?`,
        value: b,
        explanation: `${a * b} : ${a} = ${b}, vì ${a} × ${b} = ${a * b}.`,
        hint: 'Phép chia là phép tính ngược của phép nhân.',
      })
    }
    const a = rng.int(3, 9)
    const b = rng.int(3, 9)
    return numeric(skill, d, {
      prompt: `${a} × ?  =  ${a * b}`,
      value: b,
      explanation: `Lấy ${a * b} : ${a} = ${b}.`,
      hint: 'Muốn tìm thừa số chưa biết thì lấy tích chia cho thừa số đã biết.',
    })
  },

  'math.g3.tinh-1000': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(101, 444)
      const b = rng.int(101, 444)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a} + ${b} = ${a + b}. Cộng lần lượt hàng đơn vị, hàng chục, hàng trăm.`,
      })
    }
    if (d === 2) {
      const a = rng.int(250, 900)
      const b = rng.int(120, Math.min(900, 999 - a) || 120)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a} + ${b} = ${a + b}. Nhớ 1 sang hàng kế tiếp khi tổng một hàng vượt quá 9.`,
        hint: 'Đặt tính thẳng hàng rồi cộng từ phải sang trái.',
      })
    }
    const a = rng.int(400, 999)
    const b = rng.int(120, a - 100)
    return numeric(skill, d, {
      prompt: `${a} - ${b} = ?`,
      value: a - b,
      explanation: `${a} - ${b} = ${a - b}.`,
      hint: 'Không trừ được thì mượn 1 ở hàng bên trái.',
    })
  },

  'math.g3.nhan-chia-cot': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(12, 49)
      const b = rng.int(2, 5)
      return numeric(skill, d, {
        prompt: `${a} × ${b} = ?`,
        value: a * b,
        explanation: `${a} × ${b} = ${a * b}. Nhân hàng đơn vị trước rồi tới hàng chục.`,
        hint: 'Đặt tính rồi nhân từng hàng.',
      })
    }
    if (d === 2) {
      const a = rng.int(103, 320)
      const b = rng.int(2, 3)
      return numeric(skill, d, {
        prompt: `${a} × ${b} = ?`,
        value: a * b,
        explanation: `${a} × ${b} = ${a * b}.`,
      })
    }
    const divisor = rng.int(2, 9)
    const quotient = rng.int(11, 99)
    const remainder = rng.int(1, divisor - 1)
    const dividend = divisor * quotient + remainder
    return numeric(skill, d, {
      prompt: `${dividend} : ${divisor} được thương là bao nhiêu? (chỉ nhập thương, bỏ qua số dư)`,
      value: quotient,
      explanation: `${dividend} : ${divisor} = ${quotient} (dư ${remainder}).`,
      hint: 'Chia lần lượt từ hàng cao nhất.',
    })
  },

  'math.g3.phan-so-don-gian': (skill, d, rng) => {
    if (d === 1) {
      const half = rng.int(2, 12)
      return numeric(skill, d, {
        prompt: `Một phần hai của ${half * 2} là bao nhiêu?`,
        value: half,
        explanation: `Một phần hai nghĩa là chia đều thành 2 phần: ${half * 2} : 2 = ${half}.`,
        hint: 'Chia đôi số đó.',
      })
    }
    if (d === 2) {
      const denom = rng.pick([3, 4, 5])
      const part = rng.int(2, 9)
      const words: Record<number, string> = { 3: 'Một phần ba', 4: 'Một phần tư', 5: 'Một phần năm' }
      return numeric(skill, d, {
        prompt: `${words[denom]} của ${denom * part} là bao nhiêu?`,
        value: part,
        explanation: `${words[denom]!.toLowerCase()} nghĩa là chia đều thành ${denom} phần: ${denom * part} : ${denom} = ${part}.`,
      })
    }
    const denom = rng.pick([2, 3, 4])
    const part = rng.int(3, 8)
    const total = denom * part
    return numeric(skill, d, {
      prompt: `Lớp có ${total} bạn. Một phần ${denom === 2 ? 'hai' : denom === 3 ? 'ba' : 'tư'} số bạn tham gia múa hát. Hỏi có bao nhiêu bạn tham gia múa hát?`,
      value: part,
      explanation: `${total} : ${denom} = ${part} bạn.`,
      hint: 'Chia đều số bạn thành các phần bằng nhau.',
    })
  },

  'math.g3.chu-vi': (skill, d, rng) => {
    if (d === 1) {
      const side = rng.int(3, 20)
      return numeric(skill, d, {
        prompt: `Hình vuông có cạnh ${side} cm. Chu vi hình vuông đó là bao nhiêu xăng-ti-mét?`,
        value: side * 4,
        unit: 'cm',
        explanation: `Chu vi hình vuông = cạnh × 4 = ${side} × 4 = ${side * 4} cm.`,
        hint: 'Hình vuông có 4 cạnh bằng nhau.',
      })
    }
    if (d === 2) {
      const long = rng.int(6, 25)
      const short = rng.int(2, long - 1)
      return numeric(skill, d, {
        prompt: `Hình chữ nhật có chiều dài ${long} cm, chiều rộng ${short} cm. Chu vi hình chữ nhật đó là bao nhiêu xăng-ti-mét?`,
        value: (long + short) * 2,
        unit: 'cm',
        explanation: `Chu vi = (dài + rộng) × 2 = (${long} + ${short}) × 2 = ${(long + short) * 2} cm.`,
        hint: 'Cộng chiều dài với chiều rộng rồi nhân 2.',
      })
    }
    const side = rng.int(4, 20)
    return numeric(skill, d, {
      prompt: `Một hình vuông có chu vi ${side * 4} cm. Cạnh của hình vuông đó dài bao nhiêu xăng-ti-mét?`,
      value: side,
      unit: 'cm',
      explanation: `Cạnh = chu vi : 4 = ${side * 4} : 4 = ${side} cm.`,
      hint: 'Làm ngược lại công thức chu vi.',
    })
  },

  'math.g3.xem-lich': (skill, d, rng) => {
    const months = [
      { n: 1, days: 31 }, { n: 3, days: 31 }, { n: 4, days: 30 }, { n: 5, days: 31 },
      { n: 6, days: 30 }, { n: 7, days: 31 }, { n: 8, days: 31 }, { n: 9, days: 30 },
      { n: 10, days: 31 }, { n: 11, days: 30 }, { n: 12, days: 31 },
    ]
    if (d === 1) {
      const m = rng.pick(months)
      return numeric(skill, d, {
        prompt: `Tháng ${m.n} có bao nhiêu ngày?`,
        value: m.days,
        unit: 'ngày',
        explanation: `Tháng ${m.n} có ${m.days} ngày.`,
        hint: 'Dùng cách đếm trên nắm tay: chỗ nhô lên là 31 ngày.',
      })
    }
    if (d === 2 && rng.chance(0.5)) {
      // Ngày của tháng rơi vào thứ mấy - đọc lịch thật, không chỉ nhân với 7.
      const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
      const first = rng.int(0, 6)
      const day = rng.pick([8, 15, 22, 29])
      const m = rng.pick(months)
      return choice(skill, d, {
        prompt: `Ngày 1 tháng ${m.n} là ${weekdays[first]}. Ngày ${day} tháng ${m.n} là thứ mấy?`,
        correct: weekdays[first]!,
        distractors: rng.sample(
          weekdays.filter((_, i) => i !== first),
          3,
        ),
        explanation: `Cứ 7 ngày lại lặp lại thứ cũ: ngày 1, 8, 15, 22, 29 cùng là ${weekdays[first]}.`,
        hint: 'Cộng thêm 7 ngày thì thứ không đổi.',
        rng,
      })
    }
    if (d === 2) {
      const weeks = rng.int(2, 10)
      return numeric(skill, d, {
        prompt: `${weeks} tuần có bao nhiêu ngày?`,
        value: weeks * 7,
        unit: 'ngày',
        explanation: `Mỗi tuần có 7 ngày, nên ${weeks} tuần có ${weeks} × 7 = ${weeks * 7} ngày.`,
      })
    }
    const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
    const startIndex = rng.int(0, 6)
    const after = rng.int(2, 6)
    const endIndex = (startIndex + after) % 7
    return choice(skill, d, {
      prompt: `Hôm nay là ${weekdays[startIndex]}. Hỏi ${after} ngày nữa là thứ mấy?`,
      correct: weekdays[endIndex]!,
      distractors: rng.sample(
        weekdays.filter((_, i) => i !== endIndex),
        3,
      ),
      explanation: `Đếm tiếp ${after} ngày từ ${weekdays[startIndex]} thì đến ${weekdays[endIndex]}.`,
      hint: 'Đếm lần lượt từng ngày trong tuần.',
      rng,
    })
  },
}

export default g3
