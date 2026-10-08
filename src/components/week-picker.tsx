import Link from "next/link";

export function WeekPicker({ totalMinggu, active, basePath, pageSize }: { totalMinggu: number; active: number; basePath: string; pageSize?: number }) {
  const weeks = Array.from({ length: totalMinggu }, (_, i) => i + 1);
  return (
    <div className="flex gap-1.5 flex-wrap">
      {weeks.map((w) => (
        <Link
          key={w}
          href={`${basePath}?week=${w}${pageSize ? `&pageSize=${pageSize}` : ""}`}
          className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            w === active
              ? "bg-primary-soft dark:bg-primary-darkSoft border-primary text-primary-hover dark:text-primary-dark"
              : "border-[#dcefe2] dark:border-[#1d3527] text-gray-500"
          }`}
        >
          Minggu {w}
        </Link>
      ))}
    </div>
  );
}
