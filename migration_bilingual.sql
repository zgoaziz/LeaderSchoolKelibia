-- Add Arabic fields to formations
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS description_ar text;

-- Add Arabic field to formation_items
ALTER TABLE public.formation_items
  ADD COLUMN IF NOT EXISTS name_ar text;

-- Add Arabic fields to gallery_items
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS subtitle_ar text;
