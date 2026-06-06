-- ============================================================
-- Course Management Module
-- Run this in your Supabase SQL editor
-- ============================================================

-- Course sessions: content for a specific schedule session or standalone
CREATE TABLE IF NOT EXISTS course_sessions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id       UUID         REFERENCES schedule_slots(id) ON DELETE SET NULL,
  session_date  DATE,
  subject_id    UUID         NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id      UUID         NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id    UUID         REFERENCES teachers(id) ON DELETE SET NULL,
  title         TEXT         NOT NULL,
  chapter_title TEXT,
  content       JSONB,
  status        TEXT         NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'published')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Attached resources per course session
CREATE TABLE IF NOT EXISTS course_resources (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('youtube', 'drive', 'link')),
  title       TEXT,
  url         TEXT        NOT NULL,
  position    INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE course_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- service_role has full access (used by API routes)
CREATE POLICY "service full course_sessions"  ON course_sessions  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service full course_resources" ON course_resources FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read published sessions (students/teachers)
CREATE POLICY "auth read published sessions" ON course_sessions
  FOR SELECT TO authenticated
  USING (status = 'published');

CREATE POLICY "auth read resources of published sessions" ON course_resources
  FOR SELECT TO authenticated
  USING (
    session_id IN (SELECT id FROM course_sessions WHERE status = 'published')
  );

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_course_sessions_subject ON course_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_class   ON course_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_teacher ON course_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_session ON course_resources(session_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_course_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_course_sessions_updated_at ON course_sessions;
CREATE TRIGGER trg_course_sessions_updated_at
  BEFORE UPDATE ON course_sessions
  FOR EACH ROW EXECUTE FUNCTION update_course_sessions_updated_at();
