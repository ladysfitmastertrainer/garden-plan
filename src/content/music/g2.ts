/**
 * Bộ sinh câu hỏi Âm nhạc lớp 2 - phần bám SGK Âm nhạc 2 (Kết nối tri thức).
 *
 * Năm kỹ năng ở đây ứng với các mạch nội dung của sách mà app chưa có: sắc màu
 * âm thanh, nhạc cụ gõ trong giờ học, nhạc cụ dân tộc, nghe nhạc - cảm thụ, và
 * hình tiết tấu. Các kỹ năng còn lại (đọc nhạc, nhịp 2/4, hát) nằm trong
 * `index.ts` cùng các lớp khác. Xem docs/sgk-lop-2.md.
 *
 * Cùng nguyên tắc với `index.ts`: không nhánh nào được viết cứng đúng một câu.
 * Bản trước có sáu nhánh như vậy ("Đàn bầu là nhạc cụ của nước nào?", "Đàn bầu
 * có mấy dây?"...), và trẻ đánh chặng ấy là gặp lại y nguyên.
 */

import { audioChoice, choice, type GeneratorMap } from '../factory'
import type { Rng } from '../../engine/rng'
import type { NoteName } from '../types'

/** Cao độ tăng dần - riêng file này, để không nhập vòng với `index.ts`. */
const LADDER: NoteName[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

/** Bộ nhạc cụ gõ sách liệt kê ở đầu quyển. */
const PERCUSSION = [
  { name: 'Thanh phách', how: 'gõ hai thanh tre vào nhau' },
  { name: 'Song loan', how: 'bật lá tre cho gõ vào hộp gỗ' },
  { name: 'Trống nhỏ', how: 'gõ dùi lên mặt trống' },
  { name: 'Tem-bơ-rin', how: 'lắc hoặc vỗ vào mặt trống tròn có đĩa kim loại' },
  { name: 'Trai-en-gô', how: 'gõ que kim loại vào thanh sắt hình tam giác' },
]

/** Nhạc cụ KHÔNG phải nhạc cụ gõ - làm phương án nhiễu. */
const NOT_PERCUSSION = ['Đàn pi-a-nô', 'Cây sáo', 'Kèn', 'Đàn ghi-ta', 'Đàn vi-ô-lông']

const FOLK = [
  { name: 'Đàn bầu', trait: 'chỉ có một dây, tiếng ngân dài và mềm', how: 'Gảy dây' },
  { name: 'Sáo trúc', trait: 'làm bằng ống trúc, thổi bằng hơi', how: 'Thổi bằng hơi' },
  { name: 'Đàn tranh', trait: 'nhiều dây căng trên mặt gỗ dài, gảy bằng móng', how: 'Gảy dây' },
  { name: 'Trống cơm', trait: 'trống dài đeo trước bụng, vỗ bằng hai tay', how: 'Vỗ bằng tay' },
  { name: 'Đàn nhị', trait: 'có hai dây, kéo bằng cung vĩ', how: 'Kéo bằng cung vĩ' },
  { name: "Đàn t'rưng", trait: 'nhiều ống nứa dài ngắn xếp thành hàng, gõ bằng dùi', how: 'Gõ bằng dùi' },
]

/** Nhạc cụ nước ngoài - làm phương án nhiễu cho câu "nhạc cụ dân tộc Việt Nam". */
const FOREIGN = ['Đàn pi-a-nô', 'Đàn vi-ô-lông', 'Kèn sắc-xô-phôn', 'Đàn ghi-ta điện']

/** Một giai điệu ngắn đi hẳn lên hoặc hẳn xuống. */
function steppedMelody(rng: Rng, length: number, up: boolean): NoteName[] {
  const start = rng.int(0, LADDER.length - length)
  const notes = LADDER.slice(start, start + length)
  return up ? notes : notes.reverse()
}

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const musicG2: GeneratorMap = {
  'music.g2.sac-mau-am-thanh': (skill, d, rng) => {
    if (d === 1) {
      const gap = rng.int(3, 7)
      const low = rng.int(0, LADDER.length - 1 - gap)
      const higher = rng.chance(0.5)
      const notes: NoteName[] = higher ? [LADDER[low]!, LADDER[low + gap]!] : [LADDER[low + gap]!, LADDER[low]!]
      return audioChoice(skill, d, {
        prompt: 'Nghe hai âm thanh. Âm thứ hai cao hơn hay thấp hơn âm thứ nhất?',
        audio: { kind: 'tone', notes, tempo: 60 },
        correct: higher ? 'Cao hơn' : 'Thấp hơn',
        distractors: [higher ? 'Thấp hơn' : 'Cao hơn', 'Bằng nhau'],
        explanation: higher ? 'Âm thứ hai nghe bổng hơn nên cao hơn.' : 'Âm thứ hai nghe trầm hơn nên thấp hơn.',
        hint: 'Âm cao nghe trong và bổng, âm thấp nghe trầm.',
        rng,
      })
    }
    if (d === 2) {
      const longBeats = rng.int(2, 4)
      const longFirst = rng.chance(0.5)
      const askLong = rng.chance(0.5)
      const answerFirst = askLong === longFirst
      return audioChoice(skill, d, {
        prompt: `Nghe hai tiếng gõ. Tiếng nào ngân ${askLong ? 'dài' : 'ngắn'} hơn?`,
        audio: { kind: 'rhythm', pattern: longFirst ? [longBeats, 1] : [1, longBeats], tempo: rng.pick([60, 70]) },
        correct: answerFirst ? 'Tiếng thứ nhất' : 'Tiếng thứ hai',
        distractors: [answerFirst ? 'Tiếng thứ hai' : 'Tiếng thứ nhất', 'Hai tiếng dài bằng nhau'],
        explanation: longFirst ? `Tiếng đầu ngân ${longBeats} phách, tiếng sau chỉ 1 phách.` : `Tiếng đầu chỉ 1 phách, tiếng sau ngân ${longBeats} phách.`,
        rng,
      })
    }
    const item = rng.pick([
      {
        q: 'Âm thanh của nhạc cụ khác tiếng động trong tự nhiên ở điểm nào?',
        a: 'Âm thanh nhạc cụ có cao độ rõ ràng, đọc được tên nốt',
        no: ['Âm thanh tự nhiên bao giờ cũng to hơn', 'Âm thanh nhạc cụ bao giờ cũng ngắn hơn', 'Hai loại hoàn toàn giống nhau'],
        e: 'Tiếng mưa, tiếng gió không có cao độ rõ ràng; tiếng đàn thì đọc được tên nốt.',
      },
      {
        q: 'Âm thanh nào dưới đây là tiếng động trong tự nhiên?',
        a: rng.pick(['Tiếng mưa rơi', 'Tiếng gió thổi', 'Tiếng suối chảy', 'Tiếng sóng biển']),
        no: ['Tiếng đàn pi-a-nô', 'Tiếng sáo trúc', 'Tiếng đàn bầu'],
        e: 'Tiếng mưa, gió, suối, sóng là âm thanh của thiên nhiên; tiếng đàn, tiếng sáo là âm thanh nhạc cụ.',
      },
      {
        q: 'Âm thanh nào dưới đây là âm thanh của nhạc cụ?',
        a: rng.pick(['Tiếng đàn tranh', 'Tiếng sáo trúc', 'Tiếng đàn pi-a-nô', 'Tiếng trống']),
        no: ['Tiếng mưa rơi', 'Tiếng gà gáy', 'Tiếng gió thổi'],
        e: 'Âm thanh nhạc cụ do con người tạo ra bằng nhạc cụ để chơi nhạc.',
      },
    ])
    return choice(skill, d, { prompt: item.q, correct: item.a, distractors: item.no, explanation: item.e, rng })
  },

  'music.g2.nhac-cu-go': (skill, d, rng) => {
    if (d === 1 && rng.chance(0.4)) {
      // Ngược lại: tìm cái KHÔNG phải nhạc cụ gõ giữa ba nhạc cụ gõ.
      const odd = rng.pick(NOT_PERCUSSION)
      return choice(skill, d, {
        prompt: 'Nhạc cụ nào dưới đây KHÔNG phải là nhạc cụ gõ?',
        correct: odd,
        distractors: rng.sample(PERCUSSION, 3).map((item) => item.name),
        explanation: `${odd} không phải nhạc cụ gõ; các nhạc cụ còn lại đều được chơi bằng cách gõ, lắc hoặc vỗ.`,
        rng,
      })
    }
    if (d === 1) {
      const target = rng.pick(PERCUSSION)
      return choice(skill, d, {
        prompt: 'Nhạc cụ nào dưới đây là nhạc cụ gõ dùng trong giờ học Âm nhạc?',
        correct: target.name,
        distractors: rng.sample(NOT_PERCUSSION, 3),
        explanation: `${target.name} là nhạc cụ gõ: ${target.how}.`,
        rng,
      })
    }
    if (d === 2 && rng.chance(0.5)) {
      const target = rng.pick(PERCUSSION)
      return choice(skill, d, {
        prompt: `${target.name} được chơi bằng cách nào?`,
        correct: cap(target.how),
        distractors: rng.sample(PERCUSSION.filter((i) => i.name !== target.name), 3).map((i) => cap(i.how)),
        explanation: `${target.name}: ${target.how}.`,
        rng,
      })
    }
    if (d === 2) {
      const target = rng.pick(PERCUSSION)
      return choice(skill, d, {
        prompt: 'Nhạc cụ nào được chơi bằng cách ' + target.how + '?',
        correct: target.name,
        distractors: rng.sample(PERCUSSION.filter((i) => i.name !== target.name), 3).map((i) => i.name),
        explanation: target.name + ' được chơi bằng cách ' + target.how + '.',
        rng,
      })
    }
    const item = rng.pick([
      {
        q: 'Nhạc cụ gõ dùng để làm gì khi cả lớp hát?',
        a: 'Gõ đệm giữ nhịp cho bài hát',
        no: ['Thay cho tiếng hát của cả lớp', 'Gõ càng to càng hay', 'Gõ tự do, không cần theo nhịp'],
        e: 'Nhạc cụ gõ giữ nhịp để cả lớp hát đều, không phải để át tiếng hát.',
      },
      {
        q: 'Khi gõ đệm cho bài hát, con nên gõ thế nào?',
        a: 'Gõ đều theo phách, vừa đủ nghe',
        no: ['Gõ thật mạnh để át tiếng hát', 'Gõ lúc nhanh lúc chậm tuỳ thích', 'Gõ trước khi cả lớp bắt đầu hát thật lâu'],
        e: 'Gõ đệm phải đều và vừa phải để làm nền cho tiếng hát.',
      },
      {
        q: 'Dùng xong nhạc cụ gõ của lớp, con nên làm gì?',
        a: 'Cất nhạc cụ gọn gàng vào đúng chỗ',
        no: ['Để lại trên bàn cho bạn khác cất', 'Mang về nhà chơi tiếp', 'Gõ thử thêm thật to'],
        e: 'Giữ gìn nhạc cụ chung để giờ sau cả lớp còn dùng.',
      },
      {
        q: 'Bạn bên cạnh gõ nhạc cụ lệch nhịp. Con nên làm gì?',
        a: 'Gõ đều và nhắc nhỏ bạn nghe theo nhịp bài hát',
        no: ['Gõ thật to để át bạn', 'Dừng gõ và cười bạn', 'Giành nhạc cụ của bạn'],
        e: 'Giúp nhau giữ nhịp thì cả lớp gõ đệm mới hay.',
      },
      {
        q: 'Để gõ đệm đúng nhịp, trước tiên con cần làm gì?',
        a: 'Nghe kỹ bài hát và đếm phách trong đầu',
        no: ['Gõ thật nhanh ngay từ đầu', 'Nhìn bạn khác rồi gõ theo tuỳ ý', 'Không cần nghe bài hát'],
        e: 'Nghe và đếm phách giúp tay gõ khớp với bài hát.',
      },
      {
        q: 'Cả lớp chia hai nhóm: một nhóm hát, một nhóm gõ đệm. Nhóm gõ nên làm gì?',
        a: 'Gõ nhẹ hơn tiếng hát và giữ nhịp thật đều',
        no: ['Gõ to hết sức cho nổi bật', 'Hát to cùng nhóm hát', 'Gõ khi nào thích'],
        e: 'Tiếng gõ đệm làm nền cho tiếng hát, không lấn át tiếng hát.',
      },
    ])
    return choice(skill, d, { prompt: item.q, correct: item.a, distractors: item.no, explanation: item.e, rng })
  },

  'music.g2.nhac-cu-dan-toc': (skill, d, rng) => {
    if (d === 1) {
      const target = rng.pick(FOLK)
      return choice(skill, d, {
        prompt: 'Nhạc cụ nào dưới đây là nhạc cụ dân tộc Việt Nam?',
        correct: target.name,
        distractors: rng.sample(FOREIGN, 3),
        explanation: `${target.name} là nhạc cụ dân tộc Việt Nam: ${target.trait}.`,
        rng,
      })
    }
    if (d === 2) {
      const target = rng.pick(FOLK)
      return choice(skill, d, {
        prompt: `${target.name} được chơi bằng cách nào?`,
        correct: target.how,
        distractors: ['Gảy dây', 'Thổi bằng hơi', 'Vỗ bằng tay', 'Kéo bằng cung vĩ', 'Gõ bằng dùi'].filter((h) => h !== target.how).slice(0, 3),
        explanation: `${target.name}: ${target.trait}.`,
        rng,
      })
    }
    const target = rng.pick(FOLK)
    return choice(skill, d, {
      prompt: 'Nhạc cụ dân tộc nào ' + target.trait + '?',
      correct: target.name,
      distractors: rng.sample(FOLK.filter((f) => f.name !== target.name), 3).map((f) => f.name),
      explanation: target.name + ': ' + target.trait + '.',
      rng,
    })
  },

  'music.g2.nghe-nhac-cam-thu': (skill, d, rng) => {
    if (d === 1) {
      const fast = rng.chance(0.5)
      const count = rng.int(5, 8)
      return audioChoice(skill, d, {
        prompt: 'Nghe đoạn nhạc. Đoạn nhạc này nhanh hay chậm?',
        audio: { kind: 'rhythm', pattern: Array.from({ length: count }, () => 1), tempo: fast ? rng.pick([140, 150, 160]) : rng.pick([55, 60, 65]) },
        correct: fast ? 'Nhanh' : 'Chậm',
        distractors: [fast ? 'Chậm' : 'Nhanh', 'Không nhanh không chậm'],
        explanation: fast ? 'Các tiếng gõ nối nhau rất gấp nên nhịp độ nhanh.' : 'Các tiếng gõ cách nhau xa nên nhịp độ chậm.',
        hint: 'Thử gật đầu theo tiếng gõ xem nhanh hay chậm.',
        rng,
      })
    }
    if (d === 2) {
      const up = rng.chance(0.5)
      return audioChoice(skill, d, {
        prompt: 'Nghe giai điệu. Giai điệu này đi lên hay đi xuống?',
        audio: { kind: 'tone', notes: steppedMelody(rng, rng.int(3, 5), up), tempo: rng.pick([70, 80, 90]) },
        correct: up ? 'Đi lên' : 'Đi xuống',
        distractors: [up ? 'Đi xuống' : 'Đi lên', 'Giữ nguyên một cao độ'],
        explanation: up ? 'Các nốt cao dần nên giai điệu đi lên.' : 'Các nốt thấp dần nên giai điệu đi xuống.',
        rng,
      })
    }
    const item = rng.pick([
      {
        q: 'Khi nghe một bản nhạc, con nên làm gì?',
        a: 'Ngồi yên, lắng nghe và cảm nhận',
        no: ['Vừa nghe vừa nói chuyện với bạn', 'Hát to đè lên bản nhạc', 'Gõ bàn thật mạnh theo nhạc'],
        e: 'Nghe nhạc cần yên lặng mới cảm nhận được giai điệu và nhịp độ.',
      },
      {
        q: 'Nghe một bản nhạc nhanh, rộn ràng, con thường cảm thấy thế nào?',
        a: 'Vui tươi, muốn nhún nhảy',
        no: ['Buồn ngủ', 'Buồn bã, muốn khóc', 'Sợ hãi'],
        e: 'Nhạc nhanh, rộn ràng thường mang lại cảm giác vui tươi.',
      },
      {
        q: 'Nghe một bản nhạc chậm, nhẹ nhàng, con thường cảm thấy thế nào?',
        a: 'Êm dịu, thư thái',
        no: ['Muốn chạy nhảy thật nhanh', 'Giật mình, hoảng hốt', 'Tức giận'],
        e: 'Nhạc chậm và nhẹ thường đem lại cảm giác êm dịu.',
      },
      {
        q: 'Nghe xong một bản nhạc hay, con có thể làm gì?',
        a: 'Kể cho bạn nghe con thích điều gì ở bản nhạc',
        no: ['Chê bản nhạc cho vui', 'Quên ngay', 'Tắt nhạc của bạn khác đang nghe'],
        e: 'Chia sẻ cảm nhận giúp con nhớ lâu và nghe nhạc hay hơn.',
      },
      {
        q: 'Đang nghe nhạc bằng loa ở nơi đông người, con nên làm gì?',
        a: 'Vặn nhỏ vừa đủ nghe để không làm phiền người khác',
        no: ['Vặn thật to cho mọi người cùng nghe', 'Mở nhiều bài cùng lúc', 'Hát to theo nhạc'],
        e: 'Nghe nhạc cũng cần tôn trọng người xung quanh.',
      },
      {
        q: 'Muốn nhớ giai điệu một bài hát, con nên làm gì?',
        a: 'Nghe nhiều lần và ngân nga theo',
        no: ['Chỉ đọc lời bài hát', 'Nghe một lần rồi thôi', 'Nghe bài khác thật nhiều'],
        e: 'Nghe và ngân nga nhiều lần giúp giai điệu in vào trí nhớ.',
      },
    ])
    return choice(skill, d, { prompt: item.q, correct: item.a, distractors: item.no, explanation: item.e, rng })
  },
}

export default musicG2
