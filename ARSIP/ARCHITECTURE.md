# ARSITEKTUR SISTEM RYOKOURENT (VERSI 2 — REVISI D-26 & D-27)

**Status:** Aktif  
**Basis:** Keputusan `D-01..D-27`, Review Migrasi, Temuan Audit F-01..F-21

---

## 1. Topologi Komponen

Sistem terdiri dari 2 lapisan utama:

```
[ Browser Pengunjung ]
       │
       ▼ (HTTPS AJAX / HTML)
[ WordPress Core + GeneratePress Child ]
       │
       ▼ (Hooks / Actions)
[ Plugin ryokourent-core ]
  ├── 1. Availability Engine (Global Per-Motor, Buffer 90m, Atomic Lock, Binary Status)
  ├── 2. Booking State Machine (Booking -> Approved -> Disewa -> Selesai)
  ├── 3. Unit Tracker CPT (ryokou_lacak: Parkir Pool Mana / Servis Bengkel Mana / Disewa Siapa)
  ├── 4. ShortRent & Daily Penalty Engine (Step-Up 60m: 3j->6j->9j->12j, 12j = Denda Harian)
  ├── 5. Security & Privacy Layer (No PII DB, Rate Limit, Anti-Bot, Nonce Refresh)
  ├── 6. Background Jobs (WP-Cron 48h Auto Purge + Admin Lazy Purge)
  └── 7. WhatsApp Generator (Payload terformat aman UTF-8)
```

---

## 2. State Machine Transisi Status Booking & Sinkronisasi CPT `ryokou_lacak`

Transisi status diatur secara ketat (*Server-Side State Machine*) dan otomatis memperbarui posisi unit di CPT `ryokou_lacak`:

```
[ Form Publik ]
       │
       ▼
[ Status: Booking ] ──(48 Jam Tanpa Approve / Reject)──> [ HAPUS OTOMATIS (2 Langkah) ]
       │
       │ (Admin Klik 'Approve' + Pilih Unit Bebas dari Armada Global + Lock Atomik)
       ▼
[ Status: Approve Booking ] ──(Reject / Cancel)──────────> [ HAPUS (2 Langkah) ]
       │
       │ (Admin Klik 'Serah Terima' saat Pelanggan Ambil Motor)
       │  └──> Otomatis Update CPT `ryokou_lacak`: Posisi = DISEWA (Nama Penyewa & No Booking)
       ▼
[ Status: Disewa ] ──(Overtime Alert: Harian vs ShortRent Step-Up 60 Menit)
       │    │
       │    ├── [ Aksi: Tukar Unit ] ──> Update `ryokou_lacak` unit lama (Parkir/Servis) & unit baru (Disewa)
       │    └── [ Aksi: Ubah Jadwal / Perpanjang ]
       │
       │ (Admin Klik 'Selesai' saat Motor Kembali & Pilih Pool Parkir)
       │  └──> Otomatis Update CPT `ryokou_lacak`: Posisi = PARKIR (Pool Malang / Pool Batu)
       ▼
[ Status: Selesai ] (Permanen di Database, Nama Tersimpan untuk Pelanggan Rutin)
```

---

## 3. Mesin Ketersediaan Global & CPT Lacak Unit (D-26)

### 3.1 Pool Hanya Sebagai Tempat Parkir
- Armada **tidak dibagi kaku** menjadi kuota armada Pool Malang dan armada Pool Batu.
- Fungsi `ryokourent_check_availability()` dan `ryokourent_get_available_units()` mengecek seluruh unit fisik aktif dari jenis motor yang dipilih.
- Saat staf melakukan **Approve**, daftar unit bebas menampilkan informasi posisi parkir unit saat ini (contoh: `B122 — Parkir: Pool Malang`, `B222 — Parkir: Pool Batu`) untuk memudahkan koordinasi lapangan.

### 3.2 CPT `ryokou_lacak` (Lacak Unit)
- Menyediakan satu layar terpusat bagi pemilik dan operator untuk menjawab 3 pertanyaan operasional utama setiap unit fisik:
  1. **Berada di Pool mana?** (`Pool Malang` atau `Pool Batu` saat status `parkir`).
  2. **Kalau Service, di Bengkel mana?** (Nama bengkel, kontak mekanik, detail servis, estimasi selesai saat status `servis`).
  3. **Kalau Posisi Sewa, Disewa siapa?** (Nama penyewa, nomor booking, alamat antar, tenggat pengembalian saat status `disewa`).

---

## 4. Mesin Perhitungan Denda Keterlambatan (D-16 & D-27)

1. **Kategori Sewa Harian (`harian`):**
   - Toleransi pengembalian 90 menit.
   - Keterlambatan di atas toleransi dikenakan tarif denda harian per jam (`_ryokou_denda_harian`, default Rp 20.000/jam).
2. **Kategori Sewa ShortRent (`jam` — 3, 6, 9, 12 Jam):**
   - **Keterlambatan $\ge 60$ menit pada paket 3, 6, atau 9 jam** otomatis menaikkan tagihan ke **kategori jam di atasnya**:
     - Sewa **3 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **6 Jam** (denda = $\text{Tarif}_{6\text{jam}} - \text{Tarif}_{3\text{jam}}$).
     - Sewa **6 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **9 Jam** (denda = $\text{Tarif}_{9\text{jam}} - \text{Tarif}_{6\text{jam}}$).
     - Sewa **9 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **12 Jam** (denda = $\text{Tarif}_{12\text{jam}} - \text{Tarif}_{9\text{jam}}$).
   - **Sewa 12 Jam (atau setelah naik ke kategori 12 Jam):**
     - Denda keterlambatan yang dikenakan **sama dengan denda harian** (`_ryokou_denda_harian`, default Rp 20.000/jam).
