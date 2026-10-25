import { useState } from 'react';
import {
  deleteBerita, deleteGaleri, deleteGuru, deleteJurusan, deleteKelas, deletePengumuman,
  deletePengguna, deletePPDB, deleteSiswa, saveBerita, saveGaleri, saveGuru, saveJurusan,
  saveKelas, savePengguna, savePengumuman, saveSiswa, updatePPDB,
} from '../services/gasApi';
import type { PageProps } from './PageProps';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, PageHeader, SelectInput, TabelResponsif, TextAreaInput, TextInput, tdCls, thCls } from '../components/ui';

type Tab = 'siswa' | 'guru' | 'kelas' | 'jurusan' | 'berita' | 'pengumuman' | 'galeri' | 'pengguna' | 'ppdb';
const TABS: { key: Tab; label: string }[] = [
  { key: 'siswa', label: 'Siswa' }, { key: 'guru', label: 'Guru' }, { key: 'kelas', label: 'Kelas & Jurusan' },
  { key: 'jurusan', label: 'Jurusan' }, { key: 'berita', label: 'Berita' }, { key: 'pengumuman', label: 'Pengumuman' },
  { key: 'galeri', label: 'Galeri' }, { key: 'pengguna', label: 'Pengguna' }, { key: 'ppdb', label: 'PPDB' },
];

const KOSONG: Record<string, string> = { nama: '', nis: '', kelas: '', jurusanId: '', hp: '', alamat: '', mapel: '', kode: '', deskripsi: '', judul: '', isi: '', url: '', tanggal: '', username: '', password: '', peran: 'siswa', siswaId: '' };

export default function KelolaData({ user, panel, toast, refreshPanel, onNeedLogin }: PageProps) {
  const [tab, setTab] = useState<Tab>('siswa');
  const [form, setForm] = useState<Record<string, string>>(KOSONG);
  const [editId, setEditId] = useState('');
  const [hapusId, setHapusId] = useState('');
  const [sibuk, setSibuk] = useState(false);
  if (!user) { onNeedLogin(); return <Card><p className="text-sm text-emerald-800">Silakan masuk dulu.</p></Card>; }
  if (!panel) return <Card><p className="text-sm text-emerald-800">Memuat data panel… Jika terus seperti ini, periksa koneksi backend di Konfigurasi.</p></Card>;
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const mulaiEdit = (item: Record<string, string>) => { setForm({ ...KOSONG, ...item }); setEditId(item.id || ''); window.scrollTo({ top: 0 }); };
  const batal = () => { setForm(KOSONG); setEditId(''); };

  const simpan = async () => {
    setSibuk(true);
    try {
      if (tab === 'siswa') await saveSiswa({ id: editId || undefined, nama: form.nama, nis: form.nis, kelas: form.kelas, jurusanId: form.jurusanId, hp: form.hp, alamat: form.alamat });
      else if (tab === 'guru') await saveGuru({ id: editId || undefined, nama: form.nama, mapel: form.mapel, hp: form.hp });
      else if (tab === 'kelas') await saveKelas({ id: editId || undefined, nama: form.nama, jurusanId: form.jurusanId });
      else if (tab === 'jurusan') await saveJurusan({ id: editId || undefined, kode: form.kode, nama: form.nama, deskripsi: form.deskripsi });
      else if (tab === 'berita') await saveBerita({ id: editId || undefined, judul: form.judul, isi: form.isi, tanggal: form.tanggal || undefined });
      else if (tab === 'pengumuman') await savePengumuman({ id: editId || undefined, judul: form.judul, isi: form.isi, tanggal: form.tanggal || undefined });
      else if (tab === 'galeri') await saveGaleri({ id: editId || undefined, judul: form.judul, deskripsi: form.deskripsi, url: form.url, tanggal: form.tanggal || undefined });
      else if (tab === 'pengguna') await savePengguna({ id: editId || undefined, nama: form.nama, username: form.username, password: form.password || undefined, peran: form.peran, siswaId: form.siswaId || undefined });
      toast(editId ? 'Data diperbarui.' : 'Data ditambahkan.', 'sukses');
      batal(); await refreshPanel();
    } catch (e) { toast(e instanceof Error ? e.message : 'Gagal menyimpan.', 'error'); }
    finally { setSibuk(false); }
  };
  const hapus = async () => {
    setSibuk(true);
    try {
      if (tab === 'siswa') await deleteSiswa(hapusId);
      else if (tab === 'guru') await deleteGuru(hapusId);
      else if (tab === 'kelas') await deleteKelas(hapusId);
      else if (tab === 'jurusan') await deleteJurusan(hapusId);
      else if (tab === 'berita') await deleteBerita(hapusId);
      else if (tab === 'pengumuman') await deletePengumuman(hapusId);
      else if (tab === 'galeri') await deleteGaleri(hapusId);
      else if (tab === 'pengguna') await deletePengguna(hapusId);
      else if (tab === 'ppdb') await deletePPDB(hapusId);
      setHapusId(''); toast('Data dihapus.', 'sukses'); await refreshPanel();
    } catch (e) { toast(e instanceof Error ? e.message : 'Gagal menghapus.', 'error'); }
    finally { setSibuk(false); }
  };
  const verifikasi = async (id: string, status: string) => {
    try { await updatePPDB(id, status); toast(`PPDB ${status}.`, 'sukses'); await refreshPanel(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Gagal memverifikasi.', 'error'); }
  };

  const jurusanOpt = panel.jurusan;
  const siswaOpt = panel.siswa;

  return (
    <div>
      <PageHeader judul="Kelola Data" subjudul="Admin & guru mengelola data madrasah. Jurusan yang diubah di sini langsung tampil di Beranda." />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); batal(); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === t.key ? 'bg-emerald-600 text-white' : 'border border-emerald-200 bg-white text-emerald-800'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'ppdb' ? (
        <Card>
          <h3 className="font-bold text-emerald-950">Verifikasi PPDB</h3>
          {panel.ppdb.length === 0 && <EmptyState judul="Belum ada pendaftar PPDB" />}
          <TabelResponsif>
            <table className="w-full min-w-[640px]">
              <thead><tr><th className={thCls}>Nama</th><th className={thCls}>NISN</th><th className={thCls}>Asal</th><th className={thCls}>Jurusan</th><th className={thCls}>Status</th><th className={thCls}>Aksi</th></tr></thead>
              <tbody>
                {panel.ppdb.map((p) => (
                  <tr key={p.id}>
                    <td className={tdCls}>{p.nama}<br /><span className="text-xs text-emerald-600">{p.hp}</span></td>
                    <td className={tdCls}>{p.nisn}</td><td className={tdCls}>{p.asalSekolah}</td><td className={tdCls}>{p.jurusan}</td>
                    <td className={tdCls}><Badge warna={p.status === 'Diterima' ? 'hijau' : p.status === 'Ditolak' ? 'merah' : 'kuning'}>{p.status}</Badge></td>
                    <td className={tdCls}>
                      <div className="flex gap-1">
                        <Button kecil onClick={() => verifikasi(p.id, 'Diterima')}>Terima</Button>
                        <Button kecil varian="bahaya" onClick={() => verifikasi(p.id, 'Ditolak')}>Tolak</Button>
                        <Button kecil varian="sekunder" onClick={() => setHapusId(p.id)}>Hapus</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelResponsif>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="font-bold text-emerald-950">{editId ? 'Ubah Data' : 'Tambah Data'} — {TABS.find((t) => t.key === tab)?.label}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(tab === 'siswa' || tab === 'guru' || tab === 'pengguna' || tab === 'kelas' || tab === 'jurusan') && (
                <Field label="Nama *"><TextInput value={form.nama} onChange={(e) => set('nama', e.target.value)} /></Field>
              )}
              {tab === 'siswa' && (<>
                <Field label="NIS"><TextInput value={form.nis} onChange={(e) => set('nis', e.target.value)} /></Field>
                <Field label="Kelas *"><TextInput value={form.kelas} onChange={(e) => set('kelas', e.target.value)} placeholder="mis. X TKJ 1" /></Field>
                <Field label="Jurusan"><SelectInput value={form.jurusanId} onChange={(e) => set('jurusanId', e.target.value)}><option value="">-- Tanpa jurusan --</option>{jurusanOpt.map((j) => <option key={j.id} value={j.id}>{j.kode} — {j.nama}</option>)}</SelectInput></Field>
                <Field label="HP"><TextInput value={form.hp} onChange={(e) => set('hp', e.target.value)} /></Field>
                <Field label="Alamat" className="sm:col-span-2"><TextAreaInput value={form.alamat} onChange={(e) => set('alamat', e.target.value)} /></Field>
              </>)}
              {tab === 'guru' && (<>
                <Field label="Mata Pelajaran"><TextInput value={form.mapel} onChange={(e) => set('mapel', e.target.value)} /></Field>
                <Field label="HP"><TextInput value={form.hp} onChange={(e) => set('hp', e.target.value)} /></Field>
              </>)}
              {tab === 'kelas' && (
                <Field label="Jurusan"><SelectInput value={form.jurusanId} onChange={(e) => set('jurusanId', e.target.value)}><option value="">-- Tanpa jurusan --</option>{jurusanOpt.map((j) => <option key={j.id} value={j.id}>{j.kode} — {j.nama}</option>)}</SelectInput></Field>
              )}
              {tab === 'jurusan' && (<>
                <Field label="Kode *"><TextInput value={form.kode} onChange={(e) => set('kode', e.target.value)} placeholder="mis. TKJ" /></Field>
                <Field label="Deskripsi" className="sm:col-span-2"><TextAreaInput value={form.deskripsi} onChange={(e) => set('deskripsi', e.target.value)} /></Field>
              </>)}
              {(tab === 'berita' || tab === 'pengumuman' || tab === 'galeri') && (<>
                <Field label="Judul *" className="sm:col-span-2"><TextInput value={form.judul} onChange={(e) => set('judul', e.target.value)} /></Field>
                <Field label={tab === 'galeri' ? 'Deskripsi' : 'Isi'} className="sm:col-span-2"><TextAreaInput value={form.isi || form.deskripsi} onChange={(e) => set(tab === 'galeri' ? 'deskripsi' : 'isi', e.target.value)} rows={4} /></Field>
                {tab === 'galeri' && <Field label="URL Foto (opsional)"><TextInput value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://…" /></Field>}
                <Field label="Tanggal"><TextInput type="date" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} /></Field>
              </>)}
              {tab === 'pengguna' && (<>
                <Field label="Username *"><TextInput value={form.username} onChange={(e) => set('username', e.target.value)} /></Field>
                <Field label={editId ? 'Kata Sandi Baru (kosongkan bila tidak diubah)' : 'Kata Sandi *'}><TextInput type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /></Field>
                <Field label="Peran"><SelectInput value={form.peran} onChange={(e) => set('peran', e.target.value)}><option value="admin">Admin</option><option value="guru">Guru</option><option value="siswa">Siswa</option><option value="ortu">Orang Tua</option></SelectInput></Field>
                {(form.peran === 'siswa' || form.peran === 'ortu') && (
                  <Field label="Terhubung ke Siswa"><SelectInput value={form.siswaId} onChange={(e) => set('siswaId', e.target.value)}><option value="">-- Pilih siswa --</option>{siswaOpt.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.nis || '-'}) — {s.kelas}</option>)}</SelectInput></Field>
                )}
              </>)}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={simpan} loading={sibuk}>{editId ? 'Simpan Perubahan' : 'Tambah'}</Button>
              {editId && <Button varian="sekunder" onClick={batal}>Batal</Button>}
            </div>
            {tab === 'jurusan' && user.peran !== 'admin' && <p className="mt-2 text-xs text-amber-700">Catatan: jurusan hanya bisa disimpan oleh admin (aturan backend).</p>}
          </Card>

          <Card className="mt-4">
            <TabelResponsif>
              <table className="w-full min-w-[560px]">
                <thead><tr><th className={thCls}>Data</th><th className={thCls}>Keterangan</th><th className={thCls}>Aksi</th></tr></thead>
                <tbody>
                  {tab === 'siswa' && panel.siswa.map((s) => (
                    <tr key={s.id}><td className={tdCls}><strong>{s.nama}</strong><br /><span className="text-xs">NIS {s.nis || '-'}</span></td><td className={tdCls}>{s.kelas}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: s.id, nama: s.nama, nis: s.nis, kelas: s.kelas, jurusanId: s.jurusanId, hp: s.hp, alamat: s.alamat })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(s.id)}>Hapus</Button></div></td></tr>
                  ))}
                  {tab === 'guru' && panel.guru.map((g) => (
                    <tr key={g.id}><td className={tdCls}><strong>{g.nama}</strong></td><td className={tdCls}>{g.mapel}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: g.id, nama: g.nama, mapel: g.mapel, hp: g.hp })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(g.id)}>Hapus</Button></div></td></tr>
                  ))}
                  {tab === 'kelas' && panel.kelas.map((k) => (
                    <tr key={k.id}><td className={tdCls}><strong>{k.nama}</strong></td><td className={tdCls}>{jurusanOpt.find((j) => j.id === k.jurusanId)?.nama || '-'}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: k.id, nama: k.nama, jurusanId: k.jurusanId })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(k.id)}>Hapus</Button></div></td></tr>
                  ))}
                  {tab === 'jurusan' && panel.jurusan.map((j) => (
                    <tr key={j.id}><td className={tdCls}><strong>{j.kode}</strong> — {j.nama}</td><td className={tdCls}>{j.deskripsi}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: j.id, kode: j.kode, nama: j.nama, deskripsi: j.deskripsi })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(j.id)}>Hapus</Button></div></td></tr>
                  ))}
                  {tab === 'berita' && panel.berita.map((b) => (
                    <tr key={b.id}><td className={tdCls}><strong>{b.judul}</strong></td><td className={tdCls}>{b.tanggal}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: b.id, judul: b.judul, isi: b.isi, tanggal: b.tanggal })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(b.id)}>Hapus</Button></div></td></tr>
                  ))}
                  {tab === 'pengumuman' && panel.pengumuman.map((b) => (
                    <tr key={b.id}><td className={tdCls}><strong>{b.judul}</strong></td><td className={tdCls}>{b.tanggal}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: b.id, judul: b.judul, isi: b.isi, tanggal: b.tanggal })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(b.id)}>Hapus</Button></div></td></tr>
                  ))}
                  {tab === 'galeri' && panel.galeri.map((g) => (
                    <tr key={g.id}><td className={tdCls}><strong>{g.judul}</strong></td><td className={tdCls}>{g.tanggal}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: g.id, judul: g.judul, deskripsi: g.deskripsi, url: g.url, tanggal: g.tanggal })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(g.id)}>Hapus</Button></div></td></tr>
                  ))}
                  {tab === 'pengguna' && panel.pengguna.map((u) => (
                    <tr key={u.id}><td className={tdCls}><strong>{u.nama}</strong><br /><span className="text-xs">{u.username}</span></td><td className={tdCls}>{u.peran}</td>
                      <td className={tdCls}><div className="flex gap-1"><Button kecil varian="sekunder" onClick={() => mulaiEdit({ id: u.id, nama: u.nama, username: u.username, peran: u.peran, siswaId: u.siswaId, password: '' })}>Ubah</Button><Button kecil varian="bahaya" onClick={() => setHapusId(u.id)}>Hapus</Button></div></td></tr>
                  ))}
                </tbody>
              </table>
            </TabelResponsif>
          </Card>
        </>
      )}
      {hapusId && <ConfirmDialog judul="Hapus data?" pesan="Data yang dihapus tidak bisa dikembalikan." onYa={hapus} onBatal={() => setHapusId('')} loading={sibuk} />}
    </div>
  );
}
