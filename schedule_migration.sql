-- Run this SQL in your Supabase SQL editor

-- 1. Schedule overrides (rattrapages, teacher absences, cancellations)
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  slot_id uuid REFERENCES schedule_slots(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES semesters(id) ON DELETE SET NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  type text NOT NULL CHECK (type IN ('rattrapage', 'absent', 'cancelled')),
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. School holidays / no-school days
CREATE TABLE IF NOT EXISTS school_holidays (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 3. Class-based notifications (rattrapages, absences, holidays)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'schedule' CHECK (type IN ('rattrapage', 'absent', 'holiday', 'schedule', 'info')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (optional but recommended)
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS: allow service role full access (your API routes use service role key)
CREATE POLICY "service_role_all_overrides" ON schedule_overrides FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_holidays" ON school_holidays FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS: allow authenticated users to read
CREATE POLICY "auth_read_overrides" ON schedule_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_holidays" ON school_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_notifications" ON notifications FOR SELECT TO authenticated USING (true);
