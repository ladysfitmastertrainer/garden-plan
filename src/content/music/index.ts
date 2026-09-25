/**
 * Bộ sinh câu hỏi Âm nhạc lớp 1-5.
 *
 * Âm thanh được MÔ TẢ chứ không phải thu sẵn: generator trả về `AudioSpec`,
 * lớp `src/audio` tổng hợp bằng Web Audio lúc chạy. Nhờ vậy bài nghe sinh ra
 * vô hạn, chạy offline và không vướng bản quyền thu âm.
 *
 * "SINH RA VÔ HẠN" PHẢI LÀ THẬT. Bản trước có hơn năm mươi nhánh (kỹ năng x bậc)
 * viết cứng đúng một câu - "Nhịp 2/4 có mấy phách?", "Một nốt trắng bằng mấy nốt
 * đen?", tiết tấu vỗ tay luôn là [1, 1, 2] - nên trẻ đánh một chặng Âm nhạc là
 * gặp lại y nguyên câu ấy mỗi lượt. Giờ mỗi nhánh sinh từ một trong ba nguồn:
 *
 *   - Câu NGHE: nốt, giai điệu, nhịp độ, âm sắc bốc ngẫu nhiên.
 *   - Câu VỖ TAY: tiết tấu ghép ngẫu nhiên từ những trường độ hợp với lớp
 *     (`randomRhythm`) - lớp 1 chỉ nốt một phách và hai phách.
 *   - Câu NHẠC LÝ: thành bài tính - đổi trường độ, đếm phách qua nhiều ô nhịp,
 *     vị trí nốt trên khuông - hoặc bốc từ danh sách nhạc cụ, làn điệu, ký hiệu
 *     đủ dài. Câu khái niệm cũ vẫn giữ, chỉ còn là một trong vài dạng.
 *
 * Test `music-variety.test.ts` giữ cho mọi nhánh sinh được đủ nhiều câu khác nhau.
 */

import { audioChoice, choice, numeric, pairs, rhythmTap, type GeneratorMap } from '../factory'
import type { Rng } from '../../engine/rng'
import type { NoteName, Timbre } from '../types'
import musicG2 from './g2'

/** Tên nốt tiếng Việt ứng với ký hiệu quốc tế. */
export const SOLFEGE: Array<{ vi: string; note: NoteName; latin: string }> = [
  { vi: 'Đô', note: 'C4', latin: 'C' },
  { vi: 'Rê', note: 'D4', latin: 'D' },
  { vi: 'Mi', note: 'E4', latin: 'E' },
  { vi: 'Pha', note: 'F4', latin: 'F' },
  { vi: 'Son', note: 'G4', latin: 'G' },
  { vi: 'La', note: 'A4', latin: 'A' },
  { vi: 'Si', note: 'B4', latin: 'B' },
]

export const FIVE_NOTES = SOLFEGE.slice(0, 5)

/** Cao độ tăng dần, dùng cho câu nghe cao - thấp: bảy nốt và Đô cao. */
const LADDER: NoteName[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

/**
 * Một tiết tấu ngẫu nhiên đủ `beats` phách, ghép từ các trường độ `durations`.
 *
 * Nốt móc đơn (0,5) luôn đi thành CẶP - hai móc đơn ghép một phách - vì tiết tấu
 * lớp dưới không có móc đơn lẻ. Ít nhất `minNotes` tiếng: một tiếng ngân dài
 * thì không còn gì để vỗ theo.
 */
export function randomRhythm(rng: Rng, beats: number, durations: number[], minNotes = 3): number[] {
  for (let attempt = 0; attempt < 30; attempt++) {
    const out: number[] = []
    let left = beats
    while (left > 0) {
      const fits = durations.filter((d) => (d === 0.5 ? left >= 1 : d <= left))
      const pick = fits.length > 0 ? rng.pick(fits) : 1
      if (pick === 0.5) {
        out.push(0.5, 0.5)
        left -= 1
      } else {
        out.push(pick)
        left -= pick
      }
    }
    if (out.length >= minNotes) return out
  }
  return Array.from({ length: beats }, () => 1)
}

/** Đọc một tiết tấu thành lời cho lời giải thích: "1 - 1 - 2 phách". */
function describeRhythm(pattern: number[]): string {
  return pattern.map((p) => (p === 0.5 ? '½' : String(p))).join(' - ')
}

/** Một giai điệu ngắn từ `pool`, hai nốt liền nhau không trùng. */
function randomMelody(rng: Rng, pool: NoteName[], length: number): NoteName[] {
  const out: NoteName[] = []
  while (out.length < length) {
    const next = rng.pick(pool)
    if (next !== out[out.length - 1]) out.push(next)
  }
  return out
}

/** Trường độ các hình nốt, tính bằng phách (nốt đen = 1 phách). */
const NOTE_VALUES = [
  { name: 'nốt tròn', beats: 4 },
  { name: 'nốt trắng', beats: 2 },
  { name: 'nốt đen', beats: 1 },
]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const music: GeneratorMap = {
  // --- Lớp 1 ---------------------------------------------------------------

  'music.g1.cao-thap': (skill, d, rng) => {
    if (d === 3) {
      // Ba nốt bốc ngẫu nhiên rồi xếp tăng hoặc giảm dần.
      const picked = rng.sample(LADDER, 3).sort((a, b) => LADDER.indexOf(a) - LADDER.indexOf(b))
      const ascending = rng.chance(0.5)
      const notes = ascending ? picked : [...picked].reverse()
      return audioChoice(skill, d, {
        prompt: 'Nghe ba nốt nhạc. Các nốt đi lên cao dần hay xuống thấp dần?',
        audio: { kind: 'tone', notes, tempo: rng.pick([70, 80, 90]) },
        correct: ascending ? 'Đi lên cao dần' : 'Đi xuống thấp dần',
        distractors: ['Đi lên cao dần', 'Đi xuống thấp dần', 'Cả ba nốt bằng nhau'],
        explanation: ascending ? 'Mỗi nốt sau bổng hơn nốt trước: đi lên cao dần.' : 'Mỗi nốt sau trầm hơn nốt trước: đi xuống thấp dần.',
        rng,
      })
    }
    if (d === 1 && rng.chance(0.4)) {
      // Âm thanh quen thuộc: cao hay thấp.
      const pair = rng.pick([
        { high: 'tiếng chim hót', low: 'tiếng trống cái' },
        { high: 'tiếng còi thổi', low: 'tiếng bò rống' },
        { high: 'tiếng chuông gió', low: 'tiếng sấm' },
        { high: 'tiếng mèo con kêu', low: 'tiếng chó to sủa' },
      ])
      const askHigh = rng.chance(0.5)
      return choice(skill, d, {
        prompt: `${cap(pair.high)} và ${pair.low}: âm thanh nào ${askHigh ? 'cao (bổng)' : 'thấp (trầm)'} hơn?`,
        correct: cap(askHigh ? pair.high : pair.low),
        distractors: [cap(askHigh ? pair.low : pair.high), 'Cao bằng nhau'],
        explanation: `${cap(pair.high)} nghe bổng (cao), ${pair.low} nghe trầm (thấp).`,
        rng,
      })
    }
    // Hai nốt: bậc 1 cách xa (dễ nghe), bậc 2 cách gần.
    const [minGap, maxGap] = d === 1 ? [4, 7] : [1, 2]
    const gap = rng.int(minGap, maxGap)
    const lowIndex = rng.int(0, LADDER.length - 1 - gap)
    const low = LADDER[lowIndex]!
    const high = LADDER[lowIndex + gap]!
    const higherFirst = rng.chance(0.5)
    return audioChoice(skill, d, {
      prompt: 'Nghe hai nốt nhạc. Nốt thứ hai cao hơn hay thấp hơn nốt thứ nhất?',
      audio: { kind: 'tone', notes: higherFirst ? [high, low] : [low, high], tempo: 70 },
      correct: higherFirst ? 'Thấp hơn' : 'Cao hơn',
      distractors: ['Cao hơn', 'Thấp hơn', 'Bằng nhau'],
      explanation: higherFirst ? 'Nốt thứ hai trầm hơn nên thấp hơn nốt thứ nhất.' : 'Nốt thứ hai nghe bổng hơn nên cao hơn nốt thứ nhất.',
      hint: 'Âm thanh bổng là cao, âm thanh trầm là thấp.',
      rng,
    })
  },

  'music.g1.to-nho': (skill, d, rng) => {
    if (d === 3) {
      const loud = ['Tiếng trống trường', 'Tiếng còi xe cứu hoả', 'Tiếng sấm', 'Tiếng pháo hoa nổ']
      const soft = ['Tiếng lá rơi', 'Tiếng thì thầm', 'Tiếng bút viết', 'Tiếng mèo bước', 'Tiếng kim đồng hồ']
      const askLoud = rng.chance(0.5)
      const correct = rng.pick(askLoud ? loud : soft)
      return choice(skill, d, {
        prompt: `Tiếng nào dưới đây thường ${askLoud ? 'TO nhất' : 'NHỎ nhất'}?`,
        correct,
        distractors: rng.sample(askLoud ? soft : loud, 3),
        explanation: `${correct} thường ${askLoud ? 'vang rất to' : 'rất nhỏ, phải lắng tai mới nghe'}.`,
        rng,
      })
    }
    const loudFirst = rng.chance(0.5)
    const note = rng.pick(LADDER)
    // Bậc 2 chênh lệch ít hơn: khó phân biệt hơn.
    const [big, small] = d === 1 ? [0.85, 0.2] : [0.75, 0.4]
    return audioChoice(skill, d, {
      prompt: 'Nghe hai tiếng đàn. Tiếng thứ hai to hơn hay nhỏ hơn tiếng thứ nhất?',
      audio: { kind: 'tone', notes: [note, note], tempo: 70, gains: loudFirst ? [big, small] : [small, big] },
      correct: loudFirst ? 'Nhỏ hơn' : 'To hơn',
      distractors: ['To hơn', 'Nhỏ hơn', 'Bằng nhau'],
      explanation: loudFirst ? 'Tiếng thứ hai nhẹ hơn nên nhỏ hơn.' : 'Tiếng thứ hai mạnh hơn nên to hơn.',
      hint: 'Hai nốt cùng cao độ, chỉ khác cường độ.',
      rng,
    })
  },

  'music.g1.nhanh-cham': (skill, d, rng) => {
    if (d === 3) {
      const item = rng.pick([
        { what: 'Bài hát ru em bé', correct: 'Chậm và êm dịu', why: 'Hát ru cần chậm và êm để em bé dễ ngủ.' },
        { what: 'Bài hát cho trò chơi đuổi bắt', correct: 'Nhanh và vui nhộn', why: 'Trò chơi chạy nhảy hợp với nhạc nhanh, vui.' },
        { what: 'Bài hát khi đi đều bước', correct: 'Vừa phải, đều đặn', why: 'Đi đều bước cần nhịp vừa phải và thật đều.' },
        { what: 'Bài hát nhớ về người thân ở xa', correct: 'Chậm và tha thiết', why: 'Nỗi nhớ thường được hát chậm, tha thiết.' },
        { what: 'Bài hát mừng sinh nhật bạn', correct: 'Nhanh và vui nhộn', why: 'Mừng sinh nhật thì hát nhanh, vui.' },
        { what: 'Bài hát khi tập thể dục buổi sáng', correct: 'Vừa phải, đều đặn', why: 'Tập thể dục cần nhịp đều để động tác khớp nhau.' },
        { what: 'Bản nhạc để nằm nghỉ trưa', correct: 'Chậm và êm dịu', why: 'Nghỉ ngơi hợp với nhạc chậm, êm.' },
      ])
      return choice(skill, d, {
        prompt: `${item.what} thường có nhịp độ thế nào?`,
        correct: item.correct,
        distractors: ['Chậm và êm dịu', 'Nhanh và vui nhộn', 'Vừa phải, đều đặn', 'Chậm và tha thiết'].filter((x) => x !== item.correct),
        explanation: item.why,
        rng,
      })
    }
    const fast = rng.chance(0.5)
    // Bậc 2 đưa hai nhịp độ lại gần nhau hơn.
    const tempo = fast ? rng.pick(d === 1 ? [150, 160, 170] : [120, 130]) : rng.pick(d === 1 ? [50, 55, 60] : [70, 75])
    return audioChoice(skill, d, {
      prompt: 'Nghe đoạn nhạc. Đoạn nhạc này nhanh hay chậm?',
      audio: { kind: 'tone', notes: randomMelody(rng, FIVE_NOTES.map((n) => n.note), 5), tempo },
      correct: fast ? 'Nhanh' : 'Chậm',
      distractors: ['Nhanh', 'Chậm'],
      explanation: fast ? 'Các nốt nối nhau rất gấp nên đoạn nhạc nhanh.' : 'Các nốt ngân dài và thưa nên đoạn nhạc chậm.',
      rng,
    })
  },

  'music.g1.nhac-cu-quen-thuoc': (skill, d, rng) => {
    const instruments = [
      { name: 'Trống', emoji: '🥁', desc: 'gõ bằng dùi, tiếng vang và trầm', how: 'Gõ' },
      { name: 'Thanh phách', emoji: '🎋', desc: 'hai thanh tre gõ vào nhau, tiếng lách cách', how: 'Gõ' },
      { name: 'Thanh la', emoji: '🔔', desc: 'đĩa kim loại, tiếng ngân vang', how: 'Gõ' },
      { name: 'Song loan', emoji: '🪘', desc: 'gõ bằng chân, giữ nhịp cho hát', how: 'Gõ' },
      { name: 'Sáo', emoji: '🪈', desc: 'ống tre có nhiều lỗ, thổi bằng hơi', how: 'Thổi' },
      { name: 'Kèn', emoji: '🎺', desc: 'thổi hơi vào, tiếng vang và sáng', how: 'Thổi' },
      { name: 'Đàn ghi-ta', emoji: '🎸', desc: 'có sáu dây, gảy bằng ngón tay', how: 'Gảy' },
      { name: 'Đàn tranh', emoji: '🪕', desc: 'nhiều dây căng trên thân gỗ dài', how: 'Gảy' },
    ]
    const hows = ['Gõ', 'Thổi', 'Gảy']
    if (d === 1) {
      const [target, ...others] = rng.sample(instruments, 4)
      return choice(skill, d, {
        prompt: `Nhạc cụ nào ${target!.desc}?`,
        correct: { id: 'c0', label: target!.name, image: target!.emoji },
        distractors: others.map((i) => ({ id: `d-${i.name}`, label: i.name, image: i.emoji })),
        explanation: `${target!.name} ${target!.emoji}: ${target!.desc}.`,
        rng,
      })
    }
    if (d === 2) {
      const how = rng.pick(hows)
      const target = rng.pick(instruments.filter((i) => i.how === how))
      return choice(skill, d, {
        prompt: `Nhạc cụ nào được chơi bằng cách ${how.toLowerCase()}?`,
        correct: target.name,
        distractors: rng.sample(instruments.filter((i) => i.how !== how), 3).map((i) => i.name),
        explanation: `${target.name} là nhạc cụ ${how.toLowerCase()}: ${target.desc}.`,
        rng,
      })
    }
    // Ba nhạc cụ thuộc ba cách chơi khác nhau, bốc mới mỗi lần.
    const row = hows.map((how) => rng.pick(instruments.filter((i) => i.how === how)))
    return pairs(skill, d, {
      prompt: 'Nối nhạc cụ với cách chơi',
      pairs: row.map((i) => [i.name, i.how === 'Gõ' ? 'Gõ' : i.how === 'Thổi' ? 'Thổi bằng hơi' : 'Gảy dây'] as [string, string]),
      explanation: row.map((i) => `${i.name}: ${i.how.toLowerCase()}`).join('; ') + '.',
      rng,
    })
  },

  'music.g1.van-dong-theo-nhac': (skill, d, rng) => {
    // Lớp 1 chỉ nốt một phách và hai phách; bậc cao thì dài hơn và nhanh hơn.
    const beats = d === 1 ? rng.int(4, 5) : d === 2 ? rng.int(5, 6) : rng.int(6, 7)
    const pattern = randomRhythm(rng, beats, [1, 1, 2], d === 1 ? 3 : 4)
    return rhythmTap(skill, d, {
      prompt: 'Nghe rồi vỗ tay lại đúng như vậy',
      audio: { kind: 'rhythm', pattern, tempo: d === 1 ? 60 : d === 2 ? 70 : 80 },
      toleranceMs: d === 1 ? 350 : 280,
      explanation: `Tiết tấu gồm ${pattern.length} tiếng, trường độ ${describeRhythm(pattern)} phách.`,
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
    if (rng.chance(0.5)) {
      // Thứ tự năm nốt: nốt ngay trước, ngay sau, hoặc nốt thứ mấy.
      const names = FIVE_NOTES.map((n) => n.vi)
      if (d === 1) {
        const i = rng.int(0, 3)
        return choice(skill, d, {
          prompt: `Hát lần lượt Đô - Rê - Mi - Pha - Son. Nốt nào đứng ngay sau nốt ${names[i]}?`,
          correct: names[i + 1]!,
          distractors: names.filter((_, k) => k !== i + 1).slice(0, 3),
          explanation: `Thứ tự: ${names.join(' - ')}. Sau ${names[i]} là ${names[i + 1]}.`,
          rng,
        })
      }
      const i = rng.int(0, 4)
      return choice(skill, d, {
        prompt: `Trong dãy Đô - Rê - Mi - Pha - Son, nốt thứ ${i + 1} là nốt nào?`,
        correct: names[i]!,
        distractors: names.filter((_, k) => k !== i),
        explanation: `Đếm từ Đô: ${names.join(' - ')}. Nốt thứ ${i + 1} là ${names[i]}.`,
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
      if (rng.chance(0.3)) {
        return numeric(skill, d, {
          prompt: 'Nhịp 2/4 có mấy phách trong một ô nhịp?',
          value: 2,
          unit: 'phách',
          explanation: 'Số 2 ở trên cho biết mỗi ô nhịp có 2 phách.',
          hint: 'Nhìn con số ở phía trên của 2/4.',
        })
      }
      const bars = rng.int(2, 8)
      return numeric(skill, d, {
        prompt: `Một bài hát nhịp 2/4 có ${bars} ô nhịp. Hỏi có tất cả bao nhiêu phách?`,
        value: bars * 2,
        unit: 'phách',
        explanation: `Mỗi ô nhịp 2/4 có 2 phách: ${bars} × 2 = ${bars * 2} phách.`,
        hint: 'Mỗi ô nhịp 2/4 có 2 phách.',
      })
    }
    if (d === 2) {
      const which = rng.int(1, 2)
      const bar = rng.int(1, 4)
      return choice(skill, d, {
        prompt: `Trong nhịp 2/4, phách thứ ${which} của ô nhịp thứ ${bar} là phách gì?`,
        correct: which === 1 ? 'Phách mạnh' : 'Phách nhẹ',
        distractors: [which === 1 ? 'Phách nhẹ' : 'Phách mạnh', 'Không phát ra tiếng'],
        explanation: 'Mọi ô nhịp 2/4 đều giống nhau: phách 1 mạnh, phách 2 nhẹ.',
        rng,
      })
    }
    const pattern = randomRhythm(rng, rng.pick([4, 6]), [1, 1, 2])
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại tiết tấu nhịp 2/4 vừa nghe',
      audio: { kind: 'rhythm', pattern, tempo: rng.pick([80, 90]) },
      explanation: `${pattern.reduce((a, b) => a + b, 0) / 2} ô nhịp 2/4, trường độ ${describeRhythm(pattern)} phách.`,
    })
  },

  'music.g2.hinh-tiet-tau': (skill, d, rng) => {
    const beats = d === 1 ? rng.int(4, 5) : d === 2 ? 6 : 8
    const pattern = randomRhythm(rng, beats, d === 3 ? [1, 1, 2, 0.5] : [1, 1, 2], d === 1 ? 3 : 4)
    return rhythmTap(skill, d, {
      prompt: 'Vỗ tay lại đúng tiết tấu vừa nghe',
      audio: { kind: 'rhythm', pattern, tempo: 80 },
      toleranceMs: 300,
      explanation: `Tiết tấu có ${pattern.length} tiếng với trường độ ${describeRhythm(pattern)} phách.`,
      hint: 'Đếm thầm 1 - 2 đều đặn trong đầu.',
    })
  },

  'music.g2.hat-dung-giai-dieu': (skill, d, rng) => {
    if (d === 3) {
      const tip = rng.pick([
        { q: 'Khi hát cùng cả lớp, con nên làm gì để hát đúng?', a: 'Nghe bạn bên cạnh và hát vừa phải, đúng nhịp', no: ['Hát thật to át tiếng các bạn', 'Hát nhanh hơn các bạn cho xong', 'Hát nhỏ đến mức không ai nghe'] },
        { q: 'Trước khi hát một bài mới, con nên làm gì?', a: 'Nghe cô hát mẫu vài lần rồi hát theo từng câu', no: ['Hát ngay thật to', 'Chỉ đọc lời, không cần nghe giai điệu', 'Đợi các bạn hát xong mới hát'] },
        { q: 'Khi hát, con nên đứng hoặc ngồi thế nào?', a: 'Lưng thẳng, vai thả lỏng để lấy hơi tốt', no: ['Cúi gằm mặt xuống bàn', 'Nằm dài ra ghế', 'Vừa hát vừa chạy nhảy'] },
        { q: 'Hát sai một câu, con nên làm gì?', a: 'Nghe lại câu đó và tập hát lại cho đúng', no: ['Bỏ luôn câu đó', 'Hát to hơn cho át đi', 'Không hát bài đó nữa'] },
        { q: 'Trước khi hát, con nên làm gì để giọng hát tốt hơn?', a: 'Hít thở sâu và khởi động giọng nhẹ nhàng', no: ['Hét thật to cho quen', 'Uống nước đá thật lạnh', 'Nói chuyện liên tục'] },
        { q: 'Hát theo nhạc đệm, con cần chú ý điều gì?', a: 'Nghe nhạc đệm để vào đúng lúc và đúng nhịp', no: ['Hát trước nhạc đệm cho nhanh', 'Không cần nghe nhạc đệm', 'Hát to hơn nhạc đệm thật nhiều'] },
      ])
      return choice(skill, d, {
        prompt: tip.q,
        correct: tip.a,
        distractors: tip.no,
        explanation: 'Hát đúng giai điệu cần lắng nghe, tư thế đúng và luyện tập từng câu.',
        rng,
      })
    }
    const pool = FIVE_NOTES
    const target = randomMelody(rng, pool.map((n) => n.note), 4)
    const label = (notes: NoteName[]) => notes.map((n) => pool.find((p) => p.note === n)!.vi).join(' - ')
    // Phương án sai: cùng những nốt ấy nhưng đảo chỗ, nên phải nghe thật chứ
    // không đoán theo nốt đầu.
    const reversed = [...target].reverse()
    const swapped = [target[1]!, target[0]!, ...target.slice(2)]
    const other = randomMelody(rng, pool.map((n) => n.note), 4)
    return audioChoice(skill, d, {
      prompt: 'Nghe giai điệu rồi chọn đúng thứ tự các nốt',
      audio: { kind: 'tone', notes: target, tempo: d === 1 ? 70 : 85 },
      correct: label(target),
      distractors: [label(reversed), label(swapped), label(other)],
      explanation: `Giai điệu vừa nghe là ${label(target)}.`,
      hint: 'Chú ý nốt nào cao, nốt nào thấp.',
      rng,
    })
  },

  // --- Lớp 3 ---------------------------------------------------------------

  'music.g3.khuong-nhac-khoa-son': (skill, d, rng) => {
    /*
      Vị trí các nốt trên khuông nhạc khoá Son, đúng như sách lớp 3: Đô trên
      dòng kẻ phụ, Rê ngay dưới dòng 1, rồi dòng - khe xen kẽ đi lên.
    */
    const places = [
      { vi: 'Đô', where: 'dòng kẻ phụ phía dưới khuông' },
      { vi: 'Rê', where: 'ngay dưới dòng kẻ thứ nhất' },
      { vi: 'Mi', where: 'dòng kẻ thứ nhất' },
      { vi: 'Pha', where: 'khe thứ nhất' },
      { vi: 'Son', where: 'dòng kẻ thứ hai' },
      { vi: 'La', where: 'khe thứ hai' },
      { vi: 'Si', where: 'dòng kẻ thứ ba' },
    ]
    if (d === 1) {
      const fact = rng.pick([
        { q: 'Khuông nhạc có mấy dòng kẻ?', v: 5, u: 'dòng', e: 'Khuông nhạc gồm 5 dòng kẻ song song và 4 khe ở giữa.' },
        { q: 'Khuông nhạc có mấy khe?', v: 4, u: 'khe', e: 'Giữa 5 dòng kẻ có 4 khe.' },
        { q: 'Hai khuông nhạc có tất cả mấy dòng kẻ?', v: 10, u: 'dòng', e: 'Mỗi khuông 5 dòng: 5 + 5 = 10 dòng.' },
        { q: 'Hai khuông nhạc có tất cả mấy khe?', v: 8, u: 'khe', e: 'Mỗi khuông 4 khe: 4 + 4 = 8 khe.' },
        { q: 'Ba khuông nhạc có tất cả mấy dòng kẻ?', v: 15, u: 'dòng', e: 'Mỗi khuông 5 dòng: 5 × 3 = 15 dòng.' },
      ])
      if (rng.chance(0.5)) {
        return numeric(skill, d, { prompt: fact.q, value: fact.v, unit: fact.u, explanation: fact.e, hint: 'Khuông nhạc có 5 dòng kẻ, 4 khe.' })
      }
      return choice(skill, d, {
        prompt: 'Các dòng kẻ của khuông nhạc được đếm theo thứ tự nào?',
        correct: 'Từ dưới lên trên',
        distractors: ['Từ trên xuống dưới', 'Từ giữa ra hai bên', 'Không cần đếm'],
        explanation: 'Dòng kẻ thứ nhất là dòng thấp nhất, đếm dần lên trên.',
        rng,
      })
    }
    const target = rng.pick(places)
    if (d === 2) {
      return choice(skill, d, {
        prompt: `Trên khuông nhạc khoá Son, nốt ${target.vi} nằm ở đâu?`,
        correct: cap(target.where),
        distractors: rng.sample(places.filter((p) => p.vi !== target.vi), 3).map((p) => cap(p.where)),
        explanation: `Nốt ${target.vi} nằm ở ${target.where}.`,
        hint: 'Mi ở dòng 1, rồi khe - dòng xen kẽ đi lên.',
        rng,
      })
    }
    if (rng.chance(0.3)) {
      return choice(skill, d, {
        prompt: 'Khoá Son được đặt ở đâu trên khuông nhạc?',
        correct: 'Ở đầu khuông nhạc, xoắn quanh dòng kẻ thứ hai',
        distractors: ['Ở cuối khuông nhạc, trên dòng kẻ thứ năm', 'Ở giữa khuông nhạc, trên dòng kẻ thứ ba', 'Ở đầu khuông nhạc, dưới dòng kẻ thứ nhất'],
        explanation: 'Khoá Son đặt đầu khuông, vòng xoắn ôm lấy dòng kẻ thứ hai - nơi ghi nốt Son.',
        rng,
      })
    }
    return choice(skill, d, {
      prompt: `Trên khuông nhạc khoá Son, nốt nằm ở ${target.where} là nốt gì?`,
      correct: target.vi,
      distractors: rng.sample(places.filter((p) => p.vi !== target.vi), 3).map((p) => p.vi),
      explanation: `${cap(target.where)} là vị trí của nốt ${target.vi}.`,
      rng,
    })
  },

  'music.g3.not-den-trang-tron': (skill, d, rng) => {
    if (d === 1) {
      // Đổi một số nốt lớn ra nốt nhỏ hơn.
      const [big, small] = rng.pick([
        [NOTE_VALUES[1]!, NOTE_VALUES[2]!],
        [NOTE_VALUES[0]!, NOTE_VALUES[2]!],
        [NOTE_VALUES[0]!, NOTE_VALUES[1]!],
      ] as const)
      const k = rng.int(1, 3)
      const value = (k * big.beats) / small.beats
      return numeric(skill, d, {
        prompt: `${k} ${big.name} bằng mấy ${small.name}?`,
        value,
        unit: small.name,
        explanation: `${cap(big.name)} ngân ${big.beats} phách, ${small.name} ngân ${small.beats} phách: ${k} × ${big.beats} : ${small.beats} = ${value}.`,
        hint: 'Nốt đen 1 phách, nốt trắng 2 phách, nốt tròn 4 phách.',
      })
    }
    if (d === 2) {
      // Cộng trường độ của một nhóm nốt.
      const counts = NOTE_VALUES.map(() => rng.int(0, 2))
      // Nhóm rỗng thì cho hai nốt đen - câu hỏi "ngân bao nhiêu phách" cần ít nhất một nốt.
      if (!counts.some((c) => c > 0)) counts[2] = 2
      const total = counts.reduce((sum, c, i) => sum + c * NOTE_VALUES[i]!.beats, 0)
      const parts = counts.map((c, i) => (c > 0 ? `${c} ${NOTE_VALUES[i]!.name}` : null)).filter(Boolean)
      return numeric(skill, d, {
        prompt: `Một câu nhạc có ${parts.join(', ')}. Câu nhạc đó ngân tất cả bao nhiêu phách?`,
        value: total,
        unit: 'phách',
        explanation: `${counts.map((c, i) => (c > 0 ? `${c} × ${NOTE_VALUES[i]!.beats}` : null)).filter(Boolean).join(' + ')} = ${total} phách.`,
        hint: 'Nốt đen 1 phách, nốt trắng 2 phách, nốt tròn 4 phách.',
      })
    }
    if (rng.chance(0.5)) {
      return pairs(skill, d, {
        prompt: 'Nối hình nốt với số phách',
        pairs: rng.shuffle(NOTE_VALUES).map((n) => [cap(n.name), `${n.beats} phách`] as [string, string]),
        explanation: 'Nốt đen 1 phách, nốt trắng 2 phách, nốt tròn 4 phách.',
        rng,
      })
    }
    // Ô nhịp 4/4 còn thiếu mấy phách.
    const used = rng.pick([[2, 1], [1, 1], [2], [1], [1, 1, 1]] as number[][])
    const names = used.map((b) => (b === 2 ? 'một nốt trắng' : 'một nốt đen'))
    const missing = 4 - used.reduce((a, b) => a + b, 0)
    return numeric(skill, d, {
      prompt: `Ô nhịp 4 phách đã có ${names.join(' và ')}. Còn thiếu mấy phách nữa?`,
      value: missing,
      unit: 'phách',
      explanation: `Đã có ${used.join(' + ')} = ${4 - missing} phách, còn thiếu 4 - ${4 - missing} = ${missing} phách.`,
    })
  },

  'music.g3.nhip-3-4': (skill, d, rng) => {
    if (d === 1) {
      if (rng.chance(0.3)) {
        return numeric(skill, d, {
          prompt: 'Nhịp 3/4 có mấy phách trong một ô nhịp?',
          value: 3,
          unit: 'phách',
          explanation: 'Số 3 ở trên cho biết mỗi ô nhịp có 3 phách: mạnh - nhẹ - nhẹ.',
        })
      }
      const bars = rng.int(2, 8)
      return numeric(skill, d, {
        prompt: `Một câu nhạc nhịp 3/4 có ${bars} ô nhịp. Hỏi có tất cả bao nhiêu phách?`,
        value: bars * 3,
        unit: 'phách',
        explanation: `Mỗi ô nhịp 3/4 có 3 phách: ${bars} × 3 = ${bars * 3} phách.`,
      })
    }
    if (d === 2) {
      if (rng.chance(0.4)) {
        return choice(skill, d, {
          prompt: 'Nhịp 3/4 thường dùng cho điệu nhảy nào?',
          correct: 'Điệu van (waltz), nhịp nhàng như đu đưa',
          distractors: ['Điệu hành khúc đều bước', 'Điệu rock mạnh mẽ', 'Điệu rap đọc nhanh'],
          explanation: 'Nhịp 3/4 với phách mạnh - nhẹ - nhẹ tạo cảm giác đu đưa, đặc trưng của điệu van.',
          rng,
        })
      }
      if (rng.chance(0.4)) {
        const has = rng.pick([
          { label: 'một nốt trắng', beats: 2 },
          { label: 'một nốt đen', beats: 1 },
          { label: 'hai nốt đen', beats: 2 },
        ])
        return numeric(skill, d, {
          prompt: `Một ô nhịp 3/4 đã có ${has.label}. Cần thêm mấy nốt đen nữa cho đủ ô nhịp?`,
          value: 3 - has.beats,
          unit: 'nốt đen',
          explanation: `Ô nhịp 3/4 có 3 phách, đã có ${has.beats} phách, còn thiếu ${3 - has.beats} phách - tức ${3 - has.beats} nốt đen.`,
        })
      }
      const which = rng.int(1, 3)
      return choice(skill, d, {
        prompt: `Trong nhịp 3/4, phách thứ ${which} là phách gì?`,
        correct: which === 1 ? 'Phách mạnh' : 'Phách nhẹ',
        distractors: [which === 1 ? 'Phách nhẹ' : 'Phách mạnh', 'Phách mạnh vừa'],
        explanation: 'Nhịp 3/4: phách 1 mạnh, phách 2 và 3 nhẹ.',
        rng,
      })
    }
    const pattern = randomRhythm(rng, 6, [1, 1, 2])
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại hai ô nhịp 3/4 vừa nghe',
      audio: { kind: 'rhythm', pattern, tempo: rng.pick([80, 90]) },
      explanation: `Hai ô nhịp 3/4, trường độ ${describeRhythm(pattern)} phách.`,
      hint: 'Đếm thầm 1 - 2 - 3, 1 - 2 - 3.',
    })
  },

  'music.g3.am-sac-nhac-cu': (skill, d, rng) => {
    if (d === 3) {
      const soft = rng.chance(0.5)
      const timbre: Timbre = soft ? rng.pick(['sine', 'triangle'] as const) : rng.pick(['sawtooth', 'square'] as const)
      return audioChoice(skill, d, {
        prompt: 'Nghe âm thanh sau. Âm sắc của nó thế nào?',
        audio: { kind: 'tone', notes: randomMelody(rng, LADDER.slice(0, 6), 3), tempo: 70, timbre },
        correct: soft ? 'Êm, tròn và mềm mại' : 'Gắt, sắc và nhiều cạnh',
        distractors: ['Êm, tròn và mềm mại', 'Gắt, sắc và nhiều cạnh'],
        explanation: soft ? 'Âm sắc tròn và mềm, gần với tiếng sáo.' : 'Âm sắc gắt và sắc cạnh, gần với tiếng kèn đồng.',
        hint: 'Cùng một cao độ vẫn có thể nghe rất khác nhau - đó chính là âm sắc.',
        rng,
      })
    }
    const rows: Array<[string, string]> = [
      ['Tiếng sáo', 'Trong trẻo, vút cao'],
      ['Tiếng trống', 'Vang, trầm, mạnh'],
      ['Tiếng đàn tranh', 'Réo rắt, ngân nga'],
      ['Tiếng đàn bầu', 'Mềm mại, da diết, luyến láy'],
      ['Tiếng kèn đồng', 'Sáng, vang, mạnh mẽ'],
      ['Tiếng thanh phách', 'Khô, gọn, lách cách'],
    ]
    if (d === 1) {
      const [target, ...others] = rng.sample(rows, 4)
      return choice(skill, d, {
        prompt: `Âm thanh "${target![1].toLowerCase()}" là của nhạc cụ nào?`,
        correct: target![0],
        distractors: others.map((r) => r[0]),
        explanation: `${target![0]} có âm sắc ${target![1].toLowerCase()}.`,
        rng,
      })
    }
    return pairs(skill, d, {
      prompt: 'Nối nhạc cụ với âm sắc đặc trưng',
      pairs: rng.sample(rows, 3),
      explanation: 'Mỗi nhạc cụ có màu âm riêng, gọi là âm sắc.',
      rng,
    })
  },

  // --- Lớp 4 ---------------------------------------------------------------

  'music.g4.gam-do-truong': (skill, d, rng) => {
    const names = SOLFEGE.map((n) => n.vi)
    if (d === 1) {
      if (rng.chance(0.25)) {
        return numeric(skill, d, {
          prompt: 'Gam Đô trưởng có mấy nốt (tính từ Đô đến Si)?',
          value: 7,
          unit: 'nốt',
          explanation: 'Gam Đô trưởng gồm 7 nốt: Đô, Rê, Mi, Pha, Son, La, Si.',
        })
      }
      const after = rng.chance(0.5)
      const i = after ? rng.int(0, 5) : rng.int(1, 6)
      const answer = names[after ? i + 1 : i - 1]!
      return choice(skill, d, {
        prompt: `Trong gam Đô trưởng đi lên, nốt nào đứng ngay ${after ? 'sau' : 'trước'} nốt ${names[i]}?`,
        correct: answer,
        distractors: rng.sample(names.filter((n) => n !== answer && n !== names[i]), 3),
        explanation: `Gam Đô trưởng: ${names.join(' - ')}.`,
        rng,
      })
    }
    if (d === 2) {
      const index = rng.int(0, 6)
      return choice(skill, d, {
        prompt: `Trong gam Đô trưởng, nốt thứ ${index + 1} là nốt nào?`,
        correct: names[index]!,
        distractors: rng.sample(names.filter((_, i) => i !== index), 3),
        explanation: `Thứ tự gam Đô trưởng: ${names.join(' - ')}. Nốt thứ ${index + 1} là ${names[index]}.`,
        rng,
      })
    }
    const target = rng.pick(SOLFEGE)
    return audioChoice(skill, d, {
      prompt: 'Nghe nốt Đô làm mốc rồi cho biết nốt thứ hai là nốt gì?',
      audio: { kind: 'tone', notes: ['C4', target.note], tempo: rng.pick([60, 65, 70]) },
      correct: target.vi,
      distractors: rng.sample(SOLFEGE.filter((n) => n.vi !== target.vi), 3).map((n) => n.vi),
      explanation: `Nốt thứ hai là ${target.vi} (${target.latin}).`,
      rng,
    })
  },

  'music.g4.truong-do-moc-don': (skill, d, rng) => {
    // Nốt móc đơn ngân nửa phách: 1 nốt đen = 2 móc đơn.
    if (d === 1) {
      if (rng.chance(0.5)) {
        const k = rng.int(1, 4)
        return numeric(skill, d, {
          prompt: `${k} nốt đen bằng mấy nốt móc đơn?`,
          value: k * 2,
          unit: 'nốt móc đơn',
          explanation: `Mỗi nốt đen bằng 2 nốt móc đơn: ${k} × 2 = ${k * 2}.`,
        })
      }
      const k = rng.int(1, 4) * 2
      return numeric(skill, d, {
        prompt: `${k} nốt móc đơn bằng mấy nốt đen?`,
        value: k / 2,
        unit: 'nốt đen',
        explanation: `Cứ 2 nốt móc đơn bằng 1 nốt đen: ${k} : 2 = ${k / 2}.`,
      })
    }
    if (d === 2) {
      const big = rng.pick([NOTE_VALUES[0]!, NOTE_VALUES[1]!])
      const k = rng.int(1, 3)
      return numeric(skill, d, {
        prompt: `${k} ${big.name} bằng mấy nốt móc đơn?`,
        value: k * big.beats * 2,
        unit: 'nốt móc đơn',
        explanation: `${cap(big.name)} = ${big.beats} nốt đen = ${big.beats * 2} nốt móc đơn; ${k} × ${big.beats * 2} = ${k * big.beats * 2}.`,
        hint: 'Đổi qua nốt đen trước.',
      })
    }
    const pattern = randomRhythm(rng, 4, [0.5, 1, 2], 4)
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại tiết tấu có nốt móc đơn vừa nghe',
      audio: { kind: 'rhythm', pattern, tempo: 80 },
      toleranceMs: 220,
      explanation: `Trường độ ${describeRhythm(pattern)} phách - hai nốt móc đơn đi liền nhau rất nhanh.`,
      hint: 'Hai tiếng móc đơn đi liền nhau, mỗi tiếng nửa phách.',
    })
  },

  'music.g4.nhac-cu-dan-toc': (skill, d, rng) => {
    const instruments: Array<{ name: string; emoji: string; desc: string; how: string }> = [
      { name: 'Đàn bầu', emoji: '🎼', desc: 'chỉ có một dây, tiếng ngân da diết', how: 'Gảy dây và uốn cần' },
      { name: 'Đàn tranh', emoji: '🎻', desc: 'nhiều dây căng trên thân gỗ dài, gảy bằng móng', how: 'Gảy dây' },
      { name: 'Sáo trúc', emoji: '🪈', desc: 'làm bằng ống trúc, thổi bằng hơi', how: 'Thổi bằng hơi' },
      { name: "Đàn t'rưng", emoji: '🎋', desc: 'gồm nhiều ống nứa dài ngắn khác nhau, gõ bằng dùi', how: 'Gõ bằng dùi' },
      { name: 'Đàn nhị', emoji: '🎻', desc: 'có hai dây, kéo bằng cung vĩ', how: 'Kéo bằng cung vĩ' },
      { name: 'Đàn nguyệt', emoji: '🌕', desc: 'mặt đàn tròn như trăng rằm, có hai dây', how: 'Gảy dây' },
      { name: 'Khèn', emoji: '🎋', desc: 'nhiều ống trúc cắm vào bầu gỗ, vừa thổi vừa hút hơi', how: 'Thổi bằng hơi' },
    ]
    if (d === 1) {
      const [target, ...others] = rng.sample(instruments, 4)
      return choice(skill, d, {
        prompt: `Nhạc cụ dân tộc nào ${target!.desc}?`,
        correct: { id: 'c0', label: target!.name, image: target!.emoji },
        distractors: others.map((i) => ({ id: `d-${i.name}`, label: i.name, image: i.emoji })),
        explanation: `${target!.name}: ${target!.desc}.`,
        rng,
      })
    }
    if (d === 2) {
      if (rng.chance(0.4)) {
        const strings = rng.pick([
          { name: 'Đàn bầu', n: 1 },
          { name: 'Đàn nhị', n: 2 },
          { name: 'Đàn nguyệt', n: 2 },
        ])
        return numeric(skill, d, {
          prompt: `${strings.name} có mấy dây?`,
          value: strings.n,
          unit: 'dây',
          explanation: strings.n === 1 ? 'Đàn bầu chỉ có duy nhất một dây - còn gọi là độc huyền cầm.' : `${strings.name} có hai dây.`,
        })
      }
      const target = rng.pick(instruments)
      return choice(skill, d, {
        prompt: `${target.name} được chơi bằng cách nào?`,
        correct: target.how,
        distractors: ['Gảy dây', 'Thổi bằng hơi', 'Gõ bằng dùi', 'Kéo bằng cung vĩ'].filter((h) => h !== target.how).slice(0, 3),
        explanation: `${target.name}: ${target.desc}.`,
        rng,
      })
    }
    // Ba nhạc cụ có ba cách chơi khác nhau, để nối không bị hai đáp án giống nhau.
    const row: typeof instruments = []
    for (const item of rng.shuffle(instruments)) {
      if (row.length < 3 && !row.some((r) => r.how === item.how)) row.push(item)
    }
    return pairs(skill, d, {
      prompt: 'Nối nhạc cụ dân tộc với cách chơi',
      pairs: row.map((i) => [i.name, i.how] as [string, string]),
      explanation: 'Mỗi nhạc cụ dân tộc có cách diễn tấu riêng.',
      rng,
    })
  },

  'music.g4.nhip-do': (skill, d, rng) => {
    if (d === 3) {
      const item = rng.pick([
        { what: 'Một bài hát về ngày hội tưng bừng', correct: 'Nhanh, vui tươi' },
        { what: 'Một bài hát ru', correct: 'Chậm, êm dịu' },
        { what: 'Một bài hát chào cờ trang nghiêm', correct: 'Vừa phải, trang nghiêm' },
        { what: 'Một bài hát tưởng nhớ người đã khuất', correct: 'Chậm, sâu lắng' },
        { what: 'Một bài hát cho trò chơi nhảy dây', correct: 'Nhanh, vui tươi' },
        { what: 'Một bài hát mừng xuân rộn ràng', correct: 'Nhanh, vui tươi' },
        { what: 'Một bài hát kể về đêm trăng yên tĩnh', correct: 'Chậm, êm dịu' },
        { what: 'Một bài hát hành khúc cho đội nghi thức', correct: 'Vừa phải, trang nghiêm' },
      ])
      return choice(skill, d, {
        prompt: `${item.what} nên chọn nhịp độ nào?`,
        correct: item.correct,
        distractors: ['Nhanh, vui tươi', 'Chậm, êm dịu', 'Vừa phải, trang nghiêm', 'Chậm, sâu lắng'].filter((x) => x !== item.correct).slice(0, 3),
        explanation: 'Nhịp độ góp phần diễn tả cảm xúc: vui thì nhanh, buồn và êm thì chậm, trang nghiêm thì vừa phải.',
        rng,
      })
    }
    const options = [
      { label: 'Chậm', tempos: [50, 55, 60] },
      { label: 'Vừa phải', tempos: [90, 95, 100] },
      { label: 'Nhanh', tempos: [150, 160, 170] },
    ]
    const target = rng.pick(options)
    return audioChoice(skill, d, {
      prompt: 'Nghe đoạn nhạc rồi chọn nhịp độ phù hợp',
      audio: { kind: 'tone', notes: randomMelody(rng, LADDER.slice(0, 6), d === 1 ? 5 : 6), tempo: rng.pick(target.tempos) },
      correct: target.label,
      distractors: options.filter((o) => o.label !== target.label).map((o) => o.label),
      explanation: `Đoạn nhạc này ở nhịp độ ${target.label.toLowerCase()}.`,
      rng,
    })
  },

  // --- Lớp 5 ---------------------------------------------------------------

  'music.g5.nhip-4-4': (skill, d, rng) => {
    const beatNames = ['Mạnh', 'Nhẹ', 'Mạnh vừa', 'Nhẹ']
    if (d === 1) {
      if (rng.chance(0.3)) {
        return numeric(skill, d, {
          prompt: 'Nhịp 4/4 có mấy phách trong một ô nhịp?',
          value: 4,
          unit: 'phách',
          explanation: 'Nhịp 4/4 có 4 phách: mạnh - nhẹ - mạnh vừa - nhẹ.',
        })
      }
      const bars = rng.int(2, 9)
      return numeric(skill, d, {
        prompt: `Một bài hát nhịp 4/4 có ${bars} ô nhịp. Hỏi có tất cả bao nhiêu phách?`,
        value: bars * 4,
        unit: 'phách',
        explanation: `Mỗi ô nhịp 4/4 có 4 phách: ${bars} × 4 = ${bars * 4} phách.`,
      })
    }
    if (d === 2) {
      if (rng.chance(0.4)) {
        const has = rng.pick([
          { label: 'một nốt trắng', beats: 2 },
          { label: 'một nốt trắng và một nốt đen', beats: 3 },
          { label: 'hai nốt đen', beats: 2 },
          { label: 'ba nốt đen', beats: 3 },
          { label: 'một nốt đen', beats: 1 },
        ])
        return numeric(skill, d, {
          prompt: `Một ô nhịp 4/4 đã có ${has.label}. Còn thiếu mấy phách nữa?`,
          value: 4 - has.beats,
          unit: 'phách',
          explanation: `Ô nhịp 4/4 có 4 phách, đã có ${has.beats} phách, còn thiếu ${4 - has.beats} phách.`,
        })
      }
      const which = rng.int(1, 4)
      return choice(skill, d, {
        prompt: `Trong nhịp 4/4, phách thứ ${which} có tính chất gì?`,
        correct: beatNames[which - 1]!,
        distractors: ['Mạnh', 'Nhẹ', 'Mạnh vừa', 'Không phát ra tiếng'].filter((x) => x !== beatNames[which - 1]),
        explanation: 'Nhịp 4/4: phách 1 mạnh, phách 2 nhẹ, phách 3 mạnh vừa, phách 4 nhẹ.',
        rng,
      })
    }
    const pattern = randomRhythm(rng, 4, [0.5, 1, 1, 2], 4)
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại một ô nhịp 4/4 vừa nghe',
      audio: { kind: 'rhythm', pattern, tempo: rng.pick([90, 100]) },
      toleranceMs: 220,
      explanation: `Một ô nhịp 4/4, trường độ ${describeRhythm(pattern)} phách.`,
    })
  },

  'music.g5.dau-lang': (skill, d, rng) => {
    const rests = [
      { name: 'dấu lặng đen', beats: 1 },
      { name: 'dấu lặng trắng', beats: 2 },
      { name: 'dấu lặng tròn', beats: 4 },
    ]
    if (d === 1) {
      if (rng.chance(0.4)) {
        return choice(skill, d, {
          prompt: 'Dấu lặng trong bản nhạc có ý nghĩa gì?',
          correct: 'Ngừng phát ra âm thanh trong một khoảng thời gian',
          distractors: ['Hát to hơn bình thường', 'Hát nhanh hơn bình thường', 'Lặp lại đoạn nhạc phía trước'],
          explanation: 'Dấu lặng là khoảng im lặng, vẫn phải đếm đủ phách chứ không bỏ qua.',
          rng,
        })
      }
      const rest = rng.pick(rests)
      const k = rng.int(1, 3)
      return numeric(skill, d, {
        prompt: k === 1 ? `${cap(rest.name)} nghỉ mấy phách?` : `${k} ${rest.name} nghỉ tất cả mấy phách?`,
        value: k * rest.beats,
        unit: 'phách',
        explanation: `${cap(rest.name)} nghỉ ${rest.beats} phách, bằng trường độ nốt tương ứng${k > 1 ? `: ${k} × ${rest.beats} = ${k * rest.beats} phách` : ''}.`,
        hint: 'Dấu lặng nào ứng với nốt nào thì dài bằng nốt đó.',
      })
    }
    if (d === 2) {
      const [a, b] = rng.sample(rests, 2)
      const ka = rng.int(1, 2)
      return numeric(skill, d, {
        prompt: `Một đoạn nhạc có ${ka} ${a!.name} và một ${b!.name}. Tổng cộng nghỉ bao nhiêu phách?`,
        value: ka * a!.beats + b!.beats,
        unit: 'phách',
        explanation: `${ka} × ${a!.beats} + ${b!.beats} = ${ka * a!.beats + b!.beats} phách.`,
        hint: 'Lặng đen 1 phách, lặng trắng 2 phách, lặng tròn 4 phách.',
      })
    }
    // Tiết tấu có một chỗ nghỉ dài: tiếng ngân 2-3 phách đứng trước khoảng lặng.
    const pattern = randomRhythm(rng, 5, [1, 1, 2, 3], 3)
    return rhythmTap(skill, d, {
      prompt: 'Gõ lại tiết tấu vừa nghe - chú ý chỗ im lặng',
      audio: { kind: 'rhythm', pattern, tempo: 85 },
      toleranceMs: 280,
      explanation: `Trường độ ${describeRhythm(pattern)} phách. Khoảng im giữa hai tiếng vẫn phải đếm đủ phách.`,
    })
  },

  'music.g5.dan-ca-vung-mien': (skill, d, rng) => {
    const rows: Array<{ song: string; region: string }> = [
      { song: 'Quan họ Bắc Ninh', region: 'Bắc Bộ' },
      { song: 'Hát xoan Phú Thọ', region: 'Bắc Bộ' },
      { song: 'Trống cơm', region: 'Bắc Bộ' },
      { song: 'Cò lả', region: 'Bắc Bộ' },
      { song: 'Hò Huế', region: 'Trung Bộ' },
      { song: 'Hò mái nhì', region: 'Trung Bộ' },
      { song: 'Ví dặm Nghệ Tĩnh', region: 'Trung Bộ' },
      { song: 'Lý cây bông', region: 'Nam Bộ' },
      { song: 'Lý ngựa ô', region: 'Nam Bộ' },
      { song: 'Đờn ca tài tử', region: 'Nam Bộ' },
    ]
    const regions = ['Bắc Bộ', 'Trung Bộ', 'Nam Bộ']
    if (d === 1) {
      const target = rng.pick(rows)
      return choice(skill, d, {
        prompt: `"${target.song}" là dân ca vùng nào?`,
        correct: target.region,
        distractors: regions.filter((r) => r !== target.region),
        explanation: `${target.song} là làn điệu đặc trưng của ${target.region}.`,
        rng,
      })
    }
    if (d === 2) {
      const region = rng.pick(regions)
      const target = rng.pick(rows.filter((r) => r.region === region))
      return choice(skill, d, {
        prompt: `Làn điệu nào dưới đây là dân ca ${region}?`,
        correct: target.song,
        distractors: rng.sample(rows.filter((r) => r.region !== region), 3).map((r) => r.song),
        explanation: `${target.song} thuộc ${region}.`,
        rng,
      })
    }
    return pairs(skill, d, {
      prompt: 'Nối làn điệu dân ca với vùng miền',
      pairs: regions.map((region) => [rng.pick(rows.filter((r) => r.region === region)).song, region] as [string, string]),
      explanation: 'Mỗi vùng miền có làn điệu dân ca riêng, mang giọng nói và nếp sống địa phương.',
      rng,
    })
  },

  'music.g5.sac-thai-to-nho': (skill, d, rng) => {
    const marks = [
      { sign: 'f', meaning: 'Hát hoặc đàn mạnh' },
      { sign: 'p', meaning: 'Hát hoặc đàn nhẹ' },
      { sign: 'ff', meaning: 'Hát hoặc đàn rất mạnh' },
      { sign: 'pp', meaning: 'Hát hoặc đàn rất nhẹ' },
      { sign: 'mf', meaning: 'Hát hoặc đàn mạnh vừa' },
      { sign: 'mp', meaning: 'Hát hoặc đàn nhẹ vừa' },
    ]
    if (d === 1) {
      const target = rng.pick(marks)
      return choice(skill, d, {
        prompt: `Ký hiệu ${target.sign} trong bản nhạc có nghĩa là gì?`,
        correct: target.meaning,
        distractors: rng.sample(marks.filter((m) => m.sign !== target.sign), 3).map((m) => m.meaning),
        explanation: 'f (forte) là mạnh, p (piano) là nhẹ; thêm một chữ nữa là "rất", thêm m (mezzo) là "vừa".',
        rng,
      })
    }
    if (d === 2) {
      const target = rng.pick(marks)
      return choice(skill, d, {
        prompt: `Muốn đánh dấu "${target.meaning.toLowerCase()}", ta dùng ký hiệu nào?`,
        correct: target.sign,
        distractors: rng.sample(marks.filter((m) => m.sign !== target.sign), 3).map((m) => m.sign),
        explanation: `"${target.meaning}" được ký hiệu là ${target.sign}.`,
        rng,
      })
    }
    const notes = randomMelody(rng, LADDER.slice(0, 6), 3)
    if (rng.chance(0.5)) {
      // To dần hay nhỏ dần.
      const louder = rng.chance(0.5)
      const gains = louder ? [0.2, 0.35, 0.55, 0.75, 0.9] : [0.9, 0.75, 0.55, 0.35, 0.2]
      return audioChoice(skill, d, {
        prompt: 'Nghe câu nhạc. Âm thanh to dần hay nhỏ dần?',
        audio: { kind: 'tone', notes: [...notes, ...notes.slice(0, 2)], tempo: 100, gains },
        correct: louder ? 'To dần' : 'Nhỏ dần',
        distractors: ['To dần', 'Nhỏ dần', 'Giữ nguyên độ to'],
        explanation: louder ? 'Mỗi nốt vang mạnh hơn nốt trước: to dần.' : 'Mỗi nốt vang nhẹ hơn nốt trước: nhỏ dần.',
        rng,
      })
    }
    const strongFirst = rng.chance(0.5)
    return audioChoice(skill, d, {
      prompt: 'Nghe hai câu nhạc. Câu nào được đánh dấu f (mạnh)?',
      audio: {
        kind: 'tone',
        notes: [...notes, ...notes],
        tempo: 100,
        gains: strongFirst ? [0.9, 0.9, 0.9, 0.2, 0.2, 0.2] : [0.2, 0.2, 0.2, 0.9, 0.9, 0.9],
      },
      correct: strongFirst ? 'Câu thứ nhất' : 'Câu thứ hai',
      distractors: ['Câu thứ nhất', 'Câu thứ hai', 'Cả hai câu như nhau'],
      explanation: strongFirst ? 'Ba nốt đầu vang to hơn nên đó là câu đánh dấu f.' : 'Ba nốt sau vang to hơn nên đó là câu đánh dấu f.',
      rng,
    })
  },
}

export const musicGenerators: GeneratorMap = { ...music, ...musicG2 }
