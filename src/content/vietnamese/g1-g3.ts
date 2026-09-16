/** Ngân hàng câu hỏi Tiếng Việt lớp 1-3. */

import type { Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // LỚP 1
  // =========================================================================

  'vietnamese.g1.am-chu-cai': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Chữ cái nào đứng đầu bảng chữ cái tiếng Việt?',
      correct: 'a', distractors: ['b', 'ă', 'e'],
      explanation: 'Bảng chữ cái tiếng Việt bắt đầu bằng chữ a.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "bà" bắt đầu bằng âm nào?',
      correct: 'b', distractors: ['a', 'h', 'đ'],
      explanation: 'Tiếng "bà" gồm âm đầu b và vần a, mang thanh huyền.',
      hint: 'Đọc chậm: bờ - a - ba - huyền - bà.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chữ nào sau đây là nguyên âm?',
      correct: 'o', distractors: ['m', 'n', 't'],
      explanation: 'Nguyên âm tiếng Việt gồm a, ă, â, e, ê, i, o, ô, ơ, u, ư, y. Chữ o là nguyên âm.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào bắt đầu bằng âm "th"?',
      correct: 'thỏ', distractors: ['tủ', 'hổ', 'nhà'],
      explanation: 'Tiếng "thỏ" có âm đầu là th.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối chữ cái với tiếng bắt đầu bằng chữ đó',
      pairs: [['c', 'cá'], ['g', 'gà'], ['m', 'mèo']],
      explanation: 'cá bắt đầu bằng c, gà bắt đầu bằng g, mèo bắt đầu bằng m.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tiếng nào KHÔNG bắt đầu bằng âm "ng"?',
      correct: 'nhà', distractors: ['ngà', 'ngô', 'ngựa'],
      explanation: '"nhà" có âm đầu là nh, còn ngà, ngô, ngựa đều có âm đầu ng.',
      hint: 'Chú ý chữ cái thứ hai.',
    },
  ],

  'vietnamese.g1.van-don-gian': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "an" có vần gì?',
      correct: 'an', distractors: ['a', 'am', 'ang'],
      explanation: 'Tiếng "an" chỉ gồm vần "an", không có âm đầu.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép âm "l" với vần "á" được tiếng nào?',
      correct: 'lá', distractors: ['la', 'là', 'lã'],
      explanation: 'l + á = lá (có dấu sắc).',
      hint: 'Chú ý dấu thanh trên vần.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng "bàn" có vần gì?',
      correct: 'an', distractors: ['ban', 'anh', 'a'],
      explanation: 'Tiếng "bàn" gồm âm đầu b, vần an và thanh huyền.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào có vần "ong"?',
      correct: 'bóng', distractors: ['bàn', 'bánh', 'bút'],
      explanation: 'Tiếng "bóng" có vần ong.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tiếng nào có vần khác với ba tiếng còn lại?',
      correct: 'cây', distractors: ['mai', 'tai', 'hai'],
      explanation: 'mai, tai, hai đều có vần "ai"; còn "cây" có vần "ây".',
      hint: 'Đọc to từng tiếng và nghe phần sau âm đầu.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối tiếng với vần của nó',
      pairs: [['con', 'on'], ['cơm', 'ơm'], ['cân', 'ân']],
      explanation: 'Vần là phần còn lại sau khi bỏ âm đầu.',
    },
  ],

  'vietnamese.g1.dau-thanh': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "má" mang dấu thanh gì?',
      correct: 'Thanh sắc', distractors: ['Thanh huyền', 'Thanh hỏi', 'Thanh nặng'],
      explanation: 'Dấu gạch xiên lên trên là dấu sắc.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Tiếng "mà" mang dấu thanh gì?',
      correct: 'Thanh huyền', distractors: ['Thanh sắc', 'Thanh ngã', 'Thanh ngang'],
      explanation: 'Dấu gạch xiên xuống là dấu huyền.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng nào mang thanh ngang (không dấu)?',
      correct: 'ba', distractors: ['bà', 'bá', 'bạ'],
      explanation: 'Thanh ngang là tiếng không có dấu thanh nào.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Tiếng "vẽ" mang dấu thanh gì?',
      correct: 'Thanh ngã', distractors: ['Thanh hỏi', 'Thanh sắc', 'Thanh nặng'],
      explanation: 'Dấu lượn sóng ở trên là dấu ngã.',
      hint: 'Dấu hỏi cong như dấu chấm hỏi, dấu ngã lượn sóng.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tiếng nào có nghĩa khác hẳn khi đổi dấu thanh: "ma" đổi thành "mã" nghĩa là gì?',
      correct: 'Con ngựa', distractors: ['Người mẹ', 'Cái mũ', 'Cây mai'],
      explanation: '"Mã" trong tiếng Hán Việt nghĩa là con ngựa. Đổi dấu thanh làm đổi hẳn nghĩa của tiếng.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tiếng Việt có tất cả mấy thanh?',
      correct: '6 thanh', distractors: ['5 thanh', '4 thanh', '7 thanh'],
      explanation: 'Sáu thanh: ngang, huyền, sắc, hỏi, ngã, nặng.',
    },
  ],

  'vietnamese.g1.ghep-tieng': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép "c" + "á" được tiếng gì?',
      correct: 'cá', distractors: ['ca', 'cà', 'cả'],
      explanation: 'c + á = cá.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Ghép "b" + "é" được tiếng gì?',
      correct: 'bé', distractors: ['be', 'bè', 'bẻ'],
      explanation: 'b + é = bé.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Ghép âm "h" với vần "oa" và thanh ngang được tiếng gì?',
      accepted: ['hoa'],
      explanation: 'h + oa = hoa.',
      hint: 'Viết liền không dấu.',
    },
    {
      kind: 'text', difficulty: 2,
      prompt: 'Ghép âm "tr" với vần "ăng" và thanh ngang được tiếng gì?',
      accepted: ['trăng'],
      explanation: 'tr + ăng = trăng.',
    },
    {
      kind: 'order', difficulty: 3,
      prompt: 'Sắp xếp các tiếng thành từ có nghĩa',
      items: ['con', 'mèo'],
      explanation: 'Ghép lại được từ "con mèo".',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Ghép âm "ngh" với vần "e" và thanh ngang được tiếng gì?',
      accepted: ['nghe'],
      explanation: 'ngh + e = nghe. Âm "ngh" chỉ đứng trước e, ê, i.',
      hint: 'Trước e, ê, i thì viết "ngh" chứ không viết "ng".',
    },
  ],

  'vietnamese.g1.doc-hieu-cau': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Đọc câu: "Bé Lan đi học."  Ai đi học?',
      correct: 'Bé Lan', distractors: ['Mẹ', 'Bà', 'Bố'],
      explanation: 'Câu nói rõ "Bé Lan đi học".',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Đọc câu: "Con mèo nằm trên ghế."  Con mèo nằm ở đâu?',
      correct: 'Trên ghế', distractors: ['Dưới gầm bàn', 'Trên giường', 'Ngoài sân'],
      explanation: 'Câu cho biết con mèo nằm trên ghế.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Đọc: "Sáng nay trời mưa to nên Nam mang theo áo mưa."  Vì sao Nam mang áo mưa?',
      correct: 'Vì trời mưa to', distractors: ['Vì trời nắng', 'Vì mẹ bảo thế', 'Vì Nam thích áo mưa'],
      explanation: 'Từ "nên" cho biết lí do là trời mưa to.',
      hint: 'Tìm từ chỉ nguyên nhân trong câu.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Đọc: "Vườn nhà bà có cây cam, cây bưởi và cây ổi."  Vườn bà có mấy loại cây?',
      correct: '3 loại', distractors: ['2 loại', '4 loại', '1 loại'],
      explanation: 'Đếm được: cam, bưởi, ổi - ba loại cây.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Đọc: "Trời đã tối. Đàn gà rủ nhau về chuồng."  Vì sao đàn gà về chuồng?',
      correct: 'Vì trời đã tối', distractors: ['Vì đói bụng', 'Vì bị đuổi', 'Vì trời mưa'],
      explanation: 'Câu trước cho biết trời đã tối, đó là lí do đàn gà về chuồng dù đoạn văn không nói thẳng.',
      hint: 'Đọc cả hai câu rồi nối ý với nhau.',
    },
    {
      kind: 'order', difficulty: 3,
      prompt: 'Sắp xếp thành câu có nghĩa',
      items: ['Em', 'giúp', 'mẹ', 'quét nhà'],
      explanation: 'Câu đúng: "Em giúp mẹ quét nhà."',
    },
  ],

  // =========================================================================
  // LỚP 2
  // =========================================================================

  // =========================================================================
  // LỚP 3
  // =========================================================================

  'vietnamese.g3.dong-nghia-trai-nghia': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào đồng nghĩa với "to"?',
      correct: 'lớn', distractors: ['nhỏ', 'bé', 'thấp'],
      explanation: '"To" và "lớn" có nghĩa gần giống nhau nên là từ đồng nghĩa.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào trái nghĩa với "cao"?',
      correct: 'thấp', distractors: ['lớn', 'to', 'dài'],
      explanation: '"Cao" và "thấp" có nghĩa ngược nhau.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào trái nghĩa với "chăm chỉ"?',
      correct: 'lười biếng', distractors: ['siêng năng', 'cần cù', 'chịu khó'],
      explanation: 'Siêng năng, cần cù, chịu khó đều đồng nghĩa với chăm chỉ; chỉ "lười biếng" là trái nghĩa.',
      hint: 'Ba từ kia giống nhau, từ còn lại mới là đáp án.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào đồng nghĩa với "hiền lành"?',
      correct: 'hiền hậu', distractors: ['hung dữ', 'độc ác', 'nóng nảy'],
      explanation: '"Hiền lành" và "hiền hậu" cùng chỉ tính tình tốt, dễ chịu.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối từ với từ trái nghĩa của nó',
      pairs: [['sáng', 'tối'], ['nhanh', 'chậm'], ['nóng', 'lạnh']],
      explanation: 'Từ trái nghĩa là những từ có nghĩa ngược hẳn nhau.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Cặp từ nào KHÔNG phải là cặp trái nghĩa?',
      correct: 'vui - sướng', distractors: ['vui - buồn', 'khóc - cười', 'đen - trắng'],
      explanation: '"Vui" và "sướng" đồng nghĩa chứ không trái nghĩa.',
    },
  ],

  'vietnamese.g3.bien-phap-so-sanh': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào có hình ảnh so sánh?',
      correct: 'Mặt trời đỏ như quả cầu lửa.', distractors: ['Mặt trời đã mọc.', 'Trời hôm nay rất nóng.', 'Em thích ngắm mặt trời.'],
      explanation: 'Từ "như" nối hai sự vật được so sánh với nhau.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Tóc bà trắng như bông", bà được so sánh với gì?',
      correct: 'Bông', distractors: ['Mây', 'Tuyết', 'Giấy'],
      explanation: 'Tóc bà được so sánh với bông vì cùng màu trắng.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào thường dùng để so sánh?',
      correct: 'tựa như', distractors: ['bởi vì', 'cho nên', 'nhưng mà'],
      explanation: 'Các từ so sánh thường gặp: như, là, tựa, tựa như, giống như, chẳng khác gì.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Cánh đồng lúa vàng như tấm thảm khổng lồ", tác giả so sánh dựa trên điểm chung nào?',
      correct: 'Màu vàng và trải rộng', distractors: ['Đều mềm mại khi chạm vào', 'Đều dùng để trang trí', 'Đều làm bằng sợi'],
      explanation: 'So sánh dựa trên màu vàng và hình ảnh trải rộng của cả hai.',
      hint: 'Hai vật giống nhau ở điểm nào?',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào có hình ảnh so sánh hay nhất để tả tiếng suối?',
      correct: 'Tiếng suối trong như tiếng hát xa.', distractors: ['Tiếng suối rất to.', 'Tiếng suối chảy suốt ngày.', 'Tiếng suối ở trên núi.'],
      explanation: 'So sánh tiếng suối với tiếng hát giúp người đọc hình dung âm thanh trong trẻo, êm ái.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền từ so sánh còn thiếu: "Đôi mắt bé tròn ... hạt nhãn."',
      accepted: ['như', 'tựa', 'tựa như', 'giống như'],
      explanation: 'Dùng từ "như" để nối hai vế so sánh.',
    },
  ],

  'vietnamese.g3.mau-cau-ai-la-gi': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Bố em là công nhân." thuộc mẫu câu nào?',
      correct: 'Ai là gì?', distractors: ['Ai làm gì?', 'Ai thế nào?', 'Câu hỏi'],
      explanation: 'Mẫu "Ai là gì?" dùng để giới thiệu hoặc nêu nhận định.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Em quét sân." thuộc mẫu câu nào?',
      correct: 'Ai làm gì?', distractors: ['Ai là gì?', 'Ai thế nào?', 'Câu cảm'],
      explanation: 'Mẫu "Ai làm gì?" kể về hoạt động.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu "Bạn Nam rất chăm chỉ." thuộc mẫu câu nào?',
      correct: 'Ai thế nào?', distractors: ['Ai là gì?', 'Ai làm gì?', 'Câu khiến'],
      explanation: 'Mẫu "Ai thế nào?" miêu tả đặc điểm, tính chất.',
      hint: 'Phần sau chủ ngữ miêu tả hay kể việc làm?',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối câu với mẫu câu tương ứng',
      pairs: [
        ['Mẹ là giáo viên.', 'Ai là gì?'],
        ['Mẹ nấu cơm.', 'Ai làm gì?'],
        ['Mẹ rất hiền.', 'Ai thế nào?'],
      ],
      explanation: '"Là gì" giới thiệu, "làm gì" kể hoạt động, "thế nào" miêu tả đặc điểm.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào KHÔNG thuộc mẫu "Ai làm gì?"',
      correct: 'Cây bàng xanh mướt.', distractors: ['Chim hót líu lo.', 'Em đọc sách.', 'Bà kể chuyện.'],
      explanation: '"Xanh mướt" miêu tả đặc điểm nên câu đó thuộc mẫu "Ai thế nào?".',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Đặt câu theo mẫu "Ai là gì?" với từ "Hà Nội":',
      correct: 'Hà Nội là thủ đô của nước ta.', distractors: ['Hà Nội rất đông người.', 'Hà Nội đang vào thu.', 'Em rất thích Hà Nội.'],
      explanation: 'Chỉ câu có từ "là" nối hai vế mới thuộc mẫu "Ai là gì?".',
    },
  ],

  'vietnamese.g3.dau-hai-cham-ngoac-kep': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Dấu hai chấm thường dùng để làm gì?',
      correct: 'Báo hiệu lời nói hoặc phần liệt kê đứng sau', distractors: ['Kết thúc câu kể', 'Thay cho dấu phẩy', 'Đánh dấu câu hỏi'],
      explanation: 'Dấu hai chấm báo hiệu phần giải thích, liệt kê hoặc lời nói trực tiếp theo sau.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Dấu ngoặc kép dùng để làm gì?',
      correct: 'Đánh dấu lời nói trực tiếp hoặc từ ngữ đặc biệt', distractors: ['Kết thúc đoạn văn', 'Ngăn cách các vế câu', 'Thay cho dấu chấm'],
      explanation: 'Dấu ngoặc kép bao quanh lời nói được dẫn nguyên văn hoặc từ dùng với nghĩa đặc biệt.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào dùng dấu câu ĐÚNG?',
      correct: 'Mẹ bảo: "Con nhớ mặc áo ấm nhé."',
      distractors: ['Mẹ bảo "Con nhớ mặc áo ấm nhé."', 'Mẹ bảo: Con nhớ mặc áo ấm nhé.', 'Mẹ bảo, "Con nhớ mặc áo ấm nhé".'],
      explanation: 'Trước lời nói trực tiếp dùng dấu hai chấm, lời nói đặt trong dấu ngoặc kép.',
      hint: 'Cần cả hai dấu: hai chấm rồi ngoặc kép.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Trong cặp em có: sách, vở, bút và thước.", dấu hai chấm báo hiệu điều gì?',
      correct: 'Phần liệt kê đứng sau', distractors: ['Một câu hỏi', 'Lời nói của người khác', 'Kết thúc câu'],
      explanation: 'Ở đây dấu hai chấm báo hiệu danh sách các đồ vật được liệt kê.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng dấu ngoặc kép để nhấn mạnh từ ngữ đặc biệt?',
      correct: 'Bạn ấy được cả lớp gọi là "cây toán".',
      distractors: ['Cô giáo hỏi: "Ai làm bài xong rồi?"', 'Nam nói: "Mình đi trước nhé."', 'Bà kể: "Ngày xửa ngày xưa..."'],
      explanation: '"Cây toán" không phải lời ai nói mà là biệt danh - dùng ngoặc kép để nhấn mạnh nghĩa đặc biệt.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Sửa câu sai: "Nam hỏi bạn có đi không?" thành câu đúng nào?',
      correct: 'Nam hỏi: "Bạn có đi không?"',
      distractors: ['Nam hỏi "bạn có đi không"?', 'Nam hỏi, bạn có đi không?', 'Nam hỏi: bạn có đi không?'],
      explanation: 'Lời nói trực tiếp cần dấu hai chấm, dấu ngoặc kép và viết hoa chữ đầu.',
    },
  ],

  'vietnamese.g3.tu-chi-dac-diem': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào chỉ màu sắc?',
      correct: 'tím biếc', distractors: ['chạy nhảy', 'học bài', 'quét nhà'],
      explanation: '"Tím biếc" chỉ màu sắc, ba từ còn lại chỉ hoạt động.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào chỉ hình dáng?',
      correct: 'thon dài', distractors: ['ngọt ngào', 'thơm phức', 'ồn ào'],
      explanation: '"Thon dài" miêu tả hình dáng; các từ kia tả vị, mùi, âm thanh.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào tả mùi hương?',
      correct: 'thoang thoảng', distractors: ['lấp lánh', 'rì rào', 'mềm mại'],
      explanation: '"Thoang thoảng" tả mùi hương nhẹ; lấp lánh tả ánh sáng, rì rào tả âm thanh, mềm mại tả cảm giác sờ.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối từ với giác quan cảm nhận được nó',
      pairs: [['lấp lánh', 'Mắt nhìn'], ['rì rào', 'Tai nghe'], ['ngọt lịm', 'Lưỡi nếm']],
      explanation: 'Từ chỉ đặc điểm thường gắn với một giác quan cụ thể.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào hợp nhất để tả tiếng mưa rơi trên mái tôn?',
      correct: 'lộp độp', distractors: ['lấp lánh', 'thoang thoảng', 'mềm mại'],
      explanation: '"Lộp độp" gợi đúng âm thanh của hạt mưa rơi trên mái tôn.',
      hint: 'Chọn từ gợi âm thanh.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ nào KHÔNG cùng nhóm với các từ còn lại?',
      correct: 'chạy', distractors: ['xanh mướt', 'đỏ au', 'vàng óng'],
      explanation: 'Ba từ kia đều chỉ màu sắc, còn "chạy" chỉ hoạt động.',
    },
  ],
}

export default bank
