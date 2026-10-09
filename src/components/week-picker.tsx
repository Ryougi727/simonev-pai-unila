"use client";

import { useRouter } from "next/navigation";

const FACULTIES = ["FMIPA", "Teknik", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];

export function WeekPicker({
  totalMinggu,
  active,
  basePath,
  pageSize,
  faculty,
  showFacultyFilter = false,
}: {
  totalMinggu: number;
  active: number;
  basePath: string;
  pageSize?: number;
  faculty?: string;
  showFacultyFilter?: boolean;
}) {
  const router = useRouter();

  const updateFilters = (next: { week?: string; faculty?: string }) => {
    const params = new URLSearchParams();
    params.set("week", next.week ?? String(active));
    if (pageSize) params.set("pageSize", String(pageSize));
    const nextFaculty = next.faculty ?? faculty;
    if (nextFaculty && nextFaculty !== "all") params.set("faculty", nextFaculty);
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showFacultyFilter && (
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Fakultas
          <select
            value={faculty || "all"}
            onChange={(event) => updateFilters({ faculty: event.target.value })}
            aria-label="Pilih fakultas untuk monitoring"
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="all">Semua Fakultas</option>
            {FACULTIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      )}
      <label className="flex items-center gap-2 text-xs text-gray-500">
        Minggu
        <select
          value={active}
          onChange={(event) => updateFilters({ week: event.target.value })}
          aria-label="Pilih minggu monitoring"
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
        >
          {Array.from({ length: totalMinggu }, (_, index) => index + 1).map((week) => (
            <option key={week} value={week}>Minggu {week}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
