import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DokumentasiClient } from "./dokumentasi-client";

export const dynamic = "force-dynamic";

export default async function MentorDokumentasiPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") redirect("/dashboard");

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const kelompokList = await prisma.kelompok.findMany({
    where: { mentorId: user.id },
    include: { pertemuan: { orderBy: { week: "desc" }, include: { dokumentasi: true } } },
    orderBy: { name: "asc" },
  });

  if (!kelompokList.length) return <p className="text-sm text-gray-500">Anda belum memiliki kelompok binaan.</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Dokumentasi</h1>
      <DokumentasiClient
        maxPhotos={settings?.maxPhotos ?? 3}
        kelompokList={kelompokList.map((k) => ({
          id: k.id, name: k.name,
          pertemuan: k.pertemuan.map((p) => ({ id: p.id, week: p.week, photos: p.dokumentasi.map((d) => ({ id: d.id, url: d.url })) })),
        }))}
      />
    </div>
  );
}
