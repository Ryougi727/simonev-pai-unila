import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type ImportRow = { npm: string; name: string; fakultas: string; jurusan: string; prodi: string };

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = (await req.json()) as { rows: ImportRow[] };
  if (!Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  // NPM is globally unique now (not scoped to a kelompok — praktikan can be imported unassigned)
  const existingNpms = new Set((await prisma.praktikan.findMany({ select: { npm: true } })).map((p) => p.npm));

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
    if (existingNpms.has(npm)) { skipped.push({ npm, name, reason: "NPM sudah terdaftar" }); continue; }

    await prisma.praktikan.create({ data: { npm, name, fakultas, jurusan, prodi, kelompokId: null } });
    existingNpms.add(npm);
    created++;
  }

  if (created) {
    await prisma.auditLog.create({
      data: {
        entity: "Praktikan", action: "Impor",
        detail: `Mengimpor ${created} praktikan dari Excel (belum dikelompokkan — assign lewat Manajemen Kelompok).`,
        userId: admin.id,
      },
    });
  }

  return NextResponse.json({ created, skipped });
}
