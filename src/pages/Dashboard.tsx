import { useState } from 'react';
import { rataNilai } from '../lib/logic';
import type { PageProps } from './PageProps';
import { Badge, Button, Card, EmptyState, PageHeader, StatCard, TextInput } from '../components/ui';
import { BookOpen, ClipboardList, GraduationCap, QrCode, Users } from 'lucide-react';

export default function Dashboard({ user, panel, publik, toast, pindah, refreshPanel }: PageProps) {
  const [cariAnak, setCariAnak] = useState('');
  const [anakDipilih, setAnakDipilih] = useState('');
  if (!user) {
    return (
      <div>
        <PageHeader judul="Dasbor Portal" subjudul="Silakan masuk untuk melihat dasbor sesuai peran Anda." />
        <Card className="text-center">
          <p className="text-sm text-emerald-800">Portal ini memiliki 4 peran: <strong>Admin</strong>, <strong>Guru</strong>, <strong>Siswa</strong>, dan <strong>Orang Tua</strong>.</p>
          <Button className="mt-4" onClick={() => pindah('login')}>Masuk ke Portal</Button>
        </Card>
      </div>
    );
  }
  const peran = user.peran;
  const stat = publik.statistik;
  const absensiSaya = panel?.absensi || [];
  const nilaiSaya = panel?.nilai || [];

  const pilihAnakDanMuat = async (id: string) => {
    setAnakDipilih(id);
    // Panel ortu dimuat ulang dengan siswaId terpilih lewat refreshPanel bawaan App
    // (App menyimpan siswaId ortu terakhir di localStorage sesi).
    try {
      localStorage.setItem('wwn-madrasah-80.ortuSiswaId', id);
      await refreshPanel();
      toast('Data anak dimuat.', 'sukses');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal memuat data anak.', 'error');
    }
  };

  return (
    <div>
      <PageHeader judul={`Dasbor ${peran.charAt(0).toUpperCase() + peran.slice(1)}`} subjudul={`Selamat datang, ${user.nama}.`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard ikon={<Users className="h-6 w-6" />} label="Siswa" nilai={String(panel ? panel.siswa.length : stat.siswa)} warna="hijau" />
        <StatCard ikon={<GraduationCap className="h-6 w-6" />} label="Guru" nilai={String(panel ? panel.guru.length : stat.guru)} warna="biru" />
        <StatCard ikon={<QrCode className="h-6 w-6" />} label="Sesi QR Aktif" nilai={String((panel?.sesi || []).filter((s) => s.status === 'Aktif').length)} warna="kuning" />
        <StatCard ikon={<BookOpen className="h-6 w-6" />} label="Rata-rata Nilai Saya" nilai={String(rataNilai(nilaiSaya))} warna="ungu" />
      </div>

      {peran === 'ortu' && (
        <Card className="mt-4">
          <h3 className="font-bold text-emerald-950">Pilih Anak</h3>
          <p className="mt-1 text-sm text-emerald-700">Cari berdasarkan NIS atau nama, lalu pilih untuk melihat absensi &amp; nilai anak.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TextInput value={cariAnak} onChange={(e) => setCariAnak(e.target.value)} placeholder="Cari NIS / nama anak…" className="max-w-xs" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(panel?.siswa || []).filter((s) => !cariAnak.trim() || s.nama.toLowerCase().includes(cariAnak.toLowerCase()) || s.nis.includes(cariAnak.trim())).slice(0, 20).map((s) => (
              <button key={s.id} onClick={() => pilihAnakDanMuat(s.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${anakDipilih === s.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-emerald-200 bg-white text-emerald-800'}`}>
                {s.nama} {s.nis ? `(${s.nis})` : ''} — {s.kelas}
              </button>
            ))}
            {(panel?.siswa || []).length === 0 && <p className="text-sm text-emerald-600">Belum ada data siswa. Admin dapat menambahkannya di Kelola Data.</p>}
          </div>
        </Card>
      )}

      {(peran === 'siswa' || peran === 'ortu') && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="font-bold text-emerald-950">Absensi Saya / Anak</h3>
            {absensiSaya.length === 0 ? <EmptyState judul="Belum ada absensi" subjudul="Absensi akan muncul setelah absen via kode sesi." /> : (
              <ul className="mt-3 space-y-2 text-sm">
                {absensiSaya.slice(0, 10).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 border-b border-emerald-50 pb-2">
                    <span>{a.tanggal} • {a.kodeSesi || 'Manual'} • {a.kelas}</span>
                    <Badge warna={a.status === 'Hadir' ? 'hijau' : a.status === 'Alpa' ? 'merah' : 'kuning'}>{a.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button varian="sekunder" kecil className="mt-3" onClick={() => pindah('absensi-qr')}>Buka Absensi QR →</Button>
          </Card>
          <Card>
            <h3 className="font-bold text-emerald-950">Nilai</h3>
            {nilaiSaya.length === 0 ? <EmptyState judul="Belum ada nilai" subjudul="Nilai akan muncul setelah guru menginputnya." /> : (
              <ul className="mt-3 space-y-2 text-sm">
                {nilaiSaya.slice(0, 10).map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-2 border-b border-emerald-50 pb-2">
                    <span>{n.mapel} — {n.keterangan || n.tanggal}</span><strong>{n.nilai}</strong>
                  </li>
                ))}
              </ul>
            )}
            <Button varian="sekunder" kecil className="mt-3" onClick={() => pindah('nilai-tugas')}>Buka Nilai &amp; Tugas →</Button>
          </Card>
        </div>
      )}

      {(peran === 'admin' || peran === 'guru') && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="font-bold text-emerald-950">PPDB Menunggu Verifikasi</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-950">{(panel?.ppdb || []).filter((p) => p.status === 'Menunggu').length}</p>
            <p className="text-sm text-emerald-700">pendaftar berstatus Menunggu dari total {(panel?.ppdb || []).length} pendaftar.</p>
            <Button varian="sekunder" kecil className="mt-3" onClick={() => pindah('kelola-data')}>Verifikasi di Kelola Data →</Button>
          </Card>
          <Card>
            <h3 className="font-bold text-emerald-950">Pengumuman Terbaru</h3>
            {publik.pengumuman.length === 0 ? <EmptyState judul="Belum ada pengumuman" /> : (
              <ul className="mt-3 space-y-2 text-sm">
                {publik.pengumuman.slice(0, 5).map((p) => (
                  <li key={p.id} className="border-b border-emerald-50 pb-2"><strong>{p.judul}</strong><p className="text-emerald-700">{p.isi}</p></li>
                ))}
              </ul>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600"><ClipboardList className="h-3.5 w-3.5" /> Kelola pengumuman &amp; berita di Kelola Data.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
