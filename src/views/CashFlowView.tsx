import React, { useMemo, useState } from "react";
import { BANK_ACCOUNTS } from "../data/mockData";
import { CashMutation, PageView } from "../types";

type Account = "BCA" | "Mandiri" | "Kas Tunai";
type AccountFilter = "ALL" | Account;
type MutationType = "ALL" | "IN" | "OUT" | "TRANSFER";
type ModalType = "IN" | "OUT" | "TRANSFER" | null;

interface CashFlowViewProps {
  mutations: CashMutation[];
  onNavigate: (page: PageView) => void;
  onAddMutation?: (mutation: CashMutation) => void;
}

const ACCOUNTS: { value: Account; label: string }[] = [
  { value: "BCA", label: "BCA Bisnis Giro" },
  { value: "Mandiri", label: "Mandiri Giro Bisnis" },
  { value: "Kas Tunai", label: "Kas Tunai Brankas" },
];

const IN_CATEGORIES = [
  { value: "Pelunasan Piutang", label: "Pelunasan Piutang" },
  { value: "DP Penjualan", label: "DP Penjualan" },
  { value: "Penjualan Retail", label: "Penjualan Retail" },
  { value: "Pendapatan Lainnya", label: "Pendapatan Lainnya" },
];

const OUT_CATEGORIES = [
  { value: "Bahan Baku Kayu", label: "Bahan Baku Kayu" },
  { value: "Gaji Tukang", label: "Upah / Gaji Tukang" },
  { value: "Bahan Finishing", label: "Bahan Finishing" },
  { value: "Biaya Kirim", label: "Biaya Pengiriman" },
  { value: "Listrik & Operasional", label: "Listrik & Operasional" },
  { value: "Hardware Mebel", label: "Hardware Mebel" },
];

const currency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

const compactCurrency = (amount: number) => {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  return currency(amount);
};

const today = () => new Date().toLocaleDateString("id-ID");

const makeReference = (type: "IN" | "OUT" | "TRANSFER") => {
  const prefix = type === "IN" ? "CR" : type === "OUT" ? "CD" : "TR";
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  return `${prefix}-${yearMonth}-${String(Date.now()).slice(-5)}`;
};

const inputClass =
  "w-full min-w-0 rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-3 py-2.5 text-sm text-[#1c1c19] outline-none transition placeholder:text-[#a39a91] focus:border-[#795740] focus:ring-2 focus:ring-[#795740]/10";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

const iconButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#82746d] transition hover:bg-[#eae5de] hover:text-[#1c1c19]";

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

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-[#1c1c19]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-[#82746d]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  detail,
  icon,
  tone = "default",
}: {
  label: string;
  amount: string;
  detail: string;
  icon: string;
  tone?: "default" | "positive" | "negative" | "featured";
}) {
  const tones = {
    default: {
      iconBg: "bg-[#f0ede8]",
      iconColor: "text-[#5f402a]",
      amountColor: "text-[#1c1c19]",
      card: "bg-[#fcf9f4] border-[#e5e2dd]",
      labelColor: "text-[#82746d]",
    },
    positive: {
      iconBg: "bg-[#e8efe7]",
      iconColor: "text-[#45634a]",
      amountColor: "text-[#45634a]",
      card: "bg-[#fcf9f4] border-[#e5e2dd]",
      labelColor: "text-[#82746d]",
    },
    negative: {
      iconBg: "bg-[#f5e9e5]",
      iconColor: "text-[#a85348]",
      amountColor: "text-[#a85348]",
      card: "bg-[#fcf9f4] border-[#e5e2dd]",
      labelColor: "text-[#82746d]",
    },
    featured: {
      iconBg: "bg-white/10",
      iconColor: "text-[#f0d7c4]",
      amountColor: "text-white",
      card: "bg-[#5f402a] border-[#5f402a]",
      labelColor: "text-[#e1cdbb]",
    },
  };

  const style = tones[tone];

  return (
    <section
      className={`flex min-w-0 flex-col justify-between rounded-xl border p-4 ${style.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-medium leading-5 ${style.labelColor}`}>
          {label}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconColor}`}
        >
          <Icon name={icon} className="text-[18px]" />
        </span>
      </div>

      <div className="mt-5 min-w-0">
        <p
          title={amount}
          className={`break-words text-xl font-semibold tracking-tight sm:text-2xl ${style.amountColor}`}
        >
          {amount}
        </p>
        <p className={`mt-1.5 text-xs leading-5 ${style.labelColor}`}>
          {detail}
        </p>
      </div>
    </section>
  );
}

function BankAccountCard({
  bank,
  selected,
  onClick,
}: {
  bank: (typeof BANK_ACCOUNTS)[number];
  selected: boolean;
  onClick: () => void;
}) {
  const accountName: Account =
    bank.id === "bca" ? "BCA" : bank.id === "mandiri" ? "Mandiri" : "Kas Tunai";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#795740] bg-[#f0e7dd] ring-1 ring-[#795740]/15"
          : "border-[#e5e2dd] bg-[#fcf9f4] hover:border-[#c6b5a5] hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              selected
                ? "bg-[#5f402a] text-white"
                : "bg-[#f0ede8] text-[#5f402a]"
            }`}
          >
            <Icon
              name={
                accountName === "Kas Tunai" ? "payments" : "account_balance"
              }
              className="text-xl"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1c1c19]">
              {bank.name}
            </p>
            <p className="mt-1 truncate text-xs text-[#82746d]">
              {bank.number}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${
            selected ? "bg-white text-[#5f402a]" : "bg-[#f0ede8] text-[#82746d]"
          }`}
        >
          {selected ? "Dipilih" : bank.badge}
        </span>
      </div>

      <div className="mt-4 border-t border-[#e5e2dd] pt-3">
        <p className="text-xs text-[#82746d]">Saldo pada data rekening</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-[#1c1c19]">
          {compactCurrency(bank.balance)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-[#82746d]">{bank.holder}</p>
          <span className="text-xs font-medium text-[#5f402a]">
            {bank.share}
          </span>
        </div>
      </div>
    </button>
  );
}

function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="block text-xs font-semibold text-[#50453e]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] leading-4 text-[#82746d]">{hint}</p>}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  icon,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c19]/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e5e2dd] bg-[#fcf9f4] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e5e2dd] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0ede8] text-[#5f402a]">
              <Icon name={icon} className="text-xl" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#1c1c19]">
                {title}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#82746d]">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className={iconButtonClass}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

function CashMutationTable({ mutations }: { mutations: CashMutation[] }) {
  if (mutations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0ede8] text-[#82746d]">
          <Icon name="receipt_long" className="text-2xl" />
        </span>
        <p className="mt-3 text-sm font-semibold text-[#50453e]">
          Tidak ada transaksi ditemukan
        </p>
        <p className="mt-1 text-xs text-[#82746d]">
          Coba ubah kata kunci atau filter yang digunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-y border-[#e5e2dd] bg-[#f5f1eb] text-[11px] font-semibold uppercase tracking-wide text-[#82746d]">
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-3 py-3">Referensi</th>
            <th className="px-4 py-3">Keterangan</th>
            <th className="px-3 py-3">Kategori</th>
            <th className="px-3 py-3">Rekening</th>
            <th className="px-3 py-3 text-right">Masuk</th>
            <th className="px-3 py-3 text-right">Keluar</th>
            <th className="px-4 py-3 text-right">Saldo berjalan</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#e5e2dd]">
          {mutations.map((tx) => (
            <tr key={tx.id} className="transition hover:bg-[#f7f3ed]">
              <td className="whitespace-nowrap px-4 py-3.5">
                <p className="font-medium text-[#1c1c19]">{tx.date}</p>
                <p className="mt-1 text-xs text-[#82746d]">{tx.time}</p>
              </td>

              <td className="whitespace-nowrap px-3 py-3.5">
                <p className="font-mono text-xs font-semibold text-[#5f402a]">
                  {tx.refNumber}
                </p>
                {tx.tag && (
                  <span className="mt-1.5 inline-flex rounded bg-[#f0ede8] px-1.5 py-1 text-[10px] text-[#82746d]">
                    {tx.tag}
                  </span>
                )}
              </td>

              <td className="max-w-[240px] px-4 py-3.5">
                <p className="font-medium text-[#1c1c19]">{tx.description}</p>
                <p className="mt-1 truncate text-xs text-[#82746d]">
                  {tx.entity}
                </p>
              </td>

              <td className="px-3 py-3.5">
                <span className="inline-flex rounded-md bg-[#f0ede8] px-2 py-1 text-xs text-[#50453e]">
                  {tx.category}
                </span>
              </td>

              <td className="whitespace-nowrap px-3 py-3.5 text-xs font-medium text-[#50453e]">
                {tx.account}
                {tx.type === "TRANSFER" && tx.destAccount && (
                  <p className="mt-1 text-[11px] text-[#82746d]">
                    Ke: {tx.destAccount}
                  </p>
                )}
              </td>

              <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-xs font-medium">
                {tx.amountIn > 0 ? (
                  <span className="text-[#45634a]">
                    +{currency(tx.amountIn)}
                  </span>
                ) : (
                  <span className="text-[#b5ada5]">—</span>
                )}
              </td>

              <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-xs font-medium">
                {tx.amountOut > 0 ? (
                  <span className="text-[#a85348]">
                    −{currency(tx.amountOut)}
                  </span>
                ) : (
                  <span className="text-[#b5ada5]">—</span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-xs font-semibold text-[#1c1c19]">
                {currency(tx.runningBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  mutations,
  onNavigate,
  onAddMutation,
}) => {
  const [selectedAccountFilter, setSelectedAccountFilter] =
    useState<AccountFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<MutationType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEntity, setFormEntity] = useState("");
  const [formCategory, setFormCategory] = useState("Pelunasan Piutang");
  const [formAccount, setFormAccount] = useState<Account>("BCA");
  const [transferSource, setTransferSource] = useState<Account>("BCA");
  const [transferDest, setTransferDest] = useState<Account>("Kas Tunai");
  const [formError, setFormError] = useState("");

  // Angka saldo awal masih berupa data contoh. Sesuaikan dengan data bisnis.
  const initialBalance = 152_150_000;

  const totalInflow = useMemo(
    () =>
      mutations
        .filter((mutation) => mutation.type === "IN")
        .reduce((sum, mutation) => sum + mutation.amountIn, 0),
    [mutations],
  );

  const totalOutflow = useMemo(
    () =>
      mutations
        .filter((mutation) => mutation.type === "OUT")
        .reduce((sum, mutation) => sum + mutation.amountOut, 0),
    [mutations],
  );

  const inflowCount = mutations.filter((m) => m.type === "IN").length;
  const outflowCount = mutations.filter((m) => m.type === "OUT").length;
  const netCashFlow = totalInflow - totalOutflow;
  const currentTotalLiquidity = initialBalance + netCashFlow;

  const filteredMutations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mutations.filter((mutation) => {
      const matchesAccount =
        selectedAccountFilter === "ALL" ||
        mutation.account === selectedAccountFilter ||
        (mutation.type === "TRANSFER" &&
          mutation.destAccount === selectedAccountFilter);

      const matchesType = typeFilter === "ALL" || mutation.type === typeFilter;

      const matchesSearch =
        !query ||
        [
          mutation.description,
          mutation.entity,
          mutation.refNumber,
          mutation.category,
          mutation.account,
          mutation.destAccount ?? "",
        ].some((value) => value.toLowerCase().includes(query));

      return matchesAccount && matchesType && matchesSearch;
    });
  }, [mutations, selectedAccountFilter, typeFilter, searchQuery]);

  const resetForm = () => {
    setFormAmount("");
    setFormDesc("");
    setFormEntity("");
    setFormCategory("Pelunasan Piutang");
    setFormAccount("BCA");
    setTransferSource("BCA");
    setTransferDest("Kas Tunai");
    setFormError("");
  };

  const openModal = (type: Exclude<ModalType, null>) => {
    resetForm();

    if (type === "IN") setFormCategory("Pelunasan Piutang");
    if (type === "OUT") setFormCategory("Bahan Baku Kayu");

    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    resetForm();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const amount = Number(formAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Masukkan nominal yang lebih besar dari nol.");
      return;
    }

    if (!onAddMutation) {
      setFormError(
        "Penyimpanan transaksi belum terhubung. Hubungkan onAddMutation terlebih dahulu.",
      );
      return;
    }

    if (activeModal === "TRANSFER" && transferSource === transferDest) {
      setFormError("Rekening asal dan tujuan harus berbeda.");
      return;
    }

    const now = new Date();
    const common = {
      id: `tx-${now.getTime()}`,
      date: today(),
      time: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      runningBalance: currentTotalLiquidity,
    };

    let transaction: CashMutation;

    if (activeModal === "IN") {
      transaction = {
        ...common,
        refNumber: makeReference("IN"),
        description: formDesc.trim(),
        entity: formEntity.trim() || "Pelanggan",
        category: formCategory,
        account: formAccount,
        type: "IN",
        amountIn: amount,
        amountOut: 0,
        runningBalance: currentTotalLiquidity + amount,
        tag: "Manual Entry",
      };
    } else if (activeModal === "OUT") {
      transaction = {
        ...common,
        refNumber: makeReference("OUT"),
        description: formDesc.trim(),
        entity: formEntity.trim() || "Penerima Pembayaran",
        category: formCategory,
        account: formAccount,
        type: "OUT",
        amountIn: 0,
        amountOut: amount,
        runningBalance: currentTotalLiquidity - amount,
        tag: "Manual Entry",
      };
    } else if (activeModal === "TRANSFER") {
      transaction = {
        ...common,
        refNumber: makeReference("TRANSFER"),
        description: `Transfer ${transferSource} ke ${transferDest}`,
        entity: `Dari: ${transferSource} → Ke: ${transferDest}`,
        category: "Transfer Rekening",
        account: transferSource,
        type: "TRANSFER",
        amountIn: amount,
        amountOut: amount,
        runningBalance: currentTotalLiquidity,
        sourceAccount: transferSource,
        destAccount: transferDest,
        tag: "Internal Transfer",
      };
    } else {
      return;
    }

    onAddMutation(transaction);
    closeModal();
  };

  const isTransfer = activeModal === "TRANSFER";
  const isInflow = activeModal === "IN";
  const isOutflow = activeModal === "OUT";

  const modalTitle = isTransfer
    ? "Transfer antar rekening"
    : isInflow
      ? "Catat pemasukan"
      : "Catat pengeluaran";

  const modalSubtitle = isTransfer
    ? "Pindahkan dana antar rekening bisnis."
    : isInflow
      ? "Catat uang yang benar-benar diterima bisnis."
      : "Catat uang yang benar-benar dibayarkan bisnis.";

  const modalIcon = isTransfer
    ? "swap_horiz"
    : isInflow
      ? "south_west"
      : "north_east";

  const accountLabel = (account: Account) =>
    ACCOUNTS.find((item) => item.value === account)?.label ?? account;

  return (
    <main className="mx-auto mt-5 flex w-full max-w-[1600px] flex-col gap-7 pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#eae1d7] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f402a]">
              Keuangan
            </span>
            <span className="text-xs text-[#82746d]">
              Pencatatan kas dan bank
            </span>
          </div>

          <h1 className="font-headline text-2xl font-semibold tracking-tight text-[#1c1c19] sm:text-3xl">
            Cash Flow
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82746d]">
            Pantau uang masuk, uang keluar, dan perpindahan dana untuk
            operasional bisnis mebel.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openModal("TRANSFER")}
            className={`${buttonBase} border border-[#e5e2dd] bg-[#fcf9f4] text-[#50453e] hover:bg-white`}
          >
            <Icon name="swap_horiz" className="text-lg" />
            Transfer
          </button>
          <button
            type="button"
            onClick={() => openModal("OUT")}
            className={`${buttonBase} border border-[#e5e2dd] bg-[#fcf9f4] text-[#a85348] hover:bg-[#f5e9e5]`}
          >
            <Icon name="north_east" className="text-lg" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => openModal("IN")}
            className={`${buttonBase} bg-[#5f402a] text-white hover:bg-[#795740]`}
          >
            <Icon name="add" className="text-lg" />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => onNavigate("financial-reports")}
            className={`${buttonBase} border border-[#e5e2dd] bg-transparent text-[#50453e] hover:bg-[#f0ede8]`}
          >
            <Icon name="bar_chart" className="text-lg" />
            Laporan
          </button>
        </div>
      </header>

      {/* Summary */}
      <section>
        <SectionHeading
          title="Ringkasan arus kas"
          description="Ringkasan nominal berdasarkan seluruh mutasi yang tersedia."
        />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Saldo awal"
            amount={compactCurrency(initialBalance)}
            detail="Saldo awal contoh, perlu disesuaikan"
            icon="account_balance_wallet"
          />
          <SummaryCard
            label="Total pemasukan"
            amount={compactCurrency(totalInflow)}
            detail={`${inflowCount} transaksi pemasukan`}
            icon="south_west"
            tone="positive"
          />
          <SummaryCard
            label="Total pengeluaran"
            amount={compactCurrency(totalOutflow)}
            detail={`${outflowCount} transaksi pengeluaran`}
            icon="north_east"
            tone="negative"
          />
          <SummaryCard
            label="Arus kas bersih"
            amount={`${netCashFlow > 0 ? "+" : ""}${compactCurrency(netCashFlow)}`}
            detail={
              netCashFlow > 0
                ? "Pemasukan melebihi pengeluaran"
                : netCashFlow < 0
                  ? "Pengeluaran melebihi pemasukan"
                  : "Pemasukan dan pengeluaran seimbang"
            }
            icon="monitoring"
            tone={netCashFlow < 0 ? "negative" : "default"}
          />
          <SummaryCard
            label="Estimasi likuiditas"
            amount={compactCurrency(currentTotalLiquidity)}
            detail="Saldo awal + arus kas bersih"
            icon="account_balance"
            tone="featured"
          />
        </div>
      </section>

      {/* Accounts */}
      <section>
        <SectionHeading
          title="Rekening kas dan bank"
          description="Pilih rekening untuk memfilter transaksi terkait."
          action={
            <button
              type="button"
              onClick={() => setSelectedAccountFilter("ALL")}
              className="self-start text-xs font-semibold text-[#5f402a] hover:text-[#795740]"
            >
              Reset filter
            </button>
          }
        />

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {BANK_ACCOUNTS.map((bank) => {
            const account: Account =
              bank.id === "bca"
                ? "BCA"
                : bank.id === "mandiri"
                  ? "Mandiri"
                  : "Kas Tunai";

            return (
              <BankAccountCard
                key={bank.id}
                bank={bank}
                selected={selectedAccountFilter === account}
                onClick={() =>
                  setSelectedAccountFilter((current) =>
                    current === account ? "ALL" : account,
                  )
                }
              />
            );
          })}
        </div>
      </section>

      {/* Transactions */}
      <section className="overflow-hidden rounded-xl border border-[#e5e2dd] bg-[#fcf9f4]">
        <div className="space-y-4 p-4 sm:p-5">
          <SectionHeading
            title="Mutasi transaksi"
            description={`${filteredMutations.length} transaksi ditampilkan dari ${mutations.length} data.`}
          />

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#f0ede8] p-1">
              {(
                [
                  ["ALL", "Semua"],
                  ["IN", "Pemasukan"],
                  ["OUT", "Pengeluaran"],
                  ["TRANSFER", "Transfer"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value)}
                  aria-pressed={typeFilter === value}
                  className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium transition ${
                    typeFilter === value
                      ? "bg-[#fcf9f4] text-[#5f402a] shadow-sm"
                      : "text-[#82746d] hover:text-[#50453e]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block min-w-0 flex-1 xl:w-64">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#82746d]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari transaksi..."
                  aria-label="Cari transaksi"
                  className={`${inputClass} pl-10`}
                />
              </label>

              <select
                value={selectedAccountFilter}
                onChange={(event) =>
                  setSelectedAccountFilter(event.target.value as AccountFilter)
                }
                aria-label="Filter rekening"
                className={`${inputClass} sm:w-48`}
              >
                <option value="ALL">Semua rekening</option>
                {ACCOUNTS.map((account) => (
                  <option key={account.value} value={account.value}>
                    {account.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <CashMutationTable mutations={filteredMutations} />

        <div className="flex flex-col gap-2 border-t border-[#e5e2dd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-[#82746d]">
            Menampilkan hasil berdasarkan filter aktif.
          </p>
          {(searchQuery ||
            typeFilter !== "ALL" ||
            selectedAccountFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("ALL");
                setSelectedAccountFilter("ALL");
              }}
              className="self-start text-xs font-semibold text-[#5f402a] hover:underline"
            >
              Hapus semua filter
            </button>
          )}
        </div>
      </section>

      {/* Transaction modal */}
      {activeModal && (
        <ModalShell
          title={modalTitle}
          subtitle={modalSubtitle}
          icon={modalIcon}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {isTransfer ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Rekening asal">
                    <select
                      value={transferSource}
                      onChange={(event) =>
                        setTransferSource(event.target.value as Account)
                      }
                      className={inputClass}
                    >
                      {ACCOUNTS.map((account) => (
                        <option key={account.value} value={account.value}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Rekening tujuan">
                    <select
                      value={transferDest}
                      onChange={(event) =>
                        setTransferDest(event.target.value as Account)
                      }
                      className={inputClass}
                    >
                      {ACCOUNTS.map((account) => (
                        <option key={account.value} value={account.value}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {transferSource === transferDest && (
                  <p className="rounded-lg bg-[#f5e9e5] px-3 py-2 text-xs text-[#a85348]">
                    Rekening asal dan tujuan tidak boleh sama.
                  </p>
                )}

                <FormField label="Nominal transfer (Rp)">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formAmount}
                    onChange={(event) => setFormAmount(event.target.value)}
                    placeholder="Contoh: 5000000"
                    className={`${inputClass} font-mono`}
                  />
                </FormField>

                <div className="rounded-lg border border-[#e5e2dd] bg-[#f5f1eb] p-3">
                  <div className="flex items-start gap-2">
                    <Icon
                      name="info"
                      className="mt-0.5 text-lg text-[#795740]"
                    />
                    <p className="text-xs leading-5 text-[#6f6258]">
                      Transfer internal tidak menambah atau mengurangi total
                      uang bisnis dan tidak dihitung sebagai pendapatan atau
                      beban. Saldo tiap rekening perlu diperbarui oleh sistem.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <FormField
                  label={`Nominal ${isInflow ? "pemasukan" : "pengeluaran"} (Rp)`}
                >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formAmount}
                    onChange={(event) => setFormAmount(event.target.value)}
                    placeholder="Masukkan nominal"
                    className={`${inputClass} font-mono text-base font-semibold`}
                  />
                </FormField>

                <FormField
                  label={isInflow ? "Rekening tujuan" : "Rekening sumber"}
                >
                  <select
                    value={formAccount}
                    onChange={(event) =>
                      setFormAccount(event.target.value as Account)
                    }
                    className={inputClass}
                  >
                    {ACCOUNTS.map((account) => (
                      <option key={account.value} value={account.value}>
                        {account.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Kategori transaksi">
                  <select
                    value={formCategory}
                    onChange={(event) => setFormCategory(event.target.value)}
                    className={inputClass}
                  >
                    {(isInflow ? IN_CATEGORIES : OUT_CATEGORIES).map(
                      (category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ),
                    )}
                  </select>
                </FormField>

                <FormField label="Keterangan transaksi">
                  <input
                    type="text"
                    required
                    value={formDesc}
                    onChange={(event) => setFormDesc(event.target.value)}
                    placeholder={
                      isInflow
                        ? "Contoh: Pelunasan pesanan meja"
                        : "Contoh: Pembelian bahan baku kayu"
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label={
                    isInflow ? "Pelanggan / sumber dana" : "Penerima / vendor"
                  }
                  hint="Opsional, bisa diisi nama pelanggan atau pemasok."
                >
                  <input
                    type="text"
                    value={formEntity}
                    onChange={(event) => setFormEntity(event.target.value)}
                    placeholder={
                      isInflow ? "Nama pelanggan" : "Nama supplier atau vendor"
                    }
                    className={inputClass}
                  />
                </FormField>
              </>
            )}

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-[#e8c8c1] bg-[#f9efeb] px-3 py-2.5 text-xs leading-5 text-[#a85348]"
              >
                {formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className={`${buttonBase} border border-[#e5e2dd] text-[#50453e] hover:bg-[#f0ede8]`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isTransfer && transferSource === transferDest}
                className={`${buttonBase} ${
                  isOutflow
                    ? "bg-[#a85348] text-white hover:bg-[#91463d]"
                    : "bg-[#5f402a] text-white hover:bg-[#795740]"
                }`}
              >
                <Icon
                  name={
                    isTransfer
                      ? "swap_horiz"
                      : isInflow
                        ? "south_west"
                        : "north_east"
                  }
                  className="text-lg"
                />
                {isTransfer
                  ? "Simpan transfer"
                  : isInflow
                    ? "Simpan pemasukan"
                    : "Simpan pengeluaran"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </main>
  );
};
