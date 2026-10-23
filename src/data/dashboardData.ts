import { Clock3, ReceiptText } from "lucide-react";
import { PageView } from "../types";
import { AttentionItem, Transaction } from "../types/dashboard";

export const recentTransactions: Transaction[] = [
  {
    id: "TRX-1028",
    title: "Penjualan meja makan",
    detail: "Hari ini · Pelunasan",
    amount: 6_200_000,
    type: "in",
  },
  {
    id: "TRX-1027",
    title: "Pembelian bahan baku",
    detail: "Hari ini · Operasional",
    amount: 1_850_000,
    type: "out",
  },
  {
    id: "TRX-1026",
    title: "DP pesanan lemari",
    detail: "Kemarin · Uang muka",
    amount: 4_500_000,
    type: "in",
  },
  {
    id: "TRX-1025",
    title: "Biaya pengiriman",
    detail: "Kemarin · Logistik",
    amount: 350_000,
    type: "out",
  },
];

export const attentionItems: AttentionItem[] = [
  {
    title: "Tagihan melewati jatuh tempo",
    detail: "Toko Mebel Subur Makmur",
    amount: 18_500_000,
    status: "Lewat 4 hari",
    tone: "danger",
    page: "receivables" as PageView,
    icon: ReceiptText,
  },
  {
    title: "Tagihan segera jatuh tempo",
    detail: "Ibu Ratna Diningrum",
    amount: 8_250_000,
    status: "Besok",
    tone: "warning",
    page: "receivables" as PageView,
    icon: Clock3,
  },
];
