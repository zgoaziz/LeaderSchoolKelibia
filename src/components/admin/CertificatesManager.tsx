"use client";
import { useEffect, useRef, useState } from "react";

type Formation = { id: string; title: string };
type Student = { id: string; first_name: string; last_name: string; email?: string; classes?: { name: string } | null };
type Certificate = {
  id: string;
  certificate_number: string;
  student_id: string | null;
  student_name: string;
  formation_id: string | null;
  formation_name: string;
  issue_date: string;
  expiry_date: string | null;
  status: "draft" | "issued" | "revoked";
  notes: string | null;
  created_at: string;
};

const inp =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  issued: "Émis",
  revoked: "Révoqué",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  issued: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  revoked: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const emptyForm = () => ({
  student_id: "",
  student_name: "",
  formation_id: "",
  formation_name: "",
  issue_date: new Date().toISOString().slice(0, 10),
  expiry_date: "",
  notes: "",
});

function StudentPicker({
  students,
  value,
  onChange,
}: {
  students: Student[];
  value: { id: string; name: string };
  onChange: (s: { id: string; name: string }) => void;
}) {
  const [query, setQuery] = useState(value.name);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value.name); }, [value.name]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = students.filter((s) => {
    const full = `${s.first_name} ${s.last_name}`.toLowerCase();
    return query.length === 0 || full.includes(query.toLowerCase());
  });

  const select = (s: Student) => {
    const name = `${s.first_name} ${s.last_name}`;
    setQuery(name);
    setOpen(false);
    onChange({ id: s.id, name });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange({ id: "", name: "" });
    else onChange({ id: "", name: e.target.value });
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un étudiant ou saisir manuellement..."
          className={inp}
          autoComplete="off"
        />
        {value.id && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg max-h-48 overflow-y-auto">
          {filtered.slice(0, 20).map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
                {s.first_name.charAt(0)}{s.last_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {s.first_name} {s.last_name}
                </p>
                {s.classes?.name && (
                  <p className="text-xs text-gray-400 truncate">Classe : {s.classes.name}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.length > 1 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg px-3 py-3">
          <p className="text-xs text-gray-400 text-center">Aucun étudiant trouvé — le nom saisi sera utilisé</p>
        </div>
      )}
    </div>
  );
}

export default function CertificatesManager() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"draft" | "issued" | "revoked">("draft");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [printCert, setPrintCert] = useState<Certificate | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/certificates").then((r) => r.json()),
      fetch("/api/formations").then((r) => r.json()),
      fetch("/api/students").then((r) => r.json()),
    ]).then(([c, f, s]) => {
      setCerts(Array.isArray(c) ? c : []);
      setFormations(Array.isArray(f) ? f : []);
      setStudents(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const selectedFormation = formations.find((f) => f.id === form.formation_id);
    const body = {
      student_id: form.student_id || null,
      student_name: form.student_name,
      formation_id: form.formation_id || null,
      formation_name: selectedFormation?.title ?? form.formation_name,
      issue_date: form.issue_date,
      expiry_date: form.expiry_date || null,
      notes: form.notes || null,
    };
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setShowModal(false);
    load();
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/certificates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce certificat ?")) return;
    await fetch(`/api/certificates/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = certs.filter((c) => c.status === tab);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Certificats</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Émission et gestion des certificats de formation
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setError(""); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau certificat
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5 w-fit">
        {(["draft", "issued", "revoked"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {STATUS_LABELS[t]}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">N° Certificat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Étudiant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Formation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Date d&apos;émission</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{c.certificate_number}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{c.student_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{c.formation_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {new Date(c.issue_date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {c.status === "draft" && (
                        <button onClick={() => handleStatus(c.id, "issued")} className="text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors">
                          Émettre
                        </button>
                      )}
                      {c.status === "issued" && (
                        <>
                          <button onClick={() => handleStatus(c.id, "revoked")} className="text-xs px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 transition-colors">
                            Révoquer
                          </button>
                          <button onClick={() => setPrintCert(c)} title="Imprimer" className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Aucun certificat {STATUS_LABELS[tab].toLowerCase()}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New certificate modal */}
      {showModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">Nouveau certificat</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              {/* Student picker */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Étudiant *
                </label>
                <StudentPicker
                  students={students}
                  value={{ id: form.student_id, name: form.student_name }}
                  onChange={(s) => setForm((f) => ({ ...f, student_id: s.id, student_name: s.name }))}
                />
                {form.student_id && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Étudiant sélectionné depuis la base de données
                  </p>
                )}
                {!form.student_id && form.student_name && (
                  <p className="mt-1 text-xs text-gray-400">
                    Saisie manuelle — pas de lien avec un compte étudiant
                  </p>
                )}
              </div>

              {/* Formation */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Formation *</label>
                <select
                  value={form.formation_id}
                  onChange={(e) => {
                    const f = formations.find((f) => f.id === e.target.value);
                    setForm((prev) => ({ ...prev, formation_id: e.target.value, formation_name: f?.title ?? "" }));
                  }}
                  className={inp}
                >
                  <option value="">— Sélectionner —</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
                {!form.formation_id && (
                  <input
                    value={form.formation_name}
                    onChange={(e) => setForm((f) => ({ ...f, formation_name: e.target.value }))}
                    placeholder="Ou saisir manuellement..."
                    className={`${inp} mt-1.5`}
                  />
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date d&apos;émission *</label>
                  <input type="date" value={form.issue_date} onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} className={inp} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date d&apos;expiration</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} className={inp} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className={`${inp} resize-none`} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  Annuler
                </button>
                <button type="submit" disabled={saving || !form.student_name} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
                  {saving ? "Création..." : "Créer le certificat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print modal */}
      {printCert && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div id="certificate-print" className="relative bg-linear-to-br from-blue-50 to-indigo-50 p-10 text-center">
              <div className="absolute inset-3 border-2 border-blue-200 rounded-xl pointer-events-none" />
              <div className="absolute inset-4 border border-blue-100 rounded-xl pointer-events-none" />
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-blue-800 tracking-wide">Leader School Kélibia</h1>
                  <p className="text-sm text-blue-500">Centre de Formation Professionnelle</p>
                </div>
                <div className="border-t border-b border-blue-200 py-4 mb-6">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Certificat de Réussite</p>
                  <p className="text-base text-gray-600">Ce certificat est décerné à</p>
                  <h2 className="text-3xl font-bold text-gray-800 mt-2 mb-1" style={{ fontFamily: "Georgia, serif" }}>{printCert.student_name}</h2>
                  <p className="text-gray-500 text-sm">pour avoir complété avec succès la formation</p>
                  <h3 className="text-xl font-semibold text-blue-700 mt-2">{printCert.formation_name}</h3>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Date d&apos;émission</p>
                    <p className="font-medium text-gray-700">
                      {new Date(printCert.issue_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-blue-300 flex items-center justify-center mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase">N° Certificat</p>
                    <p className="font-mono text-xs font-medium text-gray-700">{printCert.certificate_number}</p>
                  </div>
                </div>
                <div className="border-t border-blue-100 pt-4">
                  <p className="text-xs text-gray-400">Leader School Kélibia — Formation professionnelle de qualité</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
              <button onClick={() => setPrintCert(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100">
                Fermer
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                </svg>
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
