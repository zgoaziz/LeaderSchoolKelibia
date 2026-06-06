import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const { data, error } = await db().from("gallery_items").select("*").order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = await req.json();
  const { title, title_ar, subtitle, subtitle_ar, image_url, category, position, published } = body;
  if (!title || !image_url) return NextResponse.json({ error: "Titre et image requis" }, { status: 400 });
  const { data, error } = await db()
    .from("gallery_items")
    .insert({ title, title_ar: title_ar || null, subtitle: subtitle || null, subtitle_ar: subtitle_ar || null, image_url, category: category || null, position: position ?? 0, published: published ?? true })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
