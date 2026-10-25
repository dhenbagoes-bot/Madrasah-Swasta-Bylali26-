import { useState } from 'react';
import { deleteMateri, deleteNilai, deleteTugas, saveMateri, saveNilai, saveTugas } from '../services/gasApi';
import { validasiNilai } from '../lib/logic';
import type { PageProps } from './PageProps';
import { Button, Card, ConfirmDialog, EmptyState, Field, PageHeader, SelectInput, TabelResponsif, TextAreaInput, TextInput, tdCls, thCls } from '../components/ui';

export default function NilaiTugas({ user, panel, toast, refreshPanel, onNeedLogin }: PageProps) {
  const [siswaId, setSiswaId] = useState('');
  const [mapel, setMapel] = useState('');
  const [nilai, setNilai] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kelas, setKelas] = useState('');
  const [tenggat, setTenggat] = useState('');
  const [url, setUrl] = useState('');
  const [jenis, setJenis] = useState<'tugas' | 'materi'>('tugas');
  const [hapus, setHapus] = useState<{ jenis: string; id: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);
  if (!user) { onNeedLogin(); return <Card><p className="text-sm text-emerald-800">Silakan masuk dulu.</p></Card>; }
  if (!panel) return <Card><p className="text-sm text-emerald-800">Memuat data panel…</p></Card>;
  const bisaInput = user.peran === 'guru' || user.peran === 'admin';

  const simpanNilai = async () => {
    const n = Number(nilai);
    const err = validasiNilai(n);
    if (!siswaId) { toast('Pilih siswa dulu.', 'error'); return; }
    if (!mapel.trim()) { toast('Isi mata pelajaran.', 'error'); return; }
    if (err) { toast(err, 'error'); return; }
    setSibuk(true);
    try { await saveNilai({ siswaId, mapel, nilai: n, keterangan }); toast('Nilai tersimpan.', 'sukses'); setNilai(''); setKeterangan(''); await refreshPanel(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Gagal menyimpan nilai.', 'error'); } finally { setSibuk(false); }
  };
  const simpanTugasMateri = async () => {
    if (!judul.trim()) { toast('Isi judul.', 'error'); return; }
    setSibuk(true);
    try {
      if (jenis === 'tugas') await saveTugas({ judul, deskripsi, mapel, kelas, tenggat });
      else await saveMateri({ judul, deskripsi, mapel, kelas, url });
      toast(jenis === 'tugas' ? 'Tugas tersimpan.' : 'Materi tersimpan.', 'sukses');
      setJudul(''); setDeskripsi(''); setUrl(''); await refreshPanel();
    } catch (e) { toast(e instanceof Error ? e.message : 'Gagal menyimpan.', 'error'); } finally { setSibuk(false); }
  };
  const jalankanHapus = async () => {
    if (!hapus) return;
    try {
      if (hapus.jenis === 'nilai') await deleteNilai(hapus.id);
      if (hapus.jenis === 'tugas') await deleteTugas(hapus.id);
      if (hapus.jenis === 'materi') await deleteMateri(hapus.id);
      setHapus(null); toast('Data dihapus.', 'sukses'); await refreshPanel();
    } catch (e) { toast(e instanceof Error ? e.message : 'Gagal menghapus.', 'error'); }
  };

  return (
    <div>
      <PageHeader judul="Nilai, Tugas & Materi" subjudul={bisaInput ? 'Guru menginput nilai, tugas, dan materi.' : 'Lihat nilai, tugas, dan materi Anda.'} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold text-emerald-950">Nilai</h3>
          {panel.nilai.length === 0 && <EmptyState judul="Belum ada nilai" />}
          <TabelResponsif>
            <table className="w-full min-w-[420px]">
              <thead><tr><th className={thCls}>Siswa</th><th className={thCls}>Mapel</th><th className={thCls}>Nilai</th>{bisaInput && <th className={thCls}>Aksi</th>}</tr></thead>
              <tbody>
                {panel.nilai.slice().reverse().slice(0, 50).map((n) => (
                  <tr key={n.id}><td className={tdCls}>{n.namaSiswa}<br /><span className="text-xs text-emerald-600">{n.keterangan || n.tanggal}</span></td><td className={tdCls}>{n.mapel}</td><td className={tdCls}><strong>{n.nilai}</strong></td>
                    {bisaInput && <td className={tdCls}><Button kecil varian="bahaya" onClick={() => setHapus({ jenis: 'nilai', id: n.id })}>Hapus</Button></td>}</tr>
                ))}
              </tbody>
            </table>
          </TabelResponsif>
          {bisaInput && (
            <div className="mt-4 space-y-3 border-t border-emerald-100 pt-4">
              <h4 className="font-semibold text-emerald-950">Input Nilai</h4>
              <Field label="Siswa"><SelectInput value={siswaId} onChange={(e) => setSiswaId(e.target.value)}><option value="">-- Pilih siswa --</option>{panel.siswa.map((s) => <option key={s.id} value={s.id}>{s.nama} — {s.kelas}</option>)}</SelectInput></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mata Pelajaran"><TextInput value={mapel} onChange={(e) => setMapel(e.target.value)} /></Field>
                <Field label="Nilai (0-100)"><TextInput type="number" min={0} max={100} value={nilai} onChange={(e) => setNilai(e.target.value)} /></Field>
              </div>
              <Field label="Keterangan"><TextInput value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="mis. Ulangan Harian 1" /></Field>
              <Button onClick={simpanNilai} loading={sibuk}>Simpan Nilai</Button>
            </div>
          )}
        </Card>
        <div className="space-y-4">
          {bisaInput && (
            <Card>
              <h3 className="font-bold text-emerald-950">Tambah Tugas / Materi</h3>
              <div className="mt-3 flex gap-2">
                <Button kecil varian={jenis === 'tugas' ? 'primer' : 'sekunder'} onClick={() => setJenis('tugas')}>Tugas</Button>
                <Button kecil varian={jenis === 'materi' ? 'primer' : 'sekunder'} onClick={() => setJenis('materi')}>Materi</Button>
              </div>
              <div className="mt-3 space-y-3">
                <Field label="Judul"><TextInput value={judul} onChange={(e) => setJudul(e.target.value)} /></Field>
                <Field label="Deskripsi"><TextAreaInput value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mata Pelajaran"><TextInput value={mapel} onChange={(e) => setMapel(e.target.value)} /></Field>
                  <Field label="Kelas (kosong = semua)"><TextInput value={kelas} onChange={(e) => setKelas(e.target.value)} /></Field>
                </div>
                {jenis === 'tugas'
                  ? <Field label="Tenggat"><TextInput type="date" value={tenggat} onChange={(e) => setTenggat(e.target.value)} /></Field>
                  : <Field label="URL Materi"><TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></Field>}
                <Button onClick={simpanTugasMateri} loading={sibuk}>Simpan {jenis === 'tugas' ? 'Tugas' : 'Materi'}</Button>
              </div>
            </Card>
          )}
          <Card>
            <h3 className="font-bold text-emerald-950">Tugas</h3>
            {panel.tugas.length === 0 && <EmptyState judul="Belum ada tugas" />}
            <ul className="mt-2 space-y-2 text-sm">
              {panel.tugas.slice().reverse().map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 border-b border-emerald-50 pb-2">
                  <span><strong>{t.judul}</strong> — {t.mapel} {t.kelas ? `• ${t.kelas}` : ''}<br /><span className="text-emerald-700">{t.deskripsi}</span>{t.tenggat && <span className="block text-xs text-amber-700">Tenggat: {t.tenggat}</span>}</span>
                  {bisaInput && <Button kecil varian="bahaya" onClick={() => setHapus({ jenis: 'tugas', id: t.id })}>Hapus</Button>}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="font-bold text-emerald-950">Materi</h3>
            {panel.materi.length === 0 && <EmptyState judul="Belum ada materi" />}
            <ul className="mt-2 space-y-2 text-sm">
              {panel.materi.slice().reverse().map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-2 border-b border-emerald-50 pb-2">
                  <span><strong>{m.judul}</strong> — {m.mapel} {m.kelas ? `• ${m.kelas}` : ''}<br /><span className="text-emerald-700">{m.deskripsi}</span>{m.url && <a className="block text-emerald-600 underline" href={m.url} target="_blank" rel="noreferrer">Buka materi ↗</a>}</span>
                  {bisaInput && <Button kecil varian="bahaya" onClick={() => setHapus({ jenis: 'materi', id: m.id })}>Hapus</Button>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      {hapus && <ConfirmDialog judul="Hapus data?" pesan="Data yang dihapus tidak bisa dikembalikan." onYa={jalankanHapus} onBatal={() => setHapus(null)} />}
    </div>
  );
}
