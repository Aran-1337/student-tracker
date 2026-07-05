-- 1. Create Teachers Table
create table if not exists public.teachers (
    id uuid references auth.users(id) on delete cascade primary key,
    name text not null,
    monthly_price numeric not null default 100,
    book_1_price numeric not null default 50,
    book_2_price numeric not null default 50,
    created_at timestamp with time zone default now() not null
);

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
    group_id uuid references public.groups(id) on delete set null, -- ON DELETE SET NULL as requested
    name text not null,
    months jsonb not null default '[false, false, false, false, false, false, false, false, false, false, false, false]'::jsonb, -- 12 booleans
    book_1 boolean not null default false,
    book_2 boolean not null default false,
    created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.teachers enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;

-- RLS Policies for Teachers Table
create policy "Allow select own profile" on public.teachers
    for select using (id = auth.uid());

create policy "Allow insert own profile" on public.teachers
    for insert with check (id = auth.uid());

create policy "Allow update own profile" on public.teachers
    for update using (id = auth.uid());

-- RLS Policies for Groups Table
create policy "Teachers can manage their own groups" on public.groups
    for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- RLS Policies for Students Table
create policy "Teachers can manage their own students" on public.students
    for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Automatic Profile Creation Trigger on Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.teachers (id, name)
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1),
            'معلم جديد'
        )
    );
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it already exists to avoid errors
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Migration for existing tables:
alter table public.teachers 
add column if not exists monthly_price numeric not null default 100,
add column if not exists book_1_price numeric not null default 50,
add column if not exists book_2_price numeric not null default 50;

alter table public.groups
add column if not exists is_private boolean not null default false;

-- 4. Create Bills Table (if not exists)
create table if not exists public.bills (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    title text not null,
    amount numeric not null check (amount >= 0),
    category text not null check (category in ('إيجار', 'رواتب سكرتارية', 'أخرى')),
    billing_month integer not null check (billing_month >= 1 and billing_month <= 12),
    created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.bills enable row level security;

-- RLS Policies
drop policy if exists "Teachers can manage their own bills" on public.bills;
create policy "Teachers can manage their own bills"
    on public.bills for all
    using (teacher_id = auth.uid())
    with check (teacher_id = auth.uid());
