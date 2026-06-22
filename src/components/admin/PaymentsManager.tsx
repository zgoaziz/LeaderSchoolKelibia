"use client";
import { useEffect, useState } from "react";

type Payment = {
  id: string;
  enrollment_id: string | null;
  student_name: string;
  amount: number;
  type: "inscription" | "mensuel" | "seance";
  description: string | null;
  due_date: string | null;
  paid_date: string | null;
  status: "pending" | "paid" | "late" | "cancelled";
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

const inp =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  late: "En retard",
  cancelled: "Annulé",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  late: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};
const TYPE_COLORS: Record<string, string> = {
  inscription: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  mensuel: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  seance: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};
const TYPE_LABELS: Record<string, string> = {
  inscription: "Inscription",
  mensuel: "Mensuel",
  seance: "Séance",
};

const emptyForm = () => ({
  student_name: "",
  enrollment_id: "",
  amount: "",
  type: "mensuel" as "inscription" | "mensuel" | "seance",
  description: "",
  due_date: "",
  paid_date: "",
  status: "pending" as "pending" | "paid" | "late" | "cancelled",
  payment_method: "",
  reference: "",
  notes: "",
});

function fmt(amount: number) {
  return `${amount.toLocaleString("fr-TN")} DT`;
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "paid" | "late" | "cancelled">("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/payments")
      .then((r) => r.json())
      .then((d) => {
        setPayments(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };
  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      ...form,
      amount: Number(form.amount),
      enrollment_id: form.enrollment_id || null,
      description: form.description || null,
      due_date: form.due_date || null,
      paid_date: form.paid_date || null,
      payment_method: form.payment_method || null,
      reference: form.reference || null,
      notes: form.notes || null,
    };
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowModal(false);
    setForm(emptyForm());
    load();
  };

  const markPaid = async (p: Payment) => {
    const today = new Date().toISOString().slice(0, 10);
    await fetch(`/api/payments/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paid_date: today }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = tab === "all" ? payments : payments.filter((p) => p.status === tab);
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalLate = payments.filter((p) => p.status === "late").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Paiements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Suivi des paiements par étudiant
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setError(""); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau paiement
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-xl p-4">
          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Total payé</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">{fmt(totalPaid)}</p>
          <p className="text-xs text-green-500 mt-0.5">{payments.filter((p) => p.status === "paid").length} paiement(s)</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 rounded-xl p-4">
          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">En attente</p>
          <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{fmt(totalPending)}</p>
          <p className="text-xs text-yellow-500 mt-0.5">{payments.filter((p) => p.status === "pending").length} paiement(s)</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-xl p-4">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">En retard</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{fmt(totalLate)}</p>
          <p className="text-xs text-red-500 mt-0.5">{payments.filter((p) => p.status === "late").length} paiement(s)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5 w-fit">
        {(["all", "pending", "paid", "late", "cancelled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t === "all" ? "Tous" : STATUS_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Étudiant
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Montant
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                  Échéance
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-white">{p.student_name}</p>
                    {p.description && <p className="text-xs text-gray-400 truncate max-w-[150px]">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}>
                      {TYPE_LABELS[p.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800 dark:text-white">{fmt(p.amount)}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
                    {p.due_date ? new Date(p.due_date).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {p.status !== "paid" && p.status !== "cancelled" && (
                        <button
                          onClick={() => markPaid(p)}
                          title="Marquer payé"
                          className="text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors"
                        >
                          Payé
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
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
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Aucun paiement
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">Nouveau paiement</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Nom de l&apos;étudiant *
                </label>
                <input
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  className={inp}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Montant (DT) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={inp}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as "inscription" | "mensuel" | "seance" })
                    }
                    className={inp}
                  >
                    <option value="inscription">Inscription</option>
                    <option value="mensuel">Mensuel</option>
                    <option value="seance">Séance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Mensualité Mai 2026"
                  className={inp}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Date d&apos;échéance
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Date de paiement
                  </label>
                  <input
                    type="date"
                    value={form.paid_date}
                    onChange={(e) => setForm({ ...form, paid_date: e.target.value })}
                    className={inp}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Statut
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as "pending" | "paid" | "late" | "cancelled" })
                  }
                  className={inp}
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="late">En retard</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Mode de paiement
                </label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className={inp}
                >
                  <option value="">— Sélectionner —</option>
                  <option value="especes">Espèces</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="carte">Carte bancaire</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Référence
                </label>
                <input
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="N° de reçu ou transaction"
                  className={inp}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
