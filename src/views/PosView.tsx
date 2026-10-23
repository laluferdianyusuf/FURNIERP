import {
  Armchair,
  ArrowRight,
  Minus,
  Plus,
  Search,
  SearchX,
  ShoppingBasket,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { money } from "../helpers/moneyFormatter";
import type { Customer, PageView, Product } from "../types";

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

const INPUT_CLASS =
  "border-[#e5e2dd] bg-white focus-visible:ring-[#795740] focus-visible:ring-offset-0";

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

const cx = (...classes: Array<string | false | null | undefined>) =>
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

const categoryFilters: { label: string; value: CategoryFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Sofa", value: "sofa" },
  { label: "Meja & kursi", value: "meja" },
  { label: "Kamar tidur", value: "kamar" },
  { label: "Pre-order", value: "po" },
];

function StockBadge({ product }: { product: Product }) {
  const preOrder = isPreOrder(product);
  const outOfStock = !preOrder && product.stockPhysical <= 0;

  return (
    <Badge
      variant="outline"
      className={cx(
        "rounded-md border-0 px-2 py-1 text-[11px] font-medium",
        preOrder && "bg-[#F8F0DF] text-[#936B2E]",
        outOfStock && "bg-[#FBEDEA] text-[#B5473C]",
        !preOrder && !outOfStock && "bg-[#EAF4ED] text-[#287653]",
      )}
    >
      {preOrder
        ? "Pre-order"
        : outOfStock
          ? "Stok habis"
          : `Stok ${product.stockPhysical}`}
    </Badge>
  );
}

function ProductImage({ product }: { product: Product }) {
  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E9E6DF] bg-[#F0EEE8] sm:size-16">
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <Armchair aria-hidden="true" className="size-7 text-[#A19A90]" />
      )}
    </div>
  );
}

interface CartPanelProps {
  items: PosCartItem[];
  customer?: Customer;
  invoiceNumber: string;
  totalQuantity: number;
  subtotal: number;
  additionalCost: number;
  total: number;
  includeOngkir: boolean;
  includeRakit: boolean;
  setIncludeOngkir: (value: boolean) => void;
  setIncludeRakit: (value: boolean) => void;
  changeQuantity: (productId: string, delta: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  proceedToCheckout: () => void;
  onCloseMobile?: () => void;
}

function CartPanel({
  items,
  customer,
  invoiceNumber,
  totalQuantity,
  subtotal,
  additionalCost,
  total,
  includeOngkir,
  includeRakit,
  setIncludeOngkir,
  setIncludeRakit,
  changeQuantity,
  removeProduct,
  clearCart,
  proceedToCheckout,
  onCloseMobile,
}: CartPanelProps) {
  const getUnitPrice = (item: PosCartItem) =>
    item.customPrice !== undefined
      ? item.customPrice
      : priceForTier(item.product, customer?.tier);

  return (
    <Card className="gap-0 overflow-hidden rounded-xl border-[#E9E6DF] bg-white py-0 shadow-none">
      <CardHeader className="border-b border-[#E9E6DF] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold">Keranjang</CardTitle>
            <p className="mt-1 break-all text-xs text-[#77746B]">
              {invoiceNumber}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearCart}
              disabled={!items.length}
              aria-label="Kosongkan keranjang"
              className="size-9 border-[#E9E6DF] text-[#77746B] hover:bg-[#F8F7F3] hover:text-[#B5473C]"
            >
              <Trash2 className="size-4" />
            </Button>

            {onCloseMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCloseMobile}
                aria-label="Tutup keranjang"
                className="size-9 text-[#77746B] md:hidden"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F8F7F3] px-3 py-2.5 text-xs">
          <span className="text-[#77746B]">Jumlah barang</span>
          <span className="font-semibold">{totalQuantity} unit</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {customer && (
          <p className="text-xs text-[#77746B]">
            Harga memakai kategori {customer.tier}
          </p>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold">Daftar barang</h3>
            <span className="text-xs text-[#77746B]">{items.length} jenis</span>
          </div>

          {!items.length ? (
            <div className="rounded-lg border border-dashed border-[#D9D3CA] bg-[#F8F7F3] px-3 py-7 text-center">
              <ShoppingBasket className="mx-auto size-8 text-[#A19A90]" />
              <p className="mt-2 text-xs font-medium">Keranjang masih kosong</p>
              <p className="mt-1 text-xs leading-5 text-[#77746B]">
                Pilih produk dari katalog untuk memulai transaksi.
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

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct(item.product.id)}
                        aria-label={`Hapus ${item.product.name}`}
                        className="size-8 shrink-0 text-[#A19A90] hover:bg-[#FBEDEA] hover:text-[#B5473C]"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex h-8 items-center rounded-lg border border-[#E9E6DF]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => changeQuantity(item.product.id, -1)}
                          aria-label={`Kurangi jumlah ${item.product.name}`}
                          className="size-7 rounded-r-none text-[#292720] hover:bg-[#F8F7F3]"
                        >
                          <Minus className="size-3.5" />
                        </Button>

                        <span className="min-w-7 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={
                            !isPreOrder(item.product) &&
                            item.quantity >= item.product.stockPhysical
                          }
                          onClick={() => changeQuantity(item.product.id, 1)}
                          aria-label={`Tambah jumlah ${item.product.name}`}
                          className="size-7 rounded-l-none text-[#292720] hover:bg-[#F8F7F3] disabled:opacity-30"
                        >
                          <Plus className="size-3.5" />
                        </Button>
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

        <Separator className="bg-[#E9E6DF]" />

        <section className="space-y-3">
          <p className="text-xs font-semibold">Layanan tambahan</p>

          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={includeOngkir}
              onCheckedChange={(checked) => setIncludeOngkir(checked === true)}
              aria-label="Ongkos kirim"
            />
            <span className="flex-1 text-xs">Ongkos kirim</span>
            <span className="text-xs tabular-nums text-[#77746B]">
              {compactMoney(ONGKIR_COST)}
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={includeRakit}
              onCheckedChange={(checked) => setIncludeRakit(checked === true)}
              aria-label="Rakit dan pemasangan"
            />
            <span className="flex-1 text-xs">Rakit & pemasangan</span>
            <span className="text-xs tabular-nums text-[#77746B]">
              {compactMoney(RAKIT_COST)}
            </span>
          </label>
        </section>

        <Separator className="bg-[#E9E6DF]" />

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[#77746B]">Subtotal</span>
            <span className="font-medium tabular-nums">{money(subtotal)}</span>
          </div>

          {additionalCost > 0 && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-[#77746B]">Layanan tambahan</span>
              <span className="font-medium tabular-nums">
                {money(additionalCost)}
              </span>
            </div>
          )}

          <Separator className="bg-[#E9E6DF]" />

          <div className="flex items-end justify-between gap-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-lg font-semibold tracking-tight text-[#5F402A] tabular-nums">
              {money(total)}
            </span>
          </div>
        </section>

        <Button
          type="button"
          onClick={proceedToCheckout}
          disabled={!customer || items.length === 0}
          className="h-11 w-full gap-2 rounded-lg bg-[#795740] text-sm text-white hover:bg-[#5F402A] disabled:opacity-40"
        >
          Lanjut checkout
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
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
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

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

  const cartPanelProps: CartPanelProps = {
    items,
    customer,
    invoiceNumber,
    totalQuantity,
    subtotal,
    additionalCost,
    total,
    includeOngkir,
    includeRakit,
    setIncludeOngkir,
    setIncludeRakit,
    changeQuantity,
    removeProduct,
    clearCart,
    proceedToCheckout,
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-24 text-[#292720] md:pb-0">
      {/* Pemilihan pelanggan */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor="pos-customer"
            className="shrink-0 text-sm font-medium"
          >
            Pelanggan
          </label>

          <Select
            value={customerId}
            onValueChange={(value) => setCustomerId(value ?? "")}
            disabled={!customers.length}
          >
            <SelectTrigger
              id="pos-customer"
              className="h-10 w-full flex-1 rounded-lg border-[#E9E6DF] bg-white"
            >
              <SelectValue placeholder="Pilih pelanggan" />
            </SelectTrigger>

            <SelectContent>
              {customers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {item.tier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigate("customers")}
          className="h-10 gap-2 border-[#E9E6DF] bg-white text-[#292720] hover:bg-[#F8F7F3]"
        >
          <UserPlus className="size-4" />
          Tambah pelanggan
        </Button>
      </div>

      {/* Katalog dan keranjang desktop */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-3">
          <Card className="gap-0 rounded-xl border-[#E9E6DF] bg-white py-0 shadow-none">
            <CardContent className="p-4">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari produk atau SKU"
                  aria-label="Cari produk"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {categoryFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    size="sm"
                    variant={category === filter.value ? "default" : "outline"}
                    onClick={() => setCategory(filter.value)}
                    aria-pressed={category === filter.value}
                    className={cx(
                      "h-9 shrink-0 rounded-lg px-3 text-xs",
                      category === filter.value
                        ? "bg-[#795740] text-white hover:bg-[#5F402A]"
                        : "border-[#E9E6DF] bg-white text-[#625E54] hover:bg-[#F8F7F3]",
                    )}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredProducts.length === 0 ? (
            <Card className="rounded-xl border-[#E9E6DF] bg-white shadow-none">
              <CardContent className="flex flex-col items-center px-5 py-12 text-center">
                <SearchX className="size-9 text-[#A19A90]" />
                <p className="mt-3 text-sm font-semibold">
                  Produk tidak ditemukan
                </p>
                <p className="mt-1 text-xs text-[#77746B]">
                  Coba kata kunci atau kategori lain.
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                  className="mt-2 text-xs text-[#795740]"
                >
                  Reset pencarian
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="gap-0 overflow-hidden rounded-xl border-[#E9E6DF] bg-white py-0 shadow-none">
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
                      className="grid grid-cols-1 gap-3 px-3 py-3 transition-colors hover:bg-[#FCFBF9] sm:px-4 md:grid-cols-[minmax(0,1fr)_100px_150px_135px] md:items-center md:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductImage product={product} />

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

                          <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                            <span className="text-sm font-semibold text-[#5F402A]">
                              {money(price)}
                            </span>
                            <StockBadge product={product} />
                            {inCart && (
                              <Badge
                                variant="secondary"
                                className="bg-[#F1EAE3] text-[10px] text-[#795740]"
                              >
                                {inCart.quantity} di keranjang
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="hidden justify-center md:flex">
                        <StockBadge product={product} />
                      </div>

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

                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <p className="text-[11px] text-[#77746B] md:hidden">
                          {customer ? `Harga ${customer.tier}` : "Harga Retail"}
                        </p>

                        <Button
                          type="button"
                          disabled={outOfStock}
                          onClick={() => addProduct(product)}
                          className={cx(
                            "h-9 min-w-[120px] shrink-0 gap-2 rounded-lg px-3 text-xs",
                            inCart
                              ? "border border-[#D9C8B8] bg-[#F1EAE3] text-[#5F402A] hover:bg-[#E9DED3]"
                              : "bg-[#795740] text-white hover:bg-[#5F402A]",
                          )}
                        >
                          {inCart ? (
                            <Plus className="size-4" />
                          ) : (
                            <ShoppingCart className="size-4" />
                          )}
                          {inCart
                            ? `Tambah (${inCart.quantity})`
                            : "Ke keranjang"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          )}
        </section>

        {/* Keranjang tetap di panel kanan pada desktop */}
        <aside className="hidden min-w-0 xl:sticky xl:top-20 xl:block">
          <CartPanel {...cartPanelProps} />
        </aside>
      </div>

      {/* Floating cart bar khusus HP */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9E6DF] bg-white/95 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(41,39,32,0.10)] backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="mx-auto flex w-full max-w-3xl items-center gap-3 text-left"
          aria-label={`Buka keranjang, ${totalQuantity} barang, total ${money(total)}`}
        >
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F1EAE3] text-[#5F402A]">
            <ShoppingCart className="size-5" />
            {totalQuantity > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#5F402A] px-1 text-[10px] font-bold text-white">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#77746B]">
              {items.length === 0
                ? "Keranjang masih kosong"
                : `${items.length} jenis produk · ${totalQuantity} unit`}
            </p>
            <p className="mt-0.5 truncate text-base font-bold text-[#5F402A]">
              {money(total)}
            </p>
          </div>

          <span className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#795740] px-4 text-sm font-semibold text-white">
            Keranjang
            <ArrowRight className="size-4" />
          </span>
        </button>
      </div>

      {/* Drawer keranjang dari bawah khusus HP */}
      <Dialog open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <DialogContent className="!fixed !inset-x-0 !bottom-0 !top-auto !left-0 !m-0 !flex !h-[88dvh] !max-h-[88dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl border-[#E9E6DF] bg-[#FCFBF9] p-0 shadow-2xl sm:!left-1/2 sm:!top-1/2 sm:!bottom-auto sm:!h-auto sm:!max-h-[85vh] sm:!w-[calc(100%-2rem)] sm:!max-w-lg sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:rounded-2xl">
          <DialogHeader className="shrink-0 border-b border-[#E9E6DF] px-4 py-3 pr-12 text-left">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#D9D3CA] sm:hidden" />
            <DialogTitle className="text-base font-bold text-[#292720]">
              Keranjang belanja
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77746B]">
              Periksa jumlah, layanan tambahan, dan total transaksi.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <CartPanel
              {...cartPanelProps}
              onCloseMobile={() => setMobileCartOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PosView;
