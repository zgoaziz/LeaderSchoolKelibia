"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: string; name: string };
type AttendanceEntry = { id: string; subject_id: string; date: string; status: "present" | "absent"; subjects: { name: string } };
type Student = { id: string; first_name: string; last_name: string; email: string; phone: string; class_id: string | null; classes: { name: string } | null };
type ScheduleSlot = { id: string; start_time: string; end_time: string; subject_id: string; subjects: { id: string; name: string }; teachers: { first_name: string; last_name: string } | null };

const fmt = (t: string) => t.slice(0, 5);
const today = () => new Date().toISOString().split("T")[0];

export default function StudentDetail({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tab, setTab] = useState<"calendrier" | "absences">("calendrier");

  // Manual add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ subject_id: "", date: today(), status: "present" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Schedule-based attendance modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedDate, setSchedDate] = useState(today());
  const [schedSlots, setSchedSlots] = useState<ScheduleSlot[]>([]);
  const [slotStatuses, setSlotStatuses] = useState<Record<string, "present" | "absent">>({});
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedSubmitting, setSchedSubmitting] = useState(false);
  const [schedError, setSchedError] = useState("");

  const load = async () => {
    const [stRes, atRes, subRes] = await Promise.all([
      fetch(`/api/students/${studentId}`),
      fetch(`/api/attendance?student_id=${studentId}`),
      fetch("/api/subjects"),
    ]);
    if (stRes.ok) setStudent(await stRes.json());
    if (atRes.ok) setAttendance(await atRes.json());
    if (subRes.ok) setSubjects(await subRes.json());
  };

  useEffect(() => { load(); }, [studentId]);

  // Fetch schedule slots when date changes in the schedule modal
  useEffect(() => {
    if (!showScheduleModal || !student?.class_id) return;
    const fetchSchedule = async () => {
      setSchedLoading(true);
      setSchedError("");
      const res = await fetch(`/api/schedule-slots?class_id=${student.class_id}&date=${schedDate}`);
      const data = await res.json();
      const slots = Array.isArray(data) ? data : [];
      setSchedSlots(slots);
      // Default all to "present"
      const statuses: Record<string, "present" | "absent"> = {};
      slots.forEach((s: ScheduleSlot) => { statuses[s.id] = "present"; });
      setSlotStatuses(statuses);
      setSchedLoading(false);
    };
    fetchSchedule();
  }, [schedDate, showScheduleModal, student?.class_id]);

  const toggleStatus = async (entry: AttendanceEntry) => {
    const newStatus = entry.status === "present" ? "absent" : "present";
    await fetch(`/api/attendance/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setAttendance((prev) => prev.map((a) => a.id === entry.id ? { ...a, status: newStatus } : a));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette séance ?")) return;
    await fetch(`/api/attendance/${id}`, { method: "DELETE" });
    setAttendance((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.subject_id || !newEntry.date) { setAddError("Matière et date requis"); return; }
    setAddLoading(true);
    setAddError("");
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newEntry, student_id: studentId }),
    });
    const json = await res.json();
    setAddLoading(false);
    if (!res.ok) { setAddError(json.error); return; }
    setShowAddModal(false);
    setNewEntry({ subject_id: "", date: today(), status: "present" });
    load();
  };

  const openScheduleModal = () => {
    setSchedDate(today());
    setSchedSlots([]);
    setSlotStatuses({});
    setSchedError("");
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async () => {
    if (schedSlots.length === 0) return;
    setSchedSubmitting(true);
    setSchedError("");
    const records = schedSlots.map((slot) => ({
      student_id: studentId,
      subject_id: slot.subjects.id,
      date: schedDate,
      status: slotStatuses[slot.id] ?? "present",
    }));
    const res = await fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    const json = await res.json();
    setSchedSubmitting(false);
    if (!res.ok) { setSchedError(json.error ?? "Erreur"); return; }
    setShowScheduleModal(false);
    load();
  };

  const byDate = attendance.reduce<Record<string, AttendanceEntry[]>>((acc, a) => {
    acc[a.date] = acc[a.date] || [];
    acc[a.date].push(a);
    return acc;
  }, {});

  const absences = attendance.filter((a) => a.status === "absent");

  if (!student) return <div className="p-6 text-gray-500">Chargement…</div>;

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => router.push("/dashboard/students")} className="text-sm text-brand-500 hover:underline mb-4 flex items-center gap-1">
        ← Retour aux étudiants
      </button>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {student.last_name} {student.first_name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              {student.email && <span>✉ {student.email}</span>}
              {student.phone && <span>📞 {student.phone}</span>}
              {student.classes && (
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {student.classes.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-2xl font-bold text-red-500">{absences.length}</div>
            <div className="text-gray-500 dark:text-gray-400">absence(s)</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        {(["calendrier", "absences"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-brand-500 text-brand-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {t === "calendrier" ? "Calendrier & Présences" : `Absences (${absences.length})`}
          </button>
        ))}
      </div>

      {tab === "calendrier" && (
        <div>
          <div className="flex justify-end gap-2 mb-4">
            {student.class_id && (
              <button
                onClick={openScheduleModal}
                className="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
              >
                Depuis l&apos;emploi du temps
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              + Manuel
            </button>
          </div>

          {Object.keys(byDate).length === 0 && (
            <div className="text-center py-12 text-gray-400">Aucune séance planifiée</div>
          )}

          {Object.entries(byDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, entries]) => (
              <div key={date} className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">
                  {new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b last:border-0 border-gray-100 dark:border-gray-800">
                      <span className="font-medium text-gray-800 dark:text-white text-sm">{entry.subjects.name}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleStatus(entry)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            entry.status === "present"
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {entry.status === "present" ? "✓ Présent" : "✗ Absent"}
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === "absences" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Matière</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {absences.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">Aucune absence</td></tr>
              )}
              {absences.sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
                <tr key={a.id} className="bg-white dark:bg-gray-900">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{a.subjects.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual add modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ajouter une séance</h2>
            {addError && <p className="mb-3 text-sm text-red-500">{addError}</p>}
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matière *</label>
                <select
                  required
                  value={newEntry.subject_id}
                  onChange={(e) => setNewEntry({ ...newEntry, subject_id: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                >
                  <option value="">-- Sélectionner --</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
                <select
                  value={newEntry.status}
                  onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                  className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
                >
                  <option value="present">Présent</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={addLoading} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">{addLoading ? "Ajout…" : "Ajouter"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule-based attendance modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Marquer les présences</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Depuis l&apos;emploi du temps de {student.classes?.name}
              </p>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-3 min-h-0">
              {schedLoading && <p className="text-center text-gray-400 py-6 text-sm">Chargement…</p>}

              {!schedLoading && schedSlots.length === 0 && (
                <p className="text-center text-gray-400 py-6 text-sm">
                  Aucun cours prévu ce jour dans l&apos;emploi du temps
                </p>
              )}

              {!schedLoading && schedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="font-medium text-sm text-gray-800 dark:text-white">{slot.subjects.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {fmt(slot.start_time)} – {fmt(slot.end_time)}
                      {slot.teachers && ` · ${slot.teachers.last_name} ${slot.teachers.first_name}`}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSlotStatuses((prev) => ({
                        ...prev,
                        [slot.id]: prev[slot.id] === "present" ? "absent" : "present",
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ml-3 ${
                      slotStatuses[slot.id] === "present"
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {slotStatuses[slot.id] === "present" ? "✓ Présent" : "✗ Absent"}
                  </button>
                </div>
              ))}

              {schedError && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {schedError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleScheduleSubmit}
                disabled={schedSubmitting || schedSlots.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
              >
                {schedSubmitting ? "Enregistrement…" : `Enregistrer (${schedSlots.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
