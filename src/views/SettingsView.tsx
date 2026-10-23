import type { FormEvent, ReactNode } from "react";
import React, { useEffect, useState } from "react";
import type { PageView } from "../types";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  LayoutDashboard,
  ReceiptText,
  Save,
  ShieldCheck,
  Store,
  Tag,
  Wallet,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";

interface SettingsViewProps {
  onNavigate: (page: PageView) => void;
}

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
}

interface SettingCardProps {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  rows?: number;
  hint?: string;
}

interface MarginFieldProps {
  title: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}

const PRIMARY_BUTTON =
  "bg-[#5f402a] text-white hover:bg-[#795740] focus-visible:ring-[#9a795e]";

const moneyText = (value: number) => `${value.toLocaleString("id-ID")}%`;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const config = {
    success: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      className: "border-green-200 bg-green-50 text-green-800",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4" />,
      className: "border-red-200 bg-red-50 text-red-800",
    },
    info: {
      icon: <Info className="h-4 w-4" />,
      className: "border-[#e5d8ca] bg-[#f5eee5] text-[#5f402a]",
    },
  }[toast.type];

  return (
    <div className="fixed right-4 top-5 z-[100] w-[calc(100%-2rem)] max-w-md print:hidden">
      <Alert
        role="status"
        aria-live="polite"
        className={`flex items-start gap-3 rounded-xl shadow-md ${config.className}`}
      >
        <span className="mt-0.5 shrink-0">{config.icon}</span>

        <AlertDescription className="flex-1 text-sm leading-5">
          {toast.message}
        </AlertDescription>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Tutup notifikasi"
          className="h-7 w-7 shrink-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}

function SettingCard({
  title,
  description,
  icon,
  children,
  className = "",
}: SettingCardProps) {
  return (
    <Card className={`rounded-xl border-stone-200 shadow-none ${className}`}>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 border-b border-stone-100 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
          {icon}
        </div>

        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-stone-900">
            {title}
          </CardTitle>

          {description && (
            <CardDescription className="mt-1 text-xs leading-5 text-stone-500">
              {description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  rows,
  hint,
}: TextFieldProps) {
  const id = React.useId();

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-stone-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </Label>

      {rows ? (
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className="min-h-24 resize-y border-stone-200 bg-white text-sm focus-visible:ring-[#9a795e]"
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className="h-10 border-stone-200 bg-white text-sm focus-visible:ring-[#9a795e]"
        />
      )}

      {hint && <p className="text-[11px] leading-4 text-stone-500">{hint}</p>}
    </div>
  );
}

function MarginField({
  title,
  description,
  value,
  onChange,
}: MarginFieldProps) {
  const id = React.useId();

  const updateValue = (rawValue: string) => {
    if (rawValue.trim() === "") {
      onChange(0);
      return;
    }

    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed)) return;

    onChange(Math.min(100, Math.max(0, parsed)));
  };

  return (
    <div className="min-w-0 rounded-xl border border-stone-200 bg-[#fcf9f4] p-4">
      <Label htmlFor={id} className="text-sm font-semibold text-stone-900">
        {title}
      </Label>

      <p className="mt-1 min-h-8 text-[11px] leading-4 text-stone-500">
        {description}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className="h-10 min-w-0 border-stone-200 bg-white text-right font-mono text-lg font-semibold text-[#5f402a] focus-visible:ring-[#9a795e]"
        />

        <span className="text-sm font-semibold text-stone-600">%</span>
      </div>

      <Progress
        value={value}
        aria-label={`Target margin ${title}`}
        className="mt-4 h-1.5 bg-stone-200 [&>div]:bg-[#5f402a]"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-stone-500">Target margin</span>
        <span className="font-mono text-xs font-semibold text-[#5f402a]">
          {moneyText(value)}
        </span>
      </div>
    </div>
  );
}

function QuickLink({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="group h-auto w-full justify-start gap-3 whitespace-normal rounded-lg border-stone-200 bg-white px-3 py-3 text-left hover:bg-stone-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-stone-900">
          {title}
        </span>
        <span className="mt-1 block text-[11px] font-normal leading-4 text-stone-500">
          {description}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5" />
    </Button>
  );
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const [atelierName, setAtelierName] = useState("FurniERP Atelier Jepara");
  const [ownerName, setOwnerName] = useState("Hendra Wijaya");
  const [phone, setPhone] = useState("+62 811-9876-5432");
  const [email, setEmail] = useState("billing@furnierp.id");
  const [address, setAddress] = useState(
    "Jl. Bung Karno No.100, Pagutan Tim., Kec. Mataram, Kota Mataram.",
  );

  const [retailMargin, setRetailMargin] = useState(48);
  const [resellerMargin, setResellerMargin] = useState(38);
  const [grosirMargin, setGrosirMargin] = useState(32);

  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      retailMargin < 0 ||
      retailMargin > 100 ||
      resellerMargin < 0 ||
      resellerMargin > 100 ||
      grosirMargin < 0 ||
      grosirMargin > 100
    ) {
      showToast("Margin harus berada di antara 0–100%.", "error");
      return;
    }

    // TODO: Sambungkan ke API/backend untuk penyimpanan permanen.
    showToast(
      "Validasi berhasil. Penyimpanan permanen memerlukan koneksi backend.",
      "info",
    );
  };

  return (
    <div className="flex w-full flex-col gap-5 text-stone-900">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Pengaturan</h1>
            <Badge
              variant="outline"
              className="border-stone-200 bg-white font-normal text-stone-500"
            >
              Pemilik
            </Badge>
          </div>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-500">
            Kelola profil usaha, informasi pada faktur, dan standar margin harga
            untuk setiap tier pelanggan.
          </p>
        </div>
      </header>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12"
      >
        <div className="min-w-0 space-y-5 xl:col-span-8">
          <SettingCard
            title="Profil bisnis"
            description="Informasi usaha yang digunakan pada dokumen penjualan dan komunikasi pelanggan."
            icon={<Store className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Nama atelier / badan usaha"
                value={atelierName}
                onChange={setAtelierName}
                placeholder="Nama usaha"
                required
              />

              <TextField
                label="Nama owner / pengrajin utama"
                value={ownerName}
                onChange={setOwnerName}
                placeholder="Nama pemilik"
                required
              />

              <TextField
                label="Nomor WhatsApp resmi"
                value={phone}
                onChange={setPhone}
                placeholder="+62..."
                required
              />

              <TextField
                label="Email billing & faktur"
                value={email}
                onChange={setEmail}
                placeholder="billing@contoh.id"
                type="email"
              />

              <div className="sm:col-span-2">
                <TextField
                  label="Alamat workshop / pabrik"
                  value={address}
                  onChange={setAddress}
                  placeholder="Alamat lengkap usaha"
                  rows={3}
                  hint="Alamat ini dapat digunakan sebagai kop pada faktur penjualan."
                />
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title="Standar margin harga"
            description="Atur target margin untuk Retail, Reseller, dan Grosir."
            icon={<Tag className="h-5 w-5" />}
          >
            <Alert className="mb-4 border-stone-200 bg-stone-50 text-stone-700">
              <Info className="h-4 w-4 text-[#5f402a]" />
              <AlertDescription className="text-xs leading-5">
                Nilai ini masih berupa konfigurasi lokal pada halaman.
                Pengaruhnya terhadap harga produk dan POS perlu dihubungkan
                dengan logika perhitungan harga pada sistem.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <MarginField
                title="Retail"
                description="Penjualan langsung ke konsumen showroom."
                value={retailMargin}
                onChange={setRetailMargin}
              />

              <MarginField
                title="Reseller"
                description="Harga khusus mitra dan toko mebel."
                value={resellerMargin}
                onChange={setResellerMargin}
              />

              <MarginField
                title="Grosir"
                description="Pesanan volume besar dan proyek."
                value={grosirMargin}
                onChange={setGrosirMargin}
              />
            </div>

            <Separator className="my-4 bg-stone-200" />

            <p className="text-[11px] leading-5 text-stone-500">
              Catatan: margin terhadap harga jual berbeda dari markup terhadap
              HPP. Pastikan rumus yang dipakai pada POS sesuai kebijakan harga
              usaha.
            </p>
          </SettingCard>
        </div>

        <aside className="min-w-0 space-y-5 xl:col-span-4">
          <Card className="rounded-xl border-stone-200 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
                  <Save className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className="text-sm font-semibold">
                    Simpan konfigurasi
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs leading-5">
                    Periksa profil dan margin sebelum menyimpan perubahan.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Separator className="mb-4 bg-stone-200" />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-stone-500">Tier harga</span>
                  <span className="font-semibold text-stone-700">3 tier</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-stone-500">Retail</span>
                  <span className="font-mono font-semibold">
                    {retailMargin}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-stone-500">Reseller</span>
                  <span className="font-mono font-semibold">
                    {resellerMargin}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-stone-500">Grosir</span>
                  <span className="font-mono font-semibold">
                    {grosirMargin}%
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className={`mt-5 h-10 w-full gap-2 text-sm ${PRIMARY_BUTTON}`}
              >
                <Save className="h-4 w-4" />
                Simpan perubahan
              </Button>

              <p className="mt-3 text-center text-[11px] leading-4 text-stone-500">
                Perubahan belum tersimpan secara permanen.
              </p>
            </CardContent>
          </Card>

          <SettingCard
            title="Navigasi cepat"
            description="Buka halaman terkait pengaturan."
            icon={<LayoutDashboard className="h-5 w-5" />}
          >
            <div className="space-y-2">
              <QuickLink
                icon={<LayoutDashboard className="h-4 w-4" />}
                title="Dashboard utama"
                description="Ringkasan aktivitas dan keuangan usaha."
                onClick={() => onNavigate("dashboard")}
              />

              <QuickLink
                icon={<ReceiptText className="h-4 w-4" />}
                title="Pratinjau faktur"
                description="Lihat contoh nota penjualan dan tagihan."
                onClick={() => onNavigate("invoice-detail")}
              />
            </div>
          </SettingCard>

          <Alert className="rounded-xl border-stone-200 bg-[#f0ede9] text-stone-700">
            <ShieldCheck className="h-4 w-4 text-[#5f402a]" />

            <AlertDescription>
              <p className="text-xs font-semibold text-stone-800">
                Pengaturan pemilik
              </p>
              <p className="mt-1 text-[11px] leading-5 text-stone-600">
                Untuk penggunaan produksi, simpan konfigurasi di backend agar
                data tetap tersedia setelah halaman dimuat ulang atau dibuka
                dari perangkat lain.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-3">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
            <p className="text-[11px] leading-5 text-stone-500">
              Perubahan margin pada halaman ini belum otomatis mengubah harga
              produk, harga POS, atau transaksi yang sudah tercatat.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
};
