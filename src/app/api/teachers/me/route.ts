import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const adminDb = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// GET /api/teachers/me
// Returns the teacher record (with assigned classes) for the currently logged-in user,
// matched by email. Used by professors on the absences page.
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: teacher, error } = await adminDb()
    .from("teachers")
    .select("id, first_name, last_name, email, teacher_classes(class_id, classes(id, name))")
    .eq("email", user.email)
    .single();

  if (error || !teacher)
    return NextResponse.json({ error: "Profil enseignant introuvable pour cet email" }, { status: 404 });

  return NextResponse.json(teacher);
}
