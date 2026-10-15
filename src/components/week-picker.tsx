"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDataLoading } from "@/components/data-loading";

const FACULTIES = ["FMIPA", "Teknik", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];

export function WeekPicker({
  totalMinggu,
  active,
  basePath,
  pageSize,
  faculty,
  showFacultyFilter = false,
  showDataSkeleton = false,
}: {
  totalMinggu: number;
  active: number;
  basePath: string;
  pageSize?: number;
  faculty?: string;
  showFacultyFilter?: boolean;
  showDataSkeleton?: boolean;
}) {
  const router = useRouter();
  const { startLoading } = useDataLoading();
  const [selectedWeek, setSelectedWeek] = useState(active);
  const [selectedFaculty, setSelectedFaculty] = useState(faculty || "all");

  useEffect(() => setSelectedWeek(active), [active]);
  useEffect(() => setSelectedFaculty(faculty || "all"), [faculty]);

  const updateFilters = (next: { week?: string; faculty?: string }) => {
    const nextWeek = next.week ?? String(selectedWeek);
    const nextFaculty = next.faculty ?? selectedFaculty;
    const params = new URLSearchParams();
    params.set("week", nextWeek);
    if (pageSize) params.set("pageSize", String(pageSize));
    if (nextFaculty && nextFaculty !== "all") params.set("faculty", nextFaculty);
    params.set("page", "1");
    if (next.week) setSelectedWeek(Number(next.week));
    if (next.faculty) setSelectedFaculty(next.faculty);
    if (showDataSkeleton) startLoading();
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showFacultyFilter && (
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Fakultas
          <select
            value={selectedFaculty}
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
          value={selectedWeek}
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
