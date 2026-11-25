import type { LucideIcon } from 'lucide-react';
import { BellRing, BrainCircuit, Cpu, Leaf, Radio } from 'lucide-react';

interface ArchitectureBadge {
  id: string;
  label: string;
  icon: LucideIcon;
}

const ARCHITECTURE_BADGES: readonly ArchitectureBadge[] = [
  { id: 'sensor', label: 'ESP32 Sensör Düğümü', icon: Cpu },
  { id: 'network', label: 'LoRaWAN / GSM', icon: Radio },
  { id: 'ai', label: 'AI Anomali Tespiti', icon: BrainCircuit },
  { id: 'alert', label: 'SMS / Web Erken Uyarı', icon: BellRing },
];

/**
 * Kurumsal alt bilgi çubuğu; proje kimliğini ve uçtan uca sistem mimarisini özetler.
 */
export function Footer() {
  return (
    <footer className="shrink-0 border-t border-[#d5e2dd] bg-white px-4 py-1.5 text-xs text-[#416158] lg:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-[#11241e]">
          <Leaf className="h-3.5 w-3.5 shrink-0 text-[#0f766e]" aria-hidden="true" />
          <span>Protect The Green — GreenTech Hackathon Prototipi</span>
        </div>

        <ul className="flex flex-wrap items-center gap-1.5" aria-label="Sistem mimarisi bileşenleri">
          {ARCHITECTURE_BADGES.map(({ id, label, icon: Icon }) => (
            <li
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e2dd] bg-[#f4f7f6] px-2.5 py-0.5 text-[11px] font-medium leading-4 text-[#416158]"
            >
              <Icon className="h-3 w-3 shrink-0 text-[#0f766e]" aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export default Footer;
