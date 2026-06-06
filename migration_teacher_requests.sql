-- ============================================================
-- Migration: Teacher absence/leave requests + present override
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Add 'present' type to schedule_overrides
ALTER TABLE schedule_overrides DROP CONSTRAINT IF EXISTS schedule_overrides_type_check;
ALTER TABLE schedule_overrides ADD CONSTRAINT schedule_overrides_type_check
  CHECK (type IN ('rattrapage', 'absent', 'cancelled', 'present'));

-- 2. Teacher absence / leave request table
CREATE TABLE IF NOT EXISTS teacher_absence_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  slot_id      UUID REFERENCES schedule_slots(id) ON DELETE SET NULL,
  class_id     UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject_id   UUID REFERENCES subjects(id) ON DELETE SET NULL,
  date         DATE NOT NULL,
  start_time   TIME,
  end_time     TIME,
  type         TEXT NOT NULL DEFAULT 'absence' CHECK (type IN ('absence', 'conge')),
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ
);

-- 3. RLS
ALTER TABLE teacher_absence_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_tar" ON teacher_absence_requests
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_tar" ON teacher_absence_requests
  FOR SELECT TO authenticated USING (true);
