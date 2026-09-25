/**
 * Mô hình dữ liệu câu hỏi dùng chung cho cả 4 môn.
 *
 * Nguyên tắc: dù câu hỏi được sinh tự động (Toán, Âm nhạc) hay soạn tay
 * (Tiếng Việt, Đạo đức), tất cả đều quy về đúng kiểu `Question` này để UI
 * trận đấu không cần biết câu hỏi thuộc môn nào.
 */

export type Subject = 'math' | 'vietnamese' | 'ethics' | 'music'

export const SUBJECTS: Subject[] = ['math', 'vietnamese', 'ethics', 'music']

export const SUBJECT_LABEL: Record<Subject, string> = {
  math: 'Toán',
  vietnamese: 'Tiếng Việt',
  ethics: 'Đạo đức',
  music: 'Âm nhạc',
}

/** Mỗi môn tương ứng một nguyên tố chiêu thức trong trận đấu. */
export const SUBJECT_ELEMENT: Record<Subject, string> = {
  math: 'Số Học',
  vietnamese: 'Ngôn Từ',
  music: 'Thanh Âm',
  ethics: 'Ánh Sáng',
}

export type Grade = 1 | 2 | 3 | 4 | 5
export const GRADES: Grade[] = [1, 2, 3, 4, 5]

/**
 * Môi trường sống của quái hoang - nơi nó nhảy ra, chứ không phải môn nó hỏi.
 *
 * Mỗi vùng đất có một khu đặc biệt (xem `features/world/biome.ts`), và khu ấy
 * có bầy quái của riêng nó: lội nước nông ra đảo thì gặp cá, chui vào hang thì
 * gặp cua và thằn lằn, leo lên tán cây thì gặp thú rừng, trèo lên miệng núi lửa
 * thì gặp quái nham thạch. Câu hỏi vẫn là câu của môn đang học - môi trường chỉ
 * đổi con quái, không đổi bài.
 */
export type Habitat = 'sea' | 'cave' | 'forest' | 'lava'

export const HABITATS: Habitat[] = ['sea', 'cave', 'forest', 'lava']

/** 1 = dễ (mới học), 2 = vừa, 3 = thử thách. */
export type Difficulty = 1 | 2 | 3

export type QuestionType =
  | 'multiple-choice'
  | 'numeric-input'
  | 'text-input'
  | 'drag-order'
  | 'match-pairs'
  | 'audio-choice'
  | 'rhythm-tap'
  | 'scenario'

// ---------------------------------------------------------------------------
// Âm thanh: mô tả để tổng hợp bằng Web Audio, KHÔNG phải đường dẫn file.
// Nhờ vậy bài tập âm nhạc sinh được vô hạn và chạy offline.
// ---------------------------------------------------------------------------

export type Timbre = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'bell' | 'pluck'

/** Tên nốt theo cao độ khoa học, ví dụ 'C4' (Đô quãng 4), 'F#4'. */
export type NoteName = string

export interface ToneSpec {
  kind: 'tone'
  /** Danh sách nốt phát tuần tự. Một phần tử = một nốt đơn. */
  notes: NoteName[]
  /** Trường độ từng nốt tính theo phách. Mặc định 1 phách mỗi nốt. */
  beats?: number[]
  /** Nhịp độ, phách/phút. Mặc định 90. */
  tempo?: number
  timbre?: Timbre
  /** Phát đồng thời thay vì tuần tự (dùng cho bài nhận biết hợp âm). */
  chord?: boolean
  /**
   * Cường độ từng nốt, 0-1. Mặc định 0.6 cho mọi nốt.
   * Dùng cho bài phân biệt to - nhỏ và bài dạy sắc thái f / p.
   */
  gains?: number[]
}

export interface RhythmSpec {
  kind: 'rhythm'
  /** Trường độ từng tiếng gõ, tính theo phách. Ví dụ [1,1,2] = đen đen trắng. */
  pattern: number[]
  tempo: number
  timbre?: Timbre
}

export type AudioSpec = ToneSpec | RhythmSpec

// ---------------------------------------------------------------------------
// Lựa chọn & đáp án
// ---------------------------------------------------------------------------

export interface Choice {
  id: string
  label: string
  /** Emoji hoặc đường dẫn ảnh minh hoạ - trẻ lớp 1 chưa đọc thạo. */
  image?: string
  audio?: AudioSpec
}

/** Phẩm chất cho môn Đạo đức - thay cho điểm số đúng/sai. */
export type Virtue =
  | 'kindness'       // nhân ái
  | 'honesty'        // trung thực
  | 'responsibility' // trách nhiệm
  | 'respect'        // tôn trọng
  | 'perseverance'   // chăm chỉ, vượt khó
  | 'citizenship'    // ý thức công dân, bảo vệ môi trường

export const VIRTUE_LABEL: Record<Virtue, string> = {
  kindness: 'Nhân ái',
  honesty: 'Trung thực',
  responsibility: 'Trách nhiệm',
  respect: 'Tôn trọng',
  perseverance: 'Chăm chỉ',
  citizenship: 'Công dân tốt',
}

/**
 * Mức độ phù hợp của một lựa chọn trong tình huống Đạo đức.
 * Cố ý KHÔNG gọi là đúng/sai: trẻ 6-10 tuổi cần được giải thích, không bị chấm điểm.
 */
export type ChoiceQuality = 'good' | 'ok' | 'poor'

export interface ScenarioOption extends Choice {
  quality: ChoiceQuality
  /** Lời phản hồi hiện ngay sau khi chọn - phần dạy dỗ nằm ở đây. */
  feedback: string
  virtues: Virtue[]
}

export interface MatchPair {
  leftId: string
  rightId: string
}

// ---------------------------------------------------------------------------
// Các thể loại câu hỏi
// ---------------------------------------------------------------------------

interface BaseQuestion {
  id: string
  subject: Subject
  grade: Grade
  /** Trỏ tới một Skill trong curriculum.ts */
  skillId: string
  difficulty: Difficulty
  prompt: string
  /** Gợi ý hiện khi trẻ bấm nút "Gợi ý" (đổi lấy ít sát thương hơn). */
  hint?: string
  /** Bắt buộc: hiện khi trả lời sai. Đây là điểm khác biệt giữa game học và game đố. */
  explanation: string
  media?: { image?: string; audio?: AudioSpec }
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  choices: Choice[]
  answer: { kind: 'choice'; choiceId: string }
}

export interface NumericQuestion extends BaseQuestion {
  type: 'numeric-input'
  answer: { kind: 'numeric'; value: number; tolerance?: number }
  /** Hậu tố đơn vị hiển thị cạnh ô nhập, ví dụ 'cm', 'quả'. */
  unit?: string
}

export interface TextQuestion extends BaseQuestion {
  type: 'text-input'
  /** Danh sách đáp án chấp nhận được (đã tính các cách viết tương đương). */
  answer: { kind: 'text'; accepted: string[] }
}

export interface DragOrderQuestion extends BaseQuestion {
  type: 'drag-order'
  choices: Choice[]
  answer: { kind: 'order'; orderedIds: string[] }
}

export interface MatchPairsQuestion extends BaseQuestion {
  type: 'match-pairs'
  left: Choice[]
  right: Choice[]
  answer: { kind: 'pairs'; pairs: MatchPair[] }
}

export interface AudioChoiceQuestion extends BaseQuestion {
  type: 'audio-choice'
  /** Đoạn âm thanh trẻ phải nghe. */
  audio: AudioSpec
  choices: Choice[]
  answer: { kind: 'choice'; choiceId: string }
}

export interface RhythmTapQuestion extends BaseQuestion {
  type: 'rhythm-tap'
  audio: RhythmSpec
  answer: { kind: 'rhythm'; pattern: number[]; toleranceMs: number }
}

export interface ScenarioQuestion extends BaseQuestion {
  type: 'scenario'
  subject: 'ethics'
  options: ScenarioOption[]
  /** Không có trường `answer`: tình huống đạo đức không có đáp án máy chấm. */
}

export type Question =
  | MultipleChoiceQuestion
  | NumericQuestion
  | TextQuestion
  | DragOrderQuestion
  | MatchPairsQuestion
  | AudioChoiceQuestion
  | RhythmTapQuestion
  | ScenarioQuestion

// ---------------------------------------------------------------------------
// Phản hồi sau khi trả lời
// ---------------------------------------------------------------------------

/**
 * Kết quả chấm một câu. Với Đạo đức, `correct` luôn true khi chọn 'good' hoặc
 * 'ok'; lựa chọn 'poor' trả về `correct: false` nhưng engine sẽ KHÔNG trừ máu -
 * xem `engine/battle.ts`.
 */
export interface Judgement {
  correct: boolean
  quality?: ChoiceQuality
  virtues?: Virtue[]
  /** Lời giải thích / phản hồi để hiển thị. */
  message: string
}
