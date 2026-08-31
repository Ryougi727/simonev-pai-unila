"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Users, Calendar, QrCode, FileText, Image as ImageIcon,
  BarChart3, Settings, LogOut, GraduationCap, UserCog, ClipboardList, Archive,
  Clock, Megaphone, ShieldCheck, Eye, Menu, X,
} from "lucide-react";

type MenuItem = { href: string; label: string; icon: any; group?: string };

const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "/admin/users", label: "Manajemen Pengguna", icon: UserCog, group: "Manajemen" },
    { href: "/admin/kelompok", label: "Manajemen Kelompok", icon: Users, group: "Manajemen" },
    { href: "/admin/praktikan", label: "Manajemen Praktikan", icon: GraduationCap, group: "Manajemen" },
    { href: "/admin/kalender", label: "Kalender & Materi", icon: Calendar, group: "Akademik" },
    { href: "/admin/monitoring", label: "Monitoring", icon: Eye, group: "Akademik" },
    { href: "/admin/rekap", label: "Rekapitulasi", icon: BarChart3, group: "Akademik" },
    { href: "/admin/activity", label: "Activity Log", icon: Clock, group: "Sistem" },
    { href: "/admin/audit", label: "Audit Log", icon: ShieldCheck, group: "Sistem" },
    { href: "/admin/arsip", label: "Arsip Semester", icon: Archive, group: "Sistem" },
    { href: "/admin/settings", label: "Pengaturan Sistem", icon: Settings, group: "Sistem" },
  ],
  PJ: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "/pj/monitoring", label: "Monitoring Mentor", icon: ClipboardList, group: "Akademik" },
    { href: "/pj/berita", label: "Berita Acara", icon: FileText, group: "Akademik" },
    { href: "/pj/dokumentasi", label: "Dokumentasi", icon: ImageIcon, group: "Akademik" },
  ],
  MENTOR: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "/mentor/profil", label: "Profil Saya", icon: UserCog },
    { href: "/mentor/jadwal", label: "Jadwal Praktikum", icon: Calendar, group: "Praktikum" },
    { href: "/mentor/qr", label: "QR Absensi", icon: QrCode, group: "Praktikum" },
    { href: "/mentor/berita", label: "Berita Acara", icon: FileText, group: "Praktikum" },
    { href: "/mentor/dokumentasi", label: "Dokumentasi", icon: ImageIcon, group: "Praktikum" },
  ],
};

export function Sidebar({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const menu = MENUS[role] ?? [];

  const ungrouped = menu.filter((m) => !m.group);
  const groups = Array.from(new Set(menu.filter((m) => m.group).map((m) => m.group!)));

  const renderItem = (item: MenuItem) => {
    const active = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        className={`relative flex items-center gap-3 ${isOpen ? "pl-4 pr-3" : "justify-center px-0"} py-2.5 rounded-lg text-sm font-semibold mb-0.5 transition-all ${
          active
            ? "bg-primary/15 text-primary dark:bg-primary-dark/15 dark:text-primary-dark"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary dark:bg-primary-dark" />}
        <Icon size={18} strokeWidth={2} className="shrink-0" />
        {isOpen && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside className={`relative shrink-0 border-r border-outline-variant/40 bg-surface-container-low min-h-screen flex flex-col transition-all duration-300 ${isOpen ? "w-[260px]" : "w-[88px]"}`}>
      <div className={`h-16 flex items-center ${isOpen ? "px-4 justify-start" : "px-2 justify-center"} gap-2.5 shrink-0`}>
        <button
          type="button"
          aria-label={isOpen ? "Tutup sidebar" : "Buka sidebar"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {isOpen && (
          <>
            <Image src="/logo.png" alt="SIMONEV PAI" width={32} height={32} className="rounded-lg shrink-0" />
            <span className="font-display text-lg font-bold text-primary dark:text-primary-dark tracking-tight leading-none">SIMONEV PAI</span>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {ungrouped.map(renderItem)}
        {groups.map((g) => (
          <div key={g}>
            {isOpen && <div className="pt-4 pb-1.5 px-4 text-[11px] font-bold text-outline uppercase tracking-widest opacity-70">{g}</div>}
            {menu.filter((m) => m.group === g).map(renderItem)}
          </div>
        ))}
      </nav>

      <div className={`border-t border-outline-variant/40 ${isOpen ? "p-3" : "px-2 py-3"}`}>
        {isOpen && <div className="text-xs font-bold px-1 mb-2 truncate text-on-surface">{name}</div>}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`w-full flex items-center ${isOpen ? "justify-center gap-2" : "justify-center"} text-sm font-semibold border border-outline-variant rounded-lg py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors`}
          title={isOpen ? "Keluar" : "Keluar"}
        >
          <LogOut size={14} /> {isOpen && "Keluar"}
        </button>
      </div>
    </aside>
  );
}
