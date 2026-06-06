"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/editor/RichEditor"), { ssr: false });

type Resource = {
  id: string; type: "youtube" | "drive" | "link";
  title: string | null; url: string; position: number;
};

type CourseSession = {
  id: string;
  session_date: string | null;
  title: string;
  chapter_title: string | null;
  content: object | null;
  status: "draft" | "published";
  created_at: string;
  subjects: { id: string; name: string } | null;
  classes:  { id: string; name: string } | null;
  teachers: { id: string; first_name: string; last_name: string } | null;
  course_resources: Resource[];
};

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const fmtDate = (s: string | null) =>
  s ? new Date(s + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;

export default function ClassroomView({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [courses, setCourses]     = useState<CourseSession[]>([]);
  const [loading, setLoading]     = useState(true);
  const [subjectName, setSubjectName] = useState("");
  const [openId, setOpenId]       = useState<string | null>(null);
  const [classes, setClasses]     = useState<{ id: string; name: string }[]>([]);
  const [selClass, setSelClass]   = useState("");

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : []));
    fetch("/api/subjects").then(r => r.json()).then((d: { id: string; name: string }[]) => {
      if (Array.isArray(d)) {
        const found = d.find(s => s.id === subjectId);
        setSubjectName(found?.name ?? "Matière");
      }
    });
  }, [subjectId]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ subject_id: subjectId, status: "published" });
    if (selClass) params.set("class_id", selClass);
    fetch(`/api/courses?${params}`)
      .then(r => r.json())
      .then(d => { setCourses(Array.isArray(d) ? d : []); setLoading(false); });
  }, [subjectId, selClass]);

  const grouped = courses.reduce<Record<string, CourseSession[]>>((acc, c) => {
    const key = c.chapter_title ?? "Séances";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white mb-3 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Classroom</p>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{subjectName}</h1>
            </div>
            {classes.length > 0 && (
              <select
                value={selClass}
                onChange={e => setSelClass(e.target.value)}
                className="w-full sm:w-48 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-800 dark:text-white"
              >
                <option value="">Toutes les classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun contenu publié pour cette matière.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([chapter, items]) => (
              <div key={chapter}>
                {/* Chapter header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full bg-brand-500" />
                    <h2 className="font-bold text-gray-800 dark:text-white">{chapter}</h2>
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">{items.length} cours</span>
                </div>

                {/* Sessions in this chapter */}
                <div className="space-y-3">
                  {items.map(course => (
                    <div key={course.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Collapse header */}
                      <button
                        onClick={() => setOpenId(openId === course.id ? null : course.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className={`shrink-0 text-gray-400 transition-transform ${openId === course.id ? "rotate-90" : ""}`}
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{course.title}</p>
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            {course.session_date && (
                              <span className="text-xs text-gray-400">📅 {fmtDate(course.session_date)}</span>
                            )}
                            {course.teachers && (
                              <span className="text-xs text-gray-400">👤 {course.teachers.first_name} {course.teachers.last_name}</span>
                            )}
                            {course.classes && (
                              <span className="text-xs text-gray-400">🏫 {course.classes.name}</span>
                            )}
                          </div>
                        </div>
                        {course.course_resources.length > 0 && (
                          <span className="shrink-0 text-xs text-blue-500 font-medium">
                            📎 {course.course_resources.length}
                          </span>
                        )}
                      </button>

                      {/* Expanded content */}
                      {openId === course.id && (
                        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
                          {course.content ? (
                            <RichEditor content={course.content} readOnly />
                          ) : (
                            <p className="text-sm text-gray-400 italic">Pas encore de contenu rédigé.</p>
                          )}

                          {/* Resources */}
                          {course.course_resources.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ressources</h4>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {course.course_resources
                                  .sort((a, b) => a.position - b.position)
                                  .map(r => {
                                    const ytId = r.type === "youtube" ? getYoutubeId(r.url) : null;
                                    return (
                                      <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        {ytId && (
                                          <div className="aspect-video bg-black">
                                            <iframe
                                              className="w-full h-full"
                                              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              allowFullScreen
                                            />
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 px-3 py-2">
                                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                            r.type === "youtube" ? "bg-red-100 text-red-600" :
                                            r.type === "drive"   ? "bg-blue-100 text-blue-600" :
                                            "bg-gray-100 text-gray-600"
                                          }`}>
                                            {r.type === "youtube" ? "▶ YouTube" : r.type === "drive" ? "☁ Drive" : "🔗 Lien"}
                                          </span>
                                          <a href={r.url} target="_blank" rel="noreferrer" className="flex-1 text-sm text-blue-600 dark:text-blue-400 underline truncate">
                                            {r.title ?? r.url}
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
