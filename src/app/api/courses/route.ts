import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// GET /api/courses?subject_id=&class_id=&status=
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role as string;
  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get("subject_id");
  const class_id   = searchParams.get("class_id");
  const status     = searchParams.get("status");

  let q = db()
    .from("course_sessions")
    .select(`
      id, slot_id, session_date, title, chapter_title, content, status, created_at, updated_at,
      subjects(id, name),
      classes(id, name),
      teachers(id, first_name, last_name),
      course_resources(id, type, title, url, position)
    `)
    .order("session_date", { ascending: false });

  if (subject_id) q = q.eq("subject_id", subject_id);
  if (class_id)   q = q.eq("class_id", class_id);

  // Students only see published content
  if (role === "etudiant") {
    q = q.eq("status", "published");
  } else if (status) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/courses
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (role !== "admin" && role !== "professeur") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { slot_id, session_date, subject_id, class_id, title, chapter_title, content, status: st } = body;

  if (!subject_id || !class_id || !title) {
    return NextResponse.json({ error: "subject_id, class_id et title sont requis" }, { status: 400 });
  }

  // Resolve teacher_id for professor role
  let teacher_id: string | null = null;
  if (role === "professeur") {
    const { data: t } = await db().from("teachers").select("id").eq("user_id", user.id).single();
    teacher_id = t?.id ?? null;
  } else {
    teacher_id = body.teacher_id ?? null;
  }

  const { data, error } = await db()
    .from("course_sessions")
    .insert({ slot_id: slot_id || null, session_date: session_date || null, subject_id, class_id, teacher_id, title, chapter_title: chapter_title || null, content: content || null, status: st ?? "draft" })
    .select(`id, slot_id, session_date, title, chapter_title, content, status, created_at, subjects(id,name), classes(id,name), teachers(id,first_name,last_name), course_resources(id,type,title,url,position)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
