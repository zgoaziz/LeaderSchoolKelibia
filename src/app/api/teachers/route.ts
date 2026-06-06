import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET() {
  const { data, error } = await admin()
    .from("teachers")
    .select("*")
    .order("last_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { first_name, last_name, email, phone } = await req.json();
  if (!first_name?.trim() || !last_name?.trim())
    return NextResponse.json({ error: "Prenom et nom requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("teachers")
    .insert({ first_name: first_name.trim(), last_name: last_name.trim(), email, phone })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
