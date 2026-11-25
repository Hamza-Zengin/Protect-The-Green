# Akıllı Akarsu Denetimi — Protect The Green

**Protect The Green** takımı tarafından GreenTech Hackathon kapsamında geliştirilen, akarsu kirliliği ve kaçak sanayi deşarjlarına karşı **karar destek ve erken uyarı** sunan interaktif web prototipidir.

> Uygulama tamamen istemci tarafında (`src/data/` altındaki gerçekçi sensör zaman serileri ve OpenStreetMap tabanlı statik nehir geometrileri ile) çalışır; harici API anahtarı gerektirmez.

---

## Temel Özellikler

- **İnteraktif Türkiye Akarsuları Haritası:**
  - OpenStreetMap altlığı üzerinde 8 ana akarsuyu ve 9 izleme istasyonunu (*Gediz — Manisa OSB & Saruhanlı, Ergene, Büyük Menderes, Sakarya, Kızılırmak, Yeşilırmak, Seyhan, Fırat*) gerçek akarsu güzergâhlarıyla gösterir.
  - Havza bazlı hızlı yakınlaştırma (`flyTo`), durum renk kodlaması (Yeşil: Normal, Sarı: Dikkat, Kırmızı: Kirlilik / Anomali) ve kritik istasyonlarda pulse animasyonu sunar.
- **Çift Görünüm Modu (Tek Tıkla Geçiş):**
  - **Çiftçi Modu:** Teknik terimlerden arındırılmış sade arayüz; büyük **SULAMAYA UYGUN / UYGUN DEĞİLDİR** karar kartı, günlük dilde tavsiye ve SMS/WhatsApp uyarı önizlemesi.
  - **Yetkili / Belediye Modu:** Anlık 4 sensör KPI kartı (`pH`, `Çözünmüş Oksijen`, `Bulanıklık`, `İletkenlik`), **AI Anomali Skoru (%0 – %100)**, normal mevsimsel bantlı 24 saatlik Recharts zaman serisi grafiği ve olay kayıtları.
- **Canlı Demo Motoru (Kaçak Deşarj & Doğal Yağış Simülasyonu):**
  - **Kaçak Deşarj Simüle Et:** Seçili istasyona odaklanır, sensör değerlerini ve AI Anomali Skorunu (%94) animasyonlu şekilde sıçratır, haritada kırmızı alarm üretir.
  - **Doğal Yağış Simüle Et:** Yalnızca bulanıklığı artırır; yapay zekâ tarafından *"Mevsimsel Yağış — Alarm Yok"* olarak sınıflandırılır.
  - **Sistemi Sıfırla:** Tüm simülasyon durumunu ve bildirimleri temizler.
- **Moda Göre Canlı Bildirimler:**
  - Çiftçi Modunda yalnızca sade **Çiftçi SMS** uyarısı, Yetkili Modunda ise **Belediye / Yetkili Anomali Bildirimi** veya **AI Sınıflandırma** bildirimi görüntülenir.

---

## Kullanılan Teknolojiler

`package.json` bağımlılıkları:

- **Arayüz & Derleme:** React `^18.3.1`, React DOM `^18.3.1`, TypeScript `^5.6.3`, Vite `^6.0.0` (`@vitejs/plugin-react`)
- **Stil:** Tailwind CSS `^4.0.0` (`@tailwindcss/vite`)
- **Harita:** Leaflet `^1.9.4`, React Leaflet `^4.2.1`
- **Grafikler:** Recharts `^2.15.0`
- **İkonlar:** Lucide React `^0.469.0`

---

## Yerel Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Üretim derlemesi alın (TypeScript kontrolü + Vite build)
npm run build
```
