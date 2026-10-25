import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Layout } from './components/Layout';
import { Button, LoadingBlock, Toasts } from './components/ui';
import Beranda from './pages/Beranda';
import Berita from './pages/Berita';
import Galeri from './pages/Galeri';
import PPDB from './pages/PPDB';
import Kontak from './pages/Kontak';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KelolaData from './pages/KelolaData';
import AbsensiQR from './pages/AbsensiQR';
import NilaiTugas from './pages/NilaiTugas';
import Pengaturan from './pages/Pengaturan';
import Konfigurasi from './pages/Konfigurasi';
import type { PageProps } from './pages/PageProps';
import {
  getAllData, getApiUrl, getPanelData, getUser, logout, setApiUrl, setUrlEfektif,
} from './services/gasApi';
import type { DataPublik, PageKey, PanelData, Pengaturan as PengaturanTipe, SekolahEntry, ToastMsg, UserSesi } from './types';

const LS_SCHOOL = 'wwn-madrasah-80.schoolId';
const LS_ORTU = 'wwn-madrasah-80.ortuSiswaId';

export const PENGATURAN_DEFAULT: PengaturanTipe = {
  namaSekolah: 'Madrasah Swasta Boyolali', singkatan: 'MSB', alamatSekolah: '',
  telepon: '', email: '', tahunAjaran: '2025/2026', namaKepala: '', logoUrl: '',
};

// Data demo lokal: Beranda tetap tampil walau backend belum tersambung.
export const PUBLIK_DEMO: DataPublik = {
  pengaturan: PENGATURAN_DEFAULT,
  jurusan: [
    { id: 'd1', kode: 'AKL', nama: 'Akuntansi dan Keuangan Lembaga', deskripsi: 'Mengelola keuangan lembaga secara profesional.' },
    { id: 'd2', kode: 'MM', nama: 'Multimedia', deskripsi: 'Desain grafis, video, dan media digital kreatif.' },
    { id: 'd3', kode: 'TKR', nama: 'Teknik Kendaraan Ringan', deskripsi: 'Perawatan dan perbaikan kendaraan ringan.' },
    { id: 'd4', kode: 'TKJ', nama: 'Teknik Komputer dan Jaringan', deskripsi: 'Instalasi komputer dan jaringan.' },
  ],
  kelas: [],
  berita: [
    { id: '1', judul: 'Sekolah Kembali Raih Akreditasi A', isi: 'Dengan hasil asesmen institusi terbaru, sekolah kita kembali memperoleh predikat A (Unggul). Prestasi ini adalah hasil kerja bersama seluruh warga sekolah.', tanggal: '2026-10-21' },
    { id: '2', judul: 'Juara 1 Lomba Kompetensi Siswa Tingkat Provinsi', isi: 'Tim siswa jurusan TKJ berhasil meraih Juara 1 Lomba Kompetensi Siswa (LKS) tingkat provinsi bidang Keahlian Jaringan.', tanggal: '2026-10-21' },
  ],
  pengumuman: [
    { id: '1', judul: 'Selamat Datang di Tahun Ajaran 2025/2026', isi: 'Seluruh siswa diharapkan mengikuti kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS) mulai pekan depan. Bawa perlengkapan lengkap dan kartu pelajar.', tanggal: '2026-10-21' },
  ],
  galeri: [],
  statistik: { siswa: 8, guru: 4, kelas: 4, jurusan: 4 },
};

function normalisasiPublik(d: DataPublik): DataPublik {
  return {
    pengaturan: { ...PENGATURAN_DEFAULT, ...(d.pengaturan || {}) },
    jurusan: d.jurusan || [], kelas: d.kelas || [], berita: d.berita || [],
    pengumuman: d.pengumuman || [], galeri: d.galeri || [],
    statistik: d.statistik || { siswa: 0, guru: 0, kelas: 0, jurusan: 0 },
  };
}

export default function App() {
  const [daftarSekolah, setDaftarSekolah] = useState<SekolahEntry[]>([]);
  const [sekolah, setSekolah] = useState<SekolahEntry | null>(null);
  const [urlManual, setUrlManual] = useState(() => getApiUrl());
  const [publik, setPublik] = useState<DataPublik>(PUBLIK_DEMO);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [terhubung, setTerhubung] = useState(false);
  const [user, setUser] = useState<UserSesi | null>(() => getUser());
  const [page, setPage] = useState<PageKey>('beranda');
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const initRef = useRef(false);

  const toast = useCallback((pesan: string, tipe: ToastMsg['tipe'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, pesan, tipe }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const muatPublik = useCallback(async () => {
    try {
      const d = await getAllData();
      setPublik(normalisasiPublik(d));
      setTerhubung(true);
    } catch {
      setTerhubung(false);
      setPublik((p) => p); // tetap data demo / data terakhir
    }
  }, []);

  const muatPanel = useCallback(async () => {
    const u = getUser();
    if (!u) { setPanel(null); return; }
    try {
      let ortuId = '';
      try { ortuId = localStorage.getItem(LS_ORTU) || ''; } catch { /* abaikan */ }
      const d = await getPanelData(u.peran === 'ortu' && ortuId ? ortuId : undefined);
      setPanel(d);
    } catch {
      setPanel(null);
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      let daftar: SekolahEntry[] = [];
      try {
        const r = await fetch('schools.json');
        if (r.ok) daftar = (await r.json()) as SekolahEntry[];
      } catch { /* abaikan */ }
      setDaftarSekolah(daftar);
      const params = new URLSearchParams(window.location.search);
      const dariUrl = params.get('school');
      let terpilih: SekolahEntry | null = null;
      try {
        const tersimpan = localStorage.getItem(LS_SCHOOL);
        terpilih = daftar.find((s) => s.id === dariUrl) || daftar.find((s) => s.id === tersimpan) || daftar[0] || null;
      } catch { terpilih = daftar.find((s) => s.id === dariUrl) || daftar[0] || null; }
      setSekolah(terpilih);
      if (terpilih) { try { localStorage.setItem(LS_SCHOOL, terpilih.id); } catch { /* abaikan */ } }
      const manual = getApiUrl();
      setUrlManual(manual);
      const efektif = manual.trim() || terpilih?.apiUrl.trim() || '';
      setUrlEfektif(efektif);
      if (!efektif) {
        setMemuat(false);
        setTerhubung(false);
        setPublik(PUBLIK_DEMO);
        return;
      }
      await muatPublik();
      await muatPanel();
      setMemuat(false);
    })();
  }, [muatPublik, muatPanel]);

  const segarkanSesi = useCallback(() => setUser(getUser()), []);

  const gantiSekolah = useCallback(async (s: SekolahEntry) => {
    setSekolah(s);
    try { localStorage.setItem(LS_SCHOOL, s.id); localStorage.removeItem(LS_ORTU); } catch { /* abaikan */ }
    setApiUrl(''); setUrlManual(''); setUrlEfektif(s.apiUrl.trim());
    const params = new URLSearchParams(window.location.search);
    params.set('school', s.id);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    setPage('beranda'); window.scrollTo({ top: 0 });
    await muatPublik(); await muatPanel();
  }, [muatPublik, muatPanel]);

  const gantiUrlManual = useCallback(async (url: string) => {
    setUrlManual(url);
    setUrlEfektif(url.trim() || sekolah?.apiUrl.trim() || '');
    await muatPublik(); await muatPanel();
  }, [sekolah, muatPublik, muatPanel]);

  const onNeedLogin = useCallback((adminSaja = false) => {
    toast(adminSaja ? 'Halaman ini khusus admin. Silakan masuk dulu.' : 'Silakan masuk dulu untuk mengakses halaman ini.', 'info');
    setPage('login'); window.scrollTo({ top: 0 });
  }, [toast]);

  const handleLogout = useCallback(async () => {
    await logout();
    try { localStorage.removeItem(LS_ORTU); } catch { /* abaikan */ }
    setPanel(null); segarkanSesi();
    toast('Anda telah keluar.', 'info');
    setPage('beranda');
  }, [segarkanSesi, toast]);

  const pindah = useCallback((p: PageKey) => { setPage(p); window.scrollTo({ top: 0 }); }, []);
  const urlEfektif = urlManual.trim() || sekolah?.apiUrl.trim() || '';

  const props: PageProps = {
    pengaturan: publik.pengaturan, publik, panel, user, terhubung,
    onNeedLogin, refreshPublik: muatPublik, refreshPanel: muatPanel,
    toast, pindah, sekolah, daftarSekolah, onGantiSekolah: gantiSekolah, onApiUrlChange: gantiUrlManual,
  };

  let konten: React.ReactNode;
  if (memuat) {
    konten = <LoadingBlock teks="Menghubungkan ke backend..." />;
  } else {
    const butuhLogin = (page === 'kelola-data' || page === 'absensi-qr' || page === 'nilai-tugas' || page === 'pengaturan') && !user;
    const butuhAdmin = page === 'pengaturan' && user?.peran !== 'admin';
    if (butuhLogin || butuhAdmin) {
      konten = (
        <div>
          <div className="mx-auto mb-4 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {butuhAdmin ? 'Halaman Pengaturan khusus admin. Silakan masuk sebagai admin.' : 'Silakan masuk dulu untuk mengakses halaman ini.'}
          </div>
          <Login {...props} onAuthChange={segarkanSesi} />
        </div>
      );
    } else {
      switch (page) {
        case 'beranda': konten = <Beranda {...props} />; break;
        case 'berita': konten = <Berita {...props} />; break;
        case 'galeri': konten = <Galeri {...props} />; break;
        case 'ppdb': konten = <PPDB {...props} />; break;
        case 'kontak': konten = <Kontak {...props} />; break;
        case 'login': konten = <Login {...props} onAuthChange={segarkanSesi} />; break;
        case 'dashboard': konten = <Dashboard {...props} />; break;
        case 'kelola-data': konten = <KelolaData {...props} />; break;
        case 'absensi-qr': konten = <AbsensiQR {...props} />; break;
        case 'nilai-tugas': konten = <NilaiTugas {...props} />; break;
        case 'pengaturan': konten = <Pengaturan {...props} />; break;
        case 'konfigurasi': konten = <Konfigurasi {...props} />; break;
        default: konten = <Beranda {...props} />;
      }
    }
  }

  return (
    <Layout
      page={page}
      onPindah={pindah}
      sekolah={sekolah}
      daftarSekolah={daftarSekolah}
      onGantiSekolah={gantiSekolah}
      terhubung={terhubung}
      namaSekolah={publik.pengaturan.namaSekolah}
      singkatan={publik.pengaturan.singkatan}
      alamat={publik.pengaturan.alamatSekolah}
      telepon={publik.pengaturan.telepon}
      email={publik.pengaturan.email}
      user={user}
      onLogin={() => pindah('login')}
      onLogout={handleLogout}
    >
      {!urlEfektif && page !== 'konfigurasi' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <span>Backend belum dikonfigurasi — Beranda menampilkan data demo.</span>
          <Button kecil onClick={() => pindah('konfigurasi')}>Buka Konfigurasi</Button>
        </div>
      )}
      {page !== 'beranda' && !terhubung && urlEfektif && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Backend tidak dapat dihubungi. Periksa URL di Konfigurasi.</span>
        </div>
      )}
      {konten}
      <Toasts daftar={toasts} onTutup={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </Layout>
  );
}
