# Madrasah Swasta Boyolali — Website Sekolah + Portal Digital (wwn-madrasah-80) v1.0.0

Website sekolah lengkap dengan latar **gradasi hijau muda ke putih**, meniru struktur situs
SMA Negeri 1 Nusantara (navbar → hero → statistik → pengumuman → tentang → jurusan →
berita → CTA PPDB → footer), ditambah portal login 4 peran dan absensi QR Code.

## Fitur

**Halaman publik (tanpa login)**
- Beranda: hero (badge Tahun Ajaran, judul selamat datang, deskripsi sistem digital),
  statistik (Siswa, Guru & Tenaga, Rombel/Kelas, Jurusan — dihitung dari data, fallback
  demo 8/4/4/4 bila backend belum tersambung), pengumuman, tentang (3 kartu: Absensi QR
  Code, Portal Digital, 4 Level Akses), jurusan peminatan (AKL, MM, TKR, TKJ), berita
  terbaru, CTA PPDB, footer (alamat, telepon, email, navigasi, layanan).
- Berita (daftar + detail), Galeri, PPDB Online (form → status Menunggu), Kontak.
- Nama sekolah **bisa diganti di Pengaturan (admin)** — navbar, hero, footer, dan kop
  membaca `Pengaturan.namaSekolah`, bukan hardcode. Nama bawaan: **Madrasah Swasta
  Boyolali (MSB)**.

**Portal login 4 peran** — Admin, Guru, Siswa, Orang Tua
- Dasbor per peran; Admin: Kelola Pengguna, Siswa, Guru, Kelas & Jurusan, Berita &
  Pengumuman, Galeri, verifikasi PPDB (Terima/Tolak), Pengaturan.
- Guru: buat Sesi QR (kode besar mis. `QR-1234`), tutup sesi, absensi manual, input Nilai,
  Tugas, Materi.
- Siswa: absen dengan memasukkan kode sesi QR, lihat Nilai & Absensi saya, Tugas & Materi.
- Orang Tua: pilih anak (cari NIS/nama) lalu lihat Absensi & Nilai anak.

**Catatan jujur soal QR:** QR di v1.0.0 adalah **kode teks** (`QR-XXXX`) yang diketik
siswa, bukan pemindaian kamera. Sengaja begitu agar tidak perlu library QR eksternal
dan tetap jalan di semua HP. Server tetap mencegah absen ganda untuk sesi yang sama,
menolak kode yang tidak ada, dan menolak sesi yang sudah ditutup.

## Akun bawaan (setelah Inisialisasi Database)

| Peran | Username | Kata sandi |
|---|---|---|
| Admin | `admin` | `admin123` |
| Guru | `guru` | `guru123` |
| Siswa | `siswa` | `siswa123` |
| Orang Tua | `ortu` | `ortu123` |

> ⚠️ **Segera ganti kata sandi bawaan** di Kelola Data → Pengguna setelah login pertama.
> Kata sandi disimpan sebagai hash SHA-256 + garam, bukan plaintext, dan tidak pernah
> dikirim ke frontend.

## Teknologi

React 19 + Vite + TypeScript + Tailwind 4 (frontend), Google Apps Script + Google
Sheets (backend, 15 sheet). Tanpa react-router (routing state internal di `App.tsx`).
Tanpa dependensi npm baru di luar yang sudah tersedia.

### Struktur folder

```
src/
  App.tsx                 # routing state + pemulihan sesi + fallback demo
  main.tsx, index.css     # entry + gradasi hijau muda-putih
  types/index.ts          # tipe bersama
  lib/logic.ts            # logika murni (statistik, kode sesi, nilai)
  services/gasApi.ts      # klien API (prefix localStorage wwn-madrasah-80)
  components/Layout.tsx   # navbar publik + menu portal + footer
  components/ui.tsx       # tombol, kartu, field, modal, toast
  pages/                  # Beranda, Berita, Galeri, PPDB, Kontak, Login,
                          # Dashboard, KelolaData, AbsensiQR, NilaiTugas,
                          # Pengaturan, Konfigurasi
backend/
  Kode.gs                 # backend Apps Script (36 aksi)
  appsscript.json         # manifest (izin Sheets + Drive)
public/schools.json       # multi-sekolah (satu entri id "boyolali", apiUrl kosong)
test/
  smoke-test.mjs          # uji backend Kode.gs asli dengan stub GAS
  frontend-logic.test.mjs # uji logika frontend
```

### Daftar aksi backend (frontend dan backend SAMA PERSIS)

`ping`, `getAllData`, `initDatabase`, `login`, `logout`, `getPanelData`,
`savePengaturan`, `saveSiswa`, `deleteSiswa`, `saveGuru`, `deleteGuru`,
`saveKelas`, `deleteKelas`, `saveJurusan`, `deleteJurusan`, `saveBerita`,
`deleteBerita`, `savePengumuman`, `deletePengumuman`, `saveGaleri`,
`deleteGaleri`, `savePengguna`, `deletePengguna`, `submitPPDB`, `updatePPDB`,
`deletePPDB`, `buatSesiQR`, `tutupSesiQR`, `absenQR`, `absenManual`,
`saveNilai`, `deleteNilai`, `saveTugas`, `deleteTugas`, `saveMateri`,
`deleteMateri`.

`getAllData` bersifat publik tapi hanya berisi pengaturan, jurusan, kelas, berita,
pengumuman, galeri, dan statistik — **tanpa** password, nilai, atau absensi.
`getPanelData` butuh token: siswa hanya melihat data sendiri, orang tua hanya anak
yang dipilih, guru/admin melihat semua.

## Langkah 1 — Upload ke GitHub lewat web (WAJIB dibaca!)

> Kegagalan upload dulu (proyek jurnal) terjadi karena folder tertinggal. Upload
> **SEMUA** ini, jangan ada yang ketinggalan:

1. Buka github.com → buat repository baru bernama `wwn-madrasah-80` (Public).
2. Di halaman repo kosong, klik **uploading an existing file** (atau Add file →
   Upload files).
3. Dari folder proyek ini, **drag-and-drop SEMUA** berikut ke halaman upload:
   - folder `src` (utuh)
   - folder `public` (utuh)
   - folder `backend` (utuh)
   - folder `test` (utuh)
   - file `package.json`
   - file `package-lock.json`
   - file `index.html`, `vite.config.ts`, `tsconfig.json`, `vercel.json`, `README.md`
4. **JANGAN** upload folder `node_modules` dan `dist` (terlalu besar & tidak perlu).
5. Tulis pesan commit mis. `v1.0.0`, klik **Commit changes**.
6. Periksa di GitHub: pastikan folder `src`, `public`, `backend`, `test` semuanya
   muncul dan `package.json` ada. Kalau ada yang tertinggal, upload susulan file/
   folder tersebut sebelum lanjut ke Vercel.

## Langkah 2 — Deploy ke Vercel

1. Buka vercel.com → Add New → Project → Import repository `wwn-madrasah-80`.
2. Framework Preset: **Vite** (biasanya terdeteksi otomatis). Biarkan Build Command
   dan Output Directory bawaan.
3. Klik **Deploy**, tunggu sampai selesai, catat URL-nya
   (mis. `https://wwn-madrasah-80.vercel.app`).

## Langkah 3 — Setup backend (WAJIB container-bound!)

> ⚠️ **JANGAN** membuat project di script.google.com langsung (standalone).
> `SpreadsheetApp.getActiveSpreadsheet()` akan `null` dan semua aksi gagal dengan
> error `Cannot read properties of null (reading 'getSheetByName')`.

1. Buat Google Spreadsheet baru, beri nama mis. **Database Madrasah Boyolali**.
2. **Dari dalam spreadsheet itu**, buka menu **Extensions → Apps Script**.
   (Editor Apps Script yang terbuka inilah yang terikat ke spreadsheet tersebut.)
3. Di editor, **hapus seluruh isi** file `Code.gs` yang ada, lalu **paste seluruh
   isi** `backend/Kode.gs` dari repo ini. Simpan (Ctrl+S / ikon disket).
4. (Opsional, hanya bila nanti memakai upload logo) Di editor, pilih Project
   Settings (ikon roda gigi) → centang *Show appsscript.json manifest file in
   editor* → buka file `appsscript.json` yang muncul → **ganti seluruh isinya**
   dengan `backend/appsscript.json` dari repo ini → simpan.
5. Klik **Deploy → New deployment** → pilih type **Web app** →
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik Deploy, izinkan akses Google bila diminta.
6. **Salin URL** yang berakhiran `/exec`.

> Setiap ada perubahan Kode.gs: **Deploy → Manage deployments → pilih deployment
> → New version** (BUKAN membuat New deployment baru, supaya URL tidak berubah).

## Langkah 4 — Sambungkan aplikasi ke backend

1. Buka aplikasi Vercel Anda → menu **Konfigurasi**.
2. Tempel URL `/exec` dari Langkah 3 ke kolom **URL Backend** → **Simpan URL**.
3. Klik **Uji Koneksi** — harus muncul "Terhubung!".
4. Klik **Inisialisasi Database** — 15 sheet dibuat + seed (nama sekolah, 4 jurusan,
   2 berita, 1 pengumuman, 4 akun bawaan).
5. Buka **Login** → masuk dengan `admin` / `admin123`.
6. Buka **Pengaturan** (menu portal, khusus admin) → ubah nama sekolah, alamat,
   telepon, email, tahun ajaran, kepala madrasah sesuai kebutuhan → **Simpan**.
   Nama baru langsung tampil di navbar, hero, dan footer.
7. Terakhir: ganti semua kata sandi bawaan di **Kelola Data → Pengguna**.

## Multi-sekolah (opsional)

`public/schools.json` berisi satu entri (`id: "boyolali"`, `apiUrl` kosong sebagai
placeholder). Menambah sekolah baru = tambah satu entri di file itu, push ke GitHub
(Vercel auto-deploy), lalu pilih lewat `?school=<id>` atau pemilih di Konfigurasi.
Mengganti sekolah akan menghapus override URL manual agar tidak tertukar.

## Tes (QA) — dijalankan sebelum rilis v1.0.0

```bash
npx tsc --noEmit
npx vite build
node --check backend/Kode.gs
node test/smoke-test.mjs
npx tsc src/lib/logic.ts --outDir test/dist-test --module nodenext --target es2020 --moduleResolution nodenext --ignoreConfig
node test/frontend-logic.test.mjs
```

Catatan: `npm install` tidak bisa dijalankan di VM pengembang (gagal EPERM chown);
build & tes di sini memakai `node_modules` dari proyek sebelumnya (dependensi sama,
tanpa paket baru), dan Vercel akan menginstal sendiri saat deploy.
