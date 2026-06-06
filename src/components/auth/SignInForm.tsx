"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { createClient } from "@/utils/supabase/client";
import { clearPermissionsCache } from "@/hooks/usePermissions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email invalide";
    if (!password) e.password = "Mot de passe requis";
    return e;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setErrors({});

    clearPermissionsCache(); // flush stale permissions before loading new user's
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }
      setErrors({ form: "Email ou mot de passe incorrect." });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Retour à l&apos;accueil
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Connexion
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Entrez votre email et mot de passe pour vous connecter.
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {errors.form}
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
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <Label>Mot de passe <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword
                    ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                </span>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={rememberMe} onChange={setRememberMe} />
                <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                  Se souvenir de moi
                </span>
              </div>
              <Link
                href="/reset-password"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
