import {
  CheckCircle2,
  MessageSquareText,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { money } from "../helpers/moneyFormatter";
import type { CRMActivity, CRMLead, CRMStage } from "../types";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const BROWN = "#5f402a";

const STAGES: CRMStage[] = [
  "Prospek Baru",
  "Sudah Dihubungi",
  "Negosiasi",
  "Menunggu Keputusan",
  "Deal",
  "Tidak Jadi",
];

const STAGE_STYLES: Record<CRMStage, string> = {
  "Prospek Baru": "border-sky-200 bg-sky-50 text-sky-700",
  "Sudah Dihubungi": "border-blue-200 bg-blue-50 text-blue-700",
  Negosiasi: "border-amber-200 bg-amber-50 text-amber-700",
  "Menunggu Keputusan": "border-orange-200 bg-orange-50 text-orange-700",
  Deal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Tidak Jadi": "border-rose-200 bg-rose-50 text-rose-700",
};

const PRIORITY_STYLES = {
  Rendah: "border-stone-200 bg-stone-100 text-stone-600",
  Normal: "border-blue-200 bg-blue-50 text-blue-700",
  Tinggi: "border-rose-200 bg-rose-50 text-rose-700",
};

const SOURCES: CRMLead["source"][] = [
  "WhatsApp",
  "Referensi",
  "Showroom",
  "Instagram",
  "Website",
  "Lainnya",
];

const CHANNELS: CRMActivity["channel"][] = [
  "WhatsApp",
  "Telepon",
  "Meeting",
  "Email",
  "Kunjungan",
];

const TODAY = new Date().toISOString().slice(0, 10);

const INITIAL_LEADS: CRMLead[] = [
  {
    id: "crm-001",
    code: "CRM-0001",
    name: "Budi Santoso",
    company: "Pelanggan Retail",
    phone: "081234567890",
    email: "",
    source: "WhatsApp",
    interest: "Sofa ruang tamu custom",
    estimatedValue: 12000000,
    stage: "Negosiasi",
    priority: "Tinggi",
    pic: "Owner",
    createdAt: TODAY,
    followUpDate: TODAY,
    notes: "Klien meminta penyesuaian warna dan harga.",
    activities: [
      {
        id: "act-001",
        date: TODAY,
        channel: "WhatsApp",
        summary: "Mengirim referensi model sofa.",
        result: "Klien tertarik dan meminta penawaran.",
        nextAction: "Kirim penawaran revisi.",
      },
    ],
  },
  {
    id: "crm-002",
    code: "CRM-0002",
    name: "Rina Amelia",
    company: "Pelanggan Retail",
    phone: "081298765432",
    email: "",
    source: "Showroom",
    interest: "Lemari custom",
    estimatedValue: 8500000,
    stage: "Menunggu Keputusan",
    priority: "Normal",
    pic: "Owner",
    createdAt: TODAY,
    followUpDate: TODAY,
    notes: "Menunggu persetujuan harga dari keluarga.",
    activities: [],
  },
  {
    id: "crm-003",
    code: "CRM-0003",
    name: "PT Contoh Sejahtera",
    company: "PT Contoh Sejahtera",
    phone: "081300000000",
    email: "procurement@example.com",
    source: "Referensi",
    interest: "Furnitur kantor",
    estimatedValue: 45000000,
    stage: "Sudah Dihubungi",
    priority: "Tinggi",
    pic: "Owner",
    createdAt: TODAY,
    followUpDate: TODAY,
    notes: "Calon proyek pengadaan meja dan kursi kantor.",
    activities: [],
  },
];

type LeadForm = {
  name: string;
  company: string;
  phone: string;
  email: string;
  source: CRMLead["source"];
  interest: string;
  estimatedValue: string;
  stage: CRMStage;
  priority: CRMLead["priority"];
  pic: string;
  followUpDate: string;
  notes: string;
  channel: CRMActivity["channel"];
  activitySummary: string;
  activityResult: string;
  nextAction: string;
};

const EMPTY_FORM: LeadForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  source: "WhatsApp",
  interest: "",
  estimatedValue: "",
  stage: "Prospek Baru",
  priority: "Normal",
  pic: "Owner",
  followUpDate: TODAY,
  notes: "",
  channel: "WhatsApp",
  activitySummary: "",
  activityResult: "",
  nextAction: "",
};

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isFollowUpLate(lead: CRMLead) {
  return (
    Boolean(lead.followUpDate) &&
    lead.followUpDate < TODAY &&
    lead.stage !== "Deal" &&
    lead.stage !== "Tidak Jadi"
  );
}

function isActiveLead(lead: CRMLead) {
  return lead.stage !== "Deal" && lead.stage !== "Tidak Jadi";
}

function makeNewCode(leads: CRMLead[]) {
  const highest = leads.reduce((max, lead) => {
    const number = Number(lead.code.match(/\d+$/)?.[0] || 0);
    return Math.max(max, number);
  }, 0);

  return `CRM-${String(highest + 1).padStart(4, "0")}`;
}

export function CRMView() {
  const [leads, setLeads] = useState<CRMLead[]>(INITIAL_LEADS);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("Semua Status");
  const [sourceFilter, setSourceFilter] = useState("Semua Sumber");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const activeLeads = useMemo(() => leads.filter(isActiveLead), [leads]);

  const totalPipeline = useMemo(
    () =>
      activeLeads.reduce(
        (sum, lead) => sum + Math.max(0, lead.estimatedValue),
        0,
      ),
    [activeLeads],
  );

  const dealLeads = leads.filter((lead) => lead.stage === "Deal");

  const totalDeal = dealLeads.reduce(
    (sum, lead) => sum + Math.max(0, lead.estimatedValue),
    0,
  );

  const overdueLeads = activeLeads.filter(isFollowUpLate);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const searchable = [
        lead.code,
        lead.name,
        lead.company,
        lead.phone,
        lead.email,
        lead.interest,
        lead.pic,
      ];

      const matchesSearch =
        !query ||
        searchable.some((value) => value.toLowerCase().includes(query));

      const matchesStage =
        stageFilter === "Semua Status" || lead.stage === stageFilter;

      const matchesSource =
        sourceFilter === "Semua Sumber" || lead.source === sourceFilter;

      return matchesSearch && matchesStage && matchesSource;
    });
  }, [leads, search, stageFilter, sourceFilter]);

  const openNewLead = () => {
    setEditingLeadId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const openEditLead = (lead: CRMLead) => {
    setEditingLeadId(lead.id);
    setForm({
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      interest: lead.interest,
      estimatedValue: String(lead.estimatedValue),
      stage: lead.stage,
      priority: lead.priority,
      pic: lead.pic,
      followUpDate: lead.followUpDate,
      notes: lead.notes,
      channel: lead.activities.at(-1)?.channel || "WhatsApp",
      activitySummary: "",
      activityResult: "",
      nextAction: "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const updateField = <K extends keyof LeadForm>(
    key: K,
    value: LeadForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const estimatedValue = Number(form.estimatedValue || 0);

    if (!form.name.trim()) {
      setFormError("Nama prospek wajib diisi.");
      return;
    }

    if (!form.phone.trim()) {
      setFormError("Nomor telepon wajib diisi.");
      return;
    }

    if (!form.interest.trim()) {
      setFormError("Kebutuhan atau produk yang diminati wajib diisi.");
      return;
    }

    if (!Number.isFinite(estimatedValue) || estimatedValue < 0) {
      setFormError("Estimasi nilai penjualan tidak valid.");
      return;
    }

    if (form.activitySummary.trim() && !form.activityResult.trim()) {
      setFormError("Isi hasil komunikasi jika kamu mencatat aktivitas.");
      return;
    }

    const existingLead = leads.find((lead) => lead.id === editingLeadId);

    const activity: CRMActivity | null = form.activitySummary.trim()
      ? {
          id: `act-${Date.now()}`,
          date: TODAY,
          channel: form.channel,
          summary: form.activitySummary.trim(),
          result: form.activityResult.trim(),
          nextAction: form.nextAction.trim() || undefined,
        }
      : null;

    const commonData = {
      name: form.name.trim(),
      company: form.company.trim() || "Perorangan",
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: form.source,
      interest: form.interest.trim(),
      estimatedValue,
      stage: form.stage,
      priority: form.priority,
      pic: form.pic.trim() || "Owner",
      followUpDate: form.followUpDate,
      notes: form.notes.trim(),
    };

    if (existingLead) {
      const updated: CRMLead = {
        ...existingLead,
        ...commonData,
        activities: activity
          ? [...existingLead.activities, activity]
          : existingLead.activities,
      };

      setLeads((current) =>
        current.map((lead) => (lead.id === existingLead.id ? updated : lead)),
      );
    } else {
      const newLead: CRMLead = {
        id: `crm-${Date.now()}`,
        code: makeNewCode(leads),
        ...commonData,
        createdAt: TODAY,
        lostReason: undefined,
        activities: activity ? [activity] : [],
      };

      setLeads((current) => [newLead, ...current]);
    }

    setDialogOpen(false);
    setEditingLeadId(null);
    setForm(EMPTY_FORM);
  };

  const handleStageChange = (leadId: string, stage: CRMStage) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)),
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setStageFilter("Semua Status");
    setSourceFilter("Semua Sumber");
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 text-stone-900">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">
            CRM & Penjualan
          </h1>
          <p className="mt-1 text-sm leading-5 text-stone-500">
            Kelola prospek, riwayat komunikasi, negosiasi, dan tindak lanjut
            pelanggan.
          </p>
        </div>

        <Button
          onClick={openNewLead}
          className="w-full bg-[#5f402a] text-white hover:bg-[#795740] sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Prospek
        </Button>
      </header>

      {/* Filter */}
      <Card className="rounded-xl border-stone-200 shadow-none">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, perusahaan, telepon, produk..."
                className="border-stone-200 bg-white pl-9 focus-visible:ring-[#795740]"
              />
            </div>

            <Select
              value={stageFilter}
              onValueChange={(value) => setStageFilter(value ?? "")}
            >
              <SelectTrigger className="w-full bg-white lg:w-[220px]">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Status">Semua Status</SelectItem>
                {STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sourceFilter}
              onValueChange={(value) => setSourceFilter(value ?? "")}
            >
              <SelectTrigger className="w-full bg-white lg:w-[180px]">
                <SelectValue placeholder="Semua sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Sumber">Semua Sumber</SelectItem>
                {SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
            <p className="text-xs text-stone-500">
              Menampilkan {filteredLeads.length} dari {leads.length} prospek
            </p>
            {(search ||
              stageFilter !== "Semua Status" ||
              sourceFilter !== "Semua Sumber") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-[#654832] hover:bg-[#eee5dc]"
              >
                Reset filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daftar prospek */}
      <Card className="min-w-0 overflow-hidden rounded-xl border-stone-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-stone-200 px-4 py-4 sm:px-5">
          <div>
            <CardTitle className="text-sm font-semibold">
              Daftar Prospek
            </CardTitle>
            <p className="mt-1 text-xs text-stone-500">
              Pilih prospek untuk melihat dan memperbarui proses penjualan.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-stone-200 bg-stone-50 text-stone-600"
          >
            {filteredLeads.length} data
          </Badge>
        </CardHeader>

        {filteredLeads.length === 0 ? (
          <CardContent className="py-14 text-center">
            <UserRound className="mx-auto h-9 w-9 text-stone-300" />
            <p className="mt-3 text-sm font-semibold text-stone-800">
              Prospek tidak ditemukan
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Ubah filter atau tambahkan prospek baru.
            </p>
          </CardContent>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {filteredLeads.map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-xl border border-stone-200 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-[#795740]">
                        {lead.code}
                      </p>
                      <h3 className="mt-1 break-words text-sm font-semibold">
                        {lead.name}
                      </h3>
                      <p className="mt-0.5 break-words text-xs text-stone-500">
                        {lead.company}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 whitespace-normal ${STAGE_STYLES[lead.stage]}`}
                    >
                      {lead.stage}
                    </Badge>
                  </div>

                  <div className="mt-3 rounded-lg bg-stone-50 p-3">
                    <p className="text-[11px] text-stone-500">
                      Produk / kebutuhan
                    </p>
                    <p className="mt-1 break-words text-sm font-medium">
                      {lead.interest}
                    </p>
                    <p className="mt-2 text-[11px] text-stone-500">
                      Estimasi nilai
                    </p>
                    <p className="mt-1 text-base font-bold text-stone-900">
                      {money(lead.estimatedValue)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-stone-500">Kontak</p>
                      <p className="mt-1 break-all font-medium">{lead.phone}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">PIC</p>
                      <p className="mt-1 break-words font-medium">{lead.pic}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Sumber</p>
                      <p className="mt-1">{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Follow-up</p>
                      <p
                        className={`mt-1 font-medium ${
                          isFollowUpLate(lead)
                            ? "text-rose-700"
                            : "text-stone-800"
                        }`}
                      >
                        {formatDate(lead.followUpDate)}
                        {isFollowUpLate(lead) ? " · Terlambat" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label className="text-xs text-stone-500">
                      Tahapan penjualan
                    </Label>
                    <Select
                      value={lead.stage}
                      onValueChange={(value) =>
                        handleStageChange(lead.id, value as CRMStage)
                      }
                    >
                      <SelectTrigger className="mt-1 h-9 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-3 w-full border-stone-200"
                    onClick={() => openEditLead(lead)}
                  >
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Detail & Catatan Komunikasi
                  </Button>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-left text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    <th className="px-4 py-3">Prospek</th>
                    <th className="px-4 py-3">Kebutuhan</th>
                    <th className="px-4 py-3 text-right">Nilai Peluang</th>
                    <th className="px-4 py-3">Tahapan</th>
                    <th className="px-4 py-3">Prioritas</th>
                    <th className="px-4 py-3">Follow-up</th>
                    <th className="px-4 py-3">PIC</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-stone-100 last:border-0 hover:bg-stone-50/70"
                    >
                      <td className="px-4 py-4">
                        <p className="text-[10px] font-medium text-[#795740]">
                          {lead.code}
                        </p>
                        <p className="mt-1 font-semibold text-stone-900">
                          {lead.name}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {lead.company}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {lead.phone}
                        </p>
                      </td>
                      <td className="max-w-[210px] px-4 py-4">
                        <p className="break-words font-medium">
                          {lead.interest}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Sumber: {lead.source}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">
                        {money(lead.estimatedValue)}
                      </td>
                      <td className="px-4 py-4">
                        <Select
                          value={lead.stage}
                          onValueChange={(value) =>
                            handleStageChange(lead.id, value as CRMStage)
                          }
                        >
                          <SelectTrigger className="h-9 min-w-[175px] border-stone-200 bg-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={PRIORITY_STYLES[lead.priority]}
                        >
                          {lead.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <p
                          className={`whitespace-nowrap text-xs font-medium ${
                            isFollowUpLate(lead)
                              ? "text-rose-700"
                              : "text-stone-700"
                          }`}
                        >
                          {formatDate(lead.followUpDate)}
                        </p>
                        {isFollowUpLate(lead) && (
                          <p className="mt-1 text-[10px] text-rose-600">
                            Terlambat
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs">{lead.pic}</td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditLead(lead)}
                          className="border-stone-200"
                        >
                          Detail / Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Dialog tambah/edit prospek */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setFormError("");
        }}
      >
        <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-stone-200 bg-[#fcf9f4] p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-stone-200 px-5 py-4 pr-12 text-left">
            <DialogTitle className="text-base font-bold">
              {editingLeadId ? "Detail & Edit Prospek" : "Tambah Prospek"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-5">
              Catat informasi calon pelanggan, tahap penjualan, dan aktivitas
              komunikasi.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-col overflow-hidden"
          >
            <div className="space-y-5 overflow-y-auto p-5">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Informasi Prospek</h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Nama kontak *">
                    <Input
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Nama pelanggan / kontak"
                      required
                    />
                  </FormField>

                  <FormField label="Perusahaan">
                    <Input
                      value={form.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      placeholder="Nama perusahaan atau Perorangan"
                    />
                  </FormField>

                  <FormField label="Nomor telepon *">
                    <Input
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </FormField>

                  <FormField label="Email">
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="email@perusahaan.com"
                    />
                  </FormField>

                  <FormField label="Sumber prospek">
                    <Select
                      value={form.source}
                      onValueChange={(value) =>
                        updateField("source", value as CRMLead["source"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="PIC / penanggung jawab">
                    <Input
                      value={form.pic}
                      onChange={(e) => updateField("pic", e.target.value)}
                      placeholder="Nama penanggung jawab"
                    />
                  </FormField>

                  <FormField
                    label="Produk / kebutuhan *"
                    className="sm:col-span-2"
                  >
                    <Input
                      value={form.interest}
                      onChange={(e) => updateField("interest", e.target.value)}
                      placeholder="Contoh: meja meeting 20 unit"
                      required
                    />
                  </FormField>

                  <FormField label="Estimasi nilai (Rp)">
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={form.estimatedValue}
                      onChange={(e) =>
                        updateField("estimatedValue", e.target.value)
                      }
                      placeholder="0"
                    />
                  </FormField>

                  <FormField label="Prioritas">
                    <Select
                      value={form.priority}
                      onValueChange={(value) =>
                        updateField("priority", value as CRMLead["priority"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rendah">Rendah</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Tinggi">Tinggi</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </section>

              <section className="space-y-3 border-t border-stone-200 pt-4">
                <h3 className="text-sm font-semibold">Status & Follow-up</h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Tahapan penjualan">
                    <Select
                      value={form.stage}
                      onValueChange={(value) =>
                        updateField("stage", value as CRMStage)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Tanggal follow-up">
                    <Input
                      type="date"
                      value={form.followUpDate}
                      onChange={(e) =>
                        updateField("followUpDate", e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Catatan prospek" className="sm:col-span-2">
                    <Textarea
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="Kebutuhan, keberatan harga, anggaran, kesepakatan..."
                      rows={3}
                    />
                  </FormField>
                </div>
              </section>

              <section className="space-y-3 border-t border-stone-200 pt-4">
                <div>
                  <h3 className="text-sm font-semibold">
                    Aktivitas Komunikasi
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    Opsional. Isi bagian ini untuk menambahkan catatan
                    komunikasi baru saat menyimpan.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Kanal komunikasi">
                    <Select
                      value={form.channel}
                      onValueChange={(value) =>
                        updateField("channel", value as CRMActivity["channel"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNELS.map((channel) => (
                          <SelectItem key={channel} value={channel}>
                            {channel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Ringkasan pembicaraan">
                    <Input
                      value={form.activitySummary}
                      onChange={(e) =>
                        updateField("activitySummary", e.target.value)
                      }
                      placeholder="Contoh: membahas harga sofa"
                    />
                  </FormField>

                  <FormField label="Hasil komunikasi">
                    <Textarea
                      value={form.activityResult}
                      onChange={(e) =>
                        updateField("activityResult", e.target.value)
                      }
                      placeholder="Apa hasil pembicaraannya?"
                      rows={2}
                    />
                  </FormField>

                  <FormField label="Tindak lanjut berikutnya">
                    <Textarea
                      value={form.nextAction}
                      onChange={(e) =>
                        updateField("nextAction", e.target.value)
                      }
                      placeholder="Contoh: kirim penawaran revisi"
                      rows={2}
                    />
                  </FormField>
                </div>
              </section>

              {editingLeadId && (
                <section className="space-y-3 border-t border-stone-200 pt-4">
                  <h3 className="text-sm font-semibold">Riwayat Komunikasi</h3>
                  {(() => {
                    const lead = leads.find(
                      (item) => item.id === editingLeadId,
                    );

                    if (!lead || lead.activities.length === 0) {
                      return (
                        <p className="rounded-lg border border-dashed border-stone-300 p-4 text-xs text-stone-500">
                          Belum ada riwayat komunikasi. Isi bagian Aktivitas
                          Komunikasi di atas untuk menambahkan catatan.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {[...lead.activities].reverse().map((activity) => (
                          <div
                            key={activity.id}
                            className="rounded-lg border border-stone-200 bg-white p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Badge
                                variant="outline"
                                className="border-stone-200 bg-stone-50"
                              >
                                {activity.channel}
                              </Badge>
                              <span className="text-xs text-stone-500">
                                {formatDate(activity.date)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium">
                              {activity.summary}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-stone-600">
                              {activity.result}
                            </p>
                            {activity.nextAction && (
                              <p className="mt-2 text-xs text-[#795740]">
                                Tindak lanjut: {activity.nextAction}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </section>
              )}

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
                >
                  {formError}
                </p>
              )}
            </div>

            <DialogFooter className="flex-col-reverse gap-2 border-t border-stone-200 bg-white p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-stone-200"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#5f402a] text-white hover:bg-[#795740]"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {editingLeadId ? "Simpan Perubahan" : "Simpan Prospek"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  warning = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  warning?: boolean;
}) {
  return (
    <Card className="min-w-0 rounded-xl border-stone-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-stone-500">{title}</p>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              warning
                ? "bg-rose-50 text-rose-700"
                : "bg-[#eee5dc] text-[#654832]"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>
        <p
          className={`mt-4 break-words text-xl font-bold tracking-tight sm:text-2xl ${
            warning ? "text-rose-700" : "text-stone-900"
          }`}
        >
          {value}
        </p>
        <p className="mt-3 border-t border-stone-200 pt-3 text-xs leading-5 text-stone-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <Label className="text-xs font-medium text-stone-700">{label}</Label>
      {children}
    </div>
  );
}

export default CRMView;
