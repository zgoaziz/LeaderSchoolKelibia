"use client";
import { useEffect, useState } from "react";

type Class = { id: string; name: string };
type Student = { id: string; first_name: string; last_name: string; email: string; class_id: string | null };

export default function ClassesManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Student management modal
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const load = async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erreur serveur"); return; }
    setClasses(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Entrez un nom de classe"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    setName("");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette classe ?")) return;
    await fetch(`/api/classes/${id}`, { method: "DELETE" });
    load();
  };

  const openStudentsModal = async (cls: Class) => {
    setSelectedClass(cls);
    setModalError("");
    setModalLoading(true);
    const [inRes, allRes] = await Promise.all([
      fetch(`/api/students?class_id=${cls.id}`),
      fetch(`/api/students`),
    ]);
    const inData = await inRes.json();
    const allData = await allRes.json();
    setClassStudents(Array.isArray(inData) ? inData : []);
    setAllStudents(Array.isArray(allData) ? allData : []);
    setModalLoading(false);
  };

  const assignStudent = async (studentId: string) => {
    setModalError("");
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: selectedClass!.id }),
    });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await openStudentsModal(selectedClass!);
  };

  const removeStudent = async (studentId: string) => {
    setModalError("");
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: null }),
    });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await openStudentsModal(selectedClass!);
  };

  const inClassIds = new Set(classStudents.map((s) => s.id));
  const unassigned = allStudents.filter((s) => !inClassIds.has(s.id));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Gestion des classes</h1>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la classe (ex: 3ème A)"
          className="flex-1 h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Ajout…" : "+ Ajouter"}
        </button>
      </form>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nom de la classe</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {classes.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">Aucune classe</td></tr>
            )}
            {classes.map((c) => (
              <tr
                key={c.id}
                onClick={() => openStudentsModal(c)}
                className="bg-white dark:bg-gray-900 cursor-pointer hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 text-gray-800 dark:text-white font-medium">{c.name}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Étudiants — {selectedClass.name}
              </h2>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {modalError}
              </div>
            )}

            {modalLoading ? (
              <p className="p-6 text-gray-400">Chargement…</p>
            ) : (
              <div className="flex gap-0 overflow-hidden flex-1 min-h-0">
                {/* Students in this class */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                    Dans la classe ({classStudents.length})
                  </p>
                  <div className="overflow-y-auto flex-1">
                    {classStudents.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-gray-400">Aucun étudiant</p>
                    )}
                    {classStudents.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="text-sm text-gray-800 dark:text-white">
                          {s.last_name} {s.first_name}
                        </span>
                        <button
                          onClick={() => removeStudent(s.id)}
                          className="ml-3 text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Students not in this class */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                    Autres étudiants ({unassigned.length})
                  </p>
                  <div className="overflow-y-auto flex-1">
                    {unassigned.length === 0 && (
                      <p className="px-4 py-6 text-center text-sm text-gray-400">Aucun étudiant disponible</p>
                    )}
                    {unassigned.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div>
                          <span className="text-sm text-gray-800 dark:text-white">
                            {s.last_name} {s.first_name}
                          </span>
                          {s.class_id && (
                            <span className="ml-2 text-xs text-orange-500">(autre classe)</span>
                          )}
                        </div>
                        <button
                          onClick={() => assignStudent(s.id)}
                          className="ml-3 text-xs text-brand-500 hover:text-brand-700 font-medium shrink-0"
                        >
                          + Ajouter
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedClass(null)}
                className="w-full py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
