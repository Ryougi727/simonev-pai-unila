"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type SearchableSelectOption = { value: string; label: string };

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Cari…",
  emptyText = "Tidak ada hasil.",
  ariaLabel,
  className = "",
}: {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-left flex items-center gap-2 outline-none focus:border-primary"
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-gray-400"}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-40 mt-1.5 w-full bg-white dark:bg-[#0f1c14] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#dcefe2] dark:border-[#1d3527] relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full pl-7 pr-2 py-1.5 text-sm bg-transparent outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto" role="listbox" aria-label={ariaLabel}>
            {filtered.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  type="button"
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark font-semibold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
            {!filtered.length && (
              <div className="px-3 py-6 text-center text-xs text-gray-400">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
