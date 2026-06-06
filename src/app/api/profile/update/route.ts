import { createClient } from "@/utils/supabase/server";
import { createClient as adminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { first_name, last_name, avatar_url } = body as {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };

  const admin = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const merged = {
    ...(user.user_metadata ?? {}),
    ...(first_name !== undefined ? { first_name } : {}),
    ...(last_name !== undefined ? { last_name } : {}),
    ...(avatar_url !== undefined ? { avatar_url } : {}),
  };

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: merged,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
