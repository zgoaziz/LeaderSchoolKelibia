import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// GET /api/schedule/overrides?class_id=xxx&week_start=2026-06-02
// GET /api/schedule/overrides?all=1[&class_id=xxx]  ← history tab
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const class_id   = searchParams.get("class_id");
  const week_start = searchParams.get("week_start");
  const all        = searchParams.get("all");

  let query = db()
    .from("schedule_overrides")
    .select("*, subjects(name), teachers(first_name, last_name), classes(name)")
    .order("date")
    .order("start_time");

  if (class_id) query = query.eq("class_id", class_id);

  if (week_start && !all) {
    const end = new Date(week_start + "T12:00:00Z");
    end.setDate(end.getDate() + 6);
    const week_end = end.toISOString().split("T")[0];
    query = query.gte("date", week_start).lte("date", week_end);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/schedule/overrides
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { class_id, subject_id, teacher_id, slot_id, semester_id, date, start_time, end_time, type, reason } = body;

  if (!class_id || !date || !start_time || !end_time || !type)
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });

  const { data, error } = await db()
    .from("schedule_overrides")
    .insert({
      class_id,
      subject_id: subject_id || null,
      teacher_id: teacher_id || null,
      slot_id: slot_id || null,
      semester_id: semester_id || null,
      date,
      start_time,
      end_time,
      type,
      reason: reason || null,
      created_by: user.id,
    })
    .select("*, subjects(name), teachers(first_name, last_name), classes(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // No notification for explicit "present" marks
  if (type === "present") return NextResponse.json(data, { status: 201 });

  // Send notification to students in the class
  const classRow = await db().from("classes").select("name").eq("id", class_id).single();
  const className = classRow.data?.name ?? "votre classe";

  const subjectRow = subject_id
    ? await db().from("subjects").select("name").eq("id", subject_id).single()
    : null;
  const subjectName = subjectRow?.data?.name ?? "une matière";

  const fmtDate = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  let title = "";
  let message = "";

  if (type === "rattrapage") {
    title = `Rattrapage – ${subjectName}`;
    message = `Un rattrapage de ${subjectName} a été ajouté le ${fmtDate} de ${start_time.slice(0, 5)} à ${end_time.slice(0, 5)} pour ${className}.`;
  } else {
    title = `Cours annulé – ${subjectName}`;
    message = `Le cours de ${subjectName} du ${fmtDate} est annulé pour ${className}${reason ? ` (${reason})` : ""}.`;
  }

  await db().from("notifications").insert({ class_id, title, message, type, metadata: { date, subject_id, teacher_id } });

  return NextResponse.json(data, { status: 201 });
}
