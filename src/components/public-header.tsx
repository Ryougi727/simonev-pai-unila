import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";

export async function PublicHeader() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user;

  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/40">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="SIMONEV PAI" width={34} height={34} className="rounded-lg" />
          <span className="font-display text-lg font-bold text-on-surface tracking-tight">SIMONEV PAI</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
          <Link href="/#berita" className="hover:text-primary dark:hover:text-primary-dark transition-colors">Berita</Link>
          <Link href="/#kajian" className="hover:text-primary dark:hover:text-primary-dark transition-colors">Kajian &amp; Acara</Link>
          <Link href="/#tentang" className="hover:text-primary dark:hover:text-primary-dark transition-colors">Tentang</Link>
        </nav>
        <Link
          href={loggedIn ? "/dashboard" : "/login"}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover dark:bg-primary-dark dark:hover:bg-primary-darkHover text-white dark:text-[#00391d] text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          {loggedIn ? "Ke Dashboard" : "Masuk"} <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
}
