"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Semester = { id: string; name: string; start_date: string; end_date: string };
type Class    = { id: string; name: string };
type Subject  = { id: string; name: string };
type Teacher  = { id: string; first_name: string; last_name: string };
type Slot     = {
  id: string; day_of_week: number;
  start_time: string; end_time: string;
  subject_id: string; teacher_id: string | null;
  subjects: { name: string };
  teachers: { first_name: string; last_name: string } | null;
};
type Override = {
  id: string; class_id: string;
  teacher_id: string | null; subject_id: string | null; slot_id: string | null;
  date: string; start_time: string; end_time: string;
  type: "rattrapage" | "absent" | "cancelled" | "present";
  reason: string | null;
  subjects: { name: string } | null;
  teachers: { first_name: string; last_name: string } | null;
  classes: { name: string } | null;
};
type Holiday   = { id: string; date: string; name: string; description: string | null };
type MyTeacher = {
  id: string; first_name: string; last_name: string;
  teacher_classes: { class_id: string; classes: { id: string; name: string } }[];
};

// ─── Constants & helpers ─────────────────────────────────────────────────────

const DAYS = [
  { num: 1, short: "Lun", full: "Lundi" },
  { num: 2, short: "Mar", full: "Mardi" },
  { num: 3, short: "Mer", full: "Mercredi" },
  { num: 4, short: "Jeu", full: "Jeudi" },
  { num: 5, short: "Ven", full: "Vendredi" },
  { num: 6, short: "Sam", full: "Samedi" },
];

const COLORS = [
  "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",
  "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",
  "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700",
  "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700",
  "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-700",
  "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-700",
  "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700",
  "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700",
];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtShortDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtFullDate(s: string): string {
  return new Date(s + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtSemDate(s: string): string {
  return new Date(s + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtTime(t: string): string { return t.slice(0, 5); }

function weekLabel(start: Date): string {
  const end = addDays(start, 5);
  return `${fmtShortDate(start)} – ${fmtShortDate(end)} ${end.getFullYear()}`;
}

const inp = "w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

// ─── Component ────────────────────────────────────────────────────────────────

const todayStr = toDateStr(new Date());

export default function ScheduleManager() {
  const [role, setRole]           = useState<"admin" | "professeur" | null>(null);
  const [myTeacher, setMyTeacher] = useState<MyTeacher | null>(null);
  const [noTeacher, setNoTeacher] = useState(false);

  const [view, setView] = useState<"list" | "grid">("list");
  const [tab, setTab]   = useState<"schedule" | "history">("schedule");

  // Semester list
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semForm, setSemForm]     = useState({ name: "", start_date: "", end_date: "" });
  const [semLoading, setSemLoading] = useState(false);
  const [semError, setSemError]   = useState("");

  // Grid
  const [activeSem, setActiveSem]     = useState<Semester | null>(null);
  const [classes, setClasses]         = useState<Class[]>([]);
  const [subjects, setSubjects]       = useState<Subject[]>([]);
  const [teachers, setTeachers]       = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass]       = useState("");  // admin
  const [selectedProfClass, setSelectedProfClass] = useState(""); // professor
  const [slots, setSlots]             = useState<Slot[]>([]);
  const [overrides, setOverrides]     = useState<Override[]>([]);
  const [holidays, setHolidays]       = useState<Holiday[]>([]);
  const [gridLoading, setGridLoading] = useState(false);

  // Week navigation
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));


  // ── Add Slot Modal
  const [showAddSlot, setShowAddSlot]   = useState(false);
  const [addSlotForm, setAddSlotForm]   = useState({ day_of_week: 1, start_time: "08:00", end_time: "10:00", subject_id: "", teacher_id: "" });
  const [addSlotLoading, setAddSlotLoading] = useState(false);
  const [addSlotError, setAddSlotError] = useState("");

  // ── Rattrapage Modal
  const [showRatt, setShowRatt]   = useState(false);
  const [rattForm, setRattForm]   = useState({ date: "", start_time: "08:00", end_time: "10:00", class_id: "", subject_id: "", teacher_id: "", reason: "" });
  const [rattLoading, setRattLoading] = useState(false);
  const [rattError, setRattError] = useState("");

  // ── Mark Absent Modal
  const [showAbsent, setShowAbsent]         = useState(false);
  const [absentSlot, setAbsentSlot]         = useState<{ slot: Slot; date: string } | null>(null);
  const [absentReason, setAbsentReason]     = useState("");
  const [absentLoading, setAbsentLoading]   = useState(false);
  const [absentError, setAbsentError]       = useState("");

  // ── Holiday Modal
  const [showHoliday, setShowHoliday]   = useState(false);
  const [holForm, setHolForm]           = useState({ date: "", name: "", description: "" });
  const [holLoading, setHolLoading]     = useState(false);
  const [holError, setHolError]         = useState("");

  // ── Prof Absent for Day Modal (admin)
  const [showProfAbsent, setShowProfAbsent]       = useState(false);
  const [profAbsentForm, setProfAbsentForm]       = useState({ teacher_id: "", date: "", reason: "" });
  const [profAbsentLoading, setProfAbsentLoading] = useState(false);
  const [profAbsentError, setProfAbsentError]     = useState("");

  // ─── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      const r = user?.app_metadata?.role ?? "etudiant";
      setRole(r as "admin" | "professeur");
      if (r === "professeur") {
        fetch("/api/teachers/me").then(async (res) => {
          if (res.ok) setMyTeacher(await res.json());
          else setNoTeacher(true);
        });
      }
    });
    loadSemesters();
  }, []);

  // Auto-select first prof class when teacher loads
  useEffect(() => {
    if (myTeacher?.teacher_classes?.length) {
      setSelectedProfClass(myTeacher.teacher_classes[0].class_id);
    }
  }, [myTeacher]);

  // Reload week data when key values change
  useEffect(() => {
    if (view !== "grid" || !activeSem) return;
    const classId = role === "professeur" ? selectedProfClass : selectedClass;
    if (classId) {
      loadWeekData(classId);
    } else {
      setSlots([]);
      setOverrides([]);
      setHolidays([]);
    }
  }, [activeSem, selectedClass, selectedProfClass, weekStart, view]);

  // ─── API ─────────────────────────────────────────────────────────────────────

  const loadSemesters = async () => {
    const res = await fetch("/api/semesters");
    const data = await res.json();
    if (!res.ok) { setSemError(data.error ?? "Erreur"); return; }
    setSemesters(Array.isArray(data) ? data : []);
  };

  const loadWeekData = async (classId: string) => {
    setGridLoading(true);
    const ws = toDateStr(weekStart);
    const [slotsRes, ovrRes, holRes] = await Promise.all([
      fetch(`/api/schedule-slots?semester_id=${activeSem!.id}&class_id=${classId}`),
      fetch(`/api/schedule/overrides?class_id=${classId}&week_start=${ws}`),
      fetch(`/api/schedule/holidays?week_start=${ws}`),
    ]);
    const [slotsData, ovrData, holData] = await Promise.all([
      slotsRes.json(), ovrRes.json(), holRes.json(),
    ]);
    setSlots(Array.isArray(slotsData) ? slotsData : []);
    setOverrides(Array.isArray(ovrData) ? ovrData : []);
    setHolidays(Array.isArray(holData) ? holData : []);
    setGridLoading(false);
  };

  const openSemester = async (sem: Semester) => {
    setActiveSem(sem);
    setSelectedClass("");
    setSlots([]); setOverrides([]); setHolidays([]);
    setView("grid");
    setTab("schedule");
    setWeekStart(getMonday(new Date()));

    const [sRes, tRes] = await Promise.all([fetch("/api/subjects"), fetch("/api/teachers")]);
    const [sData, tData] = await Promise.all([sRes.json(), tRes.json()]);
    setSubjects(Array.isArray(sData) ? sData : []);
    setTeachers(Array.isArray(tData) ? tData : []);

    if (role === "admin") {
      const cRes = await fetch("/api/classes");
      const cData = await cRes.json();
      setClasses(Array.isArray(cData) ? cData : []);
    }
  };

  // ─── Semester CRUD ────────────────────────────────────────────────────────────

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semForm.name.trim() || !semForm.start_date || !semForm.end_date) {
      setSemError("Tous les champs sont requis");
      return;
    }
    setSemLoading(true);
    setSemError("");
    const res = await fetch("/api/semesters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(semForm),
    });
    const json = await res.json();
    setSemLoading(false);
    if (!res.ok) { setSemError(json.error); return; }
    setSemForm({ name: "", start_date: "", end_date: "" });
    loadSemesters();
  };

  const handleDeleteSemester = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce semestre et tout son emploi du temps ?")) return;
    await fetch(`/api/semesters/${id}`, { method: "DELETE" });
    loadSemesters();
  };

  // ─── Slot CRUD ────────────────────────────────────────────────────────────────

  const openAddSlot = (dayNum: number) => {
    setAddSlotForm({ day_of_week: dayNum, start_time: "08:00", end_time: "10:00", subject_id: subjects[0]?.id ?? "", teacher_id: "" });
    setAddSlotError("");
    setShowAddSlot(true);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSlotForm.subject_id) { setAddSlotError("Choisissez une matière"); return; }
    setAddSlotLoading(true);
    setAddSlotError("");
    const res = await fetch("/api/schedule-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semester_id: activeSem!.id,
        class_id: selectedClass,
        subject_id: addSlotForm.subject_id,
        teacher_id: addSlotForm.teacher_id || null,
        day_of_week: addSlotForm.day_of_week,
        start_time: addSlotForm.start_time,
        end_time: addSlotForm.end_time,
      }),
    });
    const json = await res.json();
    setAddSlotLoading(false);
    if (!res.ok) { setAddSlotError(json.error); return; }
    setShowAddSlot(false);
    loadWeekData(selectedClass);
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("Supprimer ce créneau récurrent ?")) return;
    await fetch(`/api/schedule-slots/${id}`, { method: "DELETE" });
    loadWeekData(selectedClass);
  };

  // ─── Overrides ────────────────────────────────────────────────────────────────

  const openAddRattrapage = () => {
    const defClass = role === "professeur"
      ? (selectedProfClass || myTeacher?.teacher_classes[0]?.class_id || "")
      : selectedClass;
    setRattForm({ date: toDateStr(weekStart), start_time: "08:00", end_time: "10:00", class_id: defClass, subject_id: subjects[0]?.id ?? "", teacher_id: "", reason: "" });
    setRattError("");
    setShowRatt(true);
  };

  const handleAddRattrapage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rattForm.date || !rattForm.class_id || !rattForm.subject_id) {
      setRattError("Date, classe et matière requis");
      return;
    }
    setRattLoading(true);
    setRattError("");
    const res = await fetch("/api/schedule/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: rattForm.class_id,
        subject_id: rattForm.subject_id,
        teacher_id: rattForm.teacher_id || null,
        date: rattForm.date,
        start_time: rattForm.start_time,
        end_time: rattForm.end_time,
        type: "rattrapage",
        reason: rattForm.reason || null,
        semester_id: activeSem?.id,
      }),
    });
    const json = await res.json();
    setRattLoading(false);
    if (!res.ok) { setRattError(json.error); return; }
    setShowRatt(false);
    const activeClass = role === "professeur" ? selectedProfClass : selectedClass;
    if (activeClass === rattForm.class_id) loadWeekData(activeClass);
  };

  const openMarkAbsent = (slot: Slot, date: string) => {
    setAbsentSlot({ slot, date });
    setAbsentReason("");
    setAbsentError("");
    setShowAbsent(true);
  };

  const handleMarkAbsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absentSlot) return;
    const { slot, date } = absentSlot;
    const classId = role === "professeur" ? selectedProfClass : selectedClass;
    setAbsentLoading(true);
    setAbsentError("");
    await clearSlotOverride(slot.id, date);
    const res = await fetch("/api/schedule/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: classId,
        subject_id: slot.subject_id,
        teacher_id: slot.teacher_id,
        date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        type: "absent",
        reason: absentReason || null,
        slot_id: slot.id,
        semester_id: activeSem?.id,
      }),
    });
    const json = await res.json();
    setAbsentLoading(false);
    if (!res.ok) { setAbsentError(json.error); return; }
    setShowAbsent(false);
    loadWeekData(classId);
  };

  const deleteOverride = async (id: string) => {
    if (!confirm("Annuler cette modification de l'emploi du temps ?")) return;
    await fetch(`/api/schedule/overrides/${id}`, { method: "DELETE" });
    const classId = role === "professeur" ? selectedProfClass : selectedClass;
    if (classId) loadWeekData(classId);
  };

  // ─── Holidays ─────────────────────────────────────────────────────────────────

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holForm.date || !holForm.name) { setHolError("Date et nom requis"); return; }
    setHolLoading(true);
    setHolError("");
    const res = await fetch("/api/schedule/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(holForm),
    });
    const json = await res.json();
    setHolLoading(false);
    if (!res.ok) { setHolError(json.error); return; }
    setShowHoliday(false);
    const classId = role === "professeur" ? selectedProfClass : selectedClass;
    if (classId) loadWeekData(classId);
  };

  const deleteHoliday = async (id: string) => {
    if (!confirm("Supprimer ce congé ?")) return;
    await fetch(`/api/schedule/holidays?id=${id}`, { method: "DELETE" });
    const classId = role === "professeur" ? selectedProfClass : selectedClass;
    if (classId) loadWeekData(classId);
  };

  const clearSlotOverride = async (slotId: string, dateStr: string) => {
    const existing = overrides.find((o) => o.slot_id === slotId && o.date === dateStr);
    if (existing) {
      await fetch(`/api/schedule/overrides/${existing.id}`, { method: "DELETE" });
    }
  };

  const handleMarkPresent = async (slot: Slot, dateStr: string) => {
    const classId = role === "professeur" ? selectedProfClass : selectedClass;
    await clearSlotOverride(slot.id, dateStr);
    await fetch("/api/schedule/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: classId,
        subject_id: slot.subject_id,
        teacher_id: slot.teacher_id,
        date: dateStr,
        start_time: slot.start_time,
        end_time: slot.end_time,
        type: "present",
        slot_id: slot.id,
        semester_id: activeSem?.id,
      }),
    });
    loadWeekData(classId);
  };

  const handleProfAbsentDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profAbsentForm.teacher_id || !profAbsentForm.date) {
      setProfAbsentError("Professeur et date requis");
      return;
    }
    setProfAbsentLoading(true);
    setProfAbsentError("");
    const res = await fetch("/api/schedule/prof-absent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_id: profAbsentForm.teacher_id,
        date: profAbsentForm.date,
        reason: profAbsentForm.reason || null,
      }),
    });
    const json = await res.json();
    setProfAbsentLoading(false);
    if (!res.ok) { setProfAbsentError(json.error); return; }
    setShowProfAbsent(false);
    const classId = role === "professeur" ? selectedProfClass : selectedClass;
    if (classId) loadWeekData(classId);
  };

  const getColor = (subjectId: string) => {
    const idx = subjects.findIndex((s) => s.id === subjectId);
    return COLORS[Math.max(0, idx) % COLORS.length];
  };

  // ─── Semester list view ───────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Emploi du temps</h1>

        {role === "admin" && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Nouveau semestre</h2>
            <form onSubmit={handleAddSemester} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <input value={semForm.name} onChange={(e) => setSemForm({ ...semForm, name: e.target.value })} placeholder="Semestre 1" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date début *</label>
                <input type="date" value={semForm.start_date} onChange={(e) => setSemForm({ ...semForm, start_date: e.target.value })} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date fin *</label>
                <input type="date" value={semForm.end_date} onChange={(e) => setSemForm({ ...semForm, end_date: e.target.value })} className={inp} />
              </div>
              <div className="sm:col-span-3">
                {semError && (
                  <div className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    {semError}
                  </div>
                )}
                <button type="submit" disabled={semLoading} className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
                  {semLoading ? "Ajout..." : "+ Créer le semestre"}
                </button>
              </div>
            </form>
          </div>
        )}

        {noTeacher && (
          <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
            Aucun profil enseignant associé à votre compte. Contactez l'administration.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Semestre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Période</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {semesters.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Aucun semestre créé</td></tr>
              )}
              {semesters.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openSemester(s)}
                  className="bg-white dark:bg-gray-900 cursor-pointer hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtSemDate(s.start_date)} — {fmtSemDate(s.end_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openSemester(s); }}
                        title="Ouvrir / Modifier"
                        className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {role === "admin" && (
                        <button
                          onClick={(e) => handleDeleteSemester(s.id, e)}
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
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Grid view ────────────────────────────────────────────────────────────────

  const activeClassId = role === "professeur" ? selectedProfClass : selectedClass;
  const myTeacherId   = myTeacher?.id;
  const profClasses   = myTeacher?.teacher_classes ?? [];

  return (
    <div className="p-6">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-start gap-3 mb-5">
        <button
          onClick={() => { setView("list"); setActiveSem(null); }}
          className="text-brand-500 hover:text-brand-700 text-sm font-medium mt-0.5"
        >
          ← Retour
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{activeSem?.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activeSem && `${fmtSemDate(activeSem.start_date)} — ${fmtSemDate(activeSem.end_date)}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openAddRattrapage}
            className="px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400"
          >
            + Rattrapage
          </button>
          {role === "admin" && (
            <button
              onClick={() => { setHolForm({ date: "", name: "", description: "" }); setHolError(""); setShowHoliday(true); }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              + Congé
            </button>
          )}
          {role === "admin" && (
            <button
              onClick={() => { setProfAbsentForm({ teacher_id: teachers[0]?.id ?? "", date: toDateStr(weekStart), reason: "" }); setProfAbsentError(""); setShowProfAbsent(true); }}
              className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
            >
              Prof absent (jour)
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        {(["schedule", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {t === "schedule" ? "Emploi du temps" : "Historique"}
          </button>
        ))}
      </div>

      {/* ── SCHEDULE TAB ── */}
      {tab === "schedule" && (
        <>
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {role === "admin" && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
              >
                <option value="">-- Choisir une classe --</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {role === "professeur" && profClasses.length > 1 && (
              <select
                value={selectedProfClass}
                onChange={(e) => setSelectedProfClass(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
              >
                {profClasses.map((tc) => (
                  <option key={tc.class_id} value={tc.class_id}>{tc.classes.name}</option>
                ))}
              </select>
            )}
            {role === "professeur" && profClasses.length === 1 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Classe : <strong className="text-gray-800 dark:text-white">{profClasses[0].classes.name}</strong>
              </span>
            )}

            {/* Week navigation */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                ◄
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[180px] text-center">
                {weekLabel(weekStart)}
              </span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                ►
              </button>
            </div>
          </div>

          {/* Empty state */}
          {!activeClassId && role !== "professeur" && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400">
              Sélectionnez une classe pour voir son emploi du temps
            </div>
          )}
          {role === "professeur" && noTeacher && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400">
              Aucun profil enseignant associé à votre compte
            </div>
          )}

          {activeClassId && gridLoading && (
            <p className="text-center text-gray-400 py-12">Chargement...</p>
          )}

          {/* Weekly grid */}
          {activeClassId && !gridLoading && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 min-w-[700px]">
                {weekDates.map((date, i) => {
                  const dayNum  = i + 1;
                  const dateStr = toDateStr(date);
                  const holiday = holidays.find((h) => h.date === dateStr);

                  // Regular slots for this day
                  let daySlots = slots
                    .filter((s) => s.day_of_week === dayNum)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));

                  // Prof: only their own slots
                  if (role === "professeur" && myTeacherId) {
                    daySlots = daySlots.filter((s) => s.teacher_id === myTeacherId);
                  }

                  // Overrides for this date
                  const dayOverrides    = overrides.filter((o) => o.date === dateStr);
                  const rattrapages     = dayOverrides.filter((o) => o.type === "rattrapage");
                  const overrideBySlot  = Object.fromEntries(
                    dayOverrides.filter((o) => o.slot_id).map((o) => [o.slot_id!, o]),
                  );

                  return (
                    <div key={dayNum} className="flex flex-col gap-1.5">
                      {/* Day header */}
                      <div className={`rounded-lg py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                        holiday
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      }`}>
                        <div>{DAYS[i].short}</div>
                        <div className="text-[10px] font-normal mt-0.5 opacity-75">{fmtShortDate(date)}</div>
                      </div>

                      {/* Holiday card */}
                      {holiday && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 dark:bg-red-900/20 dark:border-red-800">
                          <div className="text-xs font-semibold text-red-600 dark:text-red-400">🏖 {holiday.name}</div>
                          {holiday.description && (
                            <div className="text-xs text-red-400 mt-0.5">{holiday.description}</div>
                          )}
                          {role === "admin" && (
                            <button
                              onClick={() => deleteHoliday(holiday.id)}
                              className="mt-1.5 text-xs text-red-400 hover:text-red-600 font-medium"
                            >
                              × Supprimer
                            </button>
                          )}
                        </div>
                      )}

                      {/* Regular slots */}
                      {!holiday && daySlots.map((slot) => {
                        const override  = overrideBySlot[slot.id];
                        const isAbsent  = !!override;
                        const isMySlot  = role === "professeur" && slot.teacher_id === myTeacherId;

                        return (
                          <div
                            key={slot.id}
                            className={`border rounded-lg p-2 ${
                              isAbsent
                                ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700 opacity-80"
                                : getColor(slot.subject_id)
                            }`}
                          >
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                              {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                            </div>
                            <div className={`font-semibold text-sm leading-tight ${isAbsent ? "line-through text-gray-400" : "text-gray-800 dark:text-white"}`}>
                              {slot.subjects.name}
                            </div>
                            {slot.teachers && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {slot.teachers.first_name} {slot.teachers.last_name}
                              </div>
                            )}
                            {isAbsent && override && (
                              <div className="mt-1.5">
                                <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5">
                                  🚫 Absence du prof — Pas de cours
                                </div>
                                {override.reason && (
                                  <div className="text-xs text-red-400 italic">{override.reason}</div>
                                )}
                                {(role === "admin" || isMySlot) && (
                                  <button
                                    onClick={() => deleteOverride(override.id)}
                                    className="mt-1 text-xs text-gray-400 hover:text-gray-600 font-medium"
                                  >
                                    ↩ Annuler
                                  </button>
                                )}
                              </div>
                            )}
                            {!isAbsent && (role === "admin" || isMySlot) && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {role === "admin" && (
                                  <button
                                    onClick={() => deleteSlot(slot.id)}
                                    title="Supprimer le créneau"
                                    className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-600 font-medium"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    </svg>
                                    Suppr.
                                  </button>
                                )}
                                <button
                                  onClick={() => openMarkAbsent(slot, dateStr)}
                                  className="text-xs text-orange-500 hover:text-orange-700 font-medium"
                                >
                                  Marquer absent
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Rattrapages */}
                      {!holiday && rattrapages.map((r) => (
                        <div key={r.id} className="border rounded-lg p-2 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
                          <div className="mb-0.5">
                            <span className="text-[10px] bg-yellow-200 text-yellow-700 rounded px-1.5 py-0.5 font-bold uppercase dark:bg-yellow-900/40 dark:text-yellow-400">
                              Rattrapage
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fmtTime(r.start_time)} – {fmtTime(r.end_time)}
                          </div>
                          <div className="font-semibold text-sm text-gray-800 dark:text-white leading-tight">
                            {r.subjects?.name ?? "—"}
                          </div>
                          {r.teachers && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {r.teachers.first_name} {r.teachers.last_name}
                            </div>
                          )}
                          {r.reason && (
                            <div className="text-xs text-gray-500 mt-0.5 italic">{r.reason}</div>
                          )}
                          {(role === "admin") && (
                            <button
                              onClick={() => deleteOverride(r.id)}
                              className="mt-1.5 text-xs text-red-400 hover:text-red-600 font-medium"
                            >
                              × Supprimer
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add slot button (admin only) */}
                      {!holiday && role === "admin" && (
                        <button
                          onClick={() => openAddSlot(dayNum)}
                          className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 py-2.5 text-xs text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-colors"
                        >
                          + Créneau
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB — weekly attendance grid ── */}
      {tab === "history" && (
        <div>
          {/* Controls row (class selector + week nav) */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {role === "admin" && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400"
              >
                <option value="">-- Choisir une classe --</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {role === "professeur" && profClasses.length > 1 && (
              <select
                value={selectedProfClass}
                onChange={(e) => setSelectedProfClass(e.target.value)}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
              >
                {profClasses.map((tc) => (
                  <option key={tc.class_id} value={tc.class_id}>{tc.classes.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
              >◄</button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[180px] text-center">
                {weekLabel(weekStart)}
              </span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
              >►</button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />Non marqué
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" />Présent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-400" />Rattrapage
            </span>
          </div>

          {/* Empty state */}
          {!activeClassId && role !== "professeur" && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400">
              Sélectionnez une classe pour voir l'historique de présence
            </div>
          )}

          {activeClassId && gridLoading && (
            <p className="text-center text-gray-400 py-12">Chargement...</p>
          )}

          {/* Attendance grid */}
          {activeClassId && !gridLoading && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 min-w-[700px]">
                {weekDates.map((date, i) => {
                  const dayNum  = i + 1;
                  const dateStr = toDateStr(date);
                  const holiday = holidays.find((h) => h.date === dateStr);

                  // ALL slots for this day (not filtered by prof — show everyone)
                  const daySlots = slots
                    .filter((s) => s.day_of_week === dayNum)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));

                  const dayOverrides  = overrides.filter((o) => o.date === dateStr);
                  const rattrapages   = dayOverrides.filter((o) => o.type === "rattrapage");
                  const overrideBySlot = Object.fromEntries(
                    dayOverrides.filter((o) => o.slot_id).map((o) => [o.slot_id!, o]),
                  );

                  return (
                    <div key={dayNum} className="flex flex-col gap-1.5">
                      {/* Day header */}
                      <div className={`rounded-lg py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                        holiday
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      }`}>
                        <div>{DAYS[i].short}</div>
                        <div className="text-[10px] font-normal mt-0.5 opacity-75">{fmtShortDate(date)}</div>
                      </div>

                      {/* Holiday */}
                      {holiday && (
                        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-2.5 dark:bg-red-900/20 dark:border-red-700">
                          <div className="text-xs font-semibold text-red-600 dark:text-red-400">🏖 {holiday.name}</div>
                          {holiday.description && (
                            <div className="text-xs text-red-400 mt-0.5">{holiday.description}</div>
                          )}
                          {role === "admin" && (
                            <button
                              onClick={() => deleteHoliday(holiday.id)}
                              className="mt-1.5 text-xs text-red-400 hover:text-red-600 font-medium"
                            >
                              × Supprimer
                            </button>
                          )}
                        </div>
                      )}

                      {/* Slots with attendance status — 3-state: gray / green / red */}
                      {!holiday && daySlots.map((slot) => {
                        const override = overrideBySlot[slot.id];
                        const isMySlot = role === "professeur" && slot.teacher_id === myTeacherId;
                        const canToggle = (role === "admin" || isMySlot) && dateStr <= todayStr;
                        const status: "present" | "absent" | "rattrapage" | "unknown" =
                          override?.type === "present" ? "present"
                          : (override?.type === "absent" || override?.type === "cancelled") ? "absent"
                          : override?.type === "rattrapage" ? "rattrapage"
                          : "unknown";

                        return (
                          <div
                            key={slot.id}
                            className={`border-2 rounded-lg p-2 transition-colors ${
                              status === "present"    ? "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-500"
                              : status === "absent"   ? "bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500"
                              : status === "rattrapage" ? "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500"
                              : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                status === "present" ? "bg-green-500"
                                : status === "absent" ? "bg-red-500"
                                : status === "rattrapage" ? "bg-yellow-400"
                                : "bg-gray-300 dark:bg-gray-500"
                              }`} />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                              </span>
                            </div>
                            <div className="font-semibold text-sm text-gray-800 dark:text-white leading-tight">
                              {slot.subjects.name}
                            </div>
                            {slot.teachers && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {slot.teachers.first_name} {slot.teachers.last_name}
                              </div>
                            )}
                            {override && override.type !== "present" && (
                              <div className="text-xs text-red-500 dark:text-red-400 mt-0.5 font-medium">
                                {override.type === "rattrapage" ? "Rattrapage" : "Absent"}
                                {override.reason ? ` — ${override.reason}` : ""}
                              </div>
                            )}
                            {canToggle && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {status === "unknown" && (
                                  <>
                                    <button onClick={() => handleMarkPresent(slot, dateStr)}
                                      className="text-xs bg-green-100 text-green-700 rounded-md px-2 py-0.5 hover:bg-green-200 font-medium dark:bg-green-900/40 dark:text-green-400">
                                      ✓ Présent
                                    </button>
                                    <button onClick={() => openMarkAbsent(slot, dateStr)}
                                      className="text-xs bg-red-100 text-red-600 rounded-md px-2 py-0.5 hover:bg-red-200 font-medium dark:bg-red-900/40 dark:text-red-400">
                                      × Absent
                                    </button>
                                  </>
                                )}
                                {status === "present" && (
                                  <>
                                    <button onClick={() => deleteOverride(override!.id)}
                                      className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 hover:bg-gray-200 font-medium dark:bg-gray-700 dark:text-gray-400">
                                      ↩ Effacer
                                    </button>
                                    <button onClick={() => openMarkAbsent(slot, dateStr)}
                                      className="text-xs bg-red-100 text-red-600 rounded-md px-2 py-0.5 hover:bg-red-200 font-medium dark:bg-red-900/40 dark:text-red-400">
                                      × Absent
                                    </button>
                                  </>
                                )}
                                {status === "absent" && (
                                  <>
                                    <button onClick={() => handleMarkPresent(slot, dateStr)}
                                      className="text-xs bg-green-100 text-green-700 rounded-md px-2 py-0.5 hover:bg-green-200 font-medium dark:bg-green-900/40 dark:text-green-400">
                                      ✓ Présent
                                    </button>
                                    <button onClick={() => deleteOverride(override!.id)}
                                      className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 hover:bg-gray-200 font-medium dark:bg-gray-700 dark:text-gray-400">
                                      ↩ Effacer
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Rattrapages */}
                      {!holiday && rattrapages.map((r) => (
                        <div key={r.id} className="border-2 rounded-lg p-2 bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500">
                          <div className="mb-0.5">
                            <span className="text-[10px] bg-yellow-200 text-yellow-700 rounded px-1.5 py-0.5 font-bold uppercase dark:bg-yellow-900/40 dark:text-yellow-400">
                              Rattrapage
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fmtTime(r.start_time)} – {fmtTime(r.end_time)}
                          </div>
                          <div className="font-semibold text-sm text-gray-800 dark:text-white leading-tight">
                            {r.subjects?.name ?? "—"}
                          </div>
                          {r.teachers && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {r.teachers.first_name} {r.teachers.last_name}
                            </div>
                          )}
                          {r.reason && <div className="text-xs text-gray-500 mt-0.5 italic">{r.reason}</div>}
                          {role === "admin" && (
                            <button
                              onClick={() => deleteOverride(r.id)}
                              className="mt-1.5 text-xs text-red-400 hover:text-red-600 font-medium"
                            >
                              × Supprimer
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Empty day message */}
                      {!holiday && daySlots.length === 0 && rattrapages.length === 0 && (
                        <div className="text-xs text-gray-300 dark:text-gray-700 text-center py-2">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary list */}
          {activeClassId && !gridLoading && overrides.filter(o => o.type !== "present").length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Résumé de la semaine
              </h3>
              <div className="space-y-2">
                {overrides.filter(o => o.type !== "present").map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      o.type === "rattrapage" ? "bg-yellow-400"
                      : o.type === "absent" || o.type === "cancelled" ? "bg-red-500"
                      : "bg-gray-400"
                    }`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                      <strong className="text-gray-800 dark:text-white">{o.subjects?.name ?? "—"}</strong>
                      {" · "}{fmtFullDate(o.date)}{" "}{fmtTime(o.start_time)}–{fmtTime(o.end_time)}
                      {o.teachers && <span className="text-gray-400"> · {o.teachers.first_name} {o.teachers.last_name}</span>}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      o.type === "rattrapage"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {o.type === "rattrapage" ? "Rattrapage" : "Absent"}
                    </span>
                    {role === "admin" && (
                      <button
                        onClick={() => deleteOverride(o.id)}
                        title="Supprimer"
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ MODALS ════════════ */}

      {/* Add Regular Slot */}
      {showAddSlot && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Ajouter un créneau — {DAYS[addSlotForm.day_of_week - 1]?.full}
              </h2>
              <button onClick={() => setShowAddSlot(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {addSlotError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{addSlotError}</div>
            )}
            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Jour</label>
                <select value={addSlotForm.day_of_week} onChange={(e) => setAddSlotForm({ ...addSlotForm, day_of_week: Number(e.target.value) })} className={inp}>
                  {DAYS.map((d) => <option key={d.num} value={d.num}>{d.full}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Heure début *</label>
                  <input type="time" value={addSlotForm.start_time} onChange={(e) => setAddSlotForm({ ...addSlotForm, start_time: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Heure fin *</label>
                  <input type="time" value={addSlotForm.end_time} onChange={(e) => setAddSlotForm({ ...addSlotForm, end_time: e.target.value })} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matière *</label>
                <select value={addSlotForm.subject_id} onChange={(e) => setAddSlotForm({ ...addSlotForm, subject_id: e.target.value })} className={inp}>
                  <option value="">-- Choisir --</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Professeur</label>
                <select value={addSlotForm.teacher_id} onChange={(e) => setAddSlotForm({ ...addSlotForm, teacher_id: e.target.value })} className={inp}>
                  <option value="">-- Aucun --</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddSlot(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={addSlotLoading} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
                  {addSlotLoading ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rattrapage */}
      {showRatt && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Ajouter un rattrapage</h2>
              <button onClick={() => setShowRatt(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {rattError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{rattError}</div>
            )}
            <form onSubmit={handleAddRattrapage} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
                <input type="date" value={rattForm.date} onChange={(e) => setRattForm({ ...rattForm, date: e.target.value })} className={inp} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Classe *</label>
                <select value={rattForm.class_id} onChange={(e) => setRattForm({ ...rattForm, class_id: e.target.value })} className={inp} required>
                  <option value="">-- Choisir --</option>
                  {(role === "professeur"
                    ? profClasses.map((tc) => tc.classes)
                    : classes
                  ).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Début *</label>
                  <input type="time" value={rattForm.start_time} onChange={(e) => setRattForm({ ...rattForm, start_time: e.target.value })} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fin *</label>
                  <input type="time" value={rattForm.end_time} onChange={(e) => setRattForm({ ...rattForm, end_time: e.target.value })} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matière *</label>
                <select value={rattForm.subject_id} onChange={(e) => setRattForm({ ...rattForm, subject_id: e.target.value })} className={inp} required>
                  <option value="">-- Choisir --</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Professeur</label>
                <select value={rattForm.teacher_id} onChange={(e) => setRattForm({ ...rattForm, teacher_id: e.target.value })} className={inp}>
                  <option value="">-- Aucun --</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Raison / Note</label>
                <input value={rattForm.reason} onChange={(e) => setRattForm({ ...rattForm, reason: e.target.value })} placeholder="Optionnel" className={inp} />
              </div>
              <div className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
                Une notification sera envoyée aux étudiants, administrateurs et professeurs de la classe sélectionnée.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowRatt(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={rattLoading} className="flex-1 py-2.5 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 disabled:opacity-60">
                  {rattLoading ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Absent */}
      {showAbsent && absentSlot && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Marquer absent</h2>
              <button onClick={() => setShowAbsent(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="mb-4 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2.5 dark:bg-orange-900/20 dark:border-orange-800">
              <div className="font-semibold text-sm text-orange-700 dark:text-orange-400">{absentSlot.slot.subjects.name}</div>
              <div className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
                {fmtFullDate(absentSlot.date)} · {fmtTime(absentSlot.slot.start_time)} – {fmtTime(absentSlot.slot.end_time)}
              </div>
            </div>
            {absentError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{absentError}</div>
            )}
            <form onSubmit={handleMarkAbsent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Raison (optionnel)</label>
                <input value={absentReason} onChange={(e) => setAbsentReason(e.target.value)} placeholder="Ex : Maladie, réunion..." className={inp} />
              </div>
              <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                Les étudiants, administrateurs et professeurs de la classe seront notifiés de l'annulation de ce cours.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAbsent(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={absentLoading} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60">
                  {absentLoading ? "Envoi..." : "Confirmer absence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holiday */}
      {showHoliday && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Ajouter un jour de congé</h2>
              <button onClick={() => setShowHoliday(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {holError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{holError}</div>
            )}
            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
                <input type="date" value={holForm.date} onChange={(e) => setHolForm({ ...holForm, date: e.target.value })} className={inp} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <input value={holForm.name} onChange={(e) => setHolForm({ ...holForm, name: e.target.value })} placeholder="Ex : Fête nationale, Aïd..." className={inp} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <input value={holForm.description} onChange={(e) => setHolForm({ ...holForm, description: e.target.value })} placeholder="Optionnel" className={inp} />
              </div>
              <div className="text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                Tous les utilisateurs seront notifiés de ce congé.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowHoliday(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={holLoading} className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60">
                  {holLoading ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prof Absent for Day */}
      {showProfAbsent && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Marquer prof absent (journée)</h2>
              <button onClick={() => { setShowProfAbsent(false); setProfAbsentError(""); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {profAbsentError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{profAbsentError}</div>
            )}
            <form onSubmit={handleProfAbsentDay} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Professeur *</label>
                <select
                  value={profAbsentForm.teacher_id}
                  onChange={(e) => setProfAbsentForm({ ...profAbsentForm, teacher_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white"
                  required
                >
                  <option value="">— Choisir un professeur —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
                <input
                  type="date"
                  value={profAbsentForm.date}
                  onChange={(e) => setProfAbsentForm({ ...profAbsentForm, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Motif</label>
                <input
                  value={profAbsentForm.reason}
                  onChange={(e) => setProfAbsentForm({ ...profAbsentForm, reason: e.target.value })}
                  placeholder="Ex : Maladie, formation..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white"
                />
              </div>
              <div className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                Toutes les séances de ce professeur pour cette journée seront marquées absentes. Une notification globale sera envoyée.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowProfAbsent(false); setProfAbsentError(""); }} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={profAbsentLoading} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60">
                  {profAbsentLoading ? "Envoi..." : "Confirmer absence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
