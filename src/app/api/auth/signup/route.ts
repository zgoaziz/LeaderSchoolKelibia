import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password, first_name, last_name, role } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { first_name, last_name },
    app_metadata: role ? { role } : {},
    email_confirm: true,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already been registered")
    ) {
      return NextResponse.json({ error: "Cet email est déjà enregistré." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user }, { status: 201 });
}
