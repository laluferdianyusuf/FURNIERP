import React, { useState } from "react";
import { PageView } from "../types";

interface InvoiceDetailViewProps {
  onNavigate: (page: PageView) => void;
}

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
}

interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "success" | "subtle";
  className?: string;
  title?: string;
  icon?: string;
}

interface InfoRowProps {
  label: string;
  value: string;
  className?: string;
}

interface InvoiceItem {
  id: number;
  name: string;
  description: string;
  sku?: string;
  quantity: string;
  unitPrice: number;
  subtotal: number;
  discount?: boolean;
}

const COLORS = {
  background: "#f6f3ee",
  surface: "#fcf9f4",
  mutedSurface: "#f0ede9",
  border: "#e5e2dd",
  brown: "#5f402a",
  brownHover: "#795740",
  text: "#1c1c19",
  secondary: "#50453e",
  muted: "#82746d",
  green: "#28734b",
  greenBg: "#edf5ee",
  amber: "#94651d",
  amberBg: "#fbf2df",
  red: "#a3443f",
  redBg: "#f9eeeb",
};

const INVOICE = {
  number: "INV-20241023-004",
  spk: "SPK-2024-098",
  date: "23 Oktober 2024",
  time: "14:32 WIB",
  customer: "Toko Mebel Subur Makmur",
  customerCompany: "CV Subur Mandiri",
  customerContact: "H. Subur Hartanto",
  customerPhone: "0812-3344-9001",
  whatsapp: "6281233449001",
  total: 10_800_000,
  downPayment: 5_000_000,
  subtotal: 11_220_000,
  discount: 420_000,
  remaining: 5_800_000,
};

const ITEMS: InvoiceItem[] = [
  {
    id: 1,
    name: "Meja Makan Trembesi 200cm",
    description:
      "Kayu Suar Solid Slab 8cm · Natural Matte PU · Kaki Hollow Sandblast",
    sku: "TB-TRM-200",
    quantity: "1 Unit",
    unitPrice: 4_200_000,
    subtotal: 4_200_000,
  },
  {
    id: 2,
    name: "Kursi Makan Wishbone CH24 Jati",
    description:
      "Kayu Jati Solid TPK · Bleached Danish Oil · Anyaman Paper Cord",
    sku: "KR-WBN-01",
    quantity: "6 Unit",
    unitPrice: 920_000,
    subtotal: 5_520_000,
  },
  {
    id: 3,
    name: "Ongkos Ekspedisi & Packing Palet Kayu",
    description: "Carter truk Jepara–Surabaya, termasuk asuransi pengiriman",
    quantity: "1 Lot",
    unitPrice: 1_500_000,
    subtotal: 1_500_000,
  },
  {
    id: 4,
    name: "Jasa Instalasi & Setting di Tempat",
    description: "Promosi khusus pelanggan grosir",
    quantity: "1 Paket",
    unitPrice: 250_000,
    subtotal: 0,
    discount: true,
  },
];

const BANK_ACCOUNTS = [
  {
    name: "Bank BCA",
    type: "Giro Bisnis",
    number: "0329182111",
    displayNumber: "032-9182-111",
    owner: "PT ATELIER FURNI MANDIRI",
  },
  {
    name: "Bank Mandiri",
    type: "Giro",
    number: "1370098214455",
    displayNumber: "137-00-9821-4455",
    owner: "PT ATELIER FURNI MANDIRI",
  },
];

const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

const paymentPercentage = Number(
  ((INVOICE.downPayment / INVOICE.total) * 100).toFixed(1),
);

const formatDateForPrint = "23/10/2024";

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

function ActionButton({
  children,
  onClick,
  variant = "secondary",
  className = "",
  title,
  icon,
}: ActionButtonProps) {
  const variants: Record<NonNullable<ActionButtonProps["variant"]>, string> = {
    primary:
      "bg-[#5f402a] text-white hover:bg-[#795740] border border-transparent",
    secondary:
      "bg-[#fcf9f4] text-[#50453e] border border-[#e5e2dd] hover:bg-[#f0ede9]",
    success:
      "bg-[#28734b] text-white border border-transparent hover:bg-[#205e3c]",
    subtle:
      "bg-transparent text-[#50453e] border border-transparent hover:bg-[#f0ede9]",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg",
        "px-3.5 py-2.5 text-xs font-semibold",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a795e]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      ].join(" ")}
    >
      {icon && <Icon name={icon} className="text-[18px]" />}
      {children}
    </button>
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
        "fixed right-4 top-5 z-[100] flex max-w-[calc(100vw-2rem)]",
        "items-start gap-3 rounded-xl border px-4 py-3 shadow-lg",
        "print:hidden",
        styles[toast.type],
      ].join(" ")}
    >
      <Icon name={icons[toast.type]} className="text-[19px]" />
      <p className="text-xs font-medium leading-5">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="ml-1 rounded p-0.5 opacity-70 hover:opacity-100"
      >
        <Icon name="close" className="text-[17px]" />
      </button>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  action,
  className = "",
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-xl border border-[#e5e2dd] bg-[#fcf9f4]",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#e5e2dd] px-4 py-3.5">
        <h2 className="flex items-center gap-2 text-xs font-bold text-[#50453e]">
          {icon && <Icon name={icon} className="text-[18px] text-[#5f402a]" />}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, className = "" }: InfoRowProps) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4 text-xs",
        className,
      ].join(" ")}
    >
      <span className="text-[#82746d]">{label}</span>
      <span className="text-right font-medium text-[#1c1c19]">{value}</span>
    </div>
  );
}

function InvoiceItemTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-y border-[#e5e2dd] bg-[#f0ede9] text-[10px] uppercase tracking-wide text-[#82746d]">
            <th className="px-3 py-3 font-semibold">No.</th>
            <th className="px-3 py-3 font-semibold">Produk & spesifikasi</th>
            <th className="px-3 py-3 text-center font-semibold">Qty</th>
            <th className="px-3 py-3 text-right font-semibold">Harga satuan</th>
            <th className="px-3 py-3 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e2dd]">
          {ITEMS.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="px-3 py-4 text-center font-mono text-[#82746d]">
                {item.id}
              </td>
              <td className="px-3 py-4">
                <p className="font-semibold leading-5 text-[#1c1c19]">
                  {item.name}
                </p>
                <p className="mt-1 max-w-sm leading-5 text-[#82746d]">
                  {item.description}
                </p>
                {item.sku && (
                  <p className="mt-1 font-mono text-[10px] text-[#5f402a]">
                    SKU: {item.sku}
                  </p>
                )}
                {item.discount && (
                  <span className="mt-1.5 inline-block text-[10px] font-medium text-[#28734b]">
                    Diskon promosi
                  </span>
                )}
              </td>
              <td className="px-3 py-4 text-center font-mono font-medium">
                {item.quantity}
              </td>
              <td className="px-3 py-4 text-right font-mono whitespace-nowrap">
                {formatRupiah(item.unitPrice)}
              </td>
              <td
                className={[
                  "px-3 py-4 text-right font-mono font-semibold whitespace-nowrap",
                  item.discount ? "text-[#28734b]" : "text-[#1c1c19]",
                ].join(" ")}
              >
                {formatRupiah(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceTotals() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-4 text-xs text-[#50453e]">
        <span>Subtotal bruto</span>
        <span className="font-mono">{formatRupiah(INVOICE.subtotal)}</span>
      </div>
      <div className="flex justify-between gap-4 text-xs text-[#a3443f]">
        <span>Diskon negosiasi</span>
        <span className="font-mono">− {formatRupiah(INVOICE.discount)}</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-[#e5e2dd] pt-3 text-sm font-bold text-[#1c1c19]">
        <span>Total tagihan</span>
        <span className="font-mono">{formatRupiah(INVOICE.total)}</span>
      </div>
      <div className="flex justify-between gap-4 rounded-lg bg-[#edf5ee] px-3 py-2.5 text-xs text-[#28734b]">
        <span>DP diterima</span>
        <span className="font-mono font-bold">
          {formatRupiah(INVOICE.downPayment)}
        </span>
      </div>
      <div className="flex justify-between gap-4 rounded-lg bg-[#f9eeeb] px-3 py-2.5 text-sm font-bold text-[#a3443f]">
        <span>Sisa pelunasan</span>
        <span className="font-mono">{formatRupiah(INVOICE.remaining)}</span>
      </div>
    </div>
  );
}

function InvoicePaper() {
  return (
    <article
      id="printSheet"
      className={[
        "invoice-paper relative overflow-hidden",
        "rounded-xl border border-[#e5e2dd] bg-white",
        "p-5 sm:p-8 xl:p-9",
        "text-xs text-[#1c1c19] shadow-sm",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute right-4 top-32 select-none opacity-[0.025] print:hidden">
        <span className="font-serif text-7xl font-black tracking-widest">
          FURNI
        </span>
      </div>

      {/* Kop faktur */}
      <header className="relative flex flex-col justify-between gap-5 border-b-2 border-[#5f402a] pb-5 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#5f402a] text-white print:border print:border-[#5f402a] print:bg-transparent print:text-[#5f402a]">
            <Icon name="chair" className="text-[27px]" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold tracking-tight text-[#5f402a]">
              FURNIERP ATELIER
            </h2>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#82746d]">
              Workshop Jepara
            </p>
            <p className="mt-2 max-w-xs leading-5 text-[#50453e]">
              Bespoke Solid Woodworks & Premium Teak Craftsmanship
              <br />
              Jl. Bung Karno No.100, Pagutan Tim., Kec. Mataram, Kota Mataram.
              <br />
              WA: +62 811-9876-5432
              <br />
              billing@furnierp.id
            </p>
          </div>
        </div>

        <div className="sm:min-w-[180px] sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#82746d]">
            Faktur penjualan
          </p>
          <p className="mt-1 break-all font-mono text-sm font-bold text-[#1c1c19]">
            {INVOICE.number}
          </p>
          <p className="mt-1 text-[11px] text-[#50453e]">
            No. SPK:{" "}
            <span className="font-mono font-semibold">{INVOICE.spk}</span>
          </p>
          <p className="mt-2 text-[10px] text-[#82746d]">
            Tanggal: {formatDateForPrint} · {INVOICE.time}
          </p>
        </div>
      </header>

      {/* Informasi pelanggan */}
      <section className="grid grid-cols-1 gap-5 border-b border-[#e5e2dd] py-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#82746d]">
            Ditagihkan kepada
          </p>
          <p className="text-sm font-bold text-[#1c1c19]">{INVOICE.customer}</p>
          <p className="mt-1 text-[#50453e]">{INVOICE.customerCompany}</p>
          <p className="text-[#50453e]">{INVOICE.customerContact}</p>
          <p className="mt-1 leading-5 text-[#82746d]">
            Jl. Bung Karno No.100, Pagutan Tim., Kec. Mataram, Kota Mataram.
          </p>
          <p className="mt-1 font-mono text-[#5f402a]">
            WA: {INVOICE.customerPhone}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#82746d]">
            Pembayaran & pengiriman
          </p>
          <p className="font-semibold text-[#1c1c19]">Uang muka / DP termin</p>
          <p className="mt-1 text-[#50453e]">Tunai showroom</p>
          <p className="mt-1 text-[#82746d]">Target kirim: 28 Oktober 2024</p>
          <p className="mt-2 font-semibold text-[#94651d]">
            Menunggu pelunasan sebelum pengiriman
          </p>
        </div>
      </section>

      {/* Rincian produk */}
      <section className="py-5">
        <InvoiceItemTable />
      </section>

      {/* Total dan ketentuan */}
      <section className="grid grid-cols-1 gap-6 border-t border-[#e5e2dd] pt-5 md:grid-cols-[1fr_280px]">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#82746d]">
            Ketentuan garansi & pengiriman
          </p>
          <ol className="list-decimal space-y-1.5 pl-4 leading-5 text-[#50453e]">
            <li>
              Garansi konstruksi kayu selama satu tahun terhadap retak atau
              pecah akibat konstruksi.
            </li>
            <li>
              Sisa pelunasan diselesaikan sebelum barang dimuat ke armada
              ekspedisi.
            </li>
            <li>Serat dan warna kayu solid memiliki variasi alami.</li>
          </ol>
        </div>
        <InvoiceTotals />
      </section>

      {/* Tanda tangan */}
      <section className="mt-8 grid grid-cols-2 gap-6 border-t border-[#e5e2dd] pt-5 text-center">
        <div>
          <p className="text-[11px] text-[#50453e]">Penerima / Pelanggan</p>
          <div className="h-16" />
          <p className="font-bold underline decoration-[#82746d] underline-offset-4">
            H. Subur Hartanto
          </p>
          <p className="mt-1 text-[10px] text-[#82746d]">
            Toko Mebel Subur Makmur
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#50453e]">
            Hormat kami, FurniERP Atelier
          </p>
          <div className="h-16" />
          <p className="font-bold underline decoration-[#82746d] underline-offset-4">
            Hendra Wijaya
          </p>
          <p className="mt-1 text-[10px] text-[#82746d]">
            Owner & Atelier Master
          </p>
        </div>
      </section>

      <footer className="mt-7 border-t border-dashed border-[#e5e2dd] pt-3 text-center text-[10px] text-[#82746d]">
        Terima kasih atas kepercayaan Anda kepada FurniERP Atelier.
      </footer>
    </article>
  );
}

function PaymentStatusCard({
  onNavigate,
}: {
  onNavigate: (page: PageView) => void;
}) {
  return (
    <SectionCard
      title="Status pembayaran"
      icon="payments"
      action={
        <span className="rounded-md bg-[#fbf2df] px-2 py-1 text-[10px] font-semibold text-[#94651d]">
          DP diterima
        </span>
      }
    >
      <div className="space-y-3">
        <InfoRow label="Total tagihan" value={formatRupiah(INVOICE.total)} />
        <InfoRow
          label={`DP (${paymentPercentage}%)`}
          value={formatRupiah(INVOICE.downPayment)}
          className="text-[#28734b]"
        />
        <div className="space-y-2 border-t border-[#e5e2dd] pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#82746d]">Sisa piutang</span>
            <span className="font-mono text-sm font-bold text-[#a3443f]">
              {formatRupiah(INVOICE.remaining)}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[#e9e4dd]"
            role="progressbar"
            aria-label="Persentase pembayaran"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={paymentPercentage}
          >
            <div
              className="h-full rounded-full bg-[#28734b] transition-all"
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#82746d]">
            <span>{paymentPercentage}% dibayar</span>
            <span>{(100 - paymentPercentage).toFixed(1)}% tersisa</span>
          </div>
        </div>

        <ActionButton
          variant="primary"
          icon="account_balance_wallet"
          onClick={() => onNavigate("receivables")}
          className="w-full"
        >
          Catat pelunasan
        </ActionButton>
      </div>
    </SectionCard>
  );
}

function BankAccountsCard({ onCopy }: { onCopy: (number: string) => void }) {
  return (
    <SectionCard title="Rekening pembayaran" icon="account_balance">
      <div className="space-y-3">
        {BANK_ACCOUNTS.map((account) => (
          <div
            key={account.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e2dd] bg-[#f6f3ee] p-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1c1c19]">
                {account.name}
                <span className="ml-1 font-normal text-[#82746d]">
                  · {account.type}
                </span>
              </p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-[#5f402a]">
                {account.displayNumber}
              </p>
              <p className="mt-1 text-[9px] leading-4 text-[#82746d]">
                a.n. {account.owner}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCopy(account.number)}
              title={`Salin rekening ${account.name}`}
              aria-label={`Salin nomor rekening ${account.name}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] text-[#5f402a] transition-colors hover:bg-[#eae1d7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a795e]"
            >
              <Icon name="content_copy" className="text-[18px]" />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-4 text-[#82746d]">
        Periksa kembali nama penerima dan nomor rekening sebelum melakukan
        transfer.
      </p>
    </SectionCard>
  );
}

function WhatsAppCard({ onShare }: { onShare: () => void }) {
  return (
    <SectionCard title="Kirim ke pelanggan" icon="chat">
      <p className="text-xs leading-5 text-[#82746d]">
        Bagikan ringkasan tagihan kepada {INVOICE.customerContact} melalui
        WhatsApp. Pesan berisi nomor faktur, total tagihan, DP, dan sisa
        pelunasan.
      </p>
      <ActionButton
        variant="success"
        icon="send"
        onClick={onShare}
        className="mt-4 w-full"
      >
        Buka WhatsApp
      </ActionButton>
    </SectionCard>
  );
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  onNavigate,
}) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAccount = async (number: string) => {
    try {
      if (!navigator.clipboard?.writeText) {
        showToast(
          "Clipboard tidak tersedia. Salin nomor rekening secara manual.",
          "error",
        );
        return;
      }

      await navigator.clipboard.writeText(number);
      showToast("Nomor rekening berhasil disalin.", "success");
    } catch {
      showToast(
        "Nomor rekening gagal disalin. Silakan salin secara manual.",
        "error",
      );
    }
  };

  const handleShareWhatsApp = () => {
    const message = [
      "Halo Bpk. H. Subur Hartanto,",
      "",
      "Berikut rincian faktur pesanan mebel Anda di FurniERP Atelier.",
      `No. Faktur: ${INVOICE.number}`,
      `Total tagihan: ${formatRupiah(INVOICE.total)}`,
      `DP diterima: ${formatRupiah(INVOICE.downPayment)}`,
      `Sisa pelunasan: ${formatRupiah(INVOICE.remaining)}`,
      "",
      "Terima kasih atas kepercayaannya!",
    ].join("\n");

    const url = `https://wa.me/${INVOICE.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="invoice-detail flex w-full flex-col gap-5 pt-4 text-[#1c1c19]">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Breadcrumb dan navigasi */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between print:hidden">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-[#82746d]"
        >
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[#5f402a]"
          >
            <Icon name="storefront" className="text-[17px]" />
            FurniERP
          </button>
          <Icon name="chevron_right" className="text-[15px]" />
          <button
            type="button"
            onClick={() => onNavigate("pos")}
            className="transition-colors hover:text-[#5f402a]"
          >
            Penjualan & POS
          </button>
          <Icon name="chevron_right" className="text-[15px]" />
          <span className="font-semibold text-[#5f402a]">Detail faktur</span>
        </nav>

        <ActionButton
          variant="secondary"
          icon="arrow_back"
          onClick={() => onNavigate("pos")}
        >
          Kembali ke POS
        </ActionButton>
      </div>

      {/* Header faktur */}
      <header className="rounded-xl border border-[#e5e2dd] bg-[#fcf9f4] p-4 sm:p-5 print:hidden">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#82746d]">
                Detail penjualan
              </p>
              <span className="rounded-md border border-[#ead8b5] bg-[#fbf2df] px-2 py-1 text-[10px] font-semibold text-[#94651d]">
                Terbayar sebagian
              </span>
            </div>

            <h1 className="mt-2 break-words font-serif text-xl font-semibold tracking-tight text-[#1c1c19] sm:text-2xl">
              {INVOICE.number}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#82746d]">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar_today" className="text-[15px]" />
                {INVOICE.date} · {INVOICE.time}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="person" className="text-[16px]" />
                Hendra Wijaya · Owner
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="assignment" className="text-[16px]" />
                SPK: {INVOICE.spk}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-[#82746d]">
              Pelanggan: {INVOICE.customer} · Tier grosir
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              variant="secondary"
              icon="receipt_long"
              onClick={handlePrint}
            >
              Cetak nota
            </ActionButton>
            <ActionButton variant="primary" icon="print" onClick={handlePrint}>
              Cetak / PDF
            </ActionButton>
            <ActionButton
              variant="success"
              icon="chat"
              onClick={handleShareWhatsApp}
            >
              WhatsApp
            </ActionButton>
          </div>
        </div>
      </header>

      {/* Ringkasan nominal */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 print:hidden">
        <div className="rounded-xl border border-[#e5e2dd] bg-[#fcf9f4] p-4">
          <p className="text-xs text-[#82746d]">Total tagihan</p>
          <p className="mt-2 font-mono text-lg font-bold tracking-tight text-[#1c1c19]">
            {formatRupiah(INVOICE.total)}
          </p>
          <p className="mt-1 text-[10px] text-[#82746d]">Nilai faktur</p>
        </div>
        <div className="rounded-xl border border-[#d7e6d9] bg-[#f5f8f3] p-4">
          <p className="text-xs text-[#627b66]">DP sudah diterima</p>
          <p className="mt-2 font-mono text-lg font-bold tracking-tight text-[#28734b]">
            {formatRupiah(INVOICE.downPayment)}
          </p>
          <p className="mt-1 text-[10px] text-[#627b66]">
            {paymentPercentage}% dari total
          </p>
        </div>
        <div className="rounded-xl border border-[#e9d3cf] bg-[#fcf5f2] p-4">
          <p className="text-xs text-[#94615b]">Sisa piutang</p>
          <p className="mt-2 font-mono text-lg font-bold tracking-tight text-[#a3443f]">
            {formatRupiah(INVOICE.remaining)}
          </p>
          <p className="mt-1 text-[10px] text-[#94615b]">Menunggu pelunasan</p>
        </div>
      </section>

      {/* Konten utama */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <main className="min-w-0 space-y-3 xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 print:hidden">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#50453e]">
              <Icon name="description" className="text-[18px]" />
              Pratinjau faktur
            </h2>
            <span className="text-[10px] text-[#82746d]">
              Format A4 · Data contoh
            </span>
          </div>

          <InvoicePaper />
        </main>

        <aside className="space-y-4 print:hidden xl:col-span-4">
          <PaymentStatusCard onNavigate={onNavigate} />
          <BankAccountsCard onCopy={handleCopyAccount} />
          <WhatsAppCard onShare={handleShareWhatsApp} />
        </aside>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #1c1c19 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden !important;
          }

          #printSheet,
          #printSheet * {
            visibility: visible !important;
          }

          #printSheet {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            font-size: 10px !important;
          }

          #printSheet table {
            font-size: 9px !important;
          }

          #printSheet tr {
            break-inside: avoid;
          }

          #printSheet header,
          #printSheet section,
          #printSheet footer {
            break-inside: avoid;
          }

          #printSheet th,
          #printSheet td {
            padding: 7px 5px !important;
          }

          .invoice-detail {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .invoice-paper {
            color: #1c1c19 !important;
          }
        }
      `}</style>
    </div>
  );
};
