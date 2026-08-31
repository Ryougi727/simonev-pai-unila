"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { IslamicPatternBackground } from "@/components/islamic-pattern";

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1.length < 6) { setError("Password minimal 6 karakter."); return; }
    if (pw1 !== pw2) { setError("Konfirmasi password tidak sama."); return; }
    setLoading(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw1 }),
    });
    setLoading(false);
    if (!res.ok) { setError("Gagal menyimpan password. Coba lagi."); return; }
    await update({ mustChangePassword: false });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <IslamicPatternBackground />
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm bg-surface-container/85 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary dark:from-primary-dark to-tertiary opacity-90" />
        <div className="p-7">
          <div className="w-11 h-11 rounded-xl bg-primary/15 dark:bg-primary-dark/15 text-primary dark:text-primary-dark flex items-center justify-center mb-4">
            <ShieldCheck size={22} />
          </div>
          <h1 className="font-display text-xl font-bold text-on-surface mb-1">Ganti Password Awal</h1>
          <p className="text-xs text-on-surface-variant mb-5">
            Ini login pertama Anda{session?.user?.name ? ` (${session.user.name})` : ""}. Buat password baru sebelum melanjutkan.
          </p>
          <label className="block mb-4">
            <div className="text-xs font-bold text-on-surface-variant mb-1.5">Password Baru</div>
            <input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low shadow-inner text-on-surface outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary-dark/40 transition-all" />
          </label>
          <label className="block mb-2">
            <div className="text-xs font-bold text-on-surface-variant mb-1.5">Konfirmasi Password Baru</div>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low shadow-inner text-on-surface outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-primary-dark/40 transition-all" />
          </label>
          {error && <div className="text-error text-xs font-semibold my-2">{error}</div>}
          <button type="submit" disabled={loading} className="w-full mt-4 bg-primary hover:bg-primary-hover dark:bg-primary-dark dark:hover:bg-primary-darkHover text-white dark:text-[#00391d] font-bold py-3 rounded-lg shadow-md disabled:opacity-60 transition active:scale-[0.98]">
            {loading ? "Menyimpan…" : "Simpan & Lanjutkan"}
          </button>
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-center text-xs text-on-surface-variant mt-3 hover:text-on-surface transition-colors">
            Keluar
          </button>
        </div>
      </form>
    </div>
  );
}
