/**
 * Cây kỹ năng 4 môn × lớp 1-5, bám Chương trình GDPT 2018.
 *
 * Đây là NGUỒN CHÂN LÝ của toàn bộ nội dung: mọi câu hỏi phải trỏ tới một
 * `skillId` có trong file này, và `scripts/validate-content.ts` sẽ báo lỗi nếu
 * có kỹ năng không có câu hỏi nào, hoặc câu hỏi trỏ tới kỹ năng không tồn tại.
 *
 * Quy ước id: `<môn>.g<lớp>.<slug>`  ví dụ `math.g2.nhan-2-5`
 */

import { skillNameOverride } from './custom'
import type { Grade, Subject } from './types'

export interface Skill {
  id: string
  subject: Subject
  grade: Grade
  /** Thứ tự học trong cùng một (môn, lớp) - quyết định thứ tự mở khoá trên bản đồ. */
  order: number
  name: string
  description: string
  /** Kỹ năng phải thạo trước. Selector không phục vụ kỹ năng chưa đủ điều kiện. */
  prerequisites: string[]
}

/** [slug, tên, mô tả, các slug tiên quyết?] */
type SkillRow = [string, string, string, string[]?]

function defineSkills(subject: Subject, grade: Grade, rows: SkillRow[]): Skill[] {
  return rows.map(([slug, name, description, prereqs = []], index) => ({
    id: `${subject}.g${grade}.${slug}`,
    subject,
    grade,
    order: index,
    name,
    description,
    // slug không chứa dấu chấm được hiểu là cùng môn, cùng lớp
    prerequisites: prereqs.map((p) => (p.includes('.') ? p : `${subject}.g${grade}.${p}`)),
  }))
}

// ---------------------------------------------------------------------------
// TOÁN
// ---------------------------------------------------------------------------

const MATH: Skill[] = [
  ...defineSkills('math', 1, [
    ['dem-100', 'Đếm và so sánh đến 100', 'Đếm xuôi, đếm ngược, so sánh lớn hơn - bé hơn - bằng nhau'],
    ['cong-tru-10', 'Cộng trừ trong phạm vi 10', 'Phép cộng và phép trừ với kết quả không quá 10'],
    ['cong-tru-20', 'Cộng trừ trong phạm vi 20', 'Cộng qua 10, trừ có nhớ trong phạm vi 20', ['cong-tru-10']],
    ['hinh-phang', 'Hình phẳng cơ bản', 'Nhận biết hình tròn, hình vuông, hình tam giác, hình chữ nhật'],
    ['do-dai-cm', 'Đo độ dài bằng xăng-ti-mét', 'Ước lượng và đo độ dài đơn giản bằng cm'],
    ['xem-gio-dung', 'Xem giờ đúng', 'Đọc giờ đúng trên đồng hồ kim'],
  ]),
  // Bám SGK Toán 2 - Kết nối tri thức, 14 chủ đề / 75 bài. Xem docs/sgk-lop-2.md.
  ...defineSkills('math', 2, [
    ['on-so-100', 'Ôn tập các số đến 100', 'Đọc, viết, phân tích chục - đơn vị và so sánh các số đến 100'],
    ['tia-so', 'Tia số, số liền trước, số liền sau', 'Vị trí số trên tia số và hai số đứng liền kề', ['on-so-100']],
    ['thanh-phan-cong-tru', 'Thành phần của phép cộng, phép trừ', 'Số hạng, tổng, số bị trừ, số trừ, hiệu'],
    ['hon-kem', 'Hơn, kém nhau bao nhiêu', 'Tìm phần hơn, phần kém giữa hai số', ['thanh-phan-cong-tru']],
    ['cong-tru-20', 'Phép cộng, phép trừ (qua 10) trong phạm vi 20', 'Bảng cộng và bảng trừ qua 10', ['math.g1.cong-tru-20']],
    ['bai-toan-them-bot', 'Bài toán thêm, bớt, nhiều hơn, ít hơn', 'Giải bài toán có lời văn bằng một phép tính', ['cong-tru-20']],
    ['ki-lo-gam-lit', 'Ki-lô-gam và lít', 'Đọc cân nặng theo ki-lô-gam và dung tích theo lít'],
    ['cong-tru-100', 'Phép cộng, phép trừ (có nhớ) trong phạm vi 100', 'Đặt tính rồi tính với số có hai chữ số', ['cong-tru-20']],
    ['hinh-phang', 'Điểm, đoạn thẳng, đường thẳng, đường cong', 'Nhận biết ba điểm thẳng hàng và các hình cơ bản'],
    ['duong-gap-khuc', 'Đường gấp khúc và hình tứ giác', 'Tính độ dài đường gấp khúc, đếm hình tứ giác', ['hinh-phang']],
    ['ngay-gio-thang', 'Ngày - giờ, giờ - phút, ngày - tháng', 'Xem đồng hồ và xem lịch', ['math.g1.xem-gio-dung']],
    ['nhan-2-5', 'Phép nhân, bảng nhân 2 và 5', 'Thừa số, tích; thuộc bảng nhân 2 và bảng nhân 5'],
    ['chia-2-5', 'Phép chia, bảng chia 2 và 5', 'Số bị chia, số chia, thương; bảng chia 2 và bảng chia 5', ['nhan-2-5']],
    ['khoi-tru-cau', 'Khối trụ, khối cầu', 'Nhận biết khối trụ và khối cầu qua đồ vật quen thuộc'],
    ['so-1000', 'Các số trong phạm vi 1000', 'Trăm - chục - đơn vị, số có ba chữ số, viết thành tổng và so sánh', ['on-so-100']],
    ['do-dai-tien', 'Đơn vị đo độ dài và tiền Việt Nam', 'Đề-xi-mét, mét, ki-lô-mét và các tờ tiền quen thuộc'],
    ['cong-tru-1000', 'Phép cộng, phép trừ trong phạm vi 1000', 'Cộng trừ có nhớ và không nhớ với số có ba chữ số', ['so-1000', 'cong-tru-100']],
    ['thong-ke-xac-suat', 'Kiểm đếm số liệu và khả năng xảy ra', 'Biểu đồ tranh; chắc chắn - có thể - không thể'],
  ]),
  ...defineSkills('math', 3, [
    ['bang-nhan-chia', 'Bảng nhân chia 3-9', 'Hoàn thiện bảng nhân và bảng chia từ 3 đến 9', ['math.g2.chia-2-5']],
    ['tinh-1000', 'Phép tính trong phạm vi 1000', 'Thành thạo cộng, trừ số có ba chữ số', ['math.g2.cong-tru-1000']],
    ['nhan-chia-cot', 'Nhân chia số có nhiều chữ số', 'Đặt tính nhân, chia cho số có một chữ số', ['bang-nhan-chia']],
    ['phan-so-don-gian', 'Phân số đơn giản', 'Một phần hai, một phần ba, một phần tư của một nhóm'],
    ['chu-vi', 'Chu vi hình chữ nhật và hình vuông', 'Tính chu vi bằng công thức'],
    ['xem-lich', 'Xem lịch và tính thời gian', 'Ngày, tháng, năm; tính khoảng thời gian ngắn'],
  ]),
  ...defineSkills('math', 4, [
    ['so-lon', 'Số đến lớp triệu', 'Đọc, viết, so sánh số lớn; giá trị theo hàng'],
    ['bon-phep-tinh', 'Bốn phép tính với số tự nhiên', 'Cộng trừ nhân chia số nhiều chữ số', ['math.g3.nhan-chia-cot']],
    ['phan-so', 'Phân số và phép tính phân số', 'Rút gọn, quy đồng, cộng trừ phân số', ['math.g3.phan-so-don-gian']],
    ['goc', 'Góc', 'Góc nhọn, góc vuông, góc tù, góc bẹt'],
    ['dien-tich', 'Diện tích hình chữ nhật và hình vuông', 'Tính diện tích bằng công thức', ['math.g3.chu-vi']],
    ['bieu-do-cot', 'Biểu đồ cột', 'Đọc và rút thông tin từ biểu đồ cột đơn giản'],
  ]),
  ...defineSkills('math', 5, [
    ['so-thap-phan', 'Số thập phân', 'Đọc, viết, so sánh và tính toán với số thập phân', ['math.g4.phan-so']],
    ['ti-so-phan-tram', 'Tỉ số phần trăm', 'Tìm tỉ số phần trăm và giải bài toán liên quan', ['so-thap-phan']],
    ['dien-tich-nang-cao', 'Diện tích tam giác, hình thang, hình tròn', 'Áp dụng các công thức diện tích', ['math.g4.dien-tich']],
    ['the-tich', 'Thể tích hình hộp chữ nhật', 'Tính thể tích và đơn vị đo thể tích', ['dien-tich-nang-cao']],
    ['chuyen-dong-deu', 'Toán chuyển động đều', 'Quan hệ giữa vận tốc, quãng đường, thời gian', ['so-thap-phan']],
    ['doi-don-vi', 'Đổi đơn vị đo', 'Chuyển đổi đơn vị độ dài, khối lượng, diện tích, thời gian'],
  ]),
]

// ---------------------------------------------------------------------------
// TIẾNG VIỆT
// ---------------------------------------------------------------------------

const VIETNAMESE: Skill[] = [
  ...defineSkills('vietnamese', 1, [
    ['am-chu-cai', 'Âm và chữ cái', 'Nhận biết mặt chữ và âm tương ứng'],
    ['van-don-gian', 'Vần đơn giản', 'Đọc và ghép các vần thường gặp', ['am-chu-cai']],
    ['dau-thanh', 'Dấu thanh', 'Sáu thanh: ngang, huyền, sắc, hỏi, ngã, nặng', ['am-chu-cai']],
    ['ghep-tieng', 'Ghép tiếng', 'Ghép âm đầu, vần và thanh thành tiếng có nghĩa', ['van-don-gian', 'dau-thanh']],
    ['doc-hieu-cau', 'Đọc hiểu câu ngắn', 'Hiểu nội dung câu và đoạn văn rất ngắn', ['ghep-tieng']],
  ]),
  // Bám SGK Tiếng Việt 2 - Kết nối tri thức, 35 tuần / 9 chủ điểm.
  ...defineSkills('vietnamese', 2, [
    ['bang-chu-cai', 'Bảng chữ cái và thứ tự chữ cái', 'Thuộc bảng chữ cái, xếp tên theo thứ tự', ['vietnamese.g1.am-chu-cai']],
    ['tu-chi-su-vat', 'Từ ngữ chỉ sự vật', 'Từ chỉ người, vật, con vật, cây cối'],
    ['tu-chi-hoat-dong', 'Từ ngữ chỉ hoạt động', 'Từ chỉ việc làm, hành động'],
    ['tu-chi-dac-diem', 'Từ ngữ chỉ đặc điểm', 'Từ chỉ màu sắc, hình dáng, tính nết'],
    ['cau-gioi-thieu', 'Câu giới thiệu (Ai là gì?)', 'Nhận biết và đặt câu giới thiệu', ['tu-chi-su-vat']],
    ['cau-neu-hoat-dong', 'Câu nêu hoạt động (Ai làm gì?)', 'Nhận biết và đặt câu nêu hoạt động', ['tu-chi-hoat-dong']],
    ['cau-neu-dac-diem', 'Câu nêu đặc điểm (Ai thế nào?)', 'Nhận biết và đặt câu nêu đặc điểm', ['tu-chi-dac-diem']],
    ['dau-cau', 'Dấu chấm, chấm hỏi, chấm than, dấu phẩy', 'Chọn đúng dấu câu cho từng loại câu'],
    ['viet-hoa-ten-rieng', 'Viết hoa tên người và tên địa lí', 'Viết hoa chữ cái đầu mỗi tiếng của tên riêng'],
    ['chinh-ta-phu-am', 'Chính tả phụ âm đầu dễ lẫn', 'c/k, g/gh, ng/ngh, ch/tr, s/x, l/n, r/d/gi'],
    ['chinh-ta-van', 'Chính tả vần dễ lẫn', 'an/ang, ăt/ăc, iu/ưu, uôn/uông, ai/ay...'],
    ['chinh-ta-dau-thanh', 'Chính tả dấu hỏi và dấu ngã', 'Đặt đúng dấu hỏi, dấu ngã'],
    ['von-tu-chu-diem', 'Mở rộng vốn từ theo chủ điểm', 'Gia đình, trường học, thiên nhiên, nghề nghiệp, quê hương'],
  ]),
  ...defineSkills('vietnamese', 3, [
    ['dong-nghia-trai-nghia', 'Từ đồng nghĩa và trái nghĩa', 'Tìm từ cùng nghĩa và từ ngược nghĩa', ['vietnamese.g2.von-tu-chu-diem']],
    ['bien-phap-so-sanh', 'Biện pháp so sánh', 'Nhận biết và đặt câu có hình ảnh so sánh'],
    ['mau-cau-ai-la-gi', 'Mẫu câu Ai là gì / Ai làm gì / Ai thế nào', 'Nhận diện ba mẫu câu kể', ['vietnamese.g2.cau-gioi-thieu']],
    ['dau-hai-cham-ngoac-kep', 'Dấu hai chấm và dấu ngoặc kép', 'Dùng dấu câu khi dẫn lời nói', ['vietnamese.g2.dau-cau']],
    ['tu-chi-dac-diem', 'Từ ngữ chỉ đặc điểm và hoạt động', 'Mở rộng vốn từ miêu tả'],
  ]),
  ...defineSkills('vietnamese', 4, [
    ['danh-dong-tinh-tu', 'Danh từ, động từ, tính từ', 'Phân loại ba từ loại chính', ['vietnamese.g3.tu-chi-dac-diem']],
    ['chu-ngu-vi-ngu', 'Chủ ngữ và vị ngữ', 'Xác định thành phần chính của câu', ['vietnamese.g3.mau-cau-ai-la-gi']],
    ['cau-khien-cau-cam', 'Câu khiến và câu cảm', 'Nhận biết và đặt câu khiến, câu cảm'],
    ['thanh-ngu-tuc-ngu', 'Thành ngữ và tục ngữ', 'Hiểu nghĩa các thành ngữ, tục ngữ quen thuộc'],
    ['nhan-hoa', 'Biện pháp nhân hoá', 'Nhận biết và sử dụng phép nhân hoá', ['vietnamese.g3.bien-phap-so-sanh']],
  ]),
  ...defineSkills('vietnamese', 5, [
    ['dai-tu', 'Đại từ', 'Đại từ xưng hô và đại từ thay thế', ['vietnamese.g4.danh-dong-tinh-tu']],
    ['quan-he-tu', 'Quan hệ từ', 'Dùng đúng và, nhưng, vì, nên, tuy... nhưng...'],
    ['cau-ghep', 'Câu ghép', 'Nhận biết và đặt câu ghép', ['quan-he-tu', 'vietnamese.g4.chu-ngu-vi-ngu']],
    ['lien-ket-cau', 'Liên kết câu', 'Liên kết bằng phép lặp, phép thế, phép nối', ['dai-tu']],
    ['bien-phap-tu-tu', 'Biện pháp tu từ', 'So sánh, nhân hoá, điệp từ điệp ngữ', ['vietnamese.g4.nhan-hoa']],
  ]),
]

// ---------------------------------------------------------------------------
// ĐẠO ĐỨC
// Lưu ý: mọi câu hỏi môn này dùng thể loại `scenario` - không chấm đúng/sai.
// ---------------------------------------------------------------------------

const ETHICS: Skill[] = [
  ...defineSkills('ethics', 1, [
    ['yeu-thuong-gia-dinh', 'Yêu thương gia đình', 'Quan tâm, giúp đỡ ông bà cha mẹ anh chị em'],
    ['gon-gang-ngan-nap', 'Gọn gàng, ngăn nắp', 'Giữ gìn đồ dùng và nơi ở sạch sẽ, ngăn nắp'],
    ['le-phep-chao-hoi', 'Lễ phép, chào hỏi', 'Chào hỏi, cảm ơn, xin lỗi đúng lúc'],
    ['tu-cham-soc', 'Tự chăm sóc bản thân', 'Vệ sinh cá nhân, ăn uống và nghỉ ngơi điều độ'],
    ['an-toan-vui-choi', 'An toàn khi vui chơi', 'Nhận biết nơi chơi an toàn và tình huống nguy hiểm'],
  ]),
  // Bám SGK Đạo đức 2 - Kết nối tri thức, 8 chủ đề / 15 bài.
  ...defineSkills('ethics', 2, [
    ['ve-dep-que-huong', 'Vẻ đẹp quê hương em', 'Nhận ra cảnh đẹp và nét riêng của quê hương'],
    ['em-yeu-que-huong', 'Em yêu quê hương', 'Việc làm thể hiện tình yêu quê hương', ['ve-dep-que-huong']],
    ['kinh-trong-thay-co', 'Kính trọng thầy giáo, cô giáo', 'Thái độ lễ phép và biết ơn thầy cô'],
    ['yeu-quy-ban-be', 'Yêu quý bạn bè', 'Quan tâm, chia sẻ và giúp đỡ bạn'],
    ['quy-trong-thoi-gian', 'Quý trọng thời gian', 'Làm việc đúng giờ, không trì hoãn'],
    ['nhan-loi-sua-loi', 'Nhận lỗi và sửa lỗi', 'Dũng cảm nhận lỗi, chủ động sửa sai', ['ethics.g1.le-phep-chao-hoi']],
    ['bao-quan-do-dung-ca-nhan', 'Bảo quản đồ dùng cá nhân', 'Giữ gìn sách vở, quần áo, đồ dùng của mình'],
    ['bao-quan-do-dung-gia-dinh', 'Bảo quản đồ dùng gia đình', 'Dùng cẩn thận và giữ gìn đồ đạc chung trong nhà', ['bao-quan-do-dung-ca-nhan']],
    ['cam-xuc-cua-em', 'Cảm xúc của em', 'Gọi tên được vui, buồn, tức giận, sợ hãi'],
    ['kiem-che-cam-xuc', 'Kiềm chế cảm xúc tiêu cực', 'Bình tĩnh lại khi tức giận hoặc buồn bực', ['cam-xuc-cua-em']],
    ['tim-kiem-ho-tro', 'Tìm kiếm sự hỗ trợ', 'Biết nhờ giúp đỡ khi ở nhà, ở trường và nơi công cộng'],
    ['quy-dinh-noi-cong-cong', 'Tuân thủ quy định nơi công cộng', 'Hiểu và làm theo quy định nơi công cộng'],
  ]),
  ...defineSkills('ethics', 3, [
    ['giu-loi-hua', 'Giữ lời hứa', 'Nói lời phải giữ lấy lời', ['ethics.g2.nhan-loi-sua-loi']],
    ['hoan-thanh-nhiem-vu', 'Tích cực hoàn thành nhiệm vụ', 'Làm hết trách nhiệm phần việc được giao'],
    ['xu-ly-bat-hoa', 'Xử lý bất hoà với bạn', 'Bình tĩnh giải quyết mâu thuẫn, không dùng bạo lực', ['ethics.g2.yeu-quy-ban-be']],
    ['quan-tam-hang-xom', 'Quan tâm hàng xóm láng giềng', 'Cư xử thân thiện với người xung quanh'],
    ['ham-hoc-hoi', 'Ham học hỏi', 'Chủ động tìm hiểu, hỏi khi chưa biết'],
  ]),
  ...defineSkills('ethics', 4, [
    ['trung-thuc', 'Trung thực', 'Nói thật, không gian lận, không lấy của người khác', ['ethics.g3.giu-loi-hua']],
    ['biet-on-nguoi-lao-dong', 'Biết ơn người lao động', 'Trân trọng công sức của mọi nghề nghiệp'],
    ['ton-trong-tai-san', 'Tôn trọng tài sản người khác', 'Hỏi trước khi mượn, giữ gìn đồ mượn', ['trung-thuc']],
    ['quyen-bon-phan-tre-em', 'Quyền và bổn phận trẻ em', 'Biết quyền của mình và bổn phận với gia đình, nhà trường'],
    ['bao-ve-cua-cong', 'Bảo vệ của công', 'Giữ gìn tài sản công cộng nơi công cộng', ['ethics.g2.bao-quan-do-dung-gia-dinh']],
  ]),
  ...defineSkills('ethics', 5, [
    ['bao-ve-moi-truong', 'Bảo vệ môi trường', 'Tiết kiệm, phân loại rác, giữ gìn thiên nhiên'],
    ['vuot-qua-kho-khan', 'Vượt qua khó khăn', 'Kiên trì trước thất bại, không bỏ cuộc', ['ethics.g3.hoan-thanh-nhiem-vu']],
    ['an-toan-tren-mang', 'An toàn trên không gian mạng', 'Bảo vệ thông tin cá nhân, ứng xử văn minh trên mạng'],
    ['ton-trong-khac-biet', 'Tôn trọng sự khác biệt', 'Tôn trọng người khác về ngoại hình, hoàn cảnh, dân tộc', ['ethics.g4.ton-trong-tai-san']],
    ['biet-on-nguoi-co-cong', 'Biết ơn người có công', 'Ghi nhớ công lao những người đã hi sinh vì đất nước'],
  ]),
]

// ---------------------------------------------------------------------------
// ÂM NHẠC
// ---------------------------------------------------------------------------

const MUSIC: Skill[] = [
  ...defineSkills('music', 1, [
    ['cao-thap', 'Âm thanh cao - thấp', 'Phân biệt nốt cao và nốt thấp'],
    ['to-nho', 'Âm thanh to - nhỏ', 'Phân biệt cường độ mạnh và nhẹ'],
    ['nhanh-cham', 'Nhanh - chậm', 'Cảm nhận nhịp độ nhanh và chậm'],
    ['nhac-cu-quen-thuoc', 'Nhận biết nhạc cụ quen thuộc', 'Trống, phách, thanh la, song loan'],
    ['van-dong-theo-nhac', 'Vận động theo nhạc', 'Vỗ tay, gõ đệm theo bài hát'],
  ]),
  // Bám SGK Âm nhạc 2 - Kết nối tri thức, 8 chủ đề.
  ...defineSkills('music', 2, [
    ['sac-mau-am-thanh', 'Sắc màu âm thanh', 'Phân biệt âm thanh cao - thấp, dài - ngắn, to - nhỏ', ['music.g1.cao-thap']],
    ['not-do-re-mi-pha-son', 'Đọc nhạc Đô Rê Mi Pha Son', 'Nhận biết và đọc tên năm nốt đầu tiên', ['music.g1.cao-thap']],
    ['nhip-2-4', 'Nhịp 2/4, phách mạnh - phách nhẹ', 'Cảm nhận và gõ đúng nhịp hai phách'],
    ['hinh-tiet-tau', 'Hình tiết tấu và gõ đệm', 'Gõ lại đúng hình tiết tấu bằng nhạc cụ gõ', ['nhip-2-4']],
    ['nhac-cu-go', 'Nhạc cụ gõ trong giờ học', 'Thanh phách, song loan, trống nhỏ, tem-bơ-rin, trai-en-gô'],
    ['hat-dung-giai-dieu', 'Hát đúng lời ca và giai điệu', 'Nhớ lời và hát đúng cao độ bài hát ngắn', ['not-do-re-mi-pha-son']],
    ['nhac-cu-dan-toc', 'Nhạc cụ dân tộc Việt Nam', 'Nhận biết đàn bầu và một vài nhạc cụ dân tộc'],
    ['nghe-nhac-cam-thu', 'Nghe nhạc và cảm nhận', 'Nghe và nói được cảm nhận về bài hát, bản nhạc'],
  ]),
  ...defineSkills('music', 3, [
    ['khuong-nhac-khoa-son', 'Khuông nhạc và khoá Son', 'Năm dòng kẻ, bốn khe, vị trí khoá Son', ['music.g2.not-do-re-mi-pha-son']],
    ['not-den-trang-tron', 'Nốt đen, nốt trắng, nốt tròn', 'Phân biệt trường độ ba loại nốt cơ bản'],
    ['nhip-3-4', 'Nhịp 3/4', 'Cảm nhận và gõ đúng nhịp ba phách', ['music.g2.nhip-2-4']],
    ['am-sac-nhac-cu', 'Âm sắc nhạc cụ', 'Nhận ra tiếng đàn, tiếng trống, tiếng sáo', ['music.g1.nhac-cu-quen-thuoc']],
  ]),
  ...defineSkills('music', 4, [
    ['gam-do-truong', 'Gam Đô trưởng', 'Đủ bảy nốt Đô Rê Mi Pha Son La Si', ['music.g3.khuong-nhac-khoa-son']],
    ['truong-do-moc-don', 'Trường độ và nốt móc đơn', 'Quan hệ trường độ giữa các hình nốt', ['music.g3.not-den-trang-tron']],
    ['nhac-cu-dan-toc', 'Nhạc cụ dân tộc Việt Nam', "Đàn bầu, đàn tranh, sáo trúc, đàn t'rưng", ['music.g3.am-sac-nhac-cu']],
    ['nhip-do', 'Nhịp độ', 'Chậm, vừa phải, nhanh và ý nghĩa biểu cảm', ['music.g1.nhanh-cham']],
  ]),
  ...defineSkills('music', 5, [
    ['nhip-4-4', 'Nhịp 4/4', 'Cảm nhận và gõ đúng nhịp bốn phách', ['music.g3.nhip-3-4']],
    ['dau-lang', 'Dấu lặng', 'Lặng đen, lặng đơn và vai trò của khoảng nghỉ', ['music.g4.truong-do-moc-don']],
    ['dan-ca-vung-mien', 'Dân ca vùng miền', 'Nhận biết đặc trưng dân ca Bắc, Trung, Nam', ['music.g4.nhac-cu-dan-toc']],
    ['sac-thai-to-nho', 'Sắc thái to - nhỏ', 'Ký hiệu f (mạnh) và p (nhẹ)', ['music.g1.to-nho']],
  ]),
]

// ---------------------------------------------------------------------------
// Tổng hợp & tiện ích tra cứu
// ---------------------------------------------------------------------------

export const ALL_SKILLS: Skill[] = [...MATH, ...VIETNAMESE, ...ETHICS, ...MUSIC]

const SKILL_BY_ID = new Map(ALL_SKILLS.map((s) => [s.id, s]))

/**
 * Áp tên do thầy cô đặt lại ở trang quản trị, nếu có.
 *
 * Đi qua đây thay vì sửa thẳng `ALL_SKILLS`: bảng gốc phải giữ nguyên để xoá
 * phần tự sửa là mọi thứ về như cũ. Chỉ TÊN đổi được, còn mã kỹ năng, lớp và
 * thứ tự thì không - đó là những thứ tiến độ đã học của từng trẻ đang trỏ vào.
 */
function named(skill: Skill): Skill {
  const custom = skillNameOverride(skill.id)
  return custom ? { ...skill, name: custom } : skill
}

export function getSkill(id: string): Skill | undefined {
  const skill = SKILL_BY_ID.get(id)
  return skill ? named(skill) : undefined
}

export function requireSkill(id: string): Skill {
  const skill = SKILL_BY_ID.get(id)
  if (!skill) throw new Error(`Không tìm thấy kỹ năng: ${id}`)
  return named(skill)
}

/** Tên gốc trong mã, bỏ qua phần đặt lại - trang quản trị cần để đối chiếu. */
export function originalSkillName(id: string): string | null {
  return SKILL_BY_ID.get(id)?.name ?? null
}

export function skillsFor(subject: Subject, grade: Grade): Skill[] {
  return ALL_SKILLS.filter((s) => s.subject === subject && s.grade === grade)
    .sort((a, b) => a.order - b.order)
    .map(named)
}

export function skillsBySubject(subject: Subject): Skill[] {
  return ALL_SKILLS.filter((s) => s.subject === subject)
    .sort((a, b) => a.grade - b.grade || a.order - b.order)
    .map(named)
}

/** Kỹ năng của lớp hiện tại và tất cả lớp dưới - trẻ luôn được ôn lại nền cũ. */
export function skillsUpToGrade(subject: Subject, grade: Grade): Skill[] {
  return ALL_SKILLS.filter((s) => s.subject === subject && s.grade <= grade)
    .sort((a, b) => a.grade - b.grade || a.order - b.order)
    .map(named)
}
