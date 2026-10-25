import type { DataPublik, PanelData, Pengaturan, UserSesi } from '../types';

// Klien API Google Apps Script — kontrak sama seperti proyek sebelumnya:
// POST JSON {action, token?, ...} Content-Type text/plain, envelope
// {success, message, data, error}. Tanggal ISO yyyy-mm-dd.

const LS_API = 'wwn-madrasah-80.apiUrl';
const LS_TOKEN = 'wwn-madrasah-80.token';
const LS_USER = 'wwn-madrasah-80.user';
let urlEfektif = '';
export function setUrlEfektif(url: string): void { urlEfektif = (url || '').trim(); }
function resolveUrl(): string { return urlEfektif || getApiUrl(); }
export function getApiUrl(): string {
  try { return localStorage.getItem(LS_API) || ''; } catch { return ''; }
}
export function setApiUrl(url: string): void {
  try { if (url) localStorage.setItem(LS_API, url); else localStorage.removeItem(LS_API); } catch { /* abaikan */ }
}

export async function callApi<T>(action: string, params: object = {}): Promise<T> {
  const apiUrl = resolveUrl();
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    throw new Error('URL backend belum dikonfigurasi. Atur di menu Konfigurasi.');
  }
  let res: Response;
  try {
    const token = getToken();
    res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(token ? { action, token, ...params } : { action, ...params }),
    });
  } catch {
    throw new Error('Gagal menghubungi backend. Periksa koneksi internet.');
  }
  if (!res.ok) throw new Error(`Server merespons HTTP ${res.status}.`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.message || json.error || 'Backend melaporkan kegagalan.');
  return json.data as T;
}

export function getToken(): string {
  try { return localStorage.getItem(LS_TOKEN) || ''; } catch { return ''; }
}
export function getUser(): UserSesi | null {
  try { const s = localStorage.getItem(LS_USER); return s ? (JSON.parse(s) as UserSesi) : null; } catch { return null; }
}
function simpanSesi(token: string, nama: string, peran: string, siswaId?: string): void {
  try {
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_USER, JSON.stringify({ nama, peran, siswaId: siswaId || '' }));
  } catch { /* abaikan */ }
}
export function bersihkanSesi(): void {
  try { localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_USER); } catch { /* abaikan */ }
}
export async function login(username: string, password: string): Promise<UserSesi> {
  const data = await callApi<{ token: string; nama: string; peran: string; siswaId: string }>('login', { username: username.trim(), password });
  simpanSesi(data.token, data.nama, data.peran, data.siswaId);
  return { nama: data.nama, peran: data.peran, siswaId: data.siswaId };
}
export async function logout(): Promise<void> {
  const token = getToken();
  bersihkanSesi();
  if (token) { try { await callApi('logout', { token }); } catch { /* sesi lokal sudah dibersihkan */ } }
}

export function ping(): Promise<{ version: string; waktu: string }> { return callApi('ping'); }
export function initDatabase(): Promise<{ sheets: string[] }> { return callApi('initDatabase'); }
export function getAllData(): Promise<DataPublik> { return callApi('getAllData'); }
export function getPanelData(siswaId?: string): Promise<PanelData> {
  return callApi('getPanelData', siswaId ? { siswaId } : {});
}
export function savePengaturan(pengaturan: Pengaturan): Promise<unknown> { return callApi('savePengaturan', { pengaturan }); }

export function saveSiswa(item: { id?: string; nama: string; nis?: string; kelas: string; jurusanId?: string; hp?: string; alamat?: string }): Promise<{ id: string }> { return callApi('saveSiswa', item); }
export function deleteSiswa(id: string): Promise<unknown> { return callApi('deleteSiswa', { id }); }
export function saveGuru(item: { id?: string; nama: string; mapel?: string; hp?: string }): Promise<{ id: string }> { return callApi('saveGuru', item); }
export function deleteGuru(id: string): Promise<unknown> { return callApi('deleteGuru', { id }); }
export function saveKelas(item: { id?: string; nama: string; jurusanId?: string }): Promise<{ id: string }> { return callApi('saveKelas', item); }
export function deleteKelas(id: string): Promise<unknown> { return callApi('deleteKelas', { id }); }
export function saveJurusan(item: { id?: string; kode: string; nama: string; deskripsi?: string }): Promise<{ id: string }> { return callApi('saveJurusan', item); }
export function deleteJurusan(id: string): Promise<unknown> { return callApi('deleteJurusan', { id }); }
export function saveBerita(item: { id?: string; judul: string; isi?: string; tanggal?: string }): Promise<{ id: string }> { return callApi('saveBerita', item); }
export function deleteBerita(id: string): Promise<unknown> { return callApi('deleteBerita', { id }); }
export function savePengumuman(item: { id?: string; judul: string; isi?: string; tanggal?: string }): Promise<{ id: string }> { return callApi('savePengumuman', item); }
export function deletePengumuman(id: string): Promise<unknown> { return callApi('deletePengumuman', { id }); }
export function saveGaleri(item: { id?: string; judul: string; deskripsi?: string; url?: string; tanggal?: string }): Promise<{ id: string }> { return callApi('saveGaleri', item); }
export function deleteGaleri(id: string): Promise<unknown> { return callApi('deleteGaleri', { id }); }
export function savePengguna(item: { id?: string; nama: string; username: string; password?: string; peran: string; siswaId?: string }): Promise<{ id: string }> { return callApi('savePengguna', item); }
export function deletePengguna(id: string): Promise<unknown> { return callApi('deletePengguna', { id }); }

export function submitPPDB(item: { nama: string; nisn: string; asalSekolah: string; jurusan: string; hp?: string; alamat?: string }): Promise<{ id: string; status: string }> { return callApi('submitPPDB', item); }
export function updatePPDB(id: string, status: string): Promise<unknown> { return callApi('updatePPDB', { id, status }); }
export function deletePPDB(id: string): Promise<unknown> { return callApi('deletePPDB', { id }); }

export function buatSesiQR(item: { mapel: string; kelas: string }): Promise<{ id: string; kode: string }> { return callApi('buatSesiQR', item); }
export function tutupSesiQR(id: string): Promise<unknown> { return callApi('tutupSesiQR', { id }); }
export function absenQR(kode: string): Promise<{ id: string; status: string }> { return callApi('absenQR', { kode }); }
export function absenManual(item: { siswaId: string; status: string; tanggal?: string; sesiId?: string; kodeSesi?: string }): Promise<{ id: string }> { return callApi('absenManual', item); }

export function saveNilai(item: { id?: string; siswaId: string; mapel: string; nilai: number; keterangan?: string; tanggal?: string }): Promise<{ id: string }> { return callApi('saveNilai', item); }
export function deleteNilai(id: string): Promise<unknown> { return callApi('deleteNilai', { id }); }
export function saveTugas(item: { id?: string; judul: string; deskripsi?: string; mapel?: string; kelas?: string; tenggat?: string }): Promise<{ id: string }> { return callApi('saveTugas', item); }
export function deleteTugas(id: string): Promise<unknown> { return callApi('deleteTugas', { id }); }
export function saveMateri(item: { id?: string; judul: string; deskripsi?: string; mapel?: string; kelas?: string; url?: string }): Promise<{ id: string }> { return callApi('saveMateri', item); }
export function deleteMateri(id: string): Promise<unknown> { return callApi('deleteMateri', { id }); }
