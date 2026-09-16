# Dựng Supabase

App này là một **máy chủ Next.js** đứng trước một **database Postgres của
Supabase**. Trình duyệt không nói chuyện với Supabase: nó gọi `/api` trên chính
tên miền của app, và máy chủ Node là thứ duy nhất cầm khoá vào database.

Nghĩa là Supabase ở đây còn đóng ba vai: **Postgres**, **kho mật khẩu**, và
**nơi gửi thư đặt lại mật khẩu**. Không còn Edge Function, và không cần bật đăng
nhập ẩn danh.

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
APP_URL=https://<địa-chỉ-thật>        # không bắt buộc khi chạy máy local
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

`APP_URL` chỉ dùng để dựng liên kết trong thư đặt lại mật khẩu. Chạy máy local
thì bỏ trống cũng được - máy chủ lấy theo địa chỉ của yêu cầu. Nhưng khi đã lên
máy chủ thật thì nên khai: đứng sau một reverse proxy, yêu cầu tới nơi thường
mang `http` và tên máy nội bộ, và liên kết trong thư sẽ trỏ về một địa chỉ không
ai mở được.

Thiếu biến bắt buộc nào thì route liên quan trả về đúng tên biến còn thiếu, không
phải đi mò log.

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

### 4.3 Tự đăng ký vẫn mở

Người lớn vẫn tự đăng ký được ở màn hình đăng nhập, và **tự chọn phụ huynh hay
giáo viên** - mỗi người một tài khoản riêng, chính họ biết mình là ai. Đăng ký
xong vào được ngay, không có thư xác nhận nào.

Vai `admin` thì **không** ra được từ đó, và đây là ranh giới duy nhất còn lại:
quản trị viên xoá được tài khoản người khác cùng toàn bộ hồ sơ trẻ thuộc về họ.
Máy chủ hạ mọi giá trị lạ xuống `parent` (`app/api/auth/signup/route.ts`), nên có
sửa biểu mẫu trong DevTools cũng không tự phong mình lên được.

Muốn một trường đóng hẳn, chỉ cấp tài khoản từ trên xuống, thì bỏ nút "Chưa có
tài khoản? Đăng ký" trong `src/features/auth/AuthScreen.tsx` và chặn
`/api/auth/signup` - lúc đó bảng ở 4.2 là đường duy nhất tạo tài khoản.

## 5. Cắm máy chủ thư (SMTP): dùng Brevo

**Chỉ có ĐÚNG MỘT luồng cần tới thư: "Quên mật khẩu".** Đăng ký không gửi thư
(tài khoản tạo ra đã xác nhận sẵn), admin tạo tài khoản hộ cũng không. Nhưng cái
luồng duy nhất ấy lại là lúc người ta đang mắc kẹt ngoài cửa, nên nó cần chạy.

Supabase có sẵn một đường gửi thư dùng chung, nhưng đó là hạ tầng để chạy thử:
vài lá một giờ cho cả dự án, không hơn. Một lớp có hai phụ huynh quên mật khẩu
cùng buổi tối là hết lượt.

### Vì sao không dùng Gmail

Đã thử và đã hỏng. Gmail gửi được khi `nodemailer` gọi thẳng từ máy mình — app
Diet Plan làm thế và chạy tốt — nhưng Supabase gọi thì trả `Error sending
recovery email`. Lý do nằm ở bản chất hai cái cổng khác nhau: `smtp.gmail.com`
là hộp thư CÁ NHÂN, Google canh chừng từng phiên đăng nhập lạ, còn Supabase gửi
từ máy chủ của họ ở một quốc gia khác và không có cách nào trả lời thử thách bảo
mật. Chính Supabase cũng cảnh báo ngay trên màn hình: *"the SMTP provider you
entered is designed for sending personal rather than transactional email"*.

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
npm run smtp-check -- email-cua-mot-tai-khoan-co-that@truong.edu.vn
```

Kịch bản này gọi đúng đường mà `/api/auth/forgot` gọi rồi đọc câu trả lời của
Supabase, nên nó phân biệt được ba tình huống mà nhìn bằng mắt hay nhầm vào nhau:
gửi được, **hạn ngạch**, và **SMTP hỏng**.

Email đưa vào phải là tài khoản **có thật**. Với địa chỉ lạ, Supabase cố tình trả
về "thành công" mà chẳng gửi gì, để người ngoài không dò được ai đã đăng ký — app
cũng làm y như vậy, xem `app/api/auth/forgot/route.ts`.

### Khi thư vào mục spam

Địa chỉ gửi kết thúc bằng `@gmail.com` thì thư đi qua Brevo vẫn tới, nhưng dễ
rơi vào spam: Gmail công bố cho cả thế giới biết thư gmail.com phải xuất phát từ
máy chủ của Google, mà lá này thì không. Đó là chuyện uy tín người gửi, không
phải cấu hình sai. Muốn sạch hẳn thì dùng một tên miền riêng và khai ba bản ghi
DNS Brevo đưa cho (**Domains → Authenticate**).

### Vẫn còn lối thứ hai

Kể cả khi hệ thống thư hỏng hoàn toàn, **quản trị viên đặt lại mật khẩu hộ** vẫn
chạy — nó không gửi thư nào, mật khẩu mới hiện thẳng trên màn hình. Màn "Quên mật
khẩu" nói điều đó ra ngay tại chỗ, chứ không đợi người dùng chờ hết một buổi tối
rồi mới biết.

## 6. Đặt đúng địa chỉ quay về

**Bước hay bị bỏ sót nhất**, và triệu chứng của nó rất dễ nhầm sang "thư không
tới": người dùng bấm liên kết trong thư, Supabase xác minh xong rồi trả họ về
**một địa chỉ chẳng có gì**.

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: địa chỉ thật của app, ví dụ `https://hocvientritue.vercel.app`.
- **Redirect URLs**: thêm mỗi dòng một cái. Đường dẫn `/dat-lai-mat-khau` là bắt
  buộc — đó là trang nhận liên kết:
  ```
  http://localhost:3000/dat-lai-mat-khau
  https://<địa-chỉ-thật-của-bạn>/dat-lai-mat-khau
  ```

Máy chủ đã truyền `redirectTo` trỏ về đúng trang đó, nhưng địa chỉ vẫn phải nằm
trong danh sách trên thì Supabase mới chịu dùng; không thì nó lẳng lặng rơi về
Site URL. Chính danh sách này — chứ không phải mã nguồn — là thứ chặn kẻ xấu bắt
Supabase gửi token sang một tên miền của họ.

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
