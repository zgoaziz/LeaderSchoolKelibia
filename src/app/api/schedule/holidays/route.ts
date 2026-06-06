import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// GET /api/schedule/holidays?week_start=2026-06-02  (week filter)
// GET /api/schedule/holidays                        (all)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const week_start = searchParams.get("week_start");

  let query = db().from("school_holidays").select("*").order("date");

  if (week_start) {
    const end = new Date(week_start + "T12:00:00Z");
    end.setDate(end.getDate() + 6);
    const week_end = end.toISOString().split("T")[0];
    query = query.gte("date", week_start).lte("date", week_end);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/schedule/holidays
export async function POST(req: Request) {
  const { date, name, description } = await req.json();
  if (!date || !name?.trim())
    return NextResponse.json({ error: "Date et nom requis" }, { status: 400 });

  const { data, error } = await db()
    .from("school_holidays")
    .upsert({ date, name: name.trim(), description: description?.trim() || null }, { onConflict: "date" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const fmtDate = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  await db().from("notifications").insert({
    class_id: null,
    title: `Congé – ${name}`,
    message: `Pas de cours le ${fmtDate}.`,
    type: "holiday",
    metadata: { date },
  });

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/schedule/holidays?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const { error } = await db().from("school_holidays").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
