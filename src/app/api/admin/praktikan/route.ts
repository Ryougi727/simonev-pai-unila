import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { npm, name, fakultas, jurusan, prodi, kelompokId } = await req.json();
  if (!npm?.trim() || !name?.trim() || !fakultas?.trim() || !jurusan?.trim() || !prodi?.trim()) {
    return NextResponse.json({ error: "NPM, nama, fakultas, jurusan, dan prodi wajib diisi." }, { status: 400 });
  }

  try {
    const praktikan = await prisma.praktikan.create({
      data: { npm: npm.trim(), name: name.trim(), fakultas: fakultas.trim(), jurusan: jurusan.trim(), prodi: prodi.trim(), kelompokId: kelompokId || null },
    });
    await prisma.auditLog.create({
      data: { entity: "Praktikan", action: "Tambah", detail: `Menambahkan praktikan "${name}" (${npm}).`, userId: admin.id },
    });
    return NextResponse.json({ id: praktikan.id });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "NPM sudah terdaftar." }, { status: 400 });
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
