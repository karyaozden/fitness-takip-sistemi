# FitTrack Fitness Takip Sistemi

FitTrack, günlük antrenman, kalori, su tüketimi, hedef ve haftalık ilerleme takibi yapan basit bir web uygulamasıdır. Proje statik dosyalarla hazırlandığı için ek paket kurulumu olmadan tarayıcıda veya Netlify üzerinde çalışır.

## Özellikler

- Günlük adım, kalori, antrenman süresi ve su tüketimi özeti
- Antrenman türü, süre ve kalori bilgisiyle kayıt ekleme
- Haftalık ilerleme grafiği
- Hedef kontrol listesi
- Su ve öğün takibi
- Tarayıcı `localStorage` desteğiyle demo verilerinin korunması

## Kurulum

Bu repoyu bilgisayarınıza indirin:

```bash
git clone <repo-linki>
cd alieren_proje
```

Ek bağımlılık gerekmez.

## Çalıştırma

Dosyayı doğrudan tarayıcıda açabilirsiniz:

```bash
start index.html
```

İsterseniz basit bir yerel sunucu ile de çalıştırabilirsiniz:

```bash
node preview-server.mjs 5500
```

Sonra tarayıcıdan şu adresi açın:

```text
http://localhost:5500
```

## Netlify Deploy

1. Netlify hesabınıza girin.
2. `Add new site` > `Import an existing project` seçin.
3. GitHub/GitLab üzerinden bu repoyu seçin.
4. Build command alanını boş bırakın.
5. Publish directory alanına `.` yazın.
6. Deploy tamamlanınca oluşan canlı site linkini Linear issue içine ekleyin.

## Proje Yapısı

```text
.
├── assets/
│   └── training.svg
├── index.html
├── netlify.toml
├── preview-server.mjs
├── script.js
├── styles.css
└── README.md
```
