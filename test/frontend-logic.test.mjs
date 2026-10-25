// Uji logika frontend madrasah (node assert, tanpa framework).
// Prasyarat: kompilasi dulu ->
//   npx tsc src/lib/logic.ts --outDir test/dist-test --module nodenext --target es2020 --moduleResolution nodenext --ignoreConfig
// Jalankan: node test/frontend-logic.test.mjs
import assert from 'node:assert/strict';
import {
  hitungStatistik, normalisasiKodeSesi, validasiKodeSesi, sudahAbsen,
  cariSesiAktif, validasiNilai, rataNilai,
} from './dist-test/logic.js';

let lolos = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lolos++; console.log('  ✓', nama); }
  catch (e) { gagal++; console.error('  ✗', nama, '->', e.message); }
}

console.log('hitungStatistik');
uji('8/4/4/4 dari sumber (fallback demo)', () => {
  assert.deepEqual(hitungStatistik(new Array(8), new Array(4), new Array(4), new Array(4)), { siswa: 8, guru: 4, kelas: 4, jurusan: 4 });
});
uji('data kosong -> semua 0', () => {
  assert.deepEqual(hitungStatistik([], [], [], []), { siswa: 0, guru: 0, kelas: 0, jurusan: 0 });
});

console.log('normalisasi & validasi kode sesi');
uji('trim + uppercase', () => {
  assert.equal(normalisasiKodeSesi('  qr-1234 '), 'QR-1234');
  assert.equal(normalisasiKodeSesi('QR-9876'), 'QR-9876');
});
uji('format valid diterima', () => {
  assert.equal(validasiKodeSesi('QR-1234'), null);
  assert.equal(validasiKodeSesi('qr-0001'), null);
});
uji('format salah ditolak', () => {
  assert.match(validasiKodeSesi(''), /wajib diisi/);
  assert.match(validasiKodeSesi('1234'), /QR-XXXX/);
  assert.match(validasiKodeSesi('QR-123'), /QR-XXXX/);
  assert.match(validasiKodeSesi('QR-12345'), /QR-XXXX/);
  assert.match(validasiKodeSesi('QR-ABCD'), /QR-XXXX/);
});

console.log('sudahAbsen (cegah absen ganda)');
uji('sesi sama + siswa sama -> true; beda sesi/siswa -> false', () => {
  const abs = [{ siswaId: 's1', sesiId: 'x1' }, { siswaId: 's2', sesiId: 'x1' }];
  assert.equal(sudahAbsen(abs, 's1', 'x1'), true);
  assert.equal(sudahAbsen(abs, 's1', 'x2'), false);
  assert.equal(sudahAbsen(abs, 's2', 'x1'), true);
  assert.equal(sudahAbsen([], 's1', 'x1'), false);
});

console.log('cariSesiAktif');
uji('kode cocok + Aktif ditemukan; Ditutup / tak ada -> null', () => {
  const sesi = [
    { kode: 'QR-1111', status: 'Aktif' },
    { kode: 'QR-2222', status: 'Ditutup' },
  ];
  assert.deepEqual(cariSesiAktif(sesi, 'qr-1111'), { kode: 'QR-1111', status: 'Aktif' });
  assert.equal(cariSesiAktif(sesi, 'QR-2222'), null);
  assert.equal(cariSesiAktif(sesi, 'QR-9999'), null);
});

console.log('validasiNilai & rataNilai');
uji('0-100 diterima; di luar ditolak', () => {
  assert.equal(validasiNilai(0), null);
  assert.equal(validasiNilai(100), null);
  assert.equal(validasiNilai(85), null);
  assert.match(validasiNilai(-1), /0-100/);
  assert.match(validasiNilai(101), /0-100/);
  assert.match(validasiNilai(NaN), /angka/);
});
uji('rata-rata: kosong 0; 80+90 -> 85; pembulatan 1 desimal', () => {
  assert.equal(rataNilai([]), 0);
  assert.equal(rataNilai([{ nilai: 80 }, { nilai: 90 }]), 85);
  assert.equal(rataNilai([{ nilai: 80 }, { nilai: 81 }, { nilai: 82 }]), 81);
});

console.log(`\n${lolos} uji lolos, ${gagal} gagal.`);
if (gagal > 0) process.exit(1);
