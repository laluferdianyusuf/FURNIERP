import React, { useEffect, useState } from "react";
import type { PageView } from "../types";

import {
  Activity,
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Info,
  LockKeyhole,
  LockKeyholeOpen,
  ReceiptText,
  Wallet,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

interface FinancialReportsViewProps {
  onNavigate: (page: PageView) => void;
}

type ReportPeriod = "OCT" | "Q3" | "YTD";

interface ReportData {
  label: string;
  startDate: string;
  endDate: string;
  grossSales: number;
  discounts: number;
  revenue: number;
  cogs: number;
  woodCost: number;
  laborCost: number;
  finishingCost: number;
  operatingExpenses: number;
  staffCost: number;
  rentCost: number;
  utilitiesCost: number;
  shippingCost: number;
  tax: number;
  cashFlow: number;
}

interface ReportLine {
  label: string;
  amount: number;
  negative?: boolean;
  bold?: boolean;
  highlight?: "neutral" | "green" | "brown";
}

type Tone = "default" | "green" | "red" | "brown";

const PERIOD_OPTIONS: {
  value: ReportPeriod;
  label: string;
}[] = [
  { value: "OCT", label: "Oktober 2024" },
  { value: "Q3", label: "Kuartal III 2024" },
  { value: "YTD", label: "Tahun 2024" },
];

// Data contoh untuk desain awal.
// Hubungkan ke agregasi transaksi backend saat API tersedia.
const REPORT_DATA: Record<ReportPeriod, ReportData> = {
  OCT: {
    label: "Oktober 2024",
    startDate: "1 Oktober 2024",
    endDate: "31 Oktober 2024",
    grossSales: 192000000,
    discounts: 7500000,
    revenue: 184500000,
    cogs: 105350000,
    woodCost: 64250000,
    laborCost: 28500000,
    finishingCost: 12600000,
    operatingExpenses: 26750000,
    staffCost: 11200000,
    rentCost: 6000000,
    utilitiesCost: 6250000,
    shippingCost: 3300000,
    tax: 0,
    cashFlow: 63650000,
  },
  Q3: {
    label: "Kuartal III 2024",
    startDate: "1 Juli 2024",
    endDate: "30 September 2024",
    grossSales: 0,
    discounts: 0,
    revenue: 0,
    cogs: 0,
    woodCost: 0,
    laborCost: 0,
    finishingCost: 0,
    operatingExpenses: 0,
    staffCost: 0,
    rentCost: 0,
    utilitiesCost: 0,
    shippingCost: 0,
    tax: 0,
    cashFlow: 0,
  },
  YTD: {
    label: "Tahun 2024",
    startDate: "1 Januari 2024",
    endDate: "31 Desember 2024",
    grossSales: 0,
    discounts: 0,
    revenue: 0,
    cogs: 0,
    woodCost: 0,
    laborCost: 0,
    finishingCost: 0,
    operatingExpenses: 0,
    staffCost: 0,
    rentCost: 0,
    utilitiesCost: 0,
    shippingCost: 0,
    tax: 0,
    cashFlow: 0,
  },
};

const money = (value: number) => {
  const prefix = value < 0 ? "-Rp " : "Rp ";
  return `${prefix}${Math.abs(value).toLocaleString("id-ID")}`;
};

const percentage = (value: number, total: number) =>
  total > 0 ? (value / total) * 100 : 0;

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const TONE_STYLES: Record<Tone, { icon: string; value: string; bar: string }> =
  {
    default: {
      icon: "bg-stone-100 text-stone-700",
      value: "text-stone-900",
      bar: "bg-[#795740]",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700",
      value: "text-emerald-700",
      bar: "bg-emerald-600",
    },
    red: {
      icon: "bg-red-50 text-red-700",
      value: "text-red-700",
      bar: "bg-red-500",
    },
    brown: {
      icon: "bg-[#5f402a] text-white",
      value: "text-[#5f402a]",
      bar: "bg-[#5f402a]",
    },
  };

function SectionHeading({
  title,
  description,
  icon: Icon,
  right,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
            <Icon className="size-[18px]" />
          </div>
        )}

        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-stone-900">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm leading-5 text-stone-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1"
      aria-label="Pilih periode laporan"
    >
      {PERIOD_OPTIONS.map((option) => {
        const active = value === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 rounded-md px-3 text-xs font-medium",
              active
                ? "bg-white text-[#5f402a] shadow-sm hover:bg-white"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900",
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function ReportLineItem({ line }: { line: ReportLine }) {
  const highlightStyles = {
    neutral: "bg-stone-50 text-stone-900",
    green: "bg-emerald-50 text-emerald-800",
    brown: "bg-[#f3ede7] text-[#5f402a]",
  };

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-md px-3 py-2.5",
        line.highlight ? highlightStyles[line.highlight] : "",
      )}
    >
      <span
        className={cn(
          "min-w-0 text-sm leading-5",
          line.bold ? "font-semibold" : "text-stone-600",
        )}
      >
        {line.label}
      </span>

      <span
        className={cn(
          "shrink-0 whitespace-nowrap text-right text-sm tabular-nums",
          line.bold ? "font-semibold" : "font-medium",
          line.negative && "text-red-600",
        )}
      >
        {line.negative
          ? `(${money(Math.abs(line.amount))})`
          : money(line.amount)}
      </span>
    </div>
  );
}

function ReportSection({
  title,
  rows,
  total,
}: {
  title: string;
  rows: ReportLine[];
  total?: ReportLine;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="border-b border-stone-200 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h3>

      {rows.map((row) => (
        <ReportLineItem key={row.label} line={row} />
      ))}

      {total && (
        <>
          <Separator className="my-2 bg-stone-200" />
          <ReportLineItem line={total} />
        </>
      )}
    </section>
  );
}

function ProfitLossStatement({
  data,
  grossProfit,
  operatingProfit,
  netProfit,
  grossMargin,
  netMargin,
}: {
  data: ReportData;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}) {
  return (
    <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
      <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-5">
        <SectionHeading
          icon={ReceiptText}
          title="Laporan laba rugi"
          description={`${data.startDate} – ${data.endDate}`}
          right={
            <Badge
              variant="secondary"
              className="border-0 bg-[#f3ede7] text-[#5f402a]"
            >
              IDR · Rupiah
            </Badge>
          }
        />
      </CardHeader>

      <Separator className="bg-stone-200" />

      <CardContent className="space-y-6 p-5 sm:p-6">
        <ReportSection
          title="I. Pendapatan usaha"
          rows={[
            {
              label: "Penjualan kotor",
              amount: data.grossSales,
            },
            {
              label: "Potongan dan diskon penjualan",
              amount: data.discounts,
              negative: true,
            },
          ]}
          total={{
            label: "Pendapatan bersih",
            amount: data.revenue,
            bold: true,
            highlight: "brown",
          }}
        />

        <ReportSection
          title="II. Beban pokok penjualan (HPP)"
          rows={[
            {
              label: "Bahan baku kayu",
              amount: data.woodCost,
            },
            {
              label: "Upah tenaga kerja langsung",
              amount: data.laborCost,
            },
            {
              label: "Bahan finishing",
              amount: data.finishingCost,
            },
          ]}
          total={{
            label: "Total HPP",
            amount: data.cogs,
            bold: true,
            highlight: "neutral",
          }}
        />

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                III. Laba kotor
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                Margin kotor {formatPercent(grossMargin)}
              </p>
            </div>
            <p className="text-base font-semibold tabular-nums text-emerald-800">
              {money(grossProfit)}
            </p>
          </div>
        </div>

        <ReportSection
          title="IV. Beban operasional"
          rows={[
            {
              label: "Gaji staf dan administrasi",
              amount: data.staffCost,
            },
            {
              label: "Sewa showroom dan workshop",
              amount: data.rentCost,
            },
            {
              label: "Listrik dan operasional",
              amount: data.utilitiesCost,
            },
            {
              label: "Pengiriman dan ekspedisi",
              amount: data.shippingCost,
            },
          ]}
          total={{
            label: "Total beban operasional",
            amount: data.operatingExpenses,
            bold: true,
            highlight: "neutral",
          }}
        />

        <div className="flex items-start justify-between gap-4 rounded-lg bg-stone-50 p-4">
          <div>
            <p className="text-sm font-semibold text-stone-800">
              V. Laba operasional sebelum pajak
            </p>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              Pendapatan bersih dikurangi HPP dan beban operasional.
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-stone-900">
            {money(operatingProfit)}
          </p>
        </div>

        {data.tax > 0 && (
          <ReportLineItem
            line={{
              label: "Pajak penghasilan",
              amount: data.tax,
              negative: true,
            }}
          />
        )}

        <div className="rounded-xl bg-[#5f402a] p-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#eadbcf]">
                VI. Laba bersih
              </p>
              <p className="mt-1 text-sm text-[#eadbcf]">
                Margin bersih {formatPercent(netMargin)}
              </p>
            </div>
            <p className="text-lg font-semibold tabular-nums">
              {money(netProfit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReconciliationCard({
  netProfit,
  cashFlow,
  onNavigate,
}: {
  netProfit: number;
  cashFlow: number;
  onNavigate: () => void;
}) {
  const difference = cashFlow - netProfit;

  return (
    <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
      <CardHeader className="p-5 pb-4">
        <SectionHeading
          icon={Wallet}
          title="Laba vs arus kas"
          description="Perbedaan laba akrual dan pergerakan uang."
        />
      </CardHeader>

      <Separator className="bg-stone-200" />

      <CardContent className="space-y-3 p-5">
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-xs text-stone-500">Laba bersih</p>
          <p className="mt-1 font-semibold tabular-nums text-stone-900">
            {money(netProfit)}
          </p>
        </div>

        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-xs text-stone-500">Arus kas bersih</p>
          <p
            className={cn(
              "mt-1 font-semibold tabular-nums",
              cashFlow >= 0 ? "text-emerald-700" : "text-red-600",
            )}
          >
            {money(cashFlow)}
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 p-3">
          <p className="text-xs text-stone-500">Selisih kas dan laba</p>
          <p
            className={cn(
              "mt-1 font-semibold tabular-nums",
              difference >= 0 ? "text-emerald-700" : "text-red-600",
            )}
          >
            {money(difference)}
          </p>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            Selisih dapat dipengaruhi pembayaran piutang, uang muka pelanggan,
            pembayaran utang, pembelian aset, dan transaksi nonkas. Periksa buku
            kas serta jurnal untuk memastikan penyebabnya.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onNavigate}
          className="mt-1 w-full border-stone-200 text-[#5f402a] hover:bg-stone-50 hover:text-[#5f402a]"
        >
          Buka Buku Kas
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function MarginAnalysisCard({
  revenue,
  grossProfit,
  cogs,
  operatingExpenses,
}: {
  revenue: number;
  grossProfit: number;
  cogs: number;
  operatingExpenses: number;
}) {
  const items = [
    {
      label: "Margin laba kotor",
      amount: grossProfit,
      percent: percentage(grossProfit, revenue),
      bar: "bg-emerald-600",
    },
    {
      label: "HPP terhadap omzet",
      amount: cogs,
      percent: percentage(cogs, revenue),
      bar: "bg-[#b89a7b]",
    },
    {
      label: "Beban operasional",
      amount: operatingExpenses,
      percent: percentage(operatingExpenses, revenue),
      bar: "bg-rose-500",
    },
  ];

  return (
    <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
      <CardHeader className="p-5 pb-4">
        <SectionHeading
          icon={BarChart3}
          title="Analisis margin"
          description="Proporsi terhadap pendapatan bersih."
        />
      </CardHeader>

      <Separator className="bg-stone-200" />

      <CardContent className="space-y-5 p-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-stone-600">
                {item.label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-stone-900">
                {formatPercent(item.percent)}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className={cn("h-full rounded-full", item.bar)}
                style={{
                  width: `${Math.min(100, Math.max(0, item.percent))}%`,
                }}
              />
            </div>

            <p className="mt-1.5 text-xs tabular-nums text-stone-500">
              {money(item.amount)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FinancialHealthCard({
  grossMargin,
  netMargin,
  cogsRatio,
}: {
  grossMargin: number;
  netMargin: number;
  cogsRatio: number;
}) {
  const items = [
    { label: "Margin kotor", value: formatPercent(grossMargin) },
    { label: "Margin bersih", value: formatPercent(netMargin) },
    { label: "HPP / omzet", value: formatPercent(cogsRatio) },
    { label: "Mata uang", value: "IDR" },
  ];

  return (
    <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
      <CardHeader className="p-5 pb-4">
        <SectionHeading
          icon={Activity}
          title="Indikator keuangan"
          description="Rasio dasar dari angka laporan periode terpilih."
        />
      </CardHeader>

      <Separator className="bg-stone-200" />

      <CardContent className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-lg border border-stone-200 bg-stone-50 p-3"
            >
              <p className="text-xs text-stone-500">{item.label}</p>
              <p className="mt-2 break-words text-lg font-semibold text-stone-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-5 text-stone-500">
          Rasio ini merupakan indikator awal, bukan penilaian kesehatan
          finansial lengkap. Rasio likuiditas dan umur piutang memerlukan data
          aset lancar, kewajiban lancar, dan riwayat piutang.
        </p>
      </CardContent>
    </Card>
  );
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  onNavigate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("OCT");
  const [isBookClosed, setIsBookClosed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const data = REPORT_DATA[selectedPeriod];

  const grossProfit = data.revenue - data.cogs;
  const operatingProfit = grossProfit - data.operatingExpenses;
  const netProfit = operatingProfit - data.tax;

  const grossMargin = percentage(grossProfit, data.revenue);
  const netMargin = percentage(netProfit, data.revenue);
  const cogsRatio = percentage(data.cogs, data.revenue);
  const operatingRatio = percentage(data.operatingExpenses, data.revenue);

  const isEmptyPeriod = data.revenue === 0;

  // Bersihkan timer saat pesan berubah atau komponen dilepas.
  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const handleCloseBook = () => {
    if (isEmptyPeriod) {
      showToast(
        "Periode ini belum memiliki data laporan. Tutup buku belum dapat diproses.",
      );
      return;
    }

    // Penanda ini hanya berlaku di UI, bukan penguncian database.
    setIsBookClosed(true);
    showToast(
      "Status tutup buku ditandai di tampilan ini. Penguncian permanen memerlukan backend.",
    );
  };

  const handleExport = (format: "PDF" | "XLSX") => {
    showToast(
      `Ekspor ${format} belum terhubung. Tambahkan generator laporan untuk mengunduh file.`,
    );
  };

  const handlePeriodChange = (period: ReportPeriod) => {
    setSelectedPeriod(period);
    setIsBookClosed(false);
  };

  return (
    <div className="flex w-full flex-col gap-5 text-stone-900">
      {toastMessage && (
        <Alert
          role="status"
          className="fixed right-4 top-20 z-[60] flex max-w-md items-start gap-3 border-stone-200 bg-white shadow-lg sm:right-6"
        >
          <Info className="mt-0.5 size-4 text-[#5f402a]" />
          <AlertDescription className="flex-1 text-sm leading-5 text-stone-700">
            {toastMessage}
          </AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Tutup notifikasi"
            onClick={() => setToastMessage(null)}
            className="-mr-2 -mt-2 size-8 shrink-0 text-stone-500 hover:text-stone-900"
          >
            <X className="size-4" />
          </Button>
        </Alert>
      )}

      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Laporan Keuangan
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Pendapatan, biaya, dan laba berdasarkan periode laporan.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleExport("PDF")}
            className="border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
          >
            <FileText className="mr-2 size-4" />
            Ekspor PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleExport("XLSX")}
            className="border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Ekspor Excel
          </Button>

          <Button
            type="button"
            onClick={handleCloseBook}
            disabled={isBookClosed}
            className="bg-[#5f402a] text-white hover:bg-[#795740] disabled:opacity-60"
          >
            {isBookClosed ? (
              <LockKeyhole className="mr-2 size-4" />
            ) : (
              <LockKeyholeOpen className="mr-2 size-4" />
            )}
            {isBookClosed ? "Ditandai Terkunci" : "Tutup Buku"}
          </Button>
        </div>
      </header>

      <Card className="gap-0 rounded-xl border-stone-200 bg-white py-0 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              Periode laporan
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Pilih rentang waktu untuk melihat ringkasan keuangan.
            </p>
          </div>

          <PeriodSelector
            value={selectedPeriod}
            onChange={handlePeriodChange}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <ProfitLossStatement
          data={data}
          grossProfit={grossProfit}
          operatingProfit={operatingProfit}
          netProfit={netProfit}
          grossMargin={grossMargin}
          netMargin={netMargin}
        />

        <div className="flex min-w-0 flex-col gap-5">
          <ReconciliationCard
            netProfit={netProfit}
            cashFlow={data.cashFlow}
            onNavigate={() => onNavigate("cash-flow")}
          />

          <MarginAnalysisCard
            revenue={data.revenue}
            grossProfit={grossProfit}
            cogs={data.cogs}
            operatingExpenses={data.operatingExpenses}
          />

          <FinancialHealthCard
            grossMargin={grossMargin}
            netMargin={netMargin}
            cogsRatio={cogsRatio}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 border-t border-stone-200 pt-4">
        <Info className="mt-0.5 size-4 shrink-0 text-stone-400" />
        <p className="text-xs leading-5 text-stone-500">
          Laporan ini masih menggunakan data contoh. Sebelum digunakan untuk
          keputusan keuangan atau tutup buku resmi, hubungkan setiap pos ke
          transaksi penjualan, HPP, pengeluaran, pajak, dan kas yang tersimpan.
          Pastikan periode akuntansi dan metode pengakuan pendapatan sesuai
          dengan kebijakan usaha.
        </p>
      </div>
    </div>
  );
};
