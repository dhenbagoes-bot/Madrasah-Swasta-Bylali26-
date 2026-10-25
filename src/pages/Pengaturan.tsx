import { useState } from 'react';
import { savePengaturan } from '../services/gasApi';
import type { PageProps } from './PageProps';
import { Button, Card, Field, PageHeader, TextInput } from '../components/ui';

export default function Pengaturan({ user, pengaturan, toast, refreshPublik, refreshPanel, onNeedLogin }: PageProps) {
  const [form, setForm] = useState(pengaturan);
  const [sibuk, setSibuk] = useState(false);
  if (!user) { onNeedLogin(); return <Card><p className="text-sm text-emerald-800">Silakan masuk dulu.</p></Card>; }
  if (user.peran !== 'admin') {
    return <Card><p className="text-sm text-emerald-800">Halaman Pengaturan khusus admin.</p></Card>;
  }
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const simpan = async () => {
    if (!form.namaSekolah.trim()) { toast('Nama sekolah wajib diisi.', 'error'); return; }
    setSibuk(true);
    try {
      await savePengaturan(form);
      toast('Pengaturan tersimpan. Nama sekolah baru langsung tampil di navbar, hero, dan footer.', 'sukses');
      await refreshPublik(); await refreshPanel();
    } catch (e) { toast(e instanceof Error ? e.message : 'Gagal menyimpan pengaturan.', 'error'); }
    finally { setSibuk(false); }
  };
  return (
    <div>
      <PageHeader judul="Pengaturan" subjudul="Ubah identitas madrasah di sini — semua halaman publik membaca nama dari pengaturan ini, bukan hardcode." />
      <Card className="max-w-2xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Sekolah *"><TextInput value={form.namaSekolah} onChange={(e) => set('namaSekolah', e.target.value)} /></Field>
          <Field label="Singkatan"><TextInput value={form.singkatan} onChange={(e) => set('singkatan', e.target.value)} placeholder="MSB" /></Field>
          <Field label="Alamat" className="sm:col-span-2"><TextInput value={form.alamatSekolah} onChange={(e) => set('alamatSekolah', e.target.value)} /></Field>
          <Field label="Telepon"><TextInput value={form.telepon} onChange={(e) => set('telepon', e.target.value)} /></Field>
          <Field label="Email"><TextInput value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Tahun Ajaran"><TextInput value={form.tahunAjaran} onChange={(e) => set('tahunAjaran', e.target.value)} placeholder="2025/2026" /></Field>
          <Field label="Kepala Madrasah"><TextInput value={form.namaKepala} onChange={(e) => set('namaKepala', e.target.value)} /></Field>
        </div>
        <Button className="mt-5" onClick={simpan} loading={sibuk}>Simpan Pengaturan</Button>
      </Card>
    </div>
  );
}
