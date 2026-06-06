import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// POST /api/notifications/read — mark all as read (stores timestamp in user metadata)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  await supabase.auth.updateUser({
    data: { notifications_read_until: new Date().toISOString() },
  });

  return NextResponse.json({ success: true });
}
