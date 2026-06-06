import { createClient } from "@supabase/supabase-js";
import { createClient as authClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

function buildMonthlyBuckets(rows: { created_at: string }[], valueKey?: string): number[] {
  const now = new Date();
  const buckets = Array(12).fill(0);
  for (const row of rows) {
    const d = new Date(row.created_at);
    const monthsAgo =
      (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo >= 0 && monthsAgo < 12) {
      const idx = 11 - monthsAgo;
      buckets[idx] += valueKey ? Number((row as Record<string, unknown>)[valueKey] ?? 0) : 1;
    }
  }
  return buckets;
}

function last12MonthLabels(): string[] {
  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return months[d.getMonth()];
  });
}

export async function GET() {
  const supabase = await authClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const since = twelveMonthsAgo.toISOString();

  const count = async (table: string, filters?: Record<string, string>) => {
    let q = db().from(table).select("*", { count: "exact", head: true });
    if (filters) for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [
    students, classes, teachers, subjects, slots,
    overridesAbsent, courses, formations, galleryCount,
    testimonialsTotal, testimonialsPending,
    enrollmentsTotal, enrollmentsPending,
    paymentsLate, paymentsPending,
    certificatesIssued, certificatesDraft,
    absenceRequestsPending,
    enrollmentsRecent,
    paymentsRecent,
    enrollmentsMonthly,
    paymentsMonthly,
    studentsAllClasses,
    paymentsAll,
  ] = await Promise.all([
    count("students"),
    count("classes"),
    count("teachers"),
    count("subjects"),
    count("schedule_slots"),
    count("schedule_overrides", { type: "absent" }),
    count("course_sessions"),
    count("formations"),
    count("gallery_items", { published: "true" }),
    count("testimonials"),
    count("testimonials", { status: "pending" }),
    count("enrollments"),
    count("enrollments", { status: "pending" }),
    count("payments", { status: "late" }),
    count("payments", { status: "pending" }),
    count("certificates", { status: "issued" }),
    count("certificates", { status: "draft" }),
    count("teacher_absence_requests", { status: "pending" }),

    // Recent data
    db().from("enrollments")
      .select("id, first_name, last_name, formation_name, status, created_at")
      .order("created_at", { ascending: false }).limit(7),

    db().from("payments")
      .select("id, student_name, amount, type, status, created_at")
      .order("created_at", { ascending: false }).limit(7),

    // Monthly trends
    db().from("enrollments")
      .select("created_at")
      .gte("created_at", since),

    db().from("payments")
      .select("created_at, amount, status")
      .eq("status", "paid")
      .gte("created_at", since),

    // Students by class
    db().from("students")
      .select("class_id, classes(name)"),

    // Payments by status
    db().from("payments")
      .select("status, amount"),
  ]);

  // Process monthly enrollments
  const monthlyEnrollments = buildMonthlyBuckets(enrollmentsMonthly.data ?? []);

  // Process monthly payments collected
  const monthlyRevenue = buildMonthlyBuckets(paymentsMonthly.data ?? [], "amount");

  // Students by class
  const classCounts: Record<string, number> = {};
  for (const s of (studentsAllClasses.data ?? [])) {
    const cls = s.classes as unknown as { name: string } | null;
    const name = cls?.name ?? "Sans classe";
    classCounts[name] = (classCounts[name] ?? 0) + 1;
  }
  const studentsByClass = Object.entries(classCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Payment status breakdown
  const statusTotals: Record<string, { count: number; amount: number }> = {
    paid: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    late: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
  };
  for (const p of (paymentsAll.data ?? [])) {
    const st = p.status as string;
    if (!statusTotals[st]) statusTotals[st] = { count: 0, amount: 0 };
    statusTotals[st].count++;
    statusTotals[st].amount += Number(p.amount ?? 0);
  }

  const totalRevenue = statusTotals.paid?.amount ?? 0;
  const pendingRevenue = statusTotals.pending?.amount ?? 0;
  const lateRevenue = statusTotals.late?.amount ?? 0;

  return NextResponse.json({
    // Counts
    students, classes, teachers, subjects, slots,
    overridesAbsent, courses, formations, galleryCount,
    testimonialsTotal, testimonialsPending,
    enrollmentsTotal, enrollmentsPending,
    paymentsLate, paymentsPending,
    certificatesIssued, certificatesDraft,
    absenceRequestsPending,
    // Revenue
    totalRevenue, pendingRevenue, lateRevenue,
    // Charts
    monthLabels: last12MonthLabels(),
    monthlyEnrollments,
    monthlyRevenue,
    studentsByClass,
    paymentStatusCounts: [
      statusTotals.paid?.count ?? 0,
      statusTotals.pending?.count ?? 0,
      statusTotals.late?.count ?? 0,
      statusTotals.cancelled?.count ?? 0,
    ],
    // Tables
    recentEnrollments: enrollmentsRecent.data ?? [],
    recentPayments: paymentsRecent.data ?? [],
  });
}
