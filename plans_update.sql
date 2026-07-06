-- ============================================================
-- إضافة جدول خطط الاشتراك (Plans) - نقل من الـ Local Storage
-- يرجى تشغيل هذا السكريبت في Supabase -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plans (
    id text primary key,
    name text not null,
    description text,
    price integer not null default 0,
    duration_months integer not null default 1,
    has_bills boolean not null default false,
    has_attendance boolean not null default false,
    has_center_mode boolean not null default false,
    color text not null default '#8b5cf6',
    is_active boolean not null default true,
    created_at timestamp with time zone default now() not null
);

-- سياسات الأمان (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة الباقات
DROP POLICY IF EXISTS "Anyone can read plans" ON public.plans;
CREATE POLICY "Anyone can read plans" ON public.plans
    FOR SELECT USING (true);

-- السماح للمديرين فقط بالتعديل والإضافة والحذف
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
