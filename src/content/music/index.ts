/**
 * Bộ sinh câu hỏi Âm nhạc lớp 1-5.
 *
 * Âm thanh được MÔ TẢ chứ không phải thu sẵn: generator trả về `AudioSpec`,
 * lớp `src/audio` tổng hợp bằng Web Audio lúc chạy. Nhờ vậy bài nghe sinh ra
 * vô hạn, chạy offline và không vướng bản quyền thu âm.
 */

import { audioChoice, choice, numeric, pairs, rhythmTap, type GeneratorMap } from '../factory'
import type { NoteName } from '../types'
import musicG2 from './g2'

/** Tên nốt tiếng Việt ứng với ký hiệu quốc tế. */
const SOLFEGE: Array<{ vi: string; note: NoteName; latin: string }> = [
  { vi: 'Đô', note: 'C4', latin: 'C' },
  { vi: 'Rê', note: 'D4', latin: 'D' },
  { vi: 'Mi', note: 'E4', latin: 'E' },
  { vi: 'Pha', note: 'F4', latin: 'F' },
  { vi: 'Son', note: 'G4', latin: 'G' },
  { vi: 'La', note: 'A4', latin: 'A' },
  { vi: 'Si', note: 'B4', latin: 'B' },
]

const FIVE_NOTES = SOLFEGE.slice(0, 5)

const music: GeneratorMap = {
  // --- Lớp 1 ---------------------------------------------------------------

  'music.g1.cao-thap': (skill, d, rng) => {
    if (d === 3) {
      const ascending = rng.chance(0.5)
      const notes: NoteName[] = ascending ? ['C4', 'E4', 'G4'] : ['G4', 'E4', 'C4']
      return audioChoice(skill, d, {
        prompt: 'Nghe ba nốt nhạc. Các nốt đi lên cao dần hay xuống thấp dần?',
        audio: { kind: 'tone', notes, tempo: 80 },
        correct: ascending ? 'Đi lên cao dần' : 'Đi xuống thấp dần',
        distractors: ['Đi lên cao dần', 'Đi xuống thấp dần', 'Cả ba nốt bằng nhau'],
        explanation: ascending
          ? 'Ba nốt Đô - Mi - Son đi lên cao dần.'
          : 'Ba nốt Son - Mi - Đô đi xuống thấp dần.',
        rng,
      })
    }
    const gap = d === 1 ? 7 : 2 // quãng rộng dễ nghe hơn quãng hẹp
    const lowIndex = rng.int(0, 6 - Math.min(gap, 4))
    const low = SOLFEGE[lowIndex]!.note
    const high = gap >= 7 ? 'C5' : SOLFEGE[Math.min(6, lowIndex + gap)]!.note
    const higherFirst = rng.chance(0.5)
    return audioChoice(skill, d, {
      prompt: 'Nghe hai nốt nhạc. Nốt thứ hai cao hơn hay thấp hơn nốt thứ nhất?',
      audio: { kind: 'tone', notes: higherFirst ? [high, low] : [low, high], tempo: 70 },
      correct: higherFirst ? 'Thấp hơn' : 'Cao hơn',
      distractors: ['Cao hơn', 'Thấp hơn', 'Bằng nhau'],
      explanation: higherFirst
        ? 'Nốt thứ hai trầm hơn nên thấp hơn nốt thứ nhất.'
        : 'Nốt thứ hai nghe bổng hơn nên cao hơn nốt thứ nhất.',
      hint: 'Âm thanh bổng là cao, âm thanh trầm là thấp.',
      rng,
    })
  },

  'music.g1.to-nho': (skill, d, rng) => {
    if (d === 3) {
      return choice(skill, d, {
        prompt: 'Tiếng nào dưới đây thường to nhất?',
        correct: 'Tiếng trống trường',
        distractors: ['Tiếng lá rơi', 'Tiếng thì thầm', 'Tiếng bút viết'],
        explanation: 'Tiếng trống trường vang rất to, còn lá rơi hay thì thầm thì rất nhỏ.',
        rng,
      })
    }
    const loudFirst = rng.chance(0.5)
    const note = rng.pick(FIVE_NOTES).note
    return audioChoice(skill, d, {
      prompt: 'Nghe hai tiếng đàn. Tiếng thứ hai to hơn hay nhỏ hơn tiếng thứ nhất?',
      audio: {
        kind: 'tone',
        notes: [note, note],
        tempo: 70,
        gains: loudFirst ? [0.85, 0.2] : [0.2, 0.85],
      },
      correct: loudFirst ? 'Nhỏ hơn' : 'To hơn',
      distractors: ['To hơn', 'Nhỏ hơn', 'Bằng nhau'],
      explanation: loudFirst
        ? 'Tiếng thứ hai nhẹ hơn nên nhỏ hơn.'
        : 'Tiếng thứ hai mạnh hơn nên to hơn.',
      hint: 'Hai nốt cùng cao độ, chỉ khác cường độ.',
      rng,
    })
  },

  'music.g1.nhanh-cham': (skill, d, rng) => {
    if (d === 3) {
      return choice(skill, d, {
        prompt: 'Bài hát ru em bé thường có nhịp độ thế nào?',
        correct: 'Chậm và êm dịu',
        distractors: ['Rất nhanh và mạnh mẽ', 'Nhanh dần rồi dừng đột ngột', 'Lúc nhanh lúc chậm liên tục'],
        explanation: 'Hát ru cần chậm và êm để em bé dễ ngủ.',
        rng,
      })
    }
    const fast = rng.chance(0.5)
    const tempo = fast ? 160 : 55
    return audioChoice(skill, d, {
      prompt: 'Nghe đoạn nhạc. Đoạn nhạc này nhanh hay chậm?',
      audio: { kind: 'tone', notes: ['C4', 'D4', 'E4', 'D4', 'C4'], tempo },
      correct: fast ? 'Nhanh' : 'Chậm',
      distractors: ['Nhanh', 'Chậm'],
      explanation: fast
        ? 'Các nốt nối nhau rất gấp nên đoạn nhạc nhanh.'
        : 'Các nốt ngân dài và thưa nên đoạn nhạc chậm.',
      rng,
    })
  },

  'music.g1.nhac-cu-quen-thuoc': (skill, d, rng) => {
    const instruments = [
      { name: 'Trống', emoji: '🥁', desc: 'gõ bằng dùi, tiếng vang và trầm' },
      { name: 'Thanh phách', emoji: '🎋', desc: 'hai thanh tre gõ vào nhau, tiếng lách cách' },
      { name: 'Thanh la', emoji: '🔔', desc: 'đĩa kim loại, tiếng ngân vang' },
      { name: 'Song loan', emoji: '🪘', desc: 'gõ bằng chân, giữ nhịp cho hát' },
    ]
    if (d === 1) {
      const target = rng.pick(instruments)
      return choice(skill, d, {
        prompt: `Nhạc cụ nào ${target.desc}?`,
        correct: { id: 'c0', label: target.name, image: target.emoji },
        distractors: instruments
          .filter((i) => i.name !== target.name)
          .map((i) => ({ id: `d-${i.name}`, label: i.name, image: i.emoji })),
        explanation: `${target.name} ${target.emoji}: ${target.desc}.`,
        rng,
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Nhạc cụ nào được gõ bằng dùi?',
        correct: 'Trống',
        distractors: ['Sáo', 'Đàn tranh', 'Kèn'],
        explanation: 'Trống là nhạc cụ gõ, dùng dùi để gõ vào mặt trống.',
        rng,
      })
    }
    return pairs(skill, d, {
      prompt: 'Nối nhạc cụ với cách chơi',
      pairs: [
        ['Trống', 'Gõ bằng dùi'],
        ['Sáo', 'Thổi bằng hơi'],
        ['Đàn tranh', 'Gảy bằng ngón tay'],
      ],
      explanation: 'Trống thì gõ, sáo thì thổi, đàn tranh thì gảy dây.',
      rng,
    })
  },

  'music.g1.van-dong-theo-nhac': (skill, d) => {
    const patterns: number[][] = [[1, 1], [1, 1, 1, 1], [1, 1, 2]]
    const pattern = patterns[Math.min(d - 1, patterns.length - 1)]!
    return rhythmTap(skill, d, {
      prompt: 'Nghe rồi vỗ tay lại đúng như vậy',
      audio: { kind: 'rhythm', pattern, tempo: d === 1 ? 60 : 80 },
      toleranceMs: d === 1 ? 350 : 280,
      explanation: `Tiết tấu gồm ${pattern.length} tiếng, tiếng cuối ngân dài ${pattern[pattern.length - 1]} phách.`,
      hint: 'Nghe hết rồi mới vỗ, giữ đều tay.',
    })
  },

  // --- Lớp 2 ---------------------------------------------------------------

  'music.g2.not-do-re-mi-pha-son': (skill, d, rng) => {
    if (d === 3) {
      return pairs(skill, d, {
        prompt: 'Nối tên nốt tiếng Việt với ký hiệu quốc tế',
        pairs: rng.sample(FIVE_NOTES, 3).map((n) => [n.vi, n.latin] as [string, string]),
        explanation: 'Đô là C, Rê là D, Mi là E, Pha là F, Son là G.',
        rng,
      })
    }
    const pool = d === 1 ? FIVE_NOTES.slice(0, 3) : FIVE_NOTES
    const target = rng.pick(pool)
    return audioChoice(skill, d, {
      prompt: 'Nghe và cho biết đây là nốt nào?',
      audio: { kind: 'tone', notes: ['C4', target.note], tempo: 65 },
      correct: target.vi,
      distractors: pool.filter((n) => n.vi !== target.vi).map((n) => n.vi),
      explanation: `Nốt đầu tiên là Đô làm mốc, nốt thứ hai là ${target.vi}.`,
      hint: 'Nốt Đô được phát trước để làm mốc so sánh.',
      rng,
    })
  },

  'music.g2.nhip-2-4': (skill, d, rng) => {
    if (d === 1) {
      return numeric(skill, d, {
        prompt: 'Nhịp 2/4 có mấy phách trong một ô nhịp?',
        value: 2,
        unit: 'phách',
        explanation: 'Số 2 ở trên cho biết mỗi ô nhịp có 2 phách.',
        hint: 'Nhìn con số ở phía trên của 2/4.',
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Trong nhịp 2/4, phách nào là phách mạnh?',
        correct: 'Phách thứ nhất',
        distractors: ['Phách thứ hai', 'Cả hai phách đều mạnh', 'Không phách nào mạnh'],
        explanation: 'Nhịp 2/4 có phách 1 mạnh, phách 2 nhẹ.',
        rng,
      })
    }
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại tiết tấu nhịp 2/4 vừa nghe',
      audio: { kind: 'rhythm', pattern: [1, 1, 1, 1], tempo: 90 },
      explanation: 'Bốn tiếng đều nhau, mỗi tiếng một phách - đủ hai ô nhịp 2/4.',
    })
  },

  'music.g2.hinh-tiet-tau': (skill, d) => {
    const pattern = d === 1 ? [1, 1, 2] : d === 2 ? [2, 1, 1] : [1, 1, 1, 1, 2]
    return rhythmTap(skill, d, {
      prompt: 'Vỗ tay lại đúng tiết tấu vừa nghe',
      audio: { kind: 'rhythm', pattern, tempo: 80 },
      toleranceMs: 300,
      explanation: `Tiết tấu có ${pattern.length} tiếng với trường độ ${pattern.join(' - ')} phách.`,
      hint: 'Đếm thầm 1 - 2 đều đặn trong đầu.',
    })
  },

  'music.g2.hat-dung-giai-dieu': (skill, d, rng) => {
    if (d === 3) {
      return choice(skill, d, {
        prompt: 'Khi hát cùng cả lớp, con nên làm gì để hát đúng?',
        correct: 'Nghe bạn bên cạnh và hát vừa phải, đúng nhịp',
        distractors: ['Hát thật to át tiếng các bạn', 'Hát nhanh hơn các bạn cho xong', 'Hát nhỏ đến mức không ai nghe'],
        explanation: 'Hát tập thể cần lắng nghe nhau để hoà giọng và đúng nhịp.',
        rng,
      })
    }
    const melodies: Array<{ notes: NoteName[]; label: string }> = [
      { notes: ['C4', 'D4', 'E4', 'C4'], label: 'Đô - Rê - Mi - Đô' },
      { notes: ['E4', 'D4', 'C4', 'D4'], label: 'Mi - Rê - Đô - Rê' },
      { notes: ['G4', 'E4', 'C4', 'E4'], label: 'Son - Mi - Đô - Mi' },
    ]
    const target = rng.pick(melodies)
    return audioChoice(skill, d, {
      prompt: 'Nghe giai điệu rồi chọn đúng thứ tự các nốt',
      audio: { kind: 'tone', notes: target.notes, tempo: 75 },
      correct: target.label,
      distractors: melodies.filter((m) => m.label !== target.label).map((m) => m.label),
      explanation: `Giai điệu vừa nghe là ${target.label}.`,
      hint: 'Chú ý nốt nào cao, nốt nào thấp.',
      rng,
    })
  },

  // --- Lớp 3 ---------------------------------------------------------------

  'music.g3.khuong-nhac-khoa-son': (skill, d, rng) => {
    if (d === 1) {
      return numeric(skill, d, {
        prompt: 'Khuông nhạc có mấy dòng kẻ?',
        value: 5,
        unit: 'dòng',
        explanation: 'Khuông nhạc gồm 5 dòng kẻ song song và 4 khe ở giữa.',
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: 'Khuông nhạc có mấy khe?',
        value: 4,
        unit: 'khe',
        explanation: 'Giữa 5 dòng kẻ có 4 khe.',
        hint: 'Số khe luôn ít hơn số dòng một đơn vị.',
      })
    }
    return choice(skill, d, {
      prompt: 'Khoá Son được đặt ở đâu trên khuông nhạc?',
      correct: 'Ở đầu khuông nhạc, xoắn quanh dòng kẻ thứ hai',
      distractors: [
        'Ở cuối khuông nhạc, trên dòng kẻ thứ năm',
        'Ở giữa khuông nhạc, trên dòng kẻ thứ ba',
        'Ở đầu khuông nhạc, dưới dòng kẻ thứ nhất',
      ],
      explanation: 'Khoá Son đặt đầu khuông, vòng xoắn ôm lấy dòng kẻ thứ hai - nơi ghi nốt Son.',
      rng,
    })
  },

  'music.g3.not-den-trang-tron': (skill, d, rng) => {
    if (d === 1) {
      return numeric(skill, d, {
        prompt: 'Một nốt trắng bằng mấy nốt đen?',
        value: 2,
        unit: 'nốt đen',
        explanation: 'Nốt trắng ngân 2 phách, nốt đen ngân 1 phách, nên 1 nốt trắng = 2 nốt đen.',
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: 'Một nốt tròn bằng mấy nốt đen?',
        value: 4,
        unit: 'nốt đen',
        explanation: 'Nốt tròn ngân 4 phách, nốt đen ngân 1 phách, nên 1 nốt tròn = 4 nốt đen.',
        hint: 'Nốt tròn = 2 nốt trắng = 4 nốt đen.',
      })
    }
    return pairs(skill, d, {
      prompt: 'Nối hình nốt với số phách',
      pairs: [
        ['Nốt đen', '1 phách'],
        ['Nốt trắng', '2 phách'],
        ['Nốt tròn', '4 phách'],
      ],
      explanation: 'Nốt đen 1 phách, nốt trắng 2 phách, nốt tròn 4 phách.',
      rng,
    })
  },

  'music.g3.nhip-3-4': (skill, d, rng) => {
    if (d === 1) {
      return numeric(skill, d, {
        prompt: 'Nhịp 3/4 có mấy phách trong một ô nhịp?',
        value: 3,
        unit: 'phách',
        explanation: 'Số 3 ở trên cho biết mỗi ô nhịp có 3 phách: mạnh - nhẹ - nhẹ.',
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Nhịp 3/4 thường dùng cho điệu nhảy nào?',
        correct: 'Điệu van (waltz), nhịp nhàng như đu đưa',
        distractors: ['Điệu hành khúc đều bước', 'Điệu rock mạnh mẽ', 'Điệu rap đọc nhanh'],
        explanation: 'Nhịp 3/4 với phách mạnh - nhẹ - nhẹ tạo cảm giác đu đưa, đặc trưng của điệu van.',
        rng,
      })
    }
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại một ô nhịp 3/4 vừa nghe',
      audio: { kind: 'rhythm', pattern: [1, 1, 1], tempo: 90 },
      explanation: 'Ba tiếng đều nhau, mỗi tiếng một phách.',
      hint: 'Đếm thầm 1 - 2 - 3.',
    })
  },

  'music.g3.am-sac-nhac-cu': (skill, d, rng) => {
    if (d === 3) {
      const soft = rng.chance(0.5)
      return audioChoice(skill, d, {
        prompt: 'Nghe âm thanh sau. Âm sắc của nó thế nào?',
        audio: {
          kind: 'tone',
          notes: ['E4', 'G4', 'E4'],
          tempo: 70,
          timbre: soft ? 'sine' : 'sawtooth',
        },
        correct: soft ? 'Êm, tròn và mềm mại' : 'Gắt, sắc và nhiều cạnh',
        distractors: ['Êm, tròn và mềm mại', 'Gắt, sắc và nhiều cạnh'],
        explanation: soft
          ? 'Âm sắc tròn và mềm, gần với tiếng sáo.'
          : 'Âm sắc gắt và sắc cạnh, gần với tiếng kèn đồng.',
        hint: 'Cùng một cao độ vẫn có thể nghe rất khác nhau - đó chính là âm sắc.',
        rng,
      })
    }
    const rows: Array<[string, string]> = [
      ['Tiếng sáo', 'Trong trẻo, vút cao'],
      ['Tiếng trống', 'Vang, trầm, mạnh'],
      ['Tiếng đàn tranh', 'Réo rắt, ngân nga'],
    ]
    if (d === 1) {
      const target = rng.pick(rows)
      return choice(skill, d, {
        prompt: `Âm thanh "${target[1].toLowerCase()}" là của nhạc cụ nào?`,
        correct: target[0],
        distractors: rows.filter((r) => r[0] !== target[0]).map((r) => r[0]),
        explanation: `${target[0]} có âm sắc ${target[1].toLowerCase()}.`,
        rng,
      })
    }
    return pairs(skill, d, {
      prompt: 'Nối nhạc cụ với âm sắc đặc trưng',
      pairs: rows,
      explanation: 'Mỗi nhạc cụ có màu âm riêng, gọi là âm sắc.',
      rng,
    })
  },

  // --- Lớp 4 ---------------------------------------------------------------

  'music.g4.gam-do-truong': (skill, d, rng) => {
    if (d === 1) {
      return numeric(skill, d, {
        prompt: 'Gam Đô trưởng có mấy nốt (tính từ Đô đến Si)?',
        value: 7,
        unit: 'nốt',
        explanation: 'Gam Đô trưởng gồm 7 nốt: Đô, Rê, Mi, Pha, Son, La, Si.',
      })
    }
    if (d === 2) {
      const index = rng.int(0, 6)
      return choice(skill, d, {
        prompt: `Trong gam Đô trưởng, nốt thứ ${index + 1} là nốt nào?`,
        correct: SOLFEGE[index]!.vi,
        distractors: SOLFEGE.filter((_, i) => i !== index).map((n) => n.vi),
        explanation: `Thứ tự gam Đô trưởng: ${SOLFEGE.map((n) => n.vi).join(' - ')}. Nốt thứ ${index + 1} là ${SOLFEGE[index]!.vi}.`,
        rng,
      })
    }
    const target = rng.pick(SOLFEGE)
    return audioChoice(skill, d, {
      prompt: 'Nghe nốt Đô làm mốc rồi cho biết nốt thứ hai là nốt gì?',
      audio: { kind: 'tone', notes: ['C4', target.note], tempo: 65 },
      correct: target.vi,
      distractors: SOLFEGE.filter((n) => n.vi !== target.vi).map((n) => n.vi),
      explanation: `Nốt thứ hai là ${target.vi} (${target.latin}).`,
      rng,
    })
  },

  'music.g4.truong-do-moc-don': (skill, d) => {
    if (d === 1) {
      return numeric(skill, d, {
        prompt: 'Một nốt đen bằng mấy nốt móc đơn?',
        value: 2,
        unit: 'nốt móc đơn',
        explanation: 'Nốt móc đơn ngân nửa phách, nốt đen ngân 1 phách, nên 1 nốt đen = 2 nốt móc đơn.',
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: 'Một nốt trắng bằng mấy nốt móc đơn?',
        value: 4,
        unit: 'nốt móc đơn',
        explanation: 'Nốt trắng = 2 nốt đen = 4 nốt móc đơn.',
        hint: 'Đổi qua nốt đen trước.',
      })
    }
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại tiết tấu có nốt móc đơn vừa nghe',
      audio: { kind: 'rhythm', pattern: [0.5, 0.5, 1, 2], tempo: 80 },
      toleranceMs: 220,
      explanation: 'Hai nốt móc đơn nhanh, rồi một nốt đen, cuối cùng là nốt trắng ngân dài.',
      hint: 'Hai tiếng đầu đi liền nhau rất nhanh.',
    })
  },

  'music.g4.nhac-cu-dan-toc': (skill, d, rng) => {
    const instruments: Array<{ name: string; emoji: string; desc: string }> = [
      { name: 'Đàn bầu', emoji: '🎼', desc: 'chỉ có một dây, tiếng ngân da diết' },
      { name: 'Đàn tranh', emoji: '🎻', desc: 'nhiều dây căng trên thân gỗ dài, gảy bằng móng' },
      { name: 'Sáo trúc', emoji: '🪈', desc: 'làm bằng ống trúc, thổi bằng hơi' },
      { name: "Đàn t'rưng", emoji: '🎋', desc: 'gồm nhiều ống nứa dài ngắn khác nhau, gõ bằng dùi' },
    ]
    if (d === 1) {
      const target = rng.pick(instruments)
      return choice(skill, d, {
        prompt: `Nhạc cụ dân tộc nào ${target.desc}?`,
        correct: { id: 'c0', label: target.name, image: target.emoji },
        distractors: instruments
          .filter((i) => i.name !== target.name)
          .map((i) => ({ id: `d-${i.name}`, label: i.name, image: i.emoji })),
        explanation: `${target.name}: ${target.desc}.`,
        rng,
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: 'Đàn bầu có mấy dây?',
        value: 1,
        unit: 'dây',
        explanation: 'Đàn bầu là nhạc cụ độc đáo của Việt Nam, chỉ có duy nhất một dây.',
      })
    }
    return pairs(skill, d, {
      prompt: 'Nối nhạc cụ dân tộc với cách chơi',
      pairs: [
        ['Đàn bầu', 'Gảy dây và uốn cần'],
        ['Sáo trúc', 'Thổi bằng hơi'],
        ["Đàn t'rưng", 'Gõ bằng dùi'],
      ],
      explanation: 'Mỗi nhạc cụ dân tộc có cách diễn tấu riêng.',
      rng,
    })
  },

  'music.g4.nhip-do': (skill, d, rng) => {
    if (d === 3) {
      return choice(skill, d, {
        prompt: 'Một bài hát về ngày hội tưng bừng nên chọn nhịp độ nào?',
        correct: 'Nhanh, vui tươi',
        distractors: ['Rất chậm, buồn bã', 'Chậm, trang nghiêm', 'Không cần quan tâm nhịp độ'],
        explanation: 'Nhịp độ góp phần diễn tả cảm xúc: vui thì nhanh, buồn thì chậm.',
        rng,
      })
    }
    const options = [
      { label: 'Chậm', tempo: 55 },
      { label: 'Vừa phải', tempo: 95 },
      { label: 'Nhanh', tempo: 160 },
    ]
    const target = rng.pick(options)
    return audioChoice(skill, d, {
      prompt: 'Nghe đoạn nhạc rồi chọn nhịp độ phù hợp',
      audio: { kind: 'tone', notes: ['C4', 'E4', 'G4', 'E4', 'C4'], tempo: target.tempo },
      correct: target.label,
      distractors: options.filter((o) => o.label !== target.label).map((o) => o.label),
      explanation: `Đoạn nhạc này ở nhịp độ ${target.label.toLowerCase()}.`,
      rng,
    })
  },

  // --- Lớp 5 ---------------------------------------------------------------

  'music.g5.nhip-4-4': (skill, d, rng) => {
    if (d === 1) {
      return numeric(skill, d, {
        prompt: 'Nhịp 4/4 có mấy phách trong một ô nhịp?',
        value: 4,
        unit: 'phách',
        explanation: 'Nhịp 4/4 có 4 phách: mạnh - nhẹ - mạnh vừa - nhẹ.',
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Trong nhịp 4/4, phách thứ ba có tính chất gì?',
        correct: 'Mạnh vừa',
        distractors: ['Mạnh nhất', 'Nhẹ nhất', 'Không phát ra tiếng'],
        explanation: 'Nhịp 4/4: phách 1 mạnh, phách 2 nhẹ, phách 3 mạnh vừa, phách 4 nhẹ.',
        rng,
      })
    }
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại một ô nhịp 4/4 vừa nghe',
      audio: { kind: 'rhythm', pattern: [1, 1, 1, 1], tempo: 100 },
      toleranceMs: 220,
      explanation: 'Bốn tiếng đều nhau, mỗi tiếng một phách.',
    })
  },

  'music.g5.dau-lang': (skill, d, rng) => {
    if (d === 1) {
      return choice(skill, d, {
        prompt: 'Dấu lặng trong bản nhạc có ý nghĩa gì?',
        correct: 'Ngừng phát ra âm thanh trong một khoảng thời gian',
        distractors: [
          'Hát to hơn bình thường',
          'Hát nhanh hơn bình thường',
          'Lặp lại đoạn nhạc phía trước',
        ],
        explanation: 'Dấu lặng là khoảng im lặng, vẫn phải đếm đủ phách chứ không bỏ qua.',
        rng,
      })
    }
    if (d === 2) {
      return numeric(skill, d, {
        prompt: 'Dấu lặng đen kéo dài mấy phách?',
        value: 1,
        unit: 'phách',
        explanation: 'Dấu lặng đen nghỉ đúng 1 phách, tương ứng trường độ nốt đen.',
        hint: 'Dấu lặng nào ứng với nốt nào thì dài bằng nốt đó.',
      })
    }
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại tiết tấu vừa nghe - chú ý chỗ im lặng',
      audio: { kind: 'rhythm', pattern: [1, 2, 1], tempo: 85 },
      toleranceMs: 280,
      explanation: 'Khoảng nghỉ dài giữa hai tiếng chính là dấu lặng, vẫn phải đếm đủ phách.',
    })
  },

  'music.g5.dan-ca-vung-mien': (skill, d, rng) => {
    const rows: Array<{ song: string; region: string }> = [
      { song: 'Hát Quan họ', region: 'Bắc Bộ' },
      { song: 'Hò Huế', region: 'Trung Bộ' },
      { song: 'Lý cây bông', region: 'Nam Bộ' },
    ]
    if (d === 1) {
      const target = rng.pick(rows)
      return choice(skill, d, {
        prompt: `"${target.song}" là dân ca vùng nào?`,
        correct: target.region,
        distractors: rows.filter((r) => r.region !== target.region).map((r) => r.region),
        explanation: `${target.song} là làn điệu dân ca đặc trưng của ${target.region}.`,
        rng,
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Dân ca Quan họ nổi tiếng nhất ở tỉnh nào?',
        correct: 'Bắc Ninh',
        distractors: ['Thừa Thiên Huế', 'Cà Mau', 'Lâm Đồng'],
        explanation: 'Dân ca Quan họ Bắc Ninh đã được UNESCO ghi danh là di sản văn hoá phi vật thể.',
        rng,
      })
    }
    return pairs(skill, d, {
      prompt: 'Nối làn điệu dân ca với vùng miền',
      pairs: rows.map((r) => [r.song, r.region] as [string, string]),
      explanation: 'Mỗi vùng miền có làn điệu dân ca riêng, mang giọng nói và nếp sống địa phương.',
      rng,
    })
  },

  'music.g5.sac-thai-to-nho': (skill, d, rng) => {
    if (d === 1) {
      return choice(skill, d, {
        prompt: 'Ký hiệu f trong bản nhạc có nghĩa là gì?',
        correct: 'Hát hoặc đàn mạnh',
        distractors: ['Hát hoặc đàn nhẹ', 'Hát nhanh hơn', 'Nghỉ một phách'],
        explanation: 'f viết tắt của forte, nghĩa là mạnh. p viết tắt của piano, nghĩa là nhẹ.',
        rng,
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Ký hiệu p trong bản nhạc có nghĩa là gì?',
        correct: 'Hát hoặc đàn nhẹ',
        distractors: ['Hát hoặc đàn mạnh', 'Hát chậm lại', 'Lặp lại câu nhạc'],
        explanation: 'p viết tắt của piano, nghĩa là nhẹ, êm.',
        rng,
      })
    }
    const strongFirst = rng.chance(0.5)
    return audioChoice(skill, d, {
      prompt: 'Nghe hai câu nhạc. Câu nào được đánh dấu f (mạnh)?',
      audio: {
        kind: 'tone',
        notes: ['C4', 'E4', 'G4', 'C4', 'E4', 'G4'],
        tempo: 100,
        gains: strongFirst ? [0.9, 0.9, 0.9, 0.2, 0.2, 0.2] : [0.2, 0.2, 0.2, 0.9, 0.9, 0.9],
      },
      correct: strongFirst ? 'Câu thứ nhất' : 'Câu thứ hai',
      distractors: ['Câu thứ nhất', 'Câu thứ hai', 'Cả hai câu như nhau'],
      explanation: strongFirst
        ? 'Ba nốt đầu vang to hơn nên đó là câu đánh dấu f.'
        : 'Ba nốt sau vang to hơn nên đó là câu đánh dấu f.',
      rng,
    })
  },
}

export const musicGenerators: GeneratorMap = { ...music, ...musicG2 }
