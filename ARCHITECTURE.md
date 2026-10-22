# Arsitektur dan Struktur Project SIMONEV PAI

Dokumen ini menjelaskan susunan kode, alur aplikasi, pemisahan tanggung jawab, serta cara modul saling terhubung pada SIMONEV PAI. Penjelasan mengacu pada implementasi di repository saat ini.

## 1. Gambaran umum

SIMONEV PAI adalah aplikasi web untuk monitoring dan evaluasi praktikum Pendidikan Agama Islam. Aplikasi dibangun dengan:

- **Next.js 14 App Router** untuk halaman, layout, dan endpoint HTTP.
- **React 18 dan TypeScript** untuk antarmuka dan logika aplikasi.
- **PostgreSQL** sebagai database, diakses melalui **Prisma ORM**.
- **NextAuth (Credentials Provider)** untuk autentikasi username dan password.
- **Supabase Storage** untuk penyimpanan file yang diunggah.
- **Tailwind CSS** dan CSS variables untuk styling dan tema.

Arsitektur utamanya berbasis modul dan fungsi, bukan aplikasi berorientasi objek klasik. Halaman server mengambil data yang diperlukan dari database, komponen React menampilkan atau menangani interaksi, dan Route Handler menyediakan endpoint untuk operasi yang dipanggil browser.

### Mengapa Next.js cocok

Next.js cocok untuk SIMONEV PAI karena aplikasi ini menggabungkan beberapa kebutuhan web dalam satu produk: halaman publik, area internal yang perlu autentikasi, dashboard dengan data dinamis, dan endpoint untuk mengubah data. App Router menyediakan halaman, layout bersama, status loading, dan Route Handler dalam satu kerangka kerja, sehingga antarmuka dan API dapat dikelola di repository yang sama.

Server Components juga berguna untuk halaman seperti dashboard dan monitoring: data dapat diambil langsung dari Prisma di server, sementara akses ke database dan kredensial tidak perlu diberikan ke browser. Untuk bagian yang membutuhkan interaksi langsung—misalnya formulir, pencarian praktikan, navigasi, dan presensi QR—Client Components dapat ditambahkan hanya pada bagian tersebut. Hasilnya adalah pemisahan yang sesuai antara pengambilan data di server dan interaksi UI di browser.

Selain itu, dukungan TypeScript, integrasi dengan React, serta alur build dan deployment yang umum digunakan oleh platform seperti Vercel membuat Next.js praktis untuk dikembangkan dan dipelihara oleh tim project.

### Mengapa Supabase cocok

Pada implementasi ini, PostgreSQL di Supabase digunakan sebagai database aplikasi melalui Prisma, sedangkan Supabase Storage dipakai untuk menyimpan foto dan file unggahan. Kombinasi ini cocok karena project membutuhkan data yang saling berelasi—seperti kelompok, mentor, praktikan, pertemuan, dan absensi—yang sesuai dengan model relasional PostgreSQL.

Supabase menyediakan layanan database PostgreSQL terkelola dan penyimpanan berkas dalam satu platform. Ini mengurangi kebutuhan untuk mengelola server database dan file storage secara terpisah. Prisma melengkapi database dengan schema bertipe, relasi, serta API query TypeScript; Supabase tetap menjadi layanan infrastruktur, sementara aturan bisnis aplikasi berada di kode Next.js.

Kredensial administratif Supabase Storage digunakan di sisi server melalui helper pada `src/lib/supabase.ts` dan `src/lib/storage.ts`. Karena itu, service role key dan kredensial database harus disimpan sebagai environment variables rahasia, bukan dikirim ke browser atau ditulis ke repository.

## 2. Struktur repository

```text
.
├── components/                 # Komponen bersama di root; saat ini termasuk ThemeSwitcher
├── prisma/
│   ├── schema.prisma           # Model data, relasi, enum, dan konfigurasi database
│   ├── seed.ts                 # Pengisian data awal
│   └── reset-production.ts     # Skrip reset data produksi
├── public/                     # Aset statis yang disajikan langsung
├── src/
│   ├── app/                    # Routing App Router, halaman, layout, dan API
│   ├── components/             # Komponen UI dan interaksi yang dipakai ulang
│   ├── lib/                    # Akses layanan dan fungsi domain bersama
│   └── middleware.ts           # Pemeriksaan sesi sebelum rute tertentu diproses
├── next.config.js              # Konfigurasi Next.js
├── tailwind.config.ts          # Konfigurasi Tailwind dan token warna
├── postcss.config.js           # Integrasi PostCSS, Tailwind, dan Autoprefixer
├── tsconfig.json               # Konfigurasi TypeScript dan alias import
├── package.json                # Dependensi dan perintah project
└── ARCHITECTURE.md             # Dokumen arsitektur ini
```

Folder seperti `node_modules/` dan `.next/` merupakan dependensi atau hasil build/cache, bukan sumber utama aplikasi.

### `src/app/`

Ini adalah pusat routing Next.js App Router. Struktur direktori menentukan URL:

- `page.tsx` membuat halaman pada segmen direktori tersebut.
- `layout.tsx` membungkus halaman dan segmen di bawahnya.
- `loading.tsx` menyediakan UI saat segmen sedang menunggu.
- `route.ts` mendefinisikan HTTP Route Handler.
- Folder berkurung siku seperti `[id]` dan `[token]` adalah segmen dinamis.
- Folder berkurung biasa seperti `(app)` adalah route group. Namanya tidak menjadi bagian URL.

Halaman penting:

| Lokasi | Fungsi |
| --- | --- |
| `src/app/page.tsx` | Halaman publik/landing dengan berita, agenda, dan galeri. |
| `src/app/login/page.tsx` | Form login. |
| `src/app/change-password/page.tsx` | Alur ganti password, termasuk kewajiban ganti pada login pertama. |
| `src/app/(app)/layout.tsx` | Memastikan sesi tersedia dan membungkus area internal dengan `AppShell`. |
| `src/app/(app)/dashboard/page.tsx` | Dashboard yang memilih tampilan sesuai peran pengguna. |
| `src/app/(app)/admin/` | Halaman administrasi: monitoring, data, pengaturan, rekap, berita, galeri, dan lainnya. |
| `src/app/(app)/mentor/` | Halaman mentor: jadwal, QR presensi, berita acara, dokumentasi, dan profil. |
| `src/app/(app)/pj/` | Halaman PJ fakultas, antara lain monitoring, berita, dan dokumentasi. |
| `src/app/(app)/pengumuman/` | Tampilan dan pengelolaan pengumuman setelah login. |
| `src/app/berita/[id]/page.tsx` | Detail berita berdasarkan ID. |
| `src/app/scan/[token]/page.tsx` | Halaman presensi praktikan yang dibuka dari QR. |
| `src/app/not-found.tsx` | Halaman 404 aplikasi. |

Tanda kurung pada `(app)` hanya mengelompokkan halaman secara implementasi; misalnya halaman di `(app)/admin/monitoring` tetap mempunyai URL `/admin/monitoring`.

### `src/app/api/`

Route Handler adalah batas HTTP antara UI/client dan operasi server. Implementasi menggunakan `route.ts`, umumnya mengekspor fungsi bernama berdasarkan metode HTTP seperti `GET`, `POST`, `PUT`, atau `DELETE`.

Kelompok endpoint:

| Prefix | Tanggung jawab |
| --- | --- |
| `/api/auth/[...nextauth]` | Endpoint internal NextAuth untuk sesi dan autentikasi. |
| `/api/admin/` | Pengelolaan akun, kelompok, praktikan, berita, galeri, kalender, pengaturan, arsip, dan ekspor rekap. |
| `/api/mentor/` | Jadwal/pertemuan mentor, QR, absensi, berita acara, dokumentasi, profil, dan fitur darurat. |
| `/api/attendance/[token]` | Menerima presensi praktikan dari halaman scan QR. |
| `/api/qr/` | Membuka QR dan membaca status QR. |
| `/api/pengumuman/` | Membaca dan mengelola pengumuman. |
| `/api/search` | Pencarian data untuk UI. |
| `/api/account/change-password` | Mengubah password akun. |

Endpoint memvalidasi akses dan input di sisi server sebelum melakukan perubahan database atau penyimpanan file. Sebagian endpoint role khusus menggunakan helper seperti `requireAdmin`; endpoint lain melakukan pemeriksaan sesi/peran sesuai kebutuhannya. Endpoint presensi QR dapat dipanggil tanpa sesi login praktikan, sehingga memvalidasi token, masa aktif QR, dan bahwa praktikan memang anggota kelompok terkait.

### `src/components/`

Komponen lintas halaman, yang dipakai untuk membagi UI dan perilaku bersama:

- `app-shell.tsx`, `sidebar.tsx`, `topbar.tsx`: kerangka aplikasi internal, navigasi, dan header.
- `session-provider.tsx`, `data-loading.tsx`, `route-progress.tsx`: provider sesi dan indikator navigasi/pemuatan.
- `status-badge.tsx`, `meeting-summary.tsx`, `meeting-warnings.tsx`: ringkasan dan indikator status monitoring.
- `table-pagination.tsx`, `week-picker.tsx`, `searchable-multi-select.tsx`: kontrol UI yang dapat dipakai ulang.
- `action-spinner.tsx`, `use-confirm-dialog.tsx`, `emergency-unlock.tsx`: elemen interaksi dan aksi.
- `public-header.tsx`, `public-footer.tsx`, `public-mobile-nav.tsx`: elemen area publik.
- `page-skeleton.tsx`, `islamic-pattern.tsx`: elemen presentasi dan dekorasi.

Komponen yang khusus untuk satu halaman kadang berada bersebelahan dengan halaman tersebut, misalnya `scan-client.tsx` pada segmen scan dan file `*-client.tsx` pada halaman administrasi/mentor.

Komponen dengan `"use client"` adalah Client Component: dapat memakai state React, event handler, browser API, atau hook client. Komponen tanpa direktif tersebut dapat menjadi Server Component secara default di App Router.

Ada juga folder `components/` di root repository. Saat ini folder ini berisi beberapa komponen, termasuk `theme-switcher.tsx`, yang diimpor oleh komponen di `src/components/`. Ini merupakan pengecualian terhadap penempatan komponen utama di `src/components/`; ketika menambah komponen baru, periksa pola impor dan pilih lokasi secara konsisten.

### `src/lib/`

`lib` berisi integrasi infrastruktur dan fungsi domain yang digunakan lebih dari satu route atau komponen. Ini bukan folder khusus Next.js, melainkan konvensi project untuk kode bersama.

| File | Tanggung jawab |
| --- | --- |
| `prisma.ts` | Membuat dan mengekspor instance Prisma Client bersama. |
| `auth.ts` | Opsi NextAuth, validasi kredensial, dan pemetaan klaim token/sesi. |
| `require-admin.ts` | Helper untuk memeriksa sesi serta peran Admin. |
| `supabase.ts` | Inisialisasi klien Supabase administratif dan nama bucket. |
| `storage.ts` | Upload, penghapusan, dan pembacaan path file dari URL storage. |
| `status.ts` | Tipe dan fungsi perhitungan status pelaksanaan pertemuan. |
| `meeting-warnings.ts` | Menghitung rentetan pertemuan yang belum terlaksana dan mengelompokkan peringatan. |
| `attendance-summary.ts` | Membuat ringkasan status kehadiran praktikan. |
| `image.ts` | Fungsi pemrosesan/resize gambar. |
| `username.ts` | Fungsi pembentukan username. |

Pemisahan ini mencegah logika yang sama disalin ke banyak halaman dan memudahkan pengujian fungsi domain tanpa merender UI.

### `prisma/`

`schema.prisma` mendefinisikan koneksi PostgreSQL dan model yang dipakai Prisma Client. Domain data mencakup:

- **Akun dan otorisasi:** `User`, `Role`.
- **Kelompok dan hubungan mentor:** `Kelompok`, `KelompokMentor`.
- **Praktikan dan presensi:** `Praktikan`, `Pertemuan`, `Absensi`, status terkait.
- **Informasi pelaksanaan:** `KalenderPraktikum`, `Materi`, `BeritaAcara`, `Dokumentasi`.
- **Konten dan konfigurasi:** `Berita`, `BeritaFoto`, `Galeri`, `Pengumuman`, `Settings`.
- **Jejak perubahan:** `ActivityLog`, `AuditLog`.
- **Pengarsipan:** `Archive`.

Relasi antar model digunakan untuk mengambil data terkait (misalnya kelompok beserta mentor, praktikan, dan pertemuan) serta menjaga integritas referensial. `seed.ts` mengisi data awal. `reset-production.ts` adalah skrip operasional berisiko tinggi dan sebaiknya hanya dijalankan setelah memahami isi skrip serta memastikan target database yang benar.

### `public/` dan konfigurasi

- `public/` menyimpan file yang dapat disajikan sebagai aset statis, misalnya logo dan gambar tema.
- `src/app/globals.css` memuat Tailwind directives, token warna CSS, tema, dan aturan global.
- `tailwind.config.ts` menghubungkan nama kelas Tailwind ke token CSS serta font.
- `postcss.config.js` menjalankan Tailwind CSS dan Autoprefixer.
- `next.config.js` mengatur opsi Next.js.
- `tsconfig.json` mengaktifkan strict type checking dan alias `@/*`.
- `package.json` mendefinisikan dependency serta perintah dev, build, start, lint, dan Prisma.

Root-level `layout.tsx` dan `globals.css` juga terlihat pada repository. Aplikasi Next.js saat ini memiliki App Router di `src/app/`, termasuk layout dan CSS globalnya; perubahan routing/layout utama sebaiknya dilakukan di `src/app/`.

## 3. Cara kerja import dan export

Setiap file JavaScript/TypeScript adalah module. Kode hanya dapat digunakan file lain bila diekspor.

### Named export

```ts
// src/lib/status.ts
export function statusForPertemuan(...) { ... }

// pemakai
import { statusForPertemuan } from "@/lib/status";
```

Nama yang diimpor harus sama dengan nama yang diekspor, kecuali diberi alias:

```ts
import { statusForPertemuan as getStatus } from "@/lib/status";
```

### Default export

Halaman Next.js umumnya memakai default export karena App Router mencari komponen halaman default:

```tsx
export default async function AdminMonitoringPage() {
  // ...
}
```

### Alias `@/`

`tsconfig.json` menetapkan `"@/*": ["src/*"]`. Karena itu:

```ts
import { prisma } from "@/lib/prisma";
```

merujuk ke `src/lib/prisma.ts`. Alias memudahkan import tanpa menghitung `../` berulang kali. Import dari root `components/` saat ini memakai relative path karena folder tersebut berada di luar `src/`.

### Import tipe saja

Untuk tipe TypeScript yang tidak dibutuhkan saat runtime, gunakan `import type`:

```ts
import type { MeetingWarnings } from "@/lib/meeting-warnings";
```

Praktik ini menegaskan bahwa yang diimpor hanya tipe, bukan nilai JavaScript.

## 4. Alur request dan data

### Membuka halaman internal

1. Browser meminta URL, misalnya `/admin/monitoring`.
2. `src/middleware.ts` memeriksa token autentikasi untuk rute yang dicakup matcher. Jika belum login, pengguna diarahkan ke `/login`; jika wajib mengganti password, pengguna diarahkan ke `/change-password`.
3. Layout `src/app/(app)/layout.tsx` memeriksa sesi lagi di server, mengambil data shell seperti foto profil dan pengumuman terbaru, lalu membuat `AppShell`.
4. Server Component halaman mengambil data dengan Prisma dan menyusun properti untuk UI.
5. Client Components menangani interaksi browser yang diperlukan.

Pemeriksaan middleware dan pemeriksaan di server memiliki tujuan berbeda: middleware menjadi gerbang awal navigasi, sementara halaman/API tetap harus membatasi data dan operasi berdasarkan sesi/peran.

### Mengubah data dari UI

1. Client Component mengirim `fetch` ke endpoint `/api/...`.
2. Route Handler membaca request dan memvalidasi sesi/peran serta input.
3. Handler memanggil Prisma untuk membaca atau mengubah data PostgreSQL.
4. Bila melibatkan file, handler menggunakan helper storage menuju Supabase Storage lalu menyimpan URL-nya pada model terkait.
5. Handler mengembalikan respons JSON atau file; UI menampilkan hasil dan dapat memuat ulang data.

### Presensi melalui QR

1. Mentor membuka QR untuk suatu pertemuan.
2. URL QR mengandung token unik dan membuka `/scan/[token]`.
3. Halaman server mencari pertemuan berdasarkan token, memeriksa status/masa berlaku, kemudian menampilkan daftar praktikan.
4. Praktikan memilih namanya; `scan-client.tsx` mengirim ID praktikan ke `/api/attendance/[token]`.
5. Endpoint memastikan token masih berlaku dan praktikan terdaftar pada kelompok pertemuan, lalu mencatat kehadiran.

### Tema

`ThemeProvider` pada `src/app/layout.tsx` menggunakan `next-themes` untuk menaruh nama tema sebagai kelas pada elemen root. Theme switcher di folder root `components/` mengubah tema, sementara token CSS di `src/app/globals.css` dan konfigurasi Tailwind menerapkan warna yang sesuai.

## 5. Pola rendering: server dan client

App Router menggunakan Server Components secara default. Halaman server dapat langsung mengambil data sensitif/terproteksi tanpa mengirim kredensial database ke browser. Ini sesuai untuk halaman monitoring dan dashboard.

Client Components dipakai ketika UI membutuhkan state lokal, event klik/input, `useEffect`, hook NextAuth client, atau browser API. Contoh:

- pemilihan nama dan pengiriman presensi pada `scan-client.tsx`;
- form dan tabel interaktif dengan nama berkas `*-client.tsx`;
- navigasi dan menu pada `AppShell`, `Sidebar`, serta `Topbar`.

Data yang diberikan dari Server Component ke Client Component sebaiknya berupa nilai yang diperlukan UI saja, bukan instance Prisma atau secret server.

## 6. Apakah project ini menggunakan OOP?

**Bukan OOP klasik sebagai pola utama.** Sebagian besar kode terdiri dari:

- fungsi halaman async yang mengambil data;
- fungsi React yang menghasilkan UI;
- fungsi helper domain seperti `statusForPertemuan`;
- modul layanan yang mengekspor instance atau fungsi seperti `prisma` dan `uploadToStorage`;
- tipe dan enum untuk mendeskripsikan bentuk data.

React menggunakan komponen dan composition, bukan class component pada pola yang dominan di project ini. Prisma Client sendiri adalah objek dari library yang menggunakan class di dalam implementasinya, tetapi kode aplikasi mengaksesnya melalui satu instance bersama. Jadi project ini lebih tepat disebut **functional/module-oriented dengan komposisi komponen**, bukan sistem domain berbasis class OOP.

## 7. Peran dan akses

Model peran yang didefinisikan adalah `ADMIN`, `PJ`, dan `MENTOR`.

- **Admin** mengelola data dan pengaturan lintas fakultas serta melihat monitoring keseluruhan.
- **PJ** bekerja pada konteks fakultasnya, seperti monitoring mentor/kelompok dan konten fakultas.
- **Mentor** mengelola aktivitas kelompok/pertemuannya seperti jadwal, QR, berita acara, dokumentasi, dan profil.
- **Praktikan** tidak harus login untuk presensi QR; akses terbatas pada alur token QR dan validasi keanggotaan kelompok.

Dashboard memilih isi berdasarkan `role`. Pembatasan otorisasi tidak hanya soal menyembunyikan menu: query server dan Route Handler juga perlu memverifikasi identitas serta cakupan data.

## 8. Styling dan tema

Tailwind CSS digunakan melalui class utility di JSX. Warna desain utama didefinisikan sebagai CSS custom properties di `src/app/globals.css`, lalu didaftarkan di `tailwind.config.ts`. Bentuk ini memungkinkan kelas seperti `bg-surface` dan `text-on-surface` memakai token yang berubah mengikuti tema.

Tema yang didaftarkan di root provider adalah `light`, `dark`, `sakura`, dan `neon`. Sebagian UI lama masih menggunakan warna Tailwind langsung atau warna literal, sehingga saat mengubah tema atau halaman tertentu, periksa tampilannya pada semua tema yang didukung.

## 9. Script project

Perintah yang tersedia di `package.json`:

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan Next.js. |
| `npm run build` | Membuat build produksi. |
| `npm run start` | Menjalankan build produksi. |
| `npm run lint` | Menjalankan lint melalui Next.js. |
| `npm run db:push` | Menyelaraskan schema Prisma ke database yang dikonfigurasi. |
| `npm run db:seed` | Mengisi data awal menggunakan `prisma/seed.ts`. |
| `npm run db:reset-production` | Menjalankan skrip reset produksi; periksa target dan efeknya sebelum dipakai. |

Konfigurasi lokal/hosting memerlukan environment variables yang sesuai, termasuk koneksi database dan secret autentikasi. Integrasi upload juga membaca kredensial Supabase di sisi server. Jangan menaruh nilai secret ke source code, dokumentasi publik, atau commit.

## 10. Panduan perubahan kode

1. **Menambah halaman:** buat `page.tsx` pada segmen `src/app/` yang sesuai. Periksa kebutuhan sesi dan role sebelum mengambil data.
2. **Menambah endpoint:** buat `route.ts` pada `src/app/api/...`; validasi input, otorisasi, cakupan fakultas/kelompok, dan bentuk respons di server.
3. **Menambah komponen kecil yang dipakai ulang:** letakkan di `src/components/`. Pertahankan `"use client"` hanya ketika diperlukan.
4. **Menambah logika domain bersama:** letakkan fungsi yang tidak bergantung UI di `src/lib/`, lalu ekspor dengan named export.
5. **Mengubah database:** ubah `prisma/schema.prisma`, evaluasi relasi, indeks, dan dampak data; kemudian jalankan alur Prisma yang sesuai pada database yang benar.
6. **Menambah variabel environment:** dokumentasikan nama dan tujuannya, bukan nilainya; validasi konfigurasi saat layanan diinisialisasi.
7. **Validasi:** jalankan lint/build yang relevan dan periksa alur sesuai peran. Untuk perubahan schema, uji query serta migrasi/sinkronisasi pada lingkungan yang aman.

## 11. Batasan interpretasi

Dokumen ini menjelaskan arsitektur yang tampak pada kode repository, bukan jaminan bahwa setiap aturan bisnis telah diterapkan identik pada semua endpoint. Saat melakukan perubahan keamanan atau data, telusuri Route Handler dan helper yang terkait secara langsung. File konfigurasi dan dokumentasi lain dapat berubah; perbarui dokumen ini bila struktur atau alur utama project berubah.
