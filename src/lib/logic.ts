// Logika murni frontend (tanpa dependensi React) — diuji node test/frontend-logic.test.mjs
export interface StatInput { siswa: number; guru: number; kelas: number; jurusan: number; }

export function hitungStatistik(siswa: unknown[], guru: unknown[], kelas: unknown[], jurusan: unknown[]): StatInput {
  return { siswa: siswa.length, guru: guru.length, kelas: kelas.length, jurusan: jurusan.length };
}

export function normalisasiKodeSesi(kode: string): string {
  return (kode || '').trim().toUpperCase();
}

export function validasiKodeSesi(kode: string): string | null {
  const k = normalisasiKodeSesi(kode);
  if (!k) return 'Kode sesi wajib diisi.';
  if (!/^QR-\d{4}$/.test(k)) return 'Format kode sesi harus QR-XXXX (4 angka), contoh: QR-1234.';
  return null;
}

export function sudahAbsen(absensi: { siswaId: string; sesiId: string }[], siswaId: string, sesiId: string): boolean {
  return absensi.some((a) => a.siswaId === siswaId && a.sesiId === sesiId);
}

export function cariSesiAktif<T extends { kode: string; status: string }>(sesi: T[], kode: string): T | null {
  const k = normalisasiKodeSesi(kode);
  const found = sesi.find((s) => s.kode.toUpperCase() === k);
  if (!found) return null;
  if (found.status !== 'Aktif') return null;
  return found;
}

export function validasiNilai(nilai: number): string | null {
  if (!Number.isFinite(nilai)) return 'Nilai harus berupa angka.';
  if (nilai < 0 || nilai > 100) return 'Nilai harus antara 0-100.';
  return null;
}

export function rataNilai(nilai: { nilai: number }[]): number {
  if (nilai.length === 0) return 0;
  return Math.round((nilai.reduce((a, b) => a + b.nilai, 0) / nilai.length) * 10) / 10;
}
