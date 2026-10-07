"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, ArrowRight, HelpCircle } from "lucide-react";
import { IslamicPatternBackground } from "@/components/islamic-pattern";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) { setError("Isi username dan password."); return; }
    setLoading(true);
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Username atau password salah."); return; }
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <IslamicPatternBackground />

      <div className="hidden md:block absolute top-8 left-8 text-[10px] font-mono tracking-widest text-outline uppercase opacity-50">
        v.1.0 // akademik
      </div>

      <div className="relative z-10 w-full max-w-[420px] bg-surface-container/85 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30">
        {/* top gradient accent */}
        <div className="h-1 w-full bg-gradient-to-r from-primary dark:from-primary-dark to-tertiary opacity-90" />

        <div className="p-8 sm:p-10 flex flex-col items-center">
          <div className="mb-6 w-20 h-20 rounded-2xl bg-surface-container-low shadow-inner flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/5" />
            <Image src="/logo.png" alt="SIMONEV PAI" width={80} height={80} className="object-contain relative z-10" />
          </div>

          <div className="text-center mb-8 w-full">
            <h1 className="font-display text-2xl font-bold text-on-surface mb-2 tracking-tight">SIMONEV PAI</h1>
            <p className="text-sm text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">
              Sistem Monitoring dan Evaluasi Praktikum Pendidikan Agama Islam — Universitas Lampung
            </p>
          </div>

          <form onSubmit={submit} className="w-full space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-bold text-on-surface-variant pl-1 tracking-wide">Username</label>
              <div className="relative flex items-center bg-surface-container-low rounded-lg shadow-inner focus-within:ring-2 focus-within:ring-primary/40 dark:focus-within:ring-primary-dark/40 transition-all">
                <User size={18} className="absolute left-3 text-on-surface-variant/70" />
                <input
                  id="username"
                  autoFocus
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  className="w-full bg-transparent text-on-surface py-3 pl-10 pr-4 outline-none placeholder:text-on-surface-variant/40"
                  placeholder="cth. MuhAbHa"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-on-surface-variant pl-1 tracking-wide">Password</label>
              <div className="relative flex items-center bg-surface-container-low rounded-lg shadow-inner focus-within:ring-2 focus-within:ring-primary/40 dark:focus-within:ring-primary-dark/40 transition-all">
                <Lock size={18} className="absolute left-3 text-on-surface-variant/70" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full bg-transparent text-on-surface py-3 pl-10 pr-10 outline-none placeholder:text-on-surface-variant/40"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 text-on-surface-variant/60 hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <div className="text-error text-xs font-semibold">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden bg-primary hover:bg-primary-hover dark:bg-primary-dark dark:hover:bg-primary-darkHover text-white dark:text-[#00391d] rounded-lg py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-60 transition-all active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? "Memproses…" : "Masuk Ke Sistem"}
                {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
              </span>
              <span className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 transition-all duration-700 ease-in-out group-hover:left-[200%]" />
            </button>
          </form>
        </div>

        <div className="bg-surface-container-lowest/60 p-4 text-center border-t border-outline-variant/30">
          <p className="text-[11px] text-on-surface-variant/80 flex items-center justify-center gap-1.5">
            <HelpCircle size={13} />
            Username &amp; password dibuat oleh Admin. Lupa password? Hubungi Admin untuk direset.
          </p>
        </div>
      </div>
    </div>
  );
}
