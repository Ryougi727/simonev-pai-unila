export type PelaksanaanStatus = "selesai" | "terjadwal" | "belum_jadwal" | "belum_laksana";

export function statusForPertemuan(
  pertemuan: { status: string; date: Date; time: string } | null | undefined
): PelaksanaanStatus {
  if (!pertemuan) return "belum_jadwal";
  if (pertemuan.status === "SELESAI") return "selesai";
  const [h, m] = (pertemuan.time || "23:59").split(":").map(Number);
  const eventDate = new Date(pertemuan.date);
  eventDate.setHours(h ?? 23, m ?? 59, 0, 0);
  if (eventDate < new Date()) return "belum_laksana";
  return "terjadwal";
}

export const STATUS_LABEL: Record<PelaksanaanStatus, { label: string; dot: string; classes: string }> = {
  selesai: { label: "Selesai", dot: "🟢", classes: "bg-primary-soft text-primary-hover dark:bg-primary-darkSoft dark:text-primary-dark" },
  terjadwal: { label: "Terjadwal", dot: "🟡", classes: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  belum_jadwal: { label: "Belum Menentukan Jadwal", dot: "🔴", classes: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" },
  belum_laksana: { label: "Belum Melaksanakan", dot: "⚫", classes: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400" },
};