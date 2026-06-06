import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// GET /api/attendance/all?class_id=xxx
// Returns all attendance records (absences + presences) with student and subject info.
// Optional class_id param filters to students of that class only.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const class_id = searchParams.get("class_id");

  let query = admin()
    .from("attendance")
    .select("*, subjects(name), students!inner(id, first_name, last_name, class_id, classes(id, name))")
    .order("date", { ascending: false });

  if (class_id) {
    query = (query as any).eq("students.class_id", class_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
