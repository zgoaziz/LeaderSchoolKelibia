-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.subject_teachers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id)  ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id)  ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (subject_id, teacher_id)
);

-- RLS
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_subject_teachers"
  ON public.subject_teachers FOR ALL
  TO service_role USING (true) WITH CHECK (true);
