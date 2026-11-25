import { useEffect, useRef, useState } from 'react';
import {
  BrainCircuit,
  CloudRain,
  FlaskConical,
  MapPin,
  ScrollText,
  Sparkles,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type {
  ComputedStationState,
  IncidentLog,
  NormalRange,
  SensorMetricKey,
  SimulationScenario,
  StationStatus,
} from '../types/river';
import { SensorChart } from './SensorChart';

export interface AuthorityPanelProps {
  selectedState: ComputedStationState;
  simulationScenario: SimulationScenario;
}

/**
 * Sayısal KPI ve anomali skor değerlerini hedef değere requestAnimationFrame ile yumuşakça yaklaştırır.
 */
function useAnimatedNumber(target: number, duration = 450): number {
  const [displayValue, setDisplayValue] = useState<number>(target);
  const currentRef = useRef<number>(target);

  useEffect(() => {
    const startValue = currentRef.current;
    const delta = target - startValue;

    if (Math.abs(delta) < 0.0001 || duration <= 0) {
      currentRef.current = target;
      setDisplayValue(target);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic: hızlı başlangıç, yumuşak duruş
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + delta * eased;

      currentRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        currentRef.current = target;
        setDisplayValue(target);
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [target, duration]);

  return displayValue;
}

const STATUS_META: Record<
  StationStatus,
  { label: string; dotColor: string; badgeClass: string }
> = {
  normal: {
    label: 'Normal',
    dotColor: '#16a34a',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  warning: {
    label: 'Dikkat',
    dotColor: '#eab308',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  critical: {
    label: 'Kirlilik / Anomali',
    dotColor: '#dc2626',
    badgeClass: 'border-red-200 bg-red-50 text-red-700',
  },
};

const LOG_LEVEL_META: Record<
  IncidentLog['level'],
  { label: string; dotColor: string; badgeClass: string }
> = {
  info: {
    label: 'Bilgi',
    dotColor: '#0284c7',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  warning: {
    label: 'Dikkat',
    dotColor: '#eab308',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  critical: {
    label: 'Kritik',
    dotColor: '#dc2626',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
};

interface SensorKpiDefinition {
  key: SensorMetricKey;
  label: string;
  unit: string;
  decimals: number;
  icon: LucideIcon;
}

const SENSOR_KPI_ORDER: readonly SensorKpiDefinition[] = [
  {
    key: 'ph',
    label: 'pH',
    unit: '',
    decimals: 1,
    icon: FlaskConical,
  },
  {
    key: 'dissolvedOxygen',
    label: 'Çözünmüş Oksijen',
    unit: 'mg/L',
    decimals: 1,
    icon: Wind,
  },
  {
    key: 'turbidity',
    label: 'Bulanıklık',
    unit: 'NTU',
    decimals: 0,
    icon: Waves,
  },
  {
    key: 'conductivity',
    label: 'İletkenlik',
    unit: 'µS/cm',
    decimals: 0,
    icon: Zap,
  },
] as const;

function formatSensorNumber(value: number, decimals: number): string {
  return decimals === 0 ? `${Math.round(value)}` : value.toFixed(decimals);
}

function formatRangeLabel(range: NormalRange, decimals: number): string {
  return `Normal: ${formatSensorNumber(range.min, decimals)}–${formatSensorNumber(range.max, decimals)}`;
}

interface SensorKpiCardProps {
  definition: SensorKpiDefinition;
  targetValue: number;
  normalRange: NormalRange;
  stationStatus: StationStatus;
  anomalyScore: number;
}

function SensorKpiCard({
  definition,
  targetValue,
  normalRange,
  stationStatus,
  anomalyScore,
}: SensorKpiCardProps) {
  const animatedValue = useAnimatedNumber(targetValue, 450);
  const outOfRange =
    targetValue < normalRange.min || targetValue > normalRange.max;
  const isCriticalHighlight =
    outOfRange && (stationStatus === 'critical' || anomalyScore >= 70);

  const Icon = definition.icon;

  const cardSurfaceClass = outOfRange
    ? isCriticalHighlight
      ? 'border-red-200 bg-red-50/40'
      : 'border-amber-200 bg-amber-50/40'
    : 'border-[#d5e2dd] bg-white';

  const valueTextClass = outOfRange
    ? isCriticalHighlight
      ? 'text-red-700'
      : 'text-amber-800'
    : 'text-[#0f2922]';

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border p-2.5 shadow-xs transition-colors ${cardSurfaceClass}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1 text-[11px] font-semibold leading-tight text-[#416158]">
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-[#0f766e]"
            aria-hidden={true}
          />
          <span>{definition.label}</span>
        </div>

        {outOfRange && (
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none ${
              isCriticalHighlight
                ? 'border-red-200 bg-red-100 text-red-700'
                : 'border-amber-200 bg-amber-100 text-amber-800'
            }`}
          >
            Sınır Dışı
          </span>
        )}
      </div>

      <div className="my-1 flex items-baseline gap-1">
        <span
          className={`text-lg font-bold tracking-tight tabular-nums ${valueTextClass}`}
        >
          {formatSensorNumber(animatedValue, definition.decimals)}
        </span>
        {definition.unit && (
          <span className="text-[11px] font-medium text-[#416158]">
            {definition.unit}
          </span>
        )}
      </div>

      <p className="text-[10px] font-medium text-[#416158] tabular-nums">
        {formatRangeLabel(normalRange, definition.decimals)}
      </p>
    </div>
  );
}

/**
 * Yetkili ve denetim ekipleri için detaylı sensör telemetrisi, AI anomali skoru,
 * 24 saatlik zaman serisi grafiği ve olay kayıtlarını sunan karar paneli.
 */
export function AuthorityPanel({
  selectedState,
  simulationScenario,
}: AuthorityPanelProps) {
  const {
    station,
    status,
    readings,
    anomalyScore,
    aiSummary,
    timeSeries,
    logs,
    isSimulatedTarget,
  } = selectedState;

  const animatedScore = useAnimatedNumber(anomalyScore, 450);
  const roundedScore = Math.max(0, Math.min(100, Math.round(animatedScore)));

  const statusMeta = STATUS_META[status];
  const scoreBarColor =
    roundedScore >= 70
      ? '#dc2626'
      : roundedScore >= 35
        ? '#eab308'
        : '#16a34a';
  const scoreTextClass =
    roundedScore >= 70
      ? 'text-red-600'
      : roundedScore >= 35
        ? 'text-amber-600'
        : 'text-emerald-700';

  const isRainSuppressed =
    simulationScenario === 'rain' && isSimulatedTarget;

  return (
    <div className="flex flex-col gap-2 text-[#0f2922] lg:h-full lg:min-h-0">
      {/* Üst İstasyon Başlığı */}
      <header className="shrink-0 rounded-xl border border-[#d5e2dd] bg-white px-3 py-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-sm font-bold tracking-tight text-[#0f2922] sm:text-base">
                {station.name}
              </h2>
              {station.isPilot && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#0f766e]/25 bg-[#eaf1ee] px-2 py-0.5 text-[10px] font-semibold text-[#0f766e]">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Pilot Odak
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#416158]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0f766e]" aria-hidden="true" />
              <span>
                {station.province} • {station.basinName}
              </span>
            </p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusMeta.dotColor }}
              aria-hidden="true"
            />
            <span>{statusMeta.label}</span>
          </span>
        </div>
      </header>

      {/* 4 Temel Sensör KPI Kartı */}
      <section
        aria-label="Temel Sensör Ölçümleri"
        className="shrink-0 grid grid-cols-2 gap-2 xl:grid-cols-4"
      >
        {SENSOR_KPI_ORDER.map((definition) => (
          <SensorKpiCard
            key={definition.key}
            definition={definition}
            targetValue={readings[definition.key]}
            normalRange={station.normalRanges[definition.key]}
            stationStatus={status}
            anomalyScore={anomalyScore}
          />
        ))}
      </section>

      {/* AI Anomali Skoru (%0 – %100) Kartı */}
      <section className="shrink-0 rounded-xl border border-[#d5e2dd] bg-white px-3 py-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BrainCircuit
              className="h-4 w-4 shrink-0 text-[#0f766e]"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-[#0f2922]">
              AI Anomali Skoru
            </h3>
          </div>

          <span className={`text-base font-extrabold tabular-nums ${scoreTextClass}`}>
            %{roundedScore}
          </span>
        </div>

        {/* İlerleme Çubuğu */}
        <div
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#eaf1ee]"
          role="progressbar"
          aria-valuenow={roundedScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="AI Anomali Skoru"
        >
          <div
            className="h-full rounded-full transition-[background-color] duration-300"
            style={{
              width: `${roundedScore}%`,
              backgroundColor: scoreBarColor,
            }}
          />
        </div>

        {isRainSuppressed && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800">
            <CloudRain className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden="true" />
            <span>Mevsimsel Yağış — Alarm Yok</span>
          </div>
        )}

        <p className="mt-1.5 text-xs leading-snug text-[#416158]">
          {aiSummary}
        </p>
      </section>

      {/* 24 Saatlik AI Zaman Serisi Grafiği */}
      <div className="shrink-0">
        <SensorChart
          timeSeries={timeSeries}
          normalRanges={station.normalRanges}
          status={status}
          simulationScenario={simulationScenario}
          isSimulatedTarget={isSimulatedTarget}
        />
      </div>

      {/* Olay Kayıtları (Loglar) */}
      <section className="flex min-h-[120px] flex-col rounded-xl border border-[#d5e2dd] bg-white p-2.5 shadow-xs lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ScrollText
              className="h-4 w-4 shrink-0 text-[#0f766e]"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-[#0f2922]">
              Olay Kayıtları
            </h3>
          </div>
          <span className="rounded-full bg-[#eaf1ee] px-2 py-0.5 text-[11px] font-semibold text-[#416158] tabular-nums">
            {logs.length} kayıt
          </span>
        </div>

        <div className="mt-1.5 flex-1 space-y-1.5 overflow-y-auto pr-1 max-h-[200px] lg:max-h-none lg:min-h-0">
          {logs.length === 0 ? (
            <p className="rounded-lg bg-[#f4f7f6] px-3 py-2 text-xs text-[#416158]">
              Bu istasyon için kayıtlı olay bulunmuyor.
            </p>
          ) : (
            logs.map((log) => {
              const levelMeta = LOG_LEVEL_META[log.level];
              return (
                <article
                  key={log.id}
                  className="rounded-lg border border-[#e3ece8] bg-[#f9fbfa] p-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: levelMeta.dotColor }}
                        aria-hidden="true"
                      />
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${levelMeta.badgeClass}`}
                      >
                        {levelMeta.label}
                      </span>
                    </div>
                    <time className="text-[11px] font-medium text-[#416158]">
                      {log.timestamp}
                    </time>
                  </div>

                  <h4 className="mt-1.5 text-xs font-bold text-[#0f2922]">
                    {log.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#416158]">
                    {log.description}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default AuthorityPanel;
