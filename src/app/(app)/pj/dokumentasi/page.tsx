import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PJDokumentasiClient } from "./pj-dokumentasi-client";

export const dynamic = "force-dynamic";

export default async function PJDokumentasiPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "PJ") redirect("/dashboard");

  const kelompokList = await prisma.kelompok.findMany({
    where: { faculty: user.faculty },
    include: { pertemuan: { orderBy: { week: "desc" }, include: { dokumentasi: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Dokumentasi</h1>
      <PJDokumentasiClient
        kelompokList={kelompokList.map((k) => ({
          id: k.id, name: k.name,
          pertemuan: k.pertemuan.map((p) => ({ id: p.id, week: p.week, photos: p.dokumentasi.map((d) => d.url) })),
        }))}
      />
    </div>
  );
}
