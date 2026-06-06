"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon } from "@/icons";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Adresse email invalide.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
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
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
            <h2 className="mb-2 font-semibold text-green-800 dark:text-green-300 text-lg">
              Email envoyé !
            </h2>
            <p className="text-sm text-green-700 dark:text-green-400">
              Un lien de réinitialisation a été envoyé à{" "}
              <span className="font-medium">{email}</span>.
              Vérifiez votre boîte mail et cliquez sur le lien.
            </p>
          </div>
          <div className="mt-5 text-center">
            <Link href="/signin" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Mot de passe oublié ?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Entrez votre email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            <div>
              <Label>Email <span className="text-error-500">*</span></Label>
              <Input
                type="email"
                placeholder="exemple@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
            </button>
          </div>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
