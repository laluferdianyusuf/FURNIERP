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

const rupiah = (value: number) =>
  `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const panel = "rounded-xl border border-[#e5e2dd] bg-[#fcfaf7]";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#5f402a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#795740] disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2dd] bg-[#fcfaf7] px-4 py-3 text-sm font-medium text-[#50453e] transition hover:bg-[#f0ede9]";

const field =
  "h-11 w-full rounded-lg border border-[#e5e2dd] bg-white px-3 text-sm text-[#30251e] outline-none focus:border-[#8a674c]";

const Icon: React.FC<{ children: string; className?: string }> = ({
  children,
  className = "",
}) => (
  <span className={`material-symbols-outlined ${className}`}>{children}</span>
);

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

  const subtotal = data.items.reduce((total, item) => {
    const price =
      item.customPrice !== undefined
        ? item.customPrice
        : customer?.tier === "Grosir"
          ? item.product.prices.grosir
          : customer?.tier === "Reseller"
            ? item.product.prices.reseller
            : item.product.prices.retail;

    return total + price * item.quantity;
  }, 0);

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

  const paymentMethodLabel = {
    bca: "Transfer BCA",
    qris: "QRIS",
    cash: "Tunai",
  }[paymentMethod];

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
      `Metode pembayaran: ${paymentMethodLabel}`,
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
      <div className="mx-auto max-w-3xl py-8 text-[#30251e]">
        <div className={`${panel} p-6`}>
          <h1 className="text-lg font-semibold">Pelanggan tidak ditemukan</h1>
          <p className="mt-2 text-sm text-[#82746d]">
            Data pelanggan mungkin telah berubah. Kembali ke POS untuk memilih
            pelanggan lagi.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className={`${secondaryButton} mt-5`}
          >
            <Icon className="text-[18px]">arrow_back</Icon>
            Kembali ke POS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 py-5 text-[#30251e]">
      <header className="flex flex-col justify-between gap-4 border-b border-[#e5e2dd] pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#82746d]">
            <span>Penjualan</span>
            <span>/</span>
            <button
              type="button"
              onClick={handleBack}
              className="hover:text-[#5f402a]"
            >
              POS
            </button>
            <span>/</span>
            <span className="font-medium text-[#5f402a]">Checkout</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1c19]">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-[#82746d]">
            Periksa pesanan dan tentukan pembayaran sebelum memproses transaksi.
          </p>
        </div>

        <button type="button" onClick={handleBack} className={secondaryButton}>
          <Icon className="text-[18px]">arrow_back</Icon>
          Kembali ke POS
        </button>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className={`${panel} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#82746d]">Nomor transaksi</p>
                <h2 className="mt-1 font-mono text-base font-semibold">
                  {data.invoiceNumber}
                </h2>
              </div>
              <span className="rounded-md bg-[#f0ede9] px-2.5 py-1.5 text-xs font-medium text-[#62554b]">
                {data.items.length} jenis produk
              </span>
            </div>

            <div className="mt-5 grid gap-4 border-t border-[#e5e2dd] pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#82746d]">Pelanggan</p>
                <p className="mt-1 text-sm font-semibold">{customer.name}</p>
                <p className="mt-1 text-xs text-[#82746d]">
                  {customer.phone || "Nomor telepon belum diisi"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#82746d]">Kategori harga</p>
                <p className="mt-1 text-sm font-semibold">{customer.tier}</p>
                <p className="mt-1 text-xs text-[#82746d]">
                  Limit piutang tersedia: {rupiah(availableCredit)}
                </p>
              </div>
            </div>
          </section>

          <section className={`${panel} overflow-hidden`}>
            <div className="border-b border-[#e5e2dd] p-5">
              <h2 className="text-sm font-semibold">Rincian pesanan</h2>
              <p className="mt-1 text-xs text-[#82746d]">
                Pastikan jumlah dan harga setiap produk sudah benar.
              </p>
            </div>

            <div className="divide-y divide-[#e5e2dd] px-5">
              {data.items.map((item) => {
                const unitPrice =
                  item.customPrice !== undefined
                    ? item.customPrice
                    : customer.tier === "Grosir"
                      ? item.product.prices.grosir
                      : customer.tier === "Reseller"
                        ? item.product.prices.reseller
                        : item.product.prices.retail;

                return (
                  <div
                    key={item.product.id}
                    className="flex items-start gap-3 py-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f0ede9]">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon className="text-xl text-[#a69a8e]">chair</Icon>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="mt-1 text-xs text-[#82746d]">
                        {item.product.sku} · {item.quantity} unit
                      </p>
                      <p className="mt-1 text-xs text-[#82746d]">
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

            <div className="space-y-3 border-t border-[#e5e2dd] bg-[#f8f5f1] p-5">
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#82746d]">Subtotal produk</span>
                <span className="font-medium">{rupiah(subtotal)}</span>
              </div>
              {data.includeOngkir && (
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Ongkos kirim</span>
                  <span>{rupiah(ongkir)}</span>
                </div>
              )}
              {data.includeRakit && (
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Rakit & pemasangan</span>
                  <span>{rupiah(rakit)}</span>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-[#e5e2dd] pt-3">
                <span className="text-sm font-semibold">Total transaksi</span>
                <span className="text-lg font-semibold text-[#5f402a]">
                  {rupiah(total)}
                </span>
              </div>
            </div>
          </section>

          <section className={`${panel} p-5`}>
            <h2 className="text-sm font-semibold">Skema pembayaran</h2>
            <p className="mt-1 text-xs text-[#82746d]">
              Pilih cara pembayaran sesuai kesepakatan dengan pelanggan.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["lunas", "Lunas", "Pembayaran penuh"],
                  ["dp", "DP / Termin", "Bayar sebagian"],
                  ["kredit", "Kredit", "Bayar kemudian"],
                ] as const
              ).map(([value, label, detail]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentScheme(value)}
                  aria-pressed={paymentScheme === value}
                  className={`rounded-lg border p-3 text-left transition ${
                    paymentScheme === value
                      ? "border-[#8a674c] bg-[#f0ede9]"
                      : "border-[#e5e2dd] hover:bg-white"
                  }`}
                >
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs text-[#82746d]">
                    {detail}
                  </span>
                </button>
              ))}
            </div>

            {paymentScheme === "dp" && (
              <div className="mt-4 rounded-lg border border-[#e5e2dd] p-4">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="checkout-dp" className="text-xs font-medium">
                    Nominal DP
                  </label>
                  <span className="text-xs text-[#82746d]">
                    {dpPercentage.toFixed(1)}% dari total
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-[#82746d]">Rp</span>
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
                      className="rounded-lg border border-[#e5e2dd] px-3 py-2 text-xs text-[#5f402a] hover:bg-[#f0ede9]"
                    >
                      {percentage}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium">Metode pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["bca", "Transfer BCA", "account_balance"],
                    ["qris", "QRIS", "qr_code_2"],
                    ["cash", "Tunai", "payments"],
                  ] as const
                ).map(([value, label, icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    aria-pressed={paymentMethod === value}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition ${
                      paymentMethod === value
                        ? "border-[#8a674c] bg-[#f0ede9] text-[#5f402a]"
                        : "border-[#e5e2dd] text-[#62554b] hover:bg-white"
                    }`}
                  >
                    <Icon className="text-xl">{icon}</Icon>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentScheme !== "lunas" && (
              <div className="mt-5 rounded-lg bg-[#f0ede9] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#62554b]">Sisa tagihan</span>
                  <span className="text-sm font-semibold text-[#a3443f]">
                    {rupiah(remaining)}
                  </span>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="checkout-due-date"
                    className="mb-2 block text-xs font-medium"
                  >
                    Tanggal jatuh tempo
                  </label>
                  <input
                    id="checkout-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className={field}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#62554b]">Limit piutang tersedia</span>
                  <span className="font-medium">{rupiah(availableCredit)}</span>
                </div>

                {remaining > availableCredit && (
                  <p className="mt-3 text-xs leading-5 text-[#a3443f]">
                    Sisa tagihan melebihi limit piutang pelanggan. Sesuaikan DP
                    atau periksa data limit pelanggan.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-4">
          <section className={`${panel} p-5`}>
            <h2 className="text-sm font-semibold">Ringkasan pembayaran</h2>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-[#82746d]">Subtotal</span>
                <span>{rupiah(subtotal)}</span>
              </div>
              {data.includeOngkir && (
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Ongkos kirim</span>
                  <span>{rupiah(ongkir)}</span>
                </div>
              )}
              {data.includeRakit && (
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Rakit & pemasangan</span>
                  <span>{rupiah(rakit)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-[#d9cec2] pt-4">
                <p className="text-xs text-[#82746d]">Total transaksi</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-[#5f402a]">
                  {rupiah(total)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f0ede9] p-3">
                <span className="text-xs text-[#62554b]">
                  {paymentScheme === "lunas"
                    ? "Dibayar sekarang"
                    : paymentScheme === "dp"
                      ? "DP / pembayaran awal"
                      : "Pembayaran awal"}
                </span>
                <span className="text-xs font-semibold">{rupiah(paidNow)}</span>
              </div>

              {paymentScheme !== "lunas" && (
                <div className="flex items-center justify-between gap-3 px-1">
                  <span className="text-xs text-[#82746d]">Sisa tagihan</span>
                  <span className="text-xs font-semibold text-[#a3443f]">
                    {rupiah(remaining)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-[#e5e2dd] pt-3 text-xs">
                <span className="text-[#82746d]">Metode pembayaran</span>
                <span className="font-medium">{paymentMethodLabel}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleProcess}
                className={`${primaryButton} w-full`}
              >
                <Icon className="text-[18px]">check_circle</Icon>
                Validasi transaksi
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className={`${secondaryButton} w-full`}
              >
                <Icon className="text-[18px]">chat</Icon>
                Kirim ringkasan via WhatsApp
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] leading-4 text-[#a69a8e]">
              Validasi saat ini belum menyimpan transaksi secara permanen.
              Integrasi API diperlukan untuk penyimpanan dan pembaruan stok.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};
