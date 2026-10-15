import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IslamicPatternBackground } from "@/components/islamic-pattern";

export default async function NotFound() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user);
  const destination = isLoggedIn ? "/dashboard" : "/";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <IslamicPatternBackground />
      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-outline-variant/40 bg-surface-container/90 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary-dark/10 dark:text-primary-dark">
          <Compass size={30} strokeWidth={1.7} />
        </div>
        <p className="font-display text-7xl font-bold tracking-tight text-primary dark:text-primary-dark">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-on-surface">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-on-surface-variant">
          Halaman yang Anda cari mungkin sudah dipindahkan atau alamatnya tidak tepat.
        </p>
        <Link
          href={destination}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-hover dark:bg-primary-dark dark:text-[#00391d] dark:hover:bg-primary-darkHover"
        >
          <ArrowLeft size={16} />
          {isLoggedIn ? "Kembali ke Dashboard" : "Kembali ke Halaman Utama"}
        </Link>
      </section>
    </main>
  );
}
