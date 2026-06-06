import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// GET /api/schedule-slots?semester_id=xxx&class_id=yyy
// GET /api/schedule-slots?class_id=xxx&date=2024-10-15  (finds semester automatically)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const semester_id = searchParams.get("semester_id");
  const class_id = searchParams.get("class_id");
  const date = searchParams.get("date");

  if (!class_id)
    return NextResponse.json({ error: "class_id requis" }, { status: 400 });

  // Date-based query: find semester for that date, then get slots for that day of week
  if (date) {
    const jsDay = new Date(date + "T12:00:00Z").getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (jsDay === 0) return NextResponse.json([]); // Sunday

    const { data: semData } = await admin()
      .from("semesters")
      .select("id")
      .lte("start_date", date)
      .gte("end_date", date);

    if (!semData?.length) return NextResponse.json([]);

    const { data, error } = await admin()
      .from("schedule_slots")
      .select("*, subjects(id, name), teachers(first_name, last_name)")
      .eq("class_id", class_id)
      .in("semester_id", semData.map((s) => s.id))
      .eq("day_of_week", jsDay)
      .order("start_time");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Semester-based query
  if (!semester_id)
    return NextResponse.json({ error: "semester_id ou date requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("schedule_slots")
    .select("*, subjects(name), teachers(first_name, last_name)")
    .eq("semester_id", semester_id)
    .eq("class_id", class_id)
    .order("day_of_week")
    .order("start_time");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/schedule-slots
export async function POST(req: Request) {
  const { semester_id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time } =
    await req.json();

  if (!semester_id || !class_id || !subject_id || !day_of_week || !start_time || !end_time)
    return NextResponse.json({ error: "Tous les champs obligatoires requis" }, { status: 400 });

  if (start_time >= end_time)
    return NextResponse.json({ error: "L'heure de fin doit etre apres l'heure de debut" }, { status: 400 });

  const { data, error } = await admin()
    .from("schedule_slots")
    .insert({
      semester_id,
      class_id,
      subject_id,
      teacher_id: teacher_id || null,
      day_of_week,
      start_time,
      end_time,
    })
    .select("*, subjects(name), teachers(first_name, last_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
