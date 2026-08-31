"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = { appName: string; qrDurationMinutes: number; maxPhotos: number; defaultTheme: string };

export function SettingsClient({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) { alert("Gagal menyimpan."); return; }
    router.refresh();
  };

  return (
    <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5 max-w-lg">
      <label className="block mb-3">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Nama Aplikasi</div>
        <input value={form.appName} onChange={(e) => setForm((f) => ({ ...f, appName: e.target.value }))} className={inputCls} />
      </label>
      <label className="block mb-3">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Durasi QR Absensi (menit)</div>
        <input type="number" min={1} max={60} value={form.qrDurationMinutes} onChange={(e) => setForm((f) => ({ ...f, qrDurationMinutes: Number(e.target.value) }))} className={inputCls} />
        <div className="text-[11px] text-gray-400 mt-1">QR akan otomatis nonaktif setelah durasi ini berakhir.</div>
      </label>
      <label className="block mb-3">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Maksimal Foto Dokumentasi per Pertemuan</div>
        <input type="number" min={1} max={10} value={form.maxPhotos} onChange={(e) => setForm((f) => ({ ...f, maxPhotos: Number(e.target.value) }))} className={inputCls} />
      </label>
      <label className="block mb-4">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Tema Default untuk Pengguna Baru</div>
        <select value={form.defaultTheme} onChange={(e) => setForm((f) => ({ ...f, defaultTheme: e.target.value }))} className={inputCls}>
          <option value="light">Terang (Hijau & Putih)</option>
          <option value="dark">Gelap</option>
        </select>
      </label>
      <button onClick={save} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2.5">
        {saving ? "Menyimpan…" : "Simpan Pengaturan"}
      </button>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary text-sm";
