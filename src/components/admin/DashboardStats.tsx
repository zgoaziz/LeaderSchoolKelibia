"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import Link from "next/link";
import {
  Users, GraduationCap, BookOpen, CalendarDays, FileText,
  Image, Star, ClipboardList, CreditCard, Award,
  TrendingUp, AlertCircle, CheckCircle2, Clock, XCircle,
  ArrowRight, School,
} from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ─── Types ─── */
interface StatsData {
  students: number; classes: number; teachers: number; subjects: number;
  slots: number; overridesAbsent: number; courses: number;
  formations: number; galleryCount: number;
  testimonialsTotal: number; testimonialsPending: number;
  enrollmentsTotal: number; enrollmentsPending: number;
  paymentsLate: number; paymentsPending: number;
  certificatesIssued: number; certificatesDraft: number;
  absenceRequestsPending: number;
  totalRevenue: number; pendingRevenue: number; lateRevenue: number;
  monthLabels: string[];
  monthlyEnrollments: number[];
  monthlyRevenue: number[];
  studentsByClass: [string, number][];
  paymentStatusCounts: number[];
  recentEnrollments: RecentEnrollment[];
  recentPayments: RecentPayment[];
}
interface RecentEnrollment {
  id: string; first_name: string; last_name: string;
  formation_name: string; status: string; created_at: string;
}
interface RecentPayment {
  id: string; student_name: string; amount: number;
  type: string; status: string; created_at: string;
}

/* ─── Helpers ─── */
const fmtDT = (n: number) => `${(n ?? 0).toLocaleString("fr-TN")} DT`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const ENROLL_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente",  cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmed: { label: "Confirmé",    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Annulé",      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  completed: { label: "Terminé",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};
const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  paid:      { label: "Payé",        cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pending:   { label: "En attente",  cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  late:      { label: "En retard",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  cancelled: { label: "Annulé",      cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
};

/* ─── Sub-components ─── */
function Skeleton({ h = "h-4", w = "w-full" }: { h?: string; w?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${h} ${w}`} />;
}

function KpiCard({
  icon, value, label, sub, badge, href, color,
}: {
  icon: React.ReactNode; value: string | number; label: string;
  sub?: string; badge?: number; href?: string; color: string;
}) {
  const inner = (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative overflow-hidden">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} text-white`}>
          {icon}
        </div>
        {badge != null && badge > 0 && (
          <span className="text-[11px] font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      {href && (
        <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function AlertBanner({ type, message, href }: { type: "error" | "warning"; message: string; href: string }) {
  const cls = type === "error"
    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
    : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400";
  return (
    <Link href={href}>
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity ${cls}`}>
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{message}</span>
        <ArrowRight className="w-4 h-4 ml-auto" />
      </div>
    </Link>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
      {children}
    </h2>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array(6).fill(0).map((_, i) => <Skeleton key={i} h="h-28" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {Array(2).fill(0).map((_, i) => <Skeleton key={i} h="h-64" />)}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} h="h-72" />)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardStats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>Impossible de charger les statistiques</span>
      </div>
    );
  }

  if (!data) return <LoadingSkeleton />;

  /* ─── ApexCharts configs ─── */
  const chartBase: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
    tooltip: { theme: "light" },
    dataLabels: { enabled: false },
  };

  const barOpts: ApexOptions = {
    ...chartBase,
    chart: { ...chartBase.chart, type: "bar" },
    colors: ["#465fff"],
    plotOptions: { bar: { borderRadius: 5, columnWidth: "55%" } },
    xaxis: {
      categories: data.monthLabels,
      labels: { style: { fontSize: "11px", colors: "#9ca3af" } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: "11px", colors: "#9ca3af" } } },
  };

  const areaOpts: ApexOptions = {
    ...chartBase,
    chart: { ...chartBase.chart, type: "area" },
    colors: ["#10b981"],
    fill: { type: "gradient", gradient: { shadeIntensity: 0.3, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] } },
    stroke: { curve: "smooth", width: 2 },
    xaxis: {
      categories: data.monthLabels,
      labels: { style: { fontSize: "11px", colors: "#9ca3af" } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: "11px", colors: "#9ca3af" }, formatter: (v) => `${v.toFixed(0)} DT` } },
  };

  const donutPayOpts: ApexOptions = {
    ...chartBase,
    chart: { ...chartBase.chart, type: "donut" },
    colors: ["#10b981", "#f59e0b", "#ef4444", "#9ca3af"],
    labels: ["Payé", "En attente", "En retard", "Annulé"],
    legend: { position: "bottom", fontSize: "12px" },
    plotOptions: { pie: { donut: { size: "65%" } } },
  };

  const classLabels = data.studentsByClass.map(([k]) => k);
  const classValues = data.studentsByClass.map(([, v]) => v);
  const donutClassOpts: ApexOptions = {
    ...chartBase,
    chart: { ...chartBase.chart, type: "donut" },
    colors: ["#465fff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"],
    labels: classLabels,
    legend: { position: "bottom", fontSize: "11px" },
    plotOptions: { pie: { donut: { size: "60%" } } },
  };

  const totalActive = data.students + data.teachers;
  const studentPct = totalActive > 0 ? Math.round((data.students / totalActive) * 100) : 0;
  const teacherPct = totalActive > 0 ? Math.round((data.teachers / totalActive) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ── Alert banners ── */}
      {(data.enrollmentsPending > 0 || data.paymentsPending > 0 || data.paymentsLate > 0 ||
        data.testimonialsPending > 0 || data.absenceRequestsPending > 0) && (
        <div className="grid sm:grid-cols-2 gap-2">
          {data.paymentsLate > 0 && <AlertBanner type="error" href="/dashboard/payments" message={`${data.paymentsLate} paiement(s) en retard`} />}
          {data.enrollmentsPending > 0 && <AlertBanner type="warning" href="/dashboard/enrollments" message={`${data.enrollmentsPending} inscription(s) en attente de validation`} />}
          {data.paymentsPending > 0 && <AlertBanner type="warning" href="/dashboard/payments" message={`${data.paymentsPending} paiement(s) en attente`} />}
          {data.testimonialsPending > 0 && <AlertBanner type="warning" href="/dashboard/testimonials" message={`${data.testimonialsPending} témoignage(s) à modérer`} />}
          {data.absenceRequestsPending > 0 && <AlertBanner type="warning" href="/dashboard/absences" message={`${data.absenceRequestsPending} demande(s) d'absence en attente`} />}
        </div>
      )}

      {/* ── KPI: École ── */}
      <div>
        <SLabel>École</SLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={<GraduationCap className="w-5 h-5" />} value={data.students} label="Étudiants" href="/dashboard/students" color="bg-[#465fff]" />
          <KpiCard icon={<School className="w-5 h-5" />} value={data.classes} label="Classes" href="/dashboard/classes" color="bg-teal-500" />
          <KpiCard icon={<Users className="w-5 h-5" />} value={data.teachers} label="Professeurs" href="/dashboard/teachers" color="bg-violet-500" />
          <KpiCard icon={<BookOpen className="w-5 h-5" />} value={data.subjects} label="Matières" href="/dashboard/subjects" color="bg-sky-500" />
          <KpiCard icon={<CalendarDays className="w-5 h-5" />} value={data.slots} label="Créneaux" href="/dashboard/schedule" color="bg-orange-500" />
          <KpiCard icon={<FileText className="w-5 h-5" />} value={data.courses} label="Cours" href="/dashboard/courses" color="bg-pink-500" />
        </div>
      </div>

      {/* ── KPI: Finances ── */}
      <div>
        <SLabel>Finances</SLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard icon={<CreditCard className="w-5 h-5" />} value={fmtDT(data.totalRevenue)} label="Revenus collectés" sub="Paiements confirmés" href="/dashboard/payments" color="bg-green-500" />
          <KpiCard icon={<Clock className="w-5 h-5" />} value={fmtDT(data.pendingRevenue)} label="En attente" badge={data.paymentsPending} href="/dashboard/payments" color="bg-yellow-500" />
          <KpiCard icon={<AlertCircle className="w-5 h-5" />} value={fmtDT(data.lateRevenue)} label="En retard" badge={data.paymentsLate} href="/dashboard/payments" color="bg-red-500" />
        </div>
      </div>

      {/* ── KPI: Site public ── */}
      <div>
        <SLabel>Site public &amp; inscriptions</SLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard icon={<ClipboardList className="w-5 h-5" />} value={data.enrollmentsTotal} label="Inscriptions" badge={data.enrollmentsPending} href="/dashboard/enrollments" color="bg-[#465fff]" />
          <KpiCard icon={<Award className="w-5 h-5" />} value={data.certificatesIssued} label="Certificats émis" sub={`${data.certificatesDraft} brouillons`} href="/dashboard/certificates" color="bg-amber-500" />
          <KpiCard icon={<Star className="w-5 h-5" />} value={data.testimonialsTotal} label="Témoignages" badge={data.testimonialsPending} href="/dashboard/testimonials" color="bg-pink-500" />
          <KpiCard icon={<Image className="w-5 h-5" />} value={data.galleryCount} label="Galerie publiée" href="/dashboard/gallery" color="bg-teal-500" />
        </div>
      </div>

      {/* ── Charts: trends ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Inscriptions par mois (12 derniers mois)">
          <ReactApexChart
            type="bar"
            options={barOpts}
            series={[{ name: "Inscriptions", data: data.monthlyEnrollments }]}
            height={230}
          />
        </ChartCard>

        <ChartCard title="Revenus collectés par mois (DT)">
          <ReactApexChart
            type="area"
            options={areaOpts}
            series={[{ name: "Revenus (DT)", data: data.monthlyRevenue }]}
            height={230}
          />
        </ChartCard>
      </div>

      {/* ── Charts: breakdowns + active accounts ── */}
      <div className="grid md:grid-cols-3 gap-4">
        <ChartCard title="Statut des paiements">
          {data.paymentStatusCounts.some(Boolean) ? (
            <ReactApexChart type="donut" options={donutPayOpts} series={data.paymentStatusCounts} height={260} />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Aucune donnée</div>
          )}
        </ChartCard>

        <ChartCard title="Étudiants par classe">
          {classValues.length > 0 ? (
            <ReactApexChart type="donut" options={donutClassOpts} series={classValues} height={260} />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Aucune donnée</div>
          )}
        </ChartCard>

        {/* Active accounts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-5">Comptes actifs</h3>
          <div className="space-y-4">
            {[
              { label: "Étudiants", value: data.students, pct: studentPct, color: "bg-[#465fff]", icon: <GraduationCap className="w-4 h-4 text-[#465fff]" /> },
              { label: "Professeurs", value: data.teachers, pct: teacherPct, color: "bg-violet-500", icon: <Users className="w-4 h-4 text-violet-500" /> },
              { label: "Formations pub.", value: data.formations, pct: Math.min(100, data.formations * 10), color: "bg-teal-500", icon: <BookOpen className="w-4 h-4 text-teal-500" /> },
              { label: "Certificats émis", value: data.certificatesIssued, pct: Math.min(100, data.certificatesIssued * 5), color: "bg-amber-500", icon: <Award className="w-4 h-4 text-amber-500" /> },
            ].map(({ label, value, pct, color, icon }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">{icon} {label}</span>
                  <span className="font-bold text-gray-800 dark:text-white">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-400">
              <span>Total étudiants + profs</span>
              <span className="font-semibold text-gray-600 dark:text-gray-300">{totalActive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent data tables ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Dernières inscriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Dernières inscriptions</h3>
            <Link href="/dashboard/enrollments" className="text-xs text-[#465fff] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data.recentEnrollments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune inscription</p>
            ) : data.recentEnrollments.map((e) => {
              const st = ENROLL_STATUS[e.status] ?? ENROLL_STATUS.pending;
              return (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#465fff]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#465fff]">
                      {(e.first_name?.[0] ?? "?").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {e.first_name} {e.last_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{e.formation_name ?? "—"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    <span className="text-[11px] text-gray-400">{fmtDate(e.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Derniers paiements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Derniers paiements</h3>
            <Link href="/dashboard/payments" className="text-xs text-[#465fff] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun paiement</p>
            ) : data.recentPayments.map((p) => {
              const st = PAY_STATUS[p.status] ?? PAY_STATUS.pending;
              const Icon = p.status === "paid" ? CheckCircle2 : p.status === "late" ? XCircle : Clock;
              const iconCls = p.status === "paid" ? "text-green-600" : p.status === "late" ? "text-red-500" : "text-yellow-600";
              const bgCls = p.status === "paid" ? "bg-green-100 dark:bg-green-900/20" : p.status === "late" ? "bg-red-100 dark:bg-red-900/20" : "bg-yellow-100 dark:bg-yellow-900/20";
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgCls}`}>
                    <Icon className={`w-4 h-4 ${iconCls}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {p.student_name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{p.type ?? "Paiement"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{fmtDT(p.amount)}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <SLabel>Accès rapide</SLabel>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/dashboard/students",     label: "Étudiants",       icon: <GraduationCap className="w-4 h-4" /> },
            { href: "/dashboard/classes",       label: "Classes",         icon: <School className="w-4 h-4" /> },
            { href: "/dashboard/teachers",      label: "Professeurs",     icon: <Users className="w-4 h-4" /> },
            { href: "/dashboard/subjects",      label: "Matières",        icon: <BookOpen className="w-4 h-4" /> },
            { href: "/dashboard/schedule",      label: "Emploi du temps", icon: <CalendarDays className="w-4 h-4" /> },
            { href: "/dashboard/enrollments",   label: "Inscriptions",    icon: <ClipboardList className="w-4 h-4" /> },
            { href: "/dashboard/payments",      label: "Paiements",       icon: <CreditCard className="w-4 h-4" /> },
            { href: "/dashboard/certificates",  label: "Certificats",     icon: <Award className="w-4 h-4" /> },
            { href: "/dashboard/formations",    label: "Formations",      icon: <TrendingUp className="w-4 h-4" /> },
            { href: "/dashboard/gallery",       label: "Galerie",         icon: <Image className="w-4 h-4" /> },
            { href: "/dashboard/testimonials",  label: "Témoignages",     icon: <Star className="w-4 h-4" /> },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-[#465fff]/10 hover:text-[#465fff] dark:hover:bg-[#465fff]/20 dark:hover:text-[#465fff] transition-colors"
            >
              {icon} {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
