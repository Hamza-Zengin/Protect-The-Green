import { useId } from 'react';
import {
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  CloudRain,
  MapPin,
  MessageSquare,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import type {
  ComputedStationState,
  SimulationScenario,
  StationStatus,
} from '../types/river';

export interface FarmerPanelProps {
  selectedState: ComputedStationState;
  stations: ComputedStationState[];
  onSelectStation: (stationId: string) => void;
  simulationScenario: SimulationScenario;
}

interface StatusVisualConfig {
  defaultHeadline: string;
  cardClass: string;
  bannerClass: string;
  iconBoxClass: string;
  badgeText: string;
  badgeClass: string;
  bubbleAccentClass: string;
  Icon: typeof CheckCircle2;
}

const STATUS_VISUALS: Record<StationStatus, StatusVisualConfig> = {
  normal: {
    defaultHeadline: 'BUGÜN SULAMAYA UYGUN',
    cardClass: 'border-2 border-[#16a34a] bg-emerald-50/70',
    bannerClass: 'bg-[#16a34a] text-white',
    iconBoxClass: 'bg-white/20 text-white',
    badgeText: 'Güvenli Su Durumu',
    badgeClass: 'bg-white/20 text-white',
    bubbleAccentClass: 'border-l-4 border-l-[#16a34a]',
    Icon: CheckCircle2,
  },
  warning: {
    defaultHeadline: 'DİKKATLİ SULAMA ÖNERİLİR',
    cardClass: 'border-2 border-[#eab308] bg-amber-50/80',
    bannerClass: 'bg-amber-500 text-amber-950',
    iconBoxClass: 'bg-amber-950/10 text-amber-950',
    badgeText: 'Kontrollü Kullanım',
    badgeClass: 'bg-amber-950/10 text-amber-950',
    bubbleAccentClass: 'border-l-4 border-l-[#eab308]',
    Icon: AlertCircle,
  },
  critical: {
    defaultHeadline: 'BUGÜN SULAMAYA UYGUN DEĞİLDİR',
    cardClass: 'border-2 border-[#dc2626] bg-red-50/80',
    bannerClass: 'bg-[#dc2626] text-white',
    iconBoxClass: 'bg-white/20 text-white',
    badgeText: 'Sulamayı Durdurun',
    badgeClass: 'bg-white/20 text-white',
    bubbleAccentClass: 'border-l-4 border-l-[#dc2626]',
    Icon: ShieldAlert,
  },
};

function getFarmerSmsMessage(
  status: StationStatus,
  riverName: string,
  province: string
): string {
  switch (status) {
    case 'critical':
      return `UYARI: ${riverName} (${province}) hattında ani kirlilik tespit edildi. Bugün tarımsal sulama yapmaya uygun değildir.`;
    case 'warning':
      return `BİLGİ: ${riverName} (${province}) hattında su kalitesi sınır değerdedir. Hassas ürünlerde kontrollü sulama önerilir.`;
    case 'normal':
      return `BİLGİ: ${riverName} (${province}) hattında su değerleri tarımsal sulama için uygundur. Güvenle sulama yapabilirsiniz.`;
  }
}

/**
 * Çiftçiler için sade, günlük dilde sulama uygunluk kararı ve SMS/WhatsApp uyarı önizleme paneli.
 */
export function FarmerPanel({
  selectedState,
  stations,
  onSelectStation,
  simulationScenario,
}: FarmerPanelProps) {
  const selectId = useId();
  const { station, status, isSimulatedTarget, farmerHeadline, farmerAdvice } =
    selectedState;
  const visual = STATUS_VISUALS[status];
  const StatusIcon = visual.Icon;
  const headline = farmerHeadline || visual.defaultHeadline;
  const smsMessage = getFarmerSmsMessage(
    status,
    station.riverName,
    station.province
  );
  const showRainNote =
    status === 'normal' && simulationScenario === 'rain' && isSimulatedTarget;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 lg:h-full lg:overflow-y-auto lg:pr-0.5">
      {/* Bölge / Akarsu Seçici */}
      <section
        aria-label="Bölge ve Akarsu Seçimi"
        className="shrink-0 rounded-2xl border border-[#d5e2dd] bg-white p-3 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={selectId}
            className="text-sm font-bold text-[#0f2922]"
          >
            Bölgenizi / Akarsuyunuzu Seçin
          </label>

          <div className="relative">
            <select
              id={selectId}
              value={station.id}
              onChange={(e) => onSelectStation(e.target.value)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
              className="w-full cursor-pointer appearance-none bg-none rounded-xl border border-[#d5e2dd] bg-[#f8fbfa] py-2 pr-10 pl-3 text-sm font-semibold text-[#0f2922] transition-colors hover:border-[#0f766e]/60 focus:border-[#0f766e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e]/25"
            >
              {stations.map((item) => (
                <option key={item.station.id} value={item.station.id}>
                  {item.station.name} — {item.station.province}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#416158]"
              aria-hidden="true"
            />
          </div>

          {/* Seçili Bölge Konum Rozeti */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e2dd] bg-[#eaf1ee] px-2.5 py-0.5 text-xs font-semibold text-[#0f2922]">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 text-[#0f766e]"
                aria-hidden="true"
              />
              <span>
                {station.province} • {station.basinName}
              </span>
            </span>

            <span className="inline-flex items-center rounded-full border border-[#d5e2dd] bg-[#f8fbfa] px-2.5 py-0.5 text-xs font-medium text-[#416158]">
              {station.riverName}
            </span>

            {station.isPilot && (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                Pilot Bölge
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Büyük Net Sulama Durum Kartı */}
      <section
        aria-live="polite"
        aria-label="Günlük Sulama Durumu"
        className={`shrink-0 overflow-hidden rounded-2xl shadow-sm transition-colors ${visual.cardClass}`}
      >
        <div className={`px-4 py-3 ${visual.bannerClass}`}>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${visual.iconBoxClass}`}
              aria-hidden="true"
            >
              <StatusIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${visual.badgeClass}`}
              >
                {visual.badgeText}
              </span>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight leading-tight sm:text-xl xl:text-2xl">
                {headline}
              </h2>
              <p className="mt-0.5 text-xs font-medium opacity-90 sm:text-sm">
                {station.name} • {station.province}
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-3.5">
          <p className="text-sm font-medium leading-snug text-[#0f2922] sm:text-base">
            {farmerAdvice}
          </p>

          {showRainNote && (
            <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-emerald-300 bg-white/95 p-2.5 text-emerald-950 shadow-2xs">
              <CloudRain
                className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold leading-snug sm:text-sm">
                Yağmur sonrası su rengindeki hafif bulanıklık doğaldır, sulamaya
                engel bir kirlilik yoktur.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SMS / WhatsApp Uyarı Önizlemesi Kartı */}
      <section
        aria-label="Çiftçi SMS / WhatsApp Uyarı Önizlemesi"
        className="shrink-0 rounded-2xl border border-[#d5e2dd] bg-white p-3 shadow-sm"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf1ee] text-[#0f766e]">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0f2922] sm:text-base">
              Çiftçi SMS / WhatsApp Uyarı Önizlemesi
            </h3>
          </div>
          <span className="hidden rounded-full bg-[#f4f7f6] px-2.5 py-0.5 text-xs font-medium text-[#416158] sm:inline-flex">
            Otomatik Bildirim
          </span>
        </div>

        {/* Telefon Bildirim / Mesaj Çerçevesi */}
        <div className="overflow-hidden rounded-2xl border border-[#d5e2dd] bg-[#f4f7f6]">
          <div className="flex items-center justify-between border-b border-[#d5e2dd] bg-[#0f2922] px-3.5 py-1.5 text-white">
            <div className="flex items-center gap-2">
              <MessageSquare
                className="h-3.5 w-3.5 text-emerald-300"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold tracking-wide">
                Tarımsal Bilgilendirme Hattı
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-200">
              SMS / WhatsApp
            </span>
          </div>

          <div className="p-2.5 sm:p-3">
            <div
              className={`rounded-xl border border-[#d5e2dd] bg-white p-2.5 shadow-2xs sm:p-3 ${visual.bubbleAccentClass}`}
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0f766e]">
                  Protect The Green • Tarımsal Uyarı
                </span>
                <span className="text-[11px] font-medium text-[#416158]">
                  Az önce
                </span>
              </div>

              <p className="text-xs leading-relaxed text-[#0f2922] sm:text-sm">
                {smsMessage}
              </p>

              <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] font-medium text-[#416158]">
                <CheckCheck
                  className="h-3.5 w-3.5 text-[#0284c7]"
                  aria-hidden="true"
                />
                <span>İletildi</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FarmerPanel;
