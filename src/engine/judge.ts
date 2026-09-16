/**
 * Chấm câu trả lời. Hàm thuần, không phụ thuộc UI.
 *
 * Quy ước quan trọng với môn Đạo đức: `judge` vẫn trả về `correct` để engine
 * biết có tung chiêu hay không, nhưng lựa chọn kém KHÔNG bị coi là "sai" trong
 * mắt trẻ - `battle.ts` không trừ máu, và thông điệp trả về là lời giải thích
 * chứ không phải "Sai rồi".
 */

import type {
  Judgement,
  MatchPair,
  Question,
  RhythmTapQuestion,
  ScenarioQuestion,
} from '../content/types'

export type AnswerInput =
  | { kind: 'choice'; choiceId: string }
  | { kind: 'numeric'; value: number }
  | { kind: 'text'; value: string }
  | { kind: 'order'; orderedIds: string[] }
  | { kind: 'pairs'; pairs: MatchPair[] }
  /** Mốc thời gian (ms) của từng lần trẻ chạm, tính từ lúc bắt đầu bài gõ nhịp. */
  | { kind: 'rhythm'; timestampsMs: number[] }

/**
 * Chuẩn hoá chuỗi tiếng Việt để so khớp đáp án tự luận ngắn.
 * CỐ Ý GIỮ NGUYÊN DẤU: "ma" và "mã" là hai từ khác nhau, bỏ dấu sẽ chấm sai.
 */
export function normalizeText(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?;:"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function judge(question: Question, input: AnswerInput): Judgement {
  switch (question.type) {
    case 'multiple-choice':
    case 'audio-choice': {
      if (input.kind !== 'choice') return mismatch(question)
      const correct = input.choiceId === question.answer.choiceId
      return { correct, message: question.explanation }
    }

    case 'numeric-input': {
      if (input.kind !== 'numeric') return mismatch(question)
      const { value, tolerance = 0 } = question.answer
      const correct =
        Number.isFinite(input.value) && Math.abs(input.value - value) <= tolerance + 1e-9
      return { correct, message: question.explanation }
    }

    case 'text-input': {
      if (input.kind !== 'text') return mismatch(question)
      const given = normalizeText(input.value)
      const correct = question.answer.accepted.some((a) => normalizeText(a) === given)
      return { correct, message: question.explanation }
    }

    case 'drag-order': {
      if (input.kind !== 'order') return mismatch(question)
      const expected = question.answer.orderedIds
      const correct =
        input.orderedIds.length === expected.length &&
        expected.every((id, i) => input.orderedIds[i] === id)
      return { correct, message: question.explanation }
    }

    case 'match-pairs': {
      if (input.kind !== 'pairs') return mismatch(question)
      const expected = new Map(question.answer.pairs.map((p) => [p.leftId, p.rightId]))
      const correct =
        input.pairs.length === expected.size &&
        input.pairs.every((p) => expected.get(p.leftId) === p.rightId)
      return { correct, message: question.explanation }
    }

    case 'rhythm-tap': {
      if (input.kind !== 'rhythm') return mismatch(question)
      return judgeRhythm(question, input.timestampsMs)
    }

    case 'scenario': {
      if (input.kind !== 'choice') return mismatch(question)
      return judgeScenario(question, input.choiceId)
    }
  }
}

function mismatch(question: Question): Judgement {
  // Lỗi lập trình, không phải lỗi của trẻ - không tính là trả lời sai.
  throw new Error(`Kiểu câu trả lời không khớp với câu hỏi ${question.id} (${question.type})`)
}

/**
 * Chấm bài gõ nhịp: so khoảng cách giữa các lần chạm với trường độ mong đợi.
 * Chấm theo KHOẢNG CÁCH chứ không theo mốc tuyệt đối, nên trẻ vào sớm hay muộn
 * một chút vẫn đúng, miễn là giữ đều nhịp.
 */
function judgeRhythm(question: RhythmTapQuestion, timestampsMs: number[]): Judgement {
  const { pattern, tempo } = question.audio
  const { toleranceMs } = question.answer
  const beatMs = 60_000 / tempo

  if (timestampsMs.length !== pattern.length) {
    return {
      correct: false,
      message: `Cần gõ ${pattern.length} tiếng, con gõ ${timestampsMs.length} tiếng. ${question.explanation}`,
    }
  }
  if (pattern.length < 2) {
    return { correct: true, message: question.explanation }
  }

  for (let i = 1; i < timestampsMs.length; i++) {
    const actualGap = timestampsMs[i]! - timestampsMs[i - 1]!
    const expectedGap = pattern[i - 1]! * beatMs
    if (Math.abs(actualGap - expectedGap) > toleranceMs) {
      return { correct: false, message: question.explanation }
    }
  }
  return { correct: true, message: question.explanation }
}

/**
 * Chấm tình huống Đạo đức.
 * 'good' và 'ok' đều được coi là trả lời được (có tung chiêu), khác nhau ở
 * sức mạnh. 'poor' không phải "sai" - trẻ nhận lời giải thích và mất lượt.
 */
function judgeScenario(question: ScenarioQuestion, choiceId: string): Judgement {
  const option = question.options.find((o) => o.id === choiceId)
  if (!option) {
    throw new Error(`Lựa chọn ${choiceId} không có trong tình huống ${question.id}`)
  }
  return {
    correct: option.quality !== 'poor',
    quality: option.quality,
    virtues: option.virtues,
    message: option.feedback,
  }
}
