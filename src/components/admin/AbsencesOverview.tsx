"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type ClassItem = { id: string; name: string };

type AttendanceRecord = {
  id: string; date: string; status: "present" | "absent";
  subjects: { name: string };
  students: { id: string; first_name: string; last_name: string; classes?: { id: string; name: string } | null };
};

type TeacherAbsence = {
  id: string; date: string; start_time: string; end_time: string;
  reason: string | null; type: string;
  teachers: { first_name: string; last_name: string } | null;
  subjects: { name: string } | null;
  classes: { name: string } | null;
};

type AbsenceRequest = {
  id: string; date: string; start_time: string | null; end_time: string | null;
  type: "absence" | "conge"; reason: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null; created_at: string;
  teachers: { first_name: string; last_name: string } | null;
  subjects?: { name: string } | null;
  classes?: { name: string } | null;
};

type Teacher = { id: string; first_name: string; last_name: string };

type MainTab = "students" | "teachers" | "requests";
type StatusFilter = "all" | "absent" | "present";
type ReqFilter = "all" | "pending" | "approved" | "rejected";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const fmtTime = (t: string) => (t ? t.slice(0, 5) : "");

const inp = "w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AbsencesOverview() {
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "professeur" | "">("");
  const [mainTab, setMainTab] = useState<MainTab>("students");
  const [initLoading, setInitLoading] = useState(true);

  // ── Students tab ──
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [noTeacher, setNoTeacher] = useState(false);

  // ── Teachers tab (admin) ──
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAbsences, setTeacherAbsences] = useState<TeacherAbsence[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);

  // ── Mark prof absent modal ──
  const [showMarkAbsent, setShowMarkAbsent] = useState(false);
  const [markForm, setMarkForm] = useState({ teacher_id: "", date: "", reason: "" });
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState("");
  const [markSuccess, setMarkSuccess] = useState("");

  // ── Requests tab ──
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [reqFilter, setReqFilter] = useState<ReqFilter>("all");
  const [reqLoading, setReqLoading] = useState(false);

  // ── New request modal (professor) ──
  const [showNewReq, setShowNewReq] = useState(false);
  const [reqForm, setReqForm] = useState({ date: "", type: "absence" as "absence" | "conge", reason: "" });
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqError, setReqError] = useState("");

  // ── Admin: review modal ──
  const [reviewing, setReviewing] = useState<AbsenceRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // ── Init ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userRole = user?.app_metadata?.role as string | undefined;

      if (userRole === "admin") {
        setRole("admin");
        const res = await fetch("/api/classes");
        const cls = await res.json();
        setClasses(Array.isArray(cls) ? cls : []);
        setSelectedClassId("all");
      } else if (userRole === "professeur") {
        setRole("professeur");
        setMainTab("requests");
        const res = await fetch("/api/teachers/me");
        if (!res.ok) { setNoTeacher(true); setInitLoading(false); return; }
        const teacher = await res.json();
        const teacherClasses: ClassItem[] = (teacher.teacher_classes ?? []).map((tc: any) => tc.classes).filter(Boolean);
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) setSelectedClassId(teacherClasses[0].id);
      }
      setInitLoading(false);
    };
    init();
  }, []);

  // Load student attendance
  useEffect(() => {
    if (initLoading || role === "") return;
    setRecLoading(true);
    const url = selectedClassId === "all" ? "/api/attendance/all" : `/api/attendance/all?class_id=${selectedClassId}`;
    fetch(url).then(r => r.json()).then(data => setRecords(Array.isArray(data) ? data : [])).finally(() => setRecLoading(false));
  }, [selectedClassId, initLoading, role]);

  // Load teacher absences + teacher list (admin only)
  const loadTeacherData = async () => {
    if (role !== "admin") return;
    setTabsLoading(true);
    const [ovrRes, tRes] = await Promise.all([
      fetch("/api/schedule/overrides?all=1"),
      fetch("/api/teachers"),
    ]);
    const [ovrData, tData] = await Promise.all([ovrRes.json(), tRes.json()]);
    const absences = (Array.isArray(ovrData) ? ovrData : []).filter((o: any) => o.type === "absent");
    setTeacherAbsences(absences);
    setTeachers(Array.isArray(tData) ? tData : []);
    setTabsLoading(false);
  };

  // Load requests
  const loadRequests = async () => {
    setReqLoading(true);
    const res = await fetch("/api/teacher-requests");
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setReqLoading(false);
  };

  useEffect(() => {
    if (initLoading || role === "") return;
    if (mainTab === "teachers") loadTeacherData();
    if (mainTab === "requests") loadRequests();
  }, [mainTab, initLoading, role]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleMarkAbsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markForm.teacher_id || !markForm.date) { setMarkError("Professeur et date requis"); return; }
    setMarkLoading(true); setMarkError(""); setMarkSuccess("");
    const res = await fetch("/api/schedule/prof-absent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: markForm.teacher_id, date: markForm.date, reason: markForm.reason || null }),
    });
    const json = await res.json();
    setMarkLoading(false);
    if (!res.ok) { setMarkError(json.error ?? "Erreur"); return; }
    setMarkSuccess(`${json.created} séance(s) marquée(s) absente. Notification globale envoyée.`);
    setMarkForm({ teacher_id: "", date: "", reason: "" });
    loadTeacherData();
    setTimeout(() => { setShowMarkAbsent(false); setMarkSuccess(""); }, 2000);
  };

  const handleDeleteAbsence = async (id: string) => {
    if (!confirm("Restaurer cette séance (supprimer l'absence) ?")) return;
    await fetch(`/api/schedule/overrides/${id}`, { method: "DELETE" });
    setTeacherAbsences(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.date) { setReqError("Date requise"); return; }
    setReqSubmitting(true); setReqError("");
    const res = await fetch("/api/teacher-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: reqForm.date, type: reqForm.type, reason: reqForm.reason || null }),
    });
    const json = await res.json();
    setReqSubmitting(false);
    if (!res.ok) { setReqError(json.error ?? "Erreur"); return; }
    setShowNewReq(false);
    setReqForm({ date: "", type: "absence", reason: "" });
    loadRequests();
  };

  const handleReview = async (status: "approved" | "rejected") => {
    if (!reviewing) return;
    setReviewLoading(true);
    const res = await fetch(`/api/teacher-requests/${reviewing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_note: reviewNote || null }),
    });
    setReviewLoading(false);
    if (!res.ok) return;
    setReviewing(null);
    setReviewNote("");
    loadRequests();
    loadTeacherData();
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Supprimer cette demande ?")) return;
    await fetch(`/api/teacher-requests/${id}`, { method: "DELETE" });
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  // ── Derived data ─────────────────────────────────────────────────────────────

  const displayedRecords = records.filter(r => statusFilter === "all" || r.status === statusFilter);
  const showClassCol = role === "admin" && selectedClassId === "all";
  const absentCount = records.filter(r => r.status === "absent").length;
  const presentCount = records.filter(r => r.status === "present").length;

  const filteredRequests = requests.filter(r => reqFilter === "all" || r.status === reqFilter);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (initLoading) return (
    <div className="p-6 flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (noTeacher) return (
    <div className="p-6">
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-6 text-center">
        <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Profil enseignant introuvable</p>
        <p className="text-sm text-yellow-700 dark:text-yellow-400">Votre compte n&apos;est associé à aucun profil professeur. Contactez l&apos;administrateur.</p>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  const adminTabs: { key: MainTab; label: string; badge?: number }[] = [
    { key: "students", label: "Absences étudiants" },
    { key: "teachers", label: "Absences professeurs" },
    { key: "requests", label: "Demandes", badge: pendingCount },
  ];

  const profTabs: { key: MainTab; label: string; badge?: number }[] = [
    { key: "requests", label: "Mes demandes", badge: pendingCount },
  ];

  const tabs = role === "admin" ? adminTabs : profTabs;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {role === "admin" ? "Absences & Présences" : "Mes demandes d'absence"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {role === "admin" ? "Gestion des absences étudiants et professeurs." : "Soumettez et suivez vos demandes de congé ou d'absence."}
          </p>
        </div>
        {role === "admin" && mainTab === "teachers" && (
          <button
            onClick={() => { setMarkForm({ teacher_id: teachers[0]?.id ?? "", date: "", reason: "" }); setMarkError(""); setMarkSuccess(""); setShowMarkAbsent(true); }}
            className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
          >
            + Marquer prof absent
          </button>
        )}
        {role === "professeur" && mainTab === "requests" && (
          <button
            onClick={() => { setReqForm({ date: "", type: "absence", reason: "" }); setReqError(""); setShowNewReq(true); }}
            className="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600"
          >
            + Nouvelle demande
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              mainTab === t.key
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {t.label}
            {(t.badge ?? 0) > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB: STUDENTS ═══════════════ */}
      {mainTab === "students" && (
        <div className="space-y-4">
          {/* Class tabs */}
          <div className="flex flex-wrap gap-2">
            {role === "admin" && (
              <button onClick={() => setSelectedClassId("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedClassId === "all" ? "bg-brand-500 text-white border-brand-500" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"}`}>
                Toutes les classes
              </button>
            )}
            {classes.map(cls => (
              <button key={cls.id} onClick={() => setSelectedClassId(cls.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedClassId === cls.id ? "bg-brand-500 text-white border-brand-500" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"}`}>
                {cls.name}
              </button>
            ))}
          </div>

          {/* Stats + filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <strong className="text-gray-800 dark:text-white">{absentCount}</strong>
                <span className="text-gray-500">absence{absentCount !== 1 ? "s" : ""}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <strong className="text-gray-800 dark:text-white">{presentCount}</strong>
                <span className="text-gray-500">présence{presentCount !== 1 ? "s" : ""}</span>
              </span>
            </div>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
              {(["all", "absent", "present"] as StatusFilter[]).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 transition-colors ${statusFilter === f ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>
                  {f === "all" ? "Tous" : f === "absent" ? "Absences" : "Présences"}
                </button>
              ))}
            </div>
          </div>

          {/* Student attendance table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {recLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Étudiant</th>
                    {showClassCol && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Classe</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Matière</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {displayedRecords.length === 0 && (
                    <tr><td colSpan={showClassCol ? 6 : 5} className="px-4 py-10 text-center text-gray-400">Aucun enregistrement</td></tr>
                  )}
                  {displayedRecords.map(a => (
                    <tr key={a.id} onClick={() => router.push(`/dashboard/students/${a.students.id}`)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDate(a.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white whitespace-nowrap">{a.students.last_name} {a.students.first_name}</td>
                      {showClassCol && <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{(a.students.classes as any)?.name ?? "—"}</td>}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.subjects?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        {a.status === "absent"
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">Absent</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">Présent</span>}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/students/${a.students.id}`)}
                            title="Voir le profil"
                            className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: TEACHER ABSENCES ═══════════════ */}
      {mainTab === "teachers" && role === "admin" && (
        <div className="space-y-4">
          {tabsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Professeur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Matière</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Classe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Horaire</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Raison</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {teacherAbsences.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucune absence professeur enregistrée</td></tr>
                  )}
                  {teacherAbsences.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDate(a.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white whitespace-nowrap">
                        {a.teachers ? `${a.teachers.first_name} ${a.teachers.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.subjects?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.classes?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtTime(a.start_time)} – {fmtTime(a.end_time)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 italic">{a.reason || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDeleteAbsence(a.id)}
                            title="Restaurer (supprimer l'absence)"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: REQUESTS ═══════════════ */}
      {mainTab === "requests" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Statut :</span>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
              {(["all", "pending", "approved", "rejected"] as ReqFilter[]).map(f => (
                <button key={f} onClick={() => setReqFilter(f)}
                  className={`px-3 py-1.5 transition-colors ${reqFilter === f ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>
                  {f === "all" ? "Toutes" : f === "pending" ? "En attente" : f === "approved" ? "Approuvées" : "Refusées"}
                </button>
              ))}
            </div>
          </div>

          {reqLoading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date demandée</th>
                    {role === "admin" && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Professeur</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Raison</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan={role === "admin" ? 6 : 5} className="px-4 py-10 text-center text-gray-400">Aucune demande</td></tr>
                  )}
                  {filteredRequests.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{fmtDate(r.date)}</td>
                      {role === "admin" && (
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white whitespace-nowrap">
                          {r.teachers ? `${r.teachers.first_name} ${r.teachers.last_name}` : "—"}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.type === "conge" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                          {r.type === "conge" ? "Congé" : "Absence"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 italic max-w-[200px] truncate">{r.reason || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : r.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {r.status === "pending" ? "En attente" : r.status === "approved" ? "Approuvée" : "Refusée"}
                        </span>
                        {r.admin_note && <p className="text-xs text-gray-400 mt-0.5 italic">{r.admin_note}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {role === "admin" && r.status === "pending" && (
                            <button
                              onClick={() => { setReviewing(r); setReviewNote(""); }}
                              title="Examiner"
                              className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(r.id)}
                            title="Supprimer"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Mark prof absent modal (admin) */}
      {showMarkAbsent && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Marquer un professeur absent</h2>
              <button onClick={() => setShowMarkAbsent(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {markError && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{markError}</div>}
            {markSuccess && <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">{markSuccess}</div>}
            <form onSubmit={handleMarkAbsent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Professeur *</label>
                <select value={markForm.teacher_id} onChange={e => setMarkForm({ ...markForm, teacher_id: e.target.value })} className={inp} required>
                  <option value="">-- Choisir --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
                <input type="date" value={markForm.date} onChange={e => setMarkForm({ ...markForm, date: e.target.value })} className={inp} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Raison</label>
                <input value={markForm.reason} onChange={e => setMarkForm({ ...markForm, reason: e.target.value })} placeholder="Maladie, formation..." className={inp} />
              </div>
              <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                Toutes les séances du professeur ce jour seront marquées absentes. Une notification globale sera envoyée.
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowMarkAbsent(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={markLoading} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60">
                  {markLoading ? "Traitement..." : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New request modal (professor) */}
      {showNewReq && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Nouvelle demande</h2>
              <button onClick={() => setShowNewReq(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {reqError && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{reqError}</div>}
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type *</label>
                <div className="flex gap-2">
                  {(["absence", "conge"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setReqForm({ ...reqForm, type: t })}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${reqForm.type === t ? "bg-brand-500 text-white border-brand-500" : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"}`}>
                      {t === "absence" ? "Absence" : "Congé"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
                <input type="date" value={reqForm.date} onChange={e => setReqForm({ ...reqForm, date: e.target.value })} className={inp} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Raison</label>
                <input value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} placeholder="Motif de votre demande..." className={inp} />
              </div>
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                Votre demande sera soumise à l&apos;administrateur pour validation. Une notification lui sera envoyée.
              </p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNewReq(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={reqSubmitting} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
                  {reqSubmitting ? "Envoi..." : "Soumettre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review request modal (admin) */}
      {reviewing && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Examiner la demande</h2>
              <button onClick={() => setReviewing(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-3 space-y-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {reviewing.teachers ? `${reviewing.teachers.first_name} ${reviewing.teachers.last_name}` : "—"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {reviewing.type === "conge" ? "Congé" : "Absence"} — {fmtDate(reviewing.date)}
              </p>
              {reviewing.reason && <p className="text-xs text-gray-500 italic">{reviewing.reason}</p>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Note admin (optionnel)</label>
                <input value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Commentaire..." className={inp} />
              </div>
              <div className="text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                Si vous approuvez, toutes les séances de ce professeur ce jour seront automatiquement marquées absentes dans l&apos;emploi du temps.
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => handleReview("rejected")} disabled={reviewLoading}
                  className="flex-1 py-2.5 rounded-lg border border-red-300 text-sm text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 disabled:opacity-60">
                  {reviewLoading ? "..." : "Refuser"}
                </button>
                <button onClick={() => handleReview("approved")} disabled={reviewLoading}
                  className="flex-1 py-2.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-60">
                  {reviewLoading ? "..." : "Approuver"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
