import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateUsername, genTempPassword } from "@/lib/username";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, name, email, faculty } = await req.json();
  if ((role !== "MENTOR" && role !== "PJ") || !name?.trim()) {
    return NextResponse.json({ error: "Role dan nama wajib diisi." }, { status: 400 });
  }

  const existing = (await prisma.user.findMany({ select: { username: true } })).map((u) => u.username);
  const username = generateUsername(name, existing);
  const password = genTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      role, name: name.trim(), email: email?.trim() || null, faculty: faculty || null,
      username, passwordHash, mustChangePassword: true, active: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: role === "MENTOR" ? "Mentor" : "PJ",
      action: "Tambah",
      detail: `Menambahkan ${role === "MENTOR" ? "mentor" : "PJ"} "${name}" (username: ${username}).`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ id: user.id, name: user.name, username, password });
}