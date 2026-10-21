import React, { useEffect, useId, useState } from "react";
import { Customer, Product } from "../types";

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  customers: Customer[];
  products: Product[];
  onAddMutation: (mut: {
    description: string;
    entity: string;
    category: string;
    account: "BCA" | "Mandiri" | "Kas Tunai";
    type: "IN" | "OUT" | "TRANSFER";
    amountIn: number;
    amountOut: number;
    tag?: string;
  }) => void;
  onAddSPK?: (spkData: {
    title: string;
    customerName: string;
    mandor: string;
    contractPrice: number;
    woodMaterial: string;
    dimensions: string;
    targetDate: string;
  }) => void;
  onToast: (msg: string) => void;
}

type TransactionTab = "inflow" | "outflow" | "transfer" | "spk";
type Account = "BCA" | "Mandiri" | "Kas Tunai";

interface Option<T extends string = string> {
  value: T;
  label: string;
}

const ACCOUNT_OPTIONS: Option<Account>[] = [
  { value: "BCA", label: "Bank BCA" },
  { value: "Mandiri", label: "Bank Mandiri" },
  { value: "Kas Tunai", label: "Kas Tunai" },
];

const INFLOW_CATEGORIES: Option[] = [
  { value: "DP Penjualan", label: "DP Pesanan" },
  { value: "Pelunasan Piutang", label: "Pelunasan Piutang" },
  { value: "Penjualan Retail", label: "Penjualan Retail" },
  { value: "Pendapatan Jasa", label: "Pendapatan Jasa" },
];

const OUTFLOW_CATEGORIES: Option[] = [
  { value: "Bahan Baku Kayu", label: "Bahan Baku Kayu" },
  { value: "Gaji Tukang", label: "Gaji / Borongan Tukang" },
  { value: "Bahan Finishing", label: "Bahan Finishing" },
  { value: "Listrik & Operasional", label: "Listrik & Operasional" },
  { value: "Biaya Kirim", label: "Ongkos Pengiriman" },
];

const MANDOR_OPTIONS = ["Pak Sukirno", "Pak Warno", "Pak Bambang", "Pak Joko"];

const FIELD_CLASS =
  "mt-1.5 block min-h-10 w-full rounded-lg border border-[#e3dcd4] bg-white px-3 py-2 text-[13px] text-[#35291f] outline-none transition-colors placeholder:text-[#a1968c] hover:border-[#cbb9a8] focus:border-[#795740] focus:ring-2 focus:ring-[#795740]/10 disabled:cursor-not-allowed disabled:bg-[#f4f0eb]";

const LABEL_CLASS = "block text-[12px] font-medium text-[#514238]";

const todayLocal = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const resolveTab = (type: string): TransactionTab => {
  if (
    type === "inflow" ||
    type === "outflow" ||
    type === "transfer" ||
    type === "spk"
  ) {
    return type;
  }

  return "inflow";
};

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const getTabDetails = (tab: TransactionTab) => {
  const details = {
    inflow: {
      title: "Catat Pemasukan",
      subtitle: "Catat uang yang benar-benar sudah diterima.",
      submitLabel: "Simpan Pemasukan",
      icon: "south_west",
    },
    outflow: {
      title: "Catat Pengeluaran",
      subtitle: "Catat pembayaran dan biaya operasional.",
      submitLabel: "Simpan Pengeluaran",
      icon: "north_east",
    },
    transfer: {
      title: "Transfer Antar Rekening",
      subtitle: "Pindahkan saldo antar rekening usaha.",
      submitLabel: "Catat Transfer",
      icon: "swap_horiz",
    },
    spk: {
      title: "Buat SPK Produksi",
      subtitle: "Buat instruksi kerja untuk pesanan mebel.",
      submitLabel: "Buat SPK",
      icon: "construction",
    },
  };

  return details[tab];
};

interface FieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, children, hint }) => (
  <div className="min-w-0">
    <label htmlFor={htmlFor} className={LABEL_CLASS}>
      {label}
    </label>

    {children}

    {hint && (
      <p className="mt-1 text-[11px] leading-relaxed text-[#8b7d71]">{hint}</p>
    )}
  </div>
);

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

interface SelectFieldProps {
  id: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
}) => (
  <select
    id={id}
    required={required}
    disabled={disabled}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={FIELD_CLASS}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

interface AmountFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

const AmountField: React.FC<AmountFieldProps> = ({
  id,
  label,
  value,
  onChange,
  hint,
}) => (
  <Field label={label} htmlFor={id} hint={hint}>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#795740]">
        Rp
      </span>

      <input
        id={id}
        type="number"
        min="1"
        step="1"
        required
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD_CLASS} pl-10 text-[15px] font-semibold tabular-nums`}
      />
    </div>
  </Field>
);

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  hint?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows,
  required = false,
  hint,
}) => (
  <Field label={label} htmlFor={id} hint={hint}>
    {rows ? (
      <textarea
        id={id}
        rows={rows}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${FIELD_CLASS} resize-y`}
      />
    ) : (
      <input
        id={id}
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
      />
    )}
  </Field>
);

interface TransactionTabButtonProps {
  id: TransactionTab;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  tabId: string;
  panelId: string;
}

const TransactionTabButton: React.FC<TransactionTabButtonProps> = ({
  id,
  label,
  icon,
  active,
  onClick,
  tabId,
  panelId,
}) => (
  <button
    id={tabId}
    type="button"
    role="tab"
    aria-selected={active}
    aria-controls={panelId}
    onClick={onClick}
    className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/40 sm:gap-2 sm:text-[12px] ${
      active
        ? "bg-white text-[#5f402a] shadow-sm"
        : "text-[#75675c] hover:bg-white/60 hover:text-[#35291f]"
    }`}
  >
    <MaterialIcon name={icon} className="text-[17px]" />
    <span className="truncate">{label}</span>
  </button>
);

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  customers,
  onAddMutation,
  onAddSPK,
  onToast,
}) => {
  const instanceId = useId();

  const [activeTab, setActiveTab] = useState<TransactionTab>(() =>
    resolveTab(type),
  );

  const [account, setAccount] = useState<Account>("BCA");
  const [transferTo, setTransferTo] = useState<Account>("Kas Tunai");

  const [category, setCategory] = useState("DP Penjualan");
  const [amount, setAmount] = useState("");
  const [entity, setEntity] = useState("");
  const [description, setDescription] = useState("");

  const [spkTitle, setSpkTitle] = useState("");
  const [spkCustomer, setSpkCustomer] = useState(customers[0]?.name ?? "");
  const [spkMandor, setSpkMandor] = useState(MANDOR_OPTIONS[0]);
  const [spkPrice, setSpkPrice] = useState("");
  const [spkWood, setSpkWood] = useState("");
  const [spkDim, setSpkDim] = useState("");
  const [spkTargetDate, setSpkTargetDate] = useState(todayLocal);

  useEffect(() => {
    if (!isOpen) return;

    const initialTab = resolveTab(type);

    setActiveTab(initialTab);
    setAmount("");
    setEntity("");
    setDescription("");
    setAccount("BCA");
    setTransferTo("Kas Tunai");
    setCategory(initialTab === "outflow" ? "Bahan Baku Kayu" : "DP Penjualan");

    setSpkTitle("");
    setSpkPrice("");
    setSpkWood("");
    setSpkDim("");
    setSpkMandor(MANDOR_OPTIONS[0]);
    setSpkTargetDate(todayLocal());
  }, [isOpen, type]);

  useEffect(() => {
    if (customers.length === 0) {
      setSpkCustomer("");
      return;
    }

    const customerExists = customers.some(
      (customer) => customer.name === spkCustomer,
    );

    if (!customerExists) {
      setSpkCustomer(customers[0].name);
    }
  }, [customers, spkCustomer]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const changeTab = (tab: TransactionTab) => {
    setActiveTab(tab);

    if (tab === "inflow") {
      setCategory("DP Penjualan");
    } else if (tab === "outflow") {
      setCategory("Bahan Baku Kayu");
    }
  };

  const validateAmount = () => {
    const value = parseAmount(amount);

    if (!Number.isSafeInteger(value) || value <= 0) {
      onToast("Nominal harus berupa angka bulat lebih dari Rp0.");
      return null;
    }

    return value;
  };

  const handleSubmitInflow = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = validateAmount();
    if (value === null) return;

    onAddMutation({
      description: description.trim() || "Penerimaan uang",
      entity: entity.trim()
        ? `Pembayar: ${entity.trim()}`
        : "Pembayar tidak dicantumkan",
      category,
      account,
      type: "IN",
      amountIn: value,
      amountOut: 0,
      tag: "Kas Masuk",
    });

    onToast(`Pemasukan ${formatRupiah(value)} dicatat ke ${account}.`);
    onClose();
  };

  const handleSubmitOutflow = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = validateAmount();
    if (value === null) return;

    onAddMutation({
      description: description.trim() || "Pengeluaran operasional",
      entity: entity.trim()
        ? `Penerima: ${entity.trim()}`
        : "Penerima tidak dicantumkan",
      category,
      account,
      type: "OUT",
      amountIn: 0,
      amountOut: value,
      tag: "Pengeluaran",
    });

    onToast(`Pengeluaran ${formatRupiah(value)} dicatat dari ${account}.`);
    onClose();
  };

  const handleSubmitTransfer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = validateAmount();
    if (value === null) return;

    if (account === transferTo) {
      onToast("Rekening asal dan tujuan harus berbeda.");
      return;
    }

    onAddMutation({
      description:
        description.trim() || `Transfer dari ${account} ke ${transferTo}`,
      entity: `Dari: ${account} → Ke: ${transferTo}`,
      category: "Transfer Rekening",
      account,
      type: "TRANSFER",
      amountIn: value,
      amountOut: value,
      tag: "Transfer Internal",
    });

    onToast(
      `Transfer ${formatRupiah(value)} dari ${account} ke ${transferTo} dicatat.`,
    );
    onClose();
  };

  const handleSubmitSPK = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onAddSPK) {
      onToast("Fitur pembuatan SPK belum terhubung.");
      return;
    }

    const title = spkTitle.trim();
    const contractPrice = parseAmount(spkPrice);

    if (!title) {
      onToast("Nama pesanan harus diisi.");
      return;
    }

    if (!Number.isSafeInteger(contractPrice) || contractPrice <= 0) {
      onToast("Nilai kontrak harus berupa angka bulat lebih dari Rp0.");
      return;
    }

    if (!spkCustomer) {
      onToast("Pilih pelanggan terlebih dahulu.");
      return;
    }

    if (!spkTargetDate) {
      onToast("Tentukan tanggal target penyelesaian.");
      return;
    }

    if (spkTargetDate < todayLocal()) {
      onToast("Tanggal target tidak boleh sebelum hari ini.");
      return;
    }

    onAddSPK({
      title,
      customerName: spkCustomer,
      mandor: spkMandor,
      contractPrice,
      woodMaterial: spkWood.trim(),
      dimensions: spkDim.trim(),
      targetDate: spkTargetDate,
    });

    onToast(`SPK "${title}" berhasil dibuat.`);
    onClose();
  };

  const tabs: {
    id: TransactionTab;
    label: string;
    icon: string;
  }[] = [
    { id: "inflow", label: "Pemasukan", icon: "south_west" },
    { id: "outflow", label: "Pengeluaran", icon: "north_east" },
    { id: "transfer", label: "Transfer", icon: "swap_horiz" },
    { id: "spk", label: "SPK", icon: "construction" },
  ];

  const details = getTabDetails(activeTab);
  const panelId = `${instanceId}-panel-${activeTab}`;
  const tabId = `${instanceId}-tab-${activeTab}`;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#241c16]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={handleBackdropClick}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${instanceId}-title`}
        className="flex max-h-[94dvh] w-full max-w-[600px] flex-col overflow-hidden rounded-t-2xl border border-[#e5ddd4] bg-[#fcfaf7] shadow-[0_24px_80px_rgba(36,28,22,0.2)] sm:max-h-[90dvh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e9e2da] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eee5dc] text-[#795740]">
              <MaterialIcon name={details.icon} className="text-[22px]" />
            </div>

            <div className="min-w-0 pt-0.5">
              <h2
                id={`${instanceId}-title`}
                className="text-[16px] font-semibold tracking-tight text-[#30251e] sm:text-[17px]"
              >
                {details.title}
              </h2>

              <p className="mt-1 text-[12px] leading-relaxed text-[#82746d]">
                {details.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#82746d] transition-colors hover:bg-[#eee8e1] hover:text-[#30251e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/40"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Transaction tabs */}
        <div className="shrink-0 border-b border-[#e9e2da] px-4 pt-3 sm:px-6">
          <div
            role="tablist"
            aria-label="Jenis transaksi"
            className="grid grid-cols-4 gap-1 rounded-xl bg-[#f0ebe5] p-1"
          >
            {tabs.map((tab) => (
              <TransactionTabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                active={activeTab === tab.id}
                onClick={() => changeTab(tab.id)}
                tabId={`${instanceId}-tab-${tab.id}`}
                panelId={`${instanceId}-panel-${tab.id}`}
              />
            ))}
          </div>
        </div>

        {/* Form area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div id={panelId} role="tabpanel" aria-labelledby={tabId}>
            {activeTab === "inflow" && (
              <form
                id={`${instanceId}-form`}
                onSubmit={handleSubmitInflow}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Uang masuk ke"
                    htmlFor={`${instanceId}-in-account`}
                  >
                    <SelectField
                      id={`${instanceId}-in-account`}
                      value={account}
                      onChange={(value) => setAccount(value as Account)}
                      options={ACCOUNT_OPTIONS}
                    />
                  </Field>

                  <Field
                    label="Kategori pemasukan"
                    htmlFor={`${instanceId}-in-category`}
                  >
                    <SelectField
                      id={`${instanceId}-in-category`}
                      value={category}
                      onChange={setCategory}
                      options={INFLOW_CATEGORIES}
                    />
                  </Field>
                </div>

                <AmountField
                  id={`${instanceId}-in-amount`}
                  label="Nominal pemasukan"
                  value={amount}
                  onChange={setAmount}
                  hint="Masukkan nominal uang yang benar-benar sudah diterima."
                />

                <TextField
                  id={`${instanceId}-in-entity`}
                  label="Pembayar / pelanggan"
                  value={entity}
                  onChange={setEntity}
                  placeholder="Nama pelanggan atau pihak pembayar"
                />

                <TextField
                  id={`${instanceId}-in-description`}
                  label="Keterangan"
                  value={description}
                  onChange={setDescription}
                  placeholder="Contoh: DP pesanan meja trembesi"
                  rows={2}
                />
              </form>
            )}

            {activeTab === "outflow" && (
              <form
                id={`${instanceId}-form`}
                onSubmit={handleSubmitOutflow}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Uang keluar dari"
                    htmlFor={`${instanceId}-out-account`}
                  >
                    <SelectField
                      id={`${instanceId}-out-account`}
                      value={account}
                      onChange={(value) => setAccount(value as Account)}
                      options={ACCOUNT_OPTIONS}
                    />
                  </Field>

                  <Field
                    label="Kategori pengeluaran"
                    htmlFor={`${instanceId}-out-category`}
                  >
                    <SelectField
                      id={`${instanceId}-out-category`}
                      value={category}
                      onChange={setCategory}
                      options={OUTFLOW_CATEGORIES}
                    />
                  </Field>
                </div>

                <AmountField
                  id={`${instanceId}-out-amount`}
                  label="Nominal pengeluaran"
                  value={amount}
                  onChange={setAmount}
                />

                <TextField
                  id={`${instanceId}-out-entity`}
                  label="Penerima / pemasok"
                  value={entity}
                  onChange={setEntity}
                  placeholder="Nama pemasok, tukang, atau penerima"
                />

                <TextField
                  id={`${instanceId}-out-description`}
                  label="Keterangan / nomor nota"
                  value={description}
                  onChange={setDescription}
                  placeholder="Contoh: Pembelian kayu jati"
                  rows={2}
                />
              </form>
            )}

            {activeTab === "transfer" && (
              <form
                id={`${instanceId}-form`}
                onSubmit={handleSubmitTransfer}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Rekening asal"
                    htmlFor={`${instanceId}-transfer-from`}
                  >
                    <SelectField
                      id={`${instanceId}-transfer-from`}
                      value={account}
                      onChange={setAccount as (value: string) => void}
                      options={ACCOUNT_OPTIONS}
                    />
                  </Field>

                  <Field
                    label="Rekening tujuan"
                    htmlFor={`${instanceId}-transfer-to`}
                  >
                    <SelectField
                      id={`${instanceId}-transfer-to`}
                      value={transferTo}
                      onChange={(value) => setTransferTo(value as Account)}
                      options={ACCOUNT_OPTIONS}
                    />
                  </Field>
                </div>

                {account === transferTo && (
                  <p className="rounded-lg border border-[#ead5b9] bg-[#fbf2e6] px-3 py-2.5 text-[12px] text-[#80572e]">
                    Pilih rekening tujuan yang berbeda dari rekening asal.
                  </p>
                )}

                <AmountField
                  id={`${instanceId}-transfer-amount`}
                  label="Nominal transfer"
                  value={amount}
                  onChange={setAmount}
                />

                <TextField
                  id={`${instanceId}-transfer-description`}
                  label="Keterangan transfer"
                  value={description}
                  onChange={setDescription}
                  placeholder="Contoh: Pemindahan dana operasional"
                  rows={2}
                />

                <div className="rounded-lg border border-[#e7ded4] bg-[#f5f0ea] p-3">
                  <div className="flex items-start gap-2">
                    <MaterialIcon
                      name="info"
                      className="mt-0.5 text-[18px] text-[#795740]"
                    />

                    <p className="text-[11px] leading-relaxed text-[#716154]">
                      Transfer internal memindahkan saldo antar rekening.
                      Transfer bukan pendapatan atau biaya operasional.
                    </p>
                  </div>
                </div>
              </form>
            )}

            {activeTab === "spk" && (
              <form
                id={`${instanceId}-form`}
                onSubmit={handleSubmitSPK}
                className="space-y-5"
              >
                <TextField
                  id={`${instanceId}-spk-title`}
                  label="Nama pesanan mebel"
                  value={spkTitle}
                  onChange={setSpkTitle}
                  placeholder="Contoh: Meja rapat kayu trembesi"
                  required
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Pelanggan"
                    htmlFor={`${instanceId}-spk-customer`}
                  >
                    <SelectField
                      id={`${instanceId}-spk-customer`}
                      value={spkCustomer}
                      onChange={setSpkCustomer}
                      disabled={customers.length === 0}
                      required
                      options={
                        customers.length === 0
                          ? [{ value: "", label: "Belum ada pelanggan" }]
                          : customers.map((customer: Customer) => ({
                              value: customer.name,
                              label: `${customer.name} · ${customer.tier}`,
                            }))
                      }
                    />

                    {customers.length === 0 && (
                      <p className="mt-1 text-[11px] text-[#9b5a3c]">
                        Tambahkan pelanggan terlebih dahulu.
                      </p>
                    )}
                  </Field>

                  <Field
                    label="Mandor penanggung jawab"
                    htmlFor={`${instanceId}-spk-mandor`}
                  >
                    <SelectField
                      id={`${instanceId}-spk-mandor`}
                      value={spkMandor}
                      onChange={setSpkMandor}
                      options={MANDOR_OPTIONS.map((mandor) => ({
                        value: mandor,
                        label: mandor,
                      }))}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Nilai kontrak (Rp)"
                    htmlFor={`${instanceId}-spk-price`}
                  >
                    <input
                      id={`${instanceId}-spk-price`}
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="18000000"
                      value={spkPrice}
                      onChange={(event) => setSpkPrice(event.target.value)}
                      className={`${FIELD_CLASS} font-semibold tabular-nums`}
                    />
                  </Field>

                  <Field
                    label="Target penyelesaian"
                    htmlFor={`${instanceId}-spk-date`}
                  >
                    <input
                      id={`${instanceId}-spk-date`}
                      type="date"
                      min={todayLocal()}
                      required
                      value={spkTargetDate}
                      onChange={(event) => setSpkTargetDate(event.target.value)}
                      className={FIELD_CLASS}
                    />
                  </Field>
                </div>

                <TextField
                  id={`${instanceId}-spk-wood`}
                  label="Bahan kayu utama"
                  value={spkWood}
                  onChange={setSpkWood}
                  placeholder="Contoh: Kayu jati solid"
                />

                <TextField
                  id={`${instanceId}-spk-dimensions`}
                  label="Dimensi produk"
                  value={spkDim}
                  onChange={setSpkDim}
                  placeholder="Contoh: 200 × 90 × 78 cm"
                  hint="Cantumkan satuan ukuran agar spesifikasi produksi jelas."
                />
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e9e2da] bg-white px-5 py-4 sm:px-6">
          <p className="hidden text-[11px] text-[#95877d] sm:block">
            {activeTab === "spk"
              ? "Periksa spesifikasi sebelum membuat SPK."
              : "Pastikan nominal dan rekening sudah benar."}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e3dcd4] bg-white px-4 text-[12px] font-medium text-[#62554b] transition-colors hover:bg-[#f7f3ee] hover:text-[#35291f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/30"
            >
              Batal
            </button>

            <button
              type="submit"
              form={`${instanceId}-form`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#795740] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#5f402a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#795740]/40 focus-visible:ring-offset-2"
            >
              <MaterialIcon
                name={activeTab === "spk" ? "assignment_turned_in" : "check"}
                className="text-[17px]"
              />
              {details.submitLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
