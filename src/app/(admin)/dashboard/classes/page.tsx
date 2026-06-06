import ClassesManager from "@/components/admin/ClassesManager";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Classes | Leader School Kelibia" };

export default function ClassesPage() {
  return <ClassesManager />;
}
