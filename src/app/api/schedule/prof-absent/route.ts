import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// POST /api/schedule/prof-absent
// Marks all slots for a teacher on a given date as absent + sends global notification
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role;
  if (role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { teacher_id, date, reason } = await req.json();
  if (!teacher_id || !date)
    return NextResponse.json({ error: "Professeur et date requis" }, { status: 400 });

  const dateObj = new Date(date + "T12:00:00Z");
  const jsDay = dateObj.getDay(); // 0=Sun, 1=Mon..6=Sat
  if (jsDay === 0) return NextResponse.json({ error: "Pas de cours le dimanche" }, { status: 400 });

  // Find active semesters for this date
  const { data: semesters } = await db()
    .from("semesters")
    .select("id")
    .lte("start_date", date)
    .gte("end_date", date);
  const semesterIds = (semesters ?? []).map((s: any) => s.id);

  // Find all slots for this teacher on this day
  let slots: any[] = [];
  if (semesterIds.length > 0) {
    const { data } = await db()
      .from("schedule_slots")
      .select("id, class_id, subject_id, teacher_id, start_time, end_time, semester_id")
      .eq("teacher_id", teacher_id)
      .eq("day_of_week", jsDay)
      .in("semester_id", semesterIds);
    slots = data ?? [];
  }

  // Create absent overrides (skip if one already exists for this slot+date)
  let created = 0;
  for (const slot of slots) {
    const { data: existing } = await db()
      .from("schedule_overrides")
      .select("id")
      .eq("slot_id", slot.id)
      .eq("date", date)
      .maybeSingle();

    if (!existing) {
      const { error } = await db().from("schedule_overrides").insert({
        class_id: slot.class_id,
        subject_id: slot.subject_id,
        teacher_id: teacher_id,
        slot_id: slot.id,
        semester_id: slot.semester_id,
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        type: "absent",
        reason: reason || null,
        created_by: user.id,
      });
      if (!error) created++;
    }
  }

  // Get teacher name for notification
  const { data: teacherRow } = await db()
    .from("teachers")
    .select("first_name, last_name")
    .eq("id", teacher_id)
    .single();
  const teacherName = teacherRow
    ? `${teacherRow.first_name} ${teacherRow.last_name}`
    : "Le professeur";

  const fmtDate = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  // Global notification (class_id = null → visible to all users)
  await db().from("notifications").insert({
    class_id: null,
    title: `Absence de prof — ${teacherName}`,
    message: `${teacherName} sera absent(e) le ${fmtDate}. Les cours correspondants sont annulés${reason ? ` (${reason})` : ""}.`,
    type: "absent",
    metadata: { date, teacher_id, slots_count: created },
  });

  return NextResponse.json({ created, notification: true });
}
