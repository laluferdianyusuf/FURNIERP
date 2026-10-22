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

const INPUT =
  "w-full min-w-0 rounded-md border border-[#e5e2dd] bg-white px-3 py-2 text-sm text-[#1c1c19] outline-none transition placeholder:text-[#a0968e] focus:border-[#795740]";

const PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#5f402a] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#795740] disabled:cursor-not-allowed disabled:opacity-50";

const SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-[#e5e2dd] px-3 py-2 text-sm font-medium text-[#50453e] transition hover:bg-[#f6f3ee]";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const number = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "?";

const nextCustomerId = (customers: Customer[]) => {
  const maxId = customers.reduce((max, customer) => {
    const match = customer.id.match(/^CUST-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `CUST-${String(maxId + 1).padStart(3, "0")}`;
};

const debtLabel = (status?: string) => {
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

const debtStyle = (status?: string) => {
  switch (status) {
    case "overdue":
      return "text-red-700";
    case "has-debt":
      return "text-amber-700";
    case "settled":
      return "text-green-700";
    default:
      return "text-[#82746d]";
  }
};

const tierStyle = (tier: CustomerTier) => {
  switch (tier) {
    case "Grosir":
      return "bg-[#5f402a] text-white";
    case "Reseller":
      return "bg-[#eee4da] text-[#5f402a]";
    default:
      return "bg-[#f1efeb] text-[#50453e]";
  }
};

const Icon: React.FC<{ name: string; className?: string }> = ({
  name,
  className = "",
}) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
    {name}
  </span>
);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, children, required }) => (
  <label className="block min-w-0">
    <span className="mb-1.5 block text-sm font-medium text-[#50453e]">
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
    </span>
    {children}
  </label>
);

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "Semua kategori" },
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
  const [debtFilter, setDebtFilter] = useState<DebtFilter>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCustName, setNewCustName] = useState("");
  const [newCustPic, setNewCustPic] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCity, setNewCustCity] = useState("");
  const [newCustTier, setNewCustTier] = useState<CustomerTier>("Retail");
  const [newCustLimit, setNewCustLimit] = useState("0");
  const [newCustTerms, setNewCustTerms] = useState("Net 30 Hari");
  const [newCustAddress, setNewCustAddress] = useState("");

  useEffect(() => {
    if (!showAddModal) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowAddModal(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showAddModal]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesTier = tierFilter === "all" || customer.tier === tierFilter;

      const status = customer.debtStatus;
      const activeDebt = customer.activeDebt || 0;

      const matchesDebt =
        debtFilter === "all" ||
        (debtFilter === "has-debt" && activeDebt > 0) ||
        (debtFilter === "overdue" && status === "overdue") ||
        (debtFilter === "settled" && activeDebt <= 0);

      const searchable = [
        customer.id,
        customer.name,
        customer.company,
        customer.phone,
        customer.city,
        customer.address,
        customer.picName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesTier && matchesDebt && (!query || searchable.includes(query))
      );
    });
  }, [customers, searchQuery, tierFilter, debtFilter]);

  const resetForm = () => {
    setNewCustName("");
    setNewCustPic("");
    setNewCustPhone("");
    setNewCustCity("");
    setNewCustTier("Retail");
    setNewCustLimit("0");
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
    const limit = Number(newCustLimit);

    if (!name) {
      onToast("Nama pelanggan wajib diisi.");
      return;
    }

    if (!phone) {
      onToast("Nomor telepon wajib diisi.");
      return;
    }

    if (!Number.isFinite(limit) || limit < 0) {
      onToast("Limit kredit tidak valid.");
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
    setShowAddModal(false);
    resetForm();
    onToast("Pelanggan berhasil ditambahkan.");
  };

  const openPOS = (customer: Customer) => {
    onSelectCustomerForPOS?.(customer.id);
    onNavigate("pos");
  };

  const openReceivables = () => {
    onNavigate("receivables");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setDebtFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || tierFilter !== "all" || debtFilter !== "all";

  return (
    <div className="w-full space-y-4 text-[#1c1c19]">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-0 flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#82746d]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, nomor telepon, atau ID..."
            className={`${INPUT} pl-10`}
            aria-label="Cari pelanggan"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(event) => setTierFilter(event.target.value as TierFilter)}
          className={`${INPUT} w-auto min-w-[150px]`}
          aria-label="Filter kategori pelanggan"
        >
          {TIER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={debtFilter}
          onChange={(event) => setDebtFilter(event.target.value as DebtFilter)}
          className={`${INPUT} w-auto min-w-[140px]`}
          aria-label="Filter status piutang"
        >
          <option value="all">Semua status</option>
          <option value="has-debt">Ada piutang</option>
          <option value="overdue">Jatuh tempo</option>
          <option value="settled">Lunas</option>
        </select>

        <button type="button" onClick={openAddModal} className={PRIMARY}>
          <Icon name="add" className="text-[18px]" />
          Tambah pelanggan
        </button>
      </div>

      {/* Tabel pelanggan */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e5e2dd] text-xs font-medium text-[#82746d]">
              <th className="px-3 py-3 font-medium">Pelanggan</th>
              <th className="px-3 py-3 font-medium">Kontak</th>
              <th className="px-3 py-3 font-medium">Kategori</th>
              <th className="px-3 py-3 text-right font-medium">Limit kredit</th>
              <th className="px-3 py-3 text-right font-medium">
                Total belanja
              </th>
              <th className="px-3 py-3 text-right font-medium">Piutang</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#eeeae5]">
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="transition-colors hover:bg-[#f6f3ee]/70"
              >
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee4da] text-xs font-semibold text-[#5f402a]">
                      {initials(customer.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1c1c19]">
                        {customer.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#82746d]">
                        {customer.id}
                        {customer.city ? ` · ${customer.city}` : ""}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3.5">
                  <p className="text-sm text-[#50453e]">
                    {customer.phone || "-"}
                  </p>
                  {customer.picName && customer.picName !== customer.name && (
                    <p className="mt-0.5 text-xs text-[#82746d]">
                      {customer.picName}
                    </p>
                  )}
                </td>

                <td className="px-3 py-3.5">
                  <span
                    className={`inline-flex rounded px-2 py-1 text-xs font-medium ${tierStyle(
                      customer.tier,
                    )}`}
                  >
                    {customer.tier}
                  </span>
                </td>

                <td className="px-3 py-3.5 text-right text-sm tabular-nums text-[#50453e]">
                  {money(customer.creditLimit || 0)}
                </td>

                <td className="px-3 py-3.5 text-right text-sm tabular-nums text-[#50453e]">
                  {money(customer.totalSpend || 0)}
                </td>

                <td className="px-3 py-3.5 text-right text-sm tabular-nums font-medium text-[#1c1c19]">
                  {money(customer.activeDebt || 0)}
                </td>

                <td className="px-3 py-3.5">
                  <span
                    className={`text-xs font-medium ${debtStyle(
                      customer.debtStatus,
                    )}`}
                  >
                    {debtLabel(customer.debtStatus)}
                  </span>
                </td>

                <td className="px-3 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openPOS(customer)}
                      title="Buat pesanan"
                      aria-label={`Buat pesanan untuk ${customer.name}`}
                      className="rounded p-2 text-[#5f402a] transition hover:bg-[#eee4da]"
                    >
                      <Icon name="add_shopping_cart" className="text-[19px]" />
                    </button>

                    <button
                      type="button"
                      onClick={openReceivables}
                      title="Lihat piutang"
                      aria-label={`Lihat piutang ${customer.name}`}
                      className="rounded p-2 text-[#5f402a] transition hover:bg-[#eee4da]"
                    >
                      <Icon name="receipt_long" className="text-[19px]" />
                    </button>

                    {customer.phone && (
                      <a
                        href={`https://wa.me/${customer.phone.replace(
                          /\D/g,
                          "",
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Hubungi melalui WhatsApp"
                        aria-label={`Hubungi ${customer.name} melalui WhatsApp`}
                        className="rounded p-2 text-[#356344] transition hover:bg-[#e9f1e9]"
                      >
                        <Icon name="chat" className="text-[19px]" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center">
                  <p className="text-sm font-medium text-[#50453e]">
                    {customers.length === 0
                      ? "Belum ada pelanggan."
                      : "Pelanggan tidak ditemukan."}
                  </p>
                  <p className="mt-1 text-xs text-[#82746d]">
                    {customers.length === 0
                      ? "Tambahkan pelanggan untuk mulai mencatat transaksi."
                      : "Coba ubah kata kunci atau filter pencarian."}
                  </p>

                  {customers.length === 0 ? (
                    <button
                      type="button"
                      onClick={openAddModal}
                      className={`${PRIMARY} mt-4`}
                    >
                      <Icon name="add" className="text-[18px]" />
                      Tambah pelanggan
                    </button>
                  ) : hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={`${SECONDARY} mt-4`}
                    >
                      Reset filter
                    </button>
                  ) : null}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between border-t border-[#e5e2dd] pt-3 text-xs text-[#82746d]">
          <span>
            Menampilkan {number(filteredCustomers.length)} dari{" "}
            {number(customers.length)} pelanggan
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-[#5f402a] hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Modal tambah pelanggan */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-customer-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#e5e2dd] px-5 py-4">
              <div>
                <h2
                  id="add-customer-title"
                  className="text-base font-semibold text-[#1c1c19]"
                >
                  Tambah pelanggan
                </h2>
                <p className="mt-1 text-xs text-[#82746d]">
                  Isi informasi dasar pelanggan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup"
                className="rounded p-2 text-[#82746d] transition hover:bg-[#f6f3ee]"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className="space-y-4 px-5 py-5">
                <Field label="Nama pelanggan" required>
                  <input
                    autoFocus
                    required
                    value={newCustName}
                    onChange={(event) => setNewCustName(event.target.value)}
                    placeholder="Nama pelanggan atau usaha"
                    className={INPUT}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nama PIC">
                    <input
                      value={newCustPic}
                      onChange={(event) => setNewCustPic(event.target.value)}
                      placeholder="Nama penanggung jawab"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Nomor telepon" required>
                    <input
                      required
                      type="tel"
                      value={newCustPhone}
                      onChange={(event) => setNewCustPhone(event.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Kota">
                    <input
                      value={newCustCity}
                      onChange={(event) => setNewCustCity(event.target.value)}
                      placeholder="Kota domisili"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Limit kredit">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newCustLimit}
                      onChange={(event) => setNewCustLimit(event.target.value)}
                      className={INPUT}
                    />
                  </Field>
                </div>

                <Field label="Kategori pelanggan" required>
                  <div className="grid grid-cols-3 gap-2">
                    {CUSTOMER_TIERS.map((tier) => {
                      const selected = newCustTier === tier.value;

                      return (
                        <button
                          key={tier.value}
                          type="button"
                          onClick={() => setNewCustTier(tier.value)}
                          aria-pressed={selected}
                          className={`rounded-md border px-3 py-3 text-left transition ${
                            selected
                              ? "border-[#795740] bg-[#f6f3ee]"
                              : "border-[#e5e2dd] hover:bg-[#faf9f7]"
                          }`}
                        >
                          <span className="block text-sm font-medium text-[#1c1c19]">
                            {tier.label}
                          </span>
                          <span className="mt-1 block text-xs text-[#82746d]">
                            {tier.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Termin pembayaran">
                  <select
                    value={newCustTerms}
                    onChange={(event) => setNewCustTerms(event.target.value)}
                    className={INPUT}
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Net 7 Hari">Net 7 Hari</option>
                    <option value="Net 14 Hari">Net 14 Hari</option>
                    <option value="Net 30 Hari">Net 30 Hari</option>
                    <option value="Net 60 Hari">Net 60 Hari</option>
                  </select>
                </Field>

                <Field label="Alamat">
                  <textarea
                    rows={2}
                    value={newCustAddress}
                    onChange={(event) => setNewCustAddress(event.target.value)}
                    placeholder="Alamat lengkap (opsional)"
                    className={`${INPUT} resize-y`}
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#e5e2dd] px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={SECONDARY}
                >
                  Batal
                </button>

                <button type="submit" className={PRIMARY}>
                  Simpan pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
