import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const currentWeek = kalender?.currentWeek ?? 1;

  const kelompokList = await prisma.kelompok.findMany({
    where: { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] },
    include: { pertemuan: { where: { week: { not: currentWeek }, status: { not: "SELESAI" } } } },
  });

  const candidates = kelompokList.flatMap((k) =>
    k.pertemuan.map((p) => ({
      id: p.id, kelompokName: k.name, week: p.week,
      date: p.date.toISOString().slice(0, 10), unlocked: !!p.unlockedAt,
    }))
  ).sort((a, b) => a.week - b.week);

  return NextResponse.json({ candidates, currentWeek });
}
