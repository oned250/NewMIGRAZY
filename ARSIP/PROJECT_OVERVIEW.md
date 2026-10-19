# PROJECT OVERVIEW: RYOKOURENT

## 1. Identitas & Tujuan Proyek

* **Nama Brand:** Ryokourent
* **Kategori Bisnis:** Rental Sepeda Motor & Adventure Fleet di Malang Raya & Kota Wisata Batu.
* **Platform Teknis:** WordPress Native Self-Hosted (Plugin Inti `ryokourent-core` v2.1.0 + Child Theme `generatepress-child` v2.0.0).
* **Pendekatan Utama:** *Zero-friction WhatsApp booking*, performa *mobile-first*, pelacakan posisi unit fisik *real-time* (`CPT Lacak Unit`), transparansi tarif bertingkat (Harian & ShortRent), serta kepatuhan penuh terhadap **UU Pelindungan Data Pribadi (UU PDP No. 27/2022)**.

---

## 2. Lokasi Operasional & Kebijakan Pool Parkir (`D-26`)

* **Wilayah Layanan:** Malang Raya (Kota & Kabupaten Malang) dan Kota Wisata Batu.
* **Dua Titik Pool Parkir Resmi:**
  * **Pool 1 (Malang):** Jl. MT Haryono Gg. 21 No. 23, Dinoyo, Lowokwaru, Malang.
  * **Pool 2 (Kota Batu):** Jl. Belakang Pompa Bensin, Jl. Diponegoro, Batu.
* **Prinsip Pool Sebagai Tempat Parkir (`D-26`):**
  * Pool Malang dan Pool Batu berfungsi murni sebagai **tempat parkir fisik**, bukan pembagi kaku kuota armada (armada tidak dipisah menjadi kuota armada Malang vs Batu).
  * Posisi setiap unit motor dipantau secara akurat melalui **CPT Lacak Unit (`ryokou_lacak`)**:
    1. **Saat Parkir:** Terlihat berada di `Pool Malang` atau `Pool Batu`.
    2. **Saat Service:** Terlihat berada di bengkel mana (nama bengkel, kontak mekanik, estimasi selesai).
    3. **Saat Posisi Sewa:** Terlihat sedang disewa oleh siapa (nama penyewa, nomor booking, jadwal kembali).

---

## 3. Struktur Tarif & Aturan Denda Keterlambatan (`D-18` & `D-27`)

1. **Dua Kategori Tarif Utama + Paket Promo (`D-18`):**
   * **Kategori Harian:** `1 Hari (24 Jam)` [Ditampilkan Utama di Katalog], `1 Minggu (7 Hari)`, `2 Minggu (14 Hari)`.
   * **Kategori Jam (ShortRent):** `12 Jam`, `9 Jam`, `6 Jam`, `3 Jam`.
   * **Kategori Paket:** Paket promosi dinamis dari CPT `ryokou_paket`.
2. **Aturan Denda Keterlambatan ShortRent (`D-27`):**
   * **Step-Up 60 Menit (Durasi 3, 6, 9 Jam):** Keterlambatan **60 menit** otomatis masuk ke **kategori jam di atasnya**:
     * Sewa **3 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **6 Jam** (denda = selisih tarif 6 jam dikurangi 3 jam).
     * Sewa **6 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **9 Jam**.
     * Sewa **9 Jam** terlambat $\ge 60$ menit $\longrightarrow$ masuk kategori **12 Jam**.
   * **ShortRent 12 Jam = Denda Harian:** Untuk paket **12 Jam**, denda keterlambatan yang dikenakan **sama dengan denda harian** (`_ryokou_denda_harian`, default Rp20.000/jam).
3. **Aturan Denda Kategori Harian (`D-16`):**
   * Toleransi pengembalian 90 menit. Lewat dari 90 menit dikenakan denda harian per jam (`_ryokou_denda_harian`).

---

## 4. Ringkasan Tabel Keputusan Kunci (`D-01` .. `D-27`)

| Kode | Keputusan | Dampak |
| :--- | :--- | :--- |
| **D-01** | Pakai WordPress (`ryokourent-core` + `generatepress-child`). | Hosting disesuaikan dengan kebutuhan WordPress standar. |
| **D-02** | Operator punya akses penuh kecuali kelola akun staf dan hapus model/unit fisik. | Matriks RBAC: ubah harga, paket, bulk pricing, & lacak unit ✅; kelola akun ❌; hapus model/unit ❌. |
| **D-04** | State Machine 4 Status: `Booking` → `Approve Booking` → `Disewa` → `Selesai`. | Reject/Cancel hapus 2 langkah (`D-20`). Cancel ditolak jika sudah `Disewa`. |
| **D-05** | Indikator stok biner tegas (`Tersedia` / `Habis`), tombol booking tetap aktif saat `Habis`. | Memberi kepastian jelas termasuk untuk kategori motor yang hanya memiliki 1 unit fisik. |
| **D-14** | Pesanan `Booking` menggantung > 48 jam dihapus otomatis. | WP-Cron (`twicedaily`) + *Lazy Purge* saat admin membuka tabel pesanan. |
| **D-17** | Jeda antar-sewa (*Turnaround Buffer*) 90 menit di kedua sisi jadwal. | Waktu aman bagi staf untuk mencuci dan mengecek fisik unit sebelum penyewa berikutnya. |
| **D-21** | Kepatuhan UU PDP: tanpa NIK 16 digit, foto KTP, alamat KTP, kontak darurat, medsos, atau IP di DB. | Filter regex anti-16 digit NIK aktif di client dan server. |
| **D-26** | Pool hanya tempat parkir (tanpa partisi kuota armada) + penambahan CPT `ryokou_lacak` (Lacak Unit). | Stok dihitung global; staf melacak posisi unit di Pool mana, Bengkel mana, atau Disewa siapa lewat menu **Lacak Unit**. |
| **D-27** | Denda ShortRent: telat 60 menit masuk kategori jam di atasnya (3j $\to$ 6j $\to$ 9j $\to$ 12j); denda di 12 jam = denda harian. | Otomatis dihitung di kolom alert admin, form booking, dan template pesan WhatsApp. |
