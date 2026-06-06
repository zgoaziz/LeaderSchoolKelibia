import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get("subject_id");
  if (!subject_id) return NextResponse.json({ error: "subject_id requis" }, { status: 400 });
  const { data, error } = await admin()
    .from("subject_teachers")
    .select("id, teacher_id, teachers(id, first_name, last_name, email)")
    .eq("subject_id", subject_id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const { subject_id, teacher_id } = await req.json();
  if (!subject_id || !teacher_id)
    return NextResponse.json({ error: "subject_id et teacher_id requis" }, { status: 400 });
  const { data, error } = await admin()
    .from("subject_teachers")
    .insert({ subject_id, teacher_id })
    .select("id, teacher_id, teachers(id, first_name, last_name, email)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get("subject_id");
  const teacher_id = searchParams.get("teacher_id");
  if (!subject_id || !teacher_id)
    return NextResponse.json({ error: "subject_id et teacher_id requis" }, { status: 400 });
  const { error } = await admin()
    .from("subject_teachers")
    .delete()
    .eq("subject_id", subject_id)
    .eq("teacher_id", teacher_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
