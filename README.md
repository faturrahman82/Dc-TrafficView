# DC-TrafficView

Dashboard monitoring server berbasis web untuk melihat kondisi sumber server melalui metrik aktual.

## Tujuan

Menampilkan penggunaan CPU, RAM, disk, serta traffic jaringan masuk dan keluar. Setiap pengukuran harus membawa identitas sumber dan waktu pengukuran. Kondisi `no data` dan data kedaluwarsa (`stale`) perlu ditampilkan dengan jelas; angka metrik tidak boleh dibuat-buat atau diperlakukan sebagai data aktual.

## Teknologi

- **Frontend (`fe/`)**: React + Vite
- **Backend (`be/`)**: Node.js + Express

## Struktur repository

```text
dc-trafficview/
├── fe/                 # Aplikasi React + Vite
├── be/                 # Aplikasi Node.js + Express
│   └── src/            # Tempat kode backend akan ditambahkan
├── .gitignore
└── README.md
```

## Menjalankan frontend

Pastikan Node.js terpasang. Vite saat ini mensyaratkan Node.js 20.19+ atau 22.12+.
Jalankan perintah berikut dari root repository (`dc-trafficview/`).

```powershell
cd fe
npm install
npm run dev
```

Vite akan menampilkan alamat lokal di terminal. Frontend saat ini masih memakai halaman starter bawaan Vite; fitur dashboard belum dibuat.

## Menyiapkan backend

```powershell
cd be
npm install
```

Express sudah terpasang sebagai dependency. Entry point server dan route belum dibuat, jadi backend belum memiliki perintah untuk dijalankan.

## Status awal

Repository ini berisi scaffold frontend dan backend. Collector metrik, API, database MySQL, autentikasi, pembaruan real-time, serta halaman monitoring akan dikerjakan berikutnya sesuai keputusan dan kontrak data tim.

## Kolaborasi dan keamanan

- Kerjakan perubahan melalui branch dan minta review anggota tim sebelum menggabungkannya ke branch utama.
- Jangan commit file `.env`, token, kata sandi, atau data sensitif.
- Gunakan metrik aktual dari sumber yang sudah disetujui; jangan gunakan angka dummy sebagai hasil monitoring.
