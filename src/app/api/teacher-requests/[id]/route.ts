import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// PATCH /api/teacher-requests/[id]
// Admin: approve or reject; Professor: update their own pending request
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role;
  const body = await req.json();

  if (role === "admin") {
    const { status, admin_note } = body;
    if (!status) return NextResponse.json({ error: "status requis" }, { status: 400 });

    const { data: reqRow, error: fetchErr } = await db()
      .from("teacher_absence_requests")
      .select("*, teachers(first_name, last_name, email)")
      .eq("id", id)
      .single();
    if (fetchErr || !reqRow) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    const { data, error } = await db()
      .from("teacher_absence_requests")
      .update({
        status,
        admin_note: admin_note || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If approved → call prof-absent logic to mark schedule overrides
    if (status === "approved") {
      const absRes = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/schedule/prof-absent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-supabase-auth": "service" },
          body: JSON.stringify({
            teacher_id: reqRow.teacher_id,
            date: reqRow.date,
            reason: reqRow.reason,
          }),
        },
      ).catch(() => null);

      // Also notify teacher
      const tName = reqRow.teachers
        ? `${reqRow.teachers.first_name} ${reqRow.teachers.last_name}`
        : "Professeur";
      const fmtDate = new Date(reqRow.date + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long",
      });
      await db().from("notifications").insert({
        class_id: null,
        title: `Demande approuvée — ${tName}`,
        message: `Votre demande de ${reqRow.type === "conge" ? "congé" : "absence"} pour le ${fmtDate} a été approuvée.`,
        type: "info",
        metadata: { request_id: id, teacher_id: reqRow.teacher_id },
      });
    } else if (status === "rejected") {
      const tName = reqRow.teachers
        ? `${reqRow.teachers.first_name} ${reqRow.teachers.last_name}`
        : "Professeur";
      const fmtDate = new Date(reqRow.date + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long",
      });
      await db().from("notifications").insert({
        class_id: null,
        title: `Demande refusée — ${tName}`,
        message: `Votre demande de ${reqRow.type === "conge" ? "congé" : "absence"} pour le ${fmtDate} a été refusée${admin_note ? ` : ${admin_note}` : ""}.`,
        type: "info",
        metadata: { request_id: id, teacher_id: reqRow.teacher_id },
      });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}

// DELETE /api/teacher-requests/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { error } = await db().from("teacher_absence_requests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
