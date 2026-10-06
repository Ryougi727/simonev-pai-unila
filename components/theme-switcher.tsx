"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Moon, Palette, Sparkles, Sun, Zap } from "lucide-react";

const THEMES = [
  { id: "light", label: "Light", description: "Tema terang bawaan", icon: Sun },
  { id: "dark", label: "Dark", description: "Tema gelap bawaan", icon: Moon },
  { id: "sakura", label: "Sakura", description: "Lembut & elegan", icon: Sparkles },
  { id: "neon", label: "Neon", description: "Futuristik & berani", icon: Zap },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Pilih tema"
        className="p-2 rounded-full text-on-surface-variant"
      >
        <Palette size={18} />
      </button>
    );
  }

  const active = THEMES.find((item) => item.id === theme) ?? THEMES[0];
  const ActiveIcon = active.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Pilih tema"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
          open
            ? "bg-primary/15 text-primary"
            : "text-on-surface-variant hover:bg-surface-container-high"
        }`}
      >
        <ActiveIcon size={18} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Pilihan tema"
          className="theme-switcher-menu fixed top-[4.5rem] rounded-2xl border border-outline-variant/60 bg-surface shadow-2xl p-2 z-[9999]"
        >
          <div className="px-3 pt-2 pb-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
              <Palette size={15} className="text-primary" />
              Tema Tampilan
            </div>
            <div className="text-[10px] text-on-surface-variant mt-1">
              Pilih gaya tampilan SIMONEV
            </div>
          </div>

          {THEMES.map((item) => {
            const Icon = item.icon;
            const selected = theme === item.id;

            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(item.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  selected
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <span className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold">{item.label}</span>
                  <span className="block text-[10px] text-on-surface-variant truncate">
                    {item.description}
                  </span>
                </span>
                {selected && <Check size={16} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
