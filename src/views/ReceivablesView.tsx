import type { FormEvent } from "react";
import React, { useEffect, useMemo, useState } from "react";
import type { PageView, ReceivableInvoice } from "../types";

import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Info,
  MessageCircle,
  ReceiptText,
  Search,
  Users,
  X,
} from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { money } from "../helpers/moneyFormatter";

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
  amount: number;
  count: number;
  barClass: string;
  dotClass: string;
  textClass: string;
}

/* =========================================================
   TAMBAHAN: TIPE DAN DATA UTANG USAHA
========================================================= */

type BusinessDebtStatus = "Belum Dibayar" | "Dibayar Sebagian" | "Lunas";

interface BusinessDebt {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  description: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
}

const INITIAL_BUSINESS_DEBTS: BusinessDebt[] = [
  {
    id: "BD-001",
    invoiceNumber: "UTG-2026-001",
    supplierName: "Supplier Kayu Jati",
    description: "Pembelian kayu jati untuk produksi sofa",
    date: "2026-10-12",
    dueDate: "2026-10-29",
    totalAmount: 7500000,
    paidAmount: 2500000,
    notes: "Pembayaran termin pertama",
  },
  {
    id: "BD-002",
    invoiceNumber: "UTG-2026-002",
    supplierName: "Supplier Busa Mandiri",
    description: "Pembelian busa dan bahan pelapis",
    date: "2026-10-18",
    dueDate: "2026-10-30",
    totalAmount: 4200000,
    paidAmount: 0,
    notes: "Menunggu pembayaran",
  },
];

function getBusinessDebtStatus(debt: BusinessDebt): BusinessDebtStatus {
  if (debt.paidAmount >= debt.totalAmount) return "Lunas";
  if (debt.paidAmount > 0) return "Dibayar Sebagian";
  return "Belum Dibayar";
}

function getBusinessDebtRemaining(debt: BusinessDebt) {
  return Math.max(0, debt.totalAmount - debt.paidAmount);
}

function getBusinessDebtBadgeClass(status: BusinessDebtStatus) {
  if (status === "Lunas") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Dibayar Sebagian") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

const ACCOUNT_OPTIONS: { value: AccountName; label: string }[] = [
  { value: "BCA", label: "BCA Bisnis Giro" },
  { value: "Mandiri", label: "Mandiri Giro Bisnis" },
  { value: "Kas Tunai", label: "Kas Tunai Showroom" },
];

const INPUT_CLASS =
  "border-[#e5e2dd] bg-white focus-visible:ring-[#795740] focus-visible:ring-offset-0";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

function getAgingBuckets(receivables: ReceivableInvoice[]): AgingBucket[] {
  const buckets: AgingBucket[] = [
    {
      id: "current",
      label: "Belum jatuh tempo",
      amount: 0,
      count: 0,
      barClass: "bg-emerald-600",
      dotClass: "bg-emerald-600",
      textClass: "text-emerald-700",
    },
    {
      id: "1-15",
      label: "1–15 hari",
      amount: 0,
      count: 0,
      barClass: "bg-amber-500",
      dotClass: "bg-amber-500",
      textClass: "text-amber-700",
    },
    {
      id: "16-30",
      label: "16–30 hari",
      amount: 0,
      count: 0,
      barClass: "bg-orange-500",
      dotClass: "bg-orange-500",
      textClass: "text-orange-700",
    },
    {
      id: "31-60",
      label: "31–60 hari",
      amount: 0,
      count: 0,
      barClass: "bg-rose-500",
      dotClass: "bg-rose-500",
      textClass: "text-rose-700",
    },
    {
      id: "60+",
      label: "> 60 hari",
      amount: 0,
      count: 0,
      barClass: "bg-rose-800",
      dotClass: "bg-rose-800",
      textClass: "text-rose-800",
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  receivables.forEach((invoice) => {
    const amount = Math.max(0, invoice.remainingDebt);
    if (amount <= 0) return;

    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let overdueDays = 0;

    if (!Number.isNaN(dueDate.getTime())) {
      overdueDays = Math.max(
        0,
        Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000),
      );
    } else if (invoice.isOverdue) {
      overdueDays = 31;
    }

    let bucketIndex = 0;

    if (overdueDays === 0) bucketIndex = 0;
    else if (overdueDays <= 15) bucketIndex = 1;
    else if (overdueDays <= 30) bucketIndex = 2;
    else if (overdueDays <= 60) bucketIndex = 3;
    else bucketIndex = 4;

    buckets[bucketIndex].amount += amount;
    buckets[bucketIndex].count += 1;
  });

  return buckets;
}

function getTierBadgeClass(tier: CustomerTier) {
  switch (tier) {
    case "Grosir":
      return "border-[#e5d4c3] bg-[#eee5dc] text-[#654832]";
    case "Reseller":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-stone-200 bg-stone-100 text-stone-600";
  }
}

function getStatusBadgeClass(status: string, isOverdue: boolean) {
  if (isOverdue) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "Besok") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function KpiCard({
  label,
  value,
  description,
  icon: IconComponent,
  tone = "default",
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone?: "default" | "green" | "red" | "amber";
}) {
  const iconStyles = {
    default: "bg-[#eee5dc] text-[#654832]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };

  const valueStyles = {
    default: "text-stone-900",
    green: "text-emerald-700",
    red: "text-rose-700",
    amber: "text-amber-700",
  };

  return (
    <Card className="min-w-0 rounded-xl border-stone-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-stone-500">
            {label}
          </p>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              iconStyles[tone],
            )}
          >
            <IconComponent className="h-[18px] w-[18px]" />
          </div>
        </div>

        <p
          className={cn(
            "mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl",
            valueStyles[tone],
          )}
        >
          {value}
        </p>

        <p className="mt-3 border-t border-stone-200 pt-3 text-xs leading-5 text-stone-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function AgingSchedule({
  buckets,
  total,
}: {
  buckets: AgingBucket[];
  total: number;
}) {
  return (
    <Card className="rounded-xl border-stone-200 shadow-none">
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eee5dc] text-[#654832]">
            <CalendarCheck className="h-[18px] w-[18px]" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-stone-900">
              Umur Piutang
            </CardTitle>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              Distribusi sisa tagihan berdasarkan tanggal jatuh tempo.
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-stone-500">Total piutang aktif</p>
          <p className="mt-1 text-base font-bold text-stone-900">
            {money(total)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div
          className="flex h-3 w-full overflow-hidden rounded-full bg-stone-100"
          aria-label="Distribusi umur piutang"
        >
          {buckets.map((bucket) => {
            const percentage = total > 0 ? (bucket.amount / total) * 100 : 0;

            return (
              <div
                key={bucket.id}
                className={cn("h-full transition-all", bucket.barClass)}
                style={{ width: `${percentage}%` }}
                title={`${bucket.label}: ${percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {buckets.map((bucket) => {
            const percentage = total > 0 ? (bucket.amount / total) * 100 : 0;

            return (
              <div
                key={bucket.id}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      bucket.dotClass,
                    )}
                  />
                  <span className="text-xs font-medium text-stone-600">
                    {bucket.label}
                  </span>
                </div>

                <p className="mt-3 break-words text-sm font-bold text-stone-900">
                  {money(bucket.amount)}
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  {percentage.toFixed(1)}% · {bucket.count} faktur
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SettlementDialog({
  invoice,
  open,
  onOpenChange,
  onSubmit,
}: {
  invoice: ReceivableInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    invoice: ReceivableInvoice,
    amount: number,
    account: AccountName,
    notes: string,
  ) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [account, setAccount] = useState<AccountName>("BCA");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!invoice || !open) return;

    setAmount(Math.max(0, invoice.remainingDebt));
    setAccount("BCA");
    setNotes(`Pelunasan tagihan ${invoice.invoiceNumber} via transfer`);
    setFormError("");
  }, [invoice, open]);

  if (!invoice) return null;

  const remainingDebt = Math.max(0, invoice.remainingDebt);
  const validAmount =
    Number.isFinite(amount) && amount > 0 && amount <= remainingDebt;
  const validNotes = Boolean(notes.trim());

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!validAmount) {
      setFormError(
        "Nominal harus lebih dari Rp 0 dan tidak boleh melebihi sisa piutang.",
      );
      return;
    }

    if (!validNotes) {
      setFormError("Catatan pembayaran wajib diisi.");
      return;
    }

    onSubmit(invoice, amount, account, notes.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-stone-200 bg-[#fcf9f4] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-stone-200 px-5 py-4 pr-12 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eee5dc] text-[#654832]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-stone-900">
                Catat Pelunasan
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {invoice.invoiceNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="space-y-5 overflow-y-auto p-5">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-stone-900">
                    {invoice.customerName}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {invoice.itemSummary}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    SPK: {invoice.spkRef}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0",
                    getTierBadgeClass(invoice.customerTier),
                  )}
                >
                  {invoice.customerTier}
                </Badge>
              </div>

              <Separator className="my-4 bg-stone-200" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-stone-500">Sisa piutang</span>
                <span className="text-right text-base font-bold text-rose-700">
                  {money(remainingDebt)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settlement-amount">Nominal pembayaran</Label>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                  onClick={() => setAmount(remainingDebt)}
                >
                  Lunasi penuh
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                  onClick={() => setAmount(Math.round(remainingDebt / 2))}
                >
                  Bayar 50%
                </Button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-500">
                  Rp
                </span>
                <Input
                  id="settlement-amount"
                  type="number"
                  min={1}
                  max={remainingDebt}
                  step={1}
                  required
                  value={amount || ""}
                  onChange={(event) =>
                    setAmount(
                      event.target.value === ""
                        ? 0
                        : Number(event.target.value),
                    )
                  }
                  className="h-11 bg-white pl-10 text-base font-semibold focus-visible:ring-[#795740]"
                />
              </div>

              <p className="text-xs text-stone-500">
                Maksimal pembayaran: {money(remainingDebt)}
              </p>

              {!validAmount && (
                <p className="text-xs text-rose-600">
                  Nominal harus lebih dari Rp 0 dan tidak boleh melebihi sisa
                  piutang.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Rekening penerimaan</Label>
              <Select
                value={account}
                onValueChange={(value) => setAccount(value as AccountName)}
              >
                <SelectTrigger className="h-10 bg-white focus:ring-[#795740]">
                  <SelectValue placeholder="Pilih rekening" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settlement-notes">
                Catatan / bukti pembayaran
              </Label>
              <Textarea
                id="settlement-notes"
                required
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contoh: Transfer BCA, referensi transaksi..."
                className="resize-y bg-white focus-visible:ring-[#795740]"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{formError}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t border-stone-200 bg-stone-50 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-stone-200 bg-white"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={!validAmount || !validNotes}
              className="bg-[#5f402a] text-white hover:bg-[#795740]"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Simpan Pelunasan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

  /* TAMBAHAN: state utang usaha */
  const [businessDebts, setBusinessDebts] = useState<BusinessDebt[]>(
    INITIAL_BUSINESS_DEBTS,
  );
  const [businessDebtSearch, setBusinessDebtSearch] = useState("");
  const [businessDebtStatus, setBusinessDebtStatus] = useState("Semua Status");

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const filteredReceivables = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return receivables.filter((invoice) => {
      const searchableValues = [
        invoice.invoiceNumber,
        invoice.customerName,
        invoice.spkRef,
        invoice.itemSummary,
        invoice.orderDescription,
        invoice.phone,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) => value?.toLowerCase().includes(query));

      const matchesTier =
        selectedTier === "Semua Tier" || invoice.customerTier === selectedTier;

      const matchesStatus =
        selectedStatus === "Semua Status" ||
        (selectedStatus === "Overdue" && invoice.isOverdue) ||
        (selectedStatus === "Lancar" && !invoice.isOverdue);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [receivables, searchQuery, selectedTier, selectedStatus]);

  const totalOutstanding = useMemo(
    () =>
      receivables.reduce(
        (sum, invoice) => sum + Math.max(0, invoice.remainingDebt),
        0,
      ),
    [receivables],
  );

  const activeReceivables = receivables.filter(
    (invoice) => invoice.remainingDebt > 0,
  );

  const overdueInvoices = activeReceivables.filter(
    (invoice) => invoice.isOverdue,
  );

  const overdueTotal = overdueInvoices.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.remainingDebt),
    0,
  );

  const paidInvoiceCount = receivables.filter(
    (invoice) => invoice.remainingDebt <= 0,
  ).length;

  const agingBuckets = useMemo(
    () => getAgingBuckets(receivables),
    [receivables],
  );

  /* TAMBAHAN: perhitungan dan filter utang usaha */
  const totalBusinessDebt = useMemo(
    () =>
      businessDebts.reduce(
        (sum, debt) => sum + getBusinessDebtRemaining(debt),
        0,
      ),
    [businessDebts],
  );

  const filteredBusinessDebts = useMemo(() => {
    const query = businessDebtSearch.trim().toLowerCase();

    return businessDebts.filter((debt) => {
      const matchesSearch =
        !query ||
        debt.invoiceNumber.toLowerCase().includes(query) ||
        debt.supplierName.toLowerCase().includes(query) ||
        debt.description.toLowerCase().includes(query);

      const matchesStatus =
        businessDebtStatus === "Semua Status" ||
        getBusinessDebtStatus(debt) === businessDebtStatus;

      return matchesSearch && matchesStatus;
    });
  }, [businessDebts, businessDebtSearch, businessDebtStatus]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const handleSendWAReminder = (invoice: ReceivableInvoice) => {
    showToast(
      `Pengingat untuk ${invoice.customerName} (${invoice.invoiceNumber}) siap disiapkan. Fitur pengiriman WhatsApp belum terhubung.`,
    );
  };

  const handleExecutePayment = (
    invoice: ReceivableInvoice,
    amount: number,
    account: AccountName,
    notes: string,
  ) => {
    if (
      amount <= 0 ||
      amount > invoice.remainingDebt ||
      !Number.isFinite(amount)
    ) {
      showToast("Nominal pembayaran tidak valid.");
      return;
    }

    if (!onSettleInvoice) {
      showToast(
        "Pencatatan belum tersambung. Hubungkan fungsi pelunasan ke backend terlebih dahulu.",
      );
      return;
    }

    onSettleInvoice(invoice.id, amount, account, notes);

    setActiveInvoice(null);
    showToast(
      `Pelunasan ${money(amount)} untuk ${invoice.customerName} berhasil dikirim ke fungsi pencatatan.`,
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTier("Semua Tier");
    setSelectedStatus("Semua Status");
  };

  /* TAMBAHAN: pencatatan pembayaran utang usaha */
  const handleSettleBusinessDebt = (debtId: string) => {
    const debt = businessDebts.find((item) => item.id === debtId);
    if (!debt) return;

    const remaining = getBusinessDebtRemaining(debt);
    if (remaining <= 0) return;

    const rawAmount = window.prompt(
      `Sisa utang ${money(remaining)}.\nMasukkan nominal pembayaran:`,
      String(remaining),
    );

    if (rawAmount === null) return;

    const amount = Number(rawAmount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) {
      showToast("Nominal pembayaran utang tidak valid.");
      return;
    }

    setBusinessDebts((current) =>
      current.map((item) =>
        item.id === debtId
          ? {
              ...item,
              paidAmount: Math.min(item.totalAmount, item.paidAmount + amount),
            }
          : item,
      ),
    );

    showToast(`Pembayaran utang usaha sebesar ${money(amount)} dicatat.`);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 text-stone-900">
      {toastMessage && (
        <div
          role="status"
          className="fixed right-4 top-20 z-[60] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-stone-200 bg-[#fcf9f4] px-4 py-3 shadow-lg sm:right-6 sm:max-w-sm"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#654832]" />
          <p className="min-w-0 flex-1 break-words text-sm leading-5 text-stone-700">
            {toastMessage}
          </p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Tutup notifikasi"
            className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page heading - existing */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            Piutang Pelanggan
          </h1>
          <p className="mt-1 text-sm leading-5 text-stone-500">
            Pantau tagihan, jatuh tempo, dan penerimaan pembayaran.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => onNavigate("customers")}
          className="w-full border-stone-200 bg-white text-stone-700 hover:bg-stone-50 sm:w-auto"
        >
          <Users className="mr-2 h-4 w-4" />
          Data Pelanggan
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </header>

      {/* Filter piutang pelanggan - existing */}
      <Card className="rounded-xl border-stone-200 shadow-none">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-stone-900">
              Filter piutang
            </h2>
            <p className="text-xs leading-5 text-stone-500">
              Cari berdasarkan invoice, pelanggan, SPK, atau produk.
            </p>
          </div>

          <div className="flex flex-row gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari invoice, pelanggan, SPK..."
                aria-label="Cari invoice atau pelanggan"
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>

            <Select
              value={selectedTier}
              onValueChange={(value) => setSelectedTier(value as TierFilter)}
            >
              <SelectTrigger
                aria-label="Filter tier pelanggan"
                className="h-10 bg-white focus:ring-[#795740]"
              >
                <SelectValue placeholder="Semua tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Tier">Semua Tier</SelectItem>
                <SelectItem value="Grosir">Grosir</SelectItem>
                <SelectItem value="Reseller">Reseller</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setSelectedStatus(value as StatusFilter)
              }
            >
              <SelectTrigger
                aria-label="Filter status jatuh tempo"
                className="h-10 bg-white focus:ring-[#795740]"
              >
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Status">Semua Status</SelectItem>
                <SelectItem value="Overdue">Lewat jatuh tempo</SelectItem>
                <SelectItem value="Lancar">Belum lewat jatuh tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-stone-500">
              Menampilkan{" "}
              <span className="font-semibold text-stone-700">
                {filteredReceivables.length}
              </span>{" "}
              dari {receivables.length} faktur
            </p>

            {(searchQuery ||
              selectedTier !== "Semua Tier" ||
              selectedStatus !== "Semua Status") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 w-fit text-xs text-[#654832] hover:bg-[#eee5dc] hover:text-[#654832]"
              >
                Reset filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daftar piutang pelanggan - existing */}
      <Card className="min-w-0 overflow-hidden rounded-xl border-stone-200 shadow-none">
        <CardHeader className="flex flex-col gap-2 space-y-0 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <CardTitle className="text-sm font-semibold text-stone-900">
              Daftar Piutang
            </CardTitle>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              Invoice, pembayaran, dan sisa tagihan pelanggan.
            </p>
          </div>

          <Badge
            variant="outline"
            className="w-fit border-stone-200 bg-stone-50 text-stone-600"
          >
            {filteredReceivables.length} faktur
          </Badge>
        </CardHeader>

        {filteredReceivables.length === 0 ? (
          <CardContent className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <ReceiptText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-stone-900">
              Tidak ada piutang ditemukan
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-stone-500">
              Coba ubah kata kunci pencarian atau filter yang sedang digunakan.
            </p>
            {(searchQuery ||
              selectedTier !== "Semua Tier" ||
              selectedStatus !== "Semua Status") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-4 border-stone-200 bg-white text-stone-700"
              >
                Reset filter
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            {/* MOBILE: card list piutang */}
            <div className="space-y-3 p-3 md:hidden">
              {filteredReceivables.map((invoice) => {
                const dueTone = getStatusBadgeClass(
                  invoice.status,
                  invoice.isOverdue,
                );

                const creditUsedPercent = Math.max(
                  0,
                  Math.min(100, invoice.creditUsedPercent),
                );

                return (
                  <article
                    key={invoice.id}
                    className="min-w-0 rounded-xl border border-stone-200 bg-white p-3.5"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-bold text-[#654832]">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-500">
                          {invoice.date}
                        </p>
                        <p className="mt-1 break-words text-[11px] text-stone-500">
                          SPK: {invoice.spkRef}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "max-w-[45%] shrink-0 whitespace-normal text-center text-[10px]",
                          dueTone,
                        )}
                      >
                        {invoice.status}
                      </Badge>
                    </div>

                    <Separator className="my-3 bg-stone-100" />

                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-stone-900">
                        {invoice.customerName}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            getTierBadgeClass(invoice.customerTier),
                          )}
                        >
                          {invoice.customerTier}
                        </Badge>

                        {invoice.picName && (
                          <span className="break-words text-[10px] text-stone-500">
                            PIC: {invoice.picName}
                          </span>
                        )}
                      </div>

                      {invoice.phone && (
                        <p className="mt-1.5 break-all text-xs text-stone-500">
                          {invoice.phone}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 rounded-lg bg-stone-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                        Pesanan
                      </p>
                      <p className="mt-1 break-words text-xs font-medium text-stone-800">
                        {invoice.itemSummary}
                      </p>
                      {invoice.orderDescription && (
                        <p className="mt-1 break-words text-xs leading-5 text-stone-500">
                          {invoice.orderDescription}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] text-stone-500">
                          Nilai invoice
                        </p>
                        <p className="mt-1 break-words text-xs font-semibold tabular-nums text-stone-800">
                          {money(invoice.totalAmount)}
                        </p>
                      </div>

                      <div className="min-w-0 text-right">
                        <p className="text-[11px] text-stone-500">Terbayar</p>
                        <p className="mt-1 break-words text-xs font-semibold tabular-nums text-emerald-700">
                          {money(invoice.paidAmount)}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "mt-3 rounded-lg border p-3",
                        invoice.isOverdue
                          ? "border-rose-200 bg-rose-50"
                          : "border-stone-200 bg-[#fcf9f4]",
                      )}
                    >
                      <p className="text-[11px] text-stone-500">Sisa piutang</p>
                      <p
                        className={cn(
                          "mt-1 break-words text-lg font-bold tabular-nums",
                          invoice.isOverdue
                            ? "text-rose-700"
                            : "text-stone-900",
                        )}
                      >
                        {money(invoice.remainingDebt)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-stone-500">
                          Jatuh tempo: {invoice.dueDate}
                        </span>
                        {invoice.isOverdue && (
                          <Badge
                            variant="outline"
                            className="border-rose-200 bg-white text-[10px] text-rose-700"
                          >
                            Terlambat
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-stone-500">
                          Plafon kredit
                        </p>
                        {invoice.creditLimit > 0 ? (
                          <span className="text-[11px] font-medium text-stone-700">
                            {creditUsedPercent}% digunakan
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500">
                            Tunai / DP
                          </span>
                        )}
                      </div>

                      {invoice.creditLimit > 0 && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              creditUsedPercent > 80
                                ? "bg-rose-600"
                                : "bg-[#795740]",
                            )}
                            style={{ width: `${creditUsedPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSendWAReminder(invoice)}
                        className="h-10 w-full border-emerald-200 bg-white text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        <MessageCircle className="mr-2 h-4 w-4 shrink-0" />
                        Pengingat WhatsApp
                      </Button>

                      <Button
                        type="button"
                        disabled={invoice.remainingDebt <= 0}
                        onClick={() => setActiveInvoice(invoice)}
                        className="h-10 w-full bg-[#5f402a] text-xs text-white hover:bg-[#795740]"
                      >
                        <CircleDollarSign className="mr-2 h-4 w-4 shrink-0" />
                        Catat Pembayaran
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* DESKTOP: full table piutang */}
            <div className="hidden w-full overflow-x-auto md:block">
              <Table className="min-w-[1120px]">
                <TableHeader>
                  <TableRow className="bg-stone-50 hover:bg-stone-50">
                    <TableHead className="h-10 px-4 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Invoice / SPK
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Pelanggan
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Pesanan
                    </TableHead>
                    <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Nilai
                    </TableHead>
                    <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Terbayar
                    </TableHead>
                    <TableHead className="h-10 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Sisa Piutang
                    </TableHead>
                    <TableHead className="h-10 text-center text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Jatuh Tempo
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredReceivables.map((invoice) => {
                    const dueTone = getStatusBadgeClass(
                      invoice.status,
                      invoice.isOverdue,
                    );

                    return (
                      <TableRow
                        key={invoice.id}
                        className="transition-colors hover:bg-stone-50/80"
                      >
                        <TableCell className="whitespace-nowrap px-4 py-3.5 align-top">
                          <p className="font-semibold text-[#654832]">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="mt-1 text-[11px] text-stone-500">
                            {invoice.date}
                          </p>
                          <p className="mt-1 text-[10px] text-stone-400">
                            SPK: {invoice.spkRef}
                          </p>
                        </TableCell>

                        <TableCell className="max-w-[190px] align-top">
                          <p className="truncate font-medium text-stone-900">
                            {invoice.customerName}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0 text-[10px]",
                                getTierBadgeClass(invoice.customerTier),
                              )}
                            >
                              {invoice.customerTier}
                            </Badge>
                            {invoice.picName && (
                              <span className="truncate text-[10px] text-stone-500">
                                {invoice.picName}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[10px] text-stone-500">
                            {invoice.phone}
                          </p>
                        </TableCell>

                        <TableCell className="max-w-[190px] align-top">
                          <p className="truncate font-medium text-stone-800">
                            {invoice.itemSummary}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-stone-500">
                            {invoice.orderDescription}
                          </p>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right align-top font-medium tabular-nums text-stone-800">
                          {money(invoice.totalAmount)}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right align-top font-medium tabular-nums text-emerald-700">
                          {money(invoice.paidAmount)}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right align-top">
                          <span
                            className={cn(
                              "font-bold tabular-nums",
                              invoice.isOverdue
                                ? "text-rose-700"
                                : "text-stone-900",
                            )}
                          >
                            {money(invoice.remainingDebt)}
                          </span>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-center align-top">
                          <Badge
                            variant="outline"
                            className={cn("font-medium", dueTone)}
                          >
                            {invoice.status}
                          </Badge>
                          <p className="mt-1.5 text-[10px] text-stone-500">
                            {invoice.dueDate}
                          </p>
                        </TableCell>

                        <TableCell className="whitespace-nowrap px-4 align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Siapkan pengingat WhatsApp"
                              aria-label={`Siapkan pengingat WhatsApp untuk ${invoice.customerName}`}
                              onClick={() => handleSendWAReminder(invoice)}
                              className="h-8 w-8 border-stone-200 text-stone-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              disabled={invoice.remainingDebt <= 0}
                              onClick={() => setActiveInvoice(invoice)}
                              className="h-8 bg-[#5f402a] px-3 text-xs text-white hover:bg-[#795740]"
                            >
                              <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" />
                              Bayar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {filteredReceivables.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-stone-200 bg-stone-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-stone-500">
              Menampilkan {filteredReceivables.length} faktur
            </p>
            <p className="text-xs leading-5 text-stone-500">
              Total sisa tagihan hasil filter:{" "}
              <span className="font-semibold text-stone-800">
                {money(
                  filteredReceivables.reduce(
                    (sum, invoice) => sum + Math.max(0, invoice.remainingDebt),
                    0,
                  ),
                )}
              </span>
            </p>
          </div>
        )}
      </Card>

      {/* =====================================================
          TAMBAHAN: UTANG USAHA
          Piutang pelanggan di atas tidak diubah.
      ====================================================== */}
      <Card className="min-w-0 overflow-hidden rounded-xl border-stone-200 shadow-none">
        <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <CardTitle className="text-sm font-semibold text-stone-900">
              Utang Usaha
            </CardTitle>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              Pantau kewajiban pembayaran kepada supplier dan pemasok.
            </p>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
            <p className="text-xs text-orange-700">Total sisa utang</p>
            <p className="mt-1 text-base font-bold text-orange-800">
              {money(totalBusinessDebt)}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={businessDebtSearch}
                onChange={(event) => setBusinessDebtSearch(event.target.value)}
                placeholder="Cari nomor utang, supplier, atau keterangan..."
                aria-label="Cari utang usaha"
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>

            <Select
              value={businessDebtStatus}
              onValueChange={(value) => setBusinessDebtStatus(value ?? "")}
            >
              <SelectTrigger className="w-full bg-white sm:w-[210px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Status">Semua Status</SelectItem>
                <SelectItem value="Belum Dibayar">Belum Dibayar</SelectItem>
                <SelectItem value="Dibayar Sebagian">
                  Dibayar Sebagian
                </SelectItem>
                <SelectItem value="Lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredBusinessDebts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 px-4 py-10 text-center">
              <p className="text-sm font-medium text-stone-700">
                Tidak ada utang usaha ditemukan
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Coba ubah kata kunci atau filter status.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE: kartu utang usaha */}
              <div className="space-y-3 md:hidden">
                {filteredBusinessDebts.map((debt) => {
                  const remaining = getBusinessDebtRemaining(debt);
                  const status = getBusinessDebtStatus(debt);

                  return (
                    <article
                      key={debt.id}
                      className="rounded-xl border border-stone-200 bg-white p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-bold text-[#654832]">
                            {debt.invoiceNumber}
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-stone-900">
                            {debt.supplierName}
                          </p>
                          <p className="mt-1 break-words text-xs text-stone-500">
                            {debt.description}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 whitespace-normal text-center",
                            getBusinessDebtBadgeClass(status),
                          )}
                        >
                          {status}
                        </Badge>
                      </div>

                      <Separator className="my-3 bg-stone-100" />

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-stone-500">Total utang</p>
                          <p className="mt-1 font-semibold text-stone-800">
                            {money(debt.totalAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-stone-500">Sudah dibayar</p>
                          <p className="mt-1 font-semibold text-emerald-700">
                            {money(debt.paidAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <p className="text-xs text-orange-700">Sisa utang</p>
                        <p className="mt-1 text-lg font-bold text-orange-800">
                          {money(remaining)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Jatuh tempo: {debt.dueDate || "-"}
                        </p>
                      </div>

                      {debt.notes && (
                        <p className="mt-3 text-xs leading-5 text-stone-500">
                          Catatan: {debt.notes}
                        </p>
                      )}

                      {remaining > 0 && (
                        <Button
                          type="button"
                          className="mt-3 w-full bg-[#5f402a] text-white hover:bg-[#795740]"
                          onClick={() => handleSettleBusinessDebt(debt.id)}
                        >
                          <CircleDollarSign className="mr-2 h-4 w-4" />
                          Catat Pembayaran Utang
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* DESKTOP: tabel utang usaha */}
              <div className="hidden overflow-x-auto rounded-lg border border-stone-200 md:block">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="bg-stone-50 hover:bg-stone-50">
                      <TableHead>Nomor Utang</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Dibayar</TableHead>
                      <TableHead className="text-right">Sisa Utang</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredBusinessDebts.map((debt) => {
                      const remaining = getBusinessDebtRemaining(debt);
                      const status = getBusinessDebtStatus(debt);

                      return (
                        <TableRow key={debt.id}>
                          <TableCell className="whitespace-nowrap font-semibold text-[#654832]">
                            {debt.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {debt.supplierName}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate">
                            {debt.description}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {money(debt.totalAmount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-emerald-700">
                            {money(debt.paidAmount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-bold text-orange-800">
                            {money(remaining)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {debt.dueDate || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getBusinessDebtBadgeClass(status)}
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {remaining > 0 ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  handleSettleBusinessDebt(debt.id)
                                }
                                className="bg-[#5f402a] text-white hover:bg-[#795740]"
                              >
                                Bayar
                              </Button>
                            ) : (
                              <span className="text-xs text-emerald-700">
                                Lunas
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1 border-t border-stone-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-stone-500">
              {filteredBusinessDebts.length} transaksi utang usaha
            </p>
            <p className="text-xs text-stone-500">
              Sisa utang hasil filter:{" "}
              <span className="font-semibold text-stone-800">
                {money(
                  filteredBusinessDebts.reduce(
                    (sum, debt) => sum + getBusinessDebtRemaining(debt),
                    0,
                  ),
                )}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <SettlementDialog
        invoice={activeInvoice}
        open={Boolean(activeInvoice)}
        onOpenChange={(open) => {
          if (!open) setActiveInvoice(null);
        }}
        onSubmit={handleExecutePayment}
      />
    </div>
  );
};
