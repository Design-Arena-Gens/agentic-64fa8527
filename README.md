# Hydrate+ – Pengingat Minum Air Putih

Aplikasi web progresif (Next.js) yang membantu pengguna menjaga hidrasi harian. Hydrate+ menyediakan pelacakan konsumsi air, pengingat otomatis yang dapat dijadwalkan, serta pengaturan target yang fleksibel. Antarmuka dirancang mobile-first sehingga nyaman digunakan sebagai aplikasi web seluler.

## ✨ Fitur Utama

- Pelacakan total konsumsi air harian (dalam ml & liter)
- Tombol cepat untuk menambah catatan minum beserta input manual
- Pengaturan target harian, interval pengingat, dan jam aktif pengingat
- Notifikasi desktop opsional dengan dukungan jadwal bangun/tidur
- Riwayat minum harian beserta waktu konsumsi
- Persistensi data lokal menggunakan `localStorage`

## 🚀 Memulai

### Prasyarat

- Node.js 18+
- npm

### Instalasi

```bash
npm install
npm run dev
```

Kemudian buka `http://localhost:3000`.

### Build Production

```bash
npm run build
npm start
```

## 📁 Struktur Proyek

```
├── app/                # App Router Next.js (UI & logic)
├── public/             # Aset statis (ikon, manifest PWA)
├── package.json        # Dependensi & skrip
└── tsconfig.json       # Konfigurasi TypeScript
```

## 🛠️ Skrip NPM

- `npm run dev` – Menjalankan server pengembangan
- `npm run build` – Membuat bundel produksi
- `npm start` – Menjalankan server produksi
- `npm run lint` – Menjalankan ESLint

## 🔒 Perizinan Notifikasi

Fitur notifikasi membutuhkan izin dari browser. Saat opsi diaktifkan, aplikasi akan meminta izin pengguna dan mengirimkan pengingat sesuai interval pada jam yang diatur.
