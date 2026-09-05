import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { faculty, prefix, startNumber, mode, count: countInput, autoAssignMentor } = await req.json();
  if (!faculty || !prefix?.trim()) {
    return NextResponse.json({ error: "Fakultas dan prefix nama wajib diisi." }, { status: 400 });
  }

  let mentorPool: { id: string }[] = [];
  let count: number;

  if (mode === "auto-mentor") {
    const [assigned, legacyAssigned, allMentors] = await Promise.all([
      prisma.kelompokMentor.findMany({ select: { mentorId: true } }),
      prisma.kelompok.findMany({ where: { mentorId: { not: null } }, select: { mentorId: true } }),
      prisma.user.findMany({ where: { role: "MENTOR", active: true }, orderBy: { name: "asc" }, select: { id: true } }),
    ]);
    const assignedIds = new Set([...assigned.map((a) => a.mentorId), ...legacyAssigned.map((k) => k.mentorId!)]);
    mentorPool = allMentors.filter((m) => !assignedIds.has(m.id));
    count = mentorPool.length;
    if (!count) return NextResponse.json({ error: "Semua mentor aktif sudah punya kelompok." }, { status: 400 });
  } else {
    count = Number(countInput);
    if (!count || count < 1 || count > 100) {
      return NextResponse.json({ error: "Jumlah kelompok tidak valid (1-100)." }, { status: 400 });
    }
  }

  const start = Number(startNumber) || 1;
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    const name = `${prefix.trim()} ${start + i}`;
    const mentor = mode === "auto-mentor" && autoAssignMentor ? mentorPool[i] : null;
    await prisma.kelompok.create({
      data: {
        name, faculty,
        mentorId: mentor?.id || null,
        mentorAssignments: mentor ? { create: [{ mentorId: mentor.id }] } : undefined,
      },
    });
    names.push(name);
  }

  await prisma.auditLog.create({
    data: {
      entity: "Kelompok", action: "Generate Massal",
      detail: `Membuat ${names.length} kelompok sekaligus untuk ${faculty} (${mode === "auto-mentor" ? "otomatis sesuai mentor tersedia" : "jumlah manual"}).`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ created: names.length, names });
}
