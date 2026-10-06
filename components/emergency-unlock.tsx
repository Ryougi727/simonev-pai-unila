"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, X, AlertTriangle } from "lucide-react";

type Candidate = { id: string; kelompokName: string; week: number; date: string; unlocked: boolean };

export function EmergencyUnlockButton({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openModal = async () => {
    setOpen(true); setLoading(true); setError(""); setPassword(""); setSelectedId("");
    const res = await fetch("/api/mentor/emergency-candidates");
    const data = await res.json();
    setLoading(false);
    if (res.ok) setCandidates(data.candidates || []);
  };

  const submit = async () => {
    if (!selectedId) { setError("Pilih pertemuan yang mau dibuka dulu."); return; }
    if (!password) { setError("Isi sandi darurat."); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/mentor/emergency-unlock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, pertemuanId: selectedId }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error || "Gagal membuka kunci."); return; }
    setOpen(false);
    router.refresh();
    alert("Berhasil dibuka! Sekarang bisa diakses lewat menu QR Absensi atau Berita Acara.");
  };

  return (
    <>
      <button
        onClick={openModal}
        title="Buka Kunci Darurat"
        className={`w-full flex items-center justify-center gap-2 text-xs font-semibold border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg py-2 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors ${collapsed ? "px-0" : ""}`}
      >
        <ShieldAlert size={14} /> {!collapsed && "Kunci Darurat"}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/45 z-[60] flex items-center justify-center p-4" onMouseDown={() => setOpen(false)}>
          <div className="w-full max-w-md bg-surface dark:bg-[#0f1c14] border border-outline-variant/40 dark:border-[#1d3527] rounded-2xl max-h-[88vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40 dark:border-[#1d3527]">
              <div className="font-display text-lg font-semibold">Buka Kunci Darurat</div>
              <button onClick={() => setOpen(false)} className="text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs rounded-lg px-3 py-2.5 mb-4">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>
                  Fitur ini hanya untuk pertemuan minggu lalu yang <b>lupa</b> dibuka QR/berita acaranya sebelum minggu
                  berjalan berganti. Butuh sandi darurat dari Admin — jangan disalahgunakan.
                </span>
              </div>

              {loading ? (
                <p className="text-xs text-gray-400 text-center py-6">Memuat…</p>
              ) : candidates.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Tidak ada pertemuan minggu lalu yang perlu dibuka.</p>
              ) : (
                <>
                  <div className="text-xs font-bold text-gray-500 mb-1.5">Pilih Pertemuan</div>
                  <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto">
                    {candidates.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                          selectedId === c.id ? "border-primary bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark font-semibold" : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {c.kelompokName} — Minggu {c.week}
                        <span className="text-gray-400 font-normal"> · {new Date(c.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        {c.unlocked && <span className="ml-2 text-[10px] font-bold text-amber-600">sudah pernah dibuka</span>}
                      </button>
                    ))}
                  </div>
                  <label className="block mb-2">
                    <div className="text-xs font-bold text-gray-500 mb-1.5">Sandi Darurat</div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary" />
                  </label>
                  {error && <div className="text-red-600 text-xs font-semibold mb-2">{error}</div>}
                  <button onClick={submit} disabled={submitting} className="w-full mt-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-lg py-2.5">
                    {submitting ? "Membuka…" : "Buka Kunci"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
