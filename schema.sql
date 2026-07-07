-- ============================================================
-- FULL SCHEMA — Student Tracker SaaS
-- شغّل هذا الملف كاملاً في Supabase → SQL Editor
-- ============================================================

-- 1. جدول المعلمين
create table if not exists public.teachers (
    id uuid references auth.users(id) on delete cascade primary key,
    name text not null,
    email text,
    is_admin boolean not null default false,
    is_active boolean not null default true,
    has_bills_feature boolean not null default true,
    has_attendance_feature boolean not null default true,
    subscription_expires_at timestamp with time zone default (now() + interval '1 year') not null,
    monthly_price numeric not null default 100,
    book_1_price numeric not null default 50,
    book_2_price numeric not null default 50,
    created_at timestamp with time zone default now() not null
);

-- دالة مساعدة للتحقق من صلاحيات الأدمن بدون تكرار RLS
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from public.teachers 
        where id = user_id and is_admin = true
    );
end;
$$ language plpgsql security definer;

-- 3. جدول السنين الدراسية (Grades)
create table if not exists public.grades (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    name text not null,
    start_code integer not null default 1,
    created_at timestamp with time zone default now() not null
);

-- 4. جدول المجموعات
create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    grade_id uuid references public.grades(id) on delete set null,
    name text not null,
    day_of_week text not null check (day_of_week in ('السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة')),
    time time not null,
    is_private boolean not null default false,
    sessions_per_month integer not null default 8,
    created_at timestamp with time zone default now() not null
);

-- 5. جدول الطلاب
create sequence if not exists public.student_code_seq start 1;

create table if not exists public.students (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    group_id uuid references public.groups(id) on delete set null,
    name text not null,
    code text unique,
    months jsonb not null default '[false, false, false, false, false, false, false, false, false, false, false, false]'::jsonb,
    book_1 boolean not null default false,
    book_2 boolean not null default false,
    created_at timestamp with time zone default now() not null
);

-- دالة التوليد التلقائي للكود بناءً على السنة الدراسية
create or replace function public.generate_student_code_by_grade()
returns trigger as $$
declare
    v_grade_id uuid;
    v_start_code integer;
    v_max_code integer;
begin
    if new.code is null then
        select grade_id into v_grade_id from public.groups where id = new.group_id;
        if v_grade_id is not null then
            select start_code into v_start_code from public.grades where id = v_grade_id;
            
            select max(cast(nullif(regexp_replace(s.code, '\D', '', 'g'), '') as integer))
            into v_max_code
            from public.students s
            join public.groups g on s.group_id = g.id
            where g.grade_id = v_grade_id;
            
            if v_max_code is null or v_max_code < v_start_code then
                new.code := v_start_code::text;
            else
                new.code := (v_max_code + 1)::text;
            end if;
        else
            new.code := (nextval('public.student_code_seq'))::text;
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trg_generate_student_code
before insert on public.students
for each row
execute function public.generate_student_code_by_grade();

-- 4. جدول الفواتير والمصروفات
create table if not exists public.bills (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    title text not null,
    amount numeric not null check (amount >= 0),
    category text not null check (category in ('إيجار', 'رواتب سكرتارية', 'أخرى')),
    billing_month integer not null check (billing_month >= 1 and billing_month <= 12),
    is_recurring boolean not null default false,
    created_at timestamp with time zone default now() not null
);

-- 5. جدول الأدمنز المرخصين
create table if not exists public.admins (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    created_at timestamp with time zone default now() not null
);

-- 6. جدول سجلات الحضور والغياب
create table if not exists public.attendance_records (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    student_id uuid references public.students(id) on delete cascade not null,
    group_id uuid references public.groups(id) on delete set null,
    session_number integer not null check (session_number >= 1),
    month integer not null check (month between 1 and 12),
    year integer not null,
    status text not null default 'present'
        check (status in ('present', 'absent', 'late', 'excused')),
    scanned_by_qr boolean not null default false,
    created_at timestamptz default now(),
    unique (student_id, session_number, month, year)
);

-- ============================================================
-- تفعيل Row Level Security
-- ============================================================
alter table public.teachers enable row level security;
alter table public.grades enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.bills enable row level security;
alter table public.admins enable row level security;
alter table public.attendance_records enable row level security;

-- ============================================================
-- سياسات الأمان (RLS Policies)
-- ============================================================

-- Grades
drop policy if exists "Teachers can manage their own grades or admin manage" on public.grades;
create policy "Teachers can manage their own grades or admin manage" on public.grades
    for all using (teacher_id = auth.uid() or public.is_admin(auth.uid()))
    with check (teacher_id = auth.uid() or public.is_admin(auth.uid()));

-- Teachers
drop policy if exists "Allow select own profile or admin view" on public.teachers;
create policy "Allow select own profile or admin view" on public.teachers
    for select using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Allow insert own profile" on public.teachers;
create policy "Allow insert own profile" on public.teachers
    for insert with check (id = auth.uid());

drop policy if exists "Allow update own profile or admin update" on public.teachers;
create policy "Allow update own profile or admin update" on public.teachers
    for update using (id = auth.uid() or public.is_admin(auth.uid()))
    with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Allow admin delete teachers" on public.teachers;
create policy "Allow admin delete teachers" on public.teachers
    for delete using (public.is_admin(auth.uid()));

-- Groups
drop policy if exists "Teachers can manage their own groups or admin manage" on public.groups;
create policy "Teachers can manage their own groups or admin manage" on public.groups
    for all using (teacher_id = auth.uid() or public.is_admin(auth.uid()))
    with check (teacher_id = auth.uid() or public.is_admin(auth.uid()));

-- Students
drop policy if exists "Teachers can manage their own students or admin manage" on public.students;
create policy "Teachers can manage their own students or admin manage" on public.students
    for all using (teacher_id = auth.uid() or public.is_admin(auth.uid()))
    with check (teacher_id = auth.uid() or public.is_admin(auth.uid()));

-- Bills
drop policy if exists "Teachers can manage their own bills or admin manage" on public.bills;
create policy "Teachers can manage their own bills or admin manage" on public.bills
    for all using (teacher_id = auth.uid() or public.is_admin(auth.uid()))
    with check (teacher_id = auth.uid() or public.is_admin(auth.uid()));

-- Admins
drop policy if exists "Admins can manage admin list" on public.admins;
create policy "Admins can manage admin list" on public.admins
    for all using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));

-- Attendance Records
drop policy if exists "teacher_own_attendance" on public.attendance_records;
create policy "teacher_own_attendance" on public.attendance_records
    for all using (teacher_id = auth.uid())
    with check (teacher_id = auth.uid());

-- ============================================================
-- Trigger: إنشاء ملف المعلم تلقائياً عند التسجيل
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
    v_is_admin boolean := false;
begin
    select exists (
        select 1 from public.admins where email = new.email
    ) into v_is_admin;

    insert into public.teachers (id, name, email, is_admin)
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1),
            'معلم جديد'
        ),
        new.email,
        v_is_admin
    );
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ============================================================
-- Trigger: مزامنة صلاحيات الأدمن عند تغيير قائمة الإيميلات
-- ============================================================
create or replace function public.handle_admin_email_change()
returns trigger as $$
begin
    if (TG_OP = 'INSERT') then
        update public.teachers set is_admin = true where email = new.email;
        return new;
    elsif (TG_OP = 'DELETE') then
        if (old.email = '3bdeniovlr@gmail.com') then
            return old;
        end if;
        update public.teachers set is_admin = false where email = old.email;
        return old;
    end if;
    return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_admin_email_change on public.admins;
create trigger on_admin_email_change
    after insert or delete on public.admins
    for each row execute procedure public.handle_admin_email_change();

-- ============================================================
-- بيانات البذر: ترخيص الأدمن الرئيسي
-- ============================================================
insert into public.admins (email) 
values ('3bdeniovlr@gmail.com')
on conflict (email) do nothing;

update public.teachers 
set is_admin = true 
where email = '3bdeniovlr@gmail.com';
