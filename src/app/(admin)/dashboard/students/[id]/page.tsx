import StudentDetail from "@/components/admin/StudentDetail";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Fiche étudiant | Leader School Kelibia" };

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetail studentId={id} />;
}
