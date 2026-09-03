import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateUsername } from "../src/lib/username";

const prisma = new PrismaClient();

async function main() {
  const rawUsers = [
    { role: "ADMIN" as const, name: "Admin Praktikum", email: "admin.pai@unila.ac.id" },
    { role: "PJ" as const, name: "Ust. Fajar Ramadhan", email: "fajar.pj@unila.ac.id", faculty: "FMIPA" },
    { role: "PJ" as const, name: "Ust. Dedi Kurniawan", email: "dedi.pj@unila.ac.id", faculty: "Teknik" },
    { role: "MENTOR" as const, name: "Ahmad Zaki Mubarak", email: "zaki.mentor@unila.ac.id", faculty: "FMIPA" },
    { role: "MENTOR" as const, name: "Siti Nurhaliza", email: "siti.mentor@unila.ac.id", faculty: "Teknik" },
    { role: "MENTOR" as const, name: "Budi Santoso", email: "budi.mentor@unila.ac.id", faculty: "FMIPA" },
    { role: "MENTOR" as const, name: "Rina Wahyuni", email: "rina.mentor@unila.ac.id", faculty: "Teknik" },
  ];

  const usedUsernames: string[] = [];
  const users = [];
  for (const u of rawUsers) {
    const username = u.role === "ADMIN" ? "admin" : generateUsername(u.name, usedUsernames);
    usedUsernames.push(username);
    const passwordHash = await bcrypt.hash(u.role === "ADMIN" ? "admin123" : "praktikum2026", 10);
    const created = await prisma.user.upsert({
      where: { username },
      update: {},
      create: { ...u, username, passwordHash, mustChangePassword: false },
    });
    users.push(created);
  }

  const mentors = users.filter((u) => u.role === "MENTOR");
  const kelompokDefs = [
    { name: "Kelompok 1", faculty: "FMIPA", mentor: mentors[0] },
    { name: "Kelompok 2", faculty: "Teknik", mentor: mentors[1] },
    { name: "Kelompok 3", faculty: "FMIPA", mentor: mentors[2] },
    { name: "Kelompok 4", faculty: "Teknik", mentor: mentors[3] },
  ];
  const namaDepan = ["Rizky", "Putri", "Dimas", "Ayu", "Fajar", "Nadia", "Reza", "Sinta"];
  const namaBelakang = ["Pratama", "Lestari", "Saputra", "Ramadhani", "Wijaya", "Anggraini"];

  for (let ki = 0; ki < kelompokDefs.length; ki++) {
    const kd = kelompokDefs[ki];
    const kelompok = await prisma.kelompok.create({
      data: {
        name: kd.name, faculty: kd.faculty, mentorId: kd.mentor?.id,
        mentorAssignments: kd.mentor ? { create: [{ mentorId: kd.mentor.id }] } : undefined,
      },
    });
    for (let i = 0; i < 6; i++) {
      await prisma.praktikan.create({
        data: {
          npm: `23110${ki}${String(i + 1).padStart(2, "0")}`,
          name: `${namaDepan[(ki * 6 + i) % namaDepan.length]} ${namaBelakang[(ki * 3 + i) % namaBelakang.length]}`,
          fakultas: kd.faculty,
          jurusan: "Teknik Informatika",
          prodi: "S1 Teknik Informatika",
          kelompokId: kelompok.id,
        },
      });
    }
  }

  const materi = [
    ["Makharijul Huruf", "Rukun Iman & Islam"],
    ["Hukum Nun Mati & Tanwin", "Thaharah"],
    ["Hukum Mim Mati", "Shalat Fardhu"],
    ["Qalqalah", "Adab Menuntut Ilmu"],
    ["Mad Thabi'i", "Akhlak kepada Sesama"],
    ["Mad Far'i", "Fiqih Puasa"],
    ["Waqaf & Ibtida'", "Sirah Nabawiyah"],
    ["Evaluasi Bacaan", "Refleksi & Evaluasi"],
  ];
  for (let i = 0; i < materi.length; i++) {
    await prisma.materi.upsert({
      where: { week: i + 1 },
      update: {},
      create: { week: i + 1, tahsin: materi[i][0], keislaman: materi[i][1] },
    });
  }

  await prisma.kalenderPraktikum.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", tahunAkademik: "2025/2026", semester: "Ganjil", totalMinggu: 8, currentWeek: 3 },
  });

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", appName: "SIMONEV PAI", qrDurationMinutes: 10, maxPhotos: 3, defaultTheme: "light" },
  });

  console.log("Seed selesai. Username demo:");
  for (const u of users) console.log(`  ${u.role.padEnd(7)} ${u.username}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
