import React, { useMemo, useState } from "react";
import { PageView, Product } from "../types";

interface ProductsViewProps {
  products: Product[];
  onNavigate: (page: PageView) => void;
  onAddProduct?: (product: Product) => void;
}

type ProductType = "Ready Stock" | "PO 14-21 Hari";

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
  "w-full rounded-md border border-[#ded8d0] bg-white px-3 py-2.5 text-sm text-[#29231f] outline-none transition placeholder:text-[#a49a91] focus:border-[#795740]";

const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-[#50453e]";

const PANEL_CLASS = "rounded-lg border border-[#e5e2dd] bg-white";

const formatRupiah = (value: number) =>
  `Rp ${Math.round(Number(value) || 0).toLocaleString("id-ID")}`;

const formatCompactRupiah = (value: number) => {
  const amount = Number(value) || 0;

  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} jt`;
  }

  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} rb`;
  }

  return formatRupiah(amount);
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

const Icon: React.FC<{
  name: string;
  className?: string;
}> = ({ name, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Aman: "bg-[#edf4ed] text-[#416346]",
    Menipis: "bg-[#f8f0df] text-[#8a652b]",
    Kritis: "bg-[#f8eae6] text-[#9b493b]",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium ${
        styles[status] || "bg-[#f0ede9] text-[#50453e]"
      }`}
    >
      {status}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium ${
      type === "Ready Stock"
        ? "bg-[#edf4ed] text-[#416346]"
        : "bg-[#f1e9df] text-[#795740]"
    }`}
  >
    {type === "Ready Stock" ? "Ready Stock" : "Custom / PO"}
  </span>
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

  const totalPhysicalStock = products.reduce(
    (total, product) => total + product.stockPhysical,
    0,
  );

  const totalHppInventory = products.reduce(
    (total, product) => total + product.hpp * product.stockPhysical,
    0,
  );

  const criticalStockCount = products.filter(
    (product) => product.status === "Kritis" || product.stockAvailable <= 0,
  ).length;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("Semua");
    setSelectedType("Semua");
  };

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
      setFormError("Harga jual tidak boleh lebih rendah dari HPP.");
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

    const wood = newWood.trim() || "Belum ditentukan";

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku,
      name,
      category: newCategory,
      image: "",
      woodType: wood,
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
          spec: wood,
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
    <div className="flex w-full flex-col gap-5 text-[#29231f]">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-[#82746d]">
          Katalog, harga, dan stok produk.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate("inventory")}
            className="inline-flex items-center gap-2 rounded-md border border-[#e5e2dd] bg-white px-3 py-2.5 text-xs font-medium text-[#50453e] transition hover:bg-[#f6f3ee]"
          >
            <Icon name="inventory_2" className="text-base" />
            Stok
          </button>

          <button
            type="button"
            onClick={openNewProductModal}
            className="inline-flex items-center gap-2 rounded-md bg-[#5f402a] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#795740]"
          >
            <Icon name="add" className="text-base" />
            Tambah produk
          </button>
        </div>
      </header>

      {/* Ringkasan sederhana, tanpa kartu */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-[#e5e2dd] py-3 text-xs">
        <p className="text-[#82746d]">
          Total produk{" "}
          <span className="ml-1 font-semibold text-[#29231f]">
            {products.length}
          </span>
        </p>

        <p className="text-[#82746d]">
          Stok fisik{" "}
          <span className="ml-1 font-semibold text-[#29231f]">
            {totalPhysicalStock.toLocaleString("id-ID")} unit
          </span>
        </p>

        <p className="text-[#82746d]">
          Nilai stok (HPP){" "}
          <span className="ml-1 font-semibold text-[#29231f]">
            {formatCompactRupiah(totalHppInventory)}
          </span>
        </p>

        <p
          className={
            criticalStockCount > 0 ? "text-[#9b493b]" : "text-[#82746d]"
          }
        >
          Stok kritis{" "}
          <span className="ml-1 font-semibold">{criticalStockCount} SKU</span>
        </p>
      </section>

      {/* Search and filters */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#82746d]"
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

          <select
            aria-label="Filter tipe produk"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className={`${INPUT_CLASS} md:w-48`}
          >
            <option value="Semua">Semua tipe</option>
            <option value="Ready Stock">Ready Stock</option>
            <option value="PO 14-21 Hari">Custom / PO</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            const count =
              category === "Semua"
                ? products.length
                : products.filter((product) => product.category === category)
                    .length;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs transition ${
                  active
                    ? "border-[#795740] bg-[#f1e9df] font-semibold text-[#5f402a]"
                    : "border-[#e5e2dd] bg-white text-[#50453e] hover:bg-[#f6f3ee]"
                }`}
              >
                {category}
                <span className="text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Product table */}
      <section className={`${PANEL_CLASS} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e2dd] px-4 py-3">
          <p className="text-sm font-semibold text-[#29231f]">Daftar produk</p>

          <div className="flex items-center gap-3">
            <p className="text-xs text-[#82746d]">
              {filteredProducts.length} dari {products.length} produk
            </p>

            {(searchQuery ||
              selectedCategory !== "Semua" ||
              selectedType !== "Semua") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-[#795740] hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <Icon name="search_off" className="text-3xl text-[#a49a91]" />
            <p className="mt-3 text-sm font-semibold">Produk tidak ditemukan</p>
            <p className="mt-1 text-xs text-[#82746d]">
              Ubah kata kunci atau filter yang digunakan.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-xs font-medium text-[#795740] hover:underline"
            >
              Reset pencarian
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-xs">
              <thead className="border-b border-[#e5e2dd] bg-[#f8f6f2]">
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

              <tbody className="divide-y divide-[#eee9e3]">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-[#fcfaf7]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-11 w-11 shrink-0 rounded-md border border-[#e5e2dd] bg-[#f6f3ee] object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#f1ede7] text-[#82746d]">
                            <Icon name="chair" className="text-xl" />
                          </div>
                        )}

                        <div className="min-w-0 max-w-[250px]">
                          <p className="truncate text-sm font-medium text-[#29231f]">
                            {product.name}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-[#795740]">
                            {product.sku}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[#82746d]">
                            {product.category}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <TypeBadge type={product.type} />
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <p className="font-mono font-medium">
                        {formatRupiah(product.hpp)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedProductForBOM(product)}
                        className="mt-1 text-[11px] text-[#795740] hover:underline"
                      >
                        Lihat BOM
                      </button>
                    </td>

                    <td className="px-3 py-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-[#82746d]">
                            Retail
                          </span>
                          <span className="whitespace-nowrap font-mono font-medium">
                            {formatCompactRupiah(product.prices.retail)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-[#82746d]">
                            Reseller
                          </span>
                          <span className="whitespace-nowrap font-mono">
                            {formatCompactRupiah(product.prices.reseller)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-[#82746d]">
                            Grosir
                          </span>
                          <span className="whitespace-nowrap font-mono">
                            {formatCompactRupiah(product.prices.grosir)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <p className="text-[10px] text-[#82746d]">Fisik</p>
                          <p className="mt-1 font-semibold">
                            {product.stockPhysical}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-[#82746d]">SPK</p>
                          <p className="mt-1 font-semibold text-[#795740]">
                            {product.stockReserved}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-[#82746d]">Bebas</p>
                          <p className="mt-1 font-semibold text-[#416346]">
                            {product.stockAvailable}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-[10px] text-[#82746d]">
                        Buffer: {product.bufferMin}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      <StatusBadge status={product.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Lihat detail BOM"
                          aria-label={`Lihat BOM ${product.name}`}
                          onClick={() => setSelectedProductForBOM(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e2dd] text-[#795740] transition hover:bg-[#f6f3ee]"
                        >
                          <Icon name="description" className="text-lg" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigate("pos")}
                          className="inline-flex items-center gap-1 rounded-md bg-[#5f402a] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#795740]"
                        >
                          <Icon name="point_of_sale" className="text-base" />
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

      {/* BOM detail */}
      {selectedProductForBOM && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5"
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
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#e5e2dd] bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#e5e2dd] px-5 py-4">
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

              <button
                type="button"
                aria-label="Tutup detail BOM"
                onClick={() => setSelectedProductForBOM(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#82746d] hover:bg-[#f6f3ee]"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <SectionHeading title="Spesifikasi produk" />
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Kategori",
                      value: selectedProductForBOM.category,
                    },
                    {
                      label: "Jenis kayu / material",
                      value: selectedProductForBOM.woodType,
                    },
                    {
                      label: "Dimensi",
                      value: selectedProductForBOM.dimensions,
                    },
                    {
                      label: "Ketebalan",
                      value: selectedProductForBOM.thickness,
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
                      className="border-b border-[#eee9e3] pb-2"
                    >
                      <p className="text-[11px] text-[#82746d]">{spec.label}</p>
                      <p className="mt-1 text-sm font-medium">
                        {spec.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SectionHeading
                    title="Komponen BOM"
                    description="Rincian komponen dan biaya produksi."
                  />
                  <p className="text-sm font-semibold">
                    Total HPP: {formatRupiah(selectedProductForBOM.hpp)}
                  </p>
                </div>

                <div className="mt-3 overflow-x-auto border-y border-[#e5e2dd]">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead className="bg-[#f8f6f2] text-[10px] uppercase tracking-wide text-[#82746d]">
                      <tr>
                        <th className="px-3 py-2.5">Komponen</th>
                        <th className="px-3 py-2.5">Spesifikasi</th>
                        <th className="px-3 py-2.5">Volume</th>
                        <th className="px-3 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee9e3]">
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
                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono">
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
                            Belum ada rincian komponen BOM.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <SectionHeading
                  title="Harga dan margin"
                  description="Margin kotor dihitung dari harga jual dikurangi HPP."
                />

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="border-b border-[#e5e2dd] text-[#82746d]">
                      <tr>
                        <th className="py-2 font-medium">Tipe harga</th>
                        <th className="py-2 text-right font-medium">
                          Harga jual
                        </th>
                        <th className="py-2 text-right font-medium">Margin</th>
                        <th className="py-2 text-right font-medium">
                          Persentase
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee9e3]">
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
                        const margin = tier.price - selectedProductForBOM.hpp;
                        const percent = getMargin(
                          tier.price,
                          selectedProductForBOM.hpp,
                        );

                        return (
                          <tr key={tier.label}>
                            <td className="py-3 font-medium">{tier.label}</td>
                            <td className="whitespace-nowrap py-3 text-right font-mono">
                              {formatRupiah(tier.price)}
                            </td>
                            <td
                              className={`whitespace-nowrap py-3 text-right font-mono ${
                                margin < 0 ? "text-[#9b493b]" : "text-[#416346]"
                              }`}
                            >
                              {formatRupiah(margin)}
                            </td>
                            <td
                              className={`whitespace-nowrap py-3 text-right ${
                                percent < 0
                                  ? "text-[#9b493b]"
                                  : "text-[#416346]"
                              }`}
                            >
                              {percent.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#e5e2dd] pt-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] text-[#82746d]">Stok fisik</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedProductForBOM.stockPhysical}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#82746d]">Stok SPK</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedProductForBOM.stockReserved}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#82746d]">Stok bebas</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedProductForBOM.stockAvailable}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#82746d]">Harga minimum</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatRupiah(selectedProductForBOM.ownerFloorPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] bg-[#f8f6f2] p-4 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForBOM(null);
                  onNavigate("orders");
                }}
                className="rounded-md border border-[#e5e2dd] bg-white px-4 py-2.5 text-xs font-medium text-[#50453e] hover:bg-[#f6f3ee]"
              >
                Buka SPK produksi
              </button>

              <button
                type="button"
                onClick={() => setSelectedProductForBOM(null)}
                className="rounded-md bg-[#5f402a] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#795740]"
              >
                Tutup
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Add product */}
      {isNewProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5"
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
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#e5e2dd] bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#e5e2dd] px-5 py-4">
              <div>
                <h2 id="new-product-title" className="text-base font-semibold">
                  Tambah produk
                </h2>
                <p className="mt-1 text-xs text-[#82746d]">
                  Isi informasi produk, harga, dan stok awal.
                </p>
              </div>

              <button
                type="button"
                aria-label="Tutup form produk"
                onClick={() => setIsNewProductModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#82746d] hover:bg-[#f6f3ee]"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProduct}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div>
                  <SectionHeading title="Identitas produk" />
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="SKU produk *">
                      <input
                        required
                        value={newSku}
                        onChange={(event) => setNewSku(event.target.value)}
                        placeholder="MBL-0001"
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
                        required
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Contoh: Meja Makan Jati Minimalis"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Jenis kayu / material">
                      <input
                        value={newWood}
                        onChange={(event) => setNewWood(event.target.value)}
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Dimensi produk">
                      <input
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
                    description="Harga berdasarkan kelompok pelanggan."
                  />

                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                      <div className="mt-4 border-t border-[#e5e2dd] pt-3">
                        <p className="text-xs font-medium text-[#82746d]">
                          Estimasi margin kotor
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-3">
                          {[
                            { label: "Retail", price: Number(newRetail) },
                            { label: "Reseller", price: Number(newReseller) },
                            { label: "Grosir", price: Number(newGrosir) },
                          ].map((tier) => {
                            const margin = getMargin(
                              tier.price,
                              Number(newHpp),
                            );

                            return (
                              <div key={tier.label}>
                                <p className="text-[11px] text-[#82746d]">
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
                    title="Stok awal"
                    description="Jumlah stok yang tersedia secara fisik."
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
                    className="rounded-md border border-[#ebd4ce] bg-[#f8eae6] px-3 py-2.5 text-xs text-[#9b493b]"
                  >
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] bg-[#f8f6f2] p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="rounded-md border border-[#e5e2dd] bg-white px-4 py-2.5 text-xs font-medium text-[#50453e] hover:bg-[#f6f3ee]"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={!onAddProduct}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#5f402a] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#795740] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="check" className="text-base" />
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
