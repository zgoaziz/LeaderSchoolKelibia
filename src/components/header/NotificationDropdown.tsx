"use client";
import { useState, useEffect, useCallback } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";

type Notif = {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  classes: { name: string } | null;
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const TYPE_ICON: Record<string, string> = {
  rattrapage: "🔄",
  absent: "❌",
  holiday: "🏖",
  schedule: "📅",
  enrollment: "📋",
  info: "ℹ️",
};

const TYPE_COLOR: Record<string, string> = {
  rattrapage: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  absent: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  holiday: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  schedule: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  enrollment: "bg-[#465fff]/10 text-[#465fff] dark:bg-[#465fff]/20 dark:text-[#465fff]",
  info: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen]         = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]       = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const handleOpen = async () => {
    setIsOpen(true);
    if (unreadCount > 0) {
      setLoading(true);
      await fetch("/api/notifications/read", { method: "POST" });
      setUnreadCount(0);
      setLoading(false);
    }
  };

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={isOpen ? closeDropdown : handleOpen}
      >
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 z-10 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping" />
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
          <button
            onClick={closeDropdown}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar gap-1">
          {loading && (
            <li className="px-3 py-4 text-center text-sm text-gray-400">Chargement...</li>
          )}
          {!loading && notifications.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-gray-400">
              Aucune notification
            </li>
          )}
          {!loading && notifications.map((n) => (
            <li key={n.id}>
              <div className="flex gap-3 rounded-lg px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base ${TYPE_COLOR[n.type] ?? TYPE_COLOR.info}`}>
                  {TYPE_ICON[n.type] ?? "📢"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white leading-snug truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {n.classes?.name && (
                      <>
                        <span className="text-xs text-gray-400">{n.classes.name}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      </>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => { fetchNotifications(); }}
            className="w-full py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Actualiser
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
