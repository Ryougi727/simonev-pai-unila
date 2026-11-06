import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MeetingSummary({
  week,
  completedCount,
  pendingCount,
  pendingHref,
}: {
  week: number;
  completedCount: number;
  pendingCount: number;
  pendingHref: string;
}) {
  return (
    <section aria-label={`Ringkasan pertemuan minggu ${week}`} className="mb-4">
      <h2 className="mb-2 text-sm font-bold text-on-surface">Ringkasan Minggu {week}</h2>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#dcefe2] dark:border-[#1d3527] bg-white dark:bg-[#0f1c14] p-4">
            <div className="text-xs font-semibold text-gray-500">Selesai</div>
            <div className="mt-1 text-3xl font-bold text-primary dark:text-primary-dark">{completedCount}</div>
            <div className="text-[11px] text-gray-400">kelompok</div>
          </div>
          <div className="rounded-2xl border border-[#dcefe2] dark:border-[#1d3527] bg-white dark:bg-[#0f1c14] p-4">
            <div className="text-xs font-semibold text-gray-500">Belum selesai</div>
            <div className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
            <div className="text-[11px] text-gray-400">kelompok</div>
          </div>
        </div>

        <Link
          href={pendingHref}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-[#dcefe2] bg-white p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-[#1d3527] dark:bg-[#0f1c14] dark:hover:border-primary-dark/40 dark:hover:bg-primary-dark/5"
        >
          <span>
            <span className="block text-sm font-bold text-on-surface">Lihat kelompok yang belum selesai</span>
            <span className="mt-1 block text-xs text-gray-500">Minggu {week} · {pendingCount} kelompok</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary dark:group-hover:text-primary-dark" />
        </Link>
      </div>
    </section>
  );
}
