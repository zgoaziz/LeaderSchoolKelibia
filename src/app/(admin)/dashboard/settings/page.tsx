"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Section = "password" | "notifications";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("password");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Paramètres</h3>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar nav */}
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1">
            <NavBtn active={activeSection === "password"} onClick={() => setActiveSection("password")}>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0 1 10 0v2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2zm8-2v2H7V7a3 3 0 0 1 6 0z" clipRule="evenodd" />
              </svg>
              Mot de passe
            </NavBtn>
            <NavBtn active={activeSection === "notifications"} onClick={() => setActiveSection("notifications")}>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6zM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z" />
              </svg>
              Notifications
            </NavBtn>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {activeSection === "password" && <PasswordSection />}
          {activeSection === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-left transition-colors ${
        active
          ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (next.length < 8) {
      setMsg({ ok: false, text: "Le nouveau mot de passe doit comporter au moins 8 caractères." });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "Les mots de passe ne correspondent pas." });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setMsg({ ok: false, text: "Session expirée. Veuillez vous reconnecter." });
      setLoading(false);
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInErr) {
      setMsg({ ok: false, text: "Mot de passe actuel incorrect." });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setLoading(false);

    if (error) {
      setMsg({ ok: false, text: error.message });
    } else {
      setMsg({ ok: true, text: "Mot de passe modifié avec succès." });
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Changer le mot de passe</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choisissez un mot de passe fort d&apos;au moins 8 caractères.
        </p>
      </div>

      {msg && (
        <div className={`mb-5 rounded-lg px-4 py-3 text-sm border ${msg.ok ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <PasswordField
          label="Mot de passe actuel"
          value={current}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          onChange={(v) => setCurrent(v)}
        />
        <PasswordField
          label="Nouveau mot de passe"
          value={next}
          show={showNext}
          onToggle={() => setShowNext((v) => !v)}
          onChange={(v) => setNext(v)}
        />
        <PasswordField
          label="Confirmer le nouveau mot de passe"
          value={confirm}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          onChange={(v) => setConfirm(v)}
        />

        {/* Strength indicator */}
        {next.length > 0 && (
          <div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    passwordStrength(next) >= level
                      ? level <= 1 ? "bg-red-400" : level <= 2 ? "bg-orange-400" : level <= 3 ? "bg-yellow-400" : "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {["", "Très faible", "Faible", "Moyen", "Fort"][passwordStrength(next)]}
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Enregistrement…" : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordField({
  label, value, show, onToggle, onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 pr-10 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function passwordStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function NotificationsSection() {
  const [email, setEmail] = useState(true);
  const [browser, setBrowser] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Notifications</h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choisissez comment vous souhaitez être notifié.
        </p>
      </div>

      {saved && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          Préférences enregistrées.
        </div>
      )}

      <div className="space-y-4 max-w-md">
        <Toggle
          label="Notifications par email"
          description="Recevoir des alertes importantes par email."
          checked={email}
          onChange={setEmail}
        />
        <Toggle
          label="Notifications navigateur"
          description="Afficher des notifications dans le navigateur."
          checked={browser}
          onChange={setBrowser}
        />
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
