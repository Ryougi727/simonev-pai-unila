import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const dynamic = "force-dynamic";

export default async function BeritaDetailPage({ params }: { params: { id: string } }) {
  const item = await prisma.berita.findUnique({
    where: { id: params.id },
    include: { photos: true, author: true },
  });

  if (!item || !item.published) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <article className="max-w-3xl mx-auto px-5 py-12 w-full flex-1">
        <Link href="/#berita" className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary dark:hover:text-primary-dark mb-6 transition-colors">
          <ArrowLeft size={15} /> Kembali ke Berita
        </Link>

        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wide bg-primary/10 dark:bg-primary-dark/10 text-primary dark:text-primary-dark px-2.5 py-1 rounded-full">
            {item.category}
          </span>
          <span className="text-xs text-on-surface-variant">
            {item.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-4 leading-tight">{item.title}</h1>

        {item.eventDate && (
          <div className="flex items-center gap-2 bg-primary/10 dark:bg-primary-dark/10 text-primary dark:text-primary-dark rounded-lg px-4 py-3 mb-6 text-sm font-semibold">
            <Calendar size={16} />
            Tanggal Acara: {item.eventDate.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
        )}

        {item.photos.length > 0 && (
          <div className={`grid gap-2 mb-6 ${item.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {item.photos.map((p) => (
              <div key={p.id} className="rounded-xl overflow-hidden bg-surface-container-high aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={item.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{item.content}</div>

        <div className="mt-8 pt-6 border-t border-outline-variant/30 text-xs text-on-surface-variant">
          Ditulis oleh {item.author.name}
        </div>
      </article>

      <PublicFooter />
    </div>
  );
}
