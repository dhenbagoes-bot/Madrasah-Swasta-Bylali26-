import { useState } from 'react';
import { login } from '../services/gasApi';
import type { PageProps } from './PageProps';
import { Button, Card, Field, PageHeader, TextInput } from '../components/ui';

export default function Login({ pengaturan, refreshPanel, toast, pindah, onAuthChange }: PageProps & { onAuthChange: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const masuk = async () => {
    if (!username.trim() || !password) { toast('Isi username dan kata sandi.', 'error'); return; }
    setSibuk(true);
    try {
      const u = await login(username, password);
      onAuthChange();
      await refreshPanel();
      toast(`Selamat datang, ${u.nama} (${u.peran}).`, 'sukses');
      pindah('dashboard');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Login gagal.', 'error');
    } finally { setSibuk(false); }
  };
  return (
    <div>
      <PageHeader judul="Login Portal" subjudul={`Portal ${pengaturan.namaSekolah} — Admin, Guru, Siswa, dan Orang Tua.`} />
      <Card className="mx-auto max-w-md">
        <form onSubmit={(e) => { e.preventDefault(); masuk(); }} className="space-y-4">
          <Field label="Username"><TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="mis. admin" autoComplete="username" /></Field>
          <Field label="Kata Sandi"><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></Field>
          <Button type="submit" className="w-full" loading={sibuk}>Masuk</Button>
        </form>
        <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800">
          <p className="font-bold">Akun bawaan (setelah Inisialisasi Database):</p>
          <p>Admin: admin / admin123 • Guru: guru / guru123</p>
          <p>Siswa: siswa / siswa123 • Orang Tua: ortu / ortu123</p>
          <p className="mt-1 font-semibold text-red-700">Segera ganti kata sandi bawaan di Kelola Data → Pengguna!</p>
        </div>
      </Card>
    </div>
  );
}
