-- Fix notifications table: add missing columns
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info';

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';
