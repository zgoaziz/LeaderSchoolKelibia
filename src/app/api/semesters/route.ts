import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET() {
  const { data, error } = await admin()
    .from("semesters")
    .select("*")
    .order("start_date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { name, start_date, end_date } = await req.json();
  if (!name?.trim() || !start_date || !end_date)
    return NextResponse.json({ error: "Nom et dates requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("semesters")
    .insert({ name: name.trim(), start_date, end_date })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
