import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyOtpForm from "@/components/auth/VerifyOtpForm";

export const metadata: Metadata = {
  title: "Vérification OTP | Leader School Kelibia",
};

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
