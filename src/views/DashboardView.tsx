import React from "react";
import { PageView } from "../types";

interface DashboardViewProps {
  onNavigate: (page: PageView) => void;
  onOpenQuickTx: (actionType?: string) => void;
  onToast: (msg: string) => void;
}

const C = {
  text: "#30251E",
  muted: "#82746D",
  border: "#E5E2DD",
  background: "#F6F3EE",
  surface: "#FCFAF7",
  brown: "#5F402A",
  brownHover: "#795740",
  green: "#28734B",
  greenBg: "#EDF5EE",
  red: "#A3443F",
  redBg: "#F9EEEB",
  amber: "#8B672F",
  amberBg: "#F8F0DF",
};

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

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

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-[#E5E2DD] bg-[#FCFAF7] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-[#30251E]">{title}</h2>

      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#795740] hover:text-[#5F402A]"
        >
          {action}
          <Icon name="arrow_forward" className="text-base" />
        </button>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  iconColor = C.brown,
  onClick,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  iconColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 rounded-xl border border-[#E5E2DD] bg-[#FCFAF7] p-4 text-left transition hover:border-[#CFC1B3] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[#82746D]">{label}</span>
        <Icon name={icon} className="text-[20px] text-[#82746D]" />
      </div>

      <p className="mt-4 break-words text-xl font-semibold tracking-tight text-[#30251E]">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: iconColor }}
        />
        <p className="text-xs leading-5 text-[#82746D]">{description}</p>
      </div>
    </button>
  );
}

const recentTransactions = [
  {
    id: "TRX-1028",
    title: "Penjualan meja makan",
    detail: "Hari ini · Pelunasan",
    amount: 6200000,
    type: "in",
  },
  {
    id: "TRX-1027",
    title: "Pembelian bahan baku",
    detail: "Hari ini · Operasional",
    amount: 1850000,
    type: "out",
  },
  {
    id: "TRX-1026",
    title: "DP pesanan lemari",
    detail: "Kemarin · Uang muka",
    amount: 4500000,
    type: "in",
  },
  {
    id: "TRX-1025",
    title: "Biaya pengiriman",
    detail: "Kemarin · Logistik",
    amount: 350000,
    type: "out",
  },
];

const attentionItems = [
  {
    title: "Tagihan melewati jatuh tempo",
    detail: "Toko Mebel Subur Makmur",
    amount: 18500000,
    status: "Lewat 4 hari",
    tone: "danger",
    page: "receivables" as PageView,
    icon: "receipt_long",
  },
  {
    title: "Tagihan segera jatuh tempo",
    detail: "Ibu Ratna Diningrum",
    amount: 8250000,
    status: "Besok",
    tone: "warning",
    page: "receivables" as PageView,
    icon: "schedule",
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const summary = {
    balance: 215800000,
    incoming: 142250000,
    outgoing: 78600000,
    receivables: 42250000,
  };

  return (
    <div className="flex w-full flex-col gap-6 text-[#30251E]">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Ringkasan {monthLabel}</h2>
          <p className="text-xs text-[#82746D]">Klik kartu untuk membuka detail</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Saldo kas"
            value={money(summary.balance)}
            description="Uang di kas dan bank"
            icon="account_balance"
            iconColor={C.brown}
            onClick={() => onNavigate("cash-flow")}
          />

          <MetricCard
            label="Uang masuk"
            value={money(summary.incoming)}
            description="Pemasukan bulan ini"
            icon="south_west"
            iconColor={C.green}
            onClick={() => onNavigate("cash-flow")}
          />

          <MetricCard
            label="Uang keluar"
            value={money(summary.outgoing)}
            description="Pengeluaran bulan ini"
            icon="north_east"
            iconColor={C.red}
            onClick={() => onNavigate("cash-flow")}
          />

          <MetricCard
            label="Piutang"
            value={money(summary.receivables)}
            description="Tagihan belum diterima"
            icon="receipt_long"
            iconColor={C.amber}
            onClick={() => onNavigate("receivables")}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <Panel className="p-4 sm:p-5">
          <SectionHeading
            title="Transaksi terbaru"
            action="Lihat semua"
            onAction={() => onNavigate("cash-flow")}
          />

          <div className="mt-3 divide-y divide-[#E5E2DD]">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 py-3 first:pt-2 last:pb-1"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    tx.type === "in" ? "bg-[#EDF5EE]" : "bg-[#F9EEEB]"
                  }`}
                >
                  <Icon
                    name={tx.type === "in" ? "south_west" : "north_east"}
                    className={`text-lg ${
                      tx.type === "in" ? "text-[#28734B]" : "text-[#A3443F]"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.title}</p>
                  <p className="mt-1 text-xs text-[#82746D]">{tx.detail}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      tx.type === "in" ? "text-[#28734B]" : "text-[#30251E]"
                    }`}
                  >
                    {tx.type === "in" ? "+" : "-"}
                    {money(tx.amount)}
                  </p>
                  <p className="mt-1 text-[10px] text-[#A69A8E]">{tx.id}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionHeading
            title="Perlu ditindaklanjuti"
            action="Lihat piutang"
            onAction={() => onNavigate("receivables")}
          />

          <div className="mt-3 divide-y divide-[#E5E2DD]">
            {attentionItems.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate(item.page)}
                className="flex w-full items-start gap-3 py-4 text-left first:pt-3 last:pb-1"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    item.tone === "danger" ? "bg-[#F9EEEB]" : "bg-[#F8F0DF]"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    className={`text-lg ${
                      item.tone === "danger"
                        ? "text-[#A3443F]"
                        : "text-[#8B672F]"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-[#82746D]">{item.detail}</p>
                  <span
                    className={`mt-2 inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${
                      item.tone === "danger"
                        ? "bg-[#F9EEEB] text-[#A3443F]"
                        : "bg-[#F8F0DF] text-[#8B672F]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {money(item.amount)}
                  </p>
                  <Icon
                    name="chevron_right"
                    className="mt-2 text-lg text-[#A69A8E]"
                  />
                </div>
              </button>
            ))}
          </div>

        </Panel>
      </section>
    </div>
  );
};

export default DashboardView;
