"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, History, CheckCircle2 } from "lucide-react";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
type AbsenceBreakdown = { izin: string[]; sakit: string[]; tanpaKeterangan: string[] };

type Pertemuan = {
  id: string; week: number; date: string; time: string; location: string; status: string; hadirCount: number;
  absenceBreakdown: AbsenceBreakdown;
  beritaAcara: { hari: string; tanggal: string; lokasi: string; materi: string; catatan: string | null; hadir: number; tidakHadir: number } | null;
};
type Item = {
  kelompokId: string; kelompokName: string; totalPeserta: number; materiDefault: string;
  isCurrentWeek: boolean; isEmergency: boolean; pertemuan: Pertemuan;
};
type HistoryEntry = {
  id: string; week: number; kelompokName: string; hari: string; tanggal: string; lokasi: string;
  materi: string; catatan: string | null; hadir: number; tidakHadir: number;
  absenceBreakdown: AbsenceBreakdown;
};

function buildForm(item: Item) {
  const ba = item.pertemuan.beritaAcara;
  if (ba) return { hari: ba.hari, tanggal: ba.tanggal, lokasi: ba.lokasi, materi: ba.materi, catatan: ba.catatan || "" };
  return {
    hari: HARI[new Date(item.pertemuan.date).getDay()], tanggal: item.pertemuan.date,
    lokasi: item.pertemuan.location, materi: item.materiDefault, catatan: "",
  };
}

export function BeritaClient({ items, history }: { items: Item[]; history: HistoryEntry[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(items[0]?.pertemuan.id);
  const [showHistory, setShowHistory] = useState(false);
  const item = items.find((i) => i.pertemuan.id === activeId);

  const [form, setForm] = useState(() => (item ? buildForm(item) : { hari: "", tanggal: "", lokasi: "", materi: "", catatan: "" }));
  useEffect(() => { if (item) setForm(buildForm(item)); }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!item) return;
    if (!form.materi.trim()) { alert("Materi wajib diisi."); return; }
    setSaving(true);
    const res = await fetch("/api/mentor/berita-acara", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pertemuanId: item.pertemuan.id, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { alert(data.error || "Gagal menyimpan."); return; }
    router.refresh();
  };

  return (
    <div>
      {!items.length ? (
        <p className="text-sm text-gray-500">
          Belum ada jadwal untuk minggu berjalan. Buat jadwal dulu di menu Jadwal Praktikum — atau kalau ini pertemuan
          minggu lalu yang terlewat, gunakan tombol "Buka Kunci Darurat" di sidebar.
        </p>
      ) : (
        <>
          {items.length > 1 && (
            <select value={activeId} onChange={(e) => setActiveId(e.target.value)} className="mb-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-full sm:w-72">
              {items.map((i) => (
                <option key={i.pertemuan.id} value={i.pertemuan.id}>
                  {i.kelompokName} — Minggu {i.pertemuan.week}{i.isEmergency ? " (darurat)" : " (berjalan)"}
                </option>
              ))}
            </select>
          )}
          {item?.isEmergency && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg px-3 py-2 mb-4 max-w-lg">
              <AlertTriangle size={14} className="shrink-0" /> Ini pertemuan minggu lalu yang dibuka lewat kunci darurat.
            </div>
          )}
          {item && (
            <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5 max-w-lg">
              <div className="text-xs text-gray-500 mb-4">{item.kelompokName} · Minggu {item.pertemuan.week}</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hari"><input value={form.hari} onChange={(e) => setForm((f) => ({ ...f, hari: e.target.value }))} className={inputCls} /></Field>
                <Field label="Tanggal"><input type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} className={inputCls} /></Field>
              </div>
              <Field label="Lokasi"><input value={form.lokasi} onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))} className={inputCls} /></Field>
              <Field label="Materi"><input value={form.materi} onChange={(e) => setForm((f) => ({ ...f, materi: e.target.value }))} className={inputCls} /></Field>
              <Field label="Catatan"><textarea rows={3} value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="Jumlah Hadir"><input value={item.pertemuan.hadirCount} disabled className={inputCls} /></Field>
                <Field label="Jumlah Tidak Hadir"><input value={Math.max(0, item.totalPeserta - item.pertemuan.hadirCount)} disabled className={inputCls} /></Field>
              </div>
              <AbsenceDetails breakdown={item.pertemuan.absenceBreakdown} />
              <button onClick={submit} disabled={saving} className="w-full text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg py-2.5">
                {saving ? "Menyimpan…" : "Simpan & Tandai Selesai"}
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-8">
        <button onClick={() => setShowHistory((s) => !s)} className="flex items-center gap-1.5 text-sm font-bold text-on-surface mb-3">
          <History size={16} /> Riwayat Berita Acara ({history.length}) {showHistory ? "▲" : "▼"}
        </button>
        {showHistory && (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-4">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="font-semibold text-sm">{h.kelompokName} — Minggu {h.week}</div>
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 size={11} /> Selesai
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>{h.hari}, {new Date(h.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} · {h.lokasi}</div>
                  <div><b>Materi:</b> {h.materi}</div>
                  {h.catatan && <div><b>Catatan:</b> {h.catatan}</div>}
                  <div><b>Kehadiran:</b> {h.hadir} hadir · {h.tidakHadir} tidak hadir</div>
                  <AbsenceDetails breakdown={h.absenceBreakdown} />
                </div>
              </div>
            ))}
            {!history.length && <p className="text-xs text-gray-400">Belum ada berita acara yang selesai.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function AbsenceDetails({ breakdown }: { breakdown: AbsenceBreakdown }) {
  const categories = [
    ["Izin", breakdown.izin],
    ["Sakit", breakdown.sakit],
    ["Tidak ada keterangan", breakdown.tanpaKeterangan],
  ] as const;

  return (
    <div className="text-xs text-gray-500 space-y-1 mb-4">
      <div className="font-bold text-gray-600 dark:text-gray-300">Rincian tidak hadir</div>
      {categories.map(([label, people]) => (
        <div key={label}>
          <b>{label}:</b> {people.length}{people.length ? ` — ${people.join(", ")}` : ""}
        </div>
      ))}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div className="text-xs font-bold text-gray-500 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
