"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, RotateCcw } from "lucide-react";
import { statusForPertemuan } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";

type Pertemuan = { id: string; week: number; date: string; time: string; location: string; status: string };
type Kelompok = { id: string; name: string; pertemuan: Pertemuan[] };

export function JadwalClient({ totalMinggu, kelompokList }: { totalMinggu: number; kelompokList: Kelompok[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(kelompokList[0].id);
  const kelompok = kelompokList.find((k) => k.id === activeId)!;
  const weeks = Array.from({ length: totalMinggu }, (_, i) => i + 1);

  const [modal, setModal] = useState<{ week: number; existing?: Pertemuan } | null>(null);
  const [form, setForm] = useState({ date: "", time: "15:30", location: "" });
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const openModal = (week: number, existing?: Pertemuan) => {
    setForm(existing ? { date: existing.date, time: existing.time, location: existing.location } : { date: "", time: "15:30", location: "" });
    setModal({ week, existing });
  };

  const submit = async () => {
    if (!form.date || !form.location.trim()) { alert("Tanggal dan lokasi wajib diisi."); return; }
    setSaving(true);
    const url = modal!.existing ? `/api/mentor/pertemuan/${modal!.existing.id}` : "/api/mentor/pertemuan";
    const method = modal!.existing ? "PATCH" : "POST";
    const body = modal!.existing ? form : { kelompokId: kelompok.id, week: modal!.week, ...form };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { alert(data.error || "Gagal menyimpan."); return; }
    setModal(null);
    router.refresh();
  };

  const resetPertemuan = async (rec: Pertemuan) => {
    const msg = rec.status === "SELESAI"
      ? `Pertemuan minggu ${rec.week} sudah SELESAI (berita acara sudah terisi). Reset akan MENGHAPUS berita acara, semua data hadir, dan foto dokumentasi minggu ini, lalu status kembali ke Terjadwal. Tanggal/jam/lokasi TIDAK berubah. Lanjutkan?`
      : `Reset pertemuan minggu ${rec.week}? QR yang aktif akan ditutup dan data hadir yang sudah tercatat akan dihapus. Jadwal tidak berubah.`;
    if (!confirm(msg)) return;
    setResettingId(rec.id);
    const res = await fetch(`/api/mentor/pertemuan/${rec.id}/reset`, { method: "POST" });
    const data = await res.json();
    setResettingId(null);
    if (!res.ok) { alert(data.error || "Gagal mereset."); return; }
    router.refresh();
  };

  return (
    <div>
      {kelompokList.length > 1 && (
        <select value={activeId} onChange={(e) => setActiveId(e.target.value)} className="mb-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-56">
          {kelompokList.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      )}
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Minggu</th>
              <th className="px-4 py-2.5 font-bold">Tanggal</th>
              <th className="px-4 py-2.5 font-bold">Jam</th>
              <th className="px-4 py-2.5 font-bold">Lokasi</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => {
              const rec = kelompok.pertemuan.find((p) => p.week === w);
              const status = statusForPertemuan(rec ? { status: rec.status, date: new Date(rec.date), time: rec.time } : null);
              const locked = rec?.status === "SELESAI";
              return (
                <tr key={w} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                  <td className="px-4 py-2.5 font-bold">{w}</td>
                  <td className="px-4 py-2.5">{rec ? new Date(rec.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                  <td className="px-4 py-2.5">{rec?.time || "-"}</td>
                  <td className="px-4 py-2.5">{rec?.location || "-"}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-3">
                      {locked ? (
                        <button
                          onClick={() => resetPertemuan(rec!)}
                          disabled={resettingId === rec!.id}
                          className="text-[11px] font-semibold flex items-center gap-1 text-red-500 dark:text-red-400 disabled:opacity-60"
                        >
                          <RotateCcw size={11} /> {resettingId === rec!.id ? "Mereset…" : "Reset"}
                        </button>
                      ) : rec ? (
                        <>
                          <button onClick={() => openModal(w, rec)} className="text-xs font-semibold flex items-center gap-1 text-primary dark:text-primary-dark">
                            <Pencil size={12} /> Ubah
                          </button>
                          <button
                            onClick={() => resetPertemuan(rec)}
                            disabled={resettingId === rec.id}
                            className="text-[11px] font-semibold flex items-center gap-1 text-red-500 dark:text-red-400 disabled:opacity-60"
                          >
                            <RotateCcw size={11} /> {resettingId === rec.id ? "…" : "Reset"}
                          </button>
                        </>
                      ) : (
                        <button onClick={() => openModal(w)} className="text-xs font-semibold flex items-center gap-1 text-primary dark:text-primary-dark">
                          <Plus size={12} /> Buat Jadwal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={`Jadwal Minggu ${modal?.week ?? ""}`}>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Tanggal</div>
          <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Jam</div>
          <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
        </label>
        <label className="block">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Lokasi</div>
          <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="cth. Masjid Al-Wasi'i - Ruang 2" />
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setModal(null)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submit} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl max-h-[88vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dcefe2] dark:border-[#1d3527]">
          <div className="font-display text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
