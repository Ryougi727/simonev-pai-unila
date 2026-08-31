"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Plus, Upload, Pencil, Download, X, FileSpreadsheet, Trash2 } from "lucide-react";

type UserRow = {
  id: string; name: string; username: string; faculty: string | null; email: string | null;
  active: boolean; mustChangePassword: boolean;
};
type Role = "MENTOR" | "PJ";
type ImportRow = { name: string; faculty: string; email: string };

const FACULTIES = ["FMIPA", "Teknik", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];
const ROLE_LABEL: Record<Role, string> = { MENTOR: "Mentor", PJ: "PJ Fakultas" };

export function UsersClient({ mentors, pjs }: { mentors: UserRow[]; pjs: UserRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Role>("MENTOR");
  const list = tab === "MENTOR" ? mentors : pjs;

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", faculty: FACULTIES[0] });
  const [saving, setSaving] = useState(false);

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", faculty: FACULTIES[0] });

  const [credModal, setCredModal] = useState<{ name: string; username: string; password: string; isReset: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [bulkResult, setBulkResult] = useState<{ created: { name: string; username: string; password: string }[]; skipped: { name: string; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => router.refresh();

  /* ---------- add single ---------- */
  const openAdd = () => { setAddForm({ name: "", email: "", faculty: FACULTIES[0] }); setAddOpen(true); };
  const submitAdd = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: tab, ...addForm }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { alert(data.error || "Gagal menyimpan."); return; }
    setAddOpen(false);
    setCredModal({ name: data.name, username: data.username, password: data.password, isReset: false });
    refresh();
  };

  /* ---------- edit ---------- */
  const openEdit = (u: UserRow) => { setEditUser(u); setEditForm({ name: u.name, email: u.email || "", faculty: u.faculty || FACULTIES[0] }); };
  const submitEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const res = await fetch(`/api/admin/${editUser.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (!res.ok) { alert("Gagal menyimpan."); return; }
    setEditUser(null);
    refresh();
  };

  /* ---------- reset password / toggle active ---------- */
  const resetPassword = async (u: UserRow) => {
    const res = await fetch(`/api/admin/${u.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert("Gagal reset password."); return; }
    setCredModal({ name: u.name, username: data.username, password: data.password, isReset: true });
    refresh();
  };
  const toggleActive = async (u: UserRow) => {
    const res = await fetch(`/api/admin/${u.id}/toggle-active`, { method: "POST" });
    if (!res.ok) { alert("Gagal mengubah status."); return; }
    refresh();
  };
  const remove = async (u: UserRow) => {
    const ok = confirm(
      `Hapus permanen akun "${u.name}"? Tindakan ini tidak bisa dibatalkan.\n\nKelompok yang dibina (jika ada) akan menjadi "Belum ditentukan", dan namanya akan hilang dari Activity/Audit Log (catatan lognya tetap ada, hanya tanpa nama).`
    );
    if (!ok) return;
    const res = await fetch(`/api/admin/${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Gagal menghapus."); return; }
    refresh();
  };

  const copyCreds = () => {
    if (!credModal) return;
    navigator.clipboard.writeText(`Username: ${credModal.username}\nPassword: ${credModal.password}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => alert("Gagal menyalin — salin manual."));
  };

  /* ---------- bulk import ---------- */
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { Nama: "Ahmad Zaki Mubarak", Fakultas: "FMIPA", Email: "" },
      { Nama: "Siti Nurhaliza", Fakultas: "Teknik", Email: "" },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `template-${ROLE_LABEL[tab].toLowerCase().replace(" ", "-")}.xlsx`);
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
          name: norm(r, ["nama", "name"]),
          faculty: norm(r, ["fakultas", "faculty"]),
          email: norm(r, ["email", "e-mail"]),
        }))
        .filter((r) => r.name);
      if (!rows.length) { setImportError("Tidak ada baris dengan kolom 'Nama' yang terisi."); return; }
      setImportRows(rows);
    } catch {
      setImportError("Gagal membaca file. Pastikan formatnya .xlsx atau .csv.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitImport = async () => {
    setImporting(true);
    const res = await fetch("/api/admin/users/bulk-import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: tab, rows: importRows }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { setImportError(data.error || "Gagal mengimpor."); return; }
    setImportOpen(false);
    setImportRows([]);
    setBulkResult(data);
    refresh();
  };

  const downloadBulkCredentials = () => {
    if (!bulkResult) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(bulkResult.created.map((c) => ({ Nama: c.name, Username: c.username, Password: c.password })));
    XLSX.utils.book_append_sheet(wb, ws, "Kredensial");
    XLSX.writeFile(wb, `kredensial-${ROLE_LABEL[tab].toLowerCase().replace(" ", "-")}-${Date.now()}.xlsx`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {(["MENTOR", "PJ"] as Role[]).map((r) => (
            <button key={r} onClick={() => setTab(r)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
              tab === r ? "bg-primary-soft dark:bg-primary-darkSoft border-primary text-primary-hover dark:text-primary-dark" : "border-[#dcefe2] dark:border-[#1d3527] text-gray-500"
            }`}>{ROLE_LABEL[r]}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setImportError(""); setImportRows([]); setImportOpen(true); }} className="flex items-center gap-1.5 text-xs font-bold border border-[#dcefe2] dark:border-[#1d3527] rounded-lg px-3 py-2">
            <Upload size={14} /> Impor Excel
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2">
            <Plus size={14} /> Tambah {ROLE_LABEL[tab]}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Nama</th>
              <th className="px-4 py-2.5 font-bold">Username</th>
              <th className="px-4 py-2.5 font-bold">Fakultas</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                <td className="px-4 py-2.5 font-semibold">{u.name}</td>
                <td className="px-4 py-2.5">
                  <code className="text-xs">{u.username}</code>
                  {u.mustChangePassword && <span className="ml-2 text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded-full">Belum login</span>}
                </td>
                <td className="px-4 py-2.5">{u.faculty || "-"}</td>
                <td className="px-4 py-2.5">
                  {u.active
                    ? <span className="text-[11px] font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark px-2.5 py-1 rounded-full">Aktif</span>
                    : <span className="text-[11px] font-bold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full">Nonaktif</span>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => openEdit(u)} className="text-xs font-semibold flex items-center gap-1 text-gray-500 px-2 py-1"><Pencil size={12} /> Edit</button>
                    <button onClick={() => resetPassword(u)} className="text-xs font-semibold text-gray-500 px-2 py-1">Reset PW</button>
                    <button onClick={() => toggleActive(u)} className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${u.active ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400" : "bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark"}`}>
                      {u.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button onClick={() => remove(u)} className="text-xs font-semibold flex items-center gap-1 text-red-700 dark:text-red-400 px-2 py-1">
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada data {ROLE_LABEL[tab].toLowerCase()}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Tambah ${ROLE_LABEL[tab]}`}>
        <FormFields form={addForm} setForm={setAddForm} />
        <p className="text-[11px] text-gray-400 mt-2">Username & password sementara akan dibuat otomatis setelah disimpan.</p>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setAddOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submitAdd} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit ${editUser ? ROLE_LABEL[tab] : ""}`}>
        <FormFields form={editForm} setForm={setEditForm} />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setEditUser(null)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submitEdit} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Credential reveal modal (single) */}
      <Modal open={!!credModal} onClose={() => setCredModal(null)} title={credModal?.isReset ? "Password Direset" : "Akun Berhasil Dibuat"} width={420}>
        {credModal && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Sampaikan kredensial berikut ke <b>{credModal.name}</b> secara manual. Password ini hanya ditampilkan <b>satu kali</b>.
            </p>
            <div className="bg-gray-50 dark:bg-white/5 border border-[#dcefe2] dark:border-[#1d3527] rounded-xl p-4 mb-3">
              <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Username</div>
              <div className="font-mono font-bold text-base mb-2.5">{credModal.username}</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Password Sementara</div>
              <div className="font-mono font-bold text-base">{credModal.password}</div>
            </div>
            <button onClick={copyCreds} className="w-full text-sm font-semibold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark rounded-lg py-2.5">
              {copied ? "Tersalin!" : "Salin Kredensial"}
            </button>
          </div>
        )}
      </Modal>

      {/* Bulk import modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title={`Impor ${ROLE_LABEL[tab]} dari Excel`} width={560}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">File butuh kolom <b>Nama</b> (wajib), <b>Fakultas</b> &amp; <b>Email</b> (opsional).</p>
          <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-dark shrink-0">
            <FileSpreadsheet size={13} /> Unduh Template
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChosen} className="text-sm mb-3" />
        {importError && <div className="text-red-600 text-xs font-semibold mb-2">{importError}</div>}
        {importRows.length > 0 && (
          <div className="max-h-56 overflow-y-auto border border-[#dcefe2] dark:border-[#1d3527] rounded-lg mb-3">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-400"><th className="px-2 py-1.5">Nama</th><th className="px-2 py-1.5">Fakultas</th><th className="px-2 py-1.5">Email</th></tr></thead>
              <tbody>
                {importRows.map((r, i) => (
                  <tr key={i} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                    <td className="px-2 py-1.5">{r.name}</td><td className="px-2 py-1.5">{r.faculty || "-"}</td><td className="px-2 py-1.5">{r.email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={() => setImportOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={submitImport} disabled={!importRows.length || importing} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg px-4 py-2">
            {importing ? "Mengimpor…" : `Impor ${importRows.length || ""} Akun`}
          </button>
        </div>
      </Modal>

      {/* Bulk result modal */}
      <Modal open={!!bulkResult} onClose={() => setBulkResult(null)} title="Impor Selesai" width={480}>
        {bulkResult && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              <b>{bulkResult.created.length}</b> akun berhasil dibuat{bulkResult.skipped.length ? `, ${bulkResult.skipped.length} dilewati` : ""}.
              Download daftar kredensial di bawah untuk disampaikan ke masing-masing {ROLE_LABEL[tab].toLowerCase()} — password hanya tersedia sekali ini saja.
            </p>
            <button onClick={downloadBulkCredentials} className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg py-2.5 mb-3">
              <Download size={15} /> Download Kredensial (.xlsx)
            </button>
            {bulkResult.skipped.length > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-lg p-2.5">
                Dilewati: {bulkResult.skipped.map((s) => `${s.name} (${s.reason})`).join(", ")}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function FormFields({ form, setForm }: { form: { name: string; email: string; faculty: string }; setForm: (f: any) => void }) {
  return (
    <>
      <label className="block mb-3">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Nama Lengkap</div>
        <input value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="cth. Ahmad Zaki" />
      </label>
      <label className="block mb-3">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Email (opsional, kontak saja)</div>
        <input value={form.email} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" placeholder="nama@unila.ac.id" />
      </label>
      <label className="block">
        <div className="text-xs font-bold text-gray-500 mb-1.5">Fakultas</div>
        <select value={form.faculty} onChange={(e) => setForm((f: any) => ({ ...f, faculty: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary">
          {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
    </>
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