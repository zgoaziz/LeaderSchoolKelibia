import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const { data, error } = await db()
    .from("formations")
    .select("*, formation_items(id, name, name_ar, position)")
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = await req.json();
  const { title, title_ar, category, description, description_ar, image_url, color_class, position, published, items, items_ar } = body;
  if (!title || !category) return NextResponse.json({ error: "Titre et catégorie requis" }, { status: 400 });
  const { data: f, error: fe } = await db()
    .from("formations")
    .insert({
      title, title_ar: title_ar || null,
      category,
      description: description || null, description_ar: description_ar || null,
      image_url: image_url || null,
      color_class: color_class || "deep-gradient",
      position: position ?? 0,
      published: published ?? true,
    })
    .select().single();
  if (fe) return NextResponse.json({ error: fe.message }, { status: 500 });
  if (Array.isArray(items) && items.length) {
    const arNames: string[] = Array.isArray(items_ar) ? items_ar : [];
    await db().from("formation_items").insert(
      items.map((name: string, i: number) => ({ formation_id: f.id, name, name_ar: arNames[i] || null, position: i }))
    );
  }
  const { data } = await db().from("formations").select("*, formation_items(id, name, name_ar, position)").eq("id", f.id).single();
  return NextResponse.json(data, { status: 201 });
}
