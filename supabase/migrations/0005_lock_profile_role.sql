-- =============================================================================
-- Khoá cột `role`: không ai tự phong mình làm quản trị được.
--
-- LỖ HỔNG ĐÃ CÓ THẬT, và do chính `0004_admin_role.sql` mở ra.
--
-- `0001_init.sql` cho mỗi người toàn quyền trên hồ sơ của chính mình:
--
--   create policy profiles_self on public.profiles
--     for all using (id = auth.uid()) with check (id = auth.uid());
--
-- Lúc đó vô hại: 'parent' và 'teacher' có quyền gần như nhau, đổi qua lại cũng
-- chẳng được thêm gì. Nhưng 0004 biến 'admin' thành quyền THẬT - tạo tài khoản,
-- đặt lại mật khẩu người khác - nên đúng câu policy cũ ấy trở thành một nút bấm
-- "tự phong quản trị" cho bất kỳ ai đăng nhập được.
--
-- Đã kiểm chứng trên dự án thật: một tài khoản 'teacher' chạy
--   update profiles set role = 'admin' where id = auth.uid()
-- và thành công.
--
-- Cách sửa: quyền theo CỘT, không phải theo hàng. RLS chỉ lọc được hàng nào đọc
-- ghi được; nó không nói được "hàng này sửa được nhưng riêng cột kia thì không".
--
-- LƯU Ý về cách Postgres tính quyền cột: `revoke update (role)` KHÔNG trừ được
-- gì khi người ta đang có quyền `update` ở mức BẢNG - quyền bảng phủ mọi cột, và
-- lệnh thu hồi cột chỉ gỡ phần cấp riêng theo cột. Phải thu hồi ở mức bảng
-- trước, rồi cấp lại đúng những cột được phép. Bản đầu của migration này viết
-- thiếu vế đầu nên chẳng chặn được gì, và bộ test đã bắt đúng chỗ đó.
--
-- `service_role` không bị ảnh hưởng: Edge Function `admin-users` vẫn đặt vai trò
-- được, và SQL Editor cũng vậy. Chỉ client mang JWT người dùng là bị chặn.
-- =============================================================================

-- Bỏ quyền ghi ở mức bảng...
revoke update, insert, delete on public.profiles from authenticated, anon;

-- ...rồi cấp lại đúng một cột người ta có việc phải sửa.
grant update (display_name) on public.profiles to authenticated;

-- Không cấp lại `insert` và `delete` cho ai cả:
--   * hồ sơ do trigger `handle_new_user` dựng, chạy bằng quyền chủ bảng nên
--     không dính lệnh thu hồi ở trên;
--   * Edge Function `admin-users` ghi bằng `service_role`, cũng không dính;
--   * còn client thì không có việc gì phải tự chèn hay xoá hồ sơ - cho phép chỉ
--     mở ra đường vòng: xoá hồ sơ của mình rồi chèn lại cái mang vai 'admin'.

/*
  Thắt lại chính sách cho khớp với quyền cột.

  `for all` gộp cả xoá vào, mà xoá thì vừa bị thu hồi ở trên - để nguyên thì
  policy nói một đằng, quyền nói một nẻo, và người đọc mã sau này phải tự đoán
  cái nào đang có hiệu lực.
*/
drop policy if exists profiles_self on public.profiles;

create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());

create policy profiles_self_insert on public.profiles
  for insert with check (id = auth.uid());

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
