import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  NormalRange,
  SensorMetricKey,
  SimulationScenario,
  StationStatus,
  TimeSeriesPoint,
} from '../types/river';

export interface SensorChartProps {
  timeSeries: TimeSeriesPoint[];
  normalRanges: Record<SensorMetricKey, NormalRange>;
  status: StationStatus;
  simulationScenario: SimulationScenario;
  isSimulatedTarget: boolean;
}

interface MetricConfig {
  key: SensorMetricKey;
  tabLabel: string;
  label: string;
  unit: string;
  decimals: number;
  minSpan: number;
}

const METRIC_CONFIGS: readonly MetricConfig[] = [
  {
    key: 'conductivity',
    tabLabel: 'İletkenlik (µS/cm)',
    label: 'İletkenlik',
    unit: 'µS/cm',
    decimals: 0,
    minSpan: 120,
  },
  {
    key: 'turbidity',
    tabLabel: 'Bulanıklık (NTU)',
    label: 'Bulanıklık',
    unit: 'NTU',
    decimals: 0,
    minSpan: 12,
  },
  {
    key: 'ph',
    tabLabel: 'pH',
    label: 'pH',
    unit: '',
    decimals: 1,
    minSpan: 1.5,
  },
  {
    key: 'dissolvedOxygen',
    tabLabel: 'Çözünmüş Oksijen (mg/L)',
    label: 'Çözünmüş Oksijen',
    unit: 'mg/L',
    decimals: 1,
    minSpan: 2,
  },
] as const;

const METRIC_BY_KEY: Record<SensorMetricKey, MetricConfig> = {
  conductivity: METRIC_CONFIGS[0],
  turbidity: METRIC_CONFIGS[1],
  ph: METRIC_CONFIGS[2],
  dissolvedOxygen: METRIC_CONFIGS[3],
};

function formatMetricValue(value: number, decimals: number): string {
  return decimals === 0 ? `${Math.round(value)}` : value.toFixed(decimals);
}

function isOutOfRange(value: number, range: NormalRange): boolean {
  return value < range.min || value > range.max;
}

interface CustomTooltipPayloadItem {
  value?: number;
  payload?: TimeSeriesPoint;
}

interface SensorTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
  metricConfig: MetricConfig;
  normalRange: NormalRange;
}

function SensorTooltip({
  active,
  payload,
  label,
  metricConfig,
  normalRange,
}: SensorTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;
  const rawValue = payload[0]?.value;
  if (!point || typeof rawValue !== 'number') {
    return null;
  }

  const outOfRange = isOutOfRange(rawValue, normalRange);
  const unitSuffix = metricConfig.unit ? ` ${metricConfig.unit}` : '';
  const formattedValue = `${formatMetricValue(rawValue, metricConfig.decimals)}${unitSuffix}`;
  const formattedRange = `${formatMetricValue(normalRange.min, metricConfig.decimals)} – ${formatMetricValue(normalRange.max, metricConfig.decimals)}${unitSuffix}`;

  const anomalyColor =
    point.anomalyScore >= 70
      ? 'text-red-600'
      : point.anomalyScore >= 35
        ? 'text-amber-600'
        : 'text-emerald-700';

  return (
    <div className="min-w-[190px] rounded-lg border border-[#d5e2dd] bg-white/95 p-2.5 text-xs shadow-md backdrop-blur-xs">
      <div className="mb-1.5 flex items-center justify-between border-b border-[#eaf1ee] pb-1">
        <span className="font-semibold text-[#0f2922]">Saat {label ?? point.time}</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            outOfRange
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {outOfRange ? 'Aralık Dışı' : 'Normal Aralık'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#416158]">{metricConfig.label}:</span>
          <span
            className={`font-bold tabular-nums ${
              outOfRange ? 'text-red-600' : 'text-[#0f2922]'
            }`}
          >
            {formattedValue}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#416158]">Normal Aralık:</span>
          <span className="font-medium text-[#0f766e] tabular-nums">
            {formattedRange}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#416158]">AI Anomali Skoru:</span>
          <span className={`font-bold tabular-nums ${anomalyColor}`}>
            %{Math.round(point.anomalyScore)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  value?: number;
  index?: number;
}

/**
 * Seçili sensör metriği için 24 saatlik zaman serisi ve normal mevsimsel aralık bandı grafiği.
 */
export function SensorChart({
  timeSeries,
  normalRanges,
  status,
  simulationScenario,
  isSimulatedTarget,
}: SensorChartProps) {
  const [activeMetric, setActiveMetric] =
    useState<SensorMetricKey>('conductivity');

  useEffect(() => {
    if (simulationScenario === 'rain' && isSimulatedTarget) {
      setActiveMetric('turbidity');
    } else if (simulationScenario === 'discharge' && isSimulatedTarget) {
      setActiveMetric('conductivity');
    }
  }, [simulationScenario, isSimulatedTarget]);

  const metricConfig = METRIC_BY_KEY[activeMetric];
  const normalRange = normalRanges[activeMetric];

  const yDomain = useMemo<[number, number]>(() => {
    const values = timeSeries.map((pt) => pt[activeMetric]);
    const dataMin =
      values.length > 0 ? Math.min(normalRange.min, ...values) : normalRange.min;
    const dataMax =
      values.length > 0 ? Math.max(normalRange.max, ...values) : normalRange.max;

    const span = Math.max(
      dataMax - dataMin,
      normalRange.max - normalRange.min,
      metricConfig.minSpan
    );
    const padding = span * 0.14;

    const rawMin = Math.max(0, dataMin - padding);
    const rawMax =
      activeMetric === 'ph'
        ? Math.min(14, dataMax + padding)
        : dataMax + padding;

    if (metricConfig.decimals === 0) {
      return [Math.floor(rawMin), Math.ceil(rawMax)];
    }
    return [
      Number(rawMin.toFixed(1)),
      Number(rawMax.toFixed(1)),
    ];
  }, [timeSeries, activeMetric, normalRange, metricConfig]);

  const latestPoint = timeSeries[timeSeries.length - 1];
  const isLatestOutOfRange = latestPoint
    ? isOutOfRange(latestPoint[activeMetric], normalRange)
    : false;

  const lineColor =
    isLatestOutOfRange || status === 'critical'
      ? '#dc2626'
      : status === 'warning'
        ? '#eab308'
        : '#0f766e';

  const renderDot = (dotProps: CustomDotProps): ReactElement<SVGElement> => {
    const { cx, cy, value, index } = dotProps;
    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      typeof value !== 'number'
    ) {
      return <g key={`empty-dot-${index ?? 0}`} />;
    }

    const pointOutOfRange = isOutOfRange(value, normalRange);
    return (
      <circle
        key={`dot-${activeMetric}-${index ?? 0}`}
        cx={cx}
        cy={cy}
        r={pointOutOfRange ? 4.5 : 2.75}
        fill={pointOutOfRange ? '#dc2626' : lineColor}
        stroke="#ffffff"
        strokeWidth={pointOutOfRange ? 1.75 : 1.25}
      />
    );
  };

  return (
    <section className="rounded-xl border border-[#d5e2dd] bg-white p-2.5 shadow-xs">
      {/* Başlık ve Normal Aralık Lejantı */}
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
        <h3 className="text-sm font-bold text-[#0f2922]">
          24 Saatlik AI Zaman Serisi
        </h3>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e2dd] bg-[#f4f7f6] px-2 py-0.5 text-[11px] font-medium text-[#416158]">
          <span
            className="h-2.5 w-3.5 rounded-xs border border-[#0f766e]/40 bg-[#0f766e]/15"
            aria-hidden="true"
          />
          <span>Yeşil Bant: Normal Mevsimsel Aralık</span>
        </div>
      </div>

      {/* Metrik Geçiş Sekmeleri */}
      <div
        role="tablist"
        aria-label="Sensör Metriği Seçimi"
        className="mb-1.5 grid grid-cols-2 gap-1 rounded-lg bg-[#f4f7f6] p-1"
      >
        {METRIC_CONFIGS.map((tab) => {
          const isActive = tab.key === activeMetric;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveMetric(tab.key)}
              className={`cursor-pointer truncate rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] ${
                isActive
                  ? 'bg-[#0f766e] text-white shadow-xs'
                  : 'text-[#416158] hover:bg-[#eaf1ee] hover:text-[#0f2922]'
              }`}
            >
              {tab.tabLabel}
            </button>
          );
        })}
      </div>

      {/* Recharts Grafik Alanı */}
      <div className="h-[150px] xl:h-[180px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={140}>
          <LineChart
            data={timeSeries}
            margin={{ top: 8, right: 10, left: -10, bottom: 2 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2ece8"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#416158' }}
              tickLine={false}
              axisLine={{ stroke: '#d5e2dd' }}
              minTickGap={18}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: '#416158' }}
              tickLine={false}
              axisLine={false}
              width={46}
            />
            <ReferenceArea
              y1={normalRange.min}
              y2={normalRange.max}
              fill="#0f766e"
              fillOpacity={0.12}
              stroke="#0f766e"
              strokeOpacity={0.28}
              strokeDasharray="3 3"
            />
            <Tooltip
              content={
                <SensorTooltip
                  metricConfig={metricConfig}
                  normalRange={normalRange}
                />
              }
            />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={lineColor}
              strokeWidth={2.5}
              dot={renderDot}
              activeDot={{
                r: 5.5,
                stroke: '#ffffff',
                strokeWidth: 2,
                fill: lineColor,
              }}
              isAnimationActive={true}
              animationDuration={400}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default SensorChart;
