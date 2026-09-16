-- =============================================================================
-- Sửa đường tìm hàm băm mã PIN.
--
-- Triệu chứng: đặt mã PIN cho học sinh thì Postgres báo
--   function gen_salt(unknown) does not exist
-- và hệ quả là KHÔNG trẻ nào vào được máy dùng chung - chưa có mã PIN thì
-- `claim_student` từ chối ngay.
--
-- Nguyên nhân: `0001_init.sql` khai hai hàm với `set search_path = public`, còn
-- Supabase thì cài `pgcrypto` vào schema `extensions` chứ không phải `public`.
-- Đặt search_path hẹp như thế là đúng về mặt an toàn - nó chặn kiểu tấn công
-- chèn hàm giả vào schema tạm - nhưng hẹp quá thì chính hàm thật cũng không
-- thấy.
--
-- Cách sửa: thêm `extensions` vào search_path. Postgres bỏ qua schema không tồn
-- tại, nên câu lệnh này chạy được cả trên Supabase thật lẫn trên Postgres trần
-- (nơi pgcrypto nằm ở `public`) - và đó chính là điều bộ kiểm chứng RLS cần.
--
-- Vì sao bộ test không bắt được: `supabase/tests/harness.ts` cài pgcrypto vào
-- `public`, tức là dựng lại một môi trường DỄ HƠN thật. Đã sửa luôn ở đó để lần
-- sau sai kiểu này là test đỏ.
-- =============================================================================

create or replace function public.set_student_pin(p_student_id uuid, p_pin text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if p_pin !~ '^\d{4}$' then
    raise exception 'Mã PIN phải gồm đúng 4 chữ số';
  end if;

  if not exists (select 1 from public.students s where s.id = p_student_id and s.owner_id = auth.uid())
     and not exists (
       select 1 from public.class_members cm
       join public.classes c on c.id = cm.class_id
       where cm.student_id = p_student_id and c.teacher_id = auth.uid()
     ) then
    raise exception 'Không có quyền đặt mã PIN cho học sinh này';
  end if;

  update public.students
     set pin_hash = crypt(p_pin, gen_salt('bf'))
   where id = p_student_id;
end $$;

create or replace function public.claim_student(p_student_id uuid, p_pin text)
returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_ok boolean;
  v_has_pin boolean;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;

  select s.pin_hash is not null, (s.pin_hash = crypt(p_pin, s.pin_hash))
    into v_has_pin, v_ok
    from public.students s
   where s.id = p_student_id;

  -- Phân biệt rõ "chưa đặt mã" với "mã sai": thầy cô cần biết mình quên đặt mã,
  -- còn trẻ nhập sai thì chỉ nhận thông báo chung.
  if v_has_pin is false then
    raise exception 'Hồ sơ này chưa được đặt mã PIN. Thầy cô hoặc bố mẹ cần đặt mã trước.';
  end if;

  if v_ok is not true then
    -- Thông báo chung, không tiết lộ hồ sơ có tồn tại hay không.
    raise exception 'Mã PIN không đúng';
  end if;

  insert into public.student_sessions (user_id, student_id)
  values (auth.uid(), p_student_id)
  on conflict (user_id) do update set student_id = excluded.student_id;

  return p_student_id;
end $$;

-- `create or replace` giữ nguyên quyền cũ, nhưng cấp lại cho chắc: chạy migration
-- này trên một dự án dựng dở thì hai dòng dưới là thứ duy nhất đảm bảo client
-- gọi được hàm.
revoke all on function public.claim_student(uuid, text)   from public, anon;
revoke all on function public.set_student_pin(uuid, text) from public, anon;
grant execute on function public.claim_student(uuid, text)   to authenticated;
grant execute on function public.set_student_pin(uuid, text) to authenticated;
