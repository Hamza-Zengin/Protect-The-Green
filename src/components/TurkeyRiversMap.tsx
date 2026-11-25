import { Fragment, useEffect, useMemo } from 'react';
import L, { type DivIcon, type LatLngExpression } from 'leaflet';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { Compass } from 'lucide-react';
import type {
  BasinId,
  BasinPreset,
  ComputedStationState,
  StationStatus,
} from '../types/river';

export interface TurkeyRiversMapProps {
  stations: ComputedStationState[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  basinPresets: BasinPreset[];
  activeBasin: BasinId;
  onSelectBasin: (basin: BasinPreset) => void;
  flyTarget: { center: [number, number]; zoom: number; nonce: number };
}

const TURKEY_CENTER: [number, number] = [39.0, 35.2];

const STATUS_COLORS: Record<StationStatus, string> = {
  normal: '#16a34a',
  warning: '#eab308',
  critical: '#dc2626',
};

const STATUS_LABELS: Record<StationStatus, string> = {
  normal: 'Normal',
  warning: 'Dikkat',
  critical: 'Kirlilik / Anomali',
};

const STATUS_BADGE_CLASSES: Record<StationStatus, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

interface MapControllerProps {
  flyTarget: TurkeyRiversMapProps['flyTarget'];
}

function MapController({ flyTarget }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (flyTarget.nonce > 0) {
      map.flyTo(flyTarget.center, flyTarget.zoom, { duration: 1.05 });
    }
  }, [map, flyTarget]);

  return null;
}

function MapResizeGuard() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [map]);

  return null;
}

function createStationIcon(
  status: StationStatus,
  isSelected: boolean
): DivIcon {
  const size = isSelected ? 20 : 15;
  const color = STATUS_COLORS[status];

  const classes = [
    'rounded-full',
    status === 'critical' ? 'station-pulse-critical' : '',
    isSelected ? 'station-marker-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return L.divIcon({
    className: classes,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background-color:${color};border:2.5px solid #ffffff;box-shadow:0 1px 4px rgba(15,41,34,0.35);box-sizing:border-box;"></span>`,
  });
}

export function TurkeyRiversMap({
  stations,
  selectedStationId,
  onSelectStation,
  basinPresets,
  activeBasin,
  onSelectBasin,
  flyTarget,
}: TurkeyRiversMapProps) {
  const stationIcons = useMemo(() => {
    const map = new Map<string, DivIcon>();
    for (const item of stations) {
      const isSelected = item.station.id === selectedStationId;
      map.set(item.station.id, createStationIcon(item.status, isSelected));
    }
    return map;
  }, [stations, selectedStationId]);

  return (
    <section
      aria-label="Türkiye Nehirleri Su Kalitesi Haritası"
      className="flex flex-col overflow-hidden rounded-2xl border border-[#d5e2dd] bg-white shadow-sm lg:h-full"
    >
      {/* Harita Üst Şeridi: Havza Hızlı Odaklanma */}
      <div className="shrink-0 flex flex-wrap items-center gap-1.5 border-b border-[#d5e2dd] bg-[#f8fbfa] px-3.5 py-2">
        <div className="mr-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#0f2922]">
          <Compass className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>Havza Odaklanma:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {basinPresets.map((preset) => {
            const isActive = activeBasin === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectBasin(preset)}
                aria-pressed={isActive}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Harita Konteyneri */}
      <div className="relative h-[420px] sm:h-[480px] w-full lg:h-auto lg:min-h-0 lg:flex-1">
        <MapContainer
          center={TURKEY_CENTER}
          zoom={6}
          minZoom={5}
          maxZoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <MapController flyTarget={flyTarget} />
          <MapResizeGuard />

          {stations.map((item) => {
            const { station, status } = item;
            const isSelected = station.id === selectedStationId;
            const color = STATUS_COLORS[status];
            const pathPositions: LatLngExpression[] = station.riverPath;
            const markerPosition: LatLngExpression = station.coordinates;
            const icon =
              stationIcons.get(station.id) ??
              createStationIcon(status, isSelected);

            return (
              <Fragment key={station.id}>
                <Polyline
                  positions={pathPositions}
                  pathOptions={{
                    color,
                    weight: isSelected ? 6 : 4,
                    opacity: isSelected ? 0.95 : 0.75,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                  eventHandlers={{
                    click: () => onSelectStation(station.id),
                  }}
                />

                <Marker
                  position={markerPosition}
                  icon={icon}
                  zIndexOffset={isSelected ? 500 : status === 'critical' ? 250 : 0}
                  eventHandlers={{
                    click: () => onSelectStation(station.id),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.98}>
                    <div className="min-w-[165px] space-y-1 py-0.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0f2922]">
                          {station.name}
                        </span>
                        {station.isPilot && (
                          <span className="rounded bg-teal-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Pilot Odak
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {station.province} &middot; {station.riverName}
                      </div>
                      <div className="pt-0.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_CLASSES[status]}`}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              </Fragment>
            );
          })}
        </MapContainer>

        {/* Sol-alt Sade Lejant */}
        <div
          aria-label="Harita Durum Lejantı"
          className="pointer-events-auto absolute bottom-2.5 left-2.5 z-[400] rounded-xl border border-[#d5e2dd] bg-white/90 px-2.5 py-1.5 text-[11px] shadow-sm backdrop-blur-sm"
        >
          <ul className="space-y-1 text-[11px] font-medium text-[#0f2922]">
            <li className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: STATUS_COLORS.normal }}
              />
              <span>Sulamaya Uygun / Normal</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: STATUS_COLORS.warning }}
              />
              <span>Dikkat / Sınır Değerde</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="station-pulse-critical inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: STATUS_COLORS.critical }}
              />
              <span>Kirlilik / Anomali</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default TurkeyRiversMap;
