/**
 * Tình huống Đạo đức BỔ SUNG, lớp 3-5.
 *
 * Cùng lý do và cùng quy ước với `extra-g1-g2.ts`: mỗi kỹ năng thêm hai câu bậc
 * 1 và một câu bậc 2, gộp NỐI vào ngân hàng gốc. Tình huống lớp trên dài hơn và
 * có nhiều người trong cuộc hơn - lựa chọn "tạm được" thường đúng một nửa, để
 * trẻ phải cân nhắc chứ không chỉ nhận ra đâu là việc xấu.
 */

import { opt, type Bank } from '../bank'

const bank: Bank = {
  // =========================================================================
  // LỚP 3
  // =========================================================================

  'ethics.g3.giu-loi-hua': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con hứa cho bạn mượn truyện vào hôm nay nhưng lại quên mang. Con sẽ làm gì?',
      explanation: 'Lỡ không giữ được lời hứa thì xin lỗi và hẹn lại cụ thể.',
      options: [
        opt('xin-loi-hen', 'Xin lỗi bạn và ghi chú để mai mang chắc chắn', 'good', 'Rất có trách nhiệm! Bạn sẽ tin lời hứa của con.', ['honesty', 'responsibility']),
        opt('xin-loi', 'Xin lỗi bạn vì quên', 'ok', 'Xin lỗi là tốt. Hẹn lại một ngày cụ thể thì bạn yên tâm hơn.', ['honesty']),
        opt('noi-mat', 'Bảo bạn là truyện bị mất rồi', 'poor', 'Nói dối để chữa lời hứa thì càng sai hơn. Cứ nói thật là con quên.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con hứa với mẹ sẽ tưới cây mỗi chiều. Hôm nay con mải chơi và chợt nhớ ra khi trời sắp tối. Con sẽ làm gì?',
      explanation: 'Lời hứa với người thân cũng cần được giữ như lời hứa với bạn bè.',
      options: [
        opt('di-tuoi-ngay', 'Dừng chơi, đi tưới cây ngay', 'good', 'Tuyệt! Cây được uống nước, và mẹ tin con hơn.', ['responsibility', 'honesty']),
        opt('tuoi-sang-mai', 'Tự hứa sáng mai tưới bù thật nhiều', 'ok', 'Có nhớ là tốt, nhưng cây cần nước hôm nay. Tưới ngay thì hơn.', ['responsibility']),
        opt('bo-qua', 'Bỏ qua, một hôm không tưới cũng được', 'poor', 'Một hôm rồi sẽ thành nhiều hôm. Lời hứa nhỏ cũng cần giữ.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con đã hứa đi sinh nhật bạn A, nhưng hôm đó bạn B rủ đi công viên nước - chỗ con rất thích. Con sẽ làm gì?',
      explanation: 'Đã hứa thì giữ lời, kể cả khi có lời mời hấp dẫn hơn.',
      options: [
        opt('di-sinh-nhat', 'Đi sinh nhật bạn A và hẹn bạn B dịp khác', 'good', 'Rất đáng tin! Bạn A sẽ rất vui vì con đã đến.', ['honesty', 'respect']),
        opt('hoi-y-ban-a', 'Hỏi bạn A xem có thể đến muộn một chút không', 'ok', 'Hỏi thẳng là thật thà, nhưng hôm sinh nhật bạn rất mong con đến đúng giờ.', ['honesty']),
        opt('di-cong-vien', 'Đi công viên nước và nói với A là con bị ốm', 'poor', 'Vừa thất hứa vừa nói dối. Nếu bạn A biết, bạn sẽ buồn lắm.'),
      ],
    },
  ],

  'ethics.g3.hoan-thanh-nhiem-vu': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Hôm nay con trực nhật lớp nhưng bạn cùng tổ đã về trước. Con sẽ làm gì?',
      explanation: 'Việc được giao là trách nhiệm của mình, cần làm cho xong.',
      options: [
        opt('lam-xong', 'Làm hết phần trực nhật rồi mới về, mai nhắc bạn', 'good', 'Rất có trách nhiệm! Lớp sạch sẽ cho ngày mai.', ['responsibility']),
        opt('lam-phan-minh', 'Làm xong phần của mình rồi về', 'ok', 'Con đã làm phần mình. Nhưng lớp chưa sạch thì cả lớp vẫn chịu.', ['responsibility']),
        opt('ve-luon', 'Về luôn, bạn không làm thì mình cũng không làm', 'poor', 'Việc bạn bỏ dở không làm cho việc của con được bỏ. Lớp sẽ bẩn cả ngày mai.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Cô giao con chăm sóc chậu cây của lớp trong tuần này. Con sẽ làm gì?',
      explanation: 'Nhận việc thì làm đến nơi đến chốn.',
      options: [
        opt('tuoi-deu', 'Tưới cây đều mỗi ngày và nhặt lá úa', 'good', 'Chậu cây sẽ xanh tốt nhờ con. Giỏi lắm!', ['responsibility', 'perseverance']),
        opt('nho-thi-tuoi', 'Nhớ lúc nào thì tưới lúc đó', 'ok', 'Có tưới là tốt, nhưng cây cần được chăm đều đặn. Con thử đặt giờ cố định nhé.', ['responsibility']),
        opt('nho-ban', 'Nhờ bạn làm hộ cả tuần', 'poor', 'Cô tin tưởng giao cho con mà. Tự làm thì con mới giữ được lòng tin ấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhóm con làm báo tường, con được giao vẽ tranh. Con vẽ mãi không đẹp và muốn bỏ. Con sẽ làm gì?',
      explanation: 'Hoàn thành nhiệm vụ là cố gắng hết sức và biết tìm cách khi gặp khó.',
      options: [
        opt('nho-chi-va-ve', 'Nhờ bạn vẽ giỏi góp ý rồi vẽ lại', 'good', 'Rất cầu tiến! Tranh sẽ đẹp hơn và con cũng giỏi lên.', ['perseverance', 'responsibility']),
        opt('ve-don-gian', 'Vẽ đơn giản hơn cho kịp nộp', 'ok', 'Nộp đúng hạn là tốt. Cố thêm một chút nữa thì tranh sẽ đẹp hơn.', ['responsibility']),
        opt('bo-do', 'Bỏ dở, để nhóm tự lo', 'poor', 'Cả nhóm đang trông vào phần của con. Bỏ dở làm cả nhóm bị ảnh hưởng.'),
      ],
    },
  ],

  'ethics.g3.xu-ly-bat-hoa': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con và bạn cùng muốn ngồi xích đu. Chỉ có một chiếc. Con sẽ làm gì?',
      explanation: 'Thay phiên nhau là cách giải quyết bất hoà công bằng.',
      options: [
        opt('thay-phien', 'Đề nghị mỗi người chơi 5 phút rồi đổi', 'good', 'Công bằng quá! Cả hai đều được chơi và vẫn vui vẻ.', ['respect', 'kindness']),
        opt('nhuong-ban', 'Nhường bạn chơi trước', 'ok', 'Nhường là tốt. Nhớ nói với bạn để lát nữa con được chơi nhé.', ['kindness']),
        opt('gianh', 'Chạy lên ngồi trước rồi không xuống', 'poor', 'Giành giật dễ gây cãi nhau, còn có thể ngã đấy.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn nói xấu con với các bạn khác. Con rất giận. Con sẽ làm gì?',
      explanation: 'Gặp riêng, nói chuyện bình tĩnh là cách tốt để giải quyết hiểu lầm.',
      options: [
        opt('gap-rieng', 'Chờ bình tĩnh rồi gặp riêng bạn để hỏi rõ', 'good', 'Rất trưởng thành! Có khi chỉ là hiểu lầm thôi.', ['respect', 'honesty']),
        opt('nho-co', 'Nhờ cô giáo giúp nói chuyện', 'ok', 'Nhờ cô giúp cũng được, nhất là khi con thấy khó nói.', ['respect']),
        opt('noi-xau-lai', 'Nói xấu lại bạn cho bõ tức', 'poor', 'Nói xấu lại chỉ làm hai bạn càng ghét nhau hơn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Hai bạn trong nhóm cãi nhau to vì mỗi bạn muốn làm theo một ý. Con sẽ làm gì?',
      explanation: 'Giúp các bạn lắng nghe nhau là cách hoà giải bất hoà.',
      options: [
        opt('lang-nghe-ket-hop', 'Mời từng bạn nói ý mình rồi cùng chọn hoặc kết hợp', 'good', 'Con là người hoà giải giỏi! Nhóm lại đoàn kết.', ['respect', 'kindness']),
        opt('chon-mot-y', 'Bảo cả nhóm biểu quyết chọn một ý', 'ok', 'Biểu quyết cũng công bằng, nhưng nghe kỹ cả hai ý trước thì tốt hơn.', ['respect']),
        opt('dung-ve-mot-phe', 'Đứng về phía bạn thân của con', 'poor', 'Bênh bạn thân thì bạn kia thấy bị đối xử không công bằng.'),
      ],
    },
  ],

  'ethics.g3.quan-tam-hang-xom': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bác hàng xóm đang loay hoay mở cửa vì tay xách nhiều đồ. Con sẽ làm gì?',
      explanation: 'Giúp hàng xóm những việc nhỏ làm tình làng nghĩa xóm thêm gắn bó.',
      options: [
        opt('cam-do', 'Chạy lại cầm giúp bác vài túi', 'good', 'Bác sẽ rất cảm động. Hàng xóm tốt là như thế!', ['kindness']),
        opt('chao-bac', 'Chào bác và hỏi bác có cần giúp không', 'ok', 'Hỏi là lịch sự rồi. Bác đang vất vả, giúp ngay thì tốt hơn.', ['respect']),
        opt('di-qua', 'Đi qua như không thấy', 'poor', 'Chỉ một chút giúp đỡ thôi cũng làm bác đỡ vất vả nhiều.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Buổi trưa, cả xóm đang nghỉ. Con muốn đá bóng ngoài ngõ. Con sẽ làm gì?',
      explanation: 'Không làm ồn giờ nghỉ là tôn trọng hàng xóm.',
      options: [
        opt('doi-chieu', 'Đợi chiều mát rồi mới ra đá bóng', 'good', 'Rất biết nghĩ cho người khác! Cả xóm được nghỉ ngơi yên tĩnh.', ['respect', 'citizenship']),
        opt('choi-nhe', 'Chơi trò khác nhẹ nhàng, không gây tiếng động', 'ok', 'Chơi nhẹ nhàng là có ý thức. Giữ yên lặng đến chiều thì càng tốt.', ['respect']),
        opt('da-luon', 'Ra đá luôn, ngõ là chỗ chung mà', 'poor', 'Ngõ là chỗ chung, nên càng phải nghĩ tới mọi người đang nghỉ trưa.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhà hàng xóm đi vắng mấy ngày, con thấy có người lạ lảng vảng trước cửa nhà họ. Con sẽ làm gì?',
      explanation: 'Quan tâm hàng xóm còn là để ý giúp nhau giữ an toàn.',
      options: [
        opt('bao-bo-me', 'Không lại gần mà báo ngay cho bố mẹ', 'good', 'Rất tinh ý và an toàn! Bố mẹ sẽ biết cách xử lý.', ['responsibility', 'citizenship']),
        opt('nhin-tiep', 'Tiếp tục để ý xem người đó làm gì', 'ok', 'Để ý là tốt, nhưng phải báo người lớn thì mới giúp được hàng xóm.', ['responsibility']),
        opt('ra-hoi', 'Chạy ra hỏi người lạ đang làm gì', 'poor', 'Rất nguy hiểm cho con. Hãy báo người lớn thay vì tự ra hỏi.'),
      ],
    },
  ],

  'ethics.g3.ham-hoc-hoi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy một loài chim lạ đậu trên cành cây. Con sẽ làm gì?',
      explanation: 'Tò mò và tự tìm hiểu là biểu hiện của ham học hỏi.',
      options: [
        opt('tim-hieu', 'Quan sát kỹ rồi hỏi bố mẹ hoặc tìm sách về các loài chim', 'good', 'Tuyệt vời! Con sẽ biết thêm bao điều thú vị.', ['perseverance']),
        opt('ngam', 'Ngắm một lúc rồi đi chơi tiếp', 'ok', 'Ngắm là biết để ý rồi. Tìm hiểu thêm thì con sẽ biết tên nó đấy.', ['perseverance']),
        opt('nem-da', 'Ném đá cho chim bay đi', 'poor', 'Ném đá làm chim sợ và có thể bị thương. Quan sát nhẹ nhàng thôi nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Thư viện trường có sách mới. Giờ ra chơi con sẽ làm gì?',
      explanation: 'Đọc sách là cách học hỏi thêm nhiều điều mới.',
      options: [
        opt('muon-doc', 'Vào thư viện xem và mượn một cuốn đọc thử', 'good', 'Con thật ham đọc! Mỗi cuốn sách là một chuyến phiêu lưu.', ['perseverance']),
        opt('ru-ban', 'Rủ bạn cùng vào xem sách mới', 'ok', 'Rủ bạn cùng đọc là hay lắm, nhớ chọn được một cuốn nhé.', ['perseverance', 'kindness']),
        opt('khong-quan-tam', 'Đọc sách chán lắm, đi chơi thôi', 'poor', 'Thử một cuốn hợp với sở thích của con xem, biết đâu con lại mê.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con làm bài được điểm cao nhưng vẫn có một câu con làm đúng mà không hiểu vì sao. Con sẽ làm gì?',
      explanation: 'Ham học hỏi là muốn hiểu thật, không chỉ cần điểm cao.',
      options: [
        opt('hoi-cho-hieu', 'Hỏi cô để hiểu vì sao đáp án đúng', 'good', 'Rất đáng khen! Hiểu thật thì lần sau con làm được mọi bài giống thế.', ['perseverance', 'honesty']),
        opt('tu-xem-lai', 'Tự đọc lại bài trong sách để hiểu', 'ok', 'Tự tìm hiểu là tốt. Nếu vẫn chưa rõ thì hỏi cô nhé.', ['perseverance']),
        opt('ke-diem-cao', 'Điểm cao rồi, không cần hiểu nữa', 'poor', 'Làm đúng nhờ may mắn thì lần sau chưa chắc đúng. Hiểu bài mới là quan trọng.'),
      ],
    },
  ],

  // =========================================================================
  // LỚP 4
  // =========================================================================

  'ethics.g4.trung-thuc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Cô bán hàng trả lại tiền thừa nhiều hơn số tiền đúng. Con sẽ làm gì?',
      explanation: 'Trung thực là không nhận những gì không phải của mình.',
      options: [
        opt('tra-lai', 'Báo cô và trả lại số tiền thừa', 'good', 'Rất trung thực! Cô bán hàng sẽ rất cảm ơn con.', ['honesty']),
        opt('hoi-bo-me', 'Về hỏi bố mẹ nên làm gì', 'ok', 'Hỏi bố mẹ là tốt, nhưng quay lại trả ngay thì cô đỡ lo hơn.', ['honesty']),
        opt('giu-lai', 'Giữ lại, cô nhầm thì cô chịu', 'poor', 'Cô có thể bị trừ lương vì thiếu tiền. Trả lại là việc đúng.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Trong giờ kiểm tra, bạn bên cạnh để lộ bài làm. Con chưa biết làm một câu. Con sẽ làm gì?',
      explanation: 'Làm bài bằng sức mình là trung thực với thầy cô và với chính mình.',
      options: [
        opt('tu-lam', 'Không nhìn bài bạn, cố tự làm hết sức', 'good', 'Rất trung thực! Điểm số thật sẽ giúp con biết mình cần học thêm gì.', ['honesty', 'perseverance']),
        opt('bo-trong', 'Bỏ trống câu đó, làm câu khác', 'ok', 'Không chép là đúng. Nhưng cố suy nghĩ thêm, biết đâu con làm được.', ['honesty']),
        opt('nhin-bai', 'Nhìn nhanh bài bạn một chút', 'poor', 'Điểm chép không phải điểm của con, và con vẫn chưa hiểu bài.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con làm vỡ bình hoa, em con bị mẹ nghi oan. Con sẽ làm gì?',
      explanation: 'Người trung thực không để người khác chịu lỗi thay mình.',
      options: [
        opt('nhan-loi', 'Nói ngay với mẹ là con làm vỡ, không phải em', 'good', 'Rất dũng cảm! Con đã bảo vệ em và giữ được lòng tin của mẹ.', ['honesty', 'kindness']),
        opt('an-ui-em', 'Không nói, nhưng xin mẹ tha cho em', 'ok', 'Con thương em, nhưng em vẫn bị oan. Nói thật mới công bằng.', ['kindness']),
        opt('im-lang', 'Im lặng để em chịu', 'poor', 'Em bị oan sẽ rất buồn và tủi thân. Nhận lỗi đi con.'),
      ],
    },
  ],

  'ethics.g4.biet-on-nguoi-lao-dong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bác lao công vừa quét sạch sân trường. Con đi qua và thấy bác. Con sẽ làm gì?',
      explanation: 'Chào hỏi và giữ gìn thành quả là cách biết ơn người lao động.',
      options: [
        opt('chao-cam-on', 'Chào bác, cảm ơn bác và không xả rác ra sân', 'good', 'Bác sẽ rất vui, và sân trường luôn sạch.', ['respect', 'citizenship']),
        opt('chao', 'Chào bác một câu', 'ok', 'Chào là lễ phép rồi. Giữ sân sạch nữa thì bác đỡ vất vả.', ['respect']),
        opt('vut-rac', 'Vứt vỏ bánh ra sân, đằng nào bác cũng quét', 'poor', 'Bác vừa quét xong mà. Vứt rác là coi thường công sức của bác.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bữa cơm ở trường có món con không thích. Con sẽ làm gì?',
      explanation: 'Trân trọng bữa ăn là biết ơn người nông dân và các cô nhà bếp.',
      options: [
        opt('an-thu', 'Ăn thử một ít, lấy vừa đủ, không bỏ phí', 'good', 'Rất biết trân trọng! Hạt cơm có công sức của biết bao người.', ['respect', 'responsibility']),
        opt('an-mon-khac', 'Ăn các món khác và để lại món đó', 'ok', 'Không chê bai là tốt. Lấy ít từ đầu thì đỡ phải bỏ phí.', ['respect']),
        opt('do-bo', 'Đổ bỏ cả khay vì không ngon', 'poor', 'Thức ăn cần rất nhiều công sức mới có. Đổ bỏ là phí công mọi người.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Bạn con chê nghề bán rau của mẹ bạn khác là "nghề thấp kém". Con sẽ làm gì?',
      explanation: 'Mọi nghề lương thiện đều đáng quý và đáng được tôn trọng.',
      options: [
        opt('giai-thich', 'Nói với bạn: nghề nào cũng đáng quý, nhờ cô bán rau mà nhà mình có rau ăn', 'good', 'Con nói rất đúng và rất nhân hậu!', ['respect', 'kindness']),
        opt('khong-dong-y', 'Nói "tớ không nghĩ vậy" rồi thôi', 'ok', 'Không đồng tình là tốt. Giải thích vì sao thì bạn sẽ hiểu hơn.', ['respect']),
        opt('cuoi-theo', 'Cười theo bạn', 'poor', 'Nếu bạn kia nghe thấy, bạn ấy sẽ rất buồn. Nghề nào cũng đáng tôn trọng.'),
      ],
    },
  ],

  'ethics.g4.ton-trong-tai-san': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy chiếc bút rất đẹp trên bàn bạn, bạn đang ra ngoài. Con muốn dùng thử. Con sẽ làm gì?',
      explanation: 'Muốn dùng đồ của người khác thì phải hỏi trước.',
      options: [
        opt('doi-hoi', 'Đợi bạn về và hỏi mượn', 'good', 'Rất lịch sự! Bạn sẽ vui lòng cho con mượn.', ['respect', 'honesty']),
        opt('ngam-thoi', 'Chỉ ngắm, không động vào', 'ok', 'Không tự ý lấy là đúng. Muốn dùng thì hỏi bạn nhé.', ['respect']),
        opt('lay-dung', 'Lấy dùng thử rồi để lại chỗ cũ', 'poor', 'Dù để lại, tự ý dùng đồ của bạn vẫn là không tôn trọng bạn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con mượn truyện của bạn và lỡ làm rách một trang. Con sẽ làm gì?',
      explanation: 'Đồ mượn phải giữ gìn, làm hỏng thì nhận lỗi và sửa chữa.',
      options: [
        opt('dan-lai-xin-loi', 'Dán lại cẩn thận và xin lỗi bạn khi trả', 'good', 'Rất có trách nhiệm! Bạn sẽ yên tâm cho con mượn lần sau.', ['honesty', 'responsibility']),
        opt('xin-loi', 'Xin lỗi bạn khi trả truyện', 'ok', 'Xin lỗi là tốt, dán lại trang rách nữa thì trọn vẹn.', ['honesty']),
        opt('tra-im', 'Trả lại mà không nói gì', 'poor', 'Bạn sẽ buồn khi tự phát hiện ra. Nói thật và sửa lại nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con nhặt được một chiếc ví trên đường đi học. Con sẽ làm gì?',
      explanation: 'Của rơi phải tìm cách trả lại người mất.',
      options: [
        opt('nop-co', 'Mang đến nộp cô giáo hoặc công an phường', 'good', 'Rất đáng khen! Người mất ví sẽ rất biết ơn con.', ['honesty', 'citizenship']),
        opt('dua-bo-me', 'Mang về đưa bố mẹ xử lý', 'ok', 'Đưa người lớn là đúng. Nhớ nhắc bố mẹ tìm người mất nhé.', ['honesty']),
        opt('lay-tien', 'Lấy tiền bên trong rồi vứt ví đi', 'poor', 'Người mất có thể đang rất lo lắng. Lấy của rơi là không trung thực.'),
      ],
    },
  ],

  'ethics.g4.quyen-bon-phan-tre-em': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con có quyền được vui chơi. Nhưng bài tập về nhà chưa làm xong. Con sẽ làm gì?',
      explanation: 'Trẻ em có quyền vui chơi và cũng có bổn phận học tập.',
      options: [
        opt('lam-bai-truoc', 'Làm xong bài tập rồi đi chơi', 'good', 'Rất cân bằng! Con vừa làm tròn bổn phận vừa được vui chơi.', ['responsibility']),
        opt('choi-ngan', 'Chơi một lát rồi về làm bài', 'ok', 'Được, miễn là con giữ đúng giờ về làm bài nhé.', ['responsibility']),
        opt('choi-het-buoi', 'Chơi cả buổi, vui chơi là quyền của con mà', 'poor', 'Quyền đi cùng với bổn phận. Học tập cũng là việc của con.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Một người lạ nhắn tin hỏi địa chỉ nhà và số điện thoại của bố mẹ con. Con sẽ làm gì?',
      explanation: 'Trẻ em có quyền được bảo vệ, và biết tự bảo vệ mình là rất quan trọng.',
      options: [
        opt('khong-tra-loi-bao', 'Không trả lời và báo ngay cho bố mẹ', 'good', 'Rất đúng! Con đã tự bảo vệ mình và gia đình.', ['responsibility']),
        opt('chan-luon', 'Không trả lời, chặn người đó', 'ok', 'Không trả lời là đúng. Kể với bố mẹ nữa thì an toàn hơn.', ['responsibility']),
        opt('tra-loi', 'Trả lời vì người đó có vẻ thân thiện', 'poor', 'Người lạ có thể lợi dụng thông tin. Không bao giờ cho người lạ địa chỉ nhà nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Lớp họp bàn chọn nơi đi dã ngoại. Con có ý kiến khác nhưng ngại nói. Con sẽ làm gì?',
      explanation: 'Trẻ em có quyền bày tỏ ý kiến, và nên bày tỏ một cách lịch sự.',
      options: [
        opt('gio-tay-noi', 'Giơ tay nói ý kiến của mình và lý do', 'good', 'Rất tự tin! Ý kiến của con cũng đáng được lắng nghe.', ['responsibility', 'respect']),
        opt('noi-voi-lop-truong', 'Nói riêng với lớp trưởng sau giờ họp', 'ok', 'Nói ra là tốt. Nói ngay trong buổi họp thì cả lớp cùng được nghe.', ['honesty']),
        opt('im-roi-phan-nan', 'Im lặng rồi về phàn nàn là lớp chọn chán', 'poor', 'Không nói ra thì không ai biết ý con. Hãy dùng quyền bày tỏ ý kiến nhé.'),
      ],
    },
  ],

  'ethics.g4.bao-ve-cua-cong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy vòi nước ở trường bị ai đó mở mà không khoá. Con sẽ làm gì?',
      explanation: 'Tiết kiệm điện nước ở nơi công cộng là bảo vệ của công.',
      options: [
        opt('khoa-vo', 'Khoá vòi lại', 'good', 'Việc nhỏ mà ý nghĩa! Con vừa giúp tiết kiệm nước cho trường.', ['citizenship', 'responsibility']),
        opt('bao-bac', 'Báo bác bảo vệ ra khoá', 'ok', 'Báo người lớn là tốt, nhưng tự khoá ngay thì nước đỡ chảy phí.', ['citizenship']),
        opt('ke-no', 'Kệ, không phải nhà mình', 'poor', 'Của công là của chung mọi người, cả con nữa. Khoá lại chỉ mất một giây.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn con dùng bút vẽ bậy lên bàn học của lớp. Con sẽ làm gì?',
      explanation: 'Bàn ghế của trường là của công, cần được giữ gìn.',
      options: [
        opt('nhac-va-lau', 'Nhắc bạn đừng vẽ và cùng bạn lau sạch', 'good', 'Rất tốt! Con vừa giữ gìn bàn ghế vừa giúp bạn sửa sai.', ['citizenship', 'kindness']),
        opt('nhac-ban', 'Nhắc bạn đừng vẽ nữa', 'ok', 'Nhắc bạn là đúng. Rủ bạn lau sạch thì bàn lại như mới.', ['citizenship']),
        opt('ve-cung', 'Vẽ thêm cho vui', 'poor', 'Bàn học là của chung, các lớp sau còn dùng. Đừng làm hỏng nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Chiếc ghế đá trong công viên bị lỏng chân, có thể làm người ngồi bị ngã. Con sẽ làm gì?',
      explanation: 'Bảo vệ của công còn là báo cho người có trách nhiệm sửa chữa kịp thời.',
      options: [
        opt('bao-quan-ly', 'Nhờ bố mẹ báo cho ban quản lý công viên', 'good', 'Rất có trách nhiệm! Ghế được sửa, không ai bị ngã.', ['citizenship', 'responsibility']),
        opt('canh-bao-nguoi-ngoi', 'Nhắc những người định ngồi rằng ghế bị lỏng', 'ok', 'Nhắc mọi người là tốt, nhưng báo để sửa thì mới hết nguy hiểm.', ['kindness']),
        opt('lac-cho-vui', 'Lắc thử cho lỏng hẳn', 'poor', 'Làm vậy ghế sẽ hỏng và ai đó có thể bị ngã đau.'),
      ],
    },
  ],

  // =========================================================================
  // LỚP 5
  // =========================================================================

  'ethics.g5.bao-ve-moi-truong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con ra khỏi phòng nhưng đèn và quạt vẫn đang bật. Con sẽ làm gì?',
      explanation: 'Tắt điện khi không dùng là tiết kiệm năng lượng, bảo vệ môi trường.',
      options: [
        opt('tat-het', 'Tắt đèn và quạt trước khi ra', 'good', 'Tuyệt! Tiết kiệm điện là bảo vệ Trái Đất.', ['citizenship', 'responsibility']),
        opt('tat-den', 'Tắt đèn, để quạt cho mát phòng', 'ok', 'Tắt đèn là tốt rồi. Không có ai trong phòng thì quạt cũng không cần bật.', ['citizenship']),
        opt('de-nguyen', 'Để nguyên, lát nữa quay lại', 'poor', 'Điện vẫn tốn trong lúc con đi. Tắt đi rồi bật lại cũng dễ mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Đi chợ cùng mẹ, cô bán hàng định cho mỗi món một túi ni-lông. Con sẽ làm gì?',
      explanation: 'Hạn chế túi ni-lông giúp giảm rác thải nhựa khó phân huỷ.',
      options: [
        opt('dung-tui-vai', 'Nhắc mẹ dùng túi vải mang theo, cảm ơn cô không lấy túi', 'good', 'Rất có ý thức! Bớt một túi ni-lông là bớt rác cho Trái Đất.', ['citizenship']),
        opt('gop-mot-tui', 'Xin cô gộp chung vào một túi', 'ok', 'Bớt túi là tốt. Mang túi vải thì còn tốt hơn nữa.', ['citizenship']),
        opt('lay-nhieu-tui', 'Lấy thêm vài túi để dành', 'poor', 'Túi ni-lông phải hàng trăm năm mới phân huỷ. Dùng ít thôi nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Trường tổ chức thu gom giấy vụn. Nhà con có nhiều sách báo cũ. Con sẽ làm gì?',
      explanation: 'Tái chế giúp tiết kiệm tài nguyên và giảm rác thải.',
      options: [
        opt('phan-loai-gop', 'Phân loại sách còn dùng được để tặng, giấy vụn thì nộp tái chế', 'good', 'Rất chu đáo! Sách có người đọc, giấy được tái chế.', ['citizenship', 'kindness']),
        opt('nop-het', 'Mang tất cả đi nộp giấy vụn', 'ok', 'Nộp tái chế là tốt. Sách còn tốt thì tặng bạn khác có khi hữu ích hơn.', ['citizenship']),
        opt('dot-di', 'Đốt đi cho gọn nhà', 'poor', 'Đốt giấy làm ô nhiễm không khí và phí tài nguyên. Hãy tái chế nhé.'),
      ],
    },
  ],

  'ethics.g5.vuot-qua-kho-khan': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con tập đi xe đạp và bị ngã mấy lần. Con sẽ làm gì?',
      explanation: 'Kiên trì tập luyện sau thất bại là cách vượt qua khó khăn.',
      options: [
        opt('tap-tiep', 'Đứng dậy, nhờ bố giữ xe và tập tiếp', 'good', 'Kiên trì quá! Rồi con sẽ đi xe thật vững.', ['perseverance']),
        opt('nghi-roi-tap', 'Nghỉ hôm nay, mai tập lại', 'ok', 'Nghỉ lấy sức cũng được, miễn là mai con tập tiếp nhé.', ['perseverance']),
        opt('bo-luon', 'Không tập nữa, đi xe khó quá', 'poor', 'Ai cũng từng ngã khi tập xe. Bỏ cuộc thì con không bao giờ biết đi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con bị điểm kém môn Toán. Con sẽ làm gì?',
      explanation: 'Thất bại là cơ hội để biết mình cần cố gắng ở đâu.',
      options: [
        opt('xem-lai-loi', 'Xem lại bài sai, hỏi cô và ôn thêm', 'good', 'Rất đáng khen! Lần sau con sẽ làm tốt hơn.', ['perseverance', 'responsibility']),
        opt('buon-roi-co-gang', 'Buồn một lúc rồi tự hứa sẽ học chăm hơn', 'ok', 'Có quyết tâm là tốt. Xem lại chỗ sai thì cố gắng mới đúng hướng.', ['perseverance']),
        opt('giau-diem', 'Giấu bài kiểm tra, không cho bố mẹ biết', 'poor', 'Giấu đi thì không ai giúp được con. Cùng bố mẹ tìm cách học tốt hơn nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhà bạn con gặp khó khăn, bạn định nghỉ học để phụ giúp gia đình. Con sẽ làm gì?',
      explanation: 'Cùng nhau vượt khó: động viên bạn và tìm sự giúp đỡ từ người lớn.',
      options: [
        opt('dong-vien-bao-co', 'Động viên bạn đi học và báo cô để cô tìm cách giúp', 'good', 'Con là người bạn tuyệt vời! Nhà trường có thể giúp bạn tiếp tục đi học.', ['kindness', 'responsibility']),
        opt('cho-muon-vo', 'Cho bạn mượn vở chép bài những hôm bạn nghỉ', 'ok', 'Rất tốt bụng. Nhưng báo cô thì bạn có thể không phải nghỉ học nữa.', ['kindness']),
        opt('ke-ban', 'Kệ, chuyện nhà bạn không liên quan đến mình', 'poor', 'Bạn đang rất cần sự giúp đỡ. Một lời động viên có thể thay đổi nhiều điều.'),
      ],
    },
  ],

  'ethics.g5.an-toan-tren-mang': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con được một trang web thông báo "Bạn đã trúng thưởng điện thoại, hãy nhập mật khẩu để nhận". Con sẽ làm gì?',
      explanation: 'Thông báo trúng thưởng đòi thông tin cá nhân thường là lừa đảo.',
      options: [
        opt('dong-bao', 'Đóng trang đó lại và kể với bố mẹ', 'good', 'Rất tỉnh táo! Con đã tránh được một trò lừa đảo.', ['responsibility']),
        opt('dong-lai', 'Đóng trang đó lại', 'ok', 'Đóng lại là đúng. Kể với bố mẹ nữa để cả nhà cùng cảnh giác.', ['responsibility']),
        opt('nhap-mat-khau', 'Nhập mật khẩu để nhận quà', 'poor', 'Đó là lừa đảo! Kẻ xấu sẽ lấy mất tài khoản của con.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Trong nhóm chat của lớp, có bạn đăng ảnh chế giễu một bạn khác. Con sẽ làm gì?',
      explanation: 'Ứng xử văn minh trên mạng là không tham gia chế giễu người khác.',
      options: [
        opt('nhac-va-bao', 'Nhắn nhắc bạn gỡ ảnh và báo cô giáo', 'good', 'Rất đáng khen! Con đã bảo vệ bạn bị chế giễu.', ['kindness', 'respect']),
        opt('khong-tham-gia', 'Không bình luận, không chia sẻ ảnh đó', 'ok', 'Không hùa theo là tốt. Lên tiếng thì bạn kia sẽ đỡ bị tổn thương hơn.', ['respect']),
        opt('tha-tim', 'Thả biểu tượng cười vào ảnh', 'poor', 'Một biểu tượng cười cũng làm bạn bị chế giễu thêm đau lòng.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Một người quen qua trò chơi trực tuyến rủ con gặp mặt ngoài đời. Con sẽ làm gì?',
      explanation: 'Người quen trên mạng có thể không phải là người như họ nói.',
      options: [
        opt('tu-choi-bao', 'Từ chối và kể với bố mẹ', 'good', 'Rất an toàn! Bố mẹ sẽ giúp con xem người đó có đáng tin không.', ['responsibility']),
        opt('hoi-them', 'Hỏi thêm người đó là ai, bao nhiêu tuổi', 'ok', 'Cẩn thận là tốt, nhưng người lạ có thể nói dối. Hãy kể với bố mẹ.', ['responsibility']),
        opt('di-gap', 'Đi gặp một mình vì đã chơi cùng lâu rồi', 'poor', 'Rất nguy hiểm! Không bao giờ đi gặp người quen trên mạng một mình.'),
      ],
    },
  ],

  'ethics.g5.ton-trong-khac-biet': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Lớp con có một bạn mới là người dân tộc thiểu số, nói tiếng Việt chưa sõi. Con sẽ làm gì?',
      explanation: 'Tôn trọng và giúp đỡ bạn khác mình về dân tộc, ngôn ngữ.',
      options: [
        opt('lam-quen', 'Làm quen, giúp bạn và hỏi bạn dạy vài câu tiếng dân tộc', 'good', 'Tuyệt! Hai bạn cùng học được từ nhau.', ['respect', 'kindness']),
        opt('chao-ban', 'Chào bạn thân thiện', 'ok', 'Một lời chào thân thiện là khởi đầu tốt. Giúp bạn thêm nữa nhé.', ['respect']),
        opt('bat-chuoc', 'Bắt chước giọng nói của bạn cho vui', 'poor', 'Bắt chước để trêu làm bạn tủi thân. Hãy tôn trọng sự khác biệt.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Một bạn trong lớp đi lại khó khăn vì bị tật ở chân. Giờ ra chơi các bạn đá bóng. Con sẽ làm gì?',
      explanation: 'Tôn trọng người khuyết tật là cho họ cơ hội tham gia như mọi người.',
      options: [
        opt('ru-choi-tro-khac', 'Rủ bạn cùng chơi một trò phù hợp, như cờ hoặc ném vòng', 'good', 'Rất chu đáo! Bạn được vui chơi cùng mọi người.', ['kindness', 'respect']),
        opt('hoi-y-ban', 'Hỏi bạn thích chơi gì', 'ok', 'Hỏi ý bạn là tôn trọng. Cùng chơi với bạn nữa thì càng vui.', ['respect']),
        opt('bo-mac', 'Để bạn ngồi một mình, dù sao bạn cũng không chạy được', 'poor', 'Bạn cũng muốn vui chơi như mọi người. Cùng tìm trò hợp với bạn nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Nhà bạn con nghèo, bạn thường mặc áo cũ. Vài bạn trong lớp hay xa lánh bạn ấy. Con sẽ làm gì?',
      explanation: 'Không phân biệt đối xử vì hoàn cảnh gia đình.',
      options: [
        opt('choi-cung-noi', 'Chơi thân với bạn và nói với các bạn khác đừng xa lánh', 'good', 'Con thật tốt! Giá trị của một người không nằm ở quần áo.', ['kindness', 'respect']),
        opt('choi-rieng', 'Vẫn chơi với bạn nhưng không nói gì với các bạn kia', 'ok', 'Chơi với bạn là tốt. Lên tiếng thì các bạn khác cũng thay đổi.', ['kindness']),
        opt('xa-lanh-theo', 'Xa lánh theo các bạn cho khỏi bị trêu', 'poor', 'Bạn ấy sẽ rất cô đơn. Hoàn cảnh nghèo không phải lỗi của bạn.'),
      ],
    },
  ],

  'ethics.g5.biet-on-nguoi-co-cong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Lớp con được đi viếng nghĩa trang liệt sĩ. Con sẽ cư xử thế nào?',
      explanation: 'Giữ trật tự, trang nghiêm ở nghĩa trang liệt sĩ là tỏ lòng biết ơn.',
      options: [
        opt('trang-nghiem', 'Đi nhẹ nói khẽ, thắp hương và tưởng nhớ', 'good', 'Rất đúng mực! Các chú, các bác sẽ được yên nghỉ.', ['respect', 'citizenship']),
        opt('im-lang', 'Im lặng đi theo đoàn', 'ok', 'Giữ trật tự là tốt. Dành một phút tưởng nhớ nữa thì thật ý nghĩa.', ['respect']),
        opt('dua-nghich', 'Đùa nghịch, chạy nhảy giữa các ngôi mộ', 'poor', 'Nơi đây an nghỉ những người đã hi sinh vì đất nước. Hãy trang nghiêm nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Ông con là cựu chiến binh. Con muốn hiểu thêm về ông. Con sẽ làm gì?',
      explanation: 'Lắng nghe và ghi nhớ câu chuyện của người có công là cách biết ơn.',
      options: [
        opt('nghe-ke', 'Ngồi nghe ông kể chuyện ngày xưa và hỏi thêm', 'good', 'Ông sẽ rất vui, và con hiểu thêm về lịch sử.', ['respect', 'kindness']),
        opt('xem-anh', 'Xem những tấm ảnh và huân chương của ông', 'ok', 'Xem kỷ vật là tốt. Nghe ông kể thì con hiểu sâu hơn nhiều.', ['respect']),
        opt('khong-quan-tam', 'Chuyện ngày xưa chán, không cần nghe', 'poor', 'Nhờ những người như ông mà có cuộc sống hôm nay. Nghe ông kể nhé.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Ngày 27 tháng 7, lớp tổ chức hoạt động tri ân. Con được giao nhiệm vụ. Con sẽ làm gì?',
      explanation: 'Tri ân người có công bằng việc làm cụ thể và tấm lòng thành.',
      options: [
        opt('chuan-bi-ky', 'Chuẩn bị chu đáo phần việc được giao và tìm hiểu ý nghĩa ngày 27/7', 'good', 'Rất ý nghĩa! Con hiểu và làm bằng cả tấm lòng.', ['respect', 'responsibility']),
        opt('lam-cho-xong', 'Làm phần việc được giao cho xong', 'ok', 'Hoàn thành là tốt. Hiểu ý nghĩa ngày này thì việc làm càng trọn vẹn.', ['responsibility']),
        opt('tron-viec', 'Nhờ bạn làm hộ vì bận chơi', 'poor', 'Đây là dịp để tỏ lòng biết ơn. Tự tay làm thì mới có ý nghĩa.'),
      ],
    },
  ],
}

export default bank
