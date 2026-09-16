# Học Viện Trí Tuệ

Game học tập kiểu RPG cho học sinh tiểu học 6-10 tuổi (lớp 1-5), bốn môn:
**Toán, Tiếng Việt, Đạo đức, Âm nhạc**. Bám Chương trình GDPT 2018.

Giao diện theo phong cách **máy điện tử cầm tay thời Pokémon GBA**: pixel art,
bản đồ thế giới đẳng cự gồm các đảo nổi, màn đi bộ theo ô, hộp thoại chữ chạy
từng ký tự, trận đấu theo lượt. Web app (PWA), cài được lên tablet, chơi offline.

**Đi lại tự do.** Mỗi đảo là một vùng đất - một môn ở một khối lớp. Trẻ tới đảo
nào cũng được, miễn đảo đó thuộc lớp của mình hoặc lớp dưới. Không có đường đi
bắt buộc: hôm nay ôn Toán lớp 1, mai học Âm nhạc lớp 3 đều đi thẳng được, và
tiến độ mỗi vùng tính riêng.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173 - chạy được ngay, không cần cấu hình gì
npm run build      # build production
npm test           # 356 test (gồm 40 test RLS chạy trên Postgres thật)
npm run validate   # kiểm tra toàn vẹn nội dung
npm run icons      # sinh lại icon PWA
```

**Không cần Supabase để chạy thử.** Bỏ trống `.env.local` là app chạy hoàn toàn
trên máy, không tài khoản, không mạng. Xem [supabase/README.md](supabase/README.md)
khi cần nhiều thiết bị hoặc màn hình theo dõi cho phụ huynh / giáo viên.

## Kiến trúc

```
src/
  engine/      LÕI THUẦN TS, KHÔNG UI - toàn bộ luật chơi nằm ở đây
  content/     chương trình học, bộ sinh câu hỏi, ngân hàng câu hỏi
  data/        interface lưu trữ + bản IndexedDB + bản Supabase + tầng đồng bộ
  store/       Zustand, nối engine với nội dung, lưu trữ và xác thực
  features/
    pixel/     sprite nhân vật và ô cảnh, viết thẳng bằng lưới ký tự
    world/     bản đồ ô vuông, sinh tuyến đường, màn đi bộ
    battle/    trận đấu theo lượt
    ...        hồ sơ, kho đồ, khu vực người lớn
  audio/       tổng hợp âm thanh bằng Web Audio (không dùng file mp3)
supabase/
  migrations/  lược đồ + Row Level Security
  tests/       kiểm chứng RLS trên Postgres thật (PGlite)
```

**Nguyên tắc:** luật chơi nằm trong `src/engine/` dưới dạng hàm thuần, không
import React và không đọc `Date.now()` (thời điểm luôn truyền vào). Nhờ vậy test
được bằng Vitest không cần trình duyệt.

**Tầng dữ liệu:** UI chỉ nói chuyện qua interface `Repository`. Có ba bản cài:
IndexedDB (offline), Supabase (server), và bản trong bộ nhớ (test). Tầng đồng bộ
bọc ngoài để thao tác của trẻ không bao giờ phải chờ mạng.

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
3. **Thao tác của trẻ không chờ mạng.** Mọi thay đổi ghi xuống máy rồi mới xếp
   hàng gửi lên server. Mất mạng giữa buổi học thì trẻ không hề biết.

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

**Lớp học** (giáo viên, cần Supabase): tạo lớp, thêm học sinh, **đặt mã PIN**.
