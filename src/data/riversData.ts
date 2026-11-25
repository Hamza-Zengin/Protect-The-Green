import riversGeo from './riversGeo.json';
import type {
  BasinPreset,
  ComputedStationState,
  IncidentLog,
  NormalRange,
  RiverStation,
  SensorMetricKey,
  SensorReadings,
  SimulationScenario,
  StationStatus,
  TimeSeriesPoint,
} from '../types/river';

export const TURKEY_DEFAULT_VIEW = {
  center: [39.0, 35.2] as [number, number],
  zoom: 6,
};

export const BASIN_PRESETS: BasinPreset[] = [
  {
    id: 'all',
    label: 'Tüm Türkiye',
    center: [39.0, 35.2],
    zoom: 6,
  },
  {
    id: 'gediz',
    label: 'Gediz Havzası',
    center: [38.67, 27.45],
    zoom: 10,
  },
  {
    id: 'ergene',
    label: 'Ergene',
    center: [41.2, 27.65],
    zoom: 10,
  },
  {
    id: 'menderes',
    label: 'Menderes',
    center: [37.82, 27.85],
    zoom: 10,
  },
  {
    id: 'sakarya',
    label: 'Sakarya',
    center: [40.78, 30.4],
    zoom: 10,
  },
  {
    id: 'kizilirmak',
    label: 'Kızılırmak',
    center: [41.55, 35.9],
    zoom: 10,
  },
  {
    id: 'seyhan',
    label: 'Seyhan',
    center: [36.98, 35.32],
    zoom: 10,
  },
];

const DEFAULT_NORMAL_RANGES: Record<SensorMetricKey, NormalRange> = {
  conductivity: { min: 250, max: 750 },
  turbidity: { min: 2, max: 25 },
  ph: { min: 6.5, max: 8.5 },
  dissolvedOxygen: { min: 6.0, max: 11.5 },
};

const HOUR_LABELS: string[] = [
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
  'Şimdi',
];

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function createNormalRanges(
  overrides?: Partial<Record<SensorMetricKey, NormalRange>>
): Record<SensorMetricKey, NormalRange> {
  return {
    conductivity: overrides?.conductivity ?? { ...DEFAULT_NORMAL_RANGES.conductivity },
    turbidity: overrides?.turbidity ?? { ...DEFAULT_NORMAL_RANGES.turbidity },
    ph: overrides?.ph ?? { ...DEFAULT_NORMAL_RANGES.ph },
    dissolvedOxygen:
      overrides?.dissolvedOxygen ?? { ...DEFAULT_NORMAL_RANGES.dissolvedOxygen },
  };
}

/**
 * Son 24 saatlik (24 saatlik nokta, son nokta "Şimdi") deterministik sensör zaman serisi üretir.
 * Uyarı/kritik istasyonlarda son saatlere doğru kademeli bozulma eğrisi uygular.
 */
function buildTimeSeries(
  target: SensorReadings,
  targetAnomaly: number,
  status: StationStatus,
  phaseOffset: number
): TimeSeriesPoint[] {
  const baseline: SensorReadings =
    status === 'normal'
      ? target
      : status === 'warning'
        ? {
            conductivity: Math.round(target.conductivity * 0.72),
            turbidity: Math.max(8, Math.round(target.turbidity * 0.58)),
            ph: roundTo(Math.min(7.5, target.ph + 0.8), 1),
            dissolvedOxygen: roundTo(Math.min(8.0, target.dissolvedOxygen + 1.6), 1),
          }
        : {
            conductivity: Math.round(target.conductivity * 0.56),
            turbidity: Math.max(12, Math.round(target.turbidity * 0.44)),
            ph: roundTo(Math.min(7.2, target.ph + 1.7), 1),
            dissolvedOxygen: roundTo(Math.min(7.4, target.dissolvedOxygen + 2.8), 1),
          };

  const baselineAnomaly =
    status === 'normal' ? targetAnomaly : status === 'warning' ? 24 : 34;

  return HOUR_LABELS.map((time, index) => {
    if (index === HOUR_LABELS.length - 1) {
      return {
        time,
        conductivity: target.conductivity,
        turbidity: target.turbidity,
        ph: target.ph,
        dissolvedOxygen: target.dissolvedOxygen,
        anomalyScore: targetAnomaly,
      };
    }

    const progress =
      status === 'normal'
        ? 1
        : Math.max(0, (index - 14) / (HOUR_LABELS.length - 15));
    const wave = Math.sin((index + phaseOffset) * 0.55);
    const microWave = Math.cos((index + phaseOffset) * 0.9);

    const conductivity = Math.round(
      baseline.conductivity +
        (target.conductivity - baseline.conductivity) * progress +
        wave * 18
    );
    const turbidity = Math.max(
      2,
      Math.round(
        baseline.turbidity +
          (target.turbidity - baseline.turbidity) * progress +
          microWave * 1.8
      )
    );
    const ph = roundTo(
      baseline.ph + (target.ph - baseline.ph) * progress + wave * 0.08,
      1
    );
    const dissolvedOxygen = roundTo(
      Math.max(
        1.5,
        baseline.dissolvedOxygen +
          (target.dissolvedOxygen - baseline.dissolvedOxygen) * progress +
          microWave * 0.15
      ),
      1
    );
    const anomalyScore = Math.max(
      4,
      Math.min(
        99,
        Math.round(
          baselineAnomaly +
            (targetAnomaly - baselineAnomaly) * progress +
            wave * 2
        )
      )
    );

    return {
      time,
      conductivity,
      turbidity,
      ph,
      dissolvedOxygen,
      anomalyScore,
    };
  });
}

type RiverGeoStationId = keyof typeof riversGeo.stations;

function getStationGeo(stationId: RiverGeoStationId): {
  coordinates: [number, number];
  riverPath: [number, number][];
} {
  const entry = riversGeo.stations[stationId];
  return {
    coordinates: entry.coordinates as [number, number],
    riverPath: entry.riverPath as [number, number][],
  };
}

export const RIVER_STATIONS: RiverStation[] = [
  {
    id: 'gediz-manisa-osb',
    name: 'Gediz Nehri (Manisa OSB Çıkışı)',
    riverName: 'Gediz Nehri',
    basinId: 'gediz',
    basinName: 'Gediz Havzası',
    province: 'Manisa',
    ...getStationGeo('gediz-manisa-osb'),
    baseStatus: 'warning',
    isPilot: true,
    baseReadings: {
      conductivity: 940,
      turbidity: 29,
      ph: 6.3,
      dissolvedOxygen: 5.4,
    },
    normalRanges: createNormalRanges({
      conductivity: { min: 280, max: 800 },
    }),
    baseAnomalyScore: 64,
    baseAiSummary:
      'İletkenlik ve bulanıklıkta OSB çıkışlı kademeli artış — Yakın izleme önerilir',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 940, turbidity: 29, ph: 6.3, dissolvedOxygen: 5.4 },
      64,
      'warning',
      1
    ),
    baseLogs: [
      {
        id: 'gediz-osb-log-1',
        timestamp: '14:15',
        level: 'warning',
        title: 'İletkenlik Eşik Aşımı',
        description:
          'Manisa OSB çıkış hattında elektriksel iletkenlik 940 μS/cm seviyesine yükseldi.',
        metric: 'conductivity',
      },
      {
        id: 'gediz-osb-log-2',
        timestamp: '11:40',
        level: 'warning',
        title: 'Çözünmüş Oksijen Düşüş Eğilimi',
        description:
          'Oksijen değeri 5.4 mg/L ile alt sınırın hemen altında seyrediyor.',
        metric: 'dissolvedOxygen',
      },
      {
        id: 'gediz-osb-log-3',
        timestamp: '07:20',
        level: 'info',
        title: 'Sabah Kalibrasyon Doğrulaması',
        description:
          'İstasyon sensör probları otomatik temizleme ve sıfırlama döngüsünü tamamladı.',
      },
    ],
    farmerAdviceNormal:
      'Su değerleri tarımsal sulama için uygundur. Damla ve salma sulamaya devam edebilirsiniz.',
    farmerAdviceWarning:
      'OSB çıkışına yakın hatta sanayi kaynaklı kirlilik ve tuzluluk artışı var. Hassas sebze ve fide sulamasını erteleyin, mümkünse yukarıdaki Saruhanlı hattını kullanın.',
    farmerAdviceCritical:
      'Nehirde ani ve yoğun sanayi kirliliği tespit edildi! Pompaları durdurun, kesinlikle tarlaya su basmayın.',
  },
  {
    id: 'gediz-saruhanli',
    name: 'Gediz Nehri (Saruhanlı Tarım Hattı)',
    riverName: 'Gediz Nehri',
    basinId: 'gediz',
    basinName: 'Gediz Havzası',
    province: 'Manisa',
    ...getStationGeo('gediz-saruhanli'),
    baseStatus: 'normal',
    isPilot: true,
    baseReadings: {
      conductivity: 485,
      turbidity: 11,
      ph: 7.4,
      dissolvedOxygen: 7.9,
    },
    normalRanges: createNormalRanges({
      conductivity: { min: 280, max: 800 },
    }),
    baseAnomalyScore: 14,
    baseAiSummary:
      'Tüm parametreler mevsimsel normal aralıkta — Tarımsal sulama için güvenli',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 485, turbidity: 11, ph: 7.4, dissolvedOxygen: 7.9 },
      14,
      'normal',
      2
    ),
    baseLogs: [
      {
        id: 'gediz-saruhanli-log-1',
        timestamp: '14:00',
        level: 'info',
        title: 'Rutin Ölçüm Dengeli',
        description:
          'Bağ ve mısır sulama hattında pH 7.4, çözünmüş oksijen 7.9 mg/L olarak ölçüldü.',
        metric: 'ph',
      },
      {
        id: 'gediz-saruhanli-log-2',
        timestamp: '09:30',
        level: 'info',
        title: 'Debi ve Bulanıklık Normal',
        description:
          'Bulanıklık 11 NTU düzeyinde; damla sulama filtreleri için temiz akış sürüyor.',
        metric: 'turbidity',
      },
      {
        id: 'gediz-saruhanli-log-3',
        timestamp: '04:00',
        level: 'info',
        title: 'Gece Telemetri Paketi Alındı',
        description:
          '24 saatlik kesintisiz veri akışında anomali tespit edilmedi.',
      },
    ],
    farmerAdviceNormal:
      'Su kalitesi bağ, pamuk ve mısır sulaması için tamamen güvenlidir. Planlı sulamanızı yapabilirsiniz.',
    farmerAdviceWarning:
      'Suda hafif tuzluluk artışı gözlendi. Sulama öncesi filtre kontrolü yapmanız önerilir.',
    farmerAdviceCritical:
      'Yukarı havzada ani kirlilik artışı algılandı! Su çekimini hemen durdurun ve ikinci duyuruyu bekleyin.',
  },
  {
    id: 'ergene-corlu',
    name: 'Ergene Nehri (Çorlu Sanayi Hattı)',
    riverName: 'Ergene Nehri',
    basinId: 'ergene',
    basinName: 'Ergene Havzası',
    province: 'Tekirdağ',
    ...getStationGeo('ergene-corlu'),
    baseStatus: 'critical',
    baseReadings: {
      conductivity: 1680,
      turbidity: 62,
      ph: 4.9,
      dissolvedOxygen: 3.3,
    },
    normalRanges: createNormalRanges({
      conductivity: { min: 300, max: 850 },
    }),
    baseAnomalyScore: 89,
    baseAiSummary:
      'Yüksek iletkenlik, düşük çözünmüş oksijen ve asidik pH — Sanayi deşarj baskısı tespit edildi',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 1680, turbidity: 62, ph: 4.9, dissolvedOxygen: 3.3 },
      89,
      'critical',
      3
    ),
    baseLogs: [
      {
        id: 'ergene-corlu-log-1',
        timestamp: '14:20',
        level: 'critical',
        title: 'Kritik İletkenlik ve Asidik pH Alarmı',
        description:
          'İletkenlik 1680 μS/cm, pH 4.9 seviyesinde. Çevre denetim ekibine bildirim iletildi.',
        metric: 'conductivity',
      },
      {
        id: 'ergene-corlu-log-2',
        timestamp: '12:05',
        level: 'critical',
        title: 'Oksijen Yetersizliği (Hipoksi Riski)',
        description:
          'Çözünmüş oksijen 3.3 mg/L değerine geriledi; sucul ekosistem baskı altında.',
        metric: 'dissolvedOxygen',
      },
      {
        id: 'ergene-corlu-log-3',
        timestamp: '08:45',
        level: 'warning',
        title: 'Yüksek Askıda Katı Madde',
        description:
          'Çorlu sanayi kolu birleşiminde bulanıklık 62 NTU olarak kaydedildi.',
        metric: 'turbidity',
      },
    ],
    farmerAdviceNormal:
      'Su kalitesi normale döndü; tarımsal sulama için uygun koşullar sağlandı.',
    farmerAdviceWarning:
      'Suda kirlilik kalıntısı riski sürüyor. Yalnızca zorunlu durumlarda ve ön çökeltme ile kullanın.',
    farmerAdviceCritical:
      'Çorlu sanayi hattında ağır sanayi kirliliği tespit edildi. Kesinlikle tarımsal sulama ve hayvan içme suyu olarak kullanmayın!',
  },
  {
    id: 'menderes-aydin',
    name: 'Büyük Menderes (Aydın Ovası)',
    riverName: 'Büyük Menderes',
    basinId: 'menderes',
    basinName: 'Büyük Menderes Havzası',
    province: 'Aydın',
    ...getStationGeo('menderes-aydin'),
    baseStatus: 'normal',
    baseReadings: {
      conductivity: 520,
      turbidity: 13,
      ph: 7.5,
      dissolvedOxygen: 7.7,
    },
    normalRanges: createNormalRanges({
      conductivity: { min: 280, max: 800 },
    }),
    baseAnomalyScore: 16,
    baseAiSummary:
      'Aydın Ovası hattında su kalitesi stabil — Mevsimsel normallere uygun',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 520, turbidity: 13, ph: 7.5, dissolvedOxygen: 7.7 },
      16,
      'normal',
      4
    ),
    baseLogs: [
      {
        id: 'menderes-aydin-log-1',
        timestamp: '13:50',
        level: 'info',
        title: 'Sulama Regülatörü Kalitesi Uygun',
        description:
          'İncir ve pamuk sulama kanallarına ayrılan suda tüm değerler normal aralıkta.',
        metric: 'conductivity',
      },
      {
        id: 'menderes-aydin-log-2',
        timestamp: '10:10',
        level: 'info',
        title: 'Oksijen Doygunluğu Dengeli',
        description: 'Çözünmüş oksijen 7.7 mg/L ile sağlıklı akış düzeyinde.',
        metric: 'dissolvedOxygen',
      },
      {
        id: 'menderes-aydin-log-3',
        timestamp: '05:30',
        level: 'info',
        title: 'Otomatik Sensör Kontrolü',
        description: 'pH ve iletkenlik problarında sapma saptanmadı.',
      },
    ],
    farmerAdviceNormal:
      'Aydın Ovası sulama hattında su temiz ve dengelidir. Pamuk, mısır ve bahçe sulamasına uygundur.',
    farmerAdviceWarning:
      'Suda hafif tuzluluk yükselişi görüldü. Tuzluluğa hassas ürünlerde sulama süresini kontrollü tutun.',
    farmerAdviceCritical:
      'Nehirde ani kirlilik artışı var! Sulama kanalı kapaklarını kapatın ve su çekmeyin.',
  },
  {
    id: 'sakarya-adapazari',
    name: 'Sakarya Nehri (Adapazarı Geçişi)',
    riverName: 'Sakarya Nehri',
    basinId: 'sakarya',
    basinName: 'Sakarya Havzası',
    province: 'Sakarya',
    ...getStationGeo('sakarya-adapazari'),
    baseStatus: 'warning',
    baseReadings: {
      conductivity: 860,
      turbidity: 28,
      ph: 6.4,
      dissolvedOxygen: 5.6,
    },
    normalRanges: createNormalRanges(),
    baseAnomalyScore: 58,
    baseAiSummary:
      'İletkenlikte sınır değer aşımı ve orta düzey oksijen düşüşü gözlemlendi',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 860, turbidity: 28, ph: 6.4, dissolvedOxygen: 5.6 },
      58,
      'warning',
      5
    ),
    baseLogs: [
      {
        id: 'sakarya-adapazari-log-1',
        timestamp: '14:10',
        level: 'warning',
        title: 'İletkenlik Sınır Üstü Seyir',
        description:
          'Adapazarı geçişinde iletkenlik 860 μS/cm olarak ölçüldü; alt havza izleniyor.',
        metric: 'conductivity',
      },
      {
        id: 'sakarya-adapazari-log-2',
        timestamp: '11:25',
        level: 'warning',
        title: 'Bulanıklık ve Oksijen Değişimi',
        description:
          'Bulanıklık 28 NTU seviyesine çıkarken oksijen 5.6 mg/L bandına geriledi.',
        metric: 'turbidity',
      },
      {
        id: 'sakarya-adapazari-log-3',
        timestamp: '06:50',
        level: 'info',
        title: 'Geyve Boğazı Akış Verisi',
        description: 'Yukarı boğaz çıkışından gelen debi verisi istasyonla senkronize.',
      },
    ],
    farmerAdviceNormal:
      'Sakarya Nehri su kalitesi normal seviyededir. Sebze ve mısır sulaması güvenle yapılabilir.',
    farmerAdviceWarning:
      'Suda bulanıklık ve tuzluluk artışı tespit edildi. Yapraktan sulama yerine damla sulamayı tercih edin ve filtreleri sık temizleyin.',
    farmerAdviceCritical:
      'Nehirde kritik kirlilik saptandı! Sulama pompalarını kapatın, yeraltı veya yedek depo suyunu kullanın.',
  },
  {
    id: 'kizilirmak-bafra',
    name: 'Kızılırmak (Bafra Ovası)',
    riverName: 'Kızılırmak',
    basinId: 'kizilirmak',
    basinName: 'Kızılırmak Havzası',
    province: 'Samsun',
    ...getStationGeo('kizilirmak-bafra'),
    baseStatus: 'normal',
    baseReadings: {
      conductivity: 410,
      turbidity: 9,
      ph: 7.6,
      dissolvedOxygen: 8.4,
    },
    normalRanges: createNormalRanges({
      conductivity: { min: 220, max: 700 },
    }),
    baseAnomalyScore: 11,
    baseAiSummary:
      'Bafra Ovası sulama hattı parametreleri dengeli — Anomali saptanmadı',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 410, turbidity: 9, ph: 7.6, dissolvedOxygen: 8.4 },
      11,
      'normal',
      6
    ),
    baseLogs: [
      {
        id: 'kizilirmak-bafra-log-1',
        timestamp: '14:05',
        level: 'info',
        title: 'Delta Sulama Kalitesi İdeal',
        description:
          'Çeltik ve sebze sulama kanalları için su kalitesi yüksek oksijenle dengeli.',
        metric: 'dissolvedOxygen',
      },
      {
        id: 'kizilirmak-bafra-log-2',
        timestamp: '09:45',
        level: 'info',
        title: 'Derbent Barajı Çıkış Senkronu',
        description: 'Baraj bırakım debisiyle uyumlu düşük bulanıklık (9 NTU) gözlendi.',
        metric: 'turbidity',
      },
      {
        id: 'kizilirmak-bafra-log-3',
        timestamp: '03:15',
        level: 'info',
        title: 'Gece İzleme Raporu',
        description: 'pH 7.6 düzeyinde sabit kaldı; anomali puanı 11.',
      },
    ],
    farmerAdviceNormal:
      'Bafra Ovası sulama suyu ideal kalitededir. Çeltik, mısır ve sebze ekili alanlarda güvenle kullanabilirsiniz.',
    farmerAdviceWarning:
      'Suda geçici tuzluluk artışı gözlendi. Hassas seralarda su çekimini birkaç saat erteleyin.',
    farmerAdviceCritical:
      'Acil kirlilik uyarısı! Bafra ana kanalından su çekimini durdurun.',
  },
  {
    id: 'yesilirmak-carsamba',
    name: 'Yeşilırmak (Çarşamba)',
    riverName: 'Yeşilırmak',
    basinId: 'yesilirmak',
    basinName: 'Yeşilırmak Havzası',
    province: 'Samsun',
    ...getStationGeo('yesilirmak-carsamba'),
    baseStatus: 'normal',
    baseReadings: {
      conductivity: 390,
      turbidity: 10,
      ph: 7.5,
      dissolvedOxygen: 8.6,
    },
    normalRanges: createNormalRanges({
      conductivity: { min: 220, max: 700 },
    }),
    baseAnomalyScore: 12,
    baseAiSummary:
      'Yeşilırmak Çarşamba kesitinde oksijen ve pH seviyesi ideal düzeyde',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 390, turbidity: 10, ph: 7.5, dissolvedOxygen: 8.6 },
      12,
      'normal',
      7
    ),
    baseLogs: [
      {
        id: 'yesilirmak-carsamba-log-1',
        timestamp: '13:45',
        level: 'info',
        title: 'Yüksek Oksijen Düzeyi',
        description:
          'Çarşamba kesitinde çözünmüş oksijen 8.6 mg/L ile mükemmel düzeyde.',
        metric: 'dissolvedOxygen',
      },
      {
        id: 'yesilirmak-carsamba-log-2',
        timestamp: '09:15',
        level: 'info',
        title: 'Fındık ve Sebze Hattı Temiz',
        description:
          'İletkenlik 390 μS/cm, bulanıklık 10 NTU olarak ölçüldü.',
        metric: 'conductivity',
      },
      {
        id: 'yesilirmak-carsamba-log-3',
        timestamp: '04:30',
        level: 'info',
        title: 'Sensör Sağlık Kontrolü',
        description: 'Tüm ölçüm kanalları çevrimiçi ve kalibre durumda.',
      },
    ],
    farmerAdviceNormal:
      'Yeşilırmak suyu Çarşamba Ovası tarımsal sulaması için son derece temiz ve uygundur.',
    farmerAdviceWarning:
      'Suda hafif bulanıklık ve tuzluluk artışı var. Sulamayı kontrollü yapın.',
    farmerAdviceCritical:
      'Beklenmeyen kirlilik saptandı! Sulamayı derhal durdurun ve duyuruları takip edin.',
  },
  {
    id: 'seyhan-cukurova',
    name: 'Seyhan Nehri (Çukurova Sulama)',
    riverName: 'Seyhan Nehri',
    basinId: 'seyhan',
    basinName: 'Seyhan Havzası',
    province: 'Adana',
    ...getStationGeo('seyhan-cukurova'),
    baseStatus: 'normal',
    baseReadings: {
      conductivity: 445,
      turbidity: 12,
      ph: 7.4,
      dissolvedOxygen: 8.1,
    },
    normalRanges: createNormalRanges(),
    baseAnomalyScore: 15,
    baseAiSummary:
      'Çukurova ana sulama kanalında debi ve su kalitesi normal seyrediyor',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 445, turbidity: 12, ph: 7.4, dissolvedOxygen: 8.1 },
      15,
      'normal',
      8
    ),
    baseLogs: [
      {
        id: 'seyhan-cukurova-log-1',
        timestamp: '14:12',
        level: 'info',
        title: 'Narenciye ve Mısır Sulaması Uygun',
        description:
          'Seyhan Barajı aşağısında iletkenlik 445 μS/cm ve pH 7.4 ile stabil.',
        metric: 'ph',
      },
      {
        id: 'seyhan-cukurova-log-2',
        timestamp: '10:00',
        level: 'info',
        title: 'Normal Bulanıklık Seviyesi',
        description:
          'Ana sulama prizinde bulanıklık 12 NTU ölçüldü; tıkanma riski yok.',
        metric: 'turbidity',
      },
      {
        id: 'seyhan-cukurova-log-3',
        timestamp: '06:00',
        level: 'info',
        title: 'Sabah Ölçüm Özeti',
        description: 'Son 12 saatte eşik aşımı yaşanmadı.',
      },
    ],
    farmerAdviceNormal:
      'Çukurova sulama suyu narenciye, mısır ve pamuk üretimi için uygundur. Güvenle sulama yapabilirsiniz.',
    farmerAdviceWarning:
      'Suda tuzluluk oranı arttı. Genç fidanlarda kontrollü sulama önerilir.',
    farmerAdviceCritical:
      'Seyhan hattında acil kirlilik alarmı! Sulama vanalarını kapatın.',
  },
  {
    id: 'firat-birecik',
    name: 'Fırat Nehri (Birecik)',
    riverName: 'Fırat Nehri',
    basinId: 'firat',
    basinName: 'Fırat-Dicle Havzası',
    province: 'Şanlıurfa',
    ...getStationGeo('firat-birecik'),
    baseStatus: 'normal',
    baseReadings: {
      conductivity: 360,
      turbidity: 7,
      ph: 7.7,
      dissolvedOxygen: 9.1,
    },
    normalRanges: createNormalRanges({
      conductivity: { min: 200, max: 650 },
    }),
    baseAnomalyScore: 9,
    baseAiSummary:
      'Fırat Birecik kesitinde yüksek oksijen ve düşük bulanıklık — Referans kalite',
    baseTimeSeries: buildTimeSeries(
      { conductivity: 360, turbidity: 7, ph: 7.7, dissolvedOxygen: 9.1 },
      9,
      'normal',
      9
    ),
    baseLogs: [
      {
        id: 'firat-birecik-log-1',
        timestamp: '14:08',
        level: 'info',
        title: 'Referans Kalite Doğrulandı',
        description:
          'Birecik Barajı çıkışında çözünmüş oksijen 9.1 mg/L, bulanıklık 7 NTU.',
        metric: 'dissolvedOxygen',
      },
      {
        id: 'firat-birecik-log-2',
        timestamp: '09:20',
        level: 'info',
        title: 'Düşük İletkenlik Seyri',
        description:
          'İletkenlik 360 μS/cm ile tarımsal sulama açısından en verimli aralıkta.',
        metric: 'conductivity',
      },
      {
        id: 'firat-birecik-log-3',
        timestamp: '03:45',
        level: 'info',
        title: 'Sistem Çevrimiçi',
        description: 'Uydu telemetri bağlantısı %100 kararlılıkta çalışıyor.',
      },
    ],
    farmerAdviceNormal:
      'Fırat suyu fıstık, pamuk ve tahıl sulaması için yüksek kalitededir. Güvenle sulama yapabilirsiniz.',
    farmerAdviceWarning:
      'Suda hafif değişim gözlendi. Sulama öncesinde ön dinlendirme yapmanız önerilir.',
    farmerAdviceCritical:
      'Beklenmeyen kirlilik uyarısı! Su çekimini durdurun ve yetkililerin duyurusunu bekleyin.',
  },
];

function getFarmerHeadline(status: StationStatus): string {
  switch (status) {
    case 'normal':
      return 'BUGÜN SULAMAYA UYGUN';
    case 'warning':
      return 'DİKKATLİ SULAMA ÖNERİLİR';
    case 'critical':
      return 'BUGÜN SULAMAYA UYGUN DEĞİLDİR';
  }
}

function getFarmerAdvice(station: RiverStation, status: StationStatus): string {
  switch (status) {
    case 'normal':
      return station.farmerAdviceNormal;
    case 'warning':
      return station.farmerAdviceWarning;
    case 'critical':
      return station.farmerAdviceCritical;
  }
}

export function getEffectiveStationState(
  station: RiverStation,
  simulationScenario: SimulationScenario,
  simulatedStationId: string | null
): ComputedStationState {
  const isTarget = station.id === simulatedStationId;

  if (simulationScenario === 'discharge' && isTarget) {
    const spikeConductivity = Math.round(station.baseReadings.conductivity * 2.8);
    const simulatedReadings: SensorReadings = {
      conductivity: spikeConductivity,
      turbidity: 68,
      ph: 4.6,
      dissolvedOxygen: 3.1,
    };

    const nextSeries = station.baseTimeSeries.map((point, index, arr) => {
      if (index === arr.length - 2) {
        return {
          ...point,
          conductivity: Math.round(station.baseReadings.conductivity * 2.15),
          turbidity: 52,
          ph: 5.3,
          dissolvedOxygen: 4.0,
          anomalyScore: 79,
        };
      }
      if (index === arr.length - 1) {
        return {
          ...point,
          conductivity: simulatedReadings.conductivity,
          turbidity: simulatedReadings.turbidity,
          ph: simulatedReadings.ph,
          dissolvedOxygen: simulatedReadings.dissolvedOxygen,
          anomalyScore: 94,
        };
      }
      return point;
    });

    const dischargeLog: IncidentLog = {
      id: `${station.id}-sim-discharge`,
      timestamp: 'Şimdi',
      level: 'critical',
      title: 'Kaçak Deşarj Simülasyonu — Kritik Anomali',
      description: `Ani pH düşüşü (4.6) ve %180 iletkenlik sıçraması (${spikeConductivity} μS/cm) algılandı. Numune ve denetim ekibi yönlendirildi.`,
      metric: 'conductivity',
    };

    return {
      station,
      status: 'critical',
      readings: simulatedReadings,
      anomalyScore: 94,
      aiSummary:
        'Ani pH düşüşü + %180 iletkenlik sıçraması — Kaçak Deşarj Olasılığı',
      timeSeries: nextSeries,
      logs: [dischargeLog, ...station.baseLogs],
      isSimulatedTarget: true,
      farmerHeadline: 'BUGÜN SULAMAYA UYGUN DEĞİLDİR',
      farmerAdvice: station.farmerAdviceCritical,
    };
  }

  if (simulationScenario === 'rain' && isTarget) {
    const normalBaseline: SensorReadings =
      station.baseStatus === 'normal'
        ? station.baseReadings
        : {
            conductivity: 480,
            turbidity: station.baseReadings.turbidity,
            ph: 7.4,
            dissolvedOxygen: 7.8,
          };

    const simulatedReadings: SensorReadings = {
      conductivity: normalBaseline.conductivity,
      turbidity: 48,
      ph: normalBaseline.ph,
      dissolvedOxygen: normalBaseline.dissolvedOxygen,
    };

    const nextSeries = station.baseTimeSeries.map((point, index, arr) => {
      if (index === arr.length - 2) {
        return {
          ...point,
          conductivity: normalBaseline.conductivity,
          turbidity: 36,
          ph: normalBaseline.ph,
          dissolvedOxygen: normalBaseline.dissolvedOxygen,
          anomalyScore: 18,
        };
      }
      if (index === arr.length - 1) {
        return {
          ...point,
          conductivity: simulatedReadings.conductivity,
          turbidity: 48,
          ph: simulatedReadings.ph,
          dissolvedOxygen: simulatedReadings.dissolvedOxygen,
          anomalyScore: 21,
        };
      }
      return point;
    });

    const rainLog: IncidentLog = {
      id: `${station.id}-sim-rain`,
      timestamp: 'Şimdi',
      level: 'info',
      title: 'Doğal Yağış Etkisi — Yanlış Alarm Bastırıldı',
      description:
        'Bulanıklık 48 NTU değerine yükseldi; ancak pH, çözünmüş oksijen ve iletkenlik normal kaldığı için sistem yağış kaynaklı doğal değişim olarak sınıflandırdı.',
      metric: 'turbidity',
    };

    return {
      station,
      status: 'normal',
      readings: simulatedReadings,
      anomalyScore: 21,
      aiSummary:
        'Doğal yağış kaynaklı bulanıklık artışı — Mevsimsel Normal (Alarm Yok)',
      timeSeries: nextSeries,
      logs: [rainLog, ...station.baseLogs],
      isSimulatedTarget: true,
      farmerHeadline: 'BUGÜN SULAMAYA UYGUN',
      farmerAdvice: station.farmerAdviceNormal,
    };
  }

  return {
    station,
    status: station.baseStatus,
    readings: { ...station.baseReadings },
    anomalyScore: station.baseAnomalyScore,
    aiSummary: station.baseAiSummary,
    timeSeries: station.baseTimeSeries,
    logs: station.baseLogs,
    isSimulatedTarget: false,
    farmerHeadline: getFarmerHeadline(station.baseStatus),
    farmerAdvice: getFarmerAdvice(station, station.baseStatus),
  };
}
