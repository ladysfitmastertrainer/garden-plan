-- =============================================================================
-- Vai trò ADMIN: người tạo tài khoản cho người khác.
--
-- Vì sao cần: app này là trang tĩnh, không có máy chủ, nên người lớn phải tự
-- đăng ký - mà tự đăng ký thì phụ thuộc vào thư xác nhận, và thư thì phụ thuộc
-- vào một dịch vụ bên ngoài. Trường học không cần cái vòng đó: nhà trường biết
-- rõ ai là giáo viên của mình.
--
-- Mô hình bê từ app Diet Plan: một cột `role` có thêm giá trị 'admin', và người
-- mang vai đó tạo tài khoản hộ người khác. Tài khoản tạo ra ĐÃ XÁC NHẬN SẴN, mật
-- khẩu sinh ngẫu nhiên và hiện thẳng trên màn hình admin - không lá thư nào phải
-- gửi đi cả.
--
-- Việc tạo tài khoản KHÔNG làm ở đây. Nó cần khoá `service_role`, thứ tuyệt đối
-- không được nằm trong trình duyệt, nên chạy trong Edge Function
-- `supabase/functions/admin-users`. Migration này chỉ mở đường cho vai trò đó tồn
-- tại và cho mọi người kiểm tra được ai đang mang nó.
-- =============================================================================

-- Nới ràng buộc để nhận thêm 'admin'. Ràng buộc cũ mang tên do Postgres tự đặt
-- khi khai `check (...)` ngay trên cột, nên phải tìm đúng tên rồi mới bỏ được.
do $do$
declare
  v_name text;
begin
  select con.conname into v_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public'
     and rel.relname = 'profiles'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%role%';

  if v_name is not null then
    execute format('alter table public.profiles drop constraint %I', v_name);
  end if;
end $do$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('parent', 'teacher', 'admin'));

/*
  Người đang đăng nhập có phải admin không?

  `security definer` để hàm đọc được bảng `profiles` bất kể RLS - nếu không thì
  chính policy của `profiles` lại gọi vào đây và sinh đệ quy. Chỉ trả về đúng một
  giá trị đúng/sai, không lộ thêm gì.
*/
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
$$;

grant execute on function public.is_admin() to authenticated;

/*
  Admin ĐỌC được danh sách hồ sơ người lớn, để có cái mà quản lý.

  Cố ý chỉ mở phần ĐỌC, và chỉ trên bảng `profiles` - tức tên và vai trò. Không
  mở gì thêm trên dữ liệu học tập của trẻ: quản lý tài khoản người lớn không phải
  là lý do để xem điểm của con nhà người ta.
*/
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles
  for select using (public.is_admin());

-- --- Phong admin đầu tiên ------------------------------------------------------
--
-- Không có admin nào thì không ai tạo được tài khoản, kể cả admin. Con gà và quả
-- trứng này phải gỡ bằng tay đúng MỘT lần, ngay tại SQL Editor:
--
--   update public.profiles set role = 'admin' where id = (
--     select id from auth.users where email = 'dia-chi-cua-ban@example.com'
--   );
--
-- Cố ý không tự phong cho ai: một dòng "email này thì thành admin" nằm trong
-- migration là thứ sẽ theo repo đi khắp nơi.
