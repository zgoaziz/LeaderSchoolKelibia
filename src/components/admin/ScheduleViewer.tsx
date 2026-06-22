"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────

type Semester  = { id: string; name: string; start_date: string; end_date: string };
type Subject   = { id: string; name: string };
type Slot      = {
  id: string; day_of_week: number;
  start_time: string; end_time: string;
  subject_id: string; teacher_id: string | null;
  subjects: { name: string };
  teachers: { first_name: string; last_name: string } | null;
};
type Override  = {
  id: string; slot_id: string | null;
  date: string; start_time: string; end_time: string;
  type: "rattrapage" | "absent" | "cancelled" | "present";
  reason: string | null;
  subjects: { name: string } | null;
  teachers: { first_name: string; last_name: string } | null;
};
type Holiday   = { id: string; date: string; name: string; description: string | null };
type MyStudent = {
  id: string; first_name: string; last_name: string;
  class_id: string | null;
  classes: { id: string; name: string } | null;
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
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-purple-50 border-purple-200",
  "bg-orange-50 border-orange-200",
  "bg-pink-50 border-pink-200",
  "bg-teal-50 border-teal-200",
  "bg-yellow-50 border-yellow-200",
  "bg-indigo-50 border-indigo-200",
];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day  = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtShortDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtTime(t: string): string { return t.slice(0, 5); }

function weekLabel(start: Date): string {
  const end = addDays(start, 5);
  return `${fmtShortDate(start)} – ${fmtShortDate(end)} ${end.getFullYear()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleViewer() {
  const [myStudent,   setMyStudent]   = useState<MyStudent | null>(null);
  const [noStudent,   setNoStudent]   = useState(false);
  const [semesters,   setSemesters]   = useState<Semester[]>([]);
  const [activeSem,   setActiveSem]   = useState<Semester | null>(null);
  const [subjects,    setSubjects]    = useState<Subject[]>([]);
  const [slots,       setSlots]       = useState<Slot[]>([]);
  const [overrides,   setOverrides]   = useState<Override[]>([]);
  const [holidays,    setHolidays]    = useState<Holiday[]>([]);
  const [weekStart,   setWeekStart]   = useState<Date>(() => getMonday(new Date()));
  const [gridLoading, setGridLoading] = useState(false);
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null);

  const printRef   = useRef<HTMLDivElement>(null);
  const weekDates  = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/students/me").then(async (res) => {
      if (res.ok) setMyStudent(await res.json());
      else        setNoStudent(true);
    });

    fetch("/api/semesters").then(async (res) => {
      if (!res.ok) return;
      const list: Semester[] = await res.json();
      if (!Array.isArray(list)) return;
      setSemesters(list);
      if (list.length) setActiveSem(list[list.length - 1]);
    });
  }, []);

  useEffect(() => {
    if (!activeSem) return;
    fetch("/api/subjects")
      .then(r => r.json())
      .then(d => setSubjects(Array.isArray(d) ? d : []));
  }, [activeSem]);

  useEffect(() => {
    if (!myStudent?.class_id || !activeSem) return;
    loadWeek(myStudent.class_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myStudent, activeSem, weekStart]);

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadWeek = async (classId: string) => {
    setGridLoading(true);
    const ws = toDateStr(weekStart);
    const [sR, oR, hR] = await Promise.all([
      fetch(`/api/schedule-slots?semester_id=${activeSem!.id}&class_id=${classId}`),
      fetch(`/api/schedule/overrides?class_id=${classId}&week_start=${ws}`),
      fetch(`/api/schedule/holidays?week_start=${ws}`),
    ]);
    const [sD, oD, hD] = await Promise.all([sR.json(), oR.json(), hR.json()]);
    setSlots(Array.isArray(sD) ? sD : []);
    setOverrides(Array.isArray(oD) ? oD : []);
    setHolidays(Array.isArray(hD) ? hD : []);
    setGridLoading(false);
  };

  const getColor = (subjectId: string) => {
    const idx = subjects.findIndex(s => s.id === subjectId);
    return COLORS[Math.max(0, idx) % COLORS.length];
  };

  // ─── Export ───────────────────────────────────────────────────────────────

  const captureCanvas = () =>
    html2canvas(printRef.current!, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });

  const fileName = () =>
    `emploi-du-temps-${myStudent?.classes?.name ?? "classe"}-${toDateStr(weekStart)}`;

  const handleDownloadPNG = async () => {
    if (!printRef.current) return;
    setDownloading("png");
    try {
      const canvas = await captureCanvas();
      const link   = document.createElement("a");
      link.download = `${fileName()}.png`;
      link.href     = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading("pdf");
    try {
      const canvas  = await captureCanvas();
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pw      = pdf.internal.pageSize.getWidth();
      const ph      = pdf.internal.pageSize.getHeight();
      const margin  = 8;
      const maxW    = pw - margin * 2;
      const maxH    = ph - margin * 2;
      const ratio   = canvas.width / canvas.height;
      let w = maxW, h = maxW / ratio;
      if (h > maxH) { h = maxH; w = maxH * ratio; }
      pdf.addImage(imgData, "PNG", (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save(`${fileName()}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  // ─── No student profile ───────────────────────────────────────────────────

  if (noStudent) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Mon emploi du temps</h1>
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400">
          Aucun profil étudiant associé à votre compte. Contactez l'administration.
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  const hasSchedule = !!(myStudent?.class_id && activeSem && !gridLoading);

  return (
    <div className="p-6">

      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-start gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mon emploi du temps</h1>
          {myStudent && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {myStudent.first_name} {myStudent.last_name}
              {myStudent.classes && <> · Classe <strong className="text-gray-700 dark:text-gray-300">{myStudent.classes.name}</strong></>}
            </p>
          )}
        </div>

        {/* Semester picker */}
        {semesters.length > 1 && (
          <select
            value={activeSem?.id ?? ""}
            onChange={e => setActiveSem(semesters.find(s => s.id === e.target.value) ?? null)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
          >
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Week navigation */}
        <div className="flex items-center gap-2">
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

      {/* ── Download buttons ── */}
      {hasSchedule && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleDownloadPNG}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {downloading === "png" ? "Export en cours..." : "Télécharger PNG"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            {downloading === "pdf" ? "Export en cours..." : "Télécharger PDF"}
          </button>
        </div>
      )}

      {/* ── No class ── */}
      {myStudent && !myStudent.class_id && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400">
          Vous n'êtes pas encore affecté à une classe. Contactez l'administration.
        </div>
      )}

      {/* ── Loading ── */}
      {gridLoading && (
        <p className="text-center text-gray-400 py-12">Chargement de l'emploi du temps...</p>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PRINTABLE AREA — this div is captured by html2canvas
          ══════════════════════════════════════════════════════════════════ */}
      {myStudent?.class_id && activeSem && !gridLoading && (
        <div
          ref={printRef}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          {/* Official header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-100">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logoleaderschool.png"
                alt="Logo école"
                className="h-14 w-auto object-contain"
                crossOrigin="anonymous"
              />
              <div>
                <div className="text-base font-bold text-gray-900 leading-tight">Emploi du temps officiel</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {activeSem.name} · Classe <span className="font-semibold text-gray-700">{myStudent.classes?.name}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Semaine</div>
              <div className="text-sm font-semibold text-gray-700">{weekLabel(weekStart)}</div>
            </div>
          </div>

          {/* Weekly grid — READ ONLY */}
          <div className="grid grid-cols-6 gap-2 min-w-0">
            {weekDates.map((date, i) => {
              const dayNum         = i + 1;
              const dateStr        = toDateStr(date);
              const holiday        = holidays.find(h => h.date === dateStr);
              const daySlots       = slots
                .filter(s => s.day_of_week === dayNum)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              const dayOverrides   = overrides.filter(o => o.date === dateStr);
              const rattrapages    = dayOverrides.filter(o => o.type === "rattrapage");
              const overrideBySlot = Object.fromEntries(
                dayOverrides.filter(o => o.slot_id).map(o => [o.slot_id!, o]),
              );

              return (
                <div key={dayNum} className="flex flex-col gap-1.5">
                  {/* Day header */}
                  <div className={`rounded-lg py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                    holiday
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <div>{DAYS[i].short}</div>
                    <div className="text-[10px] font-normal mt-0.5 opacity-70">{fmtShortDate(date)}</div>
                  </div>

                  {/* Holiday card */}
                  {holiday && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-2.5">
                      <div className="text-xs font-semibold text-red-600">🏖 {holiday.name}</div>
                      {holiday.description && (
                        <div className="text-xs text-red-400 mt-0.5">{holiday.description}</div>
                      )}
                    </div>
                  )}

                  {/* Regular slots */}
                  {!holiday && daySlots.map(slot => {
                    const override = overrideBySlot[slot.id];
                    const isAbsent = !!override;

                    return (
                      <div
                        key={slot.id}
                        className={`border rounded-lg p-2 ${
                          isAbsent
                            ? "bg-red-50 border-red-200 opacity-80"
                            : getColor(slot.subject_id)
                        }`}
                      >
                        <div className="text-xs text-gray-500 mb-0.5">
                          {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                        </div>
                        <div className={`font-semibold text-sm leading-tight ${isAbsent ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {slot.subjects.name}
                        </div>
                        {slot.teachers && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {slot.teachers.first_name} {slot.teachers.last_name}
                          </div>
                        )}
                        {isAbsent && (
                          <div className="mt-1">
                            <div className="text-xs font-semibold text-red-500">🚫 Cours annulé</div>
                            {override?.reason && (
                              <div className="text-xs text-red-400 italic mt-0.5">{override.reason}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Rattrapages */}
                  {!holiday && rattrapages.map(r => (
                    <div key={r.id} className="border rounded-lg p-2 bg-yellow-50 border-yellow-200">
                      <span className="text-[10px] bg-yellow-200 text-yellow-700 rounded px-1.5 py-0.5 font-bold uppercase">
                        Rattrapage
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {fmtTime(r.start_time)} – {fmtTime(r.end_time)}
                      </div>
                      <div className="font-semibold text-sm text-gray-800 leading-tight">
                        {r.subjects?.name ?? "—"}
                      </div>
                      {r.teachers && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {r.teachers.first_name} {r.teachers.last_name}
                        </div>
                      )}
                      {r.reason && <div className="text-xs text-gray-500 mt-0.5 italic">{r.reason}</div>}
                    </div>
                  ))}

                  {/* Empty day */}
                  {!holiday && daySlots.length === 0 && rattrapages.length === 0 && (
                    <div className="text-xs text-gray-300 text-center py-2 select-none">—</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Official stamp footer ── */}
          <div className="mt-5 pt-3 border-t-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logoleaderschool.png"
                  alt=""
                  className="h-10 w-auto object-contain opacity-50"
                  crossOrigin="anonymous"
                />
                <div>
                  <div className="text-xs font-bold text-gray-600 tracking-wide uppercase">
                    Document officiel — Ne pas modifier
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Ce document est généré automatiquement et ne peut pas être falsifié.
                  </div>
                </div>
              </div>
              <div className="text-right text-[10px] text-gray-400 leading-relaxed">
                <div>Semestre : <span className="font-medium text-gray-500">{activeSem.name}</span></div>
                <div>Classe : <span className="font-medium text-gray-500">{myStudent.classes?.name}</span></div>
                <div>{new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
