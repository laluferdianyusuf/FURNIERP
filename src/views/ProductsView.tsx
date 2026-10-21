import React, { useMemo, useState } from "react";
import { PageView, Product } from "../types";

interface ProductsViewProps {
  products: Product[];
  onNavigate: (page: PageView) => void;
  onAddProduct?: (product: Product) => void;
}

type ProductType = "Ready Stock" | "PO 14-21 Hari";
type ViewMode = "table" | "grid";

const CATEGORIES = [
  "Semua",
  "Meja Makan & Kursi",
  "Sofa & Living",
  "Kamar Tidur & Lemari",
  "Outdoor & Gazebo",
  "Aksesoris Kayu",
];

const PRODUCT_CATEGORIES = CATEGORIES.filter(
  (category) => category !== "Semua",
);

const INPUT_CLASS =
  "w-full rounded-lg border border-[#e5e2dd] bg-[#f6f3ee] px-3 py-2.5 text-sm text-[#1c1c19] outline-none transition placeholder:text-[#a49a91] focus:border-[#795740] focus:bg-white focus:ring-2 focus:ring-[#795740]/10";

const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-[#50453e]";

const PANEL_CLASS = "rounded-xl border border-[#e5e2dd] bg-[#fcf9f4]";

const formatRupiah = (value: number) =>
  `Rp ${Math.round(value || 0).toLocaleString("id-ID")}`;

const formatCompactRupiah = (value: number) => {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} jt`;
  }

  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} rb`;
  }

  return formatRupiah(value);
};

const getMargin = (price: number, hpp: number) => {
  if (price <= 0) return 0;
  return ((price - hpp) / price) * 100;
};

const getProductStatus = (stock: number, buffer: number) => {
  if (stock <= 0) return "Kritis";
  if (stock <= buffer) return "Menipis";
  return "Aman";
};

const getNextSku = (products: Product[]) => {
  const existing = new Set(
    products.map((product) => product.sku.trim().toLowerCase()),
  );

  let index = products.length + 1;
  let sku = "";

  do {
    sku = `MBL-${String(index).padStart(4, "0")}`;
    index += 1;
  } while (existing.has(sku.toLowerCase()));

  return sku;
};

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = "" }) => (
  <div className={className}>
    <label className={LABEL_CLASS}>{label}</label>
    {children}
  </div>
);

const SectionHeading: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => (
  <div>
    <h3 className="text-sm font-semibold text-[#29231f]">{title}</h3>
    {description && (
      <p className="mt-1 text-xs leading-relaxed text-[#82746d]">
        {description}
      </p>
    )}
  </div>
);

const Icon: React.FC<{
  name: string;
  className?: string;
}> = ({ name, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Aman: "border-[#d8e5d9] bg-[#edf4ed] text-[#416346]",
    Menipis: "border-[#eadcc3] bg-[#f8f0df] text-[#8a652b]",
    Kritis: "border-[#ebd4ce] bg-[#f8eae6] text-[#9b493b]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium ${
        styles[status] || "border-[#e5e2dd] bg-[#f0ede9] text-[#50453e]"
      }`}
    >
      {status}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium ${
      type === "Ready Stock"
        ? "bg-[#edf4ed] text-[#416346]"
        : "bg-[#f1e9df] text-[#795740]"
    }`}
  >
    {type === "Ready Stock" ? "Ready Stock" : "Custom / PO"}
  </span>
);

const MetricCard: React.FC<{
  label: string;
  value: string;
  description: string;
  icon: string;
  warning?: boolean;
}> = ({ label, value, description, icon, warning = false }) => (
  <div className={`${PANEL_CLASS} p-4 sm:p-5`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-medium text-[#82746d]">{label}</p>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          warning
            ? "bg-[#f8eae6] text-[#9b493b]"
            : "bg-[#f0e8df] text-[#795740]"
        }`}
      >
        <Icon name={icon} className="text-[19px]" />
      </div>
    </div>

    <p
      className={`mt-4 text-xl font-semibold tracking-tight ${
        warning ? "text-[#9b493b]" : "text-[#29231f]"
      }`}
    >
      {value}
    </p>

    <p className="mt-1 text-xs leading-relaxed text-[#82746d]">{description}</p>
  </div>
);

const PriceCell: React.FC<{
  label: string;
  price: number;
  margin: number;
}> = ({ label, price, margin }) => (
  <div className="min-w-0 rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] p-2">
    <p className="text-[10px] font-medium text-[#82746d]">{label}</p>
    <p className="mt-1 whitespace-nowrap font-mono text-xs font-semibold text-[#29231f]">
      {formatCompactRupiah(price)}
    </p>
    <p
      className={`mt-1 text-[10px] ${
        margin < 0 ? "text-[#9b493b]" : "text-[#637a5e]"
      }`}
    >
      Margin {margin.toFixed(1)}%
    </p>
  </div>
);

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onNavigate,
  onAddProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedType, setSelectedType] = useState("Semua");
  const [selectedProductForBOM, setSelectedProductForBOM] =
    useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [newWood, setNewWood] = useState("Kayu Jati Solid TPK Grade A");
  const [newDimensions, setNewDimensions] = useState("200 × 90 × 78 cm");
  const [newHpp, setNewHpp] = useState("2500000");
  const [newRetail, setNewRetail] = useState("4500000");
  const [newReseller, setNewReseller] = useState("3900000");
  const [newGrosir, setNewGrosir] = useState("3500000");
  const [newPhysical, setNewPhysical] = useState("5");
  const [newBuffer, setNewBuffer] = useState("2");
  const [newType, setNewType] = useState<ProductType>("Ready Stock");
  const [formError, setFormError] = useState("");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [product.name, product.sku, product.woodType, product.category].some(
          (value) => value?.toLowerCase().includes(query),
        );

      const matchesCategory =
        selectedCategory === "Semua" || product.category === selectedCategory;

      const matchesType =
        selectedType === "Semua" || product.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [products, searchQuery, selectedCategory, selectedType]);

  const totalHppInventory = products.reduce(
    (total, product) => total + product.hpp * product.stockPhysical,
    0,
  );

  const totalPhysicalStock = products.reduce(
    (total, product) => total + product.stockPhysical,
    0,
  );

  const criticalStockCount = products.filter(
    (product) => product.status === "Kritis" || product.stockAvailable <= 0,
  ).length;

  const readyStockCount = products.filter(
    (product) => product.type === "Ready Stock",
  ).length;

  const poCount = products.length - readyStockCount;

  const averageRetailMargin =
    products.length > 0
      ? products.reduce(
          (total, product) =>
            total + getMargin(product.prices.retail, product.hpp),
          0,
        ) / products.length
      : 0;

  const resetProductForm = () => {
    setNewSku("");
    setNewName("");
    setNewCategory(PRODUCT_CATEGORIES[0]);
    setNewWood("Kayu Jati Solid TPK Grade A");
    setNewDimensions("200 × 90 × 78 cm");
    setNewHpp("2500000");
    setNewRetail("4500000");
    setNewReseller("3900000");
    setNewGrosir("3500000");
    setNewPhysical("5");
    setNewBuffer("2");
    setNewType("Ready Stock");
    setFormError("");
  };

  const openNewProductModal = () => {
    resetProductForm();
    setNewSku(getNextSku(products));
    setIsNewProductModalOpen(true);
  };

  const handleCreateProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const sku = newSku.trim();
    const name = newName.trim();
    const hpp = Number(newHpp);
    const retail = Number(newRetail);
    const reseller = Number(newReseller);
    const grosir = Number(newGrosir);
    const physical = Number(newPhysical);
    const buffer = Number(newBuffer);

    if (!sku || !name) {
      setFormError("SKU dan nama produk wajib diisi.");
      return;
    }

    if (
      products.some(
        (product) => product.sku.trim().toLowerCase() === sku.toLowerCase(),
      )
    ) {
      setFormError("SKU sudah digunakan. Silakan gunakan kode lain.");
      return;
    }

    if (
      ![hpp, retail, reseller, grosir].every(
        (value) => Number.isFinite(value) && value > 0,
      )
    ) {
      setFormError("HPP dan semua harga jual harus lebih dari Rp 0.");
      return;
    }

    if (retail < hpp || reseller < hpp || grosir < hpp) {
      setFormError("Harga jual sebaiknya tidak lebih rendah dari HPP.");
      return;
    }

    if (
      !Number.isInteger(physical) ||
      physical < 0 ||
      !Number.isInteger(buffer) ||
      buffer < 0
    ) {
      setFormError("Stok fisik dan buffer harus berupa bilangan bulat ≥ 0.");
      return;
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku,
      name,
      category: newCategory,
      image: "",
      woodType: newWood.trim() || "Belum ditentukan",
      dimensions: newDimensions.trim() || "Belum ditentukan",
      thickness: "Panel 2.5 cm",
      finishing: "Natural Satin Melamic",
      legConstruction: "Solid Wood Knock-Down",
      type: newType,
      hpp,
      bomComponentsCount: 4,
      prices: {
        retail,
        reseller,
        grosir,
      },
      stockPhysical: physical,
      stockReserved: 0,
      stockAvailable: physical,
      bufferMin: buffer,
      ownerFloorPrice: Math.round(hpp * 1.15),
      status: getProductStatus(physical, buffer),
      bomItems: [
        {
          id: "b1",
          name: "Kayu Solid Pilihan",
          spec: newWood.trim() || "Belum ditentukan",
          volume: "0.4 m³",
          unitPrice: Math.round(hpp * 0.55),
          subtotal: Math.round(hpp * 0.55),
          status: "Tersedia",
        },
        {
          id: "b2",
          name: "Jasa Perakitan & Konstruksi",
          spec: "Jasa workshop",
          volume: "1 Lot",
          unitPrice: Math.round(hpp * 0.25),
          subtotal: Math.round(hpp * 0.25),
          status: "Workshop",
        },
        {
          id: "b3",
          name: "Bahan Finishing",
          spec: "Finishing sesuai spesifikasi",
          volume: "1 Lot",
          unitPrice: Math.round(hpp * 0.12),
          subtotal: Math.round(hpp * 0.12),
          status: "Tersedia",
        },
        {
          id: "b4",
          name: "Hardware & Kemasan",
          spec: "Kelengkapan produk",
          volume: "1 Set",
          unitPrice: Math.round(hpp * 0.08),
          subtotal: Math.round(hpp * 0.08),
          status: "Tersedia",
        },
      ],
    };

    if (!onAddProduct) {
      setFormError("Fitur tambah produk belum terhubung.");
      return;
    }

    onAddProduct(newProduct);
    setIsNewProductModalOpen(false);
    resetProductForm();
  };

  return (
    <div className="mt-5 flex w-full flex-col gap-6 text-[#29231f]">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#82746d]">
            <span>Operasional</span>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-[#795740]">Produk</span>
          </div>

          <h1 className="font-headline text-2xl font-semibold tracking-tight sm:text-3xl">
            Katalog produk
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#82746d]">
            Kelola spesifikasi, HPP, harga jual, dan ketersediaan stok produk
            mebel dari satu tempat.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate("inventory")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-3.5 py-2.5 text-xs font-medium text-[#50453e] transition hover:bg-[#f0ede9]"
          >
            <Icon name="inventory_2" className="text-[18px]" />
            Stok fisik
          </button>

          <button
            type="button"
            onClick={() => onNavigate("pos")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-3.5 py-2.5 text-xs font-medium text-[#50453e] transition hover:bg-[#f0ede9]"
          >
            <Icon name="point_of_sale" className="text-[18px]" />
            Buka POS
          </button>

          <button
            type="button"
            onClick={openNewProductModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5f402a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#795740]"
          >
            <Icon name="add" className="text-[18px]" />
            Tambah produk
          </button>
        </div>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total produk"
          value={`${products.length} SKU`}
          description={`${readyStockCount} ready stock · ${poCount} produk PO`}
          icon="inventory_2"
        />

        <MetricCard
          label="Nilai stok berdasarkan HPP"
          value={formatCompactRupiah(totalHppInventory)}
          description={`${totalPhysicalStock.toLocaleString("id-ID")} unit stok fisik`}
          icon="account_balance_wallet"
        />

        <MetricCard
          label="Rata-rata margin retail"
          value={`${averageRetailMargin.toFixed(1)}%`}
          description="Rata-rata margin kotor harga retail terhadap HPP"
          icon="percent"
        />

        <MetricCard
          label="Stok perlu diperiksa"
          value={`${criticalStockCount} SKU`}
          description="Produk kritis atau tidak memiliki stok tersedia"
          icon="warning"
          warning={criticalStockCount > 0}
        />
      </section>

      {/* Search and filters */}
      <section className={`${PANEL_CLASS} p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#82746d]"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama produk, SKU, atau jenis kayu..."
              aria-label="Cari produk"
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter tipe produk"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className={`${INPUT_CLASS} min-w-40 py-2.5 lg:w-auto`}
            >
              <option value="Semua">Semua tipe</option>
              <option value="Ready Stock">Ready Stock</option>
              <option value="PO 14-21 Hari">Custom / PO</option>
            </select>

            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#e5e2dd] bg-[#f6f3ee] p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Tampilan tabel"
                aria-pressed={viewMode === "table"}
                className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                  viewMode === "table"
                    ? "bg-[#5f402a] text-white"
                    : "text-[#82746d] hover:bg-white hover:text-[#50453e]"
                }`}
              >
                <Icon name="table_rows" className="text-[19px]" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Tampilan kartu"
                aria-pressed={viewMode === "grid"}
                className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                  viewMode === "grid"
                    ? "bg-[#5f402a] text-white"
                    : "text-[#82746d] hover:bg-white hover:text-[#50453e]"
                }`}
              >
                <Icon name="grid_view" className="text-[19px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => {
            const count =
              category === "Semua"
                ? products.length
                : products.filter((product) => product.category === category)
                    .length;

            const active = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "border-[#5f402a] bg-[#5f402a] text-white"
                    : "border-[#e5e2dd] bg-[#fcf9f4] text-[#50453e] hover:bg-[#f0ede9]"
                }`}
              >
                {category}
                <span
                  className={`text-[10px] ${
                    active ? "text-white/75" : "text-[#82746d]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#e5e2dd] pt-3">
          <p className="text-xs text-[#82746d]">
            Menampilkan{" "}
            <span className="font-semibold text-[#50453e]">
              {filteredProducts.length}
            </span>{" "}
            dari {products.length} produk
          </p>

          {(searchQuery ||
            selectedCategory !== "Semua" ||
            selectedType !== "Semua") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua");
                setSelectedType("Semua");
              }}
              className="text-xs font-medium text-[#795740] hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      </section>

      {/* Table view */}
      {viewMode === "table" ? (
        <section className={`${PANEL_CLASS} overflow-hidden`}>
          {filteredProducts.length === 0 ? (
            <EmptyProducts
              onReset={() => {
                setSearchQuery("");
                setSelectedCategory("Semua");
                setSelectedType("Semua");
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-xs">
                <thead className="border-b border-[#e5e2dd] bg-[#f6f3ee]">
                  <tr className="text-[10px] font-semibold uppercase tracking-wide text-[#82746d]">
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-3 py-3">Tipe</th>
                    <th className="px-3 py-3 text-right">HPP</th>
                    <th className="px-3 py-3">Harga jual</th>
                    <th className="px-3 py-3 text-center">Stok</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e5e2dd]">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-[#f8f5f0]"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              className="h-12 w-12 shrink-0 rounded-lg border border-[#e5e2dd] bg-[#f0ede9] object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#e5e2dd] bg-[#f0ede9] text-[#82746d]">
                              <Icon name="chair" className="text-[23px]" />
                            </div>
                          )}

                          <div className="min-w-0 max-w-[270px]">
                            <p className="truncate text-sm font-semibold text-[#29231f]">
                              {product.name}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-[#795740]">
                              {product.sku}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-[#82746d]">
                              {product.woodType}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#a49a91]">
                              {product.dimensions}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <TypeBadge type={product.type} />
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <p className="whitespace-nowrap font-mono text-xs font-semibold">
                          {formatRupiah(product.hpp)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedProductForBOM(product)}
                          className="mt-1 text-[11px] font-medium text-[#795740] hover:underline"
                        >
                          Lihat BOM ({product.bomComponentsCount})
                        </button>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="grid min-w-[290px] grid-cols-3 gap-1.5">
                          <PriceCell
                            label="Retail"
                            price={product.prices.retail}
                            margin={getMargin(
                              product.prices.retail,
                              product.hpp,
                            )}
                          />
                          <PriceCell
                            label="Reseller"
                            price={product.prices.reseller}
                            margin={getMargin(
                              product.prices.reseller,
                              product.hpp,
                            )}
                          />
                          <PriceCell
                            label="Grosir"
                            price={product.prices.grosir}
                            margin={getMargin(
                              product.prices.grosir,
                              product.hpp,
                            )}
                          />
                        </div>

                        <p className="mt-1.5 text-[10px] text-[#82746d]">
                          Harga minimum internal:{" "}
                          {formatRupiah(product.ownerFloorPrice)}
                        </p>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-center">
                            <p className="text-[10px] text-[#82746d]">Fisik</p>
                            <p className="mt-1 font-semibold">
                              {product.stockPhysical}
                            </p>
                          </div>
                          <div className="h-7 border-l border-[#e5e2dd]" />
                          <div className="text-center">
                            <p className="text-[10px] text-[#82746d]">SPK</p>
                            <p className="mt-1 font-semibold text-[#795740]">
                              {product.stockReserved}
                            </p>
                          </div>
                          <div className="h-7 border-l border-[#e5e2dd]" />
                          <div className="text-center">
                            <p className="text-[10px] text-[#82746d]">Bebas</p>
                            <p className="mt-1 font-semibold text-[#416346]">
                              {product.stockAvailable}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 text-center text-[10px] text-[#82746d]">
                          Buffer minimum: {product.bufferMin}
                        </p>
                      </td>

                      <td className="px-3 py-3.5">
                        <StatusBadge status={product.status} />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            title="Lihat detail produk dan BOM"
                            aria-label={`Lihat BOM ${product.name}`}
                            onClick={() => setSelectedProductForBOM(product)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e2dd] text-[#795740] transition hover:bg-[#f0ede9]"
                          >
                            <Icon name="description" className="text-[18px]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigate("pos")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5f402a] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#795740]"
                          >
                            <Icon
                              name="point_of_sale"
                              className="text-[16px]"
                            />
                            Jual
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        /* Grid view */
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full">
              <EmptyProducts
                onReset={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                  setSelectedType("Semua");
                }}
              />
            </div>
          ) : (
            filteredProducts.map((product) => (
              <article
                key={product.id}
                className={`${PANEL_CLASS} flex min-w-0 flex-col overflow-hidden transition-colors hover:border-[#cfc1b4]`}
              >
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#f0ede9]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon name="chair" className="text-5xl text-[#b3a59a]" />
                  )}

                  <div className="absolute left-3 top-3">
                    <TypeBadge type={product.type} />
                  </div>

                  <div className="absolute right-3 top-3">
                    <StatusBadge status={product.status} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[10px] font-medium tracking-wide text-[#795740]">
                    {product.sku}
                  </p>

                  <h3 className="mt-1 text-sm font-semibold leading-snug text-[#29231f]">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-xs text-[#82746d]">
                    {product.woodType}
                  </p>

                  <p className="mt-1 text-[11px] text-[#a49a91]">
                    {product.dimensions}
                  </p>

                  <div className="mt-4 border-t border-[#e5e2dd] pt-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#82746d]">
                      Harga retail
                    </p>
                    <p className="mt-1 font-mono text-lg font-semibold text-[#29231f]">
                      {formatRupiah(product.prices.retail)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-[#f6f3ee] p-3">
                    <div>
                      <p className="text-[10px] text-[#82746d]">HPP</p>
                      <p className="mt-1 text-xs font-semibold">
                        {formatCompactRupiah(product.hpp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#82746d]">Stok bebas</p>
                      <p className="mt-1 text-xs font-semibold">
                        {product.stockAvailable} unit
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForBOM(product)}
                      className="flex-1 rounded-lg border border-[#e5e2dd] px-3 py-2 text-xs font-medium text-[#50453e] transition hover:bg-[#f0ede9]"
                    >
                      Detail BOM
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate("pos")}
                      className="flex-1 rounded-lg bg-[#5f402a] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#795740]"
                    >
                      Buka POS
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* BOM detail modal */}
      {selectedProductForBOM && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#211b17]/45 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProductForBOM(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bom-modal-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#e5e2dd] bg-[#fcf9f4] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#e5e2dd] px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                {selectedProductForBOM.image ? (
                  <img
                    src={selectedProductForBOM.image}
                    alt={selectedProductForBOM.name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#795740]">
                    <Icon name="chair" className="text-2xl" />
                  </div>
                )}

                <div className="min-w-0">
                  <h2
                    id="bom-modal-title"
                    className="truncate text-base font-semibold"
                  >
                    {selectedProductForBOM.name}
                  </h2>
                  <p className="mt-1 text-xs text-[#82746d]">
                    {selectedProductForBOM.sku} · HPP{" "}
                    {formatRupiah(selectedProductForBOM.hpp)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Tutup detail BOM"
                onClick={() => setSelectedProductForBOM(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#82746d] transition hover:bg-[#f0ede9] hover:text-[#29231f]"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              <div>
                <SectionHeading
                  title="Spesifikasi produk"
                  description="Informasi material dan konstruksi produk."
                />

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Jenis kayu / material",
                      value: selectedProductForBOM.woodType,
                    },
                    {
                      label: "Dimensi",
                      value: selectedProductForBOM.dimensions,
                    },
                    {
                      label: "Finishing",
                      value: selectedProductForBOM.finishing,
                    },
                    {
                      label: "Konstruksi kaki",
                      value: selectedProductForBOM.legConstruction,
                    },
                  ].map((spec) => (
                    <div
                      key={spec.label}
                      className="rounded-lg border border-[#e5e2dd] bg-white/60 p-3"
                    >
                      <p className="text-[11px] text-[#82746d]">{spec.label}</p>
                      <p className="mt-1 text-sm font-medium">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <SectionHeading
                    title="Rincian komponen BOM"
                    description="Bill of Materials atau rincian komponen biaya produk."
                  />
                  <p className="text-sm font-semibold text-[#795740]">
                    Total HPP: {formatRupiah(selectedProductForBOM.hpp)}
                  </p>
                </div>

                <div className="mt-3 overflow-x-auto rounded-xl border border-[#e5e2dd]">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-[#f0ede9] text-[10px] uppercase tracking-wide text-[#82746d]">
                      <tr>
                        <th className="px-3 py-3">Komponen</th>
                        <th className="px-3 py-3">Spesifikasi</th>
                        <th className="px-3 py-3">Volume</th>
                        <th className="px-3 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#e5e2dd]">
                      {selectedProductForBOM.bomItems?.length ? (
                        selectedProductForBOM.bomItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-3 font-medium">
                              {item.name}
                            </td>
                            <td className="px-3 py-3 text-[#82746d]">
                              {item.spec}
                            </td>
                            <td className="px-3 py-3">{item.volume}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono font-medium">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-8 text-center text-[#82746d]"
                          >
                            Belum ada rincian komponen BOM untuk produk ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <SectionHeading
                  title="Perbandingan harga dan margin"
                  description="Margin kotor dihitung dari harga jual dikurangi HPP, dibagi harga jual."
                />

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Retail",
                      price: selectedProductForBOM.prices.retail,
                    },
                    {
                      label: "Reseller",
                      price: selectedProductForBOM.prices.reseller,
                    },
                    {
                      label: "Grosir",
                      price: selectedProductForBOM.prices.grosir,
                    },
                  ].map((tier) => {
                    const marginValue = tier.price - selectedProductForBOM.hpp;
                    const marginPercent = getMargin(
                      tier.price,
                      selectedProductForBOM.hpp,
                    );

                    return (
                      <div
                        key={tier.label}
                        className="rounded-xl border border-[#e5e2dd] bg-white/60 p-4"
                      >
                        <p className="text-xs font-medium text-[#82746d]">
                          {tier.label}
                        </p>
                        <p className="mt-2 font-mono text-sm font-semibold">
                          {formatRupiah(tier.price)}
                        </p>
                        <div className="mt-3 border-t border-[#e5e2dd] pt-3">
                          <p className="text-[11px] text-[#82746d]">
                            Margin kotor
                          </p>
                          <p
                            className={`mt-1 text-sm font-semibold ${
                              marginValue < 0
                                ? "text-[#9b493b]"
                                : "text-[#416346]"
                            }`}
                          >
                            {formatRupiah(marginValue)}
                          </p>
                          <p className="mt-1 text-xs text-[#82746d]">
                            {marginPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] bg-[#f6f3ee] p-4 sm:flex-row sm:justify-between sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForBOM(null);
                  onNavigate("orders");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-4 py-2.5 text-xs font-medium text-[#50453e] transition hover:bg-[#f0ede9]"
              >
                <Icon name="assignment" className="text-[17px]" />
                Buka SPK produksi
              </button>

              <button
                type="button"
                onClick={() => setSelectedProductForBOM(null)}
                className="rounded-lg bg-[#5f402a] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#795740]"
              >
                Tutup detail
              </button>
            </div>
          </section>
        </div>
      )}

      {/* New product modal */}
      {isNewProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#211b17]/45 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsNewProductModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-product-title"
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e5e2dd] bg-[#fcf9f4] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#e5e2dd] px-5 py-4 sm:px-6">
              <div>
                <h2 id="new-product-title" className="text-base font-semibold">
                  Tambah produk
                </h2>
                <p className="mt-1 text-xs text-[#82746d]">
                  Masukkan identitas, biaya produksi, harga, dan stok awal.
                </p>
              </div>

              <button
                type="button"
                aria-label="Tutup form produk"
                onClick={() => setIsNewProductModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#82746d] transition hover:bg-[#f0ede9] hover:text-[#29231f]"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProduct}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                <div>
                  <SectionHeading
                    title="Identitas produk"
                    description="Gunakan SKU yang unik agar produk mudah dicari dan dibedakan."
                  />

                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="SKU produk *">
                      <input
                        type="text"
                        required
                        value={newSku}
                        onChange={(event) => setNewSku(event.target.value)}
                        placeholder="Contoh: MBL-0001"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Kategori *">
                      <select
                        required
                        value={newCategory}
                        onChange={(event) => setNewCategory(event.target.value)}
                        className={INPUT_CLASS}
                      >
                        {PRODUCT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Nama produk *" className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Contoh: Meja Makan Jati Minimalis"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Jenis kayu / material">
                      <input
                        type="text"
                        value={newWood}
                        onChange={(event) => setNewWood(event.target.value)}
                        placeholder="Jenis kayu utama"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Dimensi produk">
                      <input
                        type="text"
                        value={newDimensions}
                        onChange={(event) =>
                          setNewDimensions(event.target.value)
                        }
                        placeholder="P × L × T"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Tipe ketersediaan">
                      <select
                        value={newType}
                        onChange={(event) =>
                          setNewType(event.target.value as ProductType)
                        }
                        className={INPUT_CLASS}
                      >
                        <option value="Ready Stock">Ready Stock</option>
                        <option value="PO 14-21 Hari">
                          Custom / PO 14–21 hari
                        </option>
                      </select>
                    </Field>

                    <Field label="HPP / modal produksi (Rp) *">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={newHpp}
                        onChange={(event) => setNewHpp(event.target.value)}
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-[#e5e2dd] pt-5">
                  <SectionHeading
                    title="Harga jual"
                    description="Tentukan harga berdasarkan kelompok pelanggan."
                  />

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Retail (Rp) *">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={newRetail}
                        onChange={(event) => setNewRetail(event.target.value)}
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </Field>

                    <Field label="Reseller (Rp) *">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={newReseller}
                        onChange={(event) => setNewReseller(event.target.value)}
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </Field>

                    <Field label="Grosir (Rp) *">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={newGrosir}
                        onChange={(event) => setNewGrosir(event.target.value)}
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </Field>
                  </div>

                  {Number(newHpp) > 0 &&
                    Number(newRetail) > 0 &&
                    Number(newReseller) > 0 &&
                    Number(newGrosir) > 0 && (
                      <div className="mt-3 rounded-lg border border-[#e5e2dd] bg-[#f6f3ee] p-3">
                        <p className="text-[11px] font-medium text-[#82746d]">
                          Estimasi margin kotor
                        </p>

                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {[
                            {
                              label: "Retail",
                              price: Number(newRetail),
                            },
                            {
                              label: "Reseller",
                              price: Number(newReseller),
                            },
                            {
                              label: "Grosir",
                              price: Number(newGrosir),
                            },
                          ].map((tier) => {
                            const margin = getMargin(
                              tier.price,
                              Number(newHpp),
                            );

                            return (
                              <div key={tier.label}>
                                <p className="text-[10px] text-[#82746d]">
                                  {tier.label}
                                </p>
                                <p
                                  className={`mt-1 text-sm font-semibold ${
                                    margin < 0
                                      ? "text-[#9b493b]"
                                      : "text-[#416346]"
                                  }`}
                                >
                                  {margin.toFixed(1)}%
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>

                <div className="border-t border-[#e5e2dd] pt-5">
                  <SectionHeading
                    title="Persediaan awal"
                    description="Isi jumlah produk yang sudah tersedia secara fisik."
                  />

                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Stok fisik awal (unit) *">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={newPhysical}
                        onChange={(event) => setNewPhysical(event.target.value)}
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </Field>

                    <Field label="Buffer minimum (unit) *">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={newBuffer}
                        onChange={(event) => setNewBuffer(event.target.value)}
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </Field>
                  </div>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#ebd4ce] bg-[#f8eae6] px-3 py-2.5 text-xs text-[#9b493b]"
                  >
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] bg-[#f6f3ee] p-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-4 py-2.5 text-xs font-medium text-[#50453e] transition hover:bg-[#f0ede9]"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={!onAddProduct}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5f402a] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#795740] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="check" className="text-[17px]" />
                  Simpan produk
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

const EmptyProducts: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0ede9] text-[#795740]">
      <Icon name="search_off" className="text-2xl" />
    </div>

    <h3 className="mt-4 text-sm font-semibold text-[#29231f]">
      Produk tidak ditemukan
    </h3>

    <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#82746d]">
      Coba gunakan kata kunci lain atau ubah filter kategori dan tipe produk.
    </p>

    <button
      type="button"
      onClick={onReset}
      className="mt-4 rounded-lg border border-[#e5e2dd] px-4 py-2 text-xs font-medium text-[#795740] transition hover:bg-[#f0ede9]"
    >
      Reset pencarian
    </button>
  </div>
);
