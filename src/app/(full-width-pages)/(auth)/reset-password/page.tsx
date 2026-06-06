import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié | Leader School Kelibia",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
