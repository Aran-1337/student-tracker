-- ============================================================
-- تفعيل نظام السنتر التعليمي - تحديث قاعدة البيانات
-- يرجى تشغيل هذا السكريبت في Supabase -> SQL Editor
-- ============================================================

-- 1. إضافة الأعمدة المفقودة لجدول المعلمين (لتصحيح أخطاء سابقة إن وجدت)
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS has_bills_feature boolean not null default true;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS has_attendance_feature boolean not null default true;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone default (now() + interval '1 year') not null;

-- 2. إضافة ميزة السنتر لجدول المعلمين
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS is_center_mode boolean not null default false;

-- 3. إنشاء جدول المعلمين الفرعيين (التابعين للسنتر)
CREATE TABLE IF NOT EXISTS public.sub_teachers (
    id uuid primary key default gen_random_uuid(),
    center_id uuid references public.teachers(id) on delete cascade not null,
    name text not null,
    created_at timestamp with time zone default now() not null
);

-- 4. ربط المجموعات بالمعلمين الفرعيين
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS sub_teacher_id uuid references public.sub_teachers(id) on delete set null;

-- 5. تفعيل سياسات الأمان للمعلمين الفرعيين
ALTER TABLE public.sub_teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Centers can manage their own sub teachers" ON public.sub_teachers;
CREATE POLICY "Centers can manage their own sub teachers" ON public.sub_teachers
    FOR ALL USING (center_id = auth.uid() OR public.is_admin(auth.uid()))
    WITH CHECK (center_id = auth.uid() OR public.is_admin(auth.uid()));
