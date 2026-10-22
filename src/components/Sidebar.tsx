import React from "react";
import { PageView } from "../types";

interface SidebarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  path: PageView;
  label: string;
  icon: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    group: "Utama",
    items: [
      {
        path: "dashboard" as PageView,
        label: "Dashboard",
        icon: "dashboard",
      },
    ],
  },
  {
    group: "Operasional",
    items: [
      {
        path: "pos" as PageView,
        label: "Penjualan / POS",
        icon: "point_of_sale",
      },
      {
        path: "orders" as PageView,
        label: "Pesanan & SPK",
        icon: "precision_manufacturing",
      },
      {
        path: "customers" as PageView,
        label: "Pelanggan",
        icon: "group",
      },
      {
        path: "products" as PageView,
        label: "Produk",
        icon: "chair",
      },
    ],
  },
  {
    group: "Persediaan",
    items: [
      {
        path: "inventory" as PageView,
        label: "Stok & Bahan",
        icon: "inventory_2",
      },
    ],
  },
  {
    group: "Keuangan",
    items: [
      {
        path: "cash-flow" as PageView,
        label: "Cash Flow",
        icon: "account_balance_wallet",
      },
      {
        path: "receivables" as PageView,
        label: "Piutang & Aging",
        icon: "request_quote",
      },
      {
        path: "financial-reports" as PageView,
        label: "Laporan Keuangan",
        icon: "bar_chart",
      },
    ],
  },
  {
    group: "Lainnya",
    items: [
      {
        path: "invoice-detail" as PageView,
        label: "Faktur / Nota",
        icon: "description",
      },
      // {
      //   path: "ai-advisor" as PageView,
      //   label: "Tanya AI Atelier",
      //   icon: "psychology",
      // },
      {
        path: "settings" as PageView,
        label: "Pengaturan",
        icon: "settings",
      },
    ],
  },
];

const BRAND = {
  background: "#5f402a",
  hover: "#795740",
  foreground: "#f6f3ee",
  accent: "#eabea1",
  highlight: "#ffdcc6",
};

interface MaterialIconProps {
  name: string;
  className?: string;
}

const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  className = "",
}) => (
  <span
    aria-hidden="true"
    className={`material-symbols-outlined select-none ${className}`}
  >
    {name}
  </span>
);

interface SidebarBrandProps {
  onCloseMobile: () => void;
}

const SidebarBrand: React.FC<SidebarBrandProps> = () => (
  <div className="shrink-0 border-b border-white/10 px-5 py-5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#795740] text-[#ffdcc6]">
        <MaterialIcon name="chair" className="text-[23px]" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[17px] font-semibold tracking-tight text-white">
          FurniERP
        </p>
        <p className="mt-0.5 text-xs text-[#eabea1]">Sistem Operasional</p>
      </div>
    </div>

    <div className="mt-4 flex items-center gap-2 rounded-md border border-white/10 bg-black/[0.10] px-3 py-2">
      <MaterialIcon
        name="verified_user"
        className="text-[17px] text-[#ffdcc6]"
      />
      <span className="text-xs font-medium text-[#f6f3ee]">Akses Pemilik</span>
    </div>
  </div>
);

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  isActive,
  onClick,
}) => (
  <button
    type="button"
    aria-current={isActive ? "page" : undefined}
    onClick={onClick}
    className={[
      "group relative flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px]",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffdcc6]",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-[#5f402a]",
      isActive
        ? "bg-[#f6f3ee] font-semibold text-[#5f402a]"
        : "font-medium text-[#e8d8cc] hover:bg-white/[0.08] hover:text-white",
    ].join(" ")}
  >
    {isActive && (
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#a56f48]"
      />
    )}

    <MaterialIcon
      name={item.icon}
      className={[
        "shrink-0 text-[20px]",
        isActive ? "text-[#795740]" : "text-[#eabea1] group-hover:text-white",
      ].join(" ")}
    />

    <span className="min-w-0 flex-1 truncate">{item.label}</span>
  </button>
);

interface NavigationSectionProps {
  section: NavSection;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

const NavigationSection: React.FC<NavigationSectionProps> = ({
  section,
  currentPage,
  onNavigate,
}) => (
  <section aria-label={section.group}>
    <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#eabea1]/70">
      {section.group}
    </h2>

    <div className="space-y-1">
      {section.items.map((item) => (
        <NavigationItem
          key={item.path}
          item={item}
          isActive={currentPage === item.path}
          onClick={() => onNavigate(item.path)}
        />
      ))}
    </div>
  </section>
);

const SidebarFooter: React.FC = () => (
  <div className="shrink-0 border-t border-white/10 px-5 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#f6f3ee]">FurniERP</p>
        <p className="mt-1 text-[10px] text-[#eabea1]/70">
          Panel pemilik · v2.4
        </p>
      </div>

      <MaterialIcon name="chair" className="text-[19px] text-[#eabea1]/70" />
    </div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleNavigate = (page: PageView) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Latar penutup untuk tampilan mobile */}
      <button
        type="button"
        aria-label="Tutup navigasi"
        aria-hidden={!isOpenMobile}
        tabIndex={isOpenMobile ? 0 : -1}
        onClick={onCloseMobile}
        className={[
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]",
          "transition-opacity duration-200 lg:hidden",
          isOpenMobile
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        id="app-sidebar"
        aria-label="Navigasi utama"
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[252px] flex-col",
          "border-r border-[#795740]/30 bg-[#5f402a] text-[#f6f3ee]",
          "transition-transform duration-200 ease-out",
          "lg:translate-x-0",
          isOpenMobile ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarBrand onCloseMobile={onCloseMobile} />

        <nav
          aria-label="Menu aplikasi"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
        >
          <div className="space-y-5">
            {navSections.map((section) => (
              <NavigationSection
                key={section.group}
                section={section}
                currentPage={currentPage}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </nav>

        <SidebarFooter />
      </aside>
    </>
  );
};
