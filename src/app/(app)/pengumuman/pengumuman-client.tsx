"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Paperclip, Trash2, X, FileText } from "lucide-react";

type Item = {
  id: string; title: string; body: string; targetFaculty: string | null;
  attachmentUrl: string | null; attachmentName: string | null;
  authorName: string; authorId: string; createdAt: string;
};

export function PengumumanClient({
  canPost, role, currentUserId, faculties, items,
}: {
  canPost: boolean; role: string; currentUserId: string; faculties: string[]; items: Item[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetFaculty, setTargetFaculty] = useState(""); // "" = semua fakultas (admin only)
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setTitle(""); setBody(""); setTargetFaculty(""); setFile(null); };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > 8 * 1024 * 1024) { alert("Ukuran file maksimal 8MB."); e.target.value = ""; return; }
    setFile(f);
  };

  const submit = async () => {
    if (!title.trim() || !body.trim()) { alert("Judul dan isi wajib diisi."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("body", body);
    if (role === "ADMIN") fd.append("targetFaculty", targetFaculty);
    if (file) fd.append("attachment", file);
    const res = await fetch("/api/pengumuman", { method: "POST", body: fd });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { alert(data.error || "Gagal membuat pengumuman."); return; }
    setModalOpen(false); reset();
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    const res = await fetch(`/api/pengumuman/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Gagal menghapus."); return; }
    router.refresh();
  };

  return (
    <div>
      {canPost && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg px-4 py-2.5">
            <Plus size={15} /> Buat Pengumuman
          </button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((it) => {
          const canDelete = role === "ADMIN" || it.authorId === currentUserId;
          return (
            <div key={it.id} className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div className="font-display text-base font-semibold">{it.title}</div>
                {canDelete && (
                  <button onClick={() => remove(it.id)} className="text-red-600 dark:text-red-400 shrink-0"><Trash2 size={15} /></button>
                )}
              </div>
              <div className="text-[11px] text-gray-400 mb-3">
                {it.authorName} · {new Date(it.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {" · "}{it.targetFaculty ? it.targetFaculty : "Semua Fakultas"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-3">{it.body}</div>
              {it.attachmentUrl && (
                <a href={it.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark rounded-lg px-3 py-2">
                  <FileText size={13} /> {it.attachmentName || "Lampiran"}
                </a>
              )}
            </div>
          );
        })}
        {!items.length && (
          <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-10 text-center text-gray-400 text-xs">
            Belum ada pengumuman.
          </div>
        )}
      </div>

      {canPost && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Buat Pengumuman">
          <label className="block mb-3">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Judul</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="cth. Kajian Pengganti Pertemuan Minggu 5" />
          </label>
          <label className="block mb-3">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Isi Pengumuman</div>
            <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} className={inputCls} placeholder="Tulis pengumuman di sini…" />
          </label>
          {role === "ADMIN" && (
            <label className="block mb-3">
              <div className="text-xs font-bold text-gray-500 mb-1.5">Ditujukan Untuk</div>
              <select value={targetFaculty} onChange={(e) => setTargetFaculty(e.target.value)} className={inputCls}>
                <option value="">Semua Fakultas</option>
                {faculties.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
          )}
          {role === "PJ" && (
            <div className="text-[11px] text-gray-400 mb-3">Pengumuman ini otomatis hanya tampil untuk fakultas Anda.</div>
          )}
          <label className="block mb-4">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Lampiran (opsional — cth. modul, materi kajian)</div>
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2">
              <Paperclip size={13} /> {file ? file.name : "Pilih File"}
            </button>
            <input ref={fileRef} type="file" hidden onChange={onPickFile} />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
            <button onClick={submit} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
              {saving ? "Mengirim…" : "Kirim Pengumuman"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary text-sm";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl max-h-[88vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dcefe2] dark:border-[#1d3527]">
          <div className="font-display text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
