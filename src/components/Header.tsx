import React, { useEffect, useRef, useState } from "react";
import { PageView } from "../types";

interface HeaderProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onOpenMobileSidebar: () => void;
  onOpenQuickTx: (actionType?: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  action: string;
  color: string;
}

const PAGE_TITLES: Partial<Record<PageView, string>> = {
  dashboard: "Dashboard",
  pos: "Penjualan / POS",
  orders: "Pesanan & SPK",
  customers: "Pelanggan",
  products: "Produk",
  inventory: "Persediaan",
  "cash-flow": "Cash Flow",
  receivables: "Piutang",
  "financial-reports": "Laporan Keuangan",
  "invoice-detail": "Faktur / Nota",
  "ai-advisor": "Tanya AI Atelier",
  settings: "Pengaturan",
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Penjualan baru",
    description: "Buka kasir POS",
    icon: "point_of_sale",
    action: "pos",
    color: "text-[#795740]",
  },
  {
    label: "Catat pemasukan",
    description: "Uang masuk ke kas",
    icon: "south_west",
    action: "inflow",
    color: "text-emerald-700",
  },
  {
    label: "Catat pengeluaran",
    description: "Uang keluar dari kas",
    icon: "north_east",
    action: "outflow",
    color: "text-rose-700",
  },
  {
    label: "Buat SPK",
    description: "Pesanan produksi baru",
    icon: "precision_manufacturing",
    action: "spk",
    color: "text-[#795740]",
  },
  {
    label: "Transfer antar rekening",
    description: "Pindah saldo rekening",
    icon: "swap_horiz",
    action: "transfer",
    color: "text-[#795740]",
  },
];

const ICON_BUTTON_CLASS =
  "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#62554b] transition-colors hover:bg-[#f0ede9] hover:text-[#3f3026] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/40";

const DROPDOWN_CLASS =
  "absolute right-0 top-full z-[60] mt-2 overflow-hidden rounded-xl border border-[#e5e2dd] bg-white text-[#332920] shadow-[0_12px_35px_rgba(49,36,25,0.12)]";

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

interface IconButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  expanded?: boolean;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  label,
  icon,
  onClick,
  expanded,
  className = "",
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    aria-expanded={expanded}
    onClick={onClick}
    className={`${ICON_BUTTON_CLASS} ${className}`}
  >
    <MaterialIcon name={icon} className="text-[21px]" />
  </button>
);

interface QuickActionItemProps {
  item: QuickAction;
  onClick: () => void;
}

const QuickActionItem: React.FC<QuickActionItemProps> = ({ item, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#f7f3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/30"
  >
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3eee8] ${item.color}`}
    >
      <MaterialIcon name={item.icon} className="text-[19px]" />
    </span>

    <span className="min-w-0 flex-1">
      <span className="block text-[12px] font-medium text-[#3c3027]">
        {item.label}
      </span>
      <span className="mt-0.5 block text-[10px] text-[#82746d]">
        {item.description}
      </span>
    </span>

    <MaterialIcon name="chevron_right" className="text-[16px] text-[#b0a49a]" />
  </button>
);

interface NotificationsDropdownProps {
  onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  onClose,
}) => (
  <div
    role="dialog"
    aria-label="Pemberitahuan"
    className={`${DROPDOWN_CLASS} w-[min(320px,calc(100vw-24px))]`}
  >
    <div className="flex items-center justify-between border-b border-[#eee9e3] px-4 py-3">
      <div>
        <h2 className="text-[13px] font-semibold text-[#30251e]">
          Pemberitahuan
        </h2>
        <p className="mt-0.5 text-[11px] text-[#82746d]">
          Informasi untuk pemilik
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup pemberitahuan"
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#82746d] hover:bg-[#f0ede9]"
      >
        <MaterialIcon name="close" className="text-[18px]" />
      </button>
    </div>

    <div className="px-4 py-5 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f3eee8] text-[#795740]">
        <MaterialIcon name="notifications_none" className="text-[21px]" />
      </div>

      <p className="mt-3 text-[12px] font-medium text-[#4a3b30]">
        Belum ada pemberitahuan
      </p>

      <p className="mt-1 text-[11px] leading-relaxed text-[#82746d]">
        Notifikasi piutang jatuh tempo dan stok menipis dapat ditampilkan di
        sini setelah dihubungkan dengan data sistem.
      </p>
    </div>
  </div>
);

interface QuickActionsDropdownProps {
  onAction: (action: string) => void;
}

const QuickActionsDropdown: React.FC<QuickActionsDropdownProps> = ({
  onAction,
}) => (
  <div
    aria-label="Aksi cepat"
    className={`${DROPDOWN_CLASS} w-[min(280px,calc(100vw-24px))] p-1.5`}
  >
    <div className="px-3 pb-2 pt-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#95877d]">
        Aksi cepat
      </p>
    </div>

    {QUICK_ACTIONS.map((item) => (
      <QuickActionItem
        key={item.action}
        item={item}
        onClick={() => onAction(item.action)}
      />
    ))}
  </div>
);

const OwnerProfileButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Buka pengaturan"
    aria-label="Buka pengaturan pemilik"
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8c7b8] bg-[#eee5dc] transition-colors hover:bg-[#e4d5c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/40 sm:h-9 sm:w-auto sm:gap-2 sm:rounded-lg sm:border-transparent sm:bg-transparent sm:px-1.5 sm:hover:bg-[#f0ede9]"
  >
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#795740] text-[11px] font-semibold text-white">
      OW
    </span>

    <span className="hidden pr-1 text-left xl:block">
      <span className="block text-[11px] font-semibold leading-4 text-[#30251e]">
        Pemilik
      </span>
      <span className="block text-[10px] leading-4 text-[#82746d]">Owner</span>
    </span>
  </button>
);

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenMobileSidebar,
  onOpenQuickTx,
  searchQuery,
  onSearchChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTxMenu, setShowTxMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const transactionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const pageTitle = PAGE_TITLES[currentPage] ?? "Dashboard";

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (!notificationsRef.current?.contains(target)) {
        setShowNotifications(false);
      }

      if (!transactionRef.current?.contains(target)) {
        setShowTxMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowTxMenu(false);
      }

      // Pintasan "/" untuk memfokuskan pencarian tanpa mengganggu input lain.
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const target = event.target;

        if (
          target instanceof HTMLElement &&
          (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        ) {
          return;
        }

        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setShowNotifications(false);
    setShowTxMenu(false);
  }, [currentPage]);

  const handleQuickAction = (action: string) => {
    setShowTxMenu(false);

    if (action === "pos") {
      onNavigate("pos");
      return;
    }

    onOpenQuickTx(action);
  };

  const handleSearchClear = () => {
    onSearchChange("");
    searchRef.current?.focus();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#e5e2dd] bg-[#fcf9f4] px-3 sm:px-5 lg:left-[252px]">
      {/* Left: mobile navigation, breadcrumb and search */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
        <IconButton
          label="Buka navigasi"
          icon="menu"
          onClick={onOpenMobileSidebar}
          className="lg:hidden"
        />

        {/* Page title */}
        <div className="hidden min-w-0 shrink-0 items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eee5dc] text-[#795740]">
            <MaterialIcon name="chair" className="text-[19px]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-[#82746d]">
              <span>FurniERP</span>
              <span aria-hidden="true">/</span>
            </div>

            <h1
              className="max-w-[190px] truncate text-[13px] font-semibold text-[#30251e]"
              title={pageTitle}
            >
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Global search */}
        <label className="flex h-9 min-w-0 max-w-[420px] flex-1 items-center gap-2 rounded-lg border border-transparent bg-[#f0ede9] px-3 transition-colors focus-within:border-[#b9a08c] focus-within:bg-white">
          <MaterialIcon
            name="search"
            className="shrink-0 text-[19px] text-[#82746d]"
          />

          <input
            ref={searchRef}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari produk, pelanggan..."
            aria-label="Cari produk, pelanggan, atau transaksi"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-[#30251e] outline-none placeholder:text-[#95877d] focus:ring-0"
          />

          {searchQuery ? (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={handleSearchClear}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#82746d] hover:bg-[#e5e0da] hover:text-[#30251e]"
            >
              <MaterialIcon name="close" className="text-[16px]" />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded border border-[#e1dcd5] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#82746d] md:inline-block">
              /
            </kbd>
          )}
        </label>
      </div>

      {/* Right: date, notifications, transactions and profile */}
      <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-[#62554b] xl:flex">
          <MaterialIcon
            name="calendar_today"
            className="text-[17px] text-[#795740]"
          />
          <span>{currentDate}</span>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-[#e5e2dd] xl:block" />

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <IconButton
            label="Pemberitahuan"
            icon="notifications"
            expanded={showNotifications}
            onClick={() => {
              setShowNotifications((previous) => !previous);
              setShowTxMenu(false);
            }}
          />

          {showNotifications && (
            <NotificationsDropdown
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* Quick transaction actions */}
        <div className="relative" ref={transactionRef}>
          <button
            type="button"
            onClick={() => {
              setShowTxMenu((previous) => !previous);
              setShowNotifications(false);
            }}
            aria-expanded={showTxMenu}
            aria-haspopup="true"
            aria-label="Buka menu transaksi"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#795740] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#5f402a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/40 focus-visible:ring-offset-2"
          >
            <MaterialIcon name="add" className="text-[18px]" />
            <span className="hidden sm:inline">Transaksi</span>
            <MaterialIcon
              name="expand_more"
              className="hidden text-[16px] sm:inline"
            />
          </button>

          {showTxMenu && <QuickActionsDropdown onAction={handleQuickAction} />}
        </div>

        <div className="mx-1 hidden h-6 w-px bg-[#e5e2dd] sm:block" />

        {/* Owner profile */}
        <OwnerProfileButton onClick={() => onNavigate("settings")} />
      </div>
    </header>
  );
};
