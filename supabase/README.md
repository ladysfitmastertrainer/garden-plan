# Dựng Supabase

App này là một **máy chủ Next.js** đứng trước một **database Postgres của
Supabase**. Trình duyệt không nói chuyện với Supabase: nó gọi `/api` trên chính
tên miền của app, và máy chủ Node là thứ duy nhất cầm khoá vào database.

Nghĩa là Supabase ở đây chỉ còn đóng hai vai: **Postgres** và **kho mật khẩu**.
Không Edge Function, không cần bật đăng nhập ẩn danh, không cần cắm SMTP.

## 1. Tạo dự án

Vào [supabase.com](https://supabase.com) → New project. Chọn region gần Việt Nam
(Singapore) cho độ trễ thấp.

## 2. Chạy migration

Dashboard → **SQL Editor** → dán lần lượt **theo đúng thứ tự**:

1. `migrations/0001_init.sql` — hồ sơ, lớp, tiến độ học tập.
2. `migrations/0002_custom_content.sql` — nội dung tự soạn ở trang quản trị.
3. `migrations/0003_pgcrypto_search_path.sql`
4. `migrations/0004_admin_role.sql` — vai `admin`.
5. `migrations/0005_lock_profile_role.sql`

Hoặc dùng CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

**Không có migration nào mới cho bản Next.js.** Lược đồ giữ nguyên, kể cả dữ
liệu đang có. Vài thứ trong đó giờ không còn ai gọi tới - bảng `student_sessions`,
các hàm `claim_student()`, `list_class_roster()`, `set_student_pin()` - nhưng cứ
để yên: chúng vô hại, và giữ lại thì bộ kiểm chứng RLS vẫn chạy nguyên vẹn.

## 3. Điền biến môi trường

Dashboard → **Project Settings → API**. Chép `.env.example` thành `.env.local`
rồi điền:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # ô "service_role", KHÔNG phải "anon"
SESSION_SECRET=...                     # sinh bằng lệnh dưới đây
```

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Khoá `anon` không còn được dùng nữa.** Trước đây nó nằm trong gói JavaScript
gửi xuống trình duyệt và phân quyền trông cậy hoàn toàn vào RLS. Giờ cả ba giá
trị trên chỉ sống trong tiến trình Node; `src/server/` được chốt bằng
`import 'server-only'` nên lỡ tay nhập từ mã client là build hỏng ngay.

`SESSION_SECRET` ký cookie đăng nhập. Đổi chuỗi này là mọi người bị đăng xuất -
đó cũng chính là cách đá tất cả ra ngoài khi cần.

Thiếu biến nào thì route liên quan trả về đúng tên biến còn thiếu, không phải đi
mò log.

## 4. Tài khoản người lớn: admin tạo hộ

Giống app **Diet Plan** và **Training Plan**: người lớn nhận tài khoản từ quản
trị viên, và tài khoản tạo ra **đã xác nhận sẵn** nên cả luồng này KHÔNG gửi lá
thư nào.

Chỗ đặt mã giờ cũng giống hai app kia luôn. Chúng là Next.js nên có sẵn máy chủ,
và việc này nằm ở `app/api/admin/users/route.ts`. App này bây giờ cũng vậy - xem
`app/api/admin/users/` và `src/server/accounts.ts`. Bản trước app là trang tĩnh,
không có máy chủ nào, nên đoạn mã ấy phải sống nhờ trong một Edge Function viết
bằng Deno và deploy riêng. Nó đã bị xoá.

### 4.1 Phong quản trị viên đầu tiên

Con gà và quả trứng: chưa có admin nào thì không ai tạo được tài khoản. Gỡ bằng
tay đúng một lần ở SQL Editor, sau khi bạn đã có một tài khoản:

```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'dia-chi-cua-ban@example.com'
);
```

### 4.2 Dùng

Đăng nhập → app tự đưa bạn vào `/admin` → tab **🔑 Tài khoản**. Điền tên và
email, bấm Tạo tài khoản, **mật khẩu hiện ngay trên màn hình** - chép rồi đưa cho
người ta qua Zalo hay đọc trực tiếp.

Mật khẩu chỉ hiện **một lần**. Mất thì bấm "Đặt lại mật khẩu" để sinh cái khác;
không có cách nào xem lại cái cũ, và đó là điều đúng đắn.

Ai làm được gì:

| | Tạo phụ huynh | Tạo giáo viên / quản trị | Đặt lại mật khẩu | Sửa / xoá tài khoản |
|---|---|---|---|---|
| Quản trị | ✓ | ✓ | ✓ | ✓ |
| Giáo viên | ✓ | ✕ (xin vai gì cũng ra phụ huynh) | ✕ | ✕ |
| Còn lại | ✕ | ✕ | ✕ | ✕ |

Hai cái chốt cuối cùng luôn đứng đó: không ai tự bỏ quyền quản trị của chính
mình, và **quản trị viên cuối cùng** không bị hạ vai hay xoá - nếu không thì gỡ
ra lại phải mở SQL Editor.

## 5. Không cần SMTP nữa

Cả một chương dài về Brevo, khoá SMTP, hạn ngạch 30 thư/giờ và địa chỉ quay về
đã được xoá khỏi tài liệu này, vì app không còn gửi lá thư nào:

| Việc | Trước | Bây giờ |
|---|---|---|
| Đăng ký | thư xác nhận | tạo xong là dùng được ngay |
| Quên mật khẩu | liên kết gửi qua thư | quản trị viên đặt lại hộ, hiện ngay trên màn hình |
| Admin tạo tài khoản | (vốn đã không gửi thư) | không đổi |
| Đổi mật khẩu | qua liên kết trong thư | tự đổi, nhập lại mật khẩu cũ |

Đây là thứ hỏng thường xuyên nhất của bản trước, và nó hỏng vào đúng lúc tệ
nhất - lúc một cô giáo đang cần vào tài khoản. Lối "quản trị viên đặt lại hộ"
vốn đã có sẵn, nhanh hơn, và không phụ thuộc vào ai ngoài trường.

Cái mất: người dùng không tự phục hồi được tài khoản khi không liên lạc được với
quản trị viên. Với một trường thì đó là đánh đổi đúng; nếu sau này bán cho người
dùng lẻ thì phải dựng lại luồng gửi thư, và lúc đó nó sẽ nằm ở `src/server/`
chứ không phải trong bảng điều khiển của Supabase.

## Mô hình phân quyền

Luật này giờ sống ở **hai nơi, nói cùng một điều**:

1. `src/server/guard.ts` - nơi VIẾT luật. TypeScript, đọc được, test được ở
   `src/server/guard.test.ts`.
2. `migrations/*.sql` (RLS) - **lớp phòng thủ thứ hai**. Không còn ai dựa vào nó
   để chạy, nhưng nếu khoá `anon` có lọt ra ngoài thì nó vẫn đứng đó.

| Vai trò | Thấy gì | Sửa được gì |
|---|---|---|
| Phụ huynh | Chỉ con mình | Toàn bộ dữ liệu của con mình |
| Giáo viên | Học sinh trong lớp mình | **Không gì cả** — chỉ xem |
| Trẻ (máy chung) | Đúng hồ sơ của mình | Dữ liệu học tập của mình |

Bảng `attempts` là **chỉ-thêm**: quyền `update`/`delete` đã bị thu hồi, không ai
sửa ngược được nhật ký học tập.

## Bảo vệ dữ liệu trẻ em

Thiết kế bám Nghị định 13/2023:

- Trẻ **không có email, không có mật khẩu, không tự tạo tài khoản**.
- Dữ liệu duy nhất về trẻ: tên hiển thị, emoji đại diện, khối lớp, kết quả học
  tập. Không ngày sinh, không ảnh thật, không thông tin liên lạc, không chat.
- Mã PIN được băm bằng bcrypt **trên máy chủ Node** (`bcryptjs`), không bao giờ
  lưu dạng thô. Cùng thuật toán và cùng định dạng `$2a$...` với `crypt()` của
  pgcrypto trước đây, nên **mã PIN đã đặt từ trước vẫn đăng nhập được** - không
  phải bắt cả trường đặt lại.
- Hồ sơ mới **không có mã PIN mặc định**. Chưa đặt mã thì chưa dùng được trên máy
  dùng chung — mã mặc định kiểu `0000` mà không ai đổi còn tệ hơn không có.
- `POST /api/auth/roster` chỉ trả về tên + emoji + khối lớp, không kèm bất kỳ kết
  quả học tập nào, vì nó chạy trước khi trẻ nhập mã PIN.
- Sai mã PIN, hồ sơ không tồn tại, hồ sơ chưa đặt mã: **một câu trả lời duy
  nhất**. Tách ra thì lời báo lỗi trở thành công cụ dò.

**Phiên của trẻ sống 12 tiếng**, của người lớn 30 ngày. Máy tính bảng ở lớp
truyền tay nhau; một phiên sống qua đêm nghĩa là sáng hôm sau em khác cầm máy lên
và đang ở trong hồ sơ của bạn mình.

**Mã lớp là thông tin nhạy cảm**: ai có mã sẽ xem được danh sách tên và emoji của
lớp đó. Vẫn cần mã PIN mới vào được hồ sơ, nhưng đừng dán mã lớp nơi công cộng.

## Kiểm chứng

```bash
npx vitest run supabase          # 67 test RLS trên Postgres thật (PGlite, WASM)
npx vitest run src/server        # luật phân quyền trong TypeScript
```

Không cần Docker, không cần kết nối mạng tới Supabase.

## Nội dung tự soạn đi tới đâu

Bảng ở `0002_custom_content.sql` thuộc về **người lớn**, khác mọi bảng còn lại:

| Người | Đọc được nội dung của ai |
|---|---|
| Chính người soạn | Của mình, trên mọi máy mình đăng nhập |
| Học sinh | Của bố mẹ tạo hồ sơ cho mình, và của giáo viên dạy lớp mình |
| Người lớn khác | **Không gì cả** — kể cả giáo viên dạy con họ |

Nội dung soạn cho lớp là để **học sinh** dùng, không phải để phụ huynh khác chép
về. Luật này nằm ở `src/server/content.ts` (hàm `readableOwners`) và vẫn được
chạy thử trên Postgres thật ở `tests/content-rls.test.ts`.

Ghi thì chỉ chính người soạn, và `owner_id` do **máy chủ đóng dấu** chứ không lấy
từ thứ trình duyệt gửi lên - tin client nghĩa là một cô giáo đẩy được bài dưới
tên đồng nghiệp.

### Vì sao chia thành từng dòng

Cô giáo soạn mười câu trên laptop buổi tối, sáng hôm sau sửa thêm trên máy tính
bảng ở lớp. Nếu cả bộ nội dung là một khối JSON thì máy nào gửi sau sẽ ghi đè máy
kia — mất trắng một buổi tối mà không ai được báo. Mỗi câu một dòng, có `id` và
`updated_at`, thì hai máy hợp nhất được.

Đây cũng là lý do **nội dung tự soạn là thứ duy nhất còn giữ luật hợp nhất** sau
khi tầng đồng bộ offline bị gỡ bỏ: nó sống trong kho cục bộ để trang quản trị sửa
được ngay không phải chờ mạng, nên hai bên vẫn có thể lệch nhau. Dữ liệu học tập
của trẻ thì không - nó ghi thẳng qua `/api`.

Xoá thì đánh dấu `deleted_at` chứ không xoá hẳn: xoá hẳn thì lần đồng bộ sau máy
kia lại đẩy câu đó quay về. Dòng đã đánh dấu được dọn sau 90 ngày bằng
`purge_custom_tombstones()` — gọi định kỳ qua pg_cron nếu muốn, không gọi cũng
không sao.
