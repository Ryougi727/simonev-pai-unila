"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Kalender = { tahunAkademik: string; semester: string; totalMinggu: number; currentWeek: number };
type MateriRow = { week: number; tahsin: string; keislaman: string };

export function KalenderClient({ kalender, materi }: { kalender: Kalender; materi: MateriRow[] }) {
  const router = useRouter();
  const [kal, setKal] = useState(kalender);
  const [savingKal, setSavingKal] = useState(false);

  const saveKalender = async () => {
    setSavingKal(true);
    const res = await fetch("/api/admin/kalender", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kal) });
    const data = await res.json();
    setSavingKal(false);
    if (!res.ok) { alert(data.error || "Gagal menyimpan."); return; }
    router.refresh();
  };

  const [rows, setRows] = useState<MateriRow[]>(() =>
    Array.from({ length: kalender.totalMinggu }, (_, i) => materi.find((m) => m.week === i + 1) || { week: i + 1, tahsin: "", keislaman: "" })
  );
  const [savingMateri, setSavingMateri] = useState(false);
  const updateRow = (week: number, field: "tahsin" | "keislaman", value: string) =>
    setRows((r) => r.map((x) => (x.week === week ? { ...x, [field]: value } : x)));

  const saveMateri = async () => {
    setSavingMateri(true);
    const res = await fetch("/api/admin/materi", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ materi: rows }) });
    setSavingMateri(false);
    if (!res.ok) { alert("Gagal menyimpan materi."); return; }
    router.refresh();
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5 mb-4">
        <div className="font-semibold text-sm mb-4">Pengaturan Kalender</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="Tahun Akademik"><input value={kal.tahunAkademik} onChange={(e) => setKal((k) => ({ ...k, tahunAkademik: e.target.value }))} className={inputCls} /></Field>
          <Field label="Semester">
            <select value={kal.semester} onChange={(e) => setKal((k) => ({ ...k, semester: e.target.value }))} className={inputCls}>
              <option>Ganjil</option><option>Genap</option>
            </select>
          </Field>
          <Field label="Total Minggu"><input type="number" min={1} max={16} value={kal.totalMinggu} onChange={(e) => setKal((k) => ({ ...k, totalMinggu: Number(e.target.value) }))} className={inputCls} /></Field>
          <Field label="Minggu Berjalan"><input type="number" min={1} max={kal.totalMinggu} value={kal.currentWeek} onChange={(e) => setKal((k) => ({ ...k, currentWeek: Number(e.target.value) }))} className={inputCls} /></Field>
        </div>
        <button onClick={saveKalender} disabled={savingKal} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
          {savingKal ? "Menyimpan…" : "Simpan Kalender"}
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#dcefe2] dark:border-[#1d3527]">
          <div className="font-semibold text-sm">Materi Mingguan</div>
          <button onClick={saveMateri} disabled={savingMateri} className="text-xs font-bold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-3 py-2">
            {savingMateri ? "Menyimpan…" : "Simpan Materi"}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Minggu</th>
              <th className="px-4 py-2.5 font-bold">Materi Tahsin</th>
              <th className="px-4 py-2.5 font-bold">Materi Keislaman</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.week} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                <td className="px-4 py-2.5 font-bold">
                  {m.week}
                  {m.week === kal.currentWeek && <span className="ml-2 text-[10px] font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark px-2 py-0.5 rounded-full">berjalan</span>}
                </td>
                <td className="px-4 py-2"><input value={m.tahsin} onChange={(e) => updateRow(m.week, "tahsin", e.target.value)} className={inputCls} /></td>
                <td className="px-4 py-2"><input value={m.keislaman} onChange={(e) => updateRow(m.week, "keislaman", e.target.value)} className={inputCls} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-gray-500 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
