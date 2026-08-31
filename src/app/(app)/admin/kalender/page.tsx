import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KalenderClient } from "./kalender-client";

export const dynamic = "force-dynamic";

export default async function AdminKalenderPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [kalender, materi] = await Promise.all([
    prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } }),
    prisma.materi.findMany({ orderBy: { week: "asc" } }),
  ]);

  const kal = kalender ?? { tahunAkademik: "2025/2026", semester: "Ganjil", totalMinggu: 8, currentWeek: 1 };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Kalender & Materi Praktikum</h1>
      <KalenderClient
        key={kal.totalMinggu}
        kalender={{ tahunAkademik: kal.tahunAkademik, semester: kal.semester, totalMinggu: kal.totalMinggu, currentWeek: kal.currentWeek }}
        materi={materi.map((m) => ({ week: m.week, tahsin: m.tahsin, keislaman: m.keislaman }))}
      />
    </div>
  );
}
