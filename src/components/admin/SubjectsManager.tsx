"use client";
import { useEffect, useState } from "react";

type Subject = { id: string; name: string };
type Class = { id: string; name: string };
type Assignment = { id: string; class_id: string; classes: { id: string; name: string } };
type Teacher = { id: string; first_name: string; last_name: string; email?: string };
type TeacherAssignment = { id: string; teacher_id: string; teachers: Teacher };

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [modalTab, setModalTab] = useState<"classes" | "profs">("classes");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Classes tab
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);

  // Profs tab
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);

  const load = async () => {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erreur serveur"); return; }
    setSubjects(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Entrez un nom de matiere"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/subjects", {
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
    if (!confirm("Supprimer cette matiere ?")) return;
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    load();
  };

  const openModal = async (subject: Subject, tab: "classes" | "profs" = "classes") => {
    setSelectedSubject(subject);
    setModalTab(tab);
    setModalError("");
    setModalLoading(true);
    const [aRes, cRes, taRes, tRes] = await Promise.all([
      fetch(`/api/class-subjects?subject_id=${subject.id}`),
      fetch("/api/classes"),
      fetch(`/api/subject-teachers?subject_id=${subject.id}`),
      fetch("/api/teachers"),
    ]);
    const [aData, cData, taData, tData] = await Promise.all([
      aRes.json(), cRes.json(), taRes.json(), tRes.json(),
    ]);
    setAssignments(Array.isArray(aData) ? aData : []);
    setAllClasses(Array.isArray(cData) ? cData : []);
    setTeacherAssignments(Array.isArray(taData) ? taData : []);
    setAllTeachers(Array.isArray(tData) ? tData : []);
    setModalLoading(false);
  };

  const refreshModal = async (subject: Subject) => {
    const [aRes, taRes] = await Promise.all([
      fetch(`/api/class-subjects?subject_id=${subject.id}`),
      fetch(`/api/subject-teachers?subject_id=${subject.id}`),
    ]);
    const [aData, taData] = await Promise.all([aRes.json(), taRes.json()]);
    setAssignments(Array.isArray(aData) ? aData : []);
    setTeacherAssignments(Array.isArray(taData) ? taData : []);
  };

  // Classes
  const assignClass = async (classId: string) => {
    setModalError("");
    const res = await fetch("/api/class-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: selectedSubject!.id, class_id: classId }),
    });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await refreshModal(selectedSubject!);
  };

  const removeClass = async (classId: string) => {
    setModalError("");
    const res = await fetch(
      `/api/class-subjects?subject_id=${selectedSubject!.id}&class_id=${classId}`,
      { method: "DELETE" },
    );
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await refreshModal(selectedSubject!);
  };

  // Teachers
  const assignTeacher = async (teacherId: string) => {
    setModalError("");
    const res = await fetch("/api/subject-teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: selectedSubject!.id, teacher_id: teacherId }),
    });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await refreshModal(selectedSubject!);
  };

  const removeTeacher = async (teacherId: string) => {
    setModalError("");
    const res = await fetch(
      `/api/subject-teachers?subject_id=${selectedSubject!.id}&teacher_id=${teacherId}`,
      { method: "DELETE" },
    );
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await refreshModal(selectedSubject!);
  };

  const assignedClassIds = new Set(assignments.map((a) => a.class_id));
  const unassignedClasses = allClasses.filter((c) => !assignedClassIds.has(c.id));

  const assignedTeacherIds = new Set(teacherAssignments.map((t) => t.teacher_id));
  const unassignedTeachers = allTeachers.filter((t) => !assignedTeacherIds.has(t.id));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Gestion des matières</h1>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la matière (ex: Mathématiques)"
          className="flex-1 h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Ajout..." : "+ Ajouter"}
        </button>
      </form>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Matière</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {subjects.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                  Aucune matière
                </td>
              </tr>
            )}
            {subjects.map((s) => (
              <tr
                key={s.id}
                className="bg-white dark:bg-gray-900 hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td
                  className="px-4 py-3 text-gray-800 dark:text-white font-medium cursor-pointer"
                  onClick={() => openModal(s, "classes")}
                >
                  {s.name}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openModal(s, "profs")}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 transition-colors"
                    >
                      Professeurs
                    </button>
                    <button
                      onClick={() => openModal(s, "classes")}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                    >
                      Classes
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {selectedSubject.name}
              </h2>
              <button
                onClick={() => setSelectedSubject(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 px-6 pt-2">
              <button
                onClick={() => setModalTab("profs")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  modalTab === "profs"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Professeurs
                {teacherAssignments.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-[10px] font-bold">
                    {teacherAssignments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setModalTab("classes")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  modalTab === "classes"
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
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
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="9" x2="9" y2="21" />
                </svg>
                Classes
                {assignments.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold">
                    {assignments.length}
                  </span>
                )}
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {modalError}
              </div>
            )}

            {modalLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex gap-0 overflow-hidden flex-1 min-h-0">
                {modalTab === "profs" ? (
                  <>
                    {/* Assigned teachers */}
                    <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                        Professeurs assignés ({teacherAssignments.length})
                      </p>
                      <div className="overflow-y-auto flex-1">
                        {teacherAssignments.length === 0 && (
                          <p className="px-4 py-6 text-center text-sm text-gray-400">
                            Aucun professeur assigné
                          </p>
                        )}
                        {teacherAssignments.map((ta) => (
                          <div
                            key={ta.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
                                {ta.teachers.first_name.charAt(0)}{ta.teachers.last_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                  {ta.teachers.first_name} {ta.teachers.last_name}
                                </p>
                                {ta.teachers.email && (
                                  <p className="text-xs text-gray-400 truncate">{ta.teachers.email}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeTeacher(ta.teacher_id)}
                              className="ml-3 text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                            >
                              Retirer
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Available teachers */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                        Autres professeurs ({unassignedTeachers.length})
                      </p>
                      <div className="overflow-y-auto flex-1">
                        {unassignedTeachers.length === 0 && (
                          <p className="px-4 py-6 text-center text-sm text-gray-400">
                            Tous les professeurs sont déjà assignés
                          </p>
                        )}
                        {unassignedTeachers.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-bold shrink-0">
                                {t.first_name.charAt(0)}{t.last_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-800 dark:text-white truncate">
                                  {t.first_name} {t.last_name}
                                </p>
                                {t.email && (
                                  <p className="text-xs text-gray-400 truncate">{t.email}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => assignTeacher(t.id)}
                              className="ml-3 text-xs text-brand-500 hover:text-brand-700 font-medium shrink-0"
                            >
                              + Ajouter
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Assigned classes */}
                    <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                        Classes assignées ({assignments.length})
                      </p>
                      <div className="overflow-y-auto flex-1">
                        {assignments.length === 0 && (
                          <p className="px-4 py-6 text-center text-sm text-gray-400">Aucune classe</p>
                        )}
                        {assignments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <span className="text-sm text-gray-800 dark:text-white">
                              {a.classes.name}
                            </span>
                            <button
                              onClick={() => removeClass(a.class_id)}
                              className="ml-3 text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                            >
                              Retirer
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unassigned classes */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                        Autres classes ({unassignedClasses.length})
                      </p>
                      <div className="overflow-y-auto flex-1">
                        {unassignedClasses.length === 0 && (
                          <p className="px-4 py-6 text-center text-sm text-gray-400">
                            Aucune classe disponible
                          </p>
                        )}
                        {unassignedClasses.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <span className="text-sm text-gray-800 dark:text-white">{c.name}</span>
                            <button
                              onClick={() => assignClass(c.id)}
                              className="ml-3 text-xs text-brand-500 hover:text-brand-700 font-medium shrink-0"
                            >
                              + Ajouter
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedSubject(null)}
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
