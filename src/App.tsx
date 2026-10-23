import { useState } from "react";
import { QuickTransactionModal } from "./components/QuickTransactionModal";
import AppSidebar from "./components/Sidebar";
import {
  INITIAL_CASH_MUTATIONS,
  INITIAL_CUSTOMERS,
  INITIAL_INVENTORY,
  INITIAL_PRODUCTS,
  INITIAL_RECEIVABLES,
  INITIAL_SPK_ORDERS,
} from "./data/mockData";
import {
  CashMutation,
  Customer,
  InventoryItem,
  PageView,
  Product,
  ProductionOrder,
  ReceivableInvoice,
} from "./types";

import { Separator } from "./components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { CashFlowView } from "./views/CashFlowView";
import CRMView from "./views/CRMView";
import { CustomersView } from "./views/CustomersView";
import { DashboardView } from "./views/DashboardView";
import { FinancialReportsView } from "./views/FinancialReportsView";
import { InventoryView } from "./views/InventoryView";
import { InvoiceDetailView } from "./views/InvoiceDetailView";
import OrdersView, { SalesOrder, SalesOrderStatus } from "./views/OrdersView";
import { PosCheckoutView } from "./views/PosCheckoutView";
import { PosCheckoutData, PosView } from "./views/PosView";
import { ProductsView } from "./views/ProductsView";
import { ReceivablesView } from "./views/ReceivablesView";
import { SettingsView } from "./views/SettingsView";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("dashboard");
  const [showPosCheckout, setShowPosCheckout] = useState(false);
  const [posCheckoutData, setPosCheckoutData] =
    useState<PosCheckoutData | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  // Quick transaction modal
  const [isQuickTxOpen, setIsQuickTxOpen] = useState(false);
  const [quickTxType, setQuickTxType] = useState("inflow");

  // Shared application data state
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [inventory, setInventory] =
    useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<ProductionOrder[]>(INITIAL_SPK_ORDERS);
  const [cashMutations, setCashMutations] = useState<CashMutation[]>(
    INITIAL_CASH_MUTATIONS,
  );
  const [receivables, setReceivables] =
    useState<ReceivableInvoice[]>(INITIAL_RECEIVABLES);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleOpenQuickTx = (type: string = "inflow") => {
    setQuickTxType(type);
    setIsQuickTxOpen(true);
  };

  const handleAddMutation = (mutData: {
    description: string;
    entity: string;
    category: string;
    account: "BCA" | "Mandiri" | "Kas Tunai";
    type: "IN" | "OUT" | "TRANSFER";
    amountIn: number;
    amountOut: number;
    tag?: string;
  }) => {
    const lastBalance = cashMutations[0]?.runningBalance || 215800000;
    const diff = mutData.amountIn - mutData.amountOut;
    const newTx: CashMutation = {
      id: `tx-${Date.now()}`,
      refNumber: `${mutData.type === "IN" ? "CR" : mutData.type === "OUT" ? "CD" : "TR"}-202410-${Math.floor(100 + Math.random() * 900)}`,
      date: "23/10/2024",
      time: "Baru saja",
      description: mutData.description,
      entity: mutData.entity,
      category: mutData.category,
      account: mutData.account,
      type: mutData.type,
      amountIn: mutData.amountIn,
      amountOut: mutData.amountOut,
      runningBalance: lastBalance + diff,
      tag: mutData.tag || "POS / Quick Entry",
    };

    setCashMutations([newTx, ...cashMutations]);
  };

  const handleAddSPK = (spkData: {
    title: string;
    customerName: string;
    mandor: string;
    contractPrice: number;
    woodMaterial: string;
    dimensions: string;
    targetDate: string;
  }) => {
    const estHpp = Math.round(spkData.contractPrice * 0.52);
    const newSpk: ProductionOrder = {
      id: `spk-${Date.now()}`,
      spkNumber: `SPK-2410-${Math.floor(120 + Math.random() * 800)}`,
      title: spkData.title,
      customerName: spkData.customerName,
      customerTier: "Retail",
      mandor: spkData.mandor,
      contractPrice: spkData.contractPrice,
      estimatedHpp: estHpp,
      actualCost: 0,
      dpPaid: Math.round(spkData.contractPrice * 0.5),
      remainingDebt: Math.round(spkData.contractPrice * 0.5),
      progressPercent: 5,
      currentStage: "Persiapan Bahan & Potong Log",
      startDate: "23 Okt 2024",
      targetDate: spkData.targetDate || "15 Nov 2024",
      status: "Antrean",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBJNxZI3A1SLq6yYhuu9iVvxMYCBCtDQZ_Y5j2N8ccc4jsqNb1-B-hUPng9PZry928ZKD0fed2wGIBqkcfKwmUvZBwfVde4hcMb51qBmNsPHwVOJQp5Xj08600WHOxdfF5y--HU-_XNt3PemZp9l6od_xCCkRHlt4vUwsqMqDFMZ5Z6sx65QCn9zLdFAQ540EurrqvB3XCHBkmJGKrGQMkf8hCExRt_l3rA9oI7K08dImogCET3gIPC",
      dimensions: spkData.dimensions,
      woodMaterial: spkData.woodMaterial,
      brassAccent: "Brass Accents",
      finishing: "Natural Satin PU",
      notes: "Pesanan custom via Quick Entry",
      bom: [
        {
          id: "b1",
          name: "Bahan Baku Kayu Solid",
          spec: spkData.woodMaterial,
          volume: "1 Lot",
          unitPrice: Math.round(estHpp * 0.6),
          subtotal: Math.round(estHpp * 0.6),
          status: "Tersedia",
        },
        {
          id: "b2",
          name: "Upah Tukang Kayu Borongan",
          spec: "Tukang Halus Jepara",
          volume: "1 Lot",
          unitPrice: Math.round(estHpp * 0.25),
          subtotal: Math.round(estHpp * 0.25),
          status: "Workshop",
        },
        {
          id: "b3",
          name: "Finishing & Chemical",
          spec: "Melamic Satin Propan",
          volume: "1 Lot",
          unitPrice: Math.round(estHpp * 0.15),
          subtotal: Math.round(estHpp * 0.15),
          status: "Tersedia",
        },
      ],
      steps: [
        {
          title: "Pembelian Log & Oven Kayu (Kiln Dry)",
          description: "MC 10-12% tercapai",
          date: "23 Okt",
          completed: true,
        },
        {
          title: "Pemotongan & Serut Bahan",
          description: "Pembelahan balok utama",
          date: "24 Okt",
          completed: false,
          current: true,
          worker: spkData.mandor,
        },
        {
          title: "Perakitan Konstruksi Mebel",
          description: "Purus dan sambungan kayu",
          date: "28 Okt",
          completed: false,
        },
        {
          title: "Proses Finishing & Sanding",
          description: "Pelapisan PU Natural",
          date: "04 Nov",
          completed: false,
        },
        {
          title: "Quality Control (QC) & Packing",
          description: "Pemeriksaan akhir owner",
          date: "10 Nov",
          completed: false,
        },
      ],
    };

    setOrders([newSpk, ...orders]);
  };

  const handleSettleInvoice = (
    invoiceId: string,
    amount: number,
    account: "BCA" | "Mandiri" | "Kas Tunai",
    notes: string,
  ) => {
    setReceivables((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + amount;
          const newDebt = Math.max(0, inv.totalAmount - newPaid);
          return {
            ...inv,
            paidAmount: newPaid,
            remainingDebt: newDebt,
            isOverdue: newDebt > 0 ? inv.isOverdue : false,
          };
        }
        return inv;
      }),
    );

    const matchingInv = receivables.find((i) => i.id === invoiceId);
    handleAddMutation({
      description: `Pelunasan Piutang ${matchingInv?.invoiceNumber || ""} (${notes})`,
      entity: `Pelanggan: ${matchingInv?.customerName || ""}`,
      category: "Pelunasan Piutang",
      account,
      type: "IN",
      amountIn: amount,
      amountOut: 0,
      tag: "Auto Settle",
    });
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
    showToast(
      `Produk "${newProduct.name}" (${newProduct.sku}) berhasil ditambahkan ke katalog.`,
    );
  };

  const handleAddCustomer = (newCust: Customer) => {
    setCustomers([newCust, ...customers]);
    showToast(`Pelanggan "${newCust.name}" berhasil terdaftar di sistem.`);
  };

  const handleOpenPosCheckout = (data: PosCheckoutData) => {
    setPosCheckoutData(data);
    setShowPosCheckout(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToPos = (data: PosCheckoutData) => {
    setPosCheckoutData(data);
    setShowPosCheckout(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateSalesOrderStatus = (
    orderId: string,
    status: SalesOrderStatus,
  ) => {
    setSalesOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  };

  const handleCreateSalesOrder = (data: PosCheckoutData) => {
    const now = new Date();
    const timestamp = now.getTime();

    const customer = customers.find((item) => item.id === data.customerId);

    const items = data.items.map((item) => {
      const unitPrice = item.customPrice ?? item.product.prices;
      const quantity = item.quantity;

      return {
        productId: item.product.id,
        productName: item.product.name,
        quantity,
        unitPrice,
        subtotal: Number(unitPrice) * quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    const shippingCost = data.includeOngkir ? 250000 : 0;
    const assemblyCost = data.includeRakit ? 150000 : 0;
    const total = subtotal + shippingCost + assemblyCost;

    const paidAmount =
      // data.paymentScheme === "dp"
      //   ? Math.min(data.dpAmount || 0, total) :
      total;

    const paymentStatus: SalesOrder["paymentStatus"] =
      paidAmount >= total ? "Lunas" : paidAmount > 0 ? "DP" : "Belum Bayar";

    const order: SalesOrder = {
      id: `SO-${timestamp}`,
      orderNumber: `SO-${now.getFullYear()}${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(
        salesOrders.length + 1,
      ).padStart(4, "0")}`,
      createdAt: now.toISOString(),
      customerId: data.customerId,
      customerName: customer?.name ?? "Pelanggan",
      customerPhone: customer?.phone ?? "",
      items: items as any,
      subtotal,
      shippingCost,
      assemblyCost,
      discount: 0,
      total,
      paidAmount,
      paymentMethod: "-",
      paymentStatus,
      status:
        paidAmount === 0
          ? "Menunggu Pembayaran"
          : paidAmount < total
            ? "Menunggu DP"
            : "Diproses",
    };

    setSalesOrders((current) => [order, ...current]);
    setCurrentPage("orders");
    showToast(`Pesanan ${order.orderNumber} berhasil dibuat.`);
  };

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "252px",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <SidebarInset className="min-w-0 bg-[#fcf9f4] text-[#1c1c19]">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e8e0d7] bg-[#fcf9f4] px-4 sm:px-6">
          <SidebarTrigger />

          <Separator orientation="vertical" className="h-5" />

          <div>
            <p className="text-sm font-semibold text-[#5f402a]">FurniERP</p>
            <p className="text-xs text-muted-foreground">
              Sistem manajemen usaha mebel
            </p>
          </div>
        </header>

        {toastMessage && (
          <div className="fixed right-6 top-20 z-50 flex items-center gap-2.5 rounded-xl border border-[#795740] bg-[#5f402a] px-4 py-3 text-white shadow-xl">
            <span className="material-symbols-outlined text-lg text-green-300">
              check_circle
            </span>
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          {currentPage === "dashboard" && (
            <DashboardView
              onNavigate={setCurrentPage}
              onOpenQuickTx={handleOpenQuickTx}
              onToast={showToast}
            />
          )}

          {currentPage === "pos" &&
            (showPosCheckout && posCheckoutData ? (
              <PosCheckoutView
                customers={customers}
                data={posCheckoutData}
                onBack={handleBackToPos}
                onToast={showToast}
              />
            ) : (
              <PosView
                products={products}
                customers={customers}
                onNavigate={setCurrentPage}
                onToast={showToast}
                onCheckout={handleOpenPosCheckout}
                initialData={posCheckoutData}
              />
            ))}
          {currentPage === "orders" && (
            <OrdersView
              orders={salesOrders}
              onUpdateStatus={handleUpdateSalesOrderStatus}
              onNavigate={setCurrentPage}
              onToast={showToast}
            />
          )}

          {currentPage === "customers" && (
            <CustomersView
              customers={customers}
              onNavigate={setCurrentPage}
              onAddCustomer={handleAddCustomer}
              onToast={showToast}
            />
          )}

          {currentPage === "crm" && <CRMView />}

          {currentPage === "products" && (
            <ProductsView
              products={products}
              onNavigate={setCurrentPage}
              onAddProduct={handleAddProduct}
            />
          )}

          {currentPage === "inventory" && (
            <InventoryView
              inventory={inventory}
              onNavigate={setCurrentPage}
              onUpdateInventory={setInventory}
            />
          )}

          {currentPage === "cash-flow" && (
            <CashFlowView
              mutations={cashMutations}
              onNavigate={setCurrentPage}
              onAddMutation={(mut) => {
                setCashMutations((prev) => [mut, ...prev]);
                showToast(`Mutasi ${mut.refNumber} berhasil dicatat.`);
              }}
            />
          )}

          {currentPage === "receivables" && (
            <ReceivablesView
              receivables={receivables}
              onNavigate={setCurrentPage}
              onSettleInvoice={handleSettleInvoice}
            />
          )}

          {currentPage === "financial-reports" && (
            <FinancialReportsView onNavigate={setCurrentPage} />
          )}

          {currentPage === "invoice-detail" && (
            <InvoiceDetailView onNavigate={setCurrentPage} />
          )}

          {currentPage === "settings" && (
            <SettingsView onNavigate={setCurrentPage} />
          )}
        </main>

        <QuickTransactionModal
          isOpen={isQuickTxOpen}
          onClose={() => setIsQuickTxOpen(false)}
          type={quickTxType}
          customers={customers}
          products={products}
          onAddMutation={handleAddMutation}
          onAddSPK={handleAddSPK}
          onToast={showToast}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
