import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, faculty } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { name: name.trim(), email: email?.trim() || null, faculty: faculty || null },
  });

  await prisma.auditLog.create({
    data: { entity: user.role === "MENTOR" ? "Mentor" : "PJ", action: "Ubah", detail: `Memperbarui data "${user.name}".`, userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

  const deletedName = user.name;
  const userRole = user.role === "MENTOR" ? "Mentor" : "PJ";

  // Remove mentor from any kelompok they are assigned to.
  // PJ does not currently have a direct kelompok relation in the Prisma schema.
  if (user.role === "MENTOR") {
    await prisma.kelompok.updateMany({
      where: { mentorId: params.id },
      data: { mentorId: null },
    });
    await prisma.kelompokMentor.deleteMany({ where: { mentorId: params.id } });
  }

  // Delete the user
  await prisma.user.delete({ where: { id: params.id } });

  // Log deletion (without the deleted user's name, as requested)
  await prisma.auditLog.create({
    data: {
      entity: userRole,
      action: "Hapus",
      detail: `Menghapus ${userRole.toLowerCase()} (data sudah dihapus).`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ ok: true });
}