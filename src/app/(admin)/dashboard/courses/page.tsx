import CoursesManager from "@/components/admin/CoursesManager";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion des Cours | Leader School Kelibia" };

export default function CoursesPage() {
  return <CoursesManager />;
}
