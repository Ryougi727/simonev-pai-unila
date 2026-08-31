import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nim, name, kelompokId } = await req.json();
  if (!nim?.trim() || !name?.trim() || !kelompokId) {
    return NextResponse.json({ error: "NIM, nama, dan kelompok wajib diisi." }, { status: 400 });
  }

  try {
    const praktikan = await prisma.praktikan.create({
      data: { nim: nim.trim(), name: name.trim(), kelompokId },
    });
    await prisma.auditLog.create({
      data: { entity: "Praktikan", action: "Tambah", detail: `Menambahkan praktikan "${name}" (${nim}).`, userId: admin.id },
    });
    return NextResponse.json({ id: praktikan.id });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "NIM sudah terdaftar di kelompok ini." }, { status: 400 });
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
