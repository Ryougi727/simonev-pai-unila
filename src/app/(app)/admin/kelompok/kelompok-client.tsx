"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Sparkles } from "lucide-react";
import { SearchableMultiSelect } from "@/components/searchable-multi-select";

type KelompokRow = { id: string; name: string; faculty: string; mentorIds: string[]; mentorNames: string[]; praktikanCount: number };
type Mentor = { id: string; name: string };
type Praktikan = { id: string; npm: string; name: string; kelompokId: string | null };

const FACULTIES = ["FMIPA", "Teknik", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];

export function KelompokClient({ kelompok, mentors, praktikan }: { kelompok: KelompokRow[]; mentors: Mentor[]; praktikan: Praktikan[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const [modal, setModal] = useState<{ mode: "add" | "edit"; k?: KelompokRow } | null>(null);
  const [form, setForm] = useState({ name: "", faculty: FACULTIES[0], mentorIds: [] as string[], praktikanIds: [] as string[] });
  const [saving, setSaving] = useState(false);

  const assignedMentorIds = new Set(kelompok.flatMap((k) => k.mentorIds));

  const openAdd = () => {
    setForm({ name: "", faculty: FACULTIES[0], mentorIds: [], praktikanIds: [] });
    setModal({ mode: "add" });
  };
  const openEdit = (k: KelompokRow) => {
    const currentMembers = praktikan.filter((p) => p.kelompokId === k.id).map((p) => p.id);
    setForm({ name: k.name, faculty: k.faculty, mentorIds: k.mentorIds, praktikanIds: currentMembers });
    setModal({ mode: "edit", k });
  };

  // mentors already assigned elsewhere are excluded, except the ones this kelompok already has
  const mentorOptions = mentors
    .filter((m) => !assignedMentorIds.has(m.id) || form.mentorIds.includes(m.id))
    .map((m) => ({ id: m.id, label: m.name }));

  // praktikan already in another kelompok are excluded — move them via that kelompok's edit first
  const praktikanOptions = praktikan
    .filter((p) => !p.kelompokId || p.kelompokId === modal?.k?.id)
    .map((p) => ({ id: p.id, label: p.name, sublabel: p.npm }));

  const submit = async () => {
    if (!form.name.trim()) { alert("Nama kelompok wajib diisi."); return; }
    setSaving(true);
    const url = modal?.mode === "edit" ? `/api/admin/kelompok/${modal.k!.id}` : "/api/admin/kelompok";
    const method = modal?.mode === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, faculty: form.faculty, mentorId: form.mentorIds, praktikanIds: form.praktikanIds }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); alert(d.error || "Gagal menyimpan."); return; }
    setModal(null);
    refresh();
  };

  const remove = async (k: KelompokRow) => {
    const warn = k.praktikanCount > 0
      ? `Kelompok "${k.name}" memiliki ${k.praktikanCount} praktikan. Praktikan TIDAK akan terhapus, tapi jadi tidak berkelompok. Riwayat pertemuan kelompok ini akan terhapus. Lanjutkan?`
      : `Hapus kelompok "${k.name}"?`;
    if (!confirm(warn)) return;
    const res = await fetch(`/api/admin/kelompok/${k.id}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus."); return; }
    refresh();
  };

  /* ---------------- generate massal (poin 3) ---------------- */
  const [genOpen, setGenOpen] = useState(false);
  const [genMode, setGenMode] = useState<"manual" | "auto-mentor">("manual");
  const [genForm, setGenForm] = useState({ faculty: FACULTIES[0], prefix: "Kelompok", startNumber: kelompok.length + 1, count: 5, autoAssignMentor: true });
  const [generating, setGenerating] = useState(false);
  const availableMentorCount = mentors.filter((m) => !assignedMentorIds.has(m.id)).length;

  const openGenerate = () => {
    setGenMode("manual");
    setGenForm({ faculty: FACULTIES[0], prefix: "Kelompok", startNumber: kelompok.length + 1, count: 5, autoAssignMentor: true });
    setGenOpen(true);
  };

  const submitGenerate = async () => {
    setGenerating(true);
    const res = await fetch("/api/admin/kelompok/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...genForm, mode: genMode }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) { alert(data.error || "Gagal generate kelompok."); return; }
    setGenOpen(false);
    alert(`${data.created} kelompok berhasil dibuat: ${data.names.join(", ")}`);
    refresh();
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={openGenerate} className="flex items-center gap-1.5 text-xs font-bold border border-primary/40 text-primary dark:text-primary-dark rounded-lg px-3 py-2">
          <Sparkles size={14} /> Generate Kelompok
        </button>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2">
          <Plus size={14} /> Tambah Kelompok
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
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
                <td className="px-4 py-2.5">{k.mentorNames.length ? k.mentorNames.join(", ") : <span className="text-gray-400">Belum ditentukan</span>}</td>
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
      </div>

      {/* Add/Edit modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Kelompok" : "Tambah Kelompok"} width={520}>
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
        <div className="mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Mentor Pembimbing (maks. 2)</div>
          <SearchableMultiSelect
            options={mentorOptions}
            selectedIds={form.mentorIds}
            onChange={(ids) => setForm((f) => ({ ...f, mentorIds: ids }))}
            placeholder="Pilih mentor…"
            searchPlaceholder="Cari nama mentor…"
            maxSelected={2}
            emptyText="Semua mentor sudah punya kelompok."
          />
          <div className="text-[11px] text-gray-400 mt-1">Hanya mentor tanpa kelompok (atau sudah di kelompok ini) yang muncul.</div>
        </div>
        <div className="mb-1">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Praktikan dalam Kelompok</div>
          <SearchableMultiSelect
            options={praktikanOptions}
            selectedIds={form.praktikanIds}
            onChange={(ids) => setForm((f) => ({ ...f, praktikanIds: ids }))}
            placeholder="Pilih praktikan…"
            searchPlaceholder="Cari nama atau NPM…"
            emptyText="Tidak ada praktikan yang bisa dipilih."
          />
          <div className="text-[11px] text-gray-400 mt-1">Hanya praktikan yang belum berkelompok (atau sudah di kelompok ini) yang muncul di sini.</div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setModal(null)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submit} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Generate modal */}
      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Kelompok" width={480}>
        <div className="flex gap-2 mb-4">
          {(["manual", "auto-mentor"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setGenMode(m)}
              className={`flex-1 text-xs font-bold px-3 py-2.5 rounded-lg border ${
                genMode === m ? "border-primary bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark" : "border-gray-300 dark:border-gray-700 text-gray-500"
              }`}
            >
              {m === "manual" ? "Jumlah Manual" : "Otomatis Sesuai Mentor"}
            </button>
          ))}
        </div>

        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Fakultas</div>
          <select value={genForm.faculty} onChange={(e) => setGenForm((f) => ({ ...f, faculty: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary">
            {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Prefix Nama</div>
            <input value={genForm.prefix} onChange={(e) => setGenForm((f) => ({ ...f, prefix: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="Kelompok" />
          </label>
          <label className="block">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Mulai dari Nomor</div>
            <input type="number" min={1} value={genForm.startNumber} onChange={(e) => setGenForm((f) => ({ ...f, startNumber: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
          </label>
        </div>

        {genMode === "manual" ? (
          <label className="block mb-4">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Jumlah Kelompok</div>
            <input type="number" min={1} max={100} value={genForm.count} onChange={(e) => setGenForm((f) => ({ ...f, count: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
          </label>
        ) : (
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 mb-1.5">Jumlah Kelompok</div>
            <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 text-sm">
              {availableMentorCount} kelompok — sesuai jumlah mentor aktif yang belum punya kelompok
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm">
              <input type="checkbox" checked={genForm.autoAssignMentor} onChange={(e) => setGenForm((f) => ({ ...f, autoAssignMentor: e.target.checked }))} />
              Langsung tugaskan satu mentor ke tiap kelompok yang dibuat
            </label>
          </div>
        )}

        <div className="text-[11px] text-gray-400 mb-4">
          Contoh nama yang dihasilkan: <b>{genForm.prefix || "Kelompok"} {genForm.startNumber}</b>, <b>{genForm.prefix || "Kelompok"} {genForm.startNumber + 1}</b>, dst. Praktikan tidak di-assign di sini — lakukan lewat tombol Edit setelah kelompok dibuat.
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => setGenOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submitGenerate} disabled={generating || (genMode === "auto-mentor" && availableMentorCount === 0)} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg px-4 py-2">
            {generating ? "Membuat…" : "Buat Kelompok"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 440 }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number }) {
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
