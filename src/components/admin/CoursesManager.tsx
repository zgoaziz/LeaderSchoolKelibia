"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import dynamic from "next/dynamic";

// Load editor client-side only (no SSR)
const RichEditor = dynamic(() => import("@/components/editor/RichEditor"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type Subject  = { id: string; name: string };
type ClassItem = { id: string; name: string };
type Teacher  = { id: string; first_name: string; last_name: string };

type Resource = {
  id: string; type: "youtube" | "drive" | "link" | "file";
  title: string | null; url: string; position: number;
};

type CourseSession = {
  id: string;
  slot_id: string | null;
  session_date: string | null;
  title: string;
  chapter_title: string | null;
  content: object | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  subjects: { id: string; name: string } | null;
  classes:  { id: string; name: string } | null;
  teachers: { id: string; first_name: string; last_name: string } | null;
  course_resources: Resource[];
};

type Slot = {
  id: string; day_of_week: number; start_time: string; end_time: string;
  subjects: { id: string; name: string } | null;
  teachers: { first_name: string; last_name: string } | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (t: string) => (t ? t.slice(0, 5) : "");
const fmtDate = (s: string | null) =>
  s ? new Date(s + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getDriveId(url: string): string | null {
  return url.match(/\/file\/d\/([^/?\s]+)/)?.[1] ?? null;
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"]);
const PDF_EXTS   = new Set(["pdf"]);
const OFFICE_EXTS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"]);

function getFileExt(url: string): string {
  return (url.split("?")[0].split(".").pop() ?? "").toLowerCase();
}

function isImageUrl(url: string): boolean {
  return IMAGE_EXTS.has(getFileExt(url));
}

function isPdfUrl(url: string): boolean {
  return PDF_EXTS.has(getFileExt(url));
}

function isOfficeUrl(url: string): boolean {
  return OFFICE_EXTS.has(getFileExt(url));
}

function getFileLabel(url: string, title: string | null): string {
  if (title) return title;
  const ext = getFileExt(url);
  const nameMap: Record<string, string> = {
    pdf: "Document PDF", doc: "Document Word", docx: "Document Word",
    xls: "Feuille Excel", xlsx: "Feuille Excel",
    ppt: "Présentation", pptx: "Présentation PowerPoint",
    odt: "Document OpenOffice", ods: "Feuille Calc", odp: "Présentation Impress",
  };
  return nameMap[ext] ?? "Fichier";
}

function FilePreview({ url, title }: { url: string; title: string | null }) {
  const ext = getFileExt(url);

  const iconMap: Record<string, { icon: string; bg: string; color: string }> = {
    pdf:  { icon: "📄", bg: "bg-red-50 dark:bg-red-900/20",    color: "text-red-600 dark:text-red-400"    },
    doc:  { icon: "📝", bg: "bg-blue-50 dark:bg-blue-900/20",  color: "text-blue-600 dark:text-blue-400"  },
    docx: { icon: "📝", bg: "bg-blue-50 dark:bg-blue-900/20",  color: "text-blue-600 dark:text-blue-400"  },
    xls:  { icon: "📊", bg: "bg-green-50 dark:bg-green-900/20",color: "text-green-600 dark:text-green-400"},
    xlsx: { icon: "📊", bg: "bg-green-50 dark:bg-green-900/20",color: "text-green-600 dark:text-green-400"},
    ppt:  { icon: "📑", bg: "bg-orange-50 dark:bg-orange-900/20",color: "text-orange-600 dark:text-orange-400"},
    pptx: { icon: "📑", bg: "bg-orange-50 dark:bg-orange-900/20",color: "text-orange-600 dark:text-orange-400"},
  };

  const meta = iconMap[ext] ?? { icon: "📁", bg: "bg-gray-50 dark:bg-gray-800", color: "text-gray-500" };

  if (isImageUrl(url)) {
    return (
      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-2" style={{ minHeight: 120 }}>
        <img src={url} alt={title ?? "Image"} className="max-h-40 max-w-full object-contain rounded" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-5 px-4 ${meta.bg}`} style={{ minHeight: 100 }}>
      <span className="text-4xl">{meta.icon}</span>
      <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>{ext.toUpperCase()}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center truncate max-w-full px-2">
        {getFileLabel(url, title)}
      </span>
    </div>
  );
}

function ResourceCard({ r, onDelete, canEdit }: { r: Resource; onDelete: () => void; canEdit: boolean }) {
  const ytId    = r.type === "youtube" ? getYoutubeId(r.url) : null;
  const driveId = r.type === "drive" ? getDriveId(r.url) : null;

  const typeBadge: Record<string, { label: string; cls: string }> = {
    youtube: { label: "▶ YouTube",  cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
    drive:   { label: "☁ Drive",    cls: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    file:    { label: "📎 Fichier", cls: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
    link:    { label: "🔗 Lien",    cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  };
  const badge = typeBadge[r.type] ?? typeBadge.link;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">

      {/* ── Preview zone ── */}
      {r.type === "youtube" && ytId && (
        <div className="aspect-video bg-black">
          <iframe className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={r.title ?? "YouTube"} />
        </div>
      )}

      {r.type === "drive" && driveId && (
        <div className="relative w-full" style={{ paddingBottom: "65%", height: 0 }}>
          <iframe src={`https://drive.google.com/file/d/${driveId}/preview`}
            className="absolute inset-0 w-full h-full" allowFullScreen title={r.title ?? "Drive"} />
        </div>
      )}

      {r.type === "file" && (
        <>
          {/* PDF → inline iframe */}
          {isPdfUrl(r.url) && (
            <div className="relative w-full" style={{ paddingBottom: "70%", height: 0 }}>
              <iframe src={r.url} className="absolute inset-0 w-full h-full"
                title={r.title ?? "PDF"} />
            </div>
          )}
          {/* Office (Word/Excel/PPT) → Google Docs Viewer */}
          {isOfficeUrl(r.url) && (
            <div className="relative w-full" style={{ paddingBottom: "70%", height: 0 }}>
              <iframe
                src={`https://docs.google.com/gviewer?url=${encodeURIComponent(r.url)}&embedded=true`}
                className="absolute inset-0 w-full h-full"
                title={r.title ?? "Document"}
              />
            </div>
          )}
          {/* Everything else (images / unknown) */}
          {!isPdfUrl(r.url) && !isOfficeUrl(r.url) && (
            <FilePreview url={r.url} title={r.title} />
          )}
        </>
      )}

      {r.type === "link" && (
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <span className="text-2xl">🔗</span>
          <span className="text-sm text-blue-600 dark:text-blue-400 underline truncate">{r.url}</span>
        </a>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
          {r.title ?? getFileLabel(r.url, null)}
        </span>
        {r.type === "file" && (
          <a href={r.url} target="_blank" rel="noopener noreferrer" download
            className="shrink-0 p-1 text-gray-400 hover:text-brand-500 transition-colors" title="Télécharger">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
        )}
        {canEdit && (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CoursesManager() {
  const [role, setRole]         = useState<"admin" | "professeur" | "etudiant" | "">("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses]   = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Day slot picker for the new-course modal
  const [daySlots, setDaySlots]   = useState<Slot[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Filters
  const [selSubject, setSelSubject] = useState("");
  const [selClass, setSelClass]     = useState("");

  // Course list
  const [courses, setCourses]   = useState<CourseSession[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Editor
  const [editing, setEditing]   = useState<CourseSession | null>(null);
  const [editorContent, setEditorContent] = useState<object | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New course form
  const [showNew, setShowNew]   = useState(false);
  const [newForm, setNewForm]   = useState({ slot_id: "", session_date: "", title: "", chapter_title: "", teacher_id: "" });
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState("");

  // Add resource
  const [showRes, setShowRes]   = useState(false);
  const [resForm, setResForm]   = useState({ type: "youtube" as "youtube" | "drive" | "link" | "file", title: "", url: "" });
  const [resLoading, setResLoading] = useState(false);
  const [resUploading, setResUploading] = useState(false);
  const [resDragOver, setResDragOver]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Classroom view (by chapter)
  const [view, setView] = useState<"list" | "editor">("list");

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const r = user.app_metadata?.role as "admin" | "professeur" | "etudiant";
      setRole(r);

      if (r === "etudiant") {
        // Student: only show their class and its subjects
        const stuRes = await fetch("/api/students/me").then(res => res.ok ? res.json() : null);
        if (stuRes?.class_id) {
          // Fetch subjects assigned to this class
          const csRes = await fetch(`/api/class-subjects?class_id=${stuRes.class_id}`).then(res => res.ok ? res.json() : []);
          const classSubjects: Subject[] = (Array.isArray(csRes) ? csRes : [])
            .map((cs: any) => cs.subjects)
            .filter(Boolean);

          // Fallback to all subjects if none are assigned via class_subjects
          const subjects = classSubjects.length > 0
            ? classSubjects
            : await fetch("/api/subjects").then(res => res.json()).then(d => Array.isArray(d) ? d : []);

          setSubjects(subjects);
          setClasses([stuRes.classes]);
          setSelClass(stuRes.class_id);
        } else {
          // No student profile found — show all subjects, no class
          const subRes = await fetch("/api/subjects").then(res => res.json());
          setSubjects(Array.isArray(subRes) ? subRes : []);
        }
      } else {
        const [s, c, t] = await Promise.all([
          fetch("/api/subjects").then(res => res.json()),
          fetch("/api/classes").then(res => res.json()),
          fetch("/api/teachers").then(res => res.json()),
        ]);
        setSubjects(Array.isArray(s) ? s : []);
        setClasses(Array.isArray(c) ? c : []);
        setTeachers(Array.isArray(t) ? t : []);
      }
    });
  }, []);

  // ── Fetch slots for a specific date (used in new-course modal) ────────────

  const loadDaySlots = useCallback(async (date: string, classId: string) => {
    if (!date || !classId) { setDaySlots([]); return; }
    setDayLoading(true);
    const res = await fetch(`/api/schedule-slots?class_id=${classId}&date=${date}`);
    const d = await res.json();
    setDaySlots(Array.isArray(d) ? d : []);
    setDayLoading(false);
  }, []);

  // ── Load courses ───────────────────────────────────────────────────────────

  const loadCourses = useCallback(async () => {
    if (!selSubject || !selClass) return;
    setListLoading(true);
    const params = new URLSearchParams({ subject_id: selSubject, class_id: selClass });
    const res = await fetch(`/api/courses?${params}`);
    const data = await res.json();
    setCourses(Array.isArray(data) ? data : []);
    setListLoading(false);
  }, [selSubject, selClass]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  // ── Auto-save logic ────────────────────────────────────────────────────────

  const handleContentChange = useCallback((json: object) => {
    setEditorContent(json);
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!editing) return;
      const res = await fetch(`/api/courses/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: json }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    }, 1500);
  }, [editing]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openEditor = (course: CourseSession) => {
    setEditing(course);
    setEditorContent(course.content);
    setView("editor");
    setSaveStatus("idle");
  };

  const closeEditor = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setEditing(null);
    setView("list");
    loadCourses();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title) { setNewError("Le titre est requis"); return; }
    setNewLoading(true);
    setNewError("");
    const body: Record<string, unknown> = {
      subject_id: selSubject,
      class_id: selClass,
      title: newForm.title,
      chapter_title: newForm.chapter_title || null,
      session_date: newForm.session_date || null,
      slot_id: newForm.slot_id || null,
    };
    if (role === "admin" && newForm.teacher_id) body.teacher_id = newForm.teacher_id;
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setNewLoading(false);
    if (!res.ok) { setNewError(data.error); return; }
    setShowNew(false);
    setNewForm({ slot_id: "", session_date: "", title: "", chapter_title: "", teacher_id: "" });
    openEditor(data as CourseSession);
  };

  const toggleStatus = async () => {
    if (!editing) return;
    const newStatus = editing.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/courses/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setEditing(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Supprimer ce cours ?")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    setCourses(prev => prev.filter(c => c.id !== id));
    if (editing?.id === id) closeEditor();
  };

  const handleResourceFileUpload = async (file: File) => {
    setResUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/upload/cloudflare", { method: "POST", body: fd });
    const json = await res.json();
    setResUploading(false);
    if (res.ok) {
      setResForm(prev => ({ ...prev, url: json.url, type: "file" }));
    }
  };

  const addResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !resForm.url) return;
    setResLoading(true);
    const res = await fetch(`/api/courses/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resForm),
    });
    const data = await res.json();
    setResLoading(false);
    if (res.ok) {
      setEditing(prev => prev ? { ...prev, course_resources: [...prev.course_resources, data] } : null);
      setShowRes(false);
      setResForm({ type: "youtube", title: "", url: "" });
    }
  };

  const deleteResource = async (resourceId: string) => {
    await fetch(`/api/course-resources/${resourceId}`, { method: "DELETE" });
    setEditing(prev => prev ? { ...prev, course_resources: prev.course_resources.filter(r => r.id !== resourceId) } : null);
  };

  // Group courses by chapter
  const grouped = courses.reduce<Record<string, CourseSession[]>>((acc, c) => {
    const key = c.chapter_title ?? "Sans chapitre";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const canEdit = role === "admin" || role === "professeur";
  const inp = "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2.5 text-gray-800 dark:text-white focus:outline-none focus:border-brand-400";

  // ── Editor view ────────────────────────────────────────────────────────────

  if (view === "editor" && editing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Editor top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={closeEditor} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">
              {editing.subjects?.name ?? "—"} · {editing.classes?.name ?? "—"}
              {editing.chapter_title && <> · <span className="text-blue-500">{editing.chapter_title}</span></>}
            </p>
            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{editing.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              saveStatus === "saving" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              saveStatus === "saved"  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              saveStatus === "error"  ? "bg-red-100 text-red-600" :
              "text-gray-400"
            }`}>
              {saveStatus === "saving" ? "Enregistrement..." : saveStatus === "saved" ? "✓ Enregistré" : saveStatus === "error" ? "✕ Erreur" : ""}
            </span>
            {canEdit && (
              <button
                onClick={toggleStatus}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  editing.status === "published"
                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {editing.status === "published" ? "✓ Publié" : "Brouillon"}
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setShowRes(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 font-medium transition-colors"
              >
                + Ressource
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Session info */}
          {editing.session_date && (
            <p className="text-xs text-gray-400 mb-4">Séance du {fmtDate(editing.session_date)}</p>
          )}

          {/* Rich editor */}
          <RichEditor
            content={editorContent}
            onChange={canEdit ? handleContentChange : undefined}
            readOnly={!canEdit}
            placeholder="Écrivez le contenu du cours ici — titres, texte, listes, code..."
          />

          {/* Resources */}
          {(editing.course_resources.length > 0 || canEdit) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ressources</h3>
                {canEdit && editing.course_resources.length === 0 && (
                  <button onClick={() => setShowRes(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    + Ajouter une ressource
                  </button>
                )}
              </div>
              {editing.course_resources.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {editing.course_resources
                    .sort((a, b) => a.position - b.position)
                    .map(r => (
                      <ResourceCard key={r.id} r={r} canEdit={canEdit} onDelete={() => deleteResource(r.id)} />
                    ))
                  }
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucune ressource ajoutée.</p>
              )}
            </div>
          )}
        </div>

        {/* Add Resource modal */}
        {showRes && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white">Ajouter une ressource</h2>
                <button onClick={() => { setShowRes(false); setResForm({ type: "youtube", title: "", url: "" }); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {(["file", "drive", "youtube", "link"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setResForm(prev => ({ ...prev, type: t, url: "" }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                      resForm.type === t
                        ? "border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:border-brand-600 dark:text-brand-400"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <span className="text-xl">{t === "file" ? "📤" : t === "drive" ? "🔷" : t === "youtube" ? "▶️" : "🔗"}</span>
                    {t === "file" ? "Fichier" : t === "drive" ? "Drive" : t === "youtube" ? "YouTube" : "Lien"}
                  </button>
                ))}
              </div>

              <form onSubmit={addResource} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Titre (optionnel)</label>
                  <input
                    value={resForm.title ?? ""}
                    onChange={e => setResForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex : Fiche de cours, Exercices..."
                    className={inp}
                  />
                </div>

                {/* File upload */}
                {resForm.type === "file" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fichier</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleResourceFileUpload(f); }}
                    />
                    <div
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                        resDragOver ? "border-brand-400 bg-brand-50 dark:bg-brand-900/10" : "border-gray-300 dark:border-gray-600 hover:border-brand-300"
                      }`}
                      onDragOver={e => { e.preventDefault(); setResDragOver(true); }}
                      onDragLeave={() => setResDragOver(false)}
                      onDrop={e => { e.preventDefault(); setResDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleResourceFileUpload(f); }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {resUploading ? (
                        <div className="py-3">
                          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Upload en cours...</p>
                        </div>
                      ) : resForm.url ? (
                        <div className="py-2">
                          <FilePreview url={resForm.url} title={resForm.title || null} />
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">✓ Fichier uploadé avec succès</p>
                          <p className="text-xs text-gray-400 mt-0.5">Cliquer pour remplacer</p>
                        </div>
                      ) : (
                        <div className="py-4">
                          <svg viewBox="0 0 24 24" className="w-9 h-9 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <p className="text-sm text-gray-500">Glisser-déposer ou cliquer</p>
                          <p className="text-xs text-gray-400 mt-1">
                            PDF · Word · Excel · PowerPoint · Images · Tous formats
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {resForm.type === "drive" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Lien Google Drive *</label>
                    <input
                      value={resForm.url ?? ""}
                      onChange={e => setResForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://drive.google.com/file/d/.../view"
                      className={inp}
                    />
                    {resForm.url && getDriveId(resForm.url) && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative" style={{ paddingBottom: "60%", height: 0 }}>
                        <iframe src={`https://drive.google.com/file/d/${getDriveId(resForm.url)}/preview`}
                          className="absolute inset-0 w-full h-full" title="Drive preview" />
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">Partagez en mode "Tout le monde avec le lien"</p>
                  </div>
                )}

                {resForm.type === "youtube" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Lien YouTube *</label>
                    <input
                      value={resForm.url ?? ""}
                      onChange={e => setResForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://youtu.be/... ou https://youtube.com/watch?v=..."
                      className={inp}
                    />
                    {resForm.url && getYoutubeId(resForm.url) && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative" style={{ paddingBottom: "56.25%", height: 0 }}>
                        <iframe src={`https://www.youtube-nocookie.com/embed/${getYoutubeId(resForm.url)}`}
                          className="absolute inset-0 w-full h-full" allowFullScreen title="YouTube preview" />
                      </div>
                    )}
                  </div>
                )}

                {resForm.type === "link" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL du lien *</label>
                    <input
                      value={resForm.url ?? ""}
                      onChange={e => setResForm(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                      className={inp}
                      type="url"
                    />
                    {resForm.url && (
                      <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 flex items-center gap-2 bg-gray-50 dark:bg-gray-800">
                        <span className="text-lg shrink-0">🔗</span>
                        <a href={resForm.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-500 hover:underline truncate flex-1">{resForm.url}</a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowRes(false); setResForm({ type: "youtube", title: "", url: "" }); }}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                    Annuler
                  </button>
                  <button type="submit" disabled={resLoading || resUploading || !resForm.url}
                    className="flex-1 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
                    {resLoading ? "Ajout..." : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestion des Cours</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {role === "etudiant" ? "Contenus publiés par vos professeurs" : "Créez et gérez le contenu des cours par matière"}
          </p>
        </div>
        {canEdit && selSubject && selClass && (
          <button
            onClick={() => { setNewError(""); setShowNew(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau cours
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Matière</label>
          <select value={selSubject} onChange={e => setSelSubject(e.target.value)} className={inp}>
            <option value="">— Sélectionner une matière —</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Classe</label>
          {role === "etudiant" ? (
            <div className={`${inp} bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 cursor-default flex items-center gap-2`}>
              <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
              {classes[0]?.name ?? "Aucune classe assignée"}
            </div>
          ) : (
            <select value={selClass} onChange={e => setSelClass(e.target.value)} className={inp}>
              <option value="">— Sélectionner une classe —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {!selSubject || !selClass ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sélectionnez une matière et une classe pour voir les cours</p>
        </div>
      ) : listLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-400 text-sm">Aucun cours pour cette sélection.</p>
          {canEdit && (
            <button onClick={() => setShowNew(true)} className="mt-4 text-sm text-brand-500 hover:underline">
              + Créer le premier cours
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([chapter, items]) => (
            <div key={chapter}>
              {/* Chapter header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-brand-500" />
                  <h2 className="font-semibold text-gray-800 dark:text-white text-sm">{chapter}</h2>
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">{items.length} séance{items.length > 1 ? "s" : ""}</span>
              </div>

              {/* Course cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(course => (
                  <div
                    key={course.id}
                    onClick={() => openEditor(course)}
                    className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Status badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-gray-800 dark:text-white text-sm leading-snug flex-1">{course.title}</h3>
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        course.status === "published"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {course.status === "published" ? "Publié" : "Brouillon"}
                      </span>
                    </div>
                    {course.session_date && (
                      <p className="text-xs text-gray-400 mb-2">📅 {fmtDate(course.session_date)}</p>
                    )}
                    {course.teachers && (
                      <p className="text-xs text-gray-400">👤 {course.teachers.first_name} {course.teachers.last_name}</p>
                    )}
                    {course.course_resources.length > 0 && (
                      <p className="text-xs text-blue-500 mt-2">📎 {course.course_resources.length} ressource{course.course_resources.length > 1 ? "s" : ""}</p>
                    )}
                    {/* Delete button */}
                    {canEdit && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteCourse(course.id); }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-all"
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New course modal */}
      {showNew && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">Nouveau cours</h2>
              <button onClick={() => { setShowNew(false); setDaySlots([]); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {newError && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{newError}</div>}
            <form onSubmit={handleCreate} className="space-y-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Titre du cours *</label>
                <input value={newForm.title} onChange={e => setNewForm({ ...newForm, title: e.target.value })} placeholder="Ex : Introduction aux algorithmes" className={inp} required />
              </div>

              {/* Chapter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Chapitre (optionnel)</label>
                <input value={newForm.chapter_title} onChange={e => setNewForm({ ...newForm, chapter_title: e.target.value })} placeholder="Ex : Chapitre 1 — Bases de l'algorithmique" className={inp} />
              </div>

              {/* Admin only: professor picker */}
              {role === "admin" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Professeur</label>
                  <select value={newForm.teacher_id} onChange={e => setNewForm({ ...newForm, teacher_id: e.target.value })} className={inp}>
                    <option value="">— Sélectionner (optionnel) —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>
              )}

              {/* Calendar-based slot picker */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Séance du calendrier <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>

                {/* Date picker */}
                <input
                  type="date"
                  value={newForm.session_date}
                  onChange={e => {
                    const date = e.target.value;
                    setNewForm({ ...newForm, session_date: date, slot_id: "" });
                    loadDaySlots(date, selClass);
                  }}
                  className={inp}
                />

                {/* Slots for selected date */}
                {newForm.session_date && (
                  <div className="mt-2">
                    {dayLoading ? (
                      <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                        <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Chargement des séances...
                      </div>
                    ) : daySlots.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">Aucune séance planifiée ce jour-là.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {daySlots.map(slot => {
                          const isSelected = newForm.slot_id === slot.id;
                          const matchesSubject = !selSubject || slot.subjects?.id === selSubject;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setNewForm(f => ({ ...f, slot_id: isSelected ? "" : slot.id }))}
                              className={`text-left rounded-xl border-2 px-3 py-2.5 transition-all ${
                                isSelected
                                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                                  : matchesSubject
                                    ? "border-gray-200 dark:border-gray-700 hover:border-brand-300 bg-white dark:bg-gray-800"
                                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 opacity-60"
                              }`}
                            >
                              <p className="text-xs font-semibold text-gray-800 dark:text-white">
                                {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {slot.subjects?.name ?? "—"}
                              </p>
                              {slot.teachers && (
                                <p className="text-xs text-gray-400 truncate">
                                  {slot.teachers.first_name} {slot.teachers.last_name}
                                </p>
                              )}
                              {isSelected && (
                                <span className="inline-block mt-1 text-[10px] font-medium text-brand-600 dark:text-brand-400">✓ Sélectionné</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowNew(false); setDaySlots([]); }} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Annuler</button>
                <button type="submit" disabled={newLoading} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
                  {newLoading ? "Création..." : "Créer et ouvrir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
