import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET() {
  const { data, error } = await admin()
    .from("classes")
    .select("*")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  const { data, error } = await admin()
    .from("classes")
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
