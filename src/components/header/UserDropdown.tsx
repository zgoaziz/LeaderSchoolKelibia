"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { createClient } from "@/utils/supabase/client";
import { clearPermissionsCache } from "@/hooks/usePermissions";

type UserInfo = {
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  avatarUrl?: string;
};

function getInitials(firstName: string, lastName: string, email: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return;
      const firstName = u.user_metadata?.first_name ?? "";
      const lastName = u.user_metadata?.last_name ?? "";
      const email = u.email ?? "";
      const avatarUrl = u.user_metadata?.avatar_url ?? undefined;
      setUser({ email, firstName, lastName, initials: getInitials(firstName, lastName, email), avatarUrl });
    });
  }, []);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    clearPermissionsCache();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "…";

  const Avatar = ({ size = "w-11 h-11" }: { size?: string }) =>
    user?.avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatarUrl} alt={displayName} className={`${size} rounded-full object-cover shrink-0`} />
    ) : (
      <span className={`flex items-center justify-center ${size} rounded-full bg-brand-600 text-white font-semibold text-sm shrink-0`}>
        {user?.initials ?? "…"}
      </span>
    );

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle gap-2"
      >
        <Avatar />
        <span className="hidden sm:block mr-1 font-medium text-theme-sm max-w-[120px] truncate">
          {displayName}
        </span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {/* User info header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
          <Avatar />
          <div className="min-w-0">
            <span className="block font-semibold text-gray-800 text-theme-sm dark:text-white/90 truncate">
              {displayName}
            </span>
            <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email ?? ""}
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-1 pt-3 pb-3 border-b border-gray-200 dark:border-gray-800">
          {/* Mon profil */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              {/* person icon */}
              <svg className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 2.5a4.167 4.167 0 1 0 0 8.334A4.167 4.167 0 0 0 10 2.5Zm-2.5 4.167a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Zm2.5 5.833c-3.452 0-6.25 1.896-6.25 4.167 0 .46.373.833.833.833h10.834a.833.833 0 0 0 .833-.833c0-2.271-2.798-4.167-6.25-4.167Zm-4.583 3.333c.369-1.18 2.094-1.667 4.583-1.667s4.214.487 4.583 1.667H5.417Z" fill="" />
              </svg>
              Mon profil
            </DropdownItem>
          </li>

          {/* Paramètres */}
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              {/* gear icon */}
              <svg className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="" />
              </svg>
              Paramètres
            </DropdownItem>
          </li>
        </ul>

        {/* Se déconnecter */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors w-full disabled:opacity-60"
        >
          <svg className="fill-gray-500 group-hover:fill-red-500 dark:group-hover:fill-red-400 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z" fill="" />
          </svg>
          {signingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </Dropdown>
    </div>
  );
}
