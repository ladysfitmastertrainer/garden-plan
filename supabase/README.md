# Dựng Supabase

App **chạy được mà không cần Supabase** — bỏ trống `.env.local` là vào chế độ
offline hoàn toàn, lưu trên máy. Chỉ làm phần này khi cần nhiều thiết bị, nhiều
lớp học hoặc màn hình theo dõi của phụ huynh / giáo viên.

## 1. Tạo dự án

Vào [supabase.com](https://supabase.com) → New project. Chọn region gần Việt Nam
(Singapore) cho độ trễ thấp.

## 2. Chạy migration

Dashboard → **SQL Editor** → dán lần lượt **theo đúng thứ tự**:

1. `migrations/0001_init.sql` — hồ sơ, lớp, tiến độ học tập.
2. `migrations/0002_custom_content.sql` — nội dung tự soạn ở trang quản trị.

Hoặc dùng CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

## 3. Bật đăng nhập ẩn danh

Dashboard → **Authentication → Providers → Anonymous Sign-ins** → bật.

Trẻ dùng máy chung ở lớp cần phiên ẩn danh để gọi được `claim_student()`. Không
bật thì luồng "mã lớp + mã PIN" sẽ không hoạt động (luồng gia đình vẫn chạy bình
thường vì phụ huynh đăng nhập bằng email).

## 4. Tài khoản người lớn: admin tạo hộ, không tự đăng ký

Giống hệt app **Diet Plan** và **Training Plan**: người lớn không tự đăng ký, mà
quản trị viên tạo tài khoản cho họ và đưa mật khẩu. Tài khoản tạo ra **đã xác
nhận sẵn**, nên cả luồng này KHÔNG gửi lá thư nào và không phụ thuộc vào SMTP.

Khác biệt duy nhất so với hai app kia là chỗ đặt mã. Chúng là Next.js nên có sẵn
máy chủ, và việc này nằm ở `app/api/admin/users/route.ts`. App này là trang tĩnh,
không có máy chủ nào, nên đúng đoạn mã ấy ở trong
`supabase/functions/admin-users`. Cùng một thiết kế, cùng `auth.admin.createUser`,
cùng quy tắc "khoá service_role không bao giờ xuống trình duyệt".

### 4.1 Chạy migration vai trò

SQL Editor → chạy `migrations/0004_admin_role.sql`.

### 4.2 Triển khai hàm

Cách nhanh: Dashboard → **Edge Functions** → **Deploy a new function** → đặt tên
`admin-users` → dán toàn bộ `supabase/functions/admin-users/index.ts` → Deploy.

Hoặc bằng CLI:

```bash
supabase functions deploy admin-users
```

Không phải khai biến môi trường nào: Supabase tự cấp `SUPABASE_URL` và
`SUPABASE_SERVICE_ROLE_KEY` cho mọi Edge Function.

### 4.3 Phong quản trị viên đầu tiên

Con gà và quả trứng: chưa có admin nào thì không ai tạo được tài khoản. Gỡ bằng
tay đúng một lần ở SQL Editor, sau khi bạn đã có một tài khoản:

```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'dia-chi-cua-ban@example.com'
);
```

### 4.4 Dùng

Đăng nhập bằng tài khoản đó → mở `#admin` → tab **🔑 Tài khoản**. Điền tên và
email, bấm Tạo tài khoản, **mật khẩu hiện ngay trên màn hình** — chép rồi đưa cho
người ta qua Zalo hay đọc trực tiếp.

Mật khẩu chỉ hiện **một lần**. Mất thì bấm "Đặt lại mật khẩu" để sinh cái khác;
không có cách nào xem lại cái cũ, và đó là điều đúng đắn.

Ai làm được gì:

| | Tạo phụ huynh | Tạo giáo viên / quản trị | Đặt lại mật khẩu |
|---|---|---|---|
| Quản trị | ✓ | ✓ | ✓ |
| Giáo viên | ✓ | ✕ (xin vai gì cũng ra phụ huynh) | ✕ |
| Còn lại | ✕ | ✕ | ✕ |

## 5. Cắm máy chủ thư (SMTP): dùng Brevo

**Bỏ qua bước này là mọi thứ liên quan tới email đều hỏng khi có người thật
dùng.** Supabase có sẵn một đường gửi thư dùng chung, nhưng đó là hạ tầng để
chạy thử: vài lá một giờ cho cả dự án, không hơn. Đăng ký vài tài khoản giáo
viên là hết lượt.

### Vì sao không dùng Gmail nữa

Đã thử và đã hỏng. Gmail gửi được khi `nodemailer` gọi thẳng từ máy mình — app
Diet Plan làm thế và chạy tốt — nhưng Supabase gọi thì trả `Error sending
confirmation email`. Lý do nằm ở bản chất hai cái cổng khác nhau:
`smtp.gmail.com` là hộp thư CÁ NHÂN, Google canh chừng từng phiên đăng nhập lạ,
còn Supabase gửi từ máy chủ của họ ở một quốc gia khác và không có cách nào trả
lời thử thách bảo mật. Chính Supabase cũng cảnh báo ngay trên màn hình: *"the
SMTP provider you entered is designed for sending personal rather than
transactional email"*.

Brevo (tên cũ: Sendinblue) là cổng gửi thư GIAO DỊCH, sinh ra đúng cho việc này:
300 thư mỗi ngày miễn phí, không cần thẻ.

### 5.1 Lấy khoá SMTP ở Brevo

1. Lập tài khoản ở [brevo.com](https://www.brevo.com) (miễn phí).
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: điền địa chỉ
   sẽ đứng tên gửi, rồi mở hộp thư đó bấm xác nhận. Chưa xác nhận thì mọi lá thư
   đều bị từ chối.
3. Góc trên phải → tên tài khoản → **SMTP & API → SMTP**. Màn này cho hai thứ:
   - **Login**: dạng `8xxxxx001@smtp-brevo.com`
   - **SMTP key**: bấm *Generate a new SMTP key*, chuỗi bắt đầu bằng
     `xsmtpsib-...`. Nó chỉ hiện đúng một lần.

   Khoá SMTP **không phải** mật khẩu đăng nhập Brevo.

### 5.2 Điền vào Supabase

Dashboard → **Authentication → Emails → SMTP Settings** → bật *Enable Custom
SMTP*:

| Ô | Điền |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Login lấy ở bước 3 (`...@smtp-brevo.com`) |
| Password | SMTP key `xsmtpsib-...` |
| Sender email | đúng địa chỉ đã xác nhận ở bước 2 |
| Sender name | `Học Viện Trí Tuệ` |

Cổng 587 là STARTTLS — Brevo đỡ cả 587 lẫn 2525; đừng dùng 465.

### 5.3 Nới hạn ngạch

Dashboard → **Authentication → Rate Limits → Emails**. Mặc định Supabase chỉ cho
**30 thư/giờ** kể cả khi đã cắm SMTP riêng. Nâng lên cho khớp sức của Brevo
(300/ngày).

### 5.4 Thử

```bash
node scripts/smtp-check.mjs
```

Kịch bản này gọi đúng đường mà app gọi (`resetPasswordForEmail`) rồi đọc câu trả
lời của Supabase, nên nó phân biệt được ba tình huống mà nhìn bằng mắt hay nhầm
vào nhau: gửi được, **hạn ngạch**, và **SMTP hỏng**.

### Khi thư vào mục spam

Địa chỉ gửi kết thúc bằng `@gmail.com` thì thư đi qua Brevo vẫn tới, nhưng dễ
rơi vào spam: Gmail công bố cho cả thế giới biết thư gmail.com phải xuất phát từ
máy chủ của Google, mà lá này thì không. Đó là chuyện uy tín người gửi, không
phải cấu hình sai. Muốn sạch hẳn thì dùng một tên miền riêng và khai ba bản ghi
DNS Brevo đưa cho (**Domains → Authenticate**).

## 6. Đặt đúng địa chỉ quay về

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: địa chỉ thật của app (ví dụ `https://hocvientritue.vercel.app`).
  Mặc định là `http://localhost:3000` — sai, vì app này chạy ở cổng 5173.
- **Redirect URLs**: thêm mọi địa chỉ app chạy, mỗi dòng một cái:
  ```
  http://localhost:5173
  http://localhost:5174
  https://<địa-chỉ-thật-của-bạn>
  ```

Đây là bước hay bị bỏ sót nhất, và triệu chứng của nó rất dễ nhầm sang lỗi khác:
người dùng bấm "xác nhận email" trong thư, Supabase xác nhận xong rồi trả họ về
**một địa chỉ chẳng có gì** — nên quay lại app vẫn thấy như chưa làm gì.

Mã nguồn đã truyền `emailRedirectTo` trỏ về đúng trang đang mở, nhưng địa chỉ đó
vẫn phải nằm trong danh sách trên thì Supabase mới chịu dùng; không thì nó lẳng
lặng rơi về Site URL.

## 7. Điền biến môi trường

Dashboard → **Project Settings → API**, chép vào `.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Khoá `anon` là khoá công khai, để trong frontend là đúng thiết kế — phân quyền
thật nằm ở Row Level Security phía server.

## Mô hình phân quyền

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
- Mã PIN được băm bằng bcrypt phía server, không bao giờ lưu dạng thô.
- Hồ sơ mới **không có mã PIN mặc định**. Chưa đặt mã thì chưa dùng được trên
  máy dùng chung — mã mặc định kiểu `0000` mà không ai đổi còn tệ hơn không có.
- `list_class_roster()` chỉ trả về tên + emoji + khối lớp, không kèm bất kỳ kết
  quả học tập nào, vì nó chạy trước khi trẻ nhập mã PIN.

**Mã lớp là thông tin nhạy cảm**: ai có mã sẽ xem được danh sách tên và emoji
của lớp đó. Vẫn cần mã PIN mới vào được hồ sơ, nhưng đừng dán mã lớp nơi công
cộng.

## Kiểm chứng

`npm test` chạy 40 test RLS trên Postgres thật (PGlite, WASM) — migration được
thi hành rồi từng vai trò được đóng thử. Không cần Docker, không cần kết nối
mạng tới Supabase.

```bash
npx vitest run supabase
```

## Nội dung tự soạn đi tới đâu

Bảng ở `0002_custom_content.sql` thuộc về **người lớn**, khác mọi bảng còn lại:

| Người | Đọc được nội dung của ai |
|---|---|
| Chính người soạn | Của mình, trên mọi máy mình đăng nhập |
| Học sinh | Của bố mẹ tạo hồ sơ cho mình, và của giáo viên dạy lớp mình |
| Người lớn khác | **Không gì cả** — kể cả giáo viên dạy con họ |

Nội dung soạn cho lớp là để **học sinh** dùng, không phải để phụ huynh khác chép
về. Luật này chạy thử trên Postgres thật ở `tests/content-rls.test.ts`.

Ghi thì chỉ chính người soạn. Trẻ không bao giờ soạn được nội dung — các em không
có hồ sơ trong `profiles`, nên khoá ngoại chặn từ đầu.

### Vì sao chia thành từng dòng

Cô giáo soạn mười câu trên laptop buổi tối, sáng hôm sau sửa thêm trên máy tính
bảng ở lớp. Nếu cả bộ nội dung là một khối JSON thì máy nào gửi sau sẽ ghi đè máy
kia — mất trắng một buổi tối mà không ai được báo. Mỗi câu một dòng, có `id` và
`updated_at`, thì hai máy hợp nhất được.

Xoá thì đánh dấu `deleted_at` chứ không xoá hẳn: xoá hẳn thì lần đồng bộ sau máy
kia lại đẩy câu đó quay về. Dòng đã đánh dấu được dọn sau 90 ngày bằng
`purge_custom_tombstones()` — gọi định kỳ qua pg_cron nếu muốn, không gọi cũng
không sao.
