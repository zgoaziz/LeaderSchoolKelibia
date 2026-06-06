import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const { data, error } = await db().from("formations").select("*, formation_items(id, name, name_ar, position)").eq("id", id).single();
  if (error) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = await req.json();
  const allowed = ["title","title_ar","category","description","description_ar","image_url","color_class","position","published"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];
  if (body.items !== undefined) {
    await db().from("formation_items").delete().eq("formation_id", id);
    if (Array.isArray(body.items) && body.items.length) {
      const arNames: string[] = Array.isArray(body.items_ar) ? body.items_ar : [];
      await db().from("formation_items").insert(
        body.items.map((name: string, i: number) => ({ formation_id: id, name, name_ar: arNames[i] || null, position: i }))
      );
    }
  }
  await db().from("formations").update(update).eq("id", id);
  const { data } = await db().from("formations").select("*, formation_items(id, name, name_ar, position)").eq("id", id).single();
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  await db().from("formations").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
