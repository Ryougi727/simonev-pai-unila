"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Plus, Pencil, Trash2, X, Sparkles, ChevronLeft, ChevronRight, Search, Upload, FileSpreadsheet } from "lucide-react";
import { SearchableMultiSelect } from "@/components/searchable-multi-select";
import { useConfirmDialog } from "@/components/use-confirm-dialog";
import { ActionSpinner } from "@/components/action-spinner";

type KelompokRow = { id: string; name: string; faculty: string; monitoringStartWeek: number; mentorIds: string[]; mentorNames: string[]; praktikanCount: number };
type Mentor = { id: string; name: string };
type Praktikan = { id: string; npm: string; name: string; kelompokId: string | null };
type ImportedPraktikan = { id: string; npm: string; name: string };

const FACULTIES = ["FMIPA", "Teknik", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];

export function KelompokClient({ kelompok, mentors, praktikan, currentWeek, totalWeeks }: { kelompok: KelompokRow[]; mentors: Mentor[]; praktikan: Praktikan[]; currentWeek: number; totalWeeks: number }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const { confirm, dialog } = useConfirmDialog();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterFakultas, setFilterFakultas] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const fakultasOptions = [
    ...FACULTIES,
    ...Array.from(new Set(kelompok.map((k) => k.faculty)))
      .filter((faculty) => !FACULTIES.includes(faculty))
      .sort((a, b) => a.localeCompare(b, "id")),
  ];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id");
  const filteredKelompok = kelompok.filter((k) =>
    (filterFakultas === "all" || k.faculty === filterFakultas) &&
    (!normalizedQuery || k.name.toLocaleLowerCase("id").includes(normalizedQuery))
  );
  const totalPages = Math.max(1, Math.ceil(filteredKelompok.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredKelompok.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; k?: KelompokRow } | null>(null);
  const [form, setForm] = useState({ name: "", faculty: FACULTIES[0], monitoringStartWeek: currentWeek, mentorIds: [] as string[], praktikanIds: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importedPraktikan, setImportedPraktikan] = useState<ImportedPraktikan[]>([]);
  const [importReport, setImportReport] = useState<{ added: number; errors: string[] } | null>(null);
  const [saveError, setSaveError] = useState("");
  const importFileRef = useRef<HTMLInputElement>(null);

  const assignedMentorIds = new Set(kelompok.flatMap((k) => k.mentorIds));

  const openAdd = () => {
    setForm({ name: "", faculty: FACULTIES[0], monitoringStartWeek: currentWeek, mentorIds: [], praktikanIds: [] });
    setImportedPraktikan([]);
    setImportReport(null);
    setSaveError("");
    setModal({ mode: "add" });
  };
  const openEdit = (k: KelompokRow) => {
    const currentMembers = praktikan.filter((p) => p.kelompokId === k.id).map((p) => p.id);
    setForm({ name: k.name, faculty: k.faculty, monitoringStartWeek: k.monitoringStartWeek, mentorIds: k.mentorIds, praktikanIds: currentMembers });
    setImportedPraktikan([]);
    setImportReport(null);
    setSaveError("");
    setModal({ mode: "edit", k });
  };

  const mentorOptions = mentors.map((m) => ({
    id: m.id,
    label: m.name,
    sublabel: assignedMentorIds.has(m.id) && !form.mentorIds.includes(m.id) ? "Sudah membina kelompok lain" : undefined,
  }));

  // praktikan already in another kelompok are excluded — move them via that kelompok's edit first
  const praktikanOptions = praktikan
    .filter((p) => !p.kelompokId || p.kelompokId === modal?.k?.id)
    .map((p) => ({ id: p.id, label: p.name, sublabel: p.npm }));

  const submit = async () => {
    if (!form.name.trim()) { alert("Nama kelompok wajib diisi."); return; }
    setSaveError("");
    setSaving(true);
    const url = modal?.mode === "edit" ? `/api/admin/kelompok/${modal.k!.id}` : "/api/admin/kelompok";
    const method = modal?.mode === "edit" ? "PATCH" : "POST";
    const selectedImports = modal?.mode === "add"
      ? importedPraktikan.filter((student) => form.praktikanIds.includes(student.id)).map(({ npm, name }) => ({ npm, name }))
      : [];
    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, faculty: form.faculty, monitoringStartWeek: form.monitoringStartWeek, mentorId: form.mentorIds, praktikanIds: form.praktikanIds, importedPraktikan: selectedImports }),
      });
      const responseText = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(responseText) as { error?: string };
      } catch {
        if (!res.ok) data.error = responseText || `Server gagal menyimpan (HTTP ${res.status}).`;
      }
      if (!res.ok) {
        setSaveError(data.error || `Gagal menyimpan kelompok (HTTP ${res.status}).`);
        return;
      }
      setModal(null);
      refresh();
    } catch {
      setSaveError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const downloadImportTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([["NPM", "Nama"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Praktikan");
    XLSX.writeFile(workbook, "template-praktikan-kelompok.xlsx");
  };

  const onImportFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const errors: string[] = [];
    const matched: ImportedPraktikan[] = [];
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        setImportReport({ added: 0, errors: ["File Excel tidak memiliki sheet yang dapat dibaca."] });
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
      const seenNpms = new Set<string>();
      for (const [index, row] of rows.entries()) {
        const values = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key.trim().toLocaleLowerCase("id"), String(value ?? "").trim()])
        );
        const npm = values.npm ?? "";
        const name = values.nama ?? values.name ?? "";
        if (!npm && !name) continue;
        const rowNumber = index + 2;
        if (!npm || !name) {
          errors.push(`Baris ${rowNumber}: NPM dan nama wajib diisi.`);
          continue;
        }
        if (seenNpms.has(npm)) {
          errors.push(`Baris ${rowNumber}: NPM ${npm} duplikat di file.`);
          continue;
        }
        seenNpms.add(npm);
        const student = praktikan.find((candidate) => candidate.npm.trim() === npm);
        if (!student) {
          errors.push(`Baris ${rowNumber}: NPM ${npm} tidak terdaftar.`);
          continue;
        }
        if (student.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id") !== name.replace(/\s+/g, " ").toLocaleLowerCase("id")) {
          errors.push(`Baris ${rowNumber}: nama untuk NPM ${npm} tidak sesuai data praktikan.`);
          continue;
        }
        if (student.kelompokId && student.kelompokId !== modal?.k?.id) {
          errors.push(`Baris ${rowNumber}: ${name} sudah terdaftar di kelompok lain.`);
          continue;
        }
        matched.push({ id: student.id, npm: student.npm, name: student.name });
      }
      if (!rows.length) errors.push("Tidak ada data praktikan pada sheet pertama.");
      if (rows.length && !matched.length && !errors.length) errors.push("Tidak ada baris NPM dan Nama yang dapat diimpor.");

      const importedById = new Map(importedPraktikan.map((student) => [student.id, student]));
      matched.forEach((student) => importedById.set(student.id, student));
      setImportedPraktikan(Array.from(importedById.values()));
      setForm((currentForm) => ({
        ...currentForm,
        praktikanIds: Array.from(new Set([...currentForm.praktikanIds, ...matched.map((student) => student.id)])),
      }));
      setImportReport({ added: matched.length, errors });
    } catch {
      setImportReport({ added: 0, errors: ["Gagal membaca file. Pastikan formatnya .xlsx, .xls, atau .csv."] });
    } finally {
      event.target.value = "";
    }
  };

  const remove = async (k: KelompokRow) => {
    const warn = k.praktikanCount > 0
      ? `Kelompok "${k.name}" memiliki ${k.praktikanCount} praktikan. Praktikan TIDAK akan terhapus, tapi jadi tidak berkelompok. Riwayat pertemuan kelompok ini akan terhapus. Lanjutkan?`
      : `Hapus kelompok "${k.name}"?`;
    if (!await confirm({
      title: `Hapus kelompok "${k.name}"?`,
      message: warn.replace(`Hapus kelompok "${k.name}"?`, "Tindakan ini tidak dapat dibatalkan."),
      confirmLabel: "Hapus Kelompok",
    })) return;
    setDeletingId(k.id);
    try {
      const res = await fetch(`/api/admin/kelompok/${k.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Gagal menghapus."); return; }
      refresh();
    } catch {
      alert("Gagal menghapus kelompok. Periksa koneksi lalu coba lagi.");
    } finally {
      setDeletingId(null);
    }
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
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <label className="relative block w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Cari nama kelompok…"
              aria-label="Cari nama kelompok"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary"
            />
          </label>
          <select
            value={filterFakultas}
            onChange={(e) => { setFilterFakultas(e.target.value); setPage(1); }}
            aria-label="Filter fakultas"
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-56"
          >
            <option value="all">Semua Fakultas</option>
            {fakultasOptions.map((faculty) => <option key={faculty} value={faculty}>{faculty}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={openGenerate} className="flex items-center gap-1.5 text-xs font-bold border border-primary/40 text-primary dark:text-primary-dark rounded-lg px-3 py-2">
            <Sparkles size={14} /> Generate Kelompok
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2">
            <Plus size={14} /> Tambah Kelompok
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Kelompok</th>
              <th className="px-4 py-2.5 font-bold">Fakultas</th>
              <th className="px-4 py-2.5 font-bold">Mentor</th>
              <th className="px-4 py-2.5 font-bold">Mulai Monitoring</th>
              <th className="px-4 py-2.5 font-bold">Praktikan</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((k) => (
              <tr key={k.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                <td className="px-4 py-2.5 font-semibold">
                  <Link href={`/kelompok/${k.id}`} className="hover:text-primary dark:hover:text-primary-dark">{k.name}</Link>
                </td>
                <td className="px-4 py-2.5">{k.faculty}</td>
                <td className="px-4 py-2.5">{k.mentorNames.length ? k.mentorNames.join(", ") : <span className="text-gray-400">Belum ditentukan</span>}</td>
                <td className="px-4 py-2.5">Minggu {k.monitoringStartWeek}</td>
                <td className="px-4 py-2.5">{k.praktikanCount} orang</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => openEdit(k)} className="text-xs font-semibold flex items-center gap-1 text-gray-500 px-2 py-1"><Pencil size={12} /> Edit</button>
                    <button onClick={() => remove(k)} disabled={deletingId === k.id} className="text-xs font-semibold flex items-center gap-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg disabled:opacity-60">
                      {deletingId === k.id ? <><ActionSpinner /> Menghapus…</> : <><Trash2 size={12} /> Hapus</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredKelompok.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-xs">
                  {normalizedQuery
                    ? `Tidak ada kelompok yang cocok dengan "${searchQuery.trim()}".`
                    : filterFakultas === "all"
                    ? "Belum ada kelompok."
                    : `Belum ada data kelompok untuk Fakultas ${filterFakultas}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dcefe2] dark:border-[#1d3527] px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <label htmlFor="kelompok-page-size">Baris per halaman</label>
            <select
              id="kelompok-page-size"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-on-surface outline-none focus:border-primary"
            >
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <span>
              {filteredKelompok.length
                ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredKelompok.length)} dari ${filteredKelompok.length} kelompok`
                : "0 kelompok"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Halaman sebelumnya"
              className="flex items-center gap-1 rounded-lg border border-[#dcefe2] dark:border-[#1d3527] px-2.5 py-1.5 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <span className="text-gray-500">Halaman {currentPage} dari {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Halaman berikutnya"
              className="flex items-center gap-1 rounded-lg border border-[#dcefe2] dark:border-[#1d3527] px-2.5 py-1.5 disabled:opacity-40"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
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
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Mulai dihitung dalam monitoring</div>
          <select
            value={form.monitoringStartWeek}
            onChange={(e) => setForm((f) => ({ ...f, monitoringStartWeek: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary"
          >
            {Array.from({ length: totalWeeks }, (_, index) => index + 1).map((week) => (
              <option key={week} value={week}>Minggu {week}{week === currentWeek ? " (minggu berjalan)" : ""}</option>
            ))}
          </select>
          <div className="text-[11px] text-gray-400 mt-1">Minggu sebelum tanggal ini tidak masuk hitungan peringatan.</div>
        </label>
        <div className="mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Mentor Pembimbing (maks. 2 per kelompok)</div>
          <SearchableMultiSelect
            options={mentorOptions}
            selectedIds={form.mentorIds}
            onChange={(ids) => setForm((f) => ({ ...f, mentorIds: ids }))}
            placeholder="Pilih mentor…"
            searchPlaceholder="Cari nama mentor…"
            maxSelected={2}
            emptyText="Belum ada mentor aktif."
          />
          <div className="text-[11px] text-gray-400 mt-1">Mentor dapat membina beberapa kelompok.</div>
        </div>
        <div className="mb-1">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Praktikan dalam Kelompok</div>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-[#dcefe2] px-3 py-2 text-xs font-semibold dark:border-[#1d3527]"
            >
              <Upload size={14} /> Impor Excel
            </button>
            <button
              type="button"
              onClick={downloadImportTemplate}
              className="flex items-center gap-1.5 rounded-lg border border-[#dcefe2] px-3 py-2 text-xs font-semibold dark:border-[#1d3527]"
            >
              <FileSpreadsheet size={14} /> Unduh Template
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onImportFileChosen}
              className="hidden"
            />
          </div>
          <SearchableMultiSelect
            options={praktikanOptions}
            selectedIds={form.praktikanIds}
            onChange={(ids) => setForm((f) => ({ ...f, praktikanIds: ids }))}
            placeholder="Pilih praktikan…"
            searchPlaceholder="Cari nama atau NPM…"
            emptyText="Tidak ada praktikan yang bisa dipilih."
          />
          <div className="text-[11px] text-gray-400 mt-1">Hanya praktikan yang belum berkelompok (atau sudah di kelompok ini) yang muncul di sini.</div>
          {importReport && (
            <div className="mt-2 rounded-lg bg-gray-50 p-2.5 text-xs dark:bg-white/5">
              <p className="font-semibold">{importReport.added} praktikan cocok dan masuk ke pilihan.</p>
              {importReport.errors.length > 0 && (
                <ul className="mt-1 max-h-28 list-inside list-disc space-y-0.5 overflow-y-auto text-amber-700 dark:text-amber-400">
                  {importReport.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
                </ul>
              )}
            </div>
          )}
          {saveError && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{saveError}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setModal(null)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submit} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {saving ? <><ActionSpinner /> Menyimpan…</> : "Simpan"}
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
          Contoh nama yang dihasilkan: <b>{genForm.prefix || "Kelompok"} {genForm.startNumber}</b>, <b>{genForm.prefix || "Kelompok"} {genForm.startNumber + 1}</b>, dst. Setelah kelompok dibuat, pilih Edit untuk mengimpor Excel atau memilih praktikan.
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => setGenOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submitGenerate} disabled={generating || (genMode === "auto-mentor" && availableMentorCount === 0)} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg px-4 py-2">
            {generating ? <><ActionSpinner /> Membuat…</> : "Buat Kelompok"}
          </button>
        </div>
      </Modal>
      {dialog}
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
