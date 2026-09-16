/** Bộ sinh câu hỏi Toán lớp 5. */

import { numeric, type GeneratorMap } from '../factory'

/** Làm tròn tới 2 chữ số thập phân để tránh sai số dấu phẩy động. */
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Hiển thị số thập phân theo kiểu Việt Nam: dùng dấu phẩy. */
function vi(value: number): string {
  return String(round2(value)).replace('.', ',')
}

const g5: GeneratorMap = {
  'math.g5.so-thap-phan': (skill, d, rng) => {
    if (d === 1) {
      const a = round2(rng.int(10, 500) / 10)
      const b = round2(rng.int(10, 500) / 10)
      return numeric(skill, d, {
        prompt: `${vi(a)} + ${vi(b)} = ?  (nhập bằng dấu chấm, ví dụ 3.5)`,
        value: round2(a + b),
        tolerance: 0.001,
        explanation: `Đặt tính thẳng dấu phẩy rồi cộng: ${vi(a)} + ${vi(b)} = ${vi(a + b)}.`,
        hint: 'Viết hai số thẳng dấu phẩy với nhau.',
      })
    }
    if (d === 2) {
      const a = round2(rng.int(105, 9990) / 100)
      const factor = rng.pick([10, 100, 1000])
      return numeric(skill, d, {
        prompt: `${vi(a)} × ${factor} = ?  (nhập bằng dấu chấm)`,
        value: round2(a * factor),
        tolerance: 0.001,
        explanation: `Nhân với ${factor} thì chuyển dấu phẩy sang phải ${String(factor).length - 1} chữ số: ${vi(a)} × ${factor} = ${vi(a * factor)}.`,
        hint: 'Chỉ cần dịch chuyển dấu phẩy.',
      })
    }
    const a = round2(rng.int(11, 99) / 10)
    const b = round2(rng.int(11, 99) / 10)
    return numeric(skill, d, {
      prompt: `${vi(a)} × ${vi(b)} = ?  (nhập bằng dấu chấm)`,
      value: round2(a * b),
      tolerance: 0.011,
      explanation: `Nhân như số tự nhiên rồi đếm tổng số chữ số ở phần thập phân của hai thừa số (1 + 1 = 2) để đặt dấu phẩy: kết quả ${vi(a * b)}.`,
      hint: 'Nhân như số tự nhiên rồi mới đặt dấu phẩy.',
    })
  },

  'math.g5.ti-so-phan-tram': (skill, d, rng) => {
    if (d === 1) {
      const percent = rng.pick([10, 20, 25, 50])
      const base = rng.pick([40, 60, 80, 100, 120, 200])
      return numeric(skill, d, {
        prompt: `${percent}% của ${base} là bao nhiêu?`,
        value: (base * percent) / 100,
        explanation: `${percent}% của ${base} = ${base} × ${percent} : 100 = ${(base * percent) / 100}.`,
        hint: 'Nhân với số phần trăm rồi chia cho 100.',
      })
    }
    if (d === 2) {
      const total = rng.pick([20, 25, 40, 50])
      const part = rng.int(1, total - 1)
      return numeric(skill, d, {
        prompt: `Lớp có ${total} bạn, trong đó ${part} bạn là nữ. Số bạn nữ chiếm bao nhiêu phần trăm cả lớp?`,
        value: round2((part / total) * 100),
        tolerance: 0.011,
        unit: '%',
        explanation: `${part} : ${total} = ${round2(part / total)}, nhân 100 được ${round2((part / total) * 100)}%.`,
        hint: 'Lấy phần chia cho tổng rồi nhân 100.',
      })
    }
    const price = rng.pick([80_000, 120_000, 150_000, 200_000, 250_000])
    const discount = rng.pick([10, 15, 20, 25])
    return numeric(skill, d, {
      prompt: `Một quyển sách giá ${price.toLocaleString('vi-VN')} đồng được giảm giá ${discount}%. Hỏi phải trả bao nhiêu đồng?`,
      value: price - (price * discount) / 100,
      explanation: `Số tiền giảm: ${price.toLocaleString('vi-VN')} × ${discount} : 100 = ${((price * discount) / 100).toLocaleString('vi-VN')} đồng. Phải trả: ${(price - (price * discount) / 100).toLocaleString('vi-VN')} đồng.`,
      hint: 'Tính số tiền được giảm trước, rồi lấy giá gốc trừ đi.',
    })
  },

  'math.g5.dien-tich-nang-cao': (skill, d, rng) => {
    if (d === 1) {
      const base = rng.int(4, 30)
      const height = rng.pick([2, 4, 6, 8, 10, 12])
      return numeric(skill, d, {
        prompt: `Hình tam giác có đáy ${base} cm và chiều cao ${height} cm. Diện tích hình tam giác đó là bao nhiêu xăng-ti-mét vuông?`,
        value: (base * height) / 2,
        unit: 'cm²',
        explanation: `Diện tích tam giác = đáy × cao : 2 = ${base} × ${height} : 2 = ${(base * height) / 2} cm².`,
        hint: 'Nhớ chia đôi ở cuối.',
      })
    }
    if (d === 2) {
      const a = rng.int(4, 20)
      const b = rng.int(a + 2, 30)
      const height = rng.pick([2, 4, 6, 8, 10])
      return numeric(skill, d, {
        prompt: `Hình thang có đáy lớn ${b} cm, đáy bé ${a} cm, chiều cao ${height} cm. Diện tích hình thang đó là bao nhiêu xăng-ti-mét vuông?`,
        value: ((a + b) * height) / 2,
        unit: 'cm²',
        explanation: `Diện tích hình thang = (đáy lớn + đáy bé) × cao : 2 = (${b} + ${a}) × ${height} : 2 = ${((a + b) * height) / 2} cm².`,
        hint: 'Cộng hai đáy trước, rồi nhân chiều cao và chia 2.',
      })
    }
    const radius = rng.int(2, 12)
    return numeric(skill, d, {
      prompt: `Hình tròn có bán kính ${radius} cm. Diện tích hình tròn đó là bao nhiêu xăng-ti-mét vuông? (lấy số pi là 3,14)`,
      value: round2(radius * radius * 3.14),
      tolerance: 0.011,
      unit: 'cm²',
      explanation: `Diện tích hình tròn = r × r × 3,14 = ${radius} × ${radius} × 3,14 = ${vi(radius * radius * 3.14)} cm².`,
      hint: 'Bình phương bán kính trước rồi nhân 3,14.',
    })
  },

  'math.g5.the-tich': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(2, 12)
      const b = rng.int(2, 12)
      const c = rng.int(2, 12)
      return numeric(skill, d, {
        prompt: `Hình hộp chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm, chiều cao ${c} cm. Thể tích hình hộp đó là bao nhiêu xăng-ti-mét khối?`,
        value: a * b * c,
        unit: 'cm³',
        explanation: `Thể tích = dài × rộng × cao = ${a} × ${b} × ${c} = ${a * b * c} cm³.`,
      })
    }
    if (d === 2) {
      const side = rng.int(2, 12)
      return numeric(skill, d, {
        prompt: `Hình lập phương có cạnh ${side} cm. Thể tích hình lập phương đó là bao nhiêu xăng-ti-mét khối?`,
        value: side ** 3,
        unit: 'cm³',
        explanation: `Thể tích hình lập phương = cạnh × cạnh × cạnh = ${side} × ${side} × ${side} = ${side ** 3} cm³.`,
      })
    }
    const a = rng.int(2, 10)
    const b = rng.int(2, 10)
    const c = rng.int(2, 10)
    return numeric(skill, d, {
      prompt: `Một bể nước dạng hình hộp chữ nhật có thể tích ${a * b * c} cm³, chiều dài ${a} cm, chiều rộng ${b} cm. Chiều cao của bể là bao nhiêu xăng-ti-mét?`,
      value: c,
      unit: 'cm',
      explanation: `Chiều cao = thể tích : (dài × rộng) = ${a * b * c} : ${a * b} = ${c} cm.`,
      hint: 'Làm ngược lại công thức thể tích.',
    })
  },

  'math.g5.chuyen-dong-deu': (skill, d, rng) => {
    if (d === 1) {
      const speed = rng.pick([4, 5, 10, 12, 15, 30, 40, 60])
      const hours = rng.int(2, 6)
      return numeric(skill, d, {
        prompt: `Một ô tô đi với vận tốc ${speed} km/giờ trong ${hours} giờ. Ô tô đi được quãng đường bao nhiêu ki-lô-mét?`,
        value: speed * hours,
        unit: 'km',
        explanation: `Quãng đường = vận tốc × thời gian = ${speed} × ${hours} = ${speed * hours} km.`,
        hint: 's = v × t',
      })
    }
    if (d === 2) {
      const speed = rng.pick([5, 10, 12, 15, 20, 30, 40])
      const hours = rng.int(2, 6)
      return numeric(skill, d, {
        prompt: `Một người đi xe đạp được ${speed * hours} km trong ${hours} giờ. Vận tốc của người đó là bao nhiêu ki-lô-mét trên giờ?`,
        value: speed,
        unit: 'km/giờ',
        explanation: `Vận tốc = quãng đường : thời gian = ${speed * hours} : ${hours} = ${speed} km/giờ.`,
        hint: 'v = s : t',
      })
    }
    const speed = rng.pick([4, 5, 10, 12, 15, 20])
    const hours = rng.int(2, 8)
    return numeric(skill, d, {
      prompt: `Một người đi bộ quãng đường ${speed * hours} km với vận tốc ${speed} km/giờ. Người đó đi hết bao nhiêu giờ?`,
      value: hours,
      unit: 'giờ',
      explanation: `Thời gian = quãng đường : vận tốc = ${speed * hours} : ${speed} = ${hours} giờ.`,
      hint: 't = s : v',
    })
  },

  'math.g5.doi-don-vi': (skill, d, rng) => {
    const rows = [
      { from: 'km', to: 'm', factor: 1000 },
      { from: 'm', to: 'cm', factor: 100 },
      { from: 'tấn', to: 'kg', factor: 1000 },
      { from: 'kg', to: 'g', factor: 1000 },
      { from: 'm²', to: 'dm²', factor: 100 },
      { from: 'giờ', to: 'phút', factor: 60 },
    ]
    if (d === 1) {
      const row = rng.pick(rows)
      const n = rng.int(2, 9)
      return numeric(skill, d, {
        prompt: `${n} ${row.from} = ? ${row.to}`,
        value: n * row.factor,
        unit: row.to,
        explanation: `1 ${row.from} = ${row.factor} ${row.to}, nên ${n} ${row.from} = ${(n * row.factor).toLocaleString('vi-VN')} ${row.to}.`,
      })
    }
    if (d === 2) {
      const row = rng.pick(rows)
      const n = rng.int(2, 9)
      return numeric(skill, d, {
        prompt: `${(n * row.factor).toLocaleString('vi-VN')} ${row.to} = ? ${row.from}`,
        value: n,
        unit: row.from,
        explanation: `Đổi ngược lại thì chia cho ${row.factor}: ${(n * row.factor).toLocaleString('vi-VN')} : ${row.factor} = ${n} ${row.from}.`,
        hint: 'Đổi từ đơn vị nhỏ sang đơn vị lớn thì làm phép chia.',
      })
    }
    const row = rng.pick(rows.filter((r) => r.factor >= 100))
    const whole = rng.int(1, 8)
    const part = rng.int(1, 9) * (row.factor / 10)
    return numeric(skill, d, {
      prompt: `${whole} ${row.from} ${part} ${row.to} = ? ${row.to}`,
      value: whole * row.factor + part,
      unit: row.to,
      explanation: `${whole} ${row.from} = ${(whole * row.factor).toLocaleString('vi-VN')} ${row.to}, cộng thêm ${part} ${row.to} được ${(whole * row.factor + part).toLocaleString('vi-VN')} ${row.to}.`,
      hint: 'Đổi phần nguyên trước rồi cộng phần lẻ.',
    })
  },
}

export default g5
