import React, { useEffect, useMemo, useState } from "react";
import type { InventoryItem, PageView } from "../types";

import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  ArrowUpToLine,
  Boxes,
  History,
  Package,
  PackageSearch,
  RotateCcw,
  Search,
} from "lucide-react";

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
import { Textarea } from "../components/ui/textarea";

interface InventoryViewProps {
  inventory: InventoryItem[];
  onNavigate: (page: PageView) => void;
  onUpdateInventory?: (items: InventoryItem[]) => void;
}

type StockAction = "IN" | "OUT";
type InventoryTab = "finished" | "raw" | "history";
type StockStatus = "Aman" | "Menipis" | "Kritis!";

interface MovementLog {
  id: string;
  date: string;
  sku: string;
  name: string;
  type: StockAction;
  qty: number;
  ref: string;
  user: string;
  location: string;
}

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("id-ID");

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

const getStatus = (available: number, minSafety: number): StockStatus => {
  if (available <= 0) return "Kritis!";
  if (available < minSafety) return "Menipis";
  return "Aman";
};

const STATUS_STYLES: Record<string, string> = {
  Aman: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Menipis: "border-amber-200 bg-amber-50 text-amber-700",
  "Kritis!": "border-red-200 bg-red-50 text-red-700",
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

const PRIMARY_BUTTON_CLASS = "bg-[#5f402a] text-white hover:bg-[#795740]";

const INPUT_CLASS =
  "border-[#e5e2dd] bg-white focus-visible:ring-[#795740] focus-visible:ring-offset-0";

const EmptyInventory = ({
  hasActiveFilters,
  onReset,
}: {
  hasActiveFilters: boolean;
  onReset: () => void;
}) => (
  <div className="flex flex-col items-center px-4 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
      <PackageSearch className="h-6 w-6 text-stone-400" />
    </div>

    <p className="mt-3 text-sm font-semibold text-stone-900">
      Item tidak ditemukan
    </p>

    <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
      Coba ubah kata kunci pencarian atau pilih lokasi gudang yang berbeda.
    </p>

    {hasActiveFilters && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReset}
        className="mt-4 gap-2"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset filter
      </Button>
    )}
  </div>
);

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onNavigate,
  onUpdateInventory,
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>("finished");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Semua Lokasi");

  const [localInventory, setLocalInventory] =
    useState<InventoryItem[]>(inventory);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(
    inventory[0] ?? null,
  );

  const [isMutationOpen, setIsMutationOpen] = useState(false);
  const [stockAction, setStockAction] = useState<StockAction>("IN");
  const [stockAmount, setStockAmount] = useState("1");
  const [stockNotes, setStockNotes] = useState("");
  const [mutationError, setMutationError] = useState("");

  const [movementLogs, setMovementLogs] = useState<MovementLog[]>([
    {
      id: "MUT-001",
      date: "23 Okt 2026, 10.30",
      sku: "SF-MDN-001",
      name: "Sofa Minimalis",
      type: "IN",
      qty: 5,
      ref: "PO-2026-001",
      user: "Owner",
      location: "Gudang Utama",
    },
    {
      id: "MUT-002",
      date: "23 Okt 2026, 09.15",
      sku: "TB-KAY-002",
      name: "Meja Kayu",
      type: "OUT",
      qty: 2,
      ref: "INV-20261023-001",
      user: "Owner",
      location: "Gudang Utama",
    },
    {
      id: "MUT-003",
      date: "22 Okt 2026, 16.45",
      sku: "KRS-MDN-003",
      name: "Kursi Minimalis",
      type: "IN",
      qty: 10,
      ref: "MUT-2026-003",
      user: "Owner",
      location: "Gudang Utama",
    },
    {
      id: "MUT-004",
      date: "22 Okt 2026, 14.20",
      sku: "BB-KAYU-001",
      name: "Kayu Jati",
      type: "OUT",
      qty: 8,
      ref: "SPK-2026-012",
      user: "Owner",
      location: "Gudang Bahan",
    },
  ]);

  useEffect(() => {
    setLocalInventory(inventory);

    setSelectedItem((current) => {
      if (current) {
        return (
          inventory.find((item) => item.id === current.id) ??
          inventory[0] ??
          null
        );
      }

      return inventory[0] ?? null;
    });
  }, [inventory]);

  const finishedGoods = useMemo(
    () => localInventory.filter((item) => !item.isRawMaterial),
    [localInventory],
  );

  const rawMaterials = useMemo(
    () => localInventory.filter((item) => item.isRawMaterial),
    [localInventory],
  );

  const locations = useMemo(
    () => [
      "Semua Lokasi",
      ...Array.from(
        new Set(localInventory.map((item) => item.location || "Gudang Utama")),
      ),
    ],
    [localInventory],
  );

  const currentItems = activeTab === "raw" ? rawMaterials : finishedGoods;

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return currentItems.filter((item) => {
      const matchesSearch =
        !query ||
        [item.name, item.sku, item.category].some((value) =>
          value?.toLowerCase().includes(query),
        );

      const matchesLocation =
        selectedLocation === "Semua Lokasi" ||
        (item.location || "Gudang Utama") === selectedLocation;

      return matchesSearch && matchesLocation;
    });
  }, [currentItems, searchQuery, selectedLocation]);

  useEffect(() => {
    setSelectedItem((current) => {
      if (!filteredItems.length) return null;

      if (current) {
        return (
          filteredItems.find((item) => item.id === current.id) ??
          filteredItems[0]
        );
      }

      return filteredItems[0];
    });
  }, [filteredItems]);

  const hasActiveFilters =
    Boolean(searchQuery) || selectedLocation !== "Semua Lokasi";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedLocation("Semua Lokasi");
  };

  const openMutation = (action: StockAction) => {
    if (!selectedItem) return;

    if (action === "OUT" && selectedItem.available <= 0) {
      return;
    }

    setStockAction(action);
    setStockAmount("1");
    setStockNotes("");
    setMutationError("");
    setIsMutationOpen(true);
  };

  const handleMutation = () => {
    if (!selectedItem) {
      setMutationError("Pilih item inventaris terlebih dahulu.");
      return;
    }

    const quantity = Number(stockAmount);

    if (
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setMutationError("Jumlah stok harus berupa bilangan bulat lebih dari 0.");
      return;
    }

    if (!stockNotes.trim()) {
      setMutationError("Catatan mutasi wajib diisi.");
      return;
    }

    const currentItem = localInventory.find(
      (item) => item.id === selectedItem.id,
    );

    if (!currentItem) {
      setMutationError("Item tidak ditemukan dalam inventaris.");
      return;
    }

    if (stockAction === "OUT" && quantity > currentItem.available) {
      setMutationError(
        `Stok tersedia hanya ${formatNumber(
          currentItem.available,
        )} unit. Stok yang sudah direservasi tidak dapat dikeluarkan.`,
      );
      return;
    }

    const newPhysical =
      stockAction === "IN"
        ? currentItem.physical + quantity
        : currentItem.physical - quantity;

    const newAvailable = Math.max(0, newPhysical - currentItem.reserved);

    const updatedItem: InventoryItem = {
      ...currentItem,
      physical: newPhysical,
      available: newAvailable,
      totalHpp: Math.round(newPhysical * currentItem.hppPerUnit),
      status: getStatus(newAvailable, currentItem.minSafety),
    };

    const updatedInventory = localInventory.map((item) =>
      item.id === currentItem.id ? updatedItem : item,
    );

    const now = new Date();

    const newLog: MovementLog = {
      id: `MUT-${now.getTime()}`,
      date: now.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      sku: currentItem.sku,
      name: currentItem.name,
      type: stockAction,
      qty: quantity,
      ref: `MUT-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
      user: "Owner",
      location: currentItem.location || "Gudang Utama",
    };

    setLocalInventory(updatedInventory);
    setSelectedItem(updatedItem);
    setMovementLogs((previous) => [newLog, ...previous]);

    onUpdateInventory?.(updatedInventory);

    setIsMutationOpen(false);
    setStockAmount("1");
    setStockNotes("");
    setMutationError("");
  };

  const renderInventoryTable = () => (
    <div className="hidden overflow-x-auto md:block">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="bg-stone-50 hover:bg-stone-50">
            <TableHead className="w-[260px]">Produk / material</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead className="text-right">Fisik</TableHead>
            <TableHead className="text-right">Reservasi</TableHead>
            <TableHead className="text-right">Tersedia</TableHead>
            <TableHead className="text-right">Total HPP</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredItems.map((item) => {
            const status = getStatus(item.available, item.minSafety);

            const selected = selectedItem?.id === item.id;

            return (
              <TableRow
                key={item.id}
                onClick={() => setSelectedItem(item)}
                aria-selected={selected}
                className={`cursor-pointer ${selected ? "bg-stone-50" : ""}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-500">
                      {item.isRawMaterial ? (
                        <Boxes className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate text-sm font-medium text-stone-900">
                        {item.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#795740]">
                        {item.sku}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.category || "Tanpa kategori"}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {item.location || "Gudang Utama"}
                </TableCell>

                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(item.physical)}
                </TableCell>

                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {formatNumber(item.reserved)}
                </TableCell>

                <TableCell className="text-right font-mono text-sm font-semibold">
                  {formatNumber(item.available)}
                </TableCell>

                <TableCell className="text-right font-mono text-sm">
                  {formatCompactRupiah(item.totalHpp)}
                </TableCell>

                <TableCell>
                  <StatusBadge status={status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderInventoryCards = () => (
    <div className="space-y-3 p-3 md:hidden">
      {filteredItems.map((item) => {
        const status = getStatus(item.available, item.minSafety);

        const selected = selectedItem?.id === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedItem(item)}
            aria-pressed={selected}
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
              selected
                ? "border-[#795740] bg-[#795740]/5 ring-1 ring-[#795740]/20"
                : "border-stone-200 bg-white hover:bg-stone-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[#795740]">
                {item.isRawMaterial ? (
                  <Boxes className="h-5 w-5" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-stone-900">
                      {item.name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[#795740]">
                      {item.sku}
                    </p>
                  </div>

                  <StatusBadge status={status} />
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {item.category || "Tanpa kategori"}
                  {" · "}
                  {item.location || "Gudang Utama"}
                </p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-3 gap-2">
              <div className="min-w-0 rounded-lg bg-stone-50 p-2">
                <p className="text-[10px] text-muted-foreground">Stok fisik</p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {formatNumber(item.physical)}
                </p>
              </div>

              <div className="min-w-0 rounded-lg bg-stone-50 p-2">
                <p className="text-[10px] text-muted-foreground">Reservasi</p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {formatNumber(item.reserved)}
                </p>
              </div>

              <div className="min-w-0 rounded-lg bg-stone-50 p-2">
                <p className="text-[10px] text-muted-foreground">Tersedia</p>
                <p
                  className={`mt-1 truncate text-sm font-semibold ${
                    item.available <= 0 ? "text-red-600" : "text-stone-900"
                  }`}
                >
                  {formatNumber(item.available)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Total HPP</span>
              <span className="text-sm font-semibold text-stone-900">
                {formatCompactRupiah(item.totalHpp)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-dashed pt-2 text-xs">
              <span className="text-muted-foreground">
                {selected ? "Item terpilih" : "Ketuk untuk memilih"}
              </span>
              {selected && (
                <Badge
                  variant="outline"
                  className="border-[#e5d4c3] bg-[#eee4da] text-[#5f402a]"
                >
                  Dipilih
                </Badge>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderMovementTable = () => (
    <div className="hidden overflow-x-auto md:block">
      <Table className="min-w-[850px]">
        <TableHeader>
          <TableRow className="bg-stone-50 hover:bg-stone-50">
            <TableHead>Tanggal</TableHead>
            <TableHead>Produk / material</TableHead>
            <TableHead>Referensi</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead>Pengguna</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead>Tipe</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {movementLogs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-28 text-center text-sm text-muted-foreground"
              >
                Belum ada riwayat mutasi.
              </TableCell>
            </TableRow>
          ) : (
            movementLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {log.date}
                </TableCell>

                <TableCell>
                  <p className="text-sm font-medium">{log.name}</p>
                  <p className="mt-1 font-mono text-xs text-[#795740]">
                    {log.sku}
                  </p>
                </TableCell>

                <TableCell className="text-sm">{log.ref}</TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {log.location}
                </TableCell>

                <TableCell className="text-sm">{log.user}</TableCell>

                <TableCell className="text-right font-mono text-sm">
                  {log.type === "IN" ? "+" : "−"}
                  {formatNumber(log.qty)}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      log.type === "IN"
                        ? "whitespace-nowrap border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "whitespace-nowrap border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {log.type === "IN" ? (
                      <ArrowDownLeft className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    )}
                    {log.type === "IN" ? "Masuk" : "Keluar"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderMovementCards = () => (
    <div className="space-y-3 p-3 md:hidden">
      {movementLogs.length === 0 ? (
        <div className="py-8 text-center">
          <History className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-3 text-sm font-medium">Belum ada riwayat mutasi</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mutasi stok yang dicatat akan muncul di sini.
          </p>
        </div>
      ) : (
        movementLogs.map((log) => (
          <div key={log.id} className="rounded-xl border border-stone-200 p-3">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  log.type === "IN"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {log.type === "IN" ? (
                  <ArrowDownLeft className="h-5 w-5" />
                ) : (
                  <ArrowUpRight className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">
                      {log.name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[#795740]">
                      {log.sku}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      log.type === "IN"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {log.type === "IN" ? "Masuk" : "Keluar"}
                  </Badge>
                </div>

                <p
                  className={`mt-2 text-base font-semibold ${
                    log.type === "IN" ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {log.type === "IN" ? "+" : "−"}
                  {formatNumber(log.qty)} unit
                </p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Tanggal</p>
                <p className="mt-1 break-words text-xs font-medium">
                  {log.date}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Referensi</p>
                <p className="mt-1 break-all font-mono text-xs font-medium">
                  {log.ref}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Lokasi</p>
                <p className="mt-1 break-words text-xs font-medium">
                  {log.location}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Pengguna</p>
                <p className="mt-1 text-xs font-medium">{log.user}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-5 text-stone-900">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inventaris</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau stok, reservasi, nilai persediaan, dan mutasi barang.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate("products")}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Produk
          </Button>

          <Button
            type="button"
            onClick={() => openMutation("IN")}
            disabled={!selectedItem}
            className={`gap-2 ${PRIMARY_BUTTON_CLASS}`}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Stok masuk
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => openMutation("OUT")}
            disabled={!selectedItem || selectedItem.available <= 0}
            className="col-span-2 gap-2 sm:col-span-1"
          >
            <ArrowUpToLine className="h-4 w-4" />
            Stok keluar
          </Button>
        </div>
      </header>

      <Card className="shadow-none">
        <CardContent className="space-y-4 p-3 sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama item, SKU, atau kategori..."
                aria-label="Cari inventaris"
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>

            <Select
              value={selectedLocation}
              onValueChange={(value) =>
                setSelectedLocation(value ?? "Semua Lokasi")
              }
            >
              <SelectTrigger
                aria-label="Filter lokasi gudang"
                className="w-full bg-white md:w-[220px]"
              >
                <SelectValue placeholder="Semua lokasi" />
              </SelectTrigger>

              <SelectContent>
                {locations.map((itemLocation) => (
                  <SelectItem key={itemLocation} value={itemLocation}>
                    {itemLocation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                {
                  value: "finished",
                  label: "Mebel Jadi",
                  count: finishedGoods.length,
                  icon: Package,
                },
                {
                  value: "raw",
                  label: "Bahan Baku",
                  count: rawMaterials.length,
                  icon: Boxes,
                },
                {
                  value: "history",
                  label: "Riwayat Mutasi",
                  count: movementLogs.length,
                  icon: History,
                },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.value;
              const Icon = tab.icon;

              return (
                <Button
                  key={tab.value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.value)}
                  className={
                    active ? `h-9 gap-2 ${PRIMARY_BUTTON_CLASS}` : "h-9 gap-2"
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      active ? "bg-white/15" : "bg-stone-100"
                    }`}
                  >
                    {tab.count}
                  </span>
                </Button>
              );
            })}

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 gap-1.5 text-xs text-[#795740] hover:text-[#5f402a]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {activeTab !== "history" ? (
        <>
          <Card className="overflow-hidden shadow-none">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b px-4 py-3">
              <CardTitle className="text-sm font-semibold">
                {activeTab === "raw"
                  ? "Daftar bahan baku"
                  : "Daftar mebel jadi"}
              </CardTitle>

              <p className="text-xs text-muted-foreground">
                {filteredItems.length} dari {currentItems.length} item
              </p>
            </CardHeader>

            {filteredItems.length === 0 ? (
              <EmptyInventory
                hasActiveFilters={hasActiveFilters}
                onReset={resetFilters}
              />
            ) : (
              <>
                {renderInventoryTable()}
                {renderInventoryCards()}
              </>
            )}
          </Card>

          <Card className="shadow-none">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="text-sm font-semibold">
                Detail inventaris
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {!selectedItem ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <PackageSearch className="h-8 w-8 text-stone-300" />
                  <p className="mt-3 text-sm font-semibold">
                    Belum ada item dipilih
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pilih item pada daftar inventaris untuk melihat detail stok.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-stone-100 text-[#795740]">
                          {selectedItem.isRawMaterial ? (
                            <Boxes className="h-5 w-5" />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-semibold">
                            {selectedItem.name}
                          </h3>
                          <p className="mt-1 font-mono text-xs text-[#795740]">
                            {selectedItem.sku}
                          </p>
                          <p className="mt-0.5 break-words text-xs text-muted-foreground">
                            {selectedItem.location || "Gudang Utama"}
                            {" · "}
                            {selectedItem.category || "Tanpa kategori"}
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        status={getStatus(
                          selectedItem.available,
                          selectedItem.minSafety,
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        {
                          label: "Stok fisik",
                          value: formatNumber(selectedItem.physical),
                        },
                        {
                          label: "Reservasi",
                          value: formatNumber(selectedItem.reserved),
                        },
                        {
                          label: "Stok tersedia",
                          value: formatNumber(selectedItem.available),
                        },
                        {
                          label: "HPP per unit",
                          value: formatCompactRupiah(selectedItem.hppPerUnit),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="min-w-0 rounded-lg border bg-white p-3"
                        >
                          <p className="text-xs text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-1 break-words text-base font-semibold tracking-tight">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Ketersediaan stok fisik</span>
                        <span>
                          {selectedItem.physical > 0
                            ? Math.round(
                                (selectedItem.available /
                                  selectedItem.physical) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-[#795740] transition-all"
                          style={{
                            width: `${
                              selectedItem.physical > 0
                                ? Math.min(
                                    100,
                                    (selectedItem.available /
                                      selectedItem.physical) *
                                      100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Buffer minimum: {formatNumber(selectedItem.minSafety)}{" "}
                        unit. Total nilai persediaan:{" "}
                        {formatRupiah(selectedItem.totalHpp)}.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 rounded-lg border bg-stone-50/70 p-4">
                    <p className="text-sm font-semibold">Aksi stok</p>
                    <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                      Pilih tindakan untuk item inventaris ini.
                    </p>

                    <Button
                      type="button"
                      onClick={() => openMutation("IN")}
                      className={`w-full gap-2 ${PRIMARY_BUTTON_CLASS}`}
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Stok masuk
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openMutation("OUT")}
                      disabled={selectedItem.available <= 0}
                      className="w-full gap-2"
                    >
                      <ArrowUpToLine className="h-4 w-4" />
                      Stok keluar
                    </Button>

                    <Separator className="my-1" />

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onNavigate("orders")}
                      className="w-full justify-between text-[#795740] hover:text-[#5f402a]"
                    >
                      Buka SPK produksi
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b px-4 py-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Riwayat mutasi
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Catatan stok masuk dan keluar.
              </p>
            </div>

            <Badge variant="secondary">{movementLogs.length} catatan</Badge>
          </CardHeader>

          {renderMovementTable()}
          {renderMovementCards()}
        </Card>
      )}

      <Dialog
        open={isMutationOpen}
        onOpenChange={(open) => {
          setIsMutationOpen(open);
          if (!open) setMutationError("");
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {stockAction === "IN" ? "Stok masuk" : "Stok keluar"}
            </DialogTitle>
            <DialogDescription>
              Catat perubahan jumlah stok dan alasan mutasi.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="rounded-lg border bg-stone-50 p-3">
              <p className="break-words text-sm font-semibold">
                {selectedItem.name}
              </p>
              <p className="mt-1 font-mono text-xs text-[#795740]">
                {selectedItem.sku}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Stok fisik</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatNumber(selectedItem.physical)} unit
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Stok tersedia</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatNumber(selectedItem.available)} unit
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-stone-700">
                Jenis mutasi
              </Label>

              <Select
                value={stockAction}
                onValueChange={(value) => {
                  setStockAction(value as StockAction);
                  setMutationError("");
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue placeholder="Pilih jenis mutasi" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="IN">Stok masuk</SelectItem>
                  <SelectItem value="OUT">Stok keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="inventory-quantity"
                className="text-xs font-medium text-stone-700"
              >
                Jumlah unit
              </Label>

              <Input
                id="inventory-quantity"
                type="number"
                min="1"
                step="1"
                value={stockAmount}
                onChange={(event) => {
                  setStockAmount(event.target.value);
                  setMutationError("");
                }}
                className={`${INPUT_CLASS} font-mono`}
                placeholder="Masukkan jumlah"
              />

              {stockAction === "OUT" && selectedItem && (
                <p className="text-xs text-muted-foreground">
                  Maksimal stok keluar: {formatNumber(selectedItem.available)}{" "}
                  unit.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="inventory-notes"
                className="text-xs font-medium text-stone-700"
              >
                Catatan / alasan
              </Label>

              <Textarea
                id="inventory-notes"
                value={stockNotes}
                onChange={(event) => {
                  setStockNotes(event.target.value);
                  setMutationError("");
                }}
                rows={3}
                placeholder={
                  stockAction === "IN"
                    ? "Contoh: Barang masuk dari supplier"
                    : "Contoh: Pemakaian bahan untuk SPK"
                }
                className="resize-y bg-white text-sm focus-visible:ring-[#795740]"
              />
            </div>

            {mutationError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {mutationError}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMutationOpen(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>

            <Button
              type="button"
              onClick={handleMutation}
              className={`w-full gap-2 sm:w-auto ${PRIMARY_BUTTON_CLASS}`}
            >
              {stockAction === "IN" ? (
                <ArrowDownToLine className="h-4 w-4" />
              ) : (
                <ArrowUpToLine className="h-4 w-4" />
              )}
              Simpan mutasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryView;
