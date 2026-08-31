"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type Pertemuan = {
  id: string; date: string; time: string; location: string; status: string; hadirCount: number;
  beritaAcara: { hari: string; tanggal: string; lokasi: string; materi: string; catatan: string | null; hadir: number; tidakHadir: number } | null;
} | null;
type KelompokEntry = { kelompokId: string; kelompokName: string; totalPeserta: number; pertemuan: Pertemuan };

function buildForm(e: KelompokEntry, materiDefault: string) {
  if (e.pertemuan?.beritaAcara) {
    const ba = e.pertemuan.beritaAcara;
    return { hari: ba.hari, tanggal: ba.tanggal, lokasi: ba.lokasi, materi: ba.materi, catatan: ba.catatan || "" };
  }
  if (e.pertemuan) {
    return { hari: HARI[new Date(e.pertemuan.date).getDay()], tanggal: e.pertemuan.date, lokasi: e.pertemuan.location, materi: materiDefault, catatan: "" };
  }
  return { hari: "", tanggal: "", lokasi: "", materi: "", catatan: "" };
}

export function BeritaClient({ week, materiDefault, kelompokList }: { week: number; materiDefault: string; kelompokList: KelompokEntry[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(kelompokList[0].kelompokId);
  const entry = kelompokList.find((k) => k.kelompokId === activeId)!;
  const rec = entry.pertemuan;
  const locked = rec?.status === "SELESAI";

  const [form, setForm] = useState(() => buildForm(entry, materiDefault));
  useEffect(() => { setForm(buildForm(entry, materiDefault)); }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!rec) return;
    if (!form.materi.trim()) { alert("Materi wajib diisi."); return; }
    setSaving(true);
    const res = await fetch("/api/mentor/berita-acara", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pertemuanId: rec.id, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { alert(data.error || "Gagal menyimpan."); return; }
    router.refresh();
  };

  if (!rec) {
    return (
      <div>
        {kelompokList.length > 1 && <KelompokSelect kelompokList={kelompokList} activeId={activeId} setActiveId={setActiveId} />}
        <p className="text-sm text-gray-500 mt-3">Belum ada jadwal untuk minggu ke-{week}. Buat jadwal terlebih dahulu di menu Jadwal Praktikum.</p>
      </div>
    );
  }

  return (
    <div>
      {kelompokList.length > 1 && <KelompokSelect kelompokList={kelompokList} activeId={activeId} setActiveId={setActiveId} />}
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5 max-w-lg">
        <div className="text-xs text-gray-500 mb-4">
          {entry.kelompokName} · Minggu {week}
          {locked && <span className="ml-2 text-[11px] font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark px-2 py-0.5 rounded-full">Terkunci — sudah selesai</span>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hari"><input value={form.hari} disabled={locked} onChange={(e) => setForm((f) => ({ ...f, hari: e.target.value }))} className={inputCls} /></Field>
          <Field label="Tanggal"><input type="date" value={form.tanggal} disabled={locked} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))} className={inputCls} /></Field>
        </div>
        <Field label="Lokasi"><input value={form.lokasi} disabled={locked} onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))} className={inputCls} /></Field>
        <Field label="Materi"><input value={form.materi} disabled={locked} onChange={(e) => setForm((f) => ({ ...f, materi: e.target.value }))} className={inputCls} /></Field>
        <Field label="Catatan"><textarea rows={3} value={form.catatan} disabled={locked} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Jumlah Hadir"><input value={rec.beritaAcara?.hadir ?? rec.hadirCount} disabled className={inputCls} /></Field>
          <Field label="Jumlah Tidak Hadir"><input value={rec.beritaAcara?.tidakHadir ?? Math.max(0, entry.totalPeserta - rec.hadirCount)} disabled className={inputCls} /></Field>
        </div>
        {!locked && (
          <button onClick={submit} disabled={saving} className="w-full text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg py-2.5">
            {saving ? "Menyimpan…" : "Simpan & Tandai Selesai"}
          </button>
        )}
      </div>
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

function KelompokSelect({ kelompokList, activeId, setActiveId }: { kelompokList: KelompokEntry[]; activeId: string; setActiveId: (id: string) => void }) {
  return (
    <select value={activeId} onChange={(e) => setActiveId(e.target.value)} className="mb-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-56">
      {kelompokList.map((k) => <option key={k.kelompokId} value={k.kelompokId}>{k.kelompokName}</option>)}
    </select>
  );
}
