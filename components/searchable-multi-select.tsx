"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Check, ChevronDown, X } from "lucide-react";

export type MultiSelectOption = { id: string; label: string; sublabel?: string };

export function SearchableMultiSelect({
  options, selectedIds, onChange, placeholder, searchPlaceholder = "Cari…", maxSelected, emptyText = "Tidak ada hasil.",
}: {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  maxSelected?: number;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.filter((o) => selectedIds.includes(o.id));
  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return o.label.toLowerCase().includes(q) || (o.sublabel || "").toLowerCase().includes(q);
  });
  const atLimit = maxSelected !== undefined && selectedIds.length >= maxSelected;

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) { onChange(selectedIds.filter((x) => x !== id)); return; }
    if (atLimit) return;
    onChange([...selectedIds, id]);
  };
  const remove = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-left flex items-center flex-wrap gap-1.5 focus:border-primary outline-none"
      >
        {selected.length === 0 && <span className="text-sm text-gray-400">{placeholder}</span>}
        {selected.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1 text-xs font-semibold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark px-2 py-1 rounded-full">
            {s.label}
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); remove(s.id); }}
              className="hover:opacity-70"
            >
              <X size={12} />
            </span>
          </span>
        ))}
        <ChevronDown size={15} className={`ml-auto text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 w-full bg-surface dark:bg-[#0f1c14] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-outline-variant/40 dark:border-[#1d3527] relative">
            <Search size={14} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ left: 14 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-2 py-1.5 text-sm bg-transparent outline-none"
            />
          </div>
          {maxSelected !== undefined && (
            <div className="px-3 py-1.5 text-[11px] text-gray-400 border-b border-outline-variant/40 dark:border-[#1d3527]">
              {selectedIds.length}/{maxSelected} dipilih
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((o) => {
              const isSelected = selectedIds.includes(o.id);
              const disabled = !isSelected && atLimit;
              return (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark font-semibold"
                      : disabled
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${
                    isSelected ? "bg-primary dark:bg-primary-dark border-primary dark:border-primary-dark" : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {isSelected && <Check size={11} className="text-white dark:text-[#00391d]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <div className="truncate">{o.label}</div>
                    {o.sublabel && <div className="text-[11px] opacity-70 truncate">{o.sublabel}</div>}
                  </span>
                </button>
              );
            })}
            {!filtered.length && <div className="px-3 py-6 text-center text-xs text-gray-400">{emptyText}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
