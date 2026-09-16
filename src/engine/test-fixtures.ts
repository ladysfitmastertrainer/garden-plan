/** Câu hỏi mẫu dùng chung cho các file test của engine. */

import type {
  AudioChoiceQuestion,
  DragOrderQuestion,
  MatchPairsQuestion,
  MultipleChoiceQuestion,
  NumericQuestion,
  RhythmTapQuestion,
  ScenarioQuestion,
  TextQuestion,
} from '../content/types'

export const mcQuestion: MultipleChoiceQuestion = {
  id: 'test.mc.1',
  subject: 'math',
  grade: 1,
  skillId: 'math.g1.hinh-phang',
  difficulty: 1,
  type: 'multiple-choice',
  prompt: 'Hình nào là hình tam giác?',
  explanation: 'Hình tam giác có ba cạnh và ba góc.',
  choices: [
    { id: 'a', label: 'Hình tròn', image: '⭕' },
    { id: 'b', label: 'Hình tam giác', image: '🔺' },
    { id: 'c', label: 'Hình vuông', image: '🟦' },
  ],
  answer: { kind: 'choice', choiceId: 'b' },
}

export const numericQuestion: NumericQuestion = {
  id: 'test.num.1',
  subject: 'math',
  grade: 1,
  skillId: 'math.g1.cong-tru-10',
  difficulty: 1,
  type: 'numeric-input',
  prompt: '3 + 4 = ?',
  explanation: '3 cộng 4 bằng 7.',
  answer: { kind: 'numeric', value: 7 },
}

export const decimalQuestion: NumericQuestion = {
  id: 'test.num.2',
  subject: 'math',
  grade: 5,
  skillId: 'math.g5.so-thap-phan',
  difficulty: 2,
  type: 'numeric-input',
  prompt: '1 chia 3 bằng bao nhiêu (làm tròn 2 chữ số)?',
  explanation: '1 : 3 = 0,33 (làm tròn).',
  answer: { kind: 'numeric', value: 0.33, tolerance: 0.005 },
}

export const textQuestion: TextQuestion = {
  id: 'test.text.1',
  subject: 'vietnamese',
  grade: 2,
  skillId: 'vietnamese.g2.chinh-ta-phu-am',
  difficulty: 2,
  type: 'text-input',
  prompt: 'Điền vào chỗ trống: con ...âu (loài vật kéo cày)',
  explanation: 'Viết đúng là "con trâu".',
  answer: { kind: 'text', accepted: ['trâu', 'con trâu'] },
}

export const orderQuestion: DragOrderQuestion = {
  id: 'test.order.1',
  subject: 'vietnamese',
  grade: 1,
  skillId: 'vietnamese.g1.doc-hieu-cau',
  difficulty: 2,
  type: 'drag-order',
  prompt: 'Sắp xếp thành câu đúng',
  explanation: 'Câu đúng: "Em đi học".',
  choices: [
    { id: 'w1', label: 'Em' },
    { id: 'w2', label: 'đi' },
    { id: 'w3', label: 'học' },
  ],
  answer: { kind: 'order', orderedIds: ['w1', 'w2', 'w3'] },
}

export const pairsQuestion: MatchPairsQuestion = {
  id: 'test.pairs.1',
  subject: 'music',
  grade: 2,
  skillId: 'music.g2.not-do-re-mi-pha-son',
  difficulty: 2,
  type: 'match-pairs',
  prompt: 'Nối tên nốt với ký hiệu',
  explanation: 'Đô là C, Rê là D, Mi là E.',
  left: [
    { id: 'do', label: 'Đô' },
    { id: 're', label: 'Rê' },
    { id: 'mi', label: 'Mi' },
  ],
  right: [
    { id: 'C', label: 'C' },
    { id: 'D', label: 'D' },
    { id: 'E', label: 'E' },
  ],
  answer: {
    kind: 'pairs',
    pairs: [
      { leftId: 'do', rightId: 'C' },
      { leftId: 're', rightId: 'D' },
      { leftId: 'mi', rightId: 'E' },
    ],
  },
}

export const audioQuestion: AudioChoiceQuestion = {
  id: 'test.audio.1',
  subject: 'music',
  grade: 1,
  skillId: 'music.g1.cao-thap',
  difficulty: 1,
  type: 'audio-choice',
  prompt: 'Nốt thứ hai cao hơn hay thấp hơn nốt thứ nhất?',
  explanation: 'Nốt sau cao hơn nốt trước.',
  audio: { kind: 'tone', notes: ['C4', 'G4'], tempo: 90 },
  choices: [
    { id: 'cao', label: 'Cao hơn' },
    { id: 'thap', label: 'Thấp hơn' },
  ],
  answer: { kind: 'choice', choiceId: 'cao' },
}

/** Nhịp 2/4 ở tempo 60 -> mỗi phách đúng 1000ms. */
export const rhythmQuestion: RhythmTapQuestion = {
  id: 'test.rhythm.1',
  subject: 'music',
  grade: 2,
  skillId: 'music.g2.nhip-2-4',
  difficulty: 2,
  type: 'rhythm-tap',
  prompt: 'Gõ lại tiết tấu vừa nghe',
  explanation: 'Tiết tấu gồm hai nốt đen rồi một nốt trắng.',
  audio: { kind: 'rhythm', pattern: [1, 1, 2], tempo: 60 },
  answer: { kind: 'rhythm', pattern: [1, 1, 2], toleranceMs: 200 },
}

export const scenarioQuestion: ScenarioQuestion = {
  id: 'test.scenario.1',
  subject: 'ethics',
  grade: 2,
  skillId: 'ethics.g2.nhan-loi-sua-loi',
  difficulty: 1,
  type: 'scenario',
  prompt: 'Con lỡ làm vỡ chiếc cốc của mẹ khi không có ai ở nhà. Con sẽ làm gì?',
  explanation: 'Nhận lỗi giúp con được tin tưởng hơn.',
  options: [
    {
      id: 'nhan-loi',
      label: 'Nói thật với mẹ và xin lỗi',
      quality: 'good',
      feedback: 'Đúng rồi! Nhận lỗi cần dũng cảm, và mẹ sẽ tin con hơn.',
      virtues: ['honesty', 'responsibility'],
    },
    {
      id: 'don-dep',
      label: 'Dọn sạch mảnh vỡ rồi chờ mẹ hỏi mới nói',
      quality: 'ok',
      feedback: 'Dọn dẹp là tốt, nhưng chủ động nói trước sẽ còn tốt hơn.',
      virtues: ['responsibility'],
    },
    {
      id: 'do-loi',
      label: 'Nói là do mèo làm vỡ',
      quality: 'poor',
      feedback: 'Đổ lỗi cho người khác làm mất lòng tin. Hãy thử cách khác nhé.',
      virtues: [],
    },
  ],
}
