# BLUEPRINT TEKNIS WEBSITE RYOKOURENT
**Rental Sepeda Motor Malang Raya & Kota Wisata Batu (Kondisi Terupdate `D-01..D-27`)**

---

## 1. Arsitektur Halaman Publik (Frontend)

1. **Halaman Utama & Katalog Armada (`[ryokou_katalog]`):**
   - Menampilkan kartu tiap jenis motor (`motor`) dengan **Harga 1 Hari (24 Jam)** sebagai harga utama.
   - Dilengkapi **Dropdown Bertingkat (Cascading Dropdown)** untuk melihat rincian tarif:
     - **Kategori Harian:** `1 Hari (24 Jam)`, `1 Minggu (7 Hari)`, `2 Minggu (14 Hari)`.
     - **Kategori Jam (ShortRent):** `12 Jam`, `9 Jam`, `6 Jam`, `3 Jam`.
     - **Kategori Paket:** Paket promosi aktif dari `ryokou_paket`.
   - Tombol **"Pesan Sekarang"** otomatis mengalirkan pilihan motor, kategori, dan durasi ke Formulir Pemesanan.

2. **Formulir Pemesanan & Cek Ketersediaan Live (`[ryokou_booking_form]`):**
   - Mengecek ketersediaan unit secara **global** dari seluruh armada aktif per tipe motor (`D-26` — Pool hanya tempat parkir, bukan pembagi kuota armada).
   - Menampilkan indikator biner tegas: **`Tersedia` (Hijau)** atau **`Habis` (Merah)** tanpa membocorkan jumlah unit riil (`D-05`).
   - Saat pengguna memilih kategori **ShortRent / Paket Jam**, otomatis menampilkan kotak informasi **`#ryokou_denda_shortrent_note`** mengenai aturan keterlambatan 60 menit naik ke kategori jam di atasnya dan denda 12 jam = denda harian (`D-27`).
   - Proteksi anti-bot: Honeypot, Signed Time Token ($\ge 4$ detik), Dual Rate Limit, dan Filter Anti-NIK 16 Digit (`D-10`, `D-21`).

3. **Halaman Informasi 2 Pool Parkir & FAQ (`template-faq-pool.php`):**
   - Menjelaskan lokasi **Pool 1 Malang (Dinoyo)** dan **Pool 2 Kota Wisata Batu (Diponegoro)**, jam layanan reguler 07.00–23.00 WIB, perlengkapan standar (2 helm SNI, jas hujan), serta syarat penyewaan.

---

## 2. Arsitektur Panel Operasional Admin (Backend WP-Admin)

1. **Menu Penyewaan (`CPT penyewaan`):**
   - Mengelola siklus 4 status: `Booking` $\to$ `Approve Booking` $\to$ `Disewa` $\to$ `Selesai`.
   - Saat klik **Approve**, modal menampilkan seluruh unit fisik bebas dari armada global beserta lokasi parkirnya saat ini (`B122 — Parkir: Pool Malang`, `V123 — Parkir: Pool Batu`).
   - Kolom **Status Overtime & Denda (`D-27`)** menghitung secara otomatis:
     - Sewa ShortRent **3/6/9 Jam** yang terlambat $\ge 60$ menit otomatis naik ke kategori jam di atasnya (`3 Jam` $\to$ `6 Jam` $\to$ `9 Jam` $\to$ `12 Jam`).
     - Sewa ShortRent **12 Jam** yang terlambat dikenakan tarif **Denda Harian** (`_ryokou_denda_harian`).

2. **Menu Lacak Unit (`CPT ryokou_lacak` — Baru sesuai `D-26`):**
   - Menyediakan visibilitas penuh posisi seluruh unit fisik armada di lapangan:
     - **Berada di Pool Mana:** `Pool Malang` atau `Pool Batu` (saat status `Parkir di Pool`).
     - **Kalau Service di Bengkel Mana:** Nama bengkel, nomor kontak mekanik/bengkel, dan estimasi selesai (saat status `Servis di Bengkel`).
     - **Kalau Posisi Sewa Disewa Siapa:** Nama penyewa aktif, nomor booking (`RYK-...`), dan jadwal kembali (saat status `Sedang Disewa`).

3. **Menu Katalog Motor, Unit Fisik (`ryokou_unit`), Paket (`ryokou_paket`), & Pengaturan:**
   - Pengaturan tarif harian, ShortRent (3, 6, 9, 12 jam), denda harian, *Bulk Price Adjustment*, serta pengaturan nomor WhatsApp Admin dengan jejak audit (`D-23`).
