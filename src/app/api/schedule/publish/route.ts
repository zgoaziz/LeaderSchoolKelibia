import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const adminDb = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// POST /api/schedule/publish
// Marks a semester schedule as published for a class and notifies students + teachers.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role;
  if (role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { class_id, semester_id, class_name, semester_name } = await req.json();
  if (!class_id || !semester_id)
    return NextResponse.json({ error: "class_id et semester_id requis" }, { status: 400 });

  const notifText = `L'emploi du temps de la classe ${class_name ?? ""} pour le ${semester_name ?? "semestre"} est maintenant disponible.`;

  const payload: Record<string, unknown> = {
    class_id,
    title: "Emploi du temps disponible",
    message: notifText,
    body: notifText,   // some DB setups use "body" instead of "message"
    type: "schedule",
  };

  // Try with metadata first (column may not exist on older DB setups)
  let { error } = await adminDb().from("notifications").insert({ ...payload, metadata: { semester_id } });

  // If the metadata column doesn't exist, retry without it
  if (error && (error.message?.toLowerCase().includes("metadata") || error.code === "42703" || (error as any).details?.includes("metadata"))) {
    const retry = await adminDb().from("notifications").insert(payload);
    error = retry.error;
  }

  if (error) {
    console.error("[publish] notifications insert error:", error);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
