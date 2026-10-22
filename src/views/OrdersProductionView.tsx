import React, { useMemo, useState } from "react";
import { PageView, ProductionOrder } from "../types";

interface OrdersProductionViewProps {
  orders: ProductionOrder[];
  onNavigate: (page: PageView) => void;
  onOpenQuickTx: (actionType?: string) => void;
  onToast: (msg: string) => void;
}

type WorkspaceTab = "bom" | "timeline" | "financial";
type ViewMode = "table" | "kanban";

type ProductionStage =
  | "Menunggu DP"
  | "Menunggu Bahan"
  | "Sedang Diproduksi"
  | "QC & Siap Kirim"
  | "Dibatalkan";

const button =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#e5e2dd] bg-white px-3 py-2 text-sm font-medium text-[#50453e] transition hover:bg-[#f6f3ee]";

const primaryButton =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#5f402a] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#795740]";

const input =
  "h-9 w-full rounded-md border border-[#e5e2dd] bg-white px-3 text-sm text-[#1c1c19] outline-none placeholder:text-[#82746d] focus:border-[#795740] focus:ring-1 focus:ring-[#795740]/20";

const money = (value: number) =>
  `Rp ${Math.round(Number(value || 0)).toLocaleString("id-ID")}`;

const compactMoney = (value: number) => {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} jt`;
  }

  return money(amount);
};

const normalized = (value?: string) =>
  String(value || "")
    .toLowerCase()
    .trim();

const isCancelled = (order: ProductionOrder) =>
  /batal|cancel/.test(normalized(`${order.status} ${order.currentStage}`));

const isCompletedOrder = (order: ProductionOrder) =>
  isCancelled(order) ||
  /selesai|terkirim/.test(normalized(`${order.status} ${order.currentStage}`));

const isUrgentOrder = (order: ProductionOrder) =>
  /prioritas|terlambat|besok|kritis|mendesak/.test(normalized(order.status));

const columns: Exclude<ProductionStage, "Dibatalkan">[] = [
  "Menunggu DP",
  "Menunggu Bahan",
  "Sedang Diproduksi",
  "QC & Siap Kirim",
];

const getProductionColumn = (order: ProductionOrder): ProductionStage => {
  const value = normalized(`${order.status} ${order.currentStage}`);

  if (isCancelled(order)) return "Dibatalkan";

  if (
    /selesai|terkirim|siap kirim|pengiriman|qc|finishing|quality/.test(value)
  ) {
    return "QC & Siap Kirim";
  }

  if (/produksi|perakitan|pengamplasan|pemotongan|pengerjaan/.test(value)) {
    return "Sedang Diproduksi";
  }

  if (/bahan|material|kayu/.test(value)) {
    return "Menunggu Bahan";
  }

  return "Menunggu DP";
};

const progressOf = (value: number) =>
  Math.min(100, Math.max(0, Number(value) || 0));

const formatMargin = (contract: number, cost: number) =>
  contract > 0
    ? `${(((contract - cost) / contract) * 100).toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      })}%`
    : "—";

const Icon: React.FC<{
  name: string;
  className?: string;
}> = ({ name, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: string;
}> = ({ title, description, icon = "inbox" }) => (
  <div className="py-10 text-center">
    <Icon name={icon} className="text-3xl text-[#82746d]" />
    <p className="mt-2 text-sm font-medium text-[#1c1c19]">{title}</p>
    <p className="mt-1 text-sm text-[#82746d]">{description}</p>
  </div>
);

export const OrdersProductionView: React.FC<OrdersProductionViewProps> = ({
  orders,
  onNavigate: _onNavigate,
  onOpenQuickTx,
  onToast,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || "");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("bom");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [mandorFilter, setMandorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0],
    [orders, selectedOrderId],
  );

  const mandors = useMemo(
    () =>
      Array.from(
        new Set(
          orders
            .map((order) => order.mandor)
            .filter((mandor): mandor is string => Boolean(mandor)),
        ),
      ).sort((a, b) => a.localeCompare(b, "id")),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const query = normalized(searchQuery);

    return orders.filter((order) => {
      const matchesMandor =
        mandorFilter === "all" || order.mandor === mandorFilter;

      const searchable = [
        order.spkNumber,
        order.title,
        order.customerName,
        order.woodMaterial,
        order.mandor,
        order.status,
        order.currentStage,
      ]
        .join(" ")
        .toLowerCase();

      return matchesMandor && (!query || searchable.includes(query));
    });
  }, [orders, mandorFilter, searchQuery]);

  const renderStatus = (order: ProductionOrder) => {
    const cancelled = isCancelled(order);
    const urgent = isUrgentOrder(order);

    return (
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${
          cancelled
            ? "text-[#82746d]"
            : urgent
              ? "text-[#b5473c]"
              : "text-[#356344]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            cancelled
              ? "bg-[#82746d]"
              : urgent
                ? "bg-[#b5473c]"
                : "bg-[#356344]"
          }`}
        />
        {order.status || "Belum ada status"}
      </span>
    );
  };

  const renderProgress = (order: ProductionOrder) => {
    const value = progressOf(order.progressPercent);

    return (
      <div className="min-w-[130px]">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-[#82746d]">
            {order.currentStage || "Tahap belum dicatat"}
          </span>
          <span className="shrink-0 font-medium text-[#5f402a]">{value}%</span>
        </div>
        <div
          className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eeeae5]"
          role="progressbar"
          aria-label={`Progres ${order.spkNumber}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        >
          <div
            className="h-full rounded-full bg-[#795740] transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  const tabs: {
    id: WorkspaceTab;
    label: string;
    icon: string;
  }[] = [
    { id: "bom", label: "Material & HPP", icon: "inventory_2" },
    { id: "timeline", label: "Progres", icon: "timeline" },
    { id: "financial", label: "Keuangan", icon: "payments" },
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setMandorFilter("all");
  };

  return (
    <div className="w-full space-y-5 text-[#1c1c19]">
      {/* Pencarian dan aksi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#82746d]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nomor SPK, pelanggan, atau material..."
            aria-label="Cari pesanan produksi"
            className={`${input} pl-10`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={mandorFilter}
            onChange={(event) => setMandorFilter(event.target.value)}
            aria-label="Filter mandor"
            className={`${input} w-auto min-w-[145px]`}
          >
            <option value="all">Semua mandor</option>
            {mandors.map((mandor) => (
              <option key={mandor} value={mandor}>
                {mandor}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-md border border-[#e5e2dd]">
            <button
              type="button"
              aria-label="Tampilan tabel"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
              className={`rounded-l-md px-3 py-2 ${
                viewMode === "table"
                  ? "bg-[#f1eee8] text-[#5f402a]"
                  : "text-[#82746d] hover:bg-[#f6f3ee]"
              }`}
            >
              <Icon name="view_list" className="text-[20px]" />
            </button>
            <button
              type="button"
              aria-label="Tampilan Kanban"
              aria-pressed={viewMode === "kanban"}
              onClick={() => setViewMode("kanban")}
              className={`rounded-r-md px-3 py-2 ${
                viewMode === "kanban"
                  ? "bg-[#f1eee8] text-[#5f402a]"
                  : "text-[#82746d] hover:bg-[#f6f3ee]"
              }`}
            >
              <Icon name="view_kanban" className="text-[20px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenQuickTx("spk")}
            className={primaryButton}
          >
            <Icon name="add" className="text-[18px]" />
            Buat SPK
          </button>
        </div>
      </div>

      {(searchQuery || mandorFilter !== "all") && (
        <div className="flex items-center justify-between gap-3 text-xs text-[#82746d]">
          <span>
            Menampilkan {filteredOrders.length} dari {orders.length} pesanan
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="font-medium text-[#5f402a] hover:underline"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Tabel atau Kanban */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto border-y border-[#e5e2dd]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#e5e2dd] text-xs text-[#82746d]">
              <tr>
                <th className="px-3 py-3 font-medium">SPK / Pesanan</th>
                <th className="px-3 py-3 font-medium">Pelanggan</th>
                <th className="px-3 py-3 font-medium">Progres</th>
                <th className="px-3 py-3 text-right font-medium">
                  Nilai kontrak
                </th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeae5]">
              {filteredOrders.map((order) => {
                const selected = order.id === selectedOrder?.id;

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`cursor-pointer transition-colors hover:bg-[#f6f3ee]/70 ${
                      selected ? "bg-[#f6f3ee]" : ""
                    }`}
                  >
                    <td className="px-3 py-3.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedOrderId(order.id);
                        }}
                        className="text-left"
                      >
                        <span className="font-mono text-xs font-semibold text-[#795740]">
                          {order.spkNumber}
                        </span>
                        <span className="mt-1 block max-w-[240px] truncate font-medium text-[#1c1c19]">
                          {order.title}
                        </span>
                        <span className="mt-1 block text-xs text-[#82746d]">
                          Mandor: {order.mandor || "Belum ditentukan"}
                        </span>
                      </button>
                    </td>

                    <td className="px-3 py-3.5 text-[#50453e]">
                      {order.customerName || "—"}
                    </td>

                    <td className="px-3 py-3.5">{renderProgress(order)}</td>

                    <td className="px-3 py-3.5 text-right font-medium tabular-nums">
                      {money(order.contractPrice)}
                    </td>

                    <td className="px-3 py-3.5">{renderStatus(order)}</td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8">
                    <EmptyState
                      icon="search_off"
                      title="Pesanan tidak ditemukan"
                      description="Coba kata pencarian lain atau reset filter."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 2xl:grid-cols-4">
          {columns.map((column) => {
            const columnOrders = filteredOrders.filter(
              (order) => getProductionColumn(order) === column,
            );

            return (
              <section key={column} className="min-w-0">
                <div className="flex items-center justify-between gap-2 border-b border-[#e5e2dd] pb-3">
                  <h3 className="text-sm font-semibold text-[#50453e]">
                    {column}
                  </h3>
                  <span className="text-xs text-[#82746d]">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="divide-y divide-[#e5e2dd]">
                  {columnOrders.length === 0 ? (
                    <p className="py-5 text-sm text-[#82746d]">
                      Tidak ada pesanan.
                    </p>
                  ) : (
                    columnOrders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setViewMode("table");
                        }}
                        className="block w-full py-4 text-left transition hover:bg-[#f6f3ee]"
                      >
                        <span className="font-mono text-xs font-semibold text-[#795740]">
                          {order.spkNumber}
                        </span>
                        <p className="mt-1 text-sm font-medium text-[#1c1c19]">
                          {order.title}
                        </p>
                        <p className="mt-1 text-xs text-[#82746d]">
                          {order.customerName}
                        </p>
                        {renderProgress(order)}
                        <p className="mt-2 text-sm font-medium text-[#50453e]">
                          {compactMoney(order.contractPrice)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Detail pesanan terpilih */}
      <section className="border-t border-[#e5e2dd] pt-5">
        {!selectedOrder ? (
          <EmptyState
            icon="receipt_long"
            title="Belum ada pesanan"
            description="Buat SPK untuk mulai mencatat pekerjaan produksi."
          />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-[#795740]">
                    {selectedOrder.spkNumber}
                  </span>
                  {renderStatus(selectedOrder)}
                </div>
                <h2 className="mt-1.5 text-lg font-semibold text-[#1c1c19]">
                  {selectedOrder.title}
                </h2>
                <p className="mt-1 text-sm text-[#82746d]">
                  {selectedOrder.customerName} · Mandor{" "}
                  {selectedOrder.mandor || "belum ditentukan"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={button}
                >
                  <Icon name="print" className="text-[18px]" />
                  Cetak
                </button>
                <button
                  type="button"
                  onClick={() => onOpenQuickTx("outflow")}
                  className={primaryButton}
                >
                  <Icon name="add" className="text-[18px]" />
                  Catat biaya
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-[#e5e2dd] py-4 sm:grid-cols-4">
              {[
                ["Dimensi", selectedOrder.dimensions],
                ["Material", selectedOrder.woodMaterial],
                ["Aksen", selectedOrder.brassAccent],
                ["Finishing", selectedOrder.finishing],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-xs text-[#82746d]">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium text-[#1c1c19]">
                    {value || "Belum dicatat"}
                  </p>
                </div>
              ))}
            </div>

            {selectedOrder.notes && (
              <p className="py-3 text-sm leading-5 text-[#50453e]">
                <Icon
                  name="info"
                  className="mr-1 align-middle text-base text-[#795740]"
                />
                {selectedOrder.notes}
              </p>
            )}

            {/* Tab detail */}
            <div
              className="mt-4 flex overflow-x-auto border-b border-[#e5e2dd]"
              role="tablist"
              aria-label="Rincian pesanan"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-[#5f402a] text-[#5f402a]"
                      : "border-transparent text-[#82746d] hover:text-[#50453e]"
                  }`}
                >
                  <Icon name={tab.icon} className="text-[18px]" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Material & HPP */}
            {activeTab === "bom" && (
              <div className="space-y-5 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Material dan HPP</h3>
                    <p className="mt-1 text-sm text-[#82746d]">
                      Rincian kebutuhan material dan biaya produksi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onToast(
                        "Form tambah material belum terhubung. Data belum diubah.",
                      )
                    }
                    className={button}
                  >
                    <Icon name="add" className="text-[18px]" />
                    Tambah material
                  </button>
                </div>

                <div className="overflow-x-auto border-y border-[#e5e2dd]">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="border-b border-[#e5e2dd] text-xs text-[#82746d]">
                      <tr>
                        <th className="px-3 py-3 font-medium">Material</th>
                        <th className="px-3 py-3 text-right font-medium">
                          Volume
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Harga
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Subtotal
                        </th>
                        <th className="px-3 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eeeae5]">
                      {selectedOrder.bom?.length ? (
                        selectedOrder.bom.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-3">
                              <p className="font-medium text-[#1c1c19]">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs text-[#82746d]">
                                {item.spec || "Tanpa spesifikasi"}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-right">
                              {item.volume}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {money(item.unitPrice)}
                            </td>
                            <td className="px-3 py-3 text-right font-medium">
                              {money(item.subtotal)}
                            </td>
                            <td className="px-3 py-3 text-xs text-[#82746d]">
                              {item.status || "Belum ditentukan"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-8 text-center text-sm text-[#82746d]"
                          >
                            Belum ada material yang dicatat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 gap-4 border-b border-[#e5e2dd] pb-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-[#82746d]">Estimasi HPP</p>
                    <p className="mt-1 text-base font-semibold">
                      {money(selectedOrder.estimatedHpp)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#82746d]">Biaya riil</p>
                    <p className="mt-1 text-base font-semibold">
                      {money(selectedOrder.actualCost)}
                    </p>
                  </div>
                </div>

                {(() => {
                  const difference =
                    Number(selectedOrder.actualCost || 0) -
                    Number(selectedOrder.estimatedHpp || 0);

                  return (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Selisih biaya</p>
                        <p className="mt-1 text-xs text-[#82746d]">
                          Biaya riil dibandingkan estimasi.
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          difference > 0
                            ? "text-[#b5473c]"
                            : difference < 0
                              ? "text-[#356344]"
                              : "text-[#1c1c19]"
                        }`}
                      >
                        {difference > 0 ? "+" : ""}
                        {money(difference)}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Progres produksi */}
            {activeTab === "timeline" && (
              <div className="space-y-5 py-5">
                <div>
                  <h3 className="text-sm font-semibold">Progres produksi</h3>
                  <p className="mt-1 text-sm text-[#82746d]">
                    Tahapan dan catatan pengerjaan pesanan.
                  </p>
                </div>

                <div className="border-b border-[#e5e2dd] pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#82746d]">
                      Progres keseluruhan
                    </span>
                    <span className="text-sm font-semibold text-[#5f402a]">
                      {progressOf(selectedOrder.progressPercent)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eeeae5]">
                    <div
                      className="h-full rounded-full bg-[#795740]"
                      style={{
                        width: `${progressOf(selectedOrder.progressPercent)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-[#50453e]">
                    Tahap saat ini:{" "}
                    <span className="font-medium text-[#1c1c19]">
                      {selectedOrder.currentStage || "Belum ditentukan"}
                    </span>
                  </p>
                </div>

                {selectedOrder.steps?.length ? (
                  <div className="divide-y divide-[#e5e2dd]">
                    {selectedOrder.steps.map((step, index) => (
                      <div
                        key={`${selectedOrder.id}-step-${index}`}
                        className="flex gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <Icon
                          name={
                            step.completed
                              ? "check_circle"
                              : step.current
                                ? "pending"
                                : "radio_button_unchecked"
                          }
                          className={`mt-0.5 text-[20px] ${
                            step.completed
                              ? "text-[#356344]"
                              : step.current
                                ? "text-[#795740]"
                                : "text-[#b1a69e]"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                            <p className="text-sm font-medium">{step.title}</p>
                            <p className="text-xs text-[#82746d]">
                              {step.date || "Belum ada jadwal"}
                            </p>
                          </div>
                          {step.description && (
                            <p className="mt-1 text-sm leading-5 text-[#82746d]">
                              {step.description}
                            </p>
                          )}
                          {step.current && (
                            <span className="mt-2 inline-block text-xs font-medium text-[#795740]">
                              Tahap aktif
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="timeline"
                    title="Belum ada riwayat produksi"
                    description="Catatan tahapan pengerjaan belum tersedia."
                  />
                )}

                <button
                  type="button"
                  onClick={() =>
                    onToast(
                      "Form pembaruan progres belum terhubung. Belum ada perubahan yang disimpan.",
                    )
                  }
                  className={button}
                >
                  <Icon name="edit_note" className="text-[18px]" />
                  Update progres
                </button>
              </div>
            )}

            {/* Keuangan */}
            {activeTab === "financial" && (
              <div className="space-y-5 py-5">
                <div>
                  <h3 className="text-sm font-semibold">Keuangan pesanan</h3>
                  <p className="mt-1 text-sm text-[#82746d]">
                    Ringkasan pembayaran, biaya, dan margin.
                  </p>
                </div>

                <div className="divide-y divide-[#e5e2dd]">
                  {[
                    {
                      label: "Nilai kontrak",
                      value: selectedOrder.contractPrice,
                      tone: "default",
                    },
                    {
                      label: "DP diterima",
                      value: selectedOrder.dpPaid,
                      tone: "success",
                    },
                    {
                      label: "Sisa piutang",
                      value: selectedOrder.remainingDebt,
                      tone: "danger",
                    },
                    {
                      label: "Biaya produksi riil",
                      value: selectedOrder.actualCost,
                      tone: "default",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="text-sm text-[#50453e]">
                        {item.label}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          item.tone === "success"
                            ? "text-[#356344]"
                            : item.tone === "danger"
                              ? "text-[#b5473c]"
                              : "text-[#1c1c19]"
                        }`}
                      >
                        {money(Number(item.value || 0))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#e5e2dd] pt-4">
                  <h4 className="text-sm font-semibold">
                    Perkiraan laba kotor
                  </h4>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#82746d]">
                        Berdasarkan estimasi HPP
                      </span>
                      <span className="text-sm font-semibold">
                        {money(
                          Number(selectedOrder.contractPrice || 0) -
                            Number(selectedOrder.estimatedHpp || 0),
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#82746d]">
                        Berdasarkan biaya riil
                      </span>
                      {(() => {
                        const profit =
                          Number(selectedOrder.contractPrice || 0) -
                          Number(selectedOrder.actualCost || 0);

                        return (
                          <span
                            className={`text-sm font-semibold ${
                              profit < 0 ? "text-[#b5473c]" : "text-[#356344]"
                            }`}
                          >
                            {money(profit)}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[#e5e2dd] pt-3">
                      <span className="text-sm text-[#50453e]">
                        Margin aktual
                      </span>
                      <span className="text-sm font-semibold text-[#5f402a]">
                        {formatMargin(
                          Number(selectedOrder.contractPrice || 0),
                          Number(selectedOrder.actualCost || 0),
                        )}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#82746d]">
                    Perhitungan belum memasukkan pajak, biaya administrasi, dan
                    pengeluaran lain yang belum dicatat.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenQuickTx("outflow")}
                  className={primaryButton}
                >
                  <Icon name="add" className="text-[18px]" />
                  Catat biaya produksi
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
