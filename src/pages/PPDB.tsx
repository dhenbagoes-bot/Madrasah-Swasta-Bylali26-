import { useState } from 'react';
import { submitPPDB } from '../services/gasApi';
import type { PageProps } from './PageProps';
import { Button, Card, Field, PageHeader, SelectInput, TextAreaInput, TextInput } from '../components/ui';

export default function PPDB({ publik, terhubung, toast }: PageProps) {
  const [form, setForm] = useState({ nama: '', nisn: '', asalSekolah: '', jurusan: '', hp: '', alamat: '' });
  const [sibuk, setSibuk] = useState(false);
  const [terkirim, setTerkirim] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const kirim = async () => {
    if (!form.nama.trim() || !form.nisn.trim() || !form.asalSekolah.trim() || !form.jurusan) {
      toast('Lengkapi nama, NISN, asal sekolah, dan jurusan.', 'error'); return;
    }
    setSibuk(true);
    try {
      await submitPPDB(form);
      setTerkirim(true);
      toast('Pendaftaran PPDB terkirim. Status: Menunggu verifikasi admin.', 'sukses');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal mengirim pendaftaran.', 'error');
    } finally { setSibuk(false); }
  };
  return (
    <div>
      <PageHeader judul="PPDB Online" subjudul="Penerimaan Peserta Didik Baru — isi formulir di bawah ini." />
      {!terhubung && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Formulir PPDB membutuhkan backend yang terhubung. Buka menu Konfigurasi untuk menempel URL backend.
        </div>
      )}
      {terkirim ? (
        <Card className="text-center">
          <p className="text-4xl">✅</p>
          <h2 className="mt-2 text-lg font-bold text-emerald-950">Pendaftaran terkirim!</h2>
          <p className="mt-1 text-sm text-emerald-700">Terima kasih, {form.nama}. Status pendaftaran Anda: <strong>Menunggu</strong> verifikasi admin. Silakan hubungi madrasah untuk info selanjutnya.</p>
          <Button varian="sekunder" className="mt-4" onClick={() => { setTerkirim(false); setForm({ nama: '', nisn: '', asalSekolah: '', jurusan: '', hp: '', alamat: '' }); }}>Daftar Pendaftar Lain</Button>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap *"><TextInput value={form.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Nama calon siswa" /></Field>
            <Field label="NISN *"><TextInput value={form.nisn} onChange={(e) => set('nisn', e.target.value)} placeholder="10 digit NISN" /></Field>
            <Field label="Asal Sekolah *"><TextInput value={form.asalSekolah} onChange={(e) => set('asalSekolah', e.target.value)} placeholder="MTs/SMP asal" /></Field>
            <Field label="Jurusan Pilihan *">
              <SelectInput value={form.jurusan} onChange={(e) => set('jurusan', e.target.value)}>
                <option value="">-- Pilih Jurusan --</option>
                {publik.jurusan.map((j) => <option key={j.id} value={j.nama}>{j.kode} — {j.nama}</option>)}
                {publik.jurusan.length === 0 && (<>
                  <option value="Akuntansi dan Keuangan Lembaga">AKL — Akuntansi dan Keuangan Lembaga</option>
                  <option value="Multimedia">MM — Multimedia</option>
                  <option value="Teknik Kendaraan Ringan">TKR — Teknik Kendaraan Ringan</option>
                  <option value="Teknik Komputer dan Jaringan">TKJ — Teknik Komputer dan Jaringan</option>
                </>)}
              </SelectInput>
            </Field>
            <Field label="No. HP / WA"><TextInput value={form.hp} onChange={(e) => set('hp', e.target.value)} placeholder="08xx..." /></Field>
            <Field label="Alamat" className="sm:col-span-2"><TextAreaInput value={form.alamat} onChange={(e) => set('alamat', e.target.value)} placeholder="Alamat lengkap" /></Field>
          </div>
          <Button className="mt-5 w-full" onClick={kirim} loading={sibuk} disabled={!terhubung}>Kirim Pendaftaran PPDB</Button>
          <p className="mt-2 text-center text-xs text-emerald-600">Setelah terkirim, status Anda adalah “Menunggu” sampai admin memverifikasi (Terima/Tolak).</p>
        </Card>
      )}
    </div>
  );
}
