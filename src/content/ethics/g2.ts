/**
 * Ngân hàng tình huống Đạo đức lớp 2.
 *
 * Bám SGK Đạo đức 2 - Kết nối tri thức với cuộc sống (8 chủ đề, 15 bài). Tình
 * huống là tình huống tự soạn theo đúng chủ đề của từng bài. Xem docs/sgk-lop-2.md.
 *
 * KHÔNG chấm đúng/sai: mỗi lựa chọn có mức phẩm chất (tốt / tạm được / chưa tốt)
 * kèm lời giải thích riêng, vì dạy đạo đức cho trẻ 7 tuổi bằng cách gạch chéo
 * "sai rồi" là phản sư phạm.
 */

import { opt, type Bank } from '../bank'

const bank: Bank = {
  // === Chủ đề 1: Quê hương em ==============================================
  'ethics.g2.ve-dep-que-huong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Cô giáo hỏi cả lớp: "Quê em có gì đẹp?" Con chưa nghĩ ra điều gì thật đặc biệt. Con sẽ làm gì?',
      explanation: 'Quê hương nào cũng có nét đẹp riêng, chỉ cần con để ý là thấy.',
      options: [
        opt('ke-mot-thu', 'Kể một thứ quen thuộc: cây đa đầu làng, con đường tới trường', 'good', 'Rất hay! Vẻ đẹp quê hương nằm ngay trong những thứ quen thuộc nhất.', ['citizenship']),
        opt('hoi-ba-me', 'Nói với cô là con sẽ hỏi bố mẹ rồi kể sau', 'ok', 'Hỏi người lớn là một cách tốt. Nhưng con cũng tự nhìn quanh mình xem sao nhé.', ['respect']),
        opt('noi-khong-co', 'Nói "quê con chẳng có gì đẹp cả"', 'poor', 'Nơi nào cũng có cái đẹp riêng. Thử nghĩ về buổi sáng ở quê con xem, có gì con thấy dễ chịu?'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Một bạn ở lớp chê quê của bạn khác là "quê mùa, chẳng có gì hay". Con nghe thấy. Con sẽ làm gì?',
      explanation: 'Mỗi vùng quê có nét riêng, chê quê người khác là làm bạn buồn.',
      options: [
        opt('noi-giup', 'Nói với bạn rằng quê nào cũng có cái hay riêng', 'good', 'Con vừa bênh vực bạn vừa nói một điều đúng. Rất đáng quý.', ['kindness', 'respect']),
        opt('hoi-ban', 'Quay sang hỏi bạn kia kể về quê mình cho cả nhóm nghe', 'ok', 'Cách này khéo léo và giúp bạn được nói. Nhưng lời chê vẫn chưa được nhắc lại.', ['kindness']),
        opt('cuoi-theo', 'Cười theo cho vui', 'poor', 'Bạn kia sẽ rất buồn. Con thử tưởng tượng có người chê quê con như vậy xem.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Lớp con làm một tờ báo tường giới thiệu quê hương. Con được giao phần "cảnh đẹp". Con sẽ làm gì?',
      explanation: 'Giới thiệu quê hương là cách thể hiện mình hiểu và tự hào về nơi mình sống.',
      options: [
        opt('ve-that', 'Vẽ lại một nơi con đã đến và viết vài câu con thật sự cảm thấy', 'good', 'Bài của con sẽ chân thật và khác hẳn mọi bài chép trên mạng.', ['citizenship', 'responsibility']),
        opt('hoi-ong-ba', 'Hỏi ông bà kể về nơi đẹp nhất ngày xưa rồi viết lại', 'ok', 'Rất thú vị, lại còn học được chuyện xưa. Nhớ thêm cảm nhận của chính con nữa.', ['respect']),
        opt('chep-mang', 'Tìm một bài trên mạng chép lại cho nhanh', 'poor', 'Bài chép không phải của con, và người đọc sẽ không thấy được quê con qua mắt con.'),
      ],
    },
  ],

  'ethics.g2.em-yeu-que-huong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con thấy một túi rác ai đó vứt ở bờ hồ gần nhà. Con sẽ làm gì?',
      explanation: 'Yêu quê hương thể hiện bằng việc giữ gìn nơi mình sống.',
      options: [
        opt('nhat-bo', 'Nhặt bỏ vào thùng rác nếu con làm được', 'good', 'Một việc nhỏ nhưng làm bờ hồ sạch hơn ngay lập tức.', ['citizenship', 'responsibility']),
        opt('bao-nguoi-lon', 'Báo cho người lớn gần đó', 'ok', 'Đúng khi túi rác quá nặng hoặc bẩn. Việc gì con làm được thì cứ làm nhé.', ['responsibility']),
        opt('bo-qua', 'Đi tiếp, việc đó không phải của con', 'poor', 'Bờ hồ là của chung, cũng là của con. Ai cũng nghĩ vậy thì rác sẽ nằm đó mãi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Làng con tổ chức ngày hội. Bố mẹ rủ con đi cùng nhưng con đang muốn xem phim hoạt hình. Con sẽ làm gì?',
      explanation: 'Tham gia hoạt động chung là cách hiểu và gắn bó với quê hương.',
      options: [
        opt('di-hoi', 'Đi cùng bố mẹ, phim để xem sau cũng được', 'good', 'Ngày hội một năm mới có một lần, còn phim thì lúc nào cũng xem được.', ['citizenship']),
        opt('xem-xong-di', 'Xem nốt tập phim rồi đi ngay', 'ok', 'Cũng được, miễn là con thật sự đi chứ không xem mãi.', ['responsibility']),
        opt('o-nha', 'Ở nhà xem phim, hội làng năm nào chẳng có', 'poor', 'Ngày hội là dịp con gặp mọi người và biết thêm về nơi mình sống.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con chuyển tới học ở một nơi mới. Các bạn hỏi con quê ở đâu. Con sẽ trả lời thế nào?',
      explanation: 'Tự hào về quê hương không có nghĩa là quê mình hơn quê người khác.',
      options: [
        opt('ke-vui-ve', 'Kể tên quê và một điều thú vị ở đó', 'good', 'Con vừa giới thiệu được quê mình, vừa mở đầu một câu chuyện với bạn mới.', ['citizenship', 'respect']),
        opt('noi-ten', 'Chỉ nói tên quê rồi thôi', 'ok', 'Không sai cả. Nhưng kể thêm một chút thì các bạn sẽ nhớ con hơn.', []),
        opt('noi-doi', 'Nói tên một nơi khác nghe "oách" hơn', 'poor', 'Quê con không có gì phải giấu. Nói thật thì con cũng không phải nhớ mình đã nói gì.'),
      ],
    },
  ],

  // === Chủ đề 2: Kính trọng thầy cô, yêu quý bạn bè ========================
  'ethics.g2.kinh-trong-thay-co': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con gặp cô giáo cũ ở ngoài đường. Cô đang đi cùng người khác. Con sẽ làm gì?',
      explanation: 'Chào hỏi thầy cô ở bất cứ đâu là thể hiện lòng kính trọng.',
      options: [
        opt('chao-le-phep', 'Đứng lại chào cô lễ phép rồi mới đi tiếp', 'good', 'Cô sẽ rất vui vì con vẫn nhớ cô.', ['respect']),
        opt('chao-nhanh', 'Chào nhanh một câu rồi đi', 'ok', 'Vẫn lịch sự. Nếu dừng lại một chút thì ấm áp hơn.', ['respect']),
        opt('tranh-di', 'Giả vờ không thấy vì ngại', 'poor', 'Cô có thể nghĩ con đã quên cô. Chỉ một câu chào thôi mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Cô giáo đang giảng bài thì con chợt nhớ ra một chuyện rất muốn kể cho bạn bên cạnh. Con sẽ làm gì?',
      explanation: 'Nghe giảng chăm chú cũng là một cách tôn trọng thầy cô.',
      options: [
        opt('de-sau', 'Ghi nhớ và để giờ ra chơi kể', 'good', 'Con vừa tôn trọng cô, vừa không làm phiền bạn.', ['respect', 'responsibility']),
        opt('viet-giay', 'Viết ra giấy để khỏi quên rồi tiếp tục nghe giảng', 'ok', 'Cách này giữ được ý nhưng vẫn làm con phân tâm một chút.', ['responsibility']),
        opt('noi-ngay', 'Ghé tai bạn nói ngay cho đỡ quên', 'poor', 'Cô đang giảng mà lớp nói chuyện thì cô rất khó tiếp tục, và bạn cũng mất bài.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con thấy cô giáo viết nhầm một chữ trên bảng. Con sẽ làm gì?',
      explanation: 'Góp ý lễ phép là tôn trọng, không phải là hỗn.',
      options: [
        opt('gio-tay', 'Giơ tay và thưa cô một cách lễ phép', 'good', 'Cô sẽ cảm ơn con. Góp ý đúng cách luôn được đón nhận.', ['respect', 'honesty']),
        opt('noi-cuoi-gio', 'Đợi hết giờ rồi lên nói riêng với cô', 'ok', 'Tế nhị đấy. Nhưng cả lớp có thể đã chép nhầm mất rồi.', ['respect']),
        opt('cuoi-to', 'Cười to và chỉ cho cả lớp cùng thấy', 'poor', 'Cô sẽ ngượng trước cả lớp. Ai cũng có lúc viết nhầm mà.'),
      ],
    },
  ],

  'ethics.g2.yeu-quy-ban-be': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Giờ ra chơi, một bạn mới chuyển đến đứng một mình ở góc sân. Con sẽ làm gì?',
      explanation: 'Một lời rủ nhỏ có thể làm bạn hết lạc lõng.',
      options: [
        opt('ru-choi', 'Đến rủ bạn chơi cùng nhóm', 'good', 'Bạn sẽ nhớ mãi ngày đầu tiên có người rủ mình chơi.', ['kindness']),
        opt('chao-hoi', 'Đi qua chào và hỏi tên bạn', 'ok', 'Một khởi đầu tốt. Rủ bạn vào chơi nữa thì trọn vẹn.', ['kindness']),
        opt('mac-ke', 'Chơi tiếp với nhóm của mình, bạn ấy tự làm quen', 'poor', 'Đứng một mình giữa sân trường lạ rất khó. Bạn đang cần một người bắt chuyện trước.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Bạn thân của con quên mang hộp bút. Con chỉ có đúng hai cái bút. Con sẽ làm gì?',
      explanation: 'Chia sẻ không phải là cho hết, mà là cùng nhau xoay xở.',
      options: [
        opt('cho-muon', 'Cho bạn mượn một cái', 'good', 'Cả hai cùng viết được. Đó chính là chia sẻ.', ['kindness']),
        opt('bao-co', 'Nói với cô để cô cho bạn mượn bút', 'ok', 'Cũng giải quyết được. Nhưng con giúp bạn ngay thì nhanh hơn.', ['responsibility']),
        opt('khong-cho', 'Giữ cả hai cái vì sợ hỏng mất', 'poor', 'Bạn sẽ không viết được cả buổi. Cái bút thứ hai của con lúc này đang nằm không.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con và bạn thân cãi nhau vì tranh một chỗ ngồi. Cả hai đang giận. Con sẽ làm gì?',
      explanation: 'Bạn bè giận nhau là chuyện thường; điều quan trọng là ai chịu nói trước.',
      options: [
        opt('noi-truoc', 'Bình tĩnh lại rồi chủ động nói chuyện với bạn', 'good', 'Người nói trước không phải là người thua, mà là người dũng cảm.', ['kindness', 'responsibility']),
        opt('nho-ban-khac', 'Nhờ một bạn khác nói giúp', 'ok', 'Có thể được. Nhưng hai người trực tiếp nói với nhau vẫn là tốt nhất.', ['kindness']),
        opt('choi-rieng', 'Nghỉ chơi luôn, tìm bạn khác', 'poor', 'Một chỗ ngồi không đáng để mất một người bạn thân.'),
      ],
    },
  ],

  // === Chủ đề 3: Quý trọng thời gian =======================================
  'ethics.g2.quy-trong-thoi-gian': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con hẹn bạn 8 giờ sáng đi đá bóng. Bây giờ là 7 giờ 50 và con vẫn đang xem tivi. Con sẽ làm gì?',
      explanation: 'Đúng giờ thể hiện con tôn trọng thời gian của người khác.',
      options: [
        opt('di-ngay', 'Tắt tivi đi ngay cho kịp giờ hẹn', 'good', 'Rất đúng! Bạn sẽ không phải đứng đợi con.', ['responsibility', 'respect']),
        opt('nhan-tin', 'Nhắn bạn là mình sẽ tới muộn 5 phút', 'ok', 'Báo trước là lịch sự. Nhưng để bạn đợi vẫn không bằng đi đúng giờ.', ['respect']),
        opt('xem-tiep', 'Xem nốt chương trình rồi đi, bạn đợi tí cũng được', 'poor', 'Bạn đã sắp xếp thời gian để đến đúng hẹn. Để bạn đợi là không công bằng với bạn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con có một bài tập phải nộp vào thứ sáu. Hôm nay là thứ hai. Con sẽ làm gì?',
      explanation: 'Làm sớm giúp con có thời gian sửa lỗi và không cuống vào phút chót.',
      options: [
        opt('chia-nho', 'Chia bài ra làm mỗi ngày một ít', 'good', 'Rất khoa học! Cách này vừa nhẹ nhàng vừa có thời gian kiểm tra lại.', ['responsibility', 'perseverance']),
        opt('lam-thu-nam', 'Để thứ năm làm một lượt cho tập trung', 'ok', 'Vẫn kịp nộp, nhưng nếu thứ năm con bị ốm hoặc bận thì sao?', ['responsibility']),
        opt('sat-gio', 'Sáng thứ sáu dậy sớm làm là xong', 'poor', 'Làm vội thường nhiều lỗi và rất căng thẳng. Con còn cả bốn ngày cơ mà.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con dự định 30 phút làm xong bài, nhưng đã 20 phút trôi qua mà con mới viết được vài dòng vì cứ nghịch bút. Con sẽ làm gì?',
      explanation: 'Nhận ra mình đang lãng phí thời gian và điều chỉnh ngay là một kỹ năng quan trọng.',
      options: [
        opt('cat-but', 'Cất hết đồ gây xao nhãng và tập trung làm tiếp', 'good', 'Con biết tự nhìn lại và sửa ngay - đó là điều rất đáng quý.', ['responsibility', 'perseverance']),
        opt('nghi-roi-lam', 'Nghỉ 5 phút cho thoải mái rồi quay lại làm', 'ok', 'Nghỉ ngắn giúp đầu óc tỉnh táo, miễn là con quay lại đúng hẹn.', ['perseverance']),
        opt('bo-cuoc', 'Thôi để mai làm, hôm nay không tập trung được', 'poor', 'Mai cũng có thể như hôm nay. Thử cất bút đi và làm thêm 10 phút xem sao.'),
      ],
    },
  ],

  // === Chủ đề 4: Nhận lỗi và sửa lỗi =======================================
  'ethics.g2.nhan-loi-sua-loi': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con chạy trong lớp và làm rơi hộp bút của bạn xuống đất. Bạn chưa nhìn thấy. Con sẽ làm gì?',
      explanation: 'Nhận lỗi ngay lúc chưa ai biết mới là điều khó và đáng quý.',
      options: [
        opt('nhat-va-xin-loi', 'Nhặt lên, trả bạn và nói xin lỗi', 'good', 'Con vừa sửa được việc mình làm, vừa thành thật. Bạn sẽ không giận đâu.', ['honesty', 'responsibility']),
        opt('nhat-im', 'Lặng lẽ nhặt lên đặt lại chỗ cũ', 'ok', 'Việc đã được sửa. Nhưng một câu xin lỗi sẽ làm con nhẹ lòng hơn nhiều.', ['responsibility']),
        opt('di-tiep', 'Đi tiếp, coi như không biết', 'poor', 'Hộp bút vẫn nằm dưới đất, và con sẽ thấy áy náy cả buổi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con quên làm bài tập về nhà. Cô giáo hỏi cả lớp ai chưa làm bài. Con sẽ làm gì?',
      explanation: 'Nhận lỗi trước lớp cần dũng cảm, nhưng đó là cách nhanh nhất để được giúp.',
      options: [
        opt('gio-tay', 'Giơ tay nhận là con quên và xin làm bù', 'good', 'Cô sẽ quý sự thành thật của con hơn là một bài tập chép vội.', ['honesty', 'responsibility']),
        opt('noi-rieng', 'Đợi hết giờ rồi lên thưa riêng với cô', 'ok', 'Vẫn là nhận lỗi. Nhưng nói ngay thì cô sắp xếp được cho con làm bù sớm hơn.', ['honesty']),
        opt('muon-chep', 'Mượn vở bạn chép thật nhanh', 'poor', 'Bài đó không phải của con nên con vẫn không hiểu, mà lại thêm một lỗi nữa.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con lỡ nói một câu làm bạn buồn. Hôm sau bạn không nói chuyện với con nữa. Con sẽ làm gì?',
      explanation: 'Sửa lỗi không chỉ là nói xin lỗi, mà còn là làm cho mọi thứ tốt lên.',
      options: [
        opt('xin-loi-that', 'Chủ động xin lỗi và nói rõ con đã sai ở đâu', 'good', 'Lời xin lỗi cụ thể cho bạn thấy con thật sự hiểu mình đã làm bạn buồn vì điều gì.', ['honesty', 'kindness']),
        opt('lam-lanh', 'Rủ bạn chơi như chưa có chuyện gì', 'ok', 'Có thể bạn sẽ nguôi. Nhưng điều bạn cần nghe là con biết mình đã sai.', ['kindness']),
        opt('doi-ban-noi', 'Đợi bạn nói trước, con có lỗi gì đâu', 'poor', 'Chính con đã nói câu đó. Đợi nhau thì hai người có thể giận nhau rất lâu.'),
      ],
    },
  ],
  // === Chủ đề 5: Bảo quản đồ dùng ==========================================
  'ethics.g2.bao-quan-do-dung-ca-nhan': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Học xong, sách vở của con đang bày khắp bàn. Sắp tới giờ ăn cơm. Con sẽ làm gì?',
      explanation: 'Cất gọn đồ dùng giúp đồ bền hơn và lần sau tìm là thấy ngay.',
      options: [
        opt('cat-gon', 'Cất sách vở vào cặp rồi mới đi ăn', 'good', 'Sách không bị dây thức ăn, mai con cũng không quên gì.', ['responsibility']),
        opt('gap-lai', 'Gấp sách lại thành chồng rồi đi ăn, tối cất sau', 'ok', 'Đỡ bừa hơn. Nhưng cất hẳn vào cặp thì chắc chắn hơn.', ['responsibility']),
        opt('de-nguyen', 'Để nguyên đó, ăn xong học tiếp', 'poor', 'Sách vở dễ bị đổ nước hoặc rơi mất. Cất đi chỉ mất một phút thôi.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Chiếc áo đồng phục của con bị bung một cúc. Con sẽ làm gì?',
      explanation: 'Sửa ngay thì áo còn dùng được lâu.',
      options: [
        opt('nho-me-khau', 'Nhờ mẹ khâu lại hoặc tự khâu nếu con làm được', 'good', 'Áo lại lành lặn, con cũng học thêm được một việc.', ['responsibility']),
        opt('de-cuoi-tuan', 'Cất riêng ra và nhớ nhờ mẹ vào cuối tuần', 'ok', 'Có kế hoạch là tốt, miễn là con nhớ thật.', ['responsibility']),
        opt('mac-tiep', 'Cứ mặc tiếp, thiếu một cúc cũng không sao', 'poor', 'Thiếu một cúc rồi sẽ bung tiếp cúc nữa, và chiếc áo hỏng hẳn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con làm rơi chiếc bút mới mẹ vừa mua và nó bị xước. Con rất tiếc. Con sẽ làm gì?',
      explanation: 'Đồ dùng có thể xước nhưng vẫn dùng được; điều quan trọng là giữ cẩn thận hơn.',
      options: [
        opt('dung-tiep', 'Dùng tiếp và cất cẩn thận hơn từ nay', 'good', 'Bút xước vẫn viết tốt. Con rút được kinh nghiệm là điều quý nhất.', ['responsibility']),
        opt('noi-voi-me', 'Nói với mẹ và xin lỗi vì đã không cẩn thận', 'ok', 'Thành thật là tốt. Nhưng đừng buồn quá, bút vẫn dùng được mà.', ['honesty']),
        opt('doi-but-moi', 'Giấu bút cũ đi và xin mẹ mua bút mới', 'poor', 'Bút vẫn dùng được, mà giấu chuyện lại làm con thấy khó chịu mãi.'),
      ],
    },
  ],

  'ethics.g2.bao-quan-do-dung-gia-dinh': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con vừa xem tivi xong và cả nhà không còn ai ở phòng khách. Con sẽ làm gì?',
      explanation: 'Tắt thiết bị khi không dùng vừa giữ đồ bền vừa đỡ tốn điện.',
      options: [
        opt('tat-tivi', 'Tắt tivi và tắt đèn trước khi ra khỏi phòng', 'good', 'Vừa tiết kiệm điện, vừa giúp tivi bền hơn.', ['responsibility', 'citizenship']),
        opt('tat-tivi-thoi', 'Tắt tivi nhưng để đèn cho sáng nhà', 'ok', 'Đỡ hơn nhiều rồi. Không có ai trong phòng thì tắt đèn luôn nhé.', ['responsibility']),
        opt('de-nguyen', 'Để nguyên, lát nữa có người xem tiếp', 'poor', 'Nếu không ai xem thì tivi chạy suốt buổi chiều mà chẳng để làm gì.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con lỡ làm đổ nước ra bàn ăn nhà mình. Con sẽ làm gì?',
      explanation: 'Lau ngay thì bàn không bị hỏng mặt gỗ.',
      options: [
        opt('lau-ngay', 'Lấy khăn lau khô ngay', 'good', 'Nhanh tay một chút là bàn không bị ngấm nước.', ['responsibility']),
        opt('goi-me', 'Gọi mẹ ra lau giúp', 'ok', 'Được, nhất là khi có mảnh vỡ. Việc lau nước thì con tự làm được mà.', []),
        opt('de-kho', 'Để đấy cho tự khô', 'poor', 'Nước ngấm lâu sẽ làm mặt bàn phồng lên và không sửa lại được.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Em con nghịch làm gãy cái điều khiển tivi rồi đem giấu đi. Chỉ mình con biết. Con sẽ làm gì?',
      explanation: 'Che giấu hỏng hóc chỉ làm mọi việc rắc rối hơn.',
      options: [
        opt('khuyen-em', 'Khuyên em nói thật với bố mẹ, con đi cùng cho em đỡ sợ', 'good', 'Con vừa trung thực vừa che chở cho em. Rất đáng khen.', ['honesty', 'kindness']),
        opt('noi-voi-bo', 'Tự nói với bố mẹ chuyện cái điều khiển bị hỏng', 'ok', 'Việc được giải quyết, nhưng em sẽ học được nhiều hơn nếu tự nói.', ['honesty']),
        opt('im-lang', 'Im lặng, không phải việc của con', 'poor', 'Bố mẹ sẽ đi tìm mãi. Và em con sẽ nghĩ giấu là cách giải quyết.'),
      ],
    },
  ],

  // === Chủ đề 6: Thể hiện cảm xúc ==========================================
  'ethics.g2.cam-xuc-cua-em': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Con được điểm cao và rất vui. Con sẽ làm gì?',
      explanation: 'Vui là cảm xúc tốt, nhưng cách thể hiện cũng cần để ý tới người xung quanh.',
      options: [
        opt('khoe-me', 'Về khoe với bố mẹ và cảm ơn cô đã dạy', 'good', 'Niềm vui được chia sẻ đúng chỗ sẽ nhân đôi.', ['kindness']),
        opt('vui-tham', 'Vui trong lòng, không nói gì', 'ok', 'Không sao cả. Nhưng chia sẻ với người thân cũng là một niềm vui nữa.', []),
        opt('che-ban', 'Khoe to trước mặt bạn bị điểm kém', 'poor', 'Niềm vui của con lúc đó lại thành nỗi buồn của bạn.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con buồn vì bị bạn hiểu lầm nhưng không muốn ai biết. Con sẽ làm gì?',
      explanation: 'Gọi tên được cảm xúc của mình là bước đầu để xử lý nó.',
      options: [
        opt('noi-voi-nguoi-than', 'Nói với bố mẹ hoặc người con tin tưởng', 'good', 'Nói ra giúp con nhẹ lòng và có người giúp con gỡ hiểu lầm.', ['honesty']),
        opt('viet-ra', 'Viết cảm xúc ra giấy cho nhẹ lòng', 'ok', 'Cách hay để hiểu mình. Nhưng hiểu lầm thì vẫn cần nói chuyện mới gỡ được.', []),
        opt('giau-kin', 'Giấu kín, cố tỏ ra như không có gì', 'poor', 'Buồn giấu trong lòng sẽ ở lại rất lâu. Con không cần chịu một mình.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con thấy bạn ngồi khóc một mình ở cuối lớp. Con sẽ làm gì?',
      explanation: 'Nhận ra cảm xúc của người khác cũng quan trọng như hiểu cảm xúc của mình.',
      options: [
        opt('hoi-han', 'Lại gần hỏi bạn có sao không và ngồi cạnh bạn', 'good', 'Nhiều khi chỉ cần có người ngồi cạnh là bạn đã đỡ hơn nhiều.', ['kindness']),
        opt('bao-co', 'Báo cho cô giáo biết', 'ok', 'Đúng khi chuyện lớn. Nhưng con hỏi bạn một câu trước thì ấm áp hơn.', ['responsibility']),
        opt('lam-ngo', 'Đi chỗ khác cho bạn khóc một mình', 'poor', 'Bạn có thể đang mong có ai đó để ý tới mình.'),
      ],
    },
  ],

  'ethics.g2.kiem-che-cam-xuc': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Bạn vô tình làm đổ hộp màu của con ra sàn. Con đang rất bực. Con sẽ làm gì?',
      explanation: 'Bực là bình thường; điều quan trọng là không để cơn bực điều khiển mình.',
      options: [
        opt('hit-tho', 'Hít thở sâu vài lần rồi cùng bạn nhặt màu lên', 'good', 'Con vừa bình tĩnh lại vừa giải quyết xong chuyện.', ['kindness', 'responsibility']),
        opt('noi-buc', 'Nói thẳng với bạn là con đang bực', 'ok', 'Nói ra tốt hơn giữ trong lòng. Nói xong nhớ cùng bạn dọn nhé.', ['honesty']),
        opt('quat-ban', 'Quát to và đẩy bạn ra', 'poor', 'Bạn đâu cố ý. Cơn giận qua nhanh nhưng bạn sẽ nhớ rất lâu.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Con thua một trò chơi và thấy tức muốn bỏ cuộc. Con sẽ làm gì?',
      explanation: 'Ai cũng có lúc thua; biết bình tĩnh lại mới chơi tiếp được.',
      options: [
        opt('nghi-mot-chut', 'Nghỉ một chút cho hết tức rồi chơi tiếp', 'good', 'Nghỉ để bình tĩnh là cách xử lý rất tốt.', ['perseverance']),
        opt('chuc-mung', 'Chúc mừng bạn thắng dù trong lòng vẫn tiếc', 'ok', 'Con rất lịch sự. Nhưng cũng đừng ép mình phải vui ngay.', ['respect']),
        opt('hat-do', 'Hất bàn cờ và bỏ đi', 'poor', 'Trò chơi hỏng, bạn cũng buồn, mà cơn tức của con vẫn còn đó.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Con bị mắng oan và rất muốn cãi lại thật to. Con sẽ làm gì?',
      explanation: 'Nói khi đang giận thường làm mọi chuyện tệ hơn.',
      options: [
        opt('doi-binh-tinh', 'Đợi bình tĩnh rồi xin phép nói lại cho rõ', 'good', 'Lúc bình tĩnh, lời của con sẽ được nghe nghiêm túc hơn nhiều.', ['honesty', 'respect']),
        opt('noi-ngay-nhe', 'Nói ngay nhưng cố giữ giọng nhẹ nhàng', 'ok', 'Khó đấy, nhưng nếu con làm được thì rất tốt.', ['honesty']),
        opt('cai-to', 'Cãi lại thật to cho hả giận', 'poor', 'Người lớn sẽ chỉ nghe thấy tiếng to chứ không nghe được điều con muốn nói.'),
      ],
    },
  ],

  // === Chủ đề 7: Tìm kiếm sự hỗ trợ ========================================
  'ethics.g2.tim-kiem-ho-tro': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Ở nhà một mình, con bị đứt tay chảy máu. Con sẽ làm gì?',
      explanation: 'Biết gọi người giúp đúng lúc là một kỹ năng an toàn quan trọng.',
      options: [
        opt('goi-nguoi-lon', 'Gọi điện cho bố mẹ hoặc sang nhờ hàng xóm', 'good', 'Đúng rồi. Có người lớn giúp thì vết thương được xử lý an toàn.', ['responsibility']),
        opt('tu-bang', 'Tự rửa và dán băng cá nhân', 'ok', 'Vết nhỏ thì được. Nhưng vẫn nên báo bố mẹ khi bố mẹ về.', ['responsibility']),
        opt('giau-di', 'Lau đi và không nói với ai', 'poor', 'Vết thương có thể nhiễm trùng. Người lớn cần biết để giúp con.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Ở trường, con bị một bạn lớn hơn trêu chọc nhiều lần. Con sẽ làm gì?',
      explanation: 'Nhờ người lớn giúp không phải là mách lẻo, mà là tự bảo vệ mình.',
      options: [
        opt('bao-thay-co', 'Kể với thầy cô hoặc bố mẹ', 'good', 'Đúng rồi. Chuyện lặp đi lặp lại thì con cần người lớn giúp.', ['responsibility']),
        opt('noi-voi-ban', 'Nói thẳng với bạn là con không thích bị trêu', 'ok', 'Rất dũng cảm. Nếu bạn vẫn tiếp tục thì con nhớ báo thầy cô nhé.', ['honesty']),
        opt('chiu-dung', 'Im lặng chịu đựng cho qua', 'poor', 'Im lặng thường khiến chuyện kéo dài. Con xứng đáng được giúp.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Đi siêu thị cùng mẹ, con quay lại thì không thấy mẹ đâu. Con sẽ làm gì?',
      explanation: 'Khi lạc, đứng yên một chỗ an toàn và nhờ đúng người là cách nhanh nhất để tìm lại người thân.',
      options: [
        opt('nho-nhan-vien', 'Đứng yên tại chỗ và nhờ nhân viên siêu thị gọi loa tìm mẹ', 'good', 'Chính xác. Nhân viên mặc đồng phục là người con nên nhờ.', ['responsibility']),
        opt('dung-yen', 'Đứng yên đúng chỗ cũ và đợi mẹ quay lại', 'ok', 'Đứng yên là đúng. Nhờ thêm nhân viên thì mẹ tìm được nhanh hơn.', []),
        opt('chay-tim', 'Chạy khắp siêu thị tìm mẹ', 'poor', 'Hai mẹ con cùng di chuyển thì càng khó gặp nhau, mà con lại dễ lạc xa hơn.'),
      ],
    },
  ],

  // === Chủ đề 8: Tuân thủ quy định nơi công cộng ===========================
  'ethics.g2.quy-dinh-noi-cong-cong': [
    {
      kind: 'scenario', difficulty: 1,
      prompt: 'Trong thư viện có biển "Giữ trật tự". Con muốn hỏi bạn một câu. Con sẽ làm gì?',
      explanation: 'Quy định nơi công cộng đặt ra để mọi người cùng được thoải mái.',
      options: [
        opt('noi-nho', 'Ghé sát và nói thật nhỏ', 'good', 'Con vẫn hỏi được mà không làm phiền ai.', ['respect', 'citizenship']),
        opt('ra-ngoai', 'Rủ bạn ra ngoài cửa rồi mới hỏi', 'ok', 'Rất ý tứ, chỉ hơi mất công một chút.', ['respect']),
        opt('goi-to', 'Gọi to tên bạn từ đầu phòng', 'poor', 'Cả phòng đang đọc sách sẽ giật mình. Biển "Giữ trật tự" là dành cho tất cả.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 2,
      prompt: 'Xếp hàng mua vé, con thấy phía trước còn một khoảng trống và nhiều người chưa để ý. Con sẽ làm gì?',
      explanation: 'Xếp hàng là quy định giúp mọi người được đối xử công bằng.',
      options: [
        opt('dung-dung-hang', 'Đứng đúng chỗ của mình và chờ tới lượt', 'good', 'Ai cũng làm như con thì hàng nào cũng nhanh và công bằng.', ['citizenship', 'honesty']),
        opt('nhac-nguoi-truoc', 'Nhắc người phía trước tiến lên cho gọn hàng', 'ok', 'Ý tốt. Nhắc nhẹ nhàng thôi nhé.', ['citizenship']),
        opt('chen-len', 'Chen lên chỗ trống đó', 'poor', 'Những người đã chờ lâu hơn con sẽ phải chờ thêm vì con.'),
      ],
    },
    {
      kind: 'scenario', difficulty: 3,
      prompt: 'Trong công viên có biển "Không giẫm lên cỏ" nhưng nhiều người vẫn đi tắt qua bãi cỏ. Con sẽ làm gì?',
      explanation: 'Nhiều người làm sai không biến việc đó thành đúng.',
      options: [
        opt('di-duong', 'Vẫn đi theo lối đi dành cho người đi bộ', 'good', 'Con làm đúng dù không ai nhìn. Đó mới là điều đáng quý.', ['citizenship', 'honesty']),
        opt('di-duong-noi', 'Đi đúng lối và nói với bố mẹ về tấm biển', 'ok', 'Vừa làm đúng vừa nhắc được người khác, rất tốt.', ['citizenship']),
        opt('di-theo', 'Đi tắt theo mọi người cho nhanh', 'poor', 'Bãi cỏ bị giẫm nhiều sẽ chết. Tấm biển đặt ở đó là có lý do.'),
      ],
    },
  ],
}

export default bank
