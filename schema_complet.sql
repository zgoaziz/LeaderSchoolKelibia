-- ================================================================
-- Leader School Kélibia — Schéma SQL complet
-- Coller dans Supabase > SQL Editor et exécuter en une seule fois
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- 0. FONCTIONS UTILITAIRES
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ════════════════════════════════════════════════════════════════
-- 1. PROFILS UTILISATEURS (synchronisé avec auth.users)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT        DEFAULT '',
  last_name  TEXT        DEFAULT '',
  email      TEXT,
  role       TEXT        DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_service_role"
  ON public.profiles FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Trigger : créer un profil automatiquement à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ════════════════════════════════════════════════════════════════
-- 2. RÔLES & PERMISSIONS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  is_system  BOOLEAN     NOT NULL DEFAULT false,
  is_public  BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id    UUID    NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module     TEXT    NOT NULL,
  can_view   BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit   BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (role_id, module)
);

ALTER TABLE public.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_service_role"
  ON public.roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "roles_read_authenticated"
  ON public.roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_service_role"
  ON public.role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "role_permissions_read_authenticated"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Rôles système par défaut
INSERT INTO public.roles (name, is_system, is_public) VALUES
  ('admin',      true,  false),
  ('professeur', false, true),
  ('etudiant',   false, true)
ON CONFLICT (name) DO NOTHING;


-- ════════════════════════════════════════════════════════════════
-- 3. CLASSES
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.classes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_service_role"
  ON public.classes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "classes_read_authenticated"
  ON public.classes FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_classes_name ON public.classes(name);


-- ════════════════════════════════════════════════════════════════
-- 4. MATIÈRES (subjects)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subjects (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_service_role"
  ON public.subjects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "subjects_read_authenticated"
  ON public.subjects FOR SELECT TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════════
-- 5. PROFESSEURS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.teachers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT        NOT NULL,
  last_name  TEXT        NOT NULL,
  email      TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_service_role"
  ON public.teachers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "teachers_read_authenticated"
  ON public.teachers FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS set_teachers_updated_at ON public.teachers;
CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ════════════════════════════════════════════════════════════════
-- 6. ÉTUDIANTS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.students (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT        NOT NULL,
  last_name  TEXT        NOT NULL,
  email      TEXT,
  phone      TEXT,
  class_id   UUID        REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_service_role"
  ON public.students FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "students_read_authenticated"
  ON public.students FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ════════════════════════════════════════════════════════════════
-- 7. TABLES DE LIAISON
-- ════════════════════════════════════════════════════════════════

-- Professeur ↔ Classes
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id   UUID        NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (teacher_id, class_id)
);

ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_classes_service_role"
  ON public.teacher_classes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "teacher_classes_read_authenticated"
  ON public.teacher_classes FOR SELECT TO authenticated USING (true);

-- Classe ↔ Matières
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID        NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
  subject_id UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, subject_id)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_subjects_service_role"
  ON public.class_subjects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "class_subjects_read_authenticated"
  ON public.class_subjects FOR SELECT TO authenticated USING (true);

-- Matière ↔ Professeurs
CREATE TABLE IF NOT EXISTS public.subject_teachers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_id, teacher_id)
);

ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_teachers_service_role"
  ON public.subject_teachers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "subject_teachers_read_authenticated"
  ON public.subject_teachers FOR SELECT TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════════
-- 8. EMPLOI DU TEMPS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.semesters (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "semesters_service_role"
  ON public.semesters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "semesters_read_authenticated"
  ON public.semesters FOR SELECT TO authenticated USING (true);

-- Créneaux horaires
CREATE TABLE IF NOT EXISTS public.schedule_slots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID        NOT NULL REFERENCES public.semesters(id)  ON DELETE CASCADE,
  class_id    UUID        NOT NULL REFERENCES public.classes(id)     ON DELETE CASCADE,
  subject_id  UUID        NOT NULL REFERENCES public.subjects(id)    ON DELETE CASCADE,
  teacher_id  UUID        REFERENCES public.teachers(id)             ON DELETE SET NULL,
  day_of_week INTEGER     NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time  TIME        NOT NULL,
  end_time    TIME        NOT NULL,
  room        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_slots_service_role"
  ON public.schedule_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "schedule_slots_read_authenticated"
  ON public.schedule_slots FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_slots_semester  ON public.schedule_slots(semester_id);
CREATE INDEX IF NOT EXISTS idx_slots_class     ON public.schedule_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_slots_teacher   ON public.schedule_slots(teacher_id);

-- Overrides (rattrapages, absences, annulations)
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID        REFERENCES public.classes(id)        ON DELETE CASCADE,
  teacher_id  UUID        REFERENCES public.teachers(id)       ON DELETE SET NULL,
  subject_id  UUID        REFERENCES public.subjects(id)       ON DELETE SET NULL,
  slot_id     UUID        REFERENCES public.schedule_slots(id) ON DELETE SET NULL,
  semester_id UUID        REFERENCES public.semesters(id)      ON DELETE SET NULL,
  date        DATE        NOT NULL,
  start_time  TIME        NOT NULL,
  end_time    TIME        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('rattrapage','absent','cancelled','present')),
  reason      TEXT,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "overrides_service_role"
  ON public.schedule_overrides FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "overrides_read_authenticated"
  ON public.schedule_overrides FOR SELECT TO authenticated USING (true);

-- Jours fériés
CREATE TABLE IF NOT EXISTS public.school_holidays (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.school_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "holidays_service_role"
  ON public.school_holidays FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "holidays_read_authenticated"
  ON public.school_holidays FOR SELECT TO authenticated USING (true);

-- Notifications de classe
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID        REFERENCES public.classes(id) ON DELETE SET NULL,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'schedule'
             CHECK (type IN ('rattrapage','absent','holiday','schedule','info')),
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_service_role"
  ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "notifications_read_authenticated"
  ON public.notifications FOR SELECT TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════════
-- 9. DEMANDES D'ABSENCE ENSEIGNANTS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.teacher_absence_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES public.teachers(id)       ON DELETE CASCADE,
  slot_id     UUID        REFERENCES public.schedule_slots(id)          ON DELETE SET NULL,
  class_id    UUID        REFERENCES public.classes(id)                 ON DELETE SET NULL,
  subject_id  UUID        REFERENCES public.subjects(id)                ON DELETE SET NULL,
  date        DATE        NOT NULL,
  start_time  TIME,
  end_time    TIME,
  type        TEXT        NOT NULL DEFAULT 'absence'
              CHECK (type IN ('absence','conge')),
  reason      TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected')),
  admin_note  TEXT,
  reviewed_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teacher_absence_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tar_service_role"
  ON public.teacher_absence_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "tar_read_authenticated"
  ON public.teacher_absence_requests FOR SELECT TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════════
-- 10. ABSENCES ÉTUDIANTS (attendance)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.attendance (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id   UUID        REFERENCES public.classes(id)           ON DELETE SET NULL,
  slot_id    UUID        REFERENCES public.schedule_slots(id)    ON DELETE SET NULL,
  date       DATE        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'absent'
             CHECK (status IN ('present','absent','late','excused')),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, subject_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_service_role"
  ON public.attendance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "attendance_read_authenticated"
  ON public.attendance FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON public.attendance(date);


-- ════════════════════════════════════════════════════════════════
-- 11. COURS (course sessions & resources)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.course_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id       UUID        REFERENCES public.schedule_slots(id) ON DELETE SET NULL,
  session_date  DATE,
  subject_id    UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id      UUID        NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
  teacher_id    UUID        REFERENCES public.teachers(id)          ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  chapter_title TEXT,
  content       JSONB,
  status        TEXT        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','published')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_resources (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID        NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('youtube','drive','link')),
  title      TEXT,
  url        TEXT        NOT NULL,
  position   INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.course_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_sessions_service_role"
  ON public.course_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "course_sessions_read_authenticated"
  ON public.course_sessions FOR SELECT TO authenticated USING (status = 'published');

CREATE POLICY "course_resources_service_role"
  ON public.course_resources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "course_resources_read_authenticated"
  ON public.course_resources FOR SELECT TO authenticated
  USING (session_id IN (SELECT id FROM public.course_sessions WHERE status = 'published'));

CREATE INDEX IF NOT EXISTS idx_course_sessions_subject  ON public.course_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_class    ON public.course_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_teacher  ON public.course_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_session ON public.course_resources(session_id);

CREATE OR REPLACE FUNCTION public.update_course_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_course_sessions_updated_at ON public.course_sessions;
CREATE TRIGGER trg_course_sessions_updated_at
  BEFORE UPDATE ON public.course_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_course_sessions_updated_at();


-- ════════════════════════════════════════════════════════════════
-- 12. SITE PUBLIC — FORMATIONS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.formations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  title_ar       TEXT,
  category       TEXT        NOT NULL CHECK (category IN ('langues','informatique','cuisine')),
  description    TEXT,
  description_ar TEXT,
  icon           TEXT,
  image_url      TEXT,
  color_class    TEXT        NOT NULL DEFAULT 'deep-gradient',
  position       INT         NOT NULL DEFAULT 0,
  published      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.formation_items (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID  NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  name         TEXT  NOT NULL,
  name_ar      TEXT,
  position     INT   NOT NULL DEFAULT 0
);

ALTER TABLE public.formations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "formations_service_role"
  ON public.formations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "formations_read_anon"
  ON public.formations FOR SELECT TO anon USING (published = true);
CREATE POLICY "formations_read_authenticated"
  ON public.formations FOR SELECT TO authenticated USING (true);

CREATE POLICY "formation_items_service_role"
  ON public.formation_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "formation_items_read_anon"
  ON public.formation_items FOR SELECT TO anon
  USING (formation_id IN (SELECT id FROM public.formations WHERE published = true));
CREATE POLICY "formation_items_read_authenticated"
  ON public.formation_items FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_formations_cat ON public.formations(category);
CREATE INDEX IF NOT EXISTS idx_formations_pos ON public.formations(position);

-- Données initiales
INSERT INTO public.formations (title, title_ar, category, description, description_ar, color_class, position, published) VALUES
  ('Langues Vivantes',      'اللغات الحية',       'langues',      'Maîtrisez une nouvelle langue avec des formateurs natifs et certifiés.',         'أتقن لغة جديدة مع مدربين أصليين ومعتمدين.',         'deep-gradient', 0, true),
  ('Informatique & Design', 'الإعلامية والتصميم', 'informatique', 'Devenez créateur numérique avec des outils professionnels modernes.',             'كن مبدعاً رقمياً باستخدام أحدث الأدوات المهنية.',  'teal-gradient', 1, true),
  ('Cuisine & Pâtisserie',  'الطبخ والحلويات',    'cuisine',      'Apprenez l''art culinaire dans nos laboratoires entièrement équipés.',           'تعلم فن الطهي في مختبراتنا المجهزة بالكامل.',       'rose-gradient', 2, true)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  lang_id UUID; info_id UUID; cui_id UUID;
BEGIN
  SELECT id INTO lang_id FROM public.formations WHERE category = 'langues'      LIMIT 1;
  SELECT id INTO info_id FROM public.formations WHERE category = 'informatique' LIMIT 1;
  SELECT id INTO cui_id  FROM public.formations WHERE category = 'cuisine'      LIMIT 1;

  IF lang_id IS NOT NULL THEN
    INSERT INTO public.formation_items (formation_id, name, name_ar, position) VALUES
      (lang_id, 'Français',  'الفرنسية', 0),
      (lang_id, 'Anglais',   'الإنجليزية', 1),
      (lang_id, 'Allemand',  'الألمانية', 2),
      (lang_id, 'Italien',   'الإيطالية', 3),
      (lang_id, 'Espagnol',  'الإسبانية', 4),
      (lang_id, 'Turc',      'التركية', 5)
    ON CONFLICT DO NOTHING;
  END IF;

  IF info_id IS NOT NULL THEN
    INSERT INTO public.formation_items (formation_id, name, name_ar, position) VALUES
      (info_id, 'Web Design',        'تصميم الويب', 0),
      (info_id, 'Programmation',     'البرمجة', 1),
      (info_id, 'Infographie',       'الإنفوغرافيا', 2),
      (info_id, 'Outils numériques', 'الأدوات الرقمية', 3)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cui_id IS NOT NULL THEN
    INSERT INTO public.formation_items (formation_id, name, name_ar, position) VALUES
      (cui_id, 'Cuisine générale',         'الطبخ العام', 0),
      (cui_id, 'Pâtisserie professionnelle','الحلويات المهنية', 1),
      (cui_id, 'Cuisine spécialisée',      'الطبخ المتخصص', 2)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- 13. SITE PUBLIC — GALERIE
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  title_ar    TEXT,
  subtitle    TEXT,
  subtitle_ar TEXT,
  image_url   TEXT        NOT NULL,
  category    TEXT,
  position    INT         NOT NULL DEFAULT 0,
  published   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_service_role"
  ON public.gallery_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "gallery_read_anon"
  ON public.gallery_items FOR SELECT TO anon USING (published = true);
CREATE POLICY "gallery_read_authenticated"
  ON public.gallery_items FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_gallery_pos ON public.gallery_items(position);


-- ════════════════════════════════════════════════════════════════
-- 14. SITE PUBLIC — TÉMOIGNAGES
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.testimonials (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT        NOT NULL,
  author_name  TEXT        NOT NULL,
  author_role  TEXT,
  rating       INT         NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  submitted_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_service_role"
  ON public.testimonials FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "testimonials_read_anon"
  ON public.testimonials FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY "testimonials_read_authenticated"
  ON public.testimonials FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);


-- ════════════════════════════════════════════════════════════════
-- 15. INSCRIPTIONS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.enrollments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     TEXT        NOT NULL,
  last_name      TEXT        NOT NULL,
  email          TEXT,
  phone          TEXT,
  formation_id   UUID        REFERENCES public.formations(id) ON DELETE SET NULL,
  formation_name TEXT,
  niveau         TEXT,
  message        TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes          TEXT,
  reviewed_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_service_role"
  ON public.enrollments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "enrollments_insert_anon"
  ON public.enrollments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "enrollments_read_authenticated"
  ON public.enrollments FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);


-- ════════════════════════════════════════════════════════════════
-- 16. PAIEMENTS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payments (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id  UUID          REFERENCES public.enrollments(id) ON DELETE SET NULL,
  student_name   TEXT          NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  type           TEXT          NOT NULL CHECK (type IN ('inscription','mensuel','seance')),
  description    TEXT,
  due_date       DATE,
  paid_date      DATE,
  status         TEXT          NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','paid','late','cancelled')),
  payment_method TEXT,
  reference      TEXT,
  notes          TEXT,
  created_by     UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_service_role"
  ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "payments_read_authenticated"
  ON public.payments FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);


-- ════════════════════════════════════════════════════════════════
-- 17. CERTIFICATS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.certificates (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID        REFERENCES public.students(id)    ON DELETE SET NULL,
  student_name       TEXT        NOT NULL,
  formation_id       UUID        REFERENCES public.formations(id)  ON DELETE SET NULL,
  formation_name     TEXT        NOT NULL,
  certificate_number TEXT        UNIQUE NOT NULL,
  issue_date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  expiry_date        DATE,
  status             TEXT        NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','issued','revoked')),
  notes              TEXT,
  created_by         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_service_role"
  ON public.certificates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "certificates_read_authenticated"
  ON public.certificates FOR SELECT TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ════════════════════════════════════════════════════════════════
