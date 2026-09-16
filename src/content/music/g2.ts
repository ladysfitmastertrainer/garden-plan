/**
 * Bộ sinh câu hỏi Âm nhạc lớp 2 - phần bám SGK Âm nhạc 2 (Kết nối tri thức).
 *
 * Năm kỹ năng ở đây ứng với các mạch nội dung của sách mà app chưa có: sắc màu
 * âm thanh, nhạc cụ gõ trong giờ học, nhạc cụ dân tộc, nghe nhạc - cảm thụ, và
 * hình tiết tấu. Các kỹ năng còn lại (đọc nhạc, nhịp 2/4, hát) nằm trong
 * `index.ts` cùng các lớp khác. Xem docs/sgk-lop-2.md.
 */

import { audioChoice, choice, type GeneratorMap } from '../factory'

/** Bộ nhạc cụ gõ sách liệt kê ở đầu quyển. */
const PERCUSSION = [
  { name: 'Thanh phách', how: 'gõ hai thanh tre vào nhau' },
  { name: 'Song loan', how: 'bật lá tre cho gõ vào hộp gỗ' },
  { name: 'Trống nhỏ', how: 'gõ dùi lên mặt trống' },
  { name: 'Tem-bơ-rin', how: 'lắc hoặc vỗ vào mặt trống tròn có đĩa kim loại' },
  { name: 'Trai-en-gô', how: 'gõ que kim loại vào thanh sắt hình tam giác' },
]

const FOLK = [
  { name: 'Đàn bầu', trait: 'chỉ có một dây, tiếng ngân dài và mềm' },
  { name: 'Sáo trúc', trait: 'làm bằng ống trúc, thổi bằng hơi' },
  { name: 'Đàn tranh', trait: 'nhiều dây căng trên mặt gỗ dài, gảy bằng móng' },
  { name: 'Trống cơm', trait: 'trống dài đeo trước bụng, vỗ bằng hai tay' },
]

const musicG2: GeneratorMap = {
  'music.g2.sac-mau-am-thanh': (skill, d, rng) => {
    if (d === 1) {
      const higher = rng.chance(0.5)
      return audioChoice(skill, d, {
        prompt: 'Nghe hai âm thanh. Âm thứ hai cao hơn hay thấp hơn âm thứ nhất?',
        audio: { kind: 'tone', notes: higher ? ['C4', 'G4'] : ['G4', 'C4'], tempo: 60 },
        correct: higher ? 'Cao hơn' : 'Thấp hơn',
        distractors: [higher ? 'Thấp hơn' : 'Cao hơn', 'Bằng nhau'],
        explanation: higher
          ? 'Âm thứ hai nghe bổng hơn nên cao hơn.'
          : 'Âm thứ hai nghe trầm hơn nên thấp hơn.',
        hint: 'Âm cao nghe trong và bổng, âm thấp nghe trầm.',
        rng,
      })
    }
    if (d === 2) {
      const longFirst = rng.chance(0.5)
      return audioChoice(skill, d, {
        prompt: 'Nghe hai tiếng gõ. Tiếng nào ngân dài hơn?',
        audio: { kind: 'rhythm', pattern: longFirst ? [3, 1] : [1, 3], tempo: 70 },
        correct: longFirst ? 'Tiếng thứ nhất' : 'Tiếng thứ hai',
        distractors: [longFirst ? 'Tiếng thứ hai' : 'Tiếng thứ nhất', 'Hai tiếng dài bằng nhau'],
        explanation: longFirst
          ? 'Tiếng đầu ngân 3 phách, tiếng sau chỉ 1 phách.'
          : 'Tiếng đầu chỉ 1 phách, tiếng sau ngân 3 phách.',
        rng,
      })
    }
    return choice(skill, d, {
      prompt: 'Âm thanh của nhạc cụ khác tiếng động trong tự nhiên ở điểm nào?',
      correct: 'Âm thanh nhạc cụ có cao độ rõ ràng, đọc được tên nốt',
      distractors: [
        'Âm thanh tự nhiên bao giờ cũng to hơn',
        'Âm thanh nhạc cụ bao giờ cũng ngắn hơn',
        'Hai loại hoàn toàn giống nhau',
      ],
      explanation: 'Tiếng mưa, tiếng gió không có cao độ rõ ràng; tiếng đàn thì đọc được tên nốt.',
      rng,
    })
  },

  'music.g2.nhac-cu-go': (skill, d, rng) => {
    if (d === 1) {
      return choice(skill, d, {
        prompt: 'Nhạc cụ nào dưới đây là nhạc cụ gõ dùng trong giờ học Âm nhạc?',
        correct: 'Thanh phách',
        distractors: ['Đàn pi-a-nô', 'Cây sáo', 'Cái mic-rô'],
        explanation: 'Thanh phách là nhạc cụ gõ quen thuộc nhất trong giờ Âm nhạc lớp 2.',
        rng,
      })
    }
    if (d === 2) {
      const target = rng.pick(PERCUSSION)
      return choice(skill, d, {
        prompt: 'Nhạc cụ nào được chơi bằng cách ' + target.how + '?',
        correct: target.name,
        distractors: PERCUSSION.filter((i) => i.name !== target.name)
          .map((i) => i.name)
          .slice(0, 3),
        explanation: target.name + ' được chơi bằng cách ' + target.how + '.',
        rng,
      })
    }
    return choice(skill, d, {
      prompt: 'Nhạc cụ gõ dùng để làm gì khi cả lớp hát?',
      correct: 'Gõ đệm giữ nhịp cho bài hát',
      distractors: [
        'Thay cho tiếng hát của cả lớp',
        'Gõ càng to càng hay',
        'Gõ tự do, không cần theo nhịp',
      ],
      explanation: 'Nhạc cụ gõ giữ nhịp để cả lớp hát đều, không phải để át tiếng hát.',
      rng,
    })
  },

  'music.g2.nhac-cu-dan-toc': (skill, d, rng) => {
    if (d === 1) {
      return choice(skill, d, {
        prompt: 'Đàn bầu là nhạc cụ dân tộc của nước nào?',
        correct: 'Việt Nam',
        distractors: ['Nhật Bản', 'Hàn Quốc', 'Ấn Độ'],
        explanation: 'Đàn bầu là nhạc cụ dân tộc độc đáo của Việt Nam.',
        rng,
      })
    }
    if (d === 2) {
      return choice(skill, d, {
        prompt: 'Đàn bầu có mấy dây?',
        correct: 'Một dây',
        distractors: ['Hai dây', 'Bốn dây', 'Sáu dây'],
        explanation: 'Đàn bầu chỉ có một dây nên còn được gọi là độc huyền cầm.',
        rng,
      })
    }
    const target = rng.pick(FOLK)
    return choice(skill, d, {
      prompt: 'Nhạc cụ dân tộc nào ' + target.trait + '?',
      correct: target.name,
      distractors: FOLK.filter((f) => f.name !== target.name).map((f) => f.name),
      explanation: target.name + ': ' + target.trait + '.',
      rng,
    })
  },

  'music.g2.nghe-nhac-cam-thu': (skill, d, rng) => {
    if (d === 1) {
      const fast = rng.chance(0.5)
      return audioChoice(skill, d, {
        prompt: 'Nghe đoạn nhạc. Đoạn nhạc này nhanh hay chậm?',
        audio: { kind: 'rhythm', pattern: [1, 1, 1, 1, 1, 1], tempo: fast ? 150 : 60 },
        correct: fast ? 'Nhanh' : 'Chậm',
        distractors: [fast ? 'Chậm' : 'Nhanh', 'Không nhanh không chậm'],
        explanation: fast
          ? 'Các tiếng gõ nối nhau rất gấp nên nhịp độ nhanh.'
          : 'Các tiếng gõ cách nhau xa nên nhịp độ chậm.',
        hint: 'Thử gật đầu theo tiếng gõ xem nhanh hay chậm.',
        rng,
      })
    }
    if (d === 2) {
      const up = rng.chance(0.5)
      return audioChoice(skill, d, {
        prompt: 'Nghe giai điệu. Giai điệu này đi lên hay đi xuống?',
        audio: { kind: 'tone', notes: up ? ['C4', 'E4', 'G4'] : ['G4', 'E4', 'C4'], tempo: 80 },
        correct: up ? 'Đi lên' : 'Đi xuống',
        distractors: [up ? 'Đi xuống' : 'Đi lên', 'Giữ nguyên một cao độ'],
        explanation: up
          ? 'Ba nốt cao dần nên giai điệu đi lên.'
          : 'Ba nốt thấp dần nên giai điệu đi xuống.',
        rng,
      })
    }
    return choice(skill, d, {
      prompt: 'Khi nghe một bản nhạc, con nên làm gì?',
      correct: 'Ngồi yên, lắng nghe và cảm nhận',
      distractors: [
        'Vừa nghe vừa nói chuyện với bạn',
        'Hát to đè lên bản nhạc',
        'Gõ bàn thật mạnh theo nhạc',
      ],
      explanation: 'Nghe nhạc cần yên lặng mới cảm nhận được giai điệu và nhịp độ.',
      rng,
    })
  },
}

export default musicG2
