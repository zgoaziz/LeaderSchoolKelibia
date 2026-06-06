import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

function makeAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "your-service-role-key-here") return null;
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const adminClient = makeAdmin();
  if (!adminClient) return NextResponse.json({ error: "Service role key non configure" }, { status: 500 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  // Toggle ban / unban
  if (body.action === "toggle_status") {
    const { data: targetData, error: fetchErr } = await adminClient.auth.admin.getUserById(id);
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    const bannedUntil = (targetData.user as any)?.banned_until as string | null | undefined;
    const isBanned = Boolean(bannedUntil && new Date(bannedUntil) > new Date());

    const { error } = await adminClient.auth.admin.updateUserById(id, {
      ban_duration: isBanned ? "none" : "876000h",
    } as any);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, banned: !isBanned });
  }

  // Build update for role / name changes
  const authUpdate: Record<string, any> = {};

  if ("role" in body) {
    authUpdate.app_metadata = { role: body.role || null };
  }

  if ("first_name" in body || "last_name" in body) {
    authUpdate.user_metadata = {
      ...(body.first_name !== undefined && { first_name: body.first_name }),
      ...(body.last_name !== undefined && { last_name: body.last_name }),
    };
  }

  if (Object.keys(authUpdate).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
  }

  const { error } = await adminClient.auth.admin.updateUserById(id, authUpdate);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (user.id === id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "your-service-role-key-here") {
    return NextResponse.json({ error: "Service role key non configuré" }, { status: 500 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
