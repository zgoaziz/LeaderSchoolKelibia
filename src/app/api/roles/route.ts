import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ALL_MODULES = [
  "dashboard","students","classes","teachers","subjects","schedule","absences","users","roles",
];

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function GET() {
  const { data, error } = await admin()
    .from("roles")
    .select("id, name, is_system, is_public, role_permissions(module, can_view, can_create, can_edit, can_delete)")
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const roles = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    is_system: r.is_system,
    is_public: r.is_public ?? false,
    permissions: Object.fromEntries(
      (r.role_permissions as any[]).map((p) => [
        p.module,
        { can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit, can_delete: p.can_delete },
      ]),
    ),
  }));

  return NextResponse.json(roles);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const { data: role, error } = await admin()
    .from("roles")
    .insert({ name: name.trim().toLowerCase(), is_system: false, is_public: false })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ce nom de rôle existe déjà" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Initialize all modules with no permissions
  const perms = ALL_MODULES.map((m) => ({
    role_id: role.id,
    module: m,
    can_view: false,
    can_create: false,
    can_edit: false,
    can_delete: false,
  }));
  await admin().from("role_permissions").insert(perms);

  return NextResponse.json({ id: role.id, name: name.trim().toLowerCase() }, { status: 201 });
}
