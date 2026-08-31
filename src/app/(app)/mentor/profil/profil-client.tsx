"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { resizeImageToBlob } from "@/lib/image";

type Me = { username: string; name: string; email: string; phone: string; bio: string; photoUrl: string | null };

export function ProfilClient({ me }: { me: Me }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: me.name, email: me.email, phone: me.phone, bio: me.bio });
  const [photoUrl, setPhotoUrl] = useState(me.photoUrl);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const blob = await resizeImageToBlob(file, 400, 0.8);
      const fd = new FormData();
      fd.append("photo", blob, "photo.jpg");
      const res = await fetch("/api/mentor/profil/photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Gagal mengunggah foto.");
      else setPhotoUrl(`${data.url}?v=${Date.now()}`); // cache-bust so the new photo shows immediately
    } catch {
      alert("Gagal memproses foto.");
    }
    setUploadingPhoto(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    if (!form.name.trim()) { alert("Nama wajib diisi."); return; }
    setSaving(true);
    const res = await fetch("/api/mentor/profil", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) { alert("Gagal menyimpan."); return; }
    router.refresh();
  };

  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const savePassword = async () => {
    if (pw1.length < 6) { setPwErr("Password minimal 6 karakter."); return; }
    if (pw1 !== pw2) { setPwErr("Konfirmasi password tidak sama."); return; }
    setPwSaving(true);
    const res = await fetch("/api/account/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw1 }) });
    setPwSaving(false);
    if (!res.ok) { setPwErr("Gagal menyimpan password."); return; }
    setPwOpen(false); setPw1(""); setPw2("");
    alert("Password berhasil diperbarui.");
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-5 max-w-lg">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-primary dark:bg-primary-dark text-white flex items-center justify-center text-xl font-bold overflow-hidden shrink-0">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(me.name)
            )}
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={uploadingPhoto} className="flex items-center gap-1.5 text-xs font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark rounded-lg px-3 py-2 disabled:opacity-60">
              <Upload size={13} /> {uploadingPhoto ? "Mengunggah…" : "Unggah Foto"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          </div>
        </div>

        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Username</div>
          <input value={me.username} disabled className={inputCls + " opacity-60"} />
          <div className="text-[11px] text-gray-400 mt-1">Username tidak dapat diubah sendiri. Hubungi Admin bila diperlukan.</div>
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Nama Lengkap</div>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Email</div>
          <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">No. HP / WhatsApp</div>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
        </label>
        <label className="block mb-4">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Bio Singkat (opsional)</div>
          <textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className={inputCls} />
        </label>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2.5">
            {saving ? "Menyimpan…" : "Simpan Profil"}
          </button>
          <button onClick={() => setPwOpen(true)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5">
            Ganti Password
          </button>
        </div>
      </div>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Ganti Password">
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Password Baru</div>
          <input type="password" value={pw1} onChange={(e) => { setPw1(e.target.value); setPwErr(""); }} className={inputCls} />
        </label>
        <label className="block mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">Konfirmasi Password Baru</div>
          <input type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setPwErr(""); }} className={inputCls} />
        </label>
        {pwErr && <div className="text-red-600 text-xs font-semibold mb-2">{pwErr}</div>}
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={() => setPwOpen(false)} className="text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2">Batal</button>
          <button onClick={savePassword} disabled={pwSaving} className="text-sm font-semibold bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg px-4 py-2">
            {pwSaving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent outline-none focus:border-primary text-sm";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#dcefe2] dark:border-[#1d3527] font-display text-lg font-semibold">{title}</div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
