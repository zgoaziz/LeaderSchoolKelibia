"use client";
import { Fragment, useEffect, useState } from "react";
import {
  ChevronRight, Save, Eye, EyeOff, Plus, Pencil, Trash2, ShieldCheck, Loader2,
} from "lucide-react";
import { clearPermissionsCache } from "@/hooks/usePermissions";

type ModulePerm = { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean };
type RoleEntry = { id: string; name: string; is_system: boolean; is_public: boolean; permissions: Record<string, ModulePerm> };

const MODULES: { key: string; label: string; section: string }[] = [
  { key: "dashboard", label: "Tableau de bord",    section: "Aperçu" },
  { key: "students",  label: "Étudiants",           section: "Gestion" },
  { key: "classes",   label: "Classes",             section: "Gestion" },
  { key: "teachers",  label: "Professeurs",         section: "Gestion" },
  { key: "subjects",  label: "Matières",            section: "Gestion" },
  { key: "schedule",  label: "Emploi du temps",     section: "Gestion" },
  { key: "absences",  label: "Absences",            section: "Gestion" },
  { key: "courses",   label: "Cours & Classroom",   section: "Gestion" },
  { key: "users",        label: "Utilisateurs",        section: "Administration" },
  { key: "roles",        label: "Rôles & Permissions", section: "Administration" },
  { key: "formations",   label: "Formations",          section: "Site Public" },
  { key: "gallery",      label: "Galerie",             section: "Site Public" },
  { key: "testimonials", label: "Témoignages",         section: "Site Public" },
  { key: "enrollments",  label: "Inscriptions",        section: "Site Public" },
  { key: "payments",     label: "Paiements",           section: "Site Public" },
  { key: "certificates", label: "Certificats",         section: "Site Public" },
];

const ACTIONS: { key: keyof ModulePerm; label: string }[] = [
  { key: "can_view",   label: "Voir" },
  { key: "can_create", label: "Créer" },
  { key: "can_edit",   label: "Modifier" },
  { key: "can_delete", label: "Supprimer" },
];

const SECTIONS = [...new Set(MODULES.map((m) => m.section))];

const ROLE_COLORS: Record<string, string> = {
  admin:      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  professeur: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  etudiant:   "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
};
const roleColor = (name: string) =>
  ROLE_COLORS[name] ?? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700";

const emptyPerm = (): ModulePerm => ({ can_view: false, can_create: false, can_edit: false, can_delete: false });

export default function RolesManager() {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [selected, setSelected] = useState<RoleEntry | null>(null);
  const [draft, setDraft] = useState<Record<string, ModulePerm> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Rename dialog
  const [renameTarget, setRenameTarget] = useState<RoleEntry | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<RoleEntry | null>(null);

  // Toggling public visibility
  const [togglingPublic, setTogglingPublic] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/roles");
    const data = await res.json();
    const list: RoleEntry[] = Array.isArray(data) ? data : [];
    setRoles(list);
    if (selected) {
      const updated = list.find((r) => r.id === selected.id);
      if (updated) { setSelected(updated); setDraft(JSON.parse(JSON.stringify(updated.permissions))); }
    }
    setLoading(false);
  };

  const selectRole = (r: RoleEntry) => {
    setSelected(r);
    setDraft(JSON.parse(JSON.stringify(r.permissions)));
    setSaveMsg("");
  };

  const togglePerm = (mod: string, action: keyof ModulePerm) => {
    if (!draft) return;
    const cur: ModulePerm = draft[mod] ?? emptyPerm();
    const next = { ...cur, [action]: !cur[action] };
    if (action !== "can_view" && next[action]) next.can_view = true;
    if (action === "can_view" && !next.can_view) {
      next.can_create = false; next.can_edit = false; next.can_delete = false;
    }
    setDraft({ ...draft, [mod]: next });
  };

  const toggleRow = (mod: string, all: boolean) => {
    if (!draft) return;
    setDraft({
      ...draft,
      [mod]: all
        ? { can_view: true, can_create: true, can_edit: true, can_delete: true }
        : emptyPerm(),
    });
  };

  const save = async () => {
    if (!selected || !draft) return;
    setSaving(true);
    setSaveMsg("");
    const res = await fetch(`/api/roles/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: draft }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg("Permissions sauvegardées");
      clearPermissionsCache();
      load();
      setTimeout(() => setSaveMsg(""), 3000);
    } else {
      const j = await res.json();
      setSaveMsg(j.error ?? "Erreur");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) { setCreateError("Nom requis"); return; }
    setCreateLoading(true);
    setCreateError("");
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName }),
    });
    const json = await res.json();
    setCreateLoading(false);
    if (!res.ok) { setCreateError(json.error); return; }
    setCreateOpen(false);
    setCreateName("");
    load();
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameName.trim()) { setRenameError("Nom requis"); return; }
    setRenameLoading(true);
    setRenameError("");
    const res = await fetch(`/api/roles/${renameTarget.id}/rename`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName }),
    });
    const json = await res.json();
    setRenameLoading(false);
    if (!res.ok) { setRenameError(json.error); return; }
    setRenameTarget(null);
    if (selected?.id === renameTarget.id) { setSelected(null); setDraft(null); }
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/roles/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    if (selected?.id === deleteTarget.id) { setSelected(null); setDraft(null); }
    setDeleteTarget(null);
    load();
  };

  const handleTogglePublic = async (r: RoleEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingPublic(r.id);
    const res = await fetch(`/api/roles/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: !r.is_public }),
    });
    setTogglingPublic(null);
    if (res.ok) {
      setRoles((prev) => prev.map((x) => x.id === r.id ? { ...x, is_public: !r.is_public } : x));
      if (selected?.id === r.id) setSelected((prev) => prev ? { ...prev, is_public: !r.is_public } : prev);
    }
  };

  const hasChanges = draft && selected
    ? JSON.stringify(draft) !== JSON.stringify(selected.permissions)
    : false;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rôles & Permissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Créez des rôles, configurez leurs accès et définissez leur visibilité sur la page d&apos;inscription.
          </p>
        </div>
        <button
          onClick={() => { setCreateName(""); setCreateError(""); setCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
        >
          <Plus className="w-4 h-4" /> Nouveau rôle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* Role list */}
          <div className="space-y-2">
            {roles.map((r) => {
              const visibleCount = Object.values(r.permissions).filter((p) => p.can_view).length;
              const isActive = selected?.id === r.id;
              const isToggling = togglingPublic === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => selectRole(r)}
                  className={`group cursor-pointer rounded-xl border px-4 py-3 transition-all ${
                    isActive
                      ? "border-brand-400 bg-brand-50 dark:bg-brand-900/10 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${roleColor(r.name)}`}>
                      {r.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {/* Public/Private toggle */}
                      <button
                        title={r.is_public ? "Visible sur inscription — cliquer pour rendre privé" : "Privé — cliquer pour afficher sur inscription"}
                        onClick={(e) => handleTogglePublic(r, e)}
                        disabled={isToggling}
                        className={`rounded p-1 transition-all ${
                          r.is_public
                            ? "text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                            : "text-gray-400 opacity-0 hover:bg-gray-100 dark:hover:bg-gray-700 group-hover:opacity-100"
                        } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                      >
                        {isToggling
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : r.is_public
                            ? <Eye className="w-3.5 h-3.5" />
                            : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {!r.is_system && (
                        <>
                          <button
                            title="Renommer"
                            onClick={(e) => { e.stopPropagation(); setRenameName(r.name); setRenameError(""); setRenameTarget(r); }}
                            className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-700 group-hover:opacity-100"
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
                            className="rounded p-1 opacity-0 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform text-gray-400 ${isActive ? "rotate-90 text-brand-500" : ""}`}
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {visibleCount} module{visibleCount !== 1 ? "s" : ""} accessible{visibleCount !== 1 ? "s" : ""}
                    </p>
                    {r.is_system && (
                      <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                        système
                      </span>
                    )}
                    {r.is_public && (
                      <span className="rounded bg-brand-50 dark:bg-brand-900/20 px-1.5 py-0.5 text-[10px] text-brand-600 dark:text-brand-400 flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" /> inscription
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {roles.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">Aucun rôle créé</p>
            )}
          </div>

          {/* Permission matrix */}
          {selected && draft ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-white capitalize">
                    {selected.name}
                    {selected.is_system && (
                      <span className="ml-2 text-xs font-normal text-gray-400">(rôle système)</span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Cochez les actions autorisées par module.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {saveMsg && (
                    <span className={`text-xs font-medium ${saveMsg.includes("Erreur") || saveMsg.includes("ible") ? "text-red-500" : "text-green-600"}`}>
                      {saveMsg}
                    </span>
                  )}
                  <button
                    onClick={save}
                    disabled={!hasChanges || saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="py-3 pl-6 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">Module</th>
                      {ACTIONS.map((a) => (
                        <th key={a.key} className="w-24 px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400 text-xs">
                          {a.label}
                        </th>
                      ))}
                      <th className="w-16 px-3 py-3 text-center font-medium text-gray-500 dark:text-gray-400 text-xs">Tout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {SECTIONS.map((section) => {
                      const mods = MODULES.filter((m) => m.section === section);
                      return (
                        <Fragment key={section}>
                          <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                            <td colSpan={6} className="py-1.5 pl-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                              {section}
                            </td>
                          </tr>
                          {mods.map((mod) => {
                            const perm: ModulePerm = draft[mod.key] ?? emptyPerm();
                            const allOn = ACTIONS.every((a) => perm[a.key]);
                            return (
                              <tr key={mod.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="py-3 pl-6 pr-4 font-medium text-gray-800 dark:text-white">{mod.label}</td>
                                {ACTIONS.map((a) => (
                                  <td key={a.key} className="px-3 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!!perm[a.key]}
                                      onChange={() => togglePerm(mod.key, a.key)}
                                      className="h-4 w-4 cursor-pointer accent-brand-500"
                                    />
                                  </td>
                                ))}
                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={allOn}
                                    onChange={() => toggleRow(mod.key, !allOn)}
                                    title="Tout cocher / décocher"
                                    className="h-4 w-4 cursor-pointer accent-brand-500"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
              <div className="text-gray-400">
                <ShieldCheck className="mx-auto mb-3 w-10 h-10 opacity-30" />
                <p className="font-medium">Sélectionnez un rôle</p>
                <p className="mt-1 text-sm">pour configurer ses permissions</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create role dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Nouveau rôle</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom du rôle *</label>
                <input
                  autoFocus
                  value={createName}
                  onChange={(e) => { setCreateName(e.target.value); setCreateError(""); }}
                  placeholder="ex : superviseur"
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                />
                {createError && <p className="mt-1 text-xs text-red-500">{createError}</p>}
              </div>
              <p className="text-xs text-gray-400">
                Le rôle sera privé par défaut. Activez l&apos;icône <Eye className="inline w-3 h-3" /> pour le rendre visible sur la page d&apos;inscription.
              </p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">
                  Annuler
                </button>
                <button type="submit" disabled={createLoading} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
                  {createLoading ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename dialog */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Renommer « {renameTarget.name} »
            </h2>
            <form onSubmit={handleRename} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nouveau nom *</label>
                <input
                  autoFocus
                  value={renameName}
                  onChange={(e) => { setRenameName(e.target.value); setRenameError(""); }}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                />
                {renameError && <p className="mt-1 text-xs text-red-500">{renameError}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setRenameTarget(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">
                  Annuler
                </button>
                <button type="submit" disabled={renameLoading} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
                  {renameLoading ? "Renommage…" : "Renommer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Supprimer le rôle</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Supprimer « <strong>{deleteTarget.name}</strong> » ? Cette action est irréversible.
              Les utilisateurs ayant ce rôle doivent être réassignés.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">
                Annuler
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
