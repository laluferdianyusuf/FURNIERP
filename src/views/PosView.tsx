import React, { useEffect, useMemo, useState } from "react";
import { Customer, PageView, Product } from "../types";

export interface PosCartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  discountNote?: string;
  originalPrice?: number;
}

export interface PosCheckoutData {
  customerId: string;
  items: PosCartItem[];
  includeOngkir: boolean;
  includeRakit: boolean;
  invoiceNumber: string;
}

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  onNavigate: (page: PageView) => void;
  onToast: (msg: string) => void;
  onCheckout: (data: PosCheckoutData) => void;
  initialData?: PosCheckoutData | null;
}

type CategoryFilter = "all" | "sofa" | "meja" | "kamar" | "po";

const ONGKIR_COST = 250000;
const RAKIT_COST = 150000;

const C = {
  ink: "#292720",
  muted: "#77746B",
  line: "#E9E6DF",
  surface: "#FFFFFF",
  canvas: "#F8F7F3",
  brown: "#795740",
  brownDark: "#5F402A",
  softBrown: "#F1EAE3",
  green: "#287653",
  greenBg: "#EAF4ED",
  red: "#B5473C",
  redBg: "#FBEDEA",
};

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const compactMoney = (value: number) => {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000).toLocaleString("id-ID")} rb`;
  }

  return money(value);
};

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

const isPreOrder = (product: Product) =>
  (product.type ?? "").toLowerCase().includes("po");

const priceForTier = (product: Product, tier?: string) => {
  if (tier === "Grosir") return product.prices.grosir;
  if (tier === "Reseller") return product.prices.reseller;
  return product.prices.retail;
};

const matchesCategory = (product: Product, filter: CategoryFilter) => {
  const category = (product.category ?? "").toLowerCase();

  switch (filter) {
    case "sofa":
      return category.includes("sofa");
    case "meja":
      return category.includes("meja") || category.includes("kursi");
    case "kamar":
      return category.includes("kamar");
    case "po":
      return isPreOrder(product);
    default:
      return true;
  }
};

const newInvoiceNumber = () => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `INV-${date}-${String(now.getTime()).slice(-4)}`;
};

const panel = "rounded-xl border border-[#E9E6DF] bg-white";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButton = `${buttonBase} border border-[#E9E6DF] bg-white text-[#292720] hover:bg-[#F8F7F3]`;

const primaryButton = `${buttonBase} bg-[#795740] text-white hover:bg-[#5F402A]`;

const inputClass =
  "h-10 w-full rounded-lg border border-[#E9E6DF] bg-white px-3 text-sm text-[#292720] outline-none transition-colors placeholder:text-[#A19A90] focus:border-[#795740] focus:ring-1 focus:ring-[#795740]";

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

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  onNavigate,
  onToast,
  onCheckout,
  initialData,
}) => {
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? "");

  const [items, setItems] = useState<PosCartItem[]>(initialData?.items ?? []);

  const [includeOngkir, setIncludeOngkir] = useState(
    initialData?.includeOngkir ?? false,
  );

  const [includeRakit, setIncludeRakit] = useState(
    initialData?.includeRakit ?? false,
  );

  const [invoiceNumber, setInvoiceNumber] = useState(
    initialData?.invoiceNumber ?? newInvoiceNumber(),
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const customer = useMemo(
    () => customers.find((item) => item.id === customerId),
    [customers, customerId],
  );

  useEffect(() => {
    if (!customers.length) {
      setCustomerId("");
      return;
    }

    if (!customers.some((item) => item.id === customerId)) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        (product.name ?? "").toLowerCase().includes(query) ||
        (product.sku ?? "").toLowerCase().includes(query) ||
        (product.woodType ?? "").toLowerCase().includes(query);

      return matchesSearch && matchesCategory(product, category);
    });
  }, [products, search, category]);

  const getUnitPrice = (item: PosCartItem) =>
    item.customPrice !== undefined
      ? item.customPrice
      : priceForTier(item.product, customer?.tier);

  const subtotal = items.reduce(
    (sum, item) => sum + getUnitPrice(item) * item.quantity,
    0,
  );

  const additionalCost =
    (includeOngkir ? ONGKIR_COST : 0) + (includeRakit ? RAKIT_COST : 0);

  const total = subtotal + additionalCost;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const addProduct = (product: Product) => {
    const preOrder = isPreOrder(product);
    const existing = items.find((item) => item.product.id === product.id);

    if (!preOrder && product.stockPhysical <= 0) {
      onToast("Stok produk habis.");
      return;
    }

    if (existing && !preOrder && existing.quantity >= product.stockPhysical) {
      onToast("Jumlah melebihi stok yang tersedia.");
      return;
    }

    setItems((current) => {
      const found = current.find((item) => item.product.id === product.id);

      if (found) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setItems((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) return item;

          const next = item.quantity + delta;

          if (next <= 0) return null;

          if (
            delta > 0 &&
            !isPreOrder(item.product) &&
            next > item.product.stockPhysical
          ) {
            onToast("Jumlah melebihi stok yang tersedia.");
            return item;
          }

          return { ...item, quantity: next };
        })
        .filter((item): item is PosCartItem => item !== null),
    );
  };

  const removeProduct = (productId: string) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  };

  const clearCart = () => {
    if (!items.length) return;

    if (!window.confirm("Kosongkan semua barang dari keranjang?")) {
      return;
    }

    setItems([]);
    setIncludeOngkir(false);
    setIncludeRakit(false);
    setInvoiceNumber(newInvoiceNumber());

    onToast("Keranjang dikosongkan.");
  };

  const proceedToCheckout = () => {
    if (!customer) {
      onToast("Pilih pelanggan terlebih dahulu.");
      return;
    }

    if (!items.length) {
      onToast("Tambahkan produk ke keranjang terlebih dahulu.");
      return;
    }

    onCheckout({
      customerId: customer.id,
      items,
      includeOngkir,
      includeRakit,
      invoiceNumber,
    });
  };

  const filters: { label: string; value: CategoryFilter }[] = [
    { label: "Semua", value: "all" },
    { label: "Sofa", value: "sofa" },
    { label: "Meja & kursi", value: "meja" },
    { label: "Kamar tidur", value: "kamar" },
    { label: "Pre-order", value: "po" },
  ];

  return (
    <div className="flex w-full flex-col gap-4 text-[#292720]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 text-sm font-medium">Pelanggan</span>
          <select
            id="pos-customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className={inputClass}
          >
            {!customers.length && (
              <option value="">Belum ada pelanggan</option>
            )}

            {customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.tier}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onNavigate("customers")}
          className={secondaryButton}
        >
          <Icon name="person_add" className="text-base" />
          Tambah pelanggan
        </button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className={`${panel} p-4`}>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[#E9E6DF] bg-white px-3 focus-within:border-[#795740]">
              <Icon name="search" className="text-lg text-[#77746B]" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari produk atau SKU"
                aria-label="Cari produk"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#A19A90]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                  className="text-[#77746B] hover:text-[#292720]"
                >
                  <Icon name="close" className="text-lg" />
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setCategory(filter.value)}
                  aria-pressed={category === filter.value}
                  className={cx(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    category === filter.value
                      ? "bg-[#795740] text-white"
                      : "border border-[#E9E6DF] bg-white text-[#625E54] hover:bg-[#F8F7F3]",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            {filteredProducts.length === 0 ? (
              <div className={`${panel} px-5 py-12 text-center`}>
                <Icon name="search_off" className="text-3xl text-[#A19A90]" />

                <p className="mt-3 text-sm font-semibold">
                  Produk tidak ditemukan
                </p>

                <p className="mt-1 text-xs text-[#77746B]">
                  Coba kata kunci atau kategori lain.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                  className="mt-3 text-xs font-medium text-[#795740]"
                >
                  Reset pencarian
                </button>
              </div>
            ) : (
              <div className={`${panel} overflow-hidden`}>
                {/* Header list desktop */}
                <div className="hidden grid-cols-[minmax(0,1fr)_100px_150px_135px] items-center gap-4 border-b border-[#E9E6DF] bg-[#F8F7F3] px-4 py-3 text-[11px] font-medium text-[#77746B] md:grid">
                  <span>Produk</span>
                  <span className="text-center">Stok</span>
                  <span className="text-right">
                    Harga {customer?.tier ?? "Retail"}
                  </span>
                  <span className="text-right">Aksi</span>
                </div>

                <div className="divide-y divide-[#F0EEE8]">
                  {filteredProducts.map((product) => {
                    const preOrder = isPreOrder(product);
                    const outOfStock = !preOrder && product.stockPhysical <= 0;

                    const inCart = items.find(
                      (item) => item.product.id === product.id,
                    );

                    const price = priceForTier(product, customer?.tier);

                    return (
                      <article
                        key={product.id}
                        className={cx(
                          "grid grid-cols-1 gap-3 px-3 py-3 transition-colors hover:bg-[#FCFBF9] sm:px-4",
                          "md:grid-cols-[minmax(0,1fr)_100px_150px_135px] md:items-center md:gap-4",
                        )}
                      >
                        {/* Informasi produk */}
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E9E6DF] bg-[#F0EEE8] sm:h-16 sm:w-16">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#A19A90]">
                                <Icon name="chair" className="text-2xl" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium text-[#292720]">
                              {product.name}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#77746B]">
                              <span>{product.sku || "Tanpa SKU"}</span>

                              {(product.woodType || product.category) && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {product.woodType || product.category}
                                  </span>
                                </>
                              )}

                              {product.dimensions && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{product.dimensions}</span>
                                </>
                              )}
                            </div>

                            {/* Harga dan stok pada tampilan mobile */}
                            <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                              <span className="text-sm font-semibold text-[#5F402A]">
                                {money(price)}
                              </span>

                              <span
                                className={cx(
                                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                  preOrder
                                    ? "bg-[#F8F0DF] text-[#936B2E]"
                                    : outOfStock
                                      ? "bg-[#FBEDEA] text-[#B5473C]"
                                      : "bg-[#EAF4ED] text-[#287653]",
                                )}
                              >
                                {preOrder
                                  ? "Pre-order"
                                  : outOfStock
                                    ? "Stok habis"
                                    : `Stok ${product.stockPhysical}`}
                              </span>

                              {inCart && (
                                <span className="rounded bg-[#F1EAE3] px-1.5 py-0.5 text-[10px] font-medium text-[#795740]">
                                  {inCart.quantity} di keranjang
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stok desktop */}
                        <div className="hidden justify-center md:flex">
                          <span
                            className={cx(
                              "rounded-md px-2 py-1 text-[11px] font-medium",
                              preOrder
                                ? "bg-[#F8F0DF] text-[#936B2E]"
                                : outOfStock
                                  ? "bg-[#FBEDEA] text-[#B5473C]"
                                  : "bg-[#EAF4ED] text-[#287653]",
                            )}
                          >
                            {preOrder
                              ? "Pre-order"
                              : outOfStock
                                ? "Habis"
                                : product.stockPhysical}
                          </span>
                        </div>

                        {/* Harga desktop */}
                        <div className="hidden text-right md:block">
                          <p className="text-sm font-semibold tabular-nums text-[#5F402A]">
                            {money(price)}
                          </p>

                          {inCart && (
                            <p className="mt-1 text-[10px] text-[#77746B]">
                              {inCart.quantity} unit di keranjang
                            </p>
                          )}
                        </div>

                        {/* Tombol keranjang */}
                        <div className="flex items-center justify-between gap-3 md:justify-end">
                          <div className="min-w-0 md:hidden">
                            <p className="text-[11px] text-[#77746B]">
                              {customer
                                ? `Harga ${customer.tier}`
                                : "Harga Retail"}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => addProduct(product)}
                            className={cx(
                              buttonBase,
                              "min-w-[120px] shrink-0",
                              inCart
                                ? "border border-[#D9C8B8] bg-[#F1EAE3] text-[#5F402A] hover:bg-[#E9DED3]"
                                : "bg-[#795740] text-white hover:bg-[#5F402A]",
                            )}
                          >
                            <Icon
                              name={inCart ? "add" : "add_shopping_cart"}
                              className="text-base"
                            />

                            {inCart
                              ? `Tambah (${inCart.quantity})`
                              : "Ke keranjang"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

              </div>
            )}
          </div>
        </section>

        {/* Keranjang pesanan */}
        <aside className="min-w-0 xl:sticky xl:top-20">
          <section className={`${panel} overflow-hidden`}>
            {/* Header keranjang */}
            <div className="border-b border-[#E9E6DF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Keranjang</h2>
                  <p className="mt-1 text-xs text-[#77746B]">{invoiceNumber}</p>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={!items.length}
                  aria-label="Kosongkan keranjang"
                  className="rounded-lg border border-[#E9E6DF] p-2 text-[#77746B] transition-colors hover:bg-[#F8F7F3] hover:text-[#B5473C] disabled:opacity-40"
                >
                  <Icon name="delete_outline" className="text-lg" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F8F7F3] px-3 py-2.5 text-xs">
                <span className="text-[#77746B]">Jumlah barang</span>
                <span className="font-semibold">{totalQuantity} unit</span>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {customer && (
                <p className="text-xs text-[#77746B]">
                  Harga memakai kategori {customer.tier}
                </p>
              )}

              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold">Daftar barang</h3>

                  <span className="text-xs text-[#77746B]">
                    {items.length} jenis
                  </span>
                </div>

                {!items.length ? (
                  <div className="rounded-lg border border-dashed border-[#D9D3CA] bg-[#F8F7F3] px-3 py-7 text-center">
                    <Icon
                      name="shopping_basket"
                      className="text-3xl text-[#A19A90]"
                    />

                    <p className="mt-2 text-xs font-medium">
                      Keranjang masih kosong
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#77746B]">
                      Tekan tombol “Ke keranjang” pada produk yang ingin dijual.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const unitPrice = getUnitPrice(item);

                      return (
                        <div
                          key={item.product.id}
                          className="border-b border-[#F0EEE8] pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium leading-5">
                                {item.product.name}
                              </p>

                              <p className="mt-1 text-xs text-[#77746B]">
                                {money(unitPrice)} / unit
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeProduct(item.product.id)}
                              aria-label={`Hapus ${item.product.name}`}
                              className="shrink-0 rounded p-1 text-[#A19A90] hover:bg-[#FBEDEA] hover:text-[#B5473C]"
                            >
                              <Icon name="close" className="text-base" />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="flex h-8 items-center rounded-lg border border-[#E9E6DF]">
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(item.product.id, -1)
                                }
                                aria-label="Kurangi jumlah"
                                className="flex h-7 w-7 items-center justify-center rounded-l-lg hover:bg-[#F8F7F3]"
                              >
                                <Icon name="remove" className="text-base" />
                              </button>

                              <span className="min-w-7 text-center text-xs font-semibold tabular-nums">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                disabled={
                                  !isPreOrder(item.product) &&
                                  item.quantity >= item.product.stockPhysical
                                }
                                onClick={() =>
                                  changeQuantity(item.product.id, 1)
                                }
                                aria-label="Tambah jumlah"
                                className="flex h-7 w-7 items-center justify-center rounded-r-lg hover:bg-[#F8F7F3] disabled:opacity-30"
                              >
                                <Icon name="add" className="text-base" />
                              </button>
                            </div>

                            <p className="text-xs font-semibold tabular-nums">
                              {money(unitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="border-t border-[#E9E6DF]" />

              {/* Layanan tambahan */}
              <section className="space-y-2.5">
                <p className="text-xs font-semibold">Layanan tambahan</p>

                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={includeOngkir}
                    onChange={(event) => setIncludeOngkir(event.target.checked)}
                    className="h-4 w-4 accent-[#795740]"
                  />

                  <span className="flex-1 text-xs">Ongkos kirim</span>

                  <span className="text-xs tabular-nums text-[#77746B]">
                    {compactMoney(ONGKIR_COST)}
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={includeRakit}
                    onChange={(event) => setIncludeRakit(event.target.checked)}
                    className="h-4 w-4 accent-[#795740]"
                  />

                  <span className="flex-1 text-xs">Rakit & pemasangan</span>

                  <span className="text-xs tabular-nums text-[#77746B]">
                    {compactMoney(RAKIT_COST)}
                  </span>
                </label>
              </section>

              <div className="border-t border-[#E9E6DF]" />

              {/* Total */}
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#77746B]">Subtotal</span>

                  <span className="font-medium tabular-nums">
                    {money(subtotal)}
                  </span>
                </div>

                {additionalCost > 0 && (
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#77746B]">Layanan tambahan</span>

                    <span className="font-medium tabular-nums">
                      {money(additionalCost)}
                    </span>
                  </div>
                )}

                <div className="flex items-end justify-between gap-3 border-t border-[#E9E6DF] pt-3">
                  <span className="text-sm font-semibold">Total</span>

                  <span className="text-lg font-semibold tracking-[-0.03em] text-[#5F402A] tabular-nums">
                    {money(total)}
                  </span>
                </div>
              </section>

              <button
                type="button"
                onClick={proceedToCheckout}
                disabled={!customer || items.length === 0}
                className={`${primaryButton} h-11 w-full text-sm`}
              >
                Lanjut checkout
                <Icon name="arrow_forward" className="text-base" />
              </button>

            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default PosView;
