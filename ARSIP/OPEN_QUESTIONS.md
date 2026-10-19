# OPEN_QUESTIONS.md — DAFTAR PERTANYAAN & KONFLIK BISNIS RYOKOURENT

> **Status Saat Ini:** **0 Konflik Terbuka (Semua Selesai & Ditutup)**  
> Seluruh pertanyaan terbuka dari awal proyek (Konflik 1 s/d 16) beserta 2 revisi operasional terakhir (`D-26` & `D-27`) telah dijawab oleh pemilik dan dikunci ke dalam `DECISIONS.md`.

---

## Riwayat Penyelesaian Pertanyaan & Konflik Bisnis

| No / Butir | Topik Pertanyaan Awal | Status | Keputusan Final & Referensi ADR |
| :--- | :--- | :--- | :--- |
| **Konflik 1** | Hak akses Operator terhadap harga, paket, akun staf, dan penghapusan unit/model. | **RESOLVED** | `D-02`, `D-09`, `D-22`: Operator boleh edit harga, paket, bulk pricing, dan lacak unit; dilarang kelola akun user dan dilarang hapus model/unit fisik. |
| **Konflik 2** | Jam operasional 07.00–23.00 WIB vs kebutuhan ambil/kembali di luar jam (misal Sunrise Bromo). | **RESOLVED** | `D-06`, `D-10`: Form tidak memblokir jam di luar 07.00–23.00 WIB, melainkan menampilkan catatan wajib konfirmasi & kesepakatan khusus dengan admin. |
| **Konflik 3** | Aturan hitung durasi sewa, jeda antar-sewa, toleransi keterlambatan, dan skema tarif. | **RESOLVED** | `D-16`, `D-17`, `D-18`, `D-27`: Jeda antar-sewa 90 menit. Tarif dibagi 2 kategori utama (Harian: 1 hari, 1 minggu, 2 minggu; ShortRent Jam: 12, 9, 6, 3 jam) + Paket. ShortRent telat $\ge 60$ menit naik ke kategori jam di atasnya (3j $\to$ 6j $\to$ 9j $\to$ 12j); denda di 12 jam sama dengan denda harian. |
| **Konflik 4** | Aturan penggunaan ke Bromo dan batas wilayah operasional. | **RESOLVED** | `D-02`, `D-06`: Wilayah operasional Malang Raya & Kota Wisata Batu. Konsultan rute dihapus dari MVP; ketentuan Bromo dicantumkan lewat informasi katalog & FAQ. |
| **Konflik 5** | Transparansi harga tampil publik atau disembunyikan. | **RESOLVED** | `D-05`, `D-18`: Harga 1 Hari tampil sebagai harga utama publik, dilengkapi dropdown cascading untuk melihat harga 1 minggu, 2 minggu, serta ShortRent (12, 9, 6, 3 jam). Kuantitas angka stok tidak ditampilkan ke publik (hanya status biner `Tersedia` / `Habis`). |
| **Konflik 6** | DP, jaminan identitas, denda keterlambatan, dan aturan pembatalan. | **RESOLVED** | `D-04`, `D-20`, `D-27`: Tanpa pembayaran online di web (konfirmasi via WA). Pembatalan sebelum disewa = hapus data 2 langkah. Pembatalan ditolak jika status sudah `Disewa`. |
| **Konflik 7** | Detail fasilitas perlengkapan (helm, jas hujan, phone holder). | **RESOLVED** | `D-11`: 2 helm SNI dan jas hujan (tanpa mengikat klaim angka jas hujan; holder HP tersedia selama persediaan masih ada). |
| **Konflik 8** | Pemisahan katalog model motor vs unit fisik di garasi. | **RESOLVED** | `D-12`: CPT `motor` untuk katalog model, CPT `ryokou_unit` untuk unit fisik dengan `_ryokou_kode_unit` permanen (*readonly* setelah dibuat, misal `B122`) dan plat nomor yang bisa diperbarui. |
| **Konflik 9 & 10** | Rumus ketersediaan stok bebas dan apakah Pool Malang vs Pool Batu membagi kuota armada. | **RESOLVED** | `D-13`, `D-26`: **Pool hanya sebagai tempat parkir fisik**, sehingga armada tidak dibagi kaku menjadi kuota Pool Malang dan Pool Batu. Yang dibutuhkan adalah **CPT Lacak Unit (`ryokou_lacak`)** untuk memantau unit berada di pool mana, jika servis di bengkel mana, dan jika disewa di tangan siapa. |
| **Konflik 11 & 12** | Penamaan status pemesanan dan masa kedaluwarsa pesanan menggantung. | **RESOLVED** | `D-04`, `D-14`: 4 status resmi (`Booking`, `Approve Booking`, `Disewa`, `Selesai`). Status `Booking` yang tidak di-approve dalam 48 jam dihapus otomatis oleh WP-Cron & Lazy Purge. |
| **Konflik 13–16** | Penyimpanan dokumen identitas dan kepatuhan UU PDP No. 27/2022. | **RESOLVED** | `D-21`: Database dilarang menyimpan NIK 16 digit, foto KTP, alamat KTP, kontak darurat, medsos, dan IP. Hanya menyimpan nama, penanda pelanggan setia (`_ryokou_tanda_pelanggan`), dan pilihan jenis ID pendukung. |
