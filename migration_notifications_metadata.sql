-- Add metadata column to notifications if it doesn't exist
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
