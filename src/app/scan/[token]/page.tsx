import { prisma } from "@/lib/prisma";
import { ScanClient } from "./scan-client";

export const dynamic = "force-dynamic";

export default async function ScanPage({ params }: { params: { token: string } }) {
  const pertemuan = await prisma.pertemuan.findUnique({
    where: { qrToken: params.token },
    include: { kelompok: { include: { praktikan: true } }, absensi: true },
  });

  if (!pertemuan) {
    return <Center><p className="font-semibold text-error">QR tidak valid atau sudah tidak berlaku.</p></Center>;
  }

  const expiresAt = pertemuan.qrActivatedAt
    ? pertemuan.qrActivatedAt.getTime() + (pertemuan.qrDurationMin ?? 10) * 60000
    : 0;
  const expired = Date.now() > expiresAt || pertemuan.status === "SELESAI";

  if (expired) {
    return <Center><p className="font-semibold text-error">QR absensi ini sudah kedaluwarsa. Hubungi mentor Anda.</p></Center>;
  }

  const scannedIds = new Set(pertemuan.absensi.filter((a) => a.status === "HADIR").map((a) => a.praktikanId));

  return (
    <Center>
      <h1 className="font-display text-xl font-semibold mb-1">{pertemuan.kelompok.name}</h1>
      <p className="text-sm text-on-surface-variant mb-5">Minggu {pertemuan.week} — pilih nama Anda untuk absen hadir.</p>
      <ScanClient
        token={params.token}
        praktikan={pertemuan.kelompok.praktikan.map((p) => ({ id: p.id, npm: p.npm, name: p.name, done: scannedIds.has(p.id) }))}
      />
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-background text-on-surface">
      <div className="w-full max-w-sm bg-surface border border-outline-variant/40 rounded-2xl p-6 shadow text-center">{children}</div>
    </div>
  );
}
