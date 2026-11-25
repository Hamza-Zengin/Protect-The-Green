export type StationStatus = 'normal' | 'warning' | 'critical';

export type ViewMode = 'farmer' | 'authority';

export type SimulationScenario = 'normal' | 'rain' | 'discharge';

export type SensorMetricKey =
  | 'conductivity'
  | 'turbidity'
  | 'ph'
  | 'dissolvedOxygen';

export type BasinId =
  | 'all'
  | 'gediz'
  | 'ergene'
  | 'menderes'
  | 'sakarya'
  | 'kizilirmak'
  | 'yesilirmak'
  | 'seyhan'
  | 'firat';

export interface SensorReadings {
  conductivity: number;
  turbidity: number;
  ph: number;
  dissolvedOxygen: number;
}

export interface NormalRange {
  min: number;
  max: number;
}

export interface TimeSeriesPoint {
  time: string;
  conductivity: number;
  turbidity: number;
  ph: number;
  dissolvedOxygen: number;
  anomalyScore: number;
}

export interface IncidentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric?: SensorMetricKey;
}

export interface RiverStation {
  id: string;
  name: string;
  riverName: string;
  basinId: Exclude<BasinId, 'all'>;
  basinName: string;
  province: string;
  coordinates: [number, number];
  riverPath: [number, number][];
  baseStatus: StationStatus;
  isPilot?: boolean;
  baseReadings: SensorReadings;
  normalRanges: Record<SensorMetricKey, NormalRange>;
  baseAnomalyScore: number;
  baseAiSummary: string;
  baseTimeSeries: TimeSeriesPoint[];
  baseLogs: IncidentLog[];
  farmerAdviceNormal: string;
  farmerAdviceWarning: string;
  farmerAdviceCritical: string;
}

export interface BasinPreset {
  id: BasinId;
  label: string;
  center: [number, number];
  zoom: number;
}

export interface LiveNotification {
  id: string;
  stationId: string;
  stationName: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export interface ComputedStationState {
  station: RiverStation;
  status: StationStatus;
  readings: SensorReadings;
  anomalyScore: number;
  aiSummary: string;
  timeSeries: TimeSeriesPoint[];
  logs: IncidentLog[];
  isSimulatedTarget: boolean;
  farmerHeadline: string;
  farmerAdvice: string;
}
