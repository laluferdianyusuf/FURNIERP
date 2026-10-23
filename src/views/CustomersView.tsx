import React, { useMemo, useState } from "react";
import type { Customer, CustomerTier, PageView } from "../types";

import {
  Building2,
  MapPin,
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
          className="whitespace-nowrap border-red-200 bg-red-50 text-red-700"
        >
          Jatuh tempo
        </Badge>
      );
    case "has-debt":
      return (
        <Badge
          variant="outline"
          className="whitespace-nowrap border-amber-200 bg-amber-50 text-amber-700"
        >
          Ada piutang
        </Badge>
      );
    case "settled":
      return (
        <Badge
          variant="outline"
          className="whitespace-nowrap border-green-200 bg-green-50 text-green-700"
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

  const openWhatsApp = (phoneNumber: string) => {
    const phone = phoneNumber.replace(/\D/g, "");

    if (!phone) {
      onToast("Nomor telepon tidak tersedia.");
      return;
    }

    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
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
    <div className="w-full min-w-0 space-y-5 text-[#1c1c19] sm:space-y-6">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Pelanggan
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Kelola data pelanggan, kategori harga, limit kredit, dan piutang.
          </p>
        </div>

        <Button
          type="button"
          onClick={openAddModal}
          className="w-full gap-2 hover:opacity-90 sm:w-auto"
          style={PRIMARY_STYLE}
        >
          <Plus className="size-4" />
          Tambah pelanggan
        </Button>
      </header>

      {/* Filters */}
      <Card className="border-[#e8e0d7] shadow-none">
        <CardContent className="space-y-4 p-3 sm:p-4">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row">
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

      {/* Customer list */}
      <Card className="overflow-hidden border-[#e8e0d7] shadow-none">
        <div className="flex items-center justify-between gap-3 border-b border-[#e8e0d7] px-3 py-3 sm:px-4">
          <div>
            <h2 className="text-sm font-semibold">Daftar pelanggan</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Informasi kontak dan keuangan pelanggan
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {number(filteredCustomers.length)} data
          </Badge>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#f1efeb] text-[#82746d]">
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

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
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
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 bg-[#faf8f5] p-3 md:hidden">
              {filteredCustomers.map((customer) => (
                <article
                  key={customer.id}
                  className="rounded-xl border border-[#e8e0d7] bg-white p-3.5 shadow-sm"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="size-11 shrink-0">
                      <AvatarFallback className="bg-[#eee4da] text-sm font-semibold text-[#5f402a]">
                        {initials(customer.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-sm font-semibold text-[#1c1c19]">
                          {customer.name}
                        </h3>
                      </div>

                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {customer.id}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className={tierBadgeClass(customer.tier)}
                        >
                          {customer.tier}
                        </Badge>
                        {debtBadge(customer.debtStatus)}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3 bg-[#eee9e3]" />

                  <div className="space-y-2.5">
                    <div className="flex min-w-0 items-start gap-2 text-sm">
                      <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 break-words text-[#50453e]">
                        {customer.phone || "Nomor telepon belum tersedia"}
                      </span>
                    </div>

                    {customer.city && (
                      <div className="flex min-w-0 items-start gap-2 text-sm">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 break-words text-[#50453e]">
                          {customer.city}
                        </span>
                      </div>
                    )}

                    {customer.picName && customer.picName !== customer.name && (
                      <div className="flex min-w-0 items-start gap-2 text-sm">
                        <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 break-words text-muted-foreground">
                          PIC: {customer.picName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-lg bg-[#faf8f5] p-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        Limit kredit
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold tabular-nums">
                        {money(customer.creditLimit || 0)}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-lg bg-[#faf8f5] p-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        Total belanja
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold tabular-nums">
                        {money(customer.totalSpend || 0)}
                      </p>
                    </div>

                    <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/70 p-2.5">
                      <div>
                        <p className="text-[11px] text-amber-800">
                          Piutang aktif
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold tabular-nums text-amber-900">
                          {money(customer.activeDebt || 0)}
                        </p>
                      </div>
                      <ReceiptText className="size-5 shrink-0 text-amber-700" />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openPOS(customer)}
                      className="min-w-0 gap-1.5"
                      style={PRIMARY_STYLE}
                    >
                      <ShoppingCart className="size-4 shrink-0" />
                      Buat pesanan
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate("receivables")}
                      className="min-w-0 gap-1.5 border-[#e5e2dd] text-[#5f402a]"
                    >
                      <ReceiptText className="size-4 shrink-0" />
                      Lihat piutang
                    </Button>

                    {customer.phone && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openWhatsApp(customer.phone)}
                        className="col-span-2 gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                      >
                        <MessageCircle className="size-4" />
                        Hubungi via WhatsApp
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: data table */}
            <div className="hidden overflow-x-auto md:block">
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
                            <Phone className="size-3.5 shrink-0 text-muted-foreground" />
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

                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {money(customer.creditLimit || 0)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {money(customer.totalSpend || 0)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
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
                              onClick={() => openWhatsApp(customer.phone)}
                              className="size-8 text-green-700 hover:bg-green-50 hover:text-green-800"
                            >
                              <MessageCircle className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {filteredCustomers.length > 0 && (
          <>
            <Separator className="bg-[#e8e0d7]" />
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-xs text-muted-foreground sm:px-4">
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
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto border-[#e8e0d7] sm:max-w-xl">
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
