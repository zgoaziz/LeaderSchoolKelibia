import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { data, error } = await db()
    .from("enrollments")
    .select("*, formations(id, title)")
    .order("enrolled_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// Public — no auth required (landing page form)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { first_name, last_name, email, tel, formation_name, niveau, notes } = body as Record<string, string>;
  if (!first_name || !last_name || !formation_name) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const { data: enrollment, error } = await db()
    .from("enrollments")
    .insert({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email?.trim() ?? null,
      phone: tel?.trim() ?? null,
      formation_name: formation_name.trim(),
      niveau: niveau?.trim() ?? null,
      message: notes?.trim() ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create admin notification (non-blocking — ignore if type constraint fails)
  db().from("notifications").insert({
    title: "Nouvelle inscription",
    message: `${first_name} ${last_name} souhaite s'inscrire à : ${formation_name}`,
    type: "info",
    class_id: null,
  }).then(() => {}).catch(() => {});

  return NextResponse.json({ id: enrollment?.id }, { status: 201 });
}
