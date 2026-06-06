"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PublicRole = { id: string; name: string };

export default function SignUpForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [publicRoles, setPublicRoles] = useState<PublicRole[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/roles/public")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPublicRoles(data); })
      .finally(() => setRolesLoading(false));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (firstName.trim().length < 2) e.firstName = "Prénom requis (min 2 caractères)";
    if (lastName.trim().length < 2) e.lastName = "Nom requis (min 2 caractères)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email invalide";
    if (password.length < 8) e.password = "Minimum 8 caractères";
    if (password !== confirmPassword) e.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!accepted) e.accept = "Vous devez accepter les conditions";
    if (publicRoles.length > 0 && !selectedRole) e.role = "Veuillez sélectionner un rôle";
    return e;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setErrors({});

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: selectedRole || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrors({ form: data.error });
      return;
    }

    router.push("/signin?registered=1");
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
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
            Créer un compte
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Remplissez le formulaire pour créer votre compte.
          </p>
        </div>

        {errors.form && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>Prénom <span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <Label>Nom <span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

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

            {/* Role selection */}
            {!rolesLoading && publicRoles.length > 0 && (
              <div>
                <Label>Rôle <span className="text-error-500">*</span></Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {publicRoles.map((role) => {
                    const isSelected = selectedRole === role.name;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.name)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium capitalize ${
                          isSelected
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:border-brand-400 dark:text-brand-300"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-brand-500 bg-brand-500"
                              : "border-gray-400 dark:border-gray-500"
                          }`}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        {role.name}
                      </button>
                    );
                  })}
                </div>
                {errors.role && <p className="mt-1.5 text-xs text-red-500">{errors.role}</p>}
              </div>
            )}

            <div className="flex items-start gap-3">
              <Checkbox className="w-5 h-5 mt-0.5" checked={accepted} onChange={setAccepted} />
              <p className="inline-block font-normal text-gray-500 dark:text-gray-400 text-sm">
                En créant un compte, vous acceptez les{" "}
                <span className="text-gray-800 dark:text-white/90">Conditions d&apos;utilisation</span>{" "}
                et notre{" "}
                <span className="text-gray-800 dark:text-white">Politique de confidentialité</span>.
              </p>
            </div>
            {errors.accept && <p className="-mt-2 text-xs text-red-500">{errors.accept}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Inscription…" : "Créer mon compte"}
            </button>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Déjà inscrit ?{" "}
            <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
