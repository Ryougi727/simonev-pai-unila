import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, faculty, monitoringStartWeek, mentorId, praktikanIds, importedPraktikan } = await req.json();
  if (!name?.trim() || !faculty) return NextResponse.json({ error: "Nama dan fakultas wajib diisi." }, { status: 400 });

  const mentorIds = [...new Set(Array.isArray(mentorId) ? mentorId.filter(Boolean) : mentorId ? [mentorId] : [])];
  if (mentorIds.length > 2) return NextResponse.json({ error: "Maksimal dua mentor per kelompok." }, { status: 400 });
  const selectedIds: string[] = Array.isArray(praktikanIds)
    ? [...new Set(praktikanIds.filter((id: unknown): id is string => typeof id === "string" && id))]
    : [];
  const importRows: { npm: string; name: string }[] = Array.isArray(importedPraktikan) ? importedPraktikan : [];
  if (importRows.some((row) => typeof row?.npm !== "string" || typeof row?.name !== "string" || !row.npm.trim() || !row.name.trim())) {
    return NextResponse.json({ error: "Data impor harus memiliki NPM dan nama." }, { status: 400 });
  }

  const importedNpms = importRows.map((row) => row.npm.trim());
  if (new Set(importedNpms).size !== importedNpms.length) {
    return NextResponse.json({ error: "NPM duplikat ditemukan pada data impor." }, { status: 400 });
  }

  const importedIds: string[] = [];
  if (importRows.length) {
    const importedRecords = await prisma.praktikan.findMany({
      where: { npm: { in: importedNpms } },
      select: { id: true, npm: true, name: true },
    });
    const recordsByNpm = new Map<string, (typeof importedRecords)[number]>();
    for (const importedRecord of importedRecords) {
      recordsByNpm.set(importedRecord.npm, importedRecord);
    }
    for (const row of importRows) {
      const record = recordsByNpm.get(row.npm.trim());
      if (!record || record.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id") !== row.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id")) {
        return NextResponse.json({ error: `NPM dan nama "${row.npm.trim()}" tidak cocok dengan data praktikan.` }, { status: 400 });
      }
      importedIds.push(record.id);
    }
  }

  const assignmentIds = [...new Set([...selectedIds, ...importedIds])];
  const praktikanRows = assignmentIds.length
    ? await prisma.praktikan.findMany({ where: { id: { in: assignmentIds } }, select: { id: true, kelompokId: true } })
    : [];
  if (praktikanRows.length !== assignmentIds.length) {
    return NextResponse.json({ error: "Sebagian praktikan yang dipilih tidak ditemukan." }, { status: 400 });
  }
  if (praktikanRows.some((row) => row.kelompokId)) {
    return NextResponse.json({ error: "Sebagian praktikan sudah masuk kelompok lain. Muat ulang halaman lalu coba lagi." }, { status: 409 });
  }

  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { currentWeek: true, totalMinggu: true },
  });
  const startWeek = monitoringStartWeek ?? kalender?.currentWeek ?? 1;
  const totalWeeks = kalender?.totalMinggu ?? 8;
  if (!Number.isInteger(startWeek) || startWeek < 1 || startWeek > totalWeeks) {
    return NextResponse.json({ error: `Minggu mulai monitoring harus antara 1 dan ${totalWeeks}.` }, { status: 400 });
  }

  let kelompok;
  try {
    kelompok = await prisma.$transaction(async (tx) => {
      const createdGroup = await tx.kelompok.create({
        data: {
          name: name.trim(),
          faculty,
          monitoringStartWeek: startWeek,
          mentorId: mentorIds[0] || null,
          mentorAssignments: { create: mentorIds.map((id: string) => ({ mentorId: id })) },
        },
      });
      if (assignmentIds.length) {
        const assignment = await tx.praktikan.updateMany({
          where: { id: { in: assignmentIds }, kelompokId: null },
          data: { kelompokId: createdGroup.id },
        });
        if (assignment.count !== assignmentIds.length) throw new Error("PRAKTIKAN_ALREADY_ASSIGNED");
      }
      return createdGroup;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRAKTIKAN_ALREADY_ASSIGNED") {
      return NextResponse.json({ error: "Sebagian praktikan baru saja masuk kelompok lain. Muat ulang halaman lalu coba lagi." }, { status: 409 });
    }
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      entity: "Kelompok",
      action: "Tambah",
      detail: `Menambahkan kelompok "${name}"${assignmentIds.length ? ` dengan ${assignmentIds.length} praktikan` : ""}.`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ id: kelompok.id });
}
