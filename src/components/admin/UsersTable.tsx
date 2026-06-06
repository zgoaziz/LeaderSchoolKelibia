"use client";
import { useState } from "react";
import { Trash2, RefreshCw, CheckCircle, XCircle, Mail, Pencil, Ban, UserCheck } from "lucide-react";

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: { first_name?: string; last_name?: string };
  app_metadata?: { role?: string };
  created_at: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
};

type RoleOption = { id: string; name: string };

const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  "":          { label: "Utilisateur",   color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  admin:       { label: "Administrateur", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  professeur:  { label: "Professeur",    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  etudiant:    { label: "Etudiant",      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
};

function RoleBadge({ role }: { role?: string }) {
  const key = role ?? "";
  const display = ROLE_DISPLAY[key] ?? {
    label: role || "Utilisateur",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${display.color}`}>
      {display.label}
    </span>
  );
}

function isBannedUser(u: SupabaseUser) {
  return Boolean(u.banned_until && new Date(u.banned_until) > new Date());
}

export function UsersTable({ initialUsers }: { initialUsers: SupabaseUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Edit modal state
  const [editUser, setEditUser] = useState<SupabaseUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Add user modal state
  const [showAdd, setShowAdd]           = useState(false);
  const [addForm, setAddForm]           = useState({ email: "", password: "", first_name: "", last_name: "", role: "" });
  const [addRoles, setAddRoles]         = useState<RoleOption[]>([]);
  const [addRolesLoading, setAddRolesLoading] = useState(false);
  const [addLoading, setAddLoading]     = useState(false);
  const [addError, setAddError]         = useState("");

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      `${u.user_metadata?.first_name ?? ""} ${u.user_metadata?.last_name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const openAdd = async () => {
    setAddForm({ email: "", password: "", first_name: "", last_name: "", role: "" });
    setAddError("");
    setShowAdd(true);
    setAddRolesLoading(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (Array.isArray(data)) setAddRoles(data);
    } finally {
      setAddRolesLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email.trim() || !addForm.password.trim()) {
      setAddError("Email et mot de passe requis");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Erreur"); return; }
      setUsers((prev) => [data, ...prev]);
      setShowAdd(false);
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = async (u: SupabaseUser) => {
    setEditUser(u);
    setEditFirstName(u.user_metadata?.first_name ?? "");
    setEditLastName(u.user_metadata?.last_name ?? "");
    setEditRole(u.app_metadata?.role ?? "");
    setEditError("");
    setRolesLoading(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (Array.isArray(data)) setAllRoles(data);
    } finally {
      setRolesLoading(false);
    }
  };

  const closeEdit = () => { setEditUser(null); setEditError(""); };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSavingEdit(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          role: editRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Erreur"); return; }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? {
                ...u,
                user_metadata: { ...u.user_metadata, first_name: editFirstName.trim(), last_name: editLastName.trim() },
                app_metadata: { ...u.app_metadata, role: editRole || undefined },
              }
            : u,
        ),
      );
      closeEdit();
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (u: SupabaseUser) => {
    const banned = isBannedUser(u);
    setTogglingStatus(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status" }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? {
                ...x,
                banned_until: data.banned
                  ? new Date(Date.now() + 876000 * 3600 * 1000).toISOString()
                  : null,
              }
            : x,
        ),
      );
    } finally {
      setTogglingStatus(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-4 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Ajouter un utilisateur
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/80">
            <tr>
              {["Nom", "Email", "Rôle", "Inscription", "Dernière connexion", "Statut", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
            {filtered.map((u) => {
              const name = [u.user_metadata?.first_name, u.user_metadata?.last_name]
                .filter(Boolean)
                .join(" ");
              const confirmed = Boolean(u.email_confirmed_at);
              const banned = isBannedUser(u);

              return (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                    {name || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RoleBadge role={u.app_metadata?.role} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString("fr-FR")
                      : <span className="italic">Jamais</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {banned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
                        <Ban className="w-3 h-3" /> Banni
                      </span>
                    ) : confirmed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-medium">
                        <XCircle className="w-3 h-3" /> Non vérifié
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {/* Modifier */}
                      <button
                        onClick={() => openEdit(u)}
                        title="Modifier"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <Pencil className="w-3 h-3" /> Modifier
                      </button>

                      {/* Activer / Désactiver */}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={togglingStatus === u.id}
                        title={banned ? "Activer le compte" : "Désactiver le compte"}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border disabled:opacity-50 ${
                          banned
                            ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                        }`}
                      >
                        {togglingStatus === u.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : banned ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <Ban className="w-3 h-3" />
                        )}
                        {banned ? "Activer" : "Désactiver"}
                      </button>

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        {deletingId === u.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add user modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Ajouter un utilisateur</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>

            {addError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {addError}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom</label>
                  <input
                    value={addForm.first_name}
                    onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom</label>
                  <input
                    value={addForm.last_name}
                    onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rôle</label>
                {addRolesLoading ? (
                  <div className="h-10 flex items-center px-3 text-sm text-gray-400">Chargement…</div>
                ) : (
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                  >
                    <option value="">Utilisateur (aucun rôle)</option>
                    {addRoles.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
                >
                  {addLoading ? "Création…" : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">
              Modifier l&apos;utilisateur
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom</label>
                  <input
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom</label>
                  <input
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <p className="h-10 flex items-center px-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {editUser.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rôle</label>
                {rolesLoading ? (
                  <div className="h-10 flex items-center px-3 text-sm text-gray-400">Chargement…</div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400 cursor-pointer"
                  >
                    <option value="">Utilisateur (aucun rôle)</option>
                    {allRoles.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {editError && (
                <p className="text-xs text-red-500">{editError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {savingEdit ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
