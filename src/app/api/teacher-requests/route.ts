import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// GET /api/teacher-requests
// Admin → all requests; Professor → own requests only
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role;

  if (role === "admin") {
    const { data, error } = await db()
      .from("teacher_absence_requests")
      .select("*, teachers(first_name, last_name), subjects(name), classes(name)")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (role === "professeur") {
    const { data: teacher } = await db()
      .from("teachers")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (!teacher) return NextResponse.json([]);

    const { data, error } = await db()
      .from("teacher_absence_requests")
      .select("*, teachers(first_name, last_name), subjects(name), classes(name)")
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json([]);
}

// POST /api/teacher-requests — Professor submits a request
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role;
  if (role !== "professeur" && role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { teacher_id, date, type, reason, slot_id, class_id, subject_id, start_time, end_time } =
    await req.json();

  if (!date || !type)
    return NextResponse.json({ error: "Date et type requis" }, { status: 400 });

  // For professors, resolve teacher_id from their email
  let resolvedTeacherId = teacher_id;
  if (role === "professeur") {
    const { data: t } = await db()
      .from("teachers")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (!t) return NextResponse.json({ error: "Profil professeur introuvable" }, { status: 404 });
    resolvedTeacherId = t.id;
  }

  const { data, error } = await db()
    .from("teacher_absence_requests")
    .insert({
      teacher_id: resolvedTeacherId,
      date,
      type,
      reason: reason || null,
      slot_id: slot_id || null,
      class_id: class_id || null,
      subject_id: subject_id || null,
      start_time: start_time || null,
      end_time: end_time || null,
      status: "pending",
    })
    .select("*, teachers(first_name, last_name), subjects(name), classes(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify admins via global notification
  const fmtDate = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
  const { data: t } = await db()
    .from("teachers")
    .select("first_name, last_name")
    .eq("id", resolvedTeacherId)
    .single();
  const name = t ? `${t.first_name} ${t.last_name}` : "Un professeur";

  await db().from("notifications").insert({
    class_id: null,
    title: `Demande de ${type === "conge" ? "congé" : "absence"} — ${name}`,
    message: `${name} a soumis une demande de ${type === "conge" ? "congé" : "absence"} pour le ${fmtDate}${reason ? ` : ${reason}` : ""}.`,
    body: `${name} a soumis une demande de ${type === "conge" ? "congé" : "absence"} pour le ${fmtDate}${reason ? ` : ${reason}` : ""}.`,
    type: "info",
    metadata: { request_id: data.id, teacher_id: resolvedTeacherId, date },
  });

  return NextResponse.json(data, { status: 201 });
}
