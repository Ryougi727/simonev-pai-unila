import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type MateriRow = { week: number; tahsin: string; keislaman: string };

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { materi } = (await req.json()) as { materi: MateriRow[] };
  if (!Array.isArray(materi) || !materi.length) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  await prisma.$transaction(
    materi.map((m) =>
      prisma.materi.upsert({
        where: { week: m.week },
        update: { tahsin: m.tahsin, keislaman: m.keislaman },
        create: { week: m.week, tahsin: m.tahsin, keislaman: m.keislaman },
      })
    )
  );

  await prisma.auditLog.create({
    data: { entity: "Materi", action: "Ubah", detail: "Memperbarui materi mingguan praktikum.", userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
