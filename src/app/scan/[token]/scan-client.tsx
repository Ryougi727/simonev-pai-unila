"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Search } from "lucide-react";
import { ActionSpinner } from "@/components/action-spinner";

type Praktikan = { id: string; npm: string; name: string; done: boolean };

export function ScanClient({ token, praktikan }: { token: string; praktikan: Praktikan[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [confirmedName, setConfirmedName] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return praktikan;
    return praktikan.filter((p) => p.name.toLowerCase().includes(q) || p.npm.toLowerCase().includes(q));
  }, [praktikan, query]);

  const locked = !!confirmedName;

  const confirm = async () => {
    if (!selectedId || locked) return;
    setSubmitting(true);
    setErrMsg("");
    try {
      const res = await fetch(`/api/attendance/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ praktikanId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || "Gagal absen."); setSubmitting(false); return; }
      const p = praktikan.find((x) => x.id === selectedId);
      setConfirmedName(p?.name || "Anda");
    } catch {
      setErrMsg("Koneksi bermasalah. Coba lagi.");
    }
    setSubmitting(false);
  };

  if (locked) {
    return (
      <div className="text-left">
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/40 rounded-lg px-3 py-3 text-primary-hover dark:text-primary-dark">
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="text-sm font-semibold">Kehadiran atas nama <b>{confirmedName}</b> berhasil dicatat. Terima kasih!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-left">
      <p className="text-xs text-on-surface-variant mb-3">Cari lalu tap nama <b>Anda sendiri</b>, lalu tekan konfirmasi. Satu perangkat hanya bisa mengonfirmasi satu nama.</p>

      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau NPM…"
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary"
        />
      </div>

      {errMsg && <div className="text-error text-xs font-semibold mb-2">{errMsg}</div>}

      <div className="space-y-1.5 max-h-72 overflow-y-auto mb-3">
        {filtered.map((p) => {
          const isSelected = selectedId === p.id;
          const disabled = p.done;
          return (
            <button
              key={p.id}
              onClick={() => !disabled && setSelectedId(p.id)}
              disabled={disabled}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                disabled
                  ? "bg-surface-container-high border-outline-variant text-on-surface-variant cursor-not-allowed"
                  : isSelected
                  ? "bg-primary/10 border-primary text-primary-hover dark:text-primary-dark font-semibold"
                  : "bg-surface-container-low border-outline-variant text-on-surface"
              }`}
            >
              <span>{p.name} <span className="text-on-surface-variant font-normal">· {p.npm}</span></span>
              {disabled ? <CheckCircle2 size={16} /> : isSelected ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-outline" />}
            </button>
          );
        })}
        {!filtered.length && <div className="text-center text-xs text-on-surface-variant py-6">Tidak ditemukan.</div>}
      </div>

      <button
        onClick={confirm}
        disabled={!selectedId || submitting}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-lg py-3 text-sm"
      >
        {submitting ? <><ActionSpinner /> Mengonfirmasi…</> : "Konfirmasi Kehadiran"}
      </button>
    </div>
  );
}
