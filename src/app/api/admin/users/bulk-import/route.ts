import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateUsername, genTempPassword } from "@/lib/username";
import { requireAdmin } from "@/lib/require-admin";

type ImportRow = { name: string; faculty?: string; email?: string };

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, rows } = (await req.json()) as { role: "MENTOR" | "PJ"; rows: ImportRow[] };
  if ((role !== "MENTOR" && role !== "PJ") || !Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const existingUsernames = (await prisma.user.findMany({ select: { username: true } })).map((u) => u.username);
  const created: { name: string; username: string; password: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const row of rows) {
    const name = (row.name || "").trim();
    if (!name) { skipped.push({ name: "(baris kosong)", reason: "Nama kosong" }); continue; }

    const username = generateUsername(name, existingUsernames);
    existingUsernames.push(username);
    const password = genTempPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await prisma.user.create({
        data: {
          role, name, email: row.email?.trim() || null, faculty: row.faculty?.trim() || null,
          username, passwordHash, mustChangePassword: true, active: true,
        },
      });
      created.push({ name, username, password });
    } catch {
      skipped.push({ name, reason: "Gagal disimpan ke database" });
    }
  }

  if (created.length) {
    await prisma.auditLog.create({
      data: {
        entity: role === "MENTOR" ? "Mentor" : "PJ",
        action: "Impor",
        detail: `Mengimpor ${created.length} akun ${role === "MENTOR" ? "mentor" : "PJ"} dari Excel.`,
        userId: admin.id,
      },
    });
  }

  return NextResponse.json({ created, skipped });
}