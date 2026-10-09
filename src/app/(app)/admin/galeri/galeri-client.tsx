"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { resizeImageToBlob } from "@/lib/image";
import { useConfirmDialog } from "@/components/use-confirm-dialog";

const MAX_GALERI = 10;

export function GaleriClient({ fotos, subtitle }: { fotos: { id: string; url: string }[]; subtitle: string }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [sub, setSub] = useState(subtitle);
  const [savingSub, setSavingSub] = useState(false);

  const room = MAX_GALERI - fotos.length;

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (room <= 0) { alert(`Galeri sudah penuh (maksimal ${MAX_GALERI} foto). Hapus foto lama dulu.`); return; }
    setUploading(true);
    try {
      const blobs = await Promise.all(files.slice(0, room).map((f) => resizeImageToBlob(f, 1400, 0.78)));
      const fd = new FormData();
      blobs.forEach((b, i) => fd.append("photos", b, `galeri-${i}.jpg`));
      const res = await fetch("/api/admin/galeri", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Gagal mengunggah.");
      else {
        if (files.length > room) alert(`Hanya ${room} foto yang masuk karena batas maksimal ${MAX_GALERI}.`);
        router.refresh();
      }
    } catch {
      alert("Gagal memproses foto.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (id: string) => {
    if (!await confirm({
      title: "Hapus foto dari galeri?",
      message: "Foto ini akan dihapus permanen dari galeri.",
      confirmLabel: "Hapus Foto",
    })) return;
    const res = await fetch(`/api/admin/galeri/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus."); return; }
    router.refresh();
  };

  const saveSubtitle = async () => {
    if (!sub.trim()) { alert("Sub-judul tidak boleh kosong."); return; }
    setSavingSub(true);
    const res = await fetch("/api/admin/galeri/subtitle", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtitle: sub }),
    });
    setSavingSub(false);
    if (!res.ok) { alert("Gagal menyimpan sub-judul."); return; }
    router.refresh();
    alert("Sub-judul galeri disimpan.");
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Sub-judul Galeri (tampil di bawah judul "Galeri")</div>
        <div className="flex gap-2">
          <input value={sub} onChange={(e) => setSub(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary text-sm" placeholder="cth. Pertemuan Perdana Kelompok" />
          <button onClick={saveSubtitle} disabled={savingSub} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2 shrink-0">
            {savingSub ? "…" : "Simpan"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold">Foto ({fotos.length}/{MAX_GALERI})</div>
          {room > 0 && (
            <>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark rounded-lg px-3 py-2 disabled:opacity-60">
                <Upload size={13} /> {uploading ? "Mengunggah…" : "Tambah Foto"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
            </>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fotos.map((f) => (
            <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#dcefe2] dark:border-[#1d3527]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => remove(f.id)} className="absolute top-1.5 right-1.5 bg-black/55 rounded-full w-6 h-6 flex items-center justify-center text-white"><X size={13} /></button>
            </div>
          ))}
          {!fotos.length && <div className="col-span-full text-center text-gray-400 text-xs py-10">Belum ada foto galeri.</div>}
        </div>
        {room <= 0 && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-3">Galeri penuh — hapus salah satu foto untuk menambah yang baru.</p>}
      </div>
      {dialog}
    </div>
  );
}
