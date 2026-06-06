import { createClient } from "@/utils/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () => adminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (user.app_metadata?.role !== "professeur") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Find teacher record by email
  const { data: teacher } = await db()
    .from("teachers")
    .select("id, first_name, last_name")
    .eq("email", user.email!)
    .maybeSingle();

  if (!teacher) {
    return NextResponse.json({
      teacher: null,
      email: user.email ?? null,
      totalClasses: 0, totalStudents: 0, studentsByClass: [],
      subjects: [], totalSlots: 0,
      absencePending: 0, absenceTotal: 0,
    });
  }

  // Classes assigned to this teacher
  const { data: teacherClasses } = await db()
    .from("teacher_classes")
    .select("class_id, classes(id, name)")
    .eq("teacher_id", teacher.id);

  const classIds = (teacherClasses ?? []).map((tc: any) => tc.class_id).filter(Boolean);

  // Subjects this teacher teaches
  const { data: subjectLinks } = await db()
    .from("subject_teachers")
    .select("subjects(id, name)")
    .eq("teacher_id", teacher.id);
  const subjects = (subjectLinks ?? []).map((st: any) => st.subjects).filter(Boolean);

  let totalStudents = 0;
  let studentsByClass: { className: string; count: number }[] = [];
  let totalSlots = 0;

  if (classIds.length > 0) {
    const [studentsRes, slotsRes] = await Promise.all([
      db().from("students").select("id, class_id, classes(name)").in("class_id", classIds),
      db().from("schedule_slots").select("*", { count: "exact", head: true }).in("class_id", classIds),
    ]);

    totalStudents = (studentsRes.data ?? []).length;
    totalSlots = slotsRes.count ?? 0;

    const counts: Record<string, { name: string; count: number }> = {};
    for (const s of (studentsRes.data ?? [])) {
      const cls = s.classes as { name: string } | null;
      if (s.class_id && cls) {
        if (!counts[s.class_id]) counts[s.class_id] = { name: cls.name, count: 0 };
        counts[s.class_id].count++;
      }
    }
    studentsByClass = Object.values(counts);
  }

  // Absence requests for this teacher
  const [pendingRes, totalRes] = await Promise.all([
    db().from("teacher_absence_requests").select("*", { count: "exact", head: true })
      .eq("teacher_id", teacher.id).eq("status", "pending"),
    db().from("teacher_absence_requests").select("*", { count: "exact", head: true })
      .eq("teacher_id", teacher.id),
  ]);

  return NextResponse.json({
    teacher,
    totalClasses: classIds.length,
    totalStudents,
    studentsByClass,
    subjects,
    totalSlots,
    absencePending: pendingRes.count ?? 0,
    absenceTotal: totalRes.count ?? 0,
  });
}
