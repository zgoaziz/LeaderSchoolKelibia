import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const db = () => admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const enrollment_id = searchParams.get("enrollment_id");
  let q = db().from("payments").select("*, enrollments(id,first_name,last_name,formation_name)").order("created_at", { ascending: false });
  if (enrollment_id) q = q.eq("enrollment_id", enrollment_id);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = await req.json();
  const { enrollment_id, student_name, amount, type, description, due_date, paid_date, status, payment_method, reference, notes } = body;
  if (!student_name || !amount || !type) return NextResponse.json({ error: "Nom, montant et type requis" }, { status: 400 });
  const { data, error } = await db()
    .from("payments")
    .insert({
      enrollment_id: enrollment_id || null, student_name, amount, type,
      description: description || null, due_date: due_date || null,
      paid_date: paid_date || null, status: status ?? "pending",
      payment_method: payment_method || null, reference: reference || null,
      notes: notes || null, created_by: user.id,
    })
    .select("*, enrollments(id,first_name,last_name,formation_name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
