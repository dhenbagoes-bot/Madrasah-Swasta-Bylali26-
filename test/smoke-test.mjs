// Smoke test backend Kode.gs (wwn-madrasah-80) dengan stub Google Apps Script.
// Menjalankan Kode.gs ASLI di vm Node dan menguji: initDatabase (15 sheet,
// seed, idempotent), ping/doGet, login 4 peran (sukses/gagal/case-insensitive),
// logout & token kedaluwarsa, otorisasi aksi sensitif, getAllData (tanpa
// bocor rahasia/nilai/absensi), CRUD master, PPDB (submit publik +
// verifikasi admin), sesi QR (buat, absen, duplikat ditolak, tutup lalu
// absen ditolak), absen manual, nilai (validasi 0-100), savePengaturan
// khusus admin, getPanelData (siswa hanya data sendiri, ortu per anak).
// Jalankan: node test/smoke-test.mjs   (exit 0 = semua lolos)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'backend', 'Kode.gs'), 'utf8');

function makeSheet(name, headers) {
  const grid = [headers.slice()];
  return {
    _name: name,
    getName() { return this._name; },
    getLastRow() { return grid.length; },
    getLastColumn() { return grid[0].length; },
    getSheetValues() { return grid; },
    getRange(r, c, nr = 1, nc = 1) {
      function ensure(rr, cc) {
        while (grid.length < rr) grid.push(new Array(grid[0].length).fill(''));
        for (const row of grid) while (row.length < cc) row.push('');
      }
      return {
        getValues() {
          const out = [];
          for (let i = 0; i < nr; i++) {
            const row = [];
            for (let j = 0; j < nc; j++) {
              const gr = grid[r - 1 + i];
              row.push(gr ? (gr[c - 1 + j] ?? '') : '');
            }
            out.push(row);
          }
          return out;
        },
        getValue() { return this.getValues()[0][0]; },
        setValues(vals) {
          for (let i = 0; i < vals.length; i++)
            for (let j = 0; j < vals[i].length; j++) { ensure(r + i, c + j); grid[r - 1 + i][c - 1 + j] = vals[i][j]; }
        },
        setValue(v) { this.setValues([[v]]); },
      };
    },
    appendRow(row) {
      const h = grid[0].length;
      const full = row.slice(0, h);
      while (full.length < h) full.push('');
      grid.push(full);
    },
    deleteRow(n) {
      if (n < 1 || n > grid.length) throw new Error('Row out of range: ' + n);
      grid.splice(n - 1, 1);
    },
  };
}
const sheets = new Map();
const SpreadsheetApp = {
  getActiveSpreadsheet() {
    return {
      getName() { return 'DB TEST MADRASAH'; },
      getSheetByName(n) { return sheets.get(n) || null; },
      insertSheet(n) { const s = makeSheet(n, []); sheets.set(n, s); return s; },
    };
  },
};
const ContentService = {
  MimeType: { JSON: 'application/json' },
  createTextOutput(text) { return { _t: String(text), getContent() { return this._t; }, setMimeType() { return this; } }; },
};
const Utilities = {
  DigestAlgorithm: { SHA_256: 'SHA_256' },
  getUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  },
  computeDigest(_algo, str) {
    const h = createHash('sha256').update(String(str), 'utf8').digest();
    return Array.from(h, (b) => (b > 127 ? b - 256 : b));
  },
  formatDate(d, _tz, fmt) {
    const p = (n) => String(n).padStart(2, '0');
    if (fmt === 'yyyy-MM-dd HH:mm:ss') return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    if (fmt === 'yyyy-MM-dd') return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return d.toISOString();
  },
};
const Session = { getScriptTimeZone: () => 'Asia/Jakarta' };
const Logger = { log() {} };
const DriveApp = { getRootFolder() { return {}; } };

const ctx = vm.createContext({ SpreadsheetApp, ContentService, Utilities, Session, DriveApp, Logger, console });
vm.runInContext(src, ctx, { filename: 'Kode.gs' });

function post(action, extra = {}) {
  const out = vm.runInContext(`doPost({postData:{contents:${JSON.stringify(JSON.stringify({ action, ...extra }))}}})`, ctx);
  return JSON.parse(out.getContent());
}
function getRaw() {
  const out = vm.runInContext('doGet({})', ctx);
  return JSON.parse(out.getContent());
}

let passed = 0, failed = 0;
function ok(cond, label, detail = '') {
  if (cond) passed++;
  else { failed++; console.log(`  ✗ GAGAL: ${label} ${detail}`); }
}
function eq(a, b, label) { ok(JSON.stringify(a) === JSON.stringify(b), label, `(dapat ${JSON.stringify(a)}, harap ${JSON.stringify(b)})`); }

const SHEETS15 = ['Pengaturan', 'Pengguna', 'Siswa', 'Guru', 'Kelas', 'Jurusan', 'Berita', 'Pengumuman', 'Galeri', 'PPDB', 'Absensi', 'SesiQR', 'Nilai', 'Tugas', 'Materi'];
const PESAN_SESI = 'Sesi berakhir, silakan login ulang';

console.log('\n[1] initDatabase — 15 sheet + seed + idempotent');
let r = post('initDatabase');
ok(r.success, 'initDatabase sukses');
eq(r.data.sheets, SHEETS15, 'data.sheets = 15 nama sheet');
eq(sheets.size, 15, '15 sheet dibuat');
eq(sheets.get('Pengaturan').getSheetValues()[0], ['Kunci', 'Nilai'], 'header Pengaturan');
eq(sheets.get('Pengguna').getSheetValues()[0], ['ID', 'Nama', 'Username', 'PasswordHash', 'PasswordSalt', 'Peran', 'Token', 'TokenKedaluwarsa', 'SiswaID'], 'header Pengguna');
eq(sheets.get('Siswa').getSheetValues()[0], ['ID', 'Nama', 'NIS', 'Kelas', 'JurusanID', 'HP', 'Alamat', 'DibuatPada'], 'header Siswa');
eq(sheets.get('Jurusan').getSheetValues()[0], ['ID', 'Kode', 'Nama', 'Deskripsi', 'DibuatPada'], 'header Jurusan');
eq(sheets.get('PPDB').getSheetValues()[0], ['ID', 'Nama', 'NISN', 'AsalSekolah', 'Jurusan', 'HP', 'Alamat', 'Status', 'Tanggal', 'DibuatPada'], 'header PPDB');
eq(sheets.get('Absensi').getSheetValues()[0], ['ID', 'Tanggal', 'SiswaID', 'NamaSiswa', 'Kelas', 'SesiID', 'KodeSesi', 'Status', 'DibuatPada'], 'header Absensi');
eq(sheets.get('SesiQR').getSheetValues()[0], ['ID', 'Kode', 'Mapel', 'Kelas', 'Tanggal', 'Status', 'DibuatOleh', 'DibuatPada'], 'header SesiQR');
eq(sheets.get('Nilai').getSheetValues()[0], ['ID', 'SiswaID', 'NamaSiswa', 'Mapel', 'Nilai', 'Keterangan', 'Tanggal', 'DibuatPada'], 'header Nilai');
eq(sheets.get('Tugas').getSheetValues()[0], ['ID', 'Judul', 'Deskripsi', 'Mapel', 'Kelas', 'Tenggat', 'DibuatPada'], 'header Tugas');
eq(sheets.get('Materi').getSheetValues()[0], ['ID', 'Judul', 'Deskripsi', 'Mapel', 'Kelas', 'Url', 'DibuatPada'], 'header Materi');
{
  const rows = sheets.get('Pengaturan').getSheetValues();
  const get = (k) => { const f = rows.find((x) => x[0] === k); return f ? f[1] : undefined; };
  eq(get('namaSekolah'), 'Madrasah Swasta Boyolali', 'seed namaSekolah');
  eq(get('singkatan'), 'MSB', 'seed singkatan MSB');
  eq(get('tahunAjaran'), '2025/2026', 'seed tahunAjaran');
}
{
  const j = sheets.get('Jurusan').getSheetValues();
  eq(j.filter((x) => ['AKL', 'MM', 'TKR', 'TKJ'].includes(x[1])).length, 4, 'seed 4 jurusan AKL/MM/TKR/TKJ');
  const u = sheets.get('Pengguna').getSheetValues();
  for (const nama of ['admin', 'guru', 'siswa', 'ortu']) {
    const row = u.find((x) => x[2] === nama);
    ok(!!row, `seed akun ${nama} ada`);
    ok(row[3] && row[3] !== nama + '123' && row[3].length === 64, `password ${nama} = hash SHA-256, bukan plaintext`);
    ok(row[4] && row[4].length >= 8, `salt ${nama} tersimpan`);
  }
  eq(u.find((x) => x[2] === 'siswa')[8], u.find((x) => x[2] === 'ortu')[8], 'akun siswa & ortu terhubung ke siswa contoh yang sama');
  ok(u.find((x) => x[2] === 'siswa')[8] !== '', 'siswaId akun siswa tidak kosong');
}
post('initDatabase');
{
  const u = sheets.get('Pengguna').getSheetValues();
  eq(u.filter((x) => x[2] === 'admin').length, 1, 'akun admin tidak duplikat (idempotent)');
  const j = sheets.get('Jurusan').getSheetValues();
  eq(j.filter((x) => x[1] === 'TKJ').length, 1, 'jurusan TKJ tidak duplikat');
}

console.log('\n[2] ping & doGet');
r = post('ping');
ok(r.success && r.data.version === '1.0.0', 'ping version 1.0.0');
r = getRaw();
eq(r, { success: true, data: { service: 'wwn-madrasah-80', version: '1.0.0' } }, 'doGet -> info service');
r = post('aksiTakDikenal');
ok(!r.success, 'aksi tak dikenal ditolak');

console.log('\n[3] login 4 peran');
r = post('login', { username: 'admin', password: 'salah' });
ok(!r.success && r.message === 'Username atau kata sandi salah', 'login password salah ditolak');
r = post('login', { username: 'ADMIN', password: 'admin123' });
ok(r.success && r.data.peran === 'admin', 'login admin case-insensitive sukses');
ok(r.data.token && r.data.token.length > 10, 'token dikembalikan');
ok(!/PasswordHash|PasswordSalt|admin123/.test(JSON.stringify(r)), 'respons login tidak bocor hash/salt/password');
let TOKEN_ADMIN = r.data.token;
r = post('login', { username: 'guru', password: 'guru123' });
ok(r.success && r.data.peran === 'guru', 'login guru sukses');
const TOKEN_GURU = r.data.token;
r = post('login', { username: 'siswa', password: 'siswa123' });
ok(r.success && r.data.peran === 'siswa' && !!r.data.siswaId, 'login siswa sukses + siswaId');
const TOKEN_SISWA = r.data.token;
const SISWA_ID = r.data.siswaId;
r = post('login', { username: 'ortu', password: 'ortu123' });
ok(r.success && r.data.peran === 'ortu' && r.data.siswaId === SISWA_ID, 'login ortu sukses, siswaId sama dengan siswa');
const TOKEN_ORTU = r.data.token;

console.log('\n[4] otorisasi & token kedaluwarsa & logout');
for (const [aksi, params] of [
  ['saveSiswa', { nama: 'X', kelas: 'X' }], ['saveGuru', { nama: 'X' }],
  ['saveJurusan', { kode: 'X', nama: 'X' }], ['savePengaturan', { pengaturan: {} }],
  ['buatSesiQR', { mapel: 'X', kelas: 'X' }], ['getPanelData', {}], ['saveNilai', {}],
]) {
  r = post(aksi, params);
  ok(!r.success && r.message === PESAN_SESI, `${aksi} tanpa token ditolak`);
  r = post(aksi, { ...params, token: 'token-palsu' });
  ok(!r.success && r.message === PESAN_SESI, `${aksi} token palsu ditolak`);
}
r = post('saveJurusan', { token: TOKEN_GURU, kode: 'ZZ', nama: 'Z' });
ok(!r.success && /peran/i.test(r.message), 'saveJurusan token guru (bukan admin) ditolak');
r = post('savePengaturan', { token: TOKEN_GURU, pengaturan: { namaSekolah: 'X' } });
ok(!r.success && /admin/i.test(r.message), 'savePengaturan token guru ditolak');
{
  const sh = sheets.get('Pengguna');
  const grid = sh.getSheetValues();
  const idx = grid.findIndex((x) => x[6] === TOKEN_GURU);
  sh.getRange(idx + 1, 8).setValue(Date.now() - 1000);
}
r = post('saveGuru', { token: TOKEN_GURU, nama: 'Pak Budi' });
ok(!r.success && r.message === PESAN_SESI, 'token kedaluwarsa ditolak');
r = post('login', { username: 'guru', password: 'guru123' });
const TOKEN_GURU2 = r.data.token;
r = post('logout', { token: TOKEN_GURU2 });
ok(r.success, 'logout sukses');
r = post('saveGuru', { token: TOKEN_GURU2, nama: 'Pak Budi' });
ok(!r.success && r.message === PESAN_SESI, 'token setelah logout tidak valid lagi');
r = post('login', { username: 'guru', password: 'guru123' });
const TOKEN_GURU3 = r.data.token;

console.log('\n[5] getAllData — publik, tanpa bocor rahasia/nilai/absensi');
r = post('getAllData');
ok(r.success, 'getAllData sukses (publik)');
eq(Object.keys(r.data).sort(), ['berita', 'galeri', 'jurusan', 'kelas', 'pengaturan', 'pengumuman', 'statistik'], '7 kunci getAllData persis');
eq(r.data.pengaturan.namaSekolah, 'Madrasah Swasta Boyolali', 'pengaturan terbaca');
eq(r.data.jurusan.length, 4, '4 jurusan terbaca');
eq(r.data.berita.length, 2, '2 berita contoh terbaca');
eq(r.data.pengumuman.length, 1, '1 pengumuman contoh terbaca');
eq(r.data.statistik, { siswa: 1, guru: 0, kelas: 0, jurusan: 4 }, 'statistik dihitung dari data');
{
  const json = JSON.stringify(r);
  ok(!/PasswordHash|PasswordSalt|TokenKedaluwarsa/.test(json), 'getAllData TIDAK membocorkan hash/salt/token');
  ok(!/SesiQR|Absensi|Nilai/.test(json), 'getAllData TIDAK memuat sesi/nilai/absensi');
}

console.log('\n[6] CRUD master + validasi');
r = post('saveSiswa', { token: TOKEN_ADMIN, nama: '', kelas: 'X' });
ok(!r.success, 'saveSiswa nama kosong ditolak');
r = post('saveSiswa', { token: TOKEN_ADMIN, nama: 'Budi', kelas: 'X TKJ 1', nis: '1002' });
ok(r.success && !!r.data.id, 'insert siswa sukses');
const SISWA2 = r.data.id;
r = post('saveGuru', { token: TOKEN_ADMIN, nama: 'Bu Rina', mapel: 'IPA' });
ok(r.success && !!r.data.id, 'insert guru sukses');
const GURU_ID = r.data.id;
r = post('saveKelas', { token: TOKEN_ADMIN, nama: 'X TKJ 1' });
ok(r.success && !!r.data.id, 'insert kelas sukses');
const KELAS_ID = r.data.id;
r = post('saveBerita', { token: TOKEN_GURU3, judul: 'Berita Baru', isi: 'Isi berita.' });
ok(r.success && !!r.data.id, 'insert berita (guru) sukses');
const BERITA_ID = r.data.id;
r = post('savePengumuman', { token: TOKEN_ADMIN, judul: 'Info', isi: 'Isi info.' });
ok(r.success, 'insert pengumuman sukses');
r = post('saveGaleri', { token: TOKEN_ADMIN, judul: 'Foto Kegiatan', url: 'https://example.com/foto.jpg' });
ok(r.success, 'insert galeri sukses');
r = post('deleteSiswa', { token: TOKEN_ADMIN, id: SISWA2 });
ok(r.success, 'deleteSiswa sukses');
r = post('deleteSiswa', { token: TOKEN_ADMIN, id: SISWA2 });
ok(!r.success, 'deleteSiswa id terhapus -> error');
r = post('deleteBerita', { token: TOKEN_ADMIN, id: BERITA_ID });
ok(r.success, 'deleteBerita sukses');
r = post('deleteKelas', { token: TOKEN_ADMIN, id: KELAS_ID });
ok(r.success, 'deleteKelas sukses');
r = post('deleteGuru', { token: TOKEN_ADMIN, id: GURU_ID });
ok(r.success, 'deleteGuru sukses');

console.log('\n[7] PPDB — submit publik + verifikasi admin');
r = post('submitPPDB', { nama: '', nisn: '123', asalSekolah: 'MTs X', jurusan: 'TKJ' });
ok(!r.success, 'submitPPDB nama kosong ditolak');
r = post('submitPPDB', { nama: 'Calon Siswa', nisn: '0012345678', asalSekolah: 'MTs Contoh', jurusan: 'Teknik Komputer dan Jaringan', hp: '0812', alamat: 'Boyolali' });
ok(r.success && r.data.status === 'Menunggu', 'submitPPDB sukses, status Menunggu');
const PPDB_ID = r.data.id;
r = post('updatePPDB', { token: TOKEN_GURU3, id: PPDB_ID, status: 'Diterima' });
ok(!r.success && /peran/i.test(r.message), 'updatePPDB token guru ditolak (admin saja)');
r = post('updatePPDB', { token: TOKEN_ADMIN, id: PPDB_ID, status: 'Mungkin' });
ok(!r.success && /tidak valid/i.test(r.message), 'updatePPDB status invalid ditolak');
r = post('updatePPDB', { token: TOKEN_ADMIN, id: PPDB_ID, status: 'Diterima' });
ok(r.success && r.data.status === 'Diterima', 'updatePPDB Diterima sukses');

console.log('\n[8] Sesi QR — buat, absen, duplikat ditolak, tutup, absen ditolak');
r = post('buatSesiQR', { token: TOKEN_GURU3, mapel: 'Matematika', kelas: 'X TKJ 1' });
ok(r.success && /^QR-\d{4}$/.test(r.data.kode), 'buatSesiQR kode format QR-XXXX');
const SESI_ID = r.data.id;
const KODE = r.data.kode;
r = post('absenQR', { token: TOKEN_SISWA, kode: 'QR-0000' });
ok(!r.success && /tidak ditemukan/i.test(r.message), 'absenQR kode tak ada ditolak');
r = post('absenQR', { token: TOKEN_ADMIN, kode: KODE });
ok(!r.success && /peran/i.test(r.message), 'absenQR token admin (bukan siswa) ditolak');
r = post('absenQR', { token: TOKEN_SISWA, kode: KODE.toLowerCase() });
ok(r.success && r.data.status === 'Hadir', 'absenQR sukses (kode case-insensitive)');
r = post('absenQR', { token: TOKEN_SISWA, kode: KODE });
ok(!r.success && /sudah absen/i.test(r.message), 'absenQR duplikat untuk sesi yang sama ditolak');
r = post('tutupSesiQR', { token: TOKEN_GURU3, id: SESI_ID });
ok(r.success, 'tutupSesiQR sukses');
r = post('absenQR', { token: TOKEN_SISWA, kode: KODE });
ok(!r.success && /ditutup/i.test(r.message), 'absenQR sesi ditutup ditolak');
r = post('absenManual', { token: TOKEN_GURU3, siswaId: SISWA_ID, status: 'Sakit' });
ok(r.success, 'absenManual sukses');
r = post('absenManual', { token: TOKEN_GURU3, siswaId: SISWA_ID, status: 'Ngantuk' });
ok(!r.success && /tidak valid/i.test(r.message), 'absenManual status invalid ditolak');

console.log('\n[9] Nilai, tugas, materi + validasi');
r = post('saveNilai', { token: TOKEN_GURU3, siswaId: SISWA_ID, mapel: 'Matematika', nilai: 150 });
ok(!r.success && /0-100/i.test(r.message), 'saveNilai > 100 ditolak');
r = post('saveNilai', { token: TOKEN_GURU3, siswaId: SISWA_ID, mapel: 'Matematika', nilai: 85, keterangan: 'UH 1' });
ok(r.success && !!r.data.id, 'saveNilai 85 sukses');
r = post('saveTugas', { token: TOKEN_GURU3, judul: 'Tugas 1', mapel: 'Matematika', kelas: 'X TKJ 1', tenggat: '2026-10-30' });
ok(r.success, 'saveTugas sukses');
r = post('saveMateri', { token: TOKEN_GURU3, judul: 'Materi 1', mapel: 'Matematika', url: 'https://example.com/materi.pdf' });
ok(r.success, 'saveMateri sukses');

console.log('\n[10] savePengaturan + savePengguna');
r = post('savePengaturan', { token: TOKEN_ADMIN, pengaturan: { namaSekolah: 'Madrasah Swasta Boyolali Baru', tahunAjaran: '2026/2027', kunciAsing: 'abaikan' } });
ok(r.success, 'savePengaturan admin sukses');
{
  const rows = sheets.get('Pengaturan').getSheetValues();
  const get = (k) => { const f = rows.find((x) => x[0] === k); return f ? f[1] : undefined; };
  eq(get('namaSekolah'), 'Madrasah Swasta Boyolali Baru', 'namaSekolah baru tersimpan');
  eq(get('kunciAsing'), undefined, 'kunci tak dikenal TIDAK disimpan');
}
r = post('savePengguna', { token: TOKEN_ADMIN, nama: 'Guru Baru', username: 'guru', password: 'x123456' });
ok(!r.success && /sudah dipakai/i.test(r.message), 'savePengguna username duplikat ditolak');
r = post('savePengguna', { token: TOKEN_ADMIN, nama: 'Guru Baru', username: 'gurubaru', password: 'baru123', peran: 'guru' });
ok(r.success && !!r.data.id, 'savePengguna baru sukses');
r = post('login', { username: 'gurubaru', password: 'baru123' });
ok(r.success && r.data.peran === 'guru', 'login pengguna baru sukses');

console.log('\n[11] getPanelData — cakupan per peran');
r = post('getPanelData', { token: TOKEN_ADMIN });
ok(r.success, 'getPanelData admin sukses');
eq(Object.keys(r.data).sort(), ['absensi', 'berita', 'galeri', 'guru', 'jurusan', 'kelas', 'materi', 'nilai', 'pengaturan', 'pengguna', 'pengumuman', 'ppdb', 'sesi', 'siswa', 'tugas'], '15 kunci panel admin persis');
ok(r.data.pengguna.every((u) => JSON.stringify(Object.keys(u).sort()) === JSON.stringify(['id', 'nama', 'peran', 'siswaId', 'username'])), 'pengguna panel hanya field aman');
ok(!/PasswordHash/.test(JSON.stringify(r)), 'panel TIDAK membocorkan hash');
r = post('getPanelData', { token: TOKEN_SISWA });
ok(r.success, 'getPanelData siswa sukses');
eq(r.data.siswa.length, 1, 'siswa hanya melihat data dirinya (1 siswa)');
eq(r.data.absensi.every((a) => a.siswaId === SISWA_ID), true, 'siswa hanya melihat absensi sendiri');
eq(r.data.nilai.every((n) => n.siswaId === SISWA_ID), true, 'siswa hanya melihat nilai sendiri');
eq(r.data.ppdb.length, 0, 'siswa tidak melihat PPDB');
r = post('getPanelData', { token: TOKEN_ORTU, siswaId: SISWA_ID });
ok(r.success, 'getPanelData ortu sukses');
eq(r.data.siswa.length, 1, 'ortu melihat 1 anak yang dipilih');
eq(r.data.absensi.every((a) => a.siswaId === SISWA_ID), true, 'ortu hanya melihat absensi anak');

console.log(`\n==============================\nHasil: ${passed} lolos, ${failed} gagal\n==============================`);
process.exit(failed > 0 ? 1 : 0);
