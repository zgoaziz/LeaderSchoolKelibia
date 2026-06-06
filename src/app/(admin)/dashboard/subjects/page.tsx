import SubjectsManager from "@/components/admin/SubjectsManager";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Matières | Leader School Kelibia" };

export default function SubjectsPage() {
  return <SubjectsManager />;
}
