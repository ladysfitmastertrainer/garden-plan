/**
 * Câu hỏi Tiếng Việt BỔ SUNG - lớp 3-5.
 *
 * Tính chung thì lớp 3-5 không lặp câu, vì bộ chọn bốc lẫn cả kỹ năng lớp dưới.
 * Nhưng mỗi kỹ năng RIÊNG của lớp 3-5 chỉ có sáu câu, mỗi bậc hai câu - và một
 * chặng trên bản đồ là đúng một kỹ năng, nên trẻ đánh chặng ấy vài lần là gặp
 * lại. Mỗi kỹ năng thêm sáu câu, đều hai câu mỗi bậc.
 *
 * Gộp NỐI vào ngân hàng gốc - xem `mergeBanks` trong `registry.ts`.
 */

import type { Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // LỚP 3
  // =========================================================================

  'vietnamese.g3.dong-nghia-trai-nghia': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào đồng nghĩa với "chăm chỉ"?',
      correct: 'siêng năng', distractors: ['lười biếng', 'nhanh nhẹn', 'vui vẻ'],
      explanation: '"Chăm chỉ" và "siêng năng" cùng chỉ người chịu khó làm việc.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào trái nghĩa với "rộng"?',
      correct: 'hẹp', distractors: ['dài', 'to', 'xa'],
      explanation: '"Rộng" và "hẹp" có nghĩa trái ngược nhau.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào trái nghĩa với "dũng cảm"?',
      correct: 'hèn nhát', distractors: ['gan dạ', 'can đảm', 'mạnh mẽ'],
      explanation: '"Gan dạ", "can đảm" đồng nghĩa với "dũng cảm"; "hèn nhát" thì trái nghĩa.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối mỗi từ với từ đồng nghĩa của nó',
      pairs: [['to lớn', 'khổng lồ'], ['xinh đẹp', 'xinh xắn'], ['vui vẻ', 'vui tươi']],
      explanation: 'Các cặp từ có nghĩa giống hoặc gần giống nhau là từ đồng nghĩa.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Cặp từ nào KHÔNG phải là cặp từ trái nghĩa?',
      correct: 'nhanh - lẹ', distractors: ['sáng - tối', 'nóng - lạnh', 'đầy - vơi'],
      explanation: '"Nhanh" và "lẹ" có nghĩa giống nhau, đó là cặp từ đồng nghĩa.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền từ trái nghĩa với "khó": "Việc ... thì làm trước, việc khó thì làm sau."',
      accepted: ['dễ'],
      explanation: '"Dễ" trái nghĩa với "khó".',
    },
  ],

  'vietnamese.g3.bien-phap-so-sanh': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu văn nào có sử dụng phép so sánh?',
      correct: 'Những đám mây trắng như bông.',
      distractors: ['Những đám mây bay trên trời.', 'Bầu trời có nhiều mây.', 'Em nhìn những đám mây.'],
      explanation: 'Câu so sánh "đám mây" với "bông" bằng từ "như".',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Mắt bé tròn như hạt nhãn", sự vật nào được so sánh với "hạt nhãn"?',
      correct: 'mắt bé', distractors: ['bé', 'tròn', 'như'],
      explanation: '"Mắt bé" được so sánh với "hạt nhãn" vì cùng tròn.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào thường được dùng để so sánh hai sự vật?',
      correct: 'như', distractors: ['và', 'nhưng', 'vì'],
      explanation: 'Các từ "như", "tựa", "giống như", "là" thường dùng để so sánh.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Điền từ so sánh vào chỗ trống: "Tiếng suối trong ... tiếng hát xa."',
      accepted: ['như'],
      explanation: 'Câu thơ của Bác Hồ: "Tiếng suối trong như tiếng hát xa".',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu "Trăng tròn như cái đĩa" so sánh hai sự vật dựa trên đặc điểm gì?',
      correct: 'Hình dáng', distractors: ['Màu sắc', 'Âm thanh', 'Mùi vị'],
      explanation: 'Trăng và cái đĩa giống nhau ở hình dáng tròn.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào là so sánh HƠN KÉM?',
      correct: 'Bạn Nam cao hơn bạn Minh.',
      distractors: ['Bạn Nam cao như bạn Minh.', 'Bạn Nam rất cao.', 'Bạn Nam và bạn Minh đều cao.'],
      explanation: 'Từ "hơn" cho thấy hai sự vật không ngang bằng: so sánh hơn kém.',
      hint: 'Tìm từ "hơn" hoặc "kém".',
    },
  ],

  'vietnamese.g3.mau-cau-ai-la-gi': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào được viết theo mẫu "Ai là gì?"',
      correct: 'Bố em là bác sĩ.',
      distractors: ['Bố em đang đọc báo.', 'Bố em rất cao.', 'Bố em đi làm về muộn.'],
      explanation: 'Câu "Bố em là bác sĩ" giới thiệu bố là ai, có từ "là".',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Mèo là con vật em yêu thích", bộ phận trả lời câu hỏi "Là gì?" là:',
      correct: 'con vật em yêu thích', distractors: ['Mèo', 'là', 'em yêu thích'],
      explanation: 'Mèo là gì? - là con vật em yêu thích.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Hà Nội là thủ đô của nước ta", bộ phận trả lời câu hỏi "Cái gì?" là:',
      correct: 'Hà Nội', distractors: ['thủ đô', 'nước ta', 'là thủ đô'],
      explanation: 'Cái gì là thủ đô của nước ta? - Hà Nội.',
    },
    {
      kind: 'order', difficulty: 2,
      prompt: 'Sắp xếp thành câu kiểu "Ai là gì?"',
      items: ['Lan', 'là', 'lớp trưởng', 'lớp em'],
      explanation: 'Câu đúng: "Lan là lớp trưởng lớp em."',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng để giới thiệu một người?',
      correct: 'Đây là bạn Minh, bạn mới của lớp mình.',
      distractors: ['Bạn Minh chạy rất nhanh.', 'Bạn Minh đang tưới cây.', 'Bạn Minh ơi, lại đây!'],
      explanation: 'Câu kiểu "Ai là gì?" thường dùng để giới thiệu người hoặc vật.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Đặt câu hỏi cho bộ phận "bạn của nhà nông" trong câu "Chim sâu là bạn của nhà nông."',
      correct: 'Chim sâu là gì?',
      distractors: ['Ai là bạn của nhà nông?', 'Chim sâu làm gì?', 'Chim sâu thế nào?'],
      explanation: 'Bộ phận "bạn của nhà nông" trả lời câu hỏi "Là gì?".',
    },
  ],

  'vietnamese.g3.dau-hai-cham-ngoac-kep': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Vườn nhà em có nhiều loại quả: cam, bưởi, xoài.", dấu hai chấm dùng để làm gì?',
      correct: 'Báo hiệu phần liệt kê phía sau',
      distractors: ['Báo hiệu câu hỏi', 'Kết thúc câu', 'Báo hiệu lời nói trực tiếp'],
      explanation: 'Sau dấu hai chấm là các loại quả được kể ra: cam, bưởi, xoài.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu Mẹ dặn: "Con nhớ mặc áo ấm nhé!", dấu ngoặc kép dùng để làm gì?',
      correct: 'Đánh dấu lời nói của mẹ',
      distractors: ['Đánh dấu tên riêng', 'Kết thúc câu', 'Liệt kê sự vật'],
      explanation: 'Dấu ngoặc kép đánh dấu lời nói trực tiếp của nhân vật.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào đặt dấu hai chấm ĐÚNG?',
      correct: 'Cô giáo hỏi: "Ai làm xong bài rồi?"',
      distractors: [
        'Cô giáo: hỏi "Ai làm xong bài rồi?"',
        'Cô giáo hỏi "Ai làm xong: bài rồi?"',
        'Cô: giáo hỏi "Ai làm xong bài rồi?"',
      ],
      explanation: 'Dấu hai chấm đặt ngay trước lời nói trực tiếp.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Cần đặt dấu hai chấm ở đâu trong câu: "Nhà em nuôi ba con vật chó, mèo và gà."?',
      correct: 'Sau chữ "vật"', distractors: ['Sau chữ "nuôi"', 'Sau chữ "chó"', 'Sau chữ "gà"'],
      explanation: '"Nhà em nuôi ba con vật: chó, mèo và gà." - dấu hai chấm đứng trước phần liệt kê.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng dấu ngoặc kép để đánh dấu từ ngữ được hiểu theo nghĩa đặc biệt?',
      correct: 'Chú mèo là "cảnh sát" bắt chuột của nhà em.',
      distractors: ['Bố nói: "Con làm tốt lắm!"', 'Bạn Lan hỏi: "Mấy giờ rồi?"', 'Em đọc truyện "Tấm Cám".'],
      explanation: 'Chú mèo không phải cảnh sát thật - dấu ngoặc kép báo từ này được hiểu theo nghĩa đặc biệt.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Trong câu Bé hỏi: "Mẹ ơi, trăng có ăn được không?", phần trong dấu ngoặc kép là gì?',
      correct: 'Lời nói của bé', distractors: ['Lời nói của mẹ', 'Suy nghĩ của mẹ', 'Tên một bài hát'],
      explanation: 'Phần trong ngoặc kép là câu bé hỏi mẹ.',
    },
  ],

  'vietnamese.g3.tu-chi-dac-diem': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong các từ sau, từ nào chỉ màu sắc của sự vật?',
      correct: 'xanh biếc', distractors: ['cây bàng', 'trồng cây', 'tưới nước'],
      explanation: '"Xanh biếc" chỉ màu sắc - một đặc điểm của sự vật.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào chỉ đặc điểm của quả chanh?',
      correct: 'chua', distractors: ['quả', 'hái', 'vườn'],
      explanation: '"Chua" chỉ vị của quả chanh.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Bầu trời mùa thu trong xanh và cao vời vợi", các từ chỉ đặc điểm là:',
      correct: 'trong xanh, cao vời vợi',
      distractors: ['bầu trời, mùa thu', 'mùa thu, cao vời vợi', 'bầu trời, trong xanh'],
      explanation: '"Trong xanh" và "cao vời vợi" tả đặc điểm của bầu trời.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối sự vật với đặc điểm phù hợp',
      pairs: [['Đường', 'ngọt'], ['Muối', 'mặn'], ['Ớt', 'cay']],
      explanation: 'Đường ngọt, muối mặn, ớt cay.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ chỉ đặc điểm nào tả TÍNH NẾT của người?',
      correct: 'hiền lành', distractors: ['cao lớn', 'trắng trẻo', 'mũm mĩm'],
      explanation: '"Hiền lành" chỉ tính nết; các từ còn lại tả hình dáng bên ngoài.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn từ chỉ đặc điểm phù hợp: "Mùa đông, gió thổi ... buốt."',
      correct: 'lạnh', distractors: ['nóng', 'ấm', 'oi'],
      explanation: 'Gió mùa đông lạnh buốt.',
    },
  ],

  // =========================================================================
  // LỚP 4
  // =========================================================================

  'vietnamese.g4.danh-dong-tinh-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là danh từ chỉ hiện tượng tự nhiên?',
      correct: 'mưa', distractors: ['chạy', 'đẹp', 'nhanh'],
      explanation: '"Mưa" là danh từ chỉ hiện tượng tự nhiên.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Nhóm từ nào gồm toàn động từ?',
      correct: 'chạy, nhảy, hát', distractors: ['bàn, ghế, tủ', 'xanh, đỏ, vàng', 'chạy, bàn, xanh'],
      explanation: 'Chạy, nhảy, hát đều chỉ hoạt động - đó là động từ.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Nhóm từ nào gồm toàn tính từ?',
      correct: 'cao, thấp, xinh đẹp', distractors: ['cao, bàn, chạy', 'học sinh, cô giáo, bác sĩ', 'ăn, uống, ngủ'],
      explanation: 'Cao, thấp, xinh đẹp đều chỉ đặc điểm - đó là tính từ.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Chú mèo mướp lười biếng nằm sưởi nắng", từ nào là tính từ?',
      correct: 'lười biếng', distractors: ['mèo mướp', 'nằm', 'sưởi'],
      explanation: '"Lười biếng" chỉ tính nết của chú mèo - là tính từ.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ "niềm vui" thuộc từ loại nào?',
      correct: 'Danh từ', distractors: ['Động từ', 'Tính từ', 'Quan hệ từ'],
      explanation: '"Vui" là tính từ, nhưng thêm "niềm" thành "niềm vui" thì là danh từ.',
      hint: 'Thử đặt câu: "... của em rất lớn".',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Trong câu "Học sinh chăm chỉ học bài", nối mỗi từ với từ loại của nó',
      pairs: [['học sinh', 'Danh từ'], ['chăm chỉ', 'Tính từ'], ['học', 'Động từ']],
      explanation: '"Học sinh" chỉ người, "chăm chỉ" chỉ đặc điểm, "học" chỉ hoạt động.',
    },
  ],

  'vietnamese.g4.chu-ngu-vi-ngu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Bầy ong bay đi tìm mật.", chủ ngữ là gì?',
      correct: 'Bầy ong', distractors: ['bay đi', 'tìm mật', 'ong bay'],
      explanation: 'Con gì bay đi tìm mật? - Bầy ong.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Cô giáo em rất hiền.", vị ngữ là gì?',
      correct: 'rất hiền', distractors: ['Cô giáo', 'Cô giáo em', 'em rất hiền'],
      explanation: 'Cô giáo em thế nào? - rất hiền.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chủ ngữ trong câu thường trả lời cho câu hỏi nào?',
      correct: 'Ai? Cái gì? Con gì?',
      distractors: ['Làm gì? Thế nào?', 'Ở đâu? Khi nào?', 'Vì sao? Để làm gì?'],
      explanation: 'Chủ ngữ chỉ người, vật được nói đến - trả lời câu hỏi Ai?, Cái gì?, Con gì?',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào có vị ngữ nêu đặc điểm (trả lời câu hỏi "Thế nào?")?',
      correct: 'Dòng sông quê em rất trong.',
      distractors: ['Dòng sông chảy qua làng.', 'Dòng sông là nơi em tắm mát.', 'Em ra sông bắt cá.'],
      explanation: 'Dòng sông quê em thế nào? - rất trong.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Trong câu "Mỗi sáng, ông em tưới những chậu cây cảnh trước hiên.", vị ngữ là gì?',
      correct: 'tưới những chậu cây cảnh trước hiên',
      distractors: ['Mỗi sáng', 'ông em', 'những chậu cây cảnh'],
      explanation: '"Mỗi sáng" là trạng ngữ, "ông em" là chủ ngữ, phần còn lại là vị ngữ.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn chủ ngữ phù hợp: "... đang gặm cỏ ngoài đồng."',
      correct: 'Đàn bò', distractors: ['Rất xanh', 'Chạy nhảy', 'Buổi sáng'],
      explanation: 'Chủ ngữ phải trả lời câu hỏi "Con gì đang gặm cỏ?" - Đàn bò.',
    },
  ],

  'vietnamese.g4.cau-khien-cau-cam': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào dùng để nhờ, yêu cầu người khác làm việc gì đó?',
      correct: 'Bạn cho mình mượn cái thước nhé!',
      distractors: ['Cái thước này dài quá!', 'Cái thước của bạn màu gì?', 'Tớ có một cái thước.'],
      explanation: 'Câu nhờ, yêu cầu, đề nghị người khác làm gì là câu khiến.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu cảm thường kết thúc bằng dấu câu nào?',
      correct: 'Dấu chấm than (!)', distractors: ['Dấu chấm (.)', 'Dấu chấm hỏi (?)', 'Dấu phẩy (,)'],
      explanation: 'Câu cảm bộc lộ cảm xúc, cuối câu thường có dấu chấm than.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu "Ôi, bông hoa đẹp quá!" bộc lộ cảm xúc gì?',
      correct: 'Thán phục, vui thích', distractors: ['Buồn bã', 'Sợ hãi', 'Tức giận'],
      explanation: '"Ôi" và "đẹp quá" cho thấy người nói đang rất thích thú.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào thường đứng đầu câu cảm?',
      correct: 'Chao ôi', distractors: ['Hãy', 'Đừng', 'Vì sao'],
      explanation: 'Chao ôi, ôi, a, trời ơi... hay đứng đầu câu cảm; "hãy", "đừng" thường có trong câu khiến.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu khiến nào phù hợp khi nói với ông bà?',
      correct: 'Ông ơi, ông ngồi nghỉ một lát đi ạ!',
      distractors: ['Ông ngồi xuống!', 'Ngồi xuống đi!', 'Ông phải ngồi xuống ngay!'],
      explanation: 'Nói với người lớn cần có lời gọi và từ "ạ" để thể hiện sự lễ phép.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chuyển câu kể "Trời đẹp." thành câu cảm, ta được:',
      correct: 'Trời đẹp quá!',
      distractors: ['Trời có đẹp không?', 'Hãy làm cho trời đẹp!', 'Trời đẹp.'],
      explanation: 'Thêm "quá" và dấu chấm than để bộc lộ cảm xúc.',
    },
  ],

  'vietnamese.g4.thanh-ngu-tuc-ngu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Uống nước nhớ nguồn" khuyên ta điều gì?',
      correct: 'Biết ơn những người đã tạo ra thành quả cho mình',
      distractors: ['Phải uống nhiều nước', 'Giữ gìn nguồn nước sạch', 'Đi tìm nguồn nước'],
      explanation: 'Khi hưởng thành quả, hãy nhớ ơn người đã làm ra nó.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Thành ngữ "Nhanh như cắt" chỉ điều gì?',
      correct: 'Rất nhanh', distractors: ['Rất chậm', 'Rất sắc', 'Rất cẩn thận'],
      explanation: '"Nhanh như cắt" nghĩa là cực kỳ nhanh.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu tục ngữ nào khuyên ta đi nhiều nơi để học hỏi?',
      correct: 'Đi một ngày đàng, học một sàng khôn',
      distractors: ['Nói có sách, mách có chứng', 'Chậm như rùa', 'Lá lành đùm lá rách'],
      explanation: 'Mỗi chuyến đi cho ta thêm nhiều hiểu biết.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Thành ngữ "Thẳng như ruột ngựa" chỉ người thế nào?',
      correct: 'Thật thà, nghĩ gì nói nấy', distractors: ['Rất khoẻ mạnh', 'Chạy rất nhanh', 'Hay nói dối'],
      explanation: 'Người "thẳng như ruột ngựa" thật thà, không vòng vo.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối câu tục ngữ với lời khuyên',
      pairs: [['Lá lành đùm lá rách', 'Giúp đỡ người khó khăn'], ['Uống nước nhớ nguồn', 'Biết ơn'], ['Có chí thì nên', 'Kiên trì quyết tâm']],
      explanation: 'Mỗi câu tục ngữ gửi gắm một bài học của ông cha ta.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu "Thương người như thể thương thân" khuyên ta điều gì?',
      correct: 'Yêu thương người khác như yêu thương chính mình',
      distractors: ['Chỉ lo cho bản thân', 'Thương mình hơn thương người', 'Không cần giúp ai'],
      explanation: 'Hãy đối xử với người khác bằng tình thương như với chính mình.',
    },
  ],

  'vietnamese.g4.nhan-hoa': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Ông mặt trời thức dậy", sự vật nào được nhân hoá?',
      correct: 'Mặt trời', distractors: ['Ông', 'Thức dậy', 'Bầu trời'],
      explanation: 'Mặt trời được gọi là "ông" và "thức dậy" như người.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào dùng phép nhân hoá?',
      correct: 'Chú gà trống gọi mọi người thức dậy.',
      distractors: ['Con gà trống gáy vang lúc sáng sớm.', 'Gà trống có bộ lông sặc sỡ.', 'Nhà em nuôi một con gà trống.'],
      explanation: 'Gà trống được gọi là "chú" và "gọi mọi người" như con người.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Cây bàng dang tay che nắng cho chúng em", cây bàng được nhân hoá bằng cách nào?',
      correct: 'Dùng từ chỉ hoạt động của người',
      distractors: ['Gọi sự vật bằng từ chỉ người', 'Nói với sự vật như nói với người', 'Dùng từ chỉ màu sắc'],
      explanation: '"Dang tay che nắng" là hoạt động của người.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Cách gọi nào nhân hoá con mèo?',
      correct: 'cô mèo', distractors: ['con mèo', 'mèo mướp', 'lông mèo'],
      explanation: 'Gọi bằng từ chỉ người ("cô") là một cách nhân hoá.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền một từ gọi người (như "chị", "anh") để nhân hoá: "... gió thổi mát rượi cả cánh đồng."',
      accepted: ['chị', 'anh', 'cô', 'bác', 'chú', 'Chị', 'Anh', 'Cô', 'Bác', 'Chú'],
      explanation: 'Gọi gió là "chị gió", "anh gió"... là nhân hoá.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào nhân hoá bằng cách nói với sự vật như nói với người?',
      correct: 'Trăng ơi, trăng từ đâu đến?',
      distractors: ['Trăng tròn như quả bóng.', 'Trăng sáng vằng vặc.', 'Ông trăng đi dạo trên trời.'],
      explanation: '"Trăng ơi" là lời gọi trăng như gọi một người.',
    },
  ],

  // =========================================================================
  // LỚP 5
  // =========================================================================

  'vietnamese.g5.dai-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Nam và tôi cùng đi học", từ nào là đại từ?',
      correct: 'tôi', distractors: ['Nam', 'đi học', 'cùng'],
      explanation: '"Tôi" là đại từ xưng hô, người nói dùng để tự xưng.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là đại từ xưng hô ngôi thứ nhất?',
      correct: 'chúng tôi', distractors: ['các bạn', 'họ', 'nó'],
      explanation: 'Ngôi thứ nhất là người nói: tôi, tớ, chúng tôi, chúng ta...',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong đoạn "Con mèo nhà em rất lười. Nó chỉ thích nằm sưởi nắng.", từ "Nó" thay thế cho gì?',
      correct: 'con mèo nhà em', distractors: ['em', 'nắng', 'nhà em'],
      explanation: '"Nó" thay cho "con mèo nhà em" để không phải nhắc lại.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Bạn học giỏi, tớ cũng vậy", từ "vậy" thay thế cho gì?',
      correct: 'học giỏi', distractors: ['bạn', 'tớ', 'cũng'],
      explanation: '"Vậy" là đại từ thay thế cho "học giỏi".',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào là đại từ ngôi thứ ba số nhiều?',
      correct: 'họ', distractors: ['tôi', 'chúng mình', 'bạn'],
      explanation: 'Ngôi thứ ba là người được nói tới; số nhiều: họ, chúng nó.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng đại từ để tránh lặp từ?',
      correct: 'Hoa hồng rất đẹp. Ai cũng thích nó.',
      distractors: ['Hoa hồng rất đẹp. Ai cũng thích hoa hồng.', 'Hoa hồng rất đẹp và thơm.', 'Hoa hồng, hoa cúc đều đẹp.'],
      explanation: '"Nó" thay cho "hoa hồng" nên không phải lặp lại từ đó.',
    },
  ],

  'vietnamese.g5.quan-he-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Điền quan hệ từ: "Em ... bạn Lan cùng đi học."',
      correct: 'và', distractors: ['nhưng', 'vì', 'nếu'],
      explanation: '"Và" nối hai người cùng làm một việc.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Quyển sách của Minh rất hay", quan hệ từ là:',
      correct: 'của', distractors: ['quyển sách', 'Minh', 'rất hay'],
      explanation: '"Của" nối "quyển sách" với "Minh", chỉ quan hệ sở hữu.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Cặp quan hệ từ "Nếu... thì..." biểu thị quan hệ gì?',
      correct: 'Điều kiện - kết quả', distractors: ['Nguyên nhân - kết quả', 'Tương phản', 'Tăng tiến'],
      explanation: '"Nếu" nêu điều kiện, "thì" nêu kết quả xảy ra.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn cặp quan hệ từ phù hợp: "... đêm qua trời mưa to ... sáng nay đường rất trơn."',
      correct: 'Vì ... nên ...', distractors: ['Tuy ... nhưng ...', 'Không những ... mà còn ...', 'Tuy ... mà ...'],
      explanation: 'Mưa to là nguyên nhân, đường trơn là kết quả.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng cặp quan hệ từ chỉ quan hệ tương phản?',
      correct: 'Tuy nhà xa nhưng bạn Hoa chưa bao giờ đi học muộn.',
      distractors: ['Vì nhà xa nên bạn Hoa phải dậy sớm.', 'Nếu dậy sớm thì bạn Hoa không bị muộn.', 'Nhà bạn Hoa không những xa mà còn khó đi.'],
      explanation: '"Tuy... nhưng..." nối hai ý trái ngược nhau.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền quan hệ từ còn thiếu: "Bạn Nam không những học giỏi ... còn hát hay."',
      accepted: ['mà'],
      explanation: 'Cặp quan hệ từ tăng tiến: "không những... mà còn...".',
    },
  ],

  'vietnamese.g5.cau-ghep': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu ghép là câu có mấy cụm chủ ngữ - vị ngữ trở lên?',
      correct: 'Hai cụm trở lên', distractors: ['Chỉ một cụm', 'Không có cụm nào', 'Đúng ba cụm'],
      explanation: 'Câu ghép do nhiều vế ghép lại, mỗi vế có chủ ngữ - vị ngữ riêng.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Trời mưa, đường ngập nước." có mấy vế câu?',
      correct: '2 vế', distractors: ['1 vế', '3 vế', '4 vế'],
      explanation: 'Vế 1: "Trời mưa"; vế 2: "đường ngập nước".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Các vế trong câu ghép "Mẹ nấu cơm, chị quét nhà, em rửa bát." được nối với nhau bằng gì?',
      correct: 'Dấu phẩy', distractors: ['Quan hệ từ', 'Dấu chấm', 'Dấu hai chấm'],
      explanation: 'Ba vế câu được nối trực tiếp bằng dấu phẩy.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào KHÔNG phải câu ghép?',
      correct: 'Những bông hoa hồng nở rộ trong vườn.',
      distractors: ['Hoa hồng nở, ong bướm bay đến.', 'Trời nắng nhưng gió vẫn mát.', 'Vì trời mưa nên em ở nhà.'],
      explanation: 'Câu "Những bông hoa hồng nở rộ trong vườn" chỉ có một cụm chủ ngữ - vị ngữ.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn vế câu phù hợp để hoàn thành câu ghép: "Vì bạn Lan chăm chỉ nên ..."',
      correct: 'bạn ấy luôn đạt điểm cao',
      distractors: ['bạn ấy lười học', 'trời hôm nay nắng', 'con mèo đang ngủ'],
      explanation: 'Vế sau phải là kết quả hợp lý của việc chăm chỉ.',
    },
    {
      kind: 'order', difficulty: 3,
      prompt: 'Sắp xếp thành câu ghép có nghĩa',
      items: ['Gió thổi mạnh,', 'cây cối', 'nghiêng ngả.'],
      explanation: 'Câu đúng: "Gió thổi mạnh, cây cối nghiêng ngả." - hai vế nối bằng dấu phẩy.',
    },
  ],

  'vietnamese.g5.lien-ket-cau': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong đoạn "Bé Mai rất ngoan. Mai luôn giúp mẹ việc nhà.", hai câu liên kết với nhau bằng cách nào?',
      correct: 'Lặp lại từ ngữ ("Mai")',
      distractors: ['Dùng từ nối', 'Dùng từ trái nghĩa', 'Không liên kết'],
      explanation: 'Từ "Mai" được lặp lại ở câu sau - đó là phép lặp.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nối nào thường dùng khi hai câu có ý đối lập?',
      correct: 'Tuy vậy', distractors: ['Vì thế', 'Sau đó', 'Đầu tiên'],
      explanation: '"Tuy vậy", "tuy nhiên", "nhưng" nối các ý trái ngược.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chọn từ nối phù hợp: "Trời mưa rất to. ..., trận bóng vẫn diễn ra."',
      correct: 'Tuy vậy', distractors: ['Vì vậy', 'Hơn nữa', 'Trước hết'],
      explanation: 'Mưa to mà trận bóng vẫn diễn ra - hai ý trái ngược, dùng "Tuy vậy".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong đoạn "Mèo nhà em tên là Mướp. Nó rất thích bắt chuột.", từ "Nó" liên kết câu bằng cách nào?',
      correct: 'Thay thế từ ngữ', distractors: ['Lặp từ ngữ', 'Dùng từ nối', 'Dùng từ trái nghĩa'],
      explanation: '"Nó" thay cho "Mướp" - đó là phép thế.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn từ nối phù hợp: "Em đã làm xong bài tập. ..., em giúp mẹ nấu cơm."',
      correct: 'Sau đó', distractors: ['Tuy nhiên', 'Trái lại', 'Ngược lại'],
      explanation: 'Hai việc nối tiếp nhau theo thời gian nên dùng "Sau đó".',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối từ nối với ý nghĩa của nó',
      pairs: [['Vì vậy', 'Chỉ kết quả'], ['Tuy nhiên', 'Chỉ ý đối lập'], ['Sau đó', 'Chỉ thứ tự thời gian']],
      explanation: 'Mỗi từ nối cho biết hai câu quan hệ với nhau thế nào.',
    },
  ],

  'vietnamese.g5.bien-phap-tu-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Mặt hồ phẳng lặng như tấm gương khổng lồ" dùng biện pháp tu từ nào?',
      correct: 'So sánh', distractors: ['Nhân hoá', 'Điệp từ', 'Không dùng biện pháp nào'],
      explanation: 'Mặt hồ được so sánh với tấm gương bằng từ "như".',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu thơ "Những ngôi sao thức ngoài kia" dùng biện pháp tu từ nào?',
      correct: 'Nhân hoá', distractors: ['So sánh', 'Điệp từ', 'Không dùng biện pháp nào'],
      explanation: 'Ngôi sao "thức" như con người - đó là nhân hoá.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Điệp từ là gì?',
      correct: 'Lặp lại một từ ngữ nhiều lần để nhấn mạnh',
      distractors: ['So sánh hai sự vật với nhau', 'Gọi sự vật bằng từ chỉ người', 'Dùng hai từ trái nghĩa'],
      explanation: 'Điệp từ lặp lại từ ngữ để nhấn mạnh ý và tạo nhịp điệu.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu thơ "Mẹ là ngọn gió của con suốt đời" dùng biện pháp tu từ nào?',
      correct: 'So sánh', distractors: ['Nhân hoá', 'Điệp từ', 'Không dùng biện pháp nào'],
      explanation: 'Mẹ được so sánh với ngọn gió bằng từ "là".',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng điệp từ?',
      correct: 'Học, học nữa, học mãi.',
      distractors: ['Học tập chăm chỉ.', 'Chúng em học bài.', 'Bạn Nam học giỏi.'],
      explanation: 'Từ "học" được lặp lại ba lần để nhấn mạnh việc học không ngừng.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Phép so sánh trong câu "Tiếng mưa rơi lộp độp như ai gõ cửa" có tác dụng gì?',
      correct: 'Làm câu văn sinh động, gợi âm thanh cụ thể',
      distractors: ['Làm câu văn ngắn hơn', 'Chỉ để kể lại sự việc', 'Giúp câu có nhiều vế hơn'],
      explanation: 'So sánh tiếng mưa với tiếng gõ cửa giúp người đọc hình dung âm thanh rõ hơn.',
    },
  ],
}

export default bank
