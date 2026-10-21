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

const panel = "rounded-xl border border-[#e5e2dd] bg-white";

const button =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2dd] bg-white px-3 py-2 text-xs font-medium text-[#50453e] transition-colors hover:bg-[#f6f3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] disabled:opacity-50";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#5f402a] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#795740] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] focus-visible:ring-offset-2";

const input =
  "w-full rounded-lg border border-[#e5e2dd] bg-white px-3 py-2.5 text-xs text-[#1c1c19] outline-none placeholder:text-[#82746d] focus:border-[#795740] focus:ring-2 focus:ring-[#795740]/10";

const money = (value: number) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

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

const isCancelled = (order: ProductionOrder) => {
  const status = normalized(`${order.status} ${order.currentStage}`);
  return status.includes("batal") || status.includes("cancel");
};

const isCompletedOrder = (order: ProductionOrder) => {
  if (isCancelled(order)) return true;

  const status = normalized(`${order.status} ${order.currentStage}`);

  return status.includes("selesai") || status.includes("terkirim");
};

const isUrgentOrder = (order: ProductionOrder) => {
  const status = normalized(order.status);

  return (
    status.includes("prioritas") ||
    status.includes("terlambat") ||
    status.includes("besok") ||
    status.includes("kritis") ||
    status.includes("mendesak")
  );
};

const getProductionColumn = (
  order: ProductionOrder,
):
  | "Menunggu DP"
  | "Menunggu Bahan"
  | "Sedang Diproduksi"
  | "QC & Siap Kirim"
  | "Dibatalkan" => {
  const value = normalized(`${order.status} ${order.currentStage}`);

  if (isCancelled(order)) return "Dibatalkan";

  if (
    value.includes("selesai") ||
    value.includes("terkirim") ||
    value.includes("siap kirim") ||
    value.includes("pengiriman") ||
    value.includes("qc") ||
    value.includes("finishing") ||
    value.includes("quality")
  ) {
    return "QC & Siap Kirim";
  }

  if (
    value.includes("produksi") ||
    value.includes("perakitan") ||
    value.includes("pengamplasan") ||
    value.includes("pemotongan") ||
    value.includes("pengerjaan")
  ) {
    return "Sedang Diproduksi";
  }

  if (
    value.includes("bahan") ||
    value.includes("material") ||
    value.includes("kayu")
  ) {
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

const Icon: React.FC<{ name: string; className?: string }> = ({
  name,
  className = "",
}) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  note: string;
  icon: string;
  tone?: "default" | "danger" | "success";
}> = ({ label, value, note, icon, tone = "default" }) => (
  <section className={`${panel} min-w-0 p-4`}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-[#82746d]">{label}</p>
      <Icon name={icon} className="text-lg text-[#795740]" />
    </div>

    <p
      className={`mt-3 break-words text-xl font-semibold tracking-tight font-mono-numbers ${
        tone === "danger"
          ? "text-[#a3443f]"
          : tone === "success"
            ? "text-emerald-800"
            : "text-[#1c1c19]"
      }`}
    >
      {value}
    </p>

    <p className="mt-1.5 text-[11px] leading-relaxed text-[#82746d]">{note}</p>
  </section>
);

const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: string;
}> = ({ title, description, icon = "inbox" }) => (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-[#e5e2dd] bg-[#fcf9f4] px-5 py-9 text-center">
    <Icon name={icon} className="text-3xl text-[#82746d]" />
    <p className="mt-3 text-sm font-semibold text-[#1c1c19]">{title}</p>
    <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#82746d]">
      {description}
    </p>
  </div>
);

const SectionHeading: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h3 className="text-sm font-semibold text-[#1c1c19]">{title}</h3>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-[#82746d]">
          {description}
        </p>
      )}
    </div>
    {action}
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
        new Set(orders.map((order) => order.mandor).filter(Boolean)),
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

  const metrics = useMemo(() => {
    const active = orders.filter((order) => !isCompletedOrder(order));

    return {
      activeCount: active.length,
      totalContract: orders.reduce(
        (sum, order) => sum + Number(order.contractPrice || 0),
        0,
      ),
      totalDP: orders.reduce(
        (sum, order) => sum + Number(order.dpPaid || 0),
        0,
      ),
      totalReceivable: orders.reduce(
        (sum, order) => sum + Number(order.remainingDebt || 0),
        0,
      ),
      totalEstimatedHpp: orders.reduce(
        (sum, order) => sum + Number(order.estimatedHpp || 0),
        0,
      ),
      totalActualCost: orders.reduce(
        (sum, order) => sum + Number(order.actualCost || 0),
        0,
      ),
      urgentOrders: active.filter(isUrgentOrder).length,
      stageCounts: {
        "Menunggu DP": active.filter(
          (order) => getProductionColumn(order) === "Menunggu DP",
        ).length,
        "Menunggu Bahan": active.filter(
          (order) => getProductionColumn(order) === "Menunggu Bahan",
        ).length,
        "Sedang Diproduksi": active.filter(
          (order) => getProductionColumn(order) === "Sedang Diproduksi",
        ).length,
        "QC & Siap Kirim": active.filter(
          (order) => getProductionColumn(order) === "QC & Siap Kirim",
        ).length,
      },
    };
  }, [orders]);

  const renderStatus = (order: ProductionOrder) => {
    const urgent = isUrgentOrder(order);
    const cancelled = isCancelled(order);

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
          cancelled
            ? "bg-[#f0ede9] text-[#82746d]"
            : urgent
              ? "bg-[#f9eeeb] text-[#a3443f]"
              : "bg-[#edf5ee] text-[#28734b]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            cancelled
              ? "bg-[#82746d]"
              : urgent
                ? "bg-[#a3443f]"
                : "bg-[#28734b]"
          }`}
        />
        {order.status || "Belum ada status"}
      </span>
    );
  };

  const renderProgress = (order: ProductionOrder, compact = false) => {
    const value = progressOf(order.progressPercent);

    return (
      <div className={compact ? "mt-3" : "mt-2"}>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate text-[#82746d]">
            {order.currentStage || "Tahap belum dicatat"}
          </span>
          <span className="shrink-0 font-semibold text-[#5f402a]">
            {value}%
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f0ede9]"
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

  const columns = [
    "Menunggu DP",
    "Menunggu Bahan",
    "Sedang Diproduksi",
    "QC & Siap Kirim",
  ] as const;

  return (
    <div className="mt-6 flex w-full flex-col gap-5">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#82746d]">
            FurniERP <span className="mx-1">/</span> Operasional
          </p>
          <h1 className="mt-2 font-headline text-2xl font-semibold tracking-tight text-[#1c1c19] sm:text-3xl">
            Pesanan Produksi
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#82746d]">
            Pantau SPK, progres pengerjaan, kebutuhan material, biaya, dan
            piutang pelanggan.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onToast("Fitur ekspor belum terhubung. Data belum diekspor.")
            }
            className={button}
          >
            <Icon name="download" className="text-base" />
            Ekspor
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickTx("spk")}
            className={primaryButton}
          >
            <Icon name="add" className="text-base" />
            Buat SPK
          </button>
        </div>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="SPK aktif"
          value={metrics.activeCount.toLocaleString("id-ID")}
          note={`${orders.length} pesanan tercatat`}
          icon="precision_manufacturing"
        />
        <StatCard
          label="Nilai kontrak"
          value={compactMoney(metrics.totalContract)}
          note={`DP tercatat ${compactMoney(metrics.totalDP)}`}
          icon="payments"
        />
        <StatCard
          label="Biaya produksi riil"
          value={compactMoney(metrics.totalActualCost)}
          note={`Estimasi HPP ${compactMoney(metrics.totalEstimatedHpp)}`}
          icon="calculate"
        />
        <StatCard
          label="Sisa piutang"
          value={compactMoney(metrics.totalReceivable)}
          note={`${metrics.urgentOrders} SPK perlu perhatian`}
          icon="account_balance_wallet"
          tone={metrics.totalReceivable > 0 ? "danger" : "default"}
        />
      </div>

      {/* Production stages */}
      <section className={`${panel} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#1c1c19]">
              Tahapan produksi
            </h2>
            <p className="mt-1 text-xs text-[#82746d]">
              Pesanan aktif berdasarkan tahap pengerjaan.
            </p>
          </div>
          <Icon name="conversion_path" className="text-xl text-[#82746d]" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {columns.map((stage) => (
            <div
              key={stage}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e2dd] px-3 py-3"
            >
              <span className="text-xs leading-relaxed text-[#50453e]">
                {stage}
              </span>
              <span className="text-lg font-semibold text-[#5f402a] font-mono-numbers">
                {metrics.stageCounts[stage]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* List toolbar */}
      <section className={`${panel} p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1c1c19]">
              Daftar pesanan
            </h2>
            <p className="mt-1 text-xs text-[#82746d]">
              {filteredOrders.length} dari {orders.length} pesanan
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-72">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#82746d]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari SPK, pelanggan, material..."
                aria-label="Cari pesanan"
                className={`${input} pl-10`}
              />
            </div>

            <select
              value={mandorFilter}
              onChange={(event) => setMandorFilter(event.target.value)}
              aria-label="Filter mandor"
              className={`${input} sm:w-44`}
            >
              <option value="all">Semua mandor</option>
              {mandors.map((mandor) => (
                <option key={mandor} value={mandor}>
                  {mandor}
                </option>
              ))}
            </select>

            <div className="flex shrink-0 rounded-lg border border-[#e5e2dd] bg-[#f6f3ee] p-1">
              <button
                type="button"
                aria-label="Tampilan daftar"
                aria-pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
                className={`rounded-md px-3 py-2 text-xs ${
                  viewMode === "table"
                    ? "bg-white font-semibold text-[#5f402a] shadow-sm"
                    : "text-[#82746d]"
                }`}
              >
                <Icon name="view_list" className="text-base" />
              </button>
              <button
                type="button"
                aria-label="Tampilan Kanban"
                aria-pressed={viewMode === "kanban"}
                onClick={() => setViewMode("kanban")}
                className={`rounded-md px-3 py-2 text-xs ${
                  viewMode === "kanban"
                    ? "bg-white font-semibold text-[#5f402a] shadow-sm"
                    : "text-[#82746d]"
                }`}
              >
                <Icon name="view_kanban" className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {(searchQuery || mandorFilter !== "all") && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#f0ede9] pt-3">
            <p className="text-[11px] text-[#82746d]">
              Filter sedang diterapkan.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setMandorFilter("all");
              }}
              className="text-xs font-medium text-[#795740] hover:underline"
            >
              Reset filter
            </button>
          </div>
        )}
      </section>

      {/* Kanban */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {columns.map((column) => {
            const columnOrders = filteredOrders.filter(
              (order) => getProductionColumn(order) === column,
            );

            return (
              <section
                key={column}
                className={`${panel} min-w-0 overflow-hidden`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#e5e2dd] bg-[#fcf9f4] px-3 py-3">
                  <h3 className="text-xs font-semibold text-[#50453e]">
                    {column}
                  </h3>
                  <span className="rounded-md bg-[#f0ede9] px-2 py-1 text-[10px] text-[#50453e]">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 p-3">
                  {columnOrders.length === 0 ? (
                    <p className="py-5 text-center text-xs text-[#82746d]">
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
                        className="rounded-lg border border-[#e5e2dd] bg-white p-3 text-left transition-colors hover:border-[#b9a596] hover:bg-[#fcf9f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] font-semibold text-[#795740]">
                            {order.spkNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-[#1c1c19]">
                            {compactMoney(order.contractPrice)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-[#1c1c19]">
                          {order.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#82746d]">
                          {order.customerName}
                        </p>
                        {renderProgress(order, true)}
                      </button>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* List and detail */
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
          <aside className="flex min-w-0 flex-col gap-2 xl:col-span-5">
            {filteredOrders.length === 0 ? (
              <EmptyState
                icon="search_off"
                title="Pesanan tidak ditemukan"
                description="Coba kata pencarian lain atau reset filter."
              />
            ) : (
              filteredOrders.map((order) => {
                const selected = order.id === selectedOrder?.id;

                return (
                  <button
                    key={order.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740] ${
                      selected
                        ? "border-[#b9a596] bg-[#fcf9f4]"
                        : "border-[#e5e2dd] bg-white hover:border-[#b9a596]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-[#795740]">
                            {order.spkNumber}
                          </span>
                          {renderStatus(order)}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-[#1c1c19]">
                          {order.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#50453e]">
                          {order.customerName}
                        </p>
                        <p className="mt-1 text-[11px] text-[#82746d]">
                          Mandor: {order.mandor || "Belum ditentukan"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-[#1c1c19] font-mono-numbers">
                        {compactMoney(order.contractPrice)}
                      </span>
                    </div>
                    {renderProgress(order)}
                    <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-[#e5e2dd] pt-2 text-[10px] text-[#82746d]">
                      <span>Mulai: {order.startDate || "Belum dicatat"}</span>
                      <span>
                        Target: {order.targetDate || "Belum ditentukan"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </aside>

          <main className="flex min-w-0 flex-col gap-4 xl:col-span-7">
            {!selectedOrder ? (
              <EmptyState
                icon="receipt_long"
                title="Belum ada pesanan"
                description="Buat SPK untuk mulai mencatat pekerjaan produksi."
              />
            ) : (
              <>
                {/* Order summary */}
                <section className={`${panel} overflow-hidden`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#795740]">
                            {selectedOrder.spkNumber}
                          </span>
                          {renderStatus(selectedOrder)}
                        </div>
                        <h2 className="mt-2 font-headline text-xl font-semibold text-[#1c1c19]">
                          {selectedOrder.title}
                        </h2>
                        <p className="mt-1 text-xs text-[#82746d]">
                          {selectedOrder.customerName} · Mandor{" "}
                          {selectedOrder.mandor || "belum ditentukan"}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-lg bg-[#f6f3ee] px-3 py-2">
                        <p className="text-[10px] text-[#82746d]">
                          Target selesai
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#1c1c19]">
                          {selectedOrder.targetDate || "Belum ditentukan"}
                        </p>
                      </div>
                    </div>

                    {renderProgress(selectedOrder)}

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="overflow-hidden rounded-lg border border-[#e5e2dd] bg-[#fcf9f4]">
                        {selectedOrder.image ? (
                          <img
                            src={selectedOrder.image}
                            alt={`Referensi ${selectedOrder.title}`}
                            loading="lazy"
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-32 flex-col items-center justify-center text-[#82746d]">
                            <Icon name="chair" className="text-3xl" />
                            <span className="mt-2 text-[10px]">
                              Belum ada gambar
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                        {[
                          ["Dimensi", selectedOrder.dimensions],
                          ["Material", selectedOrder.woodMaterial],
                          ["Aksen", selectedOrder.brassAccent],
                          ["Finishing", selectedOrder.finishing],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="min-w-0 rounded-lg border border-[#e5e2dd] p-3"
                          >
                            <p className="text-[10px] text-[#82746d]">
                              {label}
                            </p>
                            <p className="mt-1 break-words text-xs font-medium text-[#1c1c19]">
                              {value || "Belum dicatat"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <p className="mt-3 rounded-lg bg-[#fcf9f4] p-3 text-xs leading-relaxed text-[#50453e]">
                        <Icon
                          name="info"
                          className="mr-1 align-middle text-base text-[#795740]"
                        />
                        {selectedOrder.notes}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex overflow-x-auto border-t border-[#e5e2dd] px-3"
                    role="tablist"
                    aria-label="Rincian pesanan"
                  >
                    {(
                      [
                        {
                          id: "bom",
                          label: "Material & HPP",
                          icon: "inventory_2",
                        },
                        { id: "timeline", label: "Progres", icon: "timeline" },
                        {
                          id: "financial",
                          label: "Keuangan",
                          icon: "payments",
                        },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium ${
                          activeTab === tab.id
                            ? "border-[#5f402a] text-[#5f402a]"
                            : "border-transparent text-[#82746d] hover:text-[#50453e]"
                        }`}
                      >
                        <Icon name={tab.icon} className="text-base" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* BOM */}
                {activeTab === "bom" && (
                  <section className={`${panel} space-y-4 p-4 sm:p-5`}>
                    <SectionHeading
                      title="Material dan HPP"
                      description="Kebutuhan material serta perbandingan biaya produksi."
                      action={
                        <button
                          type="button"
                          onClick={() =>
                            onToast(
                              "Form tambah material belum terhubung. Data belum diubah.",
                            )
                          }
                          className={button}
                        >
                          <Icon name="add" className="text-base" />
                          Tambah material
                        </button>
                      }
                    />

                    <div className="overflow-x-auto rounded-lg border border-[#e5e2dd]">
                      <table className="w-full min-w-[560px] text-left text-xs">
                        <thead className="bg-[#fcf9f4] text-[10px] text-[#82746d]">
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
                        <tbody className="divide-y divide-[#f0ede9]">
                          {selectedOrder.bom?.length ? (
                            selectedOrder.bom.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-3">
                                  <p className="font-medium text-[#1c1c19]">
                                    {item.name}
                                  </p>
                                  <p className="mt-1 text-[10px] text-[#82746d]">
                                    {item.spec || "Tanpa spesifikasi"}
                                  </p>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  {item.volume}
                                </td>
                                <td className="px-3 py-3 text-right">
                                  {money(item.unitPrice)}
                                </td>
                                <td className="px-3 py-3 text-right font-semibold">
                                  {money(item.subtotal)}
                                </td>
                                <td className="px-3 py-3 text-[#82746d]">
                                  {item.status || "Belum ditentukan"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-8 text-center text-xs text-[#82746d]"
                              >
                                Belum ada material yang dicatat.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-[#fcf9f4] p-4">
                        <p className="text-xs text-[#82746d]">Estimasi HPP</p>
                        <p className="mt-2 text-lg font-semibold text-[#1c1c19] font-mono-numbers">
                          {money(selectedOrder.estimatedHpp)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#fcf9f4] p-4">
                        <p className="text-xs text-[#82746d]">Biaya riil</p>
                        <p className="mt-2 text-lg font-semibold text-[#1c1c19] font-mono-numbers">
                          {money(selectedOrder.actualCost)}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const difference =
                        Number(selectedOrder.actualCost || 0) -
                        Number(selectedOrder.estimatedHpp || 0);

                      return (
                        <div className="flex items-center justify-between gap-3 border-t border-[#e5e2dd] pt-3">
                          <div>
                            <p className="text-xs font-medium text-[#1c1c19]">
                              Selisih biaya
                            </p>
                            <p className="mt-1 text-[10px] text-[#82746d]">
                              Biaya riil dibandingkan estimasi.
                            </p>
                          </div>
                          <p
                            className={`text-sm font-semibold font-mono-numbers ${
                              difference > 0
                                ? "text-[#a3443f]"
                                : difference < 0
                                  ? "text-emerald-800"
                                  : "text-[#1c1c19]"
                            }`}
                          >
                            {difference > 0 ? "+" : ""}
                            {money(difference)}
                          </p>
                        </div>
                      );
                    })()}
                  </section>
                )}

                {/* Timeline */}
                {activeTab === "timeline" && (
                  <section className={`${panel} space-y-4 p-4 sm:p-5`}>
                    <SectionHeading
                      title="Progres produksi"
                      description="Tahapan dan riwayat pengerjaan pesanan."
                    />

                    <div className="rounded-lg bg-[#fcf9f4] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-[#82746d]">
                          Progres keseluruhan
                        </span>
                        <span className="text-sm font-semibold text-[#5f402a]">
                          {progressOf(selectedOrder.progressPercent)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e2dd]">
                        <div
                          className="h-full rounded-full bg-[#795740]"
                          style={{
                            width: `${progressOf(selectedOrder.progressPercent)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-3 text-xs text-[#50453e]">
                        Tahap saat ini:{" "}
                        <span className="font-medium text-[#1c1c19]">
                          {selectedOrder.currentStage || "Belum ditentukan"}
                        </span>
                      </p>
                    </div>

                    {selectedOrder.steps?.length ? (
                      <div className="space-y-2">
                        {selectedOrder.steps.map((step, index) => (
                          <div
                            key={`${selectedOrder.id}-step-${index}`}
                            className="flex gap-3 rounded-lg border border-[#e5e2dd] p-3"
                          >
                            <Icon
                              name={
                                step.completed
                                  ? "check_circle"
                                  : step.current
                                    ? "pending"
                                    : "radio_button_unchecked"
                              }
                              className={`mt-0.5 text-lg ${
                                step.completed
                                  ? "text-emerald-700"
                                  : step.current
                                    ? "text-[#795740]"
                                    : "text-[#b1a69e]"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                                <p className="text-xs font-medium text-[#1c1c19]">
                                  {step.title}
                                </p>
                                <p className="text-[10px] text-[#82746d]">
                                  {step.date || "Belum ada jadwal"}
                                </p>
                              </div>
                              {step.description && (
                                <p className="mt-1 text-xs leading-relaxed text-[#82746d]">
                                  {step.description}
                                </p>
                              )}
                              {step.current && (
                                <span className="mt-2 inline-block text-[10px] font-medium text-[#795740]">
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
                        description="Catatan tahapan pengerjaan belum tersedia untuk pesanan ini."
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
                      <Icon name="edit_note" className="text-base" />
                      Update progres
                    </button>
                  </section>
                )}

                {/* Finance */}
                {activeTab === "financial" && (
                  <section className={`${panel} space-y-4 p-4 sm:p-5`}>
                    <SectionHeading
                      title="Keuangan pesanan"
                      description="Ringkasan kontrak, pembayaran, biaya, dan margin."
                    />

                    <div className="divide-y divide-[#e5e2dd]">
                      {[
                        [
                          "Nilai kontrak",
                          selectedOrder.contractPrice,
                          "default",
                        ],
                        ["DP diterima", selectedOrder.dpPaid, "success"],
                        ["Sisa piutang", selectedOrder.remainingDebt, "danger"],
                        [
                          "Biaya produksi riil",
                          selectedOrder.actualCost,
                          "default",
                        ],
                      ].map(([label, value, tone]) => (
                        <div
                          key={String(label)}
                          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <span className="text-xs text-[#50453e]">
                            {label}
                          </span>
                          <span
                            className={`text-sm font-semibold font-mono-numbers ${
                              tone === "success"
                                ? "text-emerald-800"
                                : tone === "danger"
                                  ? "text-[#a3443f]"
                                  : "text-[#1c1c19]"
                            }`}
                          >
                            {money(Number(value || 0))}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg bg-[#fcf9f4] p-4">
                      <h4 className="text-xs font-semibold text-[#1c1c19]">
                        Perkiraan laba kotor
                      </h4>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-[#82746d]">
                            Berdasarkan estimasi HPP
                          </span>
                          <span className="text-xs font-semibold text-[#1c1c19]">
                            {money(
                              Number(selectedOrder.contractPrice || 0) -
                                Number(selectedOrder.estimatedHpp || 0),
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-[#82746d]">
                            Berdasarkan biaya riil
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              Number(selectedOrder.contractPrice || 0) -
                                Number(selectedOrder.actualCost || 0) <
                              0
                                ? "text-[#a3443f]"
                                : "text-emerald-800"
                            }`}
                          >
                            {money(
                              Number(selectedOrder.contractPrice || 0) -
                                Number(selectedOrder.actualCost || 0),
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-[#e5e2dd] pt-3">
                          <span className="text-xs text-[#50453e]">
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
                      <p className="mt-3 text-[10px] leading-relaxed text-[#82746d]">
                        Perhitungan ini belum memasukkan pajak, biaya
                        administrasi, dan biaya lain yang belum dicatat.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenQuickTx("outflow")}
                      className={primaryButton}
                    >
                      <Icon name="add" className="text-base" />
                      Catat biaya produksi
                    </button>
                  </section>
                )}

                {/* Actions */}
                <section
                  className={`${panel} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <div>
                    <h3 className="text-xs font-semibold text-[#1c1c19]">
                      Tindakan pesanan
                    </h3>
                    <p className="mt-1 text-[11px] text-[#82746d]">
                      Cetak atau catat pengeluaran terkait produksi.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onToast(
                          "Membuka dialog cetak. Pastikan informasi biaya internal tidak ikut tercetak.",
                        );
                        window.print();
                      }}
                      className={button}
                    >
                      <Icon name="print" className="text-base" />
                      Cetak
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenQuickTx("outflow")}
                      className={primaryButton}
                    >
                      <Icon name="add" className="text-base" />
                      Catat biaya
                    </button>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
