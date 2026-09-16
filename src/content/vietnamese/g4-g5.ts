/** Ngân hàng câu hỏi Tiếng Việt lớp 4-5. */

import type { Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // LỚP 4
  // =========================================================================

  'vietnamese.g4.danh-dong-tinh-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là danh từ?',
      correct: 'ngôi trường', distractors: ['chạy', 'đẹp', 'nhanh chóng'],
      explanation: 'Danh từ là từ chỉ người, vật, hiện tượng, khái niệm. "Ngôi trường" chỉ sự vật.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là động từ?',
      correct: 'suy nghĩ', distractors: ['cái bàn', 'xinh xắn', 'chăm chỉ'],
      explanation: 'Động từ chỉ hoạt động hoặc trạng thái. "Suy nghĩ" là hoạt động của trí óc.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào là tính từ?',
      correct: 'rực rỡ', distractors: ['bông hoa', 'nở', 'mùa xuân'],
      explanation: 'Tính từ chỉ đặc điểm, tính chất. "Rực rỡ" miêu tả đặc điểm.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối từ với từ loại của nó',
      pairs: [['dòng sông', 'Danh từ'], ['chảy', 'Động từ'], ['hiền hoà', 'Tính từ']],
      explanation: 'Danh từ gọi tên, động từ chỉ hoạt động, tính từ chỉ đặc điểm.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Trong câu "Những cánh hoa đào nở hồng rực cả góc vườn", từ nào là động từ?',
      correct: 'nở', distractors: ['cánh hoa', 'hồng rực', 'góc vườn'],
      explanation: '"Cánh hoa" và "góc vườn" là danh từ, "hồng rực" là tính từ, chỉ "nở" là động từ.',
      hint: 'Tìm từ chỉ hành động đang diễn ra.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Từ "học sinh" thuộc loại danh từ nào?',
      correct: 'Danh từ chỉ người', distractors: ['Danh từ chỉ hiện tượng', 'Danh từ chỉ khái niệm', 'Danh từ chỉ đơn vị'],
      explanation: '"Học sinh" gọi tên một nhóm người nên là danh từ chỉ người.',
    },
  ],

  'vietnamese.g4.chu-ngu-vi-ngu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Mẹ em nấu cơm.", chủ ngữ là gì?',
      correct: 'Mẹ em', distractors: ['nấu cơm', 'nấu', 'cơm'],
      explanation: 'Chủ ngữ trả lời câu hỏi "Ai?" - ở đây là "Mẹ em".',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Đàn chim bay về phương nam.", vị ngữ là gì?',
      correct: 'bay về phương nam', distractors: ['Đàn chim', 'Đàn', 'phương nam'],
      explanation: 'Vị ngữ trả lời câu hỏi "Làm gì?" - ở đây là "bay về phương nam".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào có chủ ngữ là "Những bông hoa"?',
      correct: 'Những bông hoa toả hương thơm ngát.',
      distractors: ['Em hái những bông hoa.', 'Trong vườn có những bông hoa.', 'Cô cắm những bông hoa vào lọ.'],
      explanation: 'Chỉ ở câu đầu, "Những bông hoa" mới là chủ thể thực hiện hành động toả hương.',
      hint: 'Đặt câu hỏi "Cái gì toả hương?"',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào THIẾU chủ ngữ?',
      correct: 'Chạy nhanh về phía cổng trường.',
      distractors: ['Nam chạy nhanh.', 'Trời mưa to.', 'Em đọc sách.'],
      explanation: 'Câu đó chỉ có vị ngữ, chưa cho biết ai chạy.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Trong câu "Trên cánh đồng, những chú trâu đang gặm cỏ.", đâu là chủ ngữ?',
      correct: 'những chú trâu', distractors: ['Trên cánh đồng', 'đang gặm cỏ', 'cánh đồng'],
      explanation: '"Trên cánh đồng" là trạng ngữ chỉ nơi chốn, chủ ngữ là "những chú trâu".',
      hint: 'Bỏ phần đứng trước dấu phẩy rồi mới tìm chủ ngữ.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào có hai chủ ngữ?',
      correct: 'Nam và Lan cùng đi học.',
      distractors: ['Nam đi học rồi về nhà.', 'Nam đi học sớm.', 'Nam học bài chăm chỉ.'],
      explanation: '"Nam" và "Lan" là hai chủ ngữ cùng thực hiện hành động đi học.',
    },
  ],

  'vietnamese.g4.cau-khien-cau-cam': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào là câu khiến?',
      correct: 'Con hãy dọn phòng đi!', distractors: ['Phòng con rất bừa.', 'Con đã dọn phòng chưa?', 'Ôi phòng bừa quá!'],
      explanation: 'Câu khiến nêu yêu cầu, đề nghị, mệnh lệnh, thường có từ hãy, đừng, chớ, đi, nào.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào là câu cảm?',
      correct: 'Ôi, cảnh đẹp quá!', distractors: ['Cảnh này rất đẹp.', 'Cảnh này đẹp không?', 'Hãy ngắm cảnh đi.'],
      explanation: 'Câu cảm bộc lộ cảm xúc, thường có từ ôi, chao, quá, lắm, thay và kết thúc bằng dấu chấm than.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Từ nào thường xuất hiện trong câu khiến?',
      correct: 'đừng', distractors: ['quá', 'thay', 'biết bao'],
      explanation: 'Hãy, đừng, chớ là các từ đặc trưng của câu khiến. Quá, thay, biết bao thuộc câu cảm.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Chuyển "Em quét nhà." thành câu khiến thì được câu nào?',
      correct: 'Em hãy quét nhà đi!', distractors: ['Em quét nhà chưa?', 'Ôi em quét nhà sạch quá!', 'Em đã quét nhà.'],
      explanation: 'Thêm từ "hãy... đi" và dấu chấm than để thành câu khiến.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu khiến nào lịch sự nhất khi nhờ bạn giúp?',
      correct: 'Bạn giúp mình một tay được không?',
      distractors: ['Giúp tao ngay!', 'Làm đi!', 'Mày phải giúp tao.'],
      explanation: 'Câu khiến dạng hỏi và xưng hô đúng mực thể hiện sự lịch sự, tôn trọng người nghe.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu "Chao ôi, con sông quê hương đẹp biết bao!" bộc lộ cảm xúc gì?',
      correct: 'Yêu mến và tự hào', distractors: ['Buồn bã, tiếc nuối', 'Tức giận', 'Lo lắng'],
      explanation: 'Từ "chao ôi" và "đẹp biết bao" thể hiện tình cảm yêu mến, tự hào với quê hương.',
    },
  ],

  'vietnamese.g4.thanh-ngu-tuc-ngu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu tục ngữ "Ăn quả nhớ kẻ trồng cây" khuyên ta điều gì?',
      correct: 'Phải biết ơn người đã giúp mình', distractors: ['Phải trồng nhiều cây', 'Phải ăn nhiều hoa quả', 'Phải chăm chỉ làm vườn'],
      explanation: 'Được hưởng thành quả thì phải nhớ ơn người tạo ra nó.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Có công mài sắt, có ngày nên kim" khuyên điều gì?',
      correct: 'Kiên trì thì sẽ thành công', distractors: ['Nên học nghề rèn', 'Sắt tốt hơn kim', 'Làm việc phải nhanh'],
      explanation: 'Kiên trì bền bỉ thì việc khó đến mấy cũng thành.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Thành ngữ "Chậm như rùa" dùng để chỉ điều gì?',
      correct: 'Làm việc rất chậm chạp', distractors: ['Đi bơi giỏi', 'Sống rất lâu', 'Rất cẩn thận'],
      explanation: 'Thành ngữ so sánh với con rùa để chỉ sự chậm chạp.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối thành ngữ với ý nghĩa',
      pairs: [
        ['Nhanh như chớp', 'Rất nhanh'],
        ['Khoẻ như voi', 'Rất khoẻ'],
        ['Hiền như bụt', 'Rất hiền lành'],
      ],
      explanation: 'Thành ngữ thường mượn hình ảnh quen thuộc để nói về tính chất.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu tục ngữ nào nói về tinh thần đoàn kết?',
      correct: 'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao',
      distractors: ['Đi một ngày đàng, học một sàng khôn', 'Tốt gỗ hơn tốt nước sơn', 'Không thầy đố mày làm nên'],
      explanation: 'Nhiều người hợp sức lại thì làm được việc lớn - đó là đoàn kết.',
      hint: 'Tìm câu nói về nhiều người cùng làm.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu "Tốt gỗ hơn tốt nước sơn" khuyên ta coi trọng điều gì?',
      correct: 'Phẩm chất bên trong hơn vẻ ngoài', distractors: ['Gỗ tốt hơn sơn tốt', 'Nên mua đồ gỗ', 'Nên sơn nhà đẹp'],
      explanation: 'Gỗ là bản chất bên trong, nước sơn là vẻ ngoài. Câu này đề cao phẩm chất thật.',
    },
  ],

  'vietnamese.g4.nhan-hoa': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào có phép nhân hoá?',
      correct: 'Ông mặt trời thức dậy từ rất sớm.', distractors: ['Mặt trời mọc lúc 6 giờ.', 'Mặt trời rất nóng.', 'Em nhìn mặt trời.'],
      explanation: 'Gọi mặt trời là "ông" và nói nó "thức dậy" - đó là nhân hoá.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Nhân hoá là gì?',
      correct: 'Gọi hoặc tả vật bằng từ ngữ vốn dùng cho người',
      distractors: ['So sánh hai sự vật với nhau', 'Lặp lại một từ nhiều lần', 'Nói giảm nói tránh'],
      explanation: 'Nhân hoá khiến vật trở nên gần gũi, sinh động như con người.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Trong câu "Chị gió tinh nghịch đùa với hàng cây", từ nào thể hiện phép nhân hoá?',
      correct: 'chị, tinh nghịch, đùa', distractors: ['hàng cây', 'gió', 'với'],
      explanation: 'Gọi gió là "chị", gán cho gió tính "tinh nghịch" và hành động "đùa" - đều là từ dùng cho người.',
      hint: 'Tìm những từ chỉ dùng cho con người.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào KHÔNG dùng phép nhân hoá?',
      correct: 'Cây bàng cao khoảng năm mét.', distractors: ['Cây bàng đứng trầm ngâm.', 'Cây bàng vẫy tay chào.', 'Cây bàng khoác áo mới.'],
      explanation: '"Cao khoảng năm mét" chỉ là miêu tả thông thường, không gán đặc điểm của người.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tác dụng chính của phép nhân hoá trong văn miêu tả là gì?',
      correct: 'Làm sự vật trở nên sinh động, gần gũi như con người',
      distractors: ['Làm câu văn ngắn gọn hơn', 'Giúp người đọc đếm được số lượng', 'Làm bài văn dài hơn'],
      explanation: 'Nhân hoá thổi hồn vào sự vật, giúp người đọc cảm thấy gần gũi.',
    },
    {
      kind: 'text', difficulty: 3,
      prompt: 'Điền từ nhân hoá còn thiếu: "Bác trống trường ... vang báo giờ vào lớp." (từ chỉ tiếng nói của người)',
      accepted: ['gọi', 'cất tiếng gọi', 'nói', 'gọi to'],
      explanation: 'Dùng từ chỉ hành động của người như "gọi" để nhân hoá cái trống.',
    },
  ],

  // =========================================================================
  // LỚP 5
  // =========================================================================

  'vietnamese.g5.dai-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là đại từ xưng hô?',
      correct: 'chúng tôi', distractors: ['ngôi nhà', 'chạy nhảy', 'xinh đẹp'],
      explanation: 'Đại từ xưng hô dùng để tự xưng hoặc gọi người khác: tôi, ta, chúng tôi, bạn, các cậu...',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Trong câu "Lan rất chăm học. Bạn ấy luôn làm bài đầy đủ.", từ "bạn ấy" thay thế cho từ nào?',
      correct: 'Lan', distractors: ['chăm học', 'bài', 'đầy đủ'],
      explanation: '"Bạn ấy" là đại từ thay thế, dùng để thay cho "Lan" nhằm tránh lặp từ.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Vì sao ta dùng đại từ thay thế trong đoạn văn?',
      correct: 'Để tránh lặp từ và câu văn mượt hơn', distractors: ['Để đoạn văn dài hơn', 'Để giấu tên nhân vật', 'Để câu khó hiểu hơn'],
      explanation: 'Đại từ thay thế giúp liên kết câu và tránh lặp từ gây nhàm chán.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Khi nói với thầy cô, nên xưng hô thế nào?',
      correct: 'Em - thầy/cô', distractors: ['Tao - mày', 'Tôi - ông/bà', 'Mình - cậu'],
      explanation: 'Xưng hô phải phù hợp với quan hệ và thể hiện sự lễ phép.',
      hint: 'Xưng hô thể hiện thái độ tôn trọng.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Trong câu "Trời nắng to. Điều đó khiến cả lớp mệt.", từ "điều đó" thay thế cho gì?',
      correct: 'Cả câu "Trời nắng to"', distractors: ['Từ "trời"', 'Từ "nắng"', 'Từ "cả lớp"'],
      explanation: 'Đại từ có thể thay thế cho cả một câu hoặc một ý, không chỉ một từ.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng đại từ xưng hô CHƯA phù hợp?',
      correct: 'Thưa cô, tôi chưa hiểu bài ạ.',
      distractors: ['Thưa cô, em chưa hiểu bài ạ.', 'Bạn ơi, cho mình mượn bút nhé.', 'Cháu chào bác ạ.'],
      explanation: 'Với thầy cô, học sinh xưng "em" chứ không xưng "tôi".',
    },
  ],

  'vietnamese.g5.quan-he-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Từ nào là quan hệ từ?',
      correct: 'nhưng', distractors: ['chạy', 'đẹp', 'quyển sách'],
      explanation: 'Quan hệ từ nối các từ ngữ hoặc các vế câu: và, với, của, nhưng, vì, nên, nếu, thì...',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Điền quan hệ từ: "Trời mưa to ... em vẫn đi học."',
      correct: 'nhưng', distractors: ['và', 'của', 'với'],
      explanation: 'Hai vế có ý trái ngược nên dùng quan hệ từ "nhưng".',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Cặp quan hệ từ "Vì... nên..." biểu thị quan hệ gì?',
      correct: 'Nguyên nhân - kết quả', distractors: ['Điều kiện - kết quả', 'Tương phản', 'Tăng tiến'],
      explanation: '"Vì" nêu nguyên nhân, "nên" nêu kết quả.',
    },
    {
      kind: 'pairs', difficulty: 2,
      prompt: 'Nối cặp quan hệ từ với kiểu quan hệ',
      pairs: [
        ['Vì... nên...', 'Nguyên nhân - kết quả'],
        ['Nếu... thì...', 'Điều kiện - kết quả'],
        ['Tuy... nhưng...', 'Tương phản'],
      ],
      explanation: 'Mỗi cặp quan hệ từ biểu thị một kiểu quan hệ giữa hai vế câu.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào dùng quan hệ từ SAI?',
      correct: 'Vì trời mưa nhưng em vẫn đi học.',
      distractors: ['Vì trời mưa nên em nghỉ học.', 'Tuy trời mưa nhưng em vẫn đi học.', 'Nếu trời mưa thì em ở nhà.'],
      explanation: 'Không được ghép "Vì" với "nhưng"; "vì" phải đi với "nên", "tuy" mới đi với "nhưng".',
      hint: 'Kiểm tra xem hai từ trong cặp có hợp nhau không.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Chọn cặp quan hệ từ hợp nhất: "... em chăm chỉ hơn ... kết quả đã tốt hơn nhiều."',
      correct: 'Nếu... thì...',
      distractors: ['Vì... nên...', 'Tuy... nhưng...', 'Không những... mà còn...'],
      explanation: 'Câu nêu một giả thiết chưa xảy ra nên dùng cặp "Nếu... thì..." chỉ điều kiện - kết quả.',
      hint: 'Việc "chăm chỉ hơn" đã xảy ra chưa?',
    },
  ],

  'vietnamese.g5.cau-ghep': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu ghép là câu như thế nào?',
      correct: 'Câu có từ hai cụm chủ ngữ - vị ngữ trở lên',
      distractors: ['Câu có nhiều từ', 'Câu có dấu phẩy', 'Câu dài hơn mười từ'],
      explanation: 'Câu ghép do hai hoặc nhiều vế câu (mỗi vế có chủ ngữ và vị ngữ riêng) ghép lại.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu nào là câu ghép?',
      correct: 'Trời mưa to nên đường ngập nước.',
      distractors: ['Trời mưa rất to.', 'Đường phố ngập nước.', 'Em đi học bằng xe đạp.'],
      explanation: 'Câu đó có hai vế: "trời mưa to" và "đường ngập nước", mỗi vế đủ chủ ngữ - vị ngữ.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu "Gió thổi, lá rơi đầy sân." có mấy vế câu?',
      correct: '2 vế', distractors: ['1 vế', '3 vế', '4 vế'],
      explanation: 'Vế 1: "Gió thổi". Vế 2: "lá rơi đầy sân". Hai vế nối với nhau bằng dấu phẩy.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Các vế trong câu ghép có thể nối với nhau bằng cách nào?',
      correct: 'Bằng quan hệ từ hoặc bằng dấu câu', distractors: ['Chỉ bằng dấu chấm', 'Chỉ bằng dấu ngoặc kép', 'Không nối được'],
      explanation: 'Có thể nối trực tiếp bằng dấu phẩy, dấu chấm phẩy, hoặc dùng quan hệ từ.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Câu nào là câu ĐƠN chứ không phải câu ghép?',
      correct: 'Nam và Lan cùng đi học.',
      distractors: ['Nam đi học, Lan ở nhà.', 'Vì Nam ốm nên Lan đi một mình.', 'Nam đi học còn Lan ở nhà.'],
      explanation: '"Nam và Lan" là hai chủ ngữ nhưng chỉ có MỘT vị ngữ chung, nên đây là câu đơn.',
      hint: 'Đếm số cụm chủ ngữ - vị ngữ, không phải số tên người.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tách câu ghép "Mẹ đi chợ còn em ở nhà học bài." thành hai câu đơn thì được:',
      correct: 'Mẹ đi chợ. Em ở nhà học bài.',
      distractors: ['Mẹ đi chợ còn em. Ở nhà học bài.', 'Mẹ đi. Chợ còn em ở nhà học bài.', 'Mẹ. Đi chợ còn em ở nhà học bài.'],
      explanation: 'Mỗi vế câu ghép tách ra thành một câu đơn hoàn chỉnh, bỏ quan hệ từ "còn".',
    },
  ],

  'vietnamese.g5.lien-ket-cau': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Có mấy cách liên kết câu thường gặp?',
      correct: '3 cách: lặp, thế, nối', distractors: ['1 cách', '2 cách', '5 cách'],
      explanation: 'Ba phép liên kết: phép lặp từ ngữ, phép thay thế, phép nối.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Đoạn "Cây tre rất dẻo dai. Tre có mặt khắp làng quê Việt Nam." dùng phép liên kết nào?',
      correct: 'Phép lặp', distractors: ['Phép thế', 'Phép nối', 'Không có liên kết'],
      explanation: 'Từ "tre" được lặp lại ở câu sau để nối hai câu.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Đoạn "Lan học rất giỏi. Em ấy luôn đứng đầu lớp." dùng phép liên kết nào?',
      correct: 'Phép thế', distractors: ['Phép lặp', 'Phép nối', 'Phép so sánh'],
      explanation: '"Em ấy" thay thế cho "Lan" - đó là phép thế.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Đoạn "Trời mưa rất to. Vì vậy, trận đấu bị hoãn." dùng phép liên kết nào?',
      correct: 'Phép nối', distractors: ['Phép lặp', 'Phép thế', 'Phép nhân hoá'],
      explanation: '"Vì vậy" là từ nối, thể hiện quan hệ nguyên nhân - kết quả giữa hai câu.',
      hint: 'Tìm từ đứng đầu câu sau để nối ý.',
    },
    {
      kind: 'pairs', difficulty: 3,
      prompt: 'Nối từ ngữ với phép liên kết tương ứng',
      pairs: [
        ['Lặp lại chính từ đó', 'Phép lặp'],
        ['Dùng "nó", "điều đó"', 'Phép thế'],
        ['Dùng "tuy nhiên", "vì vậy"', 'Phép nối'],
      ],
      explanation: 'Mỗi phép liên kết có dấu hiệu nhận biết riêng.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Đoạn văn nào liên kết KÉM nhất?',
      correct: 'Em thích đọc sách. Hôm qua trời mưa. Con mèo màu đen.',
      distractors: [
        'Em thích đọc sách. Sách giúp em hiểu biết nhiều điều.',
        'Em thích đọc sách. Nó giúp em thư giãn.',
        'Em thích đọc sách. Vì vậy em hay ra thư viện.',
      ],
      explanation: 'Ba câu rời rạc, không có từ ngữ nào nối ý với nhau nên đoạn văn không liên kết.',
    },
  ],

  'vietnamese.g5.bien-phap-tu-tu': [
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Trẻ em như búp trên cành" dùng biện pháp tu từ nào?',
      correct: 'So sánh', distractors: ['Nhân hoá', 'Điệp ngữ', 'Nói quá'],
      explanation: 'Từ "như" nối hai vế, so sánh trẻ em với búp non.',
    },
    {
      kind: 'choice', difficulty: 1,
      prompt: 'Câu "Trăng tròn như mắt cá, chẳng bao giờ chớp mi" dùng những biện pháp nào?',
      correct: 'So sánh và nhân hoá', distractors: ['Chỉ so sánh', 'Chỉ nhân hoá', 'Điệp ngữ'],
      explanation: '"Như mắt cá" là so sánh; "chẳng bao giờ chớp mi" gán hành động của người cho trăng - là nhân hoá.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Điệp ngữ là gì?',
      correct: 'Lặp lại từ ngữ để nhấn mạnh', distractors: ['So sánh hai sự vật', 'Gọi vật như gọi người', 'Nói giảm nói tránh'],
      explanation: 'Điệp ngữ lặp có chủ ý một từ hoặc cụm từ để nhấn mạnh cảm xúc, ý nghĩa.',
    },
    {
      kind: 'choice', difficulty: 2,
      prompt: 'Câu nào dùng điệp ngữ?',
      correct: 'Học, học nữa, học mãi.', distractors: ['Em rất thích học.', 'Học là việc quan trọng.', 'Ai cũng phải học.'],
      explanation: 'Từ "học" được lặp ba lần để nhấn mạnh việc học phải liên tục suốt đời.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Trong câu "Mặt trời xuống biển như hòn lửa. Sóng đã cài then, đêm sập cửa.", biện pháp nhân hoá nằm ở đâu?',
      correct: 'Sóng cài then, đêm sập cửa', distractors: ['Mặt trời xuống biển', 'Như hòn lửa', 'Xuống biển'],
      explanation: 'Sóng và đêm được gán hành động của con người (cài then, sập cửa) - đó là nhân hoá. Vế đầu là so sánh.',
      hint: 'Tìm hành động chỉ con người mới làm được.',
    },
    {
      kind: 'choice', difficulty: 3,
      prompt: 'Tác dụng của biện pháp tu từ trong văn miêu tả là gì?',
      correct: 'Làm câu văn gợi hình, gợi cảm hơn',
      distractors: ['Làm bài văn dài hơn', 'Giúp đếm số câu dễ hơn', 'Làm câu văn khó hiểu hơn'],
      explanation: 'Biện pháp tu từ giúp người đọc hình dung rõ và cảm nhận sâu hơn.',
    },
  ],
}

export default bank
