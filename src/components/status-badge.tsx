import { STATUS_LABEL, type PelaksanaanStatus } from "@/lib/status";

export function StatusBadge({ status }: { status: PelaksanaanStatus }) {
  const s = STATUS_LABEL[status];
  return (
    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${s.classes}`}>
      {s.dot} {s.label}
    </span>
  );
}