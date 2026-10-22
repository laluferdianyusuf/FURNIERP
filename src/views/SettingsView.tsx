import React, { useState } from "react";
import { PageView } from "../types";

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
  icon?: string;
  children: React.ReactNode;
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

const THEME = {
  background: "#f6f3ee",
  surface: "#fcf9f4",
  subtle: "#f0ede9",
  border: "#e5e2dd",
  primary: "#5f402a",
  primaryHover: "#795740",
  text: "#1c1c19",
  secondary: "#50453e",
  muted: "#82746d",
  green: "#28734b",
  greenBackground: "#edf5ee",
  red: "#a3443f",
  redBackground: "#f9eeeb",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-3 py-2.5 text-sm text-[#1c1c19] outline-none transition-colors placeholder:text-[#a49a91] focus:border-[#9a795e] focus:ring-2 focus:ring-[#9a795e]/15";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
    >
      {name}
    </span>
  );
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const styles: Record<ToastType, string> = {
    success: "border-[#c9dfcf] bg-[#edf5ee] text-[#245b39]",
    error: "border-[#e9c9c5] bg-[#f9eeeb] text-[#943e38]",
    info: "border-[#ded1c2] bg-[#f5eee5] text-[#5f402a]",
  };

  const icons: Record<ToastType, string> = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed right-4 top-5 z-50 flex max-w-[calc(100vw-2rem)]",
        "items-start gap-3 rounded-xl border px-4 py-3 shadow-lg",
        styles[toast.type],
      ].join(" ")}
    >
      <Icon name={icons[toast.type]} className="text-[19px]" />
      <p className="text-xs font-medium leading-5">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="ml-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <Icon name="close" className="text-[17px]" />
      </button>
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
    <section
      className={[
        "rounded-xl border border-[#e5e2dd] bg-[#fcf9f4]",
        className,
      ].join(" ")}
    >
      <div className="border-b border-[#e5e2dd] px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
              <Icon name={icon} className="text-[20px]" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-[#1c1c19]">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-[#82746d]">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
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
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-[#50453e]"
      >
        {label}
        {required && <span className="ml-1 text-[#a3443f]">*</span>}
      </label>

      {rows ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={`${INPUT_CLASS} resize-y leading-5`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={INPUT_CLASS}
        />
      )}

      {hint && (
        <p className="mt-1.5 text-[10px] leading-4 text-[#82746d]">{hint}</p>
      )}
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
    <div className="rounded-xl border border-[#e5e2dd] bg-[#f6f3ee] p-4">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#1c1c19]"
      >
        {title}
      </label>

      <p className="mt-1 min-h-8 text-[11px] leading-4 text-[#82746d]">
        {description}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <input
          id={id}
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className={[
            "w-full min-w-0 rounded-lg border border-[#e5e2dd]",
            "bg-[#fcf9f4] px-3 py-2 text-right font-mono text-lg",
            "font-semibold text-[#5f402a] outline-none",
            "focus:border-[#9a795e] focus:ring-2 focus:ring-[#9a795e]/15",
          ].join(" ")}
        />
        <span className="text-sm font-semibold text-[#50453e]">%</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5e2dd]">
        <div
          className="h-full rounded-full bg-[#5f402a] transition-all"
          style={{ width: `${value}%` }}
        />
      </div>

      <p className="mt-2 text-[10px] text-[#82746d]">Target margin: {value}%</p>
    </div>
  );
}

function QuickLink({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-center gap-3 rounded-lg border",
        "border-[#e5e2dd] bg-[#fcf9f4] p-3 text-left",
        "transition-colors hover:bg-[#f0ede9]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a795e]",
      ].join(" ")}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a] transition-colors group-hover:bg-[#e8ded3]">
        <Icon name={icon} className="text-[19px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#1c1c19]">{title}</p>
        <p className="mt-1 text-[10px] leading-4 text-[#82746d]">
          {description}
        </p>
      </div>

      <Icon name="chevron_right" className="text-[18px] text-[#82746d]" />
    </button>
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

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });

    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3000);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
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

    // Integrasikan penyimpanan ke API/backend di sini.
    // Saat ini nilai hanya tersimpan di state React.
    showToast(
      "Validasi berhasil. Penyimpanan permanen memerlukan koneksi backend.",
      "info",
    );
  };

  return (
    <div className="flex w-full flex-col gap-6 pt-4 text-[#1c1c19]">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header>
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-2 text-xs text-[#82746d]"
        >
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className="transition-colors hover:text-[#5f402a]"
          >
            FurniERP
          </button>
          <Icon name="chevron_right" className="text-[15px]" />
          <span className="font-semibold text-[#5f402a]">Pengaturan</span>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#1c1c19] sm:text-3xl">
              Pengaturan Atelier
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82746d]">
              Kelola profil usaha, informasi pada faktur, dan standar margin
              harga untuk pelanggan retail, reseller, serta grosir.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-3 py-2 text-[10px] text-[#82746d]">
            <Icon name="tune" className="text-[17px] text-[#5f402a]" />
            Preferensi sistem
          </span>
        </div>
      </header>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12"
      >
        {/* Kolom utama */}
        <div className="min-w-0 space-y-5 xl:col-span-8">
          <SettingCard
            title="Profil bisnis"
            description="Informasi usaha yang digunakan pada dokumen penjualan dan komunikasi pelanggan."
            icon="storefront"
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
            description="Atur margin target yang akan menjadi acuan penentuan harga jual produk."
            icon="sell"
          >
            <div className="mb-4 rounded-lg border border-[#e5e2dd] bg-[#f6f3ee] p-3">
              <div className="flex items-start gap-2.5">
                <Icon
                  name="info"
                  className="mt-0.5 text-[18px] text-[#5f402a]"
                />
                <p className="text-xs leading-5 text-[#50453e]">
                  Nilai di bawah merupakan target margin untuk setiap tier
                  pelanggan. Pengaruhnya terhadap harga POS dan harga produk
                  perlu dihubungkan dengan logika perhitungan harga pada sistem.
                </p>
              </div>
            </div>

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

            <div className="mt-4 border-t border-[#e5e2dd] pt-4">
              <p className="text-[11px] leading-5 text-[#82746d]">
                Catatan: jika yang dimaksud adalah margin terhadap harga jual,
                rumusnya berbeda dari markup terhadap HPP. Pastikan rumus yang
                digunakan di POS sesuai kebijakan usaha.
              </p>
            </div>
          </SettingCard>
        </div>

        {/* Kolom samping */}
        <aside className="space-y-5 xl:col-span-4">
          <section className="rounded-xl border border-[#e5e2dd] bg-[#fcf9f4] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
                <Icon name="save" className="text-[21px]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#1c1c19]">
                  Simpan konfigurasi
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#82746d]">
                  Periksa kembali profil dan margin sebelum menyimpan perubahan.
                </p>
              </div>
            </div>

            <div className="my-4 border-t border-[#e5e2dd]" />

            <div className="space-y-2.5">
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#82746d]">Tier harga</span>
                <span className="font-semibold text-[#50453e]">3 tier</span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#82746d]">Retail</span>
                <span className="font-mono font-semibold">{retailMargin}%</span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#82746d]">Reseller</span>
                <span className="font-mono font-semibold">
                  {resellerMargin}%
                </span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#82746d]">Grosir</span>
                <span className="font-mono font-semibold">{grosirMargin}%</span>
              </div>
            </div>

            <button
              type="submit"
              className={[
                "mt-5 inline-flex w-full items-center justify-center gap-2",
                "rounded-lg bg-[#5f402a] px-4 py-3 text-xs font-semibold text-white",
                "transition-colors hover:bg-[#795740]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a795e] focus-visible:ring-offset-2",
              ].join(" ")}
            >
              <Icon name="save" className="text-[18px]" />
              Simpan perubahan
            </button>

            <p className="mt-3 text-center text-[10px] leading-4 text-[#82746d]">
              Perubahan saat ini belum tersimpan secara permanen.
            </p>
          </section>

          <SettingCard
            title="Navigasi cepat"
            description="Buka halaman terkait pengaturan."
            icon="near_me"
          >
            <div className="space-y-2">
              <QuickLink
                icon="dashboard"
                title="Dashboard utama"
                description="Ringkasan aktivitas dan keuangan usaha."
                onClick={() => onNavigate("dashboard")}
              />

              <QuickLink
                icon="receipt_long"
                title="Pratinjau faktur"
                description="Lihat contoh nota penjualan dan tagihan."
                onClick={() => onNavigate("invoice-detail")}
              />
            </div>
          </SettingCard>

          <div className="rounded-xl border border-[#e5e2dd] bg-[#f0ede9] p-4">
            <div className="flex items-start gap-2.5">
              <Icon name="shield" className="text-[19px] text-[#5f402a]" />
              <div>
                <p className="text-xs font-semibold text-[#50453e]">
                  Pengaturan pemilik
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[#82746d]">
                  Untuk penggunaan produksi, simpan konfigurasi di backend agar
                  data tetap tersedia setelah halaman dimuat ulang atau dibuka
                  dari perangkat lain.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};
