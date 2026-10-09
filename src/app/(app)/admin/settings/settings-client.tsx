"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useConfirmDialog } from "@/components/use-confirm-dialog";

type Settings = { appName: string; qrDurationMinutes: number; maxPhotos: number; defaultTheme: string; galeriSubtitle: string };

export function SettingsClient({ settings, hasEmergencyPassword }: { settings: Settings; hasEmergencyPassword: boolean }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) { alert("Gagal menyimpan."); return; }
    router.refresh();
  };

  const [emergencyPassword, setEmergencyPassword] = useState("");
  const [savingEmergency, setSavingEmergency] = useState(false);
  const saveEmergency = async () => {
    if (emergencyPassword.length < 6) { alert("Sandi minimal 6 karakter."); return; }
    if (!await confirm({
      title: "Ganti sandi darurat?",
      message: "Sandi lama, jika ada, tidak akan bisa dipakai lagi.",
      confirmLabel: "Ganti Sandi",
      tone: "warning",
    })) return;
    setSavingEmergency(true);
    const res = await fetch("/api/admin/settings/emergency-password", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: emergencyPassword }),
    });
    setSavingEmergency(false);
    if (!res.ok) { alert("Gagal menyimpan sandi."); return; }
    setEmergencyPassword("");
    router.refresh();
    alert("Sandi darurat berhasil disimpan.");
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5">
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
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Tema Default untuk Pengguna Baru</div>
          <select value={form.defaultTheme} onChange={(e) => setForm((f) => ({ ...f, defaultTheme: e.target.value }))} className={inputCls}>
            <option value="light">Terang (Hijau & Putih)</option>
            <option value="dark">Gelap</option>
          </select>
        </label>
        <label className="block mb-4">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Sub-judul Galeri di Halaman Depan</div>
          <input value={form.galeriSubtitle} onChange={(e) => setForm((f) => ({ ...f, galeriSubtitle: e.target.value }))} className={inputCls} placeholder="cth. Pertemuan Perdana Kelompok" />
        </label>
        <button onClick={save} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2.5">
          {saving ? "Menyimpan…" : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-amber-200 dark:border-amber-900 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400" />
          <div className="font-bold text-sm">Sandi Darurat</div>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Dipakai mentor untuk membuka kembali QR Absensi / Berita Acara pertemuan minggu lalu yang terlewat. Status saat ini:{" "}
          {hasEmergencyPassword ? <span className="font-bold text-primary dark:text-primary-dark">sudah diatur</span> : <span className="font-bold text-red-600">belum diatur</span>}.
        </p>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">{hasEmergencyPassword ? "Ganti Sandi Darurat" : "Atur Sandi Darurat"}</div>
          <input type="password" value={emergencyPassword} onChange={(e) => setEmergencyPassword(e.target.value)} className={inputCls} placeholder="Minimal 6 karakter" />
        </label>
        <button onClick={saveEmergency} disabled={savingEmergency} className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-lg px-4 py-2.5">
          {savingEmergency ? "Menyimpan…" : "Simpan Sandi Darurat"}
        </button>
      </div>
      {dialog}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary text-sm";
