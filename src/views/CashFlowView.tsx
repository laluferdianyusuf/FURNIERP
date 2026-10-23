import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CircleAlert,
  Landmark,
  Plus,
  ReceiptText,
  Search,
  Wallet,
  X,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import React, { useMemo, useState } from "react";

import { BANK_ACCOUNTS } from "../data/mockData";
import type { CashMutation, PageView } from "../types";

import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

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

const PRIMARY = "#5f402a";
const HOVER = "#795740";

const currency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

const compactCurrency = (amount: number) => {
  const absoluteAmount = Math.abs(amount);

  if (absoluteAmount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (absoluteAmount >= 1_000_000) {
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

const inputClass = "h-10 bg-white text-sm focus-visible:ring-[#795740]";

function accountFromBankId(id: string): Account {
  if (id === "bca") return "BCA";
  if (id === "mandiri") return "Mandiri";
  return "Kas Tunai";
}

function getAccountLabel(account: Account) {
  return ACCOUNTS.find((item) => item.value === account)?.label ?? account;
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-stone-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-stone-500">{description}</p>
        )}
      </div>
      {action}
    </div>
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
  const account = accountFromBankId(bank.id);
  const AccountIcon = account === "Kas Tunai" ? Wallet : Landmark;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#795740] bg-[#f0e7dd] ring-1 ring-[#795740]/15"
          : "border-stone-200 bg-[#fcf9f4] hover:border-stone-300 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              selected
                ? "bg-[#5f402a] text-white"
                : "bg-stone-100 text-[#5f402a]"
            }`}
          >
            <AccountIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">
              {bank.name}
            </p>
            <p className="mt-1 truncate text-xs text-stone-500">
              {bank.number}
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={
            selected
              ? "shrink-0 border-0 bg-white text-[#5f402a]"
              : "shrink-0 border-0 bg-stone-100 text-stone-500"
          }
        >
          {selected ? "Dipilih" : bank.badge}
        </Badge>
      </div>

      <div className="mt-4 border-t border-stone-200 pt-3">
        <p className="text-xs text-stone-500">Saldo pada data rekening</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-stone-900">
          {compactCurrency(bank.balance)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-stone-500">{bank.holder}</p>
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
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-stone-700">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] leading-4 text-stone-500">{hint}</p>}
    </div>
  );
}

function CashMutationTable({ mutations }: { mutations: CashMutation[] }) {
  if (mutations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
          <ReceiptText className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-semibold text-stone-700">
          Tidak ada transaksi ditemukan
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Coba ubah kata kunci atau filter yang digunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-stone-50 hover:bg-stone-50">
            <TableHead className="whitespace-nowrap px-4 text-xs font-semibold">
              Tanggal
            </TableHead>
            <TableHead className="whitespace-nowrap text-xs font-semibold">
              Referensi
            </TableHead>
            <TableHead className="min-w-[200px] text-xs font-semibold">
              Keterangan
            </TableHead>
            <TableHead className="whitespace-nowrap text-xs font-semibold">
              Kategori
            </TableHead>
            <TableHead className="whitespace-nowrap text-xs font-semibold">
              Rekening
            </TableHead>
            <TableHead className="whitespace-nowrap text-right text-xs font-semibold">
              Masuk
            </TableHead>
            <TableHead className="whitespace-nowrap text-right text-xs font-semibold">
              Keluar
            </TableHead>
            <TableHead className="whitespace-nowrap px-4 text-right text-xs font-semibold">
              Saldo berjalan
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {mutations.map((tx) => (
            <TableRow
              key={tx.id}
              className="transition-colors hover:bg-stone-50/80"
            >
              <TableCell className="whitespace-nowrap px-4 py-3.5">
                <p className="font-medium text-stone-900">{tx.date}</p>
                <p className="mt-1 text-xs text-stone-500">{tx.time}</p>
              </TableCell>

              <TableCell className="whitespace-nowrap py-3.5">
                <p className="font-mono text-xs font-semibold text-[#5f402a]">
                  {tx.refNumber}
                </p>
                {tx.tag && (
                  <Badge
                    variant="secondary"
                    className="mt-1.5 border-0 bg-stone-100 text-[10px] font-normal text-stone-500"
                  >
                    {tx.tag}
                  </Badge>
                )}
              </TableCell>

              <TableCell className="max-w-[260px] py-3.5">
                <p className="font-medium text-stone-900">{tx.description}</p>
                <p className="mt-1 truncate text-xs text-stone-500">
                  {tx.entity}
                </p>
              </TableCell>

              <TableCell className="py-3.5">
                <Badge
                  variant="secondary"
                  className="border-0 bg-stone-100 font-normal text-stone-600"
                >
                  {tx.category}
                </Badge>
              </TableCell>

              <TableCell className="whitespace-nowrap py-3.5 text-xs font-medium text-stone-700">
                {tx.account}
                {tx.type === "TRANSFER" && tx.destAccount && (
                  <p className="mt-1 text-[11px] text-stone-500">
                    Ke: {tx.destAccount}
                  </p>
                )}
              </TableCell>

              <TableCell className="whitespace-nowrap py-3.5 text-right font-mono text-xs font-medium">
                {tx.type === "IN" && tx.amountIn > 0 ? (
                  <span className="text-emerald-700">
                    +{currency(tx.amountIn)}
                  </span>
                ) : (
                  <span className="text-stone-300">—</span>
                )}
              </TableCell>

              <TableCell className="whitespace-nowrap py-3.5 text-right font-mono text-xs font-medium">
                {tx.type === "OUT" && tx.amountOut > 0 ? (
                  <span className="text-red-700">
                    −{currency(tx.amountOut)}
                  </span>
                ) : (
                  <span className="text-stone-300">—</span>
                )}
              </TableCell>

              <TableCell className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-xs font-semibold text-stone-900">
                {currency(tx.runningBalance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  mutations,
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

  // Saldo awal masih data contoh. Nantinya ambil dari konfigurasi saldo awal.
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

  const inflowCount = useMemo(
    () => mutations.filter((mutation) => mutation.type === "IN").length,
    [mutations],
  );

  const outflowCount = useMemo(
    () => mutations.filter((mutation) => mutation.type === "OUT").length,
    [mutations],
  );

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const amount = Number(formAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Masukkan nominal yang lebih besar dari nol.");
      return;
    }

    if (!activeModal) return;

    if (!formDesc.trim() && activeModal !== "TRANSFER") {
      setFormError("Keterangan transaksi wajib diisi.");
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
    } else {
      transaction = {
        ...common,
        refNumber: makeReference("TRANSFER"),
        description: `Transfer ${transferSource} ke ${transferDest}`,
        entity: `Dari: ${transferSource} → Ke: ${transferDest}`,
        category: "Transfer Rekening",
        account: transferSource,
        type: "TRANSFER",
        amountIn: 0,
        amountOut: 0,
        runningBalance: currentTotalLiquidity,
        sourceAccount: transferSource,
        destAccount: transferDest,
        tag: "Internal Transfer",
      };
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

  const ModalIcon = isTransfer
    ? ArrowLeftRight
    : isInflow
      ? ArrowDownLeft
      : ArrowUpRight;

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    typeFilter !== "ALL" ||
    selectedAccountFilter !== "ALL";

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("ALL");
    setSelectedAccountFilter("ALL");
  };

  return (
    <div className="flex w-full flex-col gap-5 text-stone-900">
      {/* Page header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Arus Kas
          </h1>
          <p className="mt-1 text-sm leading-5 text-stone-500">
            Pantau uang masuk, uang keluar, dan transfer antar rekening.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => openModal("TRANSFER")}
            className="border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Transfer
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => openModal("OUT")}
            className="border-red-200 bg-white text-red-700 hover:bg-red-50"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Pengeluaran
          </Button>

          <Button
            type="button"
            onClick={() => openModal("IN")}
            className="bg-[#5f402a] text-white hover:bg-[#795740]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Pemasukan
          </Button>
        </div>
      </header>

      {/* Bank accounts */}
      <section className="space-y-4">
        <SectionHeading
          title=""
          description=""
          action={
            selectedAccountFilter !== "ALL" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAccountFilter("ALL")}
                className="self-start text-[#5f402a] hover:bg-stone-100 hover:text-[#795740]"
              >
                Tampilkan semua
                <X className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {BANK_ACCOUNTS.map((bank) => {
            const account = accountFromBankId(bank.id);

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
      <Card className="overflow-hidden rounded-xl border-stone-200 bg-[#fcf9f4] shadow-none">
        <CardHeader className="gap-4 border-b border-stone-200 px-4 py-4 sm:px-5">
          <SectionHeading
            title="Transaksi"
            description={`${filteredMutations.length} dari ${mutations.length} transaksi`}
          />

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-stone-100 p-1">
              {(
                [
                  ["ALL", "Semua"],
                  ["IN", "Pemasukan"],
                  ["OUT", "Pengeluaran"],
                  ["TRANSFER", "Transfer"],
                ] as const
              ).map(([value, label]) => {
                const isActive = typeFilter === value;

                return (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => setTypeFilter(value)}
                    aria-pressed={isActive}
                    className={
                      isActive
                        ? "shrink-0 bg-[#5f402a] text-white hover:bg-[#795740]"
                        : "shrink-0 text-stone-600 hover:bg-white hover:text-stone-900"
                    }
                  >
                    {label}
                  </Button>
                );
              })}
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1 xl:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari transaksi..."
                  aria-label="Cari transaksi"
                  className={`${inputClass} pl-9`}
                />
              </div>

              <Select
                value={selectedAccountFilter}
                onValueChange={(value) =>
                  setSelectedAccountFilter(value as AccountFilter)
                }
              >
                <SelectTrigger
                  aria-label="Filter rekening"
                  className={`${inputClass} w-full sm:w-52`}
                >
                  <SelectValue placeholder="Semua rekening" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua rekening</SelectItem>
                  {ACCOUNTS.map((account) => (
                    <SelectItem key={account.value} value={account.value}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <CashMutationTable mutations={filteredMutations} />
        </CardContent>

        <div className="flex flex-col gap-2 border-t border-stone-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-stone-500">
            Menampilkan transaksi berdasarkan filter aktif.
          </p>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="self-start text-[#5f402a] hover:bg-stone-100 hover:text-[#795740]"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Hapus semua filter
            </Button>
          )}
        </div>
      </Card>

      {/* Transaction dialog */}
      <Dialog
        open={activeModal !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-stone-200 bg-[#fcf9f4] p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-stone-200 px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-[#5f402a]">
                <ModalIcon className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-stone-900">
                  {modalTitle}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5 text-stone-500">
                  {modalSubtitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto p-5">
            <form
              id="cash-mutation-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {isTransfer ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Rekening asal">
                      <Select
                        value={transferSource}
                        onValueChange={(value) =>
                          setTransferSource(value as Account)
                        }
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOUNTS.map((account) => (
                            <SelectItem
                              key={account.value}
                              value={account.value}
                            >
                              {account.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Rekening tujuan">
                      <Select
                        value={transferDest}
                        onValueChange={(value) =>
                          setTransferDest(value as Account)
                        }
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOUNTS.map((account) => (
                            <SelectItem
                              key={account.value}
                              value={account.value}
                            >
                              {account.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  {transferSource === transferDest && (
                    <Alert className="border-red-200 bg-red-50 text-red-800">
                      <CircleAlert className="h-4 w-4" />
                      <AlertDescription className="text-xs leading-5">
                        Rekening asal dan tujuan tidak boleh sama.
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    label="Nominal transfer (Rp)"
                    htmlFor="transfer-amount"
                  >
                    <Input
                      id="transfer-amount"
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

                  <Alert className="border-stone-200 bg-stone-50 text-stone-700">
                    <CircleAlert className="h-4 w-4 text-[#795740]" />
                    <AlertDescription className="text-xs leading-5">
                      Transfer internal tidak menambah atau mengurangi total
                      uang bisnis dan tidak dihitung sebagai pendapatan atau
                      beban. Saldo masing-masing rekening perlu diperbarui oleh
                      sistem.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <>
                  <FormField
                    label={`Nominal ${isInflow ? "pemasukan" : "pengeluaran"} (Rp)`}
                    htmlFor="transaction-amount"
                  >
                    <Input
                      id="transaction-amount"
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
                    <Select
                      value={formAccount}
                      onValueChange={(value) =>
                        setFormAccount(value as Account)
                      }
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNTS.map((account) => (
                          <SelectItem key={account.value} value={account.value}>
                            {account.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Kategori transaksi">
                    <Select
                      value={formCategory}
                      onValueChange={(value) => setFormCategory(value ?? "")}
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {(isInflow ? IN_CATEGORIES : OUT_CATEGORIES).map(
                          (category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    label="Keterangan transaksi"
                    htmlFor="transaction-description"
                  >
                    <Input
                      id="transaction-description"
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
                    htmlFor="transaction-entity"
                    hint="Opsional, isi nama pelanggan atau pemasok."
                  >
                    <Input
                      id="transaction-entity"
                      type="text"
                      value={formEntity}
                      onChange={(event) => setFormEntity(event.target.value)}
                      placeholder={
                        isInflow
                          ? "Nama pelanggan"
                          : "Nama supplier atau vendor"
                      }
                      className={inputClass}
                    />
                  </FormField>
                </>
              )}

              {formError && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <CircleAlert className="h-4 w-4" />
                  <AlertDescription role="alert" className="text-xs leading-5">
                    {formError}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-stone-200 bg-stone-50 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
            >
              Batal
            </Button>

            <Button
              type="submit"
              form="cash-mutation-form"
              disabled={isTransfer && transferSource === transferDest}
              className={
                isOutflow
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : "bg-[#5f402a] text-white hover:bg-[#795740]"
              }
            >
              {isTransfer ? (
                <ArrowLeftRight className="mr-2 h-4 w-4" />
              ) : isInflow ? (
                <ArrowDownLeft className="mr-2 h-4 w-4" />
              ) : (
                <ArrowUpRight className="mr-2 h-4 w-4" />
              )}
              {isTransfer
                ? "Simpan transfer"
                : isInflow
                  ? "Simpan pemasukan"
                  : "Simpan pengeluaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
