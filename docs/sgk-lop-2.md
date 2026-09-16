# Nội dung lớp 2 bám sách giáo khoa

Cây kỹ năng và ngân hàng câu hỏi lớp 2 trong `src/content/` được dựng theo bộ
**Kết nối tri thức với cuộc sống** (NXB Giáo dục Việt Nam, 2021), bảy quyển PDF
để ở thư mục gốc của dự án.

## Cách dùng sách

Sách là **căn cứ về phạm vi và trình tự nội dung**: học kỳ nào dạy gì, số nằm
trong phạm vi bao nhiêu, cặp phụ âm nào cần phân biệt, chủ điểm nào ở tuần nào.

Câu hỏi trong app là **câu mới tự soạn** theo phạm vi đó. Không chép bài đọc,
bài thơ, câu chuyện hay hình minh hoạ trong sách vào app — trang bản quyền của
sách ghi rõ không được sao chép dưới bất kỳ hình thức nào khi chưa có văn bản
cho phép. Phạm vi kiến thức và trình tự chương trình thì không thuộc phạm vi đó,
và đó chính là thứ cần bám.

Các file PDF là bản **scan**, không có lớp chữ, nên không trích được text. Hai
công cụ đọc sách nằm trong thư mục nháp của phiên làm việc (`sgkpage.mjs`,
`sgkheaders.mjs`): chúng bóc thẳng ảnh JPEG nhúng trong PDF rồi ghép bằng trình
duyệt. Mỗi trang sách bị cắt thành 4 dải ảnh xếp chồng.

---

## Toán 2 — 14 chủ đề, 75 bài

| Chủ đề | Nội dung | Kỹ năng trong app |
|---|---|---|
| 1 | Ôn tập các số đến 100; tia số, số liền trước/liền sau; số hạng–tổng, số bị trừ–số trừ–hiệu; hơn kém nhau bao nhiêu; cộng trừ không nhớ trong 100 | `on-so-100`, `tia-so`, `thanh-phan-cong-tru`, `hon-kem` |
| 2 | Phép cộng, phép trừ (qua 10) trong phạm vi 20; bảng cộng, bảng trừ; bài toán thêm–bớt, nhiều hơn–ít hơn | `cong-tru-20`, `bai-toan-them-bot` |
| 3 | Ki-lô-gam, lít | `ki-lo-gam-lit` |
| 4 | Phép cộng, phép trừ (có nhớ) trong phạm vi 100 | `cong-tru-100` |
| 5 | Điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng; đường gấp khúc, hình tứ giác | `hinh-phang`, `duong-gap-khuc` |
| 6 | Ngày–giờ, giờ–phút, ngày–tháng | `ngay-gio-thang` |
| 7 | Ôn tập học kì 1 | — |
| 8 | Phép nhân; thừa số, tích; bảng nhân 2, 5; phép chia; số bị chia, số chia, thương; bảng chia 2, 5 | `nhan-2-5`, `chia-2-5` |
| 9 | Khối trụ, khối cầu | `khoi-tru-cau` |
| 10 | Các số trong phạm vi 1000; số tròn trăm, tròn chục; số có ba chữ số; viết thành tổng; so sánh | `so-1000` |
| 11 | Đề-xi-mét, mét, ki-lô-mét; tiền Việt Nam | `do-dai-tien` |
| 12 | Phép cộng, phép trừ (có nhớ và không nhớ) trong phạm vi 1000 | `cong-tru-1000` |
| 13 | Thu thập, phân loại, kiểm đếm số liệu; biểu đồ tranh; chắc chắn – có thể – không thể | `thong-ke-xac-suat` |
| 14 | Ôn tập cuối năm | — |

**Đáng chú ý:** phạm vi 1000 là nội dung **lớp 2**, không phải lớp 3 như cây kỹ
năng cũ của app từng xếp.

---

## Tiếng Việt 2 — 35 tuần, 9 chủ điểm

Tập 1: *Em lớn lên từng ngày · Đi học vui sao · Niềm vui tuổi thơ · Mái ấm gia đình*
Tập 2: *Vẻ đẹp quanh em · Hành tinh xanh của em · Giao tiếp và kết nối · Con người Việt Nam · Việt Nam quê hương em*

Kiến thức tiếng Việt rút ra từ cột **Luyện tập** của mục lục:

- Bảng chữ cái và thứ tự chữ cái → `bang-chu-cai`
- Từ ngữ chỉ **sự vật / hoạt động / đặc điểm** → ba kỹ năng riêng
- Câu **giới thiệu / nêu hoạt động / nêu đặc điểm** → ba kỹ năng riêng
- Dấu chấm, dấu chấm hỏi, dấu chấm than, dấu phẩy → `dau-cau`
- Viết hoa tên người, tên riêng địa lí → `viet-hoa-ten-rieng`
- Mở rộng vốn từ theo chủ điểm → `von-tu-chu-diem`

Chính tả phân biệt (gom theo ba nhóm):

- **Phụ âm đầu** `chinh-ta-phu-am`: c/k, g/gh, ng/ngh, ch/tr, s/x, l/n, r/d/gi, d/gi, v/d
- **Vần** `chinh-ta-van`: an/ang, ăn/ăng, ân/âng, en/eng, iên/iêng, ac/at, ăt/ăc, ât/âc, ai/ay, ao/au, iu/ưu, iêu/ươu, uôn/uông, ươn/ương, uc/ut, êt/êch, ip/iêp, im/iêm, in/inh, ên/ênh, eo/oe, oanh/oach, uôt/uôc, ước/ướt, uya/uyu, uynh/uych, iêt/iêc, it/uyt
- **Dấu thanh** `chinh-ta-dau-thanh`: dấu hỏi / dấu ngã

---

## Đạo đức 2 — 8 chủ đề, 15 bài

| Chủ đề | Bài | Kỹ năng |
|---|---|---|
| 1 Quê hương em | Vẻ đẹp quê hương em; Em yêu quê hương | `ve-dep-que-huong`, `em-yeu-que-huong` |
| 2 Kính trọng thầy cô, yêu quý bạn bè | Kính trọng thầy giáo, cô giáo; Yêu quý bạn bè | `kinh-trong-thay-co`, `yeu-quy-ban-be` |
| 3 Quý trọng thời gian | Quý trọng thời gian | `quy-trong-thoi-gian` |
| 4 Nhận lỗi và sửa lỗi | Nhận lỗi và sửa lỗi | `nhan-loi-sua-loi` |
| 5 Bảo quản đồ dùng | Đồ dùng cá nhân; đồ dùng gia đình | `bao-quan-do-dung-ca-nhan`, `bao-quan-do-dung-gia-dinh` |
| 6 Thể hiện cảm xúc | Cảm xúc của em; Kiềm chế cảm xúc tiêu cực | `cam-xuc-cua-em`, `kiem-che-cam-xuc` |
| 7 Tìm kiếm sự hỗ trợ | Khi ở nhà; khi ở trường; nơi công cộng | `tim-kiem-ho-tro` |
| 8 Tuân thủ quy định nơi công cộng | Tìm hiểu quy định; Em tuân thủ quy định | `quy-dinh-noi-cong-cong` |

---

## Âm nhạc 2 — 8 chủ đề

| Chủ đề | Hát | Nội dung khác |
|---|---|---|
| 1 Sắc màu âm thanh | Dàn nhạc trong vườn | Câu chuyện *Ước mơ của bạn Đô*; Đọc nhạc Bài số 1 |
| 2 Em yêu làn điệu dân ca | Con chim chích choè | Nhạc cụ *song loan*; Đàn bầu Việt Nam |
| 3 Mái trường thân yêu | Học sinh lớp Hai chăm ngoan | Đọc nhạc Bài số 2; nghe *Vui đến trường* |
| 4 Tuổi thơ | Chú chim nhỏ dễ thương | Nghe *Múa sư tử thật là vui*; gõ hình tiết tấu |
| 5 Mùa xuân | Hoa lá mùa xuân | Đọc nhạc Bài số 3; *Chú voi con ở Bản Đôn* |
| 6 Gia đình yêu thương | Mẹ ơi có biết | Nghe *Ru con*; nhạc cụ ma-ra-cát |
| 7 Những con vật quanh em | Trang trại vui vẻ | Đọc nhạc Bài số 4; nghe *Vũ khúc đàn gà con* |
| 8 Mùa hè vui | Ngày hè vui | Nghe *Mùa hè ước mong*; gõ hình tiết tấu |

Nhạc cụ gõ dùng trong giờ học: **thanh phách, tem-bơ-rin, song loan, trống nhỏ,
trai-en-gô**. Sách dùng ký hiệu hoa đỏ cho **phách mạnh**, hoa vàng cho
**phách nhẹ**.

---

## Quyển không dùng

**Mĩ thuật 2** nằm ngoài bốn môn của game nên không được đưa vào nội dung.
