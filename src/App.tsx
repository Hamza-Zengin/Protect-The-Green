import { useMemo, useState } from 'react';
import { AuthorityPanel } from './components/AuthorityPanel';
import { FarmerPanel } from './components/FarmerPanel';
import { Footer } from './components/Footer';
import {
  NotificationOverlay,
  type SimulationToast,
} from './components/NotificationOverlay';
import { TopBar } from './components/TopBar';
import { TurkeyRiversMap } from './components/TurkeyRiversMap';
import {
  BASIN_PRESETS,
  RIVER_STATIONS,
  TURKEY_DEFAULT_VIEW,
  getEffectiveStationState,
} from './data/riversData';
import type {
  BasinId,
  BasinPreset,
  SimulationScenario,
  ViewMode,
} from './types/river';

interface FlyTarget {
  center: [number, number];
  zoom: number;
  nonce: number;
}

const DEFAULT_STATION_ID = 'gediz-manisa-osb';

export default function App() {
  const [selectedStationId, setSelectedStationId] =
    useState<string>(DEFAULT_STATION_ID);
  const [viewMode, setViewMode] = useState<ViewMode>('authority');
  const [simulationScenario, setSimulationScenario] =
    useState<SimulationScenario>('normal');
  const [simulatedStationId, setSimulatedStationId] = useState<string | null>(
    null,
  );
  const [activeBasin, setActiveBasin] = useState<BasinId>('all');
  const [notifications, setNotifications] = useState<SimulationToast[]>([]);
  const [flyTarget, setFlyTarget] = useState<FlyTarget>({
    center: TURKEY_DEFAULT_VIEW.center,
    zoom: TURKEY_DEFAULT_VIEW.zoom,
    nonce: 0,
  });

  const computedStations = useMemo(
    () =>
      RIVER_STATIONS.map((station) =>
        getEffectiveStationState(
          station,
          simulationScenario,
          simulatedStationId,
        ),
      ),
    [simulationScenario, simulatedStationId],
  );

  const selectedState = useMemo(
    () =>
      computedStations.find((item) => item.station.id === selectedStationId) ??
      computedStations[0],
    [computedStations, selectedStationId],
  );

  const flyToLocation = (center: [number, number], zoom: number) => {
    setFlyTarget((prev) => ({
      center,
      zoom,
      nonce: prev.nonce + 1,
    }));
  };

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
  };

  const handleFocusStation = (stationId: string) => {
    setSelectedStationId(stationId);
    const targetStation = RIVER_STATIONS.find(
      (station) => station.id === stationId,
    );
    if (targetStation) {
      flyToLocation(targetStation.coordinates, 10);
    }
  };

  const handleSelectBasin = (basin: BasinPreset) => {
    setActiveBasin(basin.id);
    flyToLocation(basin.center, basin.zoom);
    if (basin.id !== 'all') {
      const firstInBasin = RIVER_STATIONS.find(
        (station) => station.basinId === basin.id,
      );
      if (firstInBasin) {
        setSelectedStationId(firstInBasin.id);
      }
    }
  };

  const handleSimulateDischarge = () => {
    if (simulationScenario === 'discharge') {
      setSimulationScenario('normal');
      setSimulatedStationId(null);
      setNotifications([]);
      return;
    }

    const targetId = selectedStationId || DEFAULT_STATION_ID;
    setSelectedStationId(targetId);
    setSimulationScenario('discharge');
    setSimulatedStationId(targetId);

    const targetStation = RIVER_STATIONS.find(
      (station) => station.id === targetId,
    );
    if (targetStation) {
      setActiveBasin(targetStation.basinId);
      flyToLocation(targetStation.coordinates, 11);

      const now = Date.now();
      setNotifications([
        {
          id: `discharge-farmer-${now}`,
          channel: 'farmer-sms',
          title: 'Çiftçi SMS Bildirimi',
          recipient: 'Bölge Çiftçileri — SMS / WhatsApp',
          severity: 'critical',
          timestamp: 'Şimdi',
          message: `UYARI: ${targetStation.riverName} (${targetStation.province}) hattında ani kirlilik tespit edildi. Bugün tarımsal sulama yapmaya uygun değildir.`,
        },
        {
          id: `discharge-authority-${now}`,
          channel: 'authority-alert',
          title: 'Belediye / Yetkili Bildirimi',
          recipient: 'Belediye & Çevre Denetim Birimi',
          severity: 'critical',
          timestamp: 'Şimdi',
          message: `ANOMALİ TESPİTİ (%94): ${targetStation.name} noktasında olağandışı iletkenlik ve pH sapması algılandı. Kaçak deşarj riskine karşı saha ve numune kontrolü önerilir.`,
          secondaryNote: 'Bölge çiftçilerine otomatik SMS uyarısı iletildi.',
        },
      ]);
    }
  };

  const handleSimulateRain = () => {
    if (simulationScenario === 'rain') {
      setSimulationScenario('normal');
      setSimulatedStationId(null);
      setNotifications([]);
      return;
    }

    const targetId = selectedStationId || DEFAULT_STATION_ID;
    setSelectedStationId(targetId);
    setSimulationScenario('rain');
    setSimulatedStationId(targetId);

    const targetStation = RIVER_STATIONS.find(
      (station) => station.id === targetId,
    );
    if (targetStation) {
      setActiveBasin(targetStation.basinId);
      flyToLocation(targetStation.coordinates, 11);

      const now = Date.now();
      setNotifications([
        {
          id: `rain-ai-${now}`,
          channel: 'ai-info',
          title: 'Mevsimsel Yağış — Alarm Yok',
          recipient: 'Belediye & Sulama İzleme Merkezi',
          severity: 'info',
          timestamp: 'Şimdi',
          message: `DOĞAL YAĞIŞ SINIFLANDIRMASI: ${targetStation.name} noktasında bulanıklık artışı algılandı; pH ve iletkenlik normal olduğu için AI tarafından 'Mevsimsel Yağış — Alarm Yok' olarak işaretlendi.`,
          secondaryNote: 'Çiftçilere bilgilendirme mesajı iletildi.',
        },
        {
          id: `rain-farmer-${now}`,
          channel: 'farmer-sms',
          title: 'Tarımsal Bilgilendirme (SMS)',
          recipient: 'Bölge Çiftçileri — SMS / WhatsApp',
          severity: 'info',
          timestamp: 'Şimdi',
          message: `BİLGİ: ${targetStation.riverName} (${targetStation.province}) hattında yağış nedeniyle hafif bulanıklık görülebilir. Tarımsal sulama için güvenlidir.`,
        },
      ]);
    }
  };

  const handleResetSimulation = () => {
    setSimulationScenario('normal');
    setSimulatedStationId(null);
    setSelectedStationId(DEFAULT_STATION_ID);
    setNotifications([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f6] text-[#0f2922] lg:h-screen lg:overflow-hidden">
      <TopBar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        simulationScenario={simulationScenario}
        onSimulateDischarge={handleSimulateDischarge}
        onSimulateRain={handleSimulateRain}
        onResetSimulation={handleResetSimulation}
        selectedStationName={selectedState.station.name}
      />

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-3 px-4 py-2.5 lg:min-h-0 lg:grid-cols-12 lg:overflow-hidden">
        {/* Sol Alan: Etkileşimli Türkiye Akarsu Haritası */}
        <div className="lg:col-span-7 lg:h-full lg:min-h-0">
          <TurkeyRiversMap
            stations={computedStations}
            selectedStationId={selectedState.station.id}
            onSelectStation={handleSelectStation}
            basinPresets={BASIN_PRESETS}
            activeBasin={activeBasin}
            onSelectBasin={handleSelectBasin}
            flyTarget={flyTarget}
          />
        </div>

        {/* Sağ Alan: Seçili Görünüm Moduna Göre Çiftçi veya Yetkili Karar Paneli */}
        <div className="lg:col-span-5 lg:h-full lg:min-h-0 lg:overflow-hidden">
          {viewMode === 'farmer' ? (
            <FarmerPanel
              selectedState={selectedState}
              stations={computedStations}
              onSelectStation={handleFocusStation}
              simulationScenario={simulationScenario}
            />
          ) : (
            <AuthorityPanel
              selectedState={selectedState}
              simulationScenario={simulationScenario}
            />
          )}
        </div>
      </main>

      <Footer />

      <NotificationOverlay
        viewMode={viewMode}
        notifications={notifications}
        onDismiss={(id) =>
          setNotifications((prev) => prev.filter((item) => item.id !== id))
        }
        onDismissAll={() => setNotifications([])}
      />
    </div>
  );
}
