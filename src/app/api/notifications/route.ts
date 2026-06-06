import { createClient } from "@/utils/supabase/server";
import { createClient as admin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const db = () =>
  admin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// GET /api/notifications — returns notifications + unread count for current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = user.app_metadata?.role ?? "etudiant";
  let notifications: any[] = [];

  if (role === "admin") {
    const { data } = await db()
      .from("notifications")
      .select("*, classes(name)")
      .order("created_at", { ascending: false })
      .limit(50);
    notifications = data ?? [];
  } else {
    // professeur or etudiant — find their class(es)
    let classIds: string[] = [];

    if (role === "professeur") {
      const { data: teacher } = await db()
        .from("teachers")
        .select("id")
        .eq("email", user.email)
        .single();
      if (teacher) {
        const { data: tclasses } = await db()
          .from("teacher_classes")
          .select("class_id")
          .eq("teacher_id", teacher.id);
        classIds = (tclasses ?? []).map((r: any) => r.class_id);
      }
    } else {
      // etudiant — try to find class via students table
      try {
        const { data: student } = await db()
          .from("students")
          .select("class_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (student?.class_id) classIds = [student.class_id];
      } catch {
        // students table may not have user_id column — show global only
      }
    }

    if (classIds.length > 0) {
      const { data } = await db()
        .from("notifications")
        .select("*, classes(name)")
        .or(`class_id.in.(${classIds.join(",")}),class_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(50);
      notifications = data ?? [];
    } else {
      const { data } = await db()
        .from("notifications")
        .select("*, classes(name)")
        .is("class_id", null)
        .order("created_at", { ascending: false })
        .limit(20);
      notifications = data ?? [];
    }
    // Filter out enrollment notifications (admin-only) regardless of their type
    // This handles both new type:"enrollment" and old type:"info" with title "Nouvelle inscription"
    notifications = notifications.filter(
      (n: any) => n.type !== "enrollment" && n.title !== "Nouvelle inscription",
    );
  }

  const lastRead: string | undefined = user.user_metadata?.notifications_read_until;
  const unreadCount = lastRead
    ? notifications.filter((n: any) => n.created_at > lastRead).length
    : notifications.length;

  return NextResponse.json({ notifications, unreadCount });
}
