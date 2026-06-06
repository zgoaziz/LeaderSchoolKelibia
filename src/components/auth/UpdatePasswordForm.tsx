"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpdatePasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (password.length < 8) e.password = "Minimum 8 caractères";
    if (password !== confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas";
    return e;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErrors({ form: error.message });
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  };

  if (success) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
            <h2 className="mb-2 font-semibold text-green-800 dark:text-green-300 text-lg">
              Mot de passe mis à jour !
            </h2>
            <p className="text-sm text-green-700 dark:text-green-400">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers le tableau de bord…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <div>
              <Label>Nouveau mot de passe <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 caractères"
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

            <div>
              <Label>Confirmer le mot de passe <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <span
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showConfirm
                    ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                </span>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Mise à jour…" : "Enregistrer le nouveau mot de passe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
