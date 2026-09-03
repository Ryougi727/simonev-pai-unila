import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, faculty, mentorId } = await req.json();
  if (!name?.trim() || !faculty) return NextResponse.json({ error: "Nama dan fakultas wajib diisi." }, { status: 400 });

  const mentorIds = [...new Set(Array.isArray(mentorId) ? mentorId.filter(Boolean) : mentorId ? [mentorId] : [])];
  if (mentorIds.length > 2) return NextResponse.json({ error: "Maksimal dua mentor per kelompok." }, { status: 400 });
  const clashes = await prisma.kelompok.findMany({
    where: {
      OR: [
        { mentorId: { in: mentorIds } },
        { mentorAssignments: { some: { mentorId: { in: mentorIds } } } },
      ],
    },
    select: { id: true },
  });
  if (clashes.length) return NextResponse.json({ error: "Salah satu mentor sudah ditugaskan ke kelompok lain." }, { status: 400 });

  const kelompok = await prisma.kelompok.create({
    data: {
      name: name.trim(), faculty, mentorId: mentorIds[0] || null,
      mentorAssignments: { create: mentorIds.map((id: string) => ({ mentorId: id })) },
    },
  });

  await prisma.auditLog.create({
    data: { entity: "Kelompok", action: "Tambah", detail: `Menambahkan kelompok "${name}".`, userId: admin.id },
  });

  return NextResponse.json({ id: kelompok.id });
}
