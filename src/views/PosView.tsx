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

const rupiah = (value: number) =>
  `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const compactRupiah = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return rupiah(value);
};

const isPreOrder = (product: Product) =>
  (product.type ?? "").toLowerCase().includes("po");

const productMatchesCategory = (product: Product, filter: CategoryFilter) => {
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

const priceForTier = (product: Product, tier?: string) => {
  if (tier === "Grosir") return product.prices.grosir;
  if (tier === "Reseller") return product.prices.reseller;
  return product.prices.retail;
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

const panel = "rounded-xl border border-[#e5e2dd] bg-[#fcfaf7]";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2dd] bg-[#fcfaf7] px-3 py-2.5 text-xs font-medium text-[#50453e] transition hover:bg-[#f0ede9] disabled:cursor-not-allowed disabled:opacity-40";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#5f402a] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#795740] disabled:cursor-not-allowed disabled:opacity-40";

const field =
  "h-10 w-full rounded-lg border border-[#e5e2dd] bg-white px-3 text-sm text-[#30251e] outline-none focus:border-[#8a674c]";

const Icon: React.FC<{
  name: string;
  className?: string;
}> = ({ name, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

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

      return matchesSearch && productMatchesCategory(product, category);
    });
  }, [products, search, category]);

  const getUnitPrice = (item: PosCartItem) =>
    item.customPrice !== undefined
      ? item.customPrice
      : priceForTier(item.product, customer?.tier);

  const subtotal = items.reduce(
    (total, item) => total + getUnitPrice(item) * item.quantity,
    0,
  );
  const delivery = includeOngkir ? ONGKIR_COST : 0;
  const assembly = includeRakit ? RAKIT_COST : 0;
  const total = subtotal + delivery + assembly;
  const quantityTotal = items.reduce((sum, item) => sum + item.quantity, 0);

  const addProduct = (product: Product) => {
    const isPo = isPreOrder(product);
    const existing = items.find((item) => item.product.id === product.id);

    if (!isPo && product.stockPhysical <= 0) {
      onToast("Stok produk habis.");
      return;
    }

    if (existing && !isPo && existing.quantity >= product.stockPhysical) {
      onToast("Jumlah melebihi stok yang tersedia.");
      return;
    }

    setItems((current) => {
      const found = current.find((item) => item.product.id === product.id);

      return found
        ? current.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { product, quantity: 1 }];
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

  const clearCart = () => {
    if (items.length > 0 && !window.confirm("Kosongkan keranjang saat ini?")) {
      return;
    }

    setItems([]);
    setIncludeOngkir(false);
    setIncludeRakit(false);
    setInvoiceNumber(newInvoiceNumber());
    onToast("Keranjang telah dikosongkan.");
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
    { label: "Sofa & living", value: "sofa" },
    { label: "Meja & kursi", value: "meja" },
    { label: "Kamar tidur", value: "kamar" },
    { label: "Pre-order", value: "po" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 py-5 text-[#30251e]">
      <header className="flex flex-col justify-between gap-4 border-b border-[#e5e2dd] pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#82746d]">
            <span>Operasional</span>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-[#795740]">POS</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1c19]">
            Kasir
          </h1>
          <p className="mt-1 text-sm text-[#82746d]">
            Pilih produk dan susun pesanan pelanggan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("customers")}
          className={secondaryButton}
        >
          <Icon name="person_add" className="text-[17px]" />
          Kelola pelanggan
        </button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
        <section className="min-w-0">
          <div className={`${panel} mb-4 p-4`}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Katalog produk</h2>
                  <p className="mt-1 text-xs text-[#82746d]">
                    {filteredProducts.length} produk ditemukan
                  </p>
                </div>
                <span className="text-xs text-[#82746d]">
                  {products.length} produk
                </span>
              </div>

              <div className="flex h-11 items-center gap-2 rounded-lg border border-[#e5e2dd] bg-white px-3 focus-within:border-[#8a674c]">
                <Icon name="search" className="text-[19px] text-[#82746d]" />
                <input
                  id="pos-search-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, SKU, atau material..."
                  aria-label="Cari produk"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a69a8e]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Hapus pencarian"
                    className="text-[#82746d] hover:text-[#30251e]"
                  >
                    <Icon name="close" className="text-[18px]" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {filters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCategory(item.value)}
                    aria-pressed={category === item.value}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs transition ${
                      category === item.value
                        ? "bg-[#5f402a] font-semibold text-white"
                        : "border border-[#e5e2dd] text-[#62554b] hover:bg-[#f0ede9]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className={`${panel} px-5 py-14 text-center`}>
              <Icon name="search_off" className="text-3xl text-[#a69a8e]" />
              <p className="mt-2 text-sm font-semibold">
                Produk tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-[#82746d]">
                Ubah kata kunci atau pilih kategori lain.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="mt-3 text-xs font-semibold text-[#5f402a]"
              >
                Reset filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const po = isPreOrder(product);
                const outOfStock = !po && product.stockPhysical <= 0;
                const inCart = items.find(
                  (item) => item.product.id === product.id,
                );
                const price = priceForTier(product, customer?.tier);

                return (
                  <article
                    key={product.id}
                    className={`${panel} flex min-w-0 flex-col overflow-hidden transition hover:border-[#cfc1b3]`}
                  >
                    <div className="relative h-44 bg-[#f0ede9]">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#a69a8e]">
                          <Icon name="chair" className="text-4xl" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded bg-[#fcfaf7]/95 px-2 py-1 font-mono text-[10px]">
                        {product.sku}
                      </span>
                      <span
                        className={`absolute right-3 top-3 rounded px-2 py-1 text-[10px] font-medium ${
                          po
                            ? "bg-[#f6e7d1] text-[#805824]"
                            : outOfStock
                              ? "bg-[#f9eeeb] text-[#a3443f]"
                              : "bg-[#edf5ee] text-[#28734b]"
                        }`}
                      >
                        {po
                          ? "Pre-order"
                          : outOfStock
                            ? "Stok habis"
                            : `Stok ${product.stockPhysical}`}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">
                        {product.name}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-[#82746d]">
                        {product.woodType || "Material belum diisi"}
                        {product.dimensions ? ` · ${product.dimensions}` : ""}
                      </p>

                      <div className="mt-4">
                        <p className="text-[11px] text-[#82746d]">
                          Harga {customer?.tier ?? "Retail"}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-[#5f402a]">
                          {rupiah(price)}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#e5e2dd] pt-3">
                        {(
                          [
                            ["Retail", product.prices.retail],
                            ["Reseller", product.prices.reseller],
                            ["Grosir", product.prices.grosir],
                          ] as const
                        ).map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-[10px] text-[#82746d]">
                              {label}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-medium">
                              {compactRupiah(value)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e5e2dd] pt-3">
                        <div>
                          <p className="text-[10px] text-[#82746d]">HPP</p>
                          <p className="mt-1 text-xs font-medium">
                            {rupiah(product.hpp)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={() => addProduct(product)}
                          className={primaryButton}
                        >
                          <Icon name="add" className="text-[16px]" />
                          {inCart ? `Tambah (${inCart.quantity})` : "Tambah"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="min-w-0 xl:sticky xl:top-4">
          <div className={`${panel} overflow-hidden`}>
            <div className="border-b border-[#e5e2dd] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#82746d]">Pesanan berjalan</p>
                  <h2 className="mt-1 font-mono text-sm font-semibold">
                    {invoiceNumber}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={items.length === 0}
                  className="rounded-lg border border-[#e5e2dd] p-2 text-[#82746d] hover:bg-[#f0ede9] disabled:opacity-40"
                  aria-label="Kosongkan keranjang"
                >
                  <Icon name="delete_outline" className="text-[18px]" />
                </button>
              </div>
              <div className="mt-3 flex justify-between rounded-lg bg-[#f0ede9] px-3 py-2.5 text-xs">
                <span className="text-[#82746d]">Jumlah barang</span>
                <span className="font-semibold">
                  {quantityTotal} unit · {items.length} jenis
                </span>
              </div>
            </div>

            <div className="space-y-5 p-4">
              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Pelanggan</h3>
                  <button
                    type="button"
                    onClick={() => onNavigate("customers")}
                    className="text-xs font-semibold text-[#5f402a] hover:underline"
                  >
                    Kelola pelanggan
                  </button>
                </div>
                <select
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className={field}
                >
                  {!customers.length && (
                    <option value="">Belum ada pelanggan</option>
                  )}
                  {customers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.tier}
                    </option>
                  ))}
                </select>
                {customer && (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-[#e5e2dd] px-3 py-2.5">
                    <span className="text-xs text-[#82746d]">
                      Kategori harga
                    </span>
                    <span className="rounded bg-[#f0ede9] px-2 py-1 text-[11px] font-semibold text-[#5f402a]">
                      {customer.tier}
                    </span>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Keranjang</h3>
                  <span className="text-xs text-[#82746d]">
                    {items.length} jenis
                  </span>
                </div>

                {!items.length ? (
                  <div className="rounded-lg border border-dashed border-[#d9cec2] bg-[#f8f5f1] px-4 py-8 text-center">
                    <Icon
                      name="shopping_basket"
                      className="text-3xl text-[#a69a8e]"
                    />
                    <p className="mt-2 text-sm font-medium">
                      Keranjang masih kosong
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#82746d]">
                      Pilih produk dari katalog untuk memulai pesanan.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e5e2dd]">
                    {items.map((item) => {
                      const unitPrice = getUnitPrice(item);

                      return (
                        <div
                          key={item.product.id}
                          className="py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold leading-5">
                                {item.product.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#82746d]">
                                {item.product.sku}
                              </p>
                              <p className="mt-1 text-xs text-[#5f402a]">
                                {rupiah(unitPrice)} / unit
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setItems((current) =>
                                  current.filter(
                                    (entry) =>
                                      entry.product.id !== item.product.id,
                                  ),
                                )
                              }
                              aria-label={`Hapus ${item.product.name}`}
                              className="text-[#a69a8e] hover:text-[#a3443f]"
                            >
                              <Icon name="close" className="text-[17px]" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center rounded-lg border border-[#e5e2dd]">
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(item.product.id, -1)
                                }
                                className="flex h-8 w-8 items-center justify-center hover:bg-[#f0ede9]"
                                aria-label="Kurangi jumlah"
                              >
                                <Icon name="remove" className="text-[16px]" />
                              </button>
                              <span className="min-w-8 text-center text-xs font-semibold">
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
                                className="flex h-8 w-8 items-center justify-center hover:bg-[#f0ede9] disabled:opacity-30"
                                aria-label="Tambah jumlah"
                              >
                                <Icon name="add" className="text-[16px]" />
                              </button>
                            </div>
                            <span className="text-xs font-semibold">
                              {rupiah(unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-2 border-t border-[#e5e2dd] pt-4">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#e5e2dd] p-3 hover:bg-white">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Icon
                      name="local_shipping"
                      className="text-[19px] text-[#795740]"
                    />
                    Ongkos kirim
                  </span>
                  <span className="ml-auto text-xs text-[#82746d]">
                    {rupiah(ONGKIR_COST)}
                  </span>
                  <input
                    type="checkbox"
                    checked={includeOngkir}
                    onChange={(event) => setIncludeOngkir(event.target.checked)}
                    className="h-4 w-4 accent-[#5f402a]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#e5e2dd] p-3 hover:bg-white">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Icon
                      name="handyman"
                      className="text-[19px] text-[#795740]"
                    />
                    Rakit & pemasangan
                  </span>
                  <span className="ml-auto text-xs text-[#82746d]">
                    {rupiah(RAKIT_COST)}
                  </span>
                  <input
                    type="checkbox"
                    checked={includeRakit}
                    onChange={(event) => setIncludeRakit(event.target.checked)}
                    className="h-4 w-4 accent-[#5f402a]"
                  />
                </label>
              </section>

              <section className="border-t border-[#e5e2dd] pt-4">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Subtotal produk</span>
                  <span className="font-medium">{rupiah(subtotal)}</span>
                </div>
                {(includeOngkir || includeRakit) && (
                  <div className="mt-2 flex justify-between gap-3 text-xs">
                    <span className="text-[#82746d]">Layanan tambahan</span>
                    <span>{rupiah(delivery + assembly)}</span>
                  </div>
                )}
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-[#d9cec2] pt-3">
                  <span className="text-sm font-semibold">Total sementara</span>
                  <span className="text-xl font-semibold tracking-tight text-[#5f402a]">
                    {rupiah(total)}
                  </span>
                </div>
              </section>

              <button
                type="button"
                onClick={proceedToCheckout}
                disabled={!customer || items.length === 0}
                className={`${primaryButton} h-11 w-full text-sm`}
              >
                Lanjut ke checkout
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
              <p className="text-center text-[10px] leading-4 text-[#a69a8e]">
                Pembayaran dan jatuh tempo diatur pada halaman checkout.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
