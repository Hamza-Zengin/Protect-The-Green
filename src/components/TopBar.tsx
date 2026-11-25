import {
  AlertTriangle,
  CloudRain,
  Droplets,
  RotateCcw,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import type { SimulationScenario, ViewMode } from '../types/river';

export interface TopBarProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  simulationScenario: SimulationScenario;
  onSimulateDischarge: () => void;
  onSimulateRain: () => void;
  onResetSimulation: () => void;
  selectedStationName?: string;
}

/**
 * Kurumsal üst gezinme ve canlı simülasyon kontrol çubuğu.
 */
export function TopBar({
  viewMode,
  onChangeViewMode,
  simulationScenario,
  onSimulateDischarge,
  onSimulateRain,
  onResetSimulation,
  selectedStationName,
}: TopBarProps) {
  const isDischargeActive = simulationScenario === 'discharge';
  const isRainActive = simulationScenario === 'rain';
  const isSimulationActive = simulationScenario !== 'normal';

  return (
    <header className="relative z-20 w-full shrink-0 border-b border-[#d5e2dd] bg-[#ffffff] text-[#0f2922]">
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-4 py-2.5 lg:px-6">
        {/* Sol Bölüm: Marka Kimliği ve Seçili İstasyon Göstergesi */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0284c7] text-white shadow-xs"
            aria-hidden="true"
          >
            <Droplets className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-bold tracking-tight text-[#0f2922] leading-tight">
                Protect The Green
              </h1>
              {selectedStationName && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e2dd] bg-[#f4f7f6] px-2.5 py-0.5 text-[11px] font-medium text-[#416158]"
                  title={`Seçili İstasyon: ${selectedStationName}`}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f766e]"
                    aria-hidden="true"
                  />
                  <span className="max-w-[160px] truncate text-[#0f2922]">
                    {selectedStationName}
                  </span>
                </span>
              )}
            </div>
            <p className="truncate text-xs font-medium text-[#416158] leading-snug">
              Akıllı Akarsu Denetimi — Canlı Karar Paneli
            </p>
          </div>
        </div>

        {/* Orta Bölüm: Tek Tıkla Çift Görünüm Modu Geçişi */}
        <div
          role="group"
          aria-label="Görünüm Modu"
          className="inline-flex items-center rounded-full border border-[#d5e2dd] bg-[#f4f7f6] p-1"
        >
          <button
            type="button"
            onClick={() => onChangeViewMode('farmer')}
            aria-pressed={viewMode === 'farmer'}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${
              viewMode === 'farmer'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'text-[#0f2922] hover:bg-[#eaf1ee]'
            }`}
          >
            <Sprout className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Çiftçi Modu</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('authority')}
            aria-pressed={viewMode === 'authority'}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${
              viewMode === 'authority'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'text-[#0f2922] hover:bg-[#eaf1ee]'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Yetkili Modu</span>
          </button>
        </div>

        {/* Sağ Bölüm: Canlı Demo Motoru Butonları */}
        <div
          role="group"
          aria-label="Canlı Simülasyon Kontrolleri"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            onClick={onSimulateDischarge}
            aria-pressed={isDischargeActive}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 ${
              isDischargeActive
                ? 'bg-red-700 ring-2 ring-red-700 ring-offset-1 shadow-sm hover:bg-red-800'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isDischargeActive
                ? 'Kaçak Deşarjı Durdur'
                : 'Kaçak Deşarj Simüle Et'}
            </span>
            {isDischargeActive && (
              <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Durdur
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onSimulateRain}
            aria-pressed={isRainActive}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-1 ${
              isRainActive
                ? 'border-sky-700 bg-sky-100 font-semibold text-sky-950 ring-2 ring-sky-600 ring-offset-1 shadow-sm hover:bg-sky-200/70'
                : 'border-slate-300 bg-slate-50 font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900'
            }`}
          >
            <CloudRain className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {isRainActive
                ? 'Yağış Simülasyonunu Durdur'
                : 'Doğal Yağış Simüle Et'}
            </span>
            {isRainActive && (
              <span className="ml-0.5 rounded-full bg-sky-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Durdur
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onResetSimulation}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2922] focus-visible:ring-offset-1 ${
              isSimulationActive
                ? 'border-2 border-[#0f2922] bg-white font-semibold text-[#0f2922] ring-2 ring-[#0f2922]/15 shadow-sm hover:bg-[#eaf1ee]'
                : 'border border-[#d5e2dd] bg-[#f4f7f6] font-medium text-[#416158]/80 hover:bg-[#eaf1ee] hover:text-[#0f2922]'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Sistemi Sıfırla</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
