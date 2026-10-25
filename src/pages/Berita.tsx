import { useState } from 'react';
import type { PageProps } from './PageProps';
import { Button, Card, EmptyState, PageHeader } from '../components/ui';

export default function Berita({ publik }: PageProps) {
  const [pilih, setPilih] = useState<string | null>(null);
  const daftar = publik.berita;
  const aktif = daftar.find((b) => b.id === pilih);
  return (
    <div>
      <PageHeader judul="Berita Sekolah" subjudul="Kabar terbaru dari madrasah." />
      {daftar.length === 0 && <EmptyState judul="Belum ada berita" subjudul="Berita akan tampil di sini setelah admin menambahkannya." />}
      {aktif ? (
        <Card>
          <p className="text-xs text-emerald-600">{aktif.tanggal}</p>
          <h2 className="mt-1 text-xl font-bold text-emerald-950">{aktif.judul}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-emerald-800">{aktif.isi}</p>
          <Button varian="sekunder" className="mt-4" onClick={() => setPilih(null)}>← Kembali ke daftar</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {daftar.map((b) => (
            <Card key={b.id} className="flex flex-col">
              <div className="grid h-24 place-items-center rounded-xl bg-emerald-50 text-3xl">📰</div>
              <p className="mt-3 text-xs text-emerald-600">{b.tanggal}</p>
              <h6 className="mt-1 font-semibold text-emerald-950">{b.judul}</h6>
              <p className="mt-1 line-clamp-3 text-sm text-emerald-700">{b.isi}</p>
              <Button varian="sekunder" kecil className="mt-3 self-start" onClick={() => setPilih(b.id)}>Baca Selengkapnya →</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
