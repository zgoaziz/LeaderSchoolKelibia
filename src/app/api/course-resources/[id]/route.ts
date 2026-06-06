import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// DELETE /api/course-resources/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (role !== "admin" && role !== "professeur") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { error } = await db().from("course_resources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
