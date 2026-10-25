import { useState } from 'react';
import { absenManual, absenQR, buatSesiQR, tutupSesiQR } from '../services/gasApi';
import { validasiKodeSesi } from '../lib/logic';
import type { PageProps } from './PageProps';
import { Badge, Button, Card, EmptyState, Field, PageHeader, SelectInput, TabelResponsif, TextInput, tdCls, thCls } from '../components/ui';

export default function AbsensiQR({ user, panel, toast, refreshPanel, onNeedLogin }: PageProps) {
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [kode, setKode] = useState('');
  const [siswaId, setSiswaId] = useState('');
  const [statusManual, setStatusManual] = useState('Hadir');
  const [sibuk, setSibuk] = useState(false);
  if (!user) { onNeedLogin(); return <Card><p className="text-sm text-emerald-800">Silakan masuk dulu.</p></Card>; }
  if (!panel) return <Card><p className="text-sm text-emerald-800">Memuat data panel…</p></Card>;
  const sesiAktif = panel.sesi.filter((s) => s.status === 'Aktif');
  const peran = user.peran;

  const buatSesi = async () => {
    if (!mapel.trim() || !kelas.trim()) { toast('Isi mata pelajaran dan kelas.', 'error'); return; }
    setSibuk(true);
    try { const r = await buatSesiQR({ mapel, kelas }); toast(`Sesi dibuat. Kode: ${r.kode} — bagikan kode ini ke siswa.`, 'sukses'); await refreshPanel(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Gagal membuat sesi.', 'error'); } finally { setSibuk(false); }
  };
  const absen = async () => {
    const err = validasiKodeSesi(kode);
    if (err) { toast(err, 'error'); return; }
    setSibuk(true);
    try { await absenQR(kode.trim().toUpperCase()); toast('Absensi berhasil dicatat: Hadir.', 'sukses'); setKode(''); await refreshPanel(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Gagal absen.', 'error'); } finally { setSibuk(false); }
  };
  const manual = async () => {
    if (!siswaId) { toast('Pilih siswa dulu.', 'error'); return; }
    setSibuk(true);
    try { await absenManual({ siswaId, status: statusManual }); toast('Absensi manual dicatat.', 'sukses'); await refreshPanel(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Gagal mencatat absensi.', 'error'); } finally { setSibuk(false); }
  };
  const tutup = async (id: string) => {
    try { await tutupSesiQR(id); toast('Sesi ditutup.', 'sukses'); await refreshPanel(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Gagal menutup sesi.', 'error'); }
  };

  return (
    <div>
      <PageHeader judul="Absensi QR Code" subjudul="Guru membuat sesi dan membagikan kode; siswa absen dengan memasukkan kode sesi (tanpa kamera, tanpa aplikasi tambahan)." />

      {peran === 'siswa' && (
        <Card className="max-w-xl">
          <h3 className="font-bold text-emerald-950">Hadir via Kode Sesi</h3>
          <p className="mt-1 text-sm text-emerald-700">Minta kode sesi kepada guru (format QR-XXXX), ketik di bawah, lalu tekan tombol. Satu siswa hanya bisa absen sekali per sesi.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TextInput value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} placeholder="QR-1234" className="max-w-[220px] font-mono-num uppercase" />
            <Button onClick={absen} loading={sibuk}>Saya Hadir</Button>
          </div>
        </Card>
      )}

      {(peran === 'guru' || peran === 'admin') && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="font-bold text-emerald-950">Buat Sesi QR Baru</h3>
            <div className="mt-3 space-y-3">
              <Field label="Mata Pelajaran"><TextInput value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="mis. Matematika" /></Field>
              <Field label="Kelas"><TextInput value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="mis. X TKJ 1" /></Field>
              <Button onClick={buatSesi} loading={sibuk}>Buat Sesi &amp; Tampilkan Kode</Button>
            </div>
          </Card>
          <Card>
            <h3 className="font-bold text-emerald-950">Absensi Manual</h3>
            <div className="mt-3 space-y-3">
              <Field label="Siswa"><SelectInput value={siswaId} onChange={(e) => setSiswaId(e.target.value)}><option value="">-- Pilih siswa --</option>{panel.siswa.map((s) => <option key={s.id} value={s.id}>{s.nama} — {s.kelas}</option>)}</SelectInput></Field>
              <Field label="Status"><SelectInput value={statusManual} onChange={(e) => setStatusManual(e.target.value)}><option>Hadir</option><option>Sakit</option><option>Izin</option><option>Alpa</option></SelectInput></Field>
              <Button onClick={manual} loading={sibuk}>Catat Absensi</Button>
            </div>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <h3 className="font-bold text-emerald-950">Sesi QR</h3>
        {panel.sesi.length === 0 && <EmptyState judul="Belum ada sesi" subjudul="Guru dapat membuat sesi baru di atas." />}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {panel.sesi.slice().reverse().map((s) => (
            <div key={s.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-center font-mono-num text-3xl font-bold tracking-widest text-emerald-900">{s.kode}</p>
              <p className="mt-2 text-center text-sm text-emerald-800">{s.mapel} • {s.kelas}</p>
              <p className="text-center text-xs text-emerald-600">{s.tanggal} • oleh {s.dibuatOleh || '-'}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge warna={s.status === 'Aktif' ? 'hijau' : 'abu'}>{s.status}</Badge>
                {s.status === 'Aktif' && (peran === 'guru' || peran === 'admin') && <Button kecil varian="sekunder" onClick={() => tutup(s.id)}>Tutup Sesi</Button>}
              </div>
            </div>
          ))}
        </div>
        {sesiAktif.length > 0 && peran === 'siswa' && <p className="mt-3 text-xs text-emerald-600">Sesi aktif saat ini: {sesiAktif.map((s) => s.kode).join(', ')}. Ketik salah satu kode di atas untuk absen.</p>}
      </Card>

      <Card className="mt-4">
        <h3 className="font-bold text-emerald-950">Daftar Absensi</h3>
        {panel.absensi.length === 0 && <EmptyState judul="Belum ada absensi" />}
        <TabelResponsif>
          <table className="w-full min-w-[560px]">
            <thead><tr><th className={thCls}>Tanggal</th><th className={thCls}>Siswa</th><th className={thCls}>Kelas</th><th className={thCls}>Kode</th><th className={thCls}>Status</th></tr></thead>
            <tbody>
              {panel.absensi.slice().reverse().slice(0, 50).map((a) => (
                <tr key={a.id}><td className={tdCls}>{a.tanggal}</td><td className={tdCls}>{a.namaSiswa}</td><td className={tdCls}>{a.kelas}</td><td className={tdCls}>{a.kodeSesi || '-'}</td><td className={tdCls}><Badge warna={a.status === 'Hadir' ? 'hijau' : a.status === 'Alpa' ? 'merah' : 'kuning'}>{a.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </TabelResponsif>
      </Card>
    </div>
  );
}
