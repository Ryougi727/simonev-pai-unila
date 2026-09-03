"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { QrCode as QrCodeIcon, CheckCircle2, Circle } from "lucide-react";

type Praktikan = { id: string; npm: string; name: string };
type QrInfo = { token: string; activatedAt: string; durationMin: number };

export function QRClient({
  pertemuanId, kelompokName, week, initialStatus, initialQr, praktikan,
}: {
  pertemuanId: string; kelompokName: string; week: number;
  initialStatus: string; initialQr: QrInfo | null; praktikan: Praktikan[];
}) {
  const [qr, setQr] = useState<QrInfo | null>(initialQr);
  const [status, setStatus] = useState(initialStatus);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [hadirIds, setHadirIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scanUrl = qr ? `${typeof window !== "undefined" ? window.location.origin : ""}/scan/${qr.token}` : "";

  useEffect(() => {
    if (!qr) { setQrImage(null); return; }
    QRCode.toDataURL(scanUrl, { margin: 1, width: 240 }).then(setQrImage).catch(() => setQrImage(null));
  }, [qr?.token]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/qr/status?pertemuanId=${pertemuanId}`);
    if (!res.ok) return;
    const data = await res.json();
    setStatus(data.status);
    setHadirIds(new Set(data.hadirIds));
    if (data.qrToken) setQr({ token: data.qrToken, activatedAt: data.activatedAt, durationMin: data.durationMin });
  }, [pertemuanId]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [poll]);

  const expiresAt = qr ? new Date(qr.activatedAt).getTime() + qr.durationMin * 60000 : 0;
  const remainingMs = expiresAt - now;
  const active = !!qr && remainingMs > 0 && status !== "SELESAI";
  const mm = Math.max(0, Math.floor(remainingMs / 60000));
  const ss = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  const openQr = async () => {
    setLoading(true); setError("");
    const res = await fetch("/api/qr/open", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pertemuanId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Gagal membuka QR."); return; }
    setQr({ token: data.qrToken, activatedAt: data.activatedAt, durationMin: data.durationMin });
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4">
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5 text-center">
        <div className="text-xs text-gray-500 mb-2">{kelompokName} · Minggu {week}</div>
        {active && qrImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt="QR Absensi" className="mx-auto rounded-lg" width={176} height={176} />
            <div className="font-display text-xl font-semibold text-primary dark:text-primary-dark mt-3">
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </div>
            <div className="text-[11px] text-gray-400 mb-3">sisa waktu berlaku</div>
            <p className="text-[11px] text-gray-400">Praktikan scan QR ini dengan kamera HP masing-masing.</p>
          </>
        ) : (
          <>
            <div className="w-44 h-44 mx-auto rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-3">
              <QrCodeIcon size={44} />
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {status === "SELESAI" ? "Pertemuan sudah selesai." : "QR belum dibuka."}
            </div>
            {status !== "SELESAI" && (
              <button onClick={openQr} disabled={loading} className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm">
                {loading ? "Membuka…" : "Buka QR Absensi"}
              </button>
            )}
          </>
        )}
        {error && <div className="text-red-600 text-xs font-semibold mt-2">{error}</div>}
      </div>

      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl">
        <div className="p-4 flex items-center justify-between border-b border-[#dcefe2] dark:border-[#1d3527]">
          <div className="font-semibold text-sm">Daftar Hadir Real-time</div>
          <div className="text-xs text-gray-500">{hadirIds.size}/{praktikan.length} hadir</div>
        </div>
        <div className="p-2">
          {praktikan.map((p) => {
            const done = hadirIds.has(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{p.name} <span className="text-gray-400">· {p.npm}</span></span>
                {done ? (
                  <span className="flex items-center gap-1 text-primary dark:text-primary-dark text-xs font-semibold">
                    <CheckCircle2 size={13} /> Hadir
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <Circle size={13} /> Belum
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
