"use client";
import { useEffect, useRef, useState } from "react";

type Teacher = { id: string; first_name: string; last_name: string; email: string; phone: string };
type Subject = { id: string; name: string };
type Class = { id: string; name: string };
type SubjectAssign = { id: string; subject_id: string; subjects: { id: string; name: string } };
type ClassAssign = { id: string; class_id: string; classes: { id: string; name: string } };
type ProfUser = { id: string; email: string; firstName: string; lastName: string };

type Tab = "subjects" | "classes" | "absences";
type TeacherAbsence = {
  id: string; date: string; start_time: string; end_time: string;
  reason: string | null;
  subjects: { name: string } | null;
  classes: { name: string } | null;
};

export default function TeachersManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // edit modal
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // form
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });

  // user-picker
  const [profUsers, setProfUsers] = useState<ProfUser[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Detail modal
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [tab, setTab] = useState<Tab>("subjects");
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [subjectAssigns, setSubjectAssigns] = useState<SubjectAssign[]>([]);
  const [classAssigns, setClassAssigns] = useState<ClassAssign[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Absences tab
  const [teacherAbsences, setTeacherAbsences] = useState<TeacherAbsence[]>([]);
  const [absLoading, setAbsLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/teachers");
    const data = await res.json();
    setTeachers(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openAddModal = async () => {
    setForm({ first_name: "", last_name: "", email: "", phone: "" });
    setUserQuery("");
    setShowPicker(false);
    setError("");
    setShowAdd(true);

    // Load professeur users
    setPickerLoading(true);
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    setPickerLoading(false);
    if (res.ok) {
      const users: ProfUser[] = (json.users ?? [])
        .filter((u: any) => u.app_metadata?.role === "professeur")
        .map((u: any) => ({
          id: u.id,
          email: u.email ?? "",
          firstName: u.user_metadata?.first_name ?? "",
          lastName: u.user_metadata?.last_name ?? "",
        }));
      setProfUsers(users);
    }
  };

  const selectUser = (u: ProfUser) => {
    setForm({
      first_name: u.firstName,
      last_name: u.lastName,
      email: u.email,
      phone: form.phone,
    });
    setUserQuery(`${u.lastName} ${u.firstName} — ${u.email}`);
    setShowPicker(false);
  };

  const filteredUsers = profUsers.filter((u) => {
    const q = userQuery.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Prénom et nom requis");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce professeur ?")) return;
    await fetch(`/api/teachers/${id}`, { method: "DELETE" });
    load();
  };

  const openEdit = (t: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm({ first_name: t.first_name, last_name: t.last_name, email: t.email ?? "", phone: t.phone ?? "" });
    setEditError("");
    setEditing(t);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditLoading(true);
    setEditError("");
    const res = await fetch(`/api/teachers/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    setEditLoading(false);
    if (!res.ok) { setEditError(json.error ?? "Erreur"); return; }
    setTeachers((prev) => prev.map((t) => t.id === editing.id ? { ...t, ...editForm } : t));
    setEditing(null);
  };

  const loadAbsences = async (teacherId: string) => {
    setAbsLoading(true);
    const res = await fetch("/api/schedule/overrides?all=1");
    const data = await res.json();
    const filtered: TeacherAbsence[] = (Array.isArray(data) ? data : [])
      .filter((o: any) => o.teacher_id === teacherId && o.type === "absent")
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
    setTeacherAbsences(filtered);
    setAbsLoading(false);
  };

  const openModal = async (teacher: Teacher) => {
    setSelected(teacher);
    setTab("subjects");
    setTeacherAbsences([]);
    setModalError("");
    setModalLoading(true);
    const [tsRes, tcRes, sRes, cRes] = await Promise.all([
      fetch(`/api/teacher-subjects?teacher_id=${teacher.id}`),
      fetch(`/api/teacher-classes?teacher_id=${teacher.id}`),
      fetch("/api/subjects"),
      fetch("/api/classes"),
    ]);
    const [tsData, tcData, sData, cData] = await Promise.all([
      tsRes.json(), tcRes.json(), sRes.json(), cRes.json(),
    ]);
    setSubjectAssigns(Array.isArray(tsData) ? tsData : []);
    setClassAssigns(Array.isArray(tcData) ? tcData : []);
    setAllSubjects(Array.isArray(sData) ? sData : []);
    setAllClasses(Array.isArray(cData) ? cData : []);
    setModalLoading(false);
  };

  const reloadAssignments = async (teacher: Teacher) => {
    const [tsRes, tcRes] = await Promise.all([
      fetch(`/api/teacher-subjects?teacher_id=${teacher.id}`),
      fetch(`/api/teacher-classes?teacher_id=${teacher.id}`),
    ]);
    const [tsData, tcData] = await Promise.all([tsRes.json(), tcRes.json()]);
    setSubjectAssigns(Array.isArray(tsData) ? tsData : []);
    setClassAssigns(Array.isArray(tcData) ? tcData : []);
  };

  const assignSubject = async (subjectId: string) => {
    const res = await fetch("/api/teacher-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: selected!.id, subject_id: subjectId }),
    });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await reloadAssignments(selected!);
  };

  const removeSubject = async (subjectId: string) => {
    const res = await fetch(`/api/teacher-subjects?teacher_id=${selected!.id}&subject_id=${subjectId}`, { method: "DELETE" });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await reloadAssignments(selected!);
  };

  const assignClass = async (classId: string) => {
    const res = await fetch("/api/teacher-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: selected!.id, class_id: classId }),
    });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await reloadAssignments(selected!);
  };

  const removeClass = async (classId: string) => {
    const res = await fetch(`/api/teacher-classes?teacher_id=${selected!.id}&class_id=${classId}`, { method: "DELETE" });
    if (!res.ok) { const j = await res.json(); setModalError(j.error ?? "Erreur"); return; }
    await reloadAssignments(selected!);
  };

  const assignedSubjectIds = new Set(subjectAssigns.map((a) => a.subject_id));
  const assignedClassIds = new Set(classAssigns.map((a) => a.class_id));
  const unassignedSubjects = allSubjects.filter((s) => !assignedSubjectIds.has(s.id));
  const unassignedClasses = allClasses.filter((c) => !assignedClassIds.has(c.id));

  const inputCls = "w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestion des professeurs</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
        >
          + Ajouter un professeur
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Téléphone</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {teachers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucun professeur</td></tr>
            )}
            {teachers.map((t) => (
              <tr
                key={t.id}
                onClick={() => openModal(t)}
                className="bg-white dark:bg-gray-900 cursor-pointer hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{t.first_name} {t.last_name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.email || "—"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.phone || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => openEdit(t, e)}
                      title="Modifier"
                      className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(t.id, e)}
                      title="Supprimer"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add Teacher Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Ajouter un professeur</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Sélectionnez un utilisateur avec le rôle &quot;professeur&quot; ou saisissez manuellement.
            </p>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-3">
              {/* User picker */}
              <div ref={pickerRef} className="relative">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Sélectionner depuis les utilisateurs (rôle professeur)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={pickerLoading ? "Chargement…" : "Rechercher un utilisateur…"}
                    value={userQuery}
                    onFocus={() => setShowPicker(true)}
                    onChange={(e) => { setUserQuery(e.target.value); setShowPicker(true); }}
                    className={inputCls + " pr-8"}
                  />
                  {userQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserQuery("");
                        setForm({ first_name: "", last_name: "", email: "", phone: form.phone });
                        setShowPicker(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>

                {showPicker && !pickerLoading && filteredUsers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseDown={() => selectUser(u)}
                        className="w-full px-3 py-2.5 text-left hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-800 dark:text-white">
                          {u.lastName} {u.firstName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                      </button>
                    ))}
                  </div>
                )}

                {showPicker && !pickerLoading && filteredUsers.length === 0 && userQuery.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-3 py-3 text-sm text-gray-400">
                    Aucun utilisateur trouvé
                  </div>
                )}

                {showPicker && !pickerLoading && profUsers.length === 0 && userQuery.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-3 py-3 text-sm text-gray-400">
                    Aucun utilisateur avec le rôle &quot;professeur&quot; dans la base
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">ou saisie manuelle</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Manual fields */}
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setError(""); }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
                >
                  {loading ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Teacher Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Modifier le professeur</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>

            {editError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom *</label>
                  <input
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                  <input
                    required
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
                >
                  {editLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Teacher detail modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {selected.first_name} {selected.last_name}
                </h2>
                {selected.email && <p className="text-sm text-gray-500 dark:text-gray-400">{selected.email}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {(["subjects", "classes", "absences"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); if (t === "absences" && selected) loadAbsences(selected.id); }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tab === t
                      ? "text-brand-600 border-b-2 border-brand-500 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {t === "subjects" ? `Matières (${subjectAssigns.length})` : t === "classes" ? `Classes (${classAssigns.length})` : `Absences (${teacherAbsences.length})`}
                </button>
              ))}
            </div>

            {modalError && (
              <div className="mx-6 mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {modalError}
              </div>
            )}

            {modalLoading ? (
              <p className="p-6 text-gray-400">Chargement...</p>
            ) : tab === "absences" ? (
              <div className="flex-1 overflow-y-auto p-4">
                {absLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Stats banner */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-center min-w-[80px]">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{teacherAbsences.length}</div>
                        <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">absence{teacherAbsences.length !== 1 ? "s" : ""}</div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Séances annulées enregistrées pour ce professeur dans tous les semestres.
                      </p>
                    </div>

                    {/* Absence list */}
                    {teacherAbsences.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-10 text-center text-gray-400 text-sm">
                        Aucune absence enregistrée
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Matière</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Classe</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Horaire</th>
                              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Raison</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {teacherAbsences.map((a) => (
                              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                  {new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                                <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-white">{a.subjects?.name ?? "—"}</td>
                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{a.classes?.name ?? "—"}</td>
                                <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                                  {a.start_time?.slice(0, 5)} – {a.end_time?.slice(0, 5)}
                                </td>
                                <td className="px-3 py-2.5 text-gray-400 italic text-xs">{a.reason || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex overflow-hidden flex-1 min-h-0">
                {tab === "subjects" ? (
                  <>
                    <AssignPanel
                      title={`Matières enseignées (${subjectAssigns.length})`}
                      items={subjectAssigns.map((a) => ({ id: a.subject_id, name: a.subjects.name }))}
                      onRemove={removeSubject}
                      removeLabel="Retirer"
                    />
                    <AssignPanel
                      title={`Autres matières (${unassignedSubjects.length})`}
                      items={unassignedSubjects}
                      onAdd={assignSubject}
                      addLabel="+ Ajouter"
                      border={false}
                    />
                  </>
                ) : (
                  <>
                    <AssignPanel
                      title={`Classes enseignées (${classAssigns.length})`}
                      items={classAssigns.map((a) => ({ id: a.class_id, name: a.classes.name }))}
                      onRemove={removeClass}
                      removeLabel="Retirer"
                    />
                    <AssignPanel
                      title={`Autres classes (${unassignedClasses.length})`}
                      items={unassignedClasses}
                      onAdd={assignClass}
                      addLabel="+ Ajouter"
                      border={false}
                    />
                  </>
                )}
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelected(null)}
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

function AssignPanel({
  title, items, onRemove, removeLabel, onAdd, addLabel, border = true,
}: {
  title: string;
  items: { id: string; name: string }[];
  onRemove?: (id: string) => void;
  removeLabel?: string;
  onAdd?: (id: string) => void;
  addLabel?: string;
  border?: boolean;
}) {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${border ? "border-r border-gray-200 dark:border-gray-700" : ""}`}>
      <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
        {title}
      </p>
      <div className="overflow-y-auto flex-1">
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-gray-400">Aucun</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="text-sm text-gray-800 dark:text-white">{item.name}</span>
            {onRemove && (
              <button onClick={() => onRemove(item.id)} className="ml-3 text-xs text-red-500 hover:text-red-700 font-medium shrink-0">
                {removeLabel}
              </button>
            )}
            {onAdd && (
              <button onClick={() => onAdd(item.id)} className="ml-3 text-xs text-brand-500 hover:text-brand-700 font-medium shrink-0">
                {addLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
