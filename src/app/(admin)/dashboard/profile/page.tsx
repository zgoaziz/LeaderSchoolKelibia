"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  role: string;
};

function getInitials(fn: string, ln: string, email: string) {
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
  if (fn) return fn.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const editIcon = (
  <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="" />
  </svg>
);

const editBtnClass =
  "flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto";

const inputCls =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [fFirstName, setFFirstName] = useState("");
  const [fLastName, setFLastName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fBio, setFBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const m = user.user_metadata ?? {};
      const p: Profile = {
        id: user.id,
        email: user.email ?? "",
        firstName: m.first_name ?? "",
        lastName: m.last_name ?? "",
        phone: m.phone ?? "",
        bio: m.bio ?? "",
        avatarUrl: m.avatar_url ?? "",
        role: user.app_metadata?.role ?? "—",
      };
      setProfile(p);
      setFFirstName(p.firstName);
      setFLastName(p.lastName);
      setFPhone(p.phone);
      setFBio(p.bio);
      setLoading(false);
    });
  }, []);

  function openModal() {
    if (!profile) return;
    setFFirstName(profile.firstName);
    setFLastName(profile.lastName);
    setFPhone(profile.phone);
    setFBio(profile.bio);
    setSaveMsg(null);
    setShowModal(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    setUploadMsg(null);

    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/upload-avatar", { method: "POST", body: form });
    const json = await res.json();

    if (!res.ok || !json.url) {
      setUploadMsg({ ok: false, text: json.error ?? "Erreur upload." });
      setUploading(false);
      return;
    }
    await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: json.url }),
    });
    setProfile((p) => p ? { ...p, avatarUrl: json.url } : p);
    setUploadMsg({ ok: true, text: "Photo mise à jour !" });
    setUploading(false);
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: fFirstName.trim(),
        last_name: fLastName.trim(),
        phone: fPhone.trim(),
        bio: fBio.trim(),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setProfile((p) => p
        ? { ...p, firstName: fFirstName.trim(), lastName: fLastName.trim(), phone: fPhone.trim(), bio: fBio.trim() }
        : p);
      setSaveMsg({ ok: true, text: "Modifications enregistrées." });
    } else {
      const j = await res.json().catch(() => ({}));
      setSaveMsg({ ok: false, text: j.error ?? "Erreur lors de la sauvegarde." });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-center text-gray-500">Session expirée. Veuillez vous reconnecter.</div>;
  }

  const initials = getInitials(profile.firstName, profile.lastName, profile.email);
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Profil</h3>

      <div className="space-y-6">

        {/* ── Card 1 : Meta ── */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          {uploadMsg && (
            <div className={`mb-4 rounded-lg px-4 py-2 text-sm border ${uploadMsg.ok
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
              : "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
            }`}>
              {uploadMsg.text}
            </div>
          )}

          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">

              {/* Avatar */}
              <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={displayName}
                    className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-800" />
                ) : (
                  <div className="w-20 h-20 rounded-full border border-gray-200 dark:border-gray-800 bg-brand-600 flex items-center justify-center text-white text-xl font-bold">
                    {initials}
                  </div>
                )}
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/30 transition-colors">
                    <svg className="opacity-0 group-hover:opacity-100 text-white transition-opacity" width="20" height="20"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Name + role */}
              <div className="order-3 xl:order-2">
                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                  {displayName}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{profile.role}</p>
                  {profile.bio && (
                    <>
                      <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{profile.bio}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Social icons (decorative) */}
              <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                {[
                  "M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z",
                  "M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z",
                  "M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z",
                ].map((path, i) => (
                  <span key={i} className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <svg className="fill-current text-gray-600 dark:text-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d={path} fill="currentColor" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>

            <button type="button" onClick={openModal} className={editBtnClass}>
              {editIcon}
              Modifier
            </button>
          </div>
        </div>

        {/* ── Card 2 : Informations personnelles ── */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                Informations personnelles
              </h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <InfoField label="Prénom" value={profile.firstName} />
                <InfoField label="Nom" value={profile.lastName} />
                <InfoField label="Email" value={profile.email} />
                <InfoField label="Téléphone" value={profile.phone || "—"} />
                <InfoField label="Bio / Titre" value={profile.bio || "—"} />
                <InfoField label="Rôle" value={profile.role} />
              </div>
            </div>
            <button type="button" onClick={openModal} className={editBtnClass}>
              {editIcon}
              Modifier
            </button>
          </div>
        </div>

      </div>

      {/* ── Edit modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Modifier le profil</h4>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Mettez à jour vos informations personnelles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {saveMsg && (
                <div className={`mb-5 rounded-lg px-4 py-3 text-sm border ${saveMsg.ok
                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                  : "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                }`}>
                  {saveMsg.text}
                </div>
              )}

              {/* Photo */}
              <div className="mb-6">
                <h5 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Photo de profil
                </h5>
                <div className="flex items-center gap-4">
                  <div className="relative cursor-pointer group" onClick={() => { setUploadMsg(null); fileRef.current?.click(); }}>
                    {profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatarUrl} alt={displayName}
                        className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-800" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-lg font-bold border border-gray-200 dark:border-gray-800">
                        {initials}
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setUploadMsg(null); fileRef.current?.click(); }}
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
                  >
                    {uploading ? "Envoi…" : "Changer la photo"}
                  </button>
                </div>
              </div>

              {/* Fields */}
              <h5 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Informations
              </h5>
              <form id="profile-form" onSubmit={handleSaveInfo}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Prénom</label>
                    <input
                      type="text"
                      value={fFirstName}
                      onChange={(e) => setFFirstName(e.target.value)}
                      placeholder="Votre prénom"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={fLastName}
                      onChange={(e) => setFLastName(e.target.value)}
                      placeholder="Votre nom"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className={inputCls + " opacity-60 cursor-not-allowed"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Téléphone</label>
                    <input
                      type="text"
                      value={fPhone}
                      onChange={(e) => setFPhone(e.target.value)}
                      placeholder="+216 XX XXX XXX"
                      className={inputCls}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Bio / Titre</label>
                    <input
                      type="text"
                      value={fBio}
                      onChange={(e) => setFBio(e.target.value)}
                      placeholder="ex: Professeur de mathématiques"
                      className={inputCls}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{value || "—"}</p>
    </div>
  );
}
