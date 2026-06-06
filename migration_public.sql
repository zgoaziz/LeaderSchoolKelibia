-- ============================================================
-- Public Content: formations, gallery, testimonials, enrollments, payments, certificates
-- Run in Supabase SQL editor
-- ============================================================

-- ─── FORMATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('langues', 'informatique', 'cuisine')),
  description TEXT,
  icon        TEXT,
  image_url   TEXT,
  color_class TEXT        NOT NULL DEFAULT 'deep-gradient',
  position    INT         NOT NULL DEFAULT 0,
  published   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formation_items (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID  NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  name         TEXT  NOT NULL,
  position     INT   NOT NULL DEFAULT 0
);

-- ─── GALLERY ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  subtitle   TEXT,
  image_url  TEXT        NOT NULL,
  category   TEXT,
  position   INT         NOT NULL DEFAULT 0,
  published  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TESTIMONIALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT        NOT NULL,
  author_name  TEXT        NOT NULL,
  author_role  TEXT,
  rating       INT         NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ENROLLMENTS (inscriptions) ──────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     TEXT        NOT NULL,
  last_name      TEXT        NOT NULL,
  email          TEXT,
  phone          TEXT,
  formation_id   UUID        REFERENCES formations(id) ON DELETE SET NULL,
  formation_name TEXT,
  niveau         TEXT,
  message        TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes          TEXT,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ
);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id  UUID          REFERENCES enrollments(id) ON DELETE SET NULL,
  student_name   TEXT          NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  type           TEXT          NOT NULL CHECK (type IN ('inscription','mensuel','seance')),
  description    TEXT,
  due_date       DATE,
  paid_date      DATE,
  status         TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','late','cancelled')),
  payment_method TEXT,
  reference      TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by     UUID          REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── CERTIFICATES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID        REFERENCES students(id) ON DELETE SET NULL,
  student_name       TEXT        NOT NULL,
  formation_id       UUID        REFERENCES formations(id) ON DELETE SET NULL,
  formation_name     TEXT        NOT NULL,
  certificate_number TEXT        UNIQUE NOT NULL,
  issue_date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  expiry_date        DATE,
  status             TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','revoked')),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by         UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE formations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "svc formations"      ON formations      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc formation_items" ON formation_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc gallery"         ON gallery_items   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc testimonials"    ON testimonials    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc enrollments"     ON enrollments     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc payments"        ON payments        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "svc certificates"    ON certificates    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon can read published/approved public content
CREATE POLICY "pub read formations"   ON formations      FOR SELECT TO anon USING (published = true);
CREATE POLICY "pub read form_items"   ON formation_items FOR SELECT TO anon USING (formation_id IN (SELECT id FROM formations WHERE published = true));
CREATE POLICY "pub read gallery"      ON gallery_items   FOR SELECT TO anon USING (published = true);
CREATE POLICY "pub read testimonials" ON testimonials    FOR SELECT TO anon USING (status = 'approved');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_formations_cat      ON formations(category);
CREATE INDEX IF NOT EXISTS idx_formations_pos      ON formations(position);
CREATE INDEX IF NOT EXISTS idx_gallery_pos         ON gallery_items(position);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_status  ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments(status);

-- Seed initial data (matching existing static content)
INSERT INTO formations (title, category, description, color_class, position, published) VALUES
  ('Langues Vivantes', 'langues', 'Maîtrisez une nouvelle langue avec des formateurs natifs et certifiés.', 'deep-gradient', 0, true),
  ('Informatique & Design', 'informatique', 'Devenez créateur numérique avec des outils professionnels modernes.', 'teal-gradient', 1, true),
  ('Cuisine & Pâtisserie', 'cuisine', 'Apprenez l''art culinaire dans nos laboratoires entièrement équipés.', 'rose-gradient', 2, true)
ON CONFLICT DO NOTHING;

-- Seed formation items (must be run after formations seed above)
DO $$
DECLARE
  lang_id UUID; info_id UUID; cui_id UUID;
BEGIN
  SELECT id INTO lang_id FROM formations WHERE category='langues' LIMIT 1;
  SELECT id INTO info_id FROM formations WHERE category='informatique' LIMIT 1;
  SELECT id INTO cui_id  FROM formations WHERE category='cuisine' LIMIT 1;

  IF lang_id IS NOT NULL THEN
    INSERT INTO formation_items (formation_id, name, position) VALUES
      (lang_id, 'Français', 0), (lang_id, 'Anglais', 1), (lang_id, 'Allemand', 2),
      (lang_id, 'Italien', 3), (lang_id, 'Espagnol', 4), (lang_id, 'Turc', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  IF info_id IS NOT NULL THEN
    INSERT INTO formation_items (formation_id, name, position) VALUES
      (info_id, 'Web Design', 0), (info_id, 'Programmation', 1),
      (info_id, 'Infographie', 2), (info_id, 'Outils numériques', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cui_id IS NOT NULL THEN
    INSERT INTO formation_items (formation_id, name, position) VALUES
      (cui_id, 'Cuisine générale', 0), (cui_id, 'Pâtisserie professionnelle', 1),
      (cui_id, 'Cuisine spécialisée', 2)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
