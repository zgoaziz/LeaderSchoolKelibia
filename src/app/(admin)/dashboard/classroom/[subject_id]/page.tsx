import ClassroomView from "@/components/admin/ClassroomView";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Classroom | Leader School Kelibia" };

export default async function ClassroomPage({ params }: { params: Promise<{ subject_id: string }> }) {
  const { subject_id } = await params;
  return <ClassroomView subjectId={subject_id} />;
}
