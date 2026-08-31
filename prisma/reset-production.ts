/**
 * One-time cleanup before going live: removes all demo/testing data while
 * keeping the Admin account and the Kalender/Materi/Settings values that
 * have already been configured for real use (e.g. "2026 / Ganjil").
 *
 * Run once: `pnpm db:reset-production`
 * Safe to re-run — it's all deleteMany(), nothing errors if already empty.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Menghapus data demo...");

  // children first, respecting foreign keys
  await prisma.dokumentasi.deleteMany({});
  await prisma.beritaAcara.deleteMany({});
  await prisma.absensi.deleteMany({});
  await prisma.pertemuan.deleteMany({});
  await prisma.praktikan.deleteMany({});
  await prisma.kelompok.deleteMany({});
  await prisma.pengumuman.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.archive.deleteMany({});

  const removedUsers = await prisma.user.deleteMany({ where: { role: { in: ["MENTOR", "PJ"] } } });
  console.log(`Menghapus ${removedUsers.count} akun mentor/PJ demo.`);

  console.log("");
  console.log("Selesai. Yang DIPERTAHANKAN: akun Admin, Kalender, Materi, dan Pengaturan Sistem.");
  console.log("PENTING: login sebagai Admin lalu buka /change-password untuk ganti password dari admin123 sebelum deploy.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
