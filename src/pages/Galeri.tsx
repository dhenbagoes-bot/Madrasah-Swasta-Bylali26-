import type { PageProps } from './PageProps';
import { Card, EmptyState, PageHeader } from '../components/ui';

export default function Galeri({ publik }: PageProps) {
  return (
    <div>
      <PageHeader judul="Galeri" subjudul="Dokumentasi kegiatan madrasah." />
      {publik.galeri.length === 0 && <EmptyState judul="Galeri masih kosong" subjudul="Foto kegiatan akan tampil di sini setelah admin menambahkannya." />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {publik.galeri.map((g) => (
          <Card key={g.id} className="overflow-hidden !p-0">
            {g.url ? (
              <img src={g.url} alt={g.judul} className="h-48 w-full object-cover" />
            ) : (
              <div className="grid h-48 place-items-center bg-emerald-50 text-4xl">🖼️</div>
            )}
            <div className="p-4">
              <p className="font-semibold text-emerald-950">{g.judul}</p>
              {g.deskripsi && <p className="mt-1 text-sm text-emerald-700">{g.deskripsi}</p>}
              <p className="mt-2 text-xs text-emerald-500">{g.tanggal}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
