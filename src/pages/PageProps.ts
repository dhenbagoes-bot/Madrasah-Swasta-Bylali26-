import type { DataPublik, PageKey, PanelData, Pengaturan, SekolahEntry, ToastMsg, UserSesi } from '../types';

export interface PageProps {
  pengaturan: Pengaturan;
  publik: DataPublik;
  panel: PanelData | null;
  user: UserSesi | null;
  terhubung: boolean;
  onNeedLogin: (adminSaja?: boolean) => void;
  refreshPublik: () => Promise<void>;
  refreshPanel: () => Promise<void>;
  toast: (pesan: string, tipe?: ToastMsg['tipe']) => void;
  pindah: (p: PageKey) => void;
  sekolah: SekolahEntry | null;
  daftarSekolah: SekolahEntry[];
  onGantiSekolah: (s: SekolahEntry) => Promise<void>;
  onApiUrlChange: (url: string) => Promise<void>;
}
