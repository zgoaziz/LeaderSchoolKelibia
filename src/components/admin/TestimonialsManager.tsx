"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Testimonial = {
  id: string;
  content: string;
  author_name: string;
  author_role: string | null;
  rating: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const inp =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

function Stars({ n, interactive, onChange }: { n: number; interactive?: boolean; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={`${interactive ? "text-2xl hover:scale-110 transition-transform" : "text-sm"} ${i < n ? "text-yellow-400" : "text-gray-200 dark:text-gray-600"}`}
          disabled={!interactive}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function TestimonialsManager() {
  const [role, setRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [form, setForm] = useState({ content: "", author_name: "", author_role: "", rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setRole(user.app_metadata?.role ?? "");
        const meta = user.user_metadata as { first_name?: string; last_name?: string } | undefined;
        setUserName([meta?.first_name, meta?.last_name].filter(Boolean).join(" "));
      }
    });
  }, []);

  const load = () => {
    setLoading(true);
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((d) => {
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };
  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const body = { ...form, author_name: form.author_name || userName };
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setFormError(data.error);
      return;
    }
    setSubmitted(true);
    setForm({ content: "", author_name: "", author_role: "", rating: 5 });
  };

  const filtered = items.filter((i) => i.status === tab);
  const pendingCount = items.filter((i) => i.status === "pending").length;

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (role !== "admin") {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Témoignages</h1>
        <div className="max-w-lg">
          {submitted ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
              <p className="text-green-700 dark:text-green-400 font-semibold">Témoignage envoyé !</p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                Il sera visible après validation par l&apos;administrateur.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm text-green-700 dark:text-green-400 hover:underline"
              >
                Envoyer un autre témoignage
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-4">
                Partager votre expérience
              </h2>
              {formError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Votre nom *
                  </label>
                  <input
                    value={form.author_name || userName}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    className={inp}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Formation suivie
                  </label>
                  <input
                    value={form.author_role}
                    onChange={(e) => setForm({ ...form, author_role: e.target.value })}
                    placeholder="Ex: Anglais — Niveau B2"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Note
                  </label>
                  <Stars n={form.rating} interactive onChange={(v) => setForm({ ...form, rating: v })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Votre témoignage *
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={4}
                    placeholder="Partagez votre expérience avec Leader School..."
                    className={`${inp} resize-none`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
                >
                  {submitting ? "Envoi en cours..." : "Envoyer mon témoignage"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Témoignages</h1>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5 w-fit">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {STATUS_LABELS[t]}
            {t === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800 dark:text-white text-sm">{t.author_name}</span>
                  {t.author_role && (
                    <span className="text-xs text-gray-400">{t.author_role}</span>
                  )}
                  <Stars n={t.rating} />
                </div>
                <p
                  className={`mt-1 text-sm text-gray-600 dark:text-gray-400 ${expandedId === t.id ? "" : "line-clamp-2"}`}
                >
                  {t.content}
                </p>
                {t.content.length > 120 && (
                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="mt-0.5 text-xs text-brand-500 hover:underline"
                  >
                    {expandedId === t.id ? "Voir moins" : "Voir tout"}
                  </button>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(t.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {tab !== "approved" && (
                  <button
                    onClick={() => handleStatus(t.id, "approved")}
                    title="Approuver"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
                {tab !== "rejected" && (
                  <button
                    onClick={() => handleStatus(t.id, "rejected")}
                    title="Rejeter"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(t.id)}
                  title="Supprimer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
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
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun témoignage {STATUS_LABELS[tab].toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}
