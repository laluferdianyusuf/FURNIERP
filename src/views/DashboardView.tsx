import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  ReceiptText,
} from "lucide-react";
import React from "react";

import { MetricCard } from "../components/dashboard/MetricCard";
import { SectionHeading } from "../components/dashboard/SectionHeading";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { attentionItems, recentTransactions } from "../data/dashboardData";
import { money } from "../helpers/moneyFormatter";
import { DashboardViewProps } from "../types/dashboard";

const COLORS = {
  text: "#30251E",
  muted: "#82746D",
  border: "#E5E2DD",
  surface: "#FCFAF7",
  brown: "#5F402A",
  brownHover: "#795740",
  green: "#28734B",
  greenBg: "#EDF5EE",
  red: "#A3443F",
  redBg: "#F9EEEB",
  amber: "#8B672F",
  amberBg: "#F8F0DF",
} as const;

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const summary = {
    balance: 215_800_000,
    incoming: 142_250_000,
    outgoing: 78_600_000,
    receivables: 42_250_000,
  };

  return (
    <div className="flex w-full flex-col gap-6 text-[#30251E]">
      <section aria-labelledby="dashboard-summary-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="dashboard-summary-heading" className="text-sm font-semibold">
            Ringkasan {monthLabel}
          </h2>

          <p className="text-xs text-[#82746D]">
            Klik kartu untuk membuka detail
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Saldo kas"
            value={money(summary.balance)}
            description="Uang di kas dan bank"
            icon={Banknote}
            onClick={() => onNavigate("cash-flow")}
          />

          <MetricCard
            label="Uang masuk"
            value={money(summary.incoming)}
            description="Pemasukan bulan ini"
            icon={ArrowDownLeft}
            iconClassName="text-[#28734B]"
            dotClassName="bg-[#28734B]"
            onClick={() => onNavigate("cash-flow")}
          />

          <MetricCard
            label="Uang keluar"
            value={money(summary.outgoing)}
            description="Pengeluaran bulan ini"
            icon={ArrowUpRight}
            iconClassName="text-[#A3443F]"
            dotClassName="bg-[#A3443F]"
            onClick={() => onNavigate("cash-flow")}
          />

          <MetricCard
            label="Piutang"
            value={money(summary.receivables)}
            description="Tagihan belum diterima"
            icon={ReceiptText}
            iconClassName="text-[#8B672F]"
            dotClassName="bg-[#8B672F]"
            onClick={() => onNavigate("receivables")}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <Card className="min-w-0 gap-0 rounded-xl border-[#E5E2DD] bg-[#FCFAF7] py-0 shadow-none">
          <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
            <SectionHeading
              title="Transaksi terbaru"
              action="Lihat semua"
              onAction={() => onNavigate("cash-flow")}
            />
          </CardHeader>

          <CardContent className="p-4 pt-3 sm:p-5 sm:pt-3">
            <div className="divide-y divide-[#E5E2DD]">
              {recentTransactions.map((tx) => {
                const isIncoming = tx.type === "in";

                const TransactionIcon = isIncoming
                  ? ArrowDownLeft
                  : ArrowUpRight;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 py-3 first:pt-2 last:pb-1"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        isIncoming
                          ? "bg-[#EDF5EE] text-[#28734B]"
                          : "bg-[#F9EEEB] text-[#A3443F]"
                      }`}
                    >
                      <TransactionIcon aria-hidden="true" className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tx.title}</p>

                      <p className="mt-1 text-xs text-[#82746D]">{tx.detail}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          isIncoming ? "text-[#28734B]" : "text-[#30251E]"
                        }`}
                      >
                        {isIncoming ? "+" : "−"}
                        {money(tx.amount)}
                      </p>

                      <p className="mt-1 text-[10px] text-[#A69A8E]">{tx.id}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-0 rounded-xl border-[#E5E2DD] bg-[#FCFAF7] py-0 shadow-none">
          <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
            <SectionHeading
              title="Perlu ditindaklanjuti"
              action="Lihat piutang"
              onAction={() => onNavigate("receivables")}
            />
          </CardHeader>

          <CardContent className="p-4 pt-3 sm:p-5 sm:pt-3">
            <div className="divide-y divide-[#E5E2DD]">
              {attentionItems.map((item) => {
                const ItemIcon = item.icon;
                const isDanger = item.tone === "danger";

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onNavigate(item.page)}
                    className="
                      flex w-full items-start gap-3 py-4 text-left
                      first:pt-3 last:pb-1
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#795740]
                    "
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        isDanger
                          ? "bg-[#F9EEEB] text-[#A3443F]"
                          : "bg-[#F8F0DF] text-[#8B672F]"
                      }`}
                    >
                      <ItemIcon aria-hidden="true" className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>

                      <p className="mt-1 text-xs text-[#82746D]">
                        {item.detail}
                      </p>

                      <Badge
                        variant="outline"
                        className={`mt-2 rounded-md border-0 px-2 py-1 text-[10px] font-medium ${
                          isDanger
                            ? "bg-[#F9EEEB] text-[#A3443F]"
                            : "bg-[#F8F0DF] text-[#8B672F]"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {money(item.amount)}
                      </p>

                      <ChevronRight
                        aria-hidden="true"
                        className="ml-auto mt-2 size-5 text-[#A69A8E]"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DashboardView;
