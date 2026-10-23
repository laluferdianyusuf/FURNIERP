import React, { useMemo, useState } from "react";
import type { Customer, CustomerTier, PageView } from "../types";

import {
  MessageCircle,
  Phone,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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
import { money } from "../helpers/moneyFormatter";

interface CustomersViewProps {
  customers: Customer[];
  onNavigate: (page: PageView) => void;
  onSelectCustomerForPOS?: (customerId: string) => void;
  onAddCustomer: (customer: Customer) => void;
  onToast: (msg: string) => void;
}

type DebtFilter = "all" | "has-debt" | "overdue" | "settled";
type TierFilter = "all" | CustomerTier;

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

const tierBadgeClass = (tier: CustomerTier) => {
  switch (tier) {
    case "Grosir":
      return "border-[#5f402a] bg-[#5f402a] text-white hover:bg-[#5f402a]";
    case "Reseller":
      return "border-[#e5d4c3] bg-[#eee4da] text-[#5f402a] hover:bg-[#eee4da]";
    default:
      return "border-[#e5e2dd] bg-[#f1efeb] text-[#50453e] hover:bg-[#f1efeb]";
  }
};

const debtBadge = (status?: string) => {
  switch (status) {
    case "overdue":
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700"
        >
          Jatuh tempo
        </Badge>
      );
    case "has-debt":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          Ada piutang
        </Badge>
      );
    case "settled":
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700"
        >
          Lunas
        </Badge>
      );
    default:
      return <Badge variant="secondary">Belum diketahui</Badge>;
  }
};

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

const INPUT_CLASS =
  "border-[#e5e2dd] bg-white focus-visible:ring-[#795740] focus-visible:ring-offset-0";

const PRIMARY_STYLE = {
  backgroundColor: "#5f402a",
  color: "#ffffff",
};

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

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesTier = tierFilter === "all" || customer.tier === tierFilter;

      const activeDebt = customer.activeDebt || 0;
      const status = customer.debtStatus;

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

    const newEntry: Customer = {
      id: nextCustomerId(customers),
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

  const clearFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setDebtFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || tierFilter !== "all" || debtFilter !== "all";

  const totalDebt = customers.reduce(
    (total, customer) => total + (customer.activeDebt || 0),
    0,
  );

  const totalCreditLimit = customers.reduce(
    (total, customer) => total + (customer.creditLimit || 0),
    0,
  );

  return (
    <div className="w-full space-y-6 text-[#1c1c19]">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pelanggan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data pelanggan, kategori harga, limit kredit, dan piutang.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="gap-2 self-start hover:opacity-90"
          style={PRIMARY_STYLE}
        >
          <Plus className="size-4" />
          Tambah pelanggan
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[#e8e0d7] shadow-none">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, nomor telepon, atau ID..."
                aria-label="Cari pelanggan"
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>

            <Select
              value={tierFilter}
              onValueChange={(value) => setTierFilter(value as TierFilter)}
            >
              <SelectTrigger
                aria-label="Filter kategori pelanggan"
                className={`w-full lg:w-[190px] ${INPUT_CLASS}`}
              >
                <SelectValue placeholder="Kategori pelanggan" />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={debtFilter}
              onValueChange={(value) => setDebtFilter(value as DebtFilter)}
            >
              <SelectTrigger
                aria-label="Filter status piutang"
                className={`w-full lg:w-[175px] ${INPUT_CLASS}`}
              >
                <SelectValue placeholder="Status piutang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="has-debt">Ada piutang</SelectItem>
                <SelectItem value="overdue">Jatuh tempo</SelectItem>
                <SelectItem value="settled">Lunas</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="gap-2 border-[#e5e2dd]"
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Menampilkan{" "}
              <strong className="font-semibold text-foreground">
                {number(filteredCustomers.length)}
              </strong>{" "}
              dari {number(customers.length)} pelanggan
            </span>
            <span>Data berdasarkan filter aktif</span>
          </div>
        </CardContent>
      </Card>

      {/* Customer table */}
      <Card className="overflow-hidden border-[#e8e0d7] shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#faf8f5] hover:bg-[#faf8f5]">
                <TableHead className="min-w-[220px]">Pelanggan</TableHead>
                <TableHead className="min-w-[150px]">Kontak</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Limit kredit</TableHead>
                <TableHead className="text-right">Total belanja</TableHead>
                <TableHead className="text-right">Piutang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-[#faf8f5]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-[#eee4da] text-xs font-semibold text-[#5f402a]">
                          {initials(customer.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="font-medium text-[#1c1c19]">
                          {customer.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {customer.id}
                          {customer.city ? ` · ${customer.city}` : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-[#50453e]">
                        <Phone className="size-3.5 text-muted-foreground" />
                        {customer.phone || "-"}
                      </div>
                      {customer.picName &&
                        customer.picName !== customer.name && (
                          <p className="text-xs text-muted-foreground">
                            PIC: {customer.picName}
                          </p>
                        )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={tierBadgeClass(customer.tier)}
                    >
                      {customer.tier}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {money(customer.creditLimit || 0)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {money(customer.totalSpend || 0)}
                  </TableCell>

                  <TableCell className="text-right font-medium tabular-nums">
                    {money(customer.activeDebt || 0)}
                  </TableCell>

                  <TableCell>{debtBadge(customer.debtStatus)}</TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Buat pesanan"
                        aria-label={`Buat pesanan untuk ${customer.name}`}
                        onClick={() => openPOS(customer)}
                        className="size-8 text-[#5f402a] hover:bg-[#eee4da] hover:text-[#5f402a]"
                      >
                        <ShoppingCart className="size-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Lihat piutang"
                        aria-label={`Lihat piutang ${customer.name}`}
                        onClick={() => onNavigate("receivables")}
                        className="size-8 text-[#5f402a] hover:bg-[#eee4da] hover:text-[#5f402a]"
                      >
                        <ReceiptText className="size-4" />
                      </Button>

                      {customer.phone && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="WhatsApp"
                          aria-label={`Hubungi ${customer.name} melalui WhatsApp`}
                          onClick={() => {
                            const phone = customer.phone.replace(/\D/g, "");
                            window.open(
                              `https://wa.me/${phone}`,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                          className="size-8 text-green-700 hover:bg-green-50 hover:text-green-800"
                        >
                          <MessageCircle className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#f1efeb] text-[#82746d]">
                        {customers.length === 0 ? (
                          <Users className="size-5" />
                        ) : (
                          <Search className="size-5" />
                        )}
                      </div>

                      <p className="font-medium">
                        {customers.length === 0
                          ? "Belum ada pelanggan"
                          : "Pelanggan tidak ditemukan"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {customers.length === 0
                          ? "Tambahkan pelanggan untuk mulai mencatat transaksi."
                          : "Coba ubah kata kunci atau filter pencarian."}
                      </p>

                      {customers.length === 0 ? (
                        <Button
                          type="button"
                          onClick={openAddModal}
                          className="mt-4 gap-2"
                          style={PRIMARY_STYLE}
                        >
                          <Plus className="size-4" />
                          Tambah pelanggan
                        </Button>
                      ) : hasActiveFilters ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={clearFilters}
                          className="mt-4 gap-2"
                        >
                          <RotateCcw className="size-4" />
                          Reset filter
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredCustomers.length > 0 && (
          <>
            <Separator className="bg-[#e8e0d7]" />
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
              <span>
                {number(filteredCustomers.length)} pelanggan ditampilkan
              </span>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="link"
                  onClick={clearFilters}
                  className="h-auto p-0 text-[#5f402a]"
                >
                  Reset filter
                </Button>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Add customer dialog */}
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-[#e8e0d7] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah pelanggan</DialogTitle>
            <DialogDescription>
              Masukkan informasi pelanggan dan ketentuan kreditnya. Data akan
              tersedia di POS setelah disimpan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nama pelanggan *</Label>
              <Input
                id="customer-name"
                autoFocus
                required
                value={newCustName}
                onChange={(event) => setNewCustName(event.target.value)}
                placeholder="Nama pelanggan atau usaha"
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-pic">Nama PIC</Label>
                <Input
                  id="customer-pic"
                  value={newCustPic}
                  onChange={(event) => setNewCustPic(event.target.value)}
                  placeholder="Penanggung jawab"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">Nomor telepon *</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(event) => setNewCustPhone(event.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-city">Kota</Label>
                <Input
                  id="customer-city"
                  value={newCustCity}
                  onChange={(event) => setNewCustCity(event.target.value)}
                  placeholder="Kota domisili"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-credit-limit">Limit kredit (Rp)</Label>
                <Input
                  id="customer-credit-limit"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={newCustLimit}
                  onChange={(event) => setNewCustLimit(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategori pelanggan *</Label>
              <div className="grid grid-cols-3 gap-2">
                {CUSTOMER_TIERS.map((tier) => {
                  const selected = newCustTier === tier.value;

                  return (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setNewCustTier(tier.value)}
                      aria-pressed={selected}
                      className={[
                        "rounded-lg border p-3 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]",
                        selected
                          ? "border-[#795740] bg-[#f6f3ee] ring-1 ring-[#795740]"
                          : "border-[#e5e2dd] hover:bg-[#faf8f5]",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-medium">
                        {tier.label}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {tier.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-terms">Termin pembayaran</Label>
              <Select
                value={newCustTerms}
                onValueChange={(value) => setNewCustTerms(value ?? "")}
              >
                <SelectTrigger id="customer-terms" className={INPUT_CLASS}>
                  <SelectValue placeholder="Pilih termin pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="Net 7 Hari">Net 7 Hari</SelectItem>
                  <SelectItem value="Net 14 Hari">Net 14 Hari</SelectItem>
                  <SelectItem value="Net 30 Hari">Net 30 Hari</SelectItem>
                  <SelectItem value="Net 60 Hari">Net 60 Hari</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">Alamat</Label>
              <Textarea
                id="customer-address"
                rows={3}
                value={newCustAddress}
                onChange={(event) => setNewCustAddress(event.target.value)}
                placeholder="Alamat lengkap (opsional)"
                className={`${INPUT_CLASS} resize-y`}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="border-[#e5e2dd]"
              >
                Batal
              </Button>

              <Button
                type="submit"
                className="hover:opacity-90"
                style={PRIMARY_STYLE}
              >
                <Plus className="mr-2 size-4" />
                Simpan pelanggan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersView;
