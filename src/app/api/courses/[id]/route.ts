import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type Ctx = { params: Promise<{ id: string }> };

// GET /api/courses/[id]
export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await db()
    .from("course_sessions")
    .select(`
      id, slot_id, session_date, title, chapter_title, content, status, created_at, updated_at,
      subjects(id, name),
      classes(id, name),
      teachers(id, first_name, last_name),
      course_resources(id, type, title, url, position)
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/courses/[id]
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (role !== "admin" && role !== "professeur") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["title", "chapter_title", "content", "status", "session_date", "slot_id"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const { data, error } = await db()
    .from("course_sessions")
    .update(update)
    .eq("id", id)
    .select(`id, slot_id, session_date, title, chapter_title, content, status, updated_at, subjects(id,name), classes(id,name), teachers(id,first_name,last_name), course_resources(id,type,title,url,position)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/courses/[id]
export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (role !== "admin" && role !== "professeur") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { error } = await db().from("course_sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST /api/courses/[id]/resources handled via same route file
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (role !== "admin" && role !== "professeur") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { type, title, url, position } = body;
  if (!type || !url) return NextResponse.json({ error: "type et url requis" }, { status: 400 });

  const { data, error } = await db()
    .from("course_resources")
    .insert({ session_id: id, type, title: title || null, url, position: position ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
