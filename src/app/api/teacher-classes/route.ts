import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// GET /api/teacher-classes?teacher_id=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacher_id = searchParams.get("teacher_id");
  if (!teacher_id) return NextResponse.json({ error: "teacher_id requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("teacher_classes")
    .select("id, class_id, classes(id, name)")
    .eq("teacher_id", teacher_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/teacher-classes
export async function POST(req: Request) {
  const { teacher_id, class_id } = await req.json();
  if (!teacher_id || !class_id)
    return NextResponse.json({ error: "teacher_id et class_id requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("teacher_classes")
    .insert({ teacher_id, class_id })
    .select("id, class_id, classes(id, name)")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Deja assigne" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/teacher-classes?teacher_id=xxx&class_id=yyy
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacher_id = searchParams.get("teacher_id");
  const class_id = searchParams.get("class_id");
  if (!teacher_id || !class_id)
    return NextResponse.json({ error: "teacher_id et class_id requis" }, { status: 400 });

  const { error } = await admin()
    .from("teacher_classes")
    .delete()
    .eq("teacher_id", teacher_id)
    .eq("class_id", class_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
