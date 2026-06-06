"use client";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  const handleVerify = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (otp.length < 6) { setError("Entrez le code reçu par email."); return; }
    if (!email) { setError("Email manquant. Retournez à la page de connexion."); return; }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    setLoading(false);

    if (verifyError) {
      setError("Code invalide ou expiré. Vérifiez et réessayez.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMsg("");
    setError("");

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResending(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setResendMsg("Un nouveau code a été envoyé à votre adresse email.");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour à la connexion
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Vérification de l&apos;email
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Un code OTP a été envoyé à{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {email || "votre adresse email"}
            </span>
            . Entrez-le ci-dessous pour accéder à votre compte.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}
        {resendMsg && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            {resendMsg}
          </div>
        )}

        <form onSubmit={handleVerify} noValidate>
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Code OTP <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6,8}"
                maxLength={8}
                placeholder="12345678"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full h-14 rounded-lg border border-gray-300 bg-transparent px-4 text-center text-3xl font-bold tracking-[0.5em] text-gray-800 shadow-theme-xs placeholder:text-gray-400 placeholder:tracking-normal placeholder:text-base focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Vérification…" : "Vérifier et accéder au tableau de bord"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vous n&apos;avez pas reçu le code ?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium disabled:opacity-60"
            >
              {resending ? "Envoi…" : "Renvoyer le code"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
