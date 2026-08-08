# PRD AI Generator

Generator PRD (Product Requirements Document) berbasis AI — frontend SPA (Vite + React + shadcn/ui) yang memanggil workflow N8N untuk analisis ide dan pembuatan PRD bertahap.

## Fitur

- **Fase 1 — Analisis**: mengirim ide ke N8N (`POST /prd-analyze`) untuk eksplorasi inti ide, target user, value proposition, risiko, peluang, dan analisis biaya.
- **Fase 2 — Generate** (setelah approval): memanggil `POST /prd-generate`, memecah development menjadi tahapan, dan menulis PRD per tahapan (6 bagian, hormati preferensi tech stack/kode & design system).
- **Preferensi**: toggle "sertakan tech stack" dan "sertakan kode/coding".
- **Design system**: shadcn/ui, Material UI, Chakra UI, AWS Cloudscape, Porsche.

## Menjalankan Lokal

```bash
npm install
npm run dev
```

## Build Produksi

```bash
npm run build   # output ke dist/
npm run preview # pratinjau build lokal
```

Build disajikan di bawah sub-path **`/prd-generator/`** (lihat `base` di `vite.config.ts`).

## Deployment ke Vercel

### Prasyarat
- Repo GitHub: `https://github.com/Centrova-ID/prd-ai-generator`
- Akun Vercel + CLI (`npm i -g vercel` lalu `vercel login`)

### Opsi A — Path-based routing (disarankan jika `dev.centrova.id` dipakai project lain)
`dev.centrova.id` diasumsikan sudah menjadi project Vercel lain. App ini di-import ke Vercel sebagai project terpisah, lalu project induk menambahkan rewrite:

```jsonc
// di vercel.json project induk (pemilik dev.centrova.id)
{
  "rewrites": [
    { "source": "/prd-generator/(.*)", "destination": "https://<proyek-ini>.vercel.app/$1" }
  ]
}
```

Karena `base` di app ini `/prd-generator/`, asset akan diambil dari `/prd-generator/assets/*` → pastikan rewrite di atas mencakup seluruh path (termasuk asset), atau gunakan fitur microfrontends (`@vercel/microfrontends`) dengan `assetPrefix` agar asset otomatis ter-prefix.

### Opsi B — App ini pemilik domain `dev.centrova.id`
1. Import repo ke Vercel → Vercel otomatis deteksi Vite (`npm run build`, output `dist`).
2. Di tab **Domains** project, tambahkan `dev.centrova.id` dan atur DNS (A/ALIAS/CNAME sesuai instruksi Vercel).
3. Karena `base = /prd-generator/`, halaman utama diakses di `https://dev.centrova.id/prd-generator`.

> Catatan: `vercel.json` sudah menyediakan rewrite SPA agar path dalam `/prd-generator/*` (deep link) jatuh ke `index.html`.

### Deploy dari CLI
```bash
vercel        # preview deployment
vercel --prod # production deployment
```

## Variabel Lingkungan / Konfigurasi

Tidak ada env build-time. URL webhook N8N dikonfigurasi **di dalam aplikasi** melalui menu **Pengaturan** (disimpan di `localStorage`), format `https://<n8n-domain>/webhook/`. Aplikasi otomatis menambahkan suffix `prd-analyze` dan `prd-generate`.

## Workflow N8N

File `workflow-n8n.json` berisi definisi workflow webhook 2-fase yang bisa di-import ke N8N.

## Lisensi

Private — © Centrova ID.
