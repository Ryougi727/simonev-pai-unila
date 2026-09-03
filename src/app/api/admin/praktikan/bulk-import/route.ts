import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type ImportRow = { npm: string; name: string; fakultas: string; jurusan: string; prodi: string };

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kelompokId, rows } = (await req.json()) as { kelompokId: string; rows: ImportRow[] };
  if (!kelompokId || !Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const kelompok = await prisma.kelompok.findUnique({ where: { id: kelompokId } });
  if (!kelompok) return NextResponse.json({ error: "Kelompok tidak ditemukan." }, { status: 404 });

  const existingNpms = new Set(
    (await prisma.praktikan.findMany({ where: { kelompokId }, select: { npm: true } })).map((p) => p.npm)
  );

  let created = 0;
  const skipped: { npm: string; name: string; reason: string }[] = [];

  for (const row of rows) {
    const npm = (row.npm || "").trim();
    const name = (row.name || "").trim();
    const fakultas = (row.fakultas || "").trim();
    const jurusan = (row.jurusan || "").trim();
    const prodi = (row.prodi || "").trim();
    if (!npm || !name || !fakultas || !jurusan || !prodi) {
      skipped.push({ npm: npm || "-", name: name || "-", reason: "Ada kolom wajib yang kosong" });
      continue;
    }
    if (existingNpms.has(npm)) { skipped.push({ npm, name, reason: "NPM sudah ada di kelompok ini" }); continue; }

    await prisma.praktikan.create({ data: { npm, name, fakultas, jurusan, prodi, kelompokId } });
    existingNpms.add(npm);
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