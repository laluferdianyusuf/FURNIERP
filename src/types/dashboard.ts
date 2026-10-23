import { PageView } from ".";

export type TransactionType = "in" | "out";

export interface Transaction {
  id: string;
  title: string;
  detail: string;
  amount: number;
  type: TransactionType;
}

export interface AttentionItem {
  title: string;
  detail: string;
  amount: number;
  status: string;
  tone: "danger" | "warning";
  page: PageView;
  icon: React.ElementType;
}

export interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconClassName?: string;
  dotClassName?: string;
  onClick: () => void;
}

export interface DashboardViewProps {
  onNavigate: (page: PageView) => void;
  onOpenQuickTx: (actionType?: string) => void;
  onToast: (msg: string) => void;
}

export interface SectionHeadingProps {
  title: string;
  action: string;
  onAction: () => void;
}
