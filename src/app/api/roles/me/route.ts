import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ALL_MODULES = [
  "dashboard","students","classes","teachers","subjects","schedule","absences","courses","users","roles",
  "formations","gallery","testimonials","enrollments","payments","certificates",
];

type Perm = { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean };
const view = (): Perm => ({ can_view: true, can_create: false, can_edit: false, can_delete: false });
const crud = (): Perm => ({ can_view: true, can_create: true, can_edit: true, can_delete: false });

// Default permissions applied when the role has no entries in role_permissions table
const ROLE_DEFAULTS: Record<string, Record<string, Perm>> = {
  professeur: {
    dashboard:  view(),
    students:   view(),
    classes:    view(),
    teachers:   view(),
    subjects:   view(),
    schedule:   view(),
    absences:   crud(),
    courses:    crud(),
  },
  etudiant: {
    dashboard:  view(),
    schedule:   view(),
    courses:    view(),
  },
};

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

  // Role exists but not found in DB (deleted?) — fall back to code defaults or deny
  if (!roleData) return NextResponse.json(ROLE_DEFAULTS[role] ?? {});

  const dbPerms = (roleData.role_permissions as any[]);

  // If no permissions are configured in DB yet, use code defaults for known roles
  if (dbPerms.length === 0) return NextResponse.json(ROLE_DEFAULTS[role] ?? {});

  const permissions = Object.fromEntries(
    dbPerms.map((p) => [
      p.module,
      { can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit, can_delete: p.can_delete },
    ]),
  );

  return NextResponse.json(permissions);
}
