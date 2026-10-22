import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { genTempPassword } from "@/lib/username";
import { requireAdmin } from "@/lib/require-admin";

type Role = "MENTOR" | "PJ";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const role: Role = body?.role;
  const userIds = body?.userIds;
  if (
    (role !== "MENTOR" && role !== "PJ") ||
    !Array.isArray(userIds) ||
    !userIds.length ||
    userIds.length > 500 ||
    userIds.some((id: unknown) => typeof id !== "string" || !id)
  ) {
    return NextResponse.json({ error: "Data pengguna tidak valid." }, { status: 400 });
  }

  const requestedIds = Array.from(new Set(userIds as string[]));
  const users = await prisma.user.findMany({
    where: { id: { in: requestedIds } },
    select: { id: true, name: true, username: true, role: true, mustChangePassword: true },
  });
  const eligibleUsers = users.filter((user) => user.role === role && user.mustChangePassword);
  const eligibleIds = new Set(eligibleUsers.map((user) => user.id));
  const skipped = requestedIds
    .filter((id) => !eligibleIds.has(id))
    .map((id) => {
      const user = users.find((item) => item.id === id);
      return {
        name: user?.name ?? "Akun tidak ditemukan",
        reason: "Akun tidak lagi memenuhi filter belum login",
      };
    });
  const candidates: {
    id: string;
    name: string;
    username: string;
    password: string;
    passwordHash: string;
  }[] = [];
  for (const user of eligibleUsers) {
    const password = genTempPassword();
    candidates.push({
      ...user,
      password,
      passwordHash: await bcrypt.hash(password, 10),
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const created: { name: string; username: string; password: string }[] = [];
    const transactionSkipped = [...skipped];

    for (const candidate of candidates) {
      const update = await tx.user.updateMany({
        where: { id: candidate.id, role, mustChangePassword: true },
        data: { passwordHash: candidate.passwordHash },
      });
      if (update.count) {
        created.push({ name: candidate.name, username: candidate.username, password: candidate.password });
      } else {
        transactionSkipped.push({
          name: candidate.name,
          reason: "Status akun berubah sebelum password diperbarui",
        });
      }
    }

    if (created.length) {
      await tx.auditLog.create({
        data: {
          entity: role === "MENTOR" ? "Mentor" : "PJ",
          action: "Reset Password Massal",
          detail: `Membuat ulang password untuk ${created.length} akun ${role === "MENTOR" ? "mentor" : "PJ"}.`,
          userId: admin.id,
        },
      });
    }

    return { created, skipped: transactionSkipped };
  }, { timeout: 60_000 });

  return NextResponse.json(result);
}
