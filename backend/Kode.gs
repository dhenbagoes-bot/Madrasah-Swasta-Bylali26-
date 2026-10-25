/**
 * BACKEND — Madrasah Swasta Boyolali (wwn-madrasah-80)
 * Google Apps Script + Google Sheets (container-bound, WAJIB!)
 *
 * CARA PAKAI (untuk pemula):
 *  1. Buat Google Spreadsheet baru (mis. "Database Madrasah Boyolali").
 *  2. Dari DALAM spreadsheet itu: Extensions > Apps Script. HAPUS seluruh
 *     isi editor, lalu PASTE seluruh isi file ini. Simpan.
 *     JANGAN membuat project di script.google.com langsung (standalone):
 *     getActiveSpreadsheet() akan null dan semua aksi gagal dengan error
 *     "Cannot read properties of null (reading 'getSheetByName')".
 *  3. (Opsional, bila memakai upload logo) Tambahkan backend/appsscript.json
 *     sebagai manifest, lalu jalankan authorizeDriveAccess dan setujui izin.
 *  4. Deploy > New deployment > Web app (Execute as: Me, Who has access:
 *     Anyone). Setiap ada perubahan kode: Deploy > Manage deployments >
 *     New version (BUKAN New deployment baru).
 *  5. Salin URL /exec ke menu Konfigurasi di aplikasi web, lalu klik
 *     "Inisialisasi Database".
 *
 * Sheet yang dibuat (15): Pengaturan, Pengguna, Siswa, Guru, Kelas,
 * Jurusan, Berita, Pengumuman, Galeri, PPDB, Absensi, SesiQR, Nilai,
 * Tugas, Materi
 *
 * KONTRAK:
 *  - POST JSON {action, token?, ...} Content-Type text/plain.
 *  - Envelope SELALU: {success, message?, data?, error?}.
 *  - Tanggal: ISO yyyy-mm-dd.
 *  - Password TIDAK PERNAH plaintext: SHA-256(garam + password).
 *    Hash/garam/token TIDAK PERNAH dikirim ke frontend.
 *  - Token sesi kedaluwarsa 7 hari; logout menghapus token.
 *  - getAllData bersifat PUBLIK tapi hanya berisi pengaturan, jurusan,
 *    kelas, berita, pengumuman, galeri, dan statistik — TANPA password,
 *    nilai, atau absensi.
 *  - Akun bawaan setelah initDatabase: admin/admin123, guru/guru123,
 *    siswa/siswa123, ortu/ortu123. SEGERA ganti kata sandi!
 */

var APP_VERSION = '1.0.0';
var TOKEN_MASA_BERLAKU_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
var PESAN_SESI = 'Sesi berakhir, silakan login ulang';

var SHEET_PENGATURAN = 'Pengaturan';
var SHEET_PENGGUNA = 'Pengguna';
var SHEET_SISWA = 'Siswa';
var SHEET_GURU = 'Guru';
var SHEET_KELAS = 'Kelas';
var SHEET_JURUSAN = 'Jurusan';
var SHEET_BERITA = 'Berita';
var SHEET_PENGUMUMAN = 'Pengumuman';
var SHEET_GALERI = 'Galeri';
var SHEET_PPDB = 'PPDB';
var SHEET_ABSENSI = 'Absensi';
var SHEET_SESIQR = 'SesiQR';
var SHEET_NILAI = 'Nilai';
var SHEET_TUGAS = 'Tugas';
var SHEET_MATERI = 'Materi';

var SEMUA_SHEET = [SHEET_PENGATURAN, SHEET_PENGGUNA, SHEET_SISWA, SHEET_GURU,
  SHEET_KELAS, SHEET_JURUSAN, SHEET_BERITA, SHEET_PENGUMUMAN, SHEET_GALERI,
  SHEET_PPDB, SHEET_ABSENSI, SHEET_SESIQR, SHEET_NILAI, SHEET_TUGAS, SHEET_MATERI];

var HEADERS = {};
HEADERS[SHEET_PENGATURAN] = ['Kunci', 'Nilai'];
HEADERS[SHEET_PENGGUNA] = ['ID', 'Nama', 'Username', 'PasswordHash', 'PasswordSalt', 'Peran', 'Token', 'TokenKedaluwarsa', 'SiswaID'];
HEADERS[SHEET_SISWA] = ['ID', 'Nama', 'NIS', 'Kelas', 'JurusanID', 'HP', 'Alamat', 'DibuatPada'];
HEADERS[SHEET_GURU] = ['ID', 'Nama', 'Mapel', 'HP', 'DibuatPada'];
HEADERS[SHEET_KELAS] = ['ID', 'Nama', 'JurusanID', 'DibuatPada'];
HEADERS[SHEET_JURUSAN] = ['ID', 'Kode', 'Nama', 'Deskripsi', 'DibuatPada'];
HEADERS[SHEET_BERITA] = ['ID', 'Judul', 'Isi', 'Tanggal', 'DibuatPada'];
HEADERS[SHEET_PENGUMUMAN] = ['ID', 'Judul', 'Isi', 'Tanggal', 'DibuatPada'];
HEADERS[SHEET_GALERI] = ['ID', 'Judul', 'Deskripsi', 'Url', 'Tanggal', 'DibuatPada'];
HEADERS[SHEET_PPDB] = ['ID', 'Nama', 'NISN', 'AsalSekolah', 'Jurusan', 'HP', 'Alamat', 'Status', 'Tanggal', 'DibuatPada'];
HEADERS[SHEET_ABSENSI] = ['ID', 'Tanggal', 'SiswaID', 'NamaSiswa', 'Kelas', 'SesiID', 'KodeSesi', 'Status', 'DibuatPada'];
HEADERS[SHEET_SESIQR] = ['ID', 'Kode', 'Mapel', 'Kelas', 'Tanggal', 'Status', 'DibuatOleh', 'DibuatPada'];
HEADERS[SHEET_NILAI] = ['ID', 'SiswaID', 'NamaSiswa', 'Mapel', 'Nilai', 'Keterangan', 'Tanggal', 'DibuatPada'];
HEADERS[SHEET_TUGAS] = ['ID', 'Judul', 'Deskripsi', 'Mapel', 'Kelas', 'Tenggat', 'DibuatPada'];
HEADERS[SHEET_MATERI] = ['ID', 'Judul', 'Deskripsi', 'Mapel', 'Kelas', 'Url', 'DibuatPada'];

var KUNCI_PENGATURAN = ['namaSekolah', 'singkatan', 'alamatSekolah', 'telepon',
  'email', 'tahunAjaran', 'namaKepala', 'logoUrl'];
var STATUS_PPDB_VALID = ['Menunggu', 'Diterima', 'Ditolak'];
var STATUS_ABSENSI_VALID = ['Hadir', 'Sakit', 'Izin', 'Alpa'];

// ============================================================
// HELPER UMUM
// ============================================================
function asString(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}
function asInt(v, def) {
  var n = parseInt(asString(v), 10);
  return isNaN(n) ? (def === undefined ? 0 : def) : n;
}
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function ok(data, message) {
  var o = { success: true, data: data };
  if (message) o.message = message;
  return jsonResponse(o);
}
function gagal(message) {
  return jsonResponse({ success: false, message: message, error: message });
}
function tanggalHariIni() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
function waktuSekarang() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}
function idBaru(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}
function hashPassword(password, salt) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}
function buatSalt() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}
function validTanggalISO(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(asString(s));
}

// ============================================================
// AKSES SHEET
// ============================================================
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
function getSheet(nama) {
  var ss = getSpreadsheet();
  var sh = ss.getSheetByName(nama);
  if (!sh) {
    sh = ss.insertSheet(nama);
    var h = HEADERS[nama] || [];
    if (h.length) sh.getRange(1, 1, 1, h.length).setValues([h]);
  }
  return sh;
}
function bacaSemua(nama) {
  var sh = getSheet(nama);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return [];
  var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();
  if (vals.length < 2) return [];
  var header = vals[0];
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    var obj = { _baris: i + 1 };
    for (var j = 0; j < header.length; j++) obj[header[j]] = vals[i][j] === null || vals[i][j] === undefined ? '' : vals[i][j];
    out.push(obj);
  }
  return out;
}
function cariBaris(nama, id) {
  var rows = bacaSemua(nama);
  for (var i = 0; i < rows.length; i++) if (asString(rows[i].ID) === asString(id)) return rows[i];
  return null;
}
function tulisBaris(nama, baris, nilai) {
  var sh = getSheet(nama);
  sh.getRange(baris, 1, 1, nilai.length).setValues([nilai]);
}
function tambahBaris(nama, nilai) {
  getSheet(nama).appendRow(nilai);
}
function hapusBaris(nama, id) {
  var row = cariBaris(nama, id);
  if (!row) return false;
  getSheet(nama).deleteRow(row._baris);
  return true;
}
function simpanObj(nama, header, obj) {
  // obj.ID kosong -> insert; berisi -> update (error bila tak ditemukan)
  var now = waktuSekarang();
  if (obj.ID) {
    var lama = cariBaris(nama, obj.ID);
    if (!lama) return null;
    var vals = [];
    for (var i = 0; i < header.length; i++) {
      var k = header[i];
      if (k === 'ID') vals.push(obj.ID);
      else if (k === 'DibuatPada') vals.push(lama.DibuatPada || now);
      else vals.push(obj[k] !== undefined && obj[k] !== null ? obj[k] : (lama[k] || ''));
    }
    tulisBaris(nama, lama._baris, vals);
    return obj.ID;
  }
  var id = idBaru(nama.slice(0, 3).toLowerCase());
  var row = [];
  for (var j = 0; j < header.length; j++) {
    var kk = header[j];
    if (kk === 'ID') row.push(id);
    else if (kk === 'DibuatPada') row.push(now);
    else row.push(obj[kk] !== undefined && obj[kk] !== null ? obj[kk] : '');
  }
  tambahBaris(nama, row);
  return id;
}

// ---------- Pengaturan (key-value) ----------
function getPengaturan() {
  var rows = bacaSemua(SHEET_PENGATURAN);
  var p = {};
  for (var i = 0; i < rows.length; i++) p[rows[i].Kunci] = rows[i].Nilai;
  return {
    namaSekolah: asString(p.namaSekolah) || 'Madrasah Swasta Boyolali',
    singkatan: asString(p.singkatan) || 'MSB',
    alamatSekolah: asString(p.alamatSekolah),
    telepon: asString(p.telepon),
    email: asString(p.email),
    tahunAjaran: asString(p.tahunAjaran) || '2025/2026',
    namaKepala: asString(p.namaKepala),
    logoUrl: asString(p.logoUrl)
  };
}
function setPengaturan(kunci, nilai) {
  var sh = getSheet(SHEET_PENGATURAN);
  var rows = bacaSemua(SHEET_PENGATURAN);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Kunci === kunci) { sh.getRange(rows[i]._baris, 2).setValue(nilai); return; }
  }
  sh.appendRow([kunci, nilai]);
}

// ---------- Auth ----------
function cariPenggunaByToken(token) {
  if (!token) return null;
  var rows = bacaSemua(SHEET_PENGGUNA);
  for (var i = 0; i < rows.length; i++) {
    if (asString(rows[i].Token) === asString(token)) {
      var exp = Number(rows[i].TokenKedaluwarsa);
      if (!exp || exp < Date.now()) return null;
      return rows[i];
    }
  }
  return null;
}
function butuhAuth(p, peran) {
  var u = cariPenggunaByToken(p.token);
  if (!u) throw new Error(PESAN_SESI);
  if (peran && peran.length && peran.indexOf(u.Peran) < 0) throw new Error('Akses ditolak untuk peran ini. Aksi ini khusus: ' + peran.join('/')); 
  return u;
}
function sanitasiPengguna(u) {
  return { id: asString(u.ID), nama: asString(u.Nama), username: asString(u.Username), peran: asString(u.Peran), siswaId: asString(u.SiswaID) };
}

// ============================================================
// MAPPER (sheet -> objek frontend, camelCase)
// ============================================================
function mapSiswa(r) { return { id: asString(r.ID), nama: asString(r.Nama), nis: asString(r.NIS), kelas: asString(r.Kelas), jurusanId: asString(r.JurusanID), hp: asString(r.HP), alamat: asString(r.Alamat) }; }
function mapGuru(r) { return { id: asString(r.ID), nama: asString(r.Nama), mapel: asString(r.Mapel), hp: asString(r.HP) }; }
function mapKelas(r) { return { id: asString(r.ID), nama: asString(r.Nama), jurusanId: asString(r.JurusanID) }; }
function mapJurusan(r) { return { id: asString(r.ID), kode: asString(r.Kode), nama: asString(r.Nama), deskripsi: asString(r.Deskripsi) }; }
function mapBerita(r) { return { id: asString(r.ID), judul: asString(r.Judul), isi: asString(r.Isi), tanggal: asString(r.Tanggal) }; }
function mapPengumuman(r) { return { id: asString(r.ID), judul: asString(r.Judul), isi: asString(r.Isi), tanggal: asString(r.Tanggal) }; }
function mapGaleri(r) { return { id: asString(r.ID), judul: asString(r.Judul), deskripsi: asString(r.Deskripsi), url: asString(r.Url), tanggal: asString(r.Tanggal) }; }
function mapPpdb(r) { return { id: asString(r.ID), nama: asString(r.Nama), nisn: asString(r.NISN), asalSekolah: asString(r.AsalSekolah), jurusan: asString(r.Jurusan), hp: asString(r.HP), alamat: asString(r.Alamat), status: asString(r.Status), tanggal: asString(r.Tanggal) }; }
function mapAbsensi(r) { return { id: asString(r.ID), tanggal: asString(r.Tanggal), siswaId: asString(r.SiswaID), namaSiswa: asString(r.NamaSiswa), kelas: asString(r.Kelas), sesiId: asString(r.SesiID), kodeSesi: asString(r.KodeSesi), status: asString(r.Status) }; }
function mapSesi(r) { return { id: asString(r.ID), kode: asString(r.Kode), mapel: asString(r.Mapel), kelas: asString(r.Kelas), tanggal: asString(r.Tanggal), status: asString(r.Status), dibuatOleh: asString(r.DibuatOleh) }; }
function mapNilai(r) { return { id: asString(r.ID), siswaId: asString(r.SiswaID), namaSiswa: asString(r.NamaSiswa), mapel: asString(r.Mapel), nilai: asInt(r.Nilai, 0), keterangan: asString(r.Keterangan), tanggal: asString(r.Tanggal) }; }
function mapTugas(r) { return { id: asString(r.ID), judul: asString(r.Judul), deskripsi: asString(r.Deskripsi), mapel: asString(r.Mapel), kelas: asString(r.Kelas), tenggat: asString(r.Tenggat) }; }
function mapMateri(r) { return { id: asString(r.ID), judul: asString(r.Judul), deskripsi: asString(r.Deskripsi), mapel: asString(r.Mapel), kelas: asString(r.Kelas), url: asString(r.Url) }; }

// ============================================================
// ENTRY POINT
// ============================================================
function doGet() {
  return ok({ service: 'wwn-madrasah-80', version: APP_VERSION });
}
function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    var action = asString(p.action);
    switch (action) {
      case 'ping': return ok({ version: APP_VERSION, waktu: waktuSekarang() });
      case 'getAllData': return aksiGetAllData();
      case 'initDatabase': return aksiInitDatabase();
      case 'login': return aksiLogin(p);
      case 'logout': return aksiLogout(p);
      case 'getPanelData': return aksiGetPanelData(p);
      case 'savePengaturan': return aksiSavePengaturan(p);
      case 'saveSiswa': return aksiSaveSiswa(p);
      case 'deleteSiswa': return aksiDelete(p, SHEET_SISWA);
      case 'saveGuru': return aksiSaveGuru(p);
      case 'deleteGuru': return aksiDelete(p, SHEET_GURU);
      case 'saveKelas': return aksiSaveKelas(p);
      case 'deleteKelas': return aksiDelete(p, SHEET_KELAS);
      case 'saveJurusan': return aksiSaveJurusan(p);
      case 'deleteJurusan': return aksiDelete(p, SHEET_JURUSAN);
      case 'saveBerita': return aksiSaveBerita(p);
      case 'deleteBerita': return aksiDelete(p, SHEET_BERITA);
      case 'savePengumuman': return aksiSavePengumuman(p);
      case 'deletePengumuman': return aksiDelete(p, SHEET_PENGUMUMAN);
      case 'saveGaleri': return aksiSaveGaleri(p);
      case 'deleteGaleri': return aksiDelete(p, SHEET_GALERI);
      case 'savePengguna': return aksiSavePengguna(p);
      case 'deletePengguna': return aksiDelete(p, SHEET_PENGGUNA);
      case 'submitPPDB': return aksiSubmitPPDB(p);
      case 'updatePPDB': return aksiUpdatePPDB(p);
      case 'deletePPDB': return aksiDelete(p, SHEET_PPDB);
      case 'buatSesiQR': return aksiBuatSesiQR(p);
      case 'tutupSesiQR': return aksiTutupSesiQR(p);
      case 'absenQR': return aksiAbsenQR(p);
      case 'absenManual': return aksiAbsenManual(p);
      case 'saveNilai': return aksiSaveNilai(p);
      case 'deleteNilai': return aksiDelete(p, SHEET_NILAI);
      case 'saveTugas': return aksiSaveTugas(p);
      case 'deleteTugas': return aksiDelete(p, SHEET_TUGAS);
      case 'saveMateri': return aksiSaveMateri(p);
      case 'deleteMateri': return aksiDelete(p, SHEET_MATERI);
      default: return gagal('Aksi tidak dikenal: ' + action);
    }
  } catch (err) {
    return gagal(err && err.message ? err.message : 'Terjadi kesalahan di server.');
  }
}

// ============================================================
// AKSI PUBLIK
// ============================================================
function aksiGetAllData() {
  var pengaturan = getPengaturan();
  var jurusan = bacaSemua(SHEET_JURUSAN).map(mapJurusan);
  var kelas = bacaSemua(SHEET_KELAS).map(mapKelas);
  var berita = bacaSemua(SHEET_BERITA).map(mapBerita);
  var pengumuman = bacaSemua(SHEET_PENGUMUMAN).map(mapPengumuman);
  var galeri = bacaSemua(SHEET_GALERI).map(mapGaleri);
  return ok({
    pengaturan: pengaturan,
    jurusan: jurusan,
    kelas: kelas,
    berita: berita,
    pengumuman: pengumuman,
    galeri: galeri,
    statistik: {
      siswa: bacaSemua(SHEET_SISWA).length,
      guru: bacaSemua(SHEET_GURU).length,
      kelas: kelas.length,
      jurusan: jurusan.length
    }
  });
}

function aksiInitDatabase() {
  for (var i = 0; i < SEMUA_SHEET.length; i++) getSheet(SEMUA_SHEET[i]);
  var seed = [
    ['namaSekolah', 'Madrasah Swasta Boyolali'],
    ['singkatan', 'MSB'],
    ['alamatSekolah', 'Jl. Pendidikan No. 1, Boyolali'],
    ['telepon', '(0276) 000-000'],
    ['email', 'info@msb.sch.id'],
    ['tahunAjaran', '2025/2026'],
    ['namaKepala', ''],
    ['logoUrl', '']
  ];
  var ada = {};
  var rowsP = bacaSemua(SHEET_PENGATURAN);
  for (var j = 0; j < rowsP.length; j++) ada[rowsP[j].Kunci] = true;
  for (var k = 0; k < seed.length; k++) if (!ada[seed[k][0]]) setPengaturan(seed[k][0], seed[k][1]);

  // Jurusan contoh (idempotent berdasarkan kode)
  var jurusanAda = {};
  var jr = bacaSemua(SHEET_JURUSAN);
  for (var m = 0; m < jr.length; m++) jurusanAda[jr[m].Kode] = true;
  var jurusanSeed = [
    ['AKL', 'Akuntansi dan Keuangan Lembaga', 'Mengelola keuangan lembaga secara profesional.'],
    ['MM', 'Multimedia', 'Desain grafis, video, dan media digital kreatif.'],
    ['TKR', 'Teknik Kendaraan Ringan', 'Perawatan dan perbaikan kendaraan ringan.'],
    ['TKJ', 'Teknik Komputer dan Jaringan', 'Instalasi komputer dan jaringan.']
  ];
  for (var n = 0; n < jurusanSeed.length; n++) {
    if (!jurusanAda[jurusanSeed[n][0]]) {
      simpanObj(SHEET_JURUSAN, HEADERS[SHEET_JURUSAN], { Kode: jurusanSeed[n][0], Nama: jurusanSeed[n][1], Deskripsi: jurusanSeed[n][2] });
    }
  }
  // Berita & pengumuman contoh (hanya bila masih kosong)
  if (bacaSemua(SHEET_BERITA).length === 0) {
    simpanObj(SHEET_BERITA, HEADERS[SHEET_BERITA], { Judul: 'Sekolah Kembali Raih Akreditasi A', Isi: 'Dengan hasil asesmen institusi terbaru, sekolah kita kembali memperoleh predikat A (Unggul). Prestasi ini adalah hasil kerja bersama seluruh warga sekolah.', Tanggal: '2026-10-21' });
    simpanObj(SHEET_BERITA, HEADERS[SHEET_BERITA], { Judul: 'Juara 1 Lomba Kompetensi Siswa Tingkat Provinsi', Isi: 'Tim siswa jurusan TKJ berhasil meraih Juara 1 Lomba Kompetensi Siswa (LKS) tingkat provinsi bidang Keahlian Jaringan. Selamat kepada para juara!', Tanggal: '2026-10-21' });
  }
  if (bacaSemua(SHEET_PENGUMUMAN).length === 0) {
    simpanObj(SHEET_PENGUMUMAN, HEADERS[SHEET_PENGUMUMAN], { Judul: 'Selamat Datang di Tahun Ajaran 2025/2026', Isi: 'Seluruh siswa diharapkan mengikuti kegiatan Masa Pengenalan Lingkungan Sekolah (MPLS) mulai pekan depan. Bawa perlengkapan lengkap dan kartu pelajar.', Tanggal: '2026-10-21' });
  }
  // Satu siswa contoh untuk akun siswa/ortu demo
  var siswaRows = bacaSemua(SHEET_SISWA);
  var siswaContohId = '';
  if (siswaRows.length === 0) {
    siswaContohId = simpanObj(SHEET_SISWA, HEADERS[SHEET_SISWA], { Nama: 'Siswa Contoh', NIS: '0001', Kelas: 'X TKJ 1', JurusanID: '', HP: '', Alamat: '' });
  } else {
    siswaContohId = asString(siswaRows[0].ID);
  }
  // Akun bawaan (idempotent berdasarkan username, case-insensitive)
  var akunSeed = [
    ['Administrator', 'admin', 'admin123', 'admin', ''],
    ['Guru Contoh', 'guru', 'guru123', 'guru', ''],
    ['Siswa Contoh', 'siswa', 'siswa123', 'siswa', siswaContohId],
    ['Orang Tua Contoh', 'ortu', 'ortu123', 'ortu', siswaContohId]
  ];
  var penggunaAda = {};
  var pu = bacaSemua(SHEET_PENGGUNA);
  for (var q = 0; q < pu.length; q++) penggunaAda[asString(pu[q].Username).toLowerCase()] = true;
  for (var r = 0; r < akunSeed.length; r++) {
    if (!penggunaAda[akunSeed[r][1]]) {
      var salt = buatSalt();
      simpanObj(SHEET_PENGGUNA, HEADERS[SHEET_PENGGUNA], {
        Nama: akunSeed[r][0], Username: akunSeed[r][1],
        PasswordHash: hashPassword(akunSeed[r][2], salt), PasswordSalt: salt,
        Peran: akunSeed[r][3], Token: '', TokenKedaluwarsa: '', SiswaID: akunSeed[r][4]
      });
    }
  }
  return ok({ sheets: SEMUA_SHEET });
}

function aksiLogin(p) {
  var username = asString(p.username).toLowerCase();
  var password = asString(p.password);
  if (!username || !password) return gagal('Username atau kata sandi salah');
  var rows = bacaSemua(SHEET_PENGGUNA);
  var user = null;
  for (var i = 0; i < rows.length; i++) {
    if (asString(rows[i].Username).toLowerCase() === username) { user = rows[i]; break; }
  }
  if (!user) return gagal('Username atau kata sandi salah');
  if (hashPassword(password, asString(user.PasswordSalt)) !== asString(user.PasswordHash)) {
    return gagal('Username atau kata sandi salah');
  }
  var token = Utilities.getUuid().replace(/-/g, '');
  var sh = getSheet(SHEET_PENGGUNA);
  sh.getRange(user._baris, 7).setValue(token);
  sh.getRange(user._baris, 8).setValue(String(Date.now() + TOKEN_MASA_BERLAKU_MS));
  return ok({ token: token, nama: asString(user.Nama), peran: asString(user.Peran), siswaId: asString(user.SiswaID) });
}

function aksiLogout(p) {
  var rows = bacaSemua(SHEET_PENGGUNA);
  for (var i = 0; i < rows.length; i++) {
    if (asString(rows[i].Token) === asString(p.token) && p.token) {
      var sh = getSheet(SHEET_PENGGUNA);
      sh.getRange(rows[i]._baris, 7).setValue('');
      sh.getRange(rows[i]._baris, 8).setValue('');
    }
  }
  return ok({});
}

function aksiGetPanelData(p) {
  var user = butuhAuth(p);
  var peran = asString(user.Peran);
  var siswaIdUser = asString(user.SiswaID);
  var semuaSiswa = bacaSemua(SHEET_SISWA).map(mapSiswa);
  var semuaAbsensi = bacaSemua(SHEET_ABSENSI).map(mapAbsensi);
  var semuaNilai = bacaSemua(SHEET_NILAI).map(mapNilai);
  var data = {
    pengaturan: getPengaturan(),
    pengguna: bacaSemua(SHEET_PENGGUNA).map(sanitasiPengguna),
    siswa: semuaSiswa,
    guru: bacaSemua(SHEET_GURU).map(mapGuru),
    kelas: bacaSemua(SHEET_KELAS).map(mapKelas),
    jurusan: bacaSemua(SHEET_JURUSAN).map(mapJurusan),
    berita: bacaSemua(SHEET_BERITA).map(mapBerita),
    pengumuman: bacaSemua(SHEET_PENGUMUMAN).map(mapPengumuman),
    galeri: bacaSemua(SHEET_GALERI).map(mapGaleri),
    ppdb: bacaSemua(SHEET_PPDB).map(mapPpdb),
    sesi: bacaSemua(SHEET_SESIQR).map(mapSesi),
    absensi: semuaAbsensi,
    nilai: semuaNilai,
    tugas: bacaSemua(SHEET_TUGAS).map(mapTugas),
    materi: bacaSemua(SHEET_MATERI).map(mapMateri)
  };
  if (peran === 'siswa') {
    var saya = semuaSiswa.filter(function (s) { return s.id === siswaIdUser; });
    data.siswa = saya;
    data.absensi = semuaAbsensi.filter(function (a) { return a.siswaId === siswaIdUser; });
    data.nilai = semuaNilai.filter(function (n) { return n.siswaId === siswaIdUser; });
    var kelasSaya = saya.length ? saya[0].kelas : '';
    if (kelasSaya) {
      data.tugas = data.tugas.filter(function (t) { return !t.kelas || t.kelas === kelasSaya; });
      data.materi = data.materi.filter(function (m) { return !m.kelas || m.kelas === kelasSaya; });
    }
    data.pengguna = [sanitasiPengguna(user)];
    data.ppdb = [];
  } else if (peran === 'ortu') {
    var anakId = asString(p.siswaId) || siswaIdUser;
    var anak = semuaSiswa.filter(function (s) { return s.id === anakId; });
    data.siswa = anak;
    data.absensi = semuaAbsensi.filter(function (a) { return a.siswaId === anakId; });
    data.nilai = semuaNilai.filter(function (n) { return n.siswaId === anakId; });
    data.pengguna = [sanitasiPengguna(user)];
    data.ppdb = [];
  }
  return ok(data);
}

// ============================================================
// PENGATURAN (admin saja)
// ============================================================
function aksiSavePengaturan(p) {
  butuhAuth(p, ['admin']);
  var pg = p.pengaturan || {};
  for (var i = 0; i < KUNCI_PENGATURAN.length; i++) {
    var k = KUNCI_PENGATURAN[i];
    if (pg[k] !== undefined && pg[k] !== null) setPengaturan(k, String(pg[k]));
  }
  return ok({});
}

// ============================================================
// CRUD UMUM
// ============================================================
function aksiDelete(p, sheet) {
  butuhAuth(p, ['admin', 'guru']);
  if (sheet === SHEET_PENGGUNA) butuhAuth(p, ['admin']);
  if (!asString(p.id)) return gagal('ID wajib diisi.');
  if (!hapusBaris(sheet, p.id)) return gagal('Data tidak ditemukan.');
  return ok({});
}
function aksiSaveSiswa(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.nama)) return gagal('Nama wajib diisi.');
  if (!asString(p.kelas)) return gagal('Kelas wajib diisi.');
  var id = simpanObj(SHEET_SISWA, HEADERS[SHEET_SISWA], { ID: asString(p.id), Nama: p.nama, NIS: asString(p.nis), Kelas: p.kelas, JurusanID: asString(p.jurusanId), HP: asString(p.hp), Alamat: asString(p.alamat) });
  if (!id) return gagal('Siswa tidak ditemukan.');
  return ok({ id: id });
}
function aksiSaveGuru(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.nama)) return gagal('Nama wajib diisi.');
  var id = simpanObj(SHEET_GURU, HEADERS[SHEET_GURU], { ID: asString(p.id), Nama: p.nama, Mapel: asString(p.mapel), HP: asString(p.hp) });
  if (!id) return gagal('Guru tidak ditemukan.');
  return ok({ id: id });
}
function aksiSaveKelas(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.nama)) return gagal('Nama kelas wajib diisi.');
  var id = simpanObj(SHEET_KELAS, HEADERS[SHEET_KELAS], { ID: asString(p.id), Nama: p.nama, JurusanID: asString(p.jurusanId) });
  if (!id) return gagal('Kelas tidak ditemukan.');
  return ok({ id: id });
}
function aksiSaveJurusan(p) {
  butuhAuth(p, ['admin']);
  if (!asString(p.kode)) return gagal('Kode jurusan wajib diisi.');
  if (!asString(p.nama)) return gagal('Nama jurusan wajib diisi.');
  var id = simpanObj(SHEET_JURUSAN, HEADERS[SHEET_JURUSAN], { ID: asString(p.id), Kode: p.kode, Nama: p.nama, Deskripsi: asString(p.deskripsi) });
  if (!id) return gagal('Jurusan tidak ditemukan.');
  return ok({ id: id });
}
function aksiSaveBerita(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.judul)) return gagal('Judul berita wajib diisi.');
  var id = simpanObj(SHEET_BERITA, HEADERS[SHEET_BERITA], { ID: asString(p.id), Judul: p.judul, Isi: asString(p.isi), Tanggal: asString(p.tanggal) || tanggalHariIni() });
  if (!id) return gagal('Berita tidak ditemukan.');
  return ok({ id: id });
}
function aksiSavePengumuman(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.judul)) return gagal('Judul pengumuman wajib diisi.');
  var id = simpanObj(SHEET_PENGUMUMAN, HEADERS[SHEET_PENGUMUMAN], { ID: asString(p.id), Judul: p.judul, Isi: asString(p.isi), Tanggal: asString(p.tanggal) || tanggalHariIni() });
  if (!id) return gagal('Pengumuman tidak ditemukan.');
  return ok({ id: id });
}
function aksiSaveGaleri(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.judul)) return gagal('Judul galeri wajib diisi.');
  var id = simpanObj(SHEET_GALERI, HEADERS[SHEET_GALERI], { ID: asString(p.id), Judul: p.judul, Deskripsi: asString(p.deskripsi), Url: asString(p.url), Tanggal: asString(p.tanggal) || tanggalHariIni() });
  if (!id) return gagal('Galeri tidak ditemukan.');
  return ok({ id: id });
}
function aksiSavePengguna(p) {
  butuhAuth(p, ['admin']);
  if (!asString(p.nama)) return gagal('Nama wajib diisi.');
  if (!asString(p.username)) return gagal('Username wajib diisi.');
  var lama = asString(p.id) ? cariBaris(SHEET_PENGGUNA, p.id) : null;
  if (asString(p.id) && !lama) return gagal('Pengguna tidak ditemukan.');
  // Username duplikat (kecuali dirinya sendiri) ditolak
  var rows = bacaSemua(SHEET_PENGGUNA);
  for (var i = 0; i < rows.length; i++) {
    if (asString(rows[i].Username).toLowerCase() === asString(p.username).toLowerCase() && asString(rows[i].ID) !== asString(p.id)) {
      return gagal('Username sudah dipakai.');
    }
  }
  var salt = lama ? asString(lama.PasswordSalt) : buatSalt();
  var hash = lama ? asString(lama.PasswordHash) : '';
  if (asString(p.password)) hash = hashPassword(p.password, salt);
  if (!asString(p.id) && !hash) return gagal('Kata sandi wajib diisi untuk pengguna baru.');
  var id = simpanObj(SHEET_PENGGUNA, HEADERS[SHEET_PENGGUNA], {
    ID: asString(p.id), Nama: p.nama, Username: p.username,
    PasswordHash: hash, PasswordSalt: salt, Peran: asString(p.peran) || 'siswa',
    Token: lama ? asString(lama.Token) : '', TokenKedaluwarsa: lama ? asString(lama.TokenKedaluwarsa) : '',
    SiswaID: asString(p.siswaId)
  });
  if (!id) return gagal('Pengguna tidak ditemukan.');
  return ok({ id: id });
}

// ============================================================
// PPDB
// ============================================================
function aksiSubmitPPDB(p) {
  if (!asString(p.nama)) return gagal('Nama wajib diisi.');
  if (!asString(p.nisn)) return gagal('NISN wajib diisi.');
  if (!asString(p.asalSekolah)) return gagal('Asal sekolah wajib diisi.');
  if (!asString(p.jurusan)) return gagal('Jurusan wajib diisi.');
  var id = simpanObj(SHEET_PPDB, HEADERS[SHEET_PPDB], {
    Nama: p.nama, NISN: p.nisn, AsalSekolah: p.asalSekolah, Jurusan: p.jurusan,
    HP: asString(p.hp), Alamat: asString(p.alamat), Status: 'Menunggu', Tanggal: tanggalHariIni()
  });
  return ok({ id: id, status: 'Menunggu' });
}
function aksiUpdatePPDB(p) {
  butuhAuth(p, ['admin']);
  if (!asString(p.id)) return gagal('ID wajib diisi.');
  if (STATUS_PPDB_VALID.indexOf(asString(p.status)) < 0) return gagal('Status PPDB tidak valid.');
  var lama = cariBaris(SHEET_PPDB, p.id);
  if (!lama) return gagal('Pendaftar PPDB tidak ditemukan.');
  var id = simpanObj(SHEET_PPDB, HEADERS[SHEET_PPDB], {
    ID: p.id, Nama: lama.Nama, NISN: lama.NISN, AsalSekolah: lama.AsalSekolah,
    Jurusan: lama.Jurusan, HP: lama.HP, Alamat: lama.Alamat, Status: p.status, Tanggal: lama.Tanggal
  });
  return ok({ id: id, status: p.status });
}

// ============================================================
// ABSENSI QR
// ============================================================
function aksiBuatSesiQR(p) {
  var user = butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.mapel)) return gagal('Mata pelajaran wajib diisi.');
  if (!asString(p.kelas)) return gagal('Kelas wajib diisi.');
  var kode = 'QR-' + Math.floor(1000 + Math.random() * 9000);
  // Hindari kode aktif yang sama persis
  var aktif = bacaSemua(SHEET_SESIQR);
  var bentrok = true;
  while (bentrok) {
    bentrok = false;
    for (var i = 0; i < aktif.length; i++) {
      if (asString(aktif[i].Kode) === kode && asString(aktif[i].Status) === 'Aktif') { bentrok = true; break; }
    }
    if (bentrok) kode = 'QR-' + Math.floor(1000 + Math.random() * 9000);
  }
  var id = simpanObj(SHEET_SESIQR, HEADERS[SHEET_SESIQR], {
    Kode: kode, Mapel: p.mapel, Kelas: p.kelas, Tanggal: tanggalHariIni(),
    Status: 'Aktif', DibuatOleh: asString(user.Nama)
  });
  return ok({ id: id, kode: kode });
}
function aksiTutupSesiQR(p) {
  butuhAuth(p, ['admin', 'guru']);
  var lama = asString(p.id) ? cariBaris(SHEET_SESIQR, p.id) : null;
  if (!lama) return gagal('Sesi tidak ditemukan.');
  simpanObj(SHEET_SESIQR, HEADERS[SHEET_SESIQR], {
    ID: p.id, Kode: lama.Kode, Mapel: lama.Mapel, Kelas: lama.Kelas,
    Tanggal: lama.Tanggal, Status: 'Ditutup', DibuatOleh: lama.DibuatOleh
  });
  return ok({ id: p.id });
}
function aksiAbsenQR(p) {
  var user = butuhAuth(p, ['siswa']);
  var kode = asString(p.kode).toUpperCase();
  if (!kode) return gagal('Kode sesi wajib diisi.');
  var sesiRows = bacaSemua(SHEET_SESIQR);
  var sesi = null;
  for (var i = 0; i < sesiRows.length; i++) {
    if (asString(sesiRows[i].Kode).toUpperCase() === kode) { sesi = sesiRows[i]; break; }
  }
  if (!sesi) return gagal('Kode sesi tidak ditemukan.');
  if (asString(sesi.Status) !== 'Aktif') return gagal('Sesi sudah ditutup.');
  var siswaId = asString(user.SiswaID);
  if (!siswaId) return gagal('Akun siswa belum terhubung ke data siswa. Hubungi admin.');
  var siswa = cariBaris(SHEET_SISWA, siswaId);
  if (!siswa) return gagal('Data siswa tidak ditemukan.');
  var absen = bacaSemua(SHEET_ABSENSI);
  for (var j = 0; j < absen.length; j++) {
    if (asString(absen[j].SiswaID) === siswaId && asString(absen[j].SesiID) === asString(sesi.ID)) {
      return gagal('Anda sudah absen untuk sesi ini.');
    }
  }
  var id = simpanObj(SHEET_ABSENSI, HEADERS[SHEET_ABSENSI], {
    Tanggal: tanggalHariIni(), SiswaID: siswaId, NamaSiswa: asString(siswa.Nama),
    Kelas: asString(siswa.Kelas), SesiID: asString(sesi.ID), KodeSesi: asString(sesi.Kode), Status: 'Hadir'
  });
  return ok({ id: id, status: 'Hadir' });
}
function aksiAbsenManual(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.siswaId)) return gagal('Siswa wajib dipilih.');
  if (STATUS_ABSENSI_VALID.indexOf(asString(p.status)) < 0) return gagal('Status absensi tidak valid.');
  var siswa = cariBaris(SHEET_SISWA, p.siswaId);
  if (!siswa) return gagal('Siswa tidak ditemukan.');
  var id = simpanObj(SHEET_ABSENSI, HEADERS[SHEET_ABSENSI], {
    Tanggal: asString(p.tanggal) || tanggalHariIni(), SiswaID: p.siswaId,
    NamaSiswa: asString(siswa.Nama), Kelas: asString(siswa.Kelas),
    SesiID: asString(p.sesiId), KodeSesi: asString(p.kodeSesi), Status: p.status
  });
  return ok({ id: id });
}

// ============================================================
// NILAI, TUGAS, MATERI
// ============================================================
function aksiSaveNilai(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.siswaId)) return gagal('Siswa wajib dipilih.');
  if (!asString(p.mapel)) return gagal('Mata pelajaran wajib diisi.');
  var nilai = asInt(p.nilai, -1);
  if (nilai < 0 || nilai > 100) return gagal('Nilai harus antara 0-100.');
  var siswa = cariBaris(SHEET_SISWA, p.siswaId);
  if (!siswa) return gagal('Siswa tidak ditemukan.');
  var id = simpanObj(SHEET_NILAI, HEADERS[SHEET_NILAI], {
    ID: asString(p.id), SiswaID: p.siswaId, NamaSiswa: asString(siswa.Nama),
    Mapel: p.mapel, Nilai: nilai, Keterangan: asString(p.keterangan),
    Tanggal: asString(p.tanggal) || tanggalHariIni()
  });
  if (!id) return gagal('Nilai tidak ditemukan.');
  return ok({ id: id });
}
function aksiSaveTugas(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.judul)) return gagal('Judul tugas wajib diisi.');
  var id = simpanObj(SHEET_TUGAS, HEADERS[SHEET_TUGAS], {
    ID: asString(p.id), Judul: p.judul, Deskripsi: asString(p.deskripsi),
    Mapel: asString(p.mapel), Kelas: asString(p.kelas), Tenggat: asString(p.tenggat)
  });
  if (!id) return gagal('Tugas tidak ditemukan.');
  return ok({ id: id });
}
function aksiSaveMateri(p) {
  butuhAuth(p, ['admin', 'guru']);
  if (!asString(p.judul)) return gagal('Judul materi wajib diisi.');
  var id = simpanObj(SHEET_MATERI, HEADERS[SHEET_MATERI], {
    ID: asString(p.id), Judul: p.judul, Deskripsi: asString(p.deskripsi),
    Mapel: asString(p.mapel), Kelas: asString(p.kelas), Url: asString(p.url)
  });
  if (!id) return gagal('Materi tidak ditemukan.');
  return ok({ id: id });
}

// Izin Drive (opsional, hanya bila memakai upload logo di masa depan)
function authorizeDriveAccess() {
  DriveApp.getRootFolder();
}
