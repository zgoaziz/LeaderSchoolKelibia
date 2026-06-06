"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, School, BookOpen, CalendarDays, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

interface ProfStats {
  teacher: { id: string; first_name: string; last_name: string } | null;
  email?: string;
  totalClasses: number;
  totalStudents: number;
  studentsByClass: { className: string; count: number }[];
  subjects: { id: string; name: string }[];
  totalSlots: number;
  absencePending: number;
  absenceTotal: number;
}

function Skeleton() {
  return <div className="animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700 h-28 w-full" />;
}

function KpiCard({ icon, value, label, sub, badge, href, color }: {
  icon: React.ReactNode; value: string | number; label: string;
  sub?: string; badge?: number; href?: string; color: string;
}) {
  const inner = (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative overflow-hidden">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} text-white`}>{icon}</div>
        {badge != null && badge > 0 && (
          <span className="text-[11px] font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">{badge}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {href && <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function ProfDashboard() {
  const [data, setData] = useState<ProfStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/prof-stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>Impossible de charger vos statistiques</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array(2).fill(0).map((_, i) => <Skeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile not linked notice */}
      {!data.teacher && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Profil non lié</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              {data.email ? (<>Votre compte (<strong>{data.email}</strong>) n&apos;est associé à aucun profil professeur.</>) : "Votre compte n'est associé à aucun profil professeur."}{" "}
              Demandez à l&apos;administrateur d&apos;utiliser cet email lors de la création de votre profil dans la section Professeurs.
            </p>
          </div>
        </div>
      )}
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#465fff] to-violet-500 rounded-2xl p-5 text-white">
        <p className="text-sm font-medium opacity-80">Bienvenue,</p>
        <p className="text-2xl font-bold mt-0.5">
          {data.teacher ? `${data.teacher.first_name} ${data.teacher.last_name}` : (data.email ?? "Professeur")}
        </p>
        <p className="text-sm opacity-70 mt-1">Tableau de bord — Espace Professeur</p>
      </div>

      {/* Absence alert */}
      {data.absencePending > 0 && (
        <Link href="/dashboard/absences">
          <div className="flex items-center gap-2 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2.5 text-sm font-medium text-yellow-700 dark:text-yellow-400 hover:opacity-80 transition-opacity">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{data.absencePending} demande(s) d'absence en attente de validation</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </div>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<School className="w-5 h-5" />} value={data.totalClasses} label="Mes classes" href="/dashboard/classes" color="bg-teal-500" />
        <KpiCard icon={<Users className="w-5 h-5" />} value={data.totalStudents} label="Mes étudiants" href="/dashboard/students" color="bg-[#465fff]" />
        <KpiCard icon={<BookOpen className="w-5 h-5" />} value={data.subjects.length} label="Mes matières" href="/dashboard/subjects" color="bg-violet-500" />
        <KpiCard icon={<CalendarDays className="w-5 h-5" />} value={data.totalSlots} label="Créneaux" sub="dans mes classes" href="/dashboard/schedule" color="bg-orange-500" />
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Students per class */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Étudiants par classe</h3>
            <Link href="/dashboard/students" className="text-xs text-[#465fff] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data.studentsByClass.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune classe assignée</p>
            ) : data.studentsByClass.map((c) => (
              <div key={c.className} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                  <School className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{c.className}</p>
                </div>
                <span className="text-sm font-bold text-[#465fff]">{c.count}</span>
                <span className="text-xs text-gray-400">étudiant(s)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mes matières</h3>
            <Link href="/dashboard/subjects" className="text-xs text-[#465fff] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data.subjects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune matière assignée</p>
            ) : data.subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Accès rapide</p>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/dashboard/students",  label: "Mes étudiants",    icon: <Users className="w-4 h-4" /> },
            { href: "/dashboard/schedule",   label: "Emploi du temps",  icon: <CalendarDays className="w-4 h-4" /> },
            { href: "/dashboard/subjects",   label: "Mes matières",     icon: <BookOpen className="w-4 h-4" /> },
            { href: "/dashboard/absences",   label: "Absences",         icon: <UserCheck className="w-4 h-4" /> },
            { href: "/dashboard/courses",    label: "Mes cours",        icon: <BookOpen className="w-4 h-4" /> },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-[#465fff]/10 hover:text-[#465fff] dark:hover:bg-[#465fff]/20 dark:hover:text-[#465fff] transition-colors">
              {icon} {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
