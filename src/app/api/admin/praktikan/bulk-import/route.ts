import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type ImportRow = { nim: string; name: string };

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kelompokId, rows } = (await req.json()) as { kelompokId: string; rows: ImportRow[] };
  if (!kelompokId || !Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const kelompok = await prisma.kelompok.findUnique({ where: { id: kelompokId } });
  if (!kelompok) return NextResponse.json({ error: "Kelompok tidak ditemukan." }, { status: 404 });

  const existingNims = new Set(
    (await prisma.praktikan.findMany({ where: { kelompokId }, select: { nim: true } })).map((p) => p.nim)
  );

  let created = 0;
  const skipped: { nim: string; name: string; reason: string }[] = [];

  for (const row of rows) {
    const nim = (row.nim || "").trim();
    const name = (row.name || "").trim();
    if (!nim || !name) { skipped.push({ nim: nim || "-", name: name || "-", reason: "NIM/nama kosong" }); continue; }
    if (existingNims.has(nim)) { skipped.push({ nim, name, reason: "NIM sudah ada di kelompok ini" }); continue; }

    await prisma.praktikan.create({ data: { nim, name, kelompokId } });
    existingNims.add(nim);
    created++;
  }

  if (created) {
    await prisma.auditLog.create({
      data: {
        entity: "Praktikan", action: "Impor",
        detail: `Mengimpor ${created} praktikan ke kelompok "${kelompok.name}" dari Excel.`,
        userId: admin.id,
      },
    });
  }

  return NextResponse.json({ created, skipped });
}
