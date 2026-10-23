import type { FormEvent } from "react";
import React, { useMemo, useState } from "react";
import type { Customer } from "../types";
import type { PosCheckoutData } from "./PosView";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  MessageCircle,
  Package,
  QrCode,
  ShoppingCart,
  UserRound,
  Wallet,
} from "lucide-react";

import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";

type PaymentScheme = "lunas" | "dp" | "kredit";
type PaymentMethod = "bca" | "qris" | "cash";

interface PosCheckoutViewProps {
  customers: Customer[];
  data: PosCheckoutData;
  onBack: (updatedData: PosCheckoutData) => void;
  onToast: (msg: string) => void;
}

const ONGKIR_COST = 250000;
const RAKIT_COST = 150000;

const rupiah = (value: number) =>
  `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const todayLocal = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (
  value: string,
  options: Intl.DateTimeFormatOptions = {},
) => {
  if (!value) return "Belum ditentukan";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Tanggal tidak valid";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

const getProductPrice = (
  item: PosCheckoutData["items"][number],
  tier: Customer["tier"],
) => {
  if (item.customPrice !== undefined) {
    return item.customPrice;
  }

  if (tier === "Grosir") {
    return item.product.prices.grosir;
  }

  if (tier === "Reseller") {
    return item.product.prices.reseller;
  }

  return item.product.prices.retail;
};

const cardClass = "rounded-xl border border-stone-200 bg-white shadow-none";

const primaryButtonClass =
  "bg-[#5f402a] text-white hover:bg-[#795740] disabled:opacity-50";

const secondaryButtonClass =
  "border-stone-200 bg-white text-stone-700 hover:bg-stone-50";

const inputClass = "border-stone-200 bg-white focus-visible:ring-[#795740]";

const helperClass = "text-xs leading-5 text-stone-500";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

function SectionHeader({
  title,
  description,
  icon,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[#5f402a]">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>

          {description && (
            <p className={`mt-1 ${helperClass}`}>{description}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  strong?: boolean;
  valueClassName?: string;
}

function SummaryRow({
  label,
  value,
  strong = false,
  valueClassName = "",
}: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span
        className={strong ? "font-semibold text-stone-800" : "text-stone-500"}
      >
        {label}
      </span>

      <span
        className={[
          "shrink-0 text-right tabular-nums",
          strong ? "font-semibold" : "font-medium",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

export const PosCheckoutView: React.FC<PosCheckoutViewProps> = ({
  customers,
  data,
  onBack,
  onToast,
}) => {
  const [paymentScheme, setPaymentScheme] = useState<PaymentScheme>("dp");
  const [dpAmount, setDpAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bca");
  const [dueDate, setDueDate] = useState("");

  const customer = useMemo(
    () => customers.find((item) => item.id === data.customerId),
    [customers, data.customerId],
  );

  const subtotal = useMemo(() => {
    if (!customer) return 0;

    return data.items.reduce((sum, item) => {
      return sum + getProductPrice(item, customer.tier) * item.quantity;
    }, 0);
  }, [data.items, customer]);

  const ongkir = data.includeOngkir ? ONGKIR_COST : 0;
  const rakit = data.includeRakit ? RAKIT_COST : 0;
  const total = subtotal + ongkir + rakit;

  const paidNow =
    paymentScheme === "lunas"
      ? total
      : paymentScheme === "kredit"
        ? 0
        : Math.min(Math.max(0, dpAmount), total);

  const remaining = Math.max(0, total - paidNow);

  const availableCredit = customer
    ? Math.max(0, customer.creditLimit - customer.creditUsed)
    : 0;

  const dpPercentage = total > 0 ? Math.min(100, (paidNow / total) * 100) : 0;

  const paymentMethodLabel: Record<PaymentMethod, string> = {
    bca: "Transfer BCA",
    qris: "QRIS",
    cash: "Tunai",
  };

  const handleBack = () => {
    onBack(data);
  };

  const handleWhatsApp = () => {
    if (!customer) {
      onToast("Pelanggan tidak ditemukan.");
      return;
    }

    const phone = customer.phone?.replace(/\D/g, "");

    if (!phone) {
      onToast("Nomor WhatsApp pelanggan belum tersedia.");
      return;
    }

    const normalizedPhone = phone.startsWith("0")
      ? `62${phone.slice(1)}`
      : phone;

    const dueDateText =
      paymentScheme !== "lunas" && dueDate
        ? formatDate(dueDate, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "";

    const message = [
      `Halo ${customer.name},`,
      "",
      `Berikut ringkasan pesanan ${data.invoiceNumber}.`,
      `Total transaksi: ${rupiah(total)}`,
      `Pembayaran awal: ${rupiah(paidNow)}`,
      `Sisa tagihan: ${rupiah(remaining)}`,
      dueDateText ? `Jatuh tempo: ${dueDateText}` : "",
      `Metode pembayaran: ${paymentMethodLabel[paymentMethod]}`,
      "",
      "Terima kasih.",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleProcess = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!customer) {
      onToast("Pelanggan tidak ditemukan. Kembali ke POS dan pilih pelanggan.");
      return;
    }

    if (data.items.length === 0) {
      onToast("Keranjang kosong. Kembali ke POS untuk memilih produk.");
      return;
    }

    if (paymentScheme === "dp") {
      if (!Number.isFinite(dpAmount) || dpAmount <= 0) {
        onToast("Masukkan nominal DP yang valid.");
        return;
      }

      if (dpAmount > total) {
        onToast("Nominal DP tidak boleh melebihi total transaksi.");
        return;
      }
    }

    if (paymentScheme !== "lunas" && remaining > availableCredit) {
      onToast("Sisa tagihan melebihi limit piutang pelanggan.");
      return;
    }

    if (paymentScheme !== "lunas" && !dueDate) {
      onToast("Tentukan tanggal jatuh tempo sisa tagihan.");
      return;
    }

    onToast(
      "Checkout valid. Transaksi belum disimpan karena API belum terhubung.",
    );
  };

  if (!customer) {
    return (
      <div className="mx-auto w-full max-w-3xl py-6">
        <Card className={cardClass}>
          <CardContent className="p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-[#5f402a]">
              <UserRound className="h-5 w-5" />
            </div>

            <h1 className="mt-4 text-xl font-semibold tracking-tight text-stone-900">
              Pelanggan tidak ditemukan
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-stone-500">
              Data pelanggan mungkin telah berubah. Kembali ke POS untuk memilih
              pelanggan lagi.
            </p>

            <Button
              type="button"
              variant="outline"
              className={`mt-5 ${secondaryButtonClass}`}
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke POS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleProcess}
      className="flex w-full flex-col gap-5 text-stone-900"
    >
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Checkout penjualan
          </h1>

          <p className="mt-1 text-sm text-stone-500">
            Periksa pesanan, lalu pilih cara pembayaran pelanggan.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className={secondaryButtonClass}
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke kasir
        </Button>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Informasi transaksi */}
          <Card className={cardClass}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={helperClass}>Nomor transaksi</p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold">
                    {data.invoiceNumber}
                  </p>
                </div>

                <Badge
                  variant="secondary"
                  className="bg-stone-100 text-stone-700 hover:bg-stone-100"
                >
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  {data.items.length} jenis produk
                </Badge>
              </div>

              <Separator className="my-4 bg-stone-200" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[#5f402a]">
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className={helperClass}>Pelanggan</p>
                    <p className="mt-1 break-words text-sm font-semibold">
                      {customer.name}
                    </p>
                    <p className="mt-1 break-words text-xs text-stone-500">
                      {customer.phone || "Nomor telepon belum diisi"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[#5f402a]">
                    <CreditCard className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className={helperClass}>Kategori harga</p>
                    <p className="mt-1 text-sm font-semibold">
                      {customer.tier}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Limit piutang tersedia: {rupiah(availableCredit)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rincian pesanan */}
          <Card className={`${cardClass} overflow-hidden`}>
            <CardHeader className="border-b border-stone-200 px-5 py-4">
              <CardTitle className="text-sm font-semibold">
                Rincian pesanan
              </CardTitle>

              <CardDescription className={helperClass}>
                Periksa jumlah dan harga produk sebelum melanjutkan.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {data.items.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                    <ShoppingCart className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-medium">
                    Keranjang masih kosong
                  </p>

                  <p className={`mt-1 ${helperClass}`}>
                    Kembali ke POS untuk menambahkan produk.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200 px-5">
                  {data.items.map((item) => {
                    const unitPrice = getProductPrice(item, customer.tier);

                    return (
                      <div
                        key={item.product.id}
                        className="flex items-start gap-3 py-4"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 text-stone-400">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-stone-900">
                            {item.product.name}
                          </p>

                          <p className="mt-1 break-words text-xs text-stone-500">
                            {item.product.sku} · {item.quantity} unit
                          </p>

                          <p className="mt-1 text-xs text-stone-500">
                            {rupiah(unitPrice)} / unit
                          </p>
                        </div>

                        <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
                          {rupiah(unitPrice * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-3 border-t border-stone-200 bg-stone-50 p-5">
                <SummaryRow label="Subtotal produk" value={rupiah(subtotal)} />

                {data.includeOngkir && (
                  <SummaryRow label="Ongkos kirim" value={rupiah(ongkir)} />
                )}

                {data.includeRakit && (
                  <SummaryRow
                    label="Rakit & pemasangan"
                    value={rupiah(rakit)}
                  />
                )}

                <Separator className="bg-stone-200" />

                <SummaryRow
                  label="Total transaksi"
                  value={rupiah(total)}
                  strong
                  valueClassName="text-lg text-[#5f402a]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pembayaran */}
          <Card className={cardClass}>
            <CardHeader className="px-5 pb-0 pt-5">
              <CardTitle className="text-sm font-semibold">
                Pembayaran
              </CardTitle>

              <CardDescription className={helperClass}>
                Tentukan skema dan metode pembayaran pelanggan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              <div>
                <Label className="mb-2 block text-xs font-medium text-stone-700">
                  Skema pembayaran
                </Label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      {
                        value: "lunas",
                        label: "Lunas",
                        detail: "Bayar penuh",
                        icon: CheckCircle2,
                      },
                      {
                        value: "dp",
                        label: "DP / Termin",
                        detail: "Bayar sebagian",
                        icon: CircleDollarSign,
                      },
                      {
                        value: "kredit",
                        label: "Kredit",
                        detail: "Bayar kemudian",
                        icon: CreditCard,
                      },
                    ] as const
                  ).map((option) => {
                    const selected = paymentScheme === option.value;
                    const IconComponent = option.icon;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentScheme(option.value)}
                        aria-pressed={selected}
                        className={[
                          "flex min-h-[100px] flex-col items-start rounded-lg border p-3 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]",
                          selected
                            ? "border-[#795740] bg-[#f7f2ed] text-[#5f402a]"
                            : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
                        ].join(" ")}
                      >
                        <IconComponent className="mb-3 h-5 w-5" />

                        <span className="text-sm font-semibold">
                          {option.label}
                        </span>

                        <span className="mt-1 text-xs text-stone-500">
                          {option.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentScheme === "dp" && (
                <div className="rounded-lg border border-stone-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label
                      htmlFor="checkout-dp"
                      className="text-sm font-medium"
                    >
                      Nominal DP
                    </Label>

                    <Badge
                      variant="secondary"
                      className="bg-stone-100 text-stone-700"
                    >
                      {dpPercentage.toFixed(1)}% dari total
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-stone-500">Rp</span>

                    <Input
                      id="checkout-dp"
                      type="number"
                      min={0}
                      max={total}
                      step={1}
                      value={dpAmount}
                      onChange={(event) =>
                        setDpAmount(
                          Math.max(0, Number(event.target.value) || 0),
                        )
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[30, 50, 70].map((percentage) => (
                      <Button
                        key={percentage}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={secondaryButtonClass}
                        onClick={() =>
                          setDpAmount(Math.round((total * percentage) / 100))
                        }
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between gap-3 text-xs text-stone-500">
                      <span>Progress pembayaran</span>
                      <span>{dpPercentage.toFixed(1)}%</span>
                    </div>

                    <div
                      className="h-2 overflow-hidden rounded-full bg-stone-100"
                      role="progressbar"
                      aria-label="Progress pembayaran"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(dpPercentage)}
                    >
                      <div
                        className="h-full rounded-full bg-[#795740] transition-all"
                        style={{ width: `${dpPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-2 block text-xs font-medium text-stone-700">
                  Metode pembayaran
                </Label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      {
                        value: "bca",
                        label: "Transfer BCA",
                        icon: Wallet,
                      },
                      {
                        value: "qris",
                        label: "QRIS",
                        icon: QrCode,
                      },
                      {
                        value: "cash",
                        label: "Tunai",
                        icon: Banknote,
                      },
                    ] as const
                  ).map((option) => {
                    const selected = paymentMethod === option.value;
                    const IconComponent = option.icon;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMethod(option.value)}
                        aria-pressed={selected}
                        className={[
                          "flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]",
                          selected
                            ? "border-[#795740] bg-[#f7f2ed] text-[#5f402a]"
                            : "border-stone-200 text-stone-700 hover:bg-stone-50",
                        ].join(" ")}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-xs font-medium">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentScheme !== "lunas" && (
                <div className="space-y-4 rounded-lg bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-stone-600">Sisa tagihan</span>

                    <span className="text-sm font-semibold tabular-nums text-red-700">
                      {rupiah(remaining)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="checkout-due-date"
                      className="text-xs font-medium text-stone-700"
                    >
                      Tanggal jatuh tempo
                    </Label>

                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                      <Input
                        id="checkout-due-date"
                        type="date"
                        min={todayLocal()}
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className={`pl-9 ${inputClass}`}
                      />
                    </div>
                  </div>

                  <Separator className="bg-stone-200" />

                  <SummaryRow
                    label="Limit piutang tersedia"
                    value={rupiah(availableCredit)}
                  />

                  {remaining > availableCredit && (
                    <Alert
                      variant="destructive"
                      className="border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-700"
                    >
                      <AlertCircle className="h-4 w-4" />

                      <AlertDescription className="text-xs leading-5">
                        Sisa tagihan melebihi limit piutang pelanggan. Sesuaikan
                        DP atau periksa limit piutang pelanggan.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ringkasan pembayaran */}
        <aside className="min-w-0 lg:sticky lg:top-4">
          <Card className={cardClass}>
            <CardHeader className="px-5 pb-0 pt-5">
              <SectionHeader
                title="Ringkasan pembayaran"
                description="Konfirmasi nominal sebelum memproses transaksi."
                icon={<CircleDollarSign className="h-5 w-5" />}
              />
            </CardHeader>

            <CardContent className="p-5">
              <div className="space-y-3">
                <SummaryRow label="Subtotal" value={rupiah(subtotal)} />

                {data.includeOngkir && (
                  <SummaryRow label="Ongkos kirim" value={rupiah(ongkir)} />
                )}

                {data.includeRakit && (
                  <SummaryRow
                    label="Rakit & pemasangan"
                    value={rupiah(rakit)}
                  />
                )}

                <Separator className="my-4 bg-stone-200" />

                <div>
                  <p className="text-xs text-stone-500">Total transaksi</p>

                  <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-[#5f402a]">
                    {rupiah(total)}
                  </p>
                </div>

                <div className="rounded-lg bg-stone-50 p-3">
                  <SummaryRow
                    label={
                      paymentScheme === "lunas"
                        ? "Dibayar sekarang"
                        : paymentScheme === "dp"
                          ? "DP / pembayaran awal"
                          : "Pembayaran awal"
                    }
                    value={rupiah(paidNow)}
                    strong
                  />
                </div>

                {paymentScheme !== "lunas" && (
                  <SummaryRow
                    label="Sisa tagihan"
                    value={rupiah(remaining)}
                    strong
                    valueClassName="text-red-700"
                  />
                )}

                <Separator className="bg-stone-200" />

                <SummaryRow
                  label="Metode pembayaran"
                  value={paymentMethodLabel[paymentMethod]}
                />

                {paymentScheme !== "lunas" && (
                  <SummaryRow label="Jatuh tempo" value={formatDate(dueDate)} />
                )}

                <SummaryRow label="Kategori pelanggan" value={customer.tier} />
              </div>

              {paymentScheme !== "lunas" && remaining > availableCredit && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />

                    <p className="text-xs leading-5 text-red-800">
                      Limit piutang tidak mencukupi untuk transaksi ini.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={data.items.length === 0}
                  className={`h-11 w-full ${primaryButtonClass}`}
                >
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Validasi transaksi
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWhatsApp}
                  className={`h-11 w-full ${secondaryButtonClass}`}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Kirim ringkasan WhatsApp
                </Button>
              </div>

              <div className="mt-4 border-t border-stone-200 pt-3">
                <p className="text-xs leading-5 text-stone-500">
                  Transaksi belum tersimpan secara permanen. Integrasi API
                  diperlukan untuk menyimpan transaksi, mencatat pembayaran, dan
                  memperbarui stok.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  );
};
