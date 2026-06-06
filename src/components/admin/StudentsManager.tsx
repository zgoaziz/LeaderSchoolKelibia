"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Class = { id: string; name: string };
type Student = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  class_id: string;
  classes: { name: string } | null;
};

export default function StudentsManager() {
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "professeur" | "">("");
  const [classes, setClasses] = useState<Class[]>([]);        // available class tabs
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [initLoading, setInitLoading] = useState(true);
  const [studLoading, setStudLoading] = useState(false);
  const [noTeacher, setNoTeacher] = useState(false);

  // Add modal
  const [showModal, setShowModal] = useState(false);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", class_id: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // ── 1. Init: detect role + load class tabs ──
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userRole = user?.app_metadata?.role as string | undefined;

      if (userRole === "admin") {
        setRole("admin");
        const [cRes, allCRes] = await Promise.all([fetch("/api/classes"), fetch("/api/classes")]);
        const cls = await cRes.json();
        const allCls = await allCRes.json();
        const list: Class[] = Array.isArray(cls) ? cls : [];
        setClasses(list);
        setAllClasses(Array.isArray(allCls) ? allCls : []);
      } else if (userRole === "professeur") {
        setRole("professeur");
        const res = await fetch("/api/teachers/me");
        if (!res.ok) {
          setNoTeacher(true);
          setInitLoading(false);
          return;
        }
        const teacher = await res.json();
        const teacherClasses: Class[] = (teacher.teacher_classes ?? [])
          .map((tc: any) => tc.classes)
          .filter(Boolean);
        setClasses(teacherClasses);
        setAllClasses(teacherClasses);
        if (teacherClasses.length > 0) setSelectedClassId(teacherClasses[0].id);
      }
      setInitLoading(false);
    };
    init();
  }, []);

  // ── 2. Load students when class tab changes ──
  useEffect(() => {
    if (initLoading || role === "") return;
    setStudLoading(true);

    let url: string;
    if (role === "admin") {
      url = selectedClassId === "all" ? "/api/students" : `/api/students?class_id=${selectedClassId}`;
    } else {
      // professor: only their classes
      if (selectedClassId === "all") {
        const ids = classes.map((c) => c.id).join(",");
        url = ids ? `/api/students?class_ids=${ids}` : "";
      } else {
        url = `/api/students?class_id=${selectedClassId}`;
      }
    }

    if (!url) {
      setStudents([]);
      setStudLoading(false);
      return;
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .finally(() => setStudLoading(false));
  }, [selectedClassId, initLoading, role, classes]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q)
    );
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setFormLoading(false);
    if (!res.ok) { setFormError(json.error); return; }
    setShowModal(false);
    setForm({ first_name: "", last_name: "", email: "", phone: "", class_id: "" });
    // Reload
    setSelectedClassId((prev) => prev); // triggers useEffect
    setStudLoading(true);
    const url = selectedClassId === "all" && role === "admin"
      ? "/api/students"
      : selectedClassId === "all" && role === "professeur"
        ? `/api/students?class_ids=${classes.map((c) => c.id).join(",")}`
        : `/api/students?class_id=${selectedClassId}`;
    const r = await fetch(url);
    const d = await r.json();
    setStudents(Array.isArray(d) ? d : []);
    setStudLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cet étudiant et toutes ses données ?")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const inputCls = "w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

  if (initLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (noTeacher) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-300 font-semibold mb-1">Profil enseignant introuvable</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Votre compte email n&apos;est pas associé à un profil professeur. Contactez l&apos;administrateur.
          </p>
        </div>
      </div>
    );
  }

  if (role === "professeur" && classes.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400">
          <p className="font-medium">Aucune classe assignée</p>
          <p className="text-sm mt-1">Contactez l&apos;administrateur pour être assigné à une classe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {role === "admin" ? "Gestion des étudiants" : "Étudiants de mes classes"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {role === "admin"
              ? "Tous les étudiants. Filtrez par classe."
              : "Étudiants des classes dont vous êtes enseignant."}
          </p>
        </div>
        {role === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
          >
            + Ajouter un étudiant
          </button>
        )}
      </div>

      {/* Class tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {role === "admin" && (
          <button
            onClick={() => setSelectedClassId("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              selectedClassId === "all"
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300"
            }`}
          >
            Toutes les classes
          </button>
        )}
        {role === "professeur" && classes.length > 1 && (
          <button
            onClick={() => setSelectedClassId("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              selectedClassId === "all"
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300"
            }`}
          >
            Toutes mes classes
          </button>
        )}
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              selectedClassId === cls.id
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300"
            }`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {/* Stats + search */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <span className="text-sm text-gray-400 whitespace-nowrap">
          {studLoading ? "…" : `${filtered.length} étudiant${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Téléphone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Classe</th>
              {role === "admin" && (
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {studLoading ? (
              <tr>
                <td colSpan={role === "admin" ? 5 : 4} className="px-4 py-10 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                    Chargement…
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={role === "admin" ? 5 : 4} className="px-4 py-8 text-center text-gray-400">
                  Aucun étudiant
                </td>
              </tr>
            ) : filtered.map((s) => (
              <tr
                key={s.id}
                onClick={() => router.push(`/dashboard/students/${s.id}`)}
                className="bg-white dark:bg-gray-900 cursor-pointer hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                  {s.last_name} {s.first_name}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.email || "—"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.phone || "—"}</td>
                <td className="px-4 py-3">
                  {s.classes ? (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {s.classes.name}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                {role === "admin" && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/students/${s.id}`)}
                        title="Voir le profil"
                        className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add student modal — admin only */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ajouter un étudiant</h2>
            {formError && <p className="mb-3 text-sm text-red-500">{formError}</p>}
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom *</label>
                  <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                  <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Classe</label>
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">-- Aucune --</option>
                  {allClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
                >
                  {formLoading ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
