import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const { data: role, error: fetchErr } = await admin()
    .from("roles")
    .select("is_system")
    .eq("id", id)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (role?.is_system) return NextResponse.json({ error: "Impossible de renommer un rôle système" }, { status: 403 });

  const { error } = await admin()
    .from("roles")
    .update({ name: name.trim().toLowerCase() })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ce nom existe déjà" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
