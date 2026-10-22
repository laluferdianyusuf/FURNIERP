export type PageView =
  | "dashboard"
  | "pos"
  | "orders"
  | "customers"
  | "products"
  | "inventory"
  | "cash-flow"
  | "receivables"
  | "financial-reports"
  | "invoice-detail"
  | "settings";

export type CustomerTier = "Retail" | "Reseller" | "Grosir";

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  city: string;
  address: string;
  tier: CustomerTier;
  creditLimit: number;
  creditUsed: number;
  totalSpend: number;
  activeDebt: number;
  lastTransactionDate: string;
  rating: string;
  ordersCount: number;
  picName: string;
  email: string;
  debtStatus: "has-debt" | "overdue" | "settled";
  terms: string;
  image?: string;
}

export interface ProductTierPrice {
  retail: number;
  reseller: number;
  grosir: number;
}

export interface BOMItem {
  id: string;
  name: string;
  spec: string;
  volume: string;
  unitPrice: number;
  subtotal: number;
  status: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  image: string;
  woodType: string;
  dimensions: string;
  thickness: string;
  finishing: string;
  legConstruction: string;
  type: "Ready Stock" | "PO 14-21 Hari";
  hpp: number;
  bomComponentsCount: number;
  prices: ProductTierPrice;
  stockPhysical: number;
  stockReserved: number;
  stockAvailable: number;
  bufferMin: number;
  ownerFloorPrice: number;
  status: "Aman" | "Menipis" | "Kritis";
  bomItems?: BOMItem[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  unitType: string;
  physical: number;
  reserved: number;
  available: number;
  hppPerUnit: number;
  totalHpp: number;
  status: "Aman" | "Menipis" | "Kritis!";
  image?: string;
  spec?: string;
  isRawMaterial: boolean;
  minSafety: number;
}

export interface ProductionOrder {
  id: string;
  spkNumber: string;
  title: string;
  customerName: string;
  customerTier: CustomerTier;
  mandor: string;
  contractPrice: number;
  estimatedHpp: number;
  actualCost: number;
  dpPaid: number;
  remainingDebt: number;
  progressPercent: number;
  currentStage: string;
  startDate: string;
  targetDate: string;
  status:
    | "Prioritas (Sisa 4 Hari)"
    | "Tenggat Besok"
    | "Normal"
    | "Antrean"
    | "Tunggu Suplai";
  image: string;
  dimensions: string;
  woodMaterial: string;
  brassAccent: string;
  finishing: string;
  notes: string;
  bom: BOMItem[];
  steps: {
    title: string;
    description: string;
    date: string;
    completed: boolean;
    current?: boolean;
    worker?: string;
  }[];
}

export interface CashMutation {
  id: string;
  refNumber: string;
  date: string;
  time: string;
  description: string;
  entity: string;
  category: string;
  account: "BCA" | "Mandiri" | "Kas Tunai";
  type: "IN" | "OUT" | "TRANSFER";
  amountIn: number;
  amountOut: number;
  runningBalance: number;
  sourceAccount?: string;
  destAccount?: string;
  tag?: string;
}

export interface ReceivableInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerTier: CustomerTier;
  spkRef: string;
  itemSummary: string;
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  dueDate: string;
  status: "Lewat 4 Hari" | "Besok" | "5 Hari" | "13 Hari" | "18 Hari";
  isOverdue: boolean;
  picName: string;
  phone: string;
  creditLimit: number;
  creditUsedPercent: number;
  score: string;
  orderDescription: string;
  qcDate: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  notes?: string;
}
