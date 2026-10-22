import React, { useEffect, useMemo, useState } from "react";
import { InventoryItem, PageView } from "../types";

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

const COLORS = {
  background: "#f6f3ee",
  surface: "#fcf9f4",
  mutedSurface: "#f0ede9",
  border: "#e5e2dd",
  text: "#1c1c19",
  secondary: "#50453e",
  muted: "#82746d",
  brown: "#5f402a",
  brownHover: "#795740",
};

const money = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

const compactMoney = (value: number) => {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  return money(value);
};

const formatQty = (value: number) =>
  value.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  });

const formatDate = (date: Date) =>
  date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const inputClass =
  "w-full rounded-lg border border-[#e5e2dd] bg-[#fcf9f4] px-3 py-2.5 text-sm text-[#1c1c19] outline-none transition focus:border-[#795740] focus:ring-2 focus:ring-[#795740]/10";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const Icon: React.FC<{ name: string; className?: string }> = ({
  name,
  className = "",
}) => (
  <span
    aria-hidden="true"
    className={`material-symbols-outlined select-none ${className}`}
  >
    {name}
  </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles =
    status === "Aman"
      ? "bg-emerald-50 text-emerald-800"
      : status === "Menipis"
        ? "bg-amber-50 text-amber-800"
        : "bg-rose-50 text-rose-800";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${styles}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  description: string;
  icon: string;
  accent?: "default" | "warning";
}> = ({ label, value, description, icon, accent = "default" }) => (
  <div className="rounded-xl border border-[#e5e2dd] bg-[#fcf9f4] p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-medium leading-5 text-[#82746d]">{label}</p>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          accent === "warning"
            ? "bg-amber-50 text-amber-800"
            : "bg-[#f0ede9] text-[#5f402a]"
        }`}
      >
        <Icon name={icon} className="text-[20px]" />
      </span>
    </div>
    <p
      className={`mt-3 break-words text-xl font-semibold tracking-tight sm:text-2xl ${
        accent === "warning" ? "text-amber-800" : "text-[#1c1c19]"
      }`}
    >
      {value}
    </p>
    <p className="mt-1.5 text-xs leading-5 text-[#82746d]">{description}</p>
  </div>
);

const EmptyState: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0ede9] text-[#5f402a]">
      <Icon name={icon} className="text-2xl" />
    </div>
    <h3 className="mt-4 text-sm font-semibold text-[#1c1c19]">{title}</h3>
    <p className="mt-1 max-w-sm text-xs leading-5 text-[#82746d]">
      {description}
    </p>
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
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(
    inventory[0] ?? null,
  );

  const [localInventory, setLocalInventory] =
    useState<InventoryItem[]>(inventory);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockActionType, setStockActionType] = useState<StockAction>("IN");
  const [stockAmount, setStockAmount] = useState("1");
  const [stockNotes, setStockNotes] = useState("");
  const [stockError, setStockError] = useState("");

  const [movementLogs, setMovementLogs] = useState<MovementLog[]>([
    {
      id: "mov-1",
      date: "23 Okt 2024, 14:15",
      sku: "TB-TRM-200",
      name: "Meja Makan Trembesi 200cm",
      type: "IN",
      qty: 2,
      ref: "SPK-2410-089 Selesai Finishing",
      user: "Mandor Sukirno",
      location: "Showroom Utama",
    },
    {
      id: "mov-2",
      date: "23 Okt 2024, 11:30",
      sku: "RAW-FMO-D28",
      name: "Busa Rebounded Royal D28",
      type: "OUT",
      qty: 3,
      ref: "Penggunaan SPK-2410-112",
      user: "Pak Joko (Upholstery)",
      location: "Gdg Upholstery",
    },
    {
      id: "mov-3",
      date: "22 Okt 2024, 16:40",
      sku: "KR-WBN-01",
      name: "Kursi Makan Wishbone CH24",
      type: "OUT",
      qty: 4,
      ref: "Delivery POS INV-20241022-001",
      user: "Logistik Cargo",
      location: "Showroom & Gdg 1",
    },
    {
      id: "mov-4",
      date: "21 Okt 2024, 09:20",
      sku: "RAW-WOD-JTI",
      name: "Kayu Jati Gelondong TPK Grade A",
      type: "IN",
      qty: 4.8,
      ref: "PO-WOOD-410 UD Rimba Mas",
      user: "Hendra Wijaya",
      location: "Workshop Jepara",
    },
  ]);

  // Sinkronisasi jika inventory diperbarui dari parent.
  useEffect(() => {
    setLocalInventory(inventory);
  }, [inventory]);

  const finishedGoods = useMemo(
    () => localInventory.filter((item) => !item.isRawMaterial),
    [localInventory],
  );

  const rawMaterials = useMemo(
    () => localInventory.filter((item) => item.isRawMaterial),
    [localInventory],
  );

  const totalFinishedValue = useMemo(
    () => finishedGoods.reduce((sum, item) => sum + item.totalHpp, 0),
    [finishedGoods],
  );

  const totalRawValue = useMemo(
    () => rawMaterials.reduce((sum, item) => sum + item.totalHpp, 0),
    [rawMaterials],
  );

  const totalInventoryValue = totalFinishedValue + totalRawValue;

  const criticalItems = useMemo(
    () =>
      localInventory.filter(
        (item) => item.status === "Kritis!" || item.status === "Menipis",
      ),
    [localInventory],
  );

  const totalPhysical = finishedGoods.reduce(
    (sum, item) => sum + item.physical,
    0,
  );

  const totalAvailable = finishedGoods.reduce(
    (sum, item) => sum + item.available,
    0,
  );

  const totalReserved = finishedGoods.reduce(
    (sum, item) => sum + item.reserved,
    0,
  );

  const currentList = activeTab === "finished" ? finishedGoods : rawMaterials;

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return currentList.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesLocation =
        selectedLocation === "Semua Lokasi" ||
        item.location.toLowerCase().includes(selectedLocation.toLowerCase());

      return matchesSearch && matchesLocation;
    });
  }, [currentList, searchQuery, selectedLocation]);

  // Pastikan item detail sesuai dengan daftar aktif.
  useEffect(() => {
    if (activeTab === "history") return;

    setSelectedItem((current) => {
      if (current && filteredItems.some((item) => item.id === current.id)) {
        return filteredItems.find((item) => item.id === current.id) ?? current;
      }

      return filteredItems[0] ?? null;
    });
  }, [activeTab, filteredItems]);

  // Tutup modal dengan tombol Escape.
  useEffect(() => {
    if (!isStockModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStockModalOpen(false);
        setStockError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStockModalOpen]);

  const openStockModal = (action: StockAction) => {
    if (!selectedItem) return;

    setStockActionType(action);
    setStockAmount("1");
    setStockNotes("");
    setStockError("");
    setIsStockModalOpen(true);
  };

  const handleStockMutation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedItem) {
      setStockError("Pilih item yang akan diperbarui.");
      return;
    }

    const qty = Number(stockAmount);

    if (!Number.isFinite(qty) || qty <= 0) {
      setStockError("Masukkan jumlah yang lebih besar dari nol.");
      return;
    }

    if (!stockNotes.trim()) {
      setStockError("Isi keterangan atau nomor referensi mutasi.");
      return;
    }

    const currentItem = localInventory.find(
      (item) => item.id === selectedItem.id,
    );

    if (!currentItem) {
      setStockError("Item tidak ditemukan. Muat ulang daftar persediaan.");
      return;
    }

    if (stockActionType === "OUT" && qty > currentItem.available) {
      setStockError(
        `Stok bebas hanya ${formatQty(currentItem.available)} ${currentItem.unitType}. Stok yang sudah direservasi tidak dapat dikeluarkan.`,
      );
      return;
    }

    const isIncoming = stockActionType === "IN";

    const updatedInventory = localInventory.map((item) => {
      if (item.id !== currentItem.id) return item;

      const newPhysical = isIncoming
        ? item.physical + qty
        : item.physical - qty;

      const newAvailable = Math.max(0, newPhysical - item.reserved);

      let newStatus: StockStatus = "Aman";

      if (newAvailable <= 0) {
        newStatus = "Kritis!";
      } else if (newAvailable < item.minSafety) {
        newStatus = "Menipis";
      }

      return {
        ...item,
        physical: newPhysical,
        available: newAvailable,
        totalHpp: Math.round(newPhysical * item.hppPerUnit),
        status: newStatus,
      };
    });

    const updatedSelectedItem = updatedInventory.find(
      (item) => item.id === currentItem.id,
    );

    if (!updatedSelectedItem) return;

    setLocalInventory(updatedInventory);
    setSelectedItem(updatedSelectedItem);
    onUpdateInventory?.(updatedInventory);

    const newLog: MovementLog = {
      id: `mov-${Date.now()}`,
      date: formatDate(new Date()),
      sku: currentItem.sku,
      name: currentItem.name,
      type: stockActionType,
      qty,
      ref: stockNotes.trim(),
      user: "Owner",
      location: currentItem.location,
    };

    setMovementLogs((logs) => [newLog, ...logs]);
    setIsStockModalOpen(false);
    setStockAmount("1");
    setStockNotes("");
    setStockError("");
  };

  const changeTab = (tab: InventoryTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedLocation("Semua Lokasi");
  };

  return (
    <div className="mt-5 flex w-full flex-col gap-6 text-[#1c1c19] sm:mt-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#82746d]">
            <span>Persediaan</span>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-[#795740]">Stok & Bahan</span>
          </div>

          <h1 className="font-headline text-2xl font-semibold tracking-tight sm:text-3xl">
            Persediaan
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#82746d]">
            Pantau stok mebel jadi, bahan baku, reservasi pesanan, dan
            pergerakan barang di gudang.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate("products")}
            className={`${buttonBase} border border-[#e5e2dd] bg-[#fcf9f4] text-[#50453e] hover:bg-[#f0ede9]`}
          >
            <Icon name="chair" className="text-[18px]" />
            Katalog Produk
          </button>

          <button
            type="button"
            onClick={() => openStockModal("IN")}
            disabled={!selectedItem}
            className={`${buttonBase} bg-[#5f402a] text-white hover:bg-[#795740]`}
          >
            <Icon name="swap_vert" className="text-[18px]" />
            Catat Mutasi
          </button>
        </div>
      </header>

      {/* Summary */}
      <section
        aria-label="Ringkasan persediaan"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Nilai Persediaan"
          value={compactMoney(totalInventoryValue)}
          description={`${compactMoney(totalFinishedValue)} mebel jadi · ${compactMoney(totalRawValue)} bahan baku`}
          icon="inventory_2"
        />

        <StatCard
          label="Stok Mebel Jadi"
          value={`${formatQty(totalPhysical)} unit`}
          description={`${formatQty(totalAvailable)} tersedia · ${formatQty(totalReserved)} direservasi`}
          icon="chair"
        />

        <StatCard
          label="Perlu Perhatian"
          value={`${criticalItems.length} item`}
          description="Item dengan stok menipis atau kritis"
          icon="warning"
          accent="warning"
        />

        <StatCard
          label="Riwayat Mutasi"
          value={`${movementLogs.length} transaksi`}
          description="Jumlah catatan mutasi yang tersedia di halaman ini"
          icon="sync_alt"
        />
      </section>

      {/* Main workspace */}
      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-[#e5e2dd]">
            {(
              [
                {
                  id: "finished",
                  label: "Mebel Jadi",
                  count: finishedGoods.length,
                  icon: "chair",
                },
                {
                  id: "raw",
                  label: "Bahan Baku",
                  count: rawMaterials.length,
                  icon: "carpenter",
                },
                {
                  id: "history",
                  label: "Riwayat Mutasi",
                  count: null,
                  icon: "history",
                },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => changeTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#5f402a] text-[#5f402a]"
                      : "border-transparent text-[#82746d] hover:text-[#50453e]"
                  }`}
                >
                  <Icon name={tab.icon} className="text-[18px]" />
                  {tab.label}
                  {tab.count !== null && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        active
                          ? "bg-[#f0ede9] text-[#5f402a]"
                          : "bg-[#f0ede9] text-[#82746d]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab !== "history" ? (
            <>
              {/* Search and filters */}
              <div className="flex flex-col gap-3 rounded-xl border border-[#e5e2dd] bg-[#fcf9f4] p-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#82746d]"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari nama, SKU, kategori..."
                    aria-label="Cari persediaan"
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <select
                  value={selectedLocation}
                  onChange={(event) => setSelectedLocation(event.target.value)}
                  aria-label="Filter lokasi gudang"
                  className={`${inputClass} sm:w-52`}
                >
                  <option value="Semua Lokasi">Semua Lokasi</option>
                  <option value="Showroom">Showroom</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Upholstery">Upholstery</option>
                </select>
              </div>

              {/* Inventory table */}
              <div className="overflow-hidden rounded-xl border border-[#e5e2dd] bg-[#fcf9f4]">
                <div className="flex items-center justify-between gap-3 border-b border-[#e5e2dd] px-4 py-3.5">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {activeTab === "finished"
                        ? "Daftar Mebel Jadi"
                        : "Daftar Bahan Baku"}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#82746d]">
                      {filteredItems.length} item ditampilkan
                    </p>
                  </div>
                  <span className="hidden text-xs text-[#82746d] sm:block">
                    Pilih baris untuk melihat detail
                  </span>
                </div>

                {filteredItems.length === 0 ? (
                  <EmptyState
                    icon="inventory_2"
                    title="Persediaan tidak ditemukan"
                    description="Coba ubah kata kunci atau pilih lokasi gudang yang berbeda."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#e5e2dd] bg-[#f0ede9] text-[10px] uppercase tracking-wider text-[#82746d]">
                          <th className="px-4 py-3 font-semibold">Item</th>
                          <th className="px-3 py-3 font-semibold">Lokasi</th>
                          <th className="px-3 py-3 text-right font-semibold">
                            Fisik
                          </th>
                          <th className="px-3 py-3 text-right font-semibold">
                            Booking
                          </th>
                          <th className="px-3 py-3 text-right font-semibold">
                            Tersedia
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Nilai HPP
                          </th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#e5e2dd]">
                        {filteredItems.map((item) => {
                          const isSelected = selectedItem?.id === item.id;

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  setSelectedItem(item);
                                }
                              }}
                              tabIndex={0}
                              aria-selected={isSelected}
                              className={`cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#795740] ${
                                isSelected
                                  ? "bg-[#f0ede9]"
                                  : "hover:bg-[#f8f5f0]"
                              }`}
                            >
                              <td className="px-4 py-3.5">
                                <div className="flex min-w-0 items-center gap-3">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt=""
                                      loading="lazy"
                                      className="h-10 w-10 shrink-0 rounded-lg border border-[#e5e2dd] object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
                                      <Icon name="inventory_2" />
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <p className="max-w-[230px] truncate font-semibold text-[#1c1c19]">
                                      {item.name}
                                    </p>
                                    <p className="mt-1 truncate font-mono text-[10px] text-[#82746d]">
                                      {item.sku}
                                    </p>
                                    {item.spec && (
                                      <p className="mt-0.5 max-w-[230px] truncate text-[10px] text-[#82746d]">
                                        {item.spec}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="max-w-[130px] px-3 py-3.5 text-[#50453e]">
                                <span className="block truncate">
                                  {item.location}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono font-medium">
                                {formatQty(item.physical)}
                                <span className="ml-1 text-[10px] text-[#82746d]">
                                  {item.unitType}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-[#82746d]">
                                {formatQty(item.reserved)}
                              </td>

                              <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono font-semibold text-[#365d43]">
                                {formatQty(item.available)}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                <p className="font-mono font-semibold text-[#1c1c19]">
                                  {compactMoney(item.totalHpp)}
                                </p>
                                <p className="mt-1 text-[10px] text-[#82746d]">
                                  {money(item.hppPerUnit)}/unit
                                </p>
                              </td>

                              <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                <StatusBadge status={item.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-col gap-1 border-t border-[#e5e2dd] px-4 py-3 text-[11px] text-[#82746d] sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Total nilai HPP:{" "}
                    <strong className="font-semibold text-[#50453e]">
                      {money(
                        filteredItems.reduce(
                          (sum, item) => sum + item.totalHpp,
                          0,
                        ),
                      )}
                    </strong>
                  </span>
                  <span>
                    Buffer minimum mengikuti pengaturan masing-masing item.
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Movement history */
            <div className="overflow-hidden rounded-xl border border-[#e5e2dd] bg-[#fcf9f4]">
              <div className="flex flex-col gap-1 border-b border-[#e5e2dd] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Riwayat Mutasi</h2>
                  <p className="mt-1 text-xs text-[#82746d]">
                    Catatan barang masuk dan keluar
                  </p>
                </div>
                <span className="text-xs text-[#82746d]">
                  {movementLogs.length} transaksi
                </span>
              </div>

              {movementLogs.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="Belum ada riwayat mutasi"
                  description="Transaksi stok yang dicatat akan muncul di sini."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="border-b border-[#e5e2dd] bg-[#f0ede9] text-[10px] uppercase tracking-wider text-[#82746d]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Waktu</th>
                        <th className="px-3 py-3 font-semibold">Item</th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Jenis
                        </th>
                        <th className="px-3 py-3 text-right font-semibold">
                          Jumlah
                        </th>
                        <th className="px-3 py-3 font-semibold">Referensi</th>
                        <th className="px-4 py-3 font-semibold">Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e2dd]">
                      {movementLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#f8f5f0]">
                          <td className="whitespace-nowrap px-4 py-3.5 text-[#82746d]">
                            {log.date}
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="max-w-[190px] truncate font-semibold text-[#1c1c19]">
                              {log.name}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-[#82746d]">
                              {log.sku}
                            </p>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span
                              className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
                                log.type === "IN"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-rose-50 text-rose-800"
                              }`}
                            >
                              {log.type === "IN" ? "Masuk" : "Keluar"}
                            </span>
                          </td>
                          <td
                            className={`whitespace-nowrap px-3 py-3.5 text-right font-mono font-semibold ${
                              log.type === "IN"
                                ? "text-emerald-800"
                                : "text-rose-800"
                            }`}
                          >
                            {log.type === "IN" ? "+" : "−"}
                            {formatQty(log.qty)}
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="max-w-[220px] break-words font-medium text-[#50453e]">
                              {log.ref}
                            </p>
                            <p className="mt-1 text-[10px] text-[#82746d]">
                              {log.location}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[#82746d]">
                            {log.user}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="border-t border-[#e5e2dd] px-4 py-3 text-[11px] leading-5 text-[#82746d]">
                Riwayat awal masih menggunakan data contoh yang tersedia di
                komponen. Hubungkan ke penyimpanan transaksi untuk riwayat
                permanen.
              </p>
            </div>
          )}
        </div>

        {/* Selected item detail */}
        <aside className="min-w-0 overflow-hidden rounded-xl border border-[#e5e2dd] bg-[#fcf9f4]">
          <div className="flex items-center justify-between border-b border-[#e5e2dd] px-4 py-4">
            <div>
              <h2 className="text-sm font-semibold">Detail Persediaan</h2>
              <p className="mt-1 text-xs text-[#82746d]">
                Informasi dan tindakan stok
              </p>
            </div>
            {selectedItem && <StatusBadge status={selectedItem.status} />}
          </div>

          {!selectedItem ? (
            <EmptyState
              icon="inventory_2"
              title="Belum ada item dipilih"
              description="Pilih item dari daftar persediaan untuk melihat detailnya."
            />
          ) : (
            <div className="space-y-5 p-4">
              {selectedItem.image ? (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="h-44 w-full rounded-lg border border-[#e5e2dd] bg-[#f0ede9] object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
                  <Icon name="inventory_2" className="text-4xl" />
                </div>
              )}

              <div>
                <span className="inline-flex rounded-md bg-[#f0ede9] px-2 py-1 font-mono text-[10px] font-semibold text-[#5f402a]">
                  {selectedItem.sku}
                </span>
                <h3 className="mt-2 text-base font-semibold leading-6 text-[#1c1c19]">
                  {selectedItem.name}
                </h3>
                {selectedItem.spec && (
                  <p className="mt-1 text-xs leading-5 text-[#82746d]">
                    {selectedItem.spec}
                  </p>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#82746d]">
                  <Icon name="location_on" className="text-base" />
                  {selectedItem.location}
                </p>
              </div>

              {/* Stock breakdown */}
              <div className="border-t border-[#e5e2dd] pt-4">
                <h3 className="text-xs font-semibold text-[#50453e]">
                  Ringkasan Stok
                </h3>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Fisik",
                      value: selectedItem.physical,
                      color: "text-[#1c1c19]",
                    },
                    {
                      label: "Booking",
                      value: selectedItem.reserved,
                      color: "text-amber-800",
                    },
                    {
                      label: "Tersedia",
                      value: selectedItem.available,
                      color: "text-emerald-800",
                    },
                  ].map((stock) => (
                    <div
                      key={stock.label}
                      className="rounded-lg border border-[#e5e2dd] bg-[#f8f5f0] p-2.5"
                    >
                      <p className="text-[10px] text-[#82746d]">
                        {stock.label}
                      </p>
                      <p
                        className={`mt-1 break-words font-mono text-sm font-semibold ${stock.color}`}
                      >
                        {formatQty(stock.value)}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-[#82746d]">
                        {selectedItem.unitType}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#82746d]">Alokasi stok fisik</span>
                    <span className="font-medium text-[#50453e]">
                      {selectedItem.physical > 0
                        ? `${Math.round(
                            (selectedItem.reserved / selectedItem.physical) *
                              100,
                          )}% dipesan`
                        : "0% dipesan"}
                    </span>
                  </div>

                  <div className="flex h-2 overflow-hidden rounded-full bg-[#e5e2dd]">
                    <div
                      className="h-full bg-amber-600"
                      style={{
                        width: `${
                          selectedItem.physical > 0
                            ? Math.min(
                                100,
                                (selectedItem.reserved /
                                  selectedItem.physical) *
                                  100,
                              )
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="h-full bg-emerald-700"
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
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#82746d]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-amber-600" />
                      Direservasi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-emerald-700" />
                      Bebas digunakan
                    </span>
                  </div>
                </div>
              </div>

              {/* Valuation */}
              <div className="space-y-3 border-t border-[#e5e2dd] pt-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">HPP per unit</span>
                  <span className="text-right font-mono font-medium">
                    {money(selectedItem.hppPerUnit)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Nilai total HPP</span>
                  <span className="text-right font-mono font-semibold text-[#1c1c19]">
                    {money(selectedItem.totalHpp)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Buffer minimum</span>
                  <span className="font-mono font-medium">
                    {formatQty(selectedItem.minSafety)} {selectedItem.unitType}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 border-t border-[#e5e2dd] pt-4">
                <button
                  type="button"
                  onClick={() => openStockModal("IN")}
                  className={`${buttonBase} w-full border border-[#e5e2dd] bg-[#f8f5f0] text-[#365d43] hover:bg-emerald-50`}
                >
                  <Icon name="south_west" className="text-[18px]" />
                  Catat Barang Masuk
                </button>

                <button
                  type="button"
                  onClick={() => openStockModal("OUT")}
                  disabled={selectedItem.available <= 0}
                  className={`${buttonBase} w-full border border-[#e5e2dd] bg-[#f8f5f0] text-[#9b3b32] hover:bg-rose-50`}
                >
                  <Icon name="north_east" className="text-[18px]" />
                  Catat Barang Keluar
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate("orders")}
                  className={`${buttonBase} w-full bg-[#5f402a] text-white hover:bg-[#795740]`}
                >
                  <Icon name="assignment" className="text-[18px]" />
                  Buka SPK Workshop
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* Stock mutation modal */}
      {isStockModalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsStockModalOpen(false);
              setStockError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#e5e2dd] bg-[#fcf9f4] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#e5e2dd] px-5 py-4">
              <div>
                <h2
                  id="stock-modal-title"
                  className="text-base font-semibold text-[#1c1c19]"
                >
                  Catat Mutasi Stok
                </h2>
                <p className="mt-1 text-xs text-[#82746d]">
                  Catat pergerakan fisik persediaan
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStockModalOpen(false);
                  setStockError("");
                }}
                aria-label="Tutup modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#82746d] transition hover:bg-[#f0ede9] hover:text-[#1c1c19]"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleStockMutation} className="space-y-5 p-5">
              <div className="flex items-center gap-3 rounded-xl border border-[#e5e2dd] bg-[#f8f5f0] p-3">
                {selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#5f402a]">
                    <Icon name="inventory_2" className="text-xl" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1c1c19]">
                    {selectedItem.name}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-[#82746d]">
                    {selectedItem.sku}
                  </p>
                  <p className="mt-1 text-[11px] text-[#82746d]">
                    Tersedia: {formatQty(selectedItem.available)}{" "}
                    {selectedItem.unitType}
                  </p>
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-[#50453e]">
                  Jenis Mutasi
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStockActionType("IN");
                      setStockError("");
                    }}
                    aria-pressed={stockActionType === "IN"}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-semibold transition ${
                      stockActionType === "IN"
                        ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                        : "border-[#e5e2dd] bg-[#fcf9f4] text-[#82746d] hover:bg-[#f0ede9]"
                    }`}
                  >
                    <Icon name="south_west" className="text-lg" />
                    Barang Masuk
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStockActionType("OUT");
                      setStockError("");
                    }}
                    aria-pressed={stockActionType === "OUT"}
                    disabled={selectedItem.available <= 0}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-xs font-semibold transition disabled:opacity-40 ${
                      stockActionType === "OUT"
                        ? "border-rose-700 bg-rose-50 text-rose-800"
                        : "border-[#e5e2dd] bg-[#fcf9f4] text-[#82746d] hover:bg-[#f0ede9]"
                    }`}
                  >
                    <Icon name="north_east" className="text-lg" />
                    Barang Keluar
                  </button>
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="stock-quantity"
                  className="mb-1.5 block text-xs font-semibold text-[#50453e]"
                >
                  Jumlah ({selectedItem.unitType})
                </label>
                <input
                  id="stock-quantity"
                  type="number"
                  step="any"
                  min="0.01"
                  max={
                    stockActionType === "OUT"
                      ? selectedItem.available
                      : undefined
                  }
                  required
                  value={stockAmount}
                  onChange={(event) => {
                    setStockAmount(event.target.value);
                    setStockError("");
                  }}
                  className={inputClass}
                  placeholder="Masukkan jumlah"
                />
                {stockActionType === "OUT" && (
                  <p className="mt-1.5 text-[11px] text-[#82746d]">
                    Maksimal barang keluar: {formatQty(selectedItem.available)}{" "}
                    {selectedItem.unitType}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="stock-reference"
                  className="mb-1.5 block text-xs font-semibold text-[#50453e]"
                >
                  Keterangan / Nomor Referensi
                </label>
                <textarea
                  id="stock-reference"
                  required
                  rows={3}
                  value={stockNotes}
                  onChange={(event) => {
                    setStockNotes(event.target.value);
                    setStockError("");
                  }}
                  className={`${inputClass} resize-y`}
                  placeholder={
                    stockActionType === "IN"
                      ? "Contoh: Pembelian bahan baku atau SPK selesai"
                      : "Contoh: Penggunaan workshop atau pengiriman pesanan"
                  }
                />
              </div>

              {stockError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"
                >
                  <Icon name="error" className="mt-0.5 text-base" />
                  <span>{stockError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockModalOpen(false);
                    setStockError("");
                  }}
                  className={`${buttonBase} border border-[#e5e2dd] bg-[#f0ede9] text-[#50453e] hover:bg-[#e5e2dd]`}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className={`${buttonBase} ${
                    stockActionType === "IN"
                      ? "bg-emerald-700 text-white hover:bg-emerald-800"
                      : "bg-rose-700 text-white hover:bg-rose-800"
                  }`}
                >
                  <Icon name="check" className="text-[18px]" />
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
