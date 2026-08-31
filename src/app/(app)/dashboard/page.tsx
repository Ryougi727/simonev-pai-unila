import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  UserCog, Building2, Users, GraduationCap, Clock, MapPin, ArrowRight,
  CheckCircle2, Megaphone, QrCode,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusForPertemuan } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;

  if (user.role === "ADMIN") return <AdminDashboard name={user.name} />;
  if (user.role === "PJ") return <PJDashboard faculty={user.faculty} name={user.name} />;
  return <MentorDashboard userId={user.id} name={user.name} />;
}

/* ---------------------------------- ADMIN ---------------------------------- */
async function AdminDashboard({ name }: { name: string }) {
  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const week = kalender?.currentWeek ?? 1;

  const [mentorCount, pjCount, kelompokCount, praktikanCount, kelompokAktif, activity] = await Promise.all([
    prisma.user.count({ where: { role: "MENTOR", active: true } }),
    prisma.user.count({ where: { role: "PJ", active: true } }),
    prisma.kelompok.count(),
    prisma.praktikan.count(),
    prisma.kelompok.findMany({ where: { mentorId: { not: null } }, include: { pertemuan: { where: { week } } } }),
    prisma.activityLog.findMany({ include: { user: true }, orderBy: { at: "desc" }, take: 5 }),
  ]);

  const statuses = kelompokAktif.map((k) => statusForPertemuan(k.pertemuan[0] ?? null));
  const selesai = statuses.filter((s) => s === "selesai").length;
  const pct = kelompokAktif.length ? Math.round((selesai / kelompokAktif.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Hero
        kalender={kalender}
        title={<>Assalamu&apos;alaikum, <span className="text-primary dark:text-primary-dark">{name.split(" ")[0]}</span></>}
        subtitle="Selamat datang di Sistem Informasi Monitoring dan Evaluasi PAI. Berikut ringkasan aktivitas praktikum saat ini."
        cta={{ href: "/pengumuman", label: "Buat Pengumuman", icon: Megaphone }}
      />

      <StatGrid
        stats={[
          { label: "Mentor Aktif", value: mentorCount, icon: UserCog },
          { label: "PJ Fakultas", value: pjCount, icon: Building2 },
          { label: "Kelompok", value: kelompokCount, icon: Users },
          { label: "Praktikan", value: praktikanCount, icon: GraduationCap },
        ]}
      />

      <div className="grid lg:grid-cols-5 gap-4">
        <Panel title="Pelaksanaan Minggu Ini" className="lg:col-span-2">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display text-4xl font-bold text-on-surface">{pct}%</span>
            <span className="text-xs text-on-surface-variant">{selesai}/{kelompokAktif.length} kelompok selesai</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-container-high overflow-hidden mb-4">
            <div className="h-full rounded-full bg-gradient-to-r from-primary dark:from-primary-dark to-primary-hover dark:to-primary-darkHover transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-2">
            {(["selesai", "terjadwal", "belum_jadwal", "belum_laksana"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <StatusBadge status={s} />
                <span className="font-bold text-on-surface">{statuses.filter((x) => x === s).length}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Aktivitas Terbaru" className="lg:col-span-3">
          {activity.length ? (
            <div className="space-y-1">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-outline-variant/30 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={14} className="text-on-surface-variant" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-on-surface leading-snug">{a.text}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {a.at.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRow text="Belum ada aktivitas tercatat." />
          )}
          <Link href="/admin/activity" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-dark">
            Lihat semua <ArrowRight size={12} />
          </Link>
        </Panel>
      </div>
    </div>
  );
}

/* ----------------------------------- PJ ------------------------------------ */
async function PJDashboard({ faculty, name }: { faculty?: string; name: string }) {
  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const week = kalender?.currentWeek ?? 1;

  const kelompok = await prisma.kelompok.findMany({
    where: { faculty, mentorId: { not: null } },
    include: { mentor: true, pertemuan: { where: { week } } },
  });

  const rows = kelompok.map((k) => ({
    id: k.id, name: k.name, mentor: k.mentor?.name ?? "-",
    status: statusForPertemuan(k.pertemuan[0] ?? null),
  }));
  const selesai = rows.filter((r) => r.status === "selesai").length;
  const pct = rows.length ? Math.round((selesai / rows.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Hero
        kalender={kalender}
        eyebrowPrefix={`Fakultas ${faculty} · `}
        title={<>Assalamu&apos;alaikum, <span className="text-primary dark:text-primary-dark">{name.split(" ")[0]}</span></>}
        subtitle="Pantau perkembangan mentor binaan dan sampaikan pengumuman untuk fakultas Anda."
        cta={{ href: "/pj/monitoring", label: "Lihat Monitoring", icon: Users }}
      />

      <StatGrid
        stats={[
          { label: "Kelompok Dibina", value: rows.length, icon: Users },
          { label: "Sudah Mengajar", value: selesai, icon: CheckCircle2 },
          { label: "Belum Mengajar", value: rows.length - selesai, icon: Clock },
          { label: "Persentase", value: `${pct}%`, icon: GraduationCap },
        ]}
      />

      <Panel title="Status Mentor Minggu Ini" noPadding>
        {rows.length ? (
          <Table
            head={["Kelompok", "Mentor", "Status"]}
            rows={rows.map((r) => [r.name, r.mentor, <StatusBadge key={r.id} status={r.status} />])}
          />
        ) : (
          <EmptyRow text="Belum ada kelompok pada fakultas ini." />
        )}
      </Panel>
    </div>
  );
}

/* --------------------------------- MENTOR ----------------------------------- */
async function MentorDashboard({ userId, name }: { userId: string; name: string }) {
  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const week = kalender?.currentWeek ?? 1;

  const [kelompokList, materiMinggu] = await Promise.all([
    prisma.kelompok.findMany({ where: { mentorId: userId }, include: { pertemuan: { orderBy: { week: "desc" } } } }),
    prisma.materi.findUnique({ where: { week } }),
  ]);

  if (!kelompokList.length) {
    return (
      <Hero
        kalender={kalender}
        title={<>Assalamu&apos;alaikum, <span className="text-primary dark:text-primary-dark">{name.split(" ")[0]}</span></>}
        subtitle="Anda belum memiliki kelompok. Hubungi Admin untuk penugasan kelompok."
      />
    );
  }

  const allPertemuan = kelompokList.flatMap((k) => k.pertemuan.map((p) => ({ ...p, kelompokName: k.name })));
  const nextUp = allPertemuan.find((p) => p.status === "TERJADWAL");
  const riwayat = [...allPertemuan].sort((a, b) => b.week - a.week).slice(0, 8);

  return (
    <div className="space-y-6">
      <Hero
        kalender={kalender}
        title={<>Assalamu&apos;alaikum, <span className="text-primary dark:text-primary-dark">{name.split(" ")[0]}</span></>}
        subtitle="Berikut jadwal dan materi praktikum Anda untuk minggu ini."
        cta={nextUp ? { href: "/mentor/qr", label: "Buka QR Absensi", icon: QrCode } : undefined}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Panel title="Materi Minggu Ini">
          {materiMinggu ? (
            <div className="text-sm space-y-2.5 text-on-surface">
              <div><span className="text-on-surface-variant font-semibold">Tahsin — </span>{materiMinggu.tahsin}</div>
              <div><span className="text-on-surface-variant font-semibold">Keislaman — </span>{materiMinggu.keislaman}</div>
            </div>
          ) : <EmptyRow text="Materi minggu ini belum ditentukan Admin." />}
        </Panel>
        <Panel title="Jadwal Berikutnya">
          {nextUp ? (
            <div className="text-sm space-y-1.5">
              <div className="font-bold text-on-surface">{nextUp.kelompokName} — Minggu {nextUp.week}</div>
              <div className="text-on-surface-variant text-xs flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(nextUp.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, {nextUp.time}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {nextUp.location}</span>
              </div>
            </div>
          ) : <EmptyRow text="Belum ada jadwal terjadwal." />}
        </Panel>
      </div>

      <Panel title="Riwayat Pertemuan" noPadding>
        {riwayat.length ? (
          <Table
            head={["Minggu", "Kelompok", "Tanggal", "Status"]}
            rows={riwayat.map((p) => [
              p.week, p.kelompokName,
              new Date(p.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
              <StatusBadge key={p.id} status={statusForPertemuan(p)} />,
            ])}
          />
        ) : <EmptyRow text="Belum ada riwayat pertemuan." />}
      </Panel>
    </div>
  );
}

/* --------------------------------- shared bits -------------------------------- */
function Hero({
  kalender, title, subtitle, cta, eyebrowPrefix = "",
}: {
  kalender: any; title: React.ReactNode; subtitle: string;
  cta?: { href: string; label: string; icon: any }; eyebrowPrefix?: string;
}) {
  const Cta = cta?.icon;
  return (
    <div className="relative rounded-3xl bg-surface-container overflow-hidden shadow-sm border border-outline-variant/30">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 dark:from-primary-dark/10 via-surface-container to-surface-container-low pointer-events-none" />
      <div className="absolute top-0 right-0 p-6 opacity-[0.15] pointer-events-none hidden sm:block">
        <svg width="160" height="160" viewBox="0 0 200 200" fill="none" className="text-primary dark:text-primary-dark">
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeDasharray="10 10" strokeWidth="2" />
          <circle cx="100" cy="100" r="58" stroke="currentColor" strokeWidth="1" />
          <path d="M100 20 L100 180 M20 100 L180 100" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" />
        </svg>
      </div>
      <div className="relative z-10 p-6 md:p-9 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary-dark/10 text-primary dark:text-primary-dark">
            <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-primary-dark animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {eyebrowPrefix}{kalender ? `Minggu ke-${kalender.currentWeek} · ${kalender.semester} ${kalender.tahunAkademik}` : "Kalender belum diatur"}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-variant max-w-xl leading-relaxed">{subtitle}</p>
        </div>
        {cta && (
          <Link href={cta.href} className="shrink-0 flex items-center gap-2 px-5 py-3 bg-primary dark:bg-primary-dark text-white dark:text-[#00391d] rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity">
            {Cta && <Cta size={17} />} {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function StatGrid({ stats }: { stats: { label: string; value: string | number; icon: any }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/30 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 dark:bg-primary-dark/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
            <div className="relative z-10 p-2.5 bg-surface-container rounded-xl text-primary dark:text-primary-dark inline-flex mb-4">
              <Icon size={20} />
            </div>
            <div className="relative z-10">
              <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1">{s.label}</h3>
              <div className="font-display text-3xl font-bold text-on-surface">{s.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ title, children, className = "", noPadding = false }: { title: string; children: React.ReactNode; className?: string; noPadding?: boolean }) {
  return (
    <div className={`bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <div className="px-5 py-3.5 font-bold text-sm text-on-surface border-b border-outline-variant/30 bg-primary/5 dark:bg-primary-dark/5">{title}</div>
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[11px] uppercase text-on-surface-variant text-left">
          {head.map((h) => <th key={h} className="px-5 py-2.5 font-bold">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-outline-variant/30">
            {r.map((c, j) => <td key={j} className={`px-5 py-3 ${j === 0 ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-xs text-on-surface-variant text-center py-6">{text}</p>;
}
