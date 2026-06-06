import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { canAccessModule } from "@/utils/server/checkPermission";
import RolesManager from "@/components/admin/RolesManager";

export const metadata = { title: "Rôles & Permissions" };

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Server-side permission check — redirect to dashboard if no access
  const allowed = await canAccessModule("roles");
  if (!allowed) redirect("/dashboard");

  return <RolesManager />;
}
