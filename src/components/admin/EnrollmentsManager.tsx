"use client";
import { useEffect, useState } from "react";

type Enrollment = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  formation_id: string | null;
  formation_name: string;
  niveau: string | null;
  message: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  created_at: string;
};

const inp =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Complété",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function EnrollmentsManager() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "confirmed" | "cancelled" | "completed">("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [detailNotes, setDetailNotes] = useState("");
  const [detailStatus, setDetailStatus] = useState<Enrollment["status"]>("pending");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/enrollments")
      .then((r) => r.json())
      .then((d) => {
        setEnrollments(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };
  useEffect(() => {
    load();
  }, []);

  const openDetail = (e: Enrollment) => {
    setSelected(e);
    setDetailNotes(e.notes ?? "");
    setDetailStatus(e.status);
  };

  const handleSaveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/enrollments/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: detailStatus, notes: detailNotes }),
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette inscription ?")) return;
    await fetch(`/api/enrollments/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = enrollments.filter((e) => {
    const nameMatch = `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase());
    return e.status === tab && (search === "" || nameMatch);
  });
  const pendingCount = enrollments.filter((e) => e.status === "pending").length;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inscriptions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gérez les demandes d&apos;inscription
          </p>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {(["pending", "confirmed", "cancelled", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {STATUS_LABELS[t]}
              {t === "pending" && pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom..."
          className="sm:w-56 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Candidat
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                  Formation
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {e.first_name} {e.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{e.email}</p>
                    {e.phone && <p className="text-xs text-gray-400">{e.phone}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-gray-700 dark:text-gray-300">{e.formation_name}</p>
                    {e.niveau && <p className="text-xs text-gray-400">{e.niveau}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(e.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status]}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openDetail(e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Voir / Modifier"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                        title="Supprimer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    Aucune inscription {STATUS_LABELS[tab].toLowerCase()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Inscription — {selected.first_name} {selected.last_name}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-gray-700 dark:text-gray-300">{selected.email}</p>
                </div>
                {selected.phone && (
                  <div>
                    <p className="text-xs text-gray-400">Téléphone</p>
                    <p className="text-gray-700 dark:text-gray-300">{selected.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Formation</p>
                  <p className="text-gray-700 dark:text-gray-300">{selected.formation_name}</p>
                </div>
                {selected.niveau && (
                  <div>
                    <p className="text-xs text-gray-400">Niveau</p>
                    <p className="text-gray-700 dark:text-gray-300">{selected.niveau}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Date d&apos;inscription</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {new Date(selected.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              {selected.message && (
                <div>
                  <p className="text-xs text-gray-400">Message</p>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-xs mt-1">
                    {selected.message}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Statut
                </label>
                <select
                  value={detailStatus}
                  onChange={(e) => setDetailStatus(e.target.value as Enrollment["status"])}
                  className={inp}
                >
                  {(["pending", "confirmed", "cancelled", "completed"] as const).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Notes internes
                </label>
                <textarea
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes sur ce candidat..."
                  className={`${inp} resize-none`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Fermer
                </button>
                <button
                  onClick={handleSaveDetail}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
              <a
                href={`/dashboard/payments?enrollment_id=${selected.id}&student=${encodeURIComponent(selected.first_name + " " + selected.last_name)}`}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Gérer les paiements
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
