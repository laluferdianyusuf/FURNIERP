"use client";

import {
  Armchair,
  ChartNoAxesCombined,
  Factory,
  FileText,
  Handshake,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  UsersRound,
  Wallet,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { PageView } from "../types";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../components/ui/sidebar";

import { Separator } from "../components/ui/separator";

const BRAND = {
  background: "#5f402a",
  foreground: "#f6f3ee",
  accent: "#eabea1",
  highlight: "#f6f3ee",
};

interface NavItem {
  id: PageView;
  title: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AppSidebarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Menu",
    items: [
      {
        id: "dashboard" as PageView,
        title: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "pos" as PageView,
        title: "Point of Sale / Kasir",
        icon: ShoppingCart,
      },
      {
        id: "orders" as PageView,
        title: "Pesanan & Produksi",
        icon: Factory,
      },
      {
        id: "customers" as PageView,
        title: "Pelanggan",
        icon: UsersRound,
      },
      {
        id: "crm" as PageView,
        title: "CRM & Penjualan",
        icon: Handshake,
      },
      {
        id: "products" as PageView,
        title: "Produk",
        icon: Armchair,
      },
      {
        id: "inventory" as PageView,
        title: "Inventaris",
        icon: Package,
      },
    ],
  },
  {
    title: "Keuangan",
    items: [
      {
        id: "cash-flow" as PageView,
        title: "Arus Kas",
        icon: Wallet,
      },
      {
        id: "receivables" as PageView,
        title: "Utang & Piutang",
        icon: Receipt,
      },
      {
        id: "financial-reports" as PageView,
        title: "Laporan Keuangan",
        icon: ChartNoAxesCombined,
      },
      {
        id: "invoice-detail" as PageView,
        title: "Invoice",
        icon: FileText,
      },
      {
        id: "settings" as PageView,
        title: "Pengaturan",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <ShadcnSidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r-0"
      style={
        {
          "--sidebar-background": "#5f402a",
          "--sidebar-foreground": "#f6f3ee",
          "--sidebar-primary": "#ffdcc6",
          "--sidebar-primary-foreground": "#5f402a",
          "--sidebar-accent": "rgba(255, 255, 255, 0.1)",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-border": "rgba(255, 255, 255, 0.15)",
        } as React.CSSProperties
      }
    >
      <SidebarHeader className="p-0">
        <div className="flex h-[76px] items-center gap-3 px-4">
          <div
            className="flex shrink-0 items-center justify-center rounded-xl"
            style={{
              color: BRAND.foreground,
            }}
          >
            <Armchair className="size-5" strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p
              className="truncate text-[17px] font-bold tracking-tight"
              style={{ color: BRAND.foreground }}
            >
              FurniERP
            </p>
          </div>
        </div>

        <Separator className="bg-white/15" />
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-2">
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.title} className="px-0 py-2">
            <SidebarGroupLabel
              className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: BRAND.accent }}
            >
              {section.title}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.id;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        onClick={() => onNavigate(item.id)}
                        className={`h-10 rounded-lg px-3 font-medium transition-colors ${
                          !active ? "hover:bg-white/10 hover:text-white" : ""
                        }`}
                        style={
                          active
                            ? {
                                backgroundColor: BRAND.highlight,
                                color: BRAND.background,
                              }
                            : {
                                color: BRAND.foreground,
                              }
                        }
                      >
                        <Icon
                          className="size-[18px] shrink-0"
                          strokeWidth={1.9}
                        />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Separator className="mb-2 bg-white/15" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Pengaturan akun"
              onClick={() => onNavigate("settings" as PageView)}
              className="h-12 rounded-lg px-2 hover:bg-white/10 hover:text-white transition-colors"
              style={{ color: BRAND.foreground }}
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: BRAND.highlight,
                  color: BRAND.background,
                }}
              >
                O
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">Owner</span>
                <span
                  className="truncate text-xs"
                  style={{ color: BRAND.accent }}
                >
                  Administrator
                </span>
              </div>

              <Settings className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
}

export default AppSidebar;
