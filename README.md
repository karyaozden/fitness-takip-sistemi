# FitTrack Fitness Takip Sistemi

FitTrack; profil, antrenman, beslenme ve ilerleme kayıtlarını `localStorage` içinde JSON olarak saklayan React tabanlı bir fitness takip uygulamasıdır.

## Route Yapısı

- `/`
- `/profil`
- `/antrenman`
- `/beslenme`
- `/ilerleme`

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Netlify

- Build command: `npm run build`
- Publish folder: `dist`

## Özellikler

- Tek kayıtlı profil formu ve profil özeti
- Kayıt olma, giriş yapma ve çıkış yapma ekranı
- `/admin` yönetim paneli ve admin girişi
- Serbest egzersiz adı, set, tekrar, süre ve tarih alanlarıyla antrenman kaydı
- Öğün, kalori ve makro değerleriyle beslenme kaydı
- Bugünün toplam kalori, protein, karbonhidrat ve yağ hesabı
- Haftalık kilo değişimi formu, listeleme ve Recharts grafiği
- Dashboard üzerinde profil, son antrenman, günlük beslenme ve son ilerleme özeti
- `src/storage/fitnessStorage.js` içinde profil, antrenman, beslenme ve ilerleme için ayrı okuma/yazma fonksiyonları
