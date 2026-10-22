import React, { useMemo, useState } from "react";
import { Customer } from "../types";
import { PosCheckoutData } from "./PosView";

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

const C = {
  ink: "#292720",
  muted: "#77746B",
  primary: "#795740",
  primaryDark: "#5F402A",
  border: "#E9E6DF",
  background: "#F8F7F3",
  soft: "#F1EEE8",
  white: "#FFFFFF",
  green: "#287653",
  red: "#B5473C",
};

const rupiah = (value: number) =>
  `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const panel = "rounded-xl border border-[#E9E6DF] bg-white";

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#795740] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5F402A] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E9E6DF] bg-white px-4 py-2.5 text-sm font-medium text-[#50453E] transition hover:bg-[#F8F7F3]";

const field =
  "h-10 w-full rounded-lg border border-[#E9E6DF] bg-white px-3 text-sm text-[#292720] outline-none transition focus:border-[#795740] focus:ring-2 focus:ring-[#795740]/10";

const labelClass = "mb-2 block text-xs font-medium text-[#50453E]";
const helperClass = "text-xs leading-5 text-[#77746B]";

const Icon: React.FC<{ children: string; className?: string }> = ({
  children,
  className = "",
}) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {children}
  </span>
);

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

  const handleBack = () => onBack(data);

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
        ? new Date(`${dueDate}T00:00:00`).toLocaleDateString("id-ID", {
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

  const handleProcess = () => {
    if (!customer) {
      onToast("Pelanggan tidak ditemukan. Kembali ke POS dan pilih pelanggan.");
      return;
    }

    if (data.items.length === 0) {
      onToast("Keranjang kosong. Kembali ke POS untuk memilih produk.");
      return;
    }

    if (
      paymentScheme === "dp" &&
      (!Number.isFinite(dpAmount) || dpAmount <= 0)
    ) {
      onToast("Masukkan nominal DP yang valid.");
      return;
    }

    if (paymentScheme === "dp" && dpAmount > total) {
      onToast("Nominal DP tidak boleh melebihi total transaksi.");
      return;
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
      <div className="mx-auto w-full max-w-3xl py-6 text-[#292720]">
        <section className={`${panel} p-5 sm:p-6`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F1EEE8]">
            <Icon className="text-xl text-[#795740]">person_off</Icon>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Pelanggan tidak ditemukan
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#77746B]">
            Data pelanggan mungkin telah berubah. Kembali ke POS untuk memilih
            pelanggan lagi.
          </p>

          <button
            type="button"
            onClick={handleBack}
            className={`${secondaryButton} mt-5`}
          >
            <Icon className="text-lg">arrow_back</Icon>
            Kembali ke POS
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5 text-[#292720]">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-[#77746B]">
          Periksa pesanan, lalu pilih cara bayar.
        </p>

        <button type="button" onClick={handleBack} className={secondaryButton}>
          <Icon className="text-lg">arrow_back</Icon>
          Kembali ke kasir
        </button>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Informasi transaksi */}
          <section className={`${panel} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={helperClass}>Nomor transaksi</p>
                <h2 className="mt-1 font-mono text-sm font-semibold">
                  {data.invoiceNumber}
                </h2>
              </div>

              <span className="rounded-md bg-[#F1EEE8] px-2.5 py-1.5 text-xs font-medium text-[#5F402A]">
                {data.items.length} jenis produk
              </span>
            </div>

            <div className="mt-4 grid gap-4 border-t border-[#E9E6DF] pt-4 sm:grid-cols-2">
              <div>
                <p className={helperClass}>Pelanggan</p>
                <p className="mt-1 text-sm font-semibold">{customer.name}</p>
                <p className="mt-1 text-xs text-[#77746B]">
                  {customer.phone || "Nomor telepon belum diisi"}
                </p>
              </div>

              <div>
                <p className={helperClass}>Kategori harga</p>
                <p className="mt-1 text-sm font-semibold">{customer.tier}</p>
                <p className="mt-1 text-xs text-[#77746B]">
                  Limit piutang tersedia: {rupiah(availableCredit)}
                </p>
              </div>
            </div>
          </section>

          {/* Rincian pesanan */}
          <section className={`${panel} overflow-hidden`}>
            <div className="border-b border-[#E9E6DF] px-5 py-4">
              <h2 className="text-sm font-semibold">Rincian pesanan</h2>
              <p className={`mt-1 ${helperClass}`}>
                Periksa jumlah dan harga produk sebelum melanjutkan.
              </p>
            </div>

            {data.items.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Icon className="text-3xl text-[#A69A8E]">shopping_cart</Icon>
                <p className="mt-2 text-sm font-medium">
                  Keranjang masih kosong
                </p>
                <p className={`mt-1 ${helperClass}`}>
                  Kembali ke POS untuk menambahkan produk.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E9E6DF] px-5">
                {data.items.map((item) => {
                  const unitPrice = getProductPrice(item, customer.tier);

                  return (
                    <div
                      key={item.product.id}
                      className="flex items-start gap-3 py-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F1EEE8]">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Icon className="text-xl text-[#A69A8E]">chair</Icon>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {item.product.name}
                        </p>
                        <p className="mt-1 text-xs text-[#77746B]">
                          {item.product.sku} · {item.quantity} unit
                        </p>
                        <p className="mt-1 text-xs text-[#77746B]">
                          {rupiah(unitPrice)} / unit
                        </p>
                      </div>

                      <p className="shrink-0 text-right text-sm font-semibold">
                        {rupiah(unitPrice * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-3 border-t border-[#E9E6DF] bg-[#F8F7F3] p-5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-[#77746B]">Subtotal produk</span>
                <span>{rupiah(subtotal)}</span>
              </div>

              {data.includeOngkir && (
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#77746B]">Ongkos kirim</span>
                  <span>{rupiah(ongkir)}</span>
                </div>
              )}

              {data.includeRakit && (
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#77746B]">Rakit & pemasangan</span>
                  <span>{rupiah(rakit)}</span>
                </div>
              )}

              <div className="flex justify-between gap-3 border-t border-[#E9E6DF] pt-3">
                <span className="text-sm font-semibold">Total transaksi</span>
                <span className="text-lg font-semibold text-[#5F402A]">
                  {rupiah(total)}
                </span>
              </div>
            </div>
          </section>

          {/* Pembayaran */}
          <section className={`${panel} p-5`}>
            <div>
              <h2 className="text-sm font-semibold">Pembayaran</h2>
              <p className={`mt-1 ${helperClass}`}>
                Tentukan skema dan metode pembayaran pelanggan.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["lunas", "Lunas", "Bayar penuh"],
                  ["dp", "DP / Termin", "Bayar sebagian"],
                  ["kredit", "Kredit", "Bayar kemudian"],
                ] as const
              ).map(([value, label, detail]) => {
                const selected = paymentScheme === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentScheme(value)}
                    aria-pressed={selected}
                    className={`rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-[#795740] bg-[#F8F7F3]"
                        : "border-[#E9E6DF] hover:bg-[#F8F7F3]"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-1 block text-xs text-[#77746B]">
                      {detail}
                    </span>
                  </button>
                );
              })}
            </div>

            {paymentScheme === "dp" && (
              <div className="mt-4 rounded-lg border border-[#E9E6DF] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="checkout-dp" className="text-sm font-medium">
                    Nominal DP
                  </label>
                  <span className="text-xs text-[#77746B]">
                    {dpPercentage.toFixed(1)}% dari total
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-[#77746B]">Rp</span>
                  <input
                    id="checkout-dp"
                    type="number"
                    min={0}
                    max={total}
                    value={dpAmount}
                    onChange={(event) =>
                      setDpAmount(Math.max(0, Number(event.target.value) || 0))
                    }
                    className={field}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[30, 50, 70].map((percentage) => (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() =>
                        setDpAmount(Math.round((total * percentage) / 100))
                      }
                      className="rounded-lg border border-[#E9E6DF] px-3 py-2 text-xs font-medium text-[#5F402A] transition hover:bg-[#F1EEE8]"
                    >
                      {percentage}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Metode pembayaran</p>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["bca", "Transfer BCA", "account_balance"],
                    ["qris", "QRIS", "qr_code_2"],
                    ["cash", "Tunai", "payments"],
                  ] as const
                ).map(([value, label, icon]) => {
                  const selected = paymentMethod === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentMethod(value)}
                      aria-pressed={selected}
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition ${
                        selected
                          ? "border-[#795740] bg-[#F8F7F3] text-[#5F402A]"
                          : "border-[#E9E6DF] text-[#50453E] hover:bg-[#F8F7F3]"
                      }`}
                    >
                      <Icon className="text-xl">{icon}</Icon>
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentScheme !== "lunas" && (
              <div className="mt-5 rounded-lg bg-[#F8F7F3] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#50453E]">Sisa tagihan</span>
                  <span className="text-sm font-semibold text-[#B5473C]">
                    {rupiah(remaining)}
                  </span>
                </div>

                <div className="mt-4">
                  <label htmlFor="checkout-due-date" className={labelClass}>
                    Tanggal jatuh tempo
                  </label>
                  <input
                    id="checkout-due-date"
                    type="date"
                    min={new Date().toLocaleDateString("en-CA")}
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className={field}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E9E6DF] pt-3">
                  <span className="text-xs text-[#77746B]">
                    Limit piutang tersedia
                  </span>
                  <span className="text-sm font-medium">
                    {rupiah(availableCredit)}
                  </span>
                </div>

                {remaining > availableCredit && (
                  <p className="mt-3 text-xs leading-5 text-[#B5473C]">
                    Sisa tagihan melebihi limit piutang pelanggan. Sesuaikan DP
                    atau periksa limit piutang pelanggan.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Ringkasan pembayaran */}
        <aside className="min-w-0 lg:sticky lg:top-4">
          <section className={`${panel} p-5`}>
            <h2 className="text-sm font-semibold">Ringkasan pembayaran</h2>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-[#77746B]">Subtotal</span>
                <span>{rupiah(subtotal)}</span>
              </div>

              {data.includeOngkir && (
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#77746B]">Ongkos kirim</span>
                  <span>{rupiah(ongkir)}</span>
                </div>
              )}

              {data.includeRakit && (
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#77746B]">Rakit & pemasangan</span>
                  <span>{rupiah(rakit)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-[#D9CEC2] pt-4">
                <p className="text-xs text-[#77746B]">Total transaksi</p>
                <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-[#5F402A]">
                  {rupiah(total)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg bg-[#F8F7F3] p-3">
                <span className="text-xs text-[#50453E]">
                  {paymentScheme === "lunas"
                    ? "Dibayar sekarang"
                    : paymentScheme === "dp"
                      ? "DP / pembayaran awal"
                      : "Pembayaran awal"}
                </span>
                <span className="text-sm font-semibold">{rupiah(paidNow)}</span>
              </div>

              {paymentScheme !== "lunas" && (
                <div className="flex items-center justify-between gap-3 px-1">
                  <span className="text-xs text-[#77746B]">Sisa tagihan</span>
                  <span className="text-sm font-semibold text-[#B5473C]">
                    {rupiah(remaining)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-[#E9E6DF] pt-3">
                <span className="text-xs text-[#77746B]">
                  Metode pembayaran
                </span>
                <span className="text-xs font-medium text-right">
                  {paymentMethodLabel[paymentMethod]}
                </span>
              </div>

              {paymentScheme !== "lunas" && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#77746B]">Jatuh tempo</span>
                  <span className="text-xs font-medium">
                    {dueDate
                      ? new Date(`${dueDate}T00:00:00`).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "Belum ditentukan"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleProcess}
                disabled={data.items.length === 0}
                className={`${primaryButton} w-full`}
              >
                <Icon className="text-lg">check_circle</Icon>
                Validasi transaksi
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className={`${secondaryButton} w-full`}
              >
                <Icon className="text-lg">chat</Icon>
                Kirim ringkasan WhatsApp
              </button>
            </div>

            <p className="mt-4 border-t border-[#E9E6DF] pt-3 text-xs leading-5 text-[#77746B]">
              Transaksi belum tersimpan secara permanen. Integrasi API
              diperlukan untuk menyimpan transaksi, mencatat pembayaran, dan
              memperbarui stok.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};
