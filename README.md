# Học Viện Trí Tuệ

Game học tập kiểu RPG cho học sinh tiểu học 6-10 tuổi (lớp 1-5), bốn môn:
**Toán, Tiếng Việt, Đạo đức, Âm nhạc**. Bám Chương trình GDPT 2018.

Giao diện theo phong cách **máy điện tử cầm tay thời Pokémon GBA**: pixel art,
bản đồ thế giới đẳng cự gồm các đảo nổi, màn đi bộ theo ô, hộp thoại chữ chạy
từng ký tự, trận đấu theo lượt. Web app **Next.js**, cài được lên tablet.

**Đi lại tự do.** Mỗi đảo là một vùng đất - một môn ở một khối lớp. Trẻ tới đảo
nào cũng được, miễn đảo đó thuộc lớp của mình hoặc lớp dưới. Không có đường đi
bắt buộc: hôm nay ôn Toán lớp 1, mai học Âm nhạc lớp 3 đều đi thẳng được, và
tiến độ mỗi vùng tính riêng.

## Chạy

```bash
npm install
cp .env.example .env.local   # rồi điền ba biến bên trong
npm run dev        # http://localhost:3000
npm run build      # build production
npm start          # chạy bản đã build
npm test           # 797 test (gồm 67 test RLS chạy trên Postgres thật)
npm run typecheck  # kiểm kiểu toàn dự án
npm run validate   # kiểm tra toàn vẹn nội dung
npm run icons      # sinh lại icon PWA
npm run smtp-check -- ai-do@truong.edu.vn   # máy chủ thư đã cắm đúng chưa
```

**Cần Supabase để chạy.** App là một máy chủ Next.js đứng trước một database
Postgres; thiếu biến môi trường thì route liên quan báo lỗi kèm đúng tên biến còn
thiếu. Xem [supabase/README.md](supabase/README.md) để dựng trong khoảng mười
phút.

## Kiến trúc

```
app/           NEXT.JS APP ROUTER
  page.tsx     trang chơi
  admin/       trang quản trị
  api/         MÁY CHỦ - mọi đường vào database đi qua đây
src/
  server/      CHỈ CHẠY TRÊN MÁY CHỦ - phân quyền, truy vấn, phiên đăng nhập
  engine/      LÕI THUẦN TS, KHÔNG UI - toàn bộ luật chơi nằm ở đây
  content/     chương trình học, bộ sinh câu hỏi, ngân hàng câu hỏi
  data/        interface lưu trữ + bản gọi /api (trình duyệt)
  store/       Zustand, nối engine với nội dung, lưu trữ và xác thực
  shell/       vỏ app: điều phối màn hình, hướng màn hình, đo bố cục
  features/
    pixel/     sprite nhân vật và ô cảnh, viết thẳng bằng lưới ký tự
    world/     bản đồ ô vuông, sinh tuyến đường, màn đi bộ
    battle/    trận đấu theo lượt
    pvp/       đấu trường lớp học - bản đồ chung và trận tay đôi
    ...        hồ sơ, kho đồ, khu vực người lớn
  audio/       tổng hợp âm thanh bằng Web Audio (không dùng file mp3)
supabase/
  migrations/  lược đồ + Row Level Security (lớp phòng thủ thứ hai)
  tests/       kiểm chứng RLS trên Postgres thật (PGlite)
```

**Trình duyệt không biết Supabase tồn tại.** Nó chỉ gọi `/api` trên chính tên
miền của app. Khoá `service_role` ở lại trong tiến trình Node, và `src/server/`
được chốt bằng `import 'server-only'` - lỡ tay nhập nó từ mã client là build hỏng
ngay chứ không âm thầm gói khoá vào gói tải về.

**Phân quyền nằm ở `src/server/guard.ts`**, dịch nguyên văn từ các hàm
`can_read_student` / `can_write_student` trong RLS. Chủ hồ sơ đọc và ghi; giáo
viên dạy em đó chỉ ĐỌC; chính đứa trẻ đó đọc và ghi hồ sơ của mình.
`src/server/guard.test.ts` kiểm chứng đúng những luật ấy.

**Nguyên tắc:** luật chơi nằm trong `src/engine/` dưới dạng hàm thuần, không
import React và không đọc `Date.now()` (thời điểm luôn truyền vào). Nhờ vậy test
được bằng Vitest không cần trình duyệt.

**Tầng dữ liệu:** UI chỉ nói chuyện qua interface `Repository`. Có hai bản cài:
`apiRepository` (gọi `/api`) và bản trong bộ nhớ dành cho test. App yêu cầu luôn
có mạng - tầng đồng bộ offline, hàng đợi gửi lên và luật hợp nhất đã được gỡ bỏ,
khoảng sáu trăm dòng phức tạp nhất dự án.

## Ba nơi để đi

**Bản đồ vùng đất.** Mười tám chặng mỗi môn mỗi lớp, chặng cuối là trùm. Không
có khoá chặng nào - cái chặn nằm ở con quái, và thua thì không mất gì.

**Tháp Trí Tuệ** (`src/content/tower.ts`) đứng giữa lục địa: bốn tầng, mỗi tầng
một con trùm của một môn. Chúng khó hơn trùm vùng đất bằng CƠ CHẾ chứ không bằng
máu - đổi hệ ba câu một lần, có giáp chặn đòn sai hệ, hút máu mỗi lần trẻ trả
lời sai, và nổi giận ở mốc 40% máu. `src/content/tower.test.ts` giữ đúng bốn
nét đó, kể cả cái trần "máu không được trâu quá ba lần trùm thường".

**Đấu trường lớp học** (`src/server/pvp.ts`): trẻ cùng một lớp thấy nhau trên
bản đồ và thách đấu được bạn đang đứng CÙNG HÒN ĐẢO. Hai bên nhận cùng một câu
hỏi, có đồng hồ đếm ngược; ai trả lời đúng trước thì giành quyền tấn công. Máy
chủ là trọng tài duy nhất - thứ tự xếp theo thời điểm yêu cầu tới nơi, nên máy
chậm không bị thiệt và máy khai gian không được lợi.

## Đồ hoạ pixel

Toàn bộ nhân vật và ô cảnh **viết thẳng trong code** dưới dạng lưới ký tự + bảng
màu (`src/features/pixel/`). Không file ảnh, không asset, không cần hoạ sĩ. Sửa
một điểm ảnh chỉ là sửa một ký tự, và test bắt được ngay nếu một hàng bị lệch ô.

Quái được nhân bản bằng **đổi bảng màu** — đúng mẹo của game thời đó khi bộ nhớ
máy không đủ chứa hàng chục hình khác nhau.

Font khung game là **VT323**, một trong số rất ít font pixel trên Google Fonts có
đủ dấu tiếng Việt. Đề bài và đáp án cố ý **giữ font bo tròn dễ đọc**: trẻ lớp 1
phân biệt dấu hỏi với dấu ngã ở độ phân giải thấp rất dễ nhầm.

## Ba quyết định thiết kế

1. **Đạo đức không chấm đúng/sai.** Mỗi tình huống có ba mức `good` / `ok` /
   `poor` kèm lời giải thích. Lựa chọn `poor` KHÔNG trừ máu - trẻ chỉ mất lượt.
2. **Không có màn hình thua.** Hết máu là "rút về làng", giữ nguyên toàn bộ vàng
   và kinh nghiệm. Trẻ bỏ game vì cảm giác mất trắng, không phải vì khó.
3. **Một cửa duy nhất vào dữ liệu.** Mọi lần đọc/ghi đi qua `/api`, và phân
   quyền là TypeScript đọc được chứ không phải SQL trong bảng điều khiển của nhà
   cung cấp. Đổi lại, app cần mạng - mất mạng giữa buổi học thì trẻ dừng lại.

## Thú đồng hành

Mười hai con, ba con mỗi hệ, và hệ chính là môn học. Mỗi con tiến hoá **ba lần**
- cấp 5, cấp 10 và cấp 20 - đổi tên, đổi hình và mạnh lên hẳn một bậc ở mỗi nấc;
nấc cuối học thêm phép tối thượng của hệ mình. Tiến hoá gắn thẳng vào con gốc nên
bộ sưu tập vẫn là 12 ô: đó là con thú của trẻ lớn lên, không phải con mới phải đi
bắt lại.

## Thêm nội dung

- **Toán, Âm nhạc**: sửa generator trong `src/content/math/`, `src/content/music/`.
- **Tiếng Việt, Đạo đức**: sửa file dữ liệu trong `src/content/vietnamese/`,
  `src/content/ethics/`. Câu hỏi là dữ liệu thuần, không cần biết lập trình.

Mọi câu hỏi phải trỏ tới một `skillId` có trong `src/content/curriculum.ts` và
phải có trường `explanation`. Chạy `npm run validate` để kiểm tra.

## Khu vực người lớn

Vào từ bản đồ → **📊 Bố mẹ / Thầy cô**. Có một phép nhân hai chữ số chặn ở cửa.

Màn hình này **cố ý không dùng phong cách pixel**: phụ huynh cần đọc số liệu
nhanh và rõ, không cần thẩm mỹ game. Chỉ phần tiêu đề giữ font pixel cho liền
mạch.

**Tiến độ**: thời gian học, chuỗi ngày học, biểu đồ 7 ngày, và **kỹ năng con
đang gặp khó** — xác định theo tỉ lệ sai chứ không theo điểm mức thạo.

**Lớp học** (giáo viên): tạo lớp, thêm học sinh, **đặt mã PIN**.

## Trang quản trị

Ở đường dẫn `/admin`. Không có nút nào trong giao diện trẻ dẫn tới đây - nó nằm
ngoài đường đi của trẻ, và chưa bao giờ là một lớp bảo mật. Chặn thật nằm ở máy
chủ: những tab cần dữ liệu (Tài khoản, Lớp học, Hồ sơ trẻ) gọi `/api`, và `/api`
hỏi bạn là ai. Quản trị viên đăng nhập xong được đưa thẳng vào đây.
