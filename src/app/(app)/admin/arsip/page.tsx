import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArsipClient } from "./arsip-client";

export const dynamic = "force-dynamic";

export default async function AdminArsipPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [kalender, totalPertemuanSelesai, archives] = await Promise.all([
    prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } }),
    prisma.pertemuan.count({ where: { status: "SELESAI" } }),
    prisma.archive.findMany({ orderBy: { archivedAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Arsip Semester</h1>
      <ArsipClient
        semesterLabel={kalender ? `${kalender.semester} ${kalender.tahunAkademik}` : "-"}
        totalPertemuanSelesai={totalPertemuanSelesai}
        archives={archives.map((a) => ({ id: a.id, label: `${a.semester} ${a.tahunAkademik}`, archivedAt: a.archivedAt.toISOString(), totalPertemuan: a.totalPertemuan }))}
      />
    </div>
  );
}
