import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// PUT /api/roles/[id] — update permissions and/or is_public visibility
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { permissions, is_public } = body;

  if (typeof is_public === "boolean") {
    const { error } = await admin().from("roles").update({ is_public }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (permissions) {
    const rows = Object.entries(permissions).map(([module, perm]: [string, any]) => ({
      role_id: id,
      module,
      can_view: !!perm.can_view,
      can_create: !!perm.can_create,
      can_edit: !!perm.can_edit,
      can_delete: !!perm.can_delete,
    }));
    const { error } = await admin().from("role_permissions").upsert(rows, { onConflict: "role_id,module" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/roles/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: role, error: fetchErr } = await admin()
    .from("roles")
    .select("is_system")
    .eq("id", id)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (role?.is_system) return NextResponse.json({ error: "Impossible de supprimer un rôle système" }, { status: 403 });

  const { error } = await admin().from("roles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
