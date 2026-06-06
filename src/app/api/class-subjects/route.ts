import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// GET /api/class-subjects?subject_id=xxx → classes assigned to this subject
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get("subject_id");
  if (!subject_id) return NextResponse.json({ error: "subject_id requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("class_subjects")
    .select("id, class_id, classes(id, name)")
    .eq("subject_id", subject_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/class-subjects → assign a class to a subject
export async function POST(req: Request) {
  const { subject_id, class_id } = await req.json();
  if (!subject_id || !class_id)
    return NextResponse.json({ error: "subject_id et class_id requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("class_subjects")
    .insert({ subject_id, class_id })
    .select("id, class_id, classes(id, name)")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Déjà assignée" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/class-subjects?subject_id=xxx&class_id=yyy → remove assignment
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get("subject_id");
  const class_id = searchParams.get("class_id");
  if (!subject_id || !class_id)
    return NextResponse.json({ error: "subject_id et class_id requis" }, { status: 400 });

  const { error } = await admin()
    .from("class_subjects")
    .delete()
    .eq("subject_id", subject_id)
    .eq("class_id", class_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
