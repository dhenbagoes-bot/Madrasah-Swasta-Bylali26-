import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import type { ToastMsg } from '../types';

export function Spinner({ kecil = false }: { kecil?: boolean }) {
  return <Loader2 className={`${kecil ? 'h-4 w-4' : 'h-8 w-8'} animate-spin text-emerald-600`} />;
}
export function LoadingBlock({ teks = 'Memuat...' }: { teks?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-emerald-800">
      <Spinner /><p className="text-sm">{teks}</p>
    </div>
  );
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</div>;
}
export function PageHeader({ judul, subjudul, aksi }: { judul: string; subjudul?: string; aksi?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-emerald-950 sm:text-2xl">{judul}</h1>
        {subjudul && <p className="mt-1 text-sm text-emerald-700/80">{subjudul}</p>}
      </div>
      {aksi && <div className="flex flex-wrap gap-2">{aksi}</div>}
    </div>
  );
}
type BtnVarian = 'primer' | 'sekunder' | 'bahaya' | 'hijau';
export function Button({ children, onClick, varian = 'primer', disabled = false, loading = false, type = 'button', className = '', kecil = false }: {
  children: ReactNode; onClick?: () => void; varian?: BtnVarian; disabled?: boolean; loading?: boolean;
  type?: 'button' | 'submit'; className?: string; kecil?: boolean;
}) {
  const warna: Record<BtnVarian, string> = {
    primer: 'bg-emerald-600 text-white hover:bg-emerald-700',
    sekunder: 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200',
    bahaya: 'bg-red-600 text-white hover:bg-red-700',
    hijau: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${kecil ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'} ${warna[varian]} ${className}`}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}{children}
    </button>
  );
}
export function Field({ label, error, children, className = '' }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-emerald-900">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
const inputCls = 'w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-emerald-50 disabled:text-emerald-400';
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function TextAreaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows || 3} className={`${inputCls} resize-y ${props.className || ''}`} />;
}
export function EmptyState({ judul, subjudul }: { judul: string; subjudul?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-10 text-center">
      <p className="font-semibold text-emerald-800">{judul}</p>
      {subjudul && <p className="mt-1 text-sm text-emerald-600">{subjudul}</p>}
    </div>
  );
}
export function Modal({ judul, onTutup, children, lebar = 'max-w-lg', nonDismissable = false }: {
  judul: string; onTutup: () => void; children: ReactNode; lebar?: string; nonDismissable?: boolean;
}) {
  useEffect(() => {
    if (nonDismissable) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onTutup, nonDismissable]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={nonDismissable ? undefined : onTutup}>
      <div className={`w-full ${lebar} max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-emerald-950">{judul}</h2>
          {!nonDismissable && (
            <button onClick={onTutup} className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-50 hover:text-emerald-700" aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
export function ConfirmDialog({ judul, pesan, teksYa = 'Ya, Lanjutkan', varian = 'bahaya', onYa, onBatal, loading = false }: {
  judul: string; pesan: string; teksYa?: string; varian?: BtnVarian; onYa: () => void; onBatal: () => void; loading?: boolean;
}) {
  return (
    <Modal judul={judul} onTutup={onBatal} lebar="max-w-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2.5"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
        <p className="text-sm text-emerald-800">{pesan}</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button varian="sekunder" onClick={onBatal} disabled={loading}>Batal</Button>
        <Button varian={varian} onClick={onYa} loading={loading}>{teksYa}</Button>
      </div>
    </Modal>
  );
}
export function Toasts({ daftar, onTutup }: { daftar: ToastMsg[]; onTutup: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {daftar.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.tipe === 'sukses' ? 'bg-emerald-600' : t.tipe === 'error' ? 'bg-red-600' : 'bg-emerald-800'}`}>
          {t.tipe === 'sukses' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : t.tipe === 'error' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5 shrink-0" />}
          <span className="flex-1">{t.pesan}</span>
          <button onClick={() => onTutup(t.id)} className="rounded p-0.5 hover:bg-white/20" aria-label="Tutup notifikasi"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
export function useJam() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' • ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
export function Badge({ warna, children }: { warna: 'hijau' | 'merah' | 'kuning' | 'biru' | 'abu'; children: ReactNode }) {
  const cls: Record<string, string> = {
    hijau: 'bg-emerald-100 text-emerald-700', merah: 'bg-red-100 text-red-700',
    kuning: 'bg-amber-100 text-amber-700', biru: 'bg-blue-100 text-blue-700', abu: 'bg-emerald-50 text-emerald-700',
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${cls[warna]}`}>{children}</span>;
}
export function StatCard({ ikon, label, nilai, sub, warna }: { ikon: ReactNode; label: string; nilai: string; sub?: string; warna: 'biru' | 'hijau' | 'kuning' | 'ungu' | 'merah' }) {
  const cls: Record<string, string> = {
    biru: 'bg-blue-100 text-blue-600', hijau: 'bg-emerald-100 text-emerald-600',
    kuning: 'bg-amber-100 text-amber-600', ungu: 'bg-violet-100 text-violet-600', merah: 'bg-red-100 text-red-600',
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
      <div className={`shrink-0 rounded-xl p-3 ${cls[warna]}`}>{ikon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-emerald-700">{label}</p>
        <h3 className="font-mono-num text-2xl font-bold text-emerald-950">{nilai}</h3>
        {sub && <p className="mt-0.5 text-xs text-emerald-500">{sub}</p>}
      </div>
    </div>
  );
}
export function TabelResponsif({ children }: { children: ReactNode }) {
  return <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">{children}</div>;
}
export const thCls = 'border-b border-emerald-100 bg-emerald-50 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-emerald-700 whitespace-nowrap';
export const tdCls = 'border-b border-emerald-50 px-3 py-2.5 text-sm text-emerald-900';
export function KopCetak({ logoUrl, namaSekolah, alamat, telepon, judul, subJudul }: {
  logoUrl?: string; namaSekolah?: string; alamat?: string; telepon?: string; judul: string; subJudul?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-4">
        {logoUrl ? <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 text-3xl">🏫</div>}
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold uppercase text-emerald-950">{namaSekolah || 'Madrasah Swasta Boyolali'}</h2>
          {alamat && <p className="text-xs text-emerald-700">{alamat}</p>}
          {telepon && <p className="text-xs text-emerald-700">Telp: {telepon}</p>}
        </div>
        <div className="w-16" />
      </div>
      <hr className="my-3 border-t-2 border-emerald-900" />
      <h3 className="text-center text-base font-bold text-emerald-950">{judul}</h3>
      {subJudul && <p className="mt-0.5 text-center text-sm text-emerald-700">{subJudul}</p>}
    </div>
  );
}
