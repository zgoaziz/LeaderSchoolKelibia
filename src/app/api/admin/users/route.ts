import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  // Verify requesting user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "your-service-role-key-here") {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY non configuré dans .env.local" },
      { status: 500 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data.users });
}

// POST /api/admin/users — create a new user
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "your-service-role-key-here")
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY non configuré" }, { status: 500 });

  const { email, password, first_name, last_name, role } = await req.json();

  if (!email?.trim() || !password?.trim())
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: created, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true,
    user_metadata: {
      first_name: first_name?.trim() || "",
      last_name: last_name?.trim() || "",
    },
    app_metadata: role ? { role } : {},
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(created.user, { status: 201 });
}
