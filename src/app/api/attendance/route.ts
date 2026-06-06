import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const student_id = searchParams.get("student_id");

  let query = admin()
    .from("attendance")
    .select("*, subjects(name)")
    .order("date", { ascending: false });

  if (student_id) query = query.eq("student_id", student_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { student_id, subject_id, date, status = "present" } = body;

  if (!student_id || !subject_id || !date)
    return NextResponse.json({ error: "student_id, subject_id et date requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("attendance")
    .upsert({ student_id, subject_id, date, status }, { onConflict: "student_id,subject_id,date" })
    .select("*, subjects(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
