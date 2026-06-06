import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import DashboardStats from "@/components/admin/DashboardStats";
import ProfDashboard from "@/components/admin/ProfDashboard";
import StudentDashboard from "@/components/admin/StudentDashboard";

export const metadata: Metadata = {
  title: "Tableau de bord | Leader School Kelibia",
  description: "Tableau de bord administratif — Leader School Kelibia",
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role ?? "etudiant";

  const title = role === "professeur"
    ? "Mon espace professeur"
    : role === "etudiant"
    ? "Mon espace étudiant"
    : "Tableau de bord";

  const subtitle = role === "professeur"
    ? "Vos classes, étudiants et matières"
    : role === "etudiant"
    ? "Votre classe, matières et emploi du temps"
    : "Vue d'ensemble — Leader School Kélibia";

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      {role === "admin" ? (
        <DashboardStats />
      ) : role === "professeur" ? (
        <ProfDashboard />
      ) : (
        <StudentDashboard />
      )}
    </div>
  );
}
