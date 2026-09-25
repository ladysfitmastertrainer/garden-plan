/**
 * Bộ sinh câu hỏi Toán lớp 2.
 *
 * Bám SGK Toán 2 - Kết nối tri thức với cuộc sống (14 chủ đề, 75 bài). Phạm vi
 * số, tên gọi thành phần phép tính và thứ tự nội dung lấy theo sách; câu hỏi là
 * câu mới sinh bằng code. Xem docs/sgk-lop-2.md.
 */

import { choice, numeric, text, type GeneratorMap } from '../factory'

/** Tên gọi quen thuộc dùng trong đề toán có lời văn. */
const HOLDERS = [
  { item: 'cái kẹo', holder: 'hộp' },
  { item: 'bông hoa', holder: 'lọ' },
  { item: 'quyển vở', holder: 'chồng' },
  { item: 'quả cam', holder: 'đĩa' },
  { item: 'con cá', holder: 'bể' },
]

const NAMES = ['Mai', 'Nam', 'Việt', 'Rô-bốt', 'Mi', 'Lan']

const g2: GeneratorMap = {
  // --- Chủ đề 1: Ôn tập và bổ sung ------------------------------------------

  'math.g2.on-so-100': (skill, d, rng) => {
    if (d === 1) {
      const tens = rng.int(2, 9)
      const ones = rng.int(1, 9)
      return numeric(skill, d, {
        prompt: `Số gồm ${tens} chục và ${ones} đơn vị là số nào?`,
        value: tens * 10 + ones,
        explanation: `${tens} chục là ${tens * 10}, thêm ${ones} đơn vị được ${tens * 10 + ones}.`,
        hint: 'Chục viết trước, đơn vị viết sau.',
      })
    }
    if (d === 2) {
      const a = rng.int(11, 99)
      let b = rng.int(11, 99)
      while (b === a) b = rng.int(11, 99)
      return choice(skill, d, {
        prompt: `So sánh ${a} và ${b}. Dấu thích hợp là:`,
        correct: a > b ? '>' : '<',
        distractors: a > b ? ['<', '='] : ['>', '='],
        explanation:
          Math.floor(a / 10) === Math.floor(b / 10)
            ? `Hai số cùng ${Math.floor(a / 10)} chục nên so hàng đơn vị: ${a % 10} và ${b % 10}.`
            : `${a} có ${Math.floor(a / 10)} chục, ${b} có ${Math.floor(b / 10)} chục.`,
        rng,
      })
    }
    // Xếp thứ tự: hỏi số lớn nhất trong ba số khác nhau.
    const values = rng.sample([...Array(89)].map((_, i) => i + 11), 3)
    const max = Math.max(...values)
    return choice(skill, d, {
      prompt: `Trong ba số ${values.join(', ')}, số lớn nhất là:`,
      correct: String(max),
      distractors: values.filter((v) => v !== max).map(String),
      explanation: `So hàng chục trước: ${max} có ${Math.floor(max / 10)} chục, lớn nhất.`,
      rng,
    })
  },

  'math.g2.tia-so': (skill, d, rng) => {
    const n = rng.int(11, 98)
    if (d === 1) {
      return numeric(skill, d, {
        prompt: `Số liền sau của ${n} là số nào?`,
        value: n + 1,
        explanation: `Số liền sau hơn số đã cho 1 đơn vị: ${n} + 1 = ${n + 1}.`,
        hint: 'Đi tới một bước trên tia số.',
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: `Số liền trước của ${n} là số nào?`,
        value: n - 1,
        explanation: `Số liền trước kém số đã cho 1 đơn vị: ${n} - 1 = ${n - 1}.`,
        hint: 'Lùi lại một bước trên tia số.',
      })
    }
    // Điền số còn thiếu giữa dãy trên tia số.
    const start = rng.int(10, 90)
    return numeric(skill, d, {
      prompt: `Trên tia số: ${start} , ${start + 1} , ? , ${start + 3}. Số ở dấu "?" là:`,
      value: start + 2,
      explanation: `Trên tia số các số cách nhau 1 đơn vị nên sau ${start + 1} là ${start + 2}.`,
    })
  },

  'math.g2.thanh-phan-cong-tru': (skill, d, rng) => {
    const a = rng.int(11, 40)
    const b = rng.int(11, 40)
    if (d === 1) {
      return choice(skill, d, {
        prompt: `Trong phép tính ${a} + ${b} = ${a + b}, số ${a + b} gọi là gì?`,
        correct: 'Tổng',
        distractors: ['Số hạng', 'Hiệu', 'Số trừ'],
        explanation: `Trong phép cộng, ${a} và ${b} là các số hạng, ${a + b} là tổng.`,
        rng,
      })
    }
    if (d === 2) {
      const big = a + b
      return choice(skill, d, {
        prompt: `Trong phép tính ${big} - ${b} = ${a}, số ${b} gọi là gì?`,
        correct: 'Số trừ',
        distractors: ['Số bị trừ', 'Hiệu', 'Tổng'],
        explanation: `${big} là số bị trừ, ${b} là số trừ, ${a} là hiệu.`,
        rng,
      })
    }
    // Tìm số hạng chưa biết.
    const sum = a + b
    return numeric(skill, d, {
      prompt: `Tìm số hạng chưa biết: ${a} + ? = ${sum}`,
      value: b,
      explanation: `Muốn tìm số hạng chưa biết, lấy tổng trừ số hạng kia: ${sum} - ${a} = ${b}.`,
      hint: 'Lấy tổng trừ đi số hạng đã biết.',
    })
  },

  'math.g2.hon-kem': (skill, d, rng) => {
    const big = rng.int(20, 90)
    const small = rng.int(5, big - 5)
    const name = rng.pick(NAMES)
    const other = rng.pick(NAMES.filter((n) => n !== name))
    if (d === 1) {
      return numeric(skill, d, {
        prompt: `${big} hơn ${small} bao nhiêu đơn vị?`,
        value: big - small,
        explanation: `Muốn biết hơn bao nhiêu, ta lấy số lớn trừ số bé: ${big} - ${small} = ${big - small}.`,
        hint: 'Số lớn trừ số bé.',
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: `${small} kém ${big} bao nhiêu đơn vị?`,
        value: big - small,
        explanation: `Kém bao nhiêu cũng tính bằng số lớn trừ số bé: ${big} - ${small} = ${big - small}.`,
      })
    }
    return numeric(skill, d, {
      prompt: `${name} có ${big} viên bi, ${other} có ${small} viên bi. Hỏi ${name} có nhiều hơn ${other} bao nhiêu viên bi?`,
      value: big - small,
      explanation: `${big} - ${small} = ${big - small} viên bi.`,
      hint: 'Bài toán "nhiều hơn bao nhiêu" dùng phép trừ.',
    })
  },

  // --- Chủ đề 2: Phép cộng, phép trừ (qua 10) trong phạm vi 20 ---------------

  'math.g2.cong-tru-20': (skill, d, rng) => {
    if (d === 1) {
      // Cộng qua 10: tổng luôn vượt 10 để đúng trọng tâm của chủ đề.
      const a = rng.int(6, 9)
      const b = rng.int(11 - a, 9)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `Tách ${b} thành ${10 - a} và ${b - (10 - a)}: ${a} + ${10 - a} = 10, rồi 10 + ${b - (10 - a)} = ${a + b}.`,
        hint: 'Làm cho tròn 10 trước rồi cộng phần còn lại.',
      })
    }
    if (d === 2) {
      const result = rng.int(2, 9)
      const b = rng.int(11 - result > 9 ? 2 : Math.max(2, 11 - result), 9)
      const a = result + b
      return numeric(skill, d, {
        prompt: `${a} - ${b} = ?`,
        value: result,
        explanation: `Tách ${b} thành ${a - 10} và ${b - (a - 10)}: ${a} - ${a - 10} = 10, rồi 10 - ${b - (a - 10)} = ${result}.`,
        hint: 'Trừ cho về tròn 10 trước.',
      })
    }
    const a = rng.int(5, 9)
    const b = rng.int(5, 9)
    const c = rng.int(1, 5)
    return numeric(skill, d, {
      prompt: `${a} + ${b} - ${c} = ?`,
      value: a + b - c,
      explanation: `Tính từ trái sang phải: ${a} + ${b} = ${a + b}, rồi ${a + b} - ${c} = ${a + b - c}.`,
    })
  },

  'math.g2.bai-toan-them-bot': (skill, d, rng) => {
    const name = rng.pick(NAMES)
    const start = rng.int(8, 45)
    const delta = rng.int(3, 15)
    if (d === 1) {
      return numeric(skill, d, {
        prompt: `${name} có ${start} quyển vở, mẹ cho thêm ${delta} quyển. Hỏi ${name} có tất cả bao nhiêu quyển vở?`,
        value: start + delta,
        explanation: `Thêm vào thì làm tính cộng: ${start} + ${delta} = ${start + delta} quyển.`,
        hint: '"Thêm" nghĩa là cộng.',
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: `Trên cây có ${start + delta} quả, người ta hái ${delta} quả. Hỏi trên cây còn lại bao nhiêu quả?`,
        value: start,
        explanation: `Bớt đi thì làm tính trừ: ${start + delta} - ${delta} = ${start} quả.`,
        hint: '"Hái đi", "bớt đi" nghĩa là trừ.',
      })
    }
    const other = rng.pick(NAMES.filter((n) => n !== name))
    return numeric(skill, d, {
      prompt: `${name} gấp được ${start} ngôi sao. ${other} gấp được nhiều hơn ${name} ${delta} ngôi sao. Hỏi ${other} gấp được bao nhiêu ngôi sao?`,
      value: start + delta,
      explanation: `"Nhiều hơn" thì làm tính cộng: ${start} + ${delta} = ${start + delta} ngôi sao.`,
      hint: 'Bạn kia nhiều hơn nên số của bạn ấy lớn hơn.',
    })
  },

  // --- Chủ đề 3: Ki-lô-gam, lít ---------------------------------------------

  'math.g2.ki-lo-gam-lit': (skill, d, rng) => {
    if (d === 1) {
      /*
        BA DẠNG, không phải một câu cố định.

        Bản trước chỉ có đúng câu "Đơn vị nào dùng để đo cân nặng?", nên chặng
        này hỏi đi hỏi lại y nguyên. Giờ trộn ba dạng - hỏi đơn vị, hỏi đồ vật
        đo bằng gì, so sánh hai vật - và hai dạng sau đổi đồ vật, con số mỗi lần.
      */
      const kind = rng.int(0, 2)
      if (kind === 0) {
        const weight = rng.chance(0.5)
        return choice(skill, d, {
          prompt: weight ? 'Đơn vị nào dùng để đo cân nặng?' : 'Đơn vị nào dùng để đo lượng nước, sữa, dầu ăn?',
          correct: weight ? 'Ki-lô-gam (kg)' : 'Lít (l)',
          distractors: weight ? ['Lít (l)', 'Xăng-ti-mét (cm)', 'Giờ'] : ['Ki-lô-gam (kg)', 'Xăng-ti-mét (cm)', 'Giờ'],
          explanation: 'Ki-lô-gam đo cân nặng, lít đo dung tích (lượng chất lỏng), xăng-ti-mét đo độ dài.',
          rng,
        })
      }
      if (kind === 1) {
        const item = rng.pick([
          { name: 'bao gạo', unit: 'kg' },
          { name: 'túi đường', unit: 'kg' },
          { name: 'quả dưa hấu', unit: 'kg' },
          { name: 'con gà', unit: 'kg' },
          { name: 'can nước', unit: 'l' },
          { name: 'chai dầu ăn', unit: 'l' },
          { name: 'xô nước', unit: 'l' },
          { name: 'hộp sữa tươi', unit: 'l' },
        ])
        return choice(skill, d, {
          prompt: `Muốn biết ${item.name} nặng bao nhiêu hay đựng được bao nhiêu, ta thường dùng đơn vị nào?`,
          correct: item.unit === 'kg' ? 'Ki-lô-gam (kg)' : 'Lít (l)',
          distractors: [item.unit === 'kg' ? 'Lít (l)' : 'Ki-lô-gam (kg)', 'Xăng-ti-mét (cm)', 'Giờ'],
          explanation:
            item.unit === 'kg'
              ? `Ta cân ${item.name} để biết nó nặng bao nhiêu ki-lô-gam.`
              : `${item.name.charAt(0).toUpperCase()}${item.name.slice(1)} đựng chất lỏng nên đo bằng lít.`,
          rng,
        })
      }
      const [first, second] = rng.shuffle(['quả bí', 'quả mít', 'bó rau', 'túi cam', 'con vịt'])
      const a = rng.int(2, 9)
      let b = rng.int(2, 9)
      while (b === a) b = rng.int(2, 9)
      return choice(skill, d, {
        prompt: `${first!.charAt(0).toUpperCase()}${first!.slice(1)} nặng ${a} kg, ${second} nặng ${b} kg. Vật nào nặng hơn?`,
        correct: a > b ? first! : second!,
        distractors: [a > b ? second! : first!, 'Nặng bằng nhau'],
        explanation: `${Math.max(a, b)} kg > ${Math.min(a, b)} kg.`,
        rng,
      })
    }
    if (d === 2) {
      const a = rng.int(3, 25)
      const b = rng.int(3, 25)
      const unit = rng.pick(['kg', 'l'])
      return numeric(skill, d, {
        prompt: `${a} ${unit} + ${b} ${unit} = ? ${unit}`,
        value: a + b,
        explanation: `Cộng hai số đo cùng đơn vị: ${a} + ${b} = ${a + b} ${unit}.`,
        hint: 'Cộng như số bình thường rồi viết lại đơn vị.',
      })
    }
    const each = rng.int(2, 9)
    const cans = rng.int(2, 5)
    return numeric(skill, d, {
      prompt: `Mỗi can đựng ${each} l nước. Hỏi ${cans} can như vậy đựng bao nhiêu lít nước?`,
      value: each * cans,
      explanation: `${each} × ${cans} = ${each * cans} l.`,
      hint: 'Các can bằng nhau nên dùng phép nhân.',
    })
  },

  // --- Chủ đề 4: Phép cộng, phép trừ (có nhớ) trong phạm vi 100 --------------

  'math.g2.cong-tru-100': (skill, d, rng) => {
    if (d === 1) {
      // Cộng số có hai chữ số với số có một chữ số, có nhớ.
      const a = rng.int(15, 88)
      const b = rng.int(10 - (a % 10) + 1 > 9 ? 2 : 10 - (a % 10), 9)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a % 10} + ${b} = ${(a % 10) + b}, viết ${((a % 10) + b) % 10} nhớ 1. Kết quả ${a + b}.`,
        hint: 'Đặt tính rồi cộng từ phải sang trái.',
      })
    }
    if (d === 2) {
      const a = rng.int(16, 59)
      const b = rng.int(16, 99 - a)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a} + ${b} = ${a + b}. Hàng đơn vị vượt quá 10 thì nhớ 1 sang hàng chục.`,
        hint: 'Đặt tính thẳng cột rồi cộng.',
      })
    }
    // Trừ có nhớ: hàng đơn vị của số bị trừ nhỏ hơn của số trừ.
    const aTens = rng.int(3, 9)
    const aOnes = rng.int(0, 4)
    const bTens = rng.int(1, aTens - 2)
    const bOnes = rng.int(aOnes + 1, 9)
    const a = aTens * 10 + aOnes
    const b = bTens * 10 + bOnes
    return numeric(skill, d, {
      prompt: `${a} - ${b} = ?`,
      value: a - b,
      explanation: `${aOnes} không trừ được ${bOnes} nên mượn 1 chục: ${aOnes + 10} - ${bOnes} = ${aOnes + 10 - bOnes}. Kết quả ${a - b}.`,
      hint: 'Không trừ được thì mượn 1 chục.',
    })
  },

  // --- Chủ đề 5: Làm quen với hình phẳng ------------------------------------

  'math.g2.hinh-phang': (skill, d, rng) => {
    /*
      Hai bậc dưới từng là HAI CÂU cố định, mỗi bậc một câu. Giữ lại hai câu khái
      niệm ấy nhưng chỉ còn là một trong vài dạng; các dạng còn lại đổi số đo và
      tên điểm mỗi lần hỏi.
    */
    const [p, q] = rng.shuffle(['A', 'B', 'C', 'D', 'M', 'N'])
    if (d === 1 && rng.chance(0.6)) {
      const a = rng.int(2, 12)
      let b = rng.int(2, 12)
      while (b === a) b = rng.int(2, 12)
      return choice(skill, d, {
        prompt: `Đoạn thẳng ${p}${q} dài ${a} cm, đoạn thẳng CD dài ${b} cm. Đoạn thẳng nào dài hơn?`,
        correct: a > b ? `Đoạn ${p}${q}` : 'Đoạn CD',
        distractors: [a > b ? 'Đoạn CD' : `Đoạn ${p}${q}`, 'Dài bằng nhau'],
        explanation: `${Math.max(a, b)} cm > ${Math.min(a, b)} cm.`,
        rng,
      })
    }
    if (d === 2 && rng.chance(0.6)) {
      const a = rng.int(3, 15)
      const b = rng.int(2, 10)
      return numeric(skill, d, {
        prompt: `Đoạn thẳng ${p}${q} dài ${a} cm. Vẽ kéo dài thêm ${b} cm nữa thì được đoạn thẳng dài bao nhiêu xăng-ti-mét?`,
        value: a + b,
        unit: 'cm',
        explanation: `${a} + ${b} = ${a + b} cm.`,
        hint: 'Kéo dài thêm là cộng thêm.',
      })
    }
    if (d === 1) {
      return choice(skill, d, {
        prompt: 'Đoạn thẳng là hình như thế nào?',
        correct: 'Đường thẳng có hai đầu là hai điểm',
        distractors: [
          'Đường cong nối hai điểm',
          'Đường thẳng kéo dài mãi về hai phía',
          'Ba điểm nằm rời nhau',
        ],
        explanation: 'Đoạn thẳng nối hai điểm và có hai đầu mút rõ ràng.',
        rng,
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Ba điểm thẳng hàng là ba điểm như thế nào?',
        correct: 'Ba điểm cùng nằm trên một đường thẳng',
        distractors: [
          'Ba điểm cách đều nhau',
          'Ba điểm nằm trên một đường cong',
          'Ba điểm tạo thành một hình tam giác',
        ],
        explanation: 'Ba điểm thẳng hàng khi ta đặt thước thì cả ba cùng nằm trên mép thước.',
        rng,
      })
    }
    const points = rng.int(3, 9)
    if (rng.chance(0.5)) {
      // Các đoạn liền nhau dài bằng nhau: ghép đếm đoạn với phép nhân.
      const each = rng.int(2, 5)
      return numeric(skill, d, {
        prompt: `Có ${points} điểm thẳng hàng, hai điểm liền nhau cách nhau ${each} cm. Từ điểm đầu tiên đến điểm cuối cùng dài bao nhiêu xăng-ti-mét?`,
        value: (points - 1) * each,
        unit: 'cm',
        explanation: `${points} điểm tạo ra ${points - 1} đoạn liền nhau, mỗi đoạn ${each} cm: ${each} × ${points - 1} = ${(points - 1) * each} cm.`,
        hint: 'Đếm số đoạn trước - số đoạn ít hơn số điểm một đơn vị.',
      })
    }
    return numeric(skill, d, {
      prompt: `Có ${points} điểm nằm trên một đường thẳng, đánh dấu lần lượt từ trái sang phải. Hỏi có bao nhiêu đoạn thẳng nối hai điểm liền nhau?`,
      value: points - 1,
      explanation: `Giữa ${points} điểm liền nhau có ${points - 1} đoạn thẳng.`,
      hint: 'Số đoạn ít hơn số điểm một đơn vị.',
    })
  },

  'math.g2.duong-gap-khuc': (skill, d, rng) => {
    if (d === 1) {
      const a = rng.int(2, 9)
      const b = rng.int(2, 9)
      return numeric(skill, d, {
        prompt: `Đường gấp khúc ABC gồm hai đoạn: AB dài ${a} cm, BC dài ${b} cm. Độ dài đường gấp khúc ABC là bao nhiêu xăng-ti-mét?`,
        value: a + b,
        explanation: `Cộng độ dài các đoạn: ${a} + ${b} = ${a + b} cm.`,
        hint: 'Cộng tất cả các đoạn lại.',
      })
    }
    if (d === 2) {
      const a = rng.int(3, 12)
      const b = rng.int(3, 12)
      const c = rng.int(3, 12)
      return numeric(skill, d, {
        prompt: `Đường gấp khúc ABCD có AB = ${a} cm, BC = ${b} cm, CD = ${c} cm. Độ dài đường gấp khúc ABCD là bao nhiêu xăng-ti-mét?`,
        value: a + b + c,
        explanation: `${a} + ${b} + ${c} = ${a + b + c} cm.`,
      })
    }
    /*
      Bậc khó từng chỉ có câu tứ giác. Giờ thêm hai bài toán ngược - biết cả
      đường gấp khúc, tìm một đoạn; các đoạn bằng nhau thì dùng phép nhân vừa
      học - và câu tứ giác chỉ còn là một trong ba dạng.
    */
    const kind = rng.int(0, 2)
    if (kind === 0) {
      const a = rng.int(3, 12)
      const b = rng.int(3, 12)
      const c = rng.int(3, 12)
      return numeric(skill, d, {
        prompt: `Đường gấp khúc ABCD dài ${a + b + c} cm. Biết AB = ${a} cm, BC = ${b} cm. Đoạn CD dài bao nhiêu xăng-ti-mét?`,
        value: c,
        unit: 'cm',
        explanation: `${a + b + c} - ${a} - ${b} = ${c} cm.`,
        hint: 'Lấy độ dài cả đường gấp khúc trừ đi các đoạn đã biết.',
      })
    }
    if (kind === 1) {
      const segments = rng.int(2, 5)
      const each = rng.int(2, 9)
      return numeric(skill, d, {
        prompt: `Một đường gấp khúc gồm ${segments} đoạn thẳng, mỗi đoạn dài ${each} cm. Đường gấp khúc đó dài bao nhiêu xăng-ti-mét?`,
        value: segments * each,
        unit: 'cm',
        explanation: `Các đoạn bằng nhau nên lấy ${each} × ${segments} = ${segments * each} cm.`,
        hint: 'Các đoạn dài bằng nhau thì dùng phép nhân.',
      })
    }
    return choice(skill, d, {
      prompt: 'Hình tứ giác là hình có mấy cạnh và mấy đỉnh?',
      correct: '4 cạnh và 4 đỉnh',
      distractors: ['3 cạnh và 3 đỉnh', '4 cạnh và 3 đỉnh', '5 cạnh và 5 đỉnh'],
      explanation: 'Tứ giác có 4 cạnh, 4 đỉnh - ví dụ hình vuông và hình chữ nhật.',
      rng,
    })
  },

  // --- Chủ đề 6: Ngày - giờ, giờ - phút, ngày - tháng -----------------------

  'math.g2.ngay-gio-thang': (skill, d, rng) => {
    if (d === 1) {
      const hour = rng.int(1, 12)
      const half = rng.chance(0.5)
      return choice(skill, d, {
        prompt: `Đồng hồ chỉ ${hour} giờ ${half ? '30 phút' : 'đúng'}. Cách đọc khác là:`,
        correct: half ? `${hour} giờ rưỡi` : `${hour} giờ`,
        distractors: half
          ? [`${hour} giờ 15 phút`, `${hour} giờ kém`, `${hour + 1} giờ rưỡi`]
          : [`${hour} giờ rưỡi`, `${hour} giờ 30 phút`, `${hour} giờ 15 phút`],
        explanation: half
          ? '30 phút là nửa giờ nên còn gọi là "giờ rưỡi".'
          : 'Kim phút chỉ số 12 thì đọc là giờ đúng.',
        rng,
      })
    }
    if (d === 2) {
      // Giờ chiều tối trên đồng hồ điện tử: 13-23 giờ.
      const h24 = rng.int(13, 23)
      return choice(skill, d, {
        prompt: `Đồng hồ điện tử chỉ ${h24}:00. Giờ đó là mấy giờ chiều hoặc tối?`,
        correct: `${h24 - 12} giờ ${h24 - 12 >= 6 ? 'tối' : 'chiều'}`,
        distractors: [
          `${h24 - 12} giờ sáng`,
          `${h24 >= 22 ? h24 - 13 : h24 - 11} giờ ${h24 - 12 >= 6 ? 'tối' : 'chiều'}`,
          `${h24} giờ sáng`,
        ],
        explanation: `${h24} giờ trừ đi 12 được ${h24 - 12} giờ.`,
        rng,
      })
    }
    const month = rng.int(1, 12)
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!
    return numeric(skill, d, {
      prompt: `Tháng ${month} có bao nhiêu ngày?`,
      value: days,
      explanation:
        month === 2
          ? 'Tháng 2 có 28 ngày (năm nhuận thì có 29 ngày).'
          : `Tháng ${month} có ${days} ngày.`,
      hint: 'Đếm bằng các đốt ngón tay: đốt nổi 31 ngày, khe lõm 30 ngày.',
    })
  },

  // --- Chủ đề 8: Phép nhân, phép chia ---------------------------------------

  'math.g2.nhan-2-5': (skill, d, rng) => {
    if (d === 1) {
      const factor = rng.pick([2, 5])
      const n = rng.int(1, 10)
      return numeric(skill, d, {
        prompt: `${factor} × ${n} = ?`,
        value: factor * n,
        explanation: `${factor} × ${n} nghĩa là ${factor} được lấy ${n} lần, bằng ${factor * n}.`,
        hint: factor === 2 ? 'Nhân 2 chính là gấp đôi.' : 'Kết quả bảng nhân 5 tận cùng là 0 hoặc 5.',
      })
    }
    if (d === 2) {
      const factor = rng.pick([2, 5])
      const n = rng.int(2, 9)
      return choice(skill, d, {
        prompt: `Trong phép nhân ${factor} × ${n} = ${factor * n}, số ${factor * n} gọi là gì?`,
        correct: 'Tích',
        distractors: ['Thừa số', 'Tổng', 'Thương'],
        explanation: `${factor} và ${n} là các thừa số, ${factor * n} là tích.`,
        rng,
      })
    }
    const factor = rng.pick([2, 5])
    const groups = rng.int(3, 9)
    const noun = rng.pick(HOLDERS)
    return numeric(skill, d, {
      prompt: `Mỗi ${noun.holder} có ${factor} ${noun.item}. Hỏi ${groups} ${noun.holder} có tất cả bao nhiêu ${noun.item}?`,
      value: factor * groups,
      explanation: `${factor} × ${groups} = ${factor * groups} ${noun.item}.`,
      hint: 'Các nhóm bằng nhau thì dùng phép nhân.',
    })
  },

  'math.g2.chia-2-5': (skill, d, rng) => {
    const divisor = rng.pick([2, 5])
    const quotient = rng.int(1, 10)
    const dividend = divisor * quotient
    if (d === 1) {
      return numeric(skill, d, {
        prompt: `${dividend} : ${divisor} = ?`,
        value: quotient,
        explanation: `${dividend} : ${divisor} = ${quotient}, vì ${divisor} × ${quotient} = ${dividend}.`,
        hint: 'Nhớ lại bảng nhân tương ứng.',
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: `Trong phép chia ${dividend} : ${divisor} = ${quotient}, số ${quotient} gọi là gì?`,
        correct: 'Thương',
        distractors: ['Số bị chia', 'Số chia', 'Tích'],
        explanation: `${dividend} là số bị chia, ${divisor} là số chia, ${quotient} là thương.`,
        rng,
      })
    }
    const noun = rng.pick(HOLDERS)
    return numeric(skill, d, {
      prompt: `Có ${dividend} ${noun.item} chia đều vào ${divisor} ${noun.holder}. Hỏi mỗi ${noun.holder} có bao nhiêu ${noun.item}?`,
      value: quotient,
      explanation: `${dividend} : ${divisor} = ${quotient} ${noun.item}.`,
      hint: '"Chia đều" thì dùng phép chia.',
    })
  },

  // --- Chủ đề 9: Hình khối ---------------------------------------------------

  'math.g2.khoi-tru-cau': (skill, d, rng) => {
    /*
      Đồ vật quen thuộc, đủ cả hai khối. Bậc dễ và bậc vừa từng chỉ có đúng một
      câu mỗi bậc ("quả bóng", "lon sữa") - giờ bốc từ danh sách này.
    */
    const everyday = [
      { name: 'quả bóng', shape: 'Khối cầu' },
      { name: 'quả cam', shape: 'Khối cầu' },
      { name: 'hòn bi', shape: 'Khối cầu' },
      { name: 'quả bưởi', shape: 'Khối cầu' },
      { name: 'lon sữa', shape: 'Khối trụ' },
      { name: 'lon nước ngọt', shape: 'Khối trụ' },
      { name: 'cái trống', shape: 'Khối trụ' },
      { name: 'ống nước', shape: 'Khối trụ' },
      { name: 'hộp bánh tròn', shape: 'Khối trụ' },
    ]
    if (d === 1) {
      const item = rng.pick(everyday)
      return choice(skill, d, {
        prompt: `${item.name.charAt(0).toUpperCase()}${item.name.slice(1)} có dạng khối gì?`,
        correct: item.shape,
        distractors: ['Khối cầu', 'Khối trụ', 'Khối lập phương', 'Khối hộp chữ nhật'].filter((s) => s !== item.shape),
        explanation:
          item.shape === 'Khối cầu'
            ? `${item.name.charAt(0).toUpperCase()}${item.name.slice(1)} tròn đều về mọi phía nên có dạng khối cầu.`
            : `${item.name.charAt(0).toUpperCase()}${item.name.slice(1)} có hai mặt tròn bằng nhau ở hai đầu nên là khối trụ.`,
        rng,
      })
    }
    if (d === 2) {
      // Đếm trong một nhóm đồ vật: phải nhận ra từng cái chứ không chỉ một cái.
      const group = rng.shuffle(everyday).slice(0, rng.int(4, 5))
      const target = rng.pick(['Khối cầu', 'Khối trụ'])
      const count = group.filter((g) => g.shape === target).length
      return numeric(skill, d, {
        prompt: `Trong các đồ vật: ${group.map((g) => g.name).join(', ')}. Có mấy đồ vật dạng ${target.toLowerCase()}?`,
        value: count,
        explanation: `Các đồ vật dạng ${target.toLowerCase()}: ${group.filter((g) => g.shape === target).map((g) => g.name).join(', ') || 'không có'}.`,
        hint: 'Xét lần lượt từng đồ vật.',
      })
    }
    const item = rng.pick([
      { name: 'viên bi', shape: 'Khối cầu' },
      { name: 'cây bút chì tròn', shape: 'Khối trụ' },
      { name: 'quả địa cầu', shape: 'Khối cầu' },
      { name: 'cuộn giấy vệ sinh', shape: 'Khối trụ' },
      { name: 'quả bóng bàn', shape: 'Khối cầu' },
      { name: 'cây nến tròn', shape: 'Khối trụ' },
      { name: 'khúc gỗ tròn', shape: 'Khối trụ' },
      { name: 'viên kẹo tròn', shape: 'Khối cầu' },
    ])
    if (rng.chance(0.5)) {
      // Tìm vật KHÁC LOẠI giữa ba vật cùng khối: phải xét cả bốn chứ không chỉ một.
      const odd = rng.pick(['Khối cầu', 'Khối trụ'])
      const same = odd === 'Khối cầu' ? 'Khối trụ' : 'Khối cầu'
      const oddItem = rng.pick(everyday.filter((e) => e.shape === odd))
      const others = rng.sample(everyday.filter((e) => e.shape === same), 3)
      return choice(skill, d, {
        prompt: `Vật nào có dạng ${odd.toLowerCase()}?`,
        correct: oddItem.name,
        distractors: others.map((o) => o.name),
        explanation: `${oddItem.name.charAt(0).toUpperCase()}${oddItem.name.slice(1)} có dạng ${odd.toLowerCase()}; các vật còn lại có dạng ${same.toLowerCase()}.`,
        rng,
      })
    }
    return choice(skill, d, {
      prompt: `${item.name.charAt(0).toUpperCase()}${item.name.slice(1)} có dạng khối gì?`,
      correct: item.shape,
      distractors: ['Khối cầu', 'Khối trụ', 'Khối lập phương'].filter((s) => s !== item.shape),
      explanation:
        item.shape === 'Khối cầu'
          ? 'Lăn được về mọi phía thì là khối cầu.'
          : 'Có hai mặt tròn bằng nhau ở hai đầu thì là khối trụ.',
      rng,
    })
  },

  // --- Chủ đề 10: Các số trong phạm vi 1000 ----------------------------------

  'math.g2.so-1000': (skill, d, rng) => {
    const hundreds = rng.int(1, 9)
    const tens = rng.int(0, 9)
    const ones = rng.int(0, 9)
    const value = hundreds * 100 + tens * 10 + ones
    if (d === 1) {
      return numeric(skill, d, {
        prompt: `Số gồm ${hundreds} trăm, ${tens} chục và ${ones} đơn vị là số nào?`,
        value,
        explanation: `${hundreds} trăm = ${hundreds * 100}, ${tens} chục = ${tens * 10}, thêm ${ones} đơn vị được ${value}.`,
        hint: 'Trăm viết trước, rồi chục, rồi đơn vị.',
      })
    }
    if (d === 2) {
      return text(skill, d, {
        prompt: `Viết số ${value} thành tổng các trăm, chục, đơn vị.`,
        accepted: [
          `${hundreds * 100} + ${tens * 10} + ${ones}`,
          `${hundreds * 100}+${tens * 10}+${ones}`,
        ],
        explanation: `${value} = ${hundreds * 100} + ${tens * 10} + ${ones}.`,
        hint: 'Viết theo mẫu: trăm + chục + đơn vị.',
      })
    }
    let other = rng.int(100, 999)
    while (other === value) other = rng.int(100, 999)
    return choice(skill, d, {
      prompt: `So sánh ${value} và ${other}. Dấu thích hợp là:`,
      correct: value > other ? '>' : '<',
      distractors: value > other ? ['<', '='] : ['>', '='],
      explanation:
        Math.floor(value / 100) === Math.floor(other / 100)
          ? 'Cùng số trăm thì so tiếp hàng chục, rồi hàng đơn vị.'
          : `${value} có ${Math.floor(value / 100)} trăm, ${other} có ${Math.floor(other / 100)} trăm.`,
      rng,
    })
  },

  // --- Chủ đề 11: Độ dài và tiền Việt Nam ------------------------------------

  'math.g2.do-dai-tien': (skill, d, rng) => {
    if (d === 1) {
      // Hai chiều đổi, không chỉ dm ra cm: dạng một chiều với tám con số thì
      // chặng này chỉ có tám câu.
      const dm = rng.int(1, 9)
      if (rng.chance(0.5)) {
        return numeric(skill, d, {
          prompt: `${dm * 10} cm = ? dm`,
          value: dm,
          unit: 'dm',
          explanation: `10 cm = 1 dm nên ${dm * 10} cm = ${dm} dm.`,
          hint: 'Cứ 10 xăng-ti-mét là 1 đề-xi-mét.',
        })
      }
      return numeric(skill, d, {
        prompt: `${dm} dm = ? cm`,
        value: dm * 10,
        explanation: `1 dm = 10 cm nên ${dm} dm = ${dm * 10} cm.`,
        hint: '1 đề-xi-mét bằng 10 xăng-ti-mét.',
      })
    }
    if (d === 2) {
      const m = rng.int(2, 9)
      const unit = rng.pick(['dm', 'cm'])
      return numeric(skill, d, {
        prompt: `${m} m = ? ${unit}`,
        value: unit === 'dm' ? m * 10 : m * 100,
        explanation:
          unit === 'dm'
            ? `1 m = 10 dm nên ${m} m = ${m * 10} dm.`
            : `1 m = 100 cm nên ${m} m = ${m * 100} cm.`,
        hint: '1 m = 10 dm = 100 cm.',
      })
    }
    const notes = rng.sample([1000, 2000, 5000, 10000, 20000], 2)
    const total = notes[0]! + notes[1]!
    return numeric(skill, d, {
      prompt: `Mai có một tờ ${notes[0]!.toLocaleString('vi-VN')} đồng và một tờ ${notes[1]!.toLocaleString('vi-VN')} đồng. Hỏi Mai có tất cả bao nhiêu đồng?`,
      value: total,
      explanation: `${notes[0]} + ${notes[1]} = ${total} đồng.`,
      hint: 'Cộng giá trị hai tờ tiền lại.',
    })
  },

  // --- Chủ đề 12: Phép cộng, phép trừ trong phạm vi 1000 --------------------

  'math.g2.cong-tru-1000': (skill, d, rng) => {
    if (d === 1) {
      // Không nhớ: mỗi hàng cộng lại đều nhỏ hơn 10.
      const a = rng.int(1, 4) * 100 + rng.int(0, 4) * 10 + rng.int(0, 4)
      const b = rng.int(1, 4) * 100 + rng.int(0, 4) * 10 + rng.int(0, 4)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `Cộng từ phải sang trái: đơn vị, chục, rồi trăm. Kết quả ${a + b}.`,
        hint: 'Đặt tính thẳng cột trăm - chục - đơn vị.',
      })
    }
    if (d === 2) {
      const a = rng.int(120, 480)
      const b = rng.int(120, 999 - a)
      return numeric(skill, d, {
        prompt: `${a} + ${b} = ?`,
        value: a + b,
        explanation: `${a} + ${b} = ${a + b}. Hàng nào vượt quá 10 thì nhớ 1 sang hàng bên trái.`,
      })
    }
    const a = rng.int(320, 980)
    const b = rng.int(105, a - 100)
    return numeric(skill, d, {
      prompt: `${a} - ${b} = ?`,
      value: a - b,
      explanation: `${a} - ${b} = ${a - b}. Hàng nào không trừ được thì mượn 1 ở hàng bên trái.`,
      hint: 'Đặt tính rồi trừ từ phải sang trái.',
    })
  },

  // --- Chủ đề 13: Thống kê, xác suất -----------------------------------------

  'math.g2.thong-ke-xac-suat': (skill, d, rng) => {
    if (d === 1) {
      const red = rng.int(3, 9)
      const blue = rng.int(3, 9)
      const yellow = rng.int(3, 9)
      return numeric(skill, d, {
        prompt: `Kiểm đếm được ${red} bóng đỏ, ${blue} bóng xanh và ${yellow} bóng vàng. Hỏi có tất cả bao nhiêu quả bóng?`,
        value: red + blue + yellow,
        explanation: `${red} + ${blue} + ${yellow} = ${red + blue + yellow} quả bóng.`,
        hint: 'Cộng số lượng của cả ba loại.',
      })
    }
    if (d === 2) {
      const a = rng.int(4, 12)
      let b = rng.int(4, 12)
      while (b === a) b = rng.int(4, 12)
      return numeric(skill, d, {
        prompt: `Biểu đồ tranh cho biết tổ Một trồng ${a} cây, tổ Hai trồng ${b} cây. Hỏi tổ trồng nhiều hơn đã trồng hơn tổ kia bao nhiêu cây?`,
        value: Math.abs(a - b),
        explanation: `${Math.max(a, b)} - ${Math.min(a, b)} = ${Math.abs(a - b)} cây.`,
        hint: 'Lấy số lớn trừ số bé.',
      })
    }
    /*
      Chắc chắn - có thể - không thể.

      Bản trước chỉ có ba câu viết sẵn, đều về bóng đỏ, bóng xanh. Giờ đồ vật,
      đồ đựng và hai màu đổi mỗi lần, còn ba tình huống thì giữ nguyên - đó mới
      là thứ trẻ cần hiểu.
    */
    const thing = rng.pick([
      { item: 'quả bóng', box: 'hộp' },
      { item: 'viên bi', box: 'túi' },
      { item: 'cái kẹo', box: 'lọ' },
      { item: 'bông hoa', box: 'giỏ' },
    ])
    const [have, other] = rng.shuffle(['đỏ', 'xanh', 'vàng', 'trắng', 'tím'])
    const Box = `${thing.box.charAt(0).toUpperCase()}${thing.box.slice(1)}`
    const question = rng.pick([
      {
        prompt: `${Box} chỉ có ${thing.item} màu ${have}. Lấy ra một ${thing.item} bất kì, nó có màu ${have}. Điều này là:`,
        correct: 'Chắc chắn',
        explanation: `${Box} chỉ có ${thing.item} màu ${have} nên lấy cái nào cũng màu ${have}.`,
      },
      {
        prompt: `${Box} chỉ có ${thing.item} màu ${have}. Lấy ra một ${thing.item} bất kì, nó có màu ${other}. Điều này là:`,
        correct: 'Không thể',
        explanation: `Trong ${thing.box} không có ${thing.item} màu ${other} nào nên không thể lấy được.`,
      },
      {
        prompt: `${Box} có cả ${thing.item} màu ${have} và màu ${other}. Lấy ra một ${thing.item} bất kì, nó có màu ${have}. Điều này là:`,
        correct: 'Có thể',
        explanation: `${Box} có cả hai màu nên ${thing.item} lấy ra có thể màu ${have}, cũng có thể màu ${other}.`,
      },
    ])
    return choice(skill, d, {
      prompt: question.prompt,
      correct: question.correct,
      distractors: ['Chắc chắn', 'Có thể', 'Không thể'].filter((x) => x !== question.correct),
      explanation: question.explanation,
      rng,
    })
  },
}

export default g2
