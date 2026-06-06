"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, AlertCircle, School, XCircle } from "lucide-react";

interface StudentStats {
  student: { first_name: string; last_name: string } | null;
  email?: string | null;
  className: string | null;
  totalSlots: number;
  cancelledSlots: number;
  subjects: { id: string; name: string }[];
}

function Skeleton() {
  return <div className="animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700 h-28 w-full" />;
}

function KpiCard({ icon, value, label, sub, color }: {
  icon: React.ReactNode; value: string | number; label: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} text-white mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/student-stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>Impossible de charger vos informations</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} />)}
        </div>
        <Skeleton />
      </div>
    );
  }

  const presenceRate = data.totalSlots > 0
    ? Math.round(((data.totalSlots - data.cancelledSlots) / data.totalSlots) * 100)
    : 100;

  return (
    <div className="space-y-6">

      {/* Profile not linked notice */}
      {!data.student && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Profil non lié</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              {data.email
                ? <>Votre compte (<strong>{data.email}</strong>) n&apos;est associé à aucun profil étudiant.</>
                : "Votre compte n'est associé à aucun profil étudiant."
              }{" "}
              Demandez à l&apos;administrateur de vous ajouter dans la section Étudiants avec cet email.
            </p>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-teal-500 to-brand-500 rounded-2xl p-5 text-white">
        <p className="text-sm font-medium opacity-80">Bienvenue,</p>
        <p className="text-2xl font-bold mt-0.5">
          {data.student
            ? `${data.student.first_name} ${data.student.last_name}`
            : (data.email ?? "Étudiant")}
        </p>
        {data.className && (
          <p className="text-sm opacity-70 mt-1">Classe : {data.className}</p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard
          icon={<School className="w-5 h-5" />}
          value={data.className ?? "—"}
          label="Ma classe"
          color="bg-teal-500"
        />
        <KpiCard
          icon={<CalendarDays className="w-5 h-5" />}
          value={data.totalSlots}
          label="Séances"
          sub="créneaux programmés"
          color="bg-brand-500"
        />
        <KpiCard
          icon={<BookOpen className="w-5 h-5" />}
          value={data.subjects.length}
          label="Matières"
          sub="enseignées dans ma classe"
          color="bg-violet-500"
        />
      </div>

      {/* Attendance + Subjects */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Attendance card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Présence & Séances</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 dark:text-gray-300">Séances effectives</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {Math.max(0, data.totalSlots - data.cancelledSlots)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${presenceRate}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{presenceRate}%</p>
                <p className="text-xs text-teal-700 dark:text-teal-500 mt-0.5">Taux de présence</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-red-500 dark:text-red-400 flex items-center justify-center gap-1">
                  <XCircle className="w-4 h-4" /> {data.cancelledSlots}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Séances annulées</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects list */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mes matières</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data.subjects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune matière enregistrée</p>
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
            { href: "/dashboard/schedule", label: "Emploi du temps", icon: <CalendarDays className="w-4 h-4" /> },
            { href: "/dashboard/courses",  label: "Mes cours",        icon: <BookOpen className="w-4 h-4" /> },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-brand-500/10 hover:text-brand-500 dark:hover:bg-brand-500/20 dark:hover:text-brand-500 transition-colors">
              {icon} {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
