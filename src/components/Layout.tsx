import { useState, type ReactNode } from 'react';
import {
  BarChart3, BookOpen, Database, GraduationCap, Home, Image, LogIn, LogOut,
  Mail, MapPin, Menu as MenuIcon, Newspaper, Phone, QrCode, Settings, Users, Wifi, WifiOff, X,
} from 'lucide-react';
import type { PageKey, SekolahEntry, UserSesi } from '../types';
import { Modal } from './ui';

export interface NavItem { key: PageKey; label: string; icon: ReactNode; }

export const NAV_PUBLIK: NavItem[] = [
  { key: 'beranda', label: 'Beranda', icon: <Home className="h-4 w-4" /> },
  { key: 'berita', label: 'Berita', icon: <Newspaper className="h-4 w-4" /> },
  { key: 'galeri', label: 'Galeri', icon: <Image className="h-4 w-4" /> },
  { key: 'ppdb', label: 'PPDB', icon: <GraduationCap className="h-4 w-4" /> },
  { key: 'kontak', label: 'Kontak', icon: <Mail className="h-4 w-4" /> },
];
export const NAV_PORTAL: NavItem[] = [
  { key: 'dashboard', label: 'Dasbor', icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'absensi-qr', label: 'Absensi QR', icon: <QrCode className="h-4 w-4" /> },
  { key: 'nilai-tugas', label: 'Nilai & Tugas', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'kelola-data', label: 'Kelola Data', icon: <Users className="h-4 w-4" /> },
];

export function Layout({ page, onPindah, sekolah, daftarSekolah, onGantiSekolah, terhubung, namaSekolah, singkatan, alamat, telepon, email, user, onLogin, onLogout, children }: {
  page: PageKey; onPindah: (p: PageKey) => void; sekolah: SekolahEntry | null;
  daftarSekolah: SekolahEntry[]; onGantiSekolah: (s: SekolahEntry) => void;
  terhubung: boolean; namaSekolah?: string; singkatan?: string; alamat?: string;
  telepon?: string; email?: string; user: UserSesi | null;
  onLogin: () => void; onLogout: () => void; children: ReactNode;
}) {
  const [menuBuka, setMenuBuka] = useState(false);
  const [pickerBuka, setPickerBuka] = useState(false);
  const pindah = (p: PageKey) => { onPindah(p); setMenuBuka(false); window.scrollTo({ top: 0 }); };
  const namaTampil = namaSekolah || sekolah?.nama || 'Madrasah Swasta Boyolali';
  const singk = singkatan || 'MSB';
  const portalTampil = user ? NAV_PORTAL.filter((n) => !(n.key === 'kelola-data' && user.peran !== 'admin' && user.peran !== 'guru')) : [];

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-emerald-200 bg-gradient-to-r from-emerald-100 via-emerald-50 to-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-6">
          <button onClick={() => pindah('beranda')} className="flex items-center gap-2 text-left">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">{singk.slice(0, 3)}</span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-emerald-950 sm:text-base">{singk} <span className="hidden font-semibold text-emerald-700 sm:inline">{namaTampil}</span></span>
              <span className="block text-[11px] text-emerald-600 sm:hidden">{namaTampil}</span>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-3 lg:flex">
              {NAV_PUBLIK.map((n) => (
                <button key={n.key} onClick={() => pindah(n.key)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${page === n.key ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-100'}`}>{n.label}</button>
              ))}
            </div>
            {user ? (
              <span className="hidden items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
                <span className="max-w-[120px] truncate">{user.nama}</span>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 uppercase text-white">{user.peran}</span>
              </span>
            ) : (
              <button onClick={onLogin} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                <LogIn className="h-3.5 w-3.5" />Login
              </button>
            )}
            <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex ${terhubung ? 'bg-emerald-600' : 'bg-amber-500'}`} title={terhubung ? 'Terhubung ke backend' : 'Backend belum terhubung (data demo)'}>
              {terhubung ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{terhubung ? 'Online' : 'Offline'}
            </span>
            {user && (
              <button onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50" title="Keluar">
                <LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Keluar</span>
              </button>
            )}
            <button onClick={() => setMenuBuka(!menuBuka)} className="rounded-lg p-2 text-emerald-800 hover:bg-emerald-100 lg:hidden" aria-label="Menu">
              {menuBuka ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
          {menuBuka && (
            <div className="flex w-full flex-wrap gap-1.5 border-t border-emerald-100 pt-2 lg:hidden">
              {NAV_PUBLIK.map((n) => (
                <button key={n.key} onClick={() => pindah(n.key)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${page === n.key ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800 border border-emerald-200'}`}>{n.label}</button>
              ))}
              <button onClick={() => { setPickerBuka(true); setMenuBuka(false); }} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800">Ganti Madrasah</button>
              <button onClick={() => pindah('konfigurasi')} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800">Konfigurasi</button>
            </div>
          )}
        </div>
        {user && (
          <div className="border-t border-emerald-100 bg-white/70">
            <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-3 py-1.5 sm:px-6">
              {portalTampil.map((n) => (
                <button key={n.key} onClick={() => pindah(n.key)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${page === n.key ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-100'}`}>{n.icon}{n.label}</button>
              ))}
              {user.peran === 'admin' && (
                <button onClick={() => pindah('pengaturan')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${page === 'pengaturan' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-100'}`}><Settings className="h-4 w-4" />Pengaturan</button>
              )}
              <button onClick={() => pindah('konfigurasi')} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${page === 'konfigurasi' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-100'}`}><Database className="h-4 w-4" />Konfigurasi</button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">{children}</main>

      <footer className="mt-8 border-t border-emerald-200 bg-gradient-to-b from-white to-emerald-50 pb-6 pt-8">
        <div className="mx-auto grid max-w-7xl gap-6 px-3 sm:px-6 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-emerald-950">🏫 {namaTampil}</p>
            {alamat && <p className="mt-2 flex items-start gap-2 text-sm text-emerald-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{alamat}</p>}
            {telepon && <p className="mt-1 flex items-center gap-2 text-sm text-emerald-800"><Phone className="h-4 w-4 shrink-0" />{telepon}</p>}
            {email && <p className="mt-1 flex items-center gap-2 text-sm text-emerald-800"><Mail className="h-4 w-4 shrink-0" /><a href={`mailto:${email}`}>{email}</a></p>}
          </div>
          <div>
            <p className="font-semibold text-emerald-950">Navigasi Cepat</p>
            <ul className="mt-2 space-y-1 text-sm text-emerald-800">
              {NAV_PUBLIK.map((n) => (
                <li key={n.key}><button onClick={() => pindah(n.key)} className="hover:underline">› {n.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-emerald-950">Layanan Sekolah</p>
            <ul className="mt-2 space-y-1 text-sm text-emerald-800">
              <li>✓ Absensi QR Code</li><li>✓ PPDB Online</li>
              <li>✓ Portal Siswa, Guru &amp; Orang Tua</li><li>✓ Info Berita &amp; Pengumuman</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-7xl border-t border-emerald-100 px-3 pt-4 text-center text-xs text-emerald-600 sm:px-6">
          © 2026 {namaTampil}. Hak cipta dilindungi. {!terhubung && 'Menampilkan data demo — hubungkan backend di menu Konfigurasi.'}
        </div>
      </footer>

      {pickerBuka && (
        <Modal judul="Pilih Madrasah" onTutup={() => setPickerBuka(false)} lebar="max-w-md">
          <div className="space-y-2">
            {daftarSekolah.length === 0 && <p className="text-sm text-emerald-700">Belum ada madrasah terdaftar. Tambahkan di <code>public/schools.json</code> atau atur URL backend manual di menu Konfigurasi.</p>}
            {daftarSekolah.map((s) => (
              <button key={s.id} onClick={() => { onGantiSekolah(s); setPickerBuka(false); }} className={`block w-full rounded-xl border p-3.5 text-left ${sekolah?.id === s.id ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-200 hover:bg-emerald-50'}`}>
                <p className="font-bold text-emerald-950">{s.nama}</p>
                {s.kota && <p className="text-xs text-emerald-600">{s.kota}</p>}
                {sekolah?.id === s.id && <p className="mt-1 text-xs font-semibold text-emerald-600">✓ Sedang aktif</p>}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
