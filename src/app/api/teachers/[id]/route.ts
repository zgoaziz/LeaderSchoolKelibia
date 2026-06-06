import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// PATCH /api/teachers/[id] — update teacher info
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { first_name, last_name, email, phone } = await req.json();

  if (!first_name?.trim() || !last_name?.trim())
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("teachers")
    .update({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/teachers/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await admin().from("teachers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
