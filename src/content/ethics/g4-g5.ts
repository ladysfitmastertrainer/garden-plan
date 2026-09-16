/** Ngân hàng tình huống Đạo đức lớp 4-5. */

import { opt, type Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // LỚP 4
  // =========================================================================

  'ethics.g4.trung-thuc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con nhặt được 50.000 đồng ở sân trường. Không ai nhìn thấy. Con sẽ làm gì?',
      explanation: 'Của rơi thì trả lại - số tiền đó có thể rất quan trọng với người đánh mất.',
      options: [
        opt('nop-co', 'Mang nộp cho cô giáo hoặc bác bảo vệ để tìm người mất', 'good', 'Rất trung thực! Bạn nào mất tiền chắc đang lo lắm, con vừa giúp bạn ấy.', ['honesty', 'citizenship']),
        opt('hoi-quanh', 'Hỏi các bạn xung quanh xem ai đánh rơi', 'ok', 'Có ý tìm người mất là tốt. Nhưng nộp cho cô thì chắc chắn tới đúng người hơn.', ['honesty']),
        opt('giu-lai', 'Cất vào túi, coi như mình may mắn', 'poor', 'Số tiền đó có thể là tiền ăn sáng cả tuần của một bạn. Con thử nghĩ xem bạn ấy đang thế nào.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con được 9 điểm nhưng cô cộng nhầm thành 10. Con đã cầm bài về chỗ. Con sẽ làm gì?',
      explanation: 'Trung thực cả khi việc đó làm mình thiệt - đó mới là trung thực thật.',
      options: [
        opt('bao-co', 'Mang bài lên báo cô cộng nhầm', 'good', 'Rất đáng khâm phục! Con dám nói thật dù điều đó làm con mất một điểm.', ['honesty']),
        opt('bao-sau', 'Đợi hết giờ rồi gặp riêng cô để báo', 'ok', 'Vẫn là trung thực, chỉ muộn hơn một chút. Cô sẽ vẫn rất quý con.', ['honesty']),
        opt('im-lang', 'Im lặng, cô nhầm chứ có phải mình gian lận đâu', 'poor', 'Biết sai mà im lặng để hưởng lợi thì cũng không khác gian lận là mấy. Con thử báo cô xem.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Bạn thân rủ con cùng nói dối cô là cả hai bị ốm để trốn buổi lao động. Con sẽ làm gì?',
      explanation: 'Tình bạn thật sự không đòi hỏi con phải làm điều sai.',
      options: [
        opt('tu-choi-va-khuyen', 'Từ chối và khuyên bạn cùng đi lao động', 'good', 'Rất bản lĩnh! Người bạn tốt là người ngăn bạn mình làm sai, không phải làm sai cùng bạn.', ['honesty', 'kindness']),
        opt('tu-choi', 'Chỉ từ chối phần mình, còn bạn làm gì thì kệ', 'ok', 'Con giữ được sự trung thực của mình. Nếu khuyên bạn nữa thì bạn cũng được giúp.', ['honesty']),
        opt('lam-theo', 'Nói dối cùng bạn cho bạn khỏi giận', 'poor', 'Nói dối một lần thì phải nói dối tiếp để che. Bạn tốt sẽ hiểu khi con từ chối.'),
      ],
    },
  ],

  'ethics.g4.biet-on-nguoi-lao-dong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bác lao công đang quét sân trường thì con và các bạn chạy qua làm rơi vỏ bánh xuống đất. Con sẽ làm gì?',
      explanation: 'Biết ơn người lao động thể hiện qua việc không làm khó thêm công việc của họ.',
      options: [
        opt('nhat-va-cam-on', 'Quay lại nhặt vỏ bánh bỏ vào thùng rác và xin lỗi bác', 'good', 'Rất đáng khen! Bác sẽ thấy công sức của mình được trân trọng.', ['respect', 'responsibility']),
        opt('nhat', 'Lặng lẽ quay lại nhặt vỏ bánh bỏ vào thùng', 'ok', 'Hành động đúng rồi. Thêm một lời xin lỗi nữa thì bác vui hơn.', ['responsibility']),
        opt('chay-tiep', 'Chạy tiếp, đằng nào bác cũng đang quét mà', 'poor', 'Bác quét cả sân đã rất mệt. Mình xả thêm thì công việc của bác không bao giờ xong.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Trong bữa cơm, con thấy vẫn còn nhiều cơm trong bát nhưng không muốn ăn nữa. Con sẽ làm gì?',
      explanation: 'Mỗi hạt cơm là công sức của người nông dân - không lãng phí cũng là biết ơn.',
      options: [
        opt('an-het', 'Cố ăn hết chỗ cơm đã lấy và lần sau lấy ít hơn', 'good', 'Rất tốt! Lấy vừa đủ là cách tôn trọng công sức người làm ra hạt gạo.', ['respect', 'responsibility']),
        opt('de-danh', 'Xin phép để dành phần còn lại cho bữa sau', 'ok', 'Không bỏ phí là tốt. Nhưng lấy vừa đủ ngay từ đầu vẫn hơn.', ['responsibility']),
        opt('do-di', 'Đổ đi, còn ít thôi mà', 'poor', 'Để có bát cơm đó, bác nông dân phải làm ròng rã mấy tháng. Con thử lấy ít hơn lần sau nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Một bạn trong lớp nói rằng "làm nghề thu gom rác thì thấp kém". Con sẽ làm gì?',
      explanation: 'Mọi nghề lao động chân chính đều đáng trọng, và mỗi nghề đều cần thiết cho xã hội.',
      options: [
        opt('phan-bien', 'Nói với bạn rằng không có nghề nào thấp kém, thử tưởng tượng một tuần không ai thu gom rác xem sao', 'good', 'Rất thuyết phục! Con vừa bảo vệ người lao động vừa giúp bạn nhìn ra vấn đề.', ['respect', 'citizenship']),
        opt('khong-dong-y', 'Nói là mình không đồng ý rồi thôi', 'ok', 'Không hùa theo là tốt. Nếu giải thích thêm thì bạn mới thay đổi suy nghĩ.', ['respect']),
        opt('cuoi-theo', 'Cười theo cho vui, mình có nói gì đâu', 'poor', 'Cười theo là đang đồng tình. Nếu bố mẹ con làm nghề đó, con sẽ thấy thế nào?'),
      ],
    },
  ],

  'ethics.g4.ton-trong-tai-san': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con cần dùng bút màu của bạn nhưng bạn đang ra ngoài. Con sẽ làm gì?',
      explanation: 'Hỏi trước khi mượn là nguyên tắc cơ bản khi dùng đồ của người khác.',
      options: [
        opt('doi-hoi', 'Đợi bạn về rồi hỏi mượn', 'good', 'Đúng rồi! Đồ của ai thì người ấy quyết định cho mượn hay không.', ['respect', 'honesty']),
        opt('muon-bao-sau', 'Mượn tạm và báo bạn ngay khi bạn về', 'ok', 'Có báo lại là tốt hơn im lặng. Nhưng hỏi trước vẫn đúng mực hơn.', ['honesty']),
        opt('lay-luon', 'Lấy dùng luôn, bạn thân mà, chắc bạn không để ý', 'poor', 'Dù thân đến mấy, tự ý lấy đồ vẫn làm bạn khó chịu. Hỏi một câu là xong.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con mượn xe đạp của anh trai và làm xước sơn. Anh chưa biết. Con sẽ làm gì?',
      explanation: 'Làm hỏng đồ mượn thì phải nhận và tìm cách khắc phục, không phải giấu đi.',
      options: [
        opt('nhan-va-den', 'Nói thật với anh và đề nghị dùng tiền tiết kiệm sửa lại', 'good', 'Rất có trách nhiệm! Anh sẽ tin con và tiếp tục cho con mượn đồ.', ['honesty', 'responsibility']),
        opt('nhan-loi', 'Nói thật với anh và xin lỗi', 'ok', 'Trung thực là điều quan trọng nhất rồi. Nếu đề nghị khắc phục nữa thì trọn vẹn.', ['honesty']),
        opt('giau', 'Dựng xe ở chỗ khuất, hi vọng anh không để ý', 'poor', 'Anh sẽ phát hiện ra và còn buồn hơn vì con giấu. Nói thật ngay thì nhẹ hơn nhiều.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con mượn truyện của bạn và đọc xong từ hai tuần trước nhưng quên chưa trả. Bạn cũng không nhắc. Con sẽ làm gì?',
      explanation: 'Bạn không nhắc không có nghĩa là bạn không cần - đồ mượn thì phải chủ động trả.',
      options: [
        opt('tra-ngay', 'Mang trả bạn ngay hôm sau kèm lời xin lỗi vì giữ lâu', 'good', 'Rất có trách nhiệm! Bạn sẽ yên tâm cho con mượn lần sau.', ['responsibility', 'respect']),
        opt('hoi-ban', 'Hỏi bạn còn cần truyện không rồi mới trả', 'ok', 'Có nhớ tới là tốt. Nhưng truyện là của bạn, trả luôn vẫn đúng hơn là hỏi.', ['respect']),
        opt('giu-tiep', 'Giữ tiếp, bạn không đòi tức là bạn chưa cần', 'poor', 'Có thể bạn ngại nhắc thôi. Con thử đặt mình vào vị trí bạn xem.'),
      ],
    },
  ],

  'ethics.g4.quyen-bon-phan-tre-em': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy một bạn trong xóm phải ở nhà trông em và không được đi học. Con sẽ làm gì?',
      explanation: 'Được đi học là quyền của mọi trẻ em. Thấy bạn không được đi học thì nên báo người lớn.',
      options: [
        opt('bao-nguoi-lon', 'Kể với bố mẹ hoặc cô giáo để người lớn tìm cách giúp bạn', 'good', 'Rất đúng! Học tập là quyền của trẻ em, và người lớn có thể giúp gia đình bạn.', ['citizenship', 'kindness']),
        opt('cho-muon-vo', 'Cho bạn mượn vở để bạn tự học ở nhà', 'ok', 'Con thật tốt bụng. Nhưng tự học ở nhà không thay được việc đến trường, nên vẫn cần báo người lớn.', ['kindness']),
        opt('ke', 'Đó là chuyện nhà bạn, mình không nên xen vào', 'poor', 'Đi học là quyền của bạn ấy, không phải chuyện riêng. Nói với người lớn có thể thay đổi cả tương lai bạn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con muốn có thêm thời gian chơi game, nhưng bố mẹ giao con việc dọn phòng và học bài. Con sẽ làm gì?',
      explanation: 'Trẻ em có quyền vui chơi, nhưng cũng có bổn phận với gia đình và việc học.',
      options: [
        opt('lam-xong-roi-choi', 'Làm xong việc và học bài rồi mới xin chơi', 'good', 'Con hiểu rất đúng: quyền vui chơi đi kèm bổn phận đã hoàn thành.', ['responsibility', 'perseverance']),
        opt('thoa-thuan', 'Xin bố mẹ cho chơi 15 phút trước rồi làm sau', 'ok', 'Trao đổi với bố mẹ thay vì tự ý là đúng cách, miễn là con giữ lời.', ['honesty']),
        opt('choi-truoc', 'Chơi trước đã, việc để tối làm cũng được', 'poor', 'Tối thường buồn ngủ và việc dễ bị bỏ dở. Làm xong rồi chơi mới thoải mái thật sự.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con muốn tham gia câu lạc bộ bóng đá nhưng bố mẹ lo con sẽ sao nhãng học hành. Con sẽ làm gì?',
      explanation: 'Trẻ em có quyền được vui chơi và bày tỏ ý kiến - điều quan trọng là nói ra một cách có trách nhiệm.',
      options: [
        opt('trao-doi', 'Xin bố mẹ cho thử một tháng và cam kết giữ nguyên kết quả học tập', 'good', 'Rất chín chắn! Con vừa bày tỏ mong muốn vừa cho bố mẹ thấy sự có trách nhiệm.', ['responsibility', 'honesty']),
        opt('xin-lai', 'Nói với bố mẹ là con rất thích và xin bố mẹ suy nghĩ lại', 'ok', 'Bày tỏ ý kiến là quyền của con. Nếu kèm một cam kết cụ thể thì bố mẹ dễ yên tâm hơn.', ['honesty']),
        opt('tu-di', 'Cứ đi tập mà không nói với bố mẹ', 'poor', 'Giấu bố mẹ làm mất lòng tin, và nếu có chuyện gì thì không ai biết con ở đâu.'),
      ],
    },
  ],

  'ethics.g4.bao-ve-cua-cong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy vòi nước công cộng ở công viên đang chảy mà không ai dùng. Con sẽ làm gì?',
      explanation: 'Của công là của chung mọi người, ai thấy hỏng hóc cũng nên ra tay.',
      options: [
        opt('khoa-lai', 'Khoá vòi nước lại', 'good', 'Rất có ý thức! Con vừa tiết kiệm nước cho tất cả mọi người.', ['citizenship', 'responsibility']),
        opt('bao-bao-ve', 'Đi tìm bác bảo vệ công viên để báo', 'ok', 'Báo người quản lí cũng đúng. Nhưng nếu chỉ cần vặn khoá thì con làm luôn nhanh hơn.', ['citizenship']),
        opt('di-tiep', 'Đi tiếp, của công đã có người lo', 'poor', 'Nước cứ chảy cả ngày thì lãng phí rất nhiều. Chỉ một động tác của con là xong.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con thấy vài bạn lớp khác đang bẻ cành cây trong sân trường. Các bạn ấy lớn hơn con. Con sẽ làm gì?',
      explanation: 'Bảo vệ của công là đúng, nhưng phải chọn cách an toàn cho bản thân.',
      options: [
        opt('bao-thay-co', 'Đi báo thầy cô hoặc bác bảo vệ', 'good', 'Xử lí khôn ngoan! Con vừa bảo vệ được cây vừa giữ an toàn cho mình.', ['citizenship', 'responsibility']),
        opt('nhac-nhe', 'Nhắc nhẹ các bạn rồi đi báo nếu các bạn không dừng', 'ok', 'Có dũng khí đấy. Nhưng với các anh chị lớn hơn, báo thầy cô luôn thì an toàn hơn.', ['citizenship']),
        opt('lo-di', 'Coi như không thấy, mình bé hơn mà', 'poor', 'Con không cần đối đầu trực tiếp - chỉ cần nói với thầy cô là đủ rồi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con thấy ghế đá công viên bị lung lay một chân, có thể làm người ngồi bị ngã. Con sẽ làm gì?',
      explanation: 'Bảo vệ của công gồm cả việc báo hỏng hóc để người khác không gặp nguy hiểm.',
      options: [
        opt('bao-va-canh-bao', 'Báo bác bảo vệ và nhắc người xung quanh đừng ngồi ghế đó', 'good', 'Rất chu đáo! Con vừa báo sửa vừa ngăn được tai nạn ngay lúc này.', ['citizenship', 'kindness']),
        opt('bao-bao-ve', 'Đi tìm bác bảo vệ để báo', 'ok', 'Báo là đúng rồi. Trong lúc chờ, nhắc mọi người một câu thì an toàn hơn.', ['citizenship']),
        opt('tranh-ra', 'Tránh xa cái ghế đó ra và đi chỗ khác', 'poor', 'Con an toàn nhưng người tới sau thì không. Chỉ cần báo một câu thôi.'),
      ],
    },
  ],

  // =========================================================================
  // LỚP 5
  // =========================================================================

  'ethics.g5.bao-ve-moi-truong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vừa uống xong hộp sữa. Thùng rác cách đó khoảng 20 mét. Con sẽ làm gì?',
      explanation: 'Bỏ rác đúng nơi quy định là việc nhỏ nhất mà ai cũng làm được cho môi trường.',
      options: [
        opt('di-bo-rac', 'Cầm hộp đi tới thùng rác bỏ vào', 'good', 'Rất tốt! 20 mét không xa, mà môi trường được sạch thêm một chút.', ['citizenship', 'responsibility']),
        opt('cam-ve', 'Cất vào cặp, về nhà bỏ vào thùng rác', 'ok', 'Không xả bừa là tốt rồi. Nhưng hộp sữa để trong cặp dễ rò rỉ bẩn sách vở.', ['citizenship']),
        opt('vut-luon', 'Vứt ngay tại chỗ, tí nữa có người quét', 'poor', 'Nếu ai cũng nghĩ thế thì cả sân đầy rác. Đi thêm vài bước thôi mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhà con có thùng rác riêng cho rác tái chế nhưng con thấy phân loại hơi mất công. Con sẽ làm gì?',
      explanation: 'Phân loại rác giúp tái chế được nhiều hơn và giảm rác chôn lấp.',
      options: [
        opt('phan-loai', 'Vẫn phân loại đúng vì chai lọ có thể tái chế được', 'good', 'Rất có ý thức! Một chai nhựa tái chế được là bớt một chai rác ra môi trường.', ['citizenship', 'perseverance']),
        opt('phan-loai-mot-phan', 'Chỉ phân loại chai nhựa, còn lại bỏ chung', 'ok', 'Làm được phần nào tốt phần đó. Giấy và lon cũng tái chế được đấy.', ['citizenship']),
        opt('bo-chung', 'Bỏ chung hết cho nhanh', 'poor', 'Rác trộn lẫn thì gần như không tái chế được nữa. Chỉ mất vài giây để phân loại thôi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Lớp con tổ chức sinh nhật và định dùng cốc nhựa, ống hút nhựa dùng một lần cho 40 bạn. Con sẽ làm gì?',
      explanation: 'Đề xuất giải pháp thay thế hiệu quả hơn là chỉ phê phán.',
      options: [
        opt('de-xuat', 'Đề xuất mỗi bạn mang cốc riêng từ nhà và bỏ ống hút', 'good', 'Rất sáng suốt! Con vừa nêu vấn đề vừa đưa ra giải pháp thực hiện được ngay.', ['citizenship', 'responsibility']),
        opt('mang-coc-rieng', 'Tự mang cốc của mình đi, không nói gì thêm', 'ok', 'Con làm gương là tốt. Nhưng nếu nói ra thì cả lớp cùng thay đổi được.', ['citizenship']),
        opt('khong-noi', 'Không nói gì, một buổi thôi mà', 'poor', 'Một buổi của 40 bạn là 40 cốc nhựa. Con thử nêu ý kiến xem các bạn có đồng ý không.'),
      ],
    },
  ],

  'ethics.g5.vuot-qua-kho-khan': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con làm bài toán khó ba lần đều sai. Con bắt đầu thấy nản. Con sẽ làm gì?',
      explanation: 'Thất bại vài lần là chuyện bình thường - quan trọng là tìm cách khác chứ không bỏ cuộc.',
      options: [
        opt('doc-lai-de', 'Đọc lại đề thật kỹ và thử cách giải khác', 'good', 'Rất kiên trì! Sai ba lần nghĩa là con đã loại được ba cách không đúng.', ['perseverance']),
        opt('nghi-roi-lam', 'Nghỉ 10 phút cho đầu óc thoáng rồi làm lại', 'ok', 'Nghỉ ngắn giúp nhìn ra lỗi sai. Miễn là con quay lại làm thật.', ['perseverance']),
        opt('bo', 'Bỏ bài này, để mai hỏi bạn chép cho nhanh', 'poor', 'Chép thì mai kiểm tra con vẫn không làm được. Thử thêm một lần nữa hoặc hỏi cô xem.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con tập mãi một bài hát mà vẫn hát sai nhịp, trong khi các bạn đã thuộc hết. Con sẽ làm gì?',
      explanation: 'Mỗi người có tốc độ học khác nhau. So sánh với chính mình hôm qua mới đúng.',
      options: [
        opt('tap-cham', 'Tập chậm từng câu và nhờ cô hoặc bạn chỉ chỗ sai', 'good', 'Đúng cách! Chậm mà chắc còn hơn nhanh mà sai mãi không sửa.', ['perseverance', 'honesty']),
        opt('tap-them', 'Về nhà tự tập thêm mỗi ngày một chút', 'ok', 'Chăm chỉ là tốt. Nhưng nếu không biết mình sai ở đâu thì tập nhiều cũng khó sửa.', ['perseverance']),
        opt('bo-hat', 'Xin cô cho đứng hàng cuối và hát nhép', 'poor', 'Hát nhép thì con sẽ không bao giờ hát được. Nhờ cô chỉ một lần là con tiến bộ ngay.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con đăng ký thi chạy của trường nhưng vòng loại chỉ về thứ tám. Còn ba tuần nữa là vòng chung kết. Con sẽ làm gì?',
      explanation: 'Một kết quả chưa tốt là thông tin để điều chỉnh, không phải lí do để dừng lại.',
      options: [
        opt('tap-co-ke-hoach', 'Hỏi thầy thể dục cách tập rồi luyện đều mỗi ngày', 'good', 'Rất đáng khen! Con biến thất bại thành bàn đạp - đó chính là vượt khó.', ['perseverance', 'responsibility']),
        opt('tap-them', 'Tự chạy thêm mỗi sáng cho khoẻ hơn', 'ok', 'Chăm chỉ là tốt. Nhưng tập đúng cách còn quan trọng hơn tập nhiều.', ['perseverance']),
        opt('rut-lui', 'Xin rút khỏi cuộc thi cho đỡ xấu hổ', 'poor', 'Thứ tám ở vòng loại không phải điều xấu hổ. Ba tuần đủ để con tiến bộ nhiều đấy.'),
      ],
    },
  ],

  'ethics.g5.an-toan-tren-mang': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Một người lạ nhắn tin trên mạng, xin số điện thoại và địa chỉ nhà con. Con sẽ làm gì?',
      explanation: 'Không bao giờ cung cấp thông tin cá nhân cho người lạ trên mạng.',
      options: [
        opt('bao-bo-me', 'Không trả lời và báo ngay cho bố mẹ', 'good', 'Chính xác! Thông tin cá nhân là thứ phải giữ kín với người lạ.', ['responsibility']),
        opt('khong-tra-loi', 'Không trả lời và chặn người đó', 'ok', 'Không cho thông tin là đúng. Nhưng báo bố mẹ để người lớn biết thì an toàn hơn.', ['responsibility']),
        opt('cho-thong-tin', 'Gửi thông tin vì người đó nói là bạn cùng trường', 'poor', 'Trên mạng ai cũng có thể nói mình là bất kỳ ai. Con hãy hỏi bố mẹ trước đã.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con thấy các bạn trong nhóm chat đang nói xấu và chế ảnh một bạn cùng lớp. Con sẽ làm gì?',
      explanation: 'Im lặng trước bắt nạt trên mạng cũng là một cách tiếp tay.',
      options: [
        opt('ngan-va-bao', 'Nhắn đề nghị các bạn dừng lại và báo cô giáo', 'good', 'Rất dũng cảm! Bạn bị nói xấu sẽ tổn thương rất lâu, con vừa bảo vệ bạn ấy.', ['kindness', 'citizenship']),
        opt('roi-nhom', 'Không tham gia và rời khỏi nhóm chat', 'ok', 'Không hùa theo là đúng. Nhưng bạn kia vẫn đang bị nói xấu mà không ai bênh.', ['honesty']),
        opt('cuoi-theo', 'Thả biểu tượng cười cho vui, mình có nói gì đâu', 'poor', 'Thả cười là đang cổ vũ. Nếu con là bạn ấy và thấy ảnh mình bị chế, con sẽ thế nào?'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con thấy một bài đăng nói rằng ăn một loại quả sẽ chữa được mọi bệnh. Nhiều người chia sẻ lắm. Con sẽ làm gì?',
      explanation: 'Nhiều người chia sẻ không có nghĩa là đúng - cần kiểm chứng trước khi tin và lan truyền.',
      options: [
        opt('kiem-chung', 'Hỏi bố mẹ hoặc tra nguồn tin đáng tin cậy trước khi tin', 'good', 'Rất tỉnh táo! Kiểm chứng trước khi tin là kỹ năng quan trọng nhất khi lên mạng.', ['honesty', 'citizenship']),
        opt('khong-chia-se', 'Không tin nhưng cũng không nói gì', 'ok', 'Không lan truyền tin chưa rõ là đúng rồi. Nếu nhắc người thân nữa thì tốt hơn.', ['honesty']),
        opt('chia-se', 'Chia sẻ ngay cho mọi người cùng biết', 'poor', 'Tin sai về sức khoẻ có thể khiến người bệnh bỏ thuốc và nguy hiểm tính mạng. Kiểm tra trước đã nhé.'),
      ],
    },
  ],

  'ethics.g5.ton-trong-khac-biet': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Trong lớp có bạn nói giọng địa phương khác và bị vài bạn trêu. Con sẽ làm gì?',
      explanation: 'Mỗi vùng miền có giọng nói riêng, không có giọng nào đúng hay sai.',
      options: [
        opt('benh-ban', 'Nói với các bạn rằng giọng nào cũng hay và rủ bạn ấy chơi cùng', 'good', 'Rất đáng quý! Con vừa bảo vệ bạn vừa dạy các bạn khác một điều đúng.', ['respect', 'kindness']),
        opt('khong-treu', 'Không trêu cùng, nhưng cũng không nói gì', 'ok', 'Không hùa theo là tốt. Nhưng bạn ấy vẫn đang bị trêu một mình đấy.', ['respect']),
        opt('treu-cung', 'Trêu cùng cho vui, có ác ý gì đâu', 'poor', 'Người bị trêu không thấy vui đâu. Giọng nói là quê hương của bạn ấy mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Một bạn trong lớp khuyết tật chân, đi lại chậm. Lớp con sắp đi tham quan. Con sẽ làm gì?',
      explanation: 'Tôn trọng sự khác biệt nghĩa là điều chỉnh để ai cũng tham gia được, chứ không phải để ai đó ở lại.',
      options: [
        opt('di-cung', 'Đề nghị cả nhóm đi chậm lại và cùng đi với bạn', 'good', 'Tuyệt vời! Bạn ấy sẽ được tham gia trọn vẹn như mọi người.', ['kindness', 'respect']),
        opt('di-cung-ban', 'Tự mình đi cùng bạn, còn nhóm cứ đi trước', 'ok', 'Con rất tốt bụng. Nhưng cả nhóm cùng đi chậm lại thì bạn ấy không thấy mình là gánh nặng.', ['kindness']),
        opt('de-ban-o-lai', 'Đề nghị bạn ở lại lớp cho khỏi mệt', 'poor', 'Bạn ấy cũng muốn đi tham quan như con. Điều cần thay đổi là tốc độ của nhóm, không phải quyền tham gia của bạn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Lớp con bầu nhóm trưởng. Một bạn học chưa giỏi nhưng rất có trách nhiệm lại muốn ứng cử. Vài bạn cười và nói bạn ấy "không đủ trình". Con sẽ làm gì?',
      explanation: 'Đánh giá một người cần nhìn đúng năng lực cho việc đó, không quy về một tiêu chí duy nhất.',
      options: [
        opt('ung-ho', 'Lên tiếng rằng nhóm trưởng cần trách nhiệm, và đề nghị cho bạn ấy cơ hội', 'good', 'Rất công bằng! Con vừa bảo vệ bạn vừa chỉ ra tiêu chí đúng cho cả lớp.', ['respect', 'kindness']),
        opt('bo-phieu', 'Không nói gì nhưng vẫn bỏ phiếu cho bạn ấy', 'ok', 'Lá phiếu của con là đúng. Nhưng bạn ấy đang bị cười ngay lúc này mà không ai bênh.', ['respect']),
        opt('im-lang', 'Im lặng, chuyện của lớp cứ để lớp quyết', 'poor', 'Im lặng lúc này khiến bạn ấy nghĩ cả lớp đều đồng tình. Một câu nói của con là đủ.'),
      ],
    },
  ],

  'ethics.g5.biet-on-nguoi-co-cong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Trường tổ chức lễ tưởng niệm các anh hùng liệt sĩ. Con sẽ tham gia thế nào?',
      explanation: 'Biết ơn người có công thể hiện ở thái độ trang nghiêm trong những dịp như thế này.',
      options: [
        opt('nghiem-trang', 'Đứng nghiêm trang, giữ im lặng trong suốt buổi lễ', 'good', 'Rất đúng mực! Sự trang nghiêm của con là lời cảm ơn với những người đã hi sinh.', ['respect', 'citizenship']),
        opt('im-lang', 'Đứng im lặng nhưng thỉnh thoảng nhìn quanh', 'ok', 'Giữ im lặng là tốt. Tập trung hẳn vào buổi lễ thì trang trọng hơn.', ['respect']),
        opt('noi-chuyen', 'Nói chuyện nhỏ với bạn cho đỡ chán', 'poor', 'Buổi lễ chỉ vài phút thôi. Đó là lúc cả trường cùng tưởng nhớ những người đã ngã xuống.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhà con gần một gia đình thương binh. Sắp tới ngày 27/7. Con có thể làm gì?',
      explanation: 'Biết ơn không chỉ nói bằng lời mà thể hiện qua việc làm cụ thể.',
      options: [
        opt('tham-hoi', 'Cùng bố mẹ sang thăm hỏi và giúp bác việc nhà', 'good', 'Rất ý nghĩa! Sự quan tâm thật lòng đáng quý hơn mọi món quà.', ['kindness', 'citizenship']),
        opt('chao-hoi', 'Chào hỏi bác lễ phép mỗi khi gặp', 'ok', 'Lễ phép là tốt. Dịp 27/7 con có thể làm thêm điều gì đó cụ thể hơn.', ['respect']),
        opt('khong-lam-gi', 'Không làm gì, đó là việc của người lớn', 'poor', 'Trẻ em cũng có thể thể hiện lòng biết ơn. Chỉ một lời hỏi thăm cũng làm bác ấm lòng.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con được giao thuyết trình về một người có công với đất nước. Con tìm thấy trên mạng một bài viết hay và đầy đủ. Con sẽ làm gì?',
      explanation: 'Biết ơn người có công thì phải tìm hiểu cho đúng, không sao chép cho xong.',
      options: [
        opt('doc-va-viet-lai', 'Đọc kỹ, đối chiếu vài nguồn rồi tự viết lại bằng lời của mình', 'good', 'Rất nghiêm túc! Hiểu thật rồi kể lại mới là cách tưởng nhớ đúng nghĩa.', ['honesty', 'perseverance']),
        opt('trich-dan', 'Dùng bài đó nhưng ghi rõ nguồn ở cuối', 'ok', 'Ghi nguồn là trung thực. Nhưng tự viết lại thì con mới thật sự hiểu câu chuyện.', ['honesty']),
        opt('chep-nguyen', 'Chép nguyên bài và đọc trước lớp', 'poor', 'Con sẽ không nhớ gì sau buổi thuyết trình, và bạn hỏi lại thì con không trả lời được.'),
      ],
    },
  ],
}

export default bank
