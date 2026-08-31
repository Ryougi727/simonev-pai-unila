"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type KelompokRow = { id: string; name: string; faculty: string; mentorId: string | null; mentorName: string | null; praktikanCount: number };
type Mentor = { id: string; name: string };

const FACULTIES = ["FMIPA", "Teknik", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];

export function KelompokClient({ kelompok, mentors }: { kelompok: KelompokRow[]; mentors: Mentor[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const [modal, setModal] = useState<{ mode: "add" | "edit"; k?: KelompokRow } | null>(null);
  const [form, setForm] = useState({ name: "", faculty: FACULTIES[0], mentorId: "" });
  const [saving, setSaving] = useState(false);

  const assignedMentorIds = new Set(kelompok.filter((k) => k.mentorId).map((k) => k.mentorId));
  const availableMentors = (currentMentorId?: string | null) =>
    mentors.filter((m) => !assignedMentorIds.has(m.id) || m.id === currentMentorId);

  const openAdd = () => { setForm({ name: "", faculty: FACULTIES[0], mentorId: "" }); setModal({ mode: "add" }); };
  const openEdit = (k: KelompokRow) => { setForm({ name: k.name, faculty: k.faculty, mentorId: k.mentorId || "" }); setModal({ mode: "edit", k }); };

  const submit = async () => {
    if (!form.name.trim()) { alert("Nama kelompok wajib diisi."); return; }
    setSaving(true);
    const url = modal?.mode === "edit" ? `/api/admin/kelompok/${modal.k!.id}` : "/api/admin/kelompok";
    const method = modal?.mode === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, faculty: form.faculty, mentorId: form.mentorId || null }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); alert(d.error || "Gagal menyimpan."); return; }
    setModal(null);
    refresh();
  };

  const remove = async (k: KelompokRow) => {
    const warn = k.praktikanCount > 0
      ? `Kelompok "${k.name}" memiliki ${k.praktikanCount} praktikan dan riwayat pertemuan. Menghapus kelompok akan menghapus semuanya juga. Lanjutkan?`
      : `Hapus kelompok "${k.name}"?`;
    if (!confirm(warn)) return;
    const res = await fetch(`/api/admin/kelompok/${k.id}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus."); return; }
    refresh();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2">
          <Plus size={14} /> Tambah Kelompok
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Kelompok</th>
              <th className="px-4 py-2.5 font-bold">Fakultas</th>
              <th className="px-4 py-2.5 font-bold">Mentor</th>
              <th className="px-4 py-2.5 font-bold">Praktikan</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {kelompok.map((k) => (
              <tr key={k.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                <td className="px-4 py-2.5 font-semibold">{k.name}</td>
                <td className="px-4 py-2.5">{k.faculty}</td>
                <td className="px-4 py-2.5">{k.mentorName || <span className="text-gray-400">Belum ditentukan</span>}</td>
                <td className="px-4 py-2.5">{k.praktikanCount} orang</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => openEdit(k)} className="text-xs font-semibold flex items-center gap-1 text-gray-500 px-2 py-1"><Pencil size={12} /> Edit</button>
                    <button onClick={() => remove(k)} className="text-xs font-semibold flex items-center gap-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg"><Trash2 size={12} /> Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {!kelompok.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada kelompok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Kelompok" : "Tambah Kelompok"}>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Nama Kelompok</div>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="cth. Kelompok 6" />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Fakultas</div>
          <select value={form.faculty} onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary">
            {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="block">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Mentor Pembimbing</div>
          <select value={form.mentorId} onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary">
            <option value="">Belum ditentukan</option>
            {availableMentors(modal?.k?.mentorId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="text-[11px] text-gray-400 mt-1">Hanya mentor tanpa kelompok yang muncul di sini.</div>
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
