import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, faculty, mentorId } = await req.json();
  if (!name?.trim() || !faculty) return NextResponse.json({ error: "Nama dan fakultas wajib diisi." }, { status: 400 });

  if (mentorId) {
    const clash = await prisma.kelompok.findFirst({ where: { mentorId } });
    if (clash) return NextResponse.json({ error: "Mentor ini sudah ditugaskan ke kelompok lain." }, { status: 400 });
  }

  const kelompok = await prisma.kelompok.create({
    data: { name: name.trim(), faculty, mentorId: mentorId || null },
  });

  await prisma.auditLog.create({
    data: { entity: "Kelompok", action: "Tambah", detail: `Menambahkan kelompok "${name}".`, userId: admin.id },
  });

  return NextResponse.json({ id: kelompok.id });
}
