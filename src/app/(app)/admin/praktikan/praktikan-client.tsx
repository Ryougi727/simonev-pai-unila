"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Plus, Upload, Trash2, X, FileSpreadsheet } from "lucide-react";

type PraktikanRow = {
  id: string; npm: string; name: string; fakultas: string; jurusan: string; prodi: string;
  kelompokId: string | null; kelompokName: string | null;
};
type Kelompok = { id: string; name: string };
type ImportRow = { npm: string; name: string; fakultas: string; jurusan: string; prodi: string };

// Saat ini hanya Fakultas Teknik yang melaksanakan praktikum PAI, jadi ini dipakai
// sebagai default form — tetap bisa diganti manual kalau nanti fakultas lain menyusul.
const DEFAULT_FAKULTAS = "Teknik";
const FAKULTAS_OPTIONS = ["Teknik", "FMIPA", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];

export function PraktikanClient({ praktikan, kelompok }: { praktikan: PraktikanRow[]; kelompok: Kelompok[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const [filterK, setFilterK] = useState("all");
  const list =
    filterK === "all" ? praktikan :
    filterK === "none" ? praktikan.filter((p) => !p.kelompokId) :
    praktikan.filter((p) => p.kelompokId === filterK);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ npm: "", name: "", fakultas: DEFAULT_FAKULTAS, jurusan: "", prodi: "", kelompokId: "" });
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: { npm: string; name: string; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitAdd = async () => {
    if (!addForm.npm.trim() || !addForm.name.trim() || !addForm.fakultas.trim() || !addForm.jurusan.trim() || !addForm.prodi.trim()) {
      alert("NPM, nama, fakultas, jurusan, dan prodi wajib diisi.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/praktikan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, kelompokId: addForm.kelompokId || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { alert(data.error || "Gagal menyimpan."); return; }
    setAddOpen(false);
    refresh();
  };

  const remove = async (p: PraktikanRow) => {
    if (!confirm(`Hapus praktikan "${p.name}"?`)) return;
    const res = await fetch(`/api/admin/praktikan/${p.id}`, { method: "DELETE" });
    if (!res.ok) { alert("Gagal menghapus."); return; }
    refresh();
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { NPM: "2311001", Nama: "Contoh Nama Satu", Fakultas: "Teknik", Jurusan: "Teknik Elektro", Prodi: "S1 Teknik Elektro" },
      { NPM: "2311002", Nama: "Contoh Nama Dua", Fakultas: "Teknik", Jurusan: "Teknik Informatika", Prodi: "S1 Teknik Informatika" },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "template-praktikan.xlsx");
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      const norm = (row: Record<string, any>, keys: string[]) => {
        for (const k of Object.keys(row)) if (keys.includes(k.trim().toLowerCase())) return String(row[k] ?? "").trim();
        return "";
      };
      const rows: ImportRow[] = raw
        .map((r) => ({
          npm: norm(r, ["npm"]),
          name: norm(r, ["nama", "name"]),
          fakultas: norm(r, ["fakultas", "faculty"]) || DEFAULT_FAKULTAS,
          jurusan: norm(r, ["jurusan"]),
          prodi: norm(r, ["prodi", "program studi"]),
        }))
        .filter((r) => r.npm || r.name);
      if (!rows.length) { setImportError("Tidak ada baris dengan kolom 'NPM'/'Nama' yang terisi."); return; }
      setImportRows(rows);
    } catch {
      setImportError("Gagal membaca file. Pastikan formatnya .xlsx atau .csv.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitImport = async () => {
    setImporting(true);
    const res = await fetch("/api/admin/praktikan/bulk-import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: importRows }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { setImportError(data.error || "Gagal mengimpor."); return; }
    setImportOpen(false);
    setImportRows([]);
    setBulkResult(data);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <select value={filterK} onChange={(e) => setFilterK(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-56">
          <option value="all">Semua Kelompok</option>
          <option value="none">Belum Berkelompok</option>
          {kelompok.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => { setImportError(""); setImportRows([]); setImportOpen(true); }} className="flex items-center gap-1.5 text-xs font-bold border border-[#dcefe2] dark:border-[#1d3527] rounded-lg px-3 py-2">
            <Upload size={14} /> Impor Excel
          </button>
          <button onClick={() => { setAddForm({ npm: "", name: "", fakultas: DEFAULT_FAKULTAS, jurusan: "", prodi: "", kelompokId: "" }); setAddOpen(true); }} className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2">
            <Plus size={14} /> Tambah Praktikan
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">NPM</th>
              <th className="px-4 py-2.5 font-bold">Nama</th>
              <th className="px-4 py-2.5 font-bold">Fakultas</th>
              <th className="px-4 py-2.5 font-bold">Jurusan</th>
              <th className="px-4 py-2.5 font-bold">Prodi</th>
              <th className="px-4 py-2.5 font-bold">Kelompok</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                <td className="px-4 py-2.5 whitespace-nowrap">{p.npm}</td>
                <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{p.name}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{p.fakultas}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{p.jurusan}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{p.prodi}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {p.kelompokName || <span className="text-gray-400">Belum berkelompok</span>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end">
                    <button onClick={() => remove(p)} className="text-xs font-semibold flex items-center gap-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg"><Trash2 size={12} /> Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-xs">Tidak ada praktikan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Praktikan">
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">NPM</div>
          <input value={addForm.npm} onChange={(e) => setAddForm((f) => ({ ...f, npm: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Nama</div>
          <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Fakultas</div>
          <select value={addForm.fakultas} onChange={(e) => setAddForm((f) => ({ ...f, fakultas: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary">
            {FAKULTAS_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Jurusan</div>
          <input value={addForm.jurusan} onChange={(e) => setAddForm((f) => ({ ...f, jurusan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="cth. Teknik Elektro" />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Program Studi</div>
          <input value={addForm.prodi} onChange={(e) => setAddForm((f) => ({ ...f, prodi: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="cth. S1 Teknik Elektro" />
        </label>
        <label className="block">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Kelompok (opsional)</div>
          <select value={addForm.kelompokId} onChange={(e) => setAddForm((f) => ({ ...f, kelompokId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary">
            <option value="">Belum ditentukan</option>
            {kelompok.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
          <div className="text-[11px] text-gray-400 mt-1">Bisa juga di-assign belakangan lewat Manajemen Kelompok.</div>
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setAddOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submitAdd} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Impor Praktikan dari Excel" width={620}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">Kolom wajib: <b>NPM</b>, <b>Nama</b>, <b>Fakultas</b>, <b>Jurusan</b>, <b>Prodi</b>. Semua praktikan masuk sebagai <b>belum berkelompok</b> — assign kelompoknya lewat menu Manajemen Kelompok.</p>
          <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-dark shrink-0">
            <FileSpreadsheet size={13} /> Unduh Template
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChosen} className="text-sm mb-3" />
        {importError && <div className="text-red-600 text-xs font-semibold mb-2">{importError}</div>}
        {importRows.length > 0 && (
          <div className="max-h-56 overflow-y-auto border border-[#dcefe2] dark:border-[#1d3527] rounded-lg mb-3">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-400"><th className="px-2 py-1.5">NPM</th><th className="px-2 py-1.5">Nama</th><th className="px-2 py-1.5">Fakultas</th><th className="px-2 py-1.5">Jurusan</th><th className="px-2 py-1.5">Prodi</th></tr></thead>
              <tbody>
                {importRows.map((r, i) => (
                  <tr key={i} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                    <td className="px-2 py-1.5">{r.npm}</td><td className="px-2 py-1.5">{r.name}</td>
                    <td className="px-2 py-1.5">{r.fakultas}</td><td className="px-2 py-1.5">{r.jurusan}</td><td className="px-2 py-1.5">{r.prodi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={() => setImportOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submitImport} disabled={!importRows.length || importing} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg px-4 py-2">
            {importing ? "Mengimpor…" : `Impor ${importRows.length || ""} Praktikan`}
          </button>
        </div>
      </Modal>

      {/* Result modal */}
      <Modal open={!!bulkResult} onClose={() => setBulkResult(null)} title="Impor Selesai" width={480}>
        {bulkResult && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              <b>{bulkResult.created}</b> praktikan berhasil diimpor{bulkResult.skipped.length ? `, ${bulkResult.skipped.length} dilewati` : ""}. Semuanya belum berkelompok — buka Manajemen Kelompok untuk assign.
            </p>
            {bulkResult.skipped.length > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-lg p-2.5 max-h-40 overflow-y-auto">
                {bulkResult.skipped.map((s, i) => <div key={i}>{s.npm} — {s.name} ({s.reason})</div>)}
              </div>
            )}
          </div>
        )}
      </Modal>
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
