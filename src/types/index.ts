export type PageKey =
  | 'beranda'
  | 'berita'
  | 'galeri'
  | 'ppdb'
  | 'kontak'
  | 'login'
  | 'dashboard'
  | 'kelola-data'
  | 'absensi-qr'
  | 'nilai-tugas'
  | 'pengaturan'
  | 'konfigurasi';

export interface SekolahEntry { id: string; nama: string; kota: string; apiUrl: string; }

export interface Pengaturan {
  namaSekolah: string; singkatan: string; alamatSekolah: string;
  telepon: string; email: string; tahunAjaran: string; namaKepala: string; logoUrl: string;
}
export interface Siswa { id: string; nama: string; nis: string; kelas: string; jurusanId: string; hp: string; alamat: string; }
export interface Guru { id: string; nama: string; mapel: string; hp: string; }
export interface Kelas { id: string; nama: string; jurusanId: string; }
export interface Jurusan { id: string; kode: string; nama: string; deskripsi: string; }
export interface Berita { id: string; judul: string; isi: string; tanggal: string; }
export interface Pengumuman { id: string; judul: string; isi: string; tanggal: string; }
export interface GaleriItem { id: string; judul: string; deskripsi: string; url: string; tanggal: string; }
export interface Ppdb { id: string; nama: string; nisn: string; asalSekolah: string; jurusan: string; hp: string; alamat: string; status: string; tanggal: string; }
export interface Absensi { id: string; tanggal: string; siswaId: string; namaSiswa: string; kelas: string; sesiId: string; kodeSesi: string; status: string; }
export interface SesiQR { id: string; kode: string; mapel: string; kelas: string; tanggal: string; status: string; dibuatOleh: string; }
export interface Nilai { id: string; siswaId: string; namaSiswa: string; mapel: string; nilai: number; keterangan: string; tanggal: string; }
export interface Tugas { id: string; judul: string; deskripsi: string; mapel: string; kelas: string; tenggat: string; }
export interface Materi { id: string; judul: string; deskripsi: string; mapel: string; kelas: string; url: string; }
export interface PenggunaItem { id: string; nama: string; username: string; peran: string; siswaId: string; }
export interface UserSesi { nama: string; peran: string; siswaId?: string; }
export interface ToastMsg { id: number; pesan: string; tipe: 'sukses' | 'error' | 'info'; }

export interface Statistik { siswa: number; guru: number; kelas: number; jurusan: number; }

export interface DataPublik {
  pengaturan: Pengaturan; jurusan: Jurusan[]; kelas: Kelas[];
  berita: Berita[]; pengumuman: Pengumuman[]; galeri: GaleriItem[]; statistik: Statistik;
}

export interface PanelData {
  pengaturan: Pengaturan; pengguna: PenggunaItem[]; siswa: Siswa[]; guru: Guru[];
  kelas: Kelas[]; jurusan: Jurusan[]; berita: Berita[]; pengumuman: Pengumuman[];
  galeri: GaleriItem[]; ppdb: Ppdb[]; sesi: SesiQR[]; absensi: Absensi[];
  nilai: Nilai[]; tugas: Tugas[]; materi: Materi[];
}
