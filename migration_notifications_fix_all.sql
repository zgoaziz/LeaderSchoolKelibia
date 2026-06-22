-- Add ALL missing columns to notifications table at once
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS class_id  UUID  REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message   TEXT  NOT NULL DEFAULT '';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type      TEXT  NOT NULL DEFAULT 'info';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata  JSONB DEFAULT '{}';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
