import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await db()
    .from("formations")
    .select("*, formation_items(id, name, position)")
    .eq("id", id)
    .eq("published", true)
    .single();
  if (error) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(data);
}
