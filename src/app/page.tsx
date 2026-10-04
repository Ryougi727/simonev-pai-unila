import Link from "next/link";
import { Calendar, ArrowRight, ImageIcon, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { IslamicPatternBackground } from "@/components/islamic-pattern";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [upcoming, allBerita, galeriFotos, settings] = await Promise.all([
    prisma.berita.findMany({
      where: { published: true, category: { in: ["Kajian", "Acara"] }, eventDate: { gte: new Date(new Date().toDateString()) } },
      include: { photos: true },
      orderBy: { eventDate: "asc" },
      take: 3,
    }),
    prisma.berita.findMany({
      where: { published: true },
      include: { photos: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    prisma.galeri.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], take: 10 }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);
  const galeriSubtitle = settings?.galeriSubtitle ?? "Momen Praktikum PAI";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <IslamicPatternBackground />
        <div className="relative z-10 max-w-6xl mx-auto px-5 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary-dark/10 text-primary dark:text-primary-dark mb-5">
            <Sparkles size={13} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Universitas Lampung</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-on-surface mb-4 max-w-2xl mx-auto leading-tight">
            Sistem Monitoring dan Evaluasi Praktikum PAI
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Informasi berita, kajian, dan agenda seputar Praktikum Pendidikan Agama Islam — dikelola oleh Bina Rohani
            Mahasiswa Islam Universitas Lampung.
          </p>
        </div>
      </section>

      {/* Upcoming kajian/acara */}
      {upcoming.length > 0 && (
        <section id="kajian" className="max-w-6xl mx-auto px-5 py-10 w-full">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={18} className="text-primary dark:text-primary-dark" />
            <h2 className="font-display text-xl font-bold text-on-surface">Kajian &amp; Acara Mendatang</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {upcoming.map((item) => (
              <Link
                key={item.id}
                href={`/berita/${item.id}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 dark:from-primary-dark/10 to-surface-container-low border border-primary/30 dark:border-primary-dark/30 p-5 hover:shadow-md transition-shadow"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-primary dark:text-primary-dark">{item.category}</span>
                <div className="font-display text-base font-bold text-on-surface mt-1.5 mb-1.5 line-clamp-2">{item.title}</div>
                {item.eventDate && (
                  <div className="text-xs text-on-surface-variant font-semibold">
                    {item.eventDate.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-dark mt-3">
                  Lihat detail <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Galeri */}
      {galeriFotos.length > 0 && (
        <section id="galeri" className="py-10 w-full">
          <div className="max-w-6xl mx-auto px-5 mb-5">
            <h2 className="font-display text-xl font-bold text-on-surface">Galeri</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{galeriSubtitle}</p>
          </div>
          <div className="overflow-hidden">
            <div className="flex gap-4 w-max animate-marquee">
              {[...galeriFotos, ...galeriFotos].map((f, i) => (
                <div key={`${f.id}-${i}`} className="w-64 sm:w-80 h-44 sm:h-52 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Berita grid */}
      <section id="berita" className="max-w-6xl mx-auto px-5 py-10 w-full flex-1">
        <h2 className="font-display text-xl font-bold text-on-surface mb-5">Berita Terbaru</h2>
        {allBerita.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allBerita.map((item) => (
              <Link
                key={item.id}
                href={`/berita/${item.id}`}
                className="group rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/30 hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-surface-container-high flex items-center justify-center overflow-hidden">
                  {item.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photos[0].url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ImageIcon size={28} className="text-outline" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary dark:text-primary-dark">{item.category}</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {item.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="font-display text-base font-bold text-on-surface mb-1.5 line-clamp-2">{item.title}</div>
                  <p className="text-xs text-on-surface-variant line-clamp-2">{item.excerpt || item.content}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-sm text-on-surface-variant">Belum ada berita yang diterbitkan.</div>
        )}
      </section>

      <PublicFooter />
    </div>
  );
}
