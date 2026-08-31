"use client";

import { useState } from "react";

type Pertemuan = { id: string; week: number; photos: string[] };
type Kelompok = { id: string; name: string; pertemuan: Pertemuan[] };

export function PJDokumentasiClient({ kelompokList }: { kelompokList: Kelompok[] }) {
  const [activeKId, setActiveKId] = useState(kelompokList[0]?.id);
  const kelompok = kelompokList.find((k) => k.id === activeKId);
  const [activePId, setActivePId] = useState(kelompok?.pertemuan[0]?.id);
  const pertemuan = kelompok?.pertemuan.find((p) => p.id === activePId) || kelompok?.pertemuan[0];

  if (!kelompokList.length) return <p className="text-sm text-gray-500">Belum ada kelompok pada fakultas ini.</p>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          value={activeKId}
          onChange={(e) => { setActiveKId(e.target.value); const kl = kelompokList.find((k) => k.id === e.target.value); setActivePId(kl?.pertemuan[0]?.id); }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-48"
        >
          {kelompokList.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        {kelompok && kelompok.pertemuan.length > 0 && (
          <select value={activePId} onChange={(e) => setActivePId(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm outline-none focus:border-primary w-36">
            {kelompok.pertemuan.map((p) => <option key={p.id} value={p.id}>Minggu {p.week}</option>)}
          </select>
        )}
      </div>
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5">
        {!pertemuan ? (
          <p className="text-xs text-gray-400 text-center py-8">Belum ada pertemuan.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pertemuan.photos.map((url, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-[#dcefe2] dark:border-[#1d3527] aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {!pertemuan.photos.length && <div className="col-span-full text-center text-gray-400 text-xs py-8">Belum ada foto untuk pertemuan ini.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
