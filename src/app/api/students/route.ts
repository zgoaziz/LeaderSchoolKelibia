import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const class_id = searchParams.get("class_id");

  const class_ids = searchParams.get("class_ids"); // comma-separated list

  let query = admin().from("students").select("*, classes(name)").order("last_name");
  if (class_id === "none") query = query.is("class_id", null);
  else if (class_id) query = query.eq("class_id", class_id);
  else if (class_ids) {
    const ids = class_ids.split(",").filter(Boolean);
    query = query.in("class_id", ids);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { first_name, last_name, email, phone, class_id, user_id } = body;
  if (!first_name?.trim() || !last_name?.trim())
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });

  const { data, error } = await admin()
    .from("students")
    .insert({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email,
      phone,
      class_id: class_id || null,
      user_id: user_id || null,
    })
    .select("*, classes(name)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
