import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { data, error } = await db()
    .from("certificates")
    .select("*, formations(id,title), students(id,first_name,last_name)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = await req.json();
  const { student_id, student_name, formation_id, formation_name, issue_date, expiry_date, notes } = body;
  if (!student_name || !formation_name) return NextResponse.json({ error: "Nom étudiant et formation requis" }, { status: 400 });
  // Generate a unique certificate number using timestamp + random suffix
  const certNum = "CERT-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  const { data, error } = await db()
    .from("certificates")
    .insert({
      student_id: student_id || null, student_name,
      formation_id: formation_id || null, formation_name,
      certificate_number: certNum,
      issue_date: issue_date || new Date().toISOString().slice(0, 10),
      expiry_date: expiry_date || null,
      status: "draft",
      notes: notes || null,
      created_by: user.id,
    })
    .select("*, formations(id,title), students(id,first_name,last_name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
