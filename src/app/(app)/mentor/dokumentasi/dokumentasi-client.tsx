"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { resizeImageToBlob } from "@/lib/image";

type Photo = { id: string; url: string };
type Pertemuan = { id: string; week: number; photos: Photo[] };
type Kelompok = { id: string; name: string; pertemuan: Pertemuan[] };

export function DokumentasiClient({ maxPhotos, kelompokList }: { maxPhotos: number; kelompokList: Kelompok[] }) {
  const router = useRouter();
  const [activeKId, setActiveKId] = useState(kelompokList[0].id);
  const kelompok = kelompokList.find((k) => k.id === activeKId)!;
  const [activePId, setActivePId] = useState(kelompok.pertemuan[0]?.id);
  const pertemuan = kelompok.pertemuan.find((p) => p.id === activePId) || kelompok.pertemuan[0];
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onKelompokChange = (id: string) => {
    setActiveKId(id);
    const kl = kelompokList.find((k) => k.id === id)!;
    setActivePId(kl.pertemuan[0]?.id);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !pertemuan) return;
    const room = maxPhotos - pertemuan.photos.length;
    if (room <= 0) { alert(`Maksimal ${maxPhotos} foto per pertemuan.`); return; }
    setUploading(true);
    try {
      const blobs = await Promise.all(files.slice(0, room).map((f) => resizeImageToBlob(f)));
      const fd = new FormData();
      fd.append("pertemuanId", pertemuan.id);
      blobs.forEach((b, i) => fd.append("photos", b, `photo-${i}.jpg`));
      const res = await fetch("/api/mentor/dokumentasi", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Gagal mengunggah.");
      else router.refresh();
    } catch {
      alert("Gagal memproses foto.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (photoId: string) => {
    if (!confirm("Hapus foto ini?")) return;
    const res = await fetch(`/api/mentor/dokumentasi/${photoId}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus."); return; }
    router.refresh();
  };

  if (!pertemuan) {
    return (
      <div>
        {kelompokList.length > 1 && <KelompokSelect kelompokList={kelompokList} activeId={activeKId} onChange={onKelompokChange} />}
        <p className="text-sm text-gray-500 mt-3">Belum ada pertemuan terjadwal.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-2">
          {kelompokList.length > 1 && <KelompokSelect kelompokList={kelompokList} activeId={activeKId} onChange={onKelompokChange} />}
          <select value={activePId} onChange={(e) => setActivePId(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-36">
            {kelompok.pertemuan.map((p) => <option key={p.id} value={p.id}>Minggu {p.week}</option>)}
          </select>
        </div>
        {pertemuan.photos.length < maxPhotos && (
          <>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-xs font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark rounded-lg px-3 py-2 disabled:opacity-60">
              <Upload size={14} /> {uploading ? "Mengunggah…" : "Unggah Foto"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
          </>
        )}
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5">
        <div className="text-xs text-gray-500 mb-3">{kelompok.name} · Minggu {pertemuan.week} · {pertemuan.photos.length}/{maxPhotos} foto</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {pertemuan.photos.map((p) => (
            <div key={p.id} className="relative rounded-lg overflow-hidden border border-[#dcefe2] dark:border-[#1d3527] aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => remove(p.id)} className="absolute top-1.5 right-1.5 bg-black/55 rounded-full w-5 h-5 flex items-center justify-center text-white">
                <X size={11} />
              </button>
            </div>
          ))}
          {!pertemuan.photos.length && (
            <div className="col-span-full text-center text-gray-400 text-xs py-8">Belum ada foto dokumentasi untuk pertemuan ini.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function KelompokSelect({ kelompokList, activeId, onChange }: { kelompokList: Kelompok[]; activeId: string; onChange: (id: string) => void }) {
  return (
    <select value={activeId} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-44">
      {kelompokList.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
    </select>
  );
}