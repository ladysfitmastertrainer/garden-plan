/**
 * Câu hỏi Tiếng Việt BỔ SUNG - lớp 1.
 *
 * Vì sao có file này: đo tám trận liền của một em lớp 1 mới vào, 46/64 câu là
 * câu đã gặp, cả tám trận chỉ ra 18 câu khác nhau. Lớp 1 có năm kỹ năng mỗi kỹ
 * năng sáu câu, nhưng em mới vào chỉ mở được ba kỹ năng đầu - Âm và chữ cái,
 * Vần, Dấu thanh - vì Ghép tiếng và Đọc hiểu cần học xong những kỹ năng ấy trước
 * (xem `availableSkills`). Ba lần sáu là mười tám.
 *
 * Nên ba kỹ năng đầu thêm MƯỜI HAI câu mỗi kỹ năng, dồn vào bậc 1-2 là chỗ em mới
 * chơi gặp nhiều nhất; hai kỹ năng sau thêm sáu câu mỗi kỹ năng. Đáp án gõ chữ
 * chỉ dùng cho những tiếng dễ gõ - trẻ lớp 1 gõ dấu trên máy tính bảng rất vất.
 *
 * Gộp NỐI vào ngân hàng gốc - xem `mergeBanks` trong `registry.ts`.
 */

import type { Bank } from '../bank'

const bank: Bank = {
  'vietnamese.g1.am-chu-cai': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "mẹ" bắt đầu bằng âm nào?',
      correct: 'm', distractors: ['n', 'b', 'e'],
      explanation: 'Tiếng "mẹ" gồm âm đầu m, vần e và dấu nặng.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "hoa" bắt đầu bằng âm nào?',
      correct: 'h', distractors: ['o', 'a', 'k'],
      explanation: 'Tiếng "hoa" gồm âm đầu h và vần oa.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chữ cái nào đứng ngay trước chữ "e" trong bảng chữ cái?',
      correct: 'đ', distractors: ['d', 'ê', 'c'],
      explanation: 'Bảng chữ cái: ... c, d, đ, e, ê... Ngay trước e là đ.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "nhà" bắt đầu bằng âm nào?',
      correct: 'nh', distractors: ['n', 'h', 'ng'],
      explanation: 'Tiếng "nhà" có âm đầu là nh - hai chữ cái ghép thành một âm.',
      hint: 'Âm đầu có thể gồm hai chữ cái.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Con vật nào có tên bắt đầu bằng âm "g"?',
      correct: 'gà', distractors: ['vịt', 'chó', 'mèo'],
      explanation: 'Tiếng "gà" có âm đầu g.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "sữa" bắt đầu bằng âm nào?',
      correct: 's', distractors: ['x', 'ư', 'a'],
      explanation: 'Tiếng "sữa" có âm đầu s. Chú ý phân biệt s và x.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào bắt đầu bằng âm "ch"?',
      correct: 'chó', distractors: ['cá', 'tre', 'nho'],
      explanation: '"chó" có âm đầu ch; "tre" có âm đầu tr, "nho" có âm đầu nh.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào bắt đầu bằng âm "kh"?',
      correct: 'khỉ', distractors: ['kì', 'hổ', 'cá'],
      explanation: '"khỉ" có âm đầu kh; "kì" chỉ có âm đầu k.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chữ nào KHÔNG phải là nguyên âm?',
      correct: 'b', distractors: ['a', 'ê', 'u'],
      explanation: 'a, ê, u là nguyên âm; b là phụ âm.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng "quả" bắt đầu bằng âm nào?',
      correct: 'qu', distractors: ['q', 'u', 'k'],
      explanation: 'Chữ q luôn đi với u thành âm "qu", như trong quả, quê, quạt.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối âm đầu với tiếng bắt đầu bằng âm đó',
      pairs: [['gh', 'ghế'], ['ng', 'ngô'], ['tr', 'trâu']],
      explanation: 'ghế có âm đầu gh, ngô có âm đầu ng, trâu có âm đầu tr.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tiếng nào có âm đầu "gh"?',
      correct: 'ghi', distractors: ['gà', 'gỗ', 'gương'],
      explanation: 'Âm "gh" chỉ đứng trước e, ê, i - như ghi, ghế, ghe.',
      hint: 'Trước e, ê, i thì viết "gh".',
    },
  ],

  'vietnamese.g1.van-don-gian': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "mai" có vần gì?',
      correct: 'ai', distractors: ['a', 'am', 'ay'],
      explanation: 'Tiếng "mai" gồm âm đầu m và vần ai.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "nam" có vần gì?',
      correct: 'am', distractors: ['an', 'ang', 'a'],
      explanation: 'Tiếng "nam" gồm âm đầu n và vần am.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép âm "c" với vần "ô" được tiếng nào?',
      correct: 'cô', distractors: ['co', 'cơ', 'cu'],
      explanation: 'c + ô = cô.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "bố" có vần gì?',
      correct: 'ô', distractors: ['o', 'ơ', 'bô'],
      explanation: 'Tiếng "bố" gồm âm đầu b, vần ô và dấu sắc.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "vui" có vần gì?',
      correct: 'ui', distractors: ['u', 'uy', 'vi'],
      explanation: 'Tiếng "vui" gồm âm đầu v và vần ui.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng nào có vần "at"?',
      correct: 'hát', distractors: ['hai', 'hàn', 'hạc'],
      explanation: '"hát" có vần at; "hạc" có vần ac, "hàn" có vần an.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào có vần "anh"?',
      correct: 'bánh', distractors: ['bàn', 'bang', 'bạn'],
      explanation: '"bánh" có vần anh; "bàn", "bạn" có vần an, "bang" có vần ang.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào có vần "ươn"?',
      correct: 'vườn', distractors: ['vương', 'vàn', 'vượt'],
      explanation: '"vườn" có vần ươn; "vương" có vần ương, "vượt" có vần ươt.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Hai tiếng nào có cùng vần?',
      correct: 'hoa - loa', distractors: ['hoa - hai', 'mèo - mưa', 'cá - cỏ'],
      explanation: '"hoa" và "loa" cùng có vần oa.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Vần "iêng" có trong tiếng nào?',
      correct: 'chiêng', distractors: ['chiên', 'chanh', 'chung'],
      explanation: '"chiêng" có vần iêng; "chiên" có vần iên.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối vần với tiếng có vần đó',
      pairs: [['ăn', 'khăn'], ['ơi', 'bơi'], ['ong', 'vòng']],
      explanation: 'khăn có vần ăn, bơi có vần ơi, vòng có vần ong.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tiếng nào có vần khác với ba tiếng còn lại?',
      correct: 'mèo', distractors: ['cau', 'rau', 'sau'],
      explanation: 'cau, rau, sau đều có vần au; còn "mèo" có vần eo.',
      hint: 'Đọc to từng tiếng và nghe phần sau âm đầu.',
    },
  ],

  'vietnamese.g1.dau-thanh': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "hè" mang dấu thanh gì?',
      correct: 'dấu huyền', distractors: ['dấu sắc', 'dấu hỏi', 'dấu nặng'],
      explanation: 'Dấu huyền là nét xiên từ trái xuống phải, đặt trên chữ e: hè.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "lá" mang dấu thanh gì?',
      correct: 'dấu sắc', distractors: ['dấu huyền', 'dấu ngã', 'dấu nặng'],
      explanation: 'Dấu sắc là nét xiên từ phải xuống trái: lá.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "mũ" mang dấu thanh gì?',
      correct: 'dấu ngã', distractors: ['dấu hỏi', 'dấu sắc', 'dấu nặng'],
      explanation: 'Dấu ngã là nét lượn sóng đặt trên chữ: mũ.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Thêm dấu nặng vào tiếng "me" được tiếng nào?',
      correct: 'mẹ', distractors: ['mé', 'mè', 'mẻ'],
      explanation: 'Dấu nặng là dấu chấm đặt dưới chữ: me - mẹ.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "cỏ" mang dấu thanh gì?',
      correct: 'dấu hỏi', distractors: ['dấu ngã', 'dấu huyền', 'dấu sắc'],
      explanation: 'Dấu hỏi trông như cái móc câu nhỏ đặt trên chữ: cỏ.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng nào mang thanh ngang (không có dấu)?',
      correct: 'ba', distractors: ['bà', 'bá', 'bả'],
      explanation: '"ba" không có dấu nào, đó là thanh ngang.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào mang dấu hỏi?',
      correct: 'hổ', distractors: ['hồ', 'hố', 'hộ'],
      explanation: '"hổ" mang dấu hỏi; hồ - dấu huyền, hố - dấu sắc, hộ - dấu nặng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Đổi dấu sắc của "bé" thành dấu huyền, ta được tiếng nào?',
      correct: 'bè', distractors: ['bẻ', 'bẹ', 'be'],
      explanation: 'bé (dấu sắc) đổi thành dấu huyền là bè.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng "nghỉ" trong "nghỉ ngơi" mang dấu thanh gì?',
      correct: 'dấu hỏi', distractors: ['dấu ngã', 'dấu sắc', 'dấu nặng'],
      explanation: '"nghỉ" viết với dấu hỏi.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Bé đi nhà trẻ", tiếng nào mang dấu hỏi?',
      correct: 'trẻ', distractors: ['Bé', 'đi', 'nhà'],
      explanation: '"trẻ" mang dấu hỏi; "Bé" dấu sắc, "nhà" dấu huyền, "đi" thanh ngang.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối tiếng với dấu thanh của tiếng đó',
      pairs: [['gà', 'dấu huyền'], ['gỗ', 'dấu ngã'], ['gạo', 'dấu nặng']],
      explanation: 'gà có dấu huyền, gỗ có dấu ngã, gạo có dấu nặng.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào có một tiếng mang dấu hỏi và một tiếng mang dấu ngã?',
      correct: 'sửa chữa', distractors: ['bàn ghế', 'quả na', 'mũ len'],
      explanation: '"sửa" mang dấu hỏi, "chữa" mang dấu ngã.',
      hint: 'Xem dấu của từng tiếng trong từ.',
    },
  ],

  'vietnamese.g1.ghep-tieng': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép âm "m", vần "eo" và dấu huyền được tiếng nào?',
      correct: 'mèo', distractors: ['méo', 'mẹo', 'meo'],
      explanation: 'm + eo + dấu huyền = mèo.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép âm "c" với vần "ây" được tiếng nào?',
      correct: 'cây', distractors: ['cay', 'cầy', 'kây'],
      explanation: 'c + ây = cây.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép âm "tr" với vần "e" được tiếng nào?',
      correct: 'tre', distractors: ['che', 'te', 'tro'],
      explanation: 'tr + e = tre, như trong "cây tre".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng "gà" gồm những phần nào?',
      correct: 'âm g, vần a, dấu huyền',
      distractors: ['âm gà, vần a', 'âm g, vần a, dấu sắc', 'âm a, vần g, dấu huyền'],
      explanation: 'Tiếng "gà" = âm đầu g + vần a + dấu huyền.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Ghép âm "b" với vần "a" và thanh ngang được tiếng gì?',
      accepted: ['ba'],
      explanation: 'b + a = ba.',
      hint: 'Viết liền không dấu.',
    },
    {
      kind: 'order', difficulty: 3,
      prompt: 'Sắp xếp các tiếng thành tên một con vật',
      items: ['con', 'gà', 'trống'],
      explanation: 'Ghép lại được "con gà trống".',
    },
  ],

  'vietnamese.g1.doc-hieu-cau': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Đọc câu: "Bé Lan có con mèo mướp." Bé Lan có con gì?',
      correct: 'con mèo', distractors: ['con chó', 'con gà', 'con cá'],
      explanation: 'Câu nói Bé Lan có con mèo mướp.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Đọc câu: "Mẹ đi chợ mua cá." Mẹ đi đâu?',
      correct: 'đi chợ', distractors: ['đi học', 'đi làm', 'đi chơi'],
      explanation: 'Câu nói mẹ đi chợ để mua cá.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Đọc câu: "Quả cam chín vàng trên cây." Quả cam có màu gì?',
      correct: 'màu vàng', distractors: ['màu đỏ', 'màu xanh', 'màu tím'],
      explanation: 'Câu nói quả cam chín vàng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Đọc: "Nhà bà có vườn rau. Bé ra vườn tưới rau giúp bà." Bé làm gì?',
      correct: 'tưới rau giúp bà', distractors: ['hái quả', 'đi chợ với bà', 'nấu cơm'],
      explanation: 'Đoạn văn kể bé ra vườn tưới rau giúp bà.',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp thành câu có nghĩa',
      items: ['Bé', 'đi học', 'đúng giờ'],
      explanation: 'Câu đúng: "Bé đi học đúng giờ."',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Đọc: "Trời mưa to. Hà quên mang áo mưa. Minh cho Hà mặc chung áo mưa." Vì sao Hà cần áo mưa?',
      correct: 'Vì trời mưa to', distractors: ['Vì trời nắng', 'Vì Hà bị ốm', 'Vì Minh bảo thế'],
      explanation: 'Câu đầu cho biết trời mưa to, mà Hà lại quên mang áo mưa.',
      hint: 'Đọc lại câu đầu tiên.',
    },
  ],
}

export default bank
