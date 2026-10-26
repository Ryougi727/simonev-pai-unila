"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type WarningGroup = {
  id: string;
  name: string;
  missedMeetings: number;
  missedWeeks: number[];
  severity: "early" | "yellow" | "orange" | "red";
};

const severityStyles = {
  early: {
    title: "Peringatan Dini",
    classes: "border-emerald-400 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100",
    message: "Ada satu pertemuan yang belum terlaksana. Segera susun kembali jadwal agar kegiatan praktikum tetap berjalan.",
  },
  yellow: {
    title: "Peringatan 1",
    classes: "border-yellow-400 bg-yellow-50 text-yellow-950 dark:bg-yellow-950/40 dark:text-yellow-100",
    message: "Dua pertemuan berturut-turut belum terlaksana. Mohon segera tindak lanjuti jadwal kelompok.",
  },
  orange: {
    title: "Peringatan 2",
    classes: "border-orange-400 bg-orange-50 text-orange-950 dark:bg-orange-950/40 dark:text-orange-100",
    message: "Tiga pertemuan berturut-turut belum terlaksana. Jadwalkan pertemuan berikutnya dan koordinasikan dengan praktikan.",
  },
  red: {
    title: "Peringatan 3",
    classes: "border-red-400 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100",
    message: "Empat atau lebih pertemuan berturut-turut belum terlaksana. Mohon segera lakukan tindak lanjut bersama pihak terkait.",
  },
} as const;

export function MentorWarningDialog({
  userId,
  loginAt,
  groups,
}: {
  userId: string;
  loginAt: number;
  groups: WarningGroup[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!groups.length) return;
    const storageKey = `mentor-meeting-warnings:${userId}:${loginAt}`;
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "shown");
    setOpen(true);
  }, [groups.length, loginAt, userId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const borderColorClass = groups.some((group) => group.severity === "red")
    ? "border-t-red-500"
    : groups.some((group) => group.severity === "orange")
      ? "border-t-orange-500"
      : groups.some((group) => group.severity === "yellow")
        ? "border-t-yellow-500"
        : "border-t-emerald-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mentor-warning-title"
        className={`w-full max-w-xl overflow-hidden rounded-2xl border border-t-4 border-outline-variant/50 bg-surface shadow-2xl ${borderColorClass}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 id="mentor-warning-title" className="font-display text-lg font-bold text-on-surface">Perhatian Pelaksanaan Pertemuan</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">Mohon tinjau kelompok yang memerlukan tindak lanjut.</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup peringatan" className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto p-5 sm:px-6">
          {groups.map((group) => {
            const style = severityStyles[group.severity];
            return (
              <article key={group.id} className={`rounded-xl border-2 p-4 ${style.classes}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">{group.name}</h3>
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold dark:bg-black/20">{style.title}</span>
                </div>
                <p className="mt-2 text-sm">{style.message}</p>
                <p className="mt-2 text-xs opacity-80">Minggu yang belum terlaksana: {group.missedWeeks.join(", ")}</p>
              </article>
            );
          })}
          <p className="rounded-xl bg-primary/5 p-3 text-sm text-on-surface-variant">
          “Ada ilmu yang menanti untuk disampaikan dan amanah yang menanti untuk ditunaikan. Mari luangkan waktu untuk mentoring, karena kebaikan yang kita niatkan perlu diwujudkan dalam tindakan.”
          </p>
        </div>

        <div className="flex justify-end border-t border-outline-variant/30 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover dark:bg-primary-dark dark:text-[#00391d]"
          >
            Saya Mengerti
          </button>
        </div>
      </section>
    </div>
  );
}
