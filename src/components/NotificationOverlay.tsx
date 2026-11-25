import { CloudRain, ShieldAlert, Smartphone, X, type LucideIcon } from 'lucide-react';
import type { ViewMode } from '../types/river';

export interface SimulationToast {
  id: string;
  channel: 'farmer-sms' | 'authority-alert' | 'ai-info';
  title: string;
  recipient: string;
  message: string;
  secondaryNote?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface NotificationOverlayProps {
  viewMode: ViewMode;
  notifications: SimulationToast[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

interface ChannelTheme {
  label: string;
  icon: LucideIcon;
  borderClass: string;
  iconWrapperClass: string;
  channelBadgeClass: string;
}

const CHANNEL_CONFIG: Record<SimulationToast['channel'], ChannelTheme> = {
  'farmer-sms': {
    label: 'Çiftçi SMS Bildirimi',
    icon: Smartphone,
    borderClass: 'border-l-amber-500',
    iconWrapperClass: 'bg-amber-50 text-amber-700 border-amber-200',
    channelBadgeClass: 'text-amber-800',
  },
  'authority-alert': {
    label: 'Belediye / Yetkili Bildirimi',
    icon: ShieldAlert,
    borderClass: 'border-l-red-800',
    iconWrapperClass: 'bg-red-50 text-red-800 border-red-200',
    channelBadgeClass: 'text-red-900',
  },
  'ai-info': {
    label: 'AI Sınıflandırma Bildirimi',
    icon: CloudRain,
    borderClass: 'border-l-sky-600',
    iconWrapperClass: 'bg-sky-50 text-sky-700 border-sky-200',
    channelBadgeClass: 'text-sky-800',
  },
};

function getCardLeftBorderClass(
  channel: SimulationToast['channel'],
  severity: SimulationToast['severity'],
): string {
  if (channel === 'farmer-sms') {
    return severity === 'critical' ? 'border-l-red-600' : 'border-l-amber-500';
  }
  return CHANNEL_CONFIG[channel].borderClass;
}

/**
 * Canlı simülasyon senaryolarında çiftçi SMS, yetkili uyarı ve AI bilgi
 * bildirimlerini harita üzerinde sağ alt köşede gösteren bildirim yığını.
 */
export function NotificationOverlay({
  viewMode,
  notifications,
  onDismiss,
  onDismissAll,
}: NotificationOverlayProps) {
  const visibleNotifications = notifications.filter((item) =>
    viewMode === 'farmer'
      ? item.channel === 'farmer-sms'
      : item.channel === 'authority-alert' || item.channel === 'ai-info',
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Canlı uyarı akışı"
      aria-live="polite"
      className="fixed bottom-12 right-4 z-[1000] flex w-[calc(100vw-2rem)] max-w-md flex-col gap-2.5"
    >
      {visibleNotifications.length > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[#d5e2dd] bg-white/95 px-3.5 py-2 shadow-md shadow-[#0f2922]/10 backdrop-blur-xs transition-all duration-200">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-red-600"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold tracking-tight text-[#0f2922]">
              Canlı Uyarı Akışı ({visibleNotifications.length})
            </span>
          </div>

          <button
            type="button"
            onClick={onDismissAll}
            className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-[#416158] transition-colors hover:bg-[#eaf1ee] hover:text-[#0f2922] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
          >
            Tümünü Kapat
          </button>
        </div>
      )}

      {visibleNotifications.map((item) => {
        const theme = CHANNEL_CONFIG[item.channel];
        const ChannelIcon = theme.icon;
        const leftBorderClass = getCardLeftBorderClass(
          item.channel,
          item.severity,
        );

        return (
          <article
            key={item.id}
            role={item.severity === 'critical' ? 'alert' : 'status'}
            className={`rounded-xl border border-[#d5e2dd] border-l-4 ${leftBorderClass} bg-white/95 p-3.5 shadow-lg shadow-[#0f2922]/10 backdrop-blur-xs transition-all duration-200 hover:shadow-xl`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${theme.iconWrapperClass}`}
                aria-hidden="true"
              >
                <ChannelIcon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={`block text-[11px] font-semibold tracking-wide uppercase ${theme.channelBadgeClass}`}
                    >
                      {theme.label}
                    </span>
                    <h3 className="mt-0.5 text-sm font-semibold leading-snug text-[#0f2922]">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <time className="text-[11px] font-medium tabular-nums text-[#416158]">
                      {item.timestamp}
                    </time>
                    <button
                      type="button"
                      onClick={() => onDismiss(item.id)}
                      aria-label="Bildirimi kapat"
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[#416158] transition-colors hover:bg-[#eaf1ee] hover:text-[#0f2922] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="mt-1.5">
                  <span className="inline-flex max-w-full items-center rounded-md border border-[#d5e2dd] bg-[#f4f7f6] px-2 py-0.5 text-[11px] font-medium text-[#0f2922]">
                    <span className="truncate">Alıcı: {item.recipient}</span>
                  </span>
                </div>

                <p className="mt-2 break-words text-xs leading-relaxed text-[#416158]">
                  {item.message}
                </p>

                {item.secondaryNote && (
                  <p className="mt-2 flex items-center gap-1.5 border-t border-[#d5e2dd]/70 pt-1.5 text-[11px] font-medium text-[#416158]">
                    <Smartphone
                      className="h-3.5 w-3.5 shrink-0 text-[#0f766e]"
                      aria-hidden="true"
                    />
                    <span>{item.secondaryNote}</span>
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default NotificationOverlay;
