"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Search, Bell } from "lucide-react";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", PJ: "PJ Fakultas", MENTOR: "Mentor" };

export function Topbar({ role, faculty, name }: { role: string; faculty?: string; name: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/40 px-5 flex items-center justify-between gap-4">
      <div className="hidden sm:flex items-center flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3.5 text-on-surface-variant pointer-events-none" />
        <input
          disabled
          placeholder="Cari kelompok, praktikan, atau laporan…"
          className="w-full bg-surface-container-highest/60 rounded-full pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 outline-none cursor-not-allowed"
        />
      </div>

      <div className="sm:hidden">
        <div className="text-[11px] font-semibold text-on-surface-variant">{ROLE_LABEL[role]}{faculty ? ` · ${faculty}` : ""}</div>
        <div className="font-display text-sm font-bold text-on-surface">Assalamu&apos;alaikum, {name.split(" ")[0]}</div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}
        <button className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-error" />
        </button>
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-outline-variant/50">
          <div className="text-right leading-tight">
            <div className="text-sm font-bold text-on-surface">{name}</div>
            <div className="text-[11px] text-on-surface-variant">{ROLE_LABEL[role]}{faculty ? ` · ${faculty}` : ""}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary dark:bg-primary-dark text-white dark:text-[#00391d] flex items-center justify-center text-xs font-bold ring-2 ring-primary/25 dark:ring-primary-dark/25 ring-offset-2 ring-offset-surface shrink-0">
            {initials(name)}
          </div>
        </div>
      </div>
    </header>
  );
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
