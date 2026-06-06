import StudentsManager from "@/components/admin/StudentsManager";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Étudiants | Leader School Kelibia" };

export default function StudentsPage() {
  return <StudentsManager />;
}
