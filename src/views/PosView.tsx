import React, { useEffect, useMemo, useState } from "react";
import { Customer, PageView, Product } from "../types";

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  onNavigate: (page: PageView) => void;
  onToast: (msg: string) => void;
}

interface CartItemEntry {
  product: Product;
  quantity: number;
  customPrice?: number;
  discountNote?: string;
  originalPrice?: number;
}

type PaymentScheme = "lunas" | "dp" | "kredit";
type PaymentMethod = "bca" | "qris" | "cash";
type CategoryFilter = "all" | "sofa" | "meja" | "kamar" | "po";

const ONGKIR_COST = 250000;
const RAKIT_COST = 150000;

const formatRupiah = (value: number) =>
  `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const formatCompactRupiah = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} rb`;
  }

  return formatRupiah(value);
};

const isPreOrder = (product: Product) =>
  (product.type ?? "").toLowerCase().includes("po");

const getCategoryMatch = (product: Product, filter: CategoryFilter) => {
  const category = (product.category ?? "").toLowerCase();

  switch (filter) {
    case "all":
      return true;
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

const getPriceForTier = (product: Product, tier?: string) => {
  if (tier === "Grosir") return product.prices.grosir;
  if (tier === "Reseller") return product.prices.reseller;
  return product.prices.retail;
};

const getInitialInvoiceNumber = () => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  return `INV-${date}-${String(now.getTime()).slice(-4)}`;
};

const panelClass = "rounded-xl border border-[#e5e2dd] bg-[#fcfaf7]";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2dd] bg-[#fcfaf7] px-3 py-2.5 text-xs font-medium text-[#50453e] transition-colors hover:bg-[#f0ede9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a674c] disabled:cursor-not-allowed disabled:opacity-45";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#5f402a] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#795740] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a674c] disabled:cursor-not-allowed disabled:opacity-45";

const fieldClass =
  "h-10 w-full rounded-lg border border-[#e5e2dd] bg-[#fcfaf7] px-3 text-sm text-[#30251e] outline-none transition-colors focus:border-[#8a674c] focus:bg-white";

const SectionHeading: React.FC<{
  title: string;
  detail?: string;
  action?: React.ReactNode;
}> = ({ title, detail, action }) => (
  <div className="mb-3 flex items-start justify-between gap-3">
    <div>
      <h3 className="text-sm font-semibold text-[#30251e]">{title}</h3>
      {detail && (
        <p className="mt-1 text-xs leading-5 text-[#82746d]">{detail}</p>
      )}
    </div>
    {action}
  </div>
);

const EmptyCart: React.FC = () => (
  <div className="rounded-lg border border-dashed border-[#d9cec2] bg-[#f8f5f1] px-4 py-8 text-center">
    <span className="material-symbols-outlined text-3xl text-[#a69a8e]">
      shopping_basket
    </span>
    <p className="mt-2 text-sm font-medium text-[#50453e]">
      Keranjang masih kosong
    </p>
    <p className="mx-auto mt-1 max-w-[220px] text-xs leading-5 text-[#82746d]">
      Pilih produk dari katalog untuk memulai transaksi.
    </p>
  </div>
);

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  onNavigate,
  onToast,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentScheme, setPaymentScheme] = useState<PaymentScheme>("dp");
  const [dpAmount, setDpAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bca");
  const [includeOngkir, setIncludeOngkir] = useState(true);
  const [includeRakit, setIncludeRakit] = useState(true);
  const [cartItems, setCartItems] = useState<CartItemEntry[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(getInitialInvoiceNumber);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  useEffect(() => {
    if (customers.length === 0) {
      if (selectedCustomerId) setSelectedCustomerId("");
      return;
    }

    const selectedStillExists = customers.some(
      (customer) => customer.id === selectedCustomerId,
    );

    if (!selectedStillExists) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("pos-search-input")?.focus();
      }

      if (event.key === "Escape") {
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getPriceForProduct = (product: Product) =>
    getPriceForTier(product, selectedCustomer?.tier);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = getCategoryMatch(product, categoryFilter);
      const matchesSearch =
        !query ||
        (product.name ?? "").toLowerCase().includes(query) ||
        (product.sku ?? "").toLowerCase().includes(query) ||
        (product.woodType ?? "").toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, categoryFilter, searchQuery]);

  const subtotalProducts = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const unitPrice =
          item.customPrice !== undefined
            ? item.customPrice
            : getPriceForTier(item.product, selectedCustomer?.tier);

        return total + unitPrice * item.quantity;
      }, 0),
    [cartItems, selectedCustomer],
  );

  const ongkirCost = includeOngkir ? ONGKIR_COST : 0;
  const rakitCost = includeRakit ? RAKIT_COST : 0;
  const logisticsTotal = ongkirCost + rakitCost;
  const grandTotal = subtotalProducts + logisticsTotal;

  const effectiveDp =
    paymentScheme === "lunas"
      ? grandTotal
      : paymentScheme === "kredit"
        ? 0
        : Math.min(Math.max(0, dpAmount), grandTotal);

  const remainingDebt = Math.max(0, grandTotal - effectiveDp);
  const dpPercent = grandTotal > 0 ? (effectiveDp / grandTotal) * 100 : 0;

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const availableCredit = selectedCustomer
    ? Math.max(0, selectedCustomer.creditLimit - selectedCustomer.creditUsed)
    : 0;

  const handleAddToCart = (product: Product) => {
    if (!isPreOrder(product) && product.stockPhysical <= 0) {
      onToast("Stok produk habis. Produk tidak dapat ditambahkan.");
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        if (
          !isPreOrder(product) &&
          existingItem.quantity >= product.stockPhysical
        ) {
          onToast("Jumlah melebihi stok yang tersedia.");
          return currentItems;
        }

        return currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.product.id !== productId) return item;

          const nextQuantity = item.quantity + delta;

          if (nextQuantity <= 0) return null;

          if (
            delta > 0 &&
            !isPreOrder(item.product) &&
            nextQuantity > item.product.stockPhysical
          ) {
            onToast("Jumlah melebihi stok yang tersedia.");
            return item;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter((item): item is CartItemEntry => item !== null),
    );
  };

  const removeCartItem = (productId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId),
    );
  };

  const resetCart = () => {
    setCartItems([]);
    setIncludeOngkir(false);
    setIncludeRakit(false);
    setPaymentScheme("dp");
    setDpAmount(0);
    setPaymentMethod("bca");
    setDueDate("");
    setInvoiceNumber(getInitialInvoiceNumber());
  };

  const handleNewTransaction = () => {
    if (cartItems.length > 0) {
      const confirmed = window.confirm(
        "Mulai transaksi baru? Item pada keranjang saat ini akan dihapus.",
      );

      if (!confirmed) return;
    }

    resetCart();
    onToast("Transaksi baru siap dimulai.");
  };

  const handleCheckout = () => {
    if (!selectedCustomer) {
      onToast("Pilih pelanggan terlebih dahulu.");
      return;
    }

    if (cartItems.length === 0) {
      onToast("Tambahkan minimal satu produk ke keranjang.");
      return;
    }

    if (
      paymentScheme === "dp" &&
      (dpAmount <= 0 || !Number.isFinite(dpAmount))
    ) {
      onToast("Masukkan nominal DP yang valid.");
      return;
    }

    if (paymentScheme === "dp" && dpAmount > grandTotal) {
      onToast("Nominal DP tidak boleh melebihi total transaksi.");
      return;
    }

    if (paymentScheme !== "lunas" && remainingDebt > availableCredit) {
      onToast("Sisa tagihan melebihi limit piutang pelanggan.");
      return;
    }

    if (paymentScheme !== "lunas" && !dueDate) {
      onToast("Tentukan tanggal jatuh tempo untuk sisa tagihan.");
      return;
    }

    onToast(
      "Validasi berhasil. Transaksi belum disimpan karena API belum terhubung.",
    );
  };

  const handleSaveDraft = () => {
    if (cartItems.length === 0) {
      onToast("Keranjang kosong. Tidak ada draft untuk disimpan.");
      return;
    }

    onToast(
      "Draft belum disimpan secara permanen. Integrasi penyimpanan diperlukan.",
    );
  };

  const handleWhatsApp = () => {
    if (!selectedCustomer) {
      onToast("Pilih pelanggan terlebih dahulu.");
      return;
    }

    const phone = selectedCustomer.phone?.replace(/\D/g, "");

    if (!phone) {
      onToast("Nomor WhatsApp pelanggan belum tersedia.");
      return;
    }

    const message = [
      `Halo ${selectedCustomer.name},`,
      "",
      `Berikut ringkasan pesanan ${invoiceNumber}.`,
      `Total transaksi: ${formatRupiah(grandTotal)}`,
      `Pembayaran awal: ${formatRupiah(effectiveDp)}`,
      `Sisa tagihan: ${formatRupiah(remainingDebt)}`,
      paymentScheme !== "lunas" && dueDate
        ? `Jatuh tempo: ${new Date(`${dueDate}T00:00:00`).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            },
          )}`
        : "",
      `Metode pembayaran: ${
        paymentMethod === "bca"
          ? "Transfer BCA"
          : paymentMethod === "qris"
            ? "QRIS"
            : "Tunai"
      }`,
      "",
      "Terima kasih.",
    ]
      .filter(Boolean)
      .join("\n");

    const normalizedPhone = phone.startsWith("0")
      ? `62${phone.slice(1)}`
      : phone;

    window.open(
      `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const filters: { label: string; value: CategoryFilter }[] = [
    { label: "Semua produk", value: "all" },
    { label: "Sofa & living", value: "sofa" },
    { label: "Meja & kursi", value: "meja" },
    { label: "Kamar tidur", value: "kamar" },
    { label: "Pre-order", value: "po" },
  ];

  return (
    <div className="mx-auto mt-5 flex w-full max-w-[1600px] flex-col gap-5 text-[#30251e]">
      <header className="flex flex-col gap-4 border-b border-[#e5e2dd] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#82746d]">
            <span>Penjualan</span>
            <span>/</span>
            <span className="font-medium text-[#5f402a]">Kasir</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1c19] sm:text-[28px]">
            Kasir & Penjualan
          </h1>

          <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#82746d]">
            Buat pesanan, terapkan harga pelanggan, dan atur pembayaran dalam
            satu halaman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("cash-flow")}
            className={buttonSecondary}
          >
            <span className="material-symbols-outlined text-[17px]">
              receipt_long
            </span>
            Riwayat transaksi
          </button>

          <button
            type="button"
            onClick={handleNewTransaction}
            className={buttonPrimary}
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            Transaksi baru
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className={`${panelClass} p-4 sm:p-5`}>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#30251e]">
                    Katalog produk
                  </h2>
                  <p className="mt-1 text-xs text-[#82746d]">
                    {filteredProducts.length} produk ditemukan
                  </p>
                </div>

                <span className="hidden items-center gap-1.5 rounded-md bg-[#f0ede9] px-2.5 py-1.5 text-[11px] text-[#62554b] sm:inline-flex">
                  <span className="material-symbols-outlined text-[15px]">
                    inventory_2
                  </span>
                  {products.length} produk terdaftar
                </span>
              </div>

              <div className="flex h-11 items-center gap-2 rounded-lg border border-[#e5e2dd] bg-white px-3 transition-colors focus-within:border-[#8a674c]">
                <span className="material-symbols-outlined text-[19px] text-[#82746d]">
                  search
                </span>

                <input
                  id="pos-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari nama produk, SKU, atau material..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a69a8e]"
                  aria-label="Cari produk"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-md p-1 text-[#82746d] hover:bg-[#f0ede9]"
                    aria-label="Hapus pencarian"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      close
                    </span>
                  </button>
                )}

                <kbd className="hidden rounded border border-[#e5e2dd] bg-[#fcfaf7] px-1.5 py-0.5 text-[10px] text-[#82746d] sm:inline">
                  Ctrl K
                </kbd>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {filters.map((filter) => {
                  const active = categoryFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setCategoryFilter(filter.value)}
                      aria-pressed={active}
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs transition-colors ${
                        active
                          ? "bg-[#5f402a] font-semibold text-white"
                          : "border border-[#e5e2dd] bg-[#fcfaf7] text-[#62554b] hover:bg-[#f0ede9]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div
              className={`${panelClass} flex flex-col items-center px-5 py-14 text-center`}
            >
              <span className="material-symbols-outlined text-3xl text-[#a69a8e]">
                search_off
              </span>
              <h3 className="mt-3 text-sm font-semibold">
                Produk tidak ditemukan
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-5 text-[#82746d]">
                Coba kata kunci lain atau pilih kategori yang berbeda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
                className="mt-4 text-xs font-semibold text-[#5f402a] hover:underline"
              >
                Reset pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const isPo = isPreOrder(product);
                const isOutOfStock = !isPo && product.stockPhysical <= 0;
                const currentPrice = getPriceForProduct(product);
                const inCart = cartItems.find(
                  (item) => item.product.id === product.id,
                );

                return (
                  <article
                    key={product.id}
                    className={`${panelClass} flex min-w-0 flex-col overflow-hidden transition-colors hover:border-[#cfc1b3]`}
                  >
                    <div className="relative h-44 overflow-hidden bg-[#f0ede9]">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#a69a8e]">
                          <span className="material-symbols-outlined text-4xl">
                            chair
                          </span>
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-md border border-[#e5e2dd] bg-[#fcfaf7]/95 px-2 py-1 font-mono text-[10px] text-[#50453e]">
                        {product.sku}
                      </span>

                      <span
                        className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-medium ${
                          isPo
                            ? "bg-[#f6e7d1] text-[#805824]"
                            : isOutOfStock
                              ? "bg-[#f9eeeb] text-[#a3443f]"
                              : "bg-[#edf5ee] text-[#28734b]"
                        }`}
                      >
                        {isPo
                          ? "Pre-order"
                          : isOutOfStock
                            ? "Stok habis"
                            : `Stok ${product.stockPhysical}`}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="min-h-[52px]">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#30251e]">
                          {product.name}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-[#82746d]">
                          {product.woodType || "Material belum diisi"}
                          {product.dimensions ? ` · ${product.dimensions}` : ""}
                        </p>
                      </div>

                      <div className="mt-4 rounded-lg border border-[#e5e2dd] bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#82746d]">
                            Harga pelanggan
                          </span>
                          <span className="rounded bg-[#f0ede9] px-1.5 py-0.5 text-[10px] font-semibold text-[#5f402a]">
                            {selectedCustomer?.tier ?? "Retail"}
                          </span>
                        </div>

                        <p className="text-lg font-semibold tracking-tight text-[#5f402a]">
                          {formatRupiah(currentPrice)}
                        </p>

                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#e5e2dd] pt-2.5">
                          {(
                            [
                              ["Retail", product.prices.retail],
                              ["Reseller", product.prices.reseller],
                              ["Grosir", product.prices.grosir],
                            ] as const
                          ).map(([label, price]) => (
                            <div key={label} className="min-w-0">
                              <p className="text-[10px] text-[#82746d]">
                                {label}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] font-medium text-[#50453e]">
                                {formatCompactRupiah(price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e5e2dd] pt-3">
                        <div className="min-w-0">
                          <p className="text-[10px] text-[#82746d]">
                            HPP / modal
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-[#50453e]">
                            {formatRupiah(product.hpp)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className={buttonPrimary}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {inCart ? "add_shopping_cart" : "add"}
                          </span>
                          {inCart ? `Tambah (${inCart.quantity})` : "Tambah"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-[#e5e2dd] bg-[#f0ede9] p-4">
            <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#795740]">
              info
            </span>
            <div>
              <p className="text-xs font-semibold text-[#50453e]">
                Produk custom atau di luar katalog
              </p>
              <p className="mt-1 text-xs leading-5 text-[#82746d]">
                Produk custom belum dapat ditambahkan langsung dari kasir.
                Tambahkan produknya terlebih dahulu agar harga jual dan HPP
                tercatat dengan benar.
              </p>
            </div>
          </div>
        </section>

        <aside className="min-w-0 xl:sticky xl:top-4">
          <div className={`${panelClass} overflow-hidden`}>
            <div className="border-b border-[#e5e2dd] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-[#82746d]">Transaksi berjalan</p>
                  <h2 className="mt-1 break-all font-mono text-sm font-semibold text-[#30251e]">
                    {invoiceNumber}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleNewTransaction}
                  disabled={cartItems.length === 0}
                  className="rounded-lg border border-[#e5e2dd] p-2 text-[#82746d] transition-colors hover:bg-[#f0ede9] hover:text-[#a3443f] disabled:opacity-40"
                  aria-label="Kosongkan keranjang"
                  title="Kosongkan keranjang"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete_outline
                  </span>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f0ede9] px-3 py-2.5">
                <span className="text-xs text-[#82746d]">Jumlah barang</span>
                <span className="text-xs font-semibold text-[#50453e]">
                  {itemCount} unit · {cartItems.length} jenis
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-4 sm:p-5">
              <section>
                <SectionHeading
                  title="Pelanggan"
                  detail="Harga jual dan limit piutang mengikuti pelanggan."
                  action={
                    <button
                      type="button"
                      onClick={() => onNavigate("customers")}
                      className="shrink-0 text-xs font-semibold text-[#5f402a] hover:underline"
                    >
                      + Tambah
                    </button>
                  }
                />

                <select
                  id="pos-customer"
                  value={selectedCustomer?.id ?? ""}
                  onChange={(event) =>
                    setSelectedCustomerId(event.target.value)
                  }
                  className={fieldClass}
                >
                  {customers.length === 0 && (
                    <option value="">Belum ada pelanggan</option>
                  )}

                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.tier}
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div className="mt-3 rounded-lg border border-[#e5e2dd] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#82746d]">
                        Kategori harga
                      </span>
                      <span className="rounded-md bg-[#f0ede9] px-2 py-1 text-[11px] font-semibold text-[#5f402a]">
                        {selectedCustomer.tier}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-[#82746d]">
                          Limit piutang
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#50453e]">
                          {formatRupiah(selectedCustomer.creditLimit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#82746d]">Sisa limit</p>
                        <p className="mt-1 text-xs font-semibold text-[#28734b]">
                          {formatRupiah(availableCredit)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <SectionHeading
                  title="Item pesanan"
                  detail={`${cartItems.length} jenis produk dalam keranjang`}
                />

                {cartItems.length === 0 ? (
                  <EmptyCart />
                ) : (
                  <div className="flex flex-col divide-y divide-[#e5e2dd]">
                    {cartItems.map((item) => {
                      const unitPrice =
                        item.customPrice !== undefined
                          ? item.customPrice
                          : getPriceForProduct(item.product);

                      return (
                        <div
                          key={item.product.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-5 text-[#30251e]">
                                {item.product.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-[#82746d]">
                                {item.product.sku}
                              </p>
                              <p className="mt-1 text-xs text-[#5f402a]">
                                {formatRupiah(unitPrice)}
                                <span className="text-[#82746d]"> / unit</span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeCartItem(item.product.id)}
                              className="rounded-md p-1 text-[#a69a8e] hover:bg-[#f9eeeb] hover:text-[#a3443f]"
                              aria-label={`Hapus ${item.product.name}`}
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                close
                              </span>
                            </button>
                          </div>

                          {item.discountNote && (
                            <p className="mt-2 rounded-md bg-[#f6e7d1] px-2 py-1.5 text-[10px] text-[#805824]">
                              Penyesuaian harga: {item.discountNote}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center rounded-lg border border-[#e5e2dd]">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.product.id, -1)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-l-lg text-[#50453e] hover:bg-[#f0ede9]"
                                aria-label={`Kurangi jumlah ${item.product.name}`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  remove
                                </span>
                              </button>

                              <span className="min-w-8 text-center text-xs font-semibold">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.product.id, 1)
                                }
                                disabled={
                                  !isPreOrder(item.product) &&
                                  item.quantity >= item.product.stockPhysical
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-r-lg text-[#50453e] hover:bg-[#f0ede9] disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label={`Tambah jumlah ${item.product.name}`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  add
                                </span>
                              </button>
                            </div>

                            <p className="text-right text-xs font-semibold text-[#30251e]">
                              {formatRupiah(unitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <SectionHeading
                  title="Layanan tambahan"
                  detail="Biaya akan ditambahkan ke total transaksi."
                />

                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#e5e2dd] p-3 transition-colors hover:bg-white">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-[#795740]">
                        local_shipping
                      </span>
                      <div>
                        <p className="text-xs font-medium text-[#30251e]">
                          Ongkos kirim
                        </p>
                        <p className="mt-1 text-[11px] text-[#82746d]">
                          {formatRupiah(ONGKIR_COST)}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={includeOngkir}
                      onChange={(event) =>
                        setIncludeOngkir(event.target.checked)
                      }
                      className="h-4 w-4 accent-[#5f402a]"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#e5e2dd] p-3 transition-colors hover:bg-white">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-[#795740]">
                        handyman
                      </span>
                      <div>
                        <p className="text-xs font-medium text-[#30251e]">
                          Rakit & pemasangan
                        </p>
                        <p className="mt-1 text-[11px] text-[#82746d]">
                          {formatRupiah(RAKIT_COST)}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={includeRakit}
                      onChange={(event) =>
                        setIncludeRakit(event.target.checked)
                      }
                      className="h-4 w-4 accent-[#5f402a]"
                    />
                  </label>
                </div>
              </section>

              <section>
                <SectionHeading
                  title="Pembayaran"
                  detail="Tentukan pembayaran awal dan sisa tagihan."
                />

                <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#f0ede9] p-1">
                  {(
                    [
                      ["lunas", "Lunas"],
                      ["dp", "DP / Termin"],
                      ["kredit", "Kredit"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentScheme(value)}
                      aria-pressed={paymentScheme === value}
                      className={`rounded-md px-1.5 py-2.5 text-[11px] transition-colors ${
                        paymentScheme === value
                          ? "bg-[#fcfaf7] font-semibold text-[#5f402a] shadow-sm"
                          : "text-[#82746d] hover:text-[#50453e]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {paymentScheme === "dp" && (
                  <div className="mt-3 rounded-lg border border-[#e5e2dd] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="pos-dp-amount"
                        className="text-xs font-medium text-[#50453e]"
                      >
                        Pembayaran awal
                      </label>
                      <span className="text-[11px] font-medium text-[#82746d]">
                        {dpPercent.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-2 flex h-10 items-center rounded-lg border border-[#e5e2dd] bg-[#fcfaf7] px-3 focus-within:border-[#8a674c]">
                      <span className="mr-2 text-xs text-[#82746d]">Rp</span>
                      <input
                        id="pos-dp-amount"
                        type="number"
                        min={0}
                        max={grandTotal}
                        value={dpAmount}
                        onChange={(event) =>
                          setDpAmount(
                            Math.max(0, Number(event.target.value) || 0),
                          )
                        }
                        className="w-full bg-transparent text-sm font-semibold outline-none"
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {[30, 50, 70].map((percentage) => (
                        <button
                          key={percentage}
                          type="button"
                          onClick={() =>
                            setDpAmount(
                              Math.round((grandTotal * percentage) / 100),
                            )
                          }
                          className="rounded-md border border-[#e5e2dd] px-2 py-2 text-[11px] text-[#5f402a] transition-colors hover:bg-[#f0ede9]"
                        >
                          {percentage}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-[#50453e]">
                    Metode pembayaran
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["bca", "BCA", "account_balance"],
                        ["qris", "QRIS", "qr_code_2"],
                        ["cash", "Tunai", "payments"],
                      ] as const
                    ).map(([value, label, icon]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaymentMethod(value)}
                        aria-pressed={paymentMethod === value}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs transition-colors ${
                          paymentMethod === value
                            ? "border-[#8a674c] bg-[#f0ede9] font-semibold text-[#5f402a]"
                            : "border-[#e5e2dd] bg-[#fcfaf7] text-[#82746d] hover:bg-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {icon}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentScheme !== "lunas" && (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg bg-[#f0ede9] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#62554b]">
                        Sisa tagihan
                      </span>
                      <span className="text-xs font-semibold text-[#a3443f]">
                        {formatRupiah(remainingDebt)}
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="pos-due-date"
                        className="mb-1.5 block text-xs text-[#62554b]"
                      >
                        Jatuh tempo
                      </label>
                      <input
                        id="pos-due-date"
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        className={fieldClass}
                      />
                    </div>

                    {remainingDebt > availableCredit && (
                      <p className="text-[11px] leading-5 text-[#a3443f]">
                        Sisa tagihan melebihi limit piutang yang tersedia.
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section className="border-t border-[#e5e2dd] pt-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#82746d]">Subtotal produk</span>
                    <span className="font-medium text-[#50453e]">
                      {formatRupiah(subtotalProducts)}
                    </span>
                  </div>

                  {includeOngkir && (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[#82746d]">Ongkos kirim</span>
                      <span>{formatRupiah(ongkirCost)}</span>
                    </div>
                  )}

                  {includeRakit && (
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[#82746d]">Rakit & pemasangan</span>
                      <span>{formatRupiah(rakitCost)}</span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-[#d9cec2]" />

                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-semibold text-[#30251e]">
                      Total transaksi
                    </span>
                    <span className="text-xl font-semibold tracking-tight text-[#5f402a]">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f0ede9] px-3 py-3">
                    <span className="text-xs text-[#62554b]">
                      {paymentScheme === "lunas"
                        ? "Dibayar sekarang"
                        : paymentScheme === "dp"
                          ? "DP hari ini"
                          : "Pembayaran awal"}
                    </span>
                    <span className="text-xs font-semibold text-[#5f402a]">
                      {formatRupiah(effectiveDp)}
                    </span>
                  </div>

                  {paymentScheme !== "lunas" && (
                    <div className="flex items-center justify-between gap-3 px-1">
                      <span className="text-xs text-[#82746d]">
                        Sisa pembayaran
                      </span>
                      <span className="text-xs font-semibold text-[#a3443f]">
                        {formatRupiah(remainingDebt)}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!selectedCustomer || cartItems.length === 0}
                  className={`${buttonPrimary} h-11 w-full text-sm`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    receipt_long
                  </span>
                  Simpan & proses transaksi
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={cartItems.length === 0}
                    className={`${buttonSecondary} h-10`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      drafts
                    </span>
                    Simpan draft
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    disabled={!selectedCustomer || cartItems.length === 0}
                    className={`${buttonSecondary} h-10`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      chat
                    </span>
                    WhatsApp
                  </button>
                </div>

                <p className="text-center text-[10px] leading-4 text-[#a69a8e]">
                  Periksa item, harga, stok, dan skema pembayaran sebelum
                  memproses transaksi.
                </p>
              </section>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
