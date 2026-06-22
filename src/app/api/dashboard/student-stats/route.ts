import { createClient } from "@/utils/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () => adminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = user.app_metadata?.role;
  if (role === "admin" || role === "professeur") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Find student by user_id first, then by email
  let student: { id: string; first_name: string; last_name: string; class_id: string | null } | null = null;

  const { data: byUserId } = await db()
    .from("students")
    .select("id, first_name, last_name, class_id")
    .eq("user_id", user.id)
    .maybeSingle();
  student = byUserId;

  if (!student && user.email) {
    const { data: byEmail } = await db()
      .from("students")
      .select("id, first_name, last_name, class_id")
      .eq("email", user.email)
      .maybeSingle();
    student = byEmail;
  }

  if (!student) {
    return NextResponse.json({
      student: null,
      email: user.email ?? null,
      className: null,
      totalSlots: 0,
      cancelledSlots: 0,
      subjects: [],
    });
  }

  const classId = student.class_id;
  let className: string | null = null;
  let totalSlots = 0;
  let cancelledSlots = 0;
  let subjects: { id: string; name: string }[] = [];

  if (classId) {
    const [classRes, slotsRes, overridesRes] = await Promise.all([
      db().from("classes").select("name").eq("id", classId).maybeSingle(),
      db().from("schedule_slots").select("*", { count: "exact", head: true }).eq("class_id", classId),
      db().from("schedule_overrides").select("*", { count: "exact", head: true })
        .eq("class_id", classId).eq("type", "absent"),
    ]);

    className = (classRes.data as { name: string } | null)?.name ?? null;
    totalSlots = slotsRes.count ?? 0;
    cancelledSlots = overridesRes.count ?? 0;

    // Derive subjects: teachers of this class → their subjects
    const { data: teacherLinks } = await db()
      .from("teacher_classes")
      .select("teacher_id")
      .eq("class_id", classId);

    const teacherIds = (teacherLinks ?? []).map((t: any) => t.teacher_id).filter(Boolean);

    if (teacherIds.length > 0) {
      const { data: subjectLinks } = await db()
        .from("subject_teachers")
        .select("subjects(id, name)")
        .in("teacher_id", teacherIds);

      const seen = new Set<string>();
      for (const sl of subjectLinks ?? []) {
        // Supabase may return object or array for nested select — normalise to single
        const raw: any = sl.subjects;
        const sub: { id: string; name: string } | null = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
        if (sub && !seen.has(sub.id)) {
          seen.add(sub.id);
          subjects.push(sub);
        }
      }
    }
  }

  return NextResponse.json({
    student: { first_name: student.first_name, last_name: student.last_name },
    className,
    totalSlots,
    cancelledSlots,
    subjects,
  });
}
