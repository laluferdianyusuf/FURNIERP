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
  "w-full rounded-md border border-[#ded8cf] bg-transparent px-3 py-2.5 text-sm text-[#29241f] outline-none transition focus:border-[#795740] focus:ring-1 focus:ring-[#795740]/20";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

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
  const color =
    status === "Aman"
      ? "text-[#365d43]"
      : status === "Menipis"
        ? "text-[#946200]"
        : "text-[#b42318]";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

const EmptyState: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
    <Icon name={icon} className="text-3xl text-[#a3978a]" />
    <h3 className="mt-3 text-sm font-medium text-[#29241f]">{title}</h3>
    <p className="mt-1 max-w-sm text-xs leading-5 text-[#81766b]">
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

  useEffect(() => {
    if (activeTab === "history") return;

    setSelectedItem((current) => {
      if (current && filteredItems.some((item) => item.id === current.id)) {
        return filteredItems.find((item) => item.id === current.id) ?? current;
      }

      return filteredItems[0] ?? null;
    });
  }, [activeTab, filteredItems]);

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
    <div className="flex w-full flex-col gap-5 text-[#29241f]">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#81766b]">
          Stok mebel jadi dan bahan baku.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate("products")}
            className={`${buttonBase} border border-[#ded8cf] text-[#50453e] hover:bg-[#f0ede9]`}
          >
            <Icon name="chair" className="text-lg" />
            Produk
          </button>

          <button
            type="button"
            onClick={() => openStockModal("IN")}
            disabled={!selectedItem}
            className={`${buttonBase} bg-[#5f402a] text-white hover:bg-[#795740]`}
          >
            <Icon name="add" className="text-lg" />
            Catat mutasi
          </button>
        </div>
      </header>

      {/* Area utama */}
      <section className="min-w-0">
        {/* Tabs */}
        <div className="flex gap-5 overflow-x-auto border-b border-[#ded8cf]">
          {(
            [
              {
                id: "finished",
                label: "Mebel Jadi",
                count: finishedGoods.length,
              },
              {
                id: "raw",
                label: "Bahan Baku",
                count: rawMaterials.length,
              },
              {
                id: "history",
                label: "Riwayat Mutasi",
                count: null,
              },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 py-3 text-sm transition-colors ${
                  active
                    ? "border-[#5f402a] font-semibold text-[#5f402a]"
                    : "border-transparent text-[#81766b] hover:text-[#29241f]"
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="text-xs text-[#81766b]">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab !== "history" ? (
          <>
            {/* Pencarian langsung di atas tabel */}
            <div className="flex flex-col gap-3 border-b border-[#ded8cf] py-4 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-lg text-[#81766b]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari nama produk, SKU, kategori..."
                  aria-label="Cari persediaan"
                  className="w-full bg-transparent py-2 pl-7 pr-3 text-sm outline-none placeholder:text-[#a3978a]"
                />
              </div>

              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                aria-label="Filter lokasi gudang"
                className="rounded-md border border-[#ded8cf] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#795740]"
              >
                <option value="Semua Lokasi">Semua Lokasi</option>
                <option value="Showroom">Showroom</option>
                <option value="Workshop">Workshop</option>
                <option value="Upholstery">Upholstery</option>
              </select>
            </div>

            {/* Tabel tanpa card */}
            <div className="mt-4">
              <p className="mb-3 text-xs text-[#81766b]">
                {filteredItems.length} item
              </p>

              {filteredItems.length === 0 ? (
                <EmptyState
                  icon="inventory_2"
                  title="Persediaan tidak ditemukan"
                  description="Coba ubah kata kunci atau lokasi gudang."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[740px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-y border-[#ded8cf] text-[10px] uppercase tracking-wider text-[#81766b]">
                        <th className="py-3 pr-4 font-medium">Nama Item</th>
                        <th className="px-3 py-3 font-medium">Lokasi</th>
                        <th className="px-3 py-3 text-right font-medium">
                          Stok Fisik
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Booking
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Tersedia
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Nilai HPP
                        </th>
                        <th className="py-3 pl-3 text-right font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#e9e3da]">
                      {filteredItems.map((item) => {
                        const isSelected = selectedItem?.id === item.id;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedItem(item);
                              }
                            }}
                            tabIndex={0}
                            aria-selected={isSelected}
                            className={`cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#795740] ${
                              isSelected ? "bg-[#f0ede9]" : "hover:bg-[#f8f5f0]"
                            }`}
                          >
                            <td className="py-3.5 pr-4">
                              <div className="flex min-w-0 items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt=""
                                    loading="lazy"
                                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f0ede9] text-[#795740]">
                                    <Icon
                                      name={
                                        item.isRawMaterial
                                          ? "carpenter"
                                          : "chair"
                                      }
                                      className="text-xl"
                                    />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="max-w-[230px] truncate font-medium text-[#29241f]">
                                    {item.name}
                                  </p>
                                  <p className="mt-1 font-mono text-[10px] text-[#81766b]">
                                    {item.sku}
                                  </p>
                                  {item.spec && (
                                    <p className="mt-0.5 max-w-[230px] truncate text-[10px] text-[#81766b]">
                                      {item.spec}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="max-w-[130px] px-3 py-3.5 text-[#65594e]">
                              <span className="block truncate">
                                {item.location}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono">
                              {formatQty(item.physical)}
                              <span className="ml-1 text-[10px] text-[#81766b]">
                                {item.unitType}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono text-[#81766b]">
                              {formatQty(item.reserved)}
                            </td>

                            <td className="whitespace-nowrap px-3 py-3.5 text-right font-mono font-semibold text-[#365d43]">
                              {formatQty(item.available)}
                            </td>

                            <td className="whitespace-nowrap px-3 py-3.5 text-right">
                              <p className="font-mono font-medium text-[#29241f]">
                                {compactMoney(item.totalHpp)}
                              </p>
                              <p className="mt-1 text-[10px] text-[#81766b]">
                                {money(item.hppPerUnit)}/unit
                              </p>
                            </td>

                            <td className="whitespace-nowrap py-3.5 pl-3 text-right">
                              <StatusBadge status={item.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col gap-1 border-t border-[#ded8cf] py-3 text-[11px] text-[#81766b] sm:flex-row sm:justify-between">
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
                <span>Buffer minimum mengikuti pengaturan tiap item.</span>
              </div>
            </div>

            {/* Detail di bawah tabel, bukan sidebar card */}
            {selectedItem && (
              <section className="mt-7 border-t border-[#ded8cf] pt-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {selectedItem.image ? (
                      <img
                        src={selectedItem.image}
                        alt={selectedItem.name}
                        className="h-20 w-20 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-[#f0ede9] text-[#795740]">
                        <Icon name="inventory_2" className="text-3xl" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs text-[#81766b]">
                          {selectedItem.sku}
                        </span>
                        <StatusBadge status={selectedItem.status} />
                      </div>

                      <h3 className="mt-2 text-base font-semibold">
                        {selectedItem.name}
                      </h3>

                      {selectedItem.spec && (
                        <p className="mt-1 text-xs text-[#81766b]">
                          {selectedItem.spec}
                        </p>
                      )}

                      <p className="mt-2 flex items-center gap-1 text-xs text-[#81766b]">
                        <Icon name="location_on" className="text-base" />
                        {selectedItem.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openStockModal("IN")}
                      className={`${buttonBase} border border-[#ded8cf] text-[#365d43] hover:bg-[#f0ede9]`}
                    >
                      <Icon name="south_west" className="text-lg" />
                      Barang Masuk
                    </button>

                    <button
                      type="button"
                      onClick={() => openStockModal("OUT")}
                      disabled={selectedItem.available <= 0}
                      className={`${buttonBase} border border-[#ded8cf] text-[#9b3b32] hover:bg-[#f0ede9]`}
                    >
                      <Icon name="north_east" className="text-lg" />
                      Barang Keluar
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate("orders")}
                      className={`${buttonBase} bg-[#5f402a] text-white hover:bg-[#795740]`}
                    >
                      <Icon name="assignment" className="text-lg" />
                      Buka SPK
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-[#ded8cf] py-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div>
                    <p className="text-xs text-[#81766b]">Stok Fisik</p>
                    <p className="mt-1 font-mono text-sm font-semibold">
                      {formatQty(selectedItem.physical)} {selectedItem.unitType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#81766b]">Direservasi</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-amber-800">
                      {formatQty(selectedItem.reserved)} {selectedItem.unitType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#81766b]">Stok Tersedia</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-[#365d43]">
                      {formatQty(selectedItem.available)}{" "}
                      {selectedItem.unitType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#81766b]">HPP per Unit</p>
                    <p className="mt-1 font-mono text-sm font-semibold">
                      {money(selectedItem.hppPerUnit)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#81766b]">Nilai Total HPP</p>
                    <p className="mt-1 font-mono text-sm font-semibold">
                      {money(selectedItem.totalHpp)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#81766b]">
                    Buffer minimum:{" "}
                    <strong className="font-medium text-[#50453e]">
                      {formatQty(selectedItem.minSafety)}{" "}
                      {selectedItem.unitType}
                    </strong>
                  </p>

                  <div className="flex items-center gap-2 text-xs text-[#81766b]">
                    <span className="h-2 w-2 rounded-full bg-amber-600" />
                    Booking
                    <span className="ml-2 h-2 w-2 rounded-full bg-emerald-700" />
                    Tersedia
                  </div>
                </div>

                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[#e5e2dd]">
                  <div
                    className="h-full bg-amber-600"
                    style={{
                      width: `${
                        selectedItem.physical > 0
                          ? Math.min(
                              100,
                              (selectedItem.reserved / selectedItem.physical) *
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
                              (selectedItem.available / selectedItem.physical) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </section>
            )}
          </>
        ) : (
          /* Riwayat mutasi */
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Riwayat Mutasi</h2>
              <span className="text-xs text-[#81766b]">
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
                <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-y border-[#ded8cf] text-[10px] uppercase tracking-wider text-[#81766b]">
                      <th className="py-3 pr-4 font-medium">Waktu</th>
                      <th className="px-3 py-3 font-medium">Item</th>
                      <th className="px-3 py-3 text-center font-medium">
                        Jenis
                      </th>
                      <th className="px-3 py-3 text-right font-medium">
                        Jumlah
                      </th>
                      <th className="px-3 py-3 font-medium">Referensi</th>
                      <th className="py-3 pl-4 font-medium">Operator</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e9e3da]">
                    {movementLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#f8f5f0]">
                        <td className="whitespace-nowrap py-3.5 pr-4 text-[#81766b]">
                          {log.date}
                        </td>

                        <td className="px-3 py-3.5">
                          <p className="max-w-[190px] truncate font-medium">
                            {log.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-[#81766b]">
                            {log.sku}
                          </p>
                        </td>

                        <td className="px-3 py-3.5 text-center">
                          <span
                            className={
                              log.type === "IN"
                                ? "font-medium text-[#365d43]"
                                : "font-medium text-[#9b3b32]"
                            }
                          >
                            {log.type === "IN" ? "Masuk" : "Keluar"}
                          </span>
                        </td>

                        <td
                          className={`whitespace-nowrap px-3 py-3.5 text-right font-mono font-semibold ${
                            log.type === "IN"
                              ? "text-[#365d43]"
                              : "text-[#9b3b32]"
                          }`}
                        >
                          {log.type === "IN" ? "+" : "−"}
                          {formatQty(log.qty)}
                        </td>

                        <td className="px-3 py-3.5">
                          <p className="max-w-[220px] break-words font-medium text-[#50453e]">
                            {log.ref}
                          </p>
                          <p className="mt-1 text-[10px] text-[#81766b]">
                            {log.location}
                          </p>
                        </td>

                        <td className="whitespace-nowrap py-3.5 pl-4 text-[#81766b]">
                          {log.user}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-3 border-t border-[#ded8cf] py-3 text-[11px] leading-5 text-[#81766b]">
              Riwayat awal masih menggunakan data contoh. Hubungkan ke
              penyimpanan transaksi untuk menyimpan riwayat secara permanen.
            </p>
          </section>
        )}
      </section>

      {/* Modal mutasi stok */}
      {isStockModalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
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
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#ded8cf] bg-[#fcf9f4] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#ded8cf] px-5 py-4">
              <div>
                <h2 id="stock-modal-title" className="text-base font-semibold">
                  Catat Mutasi Stok
                </h2>
                <p className="mt-1 text-xs text-[#81766b]">
                  {selectedItem.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsStockModalOpen(false);
                  setStockError("");
                }}
                aria-label="Tutup modal"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#81766b] hover:bg-[#f0ede9]"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleStockMutation} className="space-y-5 p-5">
              <div className="border-b border-[#ded8cf] pb-4">
                <p className="font-mono text-xs text-[#81766b]">
                  {selectedItem.sku}
                </p>
                <p className="mt-2 text-sm">
                  Stok tersedia:{" "}
                  <strong>
                    {formatQty(selectedItem.available)} {selectedItem.unitType}
                  </strong>
                </p>
              </div>

              <fieldset>
                <legend className="mb-2 text-xs font-semibold">
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
                    className={`${buttonBase} border ${
                      stockActionType === "IN"
                        ? "border-[#365d43] bg-[#edf4ed] text-[#365d43]"
                        : "border-[#ded8cf] text-[#81766b]"
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
                    className={`${buttonBase} border ${
                      stockActionType === "OUT"
                        ? "border-[#9b3b32] bg-[#fbefed] text-[#9b3b32]"
                        : "border-[#ded8cf] text-[#81766b]"
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
                  className="mb-1.5 block text-xs font-semibold"
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
                  <p className="mt-1.5 text-[11px] text-[#81766b]">
                    Maksimal {formatQty(selectedItem.available)}{" "}
                    {selectedItem.unitType}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="stock-reference"
                  className="mb-1.5 block text-xs font-semibold"
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
                  className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"
                >
                  {stockError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-[#ded8cf] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsStockModalOpen(false);
                    setStockError("");
                  }}
                  className={`${buttonBase} border border-[#ded8cf] text-[#50453e] hover:bg-[#f0ede9]`}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className={`${buttonBase} ${
                    stockActionType === "IN"
                      ? "bg-[#365d43] text-white hover:bg-[#294a34]"
                      : "bg-[#9b3b32] text-white hover:bg-[#812e27]"
                  }`}
                >
                  <Icon name="check" className="text-lg" />
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
