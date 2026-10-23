import {
  ArrowDownUp,
  ClipboardList,
  Eye,
  FileText,
  Package,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

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
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { DUMMY_ORDERS } from "../data/ordersData";

export type SalesOrderStatus =
  | "Menunggu Pembayaran"
  | "Menunggu DP"
  | "Diproses"
  | "Produksi"
  | "Siap Dikirim"
  | "Dikirim"
  | "Selesai"
  | "Dibatalkan";

export interface SalesOrderItem {
  productId: string;
  productName: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: SalesOrderItem[];
  subtotal: number;
  shippingCost: number;
  assemblyCost: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: string;
  paymentStatus: "Belum Bayar" | "DP" | "Lunas";
  status: SalesOrderStatus;
  notes?: string;
}

interface OrdersViewProps {
  orders: SalesOrder[];
  onUpdateStatus: (orderId: string, status: SalesOrderStatus) => void;
  onNavigate?: (page: "pos" | "orders") => void;
  onToast?: (message: string) => void;
}

const STATUS_OPTIONS: SalesOrderStatus[] = [
  "Menunggu Pembayaran",
  "Menunggu DP",
  "Diproses",
  "Produksi",
  "Siap Dikirim",
  "Dikirim",
  "Selesai",
  "Dibatalkan",
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getStatusClass = (status: SalesOrderStatus) => {
  switch (status) {
    case "Selesai":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Dikirim":
    case "Siap Dikirim":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Produksi":
    case "Diproses":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Menunggu DP":
    case "Menunggu Pembayaran":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Dibatalkan":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-stone-200 bg-stone-50 text-stone-700";
  }
};

const getPaymentClass = (status: SalesOrder["paymentStatus"]) => {
  if (status === "Lunas") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "DP") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
};

export function OrdersView({
  orders: incomingOrders,
  onUpdateStatus,
  onNavigate,
  onToast,
}: OrdersViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [paymentFilter, setPaymentFilter] = useState("semua");
  const [dateFilter, setDateFilter] = useState("semua");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const [dummyOrders, setDummyOrders] = useState<SalesOrder[]>(DUMMY_ORDERS);

  const orders = incomingOrders.length > 0 ? incomingOrders : dummyOrders;

  const handleUpdateStatus = (orderId: string, status: SalesOrderStatus) => {
    if (incomingOrders.length > 0) {
      onUpdateStatus(orderId, status);
    } else {
      setDummyOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const now = new Date();

    return [...orders]
      .filter((order) => {
        const matchesSearch =
          !keyword ||
          order.orderNumber.toLowerCase().includes(keyword) ||
          order.customerName.toLowerCase().includes(keyword) ||
          (order.customerPhone || "").toLowerCase().includes(keyword) ||
          order.items.some((item) =>
            item.productName.toLowerCase().includes(keyword),
          );

        const matchesStatus =
          statusFilter === "semua" || order.status === statusFilter;

        const matchesPayment =
          paymentFilter === "semua" || order.paymentStatus === paymentFilter;

        const created = new Date(order.createdAt);
        const ageInDays =
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

        const matchesDate =
          dateFilter === "semua" ||
          (dateFilter === "hari-ini" &&
            created.toDateString() === now.toDateString()) ||
          (dateFilter === "7-hari" && ageInDays >= 0 && ageInDays <= 7) ||
          (dateFilter === "30-hari" && ageInDays >= 0 && ageInDays <= 30);

        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, search, statusFilter, paymentFilter, dateFilter]);

  const totalOrderValue = orders
    .filter((order) => order.status !== "Dibatalkan")
    .reduce((sum, order) => sum + order.total, 0);

  const totalPaid = orders
    .filter((order) => order.status !== "Dibatalkan")
    .reduce((sum, order) => sum + order.paidAmount, 0);

  const outstanding = Math.max(totalOrderValue - totalPaid, 0);

  const activeOrders = orders.filter(
    (order) => !["Selesai", "Dibatalkan"].includes(order.status),
  ).length;

  const updateStatus = (order: SalesOrder, status: SalesOrderStatus) => {
    handleUpdateStatus(order.id, status);

    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...order, status });
    }

    onToast?.(`Status pesanan ${order.orderNumber} diperbarui.`);
  };

  return (
    <div className="space-y-5 w-full min-w-0 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Pesanan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau transaksi checkout, pembayaran, dan pemenuhan pesanan
            pelanggan.
          </p>
        </div>

        <Button
          onClick={() => onNavigate?.("pos")}
          className="bg-[#795740] text-white hover:bg-[#5f402a]"
        >
          <Package className="mr-2 h-4 w-4" />
          Buat Pesanan dari POS
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-stone-200 shadow-sm">
        <CardHeader className="space-y-4 border-b border-stone-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Daftar Pesanan</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredOrders.length} pesanan ditemukan
              </p>
            </div>
            <Button
              variant="outline"
              className="border-stone-200"
              onClick={() => {
                setSearch("");
                setStatusFilter("semua");
                setPaymentFilter("semua");
                setDateFilter("semua");
              }}
            >
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Reset Filter
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nomor, pelanggan, produk..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "")}
            >
              <SelectTrigger className={`w-full`}>
                <SelectValue placeholder="Semua status pesanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status Pesanan</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paymentFilter}
              onValueChange={(value) => setPaymentFilter(value ?? "")}
            >
              <SelectTrigger className={`w-full`}>
                <SelectValue placeholder="Semua pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Pembayaran</SelectItem>
                <SelectItem value="Belum Bayar">Belum Bayar</SelectItem>
                <SelectItem value="DP">DP</SelectItem>
                <SelectItem value="Lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value ?? "")}
            >
              <SelectTrigger className={`w-full`}>
                <SelectValue placeholder="Semua periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Periode</SelectItem>
                <SelectItem value="hari-ini">Hari Ini</SelectItem>
                <SelectItem value="7-hari">7 Hari Terakhir</SelectItem>
                <SelectItem value="30-hari">30 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-stone-100 p-4 text-stone-500">
                <ClipboardList className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-stone-900">
                Belum ada pesanan
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Pesanan akan muncul di sini setelah transaksi berhasil dibuat
                dari POS. Coba ubah filter atau kata kunci pencarian.
              </p>
              {orders.length === 0 && (
                <Button
                  className="mt-4 bg-[#795740] text-white hover:bg-[#5f402a]"
                  onClick={() => onNavigate?.("pos")}
                >
                  Mulai Transaksi
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Pesanan</th>
                      <th className="px-5 py-3 font-medium">Pelanggan</th>
                      <th className="px-5 py-3 font-medium">Tanggal</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Total
                      </th>
                      <th className="px-5 py-3 font-medium">Pembayaran</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-stone-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-stone-900">
                            {order.orderNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.items.length} jenis produk
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-stone-800">
                            {order.customerName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.customerPhone || "Nomor telepon belum diisi"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-stone-900">
                          {formatRupiah(order.total)}
                          <p className="mt-1 text-xs font-normal text-muted-foreground">
                            Dibayar {formatRupiah(order.paidAmount)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className={getPaymentClass(order.paymentStatus)}
                          >
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className={getStatusClass(order.status)}
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-3 md:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="space-y-3 rounded-xl border border-stone-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-900">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusClass(order.status)}
                      >
                        {order.status}
                      </Badge>
                    </div>

                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.items.length} jenis produk
                      </p>
                    </div>

                    <div className="flex items-end justify-between border-t border-stone-100 pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="mt-1 font-bold">
                          {formatRupiah(order.total)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-2 ${getPaymentClass(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order detail dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Detail Pesanan</DialogTitle>
                <DialogDescription>
                  {selectedOrder.orderNumber} ·{" "}
                  {formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 p-4">
                    <p className="text-xs text-muted-foreground">Pelanggan</p>
                    <p className="mt-2 font-semibold">
                      {selectedOrder.customerName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedOrder.customerPhone ||
                        "Nomor telepon belum diisi"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-stone-200 p-4">
                    <p className="text-xs text-muted-foreground">
                      Metode Pembayaran
                    </p>
                    <p className="mt-2 font-semibold">
                      {selectedOrder.paymentMethod || "-"}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-2 ${getPaymentClass(selectedOrder.paymentStatus)}`}
                    >
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">Produk Pesanan</h3>
                  <div className="overflow-x-auto rounded-xl border border-stone-200">
                    <table className="w-full min-w-[420px] text-sm">
                      <thead className="bg-stone-50 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">
                            Produk
                          </th>
                          <th className="px-4 py-3 text-center font-medium">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Harga
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={`${item.productId}-${index}`}>
                            <td className="px-4 py-3">
                              <p className="font-medium">{item.productName}</p>
                              {item.color && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Warna: {item.color}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatRupiah(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Subtotal Produk
                    </span>
                    <span>{formatRupiah(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Ongkir</span>
                    <span>{formatRupiah(selectedOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Perakitan</span>
                    <span>{formatRupiah(selectedOrder.assemblyCost)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Diskon</span>
                      <span>-{formatRupiah(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-t border-stone-200 pt-3 text-base font-bold">
                    <span>Total Pesanan</span>
                    <span>{formatRupiah(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-emerald-700">
                    <span>Sudah Dibayar</span>
                    <span>{formatRupiah(selectedOrder.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between gap-4 font-semibold text-red-700">
                    <span>Sisa Tagihan</span>
                    <span>
                      {formatRupiah(
                        Math.max(
                          selectedOrder.total - selectedOrder.paidAmount,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="rounded-xl border border-stone-200 p-4">
                    <p className="text-sm font-semibold">Catatan Pesanan</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Perbarui Status Pesanan
                  </label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) =>
                      updateStatus(selectedOrder, value as SalesOrderStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Perubahan status ini memperbarui data pesanan pada state
                    aplikasi.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Tutup
                  </Button>
                  <Button
                    className="bg-[#795740] text-white hover:bg-[#5f402a]"
                    onClick={() => {
                      onToast?.(
                        "Fitur cetak invoice perlu dihubungkan ke template invoice.",
                      );
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Cetak Invoice
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OrdersView;
