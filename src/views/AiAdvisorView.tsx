import React, { useState } from "react";
import { PageView } from "../types";

interface AiAdvisorViewProps {
  onNavigate: (page: PageView) => void;
}

export const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "ai"; text: string; time: string }>
  >([
    {
      sender: "ai",
      text: "Halo Pak Hendra. Saya FurniAI Advisor, asisten kalkulasi operasional atelier mebel & strategi finansial Anda. Ada yang ingin dianalisis mengenai HPP kayu, batas plafon kredit reseller, atau jadwal produksi workshop hari ini?",
      time: "14:00 WIB",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const quickPrompts = [
    "Hitung estimasi HPP meja makan trembesi solid slab 3 meter",
    "Analisis risiko keterlambatan Toko Mebel Subur Makmur (>4 hari)",
    "Rekomendasi finishing kayu jati outdoor tahan cuaca & anti jamur",
    "Simulasi margin jika reseller minta diskon tambahan 5%",
  ];

  const handleSendPrompt = (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: "user" as const,
      text: textToSend,
      time: "Baru saja",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsAnalyzing(true);

    setTimeout(() => {
      let aiReply = "";
      const lower = textToSend.toLowerCase();

      if (
        lower.includes("trembesi") ||
        lower.includes("hpp") ||
        lower.includes("hitung")
      ) {
        aiReply = `Berikut rincian kalkulasi estimasi HPP untuk Meja Makan Trembesi Slab 300 × 100 × 8 cm:\n\n1. Bahan Baku Log: Volume net slab ~0.24 m³. Dengan rendemen kayu 55% & pengeringan kiln dry (MC 12-14%), estimasi modal kayu: Rp 2.450.000.\n2. Upah Tukang: Konstruksi, amplas bertahap (grit 80➔400): Rp 650.000.\n3. Finishing PU Propan Non-Yellowing (3 layer): Rp 420.000.\n4. Kaki Hollow Baja 50×100mm Sandblast: Rp 450.000.\n\nTotal HPP Dasar: Rp 3.970.000.\nRekomendasi Harga Jual:\n- Retail (Margin 48%): Rp 7.650.000\n- Reseller (Margin 38%): Rp 6.400.000\n- Owner Floor Price (Batas Nego Bawah): Rp 5.200.000`;
      } else if (
        lower.includes("subur") ||
        lower.includes("risiko") ||
        lower.includes("kredit")
      ) {
        aiReply = `Analisis Kredit Toko Mebel Subur Makmur (CUST-001):\n- Plafon Kredit: Rp 50.000.000 (Pemakaian saat ini: Rp 18.500.000 / 37%)\n- Keterlambatan: 4 hari sejak jatuh tempo 19 Okt 2024.\n- Rekam Jejak: Total transaksi Rp 342.8M (14 pesanan lunas sebelumnya).\n\nSaran Tindakan:\n1. Kirim pesan WA ramah menginformasikan barang sudah lolos QC tahap akhir di workshop.\n2. Jadwalkan pengiriman setelah transfer pelunasan diterima di rekening BCA.\n3. Pertahankan plafon kredit karena rekam jejak historis 98% tepat waktu.`;
      } else if (lower.includes("finishing") || lower.includes("outdoor")) {
        aiReply = `Rekomendasi Finishing Kayu Jati Outdoor (Taman / Gazebo / Teras):\n- Gunakan Teak Oil dengan UV Absorber atau Water-based Polyurethane Outdoor (Propan Aqua PU).\n- Hindari melamic indoor karena mudah memutih (blooming) terkena hujan dan sinar matahari langsung.\n- Pastikan kadar air (MC) kayu jati maksimal 12% sebelum dilapisi agar tidak memicu getah jati keluar.`;
      } else {
        aiReply = `Berdasarkan data operasional FurniERP saat ini, perputaran piutang (DSO) Anda sangat sehat pada 6.9 hari dengan kas likuid Rp 215.800.000. Setiap penyesuaian harga di kasir POS tetap harus mengacu pada Owner Floor Price agar margin kotor atelier tetap terjaga di atas target 40%.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiReply,
          time: "Baru saja",
        },
      ]);
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full space-y-6 mt-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          <span>FurniERP</span>
          <span>/</span>
          <span className="text-primary font-bold">Tanya AI Advisor</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-serif">
          Atelier AI Advisor & Furniture Estimator
        </h1>
        <p className="text-sm text-on-surface-variant max-w-3xl">
          Konsultasi cerdas kalkulasi HPP bahan baku kayu, analisis batas kredit
          pelanggan, dan rekomendasi spesifikasi mebel atelier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Chat Workspace (8-Cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col h-[650px] overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "ai" && (
                  <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">
                      smart_toy
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                    m.sender === "user"
                      ? "bg-primary text-on-primary rounded-br-none"
                      : "bg-surface-container-low text-on-surface border border-outline-variant/30 rounded-bl-none"
                  }`}
                >
                  <div className="font-sans">{m.text}</div>
                  <span
                    className={`text-[10px] block mt-1.5 text-right ${
                      m.sender === "user"
                        ? "text-primary-fixed-dim"
                        : "text-outline"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex gap-3 items-center text-xs text-on-surface-variant">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center animate-spin">
                  <span className="material-symbols-outlined text-[18px]">
                    autorenew
                  </span>
                </div>
                <span>
                  FurniAI sedang menganalisis database atelier & kalkulasi
                  kayu...
                </span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 bg-surface-container border-t border-outline-variant/20 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-secondary whitespace-nowrap">
              Rekomendasi:
            </span>
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPrompt(q)}
                className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface hover:bg-primary hover:text-on-primary text-[11px] font-medium whitespace-nowrap transition-colors border border-outline-variant/20"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
              placeholder="Tanyakan estimasi kayu, margin, atau analisis workshop..."
              className="flex-1 px-4 py-2.5 bg-surface-container-low rounded-xl text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary/30"
            />
            <button
              type="button"
              onClick={() => handleSendPrompt()}
              className="px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-tertiary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Kirim</span>
              <span className="material-symbols-outlined text-[16px]">
                send
              </span>
            </button>
          </div>
        </div>

        {/* Right Info Drawer (4-Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-secondary">
              Atelier Intelligence Metrics
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
                <span>Rata-Rata Rendemen Kayu:</span>
                <span className="font-bold font-mono text-on-surface">
                  52% (Efisien)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
                <span>Target Margin Kotor:</span>
                <span className="font-bold font-mono text-emerald-800">
                  &gt;40% (Aktual 42.8%)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
                <span>Standar MC Oven (Kiln Dry):</span>
                <span className="font-bold font-mono text-primary">
                  10% - 12%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
                <span>Kecepatan Perputaran Piutang:</span>
                <span className="font-bold font-mono text-on-surface">
                  6.9 Hari (Prima)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-secondary-container/30 border border-secondary/20 rounded-xl p-5 text-xs text-on-secondary-fixed leading-relaxed space-y-2">
            <span className="font-bold text-secondary block flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                info
              </span>
              Tips Strategis Owner Atelier
            </span>
            <p>
              Untuk menjaga cash flow tetap surplus, pastikan uang muka (DP)
              pesanan custom minimal 50% untuk menutup 100% biaya pembelian kayu
              log dan upah awal tukang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
