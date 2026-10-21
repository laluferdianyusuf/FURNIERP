import React, { useState } from "react";
import { PageView } from "../types";

interface DashboardViewProps {
  onNavigate: (page: PageView) => void;
  onOpenQuickTx: (actionType?: string) => void;
  onToast: (msg: string) => void;
}

type DateFilter = "today" | "7days" | "month" | "lastMonth" | "range";
type Tone = "neutral" | "success" | "warning" | "danger" | "brown";

const C = {
  ink: "#292720",
  muted: "#77746B",
  line: "#E9E6DF",
  surface: "#FFFFFF",
  canvas: "#F8F7F3",
  brown: "#795740",
  brownDark: "#5F402A",
  green: "#287653",
  greenBg: "#EAF4ED",
  red: "#B5473C",
  redBg: "#FBEDEA",
  amber: "#936B2E",
  amberBg: "#F8F0DF",
};

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("material-symbols-outlined select-none", className)}
    >
      {name}
    </span>
  );
}

function SectionHeading({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-[-0.02em] text-[#292720]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-[#77746B]">{description}</p>
        )}
      </div>

      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#795740] transition-colors hover:text-[#5F402A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] focus-visible:ring-offset-2"
        >
          {action}
          <Icon name="arrow_forward" className="text-base" />
        </button>
      )}
    </div>
  );
}

function Status({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-[#F0EEE8] text-[#625E54]",
    success: "bg-[#EAF4ED] text-[#287653]",
    warning: "bg-[#F8F0DF] text-[#936B2E]",
    danger: "bg-[#FBEDEA] text-[#B5473C]",
    brown: "bg-[#F1EAE3] text-[#795740]",
  };

  return (
    <span
      className={cx(
        "inline-flex w-fit items-center rounded-md px-2 py-1 text-[11px] font-medium leading-none",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "min-w-0 rounded-xl border border-[#E9E6DF] bg-white p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  tone = "brown",
  footer,
  onClick,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  tone?: Tone;
  footer?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[158px] min-w-0 flex-col rounded-xl border border-[#E9E6DF] bg-white p-4 text-left transition-colors hover:border-[#D4C5B7] hover:bg-[#FEFDFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#77746B]">{label}</span>
        <Icon
          name={icon}
          className={cx(
            "text-[19px]",
            tone === "danger"
              ? "text-[#B5473C]"
              : tone === "success"
                ? "text-[#287653]"
                : "text-[#795740]",
          )}
        />
      </div>

      <div className="mt-4 min-w-0">
        <p className="break-words text-[clamp(1.05rem,1.5vw,1.35rem)] font-semibold leading-tight tracking-[-0.045em] tabular-nums text-[#292720]">
          {value}
        </p>
        <p className="mt-1.5 text-xs leading-5 text-[#77746B]">{description}</p>
      </div>

      {footer && (
        <div className="mt-auto pt-3 text-xs font-medium">{footer}</div>
      )}
    </button>
  );
}

const metrics = [
  {
    label: "Total penjualan",
    value: 184500000,
    description: "Nilai penjualan periode ini",
    icon: "point_of_sale",
    tone: "brown" as Tone,
    footer: "+14,2% dari bulan lalu",
    footerTone: "success" as Tone,
    page: "pos" as PageView,
  },
  {
    label: "Pemasukan kas",
    value: 142250000,
    description: "DP dan pelunasan diterima",
    icon: "south_west",
    tone: "success" as Tone,
    footer: "Kas masuk aktual",
    footerTone: "neutral" as Tone,
    page: "cash-flow" as PageView,
  },
  {
    label: "Pengeluaran kas",
    value: 78600000,
    description: "Biaya operasional dan pembelian",
    icon: "north_east",
    tone: "danger" as Tone,
    footer: "5,1% lebih rendah",
    footerTone: "success" as Tone,
    page: "cash-flow" as PageView,
  },
  {
    label: "Saldo kas & bank",
    value: 215800000,
    description: "Seluruh akun kas yang tercatat",
    icon: "account_balance",
    tone: "brown" as Tone,
    footer: "Posisi saldo tercatat",
    footerTone: "neutral" as Tone,
    page: "cash-flow" as PageView,
  },
  {
    label: "Piutang aktif",
    value: 42250000,
    description: "Tagihan yang belum lunas",
    icon: "receipt_long",
    tone: "danger" as Tone,
    footer: "3 tagihan lewat tempo",
    footerTone: "danger" as Tone,
    page: "receivables" as PageView,
  },
  {
    label: "Laba bersih",
    value: 52400000,
    description: "Laba sesuai perhitungan tercatat",
    icon: "trending_up",
    tone: "success" as Tone,
    footer: "Margin tercatat 28,4%",
    footerTone: "neutral" as Tone,
    page: "financial-reports" as PageView,
  },
];

const bankAccounts = [
  {
    short: "BCA",
    name: "BCA Bisnis Giro",
    purpose: "Operasional & pelunasan",
    amount: 148500000,
  },
  {
    short: "MDR",
    name: "Mandiri Giro Bisnis",
    purpose: "Vendor & logistik",
    amount: 54300000,
  },
  {
    short: "KAS",
    name: "Kas showroom",
    purpose: "Kas operasional harian",
    amount: 13000000,
  },
];

const orders = [
  {
    product: "Meja Makan Trembesi 8 Kursi",
    code: "PO-2410-089",
    customer: "Bpk. Irfan Maulana",
    stage: "Siap kirim",
    stageTone: "success" as Tone,
    deadline: "24 Okt",
    amount: 26500000,
    payment: "Lunas 100%",
    paymentTone: "success" as Tone,
  },
  {
    product: "Lemari Pakaian Teak 3 Pintu",
    code: "PO-2410-094",
    customer: "Ibu Diana Kusuma",
    stage: "Finishing melamic",
    stageTone: "brown" as Tone,
    deadline: "27 Okt",
    amount: 18200000,
    payment: "DP 50% masuk",
    paymentTone: "neutral" as Tone,
  },
  {
    product: "Kitchen Set Minimalis Oak",
    code: "PO-2410-098",
    customer: "Arsitek Studio Batavia",
    stage: "Perakitan",
    stageTone: "neutral" as Tone,
    deadline: "2 Nov",
    amount: 48000000,
    payment: "DP 40% masuk",
    paymentTone: "neutral" as Tone,
  },
  {
    product: "Sofa Bed Scandinavian 3-Seater",
    code: "PO-2410-101",
    customer: "Bpk. Rahmat Sentosa",
    stage: "Menunggu kain",
    stageTone: "danger" as Tone,
    deadline: "5 Nov",
    amount: 12500000,
    payment: "DP 50% masuk",
    paymentTone: "neutral" as Tone,
  },
];

const stockAlerts = [
  {
    name: "Busa Density 28",
    quantity: "4 lembar",
    minimum: "15 lembar",
    level: "Kritis",
    tone: "danger" as Tone,
  },
  {
    name: "Kayu Jati Grade A",
    quantity: "1,8 m³",
    minimum: "3,5 m³",
    level: "Menipis",
    tone: "warning" as Tone,
  },
  {
    name: "Kain Beludru Walnut",
    quantity: "12 meter",
    minimum: "25 meter",
    level: "Menipis",
    tone: "warning" as Tone,
  },
];

const receivables = [
  {
    customer: "Toko Mebel Subur Makmur",
    invoice: "INV-2024-0812",
    detail: "Reseller grosir",
    amount: 18500000,
    status: "Lewat 4 hari",
    tone: "danger" as Tone,
    phone: "6281288219011",
    message:
      "Halo Bpk. Subur, mengingatkan invoice INV-2024-0812. Mohon informasi terkait pembayaran. Terima kasih.",
  },
  {
    customer: "Ibu Ratna Diningrum",
    invoice: "INV-2024-0944",
    detail: "Custom living room",
    amount: 8250000,
    status: "Jatuh tempo besok",
    tone: "warning" as Tone,
    phone: "6281388224115",
    message:
      "Halo Ibu Ratna, kami ingin mengingatkan tagihan invoice mebel yang jatuh tempo besok. Terima kasih.",
  },
];

const transactions = [
  {
    name: "Kursi Santai Rattan Armchair",
    detail: "14:32 WIB · Showroom kasir",
    amount: 3850000,
    payment: "Lunas",
    paymentTone: "success" as Tone,
    status: "Selesai",
  },
  {
    name: "Meja Konsol Jati Salur",
    detail: "11:15 WIB · TRX-982",
    amount: 6200000,
    payment: "DP 50%",
    paymentTone: "brown" as Tone,
    status: "Siap kirim",
  },
  {
    name: "Set Kursi Cafe Retro (6 pcs)",
    detail: "Kemarin · B2B commercial",
    amount: 9600000,
    payment: "Kredit 14 hari",
    paymentTone: "warning" as Tone,
    status: "Dikirim",
  },
  {
    name: "Nakas Bedside Table Walnut",
    detail: "Kemarin · Online store",
    amount: 2450000,
    payment: "Lunas",
    paymentTone: "success" as Tone,
    status: "Selesai",
  },
  {
    name: "Credenza TV Minimalis 180 cm",
    detail: "21 Okt · Custom workshop",
    amount: 7800000,
    payment: "Lunas",
    paymentTone: "success" as Tone,
    status: "Dikirim",
  },
];

const chartData = [
  { label: "1–7 Okt", incoming: 95, outgoing: 62, net: 50 },
  { label: "8–14 Okt", incoming: 115, outgoing: 75, net: 85 },
  { label: "15–21 Okt", incoming: 130, outgoing: 55, net: 112 },
  { label: "22–28 Okt", incoming: 112, outgoing: 45, net: 95 },
];

function CashFlowChart() {
  const max = 140;
  const baseY = 150;
  const chartHeight = 120;
  const xPositions = [90, 250, 410, 570];

  const yFor = (value: number) => baseY - (value / max) * chartHeight;

  const line = chartData
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${xPositions[index]} ${yFor(point.net)}`,
    )
    .join(" ");

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#77746B]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#795740]" />
          Kas masuk
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#C9B6A5]" />
          Kas keluar
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-[2px] w-4 bg-[#287653]" />
          Tren bersih
        </span>
      </div>

      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox="0 0 660 190"
          role="img"
          aria-label="Grafik perbandingan kas masuk, kas keluar, dan tren bersih mingguan"
          className="h-auto w-full"
        >
          {[30, 70, 110, 150].map((y) => (
            <line
              key={y}
              x1="30"
              x2="640"
              y1={y}
              y2={y}
              stroke="#E9E6DF"
              strokeDasharray={y === 150 ? "0" : "4 5"}
            />
          ))}

          {chartData.map((point, index) => {
            const x = xPositions[index];

            return (
              <g key={point.label}>
                <rect
                  x={x - 25}
                  y={yFor(point.incoming)}
                  width="20"
                  height={baseY - yFor(point.incoming)}
                  rx="3"
                  fill="#795740"
                />
                <rect
                  x={x}
                  y={yFor(point.outgoing)}
                  width="20"
                  height={baseY - yFor(point.outgoing)}
                  rx="3"
                  fill="#C9B6A5"
                />
                <text
                  x={x - 1}
                  y="176"
                  fill="#77746B"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              </g>
            );
          })}

          <path
            d={line}
            fill="none"
            stroke="#287653"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartData.map((point, index) => (
            <circle
              key={point.label}
              cx={xPositions[index]}
              cy={yFor(point.net)}
              r="4"
              fill="white"
              stroke="#287653"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-start gap-3 rounded-lg bg-[#F8F7F3] p-3">
        <Icon name="lightbulb" className="mt-0.5 text-lg text-[#795740]" />
        <div>
          <p className="text-xs font-medium text-[#292720]">
            Kas masuk lebih besar daripada kas keluar pada data contoh ini.
          </p>
          <p className="mt-1 text-xs leading-5 text-[#77746B]">
            Gunakan tren ini untuk memantau likuiditas, bukan sebagai pengganti
            laporan laba rugi.
          </p>
        </div>
      </div>
    </div>
  );
}

function BankBreakdown({ onNavigate }: { onNavigate: () => void }) {
  const total = bankAccounts.reduce((sum, account) => sum + account.amount, 0);

  return (
    <Panel className="flex flex-col">
      <SectionHeading
        title="Saldo kas & bank"
        description="Rincian saldo berdasarkan akun"
      />

      <div className="mt-5 space-y-5">
        {bankAccounts.map((account) => {
          const percent = total > 0 ? (account.amount / total) * 100 : 0;

          return (
            <div key={account.short}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#292720]">
                    {account.name}
                  </p>
                  <p className="mt-1 text-xs text-[#77746B]">
                    {account.purpose}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#292720]">
                  {money(account.amount)}
                </p>
              </div>

              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#EFEEE9]"
                role="progressbar"
                aria-label={`Proporsi saldo ${account.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percent)}
              >
                <div
                  className="h-full rounded-full bg-[#795740]"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="mt-1 text-right text-[11px] tabular-nums text-[#77746B]">
                {percent.toLocaleString("id-ID", {
                  maximumFractionDigits: 1,
                })}
                %
              </p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNavigate}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-[#E9E6DF] px-3 py-2.5 text-xs font-medium text-[#5F402A] transition-colors hover:bg-[#F8F7F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]"
      >
        <Icon name="sync_alt" className="text-base" />
        Mutasi & rekonsiliasi
      </button>
    </Panel>
  );
}

function OrderList({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Panel>
      <SectionHeading
        title="Produksi & pesanan"
        description="Pesanan yang sedang dikerjakan atau menunggu pengiriman"
        action="Semua pesanan"
        onAction={onNavigate}
      />

      <div className="mt-4 divide-y divide-[#F0EEE8]">
        {orders.map((order) => (
          <button
            key={order.code}
            type="button"
            onClick={onNavigate}
            className="flex w-full flex-col gap-3 py-4 text-left transition-colors first:pt-1 hover:bg-[#FEFDFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#795740] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#292720]">
                {order.product}
              </p>

              <p className="mt-1 text-xs leading-5 text-[#77746B]">
                {order.code} <span className="px-1">·</span> {order.customer}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Status tone={order.stageTone}>{order.stage}</Status>
                <span className="text-xs text-[#77746B]">
                  Target {order.deadline}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:min-w-[150px] sm:flex-col sm:items-end sm:justify-center">
              <span className="text-sm font-semibold tabular-nums text-[#292720]">
                {money(order.amount)}
              </span>
              <Status tone={order.paymentTone}>{order.payment}</Status>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function StockAlerts({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Panel>
      <SectionHeading
        title="Stok perlu diperhatikan"
        description="Bahan yang sudah di bawah batas minimum"
        action="Kelola stok"
        onAction={onNavigate}
      />

      <div className="mt-4 divide-y divide-[#F0EEE8]">
        {stockAlerts.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#292720]">{item.name}</p>
              <p className="mt-1 text-xs text-[#77746B]">
                Minimum {item.minimum}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-[#292720]">
                {item.quantity}
              </p>
              <div className="mt-1">
                <Status tone={item.tone}>{item.level}</Status>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ReceivablesPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Panel>
      <SectionHeading
        title="Piutang perlu ditindaklanjuti"
        description="Tagihan yang mendekati atau melewati jatuh tempo"
        action="Semua piutang"
        onAction={onNavigate}
      />

      <div className="mt-4 space-y-3">
        {receivables.map((item) => (
          <div
            key={item.invoice}
            className="rounded-lg border border-[#E9E6DF] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-5 text-[#292720]">
                  {item.customer}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#77746B]">
                  {item.invoice} · {item.detail}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-[#292720]">
                  {money(item.amount)}
                </p>
                <div className="mt-1">
                  <Status tone={item.tone}>{item.status}</Status>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <a
                href={`https://wa.me/${item.phone}?text=${encodeURIComponent(item.message)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9E6DF] px-3 py-2 text-xs font-medium text-[#5F402A] transition-colors hover:bg-[#F8F7F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]"
              >
                <Icon name="chat" className="text-base" />
                Hubungi
              </a>

              <button
                type="button"
                onClick={onNavigate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#795740] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5F402A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] focus-visible:ring-offset-2"
              >
                <Icon name="payments" className="text-base" />
                Catat pembayaran
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RecentTransactions({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Panel className="flex flex-col">
      <SectionHeading
        title="Transaksi terbaru"
        description="Ringkasan aktivitas penjualan"
        action="Lihat semua"
        onAction={onNavigate}
      />

      <div className="mt-3 divide-y divide-[#F0EEE8]">
        {transactions.map((tx) => (
          <div
            key={tx.name}
            className="flex items-start justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium leading-5 text-[#292720]">
                {tx.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#77746B]">
                {tx.detail}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Status tone={tx.paymentTone}>{tx.payment}</Status>
                <Status>{tx.status}</Status>
              </div>
            </div>

            <p className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-[#292720]">
              {money(tx.amount)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-auto border-t border-[#E9E6DF] pt-3 text-xs text-[#77746B]">
        Menampilkan 5 transaksi contoh.
      </p>
    </Panel>
  );
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickTx,
  onToast,
}) => {
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilter>("month");

  const dateFilters: { value: DateFilter; label: string }[] = [
    { value: "today", label: "Hari ini" },
    { value: "7days", label: "7 hari" },
    { value: "month", label: "Bulan ini" },
    { value: "lastMonth", label: "Bulan lalu" },
    { value: "range", label: "Pilih tanggal" },
  ];

  const handleDateFilter = (filter: DateFilter) => {
    setActiveDateFilter(filter);

    if (filter === "range") {
      onToast("Pilih rentang tanggal khusus");
    }
  };

  return (
    <main className="mt-5 flex w-full flex-col gap-6 pb-8 sm:mt-6">
      {/* Header */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.045em] text-[#292720]">
              Dashboard
            </h1>
            <span className="rounded-md bg-[#F0EEE8] px-2.5 py-1 text-xs font-medium text-[#625E54]">
              Oktober 2024
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77746B]">
            Ringkasan keuangan, persediaan, dan pesanan bisnis mebel.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E9E6DF] bg-white p-1"
            aria-label="Filter periode dashboard"
          >
            {dateFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleDateFilter(filter.value)}
                aria-pressed={activeDateFilter === filter.value}
                className={cx(
                  "rounded-md px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]",
                  activeDateFilter === filter.value
                    ? "bg-[#795740] text-white"
                    : "text-[#625E54] hover:bg-[#F8F7F3] hover:text-[#292720]",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button
              type="button"
              onClick={() => onOpenQuickTx("inflow")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E9E6DF] bg-white px-3 py-2.5 text-xs font-medium text-[#292720] transition-colors hover:bg-[#F8F7F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]"
            >
              <Icon name="add" className="text-base text-[#287653]" />
              Pemasukan
            </button>

            <button
              type="button"
              onClick={() => onOpenQuickTx("outflow")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E9E6DF] bg-white px-3 py-2.5 text-xs font-medium text-[#292720] transition-colors hover:bg-[#F8F7F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]"
            >
              <Icon name="remove" className="text-base text-[#B5473C]" />
              Pengeluaran
            </button>

            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#795740] px-3 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#5F402A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] focus-visible:ring-offset-2"
            >
              <Icon name="inventory_2" className="text-base" />
              Stok masuk
            </button>
          </div>
        </div>
      </header>

      {/* Financial metrics */}
      <section aria-label="Ringkasan keuangan">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#292720]">
            Ringkasan keuangan
          </h2>
          <span className="text-xs text-[#77746B]">Periode yang dipilih</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={money(metric.value)}
              description={metric.description}
              icon={metric.icon}
              tone={metric.tone}
              onClick={() => onNavigate(metric.page)}
              footer={
                <span
                  className={
                    metric.footerTone === "success"
                      ? "text-[#287653]"
                      : metric.footerTone === "danger"
                        ? "text-[#B5473C]"
                        : "text-[#77746B]"
                  }
                >
                  {metric.footer}
                </span>
              }
            />
          ))}
        </div>
      </section>

      {/* Cash flow */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <SectionHeading
            title="Arus kas"
            description="Perbandingan uang masuk dan keluar per minggu"
          />
          <CashFlowChart />
        </Panel>

        <div className="xl:col-span-4">
          <BankBreakdown onNavigate={() => onNavigate("cash-flow")} />
        </div>
      </section>

      {/* Operations */}
      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-7">
          <OrderList onNavigate={() => onNavigate("orders")} />
          <StockAlerts onNavigate={() => onNavigate("inventory")} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:col-span-5">
          <ReceivablesPanel onNavigate={() => onNavigate("receivables")} />
          <RecentTransactions onNavigate={() => onNavigate("cash-flow")} />
        </div>
      </section>

      <footer className="flex flex-col gap-1 border-t border-[#E9E6DF] pt-4 text-xs text-[#77746B] sm:flex-row sm:items-center sm:justify-between">
        <span>Ringkasan operasional bisnis mebel</span>
        <span>Data contoh · Hubungkan sumber data untuk angka aktual</span>
      </footer>
    </main>
  );
};

export default DashboardView;
