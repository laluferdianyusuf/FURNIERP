import type { FormEvent, ReactNode } from "react";
import React, { useMemo, useState } from "react";
import type { PageView, Product } from "../types";

import {
  AlertCircle,
  Armchair,
  Check,
  FileText,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  ShoppingCart,
  Warehouse,
} from "lucide-react";

import { Alert, AlertDescription } from "../components/ui/alert";
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
import { ScrollArea } from "../components/ui/scroll-area";
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

const STATUS_STYLES: Record<string, string> = {
  Aman: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Menipis: "border-amber-200 bg-amber-50 text-amber-700",
  Kritis: "border-red-200 bg-red-50 text-red-700",
};

const StatusBadge = ({ status }: { status: string }) => (
  <Badge
    variant="outline"
    className={`whitespace-nowrap font-medium ${
      STATUS_STYLES[status] ?? "border-stone-200 bg-stone-50 text-stone-600"
    }`}
  >
    {status}
  </Badge>
);

const TypeBadge = ({ type }: { type: string }) => (
  <Badge
    variant="outline"
    className={
      type === "Ready Stock"
        ? "whitespace-nowrap border-emerald-200 bg-emerald-50 text-emerald-700"
        : "whitespace-nowrap border-amber-200 bg-amber-50 text-amber-800"
    }
  >
    {type === "Ready Stock" ? "Ready Stock" : "Custom / PO"}
  </Badge>
);

const Field = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="text-xs font-medium text-stone-700">{label}</Label>
    {children}
  </div>
);

const SectionHeading = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="space-y-1">
    <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
    {description && (
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    )}
  </div>
);

const INPUT_CLASS = "h-10 bg-white text-sm focus-visible:ring-[#795740]";

const PRIMARY_BUTTON_CLASS = "bg-[#5f402a] text-white hover:bg-[#795740]";

const StatItem = ({
  label,
  value,
  description,
  icon: IconComponent,
  critical = false,
}: {
  label: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  critical?: boolean;
}) => (
  <div className="flex min-w-0 items-start gap-3">
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        critical && value !== "0 SKU"
          ? "bg-red-50 text-red-600"
          : "bg-stone-100 text-[#795740]"
      }`}
    >
      <IconComponent className="h-4 w-4" />
    </div>

    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 truncate text-lg font-semibold tracking-tight ${
          critical && value !== "0 SKU" ? "text-red-600" : "text-stone-900"
        }`}
      >
        {value}
      </p>
      {description && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {description}
        </p>
      )}
    </div>
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

  const handleCreateProduct = (event: FormEvent<HTMLFormElement>) => {
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

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedCategory !== "Semua" ||
    selectedType !== "Semua";

  return (
    <div className="flex w-full flex-col gap-5 text-stone-900">
      {/* Header */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Produk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola katalog, harga jual, BOM, dan ketersediaan stok.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate("inventory")}
            className="gap-2"
          >
            <Warehouse className="h-4 w-4" />
            Stok
          </Button>

          <Button
            type="button"
            onClick={openNewProductModal}
            className={`gap-2 ${PRIMARY_BUTTON_CLASS}`}
          >
            <Plus className="h-4 w-4" />
            Tambah produk
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card className="shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama produk, SKU, atau jenis kayu..."
                aria-label="Cari produk"
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>

            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value ?? "")}
            >
              <SelectTrigger
                aria-label="Filter tipe produk"
                className="w-full bg-white md:w-[190px]"
              >
                <SelectValue placeholder="Semua tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua tipe</SelectItem>
                <SelectItem value="Ready Stock">Ready Stock</SelectItem>
                <SelectItem value="PO 14-21 Hari">Custom / PO</SelectItem>
              </SelectContent>
            </Select>
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
                <Button
                  key={category}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    active
                      ? "h-8 gap-2 bg-[#5f402a] text-white hover:bg-[#795740]"
                      : "h-8 gap-2"
                  }
                >
                  {category}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      active ? "bg-white/15" : "bg-stone-100"
                    }`}
                  >
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Product table */}
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b px-4 py-3">
          <CardTitle className="text-sm font-semibold">Daftar produk</CardTitle>

          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {filteredProducts.length} dari {products.length} produk
            </p>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 gap-1.5 text-xs text-[#795740] hover:text-[#5f402a]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        {filteredProducts.length === 0 ? (
          <CardContent className="flex flex-col items-center px-5 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <SearchX className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-semibold">Produk tidak ditemukan</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Coba ubah kata kunci atau filter kategori dan tipe produk.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4 gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset pencarian
            </Button>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow className="bg-stone-50 hover:bg-stone-50">
                  <TableHead className="w-[260px]">Produk</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">HPP</TableHead>
                  <TableHead className="w-[210px]">Harga jual</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="align-middle">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-11 w-11 shrink-0 rounded-md border bg-stone-50 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-500">
                            <Armchair className="h-5 w-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-medium text-stone-900">
                            {product.name}
                          </p>
                          <p className="mt-1 font-mono text-xs text-[#795740]">
                            {product.sku}
                          </p>
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                            {product.category}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <TypeBadge type={product.type} />
                    </TableCell>

                    <TableCell className="text-right">
                      <p className="whitespace-nowrap font-mono text-sm font-medium">
                        {formatRupiah(product.hpp)}
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedProductForBOM(product)}
                        className="h-auto px-0 pt-1 text-xs text-[#795740]"
                      >
                        Lihat BOM
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1.5">
                        {[
                          {
                            label: "Retail",
                            price: product.prices.retail,
                          },
                          {
                            label: "Reseller",
                            price: product.prices.reseller,
                          },
                          {
                            label: "Grosir",
                            price: product.prices.grosir,
                          },
                        ].map((tier) => (
                          <div
                            key={tier.label}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-xs text-muted-foreground">
                              {tier.label}
                            </span>
                            <span className="whitespace-nowrap font-mono text-xs font-medium">
                              {formatCompactRupiah(tier.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-start justify-center gap-3">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Fisik
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {product.stockPhysical}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            SPK
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#795740]">
                            {product.stockReserved}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Bebas
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-700">
                            {product.stockAvailable}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-[10px] text-muted-foreground">
                        Buffer: {product.bufferMin}
                      </p>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Lihat detail BOM"
                          aria-label={`Lihat BOM ${product.name}`}
                          onClick={() => setSelectedProductForBOM(product)}
                          className="h-8 w-8 text-[#795740]"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onNavigate("pos")}
                          className={`h-8 gap-1.5 ${PRIMARY_BUTTON_CLASS}`}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Jual
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* BOM detail dialog */}
      <Dialog
        open={Boolean(selectedProductForBOM)}
        onOpenChange={(open) => {
          if (!open) setSelectedProductForBOM(null);
        }}
      >
        <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          {selectedProductForBOM && (
            <>
              <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
                <DialogTitle className="text-base">
                  {selectedProductForBOM.name}
                </DialogTitle>
                <DialogDescription>
                  <span className="font-mono">{selectedProductForBOM.sku}</span>
                  {" · "}HPP {formatRupiah(selectedProductForBOM.hpp)}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-6 p-5">
                  {/* Product specification */}
                  <section className="space-y-3">
                    <SectionHeading title="Spesifikasi produk" />

                    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
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
                        <div key={spec.label} className="border-b py-3">
                          <p className="text-xs text-muted-foreground">
                            {spec.label}
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {spec.value || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* BOM items */}
                  <section className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <SectionHeading
                        title="Komponen BOM"
                        description="Rincian material dan biaya produksi."
                      />
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Total HPP
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatRupiah(selectedProductForBOM.hpp)}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                      <Table className="min-w-[500px]">
                        <TableHeader>
                          <TableRow className="bg-stone-50 hover:bg-stone-50">
                            <TableHead>Komponen</TableHead>
                            <TableHead>Spesifikasi</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead className="text-right">
                              Subtotal
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {selectedProductForBOM.bomItems?.length ? (
                            selectedProductForBOM.bomItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {item.spec}
                                </TableCell>
                                <TableCell>{item.volume}</TableCell>
                                <TableCell className="whitespace-nowrap text-right font-mono">
                                  {formatRupiah(item.subtotal)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="h-24 text-center text-muted-foreground"
                              >
                                Belum ada rincian komponen BOM.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  <Separator />

                  {/* Price margins */}
                  <section className="space-y-3">
                    <SectionHeading
                      title="Harga dan margin"
                      description="Margin kotor = harga jual dikurangi HPP. Persentase margin dihitung dari harga jual."
                    />

                    <div className="overflow-x-auto rounded-md border">
                      <Table className="min-w-[450px]">
                        <TableHeader>
                          <TableRow className="bg-stone-50 hover:bg-stone-50">
                            <TableHead>Tipe harga</TableHead>
                            <TableHead className="text-right">
                              Harga jual
                            </TableHead>
                            <TableHead className="text-right">Margin</TableHead>
                            <TableHead className="text-right">
                              Persentase
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
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
                            const margin =
                              tier.price - selectedProductForBOM.hpp;
                            const percent = getMargin(
                              tier.price,
                              selectedProductForBOM.hpp,
                            );

                            return (
                              <TableRow key={tier.label}>
                                <TableCell className="font-medium">
                                  {tier.label}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-right font-mono">
                                  {formatRupiah(tier.price)}
                                </TableCell>
                                <TableCell
                                  className={`whitespace-nowrap text-right font-mono ${
                                    margin < 0
                                      ? "text-red-600"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {formatRupiah(margin)}
                                </TableCell>
                                <TableCell
                                  className={`text-right font-medium ${
                                    percent < 0
                                      ? "text-red-600"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {percent.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  <Separator />

                  {/* Stock information */}
                  <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      {
                        label: "Stok fisik",
                        value: selectedProductForBOM.stockPhysical,
                      },
                      {
                        label: "Stok SPK",
                        value: selectedProductForBOM.stockReserved,
                      },
                      {
                        label: "Stok bebas",
                        value: selectedProductForBOM.stockAvailable,
                      },
                      {
                        label: "Harga minimum",
                        value: formatRupiah(
                          selectedProductForBOM.ownerFloorPrice,
                        ),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border bg-stone-50 p-3"
                      >
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </section>
                </div>
              </ScrollArea>

              <DialogFooter className="flex-col gap-2 border-t bg-stone-50 p-4 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedProductForBOM(null);
                    onNavigate("orders");
                  }}
                  className="w-full sm:w-auto"
                >
                  Buka SPK produksi
                </Button>

                <Button
                  type="button"
                  onClick={() => setSelectedProductForBOM(null)}
                  className={`w-full sm:w-auto ${PRIMARY_BUTTON_CLASS}`}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add product dialog */}
      <Dialog
        open={isNewProductModalOpen}
        onOpenChange={(open) => {
          setIsNewProductModalOpen(open);
          if (!open) setFormError("");
        }}
      >
        <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
            <DialogTitle className="text-base">Tambah produk</DialogTitle>
            <DialogDescription>
              Isi identitas, harga jual, dan stok awal produk.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleCreateProduct}
            className="flex min-h-0 flex-1 flex-col"
          >
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-6 p-5">
                {/* Identity */}
                <section className="space-y-3">
                  <SectionHeading
                    title="Identitas produk"
                    description="Informasi dasar produk dan spesifikasi material."
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="SKU produk *">
                      <Input
                        required
                        value={newSku}
                        onChange={(event) => setNewSku(event.target.value)}
                        placeholder="MBL-0001"
                        className={`${INPUT_CLASS} font-mono`}
                      />
                    </Field>

                    <Field label="Kategori *">
                      <Select
                        value={newCategory}
                        onValueChange={(value) => setNewCategory(value ?? "")}
                      >
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Nama produk *" className="sm:col-span-2">
                      <Input
                        required
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Contoh: Meja Makan Jati Minimalis"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Jenis kayu / material">
                      <Input
                        value={newWood}
                        onChange={(event) => setNewWood(event.target.value)}
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Dimensi produk">
                      <Input
                        value={newDimensions}
                        onChange={(event) =>
                          setNewDimensions(event.target.value)
                        }
                        placeholder="P × L × T"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Tipe ketersediaan">
                      <Select
                        value={newType}
                        onValueChange={(value) =>
                          setNewType(value as ProductType)
                        }
                      >
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ready Stock">
                            Ready Stock
                          </SelectItem>
                          <SelectItem value="PO 14-21 Hari">
                            Custom / PO 14–21 hari
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="HPP / modal produksi (Rp) *">
                      <Input
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
                </section>

                <Separator />

                {/* Selling prices */}
                <section className="space-y-3">
                  <SectionHeading
                    title="Harga jual"
                    description="Tetapkan harga berdasarkan kelompok pelanggan."
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Retail (Rp) *">
                      <Input
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
                      <Input
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
                      <Input
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
                      <div className="rounded-lg border bg-stone-50 p-4">
                        <p className="text-xs font-medium text-stone-700">
                          Estimasi margin kotor
                        </p>

                        <div className="mt-3 grid grid-cols-3 gap-3">
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
                                <p className="text-xs text-muted-foreground">
                                  {tier.label}
                                </p>
                                <p
                                  className={`mt-1 text-base font-semibold ${
                                    margin < 0
                                      ? "text-red-600"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {margin.toFixed(1)}%
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {formatRupiah(tier.price - Number(newHpp))}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </section>

                <Separator />

                {/* Opening stock */}
                <section className="space-y-3">
                  <SectionHeading
                    title="Stok awal"
                    description="Masukkan jumlah unit fisik dan batas minimum persediaan."
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Stok fisik awal (unit) *">
                      <Input
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
                      <Input
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
                </section>

                {formError && (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50 text-red-700"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-col gap-2 border-t bg-stone-50 p-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewProductModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={!onAddProduct}
                className={`w-full gap-2 sm:w-auto ${PRIMARY_BUTTON_CLASS}`}
              >
                <Check className="h-4 w-4" />
                Simpan produk
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
