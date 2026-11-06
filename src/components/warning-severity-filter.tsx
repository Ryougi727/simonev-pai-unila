"use client";

import { useRouter } from "next/navigation";
import { useDataLoading } from "@/components/data-loading";

const SEVERITIES = [
  { value: "all", label: "Semua peringatan" },
  { value: "early", label: "Peringatan Dini" },
  { value: "yellow", label: "Peringatan 1" },
  { value: "orange", label: "Peringatan 2" },
  { value: "red", label: "Peringatan 3" },
] as const;

export function WarningSeverityFilter({
  basePath,
  value,
  week,
  pageSize,
  faculty,
  searchQuery,
}: {
  basePath: string;
  value: string;
  week: number;
  pageSize: number;
  faculty?: string;
  searchQuery: string;
}) {
  const router = useRouter();
  const { startLoading } = useDataLoading();

  return (
    <label className="flex items-center gap-2 text-xs text-gray-500">
      Tingkat peringatan
      <select
        value={value}
        aria-label="Filter tingkat peringatan"
        onChange={(event) => {
          const params = new URLSearchParams();
          params.set("week", String(week));
          params.set("pageSize", String(pageSize));
          if (faculty && faculty !== "all") params.set("faculty", faculty);
          if (searchQuery) params.set("q", searchQuery);
          if (event.target.value !== "all") params.set("severity", event.target.value);
          params.set("page", "1");
          startLoading();
          router.push(`${basePath}?${params.toString()}`);
        }}
        className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-on-surface outline-none focus:border-primary dark:border-gray-700"
      >
        {SEVERITIES.map((severity) => (
          <option key={severity.value} value={severity.value}>{severity.label}</option>
        ))}
      </select>
    </label>
  );
}
