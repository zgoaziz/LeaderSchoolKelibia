import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ALL_MODULES = [
  "dashboard","students","classes","teachers","subjects","schedule","absences","courses","users","roles",
  "formations","gallery","testimonials","enrollments","payments","certificates",
];

function fullAccess() {
  return Object.fromEntries(
    ALL_MODULES.map((m) => [m, { can_view: true, can_create: true, can_edit: true, can_delete: true }]),
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({}, { status: 401 });

  const role = user.app_metadata?.role as string | undefined;

  // Admin = full access
  if (role === "admin") return NextResponse.json(fullAccess());

  // No role assigned = no access to any module
  if (!role) return NextResponse.json({});

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: roleData } = await adminClient
    .from("roles")
    .select("role_permissions(module, can_view, can_create, can_edit, can_delete)")
    .eq("name", role)
    .single();

  // Role exists but not found in DB (deleted?) = deny all
  if (!roleData) return NextResponse.json({});

  const permissions = Object.fromEntries(
    (roleData.role_permissions as any[]).map((p) => [
      p.module,
      { can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit, can_delete: p.can_delete },
    ]),
  );

  return NextResponse.json(permissions);
}
