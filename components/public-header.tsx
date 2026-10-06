import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { PublicMobileNav } from "./public-mobile-nav";

export async function PublicHeader() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user;

  const links = [
    { href: "/#berita", label: "Berita" },
    { href: "/#kajian", label: "Kajian & Acara" },
    { href: "/#galeri", label: "Galeri" },
    { href: "/#tentang", label: "Tentang" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Image src="/logo.png" alt="SIMONEV PAI" width={34} height={34} className="rounded-lg shrink-0" />
          <span className="font-display text-base sm:text-lg font-bold text-on-surface tracking-tight truncate">SIMONEV PAI</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-on-surface-variant">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary dark:hover:text-primary-dark transition-colors">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover dark:bg-primary-dark dark:hover:bg-primary-darkHover text-white dark:text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-lg transition-colors"
          >
            {loggedIn ? "Dashboard" : "Masuk"} <ArrowRight size={14} />
          </Link>
          <PublicMobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
