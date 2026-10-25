import { useState } from 'react';
import { getApiUrl, initDatabase, ping, setApiUrl } from '../services/gasApi';
import type { PageProps } from './PageProps';
import { Button, Card, Field, PageHeader, TextInput } from '../components/ui';

export default function Konfigurasi({ sekolah, daftarSekolah, onGantiSekolah, onApiUrlChange, refreshPublik, toast }: PageProps) {
  const [url, setUrl] = useState(() => getApiUrl());
  const [sibuk, setSibuk] = useState(false);
  const [hasilTes, setHasilTes] = useState('');
  const simpanUrl = async () => {
    const u = url.trim();
    setApiUrl(u);
    await onApiUrlChange(u);
    toast(u ? 'URL backend disimpan.' : 'URL backend dikosongkan; memakai URL dari schools.json.', 'sukses');
  };
  const tes = async () => {
    setSibuk(true);
    try { const r = await ping(); setHasilTes(`Terhubung! Versi backend ${r.version}, waktu server ${r.waktu}.`); toast('Koneksi backend OK.', 'sukses'); }
    catch (e) { setHasilTes(''); toast(e instanceof Error ? e.message : 'Tes koneksi gagal.', 'error'); }
    finally { setSibuk(false); }
  };
  const init = async () => {
    setSibuk(true);
    try {
      const r = await initDatabase();
      toast(`Database diinisialisasi: ${r.sheets.length} sheet siap. Akun bawaan: admin/admin123, guru/guru123, siswa/siswa123, ortu/ortu123.`, 'sukses');
      await refreshPublik();
    } catch (e) { toast(e instanceof Error ? e.message : 'Inisialisasi gagal.', 'error'); }
    finally { setSibuk(false); }
  };
  return (
    <div>
      <PageHeader judul="Konfigurasi" subjudul="Hubungkan aplikasi ke backend Google Apps Script. Halaman ini selalu bisa dibuka, walau backend belum tersambung." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold text-emerald-950">Pilih Madrasah</h3>
          <div className="mt-3 space-y-2">
            {daftarSekolah.length === 0 && <p className="text-sm text-emerald-700">Belum ada madrasah di schools.json. Isi URL backend manual di bawah.</p>}
            {daftarSekolah.map((s) => (
              <button key={s.id} onClick={() => onGantiSekolah(s)} className={`block w-full rounded-xl border p-3 text-left ${sekolah?.id === s.id ? 'border-emerald-600 bg-emerald-50' : 'border-emerald-200'}`}>
                <p className="font-bold text-emerald-950">{s.nama}</p>
                {s.kota && <p className="text-xs text-emerald-600">{s.kota}</p>}
                <p className="mt-1 text-xs text-emerald-600">{s.apiUrl ? 'Backend sudah terdaftar' : 'Backend belum diisi — tempel URL di bawah'}</p>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-bold text-emerald-950">URL Backend (Apps Script /exec)</h3>
          <div className="mt-3 space-y-3">
            <Field label="URL Backend">
              <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={simpanUrl}>Simpan URL</Button>
              <Button varian="sekunder" onClick={tes} loading={sibuk}>Uji Koneksi</Button>
              <Button varian="sekunder" onClick={init} loading={sibuk}>Inisialisasi Database</Button>
            </div>
            {hasilTes && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{hasilTes}</p>}
          </div>
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
            <p className="font-bold">Penting — backend WAJIB container-bound:</p>
            <p>Buat spreadsheet dulu, lalu dari dalam spreadsheet: Extensions → Apps Script (bukan script.google.com langsung). Kalau dibuat standalone, getActiveSpreadsheet() = null dan semua aksi gagal.</p>
            <p className="mt-1">Setelah paste Kode.gs: Deploy → New version (bukan New deployment baru) tiap ada perubahan kode.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
