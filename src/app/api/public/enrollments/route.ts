import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function POST(req: Request) {
  const body = await req.json();
  const { first_name, last_name, email, phone, formation_id, formation_name, niveau, message } = body;
  if (!first_name || !last_name) return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  const { data, error } = await db()
    .from("enrollments")
    .insert({
      first_name, last_name,
      email: email || null, phone: phone || null,
      formation_id: formation_id || null,
      formation_name: formation_name || null,
      niveau: niveau || null,
      message: message || null,
      status: "pending",
    })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
