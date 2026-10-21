import React, { useMemo, useState } from "react";
import { PageView } from "../types";

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

const COLORS = {
  surface: "#fcf9f4",
  background: "#f6f3ee",
  soft: "#f0ede7",
  border: "#e5e0d8",
  text: "#29251f",
  secondary: "#66584c",
  muted: "#82746d",
  brown: "#654832",
  brownHover: "#795940",
  green: "#52755a",
  greenSoft: "#edf3ec",
  red: "#a85348",
  redSoft: "#f8ece8",
  amber: "#9a6b26",
};

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "OCT", label: "Oktober 2024" },
  { value: "Q3", label: "Kuartal III 2024" },
  { value: "YTD", label: "Tahun 2024" },
];

// Data contoh untuk desain awal.
// Ganti dengan data hasil agregasi transaksi dari backend.
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

const Icon: React.FC<{
  name: string;
  className?: string;
}> = ({ name, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <section
    className={`rounded-xl border border-[#e5e0d8] bg-[#fcf9f4] ${className}`}
  >
    {children}
  </section>
);

const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#654832] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#795940] disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </button>
);

const SecondaryButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
}> = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e0d8] bg-[#fcf9f4] px-3.5 py-2.5 text-sm font-medium text-[#50453e] transition hover:bg-[#f0ede7]"
  >
    {children}
  </button>
);

const Badge: React.FC<{
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "brown";
}> = ({ children, tone = "neutral" }) => {
  const styles = {
    neutral: "bg-[#f0ede7] text-[#66584c]",
    green: "bg-[#edf3ec] text-[#52755a]",
    red: "bg-[#f8ece8] text-[#a85348]",
    amber: "bg-[#f8f0df] text-[#9a6b26]",
    brown: "bg-[#eee5dc] text-[#654832]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
};

const SectionHeading: React.FC<{
  title: string;
  description?: string;
  icon?: string;
  right?: React.ReactNode;
}> = ({ title, description, icon, right }) => (
  <div className="flex flex-col gap-3 border-b border-[#e5e0d8] pb-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eee5dc] text-[#654832]">
          <Icon name={icon} className="text-xl" />
        </span>
      )}
      <div>
        <h2 className="text-base font-bold text-[#29251f]">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-[#82746d]">{description}</p>
        )}
      </div>
    </div>
    {right}
  </div>
);

const KpiCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  description: string;
  tone?: "default" | "green" | "red" | "brown";
  ratio?: number;
}> = ({ label, value, icon, description, tone = "default", ratio }) => {
  const iconStyle = {
    default: "bg-[#eee5dc] text-[#654832]",
    green: "bg-[#edf3ec] text-[#52755a]",
    red: "bg-[#f8ece8] text-[#a85348]",
    brown: "bg-[#654832] text-white",
  };

  const valueStyle = {
    default: "text-[#29251f]",
    green: "text-[#52755a]",
    red: "text-[#a85348]",
    brown: "text-[#654832]",
  };

  const barStyle = {
    default: "bg-[#795940]",
    green: "bg-[#78947b]",
    red: "bg-[#c77c6e]",
    brown: "bg-[#654832]",
  };

  return (
    <Card className="flex min-w-0 flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase leading-5 tracking-wide text-[#82746d]">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconStyle[tone]}`}
        >
          <Icon name={icon} className="text-xl" />
        </span>
      </div>

      <p
        className={`mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl ${valueStyle[tone]}`}
      >
        {money(value)}
      </p>

      <p className="mt-2 min-h-8 text-xs leading-5 text-[#82746d]">
        {description}
      </p>

      {ratio !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5e0d8]">
          <div
            className={`h-full rounded-full ${barStyle[tone]}`}
            style={{
              width: `${Math.min(100, Math.max(0, ratio))}%`,
            }}
          />
        </div>
      )}
    </Card>
  );
};

const PeriodSelector: React.FC<{
  value: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}> = ({ value, onChange }) => (
  <div
    className="flex flex-wrap gap-1 rounded-lg border border-[#e5e0d8] bg-[#f0ede7] p-1"
    aria-label="Pilih periode laporan"
  >
    {PERIOD_OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
          value === option.value
            ? "bg-[#fcf9f4] text-[#654832] shadow-sm"
            : "text-[#82746d] hover:text-[#29251f]"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const ReportLineItem: React.FC<{
  line: ReportLine;
}> = ({ line }) => {
  const rowStyle = {
    neutral: "bg-[#f6f3ee] text-[#29251f]",
    green: "bg-[#edf3ec] text-[#52755a]",
    brown: "bg-[#eee5dc] text-[#654832]",
  };

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-lg px-3 py-2.5 ${
        line.highlight ? rowStyle[line.highlight] : ""
      }`}
    >
      <span
        className={`min-w-0 text-xs leading-5 ${line.bold ? "font-bold" : ""}`}
      >
        {line.label}
      </span>

      <span
        className={`shrink-0 whitespace-nowrap text-right text-xs tabular-nums ${
          line.bold ? "font-bold" : "font-medium"
        } ${line.negative ? "text-[#a85348]" : ""}`}
      >
        {line.negative
          ? `(${money(Math.abs(line.amount))})`
          : money(line.amount)}
      </span>
    </div>
  );
};

const ReportSection: React.FC<{
  title: string;
  rows: ReportLine[];
  total?: ReportLine;
}> = ({ title, rows, total }) => (
  <div className="space-y-1.5">
    <h3 className="border-b border-[#e5e0d8] pb-2 text-[11px] font-bold uppercase tracking-wide text-[#66584c]">
      {title}
    </h3>

    {rows.map((row) => (
      <ReportLineItem key={row.label} line={row} />
    ))}

    {total && <ReportLineItem line={total} />}
  </div>
);

const ProfitLossStatement: React.FC<{
  data: ReportData;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}> = ({
  data,
  grossProfit,
  operatingProfit,
  netProfit,
  grossMargin,
  netMargin,
}) => (
  <Card className="p-4 sm:p-6">
    <SectionHeading
      icon="receipt_long"
      title="Laporan Laba Rugi"
      description={`${data.startDate} – ${data.endDate}`}
      right={<Badge tone="brown">IDR · Rupiah</Badge>}
    />

    <div className="mt-5 space-y-5">
      <ReportSection
        title="I. Pendapatan Usaha"
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
        title="II. Beban Pokok Penjualan (HPP)"
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

      <div className="rounded-lg border border-[#d9e5d8] bg-[#edf3ec] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#52755a]">
              III. Laba kotor
            </p>
            <p className="mt-1 text-xs text-[#52755a]">
              Margin kotor {formatPercent(grossMargin)}
            </p>
          </div>
          <p className="text-base font-bold text-[#52755a]">
            {money(grossProfit)}
          </p>
        </div>
      </div>

      <ReportSection
        title="IV. Beban Operasional"
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

      <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f0ede7] px-4 py-3">
        <div>
          <p className="text-xs font-bold text-[#50453e]">
            V. Laba operasional sebelum pajak
          </p>
          <p className="mt-1 text-[11px] text-[#82746d]">
            Pendapatan bersih dikurangi HPP dan beban operasional
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-[#29251f]">
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

      <div className="rounded-xl bg-[#654832] p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#e6d4c4]">
              VI. Laba bersih
            </p>
            <p className="mt-1 text-xs text-[#e6d4c4]">
              Margin bersih {formatPercent(netMargin)}
            </p>
          </div>
          <p className="text-lg font-bold">{money(netProfit)}</p>
        </div>
      </div>
    </div>
  </Card>
);

const ReconciliationCard: React.FC<{
  netProfit: number;
  cashFlow: number;
  onNavigate: () => void;
}> = ({ netProfit, cashFlow, onNavigate }) => {
  const difference = cashFlow - netProfit;

  return (
    <Card className="p-5">
      <SectionHeading
        icon="account_balance"
        title="Laba vs arus kas"
        description="Perbedaan laba akrual dan pergerakan uang."
      />

      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-[#f6f3ee] p-3">
          <p className="text-xs text-[#82746d]">Laba bersih</p>
          <p className="mt-1 font-bold text-[#29251f]">{money(netProfit)}</p>
        </div>

        <div className="rounded-lg bg-[#f6f3ee] p-3">
          <p className="text-xs text-[#82746d]">Arus kas bersih</p>
          <p
            className={`mt-1 font-bold ${
              cashFlow >= 0 ? "text-[#52755a]" : "text-[#a85348]"
            }`}
          >
            {money(cashFlow)}
          </p>
        </div>

        <div className="rounded-lg border border-[#e5e0d8] p-3">
          <p className="text-xs text-[#82746d]">Selisih kas dan laba</p>
          <p
            className={`mt-1 font-bold ${
              difference >= 0 ? "text-[#52755a]" : "text-[#a85348]"
            }`}
          >
            {money(difference)}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-[#82746d]">
            Selisih dapat dipengaruhi pembayaran piutang, uang muka pelanggan,
            pembayaran utang, pembelian aset, dan transaksi nonkas. Periksa buku
            kas serta jurnal untuk memastikan penyebabnya.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNavigate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e5e0d8] px-3 py-2.5 text-sm font-semibold text-[#654832] transition hover:bg-[#f0ede7]"
      >
        Buka Buku Kas
        <Icon name="arrow_forward" className="text-lg" />
      </button>
    </Card>
  );
};

const MarginAnalysisCard: React.FC<{
  revenue: number;
  grossProfit: number;
  cogs: number;
  operatingExpenses: number;
}> = ({ revenue, grossProfit, cogs, operatingExpenses }) => {
  const items = [
    {
      label: "Margin laba kotor",
      amount: grossProfit,
      percent: percentage(grossProfit, revenue),
      color: "bg-[#78947b]",
    },
    {
      label: "HPP terhadap omzet",
      amount: cogs,
      percent: percentage(cogs, revenue),
      color: "bg-[#b89a7b]",
    },
    {
      label: "Beban operasional",
      amount: operatingExpenses,
      percent: percentage(operatingExpenses, revenue),
      color: "bg-[#c77c6e]",
    },
  ];

  return (
    <Card className="p-5">
      <SectionHeading
        icon="bar_chart"
        title="Analisis margin"
        description="Proporsi terhadap pendapatan bersih."
      />

      <div className="mt-4 space-y-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-[#50453e]">
                {item.label}
              </span>
              <span className="text-xs font-bold text-[#29251f]">
                {formatPercent(item.percent)}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0ede7]">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{
                  width: `${Math.min(100, Math.max(0, item.percent))}%`,
                }}
              />
            </div>

            <p className="mt-1.5 text-[11px] text-[#82746d]">
              {money(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

const FinancialHealthCard: React.FC<{
  grossMargin: number;
  netMargin: number;
  cogsRatio: number;
}> = ({ grossMargin, netMargin, cogsRatio }) => (
  <Card className="p-5">
    <SectionHeading
      icon="monitoring"
      title="Indikator keuangan"
      description="Rasio dasar dari angka laporan periode terpilih."
    />

    <div className="mt-4 grid grid-cols-2 gap-3">
      {[
        {
          label: "Margin kotor",
          value: formatPercent(grossMargin),
        },
        {
          label: "Margin bersih",
          value: formatPercent(netMargin),
        },
        {
          label: "HPP / omzet",
          value: formatPercent(cogsRatio),
        },
        {
          label: "Mata uang",
          value: "IDR",
        },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-[#e5e0d8] bg-[#f6f3ee] p-3"
        >
          <p className="text-[11px] text-[#82746d]">{item.label}</p>
          <p className="mt-2 break-words text-lg font-bold text-[#29251f]">
            {item.value}
          </p>
        </div>
      ))}
    </div>

    <p className="mt-4 text-[11px] leading-5 text-[#82746d]">
      Rasio ini merupakan indikator awal, bukan penilaian kesehatan finansial
      lengkap. Rasio likuiditas dan umur piutang memerlukan data aset lancar,
      kewajiban lancar, dan riwayat piutang.
    </p>
  </Card>
);

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

  const periodLabel = useMemo(
    () =>
      PERIOD_OPTIONS.find((period) => period.value === selectedPeriod)?.label ??
      "",
    [selectedPeriod],
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  };

  const handleCloseBook = () => {
    if (isEmptyPeriod) {
      showToast(
        "Periode ini belum memiliki data laporan. Tutup buku belum dapat diproses.",
      );
      return;
    }

    // Status ini hanya status UI lokal, bukan penguncian di database.
    setIsBookClosed(true);
    showToast(
      "Status tutup buku ditandai di tampilan ini. Penguncian permanen memerlukan backend.",
    );
  };

  const handleExport = (format: "PDF" | "XLSX") => {
    // Tombol belum membuat file. Ini mencegah UI mengklaim ekspor berhasil.
    showToast(
      `Ekspor ${format} belum terhubung. Tambahkan generator laporan untuk mengunduh file.`,
    );
  };

  const handlePeriodChange = (period: ReportPeriod) => {
    setSelectedPeriod(period);
    setIsBookClosed(false);
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-8 pt-4">
      {toastMessage && (
        <div
          role="status"
          className="fixed right-4 top-20 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-[#e5e0d8] bg-[#fcf9f4] px-4 py-3 shadow-lg sm:right-6"
        >
          <Icon name="info" className="mt-0.5 text-xl text-[#654832]" />
          <p className="text-sm leading-5 text-[#50453e]">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Tutup notifikasi"
            className="ml-1 text-[#82746d] hover:text-[#29251f]"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="brown">Keuangan</Badge>
            <Badge>Laporan manajemen</Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#29251f] sm:text-3xl">
            Laporan Keuangan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82746d]">
            Ringkasan pendapatan, HPP, beban operasional, laba, dan perbandingan
            hasil akrual dengan arus kas usaha mebel.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => handleExport("PDF")}>
            <Icon name="picture_as_pdf" className="text-lg" />
            Ekspor PDF
          </SecondaryButton>

          <SecondaryButton onClick={() => handleExport("XLSX")}>
            <Icon name="table_view" className="text-lg" />
            Ekspor Excel
          </SecondaryButton>

          <PrimaryButton onClick={handleCloseBook} disabled={isBookClosed}>
            <Icon
              name={isBookClosed ? "lock" : "lock_clock"}
              className="text-lg"
            />
            {isBookClosed ? "Ditandai Terkunci" : "Tutup Buku"}
          </PrimaryButton>
        </div>
      </header>

      {/* Period controls */}
      <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[#29251f]">Periode laporan</p>
          <p className="mt-1 text-xs text-[#82746d]">
            Pilih rentang waktu untuk melihat ringkasan keuangan.
          </p>
        </div>

        <PeriodSelector value={selectedPeriod} onChange={handlePeriodChange} />
      </Card>

      {/* Data status */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#e5e0d8] bg-[#f0ede7] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon name="info" className="mt-0.5 text-xl text-[#654832]" />
          <div>
            <p className="text-sm font-semibold text-[#50453e]">
              {isEmptyPeriod
                ? "Data periode belum tersedia"
                : "Ringkasan laporan periode"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#82746d]">
              {isEmptyPeriod
                ? `Belum ada data laporan untuk ${periodLabel}. Hubungkan laporan ke transaksi yang tersimpan untuk menampilkan nilai aktual.`
                : `${data.startDate} – ${data.endDate}. Nilai saat ini menggunakan data contoh yang ada di file ini.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isBookClosed ? "amber" : "green"}>
            {isBookClosed ? "Status UI: ditandai tutup" : "Status UI: terbuka"}
          </Badge>
          <Badge tone="brown">IDR · Rupiah</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Pendapatan bersih"
          value={data.revenue}
          icon="payments"
          description={`Penjualan kotor ${money(data.grossSales)} dikurangi diskon ${money(data.discounts)}.`}
          ratio={100}
        />

        <KpiCard
          label="Beban pokok (HPP)"
          value={data.cogs}
          icon="inventory_2"
          description={`${formatPercent(cogsRatio)} dari pendapatan bersih.`}
          ratio={cogsRatio}
        />

        <KpiCard
          label="Laba kotor"
          value={grossProfit}
          icon="trending_up"
          tone="green"
          description={`Margin kotor ${formatPercent(grossMargin)}.`}
          ratio={grossMargin}
        />

        <KpiCard
          label="Beban operasional"
          value={data.operatingExpenses}
          icon="store"
          description={`${formatPercent(operatingRatio)} dari pendapatan bersih.`}
          ratio={operatingRatio}
        />

        <KpiCard
          label="Laba bersih"
          value={netProfit}
          icon="account_balance"
          tone="brown"
          description={`Margin bersih ${formatPercent(netMargin)} setelah pajak yang dicatat.`}
          ratio={netMargin}
        />
      </div>

      {/* Statements and analysis */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <ProfitLossStatement
          data={data}
          grossProfit={grossProfit}
          operatingProfit={operatingProfit}
          netProfit={netProfit}
          grossMargin={grossMargin}
          netMargin={netMargin}
        />

        <div className="space-y-5">
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

      {/* Footer note */}
      <div className="flex items-start gap-2 border-t border-[#e5e0d8] pt-4">
        <Icon name="info" className="mt-0.5 text-lg text-[#82746d]" />
        <p className="text-xs leading-5 text-[#82746d]">
          Laporan ini merupakan tampilan awal dengan data contoh. Sebelum
          digunakan untuk keputusan keuangan atau tutup buku resmi, hubungkan
          setiap pos ke transaksi penjualan, HPP, pengeluaran, pajak, dan kas
          yang tersimpan. Pastikan periode akuntansi dan metode pengakuan
          pendapatan sudah sesuai dengan kebijakan usaha.
        </p>
      </div>
    </div>
  );
};
