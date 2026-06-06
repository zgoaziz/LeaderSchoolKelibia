import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET() {
  const { data, error } = await db()
    .from("testimonials")
    .select("id, content, author_name, author_role, rating")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
export async function POST(req: Request) {
  const body = await req.json();
  const { content, author_name, author_role, rating } = body;
  if (!content || !author_name) return NextResponse.json({ error: "Contenu et nom requis" }, { status: 400 });
  const { data, error } = await db()
    .from("testimonials")
    .insert({ content, author_name, author_role: author_role || null, rating: rating ?? 5, status: "pending" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
