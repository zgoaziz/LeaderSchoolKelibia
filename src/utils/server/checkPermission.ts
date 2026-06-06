import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const adminDb = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

/**
 * Server-side permission check. Returns true only if the current user
 * has can_view on the given module. Admin always passes.
 */
export async function canAccessModule(module: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const role = user.app_metadata?.role as string | undefined;

  // No assigned role means plain "utilisateur" — deny sensitive modules
  if (!role) return false;

  // Admin bypasses all permission checks
  if (role === "admin") return true;

  // Look up the role row
  const { data: roleRow } = await adminDb()
    .from("roles")
    .select("id")
    .eq("name", role)
    .single();

  if (!roleRow) return false;

  // Check the specific module permission
  const { data: perm } = await adminDb()
    .from("role_permissions")
    .select("can_view")
    .eq("role_id", roleRow.id)
    .eq("module", module)
    .single();

  return Boolean(perm?.can_view);
}
