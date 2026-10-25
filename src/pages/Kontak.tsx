import type { PageProps } from './PageProps';
import { Card, PageHeader } from '../components/ui';

export default function Kontak({ pengaturan }: PageProps) {
  return (
    <div>
      <PageHeader judul="Kontak" subjudul="Hubungi madrasah kami." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-bold text-emerald-950">{pengaturan.namaSekolah}</h3>
          <dl className="mt-3 space-y-2 text-sm text-emerald-800">
            <div><dt className="font-semibold">Alamat</dt><dd>{pengaturan.alamatSekolah || '—'}</dd></div>
            <div><dt className="font-semibold">Telepon</dt><dd>{pengaturan.telepon || '—'}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd>{pengaturan.email ? <a className="underline" href={`mailto:${pengaturan.email}`}>{pengaturan.email}</a> : '—'}</dd></div>
            <div><dt className="font-semibold">Tahun Ajaran</dt><dd>{pengaturan.tahunAjaran}</dd></div>
            {pengaturan.namaKepala && <div><dt className="font-semibold">Kepala Madrasah</dt><dd>{pengaturan.namaKepala}</dd></div>}
          </dl>
        </Card>
        <Card>
          <h3 className="font-bold text-emerald-950">Jam Layanan</h3>
          <p className="mt-3 text-sm text-emerald-800">Senin–Jumat: 07.00–15.00 WIB<br />Sabtu: 07.00–12.00 WIB<br />Minggu &amp; hari libur: tutup</p>
          <p className="mt-3 text-sm text-emerald-700">Untuk pendaftaran siswa baru, silakan buka halaman PPDB. Untuk urusan akademik, login ke portal sesuai peran Anda (Admin, Guru, Siswa, atau Orang Tua).</p>
        </Card>
      </div>
    </div>
  );
}
