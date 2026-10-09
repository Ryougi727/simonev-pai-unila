"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Upload, ImageIcon } from "lucide-react";
import { resizeImageToBlob } from "@/lib/image";
import { useConfirmDialog } from "@/components/use-confirm-dialog";

type Photo = { id: string; url: string };
type BeritaRow = {
  id: string; title: string; excerpt: string | null; content: string; category: string;
  eventDate: string; published: boolean; photos: Photo[]; createdAt: string;
};

const CATEGORIES = ["Berita", "Kajian", "Acara", "Pengumuman"];

export function BeritaClient({ items }: { items: BeritaRow[] }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const refresh = () => router.refresh();

  const [modal, setModal] = useState<{ mode: "add" | "edit"; item?: BeritaRow } | null>(null);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", category: "Berita", eventDate: "", published: true });
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setForm({ title: "", excerpt: "", content: "", category: "Berita", eventDate: "", published: true });
    setExistingPhotos([]); setNewFiles([]); setNewPreviews([]);
    setModal({ mode: "add" });
  };
  const openEdit = (item: BeritaRow) => {
    setForm({ title: item.title, excerpt: item.excerpt || "", content: item.content, category: item.category, eventDate: item.eventDate, published: item.published });
    setExistingPhotos(item.photos); setNewFiles([]); setNewPreviews([]);
    setModal({ mode: "edit", item });
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewFiles((f) => [...f, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews((p) => [...p, ev.target!.result as string]);
      reader.readAsDataURL(f);
    });
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeNewFile = (idx: number) => {
    setNewFiles((f) => f.filter((_, i) => i !== idx));
    setNewPreviews((p) => p.filter((_, i) => i !== idx));
  };
  const removeExistingPhoto = async (photoId: string) => {
    if (!modal?.item) return;
    if (!await confirm({
      title: "Hapus foto berita?",
      message: "Foto ini akan dihapus dari berita.",
      confirmLabel: "Hapus Foto",
    })) return;
    const res = await fetch(`/api/admin/berita/${modal.item.id}/foto/${photoId}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus foto."); return; }
    setExistingPhotos((p) => p.filter((x) => x.id !== photoId));
    refresh();
  };

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) { alert("Judul dan isi wajib diisi."); return; }
    setSaving(true);
    try {
      const blobs = await Promise.all(newFiles.map((f) => resizeImageToBlob(f, 1200, 0.75)));
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("excerpt", form.excerpt);
      fd.append("content", form.content);
      fd.append("category", form.category);
      fd.append("eventDate", form.eventDate);
      fd.append("published", String(form.published));
      blobs.forEach((b, i) => fd.append("photos", b, `foto-${i}.jpg`));

      const url = modal?.mode === "edit" ? `/api/admin/berita/${modal.item!.id}` : "/api/admin/berita";
      const method = modal?.mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      setSaving(false);
      if (!res.ok) { alert(data.error || "Gagal menyimpan."); return; }
      setModal(null);
      refresh();
    } catch {
      setSaving(false);
      alert("Gagal memproses foto.");
    }
  };

  const remove = async (item: BeritaRow) => {
    if (!await confirm({
      title: `Hapus berita "${item.title}"?`,
      message: "Foto-foto yang terlampir pada berita ini juga akan terhapus.",
      confirmLabel: "Hapus Berita",
    })) return;
    const res = await fetch(`/api/admin/berita/${item.id}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus."); return; }
    refresh();
  };

  const togglePublish = async (item: BeritaRow) => {
    const fd = new FormData();
    fd.append("title", item.title);
    fd.append("excerpt", item.excerpt || "");
    fd.append("content", item.content);
    fd.append("category", item.category);
    fd.append("eventDate", item.eventDate);
    fd.append("published", String(!item.published));
    const res = await fetch(`/api/admin/berita/${item.id}`, { method: "PATCH", body: fd });
    if (!res.ok) { alert("Gagal mengubah status."); return; }
    refresh();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2">
          <Plus size={14} /> Tambah Berita
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-4 flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 flex items-center justify-center">
              {item.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photos[0].url} alt="" className="w-full h-full object-cover" />
              ) : <ImageIcon size={22} className="text-gray-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{item.category}</span>
                {item.published
                  ? <span className="text-[11px] font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark px-2 py-0.5 rounded-full">Terbit</span>
                  : <span className="text-[11px] font-bold bg-gray-100 dark:bg-white/10 text-gray-500 px-2 py-0.5 rounded-full">Draft</span>}
                {item.eventDate && <span className="text-[11px] text-gray-400">Acara: {new Date(item.eventDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>}
              </div>
              <div className="font-semibold text-sm truncate">{item.title}</div>
              <div className="text-xs text-gray-500 truncate">{item.excerpt || item.content}</div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => openEdit(item)} className="text-xs font-semibold flex items-center gap-1 text-gray-500 px-2 py-1"><Pencil size={12} /> Edit</button>
              <button onClick={() => togglePublish(item)} className="text-xs font-semibold text-gray-500 px-2 py-1">{item.published ? "Jadikan Draft" : "Terbitkan"}</button>
              <button onClick={() => remove(item)} className="text-xs font-semibold flex items-center gap-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg"><Trash2 size={12} /> Hapus</button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-10 text-center text-gray-400 text-xs">
            Belum ada berita. Klik "Tambah Berita" untuk mulai mengisi halaman depan.
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Berita" : "Tambah Berita"} width={560}>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Judul</div>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="cth. Grand Opening Praktikum PAI Semester Ganjil 2026" />
        </label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Kategori</div>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Tanggal Acara (opsional)</div>
            <input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
          </label>
        </div>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Ringkasan Singkat (opsional)</div>
          <input value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="Muncul di kartu daftar berita" />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Isi Berita</div>
          <textarea rows={6} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
        </label>

        <div className="mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Foto</div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {existingPhotos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#dcefe2] dark:border-[#1d3527]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeExistingPhoto(p.id)} className="absolute top-1 right-1 bg-black/55 rounded-full w-5 h-5 flex items-center justify-center text-white"><X size={11} /></button>
              </div>
            ))}
            {newPreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#dcefe2] dark:border-[#1d3527]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded">Baru</span>
                <button onClick={() => removeNewFile(i)} className="absolute top-1 right-1 bg-black/55 rounded-full w-5 h-5 flex items-center justify-center text-white"><X size={11} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2">
            <Upload size={13} /> Tambah Foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
        </div>

        <label className="flex items-center gap-2 text-sm mb-5">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
          Terbitkan langsung ke halaman depan
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={() => setModal(null)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submit} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </Modal>
      {dialog}
    </div>
  );
}

function Modal({ open, onClose, title, width = 440, children }: { open: boolean; onClose: () => void; title: string; width?: number; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div style={{ maxWidth: width }} className="w-full bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl max-h-[88vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dcefe2] dark:border-[#1d3527]">
          <div className="font-display text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
