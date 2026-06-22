import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const adminDb = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// GET /api/students/me
// Returns the student record (with class) for the currently logged-in user, matched by email.
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: student, error } = await adminDb()
    .from("students")
    .select("id, first_name, last_name, email, class_id, classes(id, name)")
    .eq("email", user.email)
    .single();

  if (error || !student)
    return NextResponse.json({ error: "Profil étudiant introuvable pour cet email" }, { status: 404 });

  return NextResponse.json(student);
}
