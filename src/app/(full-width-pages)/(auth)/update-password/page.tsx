import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau mot de passe | Leader School Kelibia",
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
