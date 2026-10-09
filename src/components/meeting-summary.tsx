import { STATUS_LABEL, type PelaksanaanStatus } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";

type PendingGroup = {
  id: string;
  name: string;
  mentorNames: string[];
  status: Exclude<PelaksanaanStatus, "selesai">;
};

export function MeetingSummary({
  week,
  completedCount,
  pendingGroups,
}: {
  week: number;
  completedCount: number;
  pendingGroups: PendingGroup[];
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
            <div className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">{pendingGroups.length}</div>
            <div className="text-[11px] text-gray-400">kelompok</div>
          </div>
        </div>

        <details className="rounded-2xl border border-[#dcefe2] dark:border-[#1d3527] bg-white dark:bg-[#0f1c14] p-4">
          <summary className="cursor-pointer text-sm font-bold">
            Lihat kelompok yang belum selesai ({pendingGroups.length})
          </summary>
          {pendingGroups.length ? (
            <ul className="mt-3 divide-y divide-[#dcefe2] dark:divide-[#1d3527]">
              {pendingGroups.map((group) => (
                <li key={group.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{group.name}</div>
                    <div className="text-xs text-gray-500">
                      Mentor: {group.mentorNames.length ? group.mentorNames.join(", ") : "Belum ditentukan"}
                    </div>
                  </div>
                  <StatusBadge status={group.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-gray-500">Semua kelompok telah menyelesaikan pertemuan minggu {week}.</p>
          )}
          {!!pendingGroups.length && (
            <p className="mt-3 text-[11px] text-gray-400">
              {STATUS_LABEL.terjadwal.label} berarti jadwal belum berlangsung; status lain menunjukkan kelompok belum dijadwalkan atau belum menyelesaikan pertemuan.
            </p>
          )}
        </details>
      </div>
    </section>
  );
}
