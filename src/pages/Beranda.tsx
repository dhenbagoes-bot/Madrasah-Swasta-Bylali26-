import { Award, BookOpen, Building, Compass, Laptop, Megaphone, Newspaper, User, Users, QrCode, ShieldCheck } from 'lucide-react';
import type { PageProps } from './PageProps';
import { Button } from '../components/ui';

const DEMO_STAT = { siswa: 8, guru: 4, kelas: 4, jurusan: 4 };

export default function Beranda({ pengaturan, publik, terhubung, pindah }: PageProps) {
  const nama = pengaturan.namaSekolah;
  const stat = terhubung ? publik.statistik : DEMO_STAT;
  const jurusan = publik.jurusan.length ? publik.jurusan : [
    { id: 'd1', kode: 'AKL', nama: 'Akuntansi dan Keuangan Lembaga', deskripsi: '' },
    { id: 'd2', kode: 'MM', nama: 'Multimedia', deskripsi: '' },
    { id: 'd3', kode: 'TKR', nama: 'Teknik Kendaraan Ringan', deskripsi: '' },
    { id: 'd4', kode: 'TKJ', nama: 'Teknik Komputer dan Jaringan', deskripsi: '' },
  ];
  const berita = publik.berita.length ? publik.berita : [
    { id: '1', judul: 'Sekolah Kembali Raih Akreditasi A', isi: 'Dengan hasil asesmen institusi terbaru, sekolah kita kembali memperoleh predikat A (Unggul). Prestasi ini adalah hasil kerja bersama seluruh warga sekolah.', tanggal: '2026-10-21' },
    { id: '2', judul: 'Juara 1 Lomba Kompetensi Siswa Tingkat Provinsi', isi: 'Tim siswa jurusan TKJ berhasil meraih Juara 1 Lomba Kompetensi Siswa (LKS) tingkat provinsi bidang Keahlian Jaringan.', tanggal: '2026-10-21' },
  ];
  const pengumuman = publik.pengumuman.length ? publik.pengumuman : [
    { id: '1', judul: 'Selamat Datang di Tahun Ajaran 2025/2026', isi: 'Seluruh siswa diharapkan mengikuti kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS) mulai pekan depan. Bawa perlengkapan lengkap dan kartu pelajar.', tanggal: '2026-10-21' },
  ];
  const stats = [
    { ikon: <Users className="h-6 w-6" />, angka: stat.siswa, label: 'Siswa Terdaftar' },
    { ikon: <User className="h-6 w-6" />, angka: stat.guru, label: 'Guru & Tenaga' },
    { ikon: <Building className="h-6 w-6" />, angka: stat.kelas, label: 'Rombel / Kelas' },
    { ikon: <Compass className="h-6 w-6" />, angka: stat.jurusan, label: 'Jurusan' },
  ];
  return (
    <div>
      {/* HERO — gradasi hijau muda ke putih */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-200 via-emerald-100 to-white px-5 py-10 shadow-sm sm:px-10 sm:py-14">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
          📅 Tahun Ajaran {pengaturan.tahunAjaran}
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-emerald-950 sm:text-5xl">
          Selamat Datang di<br />{nama}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-800 sm:text-lg">
          Sekolah dengan sistem digital modern: absensi berbasis <strong>QR Code</strong>,
          portal siswa, guru, dan orang tua — semua dalam satu website.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => pindah('ppdb')} className="px-5 py-3">📝 Daftar PPDB Online</Button>
          <Button varian="sekunder" onClick={() => pindah('berita')} className="px-5 py-3"><Newspaper className="h-4 w-4" />Berita Sekolah</Button>
        </div>
        {!terhubung && (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Menampilkan data demo karena backend belum terhubung. Admin: buka menu Konfigurasi untuk menempel URL backend, lalu klik Inisialisasi Database.
          </p>
        )}
      </section>

      {/* STATISTIK */}
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">{s.ikon}</span>
              <div>
                <p className="font-mono-num text-2xl font-bold text-emerald-950">{s.angka}</p>
                <p className="text-xs text-emerald-700">{s.label}</p>
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-emerald-100"><div className="h-1 w-1/3 rounded-full bg-emerald-500" /></div>
          </div>
        ))}
      </section>

      {/* PENGUMUMAN */}
      <section className="mt-8 grid gap-3 lg:grid-cols-2">
        {pengumuman.map((p) => (
          <div key={p.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h6 className="font-semibold text-emerald-950"><Megaphone className="mr-1 inline h-4 w-4 text-emerald-600" />{p.judul}</h6>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{p.tanggal}</span>
            </div>
            <p className="mt-2 text-sm text-emerald-800">{p.isi}</p>
          </div>
        ))}
      </section>

      {/* TENTANG */}
      <section className="mt-10">
        <h3 className="text-xl font-bold text-emerald-950">Tentang Sekolah</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-sm leading-relaxed text-emerald-800">
              {nama} adalah sekolah menengah yang mengintegrasikan teknologi dalam proses belajar mengajar.
              Mulai dari absensi berbasis QR Code, penilaian digital, hingga komunikasi dengan orang tua —
              semua dapat diakses dari internet kapan saja.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-emerald-800">
              Kami menyediakan jurusan-jurusan yang sesuai dengan perkembangan industri dan dunia kerja,
              didampingi guru-guru berpengalaman serta fasilitas praktikum yang memadai.
            </p>
            <Button varian="sekunder" className="mt-4" onClick={() => pindah('kontak')}>✉️ Hubungi Kami</Button>
          </div>
          <div className="space-y-3">
            {[
              { ikon: <QrCode className="h-5 w-5" />, judul: 'Absensi QR Code', isi: 'Siswa cukup memasukkan kode sesi pelajaran — cepat, akurat, dan anti titip absen.' },
              { ikon: <Laptop className="h-5 w-5" />, judul: 'Portal Digital', isi: 'Nilai, tugas, materi, dan jadwal tersaji real-time untuk siswa dan orang tua.' },
              { ikon: <ShieldCheck className="h-5 w-5" />, judul: '4 Level Akses', isi: 'Sistem dengan peran Admin, Guru, Siswa, dan Orang Tua yang aman.' },
            ].map((k) => (
              <div key={k.judul} className="flex gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <span className="shrink-0 rounded-xl bg-emerald-100 p-2.5 text-emerald-700">{k.ikon}</span>
                <div><p className="font-semibold text-emerald-950">{k.judul}</p><p className="text-sm text-emerald-700">{k.isi}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JURUSAN */}
      <section className="mt-10">
        <h3 className="text-center text-xl font-bold text-emerald-950">Jurusan Peminatan</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {jurusan.map((j) => (
            <div key={j.id} className="rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Award className="h-5 w-5" /></div>
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">{j.kode}</span>
              <p className="mt-2 text-sm font-semibold text-emerald-950">{j.nama}</p>
              {j.deskripsi && <p className="mt-1 text-xs text-emerald-700">{j.deskripsi}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* BERITA */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-2">
          <h3 className="text-xl font-bold text-emerald-950">Berita Terbaru</h3>
          <Button varian="sekunder" kecil onClick={() => pindah('berita')}>Semua Berita →</Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {berita.slice(0, 3).map((b) => (
            <div key={b.id} className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="grid h-24 place-items-center rounded-xl bg-emerald-50 text-3xl">📰</div>
              <p className="mt-3 text-xs text-emerald-600">{b.tanggal}</p>
              <h6 className="mt-1 font-semibold text-emerald-950">{b.judul}</h6>
              <p className="mt-1 line-clamp-3 text-sm text-emerald-700">{b.isi}</p>
              <Button varian="sekunder" kecil className="mt-3 self-start" onClick={() => pindah('berita')}>Baca Selengkapnya →</Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA PPDB */}
      <section className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-200 via-emerald-100 to-white p-6 text-center shadow-sm sm:p-10">
        <h4 className="text-xl font-bold text-emerald-950">Penerimaan Peserta Didik Baru dibuka!</h4>
        <p className="mt-1 text-sm text-emerald-800">Daftar sekarang secara online — proses cepat, tanpa antre panjang.</p>
        <Button className="mt-4 px-5 py-3" onClick={() => pindah('ppdb')}>Daftar PPDB Sekarang</Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600"><BookOpen className="h-3.5 w-3.5" /> {pengaturan.tahunAjaran} • {nama}</p>
      </section>
    </div>
  );
}
