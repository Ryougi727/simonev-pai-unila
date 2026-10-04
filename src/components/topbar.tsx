"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Sun, Moon, Search, Bell, Menu, Loader2 } from "lucide-react";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", PJ: "PJ Fakultas", MENTOR: "Mentor" };

type SearchResult = { type: string; label: string; sublabel: string; href: string };

export function Topbar({
  role, faculty, name, photoUrl, hasRecentPengumuman, onOpenMobileMenu,
}: {
  role: string; faculty?: string; name: string; photoUrl?: string | null;
  hasRecentPengumuman?: boolean; onOpenMobileMenu?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch { /* ignore */ }
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/40 px-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-4">
      <button onClick={onOpenMobileMenu} className="sm:hidden p-2 -ml-2 text-on-surface-variant shrink-0">
        <Menu size={20} />
      </button>

      <div ref={boxRef} className="hidden sm:flex items-center flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3.5 text-on-surface-variant pointer-events-none" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Cari kelompok, praktikan, atau pengguna…"
          className="w-full bg-surface-container-highest/60 rounded-full pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 outline-none"
        />
        {searching && <Loader2 size={14} className="absolute right-3.5 animate-spin text-on-surface-variant" />}

        {showResults && query.trim().length >= 2 && (
          <div className="absolute top-full mt-1.5 w-full bg-surface border border-outline-variant/40 rounded-xl shadow-lg max-h-80 overflow-y-auto">
            {results.length ? (
              results.map((r, i) => (
                <Link
                  key={i}
                  href={r.href}
                  onClick={() => { setShowResults(false); setQuery(""); }}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-high text-sm border-b border-outline-variant/20 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-on-surface font-semibold truncate">{r.label}</div>
                    <div className="text-on-surface-variant text-xs truncate">{r.sublabel}</div>
                  </div>
                  <span className="text-[10px] font-bold text-primary dark:text-primary-dark bg-primary/10 dark:bg-primary-dark/10 px-2 py-0.5 rounded-full shrink-0 ml-2">{r.type}</span>
                </Link>
              ))
            ) : (
              !searching && <div className="px-4 py-4 text-xs text-on-surface-variant text-center">Tidak ada hasil.</div>
            )}
          </div>
        )}
      </div>

      <div className="sm:hidden min-w-0">
        <div className="text-[11px] font-semibold text-on-surface-variant truncate">{ROLE_LABEL[role]}{faculty ? ` · ${faculty}` : ""}</div>
        <div className="font-display text-sm font-bold text-on-surface truncate">Assalamu&apos;alaikum, {name.split(" ")[0]}</div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}
        <Link href="/pengumuman" className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
          <Bell size={17} />
          {hasRecentPengumuman && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-error" />}
        </Link>
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
