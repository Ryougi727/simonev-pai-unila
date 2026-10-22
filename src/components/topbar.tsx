"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, Menu, LogOut, KeyRound, UserRound } from "lucide-react";
import { ThemeSwitcher } from "../../components/theme-switcher";
import { EmergencyUnlockButton } from "./emergency-unlock";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", PJ: "PJ Fakultas", MENTOR: "Mentor" };

export function Topbar({
  role, faculty, name, photoUrl, hasRecentPengumuman, onOpenMobileMenu,
}: {
  role: string; faculty?: string; name: string; photoUrl?: string | null;
  hasRecentPengumuman?: boolean; onOpenMobileMenu?: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/40 px-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-4">
      <button onClick={onOpenMobileMenu} className="sm:hidden p-2 -ml-2 text-on-surface-variant shrink-0">
        <Menu size={20} />
      </button>

      <div className="sm:hidden min-w-0">
        <div className="text-[11px] font-semibold text-on-surface-variant truncate">{ROLE_LABEL[role]}{faculty ? ` · ${faculty}` : ""}</div>
        <div className="font-display text-sm font-bold text-on-surface truncate">Assalamu&apos;alaikum, {name.split(" ")[0]}</div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeSwitcher />
        <Link href="/pengumuman" className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <Bell size={17} />
          {hasRecentPengumuman && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-error" />}
        </Link>
        <div ref={profileRef} className="relative sm:hidden">
          <button
            type="button"
            aria-label="Buka menu profil"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            onClick={() => setProfileOpen((open) => !open)}
            className="w-9 h-9 rounded-full bg-primary dark:bg-primary-dark text-white dark:text-[#00391d] flex items-center justify-center text-xs font-bold ring-2 ring-primary/25 dark:ring-primary-dark/25 ring-offset-2 ring-offset-surface shrink-0 overflow-hidden"
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : initials(name)}
          </button>
          {profileOpen && (
            <div role="menu" aria-label="Menu profil pengguna" className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-outline-variant/50 bg-surface shadow-xl p-3 z-50">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-11 h-11 rounded-full bg-primary dark:bg-primary-dark text-white dark:text-[#00391d] flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : initials(name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-on-surface truncate">{name}</div>
                  <div className="text-xs text-on-surface-variant truncate">{ROLE_LABEL[role]}{faculty ? ` · ${faculty}` : ""}</div>
                </div>
              </div>
              <div className="my-2 border-t border-outline-variant/30" />
              {role === "MENTOR" && (
                <>
                  <Link
                    role="menuitem"
                    href="/mentor/profil"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  >
                    <UserRound size={16} /> Profil Saya
                  </Link>
                  <div className="my-2 border-t border-outline-variant/30" />
                  <EmergencyUnlockButton />
                  <div className="my-2 border-t border-outline-variant/30" />
                </>
              )}
              {role === "ADMIN" && (
                <Link
                  role="menuitem"
                  href="/change-password"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                >
                  <KeyRound size={16} /> Ganti Password
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-error hover:bg-error-container/30"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-outline-variant/50">
          <div className="text-right leading-tight">
            <div className="text-sm font-bold text-on-surface">{name}</div>
            <div className="text-[11px] text-on-surface-variant">{ROLE_LABEL[role]}{faculty ? ` · ${faculty}` : ""}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary dark:bg-primary-dark text-white dark:text-[#00391d] flex items-center justify-center text-xs font-bold ring-2 ring-primary/25 dark:ring-primary-dark/25 ring-offset-2 ring-offset-surface shrink-0 overflow-hidden">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials(name)
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
