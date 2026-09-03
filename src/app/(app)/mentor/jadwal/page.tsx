import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JadwalClient } from "./jadwal-client";

export const dynamic = "force-dynamic";

export default async function MentorJadwalPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") redirect("/dashboard");

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const totalMinggu = kalender?.totalMinggu ?? 8;

  const kelompokList = await prisma.kelompok.findMany({
    where: { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] },
    include: { pertemuan: true },
    orderBy: { name: "asc" },
  });

  if (!kelompokList.length) {
    return <p className="text-sm text-gray-500">Anda belum memiliki kelompok binaan.</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Jadwal Praktikum</h1>
      <JadwalClient
        totalMinggu={totalMinggu}
        kelompokList={kelompokList.map((k) => ({
          id: k.id, name: k.name,
          pertemuan: k.pertemuan.map((p) => ({
            id: p.id, week: p.week, date: p.date.toISOString().slice(0, 10), time: p.time, location: p.location, status: p.status,
          })),
        }))}
      />
    </div>
  );
}
