# SIMONEV PAI — Next.js

Fondasi awal versi produksi SIMONEV PAI (Next.js + Prisma/PostgreSQL + Auth.js), dibangun dari
prototipe React sebelumnya. Fase ini fokus pada: autentikasi username/password sungguhan (dengan
alur wajib ganti password di login pertama) dan **QR Absensi asli** yang bisa di-scan kamera HP.

Modul lain (Manajemen Kelompok, Praktikan, Berita Acara, Dokumentasi, Rekap, dst.) belum
diimplementasikan di fase ini — menyusul di tahap berikutnya, memakai fondasi yang sama.

## 1. Setup

```bash
npm install
cp .env.example .env
```

Isi `.env`:
- `DATABASE_URL` — dari Supabase: Project Settings → Database → Connection string (URI). Gunakan
  connection string mode **Session** atau **Transaction pooler** sesuai kebutuhan.
- `NEXTAUTH_SECRET` — generate dengan `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` untuk lokal

## 2. Buat tabel & isi data awal

```bash
npm run db:push    # membuat semua tabel di Supabase sesuai prisma/schema.prisma
npm run db:seed    # mengisi akun demo, kelompok, praktikan, materi, kalender
```

Jalankan `npm run db:push` setelah mengambil perubahan skema agar indeks performa terbaru ikut diterapkan.

Setelah seed selesai, terminal akan menampilkan daftar username demo. Password:
- Admin → `admin123`
- PJ & Mentor → `praktikum2026`

## 3. Jalankan

```bash
npm run dev
```

Buka `http://localhost:3000` → akan diarahkan ke `/login`.

## 4. Menguji QR Absensi sungguhan

1. Login sebagai salah satu akun **Mentor**.
2. Buka menu **QR Absensi** → klik "Buka QR Absensi".
3. QR yang muncul adalah kode asli (encode URL `/scan/[token]`) — **agar bisa di-scan dari HP**,
   laptop dan HP harus satu jaringan WiFi, lalu jalankan `npm run dev -- -H 0.0.0.0` supaya server
   bisa diakses dari perangkat lain, dan buka `http://<IP-laptop>:3000` di alamat NEXTAUTH_URL /
   scan URL (atau paling mudah: deploy dulu ke Vercel, lalu scan URL produksinya langsung).
4. Scan QR dari HP → akan terbuka halaman publik berisi daftar nama praktikan → praktikan tap
   namanya sendiri untuk absen. Daftar hadir di layar mentor akan otomatis ter-update (polling
   tiap 3 detik).

## 5. Struktur

```
prisma/schema.prisma       skema lengkap sesuai PRD (User, Kelompok, Praktikan, Pertemuan, dst.)
prisma/seed.ts             data awal (akun demo, kelompok, praktikan, materi, kalender)
src/lib/auth.ts            konfigurasi Auth.js (Credentials provider)
src/lib/username.ts        generator username sesuai pola yang disepakati
src/middleware.ts          proteksi rute + redirect wajib-ganti-password
src/app/login               halaman login
src/app/change-password     halaman wajib ganti password (login pertama)
src/app/(app)/...           halaman setelah login (sidebar per role)
src/app/(app)/mentor/qr     QR Absensi dan input manual status kehadiran praktikan oleh mentor
src/app/scan/[token]        halaman publik yang dibuka saat QR di-scan
src/app/api/...             route handler (buka QR, submit absensi, ganti password)
```

## 6. Deploy ke Vercel (opsional, sesuai stack PRD)

1. Push project ini ke GitHub.
2. Import ke Vercel, tambahkan environment variables yang sama seperti `.env`.
3. `NEXTAUTH_URL` diisi domain Vercel-nya.
4. Jalankan `npm run db:push` & `npm run db:seed` sekali dari lokal (mengarah ke DB Supabase yang
   sama) — tabel & data awal akan langsung terpakai oleh deployment Vercel.
