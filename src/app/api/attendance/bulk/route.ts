import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// POST /api/attendance/bulk
// body: { records: [{ student_id, subject_id, date, status }] }
export async function POST(req: Request) {
  const { records } = await req.json();
  if (!Array.isArray(records) || records.length === 0)
    return NextResponse.json({ error: "Records requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("attendance")
    .upsert(records, { onConflict: "student_id,subject_id,date" })
    .select("*, subjects(name)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
