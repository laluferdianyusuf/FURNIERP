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

const C = {
  text: "#1c1c19",
  secondary: "#50453e",
  muted: "#82746d",
  background: "#f6f3ee",
  surface: "#ffffff",
  border: "#e5e2dd",
  brown: "#5f402a",
  hover: "#795740",
  danger: "#ba1a1a",
  green: "#356344",
};

const INPUT =
  "w-full min-w-0 rounded-lg border border-[#e5e2dd] bg-white px-3 py-2.5 text-sm text-[#1c1c19] outline-none transition placeholder:text-[#a0968e] focus:border-[#795740] focus:ring-2 focus:ring-[#795740]/10";

const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#5f402a] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#795740] focus:outline-none focus:ring-2 focus:ring-[#795740]/30 disabled:cursor-not-allowed disabled:opacity-50";

const SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e2dd] bg-white px-3.5 py-2.5 text-sm font-medium text-[#50453e] transition hover:bg-[#f6f3ee] focus:outline-none focus:ring-2 focus:ring-[#795740]/20";

const money = (value: number | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? Number(value) : 0);

const number = (value: number | undefined) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? Number(value) : 0);

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "?";

const nextCustomerId = (customers: Customer[]) => {
  const highest = customers.reduce((result, customer) => {
    const match = customer.id.match(/^CUST-(\d+)$/i);
    return match ? Math.max(result, Number(match[1])) : result;
  }, 0);

  return `CUST-${String(highest + 1).padStart(3, "0")}`;
};

const tierStyle = (tier: CustomerTier) => {
  switch (tier) {
    case "Grosir":
      return "bg-[#5f402a] text-white";
    case "Reseller":
      return "bg-[#f7e9dc] text-[#795740]";
    default:
      return "bg-[#f0ede9] text-[#50453e]";
  }
};

const debtLabel = (status: Customer["debtStatus"]) => {
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

const debtStyle = (status: Customer["debtStatus"]) => {
  switch (status) {
    case "overdue":
      return "bg-[#f9e9e7] text-[#a3443f]";
    case "has-debt":
      return "bg-[#fff2e5] text-[#795740]";
    case "settled":
      return "bg-[#edf5ee] text-[#356344]";
    default:
      return "bg-[#f0ede9] text-[#62554b]";
  }
};

const Icon: React.FC<{
  name: string;
  className?: string;
}> = ({ name, className = "" }) => (
  <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
    {name}
  </span>
);

const Metric: React.FC<{
  label: string;
  value: string;
  detail: string;
}> = ({ label, value, detail }) => (
  <div className="min-w-0 rounded-xl border border-[#e5e2dd] bg-white p-4">
    <p className="text-xs text-[#82746d]">{label}</p>
    <p className="mt-2 break-words text-xl font-semibold tracking-tight text-[#1c1c19]">
      {value}
    </p>
    <p className="mt-1 text-xs text-[#82746d]">{detail}</p>
  </div>
);

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
    {hint && <p className="mt-1.5 text-xs text-[#82746d]">{hint}</p>}
  </div>
);

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "Retail", label: "Retail" },
  { value: "Reseller", label: "Reseller" },
  { value: "Grosir", label: "Grosir" },
];

const CUSTOMER_TIERS: {
  value: CustomerTier;
  label: string;
  description: string;
}[] = [
  {
    value: "Retail",
    label: "Retail",
    description: "Harga eceran",
  },
  {
    value: "Reseller",
    label: "Reseller",
    description: "Harga mitra",
  },
  {
    value: "Grosir",
    label: "Grosir",
    description: "Harga volume",
  },
];

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onNavigate,
  onSelectCustomerForPOS,
  onAddCustomer,
  onToast,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [debtFilter, setDebtFilter] = useState<DebtFilter>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
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

  useEffect(() => {
    if (customers.length === 0) {
      setSelectedCustomerId("");
      return;
    }

    const exists = customers.some(
      (customer) => customer.id === selectedCustomerId,
    );

    if (!exists) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (!showAddModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowAddModal(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  const stats = useMemo(() => {
    const tierCounts: Record<TierFilter, number> = {
      all: customers.length,
      Retail: 0,
      Reseller: 0,
      Grosir: 0,
    };

    let receivables = 0;
    let totalSpend = 0;
    let customersWithDebt = 0;
    let overdue = 0;

    customers.forEach((customer) => {
      tierCounts[customer.tier] += 1;
      receivables += Math.max(0, customer.activeDebt || 0);
      totalSpend += Math.max(0, customer.totalSpend || 0);

      if ((customer.activeDebt || 0) > 0) {
        customersWithDebt += 1;
      }

      if (customer.debtStatus === "overdue") {
        overdue += 1;
      }
    });

    return {
      tierCounts,
      receivables,
      totalSpend,
      customersWithDebt,
      overdue,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesTier = tierFilter === "all" || customer.tier === tierFilter;

      const matchesDebt =
        debtFilter === "all" ||
        (debtFilter === "has-debt" &&
          (customer.debtStatus === "has-debt" ||
            customer.debtStatus === "overdue")) ||
        (debtFilter === "overdue" && customer.debtStatus === "overdue") ||
        (debtFilter === "settled" && customer.debtStatus === "settled");

      const fields = [
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
        fields.some((field) =>
          String(field ?? "")
            .toLowerCase()
            .includes(query),
        );

      return matchesTier && matchesDebt && matchesSearch;
    });
  }, [customers, searchQuery, debtFilter, tierFilter]);

  const resetForm = () => {
    setNewCustName("");
    setNewCustPic("");
    setNewCustPhone("");
    setNewCustCity("");
    setNewCustTier("Retail");
    setNewCustLimit("");
    setNewCustTerms("Net 30 Hari");
    setNewCustAddress("");
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
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

    const newId = nextCustomerId(customers);

    const newEntry: Customer = {
      id: newId,
      name,
      company: name,
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
    setTierFilter("all");
    setDebtFilter("all");
    resetForm();
    onToast(`Pelanggan ${name} berhasil didaftarkan.`);
  };

  const openPOS = (customer: Customer) => {
    onSelectCustomerForPOS?.(customer.id);
    onNavigate("pos");
  };

  const openReceivables = (customer: Customer) => {
    onToast(`Membuka halaman piutang ${customer.name}.`);
    onNavigate("receivables");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setDebtFilter("all");
  };

  const activeDebt = Math.max(0, selectedCustomer?.activeDebt || 0);

  const creditLimit = Math.max(0, selectedCustomer?.creditLimit || 0);

  const creditUsed = Math.max(0, selectedCustomer?.creditUsed || 0);

  const creditPercent =
    creditLimit > 0 ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;

  return (
    <div className="mt-5 flex w-full flex-col gap-5 pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#82746d]">
            <span>Operasional</span>
            <Icon name="chevron_right" className="text-sm" />
            <span className="text-[#795740]">Produk</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1c19]">
            Pelanggan
          </h1>

          <p className="mt-1.5 text-sm text-[#62554b]">
            Kelola data pelanggan, kategori harga, dan piutang.
          </p>
        </div>

        <button type="button" onClick={openAddModal} className={PRIMARY}>
          <Icon name="person_add" className="text-lg" />
          Tambah pelanggan
        </button>
      </header>

      {/* Summary */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total pelanggan"
          value={number(customers.length)}
          detail={`${stats.tierCounts.Retail} Retail · ${stats.tierCounts.Reseller} Reseller · ${stats.tierCounts.Grosir} Grosir`}
        />

        <Metric
          label="Total piutang"
          value={money(stats.receivables)}
          detail={`${stats.customersWithDebt} pelanggan memiliki piutang`}
        />

        <Metric
          label="Akumulasi belanja"
          value={money(stats.totalSpend)}
          detail="Total belanja seluruh pelanggan"
        />

        <Metric
          label="Piutang jatuh tempo"
          value={number(stats.overdue)}
          detail="Pelanggan perlu ditindaklanjuti"
        />
      </section>

      {/* Directory */}
      <section className="overflow-hidden rounded-xl border border-[#e5e2dd] bg-white">
        <div className="space-y-4 border-b border-[#e5e2dd] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#1c1c19]">
                Direktori pelanggan
              </h2>
              <p className="mt-1 text-xs text-[#82746d]">
                Pilih pelanggan untuk melihat ringkasan detail.
              </p>
            </div>

            <span className="text-xs text-[#82746d]">
              {filteredCustomers.length} dari {customers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#82746d]"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchQuery("");
                }}
                placeholder="Cari nama, toko, telepon, kota, atau ID..."
                aria-label="Cari pelanggan"
                className={`${INPUT} pl-10`}
              />
            </div>

            <select
              value={debtFilter}
              onChange={(event) =>
                setDebtFilter(event.target.value as DebtFilter)
              }
              aria-label="Filter status piutang"
              className={INPUT}
            >
              <option value="all">Semua status piutang</option>
              <option value="has-debt">Ada piutang</option>
              <option value="overdue">Jatuh tempo</option>
              <option value="settled">Lunas</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TIER_OPTIONS.map((option) => {
              const active = tierFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTierFilter(option.value)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    active
                      ? "border-[#5f402a] bg-[#5f402a] text-white"
                      : "border-[#e5e2dd] bg-white text-[#50453e] hover:bg-[#f6f3ee]"
                  }`}
                >
                  {option.label}
                  <span
                    className={`tabular-nums ${
                      active ? "text-white/75" : "text-[#82746d]"
                    }`}
                  >
                    {stats.tierCounts[option.value]}
                  </span>
                </button>
              );
            })}

            {(searchQuery || tierFilter !== "all" || debtFilter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs font-medium text-[#795740] hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5e2dd] bg-[#faf8f5] text-[11px] text-[#82746d]">
                  <th className="px-4 py-3 font-medium">Pelanggan</th>
                  <th className="px-3 py-3 font-medium">Kontak</th>
                  <th className="px-3 py-3 font-medium">Tier</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Limit kredit
                  </th>
                  <th className="px-3 py-3 text-right font-medium">
                    Total belanja
                  </th>
                  <th className="px-3 py-3 text-right font-medium">Piutang</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede9]">
                {filteredCustomers.map((customer) => {
                  const isSelected = customer.id === selectedCustomer?.id;

                  const limit = Math.max(0, customer.creditLimit || 0);

                  const used = Math.max(0, customer.creditUsed || 0);

                  const usedPercent =
                    limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

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
                            {initials(customer.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#1c1c19]">
                              {customer.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-[#82746d]">
                              {customer.id}
                              {customer.company ? ` · ${customer.company}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <p className="text-xs text-[#30251e]">
                          {customer.phone || "—"}
                        </p>
                        <p className="mt-1 text-[11px] text-[#82746d]">
                          {customer.city || "Kota belum diisi"}
                        </p>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${tierStyle(customer.tier)}`}
                        >
                          {customer.tier}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <p className="whitespace-nowrap text-xs font-medium tabular-nums text-[#1c1c19]">
                          {money(limit)}
                        </p>
                        {limit > 0 && (
                          <div className="ml-auto mt-2 h-1 w-20 overflow-hidden rounded-full bg-[#e5e2dd]">
                            <div
                              className={`h-full rounded-full ${
                                usedPercent >= 80
                                  ? "bg-[#ba1a1a]"
                                  : "bg-[#795740]"
                              }`}
                              style={{ width: `${usedPercent}%` }}
                            />
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right text-xs tabular-nums text-[#30251e]">
                        {money(customer.totalSpend)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            (customer.activeDebt || 0) > 0
                              ? "text-[#a3443f]"
                              : "text-[#82746d]"
                          }`}
                        >
                          {money(customer.activeDebt)}
                        </span>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium ${debtStyle(customer.debtStatus)}`}
                        >
                          {debtLabel(customer.debtStatus)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Buat order"
                            aria-label={`Buat order untuk ${customer.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openPOS(customer);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f402a] hover:bg-[#f0ede9]"
                          >
                            <Icon
                              name="add_shopping_cart"
                              className="text-lg"
                            />
                          </button>

                          <button
                            type="button"
                            title="Lihat piutang"
                            aria-label={`Buka piutang ${customer.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openReceivables(customer);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f402a] hover:bg-[#f0ede9]"
                          >
                            <Icon name="receipt_long" className="text-lg" />
                          </button>

                          <button
                            type="button"
                            title="Lihat detail"
                            aria-label={`Lihat detail ${customer.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedCustomerId(customer.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#82746d] hover:bg-[#f0ede9]"
                          >
                            <Icon name="chevron_right" className="text-lg" />
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
          <div className="px-5 py-12 text-center">
            <Icon name="person_search" className="text-3xl text-[#b8aca2]" />
            <h3 className="mt-2 text-sm font-semibold text-[#1c1c19]">
              Pelanggan tidak ditemukan
            </h3>
            <p className="mt-1 text-xs text-[#82746d]">
              Coba ubah kata kunci atau filter pencarian.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className={`${SECONDARY} mt-4`}
            >
              Reset filter
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t border-[#e5e2dd] bg-[#faf8f5] px-4 py-3 text-xs text-[#82746d] sm:flex-row sm:justify-between">
          <span>
            Menampilkan {filteredCustomers.length} dari {customers.length}{" "}
            pelanggan
          </span>
          <span>Data sesuai daftar pelanggan yang tersedia.</span>
        </div>
      </section>

      {/* Customer detail */}
      {selectedCustomer && (
        <section className="overflow-hidden rounded-xl border border-[#e5e2dd] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#e5e2dd] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#5f402a] text-sm font-semibold text-white">
                {initials(selectedCustomer.name)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-[#1c1c19]">
                    {selectedCustomer.name}
                  </h2>
                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-medium ${tierStyle(selectedCustomer.tier)}`}
                  >
                    {selectedCustomer.tier}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#82746d]">
                  {selectedCustomer.id}
                  {selectedCustomer.company
                    ? ` · ${selectedCustomer.company}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openPOS(selectedCustomer)}
                className={PRIMARY}
              >
                <Icon name="add_shopping_cart" className="text-lg" />
                Order baru
              </button>

              <button
                type="button"
                onClick={() => openReceivables(selectedCustomer)}
                className={SECONDARY}
              >
                <Icon name="receipt_long" className="text-lg" />
                Lihat piutang
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-4 sm:p-5 lg:grid-cols-3">
            {/* Credit */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#50453e]">
                Kredit dan piutang
              </h3>

              <div className="rounded-lg border border-[#e5e2dd] p-4">
                <p className="text-xs text-[#82746d]">Limit kredit</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-[#1c1c19]">
                  {money(creditLimit)}
                </p>

                <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#62554b]">Kredit terpakai</span>
                  <span className="font-medium tabular-nums text-[#1c1c19]">
                    {money(creditUsed)}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5e2dd]">
                  <div
                    className={`h-full rounded-full ${
                      creditPercent >= 80 ? "bg-[#ba1a1a]" : "bg-[#795740]"
                    }`}
                    style={{ width: `${creditPercent}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between gap-3 text-xs">
                  <span className="text-[#82746d]">Sisa limit</span>
                  <span className="text-right font-medium tabular-nums text-[#1c1c19]">
                    {money(Math.max(0, creditLimit - creditUsed))}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-[#e5e2dd] p-4">
                <p className="text-xs text-[#82746d]">Piutang aktif</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[#a3443f]">
                  {money(activeDebt)}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${debtStyle(selectedCustomer.debtStatus)}`}
                >
                  {debtLabel(selectedCustomer.debtStatus)}
                </span>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#50453e]">
                Aktivitas pelanggan
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#e5e2dd] p-4">
                  <p className="text-xs text-[#82746d]">Total belanja</p>
                  <p className="mt-2 break-words text-base font-semibold tabular-nums text-[#1c1c19]">
                    {money(selectedCustomer.totalSpend)}
                  </p>
                </div>

                <div className="rounded-lg border border-[#e5e2dd] p-4">
                  <p className="text-xs text-[#82746d]">Jumlah pesanan</p>
                  <p className="mt-2 text-base font-semibold tabular-nums text-[#1c1c19]">
                    {number(selectedCustomer.ordersCount)}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#f0ede9] rounded-lg border border-[#e5e2dd] px-4">
                <div className="py-3">
                  <p className="text-xs text-[#82746d]">Transaksi terakhir</p>
                  <p className="mt-1 text-sm font-medium text-[#1c1c19]">
                    {selectedCustomer.lastTransactionDate ||
                      "Belum ada transaksi"}
                  </p>
                </div>

                <div className="py-3">
                  <p className="text-xs text-[#82746d]">Termin pembayaran</p>
                  <p className="mt-1 text-sm font-medium text-[#1c1c19]">
                    {selectedCustomer.terms || "Belum ditentukan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#50453e]">
                Informasi kontak
              </h3>

              <div className="divide-y divide-[#f0ede9] rounded-lg border border-[#e5e2dd] px-4">
                <div className="py-3">
                  <p className="text-xs text-[#82746d]">PIC / pemilik</p>
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
                      <Icon name="chat" className="text-base" />
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
      )}

      {!selectedCustomer && customers.length === 0 && (
        <section className="rounded-xl border border-dashed border-[#d9d1c9] bg-white px-6 py-10 text-center">
          <Icon name="person" className="text-3xl text-[#82746d]" />
          <p className="mt-2 text-sm font-medium text-[#1c1c19]">
            Belum ada pelanggan
          </p>
          <p className="mt-1 text-xs text-[#82746d]">
            Tambahkan pelanggan untuk mulai mencatat transaksi.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className={`${PRIMARY} mt-4`}
          >
            <Icon name="person_add" className="text-lg" />
            Tambah pelanggan
          </button>
        </section>
      )}

      {/* Add customer modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c19]/45 p-3 sm:p-5"
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
            className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[#e5e2dd] bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#e5e2dd] px-5 py-4">
              <div>
                <h2
                  id="add-customer-title"
                  className="text-base font-semibold text-[#1c1c19]"
                >
                  Tambah pelanggan
                </h2>
                <p className="mt-1 text-xs text-[#82746d]">
                  Isi data pelanggan dan ketentuan pembayarannya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup formulir"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#82746d] hover:bg-[#f0ede9] hover:text-[#1c1c19]"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={handleSaveCustomer}
              className="flex min-h-0 flex-col"
            >
              <div className="space-y-5 overflow-y-auto px-5 py-5">
                <div>
                  <h3 className="text-xs font-semibold text-[#1c1c19]">
                    Data pelanggan
                  </h3>
                  <p className="mt-1 text-xs text-[#82746d]">
                    Kolom bertanda * wajib diisi.
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
                      className={INPUT}
                    />
                  </Field>

                  <Field label="PIC / pemilik">
                    <input
                      type="text"
                      maxLength={100}
                      value={newCustPic}
                      onChange={(event) => setNewCustPic(event.target.value)}
                      placeholder="Nama penanggung jawab"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Telepon / WhatsApp" required>
                    <input
                      type="tel"
                      required
                      maxLength={30}
                      value={newCustPhone}
                      onChange={(event) => setNewCustPhone(event.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Kota / provinsi">
                    <input
                      type="text"
                      maxLength={100}
                      value={newCustCity}
                      onChange={(event) => setNewCustCity(event.target.value)}
                      placeholder="Contoh: Mataram"
                      className={INPUT}
                    />
                  </Field>
                </div>

                <div className="border-t border-[#f0ede9]" />

                <div>
                  <h3 className="text-xs font-semibold text-[#1c1c19]">
                    Kategori harga
                  </h3>
                  <p className="mt-1 text-xs text-[#82746d]">
                    Kategori ini digunakan saat memilih pelanggan di POS.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {CUSTOMER_TIERS.map((tier) => {
                    const active = newCustTier === tier.value;

                    return (
                      <button
                        key={tier.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setNewCustTier(tier.value)}
                        className={`rounded-lg border p-3 text-left transition ${
                          active
                            ? "border-[#5f402a] bg-[#faf5ef]"
                            : "border-[#e5e2dd] hover:bg-[#faf8f5]"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#1c1c19]">
                            {tier.label}
                          </span>
                          {active && (
                            <Icon
                              name="check_circle"
                              className="text-lg text-[#5f402a]"
                            />
                          )}
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
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Limit kredit (Rp)"
                    hint="Kosongkan atau isi 0 jika tidak menggunakan kredit."
                  >
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={newCustLimit}
                      onChange={(event) => setNewCustLimit(event.target.value)}
                      placeholder="0"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Termin pembayaran">
                    <select
                      value={newCustTerms}
                      onChange={(event) => setNewCustTerms(event.target.value)}
                      className={INPUT}
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
                    onChange={(event) => setNewCustAddress(event.target.value)}
                    placeholder="Alamat lengkap atau catatan pengiriman"
                    className={`${INPUT} resize-y`}
                  />
                </Field>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#e5e2dd] bg-[#faf8f5] px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={SECONDARY}
                >
                  Batal
                </button>

                <button type="submit" className={PRIMARY}>
                  <Icon name="save" className="text-lg" />
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
