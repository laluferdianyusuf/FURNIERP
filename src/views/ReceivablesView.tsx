import React, { useMemo, useState } from "react";
import { PageView, ReceivableInvoice } from "../types";

type AccountName = "BCA" | "Mandiri" | "Kas Tunai";
type CustomerTier = "Grosir" | "Reseller" | "Retail";
type TierFilter = "Semua Tier" | CustomerTier;
type StatusFilter = "Semua Status" | "Overdue" | "Lancar";

interface ReceivablesViewProps {
  receivables: ReceivableInvoice[];
  onNavigate: (page: PageView) => void;
  onSettleInvoice?: (
    invoiceId: string,
    amount: number,
    account: AccountName,
    notes: string,
  ) => void;
}

interface AgingBucket {
  id: string;
  label: string;
  color: string;
  barColor: string;
  amount: number;
  count: number;
}

const COLORS = {
  background: "#f6f3ee",
  surface: "#fcf9f4",
  soft: "#f0ede7",
  border: "#e5e0d8",
  text: "#29251f",
  secondary: "#66584c",
  muted: "#8a7d70",
  brown: "#654832",
  brownHover: "#795940",
  green: "#52755a",
  greenSoft: "#edf3ec",
  red: "#a85348",
  redSoft: "#f8ece8",
  amber: "#9a6b26",
  amberSoft: "#f8f0df",
};

const ACCOUNT_OPTIONS: { value: AccountName; label: string }[] = [
  { value: "BCA", label: "BCA Bisnis Giro" },
  { value: "Mandiri", label: "Mandiri Giro Bisnis" },
  { value: "Kas Tunai", label: "Kas Tunai Showroom" },
];

const money = (value: number) =>
  `Rp ${Math.max(0, value).toLocaleString("id-ID")}`;

const Icon: React.FC<{
  name: string;
  className?: string;
}> = ({ name, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

const SectionCard: React.FC<{
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
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}> = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#654832] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#795940] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

const SecondaryButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}> = ({ children, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e0d8] bg-[#fcf9f4] px-3.5 py-2.5 text-sm font-medium text-[#50453e] transition-colors hover:bg-[#f0ede7] ${className}`}
  >
    {children}
  </button>
);

const StatusBadge: React.FC<{
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

const KpiCard: React.FC<{
  label: string;
  value: string;
  icon: string;
  description: string;
  tone?: "default" | "green" | "red" | "amber";
}> = ({ label, value, icon, description, tone = "default" }) => {
  const iconStyles = {
    default: "bg-[#eee5dc] text-[#654832]",
    green: "bg-[#edf3ec] text-[#52755a]",
    red: "bg-[#f8ece8] text-[#a85348]",
    amber: "bg-[#f8f0df] text-[#9a6b26]",
  };

  const valueStyles = {
    default: "text-[#29251f]",
    green: "text-[#52755a]",
    red: "text-[#a85348]",
    amber: "text-[#9a6b26]",
  };

  return (
    <SectionCard className="flex min-w-0 flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase leading-5 tracking-wide text-[#82746d]">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconStyles[tone]}`}
        >
          <Icon name={icon} className="text-xl" />
        </span>
      </div>

      <p
        className={`mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl ${valueStyles[tone]}`}
      >
        {value}
      </p>

      <p className="mt-3 border-t border-[#e5e0d8] pt-3 text-xs leading-5 text-[#82746d]">
        {description}
      </p>
    </SectionCard>
  );
};

const PanelHeading: React.FC<{
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
    {action}
  </div>
);

function getAgingBuckets(receivables: ReceivableInvoice[]): AgingBucket[] {
  const buckets: AgingBucket[] = [
    {
      id: "current",
      label: "Belum jatuh tempo",
      color: "#52755a",
      barColor: "bg-[#78947b]",
      amount: 0,
      count: 0,
    },
    {
      id: "1-15",
      label: "1–15 hari",
      color: "#9a6b26",
      barColor: "bg-[#c5a46b]",
      amount: 0,
      count: 0,
    },
    {
      id: "16-30",
      label: "16–30 hari",
      color: "#9b7554",
      barColor: "bg-[#b89a7b]",
      amount: 0,
      count: 0,
    },
    {
      id: "31-60",
      label: "31–60 hari",
      color: "#a85348",
      barColor: "bg-[#c77c6e]",
      amount: 0,
      count: 0,
    },
    {
      id: "60+",
      label: "Lebih dari 60 hari",
      color: "#873e35",
      barColor: "bg-[#873e35]",
      amount: 0,
      count: 0,
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  receivables.forEach((invoice) => {
    const amount = Math.max(0, invoice.remainingDebt);
    if (amount <= 0) return;

    // Tanggal jatuh tempo diharapkan bisa dibaca browser,
    // misalnya "2026-10-22" atau "22 Oktober 2026".
    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let overdueDays = 0;

    if (!Number.isNaN(dueDate.getTime())) {
      overdueDays = Math.max(
        0,
        Math.floor((today.getTime() - dueDate.getTime()) / 86400000),
      );
    } else if (invoice.isOverdue) {
      // Fallback jika format tanggal tidak dapat diparsing.
      overdueDays = 31;
    }

    let index = 0;

    if (overdueDays === 0) index = 0;
    else if (overdueDays <= 15) index = 1;
    else if (overdueDays <= 30) index = 2;
    else if (overdueDays <= 60) index = 3;
    else index = 4;

    buckets[index].amount += amount;
    buckets[index].count += 1;
  });

  return buckets;
}

const AgingSchedule: React.FC<{
  buckets: AgingBucket[];
  total: number;
}> = ({ buckets, total }) => (
  <SectionCard className="p-4 sm:p-5">
    <PanelHeading
      icon="calendar_month"
      title="Umur Piutang"
      description="Distribusi sisa tagihan berdasarkan tanggal jatuh tempo."
      action={
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-[#82746d]">Total piutang aktif</p>
          <p className="mt-1 text-sm font-bold text-[#29251f]">
            {money(total)}
          </p>
        </div>
      }
    />

    <div
      className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-[#f0ede7]"
      aria-label="Distribusi umur piutang"
    >
      {buckets.map((bucket) => {
        const percentage = total > 0 ? (bucket.amount / total) * 100 : 0;

        return (
          <div
            key={bucket.id}
            className={`h-full transition-all ${bucket.barColor}`}
            style={{ width: `${percentage}%` }}
            title={`${bucket.label}: ${percentage.toFixed(1)}%`}
          />
        );
      })}
    </div>

    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {buckets.map((bucket) => {
        const percentage = total > 0 ? (bucket.amount / total) * 100 : 0;

        return (
          <div
            key={bucket.id}
            className="rounded-lg border border-[#e5e0d8] bg-[#f6f3ee] p-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${bucket.barColor}`}
              />
              <span className="text-xs font-semibold text-[#66584c]">
                {bucket.label}
              </span>
            </div>

            <p className="mt-3 break-words text-sm font-bold text-[#29251f]">
              {money(bucket.amount)}
            </p>

            <p className="mt-1 text-[11px] text-[#82746d]">
              {percentage.toFixed(1)}% · {bucket.count} faktur
            </p>
          </div>
        );
      })}
    </div>
  </SectionCard>
);

const ReceivablesFilters: React.FC<{
  searchQuery: string;
  selectedTier: TierFilter;
  selectedStatus: StatusFilter;
  onSearchChange: (value: string) => void;
  onTierChange: (value: TierFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
}> = ({
  searchQuery,
  selectedTier,
  selectedStatus,
  onSearchChange,
  onTierChange,
  onStatusChange,
}) => (
  <SectionCard className="p-3 sm:p-4">
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_220px]">
      <div className="relative">
        <Icon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#82746d]"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari invoice, pelanggan, SPK..."
          aria-label="Cari invoice atau pelanggan"
          className="w-full rounded-lg border border-[#e5e0d8] bg-[#f6f3ee] py-2.5 pl-10 pr-3 text-sm text-[#29251f] outline-none transition focus:border-[#795940] focus:bg-white"
        />
      </div>

      <select
        value={selectedTier}
        onChange={(event) => onTierChange(event.target.value as TierFilter)}
        aria-label="Filter tier pelanggan"
        className="w-full rounded-lg border border-[#e5e0d8] bg-[#f6f3ee] px-3 py-2.5 text-sm text-[#50453e] outline-none focus:border-[#795940]"
      >
        <option value="Semua Tier">Semua Tier</option>
        <option value="Grosir">Grosir</option>
        <option value="Reseller">Reseller</option>
        <option value="Retail">Retail</option>
      </select>

      <select
        value={selectedStatus}
        onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
        aria-label="Filter status jatuh tempo"
        className="w-full rounded-lg border border-[#e5e0d8] bg-[#f6f3ee] px-3 py-2.5 text-sm text-[#50453e] outline-none focus:border-[#795940]"
      >
        <option value="Semua Status">Semua Status</option>
        <option value="Overdue">Lewat jatuh tempo</option>
        <option value="Lancar">Belum lewat jatuh tempo</option>
      </select>
    </div>
  </SectionCard>
);

const ReceivableTable: React.FC<{
  receivables: ReceivableInvoice[];
  onPay: (invoice: ReceivableInvoice) => void;
  onReminder: (invoice: ReceivableInvoice) => void;
}> = ({ receivables, onPay, onReminder }) => (
  <SectionCard className="overflow-hidden">
    <div className="flex flex-col gap-2 border-b border-[#e5e0d8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h2 className="text-base font-bold text-[#29251f]">Daftar Piutang</h2>
        <p className="mt-1 text-xs text-[#82746d]">
          Invoice, pembayaran, dan sisa tagihan pelanggan.
        </p>
      </div>

      <StatusBadge>{receivables.length} faktur</StatusBadge>
    </div>

    {receivables.length === 0 ? (
      <div className="flex flex-col items-center px-5 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ede7] text-[#82746d]">
          <Icon name="receipt_long" className="text-2xl" />
        </span>
        <h3 className="mt-4 text-sm font-bold text-[#29251f]">
          Tidak ada piutang ditemukan
        </h3>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[#82746d]">
          Coba ubah kata kunci pencarian atau filter yang sedang digunakan.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#e5e0d8] bg-[#f6f3ee] text-[10px] uppercase tracking-wider text-[#82746d]">
              <th className="px-4 py-3 font-semibold">Invoice / SPK</th>
              <th className="px-3 py-3 font-semibold">Pelanggan</th>
              <th className="px-3 py-3 font-semibold">Pesanan</th>
              <th className="px-3 py-3 text-right font-semibold">Nilai</th>
              <th className="px-3 py-3 text-right font-semibold">Terbayar</th>
              <th className="px-3 py-3 text-right font-semibold">
                Sisa Piutang
              </th>
              <th className="px-3 py-3 text-center font-semibold">
                Jatuh Tempo
              </th>
              <th className="px-3 py-3 text-center font-semibold">Plafon</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e5e0d8]">
            {receivables.map((invoice) => {
              const tierTone =
                invoice.customerTier === "Grosir"
                  ? "brown"
                  : invoice.customerTier === "Reseller"
                    ? "amber"
                    : "neutral";

              const dueTone = invoice.isOverdue
                ? "red"
                : invoice.status === "Besok"
                  ? "amber"
                  : "green";

              return (
                <tr
                  key={invoice.id}
                  className="transition-colors hover:bg-[#f6f3ee]"
                >
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="font-bold text-[#654832]">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="mt-1 text-[11px] text-[#82746d]">
                      {invoice.date}
                    </p>
                    <p className="mt-1 text-[10px] text-[#82746d]">
                      SPK: {invoice.spkRef}
                    </p>
                  </td>

                  <td className="max-w-[190px] px-3 py-4">
                    <p className="truncate font-semibold text-[#29251f]">
                      {invoice.customerName}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge tone={tierTone}>
                        {invoice.customerTier}
                      </StatusBadge>
                      {invoice.picName && (
                        <span className="truncate text-[10px] text-[#82746d]">
                          {invoice.picName}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#82746d]">
                      {invoice.phone}
                    </p>
                  </td>

                  <td className="max-w-[190px] px-3 py-4">
                    <p className="truncate font-semibold text-[#29251f]">
                      {invoice.itemSummary}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#82746d]">
                      {invoice.orderDescription}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-right font-medium text-[#29251f]">
                    {money(invoice.totalAmount)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-right font-medium text-[#52755a]">
                    {money(invoice.paidAmount)}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-right">
                    <span
                      className={`font-bold ${
                        invoice.isOverdue ? "text-[#a85348]" : "text-[#29251f]"
                      }`}
                    >
                      {money(invoice.remainingDebt)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-center">
                    <StatusBadge tone={dueTone}>{invoice.status}</StatusBadge>
                    <p className="mt-1.5 text-[10px] text-[#82746d]">
                      {invoice.dueDate}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-center">
                    {invoice.creditLimit > 0 ? (
                      <div className="mx-auto w-20">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#e5e0d8]">
                          <div
                            className={`h-full rounded-full ${
                              invoice.creditUsedPercent > 80
                                ? "bg-[#a85348]"
                                : "bg-[#795940]"
                            }`}
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, invoice.creditUsedPercent),
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1.5 text-[10px] text-[#82746d]">
                          {invoice.creditUsedPercent}% digunakan
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#82746d]">
                        Tunai / DP
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onReminder(invoice)}
                        title="Siapkan pengingat WhatsApp"
                        aria-label={`Siapkan pengingat WhatsApp untuk ${invoice.customerName}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e0d8] text-[#66584c] transition hover:bg-[#edf3ec] hover:text-[#52755a]"
                      >
                        <Icon name="chat" className="text-lg" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPay(invoice)}
                        disabled={invoice.remainingDebt <= 0}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#654832] px-3 py-2 font-semibold text-white transition hover:bg-[#795940] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="payments" className="text-base" />
                        Bayar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </SectionCard>
);

const ModalShell: React.FC<{
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="settlement-modal-title"
      className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e5e0d8] bg-[#fcf9f4] shadow-2xl"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[#e5e0d8] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee5dc] text-[#654832]">
            <Icon name="payments" className="text-xl" />
          </span>
          <div>
            <h2
              id="settlement-modal-title"
              className="font-bold text-[#29251f]"
            >
              {title}
            </h2>
            <p className="mt-1 text-xs text-[#82746d]">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#82746d] transition hover:bg-[#f0ede7] hover:text-[#29251f]"
        >
          <Icon name="close" className="text-xl" />
        </button>
      </header>

      <div className="overflow-y-auto">{children}</div>
    </section>
  </div>
);

const SettlementModal: React.FC<{
  invoice: ReceivableInvoice;
  onClose: () => void;
  onSubmit: (
    invoice: ReceivableInvoice,
    amount: number,
    account: AccountName,
    notes: string,
  ) => void;
}> = ({ invoice, onClose, onSubmit }) => {
  const [amount, setAmount] = useState(invoice.remainingDebt);
  const [account, setAccount] = useState<AccountName>("BCA");
  const [notes, setNotes] = useState(
    `Pelunasan tagihan ${invoice.invoiceNumber} via transfer`,
  );

  const remainingDebt = Math.max(0, invoice.remainingDebt);
  const validAmount =
    Number.isFinite(amount) && amount > 0 && amount <= remainingDebt;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validAmount || !notes.trim()) return;

    onSubmit(invoice, amount, account, notes.trim());
  };

  return (
    <ModalShell
      title="Catat Pelunasan"
      subtitle={invoice.invoiceNumber}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <div className="rounded-xl border border-[#e5e0d8] bg-[#f6f3ee] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold text-[#29251f]">
                {invoice.customerName}
              </p>
              <p className="mt-1 text-xs text-[#82746d]">
                {invoice.itemSummary}
              </p>
            </div>
            <StatusBadge tone="brown">{invoice.customerTier}</StatusBadge>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e5e0d8] pt-3">
            <span className="text-xs text-[#82746d]">Sisa piutang</span>
            <span className="text-base font-bold text-[#a85348]">
              {money(remainingDebt)}
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="settlement-amount"
            className="mb-2 block text-sm font-semibold text-[#50453e]"
          >
            Nominal pembayaran
          </label>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAmount(remainingDebt)}
              className="rounded-lg border border-[#e5e0d8] bg-[#f6f3ee] px-3 py-2 text-xs font-semibold text-[#654832] transition hover:bg-[#eee5dc]"
            >
              Lunasi penuh
            </button>

            <button
              type="button"
              onClick={() => setAmount(Math.round(remainingDebt / 2))}
              className="rounded-lg border border-[#e5e0d8] bg-[#f6f3ee] px-3 py-2 text-xs font-semibold text-[#66584c] transition hover:bg-[#eee5dc]"
            >
              Bayar 50%
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#82746d]">
              Rp
            </span>
            <input
              id="settlement-amount"
              type="number"
              min={1}
              max={remainingDebt}
              step={1}
              required
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value === "" ? 0 : Number(event.target.value),
                )
              }
              className="w-full rounded-lg border border-[#e5e0d8] bg-white py-3 pl-10 pr-3 text-base font-bold text-[#29251f] outline-none transition focus:border-[#795940]"
            />
          </div>

          <p className="mt-1.5 text-xs text-[#82746d]">
            Maksimal pembayaran: {money(remainingDebt)}
          </p>

          {!validAmount && (
            <p className="mt-1 text-xs text-[#a85348]">
              Nominal harus lebih dari Rp 0 dan tidak boleh melebihi sisa
              piutang.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="settlement-account"
            className="mb-2 block text-sm font-semibold text-[#50453e]"
          >
            Rekening penerimaan
          </label>
          <select
            id="settlement-account"
            value={account}
            onChange={(event) => setAccount(event.target.value as AccountName)}
            className="w-full rounded-lg border border-[#e5e0d8] bg-white px-3 py-3 text-sm text-[#29251f] outline-none focus:border-[#795940]"
          >
            {ACCOUNT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="settlement-notes"
            className="mb-2 block text-sm font-semibold text-[#50453e]"
          >
            Catatan / bukti pembayaran
          </label>
          <textarea
            id="settlement-notes"
            required
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contoh: Transfer BCA, referensi transaksi..."
            className="w-full resize-y rounded-lg border border-[#e5e0d8] bg-white px-3 py-3 text-sm text-[#29251f] outline-none focus:border-[#795940]"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e5e0d8] pt-4 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose}>Batal</SecondaryButton>

          <PrimaryButton type="submit" disabled={!validAmount || !notes.trim()}>
            <Icon name="check_circle" className="text-lg" />
            Simpan Pelunasan
          </PrimaryButton>
        </div>
      </form>
    </ModalShell>
  );
};

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  receivables,
  onNavigate,
  onSettleInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<TierFilter>("Semua Tier");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilter>("Semua Status");
  const [activeInvoice, setActiveInvoice] = useState<ReceivableInvoice | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredReceivables = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return receivables.filter((invoice) => {
      const matchesSearch =
        !query ||
        [
          invoice.invoiceNumber,
          invoice.customerName,
          invoice.spkRef,
          invoice.itemSummary,
          invoice.orderDescription,
          invoice.phone,
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesTier =
        selectedTier === "Semua Tier" || invoice.customerTier === selectedTier;

      const matchesStatus =
        selectedStatus === "Semua Status" ||
        (selectedStatus === "Overdue" && invoice.isOverdue) ||
        (selectedStatus === "Lancar" && !invoice.isOverdue);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [receivables, searchQuery, selectedTier, selectedStatus]);

  const totalOutstanding = receivables.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.remainingDebt),
    0,
  );

  const overdueInvoices = receivables.filter(
    (invoice) => invoice.isOverdue && invoice.remainingDebt > 0,
  );

  const overdueTotal = overdueInvoices.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.remainingDebt),
    0,
  );

  const overdueCount = overdueInvoices.length;

  const agingBuckets = useMemo(
    () => getAgingBuckets(receivables),
    [receivables],
  );

  const showToast = (message: string) => {
    // Menggunakan timeout yang dikelola oleh React agar notifikasi
    // tidak membutuhkan library tambahan.
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3000);
  };

  const handleSendWAReminder = (invoice: ReceivableInvoice) => {
    // Ini belum mengirim pesan melalui WhatsApp API.
    // Pesan hanya menginformasikan bahwa pengingat perlu disiapkan.
    showToast(
      `Pengingat untuk ${invoice.customerName} (${invoice.invoiceNumber}) siap disiapkan.`,
    );
  };

  const handleExecutePayment = (
    invoice: ReceivableInvoice,
    amount: number,
    account: AccountName,
    notes: string,
  ) => {
    if (amount <= 0 || amount > invoice.remainingDebt) return;

    if (!onSettleInvoice) {
      showToast(
        "Pencatatan belum tersambung. Hubungkan fungsi pelunasan ke backend terlebih dahulu.",
      );
      return;
    }

    onSettleInvoice(invoice.id, amount, account, notes);

    showToast(
      `Pelunasan ${money(amount)} untuk ${invoice.customerName} dicatat.`,
    );
    setActiveInvoice(null);
  };

  return (
    <div className="flex w-full flex-col gap-6">
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

      <header className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <p className="text-sm text-[#82746d]">
          Tagihan pelanggan yang belum lunas.
        </p>

        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => onNavigate("customers")}>
            <Icon name="groups" className="text-lg" />
            Pelanggan
          </SecondaryButton>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total piutang aktif"
          value={money(totalOutstanding)}
          icon="account_balance_wallet"
          description={`${receivables.filter((invoice) => invoice.remainingDebt > 0).length} faktur dengan sisa tagihan`}
        />

        <KpiCard
          label="Piutang belum jatuh tempo"
          value={money(agingBuckets[0].amount)}
          icon="event_available"
          tone="green"
          description={`${agingBuckets[0].count} faktur belum melewati tanggal jatuh tempo`}
        />

        <KpiCard
          label="Lewat jatuh tempo"
          value={money(overdueTotal)}
          icon="warning"
          tone="red"
          description={`${overdueCount} faktur perlu ditindaklanjuti`}
        />

        <KpiCard
          label="Faktur lunas"
          value={`${receivables.filter((invoice) => invoice.remainingDebt <= 0).length}`}
          icon="task_alt"
          tone="amber"
          description="Faktur dengan sisa tagihan Rp 0"
        />
      </div>

      {/* Aging */}
      <AgingSchedule buckets={agingBuckets} total={totalOutstanding} />

      {/* Filters */}
      <div className="space-y-3">
        <PanelHeading title="Daftar piutang" />

        <ReceivablesFilters
          searchQuery={searchQuery}
          selectedTier={selectedTier}
          selectedStatus={selectedStatus}
          onSearchChange={setSearchQuery}
          onTierChange={setSelectedTier}
          onStatusChange={setSelectedStatus}
        />
      </div>

      {/* Table */}
      <ReceivableTable
        receivables={filteredReceivables}
        onPay={setActiveInvoice}
        onReminder={handleSendWAReminder}
      />

      {activeInvoice && (
        <SettlementModal
          key={activeInvoice.id}
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
          onSubmit={handleExecutePayment}
        />
      )}
    </div>
  );
};
