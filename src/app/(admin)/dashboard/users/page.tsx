import type { Metadata } from "next";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { UsersTable } from "@/components/admin/UsersTable";
import { redirect } from "next/navigation";
import { Users, AlertTriangle } from "lucide-react";
import { canAccessModule } from "@/utils/server/checkPermission";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs | Leader School Kelibia",
};

export const dynamic = "force-dynamic";

async function fetchUsers(): Promise<{ users: any[]; error: string | null }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "your-service-role-key-here") {
    return { users: [], error: "SUPABASE_SERVICE_ROLE_KEY non configuré dans .env.local" };
  }

  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (error) return { users: [], error: error.message };
    return { users: data.users, error: null };
  } catch (err) {
    return { users: [], error: String(err) };
  }
}

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Server-side permission check — redirect to dashboard if no access
  const allowed = await canAccessModule("users");
  if (!allowed) redirect("/dashboard");

  const { users, error } = await fetchUsers();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
          <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tous les comptes inscrits sur la plateforme
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-300">Configuration requise</p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">{error}</p>
              <ol className="mt-3 text-sm text-yellow-700 dark:text-yellow-400 list-decimal list-inside space-y-1">
                <li>Ouvrez Supabase → Project Settings → API</li>
                <li>Copiez la <strong>Service Role Key</strong></li>
                <li>
                  Ajoutez dans <code className="bg-yellow-100 dark:bg-yellow-800/40 px-1 rounded">.env.local</code> :{" "}
                  <code className="bg-yellow-100 dark:bg-yellow-800/40 px-1 rounded">
                    SUPABASE_SERVICE_ROLE_KEY=votre-cle
                  </code>
                </li>
                <li>Redémarrez le serveur de développement</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <UsersTable initialUsers={users} />
      )}
    </div>
  );
}
