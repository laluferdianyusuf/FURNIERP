import React, { useEffect, useMemo, useState } from "react";
import { Customer, CustomerTier, PageView } from "../types";

interface CustomersViewProps {
  customers: Customer[];
  onNavigate: (page: PageView) => void;
  onSelectCustomerForPOS?: (customerId: string) => void;
  onAddCustomer: (customer: Customer) => void;
  onToast: (msg: string) => void;
}

type DebtFilter = "all" | "has-debt" | "overdue" | "settled";
type TierFilter = "all" | CustomerTier;

const COLORS = {
  text: "#1c1c19",
  secondary: "#50453e",
  muted: "#82746d",
  background: "#f6f3ee",
  surface: "#ffffff",
  border: "#e5e2dd",
  brown: "#5f402a",
  brownHover: "#795740",
  softBrown: "#ffdcc6",
  danger: "#ba1a1a",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-[#e5e2dd] bg-[#f6f3ee] px-3 py-2.5 text-sm text-[#1c1c19] outline-none transition placeholder:text-[#82746d] focus:border-[#795740] focus:bg-white focus:ring-2 focus:ring-[#795740]/10";

const BUTTON_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#5f402a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#795740] focus:outline-none focus:ring-2 focus:ring-[#795740]/30 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2dd] bg-white px-3.5 py-2.5 text-sm font-medium text-[#50453e] transition hover:bg-[#f6f3ee] focus:outline-none focus:ring-2 focus:ring-[#795740]/20";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "?";

const getNextCustomerId = (customers: Customer[]) => {
  const highestId = customers.reduce((highest, customer) => {
    const match = customer.id.match(/^CUST-(\d+)$/i);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `CUST-${String(highestId + 1).padStart(3, "0")}`;
};

const getTierClass = (tier: CustomerTier) => {
  switch (tier) {
    case "Grosir":
      return "border-[#5f402a] bg-[#5f402a] text-white";
    case "Reseller":
      return "border-[#e8c9b4] bg-[#fff2e8] text-[#795740]";
    default:
      return "border-[#e5e2dd] bg-[#f6f3ee] text-[#50453e]";
  }
};

const getDebtStatusLabel = (status: Customer["debtStatus"]) => {
  switch (status) {
    case "overdue":
      return "Jatuh tempo";
    case "has-debt":
      return "Ada piutang";
    case "settled":
      return "Lunas";
    default:
      return "Belum diketahui";
  }
};

const getDebtStatusClass = (status: Customer["debtStatus"]) => {
  switch (status) {
    case "overdue":
      return "bg-[#ffdad6] text-[#ba1a1a]";
    case "has-debt":
      return "bg-[#fff0df] text-[#795740]";
    case "settled":
      return "bg-[#eaf3e9] text-[#356344]";
    default:
      return "bg-[#f0ede9] text-[#50453e]";
  }
};

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div className="min-w-0">
    <label className="mb-1.5 block text-xs font-medium text-[#50453e]">
      {label}
      {required && <span className="ml-1 text-[#ba1a1a]">*</span>}
    </label>
    {children}
    {hint && (
      <p className="mt-1.5 text-[11px] leading-relaxed text-[#82746d]">
        {hint}
      </p>
    )}
  </div>
);

const SectionHeading: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-sm font-semibold text-[#1c1c19]">{title}</h2>
      {description && (
        <p className="mt-1 text-xs text-[#82746d]">{description}</p>
      )}
    </div>
    {action}
  </div>
);

const MetricCard: React.FC<{
  label: string;
  value: string;
  description: string;
  icon: string;
}> = ({ label, value, description, icon }) => (
  <div className="min-w-0 rounded-xl border border-[#e5e2dd] bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-medium text-[#50453e]">{label}</span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f6f3ee] text-[#5f402a]">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </span>
    </div>
    <p className="mt-4 break-words text-xl font-semibold tracking-tight text-[#1c1c19]">
      {value}
    </p>
    <p className="mt-1 text-xs text-[#82746d]">{description}</p>
  </div>
);

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onNavigate,
  onSelectCustomerForPOS,
  onAddCustomer,
  onToast,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [statusPiutangFilter, setStatusPiutangFilter] =
    useState<DebtFilter>("all");
  const [tierTab, setTierTab] = useState<TierFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCustName, setNewCustName] = useState("");
  const [newCustPic, setNewCustPic] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCity, setNewCustCity] = useState("");
  const [newCustTier, setNewCustTier] = useState<CustomerTier>("Retail");
  const [newCustLimit, setNewCustLimit] = useState("");
  const [newCustTerms, setNewCustTerms] = useState("Net 30 Hari");
  const [newCustAddress, setNewCustAddress] = useState("");

  // Pilih pelanggan pertama jika pilihan saat ini sudah tidak tersedia.
  useEffect(() => {
    if (!customers.length) {
      setSelectedCustomerId("");
      return;
    }

    const selectionStillExists = customers.some(
      (customer) => customer.id === selectedCustomerId,
    );

    if (!selectionStillExists) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  // Escape menutup modal pendaftaran.
  useEffect(() => {
    if (!showAddModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAddModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  const customerStats = useMemo(() => {
    const tierCounts: Record<TierFilter, number> = {
      all: customers.length,
      Retail: 0,
      Reseller: 0,
      Grosir: 0,
    };

    let totalReceivables = 0;
    let totalSpend = 0;
    let customersWithDebt = 0;
    let overdueCustomers = 0;
    let creditLimitTotal = 0;

    customers.forEach((customer) => {
      tierCounts[customer.tier] += 1;

      totalReceivables += Math.max(0, customer.activeDebt || 0);
      totalSpend += Math.max(0, customer.totalSpend || 0);
      creditLimitTotal += Math.max(0, customer.creditLimit || 0);

      if ((customer.activeDebt || 0) > 0) {
        customersWithDebt += 1;
      }

      if (customer.debtStatus === "overdue") {
        overdueCustomers += 1;
      }
    });

    return {
      tierCounts,
      totalReceivables,
      totalSpend,
      customersWithDebt,
      overdueCustomers,
      creditLimitTotal,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesTier = tierTab === "all" || customer.tier === tierTab;

      const matchesStatus =
        statusPiutangFilter === "all" ||
        (statusPiutangFilter === "has-debt" &&
          (customer.debtStatus === "has-debt" ||
            customer.debtStatus === "overdue")) ||
        (statusPiutangFilter === "overdue" &&
          customer.debtStatus === "overdue") ||
        (statusPiutangFilter === "settled" &&
          customer.debtStatus === "settled");

      const searchableFields = [
        customer.name,
        customer.company,
        customer.phone,
        customer.city,
        customer.address,
        customer.id,
        customer.picName,
      ];

      const matchesSearch =
        !query ||
        searchableFields.some((field) =>
          String(field ?? "")
            .toLowerCase()
            .includes(query),
        );

      return matchesTier && matchesStatus && matchesSearch;
    });
  }, [customers, searchQuery, statusPiutangFilter, tierTab]);

  const resetCustomerForm = () => {
    setNewCustName("");
    setNewCustPic("");
    setNewCustPhone("");
    setNewCustCity("");
    setNewCustTier("Retail");
    setNewCustLimit("");
    setNewCustTerms("Net 30 Hari");
    setNewCustAddress("");
  };

  const handleSaveCustomer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newCustName.trim();
    const phone = newCustPhone.trim();
    const limit = newCustLimit.trim() === "" ? 0 : Number(newCustLimit);

    if (!name) {
      onToast("Nama pelanggan wajib diisi.");
      return;
    }

    if (!phone) {
      onToast("Nomor telepon atau WhatsApp wajib diisi.");
      return;
    }

    if (!Number.isFinite(limit) || limit < 0) {
      onToast("Limit kredit harus berupa angka nol atau lebih.");
      return;
    }

    const newId = getNextCustomerId(customers);
    const company = name;

    const newEntry: Customer = {
      id: newId,
      name,
      company,
      phone,
      city: newCustCity.trim(),
      address: newCustAddress.trim(),
      tier: newCustTier,
      creditLimit: limit,
      creditUsed: 0,
      totalSpend: 0,
      activeDebt: 0,
      lastTransactionDate: "Belum ada transaksi",
      rating: "Pelanggan baru",
      ordersCount: 0,
      picName: newCustPic.trim() || name,
      email: "",
      debtStatus: "settled",
      terms: newCustTerms,
    };

    onAddCustomer(newEntry);
    setSelectedCustomerId(newId);
    setShowAddModal(false);
    setSearchQuery("");
    setTierTab("all");
    setStatusPiutangFilter("all");
    resetCustomerForm();
    onToast(`Pelanggan ${name} berhasil didaftarkan.`);
  };

  const triggerPosWithCustomer = (customer: Customer) => {
    if (onSelectCustomerForPOS) {
      onSelectCustomerForPOS(customer.id);
    }

    onNavigate("pos");
  };

  const openReceivables = (customer: Customer) => {
    onToast(`Membuka halaman piutang ${customer.name}.`);
    onNavigate("receivables");
  };

  const openAddModal = () => {
    resetCustomerForm();
    setShowAddModal(true);
  };

  return (
    <div className="mt-5 flex w-full flex-col gap-6 pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#82746d]">
            Master Data / Pelanggan
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1c1c19] font-headline">
            Pelanggan
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#50453e]">
            Kelola data pelanggan, tier harga, limit kredit, dan piutang dalam
            satu tempat.
          </p>
        </div>

        <button type="button" onClick={openAddModal} className={BUTTON_PRIMARY}>
          <span className="material-symbols-outlined text-lg">person_add</span>
          Tambah pelanggan
        </button>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total pelanggan"
          value={formatNumber(customers.length)}
          description={`${customerStats.tierCounts.Retail} Retail · ${customerStats.tierCounts.Reseller} Reseller · ${customerStats.tierCounts.Grosir} Grosir`}
          icon="groups"
        />

        <MetricCard
          label="Total piutang"
          value={formatRupiah(customerStats.totalReceivables)}
          description={`${customerStats.customersWithDebt} pelanggan memiliki piutang`}
          icon="account_balance_wallet"
        />

        <MetricCard
          label="Akumulasi belanja"
          value={formatRupiah(customerStats.totalSpend)}
          description="Total belanja seluruh pelanggan"
          icon="payments"
        />

        <MetricCard
          label="Perlu ditindaklanjuti"
          value={formatNumber(customerStats.overdueCustomers)}
          description="Pelanggan dengan piutang jatuh tempo"
          icon="schedule"
        />
      </section>

      {/* Customer directory */}
      <section className="overflow-hidden rounded-xl border border-[#e5e2dd] bg-white">
        <div className="border-b border-[#e5e2dd] p-4 sm:p-5">
          <SectionHeading
            title="Direktori pelanggan"
            description="Cari pelanggan atau persempit daftar berdasarkan tier dan status piutang."
            action={
              <span className="text-xs text-[#82746d]">
                {filteredCustomers.length} hasil
              </span>
            }
          />

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative min-w-0">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#82746d]">
                search
              </span>

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, perusahaan, telepon, kota, atau ID..."
                aria-label="Cari pelanggan"
                className={`${INPUT_CLASS} pl-10 pr-10`}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchQuery("");
                  }
                }}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#82746d] hover:bg-[#e5e2dd] hover:text-[#1c1c19]"
                >
                  <span className="material-symbols-outlined text-lg">
                    close
                  </span>
                </button>
              )}
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <label
                htmlFor="customer-debt-filter"
                className="shrink-0 text-xs text-[#50453e]"
              >
                Piutang
              </label>

              <select
                id="customer-debt-filter"
                value={statusPiutangFilter}
                onChange={(event) =>
                  setStatusPiutangFilter(event.target.value as DebtFilter)
                }
                className={`${INPUT_CLASS} min-w-0 py-2.5 lg:w-48`}
              >
                <option value="all">Semua status</option>
                <option value="has-debt">Ada piutang</option>
                <option value="overdue">Jatuh tempo</option>
                <option value="settled">Lunas</option>
              </select>
            </div>
          </div>

          {/* Tier filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "Semua"],
                ["Retail", "Retail"],
                ["Reseller", "Reseller"],
                ["Grosir", "Grosir"],
              ] as [TierFilter, string][]
            ).map(([tier, label]) => {
              const isActive = tierTab === tier;

              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierTab(tier)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "border-[#5f402a] bg-[#5f402a] text-white"
                      : "border-[#e5e2dd] bg-white text-[#50453e] hover:bg-[#f6f3ee]"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-[#f0ede9] text-[#50453e]"
                    }`}
                  >
                    {customerStats.tierCounts[tier]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {filteredCustomers.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5e2dd] bg-[#faf8f5] text-[11px] font-medium text-[#82746d]">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Pelanggan
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Kontak
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Tier
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Limit kredit
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Total belanja
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">
                    Piutang
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede9]">
                {filteredCustomers.map((customer) => {
                  const isSelected = customer.id === selectedCustomer?.id;

                  const creditLimit = Math.max(0, customer.creditLimit || 0);

                  const creditUsed = Math.max(0, customer.creditUsed || 0);

                  const percentUsed =
                    creditLimit > 0
                      ? Math.min(100, (creditUsed / creditLimit) * 100)
                      : 0;

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      aria-selected={isSelected}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#faf5ef]" : "hover:bg-[#fcfaf7]"
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0e2d6] text-xs font-semibold text-[#5f402a]">
                            {getInitials(customer.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#1c1c19]">
                              {customer.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-[#82746d]">
                              {customer.id} · {customer.company || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <p className="text-xs text-[#1c1c19]">
                          {customer.phone || "—"}
                        </p>
                        <p className="mt-1 text-[11px] text-[#82746d]">
                          {customer.city || "Kota belum diisi"}
                        </p>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${getTierClass(customer.tier)}`}
                        >
                          {customer.tier}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <p className="whitespace-nowrap text-xs font-medium tabular-nums text-[#1c1c19]">
                          {formatRupiah(creditLimit)}
                        </p>
                        {creditLimit > 0 ? (
                          <div className="mt-1.5 ml-auto h-1 w-20 overflow-hidden rounded-full bg-[#e5e2dd]">
                            <div
                              className={`h-full rounded-full ${
                                percentUsed >= 80
                                  ? "bg-[#ba1a1a]"
                                  : "bg-[#795740]"
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        ) : (
                          <p className="mt-1 text-[10px] text-[#82746d]">
                            Tanpa kredit
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-medium tabular-nums text-[#1c1c19]">
                        {formatRupiah(customer.totalSpend || 0)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            (customer.activeDebt || 0) > 0
                              ? "text-[#ba1a1a]"
                              : "text-[#82746d]"
                          }`}
                        >
                          {formatRupiah(customer.activeDebt || 0)}
                        </span>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium ${getDebtStatusClass(customer.debtStatus)}`}
                        >
                          {getDebtStatusLabel(customer.debtStatus)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Buat order untuk ${customer.name}`}
                            title="Buat order"
                            onClick={(event) => {
                              event.stopPropagation();
                              triggerPosWithCustomer(customer);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f402a] transition hover:bg-[#f0ede9]"
                          >
                            <span className="material-symbols-outlined text-lg">
                              add_shopping_cart
                            </span>
                          </button>

                          <button
                            type="button"
                            aria-label={`Buka piutang ${customer.name}`}
                            title="Buka piutang"
                            onClick={(event) => {
                              event.stopPropagation();
                              openReceivables(customer);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f402a] transition hover:bg-[#f0ede9]"
                          >
                            <span className="material-symbols-outlined text-lg">
                              receipt_long
                            </span>
                          </button>

                          <button
                            type="button"
                            aria-label={`Lihat detail ${customer.name}`}
                            title="Lihat detail"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedCustomerId(customer.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#82746d] transition hover:bg-[#f0ede9] hover:text-[#1c1c19]"
                          >
                            <span className="material-symbols-outlined text-lg">
                              chevron_right
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="material-symbols-outlined text-4xl text-[#b8aca2]">
              person_search
            </span>
            <h3 className="mt-3 text-sm font-semibold text-[#1c1c19]">
              Pelanggan tidak ditemukan
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#82746d]">
              Coba ubah kata kunci pencarian atau filter yang digunakan.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTierTab("all");
                setStatusPiutangFilter("all");
              }}
              className={`${BUTTON_SECONDARY} mt-4`}
            >
              Reset filter
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-[#e5e2dd] bg-[#faf8f5] px-4 py-3 text-xs text-[#82746d] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Menampilkan {filteredCustomers.length} dari {customers.length}{" "}
            pelanggan
          </span>
          <span>Data mengikuti daftar pelanggan yang tersedia.</span>
        </div>
      </section>

      {/* Customer detail */}
      {selectedCustomer ? (
        <section className="overflow-hidden rounded-xl border border-[#e5e2dd] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#e5e2dd] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5f402a] text-sm font-semibold text-white">
                {getInitials(selectedCustomer.name)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-base font-semibold text-[#1c1c19]">
                    {selectedCustomer.name}
                  </h2>
                  <span
                    className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-medium ${getTierClass(selectedCustomer.tier)}`}
                  >
                    {selectedCustomer.tier}
                  </span>
                </div>

                <p className="mt-1 break-words text-xs text-[#82746d]">
                  {selectedCustomer.id} · {selectedCustomer.company || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => triggerPosWithCustomer(selectedCustomer)}
                className={BUTTON_PRIMARY}
              >
                <span className="material-symbols-outlined text-lg">
                  add_shopping_cart
                </span>
                Order baru
              </button>

              <button
                type="button"
                onClick={() => openReceivables(selectedCustomer)}
                className={BUTTON_SECONDARY}
              >
                <span className="material-symbols-outlined text-lg">
                  receipt_long
                </span>
                Lihat piutang
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-3">
            {/* Credit information */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-[#50453e]">
                Ringkasan kredit
              </h3>

              <div className="rounded-xl border border-[#e5e2dd] bg-[#faf8f5] p-4">
                <p className="text-xs text-[#82746d]">Limit kredit</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-[#1c1c19]">
                  {formatRupiah(selectedCustomer.creditLimit || 0)}
                </p>

                <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#50453e]">Kredit terpakai</span>
                  <span className="font-medium tabular-nums text-[#1c1c19]">
                    {formatRupiah(selectedCustomer.creditUsed || 0)}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e2dd]">
                  <div
                    className={`h-full rounded-full ${
                      selectedCustomer.creditLimit > 0 &&
                      (selectedCustomer.creditUsed /
                        selectedCustomer.creditLimit) *
                        100 >=
                        80
                        ? "bg-[#ba1a1a]"
                        : "bg-[#795740]"
                    }`}
                    style={{
                      width: `${
                        selectedCustomer.creditLimit > 0
                          ? Math.min(
                              100,
                              Math.max(
                                0,
                                (selectedCustomer.creditUsed /
                                  selectedCustomer.creditLimit) *
                                  100,
                              ),
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex items-start justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Sisa limit</span>
                  <span className="text-right font-medium tabular-nums text-[#1c1c19]">
                    {formatRupiah(
                      Math.max(
                        0,
                        (selectedCustomer.creditLimit || 0) -
                          (selectedCustomer.creditUsed || 0),
                      ),
                    )}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[#e5e2dd] p-4">
                <p className="text-xs text-[#82746d]">Piutang aktif</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-[#ba1a1a]">
                  {formatRupiah(selectedCustomer.activeDebt || 0)}
                </p>
                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${getDebtStatusClass(selectedCustomer.debtStatus)}`}
                  >
                    {getDebtStatusLabel(selectedCustomer.debtStatus)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-[#50453e]">
                Aktivitas pelanggan
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e5e2dd] p-4">
                  <p className="text-xs text-[#82746d]">Total belanja</p>
                  <p className="mt-2 break-words text-base font-semibold tabular-nums text-[#1c1c19]">
                    {formatRupiah(selectedCustomer.totalSpend || 0)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e5e2dd] p-4">
                  <p className="text-xs text-[#82746d]">Jumlah pesanan</p>
                  <p className="mt-2 text-base font-semibold tabular-nums text-[#1c1c19]">
                    {formatNumber(selectedCustomer.ordersCount || 0)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#e5e2dd] p-4">
                <p className="text-xs text-[#82746d]">Transaksi terakhir</p>
                <p className="mt-1 text-sm font-medium text-[#1c1c19]">
                  {selectedCustomer.lastTransactionDate ||
                    "Belum ada transaksi"}
                </p>

                <div className="mt-4 border-t border-[#f0ede9] pt-3">
                  <p className="text-xs text-[#82746d]">Termin pembayaran</p>
                  <p className="mt-1 text-sm font-medium text-[#1c1c19]">
                    {selectedCustomer.terms || "Belum ditentukan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-[#50453e]">
                Informasi kontak
              </h3>

              <div className="divide-y divide-[#f0ede9] rounded-xl border border-[#e5e2dd] px-4">
                <div className="py-3">
                  <p className="text-xs text-[#82746d]">PIC / Pemilik</p>
                  <p className="mt-1 break-words text-sm font-medium text-[#1c1c19]">
                    {selectedCustomer.picName || "Belum diisi"}
                  </p>
                </div>

                <div className="py-3">
                  <p className="text-xs text-[#82746d]">Telepon / WhatsApp</p>
                  {selectedCustomer.phone ? (
                    <a
                      href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-2 break-all text-sm font-medium text-[#5f402a] hover:underline"
                    >
                      <span className="material-symbols-outlined text-base">
                        chat
                      </span>
                      {selectedCustomer.phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-[#82746d]">Belum diisi</p>
                  )}
                </div>

                <div className="py-3">
                  <p className="text-xs text-[#82746d]">Email</p>
                  <p className="mt-1 break-all text-sm text-[#1c1c19]">
                    {selectedCustomer.email || "Belum diisi"}
                  </p>
                </div>

                <div className="py-3">
                  <p className="text-xs text-[#82746d]">Kota</p>
                  <p className="mt-1 break-words text-sm text-[#1c1c19]">
                    {selectedCustomer.city || "Belum diisi"}
                  </p>
                </div>

                <div className="py-3">
                  <p className="text-xs text-[#82746d]">Alamat pengiriman</p>
                  <p className="mt-1 break-words text-sm leading-relaxed text-[#1c1c19]">
                    {selectedCustomer.address || "Belum diisi"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-[#d9d1c9] bg-white px-6 py-10 text-center">
          <span className="material-symbols-outlined text-3xl text-[#82746d]">
            person
          </span>
          <p className="mt-2 text-sm font-medium text-[#1c1c19]">
            Belum ada pelanggan
          </p>
          <p className="mt-1 text-xs text-[#82746d]">
            Tambahkan pelanggan untuk mulai mengelola data dan transaksi.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className={`${BUTTON_PRIMARY} mt-4`}
          >
            <span className="material-symbols-outlined text-lg">
              person_add
            </span>
            Tambah pelanggan
          </button>
        </section>
      )}

      {/* Add customer modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c19]/45 p-3 backdrop-blur-[2px] sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-customer-title"
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e5e2dd] bg-white shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e2dd] px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e2d6] text-[#5f402a]">
                  <span className="material-symbols-outlined text-xl">
                    person_add
                  </span>
                </div>

                <div>
                  <h2
                    id="add-customer-title"
                    className="text-base font-semibold text-[#1c1c19]"
                  >
                    Tambah pelanggan
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#82746d]">
                    Lengkapi informasi dasar dan ketentuan pembayaran.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup formulir"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#82746d] transition hover:bg-[#f0ede9] hover:text-[#1c1c19]"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal form */}
            <form
              onSubmit={handleSaveCustomer}
              className="flex min-h-0 flex-col"
            >
              <div className="overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-[#1c1c19]">
                      Informasi pelanggan
                    </h3>
                    <p className="mt-1 text-[11px] text-[#82746d]">
                      Informasi yang bertanda * wajib diisi.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Nama pelanggan / toko" required>
                      <input
                        autoFocus
                        type="text"
                        required
                        maxLength={120}
                        value={newCustName}
                        onChange={(event) => setNewCustName(event.target.value)}
                        placeholder="Nama pelanggan atau toko"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Nama PIC / pemilik">
                      <input
                        type="text"
                        maxLength={100}
                        value={newCustPic}
                        onChange={(event) => setNewCustPic(event.target.value)}
                        placeholder="Nama penanggung jawab"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Nomor telepon / WhatsApp" required>
                      <input
                        type="tel"
                        required
                        maxLength={30}
                        value={newCustPhone}
                        onChange={(event) =>
                          setNewCustPhone(event.target.value)
                        }
                        placeholder="08xxxxxxxxxx"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Kota / provinsi">
                      <input
                        type="text"
                        maxLength={100}
                        value={newCustCity}
                        onChange={(event) => setNewCustCity(event.target.value)}
                        placeholder="Contoh: Mataram, Kota Mataram"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  <div className="border-t border-[#f0ede9]" />

                  <div>
                    <h3 className="text-xs font-semibold text-[#1c1c19]">
                      Kategori harga
                    </h3>
                    <p className="mt-1 text-[11px] text-[#82746d]">
                      Pilih kategori pelanggan untuk menentukan tier harga pada
                      transaksi POS.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        {
                          value: "Retail",
                          title: "Retail",
                          description: "Harga eceran",
                        },
                        {
                          value: "Reseller",
                          title: "Reseller",
                          description: "Harga mitra",
                        },
                        {
                          value: "Grosir",
                          title: "Grosir",
                          description: "Harga volume",
                        },
                      ] as {
                        value: CustomerTier;
                        title: string;
                        description: string;
                      }[]
                    ).map((tier) => {
                      const isActive = newCustTier === tier.value;

                      return (
                        <button
                          key={tier.value}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setNewCustTier(tier.value)}
                          className={`rounded-xl border p-3 text-left transition ${
                            isActive
                              ? "border-[#5f402a] bg-[#faf3ec] ring-1 ring-[#5f402a]/10"
                              : "border-[#e5e2dd] bg-white hover:bg-[#faf8f5]"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#1c1c19]">
                              {tier.title}
                            </span>
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                isActive
                                  ? "border-[#5f402a] bg-[#5f402a] text-white"
                                  : "border-[#d4ccc3]"
                              }`}
                            >
                              {isActive && (
                                <span className="material-symbols-outlined text-xs">
                                  check
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs text-[#82746d]">
                            {tier.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#f0ede9]" />

                  <div>
                    <h3 className="text-xs font-semibold text-[#1c1c19]">
                      Kredit dan pembayaran
                    </h3>
                    <p className="mt-1 text-[11px] text-[#82746d]">
                      Isi limit hanya jika pelanggan diperbolehkan bertransaksi
                      dengan kredit.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label="Limit kredit (Rp)"
                      hint="Isi 0 atau kosongkan untuk pelanggan tanpa limit kredit."
                    >
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={newCustLimit}
                        onChange={(event) =>
                          setNewCustLimit(event.target.value)
                        }
                        placeholder="0"
                        className={INPUT_CLASS}
                      />
                    </Field>

                    <Field label="Termin pembayaran">
                      <select
                        value={newCustTerms}
                        onChange={(event) =>
                          setNewCustTerms(event.target.value)
                        }
                        className={INPUT_CLASS}
                      >
                        <option value="Cash Before Delivery">
                          Cash Before Delivery (CBD)
                        </option>
                        <option value="DP 50% + Pelunasan Saat Kirim">
                          DP 50% + pelunasan saat kirim
                        </option>
                        <option value="Net 14 Hari">Net 14 hari</option>
                        <option value="Net 30 Hari">Net 30 hari</option>
                        <option value="Net 45 Hari">Net 45 hari</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Alamat pengiriman / workshop">
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={newCustAddress}
                      onChange={(event) =>
                        setNewCustAddress(event.target.value)
                      }
                      placeholder="Alamat lengkap atau catatan lokasi pengiriman"
                      className={`${INPUT_CLASS} resize-y`}
                    />
                  </Field>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] bg-[#faf8f5] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={BUTTON_SECONDARY}
                >
                  Batal
                </button>

                <button type="submit" className={BUTTON_PRIMARY}>
                  <span className="material-symbols-outlined text-lg">
                    save
                  </span>
                  Simpan pelanggan
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
