import type { Metadata } from "next";
import DashboardStats from "@/components/admin/DashboardStats";

export const metadata: Metadata = {
  title: "Tableau de bord | Leader School Kelibia",
  description: "Tableau de bord administratif — Leader School Kelibia",
};

export default function Dashboard() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tableau de bord</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Vue d&apos;ensemble — Leader School Kélibia
        </p>
      </div>
      <DashboardStats />
    </div>
  );
}
