import React, { useState } from 'react';
import { PageView, Customer, Product, InventoryItem, ProductionOrder, CashMutation, ReceivableInvoice } from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
  INITIAL_SPK_ORDERS,
  INITIAL_CASH_MUTATIONS,
  INITIAL_RECEIVABLES
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickTransactionModal } from './components/QuickTransactionModal';

// Views
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { OrdersProductionView } from './views/OrdersProductionView';
import { CustomersView } from './views/CustomersView';
import { ProductsView } from './views/ProductsView';
import { InventoryView } from './views/InventoryView';
import { CashFlowView } from './views/CashFlowView';
import { ReceivablesView } from './views/ReceivablesView';
import { FinancialReportsView } from './views/FinancialReportsView';
import { InvoiceDetailView } from './views/InvoiceDetailView';
import { AiAdvisorView } from './views/AiAdvisorView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick transaction modal
  const [isQuickTxOpen, setIsQuickTxOpen] = useState(false);
  const [quickTxType, setQuickTxType] = useState('inflow');

  // Shared application data state
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<ProductionOrder[]>(INITIAL_SPK_ORDERS);
  const [cashMutations, setCashMutations] = useState<CashMutation[]>(INITIAL_CASH_MUTATIONS);
  const [receivables, setReceivables] = useState<ReceivableInvoice[]>(INITIAL_RECEIVABLES);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleOpenQuickTx = (type: string = 'inflow') => {
    setQuickTxType(type);
    setIsQuickTxOpen(true);
  };

  const handleAddMutation = (mutData: {
    description: string;
    entity: string;
    category: string;
    account: 'BCA' | 'Mandiri' | 'Kas Tunai';
    type: 'IN' | 'OUT' | 'TRANSFER';
    amountIn: number;
    amountOut: number;
    tag?: string;
  }) => {
    const lastBalance = cashMutations[0]?.runningBalance || 215800000;
    const diff = mutData.amountIn - mutData.amountOut;
    const newTx: CashMutation = {
      id: `tx-${Date.now()}`,
      refNumber: `${mutData.type === 'IN' ? 'CR' : mutData.type === 'OUT' ? 'CD' : 'TR'}-202410-${Math.floor(100 + Math.random() * 900)}`,
      date: '23/10/2024',
      time: 'Baru saja',
      description: mutData.description,
      entity: mutData.entity,
      category: mutData.category,
      account: mutData.account,
      type: mutData.type,
      amountIn: mutData.amountIn,
      amountOut: mutData.amountOut,
      runningBalance: lastBalance + diff,
      tag: mutData.tag || 'POS / Quick Entry'
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
      customerTier: 'Retail',
      mandor: spkData.mandor,
      contractPrice: spkData.contractPrice,
      estimatedHpp: estHpp,
      actualCost: 0,
      dpPaid: Math.round(spkData.contractPrice * 0.5),
      remainingDebt: Math.round(spkData.contractPrice * 0.5),
      progressPercent: 5,
      currentStage: 'Persiapan Bahan & Potong Log',
      startDate: '23 Okt 2024',
      targetDate: spkData.targetDate || '15 Nov 2024',
      status: 'Antrean',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJNxZI3A1SLq6yYhuu9iVvxMYCBCtDQZ_Y5j2N8ccc4jsqNb1-B-hUPng9PZry928ZKD0fed2wGIBqkcfKwmUvZBwfVde4hcMb51qBmNsPHwVOJQp5Xj08600WHOxdfF5y--HU-_XNt3PemZp9l6od_xCCkRHlt4vUwsqMqDFMZ5Z6sx65QCn9zLdFAQ540EurrqvB3XCHBkmJGKrGQMkf8hCExRt_l3rA9oI7K08dImogCET3gIPC',
      dimensions: spkData.dimensions,
      woodMaterial: spkData.woodMaterial,
      brassAccent: 'Brass Accents',
      finishing: 'Natural Satin PU',
      notes: 'Pesanan custom via Quick Entry',
      bom: [
        { id: 'b1', name: 'Bahan Baku Kayu Solid', spec: spkData.woodMaterial, volume: '1 Lot', unitPrice: Math.round(estHpp * 0.6), subtotal: Math.round(estHpp * 0.6), status: 'Tersedia' },
        { id: 'b2', name: 'Upah Tukang Kayu Borongan', spec: 'Tukang Halus Jepara', volume: '1 Lot', unitPrice: Math.round(estHpp * 0.25), subtotal: Math.round(estHpp * 0.25), status: 'Workshop' },
        { id: 'b3', name: 'Finishing & Chemical', spec: 'Melamic Satin Propan', volume: '1 Lot', unitPrice: Math.round(estHpp * 0.15), subtotal: Math.round(estHpp * 0.15), status: 'Tersedia' }
      ],
      steps: [
        { title: 'Pembelian Log & Oven Kayu (Kiln Dry)', description: 'MC 10-12% tercapai', date: '23 Okt', completed: true },
        { title: 'Pemotongan & Serut Bahan', description: 'Pembelahan balok utama', date: '24 Okt', completed: false, current: true, worker: spkData.mandor },
        { title: 'Perakitan Konstruksi Mebel', description: 'Purus dan sambungan kayu', date: '28 Okt', completed: false },
        { title: 'Proses Finishing & Sanding', description: 'Pelapisan PU Natural', date: '04 Nov', completed: false },
        { title: 'Quality Control (QC) & Packing', description: 'Pemeriksaan akhir owner', date: '10 Nov', completed: false }
      ]
    };

    setOrders([newSpk, ...orders]);
  };

  const handleSettleInvoice = (invoiceId: string, amount: number, account: 'BCA' | 'Mandiri' | 'Kas Tunai', notes: string) => {
    setReceivables(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + amount;
          const newDebt = Math.max(0, inv.totalAmount - newPaid);
          return {
            ...inv,
            paidAmount: newPaid,
            remainingDebt: newDebt,
            isOverdue: newDebt > 0 ? inv.isOverdue : false
          };
        }
        return inv;
      })
    );

    // Also record cash mutation
    const matchingInv = receivables.find(i => i.id === invoiceId);
    handleAddMutation({
      description: `Pelunasan Piutang ${matchingInv?.invoiceNumber || ''} (${notes})`,
      entity: `Pelanggan: ${matchingInv?.customerName || ''}`,
      category: 'Pelunasan Piutang',
      account,
      type: 'IN',
      amountIn: amount,
      amountOut: 0,
      tag: 'Auto Settle'
    });
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
    showToast(`Produk "${newProduct.name}" (${newProduct.sku}) berhasil ditambahkan ke katalog.`);
  };

  const handleAddCustomer = (newCust: Customer) => {
    setCustomers([newCust, ...customers]);
    showToast(`Pelanggan "${newCust.name}" berhasil terdaftar di sistem.`);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1c1c19] flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#5f402a] text-[#ffffff] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-[#795740] animate-bounce">
          <span className="material-symbols-outlined text-[#86efac] text-lg">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Persistent / Responsive Dark Walnut Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="lg:pl-60 flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Persistent Top Navigation Header */}
        <Header
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenQuickTx={handleOpenQuickTx}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="w-full pt-16 flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentPage}
              onOpenQuickTx={handleOpenQuickTx}
              onToast={showToast}
            />
          )}

          {currentPage === 'pos' && (
            <PosView
              products={products}
              customers={customers}
              onNavigate={setCurrentPage}
              onToast={showToast}
            />
          )}

          {currentPage === 'orders' && (
            <OrdersProductionView
              orders={orders}
              onNavigate={setCurrentPage}
              onOpenQuickTx={handleOpenQuickTx}
              onToast={showToast}
            />
          )}

          {currentPage === 'customers' && (
            <CustomersView
              customers={customers}
              onNavigate={setCurrentPage}
              onAddCustomer={handleAddCustomer}
              onToast={showToast}
            />
          )}

          {currentPage === 'products' && (
            <ProductsView
              products={products}
              onNavigate={setCurrentPage}
              onAddProduct={handleAddProduct}
            />
          )}

          {currentPage === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onNavigate={setCurrentPage}
              onUpdateInventory={setInventory}
            />
          )}

          {currentPage === 'cash-flow' && (
            <CashFlowView
              mutations={cashMutations}
              onNavigate={setCurrentPage}
              onAddMutation={(mut) => {
                setCashMutations([mut, ...cashMutations]);
                showToast(`Mutasi ${mut.refNumber} berhasil dicatat.`);
              }}
            />
          )}

          {currentPage === 'receivables' && (
            <ReceivablesView
              receivables={receivables}
              onNavigate={setCurrentPage}
              onSettleInvoice={handleSettleInvoice}
            />
          )}

          {currentPage === 'financial-reports' && (
            <FinancialReportsView onNavigate={setCurrentPage} />
          )}

          {currentPage === 'invoice-detail' && (
            <InvoiceDetailView onNavigate={setCurrentPage} />
          )}

          {currentPage === 'ai-advisor' && (
            <AiAdvisorView onNavigate={setCurrentPage} />
          )}

          {currentPage === 'settings' && (
            <SettingsView onNavigate={setCurrentPage} />
          )}
        </main>
      </div>

      {/* Global Quick Transaction Modal */}
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
    </div>
  );
}
