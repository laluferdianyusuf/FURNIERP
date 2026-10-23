import React, { useEffect, useState } from "react";
import type { PageView } from "../types";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  FileText,
  Info,
  LockKeyhole,
  MessageCircle,
  Printer,
  ReceiptText,
  Send,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

interface InvoiceDetailViewProps {
  onNavigate: (page: PageView) => void;
}

type ToastType = "success" | "error" | "info";

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
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

function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-stone-200 px-4 py-3.5">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-800">
        <Icon className="size-[17px] text-[#5f402a]" />
        {title}
      </CardTitle>
      {action}
    </CardHeader>
  );
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const styles: Record<ToastType, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-stone-200 bg-white text-stone-700",
  };

  const Icon =
    toast.type === "success"
      ? CheckCircle2
      : toast.type === "error"
        ? Info
        : Info;

  return (
    <Alert
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-5 z-[100] flex max-w-[calc(100vw-2rem)] items-start gap-3 shadow-lg print:hidden sm:right-6 ${styles[toast.type]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <AlertDescription className="flex-1 text-sm leading-5">
        {toast.message}
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Tutup notifikasi"
        onClick={onClose}
        className="-mr-2 -mt-2 size-8 shrink-0"
      >
        <X className="size-4" />
      </Button>
    </Alert>
  );
}

function InfoRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-stone-500">{label}</span>
      <span
        className={`text-right font-medium text-stone-900 ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

function InvoiceItemTable() {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="border-stone-200 bg-stone-50 hover:bg-stone-50">
            <TableHead className="w-12 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              No.
            </TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Produk & spesifikasi
            </TableHead>
            <TableHead className="text-center text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Qty
            </TableHead>
            <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Harga satuan
            </TableHead>
            <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Subtotal
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {ITEMS.map((item) => (
            <TableRow
              key={item.id}
              className="border-stone-200 align-top hover:bg-transparent"
            >
              <TableCell className="pt-4 text-center font-mono text-xs text-stone-400">
                {item.id}
              </TableCell>

              <TableCell className="max-w-[300px] py-4">
                <p className="text-sm font-semibold leading-5 text-stone-900">
                  {item.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  {item.description}
                </p>
                {item.sku && (
                  <p className="mt-1 font-mono text-[10px] text-[#5f402a]">
                    SKU: {item.sku}
                  </p>
                )}
                {item.discount && (
                  <Badge className="mt-2 border-0 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-50">
                    Diskon promosi
                  </Badge>
                )}
              </TableCell>

              <TableCell className="whitespace-nowrap pt-4 text-center text-xs font-medium">
                {item.quantity}
              </TableCell>

              <TableCell className="whitespace-nowrap pt-4 text-right font-mono text-xs">
                {formatRupiah(item.unitPrice)}
              </TableCell>

              <TableCell
                className={`whitespace-nowrap pt-4 text-right font-mono text-xs font-semibold ${
                  item.discount ? "text-emerald-700" : "text-stone-900"
                }`}
              >
                {formatRupiah(item.subtotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InvoiceTotals() {
  return (
    <div className="space-y-3">
      <InfoRow label="Subtotal bruto" value={formatRupiah(INVOICE.subtotal)} />

      <InfoRow
        label="Diskon negosiasi"
        value={`− ${formatRupiah(INVOICE.discount)}`}
        valueClassName="text-red-600"
      />

      <Separator className="bg-stone-200" />

      <InfoRow label="Total tagihan" value={formatRupiah(INVOICE.total)} />

      <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-3">
        <span className="text-sm text-emerald-800">DP diterima</span>
        <span className="font-mono text-sm font-semibold text-emerald-800">
          {formatRupiah(INVOICE.downPayment)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-3">
        <span className="text-sm font-semibold text-red-800">
          Sisa pelunasan
        </span>
        <span className="font-mono text-sm font-semibold text-red-800">
          {formatRupiah(INVOICE.remaining)}
        </span>
      </div>
    </div>
  );
}

function InvoicePaper() {
  return (
    <article
      id="printSheet"
      className="invoice-paper relative overflow-hidden rounded-xl border border-stone-200 bg-white p-5 text-xs text-stone-900 sm:p-8 xl:p-9"
    >
      <header className="relative flex flex-col justify-between gap-5 border-b-2 border-[#5f402a] pb-5 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#5f402a] text-white print:border print:border-[#5f402a] print:bg-white print:text-[#5f402a]">
            <ShoppingBag className="size-6" />
          </div>

          <div>
            <h2 className="font-serif text-lg font-bold tracking-tight text-[#5f402a]">
              FURNIERP ATELIER
            </h2>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Workshop Jepara
            </p>
            <p className="mt-2 max-w-xs leading-5 text-stone-600">
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
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500">
            Faktur penjualan
          </p>
          <p className="mt-1 break-all font-mono text-sm font-bold">
            {INVOICE.number}
          </p>
          <p className="mt-1 text-[11px] text-stone-600">
            No. SPK:{" "}
            <span className="font-mono font-semibold">{INVOICE.spk}</span>
          </p>
          <p className="mt-2 text-[10px] text-stone-500">
            Tanggal: 23/10/2024 · {INVOICE.time}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 border-b border-stone-200 py-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Ditagihkan kepada
          </p>
          <p className="text-sm font-bold">{INVOICE.customer}</p>
          <p className="mt-1 text-stone-600">{INVOICE.customerCompany}</p>
          <p className="text-stone-600">{INVOICE.customerContact}</p>
          <p className="mt-1 leading-5 text-stone-500">
            Jl. Bung Karno No.100, Pagutan Tim., Kec. Mataram, Kota Mataram.
          </p>
          <p className="mt-1 font-mono text-[#5f402a]">
            WA: {INVOICE.customerPhone}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Pembayaran & pengiriman
          </p>
          <p className="font-semibold">Uang muka / DP termin</p>
          <p className="mt-1 text-stone-600">Tunai showroom</p>
          <p className="mt-1 text-stone-500">Target kirim: 28 Oktober 2024</p>
          <p className="mt-2 font-semibold text-amber-700">
            Menunggu pelunasan sebelum pengiriman
          </p>
        </div>
      </section>

      <section className="py-5">
        <InvoiceItemTable />
      </section>

      <section className="grid grid-cols-1 gap-6 border-t border-stone-200 pt-5 md:grid-cols-[1fr_280px]">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Ketentuan garansi & pengiriman
          </p>
          <ol className="list-decimal space-y-1.5 pl-4 leading-5 text-stone-600">
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

      <section className="mt-8 grid grid-cols-2 gap-6 border-t border-stone-200 pt-5 text-center">
        <div>
          <p className="text-[11px] text-stone-600">Penerima / Pelanggan</p>
          <div className="h-16" />
          <p className="font-semibold underline decoration-stone-400 underline-offset-4">
            H. Subur Hartanto
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            Toko Mebel Subur Makmur
          </p>
        </div>

        <div>
          <p className="text-[11px] text-stone-600">
            Hormat kami, FurniERP Atelier
          </p>
          <div className="h-16" />
          <p className="font-semibold underline decoration-stone-400 underline-offset-4">
            Hendra Wijaya
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            Owner & Atelier Master
          </p>
        </div>
      </section>

      <footer className="mt-7 border-t border-dashed border-stone-200 pt-3 text-center text-[10px] text-stone-500">
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
    <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
      <SectionHeader
        title="Status pembayaran"
        icon={Banknote}
        action={
          <Badge className="border-0 bg-amber-50 text-amber-800 hover:bg-amber-50">
            DP diterima
          </Badge>
        }
      />

      <CardContent className="space-y-4 p-4">
        <InfoRow label="Total tagihan" value={formatRupiah(INVOICE.total)} />
        <InfoRow
          label={`DP (${paymentPercentage}%)`}
          value={formatRupiah(INVOICE.downPayment)}
          valueClassName="text-emerald-700"
        />

        <Separator className="bg-stone-200" />

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-stone-500">Sisa piutang</span>
            <span className="font-mono text-sm font-semibold text-red-700">
              {formatRupiah(INVOICE.remaining)}
            </span>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-label="Persentase pembayaran"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={paymentPercentage}
          >
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>

          <div className="mt-1.5 flex justify-between text-xs text-stone-500">
            <span>{paymentPercentage}% dibayar</span>
            <span>{(100 - paymentPercentage).toFixed(1)}% tersisa</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => onNavigate("receivables")}
          className="w-full bg-[#5f402a] text-white hover:bg-[#795740]"
        >
          <Banknote className="mr-2 size-4" />
          Catat pelunasan
        </Button>
      </CardContent>
    </Card>
  );
}

function BankAccountsCard({ onCopy }: { onCopy: (number: string) => void }) {
  return (
    <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
      <SectionHeader title="Rekening pembayaran" icon={LockKeyhole} />

      <CardContent className="space-y-3 p-4">
        {BANK_ACCOUNTS.map((account) => (
          <div
            key={account.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900">
                {account.name}
                <span className="ml-1 font-normal text-stone-500">
                  · {account.type}
                </span>
              </p>

              <p className="mt-1 break-all font-mono text-sm font-semibold text-[#5f402a]">
                {account.displayNumber}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-stone-500">
                a.n. {account.owner}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              title={`Salin rekening ${account.name}`}
              aria-label={`Salin nomor rekening ${account.name}`}
              onClick={() => onCopy(account.number)}
              className="size-9 shrink-0 border-stone-200 text-stone-600 hover:bg-stone-100"
            >
              <Clipboard className="size-4" />
            </Button>
          </div>
        ))}

        <p className="text-xs leading-5 text-stone-500">
          Periksa kembali nama penerima dan nomor rekening sebelum melakukan
          transfer.
        </p>
      </CardContent>
    </Card>
  );
}

function WhatsAppCard({ onShare }: { onShare: () => void }) {
  return (
    <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
      <SectionHeader title="Kirim ke pelanggan" icon={MessageCircle} />

      <CardContent className="p-4">
        <p className="text-sm leading-6 text-stone-500">
          Bagikan ringkasan tagihan kepada {INVOICE.customerContact} melalui
          WhatsApp. Pesan berisi nomor faktur, total tagihan, DP, dan sisa
          pelunasan.
        </p>

        <Button
          type="button"
          onClick={onShare}
          className="mt-4 w-full bg-emerald-700 text-white hover:bg-emerald-800"
        >
          <Send className="mr-2 size-4" />
          Buka WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  onNavigate,
}) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({
      id: Date.now(),
      message,
      type,
    });
  };

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

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
      `Halo ${INVOICE.customerContact},`,
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
    <div className="invoice-detail flex w-full flex-col gap-5 text-stone-900">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex justify-end print:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigate("pos")}
          className="border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
        >
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke penjualan
        </Button>
      </div>

      <header className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 print:hidden">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Detail penjualan
              </p>
              <Badge className="border-0 bg-amber-50 text-amber-800 hover:bg-amber-50">
                Terbayar sebagian
              </Badge>
            </div>

            <h1 className="mt-2 break-words text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
              {INVOICE.number}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {INVOICE.date} · {INVOICE.time}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-4" />
                Hendra Wijaya · Owner
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-4" />
                SPK: {INVOICE.spk}
              </span>
            </div>

            <p className="mt-2 text-xs text-stone-500">
              Pelanggan: {INVOICE.customer} · Tier grosir
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            >
              <ReceiptText className="mr-2 size-4" />
              Cetak nota
            </Button>

            <Button
              type="button"
              onClick={handlePrint}
              className="bg-[#5f402a] text-white hover:bg-[#795740]"
            >
              <Printer className="mr-2 size-4" />
              Cetak / PDF
            </Button>

            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              <MessageCircle className="mr-2 size-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 print:hidden">
        <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-stone-500">Total tagihan</p>
            <p className="mt-2 break-words font-mono text-lg font-semibold tracking-tight text-stone-900">
              {formatRupiah(INVOICE.total)}
            </p>
            <p className="mt-1 text-xs text-stone-500">Nilai faktur</p>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-xl border-emerald-200 bg-emerald-50/40 py-0 shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-800">DP sudah diterima</p>
            <p className="mt-2 break-words font-mono text-lg font-semibold tracking-tight text-emerald-800">
              {formatRupiah(INVOICE.downPayment)}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {paymentPercentage}% dari total
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-xl border-red-200 bg-red-50/40 py-0 shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">Sisa piutang</p>
            <p className="mt-2 break-words font-mono text-lg font-semibold tracking-tight text-red-800">
              {formatRupiah(INVOICE.remaining)}
            </p>
            <p className="mt-1 text-xs text-red-700">Menunggu pelunasan</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <main className="min-w-0 space-y-3 xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 print:hidden">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <FileText className="size-4 text-[#5f402a]" />
              Pratinjau faktur
            </h2>
            <span className="text-xs text-stone-500">
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
