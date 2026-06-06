import AbsencesOverview from "@/components/admin/AbsencesOverview";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Absences | Leader School Kelibia" };

export default function AbsencesPage() {
  return <AbsencesOverview />;
}
