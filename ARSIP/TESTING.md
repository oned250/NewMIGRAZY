# MATRIKS PENGUJIAN & QA RYOKOURENT (VERSI 2 — REVISI D-26 & D-27)

**Status:** Aktif  
**Basis:** QA-01 .. QA-25 + Skenario Audit Edge Cases F-01 .. F-21

---

## 1. Matriks Pengujian Utama (QA-01 .. QA-25)

| ID | Kategori | Skenario Pengujian | Kriteria Lolos (Pass) |
| :--- | :--- | :--- | :--- |
| **QA-01** | Booking Form | Submit form dengan data valid (nama, jenis ID, jadwal, lokasi). | Record tersimpan berstatus `Booking`, nomor booking `RYK-YYYYMMDD-XXX` terbit, redirect WA membawa pesan terformat. |
| **QA-02** | Form PII | Pengisian teks dengan pola 16 digit angka di kolom alamat. | Form server-side menolak dengan pesan validasi "Format tidak valid, dilarang mencantumkan NIK". |
| **QA-03** | Approval Unit Global | Admin approve booking pada jadwal tertentu. | Dropdown menampilkan seluruh unit fisik bebas dari jenis motor tersebut beserta label lokasi parkirnya (`Pool Malang` / `Pool Batu`), tanpa membatasi kuota per pool (D-26). |
| **QA-04** | Atomic Lock | Dua staf membuka & approve unit yang sama pada milidetik yang sama. | Salah satu staf berhasil mengunci, staf kedua mendapat notifikasi "Unit baru saja dialokasikan, silakan pilih unit lain". |
| **QA-05** | State Transition | Percobaan mengubah status manual via URL/POST parameter palsu. | Transisi ditolak (HTTP 403 / Invalid Nonce). |
| **QA-06** | Serah Terima & Lacak | Admin menekan aksi "Serah Terima". | Status berubah menjadi `Disewa`, `_disewa_at` tercatat, dan CPT `ryokou_lacak` otomatis berubah ke posisi `Disewa` atas nama penyewa terkait. |
| **QA-07** | Selesai & Parkir Pool | Admin menekan aksi "Selesai" dan memilih pool parkir kembali. | Status berubah menjadi `Selesai`, CPT `ryokou_lacak` otomatis berubah ke posisi `Parkir` di Pool yang dipilih (`Pool Malang` / `Pool Batu`). |
| **QA-08** | Stok Biner | Ketersediaan dicek pada tanggal terpilih. | Indikator publik menampilkan status biner tegas ("Tersedia" atau "Habis"). Saat "Habis", tombol booking tetap aktif. |
| **QA-09** | Luar Jam Layanan | Booking pada jam 23.30 WIB. | Submit form diizinkan dengan peringatan wajib kesepakatan khusus admin tercantum di pesan WA. |
| **QA-10** | Pool Sebagai Parkir | Unit tipe Vario hanya ada 1 unit dan sedang parkir di Pool Batu; pelanggan memilih ambil di Malang. | Stok tetap terbaca "Tersedia" karena armada tidak dibagi kaku per pool (D-26), dan admin melihat posisi parkir unit di `Pool Batu`. |
| **QA-11** | Jeda 90 Menit | Sewa A selesai 10.00. Sewa B mulai 11.00 pada unit yang sama. | Unit dinilai bentrok karena jeda antar-sewa 90 menit ($10.00 + 1.5\text{ jam} = 11.30$). Unit tidak muncul di dropdown. |
| **QA-12** | Overtime Harian | Unit kategori Harian melewati toleransi 90 menit. | Kolom admin menampilkan durasi keterlambatan dan estimasi denda harian per jam (`_ryokou_denda_harian`). |
| **QA-13** | Unit Overtime Ketersediaan | Unit terlambat kembali. Booking berikutnya mulai setelah jadwal semula. | Ketersediaan unit tetap terkunci ($akhir\_efektif = \max(tenggat, sekarang)$) sampai tombol Selesai ditekan. |
| **QA-14** | Tukar Unit & Lacak | Staf melakukan tukar unit pada sewa berjalan. | Unit baru tervalidasi bebas bentrok, log tercatat, dan CPT `ryokou_lacak` otomatis memperbarui posisi unit lama serta unit pengganti. |
| **QA-15** | Reject & Cancel | Admin reject booking atau pelanggan membatalkan sebelum serah terima. | Dialog konfirmasi 2 langkah muncul. Data booking dihapus permanen. |
| **QA-16** | Cancel Ditolak | Percobaan membatalkan booking yang berstatus `Disewa` atau `Selesai`. | Tombol Cancel tidak tersedia, request cancel ditolak di server. |
| **QA-17** | 48 Jam Auto Purge | Booking `Booking` dibiarkan $>48$ jam tanpa approve. | Cron atau lazy purge admin menghapus booking tersebut secara otomatis. |
| **QA-18** | RBAC Operator | Login sebagai user role `ryokou_operator`. | Operator dapat mengelola booking, lacak unit, ubah harga, ganti nomor WA, namun tidak ada opsi hapus unit fisik atau tambah user baru. |
| **QA-19** | Audit Nomor WA | Operator mengganti nomor WhatsApp admin di pengaturan. | Tersimpan nama operator dan waktu WIB penggantian nomor WA. |
| **QA-20** | Anti-Bot & Rate Limit | Bot melakukan submit berulang dalam 1 menit atau mengisi form < 4 detik. | Request diblokir dengan pesan rate limit / form token invalid. |
| **QA-21** | Performance & Cache | Pengecekan stok di halaman yang tercache. | Nonce diperbarui via AJAX refresh, indikator stok menampilkan status real-time. |
| **QA-22** | CPT Lacak Unit (`ryokou_lacak`) | Staf membuka menu **Lacak Unit** dan memfilter berdasarkan status posisi. | Menampilkan dengan akurat unit mana yang sedang parkir di Pool Malang/Batu, unit mana yang sedang servis di bengkel mana, dan unit mana yang sedang disewa oleh siapa (D-26). |
| **QA-23** | Lacak Unit Servis Bengkel | Unit diubah statusnya menjadi `Servis` dengan input nama bengkel "AHASS Suhat". | CPT `ryokou_lacak` menampilkan status `Servis di Bengkel: AHASS Suhat` beserta estimasi selesai, dan unit otomatis dikecualikan dari stok bebas. |
| **QA-24** | Denda ShortRent Step-Up 60 Menit | Penyewa paket ShortRent **3 Jam** terlambat mengembalikan motor selama **60 menit** (total pemakaian 4 jam). | Sistem otomatis menaikkan tagihan ke kategori di atasnya yaitu **6 Jam**; denda dihitung sebesar selisih tarif `Harga 6 Jam - Harga 3 Jam` (begitu pula 6 Jam $\to$ 9 Jam, 9 Jam $\to$ 12 Jam) (D-27). |
| **QA-25** | Denda ShortRent 12 Jam = Harian | Penyewa paket ShortRent **12 Jam** terlambat mengembalikan motor $\ge 60$ menit. | Denda keterlambatan yang dikenakan sama dengan tarif **denda harian** (`_ryokou_denda_harian`, default Rp 20.000/jam) (D-27). |
