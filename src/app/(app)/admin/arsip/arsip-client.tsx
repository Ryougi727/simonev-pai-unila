"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Download, Upload, Trash2 } from "lucide-react";

type ArchiveRow = { id: string; label: string; archivedAt: string; totalPertemuan: number };

export function ArsipClient({ semesterLabel, totalPertemuanSelesai, archives }: { semesterLabel: string; totalPertemuanSelesai: number; archives: ArchiveRow[] }) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);

  const archiveNow = async () => {
    if (!confirm(`Arsipkan semester ${semesterLabel} sekarang?`)) return;
    setArchiving(true);
    const res = await fetch("/api/admin/arsip", { method: "POST" });
    setArchiving(false);
    if (!res.ok) { alert("Gagal mengarsipkan."); return; }
    router.refresh();
  };

  const mock = (label: string) => alert(`${label} dijalankan (simulasi) — integrasi Google Drive API belum tersambung pada tahap ini.`);

  return (
    <div>
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5 mb-4">
        <div className="font-semibold text-sm mb-1">Semester Berjalan</div>
        <div className="text-sm text-gray-500 mb-4">{semesterLabel} — {totalPertemuanSelesai} pertemuan telah selesai.</div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={archiveNow} disabled={archiving} className="flex items-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2.5">
            <Archive size={15} /> {archiving ? "Mengarsipkan…" : "Arsipkan Semester Ini"}
          </button>
          <button onClick={() => mock("Backup Database")} className="flex items-center gap-1.5 text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5">
            <Download size={15} /> Backup Database
          </button>
          <button onClick={() => mock("Upload ke Google Drive")} className="flex items-center gap-1.5 text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5">
            <Upload size={15} /> Upload Dokumentasi ke Drive
          </button>
          <button onClick={() => mock("Hapus File Lama")} className="flex items-center gap-1.5 text-sm font-semibold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg px-4 py-2.5">
            <Trash2 size={15} /> Hapus File Lama dari Storage
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-3">Integrasi Google Drive API dan penghapusan file lama disimulasikan pada tahap ini.</p>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 font-semibold text-sm border-b border-[#dcefe2] dark:border-[#1d3527]">Riwayat Arsip</div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Semester</th>
              <th className="px-4 py-2.5 font-bold">Diarsipkan Pada</th>
              <th className="px-4 py-2.5 font-bold">Pertemuan Selesai</th>
            </tr>
          </thead>
          <tbody>
            {archives.map((a) => (
              <tr key={a.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                <td className="px-4 py-2.5 font-semibold">{a.label}</td>
                <td className="px-4 py-2.5">{new Date(a.archivedAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-4 py-2.5">{a.totalPertemuan}</td>
              </tr>
            ))}
            {!archives.length && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada semester yang diarsipkan.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
