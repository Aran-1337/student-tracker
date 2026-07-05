-- 1. Create Teachers Table
create table if not exists public.teachers (
    id uuid references auth.users(id) on delete cascade primary key,
    name text not null,
    email text,
    is_admin boolean not null default false,
    is_active boolean not null default true,
    has_bills_feature boolean not null default true,
    subscription_expires_at timestamp with time zone default (now() + interval '1 year') not null,
    monthly_price numeric not null default 100,
    book_1_price numeric not null default 50,
    book_2_price numeric not null default 50,
    created_at timestamp with time zone default now() not null
);

-- Helper function to check if a user is an admin without RLS recursion
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
    return exists (
        select 1 from public.teachers 
        where id = user_id and is_admin = true
    );
end;
$$ language plpgsql security definer;

-- 2. Create Groups Table
create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    name text not null,
    day_of_week text not null check (day_of_week in ('السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة')),
    time time not null,
    is_private boolean not null default false,
    created_at timestamp with time zone default now() not null
);

-- 3. Create Students Table
create table if not exists public.students (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    group_id uuid references public.groups(id) on delete set null,
    name text not null,
    months jsonb not null default '[false, false, false, false, false, false, false, false, false, false, false, false]'::jsonb,
    book_1 boolean not null default false,
    book_2 boolean not null default false,
    created_at timestamp with time zone default now() not null
);

-- 4. Create Bills Table
create table if not exists public.bills (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    title text not null,
    amount numeric not null check (amount >= 0),
    category text not null check (category in ('إيجار', 'رواتب سكرتارية', 'أخرى')),
    billing_month integer not null check (billing_month >= 1 and billing_month <= 12),
    created_at timestamp with time zone default now() not null
);

-- 5. Create Admin Emails Table
create table if not exists public.admins (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.teachers enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.bills enable row level security;
alter table public.admins enable row level security;

-- RLS Policies for Teachers Table
drop policy if exists "Allow select own profile" on public.teachers;
drop policy if exists "Allow select own profile or admin view" on public.teachers;
create policy "Allow select own profile or admin view" on public.teachers
    for select using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Allow insert own profile" on public.teachers;
create policy "Allow insert own profile" on public.teachers
    for insert with check (id = auth.uid());

drop policy if exists "Allow update own profile" on public.teachers;
drop policy if exists "Allow update own profile or admin update" on public.teachers;
create policy "Allow update own profile or admin update" on public.teachers
    for update using (id = auth.uid() or public.is_admin(auth.uid()))
    with check (id = auth.uid() or public.is_admin(auth.uid()));

-- RLS Policies for Groups Table
drop policy if exists "Teachers can manage their own groups" on public.groups;
drop policy if exists "Teachers can manage their own groups or admin manage" on public.groups;
create policy "Teachers can manage their own groups or admin manage" on public.groups
    for all using (teacher_id = auth.uid() or public.is_admin(auth.uid()))
    with check (teacher_id = auth.uid() or public.is_admin(auth.uid()));

-- RLS Policies for Students Table
drop policy if exists "Teachers can manage their own students" on public.students;
drop policy if exists "Teachers can manage their own students or admin manage" on public.students;
create policy "Teachers can manage their own students or admin manage" on public.students
    for all using (teacher_id = auth.uid() or public.is_admin(auth.uid()))
    with check (teacher_id = auth.uid() or public.is_admin(auth.uid()));

-- RLS Policies for Bills Table
drop policy if exists "Teachers can manage their own bills" on public.bills;
drop policy if exists "Teachers can manage their own bills or admin manage" on public.bills;
create policy "Teachers can manage their own bills or admin manage" on public.bills
    for all using (teacher_id = auth.uid() or public.is_admin(auth.uid()))
    with check (teacher_id = auth.uid() or public.is_admin(auth.uid()));

-- RLS Policies for Admins Table
drop policy if exists "Admins can manage admin list" on public.admins;
create policy "Admins can manage admin list" on public.admins
    for all using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));

-- Automatic Profile Creation Trigger on Auth Signup (with Auto-Admin logic)
create or replace function public.handle_new_user()
returns trigger as $$
declare
    v_is_admin boolean := false;
begin
    -- Auto-grant admin role if email is listed in admins table
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

-- Drop trigger if it already exists to avoid errors
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Trigger to sync is_admin on teachers when admin email list changes
create or replace function public.handle_admin_email_change()
returns trigger as $$
begin
    if (TG_OP = 'INSERT') then
        update public.teachers set is_admin = true where email = new.email;
        return new;
    elsif (TG_OP = 'DELETE') then
        -- Don't de-admin the primary master account
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

-- Seed primary master administrator email
insert into public.admins (email) 
values ('3bdeniovlr@gmail.com')
on conflict (email) do nothing;

-- Update existing teachers matching seed email to be admin
update public.teachers 
set is_admin = true 
where email = '3bdeniovlr@gmail.com';
