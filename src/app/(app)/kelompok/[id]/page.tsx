import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { statusForPertemuan } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function KelompokProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) redirect("/login");
  if (!["ADMIN", "PJ", "MENTOR"].includes(user.role)) redirect("/dashboard");

  const kelompok = await prisma.kelompok.findFirst({
    where: {
      id: params.id,
      ...(user.role === "PJ" ? { faculty: user.faculty } : {}),
      ...(user.role === "MENTOR"
        ? { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] }
        : {}),
    },
    include: {
      mentor: { select: { id: true, name: true } },
      mentorAssignments: { select: { mentor: { select: { id: true, name: true } } } },
      praktikan: {
        select: { id: true, npm: true, name: true, fakultas: true, jurusan: true, prodi: true },
        orderBy: { name: "asc" },
      },
      pertemuan: {
        orderBy: { week: "asc" },
        include: {
          dokumentasi: { select: { id: true, url: true } },
          beritaAcara: { select: { materi: true, catatan: true, hadir: true, tidakHadir: true } },
          absensi: { select: { status: true } },
        },
      },
    },
  });
  if (!kelompok) notFound();

  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { totalMinggu: true, tahunAkademik: true, semester: true },
  });
  const totalWeeks = kalender?.totalMinggu ?? 8;
  const mentors = kelompok.mentorAssignments.length
    ? kelompok.mentorAssignments.map((assignment) => assignment.mentor)
    : kelompok.mentor ? [kelompok.mentor] : [];
  const completedMeetings = kelompok.pertemuan.filter((meeting) => meeting.status === "SELESAI").length;
  const backHref = user.role === "ADMIN" ? "/admin/kelompok" : user.role === "PJ" ? "/pj/monitoring" : "/mentor/jadwal";

  return (
    <div className="space-y-5">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary dark:hover:text-primary-dark">
          <ArrowLeft size={15} /> Kembali
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{kelompok.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{kelompok.faculty}</p>
          </div>
          {kalender && <p className="text-xs text-gray-500">{kalender.tahunAkademik} · Semester {kalender.semester}</p>}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Mentor" value={mentors.length ? mentors.map((mentor) => mentor.name).join(", ") : "Belum ditentukan"} />
        <SummaryCard label="Praktikan" value={`${kelompok.praktikan.length} orang`} />
        <SummaryCard label="Pertemuan selesai" value={`${completedMeetings} dari ${totalWeeks} minggu`} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dcefe2] bg-white dark:border-[#1d3527] dark:bg-[#0f1c14]">
        <div className="flex items-center gap-2 border-b border-[#dcefe2] px-5 py-4 dark:border-[#1d3527]">
          <Users size={17} className="text-primary dark:text-primary-dark" />
          <h2 className="font-semibold">Daftar Praktikan</h2>
        </div>
        {kelompok.praktikan.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-gray-400">
                  <th className="px-4 py-3 font-bold">NPM</th>
                  <th className="px-4 py-3 font-bold">Nama</th>
                  <th className="px-4 py-3 font-bold">Fakultas</th>
                  <th className="px-4 py-3 font-bold">Jurusan</th>
                  <th className="px-4 py-3 font-bold">Program Studi</th>
                </tr>
              </thead>
              <tbody>
                {kelompok.praktikan.map((praktikan) => (
                  <tr key={praktikan.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                    <td className="whitespace-nowrap px-4 py-3">{praktikan.npm}</td>
                    <td className="px-4 py-3 font-semibold">{praktikan.name}</td>
                    <td className="px-4 py-3">{praktikan.fakultas}</td>
                    <td className="px-4 py-3">{praktikan.jurusan}</td>
                    <td className="px-4 py-3">{praktikan.prodi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Belum ada praktikan di kelompok ini.</p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dcefe2] bg-white dark:border-[#1d3527] dark:bg-[#0f1c14]">
        <div className="border-b border-[#dcefe2] px-5 py-4 dark:border-[#1d3527]">
          <h2 className="font-semibold">Riwayat Pertemuan</h2>
          <p className="mt-1 text-xs text-gray-500">Pertemuan selesai {completedMeetings} dari {totalWeeks} minggu praktikum.</p>
        </div>
        {kelompok.pertemuan.length ? (
          <div className="divide-y divide-[#dcefe2] dark:divide-[#1d3527]">
            {kelompok.pertemuan.map((meeting) => {
              const status = statusForPertemuan(meeting);
              const attendance = meeting.beritaAcara
                ? { present: meeting.beritaAcara.hadir, absent: meeting.beritaAcara.tidakHadir }
                : meeting.absensi.reduce(
                    (counts, record) => {
                      if (record.status === "HADIR") counts.present++;
                      else counts.absent++;
                      return counts;
                    },
                    { present: 0, absent: 0 }
                  );

              return (
                <article key={meeting.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Minggu {meeting.week}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {meeting.date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                        {" · "}{meeting.time} · {meeting.location}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  {meeting.beritaAcara && (
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="font-semibold">Materi:</span> {meeting.beritaAcara.materi}</p>
                      {meeting.beritaAcara.catatan && <p><span className="font-semibold">Catatan:</span> {meeting.beritaAcara.catatan}</p>}
                      <p className="text-xs text-gray-500">Kehadiran tercatat: {attendance.present} hadir, {attendance.absent} izin/sakit/tidak hadir.</p>
                    </div>
                  )}
                  {!meeting.beritaAcara && meeting.absensi.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Kehadiran tercatat: {attendance.present} hadir, {attendance.absent} izin/sakit/tidak hadir.
                    </p>
                  )}
                  {meeting.dokumentasi.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {meeting.dokumentasi.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-square overflow-hidden rounded-lg border border-[#dcefe2] dark:border-[#1d3527]"
                          aria-label={`Buka dokumentasi minggu ${meeting.week}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt={`Dokumentasi minggu ${meeting.week}`} className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {!meeting.dokumentasi.length && (
                    <p className="mt-3 text-xs text-gray-400">Belum ada dokumentasi.</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Belum ada pertemuan untuk kelompok ini.</p>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dcefe2] bg-white p-4 dark:border-[#1d3527] dark:bg-[#0f1c14]">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
